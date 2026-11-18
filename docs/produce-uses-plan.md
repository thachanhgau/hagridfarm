# Sản vật sinh vật có tác dụng — plan (18/11/2026)

Owner 18/11/2026: «lên plan để khi thu thập đủ thì có tác dụng thay vì chỉ là sưu tập».
Trạng thái: **chờ owner duyệt**. Chưa có dòng code nào ngoài «Bón phân trăng» (đã làm, chưa release).

## 1. Hiện trạng (đã kiểm trong code HPVN `functions/games`, 18/11)

| Chỗ tiêu sản vật | Mức | Ghi chú |
|---|---|---|
| Bán chợ | `ceil(min(level, 94)/3)` G, tối đa 32 G | Trần chống lời–lỗ (fence #41–#44); trần bán 2.500 G/ngày, 5.000–10.000 G hàng giá cao |
| Đơn hàng ngày | 3 đơn/ngày | Chỉ lấy sản vật của con đã lớn |
| Đổi kỷ vật | 5 sản vật → 1 kỷ vật | Kỷ vật chỉ để bật «đài kỷ vật» (trang trí) |
| Công thức | `elf_hat`, `elf_sock` | Chỉ Len quái lùng nhùng |
| Bón phân trăng | 1 gói/thửa/ngày | Mới làm 18/11, chỉ Bê trăng |

Thành viên đang tồn 50–223 món mỗi loại (ảnh owner gửi 18/11) → sản vật đang thừa vì gần như không có chỗ tiêu.

## 2. Thiết kế: hai tầng

**Tầng 1 — «Ấn kỷ vật» (dùng mãi).** Dựa trên kỷ vật sẵn có. Mỗi loài có 3 bậc theo **số kỷ vật đã đổi**:
Bậc I = 5 kỷ vật (25 sản vật), Bậc II = 15 (75), Bậc III = 40 (200). Mỗi bậc cho một hiệu ứng nhỏ, hợp với tính cách con vật.
Kỷ vật đã đổi không trả lại được, nên đây là chỗ tiêu thật. Server tính bậc từ `progression.keepsakes`, client chỉ hiển thị.

**Tầng 2 — «Dùng ngay» (tiêu hao, có lượt/ngày).** Như phân bón trăng: bấm là tốn sản vật, có tác dụng ngay. Chỉ làm cho vài loài hợp lý (bảng dưới).

## 3. Hiệu ứng từng loài

Cột «Điểm nối» là hằng số/hàm đã thấy trong code; dấu **(xác minh)** = chưa tìm ra điểm nối chắc chắn, P0 phải rà trước.

| Loài · sản vật | Ấn I / II / III | Dùng ngay | Điểm nối |
|---|---|---|---|
| Quái lùng nhùng · Len | Tâm trạng mọi bé giảm chậm 10 / 20 / 30% | (đã có: mũ, vớ gia tinh) | mood-core `decayRate` |
| Que Xạo · Mảnh vỏ cành | Cây lâu năm ra quả sớm 6 / 12 / 18 giờ (gốc 72 giờ) | — | orchard-core `TREE_MS` |
| Đào mỏ · Cúc áo | Đơn hàng ngày +5 / 10 / 15% XP (không thêm Galleon) | — | retention-core `deliverOrder` |
| Bê trăng · Phân bón trăng | Một gói bón lùi 9 / 13 / 18 ô | **Bón phân trăng** (đã làm) | soil-core `fertilizeAction` |
| Kneazle · Sợi lông | Cây chín để lâu mới khô: 24 → 27 / 30 / 36 giờ | — | duty-core `WILT_MS` |
| Diricawl · Lông vũ | Chu kỳ sản vật mọi bé −5 / 10 / 15% | — | garden-creatures (xác minh: thêm sản vật để bán thì vẫn bị trần bán chợ chặn) |
| Fwooper · Lông vũ bốn màu | Ngưỡng «vui» được thưởng thêm sản vật: 80 → 75 / 70 / 65 | — | mood-core `HAPPY` |
| Bằng-Mã · Lông cánh | Nước tưới: mỗi lần mua tặng thêm 5 / 10 / 15% | — | (xác minh) |
| Vong mã · Sợi bờm | Hagrid trông vườn được thêm 1 / 2 / 3 ngày | — | duty-core `leave.days` (xác minh trần) |
| Kỳ lân · Sợi bờm | Bé ít ốm hơn: ngưỡng ốm 25 → 22 / 18 / 15 | **Chữa bệnh**: 3 sợi bờm chữa 1 bé, 1 lần/ngày (thay Galleon / Thuốc Mọc Xương) | duty-core `SICK_MOOD`, `treat` |
| Chó ba đầu · Sợi lông trắng | «Đốt vườn» thật cháy chậm hơn 10 / 20 / 30% | — | fire-core (xác minh) |
| Rồng · Vảy | Chế biến nhanh hơn 5 / 10 / 15% | — | recipe `hours` |
| Thủy quái · Rong | Hồ đục chậm hơn: 2 → 2,5 / 3 / 4 ngày | **Vớt rêu**: 5 rong làm sạch hồ ngay, 1 lần/ngày | pond-core `MURKY_AFTER` |
| Chó đuôi nĩa · Vòng cổ | Ma lùm cắn chậm hơn: 6 → 7 / 8 / 9 giờ | — | duty-core `GNOME_BITE_MS` |
| Nhím quậy · Lông gai | Đất mệt nhẹ hơn: mỗi vụ −25% → −22 / −20 / −18% | — | soil-core `TIRED_STEP` |
| Kỳ nhông lửa · Tro | Sương giá làm cây 8 giờ chậm ×1,5 → ×1,4 / ×1,3 / ×1,2 | — | soil-core `growFactor` |
| Ma da · Vảy | Câu cá: vùng giật cần rộng hơn 5 / 10 / 15% | — | pond-core cast `zone` |
| Ngựa lùn · Lông bờm | Bãi chăn: tâm trạng giảm chậm thêm 10 / 20 / 30% | — | mood-core `PASTURE_DECAY` |

## 4. Rào chắn (nối tiếp fence #64)

- **#65** Không Ấn hay «Dùng ngay» nào tạo Galleon trực tiếp; chỉ đổi thời gian, tỉ lệ, XP trong vườn của chính người đó.
- **#66** Bậc do server tính từ `keepsakes`; client không gửi bậc hay hiệu ứng.
- **#67** Kỷ vật không bán, không chuyển. P0 phải xác minh sản vật có đường nào chuyển giữa thành viên không; nếu có, Ấn vẫn tối đa Bậc III nên tài khoản phụ chỉ giúp lên nhanh hơn, không vượt trần.
- **#68** Cộng dồn với kỹ năng mùa 2 và fence cũ không vượt sàn cũ: #49 (đất mệt + thời tiết + khô ≥ 50%), trần giá chợ #41–#44, trần bán ngày.
- **#69** Kỷ vật đã đổi không trả lại thành sản vật.
- **#70** «Dùng ngay» có lượt/ngày theo ngày VN, server giữ, chống bấm hai tab (kiểu `fed` của phân bón trăng).

## 5. Giao diện

Theo luật owner: một khung, ô danh sách riêng, dữ liệu không lời giải thích, không emoji.
Thẻ trong «Bộ sưu tập»: `Ấn II · 15/40` và một dòng hiệu ứng (`Tâm trạng giảm chậm 20%`). Nút đổi thêm `×5` và `Đổi hết` (thay vì bấm từng cái một).
«Dùng ngay» đặt cạnh việc nó giúp: chữa bệnh trong bảng bé ốm, vớt rêu trong bảng hồ, bón phân trong «Gieo & chăm cây».

## 6. Phân kỳ (mỗi phần một phiên)

| Phần | Việc | Nghiệm thu |
|---|---|---|
| P0 | Rà 6 điểm nối «xác minh»; đọc chỉ-đọc kho thật (phân bố sản vật, kỷ vật) để chốt mốc 5/15/40 | Bảng số liệu + mốc chốt |
| P1 | Lõi `keepsakeTier`, thẻ Bộ sưu tập, nút đổi ×5/hết, 6 Ấn dễ: Len, Mảnh vỏ, Phân bón, Sợi lông Kneazle, Rong, Vòng cổ | Test lõi + fence #65–#69; thử trên emulator |
| P2 | 6 Ấn tiếp: Cúc áo, Lông vũ bốn màu, Sợi bờm Kỳ lân, Vảy Rồng, Lông gai, Lông bờm | Test từng hiệu ứng + #68 |
| P3 | 6 Ấn còn lại (sau P0) + «Dùng ngay» Chữa bệnh, Vớt rêu | Test + #70 hai tab |
| P4 | Release cùng stamp mới, đọc chỉ-đọc mọi vườn trước khi deploy | Release verified |

## 7. Cần owner quyết

1. Mốc 5 / 15 / 40 kỷ vật (25 / 75 / 200 sản vật): người chơi lâu năm sẽ lên Bậc III gần như ngay. Giữ mốc này (thưởng người chơi lâu), hay nâng lên 10 / 30 / 80?
2. Có làm hai «Dùng ngay» mới (Chữa bệnh bằng sợi bờm Kỳ lân, Vớt rêu bằng rong) không?
