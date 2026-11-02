// LOCI moderation bot — Cloudflare Worker
// Cron quét bài mới -> Gemini phân loại -> ẩn tạm + báo Telegram -> admin bấm nút -> ghi Firestore.
// Không chứa secret trong code: tất cả đọc từ env (wrangler secret).

const LABELS = ['OK', 'SPAM', 'OFF_TOPIC', 'HARASSMENT', 'POLITICS_RELIGION', 'ADULT', 'VIOLENCE', 'OTHER'];
const DEFAULT_THRESHOLD = 0.75;

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(scanNewPosts(env));
  },
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-methods': 'GET,POST,OPTIONS',
          'access-control-allow-headers': 'content-type'
        }
      });
    }
    try {
      if (url.pathname === '/health') return json(health(env));
      if (url.pathname === '/cron') {
        if (!env.CRON_SECRET || url.searchParams.get('key') !== env.CRON_SECRET) {
          return json({ error: 'forbidden' }, 403);
        }
        ctx.waitUntil(scanNewPosts(env));
        return json({ ok: true });
      }
      if (url.pathname === '/setup') return await handleSetup(url, env);
      if (url.pathname === '/scan') return await handleScan(url, env);
      if (url.pathname === '/telegram') return await handleTelegram(request, env);
      return json({ error: 'not found' }, 404);
    } catch (e) {
      return json({ error: String((e && e.message) || e) }, 500);
    }
  }
};

// ---------------------------------------------------------------------------
// Firestore REST + service account
// ---------------------------------------------------------------------------

let _token = { value: null, exp: 0 };

function b64urlBytes(bytes) {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < arr.length; i += chunk) {
    bin += String.fromCharCode.apply(null, arr.subarray(i, i + chunk));
  }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlJson(obj) {
  return b64urlBytes(new TextEncoder().encode(JSON.stringify(obj)));
}

async function importPrivateKey(pem) {
  const body = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '');
  const der = Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    'pkcs8',
    der,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
}

async function getAccessToken(env) {
  if (_token.value && Date.now() < _token.exp - 60000) return _token.value;

  const sa = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);
  const now = Math.floor(Date.now() / 1000);
  const unsigned =
    b64urlJson({ alg: 'RS256', typ: 'JWT' }) +
    '.' +
    b64urlJson({
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/datastore',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600
    });

  const key = await importPrivateKey(sa.private_key);
  const sig = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(unsigned)
  );
  const jwt = unsigned + '.' + b64urlBytes(new Uint8Array(sig));

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error('oauth: ' + JSON.stringify(data).slice(0, 300));
  _token = { value: data.access_token, exp: Date.now() + (data.expires_in || 3600) * 1000 };
  return _token.value;
}

function fsBase(env) {
  return `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents`;
}

