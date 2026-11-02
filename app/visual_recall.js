/* LOCI visual recall — nhận lại khung cảnh đã ghi nhớ (không cần mã QR).
   FAST-9 keypoints + oriented BRIEF descriptors + RANSAC homography +
   phân rã xoay thuần (H = K·R·K⁻¹). Kết quả: R tương đối giữa khung hiện tại
   và khung tham chiếu, để mốc AR giữ nguyên chỗ sau khi tắt/mở lại app.
   Phụ thuộc: app/spatial_math.js */
(function (root) {
    'use strict';

    const VERSION = '1.0.0';
    const M = (root && root.LociSpatialMath) ||
        (typeof module === 'object' && typeof require === 'function' ? require('./spatial_math.js') : null);
    if (!M) { console.warn('[LociVisualRecall] thiếu spatial_math.js'); return; }

    const MAX_KP = 420;
    const MAX_KP_LIVE = 300;
    const CELL = 28;
    const PER_CELL = 6;
    const DESCRIPTOR_LEN = 256;
    const DESCRIPTOR_WORDS = DESCRIPTOR_LEN / 32;
    const MAX_REF_DIST = 92;
    const RATIO = 0.8;
    const INLIER_PX = 4.5;
    const MAX_REFS_PER_SPACE = 10;
    const DB_NAME = 'loci_visual_recall';
    const DB_STORE = 'keyframes';

    const FAST_OFF = [
        [0, -3], [1, -3], [2, -2], [3, -1], [3, 0], [3, 1], [2, 2], [1, 3],
        [0, 3], [-1, 3], [-2, 2], [-3, 1], [-3, 0], [-3, -1], [-2, -2], [-1, -3]
    ];

    /* ---------------- small matrix helpers ---------------- */
    const matMul3 = (A, B) => [0, 1, 2].map(i => [0, 1, 2].map(j =>
        A[i][0] * B[0][j] + A[i][1] * B[1][j] + A[i][2] * B[2][j]));
    const transpose3 = A => [0, 1, 2].map(i => [0, 1, 2].map(j => A[j][i]));

    function inv3(A) {
        const a = A[0][0], b = A[0][1], c = A[0][2];
        const d = A[1][0], e = A[1][1], f = A[1][2];
        const g = A[2][0], h = A[2][1], i = A[2][2];
        const det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
        if (!isFinite(det) || Math.abs(det) < 1e-12) return null;
        const id = 1 / det;
        return [
            [(e * i - f * h) * id, (c * h - b * i) * id, (b * f - c * e) * id],
            [(f * g - d * i) * id, (a * i - c * g) * id, (c * d - a * f) * id],
            [(d * h - e * g) * id, (b * g - a * h) * id, (a * e - b * d) * id]
        ];
    }

    const det3 = A =>
        A[0][0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) -
        A[0][1] * (A[1][0] * A[2][2] - A[1][2] * A[2][0]) +
        A[0][2] * (A[1][0] * A[2][1] - A[1][1] * A[2][0]);

    function applyH(H, x, y) {
        const w = H[2][0] * x + H[2][1] * y + H[2][2];
        if (!isFinite(w) || Math.abs(w) < 1e-9) return null;
        return [
            (H[0][0] * x + H[0][1] * y + H[0][2]) / w,
            (H[1][0] * x + H[1][1] * y + H[1][2]) / w
        ];
    }

    /* ---------------- deterministic sampling pattern ---------------- */
    function mulberry32(a) {
        return function () {
            a |= 0; a = a + 0x6D2B79F5 | 0;
            let t = Math.imul(a ^ a >>> 15, 1 | a);
            t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    }

    const PAT = (function () {
        const rnd = mulberry32(0x1234abcd);
        const p = new Float32Array(DESCRIPTOR_LEN * 4);
        for (let i = 0; i < DESCRIPTOR_LEN; i++) {
            let ax, ay, bx, by;
            for (let tries = 0; tries < 8; tries++) {
                const ra = 2.5 + rnd() * 11, aa = rnd() * Math.PI * 2;
                const rb = 2.5 + rnd() * 11, ab = rnd() * Math.PI * 2;
                ax = Math.cos(aa) * ra; ay = Math.sin(aa) * ra;
                bx = Math.cos(ab) * rb; by = Math.sin(ab) * rb;
                if (Math.hypot(ax - bx, ay - by) > 1.6) break;
            }
            p[i * 4] = ax; p[i * 4 + 1] = ay; p[i * 4 + 2] = bx; p[i * 4 + 3] = by;
        }
        return p;
    })();

    const POP16 = (function () {
        const t = new Uint8Array(65536);
        for (let i = 0; i < 65536; i++) t[i] = (i & 1) + t[i >> 1];
        return t;
    })();

    /* ---------------- grayscale ---------------- */
    let _canvas = null;

    function grayFromImageData(img) {
        const w = img.width, h = img.height, src = img.data;
        const out = new Uint8Array(w * h);
        for (let i = 0, j = 0; i < out.length; i++, j += 4) {
            out[i] = (src[j] * 77 + src[j + 1] * 150 + src[j + 2] * 29) >> 8;
        }
        return { w, h, data: out };
    }

    function grabGray(source, maxDim) {
        if (!source) return null;
        if (source.data && source.width) return grayFromImageData(source);
        const vw = source.videoWidth || source.width || 0;
        const vh = source.videoHeight || source.height || 0;
        if (!vw || !vh) return null;
        const lim = maxDim > 0 ? maxDim : 400;
        const scale = Math.min(1, lim / Math.max(vw, vh));
        const w = Math.max(32, Math.round(vw * scale));
        const h = Math.max(24, Math.round(vh * scale));
        if (typeof document === 'undefined') return null;
        if (!_canvas) _canvas = document.createElement('canvas');
        if (_canvas.width !== w || _canvas.height !== h) { _canvas.width = w; _canvas.height = h; }
        const ctx = _canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return null;
        try { ctx.drawImage(source, 0, 0, w, h); } catch (e) { return null; }
        let img;
        try { img = ctx.getImageData(0, 0, w, h); } catch (e) { return null; }
        return grayFromImageData(img);
    }

    /* ---------------- FAST-9 ---------------- */
    function cornerScore(gray, w, x, y, thresh) {
        const p = gray[y * w + x];
        const hi = p + thresh, lo = p - thresh;
        let maskB = 0, maskD = 0;
        for (let i = 0; i < 16; i++) {
            const o = FAST_OFF[i];
            const q = gray[(y + o[1]) * w + (x + o[0])];
            if (q > hi) maskB |= 1 << i;
            else if (q < lo) maskD |= 1 << i;
        }
        if (!maskB && !maskD) return 0;
        const b32 = maskB | (maskB << 16);
        const d32 = maskD | (maskD << 16);
        let hit = false;
        for (let i = 0; i < 16; i++) {
            if (((b32 >>> i) & 0x1FF) === 0x1FF || ((d32 >>> i) & 0x1FF) === 0x1FF) { hit = true; break; }
        }
        if (!hit) return 0;
        let score = 0;
        for (let i = 0; i < 16; i++) {
            const o = FAST_OFF[i];
            score += Math.abs(gray[(y + o[1]) * w + (x + o[0])] - p);
        }
        return score;
    }

    function keypointAngle(gray, w, h, x, y) {
        const R = 12;
        let m10 = 0, m01 = 0;
        const x0 = Math.max(1, x - R), x1 = Math.min(w - 2, x + R);
        const y0 = Math.max(1, y - R), y1 = Math.min(h - 2, y + R);
        for (let py = y0; py <= y1; py += 2) {
            const dy = py - y;
            for (let px = x0; px <= x1; px += 2) {
                const v = gray[py * w + px];
                m10 += (px - x) * v;
                m01 += dy * v;
            }
        }
        return (m10 === 0 && m01 === 0) ? 0 : Math.atan2(m01, m10);
    }

    function detect(gray) {
        const w = gray.w || gray.width, h = gray.h || gray.height, data = gray.data;
        const cells = new Map();
        const thresh = 22;
        for (let y = 3; y < h - 3; y++) {
            for (let x = 3; x < w - 3; x++) {
                const s = cornerScore(data, w, x, y, thresh);
                if (s <= 0) continue;
                const key = ((x / CELL) | 0) * 1000 + ((y / CELL) | 0);
                let arr = cells.get(key);
                if (!arr) { arr = []; cells.set(key, arr); }
                arr.push(x, y, s);
            }
        }
        const cand = [];
        cells.forEach(arr => {
            const items = [];
            for (let i = 0; i < arr.length; i += 3) items.push([arr[i], arr[i + 1], arr[i + 2]]);
            items.sort((a, b) => b[2] - a[2]);
            const take = Math.min(PER_CELL, items.length);
            for (let i = 0; i < take; i++) cand.push(items[i]);
        });
        const picked = [];
        const minD = 5;
        for (let i = 0; i < cand.length && picked.length < MAX_KP; i++) {
            const c = cand[i];
            let ok = true;
            for (let j = 0; j < picked.length; j++) {
                const p = picked[j];
                if ((p.x - c[0]) * (p.x - c[0]) + (p.y - c[1]) * (p.y - c[1]) < minD * minD) { ok = false; break; }
            }
            if (ok) picked.push({ x: c[0], y: c[1], score: c[2] });
        }
        const out = new Float32Array(picked.length * 3);
        for (let i = 0; i < picked.length; i++) {
            const p = picked[i];
            out[i * 3] = p.x;
            out[i * 3 + 1] = p.y;
            out[i * 3 + 2] = keypointAngle(data, w, h, p.x, p.y);
        }
        return out;
    }

    /* ---------------- oriented BRIEF ---------------- */
    function describe(gray, kps, limit) {
        const w = gray.w || gray.width, h = gray.h || gray.height, data = gray.data;
        const total = Math.floor(kps.length / 3);
        const n = limit > 0 ? Math.min(total, limit) : total;
        const desc = new Uint32Array(n * DESCRIPTOR_WORDS);
        for (let i = 0; i < n; i++) {
            const x = kps[i * 3], y = kps[i * 3 + 1], a = kps[i * 3 + 2];
            const c = Math.cos(a), s = Math.sin(a);
            const base = i * DESCRIPTOR_WORDS;
            for (let word = 0; word < DESCRIPTOR_WORDS; word++) {
                let bits = 0;
                for (let b = 0; b < 32; b++) {
                    const k = word * 32 + b;
                    const ax = PAT[k * 4], ay = PAT[k * 4 + 1];
                    const bx = PAT[k * 4 + 2], by = PAT[k * 4 + 3];
                    let x1 = x + ax * c - ay * s;
                    let y1 = y + ax * s + ay * c;
                    let x2 = x + bx * c - by * s;
                    let y2 = y + bx * s + by * c;
                    x1 = x1 < 0 ? 0 : (x1 > w - 1 ? w - 1 : x1 | 0);
                    y1 = y1 < 0 ? 0 : (y1 > h - 1 ? h - 1 : y1 | 0);
                    x2 = x2 < 0 ? 0 : (x2 > w - 1 ? w - 1 : x2 | 0);
                    y2 = y2 < 0 ? 0 : (y2 > h - 1 ? h - 1 : y2 | 0);
                    if (data[y1 * w + x1] < data[y2 * w + x2]) bits |= 1 << b;
                }
                desc[base + word] = bits >>> 0;
            }
        }
        return desc;
    }

    function frameFromGray(gray) {
        if (!gray) return null;
        const kps = detect(gray);
        const desc = describe(gray, kps, MAX_KP);
        return { w: gray.w, h: gray.h, kps, desc, count: Math.floor(kps.length / 3) };
    }

    function captureFrame(source, maxDim) {
        return frameFromGray(grabGray(source, maxDim));
    }

    /* ---------------- matching ---------------- */
    function hamming(desc, i, other, j) {
        let d = 0;
        const a = i * DESCRIPTOR_WORDS, b = j * DESCRIPTOR_WORDS;
        for (let k = 0; k < DESCRIPTOR_WORDS; k++) {
            const v = desc[a + k] ^ other[b + k];
            d += POP16[v & 0xffff] + POP16[(v >>> 16) & 0xffff];
        }
        return d;
    }

    function normalizePoints(pts) {
        const n = pts.length;
        let mx = 0, my = 0;
        for (let i = 0; i < n; i++) { mx += pts[i][0]; my += pts[i][1]; }
        mx /= n; my /= n;
        let dsum = 0;
        for (let i = 0; i < n; i++) dsum += Math.hypot(pts[i][0] - mx, pts[i][1] - my);
        dsum /= n;
        const s = dsum > 1e-6 ? Math.SQRT2 / dsum : 1;
        const T = [[s, 0, -s * mx], [0, s, -s * my], [0, 0, 1]];
        const out = pts.map(p => [s * (p[0] - mx), s * (p[1] - my)]);
        return { T, pts: out, scale: s };
    }

    function homographyFromCorrespondences(src, dst) {
        const n = src.length;
        if (n < 4) return null;
        const rows = [];
        const rhs = [];
        for (let i = 0; i < n; i++) {
            const X = src[i][0], Y = src[i][1], u = dst[i][0], v = dst[i][1];
            rows.push([X, Y, 1, 0, 0, 0, -u * X, -u * Y]); rhs.push(u);
            rows.push([0, 0, 0, X, Y, 1, -v * X, -v * Y]); rhs.push(v);
        }
        let h;
        if (n === 4) {
            h = M.solveLinear(rows, rhs);
        } else {
            const AtA = [], Atb = new Array(8).fill(0);
            for (let i = 0; i < 8; i++) AtA.push(new Array(8).fill(0));
            for (let r = 0; r < rows.length; r++) {
                const row = rows[r], val = rhs[r];
                for (let i = 0; i < 8; i++) {
                    Atb[i] += row[i] * val;
                    for (let j = 0; j < 8; j++) AtA[i][j] += row[i] * row[j];
                }
            }
            h = M.solveLinear(AtA, Atb);
        }
        if (!h) return null;
        return [[h[0], h[1], h[2]], [h[3], h[4], h[5]], [h[6], h[7], 1]];
    }

    function triangleArea(a, b, c) {
        return Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1]));
    }

    function ransacHomography(src, dst) {
        const n = src.length;
        if (n < 6) return null;
        const ns = normalizePoints(src);
        const nd = normalizePoints(dst);
        const S = ns.pts, D = nd.pts;
        const thresh = INLIER_PX * nd.scale;
        const thresh2 = thresh * thresh;
        const iters = Math.min(700, Math.max(300, Math.round(25000 / Math.max(1, n))));
        let bestMask = null, bestCount = 0;
        const used = new Set();
        for (let it = 0; it < iters; it++) {
            let i0, i1, i2, i3;
            let guard = 0;
            do {
                i0 = (Math.random() * n) | 0; i1 = (Math.random() * n) | 0;
                i2 = (Math.random() * n) | 0; i3 = (Math.random() * n) | 0;
            } while (guard++ < 12 && (i0 === i1 || i0 === i2 || i0 === i3 || i1 === i2 || i1 === i3 || i2 === i3));
            if (i0 === i1 || i0 === i2 || i0 === i3 || i1 === i2 || i1 === i3 || i2 === i3) continue;
            if (triangleArea(S[i0], S[i1], S[i2]) < 1e-4) continue;
            const Hs = homographyFromCorrespondences(
                [S[i0], S[i1], S[i2], S[i3]], [D[i0], D[i1], D[i2], D[i3]]);
            if (!Hs) continue;
            let count = 0;
            let mask = '';
            for (let i = 0; i < n; i++) {
                const p = applyH(Hs, S[i][0], S[i][1]);
                if (!p) { mask += '0'; continue; }
                const dx = p[0] - D[i][0], dy = p[1] - D[i][1];
                const ok = dx * dx + dy * dy <= thresh2;
                mask += ok ? '1' : '0';
                if (ok) count++;
            }
            if (count > bestCount) { bestCount = count; bestMask = mask; }
        }
        if (bestCount < 6 || !bestMask) return null;
        const inSrc = [], inDst = [];
        for (let i = 0; i < n; i++) {
            if (bestMask[i] === '1') { inSrc.push(S[i]); inDst.push(D[i]); }
        }
        let Hn = null;
        if (inSrc.length >= 6) Hn = homographyFromCorrespondences(inSrc, inDst);
        if (!Hn) Hn = homographyFromCorrespondences(
            inSrc.slice(0, 4), inDst.slice(0, 4));
        if (!Hn) return null;
        const invTd = inv3(nd.T);
        if (!invTd) return null;
        const H = matMul3(matMul3(invTd, Hn), ns.T);
        if (!H) return null;

        let sum = 0, inliers = 0;
        for (let i = 0; i < n; i++) {
            const p = applyH(H, src[i][0], src[i][1]);
            if (!p) continue;
            const dx = p[0] - dst[i][0], dy = p[1] - dst[i][1];
            const e2 = dx * dx + dy * dy;
            if (e2 <= INLIER_PX * INLIER_PX) { inliers++; sum += e2; }
        }
        if (inliers < 6) return null;
        const rms = Math.sqrt(sum / inliers);
        return { H, inliers, rms, total: n, ratio: inliers / n };
    }

    function matchFrames(ref, live) {
        if (!ref || !live || !ref.desc || !live.desc) return null;
        const rn = Math.floor(ref.kps.length / 3);
        const ln = Math.min(Math.floor(live.kps.length / 3), MAX_KP_LIVE);
        if (rn < 8 || ln < 8) return null;
        const bestL = new Int32Array(ln).fill(-1);
        const distL = new Float32Array(ln).fill(1e9);
        const bestR = new Int32Array(rn).fill(-1);
        const distR = new Float32Array(rn).fill(1e9);
        for (let i = 0; i < ln; i++) {
            for (let j = 0; j < rn; j++) {
                const d = hamming(live.desc, i, ref.desc, j);
                if (d < distL[i]) { distL[i] = d; bestL[i] = j; }
                if (d < distR[j]) { distR[j] = d; bestR[j] = i; }
            }
        }
        const src = [], dst = [];
        for (let i = 0; i < ln; i++) {
            const j = bestL[i];
            if (j < 0 || bestR[j] !== i) continue;
            if (distL[i] > MAX_REF_DIST) continue;
            src.push([ref.kps[j * 3], ref.kps[j * 3 + 1]]);
            dst.push([live.kps[i * 3], live.kps[i * 3 + 1]]);
        }
        if (src.length < 6) return null;
        const out = ransacHomography(src, dst);
        if (out) out.matches = src.length;
        return out;
    }

    /* ---------------- pure-rotation decomposition ---------------- */
    function rotationFromHomography(H, focalNorm, refW, refH, liveW, liveH) {
        if (!H || !(focalNorm > 0)) return null;
        const fr = focalNorm * refW, fl = focalNorm * liveW;
        const Kr = [[fr, 0, refW / 2], [0, fr, refH / 2], [0, 0, 1]];
        const Kli = [[1 / fl, 0, -(liveW / 2) / fl], [0, 1 / fl, -(liveH / 2) / fl], [0, 0, 1]];
        let A = matMul3(matMul3(Kli, H), Kr);
        const det = det3(A);
        if (!isFinite(det) || det <= 1e-9) return null;
        const s = Math.cbrt(det);
        A = A.map(row => row.map(v => v / s));
        let R = A.map(row => row.slice());
        for (let it = 0; it < 12; it++) {
            const inv = inv3(R);
            if (!inv) return null;
            const invT = transpose3(inv);
            R = R.map((row, i) => row.map((v, j) => 0.5 * (v + invT[i][j])));
        }
        const RtR = matMul3(transpose3(R), R);
        let err = 0;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) err += Math.abs(RtR[i][j] - (i === j ? 1 : 0));
        }
        if (err > 0.25) return null;
        return R;
    }

    function rotationAngleDeg(R) {
        const tr = R[0][0] + R[1][1] + R[2][2];
        const c = Math.max(-1, Math.min(1, (tr - 1) / 2));
        return Math.acos(c) * 180 / Math.PI;
    }

    /* ---------------- IndexedDB keyframes ---------------- */
    let dbPromise = null;

    function openDb() {
        if (dbPromise) return dbPromise;
        dbPromise = new Promise(resolve => {
            if (typeof indexedDB === 'undefined' || !indexedDB) return resolve(null);
            let req;
            try { req = indexedDB.open(DB_NAME, 1); } catch (e) { return resolve(null); }
            req.onupgradeneeded = () => {
                const db = req.result;
                if (!db.objectStoreNames.contains(DB_STORE)) {
                    const st = db.createObjectStore(DB_STORE, { keyPath: 'id' });
                    st.createIndex('spaceId', 'spaceId', { unique: false });
                }
            };
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => resolve(null);
        }).catch(() => null);
        return dbPromise;
    }

    function idbRequest(req) {
        return new Promise(resolve => {
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => resolve(null);
        });
    }

    async function listRefs(spaceId) {
        const db = await openDb();
        if (!db || !spaceId) return [];
        try {
            const tx = db.transaction(DB_STORE, 'readonly');
            const idx = tx.objectStore(DB_STORE).index('spaceId');
            const rows = await idbRequest(idx.getAll(spaceId));
            return (rows || []).sort((a, b) => (b.at || 0) - (a.at || 0));
        } catch (e) { return []; }
    }

    function priority(rec) {
        if (rec.tag && rec.tag.indexOf('anchor:') === 0) return 2;
        if (rec.tag === 'home') return 1;
        return 0;
    }

    async function prune(spaceId) {
        const rows = await listRefs(spaceId);
        if (rows.length <= MAX_REFS_PER_SPACE) return;
        rows.sort((a, b) => {
            const pa = priority(a), pb = priority(b);
            if (pa !== pb) return pa - pb;
            return (a.at || 0) - (b.at || 0);
        });
        const db = await openDb();
        if (!db) return;
        while (rows.length > MAX_REFS_PER_SPACE && rows.length) {
            const victim = rows.shift();
            try {
                const tx = db.transaction(DB_STORE, 'readwrite');
                tx.objectStore(DB_STORE).delete(victim.id);
            } catch (e) { }
        }
    }

    async function saveRef(spaceId, record) {
        if (!spaceId || !record || !record.desc) return null;
        const db = await openDb();
        const rec = Object.assign({}, record, {
            id: spaceId + ':' + Date.now() + ':' + Math.random().toString(36).slice(2, 7),
            spaceId
        });
        if (!db) return rec;
        try {
            await new Promise(resolve => {
                const tx = db.transaction(DB_STORE, 'readwrite');
                tx.objectStore(DB_STORE).put(rec);
                tx.oncomplete = () => resolve(true);
                tx.onerror = () => resolve(false);
            });
            prune(spaceId);
            return rec;
        } catch (e) { return null; }
    }

    async function deleteRefs(spaceId) {
        const db = await openDb();
        if (!db || !spaceId) return;
        try {
            const rows = await listRefs(spaceId);
            const tx2 = db.transaction(DB_STORE, 'readwrite');
            rows.forEach(r => tx2.objectStore(DB_STORE).delete(r.id));
        } catch (e) { }
    }

    async function deleteRef(id) {
        const db = await openDb();
        if (!db || !id) return;
        try {
            const tx = db.transaction(DB_STORE, 'readwrite');
            tx.objectStore(DB_STORE).delete(id);
        } catch (e) { }
    }

    /* ---------------- public api ---------------- */
    const api = {
        __version: VERSION,
        MAX_KP,
        grabGray,
        detect,
        describe,
        frameFromGray,
        captureFrame,
        matchFrames,
        rotationFromHomography,
        rotationAngleDeg,
        listRefs,
        saveRef,
        deleteRefs,
        deleteRef,
        _test: { hamming, ransacHomography, homographyFromCorrespondences, applyH }
    };

    if (root) root.LociVisualRecall = api;
    if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
