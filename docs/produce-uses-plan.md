# Sản vật sinh vật có tác dụng — plan (18/11/2026)

Owner 18/11/2026: «lên plan để khi thu thập đủ thì có tác dụng thay vì chỉ là sưu tập».
Trạng thái: **owner duyệt 18/11/2026** — giữ mốc 5 / 15 / 40, làm cả hai «Dùng ngay» mới, thử trên emulator trước khi deploy.
«Bón phân trăng» và «Hướng dẫn: Đất mệt» đã live ở V26.18 (HPVN a9e9960a6). **P0 xong 18/11/2026** (mục 8); owner duyệt cả 4 đề nghị ở mục 8.4 cùng ngày. Sẵn sàng P1.

## 1. Hiện trạng (đã kiểm trong code HPVN `functions/games`, a9e9960a6)

| Chỗ tiêu sản vật | Mức | Ghi chú |
|---|---|---|
| Bán chợ | `ceil(min(level, 94)/3)` G, tối đa 32 G; gấp đôi khi bé vui | Tính vào trần hàng giá cao 5.000 G/ngày (10.000 G khi có cây Bậc thầy) và 100 món mỗi loại/ngày |
| Đơn hàng ngày | 3 đơn/ngày | Chỉ lấy sản vật của con đã lớn |
| Đổi kỷ vật | 5 sản vật → 1 kỷ vật, từng cái một | Kỷ vật chỉ để bật «đài kỷ vật» (trang trí) và thành tựu «Người Giữ Kỷ Vật» (3 kỷ vật) |
| Công thức | `elf_hat`, `elf_sock` | Chỉ Len quái lùng nhùng |
| Bón phân trăng | 1 gói/thửa/ngày | Live V26.18, chỉ Bê trăng |

Thành viên đang tồn 50–223 món mỗi loại (ảnh owner gửi 18/11) → sản vật đang thừa vì gần như không có chỗ tiêu. Số liệu thật: mục 9.

## 2. Thiết kế: hai tầng

**Tầng 1 — «Ấn kỷ vật» (dùng mãi).** Dựa trên kỷ vật sẵn có. Mỗi loài có 3 bậc theo **số kỷ vật đã đổi**:
Bậc 1 = 5 kỷ vật (25 sản vật), Bậc 2 = 15 (75), Bậc 3 = 40 (200). Mỗi bậc cho một hiệu ứng nhỏ, hợp với tính cách con vật.
Kỷ vật đã đổi không trả lại được, nên đây là chỗ tiêu thật. Server tính bậc từ `progression.keepsakes`, client chỉ hiển thị.

**Tầng 2 — «Dùng ngay» (tiêu hao, có lượt/ngày).** Như phân bón trăng: bấm là tốn sản vật, có tác dụng ngay. Chỉ làm cho vài loài hợp lý (bảng dưới).

## 3. Hiệu ứng từng loài và điểm nối (P0 đã rà, 18/11/2026)

Đường dẫn tính từ `functions/games/` của HPVN ở a9e9960a6. **Đổi** = P0 đổi so với plan cũ, owner đã duyệt 18/11 (mục 8.4).

