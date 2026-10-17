# Khu Vườn Hagrid — Art bible

> **Trạng thái:** ĐÃ DUYỆT 17/10/2026 (chủ dự án: "đồng ý và làm tiếp"), các đề xuất [CẦN QUYẾT] được chấp nhận như ghi · 17/10/2026 · Claude Code (Anthropic)
> Áp dụng cho mọi asset mới, dù do người vẽ, Codex, Claude hay công cụ tạo ảnh làm ra. Mục **[CẦN QUYẾT]** là đề xuất.
> Số liệu "hiện trạng" đo từ `motion-data.js`, `level-assets.js`, `motion-care-data.js` và mã nguồn ngày 17/10/2026.

## 1. Năm luật cứng

1. **1 pixel nguồn = 1 pixel trong game ở zoom 1.** Không scale lẻ. Zoom camera chỉ dùng hệ số nguyên khi có thể, luôn `imageSmoothingEnabled = false` và `image-rendering: pixelated`.
2. **Chỉ dùng 32 màu chuẩn** (mục 3): 24 màu sprite + 8 màu cảnh. Thời tiết, đêm và lễ hội đổi **ánh sáng** (lớp phủ, tint), không thêm màu mới vào sprite.
3. **Nguồn sáng trên–trái.** Mặt hướng trái/trên sáng hơn, bóng đổ xuống phải–dưới. (Đã đối chiếu với lều Hagrid và Bằng Mã.)
4. **Viền tối chọn lọc:** viền ngoài dùng `#231F2E` hoặc màu tối nhất trong ramp của vật; không viền đen thuần, không viền trắng.
5. **Ảnh minh hoạ không vào cảnh chơi.** Tranh khổ lớn (bìa, màn chọn lễ hội/thời tiết) đặt trong UI. Mọi thứ đứng trong vườn phải là sprite theo luật 1–4.

## 2. Lưới và phối cảnh

- Isometric 2:1, ô **64 × 32 px** (`tileWidth`/`tileHeight` trong `scene-data`).
- Thửa đất 3 × 3 ô (9 chỗ trồng); chuồng 5 × 3 ô (2 chỗ sinh vật).
- Mọi sprite có **pivot ở chân**, tức điểm chạm đất. Thứ tự vẽ theo `y` của pivot.
- Vật lớn (2 × 2 ô trở lên) đặt cách rào ít nhất 0,9 ô để thân không đè lên rào (đã sửa ở V24.9).

## 3. Bảng màu chuẩn: 32 màu (24 sprite + 8 cảnh)

Ảnh: [`palette.svg`](palette.svg). Nguồn duy nhất trong code: `garden-v05/palette.mjs`. 24 màu sprite là bảng **đang dùng sẵn** trong cả ba manifest asset.

| Dải | Tối → sáng | Dùng cho |
|---|---|---|
| Gỗ · da · bóng tối | `#231F2E` `#4A3042` `#735044` `#A57554` | Viền, gỗ, đất tối, lông nâu |
| Đá · kim loại · kem | `#41465C` `#687486` `#A6B1AE` `#D6D8BF` | Mái, đá, kim loại, lông sáng |
| Cỏ · lá | `#24483F` `#3F6A45` `#71934B` `#B0BD67` | Cỏ, lá, rêu |
| Đất · ánh ấm | `#8B4A3F` `#C97952` `#E7AE73` `#F5D69A` | Đất trồng, da, điểm sáng ấm, chữ vàng UI |
| Lửa · bí ngô | `#874056` `#C75B4B` `#ED8A45` `#FFC36B` | Bí ngô, lửa, đèn, quả chín |
| Phép · đêm · nước | `#3E3B70` `#6961A6` `#70A8B6` `#B7DEE0` | Phép thuật, đêm, nước, băng |