async function fs(env, method, path, body) {
  const token = await getAccessToken(env);
  const res = await fetch(fsBase(env) + path, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (_) {
    data = text;
  }
  if (!res.ok) {
    const err = new Error(`firestore ${res.status}: ${String(text).slice(0, 300)}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

const S = (v) => ({ stringValue: String(v) });
const N = (v) => ({ integerValue: String(Math.trunc(Number(v))) });
const D = (v) => ({ doubleValue: Number(v) });
const B = (v) => ({ booleanValue: !!v });
const T = (iso) => ({ timestampValue: iso });
const M = (fields) => ({ mapValue: { fields } });

function fromVal(v) {
  if (!v || typeof v !== 'object') return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('timestampValue' in v) return v.timestampValue;
  if ('nullValue' in v) return null;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(fromVal);
  if ('mapValue' in v) return fromFields(v.mapValue.fields || {});
  return null;
}

function fromFields(fields) {
  const out = {};
  for (const k in fields) out[k] = fromVal(fields[k]);
  return out;
}

function docToObj(doc) {
  return { id: String(doc.name).split('/').pop(), ...fromFields(doc.fields || {}) };
}

async function getDoc(env, path) {
  try {
    const doc = await fs(env, 'GET', '/' + path);
    return doc ? docToObj(doc) : null;
  } catch (e) {
    if (e.status === 404) return null;
    throw e;
  }
}

async function patchDoc(env, path, fields) {
  const mask = Object.keys(fields)
    .map((k) => 'updateMask.fieldPaths=' + encodeURIComponent(k))
    .join('&');
  return fs(env, 'PATCH', `/${path}?${mask}`, { fields });
}

async function addDoc(env, collectionPath, fields) {
  const id = 'log_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
  return fs(env, 'POST', `/${collectionPath}?documentId=${encodeURIComponent(id)}`, { fields });
}

async function queryPostsAfter(env, iso, limit) {
  const data = await fs(env, 'POST', ':runQuery', {
    structuredQuery: {
      from: [{ collectionId: 'posts' }],
      where: {
        fieldFilter: {
          field: { fieldPath: 'createdAt' },
          op: 'GREATER_THAN',
          value: { timestampValue: iso }
        }
      },
      orderBy: [{ field: { fieldPath: 'createdAt' }, direction: 'ASCENDING' }],
      limit
    }
  });
  return (data || []).filter((r) => r && r.document).map((r) => docToObj(r.document));
}

async function appendComment(env, postId, comment) {
  const document = `projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/posts/${postId}`;
  const value = M({
    authorId: S(String(comment.authorId)),
    authorName: S(String(comment.authorName)),
    authorPhoto: { nullValue: null },
    text: S(String(comment.text)),
    timestamp: S(String(comment.timestamp))
  });
  return fs(env, 'POST', ':commit', {
    writes: [
      {
        transform: {
          document,
          fieldTransforms: [
            {
              fieldPath: 'comments',
              appendMissingElements: { values: [value] }
            }
          ]
        }
      }
    ]
  });
}

// ---------------------------------------------------------------------------
// Scan + classify
// ---------------------------------------------------------------------------

async function handleSetup(url, env) {
  if (!env.CRON_SECRET || url.searchParams.get('key') !== env.CRON_SECRET) {
    return json({ error: 'forbidden' }, 403);
  }
  const webhookUrl = url.origin + '/telegram';
  const me = await tg(env, 'getMe', {});
  const wh = await tg(env, 'setWebhook', {
    url: webhookUrl,
    secret_token: env.TELEGRAM_WEBHOOK_SECRET,
    allowed_updates: ['message', 'callback_query']
  });
  const info = await tg(env, 'getWebhookInfo', {});
  return json({ bot: me && me.result ? me.result.username : me, webhookUrl, setWebhook: wh, webhookInfo: info });
}

async function handleScan(url, env) {
  const id = url.searchParams.get('postId');
  if (!id || !/^[A-Za-z0-9_-]{1,64}$/.test(id)) return json({ error: 'bad id' }, 400);

  const post = await getDoc(env, `posts/${id}`);
  if (!post) return json({ ok: true, skipped: 'missing' });
  if ((post.status || 'published') !== 'published') return json({ ok: true, skipped: 'status' });
  if (post.moderation && post.moderation.scannedAt) return json({ ok: true, skipped: 'scanned' });

  const created = post.createdAt ? Date.parse(post.createdAt) : 0;
  if (created && Date.now() - created > 10 * 60 * 1000) return json({ ok: true, skipped: 'old' });

  await processPost(env, id, post);
  return json({ ok: true });
}

async function scanNewPosts(env) {
  const state = await getDoc(env, 'moderation_state/scan');
  const last = state && state.lastScanAt ? Date.parse(state.lastScanAt) : Date.now() - 10 * 60 * 1000;
  const posts = await queryPostsAfter(env, new Date(last).toISOString(), 25);

  let max = last;
  for (const post of posts) {
    const t = post.createdAt ? Date.parse(post.createdAt) : 0;
    if (t > max) max = t;
    if ((post.status || 'published') !== 'published') continue;
    if (post.moderation && post.moderation.scannedAt) continue;
    try {
      await processPost(env, post.id, post);
    } catch (e) {
      console.error('process failed', post.id, String(e));
    }
  }

  if (posts.length) {
    await patchDoc(env, 'moderation_state/scan', { lastScanAt: T(new Date(max).toISOString()) });
  }
}

async function processPost(env, id, post) {
  const threshold = Number(env.AI_THRESHOLD || DEFAULT_THRESHOLD);
  const ai = await classify(env, post).catch((e) => {
    console.error('classify failed', id, String(e));
    return { label: 'OK', confidence: 0, reason: 'AI lỗi — bỏ qua (fail-open)' };
  });

  const nowIso = new Date().toISOString();
  const moderation = {
    label: S(ai.label),
    confidence: D(Number(ai.confidence) || 0),
    reason: S(String(ai.reason || '').slice(0, 500)),
    scannedAt: T(nowIso)
  };

  const fields = { moderation: M(moderation) };
  const flagged = ai.label !== 'OK' && Number(ai.confidence) >= threshold;
  if (flagged) fields.status = S('pending_review');

  await patchDoc(env, `posts/${id}`, fields);
  if (flagged) await sendAlert(env, id, post, ai, threshold).catch((e) => console.error('telegram', String(e)));
}

async function classify(env, post) {
  if (!env.GEMINI_API_KEY) return { label: 'OK', confidence: 0, reason: 'chưa cấu hình GEMINI_API_KEY' };

  const content = String(post.content || '').slice(0, 4000);
  const parts = [
    {
      text:
        `Bạn là kiểm duyệt viên cộng đồng học tập Lịch sử 12 "LOCI" (học sinh Việt Nam).\n` +
        `HỢP LỆ: chia sẻ tiến trình/không gian học, câu hỏi hay bài tập lịch sử, mẹo ghi nhớ, động viên học tập, ảnh góc học tập.\n` +
        `KHÔNG HỢP LỆ: spam/quảng cáo/bán hàng/lôi kéo nền tảng khác, chửi thêu hoặc công kích cá nhân, nội dung 18+, bạo lực, chính trị - tôn giáo gây chia rẽ, nội dung hoàn toàn lạc đề (game, bóng đá, mua bán...).\n` +
        `Lưu ý: bài ngắn như "hôm nay ôn xong bài 3" VẪN hợp lệ — đừng bắt buộc phải có chữ "lịch sử".\n` +
        `Trả về JSON đúng schema. reason ngắn gọn bằng tiếng Việt.\n\n` +
        `Tác giả: ${String(post.authorName || 'ẩn danh')}\nNội dung:\n${content || '(không có chữ)'}`
    }
  ];

  if (env.AI_IMAGES === '1') {
    const image = await fetchImagePart(post.imageUrl).catch(() => null);
    if (image) parts.push(image);
  }

  const body = {
    contents: [{ role: 'user', parts }],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          label: { type: 'STRING', enum: LABELS },
          confidence: { type: 'NUMBER' },
          reason: { type: 'STRING' }
        },
        required: ['label', 'confidence', 'reason']
      }
    }
  };

  const models = [
    ...new Set(
      [env.GEMINI_MODEL || 'gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-3.1-flash-lite'].filter(Boolean)
    )
  ];

  let lastErr = null;
  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body)
        }
      );
      const data = await res.json();
      if (!res.ok) {
        lastErr = new Error('gemini ' + model + ' ' + res.status + ': ' + JSON.stringify(data).slice(0, 200));
        if ([404, 429, 503].includes(res.status)) continue;
        throw lastErr;
      }

      const text = (((data.candidates || [])[0] || {}).content || {}).parts?.map((p) => p.text || '').join('') || '';
      const parsed = JSON.parse(text);
      if (!LABELS.includes(parsed.label)) parsed.label = 'OTHER';
      parsed.confidence = Math.max(0, Math.min(1, Number(parsed.confidence) || 0));
      parsed.model = model;
      return parsed;
    } catch (e) {
      lastErr = e;
      if (!(e instanceof SyntaxError)) throw e;
    }
  }
  throw lastErr || new Error('gemini unavailable');
}

async function fetchImagePart(url) {
  if (!url || typeof url !== 'string') return null;
  const res = await fetch(url);
  if (!res.ok) return null;
  const type = res.headers.get('content-type') || 'image/jpeg';
  if (!/^image\//i.test(type)) return null;
  const buf = await res.arrayBuffer();
  if (buf.byteLength > 1.5 * 1024 * 1024) return null;
  const bytes = new Uint8Array(buf);
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return { inlineData: { mimeType: type, data: btoa(bin) } };
}

// ---------------------------------------------------------------------------
// Telegram
// ---------------------------------------------------------------------------

function adminIds(env) {
  return String(env.TELEGRAM_ADMIN_CHAT_ID || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

async function tg(env, method, payload) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (e) {
    console.error('telegram failed', method, String(e));
    return { ok: false, error: String(e) };
  }
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function recommend(label, strikes) {
  if (label === 'SPAM' || label === 'ADULT' || label === 'VIOLENCE') return 'Nên khóa ngay nếu đúng.';
  if (strikes >= 2) return 'Đã có tiền sử — cân nhắc khóa 1 ngày.';
  if (label === 'HARASSMENT' || label === 'POLITICS_RELIGION') return 'Cân nhắc cảnh cáo.';
  return 'Cân nhắc cảnh cáo.';
}

async function sendAlert(env, id, post, ai, threshold) {
  const user = await getDoc(env, `users/${post.authorId}`).catch(() => null);
  const strikes = Number((user && user.strikes) || 0);
  const content = String(post.content || '').slice(0, 1200);
  const text =
    `<b>Bài viết cần xem xét</b>\n` +
    `Tác giả: <b>${esc(post.authorName || post.authorId)}</b> (vi phạm trước: ${strikes})\n` +
    `Nhãn AI: <b>${esc(ai.label)}</b> — tin cậy ${(Number(ai.confidence) * 100).toFixed(0)}% (ngưỡng ${(threshold * 100).toFixed(0)}%)\n` +
    `Lý do: ${esc(ai.reason || '—')}\n` +
    `Gợi ý: ${esc(recommend(ai.label, strikes))}\n\n` +
    `<blockquote>${esc(content || '(không có chữ)')}</blockquote>` +
    (post.imageUrl ? `\nẢnh: ${esc(post.imageUrl)}` : '') +
    `\n\nBài đã được ẩn tạm tới khi bạn quyết định.`;

  const secondRow = [{ text: '✅ Hiểu lầm — hiện lại + xin lỗi', callback_data: `clear:${id}` }];
  if (env.PORTAL_URL) secondRow.push({ text: '👁 Mở bảng tin', url: String(env.PORTAL_URL) + '#connect' });

  const keyboard = {
    inline_keyboard: [
      [
        { text: '⚠️ Cảnh cáo', callback_data: `warn:${id}` },
        { text: '🔒 Khóa theo thang', callback_data: `mute:${id}` }
      ],
      secondRow
    ]
  };

  for (const chatId of adminIds(env)) {
    await tg(env, 'sendMessage', {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      reply_markup: keyboard
    });
  }
}

async function handleTelegram(request, env) {
  if (request.method !== 'POST') return json({ ok: true });
  if (!env.TELEGRAM_WEBHOOK_SECRET) return json({ error: 'no secret configured' }, 500);
  const secret = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
  if (secret !== env.TELEGRAM_WEBHOOK_SECRET) return json({ error: 'forbidden' }, 403);

  const update = await request.json();
  if (update.callback_query) {
    try {
      return await handleCallback(env, update.callback_query);
    } catch (e) {
      console.error('callback failed', String(e));
      await tg(env, 'answerCallbackQuery', {
        callback_query_id: update.callback_query.id,
        text: 'Lỗi xử lý, vui lòng thử lại.'
      });
      return json({ ok: true });
    }
  }
  if (update.message && update.message.text) {
    const chatId = String(update.message.chat.id);
    if (adminIds(env).includes(chatId)) {
      await tg(env, 'sendMessage', {
        chat_id: chatId,
        text: `Bot kiểm duyệt LOCI đang chạy.\nChat ID của bạn: ${chatId}`
      });
    }
  }
  return json({ ok: true });
}

async function handleCallback(env, cq) {
  const chatId = String(cq.message && cq.message.chat && cq.message.chat.id);
  if (!adminIds(env).includes(chatId)) {
    await tg(env, 'answerCallbackQuery', { callback_query_id: cq.id, text: 'Bạn không có quyền.' });
    return json({ ok: true });
  }

  const data = String(cq.data || '');
  const idx = data.indexOf(':');
  const action = idx >= 0 ? data.slice(0, idx) : data;
  const postId = idx >= 0 ? data.slice(idx + 1) : '';
  if (!postId) {
    await tg(env, 'answerCallbackQuery', { callback_query_id: cq.id, text: 'Thiếu mã bài.' });
    return json({ ok: true });
  }

  const post = await getDoc(env, `posts/${postId}`);
  if (!post) {
    await tg(env, 'answerCallbackQuery', { callback_query_id: cq.id, text: 'Bài không còn tồn tại.' });
    return json({ ok: true });
  }

  const now = new Date();
  const nowIso = now.toISOString();
  let result = '';

  if (action === 'warn' || action === 'mute') {
    const user = (await getDoc(env, `users/${post.authorId}`)) || {};
    const strikes = Number(user.strikes || 0) + 1;
    const userFields = {
      strikes: N(strikes),
      lastViolationAt: T(nowIso),
      moderationNoticeAt: T(nowIso)
    };

    if (action === 'warn') {
      result = `Đã cảnh cáo (lần ${strikes}). Bài bị ẩn.`;
      userFields.moderationNotice = S(
        `Bài viết của bạn đã bị ẩn vì vi phạm quy định cộng đồng (cảnh cáo lần ${strikes}). ` +
          `Nếu cho rằng đây là nhầm lẫn, hãy phản hồi để được xem xét lại.`
      );
    } else {
      const muteCount = Number(user.muteCount || 0) + 1;
      const days = muteCount <= 1 ? 1 : muteCount === 2 ? 3 : muteCount === 3 ? 7 : 3650;
      const base = Math.max(Date.now(), user.mutedUntil ? Date.parse(user.mutedUntil) : 0);
      const until = new Date(base + days * 86400000).toISOString();
      userFields.muteCount = N(muteCount);
      userFields.mutedUntil = T(until);
      userFields.moderationNotice = S(
        `Tài khoản của bạn bị tạm khóa đăng bài/bình luận đến ${new Date(until).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })} ` +
          `do vi phạm quy định cộng đồng.`
      );
      result = `Đã khóa đăng bài/bình luận ${days === 3650 ? 'vĩnh viễn' : days + ' ngày'} (đến ${until}).`;
    }

    const moderation = { ...(post.moderation || {}), decision: action === 'warn' ? 'warned' : 'muted', decidedAt: nowIso, decidedBy: chatId };
    await patchDoc(env, `users/${post.authorId}`, userFields);
    await patchDoc(env, `posts/${postId}`, {
      status: S('hidden'),
      moderation: M({
        label: S(String(moderation.label || '')),
        confidence: D(Number(moderation.confidence) || 0),
        reason: S(String(moderation.reason || '')),
        scannedAt: T(String(moderation.scannedAt || nowIso)),
        decision: S(String(moderation.decision)),
        decidedAt: T(nowIso),
        decidedBy: S(chatId)
      })
    });
  } else if (action === 'clear') {
    const moderation = { ...(post.moderation || {}), decision: 'cleared', decidedAt: nowIso, decidedBy: chatId };
    await patchDoc(env, `posts/${postId}`, {
      status: S('published'),
      moderation: M({
        label: S(String(moderation.label || '')),
        confidence: D(Number(moderation.confidence) || 0),
        reason: S(String(moderation.reason || '')),
        scannedAt: T(String(moderation.scannedAt || nowIso)),
        decision: S('cleared'),
        decidedAt: T(nowIso),
        decidedBy: S(chatId)
      })
    });
    await appendComment(env, postId, {
      authorId: 'system',
      authorName: 'Ban quản trị LOCI',
      text: 'Hệ thống đã xem xét lại và xác nhận bài viết hợp lệ. Xin lỗi bạn vì đã tạm ẩn nhầm.',
      timestamp: nowIso
    }).catch((e) => console.error('apology comment', String(e)));
    await patchDoc(env, `users/${post.authorId}`, {
      moderationNotice: S('Hệ thống đã xem xét lại bài viết của bạn: bài hợp lệ và đã được hiện lại. Xin lỗi vì đã ẩn nhầm.'),
      moderationNoticeAt: T(nowIso)
    }).catch((e) => console.error('notice', String(e)));
    result = 'Đã hiện lại bài và gửi lời xin lỗi.';
  } else {
    await tg(env, 'answerCallbackQuery', { callback_query_id: cq.id, text: 'Hành động không hợp lệ.' });
    return json({ ok: true });
  }

  await addDoc(env, 'moderation_logs', {
    postId: S(postId),
    authorId: S(String(post.authorId || '')),
    action: S(action),
    label: S(String((post.moderation && post.moderation.label) || '')),
    confidence: D(Number((post.moderation && post.moderation.confidence) || 0)),
    adminChatId: S(chatId),
    at: T(nowIso)
  }).catch((e) => console.error('log', String(e)));

  await tg(env, 'answerCallbackQuery', { callback_query_id: cq.id, text: result });
  if (cq.message && cq.message.message_id) {
    await tg(env, 'editMessageText', {
      chat_id: chatId,
      message_id: cq.message.message_id,
      text: `${cq.message.text || ''}\n\n✅ <b>Đã xử lý:</b> ${esc(result)}`,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      reply_markup: { inline_keyboard: [] }
    }).catch(() => {});
  }
  return json({ ok: true });
}

// ---------------------------------------------------------------------------
// utils
// ---------------------------------------------------------------------------

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*'
    }
  });
}

function health(env) {
  return {
    ok: true,
    config: {
      firebaseProject: env.FIREBASE_PROJECT_ID || null,
      hasServiceAccount: !!env.FIREBASE_SERVICE_ACCOUNT,
      hasTelegramToken: !!env.TELEGRAM_BOT_TOKEN,
      hasAdminChat: !!env.TELEGRAM_ADMIN_CHAT_ID,
      hasWebhookSecret: !!env.TELEGRAM_WEBHOOK_SECRET,
      hasGeminiKey: !!env.GEMINI_API_KEY,
      hasCronSecret: !!env.CRON_SECRET,
      model: env.GEMINI_MODEL || 'gemini-2.5-flash'
    }
  };
}
