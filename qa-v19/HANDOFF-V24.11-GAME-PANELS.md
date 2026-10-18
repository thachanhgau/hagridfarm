# V24.11 — Các bảng ra chất game (nhánh `ui-game-panels`, 18/10/2026)

Agent: Claude Code (Anthropic). Chỉ đổi giao diện: không đổi luật chơi, không đổi dạng lệnh gửi server, không đụng hướng dẫn chơi hay thư bác Hagrid. Đã gộp `main` 7eec45b vào nhánh (thư bác Hagrid, câu hướng dẫn tránh bảng); `?v=24.9.35` theo `main`, nhánh không tự nâng thêm. Chưa push, chưa gộp vào `main`.

## Đã làm
- **Khung bảng** (`game-panels.css`, nạp sau cùng): khung gỗ pixel 9 mảnh, bảng tên tiêu đề, nút đóng pixel, tab icon to, một font tiêu đề/số (`--gp-display`) và một font nội dung (`--gp-body`), không còn chữ monospace cho nhãn tiếng Việt. Thanh cuộn mảnh màu vàng.
- **Ô icon thay thẻ chữ**: Thành tựu, Sổ tay (chuỗi Cây → Thức ăn → Sinh vật), Lộ trình (chương, tab khoảng cấp, tab loại), Trang trí, Kỷ vật. Ô khóa = mờ + ổ khóa + số cấp; phần thưởng là chip icon + số; nút chính sáng, nút phụ là nút icon nhỏ. Bỏ «▶ Điều kiện».
- **Cửa hàng**: ô vật phẩm, giá bằng xu, bộ đếm −/+ thay `<select>`, «Nối ví» là huy hiệu khóa nhỏ.
- **Lên cấp**: huy hiệu cấp lớn, pháo hoa pixel (tắt khi giảm chuyển động), ô mở khóa, một nút «Tiếp tục».
- **Lễ hội**: tranh Quidditch mới `v24-art/event-quidditch.webp` 640×360 vẽ bằng code (`build-quidditch-art.mjs`, đúng `palette.mjs`, ghi trong `provenance.json`); mốc thưởng thành đường đua icon. Lưu bút dạng thư; gỡ emoji khỏi bảng.
- **Cảnh**: bong bóng «Đói…» pixel nhỏ neo trên sinh vật, không đè cú; quầng sáng đêm pixel sắc nét thay vệt mờ; chip mục tiêu luôn nằm trong màn hình (320 px khi mở HUD: thu khoảng cách trong chip, `icon-hud.css`).
- Xóa các luật `!important` cũ của markup cũ trong `wizard-ui.css` (cửa hàng, tab Lộ trình, `v24-event-choice`).
- «Dạ vũ Noel» giữ nguyên: HP4 bản Lý Lan dùng cả «Dạ vũ Noel» (2 lần) lẫn «Dạ vũ Giáng sinh» (tên chương), bảng thuật ngữ đã kiểm ghi «Dạ vũ Noel».

## Kiểm chứng (cổng 62801)
- Sau khi gộp `main`: `cd garden-v05 && node --test *.test.mjs` 204/204.
- FTUE WebKit 6/6; `hud-shots.mjs` 10/10; `panel-shots.mjs` (mở thư bác Hagrid trước khi chụp màn Lên cấp/đêm) 17 ảnh (390×664, 1280×720, 320×568 cho Cửa hàng và Hồ sơ): không tràn ngang, không `<select>`, nút ≥ 44 px. Ảnh trước/sau: `outputs/game-panels-shots/{before,after}`, HUD: `outputs/game-panels-shots/hud`.

## Còn lại
- Gộp vào `main` khi bệ hạ duyệt (fast-forward được nếu `main` không đổi thêm), rồi nâng `?v=`.
- Bảng «Sắp xếp» (`layout()`) vẫn dùng `<select>` chọn nền; không nằm trong 9 ảnh của bệ hạ.
- Chưa chụp lại ở chế độ có ví (`server-daily-shots.mjs`).

## Thư cú (nhánh `ui-owl-mail`, từ `ui-game-panels`, 18/10/2026)
- Hộp thư `#owlLetter` dùng chung khung gỗ, bảng tên, nút đóng pixel: `#owlLetter` được thêm vào nhóm `P` của `game-panels.css`; khối riêng ở cuối tệp.
- **Rương Cú Vàng** thành dải hero: icon rương to, «Chuỗi N ngày», thanh n/3, chip +1 Nước phép · +12 Nước · +20 điểm lễ hội (chip lễ hội mới trong `rewardChips` khi phần thưởng có `eventPoints`). Chưa đủ: rương mờ + ổ khóa, nút khóa mờ; đủ: nút vàng «Mở»; đã mở: dấu tích.
- **Mỗi thư** là ô icon (3 cột ở mọi cỡ màn): icon việc cần làm (gieo, gặt, chế biến, cho ăn, thu), tên ngắn, thanh tiến độ, số, chip thưởng; xong thì nút vàng «Nhận», chưa xong thì nút mũi tên dẫn tới nơi làm (tên đầy đủ trong aria-label), đã nhận thì mờ + dấu tích.
- Giữ nguyên các lệnh server (`claimQuest`, `claimChest` qua `onClaimDailyQuest`/`onClaimGrandChest`) và các thuộc tính `data-claim-owl-quest`, `data-letter-grand-chest`, `data-route-daily-quest`, lớp `owl-quest-card is-claimed`.
- Xóa CSS chết của thư giấy da cũ (`owl-quest-*`, `v24-owl-row*`, `owl-grand-chest-bar`, `letter-seal/close/kicker/signature`). `qa-v19/ui-fixture.html` chép lại từ `index.html` (bản cũ thiếu `game-panels.css`).
- Kiểm chứng (cổng 62803): unit 204/204; FTUE 6/6; `hud-shots` 10/10; `panel-shots.mjs` (thêm ca Thư cú, đối số thứ ba `owl` để chỉ chụp Thư cú) đủ 26 ảnh, không tràn ngang, không `<select>`, nút ≥ 44 px; `server-daily-shots` phần thư cú + rương đạt. Ảnh: `outputs/owl-mail-shots/{before,after,server-daily}`.
- Còn lại: `server-daily-shots` dừng ở bước xoay đồ trang trí (tìm nút «Xoay sang ↗ Góc phải») — lỗi có sẵn trên `ui-game-panels`, không do nhánh này.
