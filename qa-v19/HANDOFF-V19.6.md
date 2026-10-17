# Handoff — Khu Vườn Hagrid V19.6 -> V20.0 (Hoàn tất 4 hướng nâng cấp V20.0)

Ngày: 2026-10-14
Trạng thái: **V20.0 đã hoàn tất & đạt 93/93 kiểm thử (`0` lỗi console)**. (Xem chi tiết đầy đủ tại `HANDOFF-V20.0.md`).

## 1. Nguồn thật và ranh giới an toàn
- **Thư mục prototype nguồn thật**: `/Users/thachanh/.codex/visualizations/2026/10/13/01a1336a-1a81-7fd1-838a-938d62b6dd7d/garden-v05` (artifact ngoài Git).
- **Thư mục QA & bàn giao**: `/Users/thachanh/.codex/visualizations/2026/10/13/01a1336a-1a81-7fd1-838a-938d62b6dd7d/qa-v19` (chứa `v20.0-sha256.json`, `v19.6-sha256.json`, `HANDOFF-V20.0.md`, `HANDOFF-V19.6.md`, `ui-fixture.html`, `mobile-fixture.mjs`, `fixture-wallet.mjs`, và `paused-state/before-v19/`).
- **Static HTTP Server**: đang chạy sẵn tại `http://127.0.0.1:62795` — **tuyệt đối không kill/restart server này**, không đụng tab phục hồi tài khoản chính, không đụng backend worktree `/Users/thachanh/Downloads/HPVNN.nosync/.worktrees/hagrid-garden-wallet-local-20261013`.
- **URL xem trực tiếp (dữ liệu mẫu, không ghi tài khoản)**:
  - Toàn vườn & chuyển động (Cấp 100): `http://127.0.0.1:62795/qa-v19/ui-fixture.html?wallet=emulator&qa=1&level=100&view=overview&v=20.0`
  - Chế độ Đêm trăng Rừng Cấm + Đom đóm + Đèn ấm: `http://127.0.0.1:62795/qa-v19/ui-fixture.html?wallet=emulator&qa=1&level=100&view=overview&atmo=night&v=20.0`
  - Modal Sắp xếp trực quan Thửa đất & Chuồng nuôi trên bản đồ: `http://127.0.0.1:62795/qa-v19/ui-fixture.html?wallet=emulator&qa=1&level=100&view=layout&v=20.0`
  - Modal Đặt & Xoay 2 góc: `http://127.0.0.1:62795/qa-v19/ui-fixture.html?wallet=emulator&qa=1&level=100&view=decor&v=20.0`
  - Bộ sưu tập Trang trí & Kỷ vật (2 góc): `http://127.0.0.1:62795/qa-v19/ui-fixture.html?wallet=emulator&qa=1&level=100&view=collection&v=20.0`
  - Cửa hàng Tiệm: `http://127.0.0.1:62795/qa-v19/ui-fixture.html?wallet=emulator&qa=1&level=100&view=store&v=20.0`
  - Kho Visual: `http://127.0.0.1:62795/qa-v19/ui-fixture.html?wallet=emulator&qa=1&level=100&view=inventory&v=20.0`
  - Hành trình 100 cấp: `http://127.0.0.1:62795/qa-v19/ui-fixture.html?wallet=emulator&qa=1&level=100&view=roadmap&v=20.0`

## 2. Tóm tắt V19.6 -> V20.0
1. **Hướng 1 (Bố trí trực quan & 29 icon trang trí lối đi 2 góc)**: `showVisualLayoutModal` cho phép chọn và đổi nền Thửa đất (`1..12`) & Chuồng nuôi (`1..6`) trực tiếp trên bản đồ có viền sáng preview; toàn bộ 29 `DB.decorations` có biểu tượng SVG riêng và lật 2 góc (`↖` / `↗`).
2. **Hướng 2 (Không khí Ngày / Hoàng hôn / Đêm trăng, Thoại Bác Hagrid & Web Audio)**: `garden-atmosphere.mjs` vẽ hiệu ứng ánh đèn ấm, đom đóm Rừng Cấm và bong bóng thoại ngữ cảnh cho Bác Hagrid; `garden-audio.mjs` tổng hợp âm thanh Web Audio không cần file ngoài.
3. **Hướng 3 (Xoay 2 góc cho 12 Sinh vật huyền bí)**: Toàn bộ 12 loài sinh vật hỗ trợ đổi hướng nhìn (`↖ Góc chuẩn` / `↗ Nhìn phải`) trên bản đồ, trong bảng Chăm sóc sinh vật và từ nút `↻ Đổi hướng nhìn` ở khay tùy chọn.
4. **Hướng 4 (Lưu bền vững Visual Prefs, Cầu nối Mạng Floo & Tương thích iOS Safari 16.0+)**: `hpvn-bridge.mjs` lưu bền vững mọi góc xoay/thời tiết/âm thanh, hỗ trợ nút `✨ Khoe vườn lên Mạng Floo`, và đạt 93/93 unit tests (`node --test *.test.mjs`).
