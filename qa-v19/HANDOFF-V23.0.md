# Handoff — Khu Vườn Hagrid V23.0 (Lễ Hội Hogwarts, 5-Heart Creature Affinity, 5-Task Daily Owl Post + Grand Chest & Guestbook)

## 1. Tổng quan trạng thái V23.0
- **Source directory**: `/Users/thachanh/.codex/visualizations/2026/10/13/01a1336a-1a81-7fd1-838a-938d62b6dd7d/garden-v05`
- **QA fixture directory**: `/Users/thachanh/.codex/visualizations/2026/10/13/01a1336a-1a81-7fd1-838a-938d62b6dd7d/qa-v19`
- **SHA-256 manifest**: `/Users/thachanh/.codex/visualizations/2026/10/13/01a1336a-1a81-7fd1-838a-938d62b6dd7d/qa-v19/v23.0-sha256.json`
- **Live HTTP preview server** (chạy trên port `62795`):
  - Giao diện Khu Vườn Hagrid V23.0: `http://127.0.0.1:62795/qa-v19/ui-fixture.html?wallet=emulator&qa=1&level=100&view=overview&v=23.0`
  - Mô phỏng nhúng `/phongsinhoatchung` (`embed-preview.html`): `http://127.0.0.1:62795/qa-v19/embed-preview.html?v=23.0`
- **Automated Test Suite**: **107/107 tests PASS** (`node --test *.test.mjs` trong `garden-v05`).

---

## 2. Chi tiết 4 trụ cột nâng cấp ở V23.0

### Trụ cột 1 — EVENT: Lễ Hội Hogwarts Theo Mùa (`garden-events.mjs`, `scene-renderer.mjs`)
- **3 Lễ Hội Hogwarts chủ đề + Tắt lễ hội (`HOGWARTS_EVENTS`)**:
  1. `🎃 Đêm hội Bí ngô` (`event_halloween` — tự động chuyển bầu trời Đêm Rừng Cấm + Lá thu bay + 22 đom đóm/bào tử bí ngô vàng cam).
  2. `🎄 Dạ vũ Giáng sinh` (`event_yule` — tự động chuyển Đêm Rừng Cấm + Tuyết Giáng sinh + 26 tinh thể pha lê băng lấp lánh).
  3. `🌿 Hội chợ Thảo dược` (`event_herbology_fair` — tự động chuyển Ban ngày + Mưa phùn Thảo dược + 20 bào tử thảo dược xanh ngọc).
  4. `🕊️ Thường ngày` (`none` — tắt hiệu ứng lễ hội).
- **Tích điểm Lễ Hội & 3 Mốc Thưởng (`30 / 75 / 150 Điểm Lễ Hội`)**:
  - Mốc 1 (`30 điểm`): `+18 Nước giếng & +2 Bộ vật liệu`.
  - Mốc 2 (`75 điểm`): `+25 Nước giếng, +2 Phân bón & +2 Bộ vật liệu`.
  - Mốc 3 (`150 điểm`): `+35 Nước giếng, +4 Bộ vật liệu & +3 Phân bón`.
- **Đồng bộ Đa Tầng**:
  - Lưu trữ bền vững tại `localStorage` (`hpvn-garden-v23-events`) và `visualPrefs.eventMode`.
  - Lời thoại của bác Hagrid (`hagridSpeechFor`), Thiệp Bưu Thiếp Hogwarts (`garden-postcard.mjs`), thông điệp khoe vườn lên Mạng Floo và `hpvn:host:set-event` trong `hpvn-bridge.mjs` đều nhận biết lễ hội đang bật.

