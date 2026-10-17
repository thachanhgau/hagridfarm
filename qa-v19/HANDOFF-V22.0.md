# HANDOFF — Khu Vườn Hagrid V22.0 (Out-of-Git Prototype)

- **Phiên bản**: `V22.0` (`?v=22.0`)
- **Đường dẫn Source**: `/Users/thachanh/.codex/visualizations/2026/10/13/01a1336a-1a81-7fd1-838a-938d62b6dd7d/garden-v05`
- **Đường dẫn QA Fixture**: `/Users/thachanh/.codex/visualizations/2026/10/13/01a1336a-1a81-7fd1-838a-938d62b6dd7d/qa-v19`
- **Live Preview URLs (port `62795`)**:
  - Khu Vườn Hagrid (QA Fixture Lv.100):
    `http://127.0.0.1:62795/qa-v19/ui-fixture.html?wallet=emulator&qa=1&level=100&view=overview&v=22.0`
  - Mô phỏng Nhúng `/phongsinhoatchung` (Host Shell + Iframe + Floo Dock):
    `http://127.0.0.1:62795/qa-v19/embed-preview.html?v=22.0`

## Những gì đã hoàn thành ở V22.0 (Directions 1–4)

1. **Direction 1 — Chế độ Tham Quan Vườn Bạn Bè & Khu Vườn Mẫu (`garden-v05/garden-tour.mjs`)**:
   - 3 Khu Vườn Vinh Danh (`HONOR_GARDENS`) với snapshot bất biến, không ghi đè save thật của người chơi:
     - **Giáo sư Pomona Sprout** (`tour_sprout`, Cấp 45, Ban ngày · Lá thu, chuyên gia Thảo dược).
     - **Newt Scamander** (`tour_newt`, Cấp 78, Hoàng hôn · Mưa phùn, nhà Sinh vật Huyền bí).
     - **Charlie Weasley** (`tour_charlie`, Cấp 100, Đêm Rừng Cấm · Tuyết rơi, mở trọn 12 ô đất, 12 chuồng nuôi và 12 đài kỷ vật phương Nam).
   - Thanh `#tourBanner` nổi trên khung cảnh khi ghé thăm vườn mẫu kèm các nút:
     - `🤝 Chăm giúp (+vật tư)` — thưởng 1 lần/ngày/vườn mẫu, lưu tiến độ vào `localStorage` (`hpvn-garden-v22-tour`) và tự động cộng vào nhiệm vụ Cú Đưa Thư.
     - `⇄ Qua vườn ...` — chuyển nhanh giữa 3 khu vườn mẫu.
     - `🏡 Về vườn của mình` — khôi phục nguyên trạng khu vườn, thời khắc và thời tiết của người chơi.

2. **Direction 2 — Hiệu ứng Thời tiết Động & Mùa Phép Thuật (`garden-v05/garden-atmosphere.mjs`, `scene-renderer.mjs`)**:
   - 4 chế độ thời tiết động (`WEATHER_MODES`):
     - `☀ Quang đãng` (`clear`)
     - `🌧 Mưa phùn Thảo dược` (`rain` — hạt mưa xiên + gợn nước mặt đất)
     - `🍂 Lá thu Rừng Cấm` (`autumn` — lá phong cam/đỏ/vàng chao nghiêng)
     - `❄ Tuyết rơi Hogwarts` (`snow` — bông tuyết pixel trắng/băng rơi êm)
   - Nút `#weatherButton` ngay trên HUD cạnh nút Thời khắc (`#atmosphereButton`) và trong Menu, đồng bộ lưu vào `localStorage` (`hpvn-garden-v20-prefs`).
   - Lời thoại của bác Hagrid (`hagridSpeechFor`) tự động phản hồi theo thời tiết đang bật.

3. **Direction 3 — Bảng Vinh Danh & Danh Hiệu Người Giữ Vườn (`garden-v05/garden-achievements.mjs`, `garden-postcard.mjs`, `hpvn-bridge.mjs`)**:
   - 12 Thành tựu & Danh hiệu Người Giữ Vườn (`KEEPER_ACHIEVEMENTS`), từ `🌱 Tập Sự Thảo Dược` đến `👑 Đại Quản Gia Rừng Cấm`, mở khóa theo tiến trình cấp độ, ô đất, sinh vật, kỷ vật, trang trí và số lần chăm giúp vườn bạn bè.
   - Cho phép chọn **Đeo danh hiệu** hiển thị trực tiếp trên thanh HUD (`#keeperTitleButton` cạnh `#playerName`), nhận thưởng vật tư 1 lần/thành tựu (`hpvn-garden-v22-achievements`), in dấu danh hiệu + thời tiết lên **Thiệp Ảnh PNG 960×620** (`garden-postcard.mjs`) và đính kèm vào câu khoe vườn trên **Mạng Floo** (`hpvn-bridge.mjs`).

4. **Direction 4 — Adapter Tích hợp `/phongsinhoatchung` & Host Shell Simulator (`garden-v05/hpvn-bridge.mjs`, `qa-v19/embed-preview.html`)**:
   - `createHpvnHostBridge` trong `hpvn-bridge.mjs` hỗ trợ giao thức `postMessage` hai chiều giữa trang chủ HPVN và iframe game (`hpvn-garden:ready`, `hpvn-garden:state-summary`, `hpvn-garden:floo-share`, `hpvn-garden:set-atmosphere`, `hpvn-garden:set-weather`, `hpvn-garden:visit-honor-garden`, `hpvn-garden:request-summary`).
   - Trang mô phỏng `qa-v19/embed-preview.html` giả lập khung `/phongsinhoatchung` + cột **Mạng Floo Dock** bên phải để kiểm thử trực tiếp việc đổi Thời khắc/Thời tiết/Tham quan vườn mẫu từ host và nhận tin nhắn khoe vườn + ảnh chụp PNG từ iframe.
   - Giữ sạch tuyệt đối toàn bộ các nhánh Git (`HPVNN.nosync`) và vượt qua `101/101` bài kiểm thử (`node --test *.test.mjs`), bao gồm kiểm tra tương thích cú pháp iOS Safari 16.0+.
