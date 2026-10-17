# Handoff — Khu Vườn Hagrid V20.0 (Hoàn tất V19 -> V20.0, 4 hướng nâng cấp hoàn chỉnh)

Ngày: 2026-10-14
Trạng thái: **V20.0 đã hoàn tất & đạt 93/93 kiểm thử (`0` lỗi console)**.

## 1. Nguồn thật và ranh giới an toàn
- **Thư mục prototype nguồn thật**: `/Users/thachanh/.codex/visualizations/2026/10/13/01a1336a-1a81-7fd1-838a-938d62b6dd7d/garden-v05` (artifact ngoài Git).
- **Thư mục QA & bàn giao**: `/Users/thachanh/.codex/visualizations/2026/10/13/01a1336a-1a81-7fd1-838a-938d62b6dd7d/qa-v19` (chứa `v20.0-sha256.json`, `v19.6-sha256.json`, `HANDOFF-V20.0.md`, `HANDOFF-V19.6.md`, `ui-fixture.html`, `mobile-fixture.mjs`, `fixture-wallet.mjs`, và `paused-state/before-v19/`).
- **Static HTTP Server**: đang chạy sẵn tại `http://127.0.0.1:62795` — **tuyệt đối không kill/restart server này**, không đụng tab phục hồi tài khoản chính, không đụng backend worktree `/Users/thachanh/Downloads/HPVNN.nosync/.worktrees/hagrid-garden-wallet-local-20261013`.
- **URL xem trực tiếp (dữ liệu mẫu, không ghi tài khoản)**:
  - Toàn vườn & chuyển động (Cấp 100): `http://127.0.0.1:62795/qa-v19/ui-fixture.html?wallet=emulator&qa=1&level=100&view=overview&v=20.0`
  - Chế độ Đêm trăng Rừng Cấm + Đom đóm + Đèn ấm: `http://127.0.0.1:62795/qa-v19/ui-fixture.html?wallet=emulator&qa=1&level=100&view=overview&atmo=night&v=20.0`
  - Chế độ Hoàng hôn Rừng Cấm: `http://127.0.0.1:62795/qa-v19/ui-fixture.html?wallet=emulator&qa=1&level=100&view=overview&atmo=dusk&v=20.0`
  - Modal Sắp xếp trực quan Thửa đất & Chuồng nuôi trên bản đồ: `http://127.0.0.1:62795/qa-v19/ui-fixture.html?wallet=emulator&qa=1&level=100&view=layout&v=20.0`
  - Modal Đặt & Xoay 2 góc vật phẩm Tiệm: `http://127.0.0.1:62795/qa-v19/ui-fixture.html?wallet=emulator&qa=1&level=100&view=decor&v=20.0`
  - Bộ sưu tập Trang trí & Kỷ vật (29 mẫu lối đi + 6 mẫu Tiệm xoay 2 góc): `http://127.0.0.1:62795/qa-v19/ui-fixture.html?wallet=emulator&qa=1&level=100&view=collection&v=20.0`
  - Cửa hàng Tiệm: `http://127.0.0.1:62795/qa-v19/ui-fixture.html?wallet=emulator&qa=1&level=100&view=store&v=20.0`
  - Kho Visual: `http://127.0.0.1:62795/qa-v19/ui-fixture.html?wallet=emulator&qa=1&level=100&view=inventory&v=20.0`
  - Hành trình 100 cấp: `http://127.0.0.1:62795/qa-v19/ui-fixture.html?wallet=emulator&qa=1&level=100&view=roadmap&v=20.0`

