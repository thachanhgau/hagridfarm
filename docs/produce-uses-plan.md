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

### 5a. Bảng hướng dẫn cho người chơi (owner 18/11/2026)

Owner yêu cầu: có bảng hướng dẫn, ghi rõ ràng, **không viết tắt**, nhìn chuyên nghiệp. Đây là yêu cầu trực tiếp nên được viết thành câu đầy đủ
(ngoại lệ có chủ ý của luật «dữ liệu không lời giải thích»).

- Vị trí: nút «Hướng dẫn» ở đầu bảng «Bộ sưu tập» và trong «Gieo & chăm cây»; mở một hộp thoại riêng, một khung duy nhất.
- Bố cục: ba thẻ trên một hàng phân đoạn «Ấn kỷ vật · Dùng ngay · Đất mệt» (không làm thẻ viên thuốc có viền, không đặt biểu tượng bên trái).
  Mỗi dòng bảng là một ô riêng (nền kem, có khoảng cách), tiêu đề cột cố định; trên điện thoại mỗi dòng xếp thành một thẻ «tên cột: nội dung».
- Chữ: không viết tắt («Bậc 1», không «B1» hay «I»; «Galleon», không «G»; «giờ Việt Nam», không «VN»); không biểu tượng cảm xúc;
  số liệu lấy từ cùng hằng số server (một nguồn), không gõ tay hai nơi.
- Bậc hiện tại của người chơi được tô đậm trên dòng của loài đó.
- Thẻ «Đất mệt» ra cùng bản «Bón phân trăng»; hai thẻ còn lại ra ở P1 và cập nhật dần theo P2, P3.
- Số liệu dưới đây theo plan; P0 chốt lại trước khi đưa vào game.

**Thẻ 1 — Ấn kỷ vật**

> Mỗi sinh vật trưởng thành cho một sản vật sau mỗi chu kỳ chăm sóc. Trong «Bộ sưu tập», cứ 5 sản vật cùng loài đổi được 1 kỷ vật.
> Khi số kỷ vật của một loài đạt mốc, Ấn kỷ vật của loài đó lên bậc và có hiệu lực ngay, không mất đi.
> Kỷ vật đã đổi không thể đổi ngược lại thành sản vật, không bán và không tặng được.

| Bậc | Số kỷ vật cần có | Tương đương số sản vật |
|---|---|---|
| Bậc 1 | 5 kỷ vật | 25 sản vật |
| Bậc 2 | 15 kỷ vật | 75 sản vật |
| Bậc 3 | 40 kỷ vật | 200 sản vật |

| Sinh vật | Sản vật | Bậc 1 | Bậc 2 | Bậc 3 |
|---|---|---|---|---|
| Quái lùng nhùng | Len quái lùng nhùng | Tâm trạng của mọi sinh vật giảm chậm hơn 10% | Giảm chậm hơn 20% | Giảm chậm hơn 30% |
| Que Xạo | Mảnh vỏ cành rụng | Cây lâu năm ra quả sớm hơn 6 giờ | Sớm hơn 12 giờ | Sớm hơn 18 giờ |
| Đào mỏ | Cúc áo lấp lánh nhặt được | Đơn hàng hằng ngày cho thêm 5% điểm kinh nghiệm | Thêm 10% | Thêm 15% |
| Bê trăng | Phân bón trăng đóng gói | Mỗi lần bón phân trăng, thửa đất lùi lại 9 ô thu hoạch | Lùi lại 13 ô | Lùi lại 18 ô |
| Mèo đốm | Sợi lông Mèo đốm | Cây chín chưa thu hoạch giữ được 27 giờ trước khi khô (thường là 24 giờ) | 30 giờ | 36 giờ |
| Chim ẩn hiện | Lông vũ Chim ẩn hiện | Chu kỳ cho sản vật của mọi sinh vật ngắn hơn 5% | Ngắn hơn 10% | Ngắn hơn 15% |
| Chim lông rực | Lông vũ bốn màu | Sinh vật được tính là vui (cho thêm sản vật) từ mức tâm trạng 75 (thường là 80) | Từ mức 70 | Từ mức 65 |
| Bằng-Mã | Lông cánh Bằng-Mã rụng | Mỗi lần mua nước tưới được tặng thêm 5% | Tặng thêm 10% | Tặng thêm 15% |
| Vong mã | Sợi bờm Vong mã | Bác Hagrid trông vườn giúp được thêm 1 ngày | Thêm 2 ngày | Thêm 3 ngày |
| Kỳ lân | Sợi bờm Kỳ lân rụng | Sinh vật chỉ ốm khi tâm trạng xuống dưới 22 (thường là 25) | Dưới 18 | Dưới 15 |
| Chó ba đầu | Sợi lông trắng Chó ba đầu | Lửa «Đốt vườn» cháy chậm hơn 10% | Chậm hơn 20% | Chậm hơn 30% |
| Rồng | Vảy Rồng rụng | Thời gian chế biến ngắn hơn 5% | Ngắn hơn 10% | Ngắn hơn 15% |
| Thủy quái | Rong thủy quái | Hồ bắt đầu đục sau 2 ngày rưỡi (thường là 2 ngày) | Sau 3 ngày | Sau 4 ngày |
| Chó đuôi nĩa | Vòng cổ lông | Ma lùm cắn cây sau 7 giờ (thường là 6 giờ) | Sau 8 giờ | Sau 9 giờ |
| Nhím quậy | Lông gai | Đất mệt mỗi vụ chỉ giảm 22% sản lượng (thường là 25%) | Giảm 20% | Giảm 18% |
| Kỳ nhông lửa | Tro kỳ nhông | Trong tuần sương giá, cây 8 giờ chỉ chậm gấp 1,4 lần (thường là 1,5 lần) | Gấp 1,3 lần | Gấp 1,2 lần |
| Ma da | Vảy ma da | Khi câu cá, vùng giật cần rộng hơn 5% | Rộng hơn 10% | Rộng hơn 15% |
| Ngựa lùn | Lông bờm | Sinh vật ở bãi chăn giảm tâm trạng chậm hơn thêm 10% | Thêm 20% | Thêm 30% |

