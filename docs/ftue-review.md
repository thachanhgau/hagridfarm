# Duyệt ba phút đầu thay cho playtest (cổng tạm Phase 2)

> 17–18/10/2026 · Claude Code (Anthropic) · theo quyết định hoãn playtest với người thật (`playtest-plan.md` mục 0).
> **Giới hạn:** người duyệt là AI đã đọc code, nên không thay được người mới thật. Bản này chỉ tìm chỗ dễ kẹt và lỗi hiển thị; nó không đo được "vui" hay "muốn quay lại".

## 1. Test tự động `qa-v19/ftue-smoke.mjs`

WebKit (engine của Safari) chơi trọn 6 bước trên vườn mới tinh, mỗi cỡ màn hình một bộ nhớ riêng. Mỗi bước kiểm: lời Hagrid nằm trong màn, chữ ≥ 12 px, không che nút cần bấm; nút phát sáng nằm trong màn, không bị che, bật được trong 300 ms; luống và Puffskein nhìn thấy, chạm được; thư cú mở ra ở cuối; không có lỗi console.

```bash
WEBKIT_PATH=$HOME/Library/Caches/ms-playwright/webkit-2365/pw_run.sh node qa-v19/ftue-smoke.mjs
```

| Màn hình | Lần chạy đầu | Sau khi sửa |
|---|---|---|
| iPhone SE 320×568 | **Hỏng**: nút Bỏ qua đè lên Puffskein, chạm cho ăn thành bỏ qua cả hướng dẫn | Đạt |
| iPhone 13 390×664 | Đạt | Đạt |
| iPhone 13 ngang 750×342 | **Hỏng**: dock che Puffskein và luống | Đạt |
| iPad mini 768×1024 | Đạt | Đạt |
| Desktop 1280×720 | Đạt | Đạt |

Ảnh từng bước: `qa-v19/ftue-smoke/<màn hình>-<bước>.png` (chỉ lưu trên máy), kết quả: `qa-v19/ftue-smoke/report.json`.

## 2. Duyệt từng bước theo tiêu chí

Mức: **kẹt** (có thể không đi tiếp được) · **chậm** (đi tiếp được nhưng mất thời gian hoặc dễ nhầm) · **nhẹ** (khó chịu nhỏ).

| # | Bước | Vấn đề | Mức | Trạng thái |
|---|---|---|---|---|
| 1 | cho ăn | iPhone SE: nút Bỏ qua đè lên Puffskein; chạm thành bỏ qua | kẹt | **Đã sửa**: khung máy quay chừa HUD, dock và cột nút (`camera.frameWorld`, dùng chung vùng an toàn với `focusPlot`) |
| 2 | gieo, cho ăn | Màn ngang thấp: dock che luống và Puffskein | kẹt | **Đã sửa**: trong lúc hướng dẫn trên màn thấp, ẩn hàng hạt và thanh công cụ; bước cho ăn thu gọn dock; lấy lại khung sau khi dock đổi |
| 3 | cho ăn | Puffskein khách chỉ khoảng 14 px trên điện thoại, dưới mức chạm 44 px | kẹt | **Đã sửa**: vùng chạm của khách ≥ 44 px CSS ở mọi mức zoom |
| 4 | mọi bước | Lời Hagrid vẽ trong cảnh nên chỉ còn 6–7 px trên iPhone SE | chậm | **Đã sửa**: lời hướng dẫn là bóng thoại trên giao diện, chữ 13 px, bám theo đầu Hagrid, luôn trong màn |
| 5 | gieo | Lời "Chạm luống sáng…" nói sai thao tác (thứ cần bấm là nút Gieo) | chậm | **Đã sửa**: "Bấm nút sáng, gieo bí ngô nào!" |
| 6 | lớn, gặt | Toast "Nước phép!", "Đã gặt…" che lời Hagrid và trùng với chip +XP | chậm | **Đã sửa**: tắt toast báo thành công trong lúc hướng dẫn; toast báo lỗi vẫn giữ |
| 7 | gặt (và **mọi người chơi**) | Nút Gặt/Gieo mờ tới 1 giây sau mỗi thao tác (làm mới khi `busy` còn bật) | chậm | **Đã sửa**: làm mới thẻ cây ngay khi thao tác xong |
| 8 | mọi bước | Nút "Bỏ qua" bị cắt chữ hoặc đè lên dock ở vài cỡ màn | nhẹ | **Đã sửa**: canh dưới (màn ngang: bên trái) cột nút, nở theo chữ |
| 9 | thư cú | Mở thư thấy ngay 3/5 nhiệm vụ xong, có nhiệm vụ tên "Chế biến" nhưng được tính bằng việc gặt | chậm (nhầm) | **Còn**: thuộc thiết kế nhiệm vụ, để Phase 3 (kinh tế & tiến trình) |
| 10 | thư cú | Thư cú nhiều chữ so với phần còn lại của hướng dẫn | nhẹ | **Còn**: Phase 3 gộp/rút gọn bảng |
| 11 | cho ăn | Bóng "Đói…" chạm vào cột đậu của cú | nhẹ | **Còn** |
| 12 | mọi bước | Âm thanh và combo chưa nghe trên máy thật (WebKit chạy không tiếng) | — | **Chưa kiểm**: cần bước 3 của cổng tạm |

## 3. Kết luận cổng tạm

1. Test tự động: **đạt 5/5**.
2. Duyệt tiêu chí: **không còn vấn đề mức kẹt**; còn 2 vấn đề mức chậm/nhầm và 2 mức nhẹ, đều ghi sang Phase 3.
3. Chủ dự án tự chơi trên iPhone thật: **đang chờ**.

Khi bước 3 xong mà không có lỗi, Phase 2 qua cổng tạm và có thể sang Phase 3. Playtest với người thật vẫn bắt buộc trước khi mở beta.