## 2. Những gì đã hoàn thành ở V20.0 (Cả 4 hướng nâng cấp)
1. **Hướng 1 — Bố cục trực quan trên bản đồ & Minh họa riêng cho 29 trang trí lối đi (`ui-utils.mjs`, `decor-placement-ui.mjs`, `progression-panels.mjs`)**:
   - Toàn bộ 29 vật phẩm trang trí mở theo cấp (`DB.decorations`: `decoration-3` .. `decoration-99`) đều có thiết kế SVG riêng (`EARNED_DECOR_SHAPES`, `earnedDecorMotifSvg`, `earnedDecorIcon`) và hỗ trợ lật xem trước 2 góc (`↖ Góc hiện tại` / `↗ Góc nhìn qua phải`) ngay trong bảng `Trang trí & kỷ vật` và `Hành trình 100 cấp`.
   - Thêm modal **Bố trí trực quan trên bản đồ (`showVisualLayoutModal`)**: chọn bất kỳ Thửa đất (`1..12`) hoặc Chuồng nuôi (`1..6`), camera tự động lia tới nền mục tiêu kèm viền sáng preview (`drawLayoutSwapPreview`) và hoán đổi vị trí tức thì.
2. **Hướng 2 — Không khí Sáng / Hoàng hôn / Đêm trăng, Thoại Bác Hagrid & Web Audio (`garden-atmosphere.mjs`, `garden-audio.mjs`)**:
   - Hệ thống 3 chế độ thời tiết (`☀ Ban ngày`, `🌅 Hoàng hôn Rừng Cấm`, `🌙 Đêm trăng Rừng Cấm`) chuyển nhanh từ nút trên thanh HUD hoặc trong Menu.
   - Chế độ Hoàng hôn & Đêm trăng tự động thắp quầng sáng ấm quanh Lều Hagrid, Nhà kính, Bưu cục Cú, Đèn bí ngô, Nến lơ lửng, Vạc đồng và các đèn trang trí lối đi, kèm đom đóm Rừng Cấm bay lượn (`computeFireflies`).
   - Bác Hagrid (`gardener_friend`) có bong bóng thoại ngữ cảnh (`hagridSpeechFor`, `drawHagridSpeechBubble`) báo cây chín, sinh vật chờ ăn hoặc lời chào theo buổi.
   - Bộ tổng hợp âm thanh Web Audio API thuần (`createGardenAudio`) phát hiệu ứng âm thanh ấm áp khi gieo hạt, thu hoạch, chăm sóc, xoay góc, mua vật tư, cú đưa thư và lên cấp (có nút bật/tắt `🔊/🔇` trên HUD).
3. **Hướng 3 — Xoay 2 góc cho 12 Sinh vật huyền bí & Đồng bộ nguyên khối (`scene-animation.mjs`, `scene-renderer.mjs`, `progression-panels.mjs`)**:
   - Toàn bộ 12 loài sinh vật (`puffskein`, `bowtruckle`, `niffler`, `kneazle`, `hippogriff`, `unicorn`, ...) hỗ trợ đổi 2 góc nhìn (`↖ Góc chuẩn` / `↗ Nhìn phải`) từ bảng `Chăm sóc sinh vật` hoặc nút `↻ Đổi hướng nhìn` trong khay tùy chọn sinh vật.
   - Vẽ nguyên khối qua `drawAssetTo(..., flipX)` với `0` vết cắt pixel.
4. **Hướng 4 — Lưu bền vững Visual Prefs, Cầu nối HPVN Game Zone / Mạng Floo & Chuẩn iOS Safari 16.0+ (`hpvn-bridge.mjs`, `v20-features.test.mjs`)**:
   - Lưu đồng bộ toàn bộ góc xoay trang trí Tiệm, trang trí lối đi, hướng nhìn sinh vật, chế độ thời tiết và trạng thái âm thanh vào `localStorage` (`hpvn-garden-v20-visual-prefs` & tương thích ngược `hpvn-garden-v18-decor-layout`).
   - Thêm cầu nối `createHpvnBridge` (`postMessage` + sao chép thông điệp `✨ Khoe vườn lên Mạng Floo`) sẵn sàng nhúng vào `/phongsinhoatchung`.
   - Kiểm tra tự động toàn bộ mã nguồn `.mjs` trong `garden-v05/` và `qa-v19/` đạt chuẩn tương thích iOS Safari 16.0+.

## 3. Kiểm thử & Nghiệm thu hiện tại
- Chạy `node --test *.test.mjs` tại `/Users/thachanh/.codex/visualizations/2026/10/13/01a1336a-1a81-7fd1-838a-938d62b6dd7d/garden-v05`: **93/93 PASS**.
