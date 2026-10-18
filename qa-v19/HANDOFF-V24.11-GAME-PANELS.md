# V24.11 — Các bảng ra chất game (nhánh `ui-game-panels`, 18/10/2026)

Agent: Claude Code (Anthropic). Chỉ đổi giao diện: không đổi luật chơi, không đổi dạng lệnh gửi server, không đụng hướng dẫn chơi hay thư bác Hagrid. Chưa nâng `?v=` (phiên chính nâng khi gộp vào `main`), chưa push.

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
- `cd garden-v05 && node --test *.test.mjs`: 198/198.
- FTUE WebKit 5/5; `hud-shots.mjs` 10/10; `panel-shots.mjs` 17 ảnh (390×664, 1280×720, 320×568 cho Cửa hàng và Hồ sơ): không tràn ngang, không `<select>`, nút ≥ 44 px. Ảnh trước/sau: `outputs/game-panels-shots/{before,wip}`, HUD: `outputs/game-panels-shots/hud`.

## Còn lại
- Nhánh dựa trên `0fa97f7`; câu hướng dẫn còn đè màn Lên cấp trong ảnh vì bản sửa `7eec45b` chỉ có trên `main`. Gộp `main` vào đây (hoặc ngược lại) trước khi duyệt.
- Bảng «Sắp xếp» (`layout()`) vẫn dùng `<select>` chọn nền; không nằm trong 9 ảnh của bệ hạ.
- Chưa chụp lại ở chế độ có ví (`server-daily-shots.mjs`).