| Loài · sản vật | Ấn 1 / 2 / 3 | Dùng ngay | Điểm nối thật |
|---|---|---|---|
| Quái lùng nhùng · Len | Tâm trạng mọi bé giảm chậm 10 / 20 / 30% | (đã có: mũ, vớ gia tinh) | `decayRate` garden-mood-core.js:125 — một hàm duy nhất, dùng cho giảm tâm trạng, đồng hồ ốm (duty-core:130) và kỹ năng Ngựa lùn (skill-core:364) |
| Que Xạo · Mảnh vỏ cành rụng | Cây ăn quả ra quả sau 66 / 60 / 54 giờ (gốc 72) | — | `TREE_MS` garden-orchard-core.js:16, `readyAt` :53 (dùng ở :82 thu quả, :115 view), trả lời lúc trồng :77. Vườn cây mở từ cấp 260 (edge_3) |
| Đào mỏ · Cúc áo | Đơn hàng ngày +5 / 10 / 15% điểm kinh nghiệm (Nước phép, Galleon không đổi) | — | `model.addXp(…, order.xp, …)` garden-retention-core.js:142 trong `deliverOrder` :132 |
| Bê trăng · Phân bón trăng | **Đổi:** một gói lùi 12 / 15 / 18 ô (gốc 9) | **Bón phân trăng** (live) | `cells: run.cells - VU_CELLS` garden-soil-core.js:171 trong `fertilizeAction` :156. Plan cũ ghi Bậc 1 = 9 ô, bằng gốc, tức Bậc 1 không có tác dụng |
| Mèo đốm · Sợi lông | Cây chín để 27 / 30 / 36 giờ mới héo (gốc 24) | — | `WILT_MS` garden-duty-core.js:47; dùng ở duty-core:105 (`cropClock`), challenge-core:138, skill-core:308 (Chim ẩn hiện). Héo = nửa sản lượng; khô (`DEAD_MS` 48 giờ, :48) không đổi |
| Chim ẩn hiện · Lông vũ | Mỗi bữa ăn của mọi bé xong sớm hơn 5 / 10 / 15% | — | `speedNewTimers` garden-action-core.js:109, nhánh bữa ăn :116 (chạy sau mọi lệnh và mọi việc gia tinh, `settleModelStep` :425). Một bữa hiện là 3 giờ × 0,5 = 90 phút. Trần chợ: **có chặn** — sản vật là hàng giá cao, 100 món mỗi loại/ngày (market-core:105) và 5.000 / 10.000 G/ngày (:114–115); mỗi sản vật vẫn tốn một bữa nên không sinh lời–lỗ |
| Chim lông rực · Lông vũ bốn màu | Ngưỡng vui để được thêm sản vật khi thu: 80 → 75 / 70 / 65 | — | Chỉ ở garden-mood-core.js:292 (`settleMood`), **không đổi hằng số `HAPPY`** :46: `HAPPY` còn quyết định giá ×2 ở chợ (market-core:53), thử thách tâm trạng (challenge-core:147), chải lông (:276), trần không có món khoái khẩu (:179) |
| Bằng-Mã · Lông cánh | Mua nước tưới được tặng thêm 5 / 10 / 15% số phần nước (làm tròn xuống) | — | Sau `applyPurchase` trong handler mua hàng garden-wallet-handlers.js:306, **không đặt trong** `applyPurchase` (wallet-core:406): «Tặng quà» của HPH (sale-admin:115) cũng đi qua hàm đó. 1 gói = 9 phần: Bậc 1, 2 không được thêm phần nào, Bậc 3 thêm 1 |
| Vong mã · Sợi bờm | Trong 30 ngày Bác Hagrid trông vườn 8 / 9 / 10 ngày (gốc 7) | — | `LEAVE_DAYS` garden-duty-core.js:64 (cửa sổ `LEAVE_WINDOW` 30 ngày :65); kiểm ở :446, :448, :451–452. Giới hạn 20 lần/30 ngày (`LEAVE_SPANS` :62) giữ nguyên |
| Kỳ lân · Sợi bờm Kỳ lân rụng | Bé chỉ ốm khi tâm trạng dưới 22 / 18 / 15 (gốc 25) | **Chữa bệnh**: 3 sợi chữa 1 bé, 1 lần/ngày | `SICK_MOOD` garden-duty-core.js:54, dùng ở :132–134. Chữa: nhánh `treat` :417–424, `pay` ở action-input:313, giá Galleon `dutyCost` (action-handlers:73; 10 G × cấp, tối đa 500 G, duty-core:59). Mở từ cấp 130 (`DUTY_LEVEL` :46) |
| Chó ba đầu · Sợi lông trắng | **Đổi:** Ma lùm kéo đến khi vườn vắng 27 / 30 / 36 giờ (gốc 24) | — | «Đốt vườn» **không có tốc độ cháy**: đó là lệnh ACP của KTV Gia Tinh, `burnCrops` garden-fire-core.js:28 xóa mọi cây cùng lúc, thời lượng do Gia Tinh chọn. Điểm nối mới: `gnomeTime` garden-duty-core.js:116–118 (`AWAY_MS` :49; tuần «Mưa dầm» vẫn chia đôi) |
| Rồng · Vảy | Chế biến nhanh hơn 5 / 10 / 15% | — | `speedNewTimers` garden-action-core.js:118 (việc chế biến có giờ, garden-craft.mjs:50; cả việc gia tinh). Không áp cho xây dựng (:120) |
| Thủy quái · Rong | **Đổi:** Cá trong ao lớn nhanh hơn 5 / 10 / 15% | **Đổi:** «Rải rong cho cá» — 5 rong, mọi lô cá đang lớn bớt một phần tư thời gian còn lại, 1 lần/ngày | Plan cũ không dùng được: «Vớt rêu» đã có và **miễn phí** (pond-core.js:220–231; nút ở client garden-pond-ui.mjs:250), còn khi Thủy quái giúp vườn thì hồ không bao giờ đục (`lordHelps` trong `murkySince` pond-core.js:110–113). Điểm nối mới: `ms` của lô cá pond-core.js:171 (thả cá) và :301 (cá giống tặng của kỹ năng) |
| Chó đuôi nĩa · Vòng cổ lông | Ma lùm cắn cây sau 7 / 8 / 9 giờ (gốc 6) | — | `GNOME_BITE_MS` garden-duty-core.js:52, dùng ở :212, :214 |
| Nhím quậy · Lông gai | Đất mệt mỗi vụ giảm 22 / 20 / 18% (gốc 25%), sàn 50% giữ nguyên | — | `TIRED_STEP` garden-soil-core.js:34; `cellMult(cells)` :59 chưa nhận `garden` → thêm tham số bước, các nơi gọi: `settleHarvest`, `fullPlotMult`, `soilView` :178. `MAX_CELLS` :36 giữ 36 ô (mọi bước đều chạm sàn ở vụ 5). Thẻ «Đất mệt» của client (garden-soil-guide.mjs) phải hiện bước của người chơi |
| Kỳ nhông lửa · Tro | Tuần sương giá: cây 8 giờ chậm ×1,4 / ×1,3 / ×1,2 (gốc ×1,5) | — | `growFactor` garden-soil-core.js:96–97 (từ cấp 200); dùng ở action-core:410 (lọc `> 1` cho kỹ năng Kỳ nhông lửa) và :414. Mọi bậc vẫn > 1 nên kỹ năng `frostSpared` vẫn chạy |
| Ma da · Vảy | Câu cá: vùng giật cần rộng hơn 5 / 10 / 15% (vùng cá vàng ở giữa không đổi) | — | `CAST.zoneHalf` 0,12 garden-pond-core.js:42; `castToken` :136–139; kết quả :248. Ghi bậc vào `pond.cast` lúc `castStart` :238 như `wide`, để vùng đã phát cho lượt câu không đổi (fence #59) |
| Ngựa lùn · Lông bờm | Bãi chăn: tâm trạng giảm chậm thêm 10 / 20 / 30% | — | `PASTURE_DECAY` 0,5 garden-mood-core.js:66, trong `decayRate` :125 (bãi chăn edge_2, cấp 260). Nhân với Ấn Len |

Kỷ vật đổi từng cái một: `exchangeKeepsake` garden-model/garden-craft.mjs:132–141; nút ×5 / «Đổi hết» cần thêm số lượng (P1).

## 4. Rào chắn (nối tiếp fence #64)

- **#65** Không Ấn hay «Dùng ngay» nào tạo Galleon trực tiếp; chỉ đổi thời gian, tỉ lệ, điểm kinh nghiệm trong vườn của chính người đó.
- **#66** Bậc do server tính từ `garden_states.progression.keepsakes`; client không gửi bậc hay hiệu ứng. Vườn cuộc thi (`garden_contest_states`) không có Ấn.
- **#67** Kỷ vật không bán, không chuyển. **P0 đã xác minh: không có đường nào chuyển sản vật hay kỷ vật giữa hai thành viên** (mục 8.2). Ấn tối đa Bậc 3, nên tài khoản phụ cũng không giúp được tài khoản chính.
- **#68** Cộng dồn với kỹ năng mùa 2 và fence cũ không vượt sàn cũ: #49 (đất mệt + thời tiết + khô ≥ 50%), trần giá chợ #41–#44, trần bán ngày. Ấn Chim lông rực không chạm giá ×2 ở chợ.
- **#69** Kỷ vật đã đổi không trả lại thành sản vật.
- **#70** «Dùng ngay» có lượt/ngày theo ngày Việt Nam, server giữ, chống bấm hai tab (kiểu `fed` của phân bón trăng).

## 5. Giao diện

Theo luật owner: một khung, ô danh sách riêng, dữ liệu không lời giải thích, không emoji.
Thẻ trong «Bộ sưu tập»: `Bậc 2 · 15/40` và một dòng hiệu ứng (`Tâm trạng giảm chậm 20%`). Nút đổi thêm `×5` và `Đổi hết` (thay vì bấm từng cái một).
«Dùng ngay» đặt cạnh việc nó giúp: chữa bệnh trong bảng bé ốm, rải rong trong bảng hồ, bón phân trong «Gieo & chăm cây».

### 5a. Bảng hướng dẫn cho người chơi (owner 18/11/2026)

Owner yêu cầu: có bảng hướng dẫn, ghi rõ ràng, **không viết tắt**, nhìn chuyên nghiệp. Đây là yêu cầu trực tiếp nên được viết thành câu đầy đủ
(ngoại lệ có chủ ý của luật «dữ liệu không lời giải thích»).

- Vị trí: nút «Hướng dẫn» ở đầu bảng «Bộ sưu tập» và trong «Gieo & chăm cây»; mở một hộp thoại riêng, một khung duy nhất.
- Bố cục: ba thẻ trên một hàng phân đoạn «Ấn kỷ vật · Dùng ngay · Đất mệt» (không làm thẻ viên thuốc có viền, không đặt biểu tượng bên trái).
  Mỗi dòng bảng là một ô riêng (nền kem, có khoảng cách), tiêu đề cột cố định; trên điện thoại mỗi dòng xếp thành một thẻ «tên cột: nội dung».
- Chữ: không viết tắt («Bậc 1», không «B1» hay «I»; «Galleon», không «G»; «giờ Việt Nam», không «VN»); không biểu tượng cảm xúc;
  số liệu lấy từ cùng hằng số server (một nguồn), không gõ tay hai nơi.
- Bậc hiện tại của người chơi được tô đậm trên dòng của loài đó.
- Thẻ «Đất mệt» đã ra cùng «Bón phân trăng» (V26.18); hai thẻ còn lại ra ở P1 và cập nhật dần theo P2, P3.
- Số liệu dưới đây **đã chốt theo code ở P0** (a9e9960a6) và owner duyệt 18/11/2026.

**Thẻ 1 — Ấn kỷ vật**

> Mỗi sinh vật trưởng thành cho một sản vật sau mỗi bữa ăn. Trong «Bộ sưu tập», cứ 5 sản vật cùng loài đổi được 1 kỷ vật.
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
| Que Xạo | Mảnh vỏ cành rụng | Cây ăn quả trong vườn cây ra quả sau 66 giờ (thường là 72 giờ) | Sau 60 giờ | Sau 54 giờ |
| Đào mỏ | Cúc áo lấp lánh nhặt được | Đơn hàng hằng ngày cho thêm 5% điểm kinh nghiệm | Thêm 10% | Thêm 15% |
| Bê trăng | Phân bón trăng đóng gói | Mỗi lần bón phân trăng, thửa đất lùi lại 12 ô thu hoạch (thường là 9 ô) | Lùi lại 15 ô | Lùi lại 18 ô |
| Mèo đốm | Sợi lông Mèo đốm | Cây chín chưa thu hoạch sau 27 giờ mới héo (thường là 24 giờ; cây héo chỉ cho một nửa sản lượng) | Sau 30 giờ | Sau 36 giờ |
| Chim ẩn hiện | Lông vũ Chim ẩn hiện | Mỗi bữa ăn của mọi sinh vật xong sớm hơn 5% | Sớm hơn 10% | Sớm hơn 15% |
| Chim lông rực | Lông vũ bốn màu | Khi thu sản vật, sinh vật có tâm trạng từ 75 được thêm một sản vật (thường là từ 80; giá bán gấp đôi ở Quầy chợ vẫn cần 80) | Từ 70 | Từ 65 |
| Bằng-Mã | Lông cánh Bằng-Mã rụng | Mỗi lần mua nước tưới được tặng thêm 5% số phần nước, làm tròn xuống | Tặng thêm 10% | Tặng thêm 15% |
| Vong mã | Sợi bờm Vong mã | Trong 30 ngày, Bác Hagrid trông vườn giúp được 8 ngày (thường là 7 ngày) | 9 ngày | 10 ngày |
| Kỳ lân | Sợi bờm Kỳ lân rụng | Sinh vật chỉ ốm khi tâm trạng xuống dưới 22 (thường là 25) | Dưới 18 | Dưới 15 |
| Chó ba đầu | Sợi lông trắng Chó ba đầu | Ma lùm chỉ kéo đến khi vườn vắng chủ 27 giờ (thường là 24 giờ; tuần mưa dầm vẫn đến sớm gấp đôi) | 30 giờ | 36 giờ |
| Rồng | Vảy Rồng rụng | Thời gian chế biến ngắn hơn 5% | Ngắn hơn 10% | Ngắn hơn 15% |
| Thủy quái | Rong thủy quái | Cá trong ao lớn nhanh hơn 5% | Nhanh hơn 10% | Nhanh hơn 15% |
| Chó đuôi nĩa | Vòng cổ lông | Ma lùm cắn cây sau 7 giờ (thường là 6 giờ) | Sau 8 giờ | Sau 9 giờ |
| Nhím quậy | Lông gai | Đất mệt mỗi vụ chỉ giảm thêm 22% sản lượng (thường là 25%), thấp nhất vẫn là 50% | Giảm thêm 20% | Giảm thêm 18% |
| Kỳ nhông lửa | Tro kỳ nhông | Trong tuần sương giá, cây 8 giờ chỉ chậm gấp 1,4 lần (thường là 1,5 lần) | Gấp 1,3 lần | Gấp 1,2 lần |
| Ma da | Vảy ma da | Khi câu cá, vùng giật cần rộng hơn 5% (vùng cá vàng ở giữa không đổi) | Rộng hơn 10% | Rộng hơn 15% |
| Ngựa lùn | Lông bờm | Sinh vật ở bãi chăn giảm tâm trạng chậm hơn thêm 10% | Thêm 20% | Thêm 30% |

**Thẻ 2 — Dùng ngay**

> Một số sản vật dùng được ngay để xử lý việc trong vườn. Mỗi lần dùng sẽ trừ sản vật trong kho. Lượt dùng tính lại lúc 0 giờ theo giờ Việt Nam.

| Sản vật | Số lượng mỗi lần | Tác dụng | Khi nào dùng được | Giới hạn |
|---|---|---|---|---|
| Phân bón trăng đóng gói | 1 gói | Thửa đất đang mệt được tính lùi lại một vụ (9 ô thu hoạch) | Từ cấp 160, khi thửa đất đang mệt | Mỗi thửa một lần mỗi ngày |
| Sợi bờm Kỳ lân rụng | 3 sợi | Chữa khỏi một sinh vật đang ốm, không tốn Galleon hay Thuốc Mọc Xương | Từ cấp 130, khi có sinh vật đang ốm | Một lần mỗi ngày |
| Rong thủy quái | 5 cây rong | Mọi lô cá đang lớn trong ao bớt một phần tư thời gian còn lại | Từ cấp 150, khi ao có cá đang lớn | Một lần mỗi ngày |

**Thẻ 3 — Đất mệt** (đã live V26.18, garden-soil-guide.mjs; số khớp server)

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

Khi có Ấn Nhím quậy (P2), dòng «Vụ thứ ba» và «Từ vụ thứ tư» đổi theo bậc: vụ 3 là 78 / 80 / 82%, vụ 4 là 56 / 60 / 64%, từ vụ 5 là 50%.

## 6. Phân kỳ (mỗi phần một phiên)

| Phần | Việc | Nghiệm thu |
|---|---|---|
| P0 | Rà điểm nối, rà #67, đọc chỉ-đọc kho thật | **Xong 18/11** (mục 8, 9) |
| P1 | Xem mục 8.3 | Test lõi + fence #65–#69; thử trên emulator; owner duyệt |
| P2 | 6 Ấn: Cúc áo, Lông vũ bốn màu, Sợi bờm Kỳ lân, Vảy Rồng, Lông gai, Lông bờm | Test từng hiệu ứng + #68 |
| P3 | 6 Ấn: Lông vũ Chim ẩn hiện, Lông cánh Bằng-Mã, Sợi bờm Vong mã, Sợi lông trắng Chó ba đầu, Tro kỳ nhông, Vảy ma da + «Dùng ngay» Chữa bệnh, Rải rong cho cá | Test + #70 hai tab |
| P4 | Release cùng stamp mới (> 26.18), đọc chỉ-đọc mọi vườn trước khi deploy | Release verified |

## 7. Owner đã quyết (18/11/2026)

1. Giữ mốc 5 / 15 / 40 kỷ vật.
2. Làm «Chữa bệnh» (Sợi bờm Kỳ lân rụng); «Vớt rêu» (Rong thủy quái) đổi thành «Rải rong cho cá» vì «Vớt rêu» đã miễn phí.
3. Mọi phần thử trên emulator, owner duyệt rồi mới deploy.
4. Sau P0 (18/11/2026): duyệt cả 4 đề nghị ở mục 8.4 — Bê trăng 12 / 15 / 18 ô; Chó ba đầu: ma lùm kéo đến muộn hơn; Thủy quái: cá lớn nhanh hơn; «Rải rong cho cá» thay «Vớt rêu».

## 8. Kết quả P0 (18/11/2026, Claude Code, chỉ đọc code và dữ liệu)

### 8.1 Sáu điểm nối «(xác minh)»

| Điểm | Kết quả |
|---|---|
| Chim ẩn hiện: chu kỳ sản vật, trần chợ | Có điểm nối (`speedNewTimers`, action-core:116). Thêm sản vật **vẫn bị trần chặn**: 100 món mỗi loại/ngày và 5.000 / 10.000 Galleon hàng giá cao/ngày. Giữ |
| Bằng-Mã: nước tưới mua thêm | Có điểm nối (wallet-handlers:306, ngoài `applyPurchase`). Giữ, ghi rõ làm tròn xuống |
| Vong mã: trần ngày trông vườn | Trần thật là **7 ngày trong 30 ngày** (`LEAVE_DAYS`, `LEAVE_WINDOW`), không phải mỗi lần. Giữ, sửa chữ |
| Chó ba đầu: tốc độ cháy «Đốt vườn» | **Không có điểm nối**: «Đốt vườn» là lệnh ACP của KTV Gia Tinh, cháy hết ngay. Đề nghị đổi sang «Ma lùm kéo đến muộn hơn» |
| Kỳ nhông lửa: growFactor | Có (`growFactor` soil-core:96). Giữ |
| Ma da: vùng giật cần | Có (`CAST.zoneHalf`, pond-core:42, 136–139). Giữ, chỉ nới vùng cá nhỏ |

Các điểm nối khác: mọi hằng số và hàm còn đúng tên. Sửa thêm: Bê trăng Bậc 1 bằng gốc (vô tác dụng); Mèo đốm là «héo» không phải «khô»; Chim lông rực không được đổi `HAPPY`; Thủy quái và «Vớt rêu» không dùng được (mục 3).

### 8.2 Rào #67 — đường chuyển giữa thành viên

| Đường | Kết quả |
|---|---|
| Quầy chợ | Chỉ bán cho Gringotts (market-core:88); không có chợ giữa người chơi; kỷ vật không bán được |
| Thăm vườn «Chăm giúp» | Chỉ lùi giờ gieo của cây nhà chủ 15 phút (visit-handlers:62–73), người giúp nhận 6 nước (:25, :145); không đụng kho |
| Bạn ghé thăm, tặng quà | Quà từ nhân vật (Harry, Ron…), chỉ nước, Nước phép, vớ, Mandrake (friend-core:25–32); không phải thành viên |
| Cuộc thi Noel | Vườn thi là bản riêng `garden_contest_states`, mỗi loài 1 kỷ vật (contest-core:84); không đọc, không ghi `garden_states` |
| ACP «Tặng quà» của HPH | Chỉ hàng trong cửa hàng qua `applyPurchase` (sale-admin:102–125); sản vật, kỷ vật không có trong cửa hàng |
| Firestore Rules | `garden_states` không cho client ghi (luật chặn mọi đường còn lại, firestore.rules:1896) |

Kết luận: **không có đường nào**. Mỗi tài khoản tự nuôi; tài khoản phụ không chuyển được sản vật hay kỷ vật.

### 8.3 Danh sách chính xác cho P1

1. Server `functions/games/garden-keepsake-core.js` (file mới; garden-duty-core.js đang đúng 500 dòng, chạm trần): `KEEPSAKE_TIERS = [5, 15, 40]`, `keepsakeTier(garden, species)` đọc `progression.keepsakes`, bảng hiệu ứng 18 loài (một nguồn số cho server và bảng hướng dẫn), `keepsakeView(garden)`.
2. Đổi nhiều kỷ vật một lần: `exchangeKeepsake` (garden-craft.mjs:132) nhận `count` 1–200; action input kiểm `count`; client nút `×5` và «Đổi hết».
3. 6 Ấn của P1 nối vào code:
   - Len → `decayRate` garden-mood-core.js:125
   - Mảnh vỏ cành → `readyAt` garden-orchard-core.js:53, :77
   - Phân bón trăng → garden-soil-core.js:171 (số ô theo mục 8.4)
   - Sợi lông Mèo đốm → `WILT_MS` ở duty-core:105, challenge-core:138, skill-core:308 (thay hằng số bằng hàm theo vườn, không thêm dòng vào duty-core)
   - Vòng cổ lông → `GNOME_BITE_MS` duty-core:212, :214
   - Rong thủy quái → `ms` lô cá pond-core.js:171, :301 («Cá trong ao lớn nhanh hơn», owner duyệt)
4. View: `keepsakes` trong phản hồi `getHagridGarden` (bậc, mốc kế tiếp, hiệu ứng) để client chỉ hiển thị.
5. Client hagrid-farm: thẻ «Bộ sưu tập» `Bậc 2 · 15/40` + một dòng hiệu ứng; hộp «Hướng dẫn» thêm thẻ «Ấn kỷ vật» và «Dùng ngay» (mục 5a), số lấy từ view server; tô đậm bậc của người chơi.
6. Test: lõi bậc (4, 5, 14, 15, 39, 40 kỷ vật), từng Ấn có và không có bậc, fence #65 (không Galleon), #66 (client gửi bậc bị bỏ qua), #69 (không có lệnh đổi ngược); test HPVN giữ số bảng hướng dẫn bằng số server.
7. Emulator: vườn mẫu có 0 / 5 / 15 / 40 kỷ vật một loài, xem ở 390 px và 320 px; owner duyệt.

### 8.4 Bốn đề nghị — owner duyệt cả 4 (18/11/2026)

1. **Bê trăng**: Ấn lùi 12 / 15 / 18 ô (đề nghị) thay cho 9 / 13 / 18 (Bậc 1 = 9 ô bằng gốc, không có tác dụng).
2. **Chó ba đầu**: «Đốt vườn» không có tốc độ cháy. Đề nghị «Ma lùm kéo đến khi vườn vắng 27 / 30 / 36 giờ».
3. **Thủy quái, Ấn**: «Hồ đục chậm hơn» gần như vô dụng (khi Thủy quái giúp vườn thì hồ không đục). Đề nghị «Cá trong ao lớn nhanh hơn 5 / 10 / 15%».
4. **Thủy quái, Dùng ngay**: «Vớt rêu» đã miễn phí, không ai tốn 5 rong cho nó. Đề nghị «Rải rong cho cá» (5 rong, mọi lô cá đang lớn bớt một phần tư thời gian còn lại, 1 lần/ngày).

### 8.5 Lỗi ngoài phạm vi (chỉ ghi, chưa sửa)

- Server `garden-model/garden-balance.mjs` còn tên tiếng Anh («Mooncalf», «Kneazle», «Diricawl», «Fwooper», «Sợi lông Kneazle», «Lông vũ Diricawl»…) trong khi client `garden-v05/balance-data.json` đã dùng tên Việt; tên server hiện ở ACP của HPH (sale-admin:47) và thông báo lỗi.
- «Suối thần ×0» tràn nút ở 320 px (ghi từ V26.18).

## 9. Số liệu thật (production, chỉ đọc)

Owner cho phép 18/11/2026. Đọc `garden_states` một lần, chỉ trường cấp, kho, kỷ vật, sinh vật; chỉ giữ số tổng hợp, không uid, không tên.

**35 vườn.** Cấp: trung vị 9, 90% dưới 155, cao nhất 10.000 (một vườn). Dưới 130: 29 vườn · 130–159: 3 · 160–199: 0 · 200–259: 1 · từ 260: 2.

Cột «Có» = số vườn có nuôi loài đó. Phân bố tính trên các vườn có nuôi hoặc có món. «Đổi hết» = kỷ vật hiện có + sản vật đang tồn chia 5.

| Loài | Có | Sản vật tồn: trung vị / 90% / cao nhất / tổng | Kỷ vật: trung vị / 90% / cao nhất / tổng | Đạt 5 / 15 / 40 hiện nay | Đạt 5 / 15 / 40 nếu đổi hết |
|---|---|---|---|---|---|
| Quái lùng nhùng | 17 | 38 / 106 / 153 / 810 | 1 / 24 / 29 / 126 | 7 / 4 / 0 | 13 / 10 / 0 |
| Que Xạo | 15 | 67 / 177 / 202 / 1.098 | 3 / 21 / 23 / 107 | 7 / 3 / 0 | 12 / 10 / 2 |
| Đào mỏ | 15 | 82 / 202 / 221 / 1.309 | 2 / 19 / 21 / 86 | 6 / 3 / 0 | 11 / 9 / 3 |
| Bê trăng | 15 | 52 / 174 / 192 / 1.001 | 0 / 17 / 19 / 72 | 5 / 3 / 0 | 11 / 9 / 1 |
| Mèo đốm | 13 | 66 / 160 / 216 / 963 | 1 / 17 / 17 / 62 | 4 / 2 / 0 | 10 / 8 / 1 |
| Chim ẩn hiện | 12 | 81 / 186 / 215 / 1.053 | 1 / 15 / 23 / 59 | 4 / 2 / 0 | 9 / 8 / 2 |
| Chim lông rực | 12 | 60 / 154 / 208 / 766 | 1 / 11 / 12 / 37 | 3 / 0 / 0 | 8 / 6 / 1 |
| Bằng-Mã | 10 | 86 / 213 / 213 / 919 | 1 / 11 / 11 / 29 | 3 / 0 / 0 | 8 / 7 / 2 |
| Vong mã | 10 | 73 / 246 / 246 / 899 | 1 / 9 / 9 / 26 | 3 / 0 / 0 | 8 / 5 / 2 |
| Kỳ lân | 9 | 46 / 214 / 214 / 597 | 1 / 10 / 10 / 21 | 2 / 0 / 0 | 7 / 3 / 1 |
| Chó ba đầu | 9 | 26 / 224 / 224 / 517 | 1 / 10 / 10 / 17 | 1 / 0 / 0 | 7 / 3 / 1 |
| Rồng | 9 | 20 / 217 / 217 / 451 | 1 / 3 / 3 / 9 | 0 / 0 / 0 | 5 / 2 / 1 |
| Thủy quái | 4 | 52 / 80 / 80 / 140 | 0 / 1 / 1 / 1 | 0 / 0 / 0 | 2 / 1 / 0 |
| Chó đuôi nĩa | 4 | 65 / 98 / 98 / 163 | 0 / 0 / 0 / 0 | 0 / 0 / 0 | 2 / 1 / 0 |
| Nhím quậy | 3 | 52 / 93 / 93 / 149 | 0 / 0 / 0 / 0 | 0 / 0 / 0 | 2 / 1 / 0 |
| Kỳ nhông lửa | 3 | 0 / 4 / 4 / 4 | 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| Ma da | 2 | 4 / 4 / 4 / 6 | 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| Ngựa lùn | 2 | 0 | 0 | 0 / 0 / 0 | 0 / 0 / 0 |

Đọc bảng:
- Tổng tồn kho khoảng 10.900 sản vật, đúng như owner thấy: sản vật đang thừa.
- Mốc 5 / 15 / 40 hợp lý: ngày ra mắt, Bậc 1 đến ngay với 5–13 vườn mỗi loài đầu, Bậc 2 với 1–10 vườn, Bậc 3 chỉ 0–3 vườn (mục tiêu dài hạn). Giữ như owner đã chốt.
- Sáu loài từ Thủy quái trở đi gần như chưa ai có đủ (cấp 140–280); Ấn của chúng là phần thưởng cho người chơi cấp cao, không cần gấp. Điều này ủng hộ thứ tự P1 → P3.
- Một vườn cấp 10.000 làm lệch cột «cao nhất»; trung vị không bị ảnh hưởng.
