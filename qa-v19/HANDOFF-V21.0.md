# Handoff — Khu Vườn Hagrid V21.0

## 1. Phạm vi & Trạng thái hiện tại
- **Source directory**:
  `/Users/thachanh/.codex/visualizations/2026/10/13/01a1336a-1a81-7fd1-838a-938d62b6dd7d/garden-v05`
- **QA fixture directory**:
  `/Users/thachanh/.codex/visualizations/2026/10/13/01a1336a-1a81-7fd1-838a-938d62b6dd7d/qa-v19`
- **Live preview URLs (server port `62795` giữ nguyên)**:
  - Toàn cảnh V21.0:
    `http://127.0.0.1:62795/qa-v19/ui-fixture.html?wallet=emulator&qa=1&level=100&view=overview&v=21.0`
  - Bưu thiếp Rừng Cấm (`.png` Postcard Snapshot):
    `http://127.0.0.1:62795/qa-v19/ui-fixture.html?wallet=emulator&qa=1&level=100&view=postcard&v=21.0`
  - Sổ tay Người Giữ Vườn (Bách khoa Sinh thái 12 loài & 24 giống cây):
    `http://127.0.0.1:62795/qa-v19/ui-fixture.html?wallet=emulator&qa=1&level=100&view=almanac&v=21.0`
  - Bưu cục Cú & 3 Nhiệm vụ Hằng ngày:
    `http://127.0.0.1:62795/qa-v19/ui-fixture.html?wallet=emulator&qa=1&level=100&view=owl&v=21.0`

## 2. Những gì đã hoàn thành ở V21.0 (3 hướng nâng cấp)
1. **Hướng 1 — Nâng cấp Pixel-Art cho 12 Đài Kỷ Vật Sinh Vật & 29 Trang Trí Lối Đi trên Canvas (`scene-renderer.mjs`)**:
   - `drawKeepsake` dựng đài đá bậc thang viền đồng vàng, gắn ngọc biểu trưng theo loài và đặt **tượng thu nhỏ pixel-art của chính loài sinh vật đó** (`items.get(species)?.frames?.[3]`) kèm hào quang vàng lấp lánh 4 nhịp và huy hiệu số lượng `×N`.
   - Cho phép chạm trực tiếp vào Đài kỷ vật ở lối đi phía Nam (`pick` trả về `{kind: 'keepsake', species, count}`) để phát âm thanh vinh danh và hiện thông tin kỷ vật.
   - `drawDecorationShape` & `drawDecoration` bổ sung hoạt ảnh 4 nhịp (`phase = 0..3`) cho cả 29 mẫu trang trí lối đi (hoa đung đưa theo gió, mặt nước gợn sóng ở hồ/bồn tắm chim, đèn lồng tỏa sáng, kính viễn vọng lấp lánh) và giữ nguyên hỗ trợ lật 2 góc (`↖` / `↗`).
2. **Hướng 2 — "Bưu thiếp Rừng Cấm" (Chụp ảnh PNG đóng khung Hogwarts) & "Sổ tay Người Giữ Vườn" (`garden-postcard.mjs`, `progression-panels.mjs`)**:
   - Nút `📸` ngay trên thanh HUD (hoặc trong Menu / Hành trình) mở hộp thoại **Bưu thiếp Kỷ niệm Khu Vườn Hagrid**, kết xuất trực tiếp `<canvas id="world">` lên khung giấy da rừng thẫm 960×620 kèm con dấu sáp đỏ chữ `H`, tên người chơi, cấp độ, chương không gian, thời tiết và thống kê vườn; hỗ trợ tải file `.png` về máy hoặc khoe lên Mạng Floo.
   - Thêm tab **Sổ tay Người Giữ Vườn (`almanac`)** liên kết trực quan toàn bộ 12 chuỗi sinh thái (`Hạt giống → Nông sản → Công thức Chế biến → Khẩu phần → Sinh vật → Sản vật & Đài kỷ vật`) cùng bảng tra cứu đầu ra của 24 giống cây thảo dược.
3. **Hướng 3 — "Thư Cú Hằng Ngày" (3 Nhiệm vụ Thư giãn từ Bác Hagrid, Giáo sư Sprout & Tiệm Hẻm Xéo) (`garden-quests.mjs`, `wizard-ui.mjs`)**:
   - Nâng cấp hộp thoại `#owlLetter` thành **Bưu cục Cú & Nhiệm vụ Hằng ngày** với 3 lời nhờ cậy thư giãn mỗi ngày (`quest_hagrid_harvest`, `quest_sprout_craft`, `quest_hemxeo_creature`).
   - Tự động ghi nhận tiến độ khi người chơi gieo/gặt/chăm cây, chế biến, cho ăn/vuốt ve sinh vật hoặc xoay góc trang trí; tặng thưởng vật tư hữu ích (`+2 Bộ vật liệu`, `+15 Nước suối & +3 Bí ngô`, `+1 Phân bón & +1 Bộ vật liệu`) lưu vào `localStorage` (`hpvn-garden-v21-owl-quests`) mà không làm lệch đường cong cân bằng XP 1–100.

## 3. Kiểm thử
- Toàn bộ **97/97 tests** trong `garden-v05` (`node --test *.test.mjs`, bao gồm `v21-features.test.mjs` và kiểm tra tương thích iOS Safari 16.0+) đều pass 100%.
- Git worktree `/Users/thachanh/Downloads/HPVNN.nosync` giữ nguyên sạch sẽ.
