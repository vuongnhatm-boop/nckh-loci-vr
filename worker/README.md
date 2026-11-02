# LOCI Moderator (Cloudflare Worker)

Bot kiểm duyệt 24/7 cho bảng tin `ket_noi.html`:

1. Cron mỗi phút quét bài mới trong Firestore `posts`.
2. Gọi Gemini Flash phân loại (mặc định `gemini-3.5-flash`, tự fallback `3.6-flash`/`3.1-flash-lite`; kèm ảnh nếu bật `AI_IMAGES=1`).
3. Bài bị nghi vi phạm → ẩn tạm (`status = pending_review`) + gửi Telegram kèm nút.
4. Admin bấm **Cảnh cáo / Khóa theo thang / Hiểu lầm** → Worker ghi Firestore.
5. Firestore Rules chặn đăng bài + bình luận khi `users/{uid}.mutedUntil > now`.

Không chạy trên Netlify: Netlify chỉ host file tĩnh. Worker này là backend riêng, gói free.

## Endpoints

| Path | Việc |
|---|---|
| `GET /health` | Kiểm tra secret đã cấu hình đủ chưa (không lộ giá trị) |
| `GET /cron?key=<CRON_SECRET>` | Chạy quét thủ công / dùng cho cron-job.org |
| `GET /setup?key=<CRON_SECRET>` | Tự set webhook Telegram + kiểm tra token bot (gọi 1 lần sau deploy) |
| `GET /scan?postId=<id>` | Quét ngay 1 bài vừa đăng (client gọi sau khi đăng) |
| `POST /telegram` | Webhook Telegram (có `X-Telegram-Bot-Api-Secret-Token`) |

## Biến môi trường / secret

| Tên | Ghi chú |
|---|---|
| `FIREBASE_PROJECT_ID` | `loci-b04a7` (đã đặt trong `wrangler.toml`) |
| `FIREBASE_SERVICE_ACCOUNT` | **Secret.** Nội dung file JSON service account (1 dòng) |
| `TELEGRAM_BOT_TOKEN` | **Secret.** Token BotFather |
| `TELEGRAM_ADMIN_CHAT_ID` | Chat ID admin, nhiều người cách nhau dấu phẩy |
| `TELEGRAM_WEBHOOK_SECRET` | **Secret.** Chuỗi ngẫu nhiên, Telegram gửi lại trong header |
| `GEMINI_API_KEY` | **Secret.** Key AI Studio |
| `CRON_SECRET` | **Secret.** Bảo vệ endpoint `/cron` |
| `PORTAL_URL` | Ví dụ `https://your-site.netlify.app` (nút "Mở bảng tin") |
| `GEMINI_MODEL` | Mặc định `gemini-3.5-flash` (đã test chạy được) |
| `AI_THRESHOLD` | Mặc định `0.75` |
| `AI_IMAGES` | `0`/`1` — bật xét ảnh (tốn CPU, có thể vượt 10ms gói free) |

## Deploy

```bash
cd worker
npx wrangler login
npx wrangler secret put FIREBASE_SERVICE_ACCOUNT   # dán JSON 1 dòng
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_WEBHOOK_SECRET
npx wrangler secret put GEMINI_API_KEY
npx wrangler secret put CRON_SECRET
npx wrangler deploy
```

Sau khi deploy, mở `https://loci-moderator.<subdomain>.workers.dev/health` — các trường `has*` phải là `true`.

Cũng có thể deploy bằng dashboard: Workers → Create → dán `src/index.js`, thêm Cron Trigger `* * * * *`, rồi thêm từng secret trong Settings → Variables.

## Gắn webhook Telegram

Đặt `TELEGRAM_WEBHOOK_SECRET` + `CRON_SECRET` trước, sau đó mở bằng trình duyệt:

```
https://loci-moderator.<subdomain>.workers.dev/setup?key=<CRON_SECRET>
```

Kết quả trả về `bot` (username), `setWebhook.ok = true`, `webhookInfo.url` đúng. Không cần chạy curl với token.

## Test nhanh

1. Đăng một bài có nội dung spam thử (ví dụ: "Bán điện thoại giá rẻ ib zalo 09xx").
2. Trong ≤1 phút phải nhận tin Telegram, bài biến khỏi bảng tin.
3. Bấm **Hiểu lầm** → bài hiện lại + có bình luận xin lỗi.
4. Bấm **Khóa theo thang** trên bài vi phạm → user bị chặn đăng/bình luận; thử đăng lại sẽ bị Rules từ chối.

## Ghi chú vận hành

- **Fail-open:** Gemini lỗi/hết quota → bài vẫn hiện, chỉ ghi log. Cố ý để không chặn oan cả trường.
- **Cron free:** nếu Cloudflare không cho cron 1 phút, tạo job trên cron-job.org gọi `/cron?key=...` mỗi phút.
- **Độ trễ:** cron tối đa ~1 phút; client gọi `/scan` ngay sau khi đăng nên thực tế 2–5 giây.
- **Ảnh:** mặc định không xét để tránh vượt CPU 10ms của gói free. Bật `AI_IMAGES=1` nếu chấp nhận.
- **Bình luận:** hiện chặn theo `mutedUntil`; quét nội dung bình luận là giai đoạn 2.
- **Xoay token:** token bot/key Gemini từng dán vào chat — sau khi chạy ổn, revoke và tạo lại.