### Trụ cột 2 — DAILY TASK: 5 Nhiệm Vụ Cú Đưa Thư, Chuỗi Ngày Liên Tiếp & Rương Cú Vàng (`garden-quests.mjs`, `wizard-ui.mjs`)
- Mở rộng bảng **Thư Cú Hằng Ngày (`#owlLetter`)** và bảng **Lễ Hội & Nhiệm Vụ** lên **5 nhiệm vụ mỗi ngày**:
  - 3 nhiệm vụ cốt lõi: Bác Hagrid (`Gieo hoặc gặt 3 luống cây`), Giáo sư Sprout (`Chế biến 1 mẻ nguyên liệu`), Newt Scamander (`Cho ăn hoặc vuốt ve sinh vật 2 lần`).
  - 2 nhiệm vụ mở rộng V23.0: **Đoàn Huynh Trưởng** (`Thăm & giúp đỡ 1 Khu Vườn Danh Dự`) và **Ban Lễ Hội Hogwarts** (`Đạt 30 Điểm Lễ Hội trong ngày`).
- **Chuỗi Ngày Chăm Vườn (`🔥 Streak Days`)**: Tự động cộng chuỗi ngày liên tiếp khi người chơi mở vườn qua các ngày kế tiếp.
- **Rương Cú Vàng Hằng Ngày (`🎁 Rương Cú Vàng · 3/5 nhiệm vụ`)**:
  - Mở khóa ngay khi hoàn thành từ `3/5` nhiệm vụ trong ngày.
  - Phần thưởng lớn: `+25 Nước giếng, +3 Bộ vật liệu, +2 Phân bón & +50 Điểm Lễ Hội`.

### Trụ cột 3 — GAMEPLAY: Độ Gắn Kết Sinh Vật 5 Cấp Tim & Vuốt Ve (`garden-events.mjs`, `progression-panels.mjs`, `scene-renderer.mjs`)
- **Hệ thống 5 Cấp Tim Gắn Kết (`CREATURE_AFFINITY_LEVELS`)**:
  - `🌱 Cấp 1 — Làm quen` (`0 XP`)
  - `💛 Cấp 2 — Thân thiết` (`20 XP` — Quà sinh vật: `+12 Nước giếng`)
  - `🧡 Cấp 3 — Quấn quýt` (`50 XP` — Quà sinh vật: `+2 Bộ vật liệu`)
  - `❤️ Cấp 4 — Tri kỷ` (`100 XP` — Quà sinh vật: `+2 Phân bón & +15 Nước`)
  - `👑 Cấp 5 — Tâm giao Huyền thoại` (`180 XP` — Quà sinh vật: `+3 Bộ vật liệu & +25 Nước`)
- **Tương tác Vuốt Ve 1-Chạm (`🤗 Vuốt ve`)**:
  - Nút `🤗 Vuốt ve (+12 ♥)` ngay trên thẻ sinh vật trong Chuồng Nuôi hoặc bảng Lễ Hội, phát âm thanh chăm sóc, tung hiệu ứng chùm tim bay trên Canvas (`scene-renderer.mjs`), cộng điểm Lễ Hội và tiến độ nhiệm vụ Newt Scamander.
  - Hiển thị huy hiệu `♥Lv2..♥Lv5` trực tiếp dưới chân sinh vật trên sân cỏ isometric.

### Trụ cột 4 — UI / UX: Nút HUD Lễ Hội, Sổ Lưu Bút Khách Thăm & Bảng Tổng Hợp (`wizard-ui.mjs`, `wizard-ui.css`, `embed-preview.html`)
- **Nút HUD `#eventButton`** trên thanh công cụ trên cùng (có chấm sáng vàng `.has-claimable` khi có mốc thưởng Lễ Hội, Rương Cú Vàng hoặc Quà Sinh Vật chờ nhận).
- **Sổ Lưu Bút Khách Thăm (`buildGuestbookEntries`)**: Bác Hagrid, Giáo sư Sprout, Newt Scamander và Charlie Weasley để lại lời nhắn động tùy theo cấp vườn, lễ hội đang mở, số vườn hàng xóm đã giúp và tổng cấp gắn kết sinh vật.
- **Tương thích iOS Safari 16.0+ tuyệt đối**: Toàn bộ `.mjs` trong `garden-v05` và `qa-v19` vượt qua bài kiểm tra AST/source compatibility (không regex lookbehind, không CSS nesting, không API ES2024+).