**8 màu cảnh** (thêm ngày 17/10/2026, V24.9.2) cho những gì sprite chưa cần: `#142620` rừng đêm sâu · `#4A3C2C` nâu đất trung tính · `#5D6046` `#777044` ô liu · `#B49A66` đá lối đi, rơm · `#E8F0ED` tuyết, điểm sáng trắng · `#B378FF` phép tím sáng · `#E07A9E` hồng (tim, hoa). Chọn bằng cách phân cụm 309 màu lệch cũ; với bảng 24 màu, đá lối đi bị đẩy thành cam và đom đóm tím thành xám.

Quy tắc dùng:
- Sprite chỉ dùng 24 màu sprite; 8 màu cảnh dành cho địa hình, thời tiết, hiệu ứng.
- Một vật dùng tối đa **2–3 dải**; đổ bóng bằng màu tối hơn **trong cùng dải**, không trộn xám.
- Muốn thêm màu thứ 33 thì phải sửa tài liệu này và `palette.mjs` trước.

**Đã sửa (V24.9.2):** khoảng 300 mã màu lệch trong 17 file vẽ bằng code đã được đưa về màu gần nhất trong bảng 32 (đo OKLab; trung vị lệch 0.039, tối đa 0.119). Riêng tuyết của chuồng và cỏ tuyết quanh chuồng được chỉnh tay để không thành màu nước. `palette.test.mjs` sẽ báo lỗi nếu module nào dùng mã màu ngoài bảng. CSS của giao diện **chưa** chuyển, làm ở bước UI.

## 4. Kích thước theo tầng

Đo phần có nội dung (không tính viền trong suốt) ở giai đoạn trưởng thành:

| Tầng | Chiều cao hiện có | Loài | Chiếm chỗ |
|---|---|---|---|
| Cây trồng | 27–66 px, rộng ≤ 54 px | 24 loại | 1 ô |
| Sinh vật nhỏ | 20–39 px | Puffskein, Niffler, Bowtruckle | 1 ô |
| Sinh vật vừa | 58–88 px | Kneazle, Mooncalf, Fwooper, Diricawl | 1–2 ô |
| Sinh vật lớn | 95–130 px | Bằng-Mã, kỳ lân, vong mã, chó ba đầu, rồng | 2–3 ô |
| Công trình | ~150–210 px | Lều, nhà kính, cụm lễ hội | Theo bố cục |

Quy tắc:
- Sinh vật mới phải rơi vào đúng một tầng. Trong một tầng, chênh lệch không quá ±20%.
- Các giai đoạn lớn lên (sơ sinh → trưởng thành) dùng **cùng mật độ pixel**, chỉ khác số pixel.
- Tên sinh vật và địa danh theo bản dịch **Lý Lan** (xem `core-design.md` mục 7).

## 5. Chuyển động

| Loại | Số frame tối thiểu | Ghi chú |
|---|---|---|
| Lớn lên (cây, sinh vật) | 4 | Hạt → mầm → đang lớn → trưởng thành |
| Đứng yên (idle) | 2–4, vòng lặp ≥ 1,2 giây | Thở, lá rung; chân/gốc **không** dịch chuyển |
| Hành động (gặt, cho ăn, vuốt ve) | 4–6 | Có nhịp chuẩn bị → đỉnh → hồi |
| Hiệu ứng (hạt, sao, tim) | 3–5 | Vẽ bằng pixel trong bảng màu |

- Mọi chuyển động đứng yên đúng khi bật "Giảm chuyển động".
- Chuyển động vẽ bằng code chỉ dịch **số nguyên pixel**.