**Thẻ 2 — Dùng ngay**

> Một số sản vật dùng được ngay để xử lý việc trong vườn. Mỗi lần dùng sẽ trừ sản vật trong kho. Lượt dùng tính lại lúc 0 giờ theo giờ Việt Nam.

| Sản vật | Số lượng mỗi lần | Tác dụng | Khi nào dùng được | Giới hạn |
|---|---|---|---|---|
| Phân bón trăng đóng gói | 1 gói | Thửa đất đang mệt được tính lùi lại một vụ (9 ô thu hoạch) | Từ cấp 160, khi thửa đất đang mệt | Mỗi thửa một lần mỗi ngày |
| Sợi bờm Kỳ lân rụng | 3 sợi | Chữa khỏi một sinh vật đang ốm, không tốn Galleon hay Thuốc Mọc Xương | Khi có sinh vật đang ốm | Một lần mỗi ngày |
| Rong thủy quái | 5 cây rong | Làm sạch rêu trong hồ ngay lập tức | Khi hồ đang đục | Một lần mỗi ngày |

**Thẻ 3 — Đất mệt**

> Từ cấp 160, một thửa đất trồng liên tiếp cùng một họ cây sẽ mệt dần. Cứ 9 ô thu hoạch được tính là một vụ.

| Vụ liên tiếp cùng họ cây | Sản lượng mỗi ô |
|---|---|
| Vụ thứ nhất và vụ thứ hai | 100% |
| Vụ thứ ba | 75% |
| Từ vụ thứ tư trở đi | 50% (mức thấp nhất) |

| Cách làm đất hồi lại | Kết quả |
|---|---|
| Trồng một họ cây khác (lá, củ, hoa, thảo dược, quả) | Đất tính lại từ đầu ngay ở lần thu hoạch đó |
| Bón phân trăng | Lùi lại một vụ, mỗi thửa một lần mỗi ngày |
| Kỹ năng «Xới đất» của Nhím quậy | Đất tính lại từ đầu |

> Nhãn «Thu −25%» trên hạt giống cho biết: nếu gieo kín thửa bằng hạt đó, những ô thu hoạch cuối sẽ bị giảm bao nhiêu.
> Cây khác loài nhưng cùng họ vẫn tính chung một chuỗi. Khi Bác Hagrid trông vườn giúp, đất không mệt.

## 6. Phân kỳ (mỗi phần một phiên)

| Phần | Việc | Nghiệm thu |
|---|---|---|
| P0 | Rà 6 điểm nối «xác minh»; đọc chỉ-đọc kho thật (phân bố sản vật, kỷ vật) để chốt mốc 5/15/40 | Bảng số liệu + mốc chốt |
| P1 | Lõi `keepsakeTier`, thẻ Bộ sưu tập, nút đổi ×5/hết, bảng hướng dẫn (thẻ «Ấn kỷ vật», «Dùng ngay»; thẻ «Đất mệt» ra cùng bản bón phân trăng), 6 Ấn dễ: Len, Mảnh vỏ, Phân bón, Sợi lông Kneazle, Rong, Vòng cổ | Test lõi + fence #65–#69; thử trên emulator |
| P2 | 6 Ấn tiếp: Cúc áo, Lông vũ bốn màu, Sợi bờm Kỳ lân, Vảy Rồng, Lông gai, Lông bờm | Test từng hiệu ứng + #68 |
| P3 | 6 Ấn còn lại (sau P0) + «Dùng ngay» Chữa bệnh, Vớt rêu | Test + #70 hai tab |
| P4 | Release cùng stamp mới, đọc chỉ-đọc mọi vườn trước khi deploy | Release verified |

## 7. Cần owner quyết

1. Mốc 5 / 15 / 40 kỷ vật (25 / 75 / 200 sản vật): người chơi lâu năm sẽ lên Bậc III gần như ngay. Giữ mốc này (thưởng người chơi lâu), hay nâng lên 10 / 30 / 80?
2. Có làm hai «Dùng ngay» mới (Chữa bệnh bằng sợi bờm Kỳ lân, Vớt rêu bằng rong) không?