**Hiện trạng không đồng đều:**
- 6 cây đầu (bí ngô, cúc trắng, dâu tây, bạch tiên, puffapod, mandrake) có 12 frame; **18 cây sau chỉ có 4 frame lớn lên, chưa có idle/hành động riêng**.
- 6 sinh vật đầu có 12 frame; 6 loài sau có 8 frame cộng bộ ăn/chăm sóc riêng.
- Ưu tiên cho Phase 1: bổ sung idle và hành động cho cây và sinh vật **xuất hiện trong 3 phút đầu và vòng 5 phút**, không làm cả 36 loài một lúc.
- **Đã làm (V24.9.5):** ba phút đầu chỉ dùng bí ngô và Puffskein, vốn đã đủ 12 frame. Vòng 5 phút ở cấp 1–12 thêm yến mạch, cà rốt, xà lách: `build-idle-assets.mjs` dựng 7 frame mới cho mỗi loại từ chính frame trưởng thành, bằng cách dịch nguyên dải hàng pixel (ngọn lay tối đa 2 px, rướn 1 px). Phần gốc đứng yên: 25% chiều cao, cà rốt 42% để củ không lệch. Không resample, không thêm màu; `idle-assets.test.mjs` kiểm tra. Đây là cách tạm hợp lệ khi chưa có hoạ sĩ; frame vẽ tay vẫn đẹp hơn và có thể thay sau, cùng chỉ số frame.
- Cây chín ở luống đang chọn phát clip hành động "giật" khoảng 3,4 giây một lần (1,5 giây trong bước gặt của hướng dẫn). Áp dụng cho cả 6 cây gốc, trước đây có clip nhưng chưa phát.

## 6. Giao diện (UI)

- Khung, nút và chữ dùng màu từ bảng chuẩn: nền dải "Cỏ · lá" tối, viền và chữ nhấn dải "Đất · ánh ấm".
- Icon vật phẩm dùng **chính sprite trong game** thu nhỏ theo bội số nguyên, không vẽ icon kiểu khác.
- Giảm emoji hệ thống trong nút chính: emoji hiển thị khác nhau trên iOS và Android, lệch style pixel.
- Chữ số trong game (`+3`, `2/5`) **[CẦN QUYẾT]**: đề xuất dùng font pixel có hỗ trợ tiếng Việt cho số và nhãn ngắn. Phải kiểm tra đủ dấu tiếng Việt trước khi chọn; nếu không có font đạt thì giữ font hệ thống.

## 7. Ảnh tạo bằng AI

- Được dùng làm **concept** và **ảnh minh hoạ UI** (khổ 640 × 360 như bộ `v24-art`).
- Muốn đưa một vật từ ảnh AI vào cảnh chơi, phải: vẽ lại hoặc thu về **đúng lưới pixel thật** (không chỉ resize), lượng tử về 24 màu, kiểm tra viền theo luật 4.
- Không vẽ chữ vào ảnh. Ghi prompt, nguồn và hash vào `provenance.json` như các bộ hiện có.

## 8. Checklist nhận một asset mới

- [ ] Kích thước đúng tầng (mục 4), pivot ở chân
- [ ] Chỉ dùng 24 màu; viền và hướng sáng đúng luật
- [ ] Đặt cạnh 3 asset cũ cùng tầng trong cảnh thật: cùng độ chi tiết, cùng mật độ pixel
- [ ] Đủ frame theo mục 5; bật "Giảm chuyển động" thì đứng yên
- [ ] Xem ở zoom nhỏ nhất trên điện thoại 375 px: vẫn nhận ra vật
- [ ] Xem đủ 4 thời tiết và 3 thời điểm ngày/đêm
- [ ] Có ghi nguồn (`provenance`) và cập nhật manifest

## 9. Việc kiểm toán cho Phase 1

1. ~~Tạo `palette.mjs`, đưa màu vẽ bằng code về bảng~~ (xong V24.9.2). Còn lại: CSS giao diện.
2. ~~Bổ sung idle và hành động cho cây và sinh vật của 3 phút đầu và vòng 5 phút~~ (xong V24.9.5). Còn 15 cây từ cấp 28 trở lên: thêm id vào `IDLE_TARGETS` rồi chạy lại script.
3. So tầng kích thước trong cảnh thật, sửa loài nào lệch quá ±20%.
4. Thay emoji ở 6 nút chính bằng icon pixel.
