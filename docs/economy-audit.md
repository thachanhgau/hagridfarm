# Phase 3 — Rà soát kinh tế và nhiệm vụ cú

> 18/10/2026 · Claude Code (Anthropic). Số liệu đọc từ code prototype (`balance-data`, `garden-store-catalog`, `garden-quests`, `garden-events`) và backend ví trên nhánh `codex/hagrid-garden-wallet-local-20261013` (`functions/games/garden-action-core.js`, chỉ đọc).
> Mục **[CẦN QUYẾT]** là đề xuất chờ chủ dự án duyệt. Phần nhiệm vụ cú làm ngay vì core-design đã duyệt hướng đi ("3 nhiệm vụ/ngày, chỉ gắn với hành động thật").

## 1. Bản đồ tài nguyên hiện tại

> Bảng này là hiện trạng **trước** đợt gộp 18/10/2026. Bộ vật liệu đã bỏ, phân bón đổi thành nước phép: xem mục 5.

| Tài nguyên | Kiếm từ đâu | Tiêu vào đâu | Ghi chú |
|---|---|---|---|
| **Galleons** | Chỉ từ diễn đàn. **Trong game không có cách kiếm** | Hạt (2–19 G / 3 hạt), nước (5 G / 9), phân bón (60 G), khẩu phần (15–… G), trang trí (80–… G) | Khu vườn là nơi **tiêu** Galleons của diễn đàn |
| **Hạt giống** | Mua bằng Galleons | Gieo: 1 hạt / ô (chỉ trên server) | Chơi trên máy: **gieo miễn phí** |
| **Nước** | Mua (5 G / 9); quà nhiệm vụ, rương, lễ hội, gắn kết, thành tựu, thăm vườn | Gieo: 1 nước / ô (chỉ trên server) | Chơi trên máy: **không có chỗ tiêu** |
| **Phân bón** | Mua (60 G); quà | Rút 10% thời gian lớn của một hàng (server) | Món đắt nhất trong cửa hàng |
| **Nông sản** | Gặt (1 / ô) | Chế biến (3+3 → 3 sản phẩm), nhiệm vụ | Không bán lấy Galleons |
| **Bộ vật liệu** | Chế biến (bí ngô + yến mạch, từ cấp 6), quà | Mở thửa/chuồng (6–54 bộ, từ cấp 12), trang trí từ món thứ 6 (3 bộ) | |
| **Khẩu phần** | Chế biến; mua; 3 phần khởi đầu khi đón sinh vật | Cho ăn | |
| **Sản phẩm sinh vật** | Thu sau bữa ăn (1 / lần) | Đổi 5 → 1 kỷ vật | Chỉ để trưng bày |
| **XP / cấp** | Gieo, gặt, cho ăn, thu, chế biến | Mở loài, thửa, chuồng | Nhịp đã duyệt: cấp 100 trong 4–6 tháng, ~3 lượt/ngày |
| **Điểm lễ hội** | Thao tác nông trại, nhận quà nhiệm vụ (+15), rương (+20), thao tác miễn phí (có trần từ V24.9) | 3 mốc / lễ hội (30 / 75 / 150) | Tách riêng từng lễ hội từ V24.9 |
| **Điểm gắn kết** | Cho ăn, thu, đón, vuốt ve (3 lần/ngày/sinh vật) | 4 mốc quà / loài | |

**Phát hiện chính**
1. **Hai nền kinh tế khác nhau.** Có ví (server): hạt và nước bị trừ khi gieo. Chơi trên máy: gieo miễn phí, nước và phân bón chỉ tăng chứ không giảm. Mọi cân bằng phải tính theo chế độ có ví, vì bản thật sẽ chạy với server.
2. **Không có nguồn Galleons trong game.** Có ví thì một hàng bí ngô tốn khoảng 3,7 G (2 G hạt + 3 nước). Người ít Galleons trên diễn đàn sẽ bị chặn sớm **[CẦN QUYẾT]**: có cho bán nông sản hoặc sản phẩm sinh vật lấy một ít Galleons không.
3. **Có 7 loại tài nguyên người chơi phải để tâm**, trong khi core-design đã duyệt mục tiêu 4. Việc gộp (phân bón thành "nước phép", bộ vật liệu vào chi phí xây) chạm vào balance đã duyệt và backend, nên cần làm một đợt riêng, có migration.
4. **Quà không gắn với cấp**: cấp 1 nhận Côn trùng (dùng từ cấp 17), Cỏ trăng (cấp 40), bộ vật liệu (dùng từ cấp 6–12).

## 2. Nhiệm vụ cú trước khi sửa (V24.9.7)

| Nhiệm vụ | Tên | Thật ra tính bằng | Quà |
|---|---|---|---|
| quest_hagrid_harvest | "Gieo hoặc thu hoạch **3** luống" | **1** lần gieo, gặt hoặc chăm | +2 Bộ vật liệu |
| quest_sprout_craft | "Chế biến…" | chế biến **hoặc gặt** hoặc chăm | +15 Nước, +3 Bí ngô |
| quest_hemxeo_creature | Thăm sinh vật | cho ăn, vuốt ve **hoặc xoay một món trang trí** | +1 Phân bón, +1 Bộ vật liệu |
| quest_neighbor_tour | Thăm vườn | **mở tham quan hoặc mở bưu thiếp** | +12 Nước, +3 Côn trùng |
| quest_festival_spirit | Hưởng ứng lễ hội ×2 | **đổi thời tiết hai lần** | +2 Bộ vật liệu, +2 Cỏ trăng |
| Rương Cú Vàng | 3/5 nhiệm vụ | | +25 Nước, +3 Bộ vật liệu, +2 Phân bón, +50 điểm lễ hội |

Kết quả: **làm xong cả 5 trong chưa tới 10 giây mà không cần chơi**. Mỗi ngày nhận miễn phí 52 nước, 8 bộ vật liệu, 3 phân bón (≈ 180 G tiền phân bón), cộng thêm 125 điểm lễ hội (5 lần nhận × 15 + 50 của rương).

## 3. Nhiệm vụ cú sau khi sửa (V24.9.8, làm trong đợt này)

- **3 nhiệm vụ / ngày**, chọn theo cấp và theo việc người chơi đã mở được, cố định trong ngày.
- **Chỉ tính thao tác nông trại thật**, đếm theo số ô, số mẻ, số bữa. Đổi thời tiết, xoay đồ, bưu thiếp, tham quan, vuốt ve: không còn tính.
- **Rương** mở khi xong cả 3.
- **Quà dùng được ngay ở cấp hiện tại.**

| Nhiệm vụ | Có khi | Mục tiêu | Quà |
|---|---|---|---|
| Gieo N ô | luôn có | N = 6 (cấp 1–5), 9 (6–19), 12 (20+) | +N nước (hoàn lại nước đã gieo) |
| Gặt N cây | luôn có | như trên | +6 nước (cấp 1–5) · +2 bộ vật liệu (cấp 6+) |
| Thứ ba, chọn theo ngày trong các việc đã mở: | | | |
| · Gặt 2 lần | luôn có | 2 lần gặt | +6 nước |
| · Chế biến 2 mẻ | cấp 6+ | 2 mẻ | +2 bộ vật liệu, +4 nước |
| · Cho ăn 2 bữa | có sinh vật | 2 bữa | +1 khẩu phần của sinh vật đầu tiên, +4 nước |
| · Thu sản phẩm | có sinh vật | 1 lần | +2 bộ vật liệu |
| **Rương Cú Vàng** | xong 3/3 | | +1 phân bón, +12 nước, +20 điểm lễ hội |

So với trước: nước miễn phí giảm từ 52 xuống khoảng 24–30 mỗi ngày, gần bằng lượng gieo của một ngày chơi bình thường. Phân bón giảm từ 3 xuống 1. Điểm lễ hội từ quà nhiệm vụ giảm từ 125 xuống 65. Mọi con số đều là **giá trị khởi điểm để chỉnh**, không phải con số đã chốt.

## 4. Việc tiếp theo của Phase 3 [CẦN QUYẾT]

1. ~~**Mô phỏng nhịp cấp**~~: xong, xem `progression-sim.md`.
2. ~~**Giá hạt / nguồn Galleons**~~: chọn **A1, giữ giá** (thu nhập p50 772 G/ngày), xem `progression-sim.md` mục *Kết quả*. Còn mở: lưới đỡ cho 25% thành viên kiếm ≤ 36 G/ngày **[CẦN QUYẾT]**.
3. ~~**Gộp tài nguyên** về 4 loại~~: xong ở prototype ngày 18/10/2026 (V24.9.31), xem mục 5. Backend port sau; không migration vì open beta bắt đầu mới.
4. **Nhịp lễ hội**: chạy theo lịch thật, độ dài mỗi lễ, điểm cần cho 3 mốc so với lượng điểm kiếm được mỗi ngày.
5. **Gộp bảng**: Hồ sơ người giữ vườn (Thành tựu, Sổ tay, Lưu bút, Bưu thiếp).

## 5. Gộp tài nguyên và sửa nhiệm vụ cú (18/10/2026, V24.9.31)

Quyết định của chủ dự án ngày 18/10/2026: cho ăn tính theo số bữa; giữ chuỗi ngày; nhiệm vụ "Gặt N lần" dưới cấp 6 chỉ cần 1 lần; lễ hội lên server trước gắn kết; giữ trang trí mua bằng Galleons của Codex; không nhập bản lưu cũ (open beta bắt đầu mới); gộp về 4 loại tài nguyên trước beta; bỏ bộ vật liệu, chi phí chuyển thành nông sản + Galleons; giữ giá hạt và nước (A1).

### 5.1 Bốn loại tài nguyên

| Loại | Gồm | Hiện ở đâu |
|---|---|---|
| **Galleons** | Ví diễn đàn | HUD (đồng xu), chỉ khi nối ví |
| **Kho** | Hạt giống, nông sản, khẩu phần (kể cả côn trùng, cá nhỏ), sản vật sinh vật | Nút Kho trên HUD (số món) và bảng Kho, một màn hình, lọc theo nhóm |
| **Nước** | Nước tưới và **nước phép** (đổi tên từ phân bón, 1:1, vẫn giảm 10% thời gian gốc của một hàng, tối đa một lần mỗi cây) | HUD: giọt nước + lọ tím (lọ chỉ hiện khi nối ví và từ cấp 6) |
| **XP / cấp** | | Vòng cấp trên HUD |

Điểm lễ hội và điểm gắn kết vẫn là thanh tiến độ, không tính là tài nguyên.

**Tên «nước phép».** Bản dịch Lý Lan không có từ này, cũng không có một loại phân bón phép thuật có tên riêng. Truyện dùng «phân bón» (Percy, Q4), «phân rồng» (loại phân giáo sư Sprout ưa dùng, Q5) và «thuốc nước» cho các loại thuốc dạng nước. «Nước phép» không trùng với tên nào trong truyện, nên giữ như chủ dự án chọn. ID nội bộ vẫn là `boost` / `gentle_growth`, để hợp đồng với server không đổi; chỉ đổi chữ hiện cho người chơi.

**Bản lưu.** `balance-data` lên `schemaVersion 2` (`balanceVersion: balance-2026-10-18`). Bản lưu trên máy có schema cũ được thay bằng một vườn mới khi mở, không báo lỗi. Nhiệm vụ cú lên `OWL_QUEST_VERSION 26`; trong cùng ngày vẫn giữ cờ đã mở rương.

### 5.2 Nhiệm vụ cú

| Sửa | Trước | Sau |
|---|---|---|
| "Cho ăn 2 bữa" | Mỗi lần bấm tính 1 | Mỗi sinh vật bắt đầu bữa ăn tính 1; cho cả 3 con ăn cùng lúc = 3 |
| "Gặt N lần" | Luôn 2 | 1 khi dưới cấp 6, 2 từ cấp 6. Người chơi 1 lượt/ngày ở cấp thấp giờ mở được rương |
| Nhổ cây | Bị tính là gặt (so sánh ô trống) | Chỉ lệnh `harvest` mới tính gặt và lượt gặt |
| "Chuỗi N ngày" | | Giữ nguyên; server tính sau |

Luật đếm nằm ở một hàm thuần `questAmounts(act, before, after, command)` trong `garden-quests.mjs`; giao diện và mô phỏng dùng chung hàm này.

### 5.3 Quà thay cho bộ vật liệu

Quy đổi: 1 bộ vật liệu ≈ 2 nông sản (công thức cũ 3 bí ngô + 3 yến mạch → 3 bộ) ≈ 2,4 G theo giá hạt và nước, tính tròn là **4 nước**.

| Nguồn | Trước | Sau |
|---|---|---|
| Nhiệm vụ "Gặt N cây" (cấp 6+) | +2 bộ | +8 nước |
| Nhiệm vụ "Chế biến 2 mẻ" | +2 bộ, +4 nước | +4 nước, +4 Yến mạch |
| Nhiệm vụ "Thu sản phẩm" | +2 bộ | +8 nước |
| Rương Cú Vàng | +1 phân bón, +12 nước, +20 điểm | +1 nước phép, +12 nước, +20 điểm (chỉ đổi tên) |
| Thành tựu Bậc Thầy Chế Biến | +2 bộ, +4 Côn trùng | +8 nước, +4 Côn trùng |
| Thành tựu Kiến Trúc Sư Rừng Cấm | +3 bộ | +12 nước |
| Thành tựu kỷ vật (3 kỷ vật) | +2 bộ, +2 Cỏ trăng | +8 nước, +2 Cỏ trăng |
| Thành tựu cấp 94 | +3 bộ, +3 Ớt lửa | +12 nước, +3 Ớt lửa |
| Thành tựu cấp 100 | +5 bộ, +3 Hoa nhật quang | +20 nước, +3 Hoa nhật quang |
| Lễ hội, mốc 1.000 điểm | +2 phân bón, +35 nước, +3 bộ | +2 nước phép, +47 nước |
| Lễ hội cũ (đã đạt trước V24.9): hal_m2 / yule_m2 / herb_m2 | +2 bộ + nông sản | +8 nước + cùng nông sản |
| Lễ hội cũ hal_m3 | +2 phân bón, +20 nước, +3 bộ | +2 nước phép, +32 nước |
| Gắn kết cấp 3 / 4 / 5 | +1 / +2 / +3 bộ | +4 / +8 / +12 nước (gộp vào nước của mốc đó) |
| Thăm vườn Rồng | +2 bộ, +2 Ớt lửa | +8 nước, +2 Ớt lửa |

`applyGardenReward` từ chối mọi loại quà khác `water` / `boost`, nên một quà `kit` còn sót sẽ báo lỗi chứ không mất im lặng.

### 5.4 Chi phí mới: nông sản + Galleons

Nguyên tắc:
- Mỗi công trình cần 2 loại nông sản đã mở ở cấp đó: một loại cây chủ lực, một loại của tầng cấp gần nhất. Số lượng là bội của 3 (một hàng gieo) và tương đương chi phí cũ (1 bộ ≈ 2 nông sản).
- **4 công trình đầu (tới cấp 24) không tốn Galleons.** Người chơi ít Galleons (p25 = 36 G/ngày) không bị chặn ở đầu game.
- Galleons bắt đầu từ thửa 6 (cấp 36) với 100 G, tăng dần tới 750 G ở thửa 12. **Không công trình nào vượt một ngày thu nhập p50 (772 G).** Tổng 4.050 G, tức khoảng 17 G/ngày trên 240 ngày, khoảng 3% chi phí hạt + nước.
- Engine chỉ trừ nông sản. Galleons do ví trừ, **trong cùng một giao dịch** với lệnh xây (ví mẫu `qa-v19/fixture-wallet.mjs` làm đúng như vậy). Chơi trên máy không có ví nên không bị chặn bởi Galleons; giá vẫn hiện để người chơi quen.

| Công trình | Cấp | Nông sản | Galleons | Thời gian xây |
|---|---|---|---|---|
| pen_1 | 10 | 6 Bí ngô + 6 Cà rốt | 0 | 0 giờ |
| plot_4 | 12 | 9 Bí ngô + 9 Yến mạch | 0 | 1 giờ |
| pen_2 | 22 | 12 Cà rốt + 12 Xà lách | 0 | 2 giờ |
| plot_5 | 24 | 12 Yến mạch + 12 Bạch tiên | 0 | 2 giờ |
| plot_6 | 36 | 18 Puffapod + 18 Cỏ ba lá | 100 | 4 giờ |
| pen_3 | 38 | 18 Củ cải đỏ + 18 Cà rốt | 100 | 4 giờ |
| plot_7 | 48 | 24 Ngô vàng + 24 Lanh | 200 | 6 giờ |
| pen_4 | 54 | 27 Hướng dương + 27 Cỏ ba lá | 200 | 8 giờ |
| plot_8 | 60 | 15 Nữ lang + 30 Bạc hà | 300 | 8 giờ |
| pen_5 | 70 | 18 Việt quất + 36 Ớt lửa | 400 | 12 giờ |
| plot_9 | 72 | 18 Tảo bạc + 36 Đậu sao | 400 | 12 giờ |
| plot_10 | 84 | 21 Dưa hổ phách + 42 Ngô vàng | 500 | 16 giờ |
| pen_6 | 86 | 21 Nấm sương + 45 Ớt lửa | 500 | 16 giờ |
| plot_11 | 96 | 24 Hoa nhật quang + 48 Đậu sao | 600 | 24 giờ |
| plot_12 | 100 | 27 Hoa nhật quang + 27 Dưa hổ phách | 750 | 24 giờ |

Trang trí theo cấp: 5 món đầu vẫn miễn phí. Các món sau cần 6 nông sản loại mới nhất đã mở ở cấp đó, cộng Galleons theo bậc: cấp 23–29: 0 G; 30–49: 40 G; 50–69: 80 G; 70–89: 120 G; 90+: 160 G. Tổng 2.040 G, không bắt buộc. Trang trí cửa hàng của Codex (`decor_*`, 80–600 G) giữ nguyên.

| Trang trí theo cấp | Cấp | Nông sản | Galleons |
|---|---|---|---|
| decoration-3 · Viền luống đá cuội | 3 | — | 0 |
| decoration-7 · Mẫu vườn Bí ngô và Cúc | 7 | — | 0 |
| decoration-11 · Mẫu ổ len Puffskein | 11 | — | 0 |
| decoration-15 · Hàng rào gỗ thấp | 15 | — | 0 |
| decoration-19 · Giàn cành cho Bowtruckle | 19 | — | 0 |
| decoration-23 · Cầu gỗ nhỏ | 23 | 6 Puffapod | 0 |
| decoration-27 · Tủ trưng bày đồ Niffler nhặt | 27 | 6 Nhân sâm | 0 |
| decoration-30 · Đường viền hoa dại | 30 | 6 Cỏ ba lá | 40 |
| decoration-31 · Mẫu sân tròn dưới trăng | 31 | 6 Cỏ ba lá | 40 |
| decoration-35 · Đèn vườn hình trăng | 35 | 6 Củ cải đỏ | 40 |
| decoration-39 · Mẫu nhà kho mái rơm | 39 | 6 Ngô vàng | 40 |
| decoration-43 · Trụ cào và ổ Kneazle | 43 | 6 Cỏ trăng | 40 |
| decoration-46 · Mẫu gối vải Lanh | 46 | 6 Lanh | 40 |
| decoration-47 · Giàn dây leo cạnh ao | 47 | 6 Lanh | 40 |
| decoration-51 · Bồn tắm chim | 51 | 6 Hướng dương | 80 |
| decoration-55 · Hàng rào bốn màu | 55 | 6 Nữ lang | 80 |
| decoration-59 · Cầu đậu lông vũ bốn màu | 59 | 6 Bạc hà | 80 |
| decoration-63 · Mẫu sân đá cho Bằng-Mã | 63 | 6 Việt quất | 80 |
| decoration-67 · Cầu đậu cánh lớn | 67 | 6 Ớt lửa | 80 |
| decoration-71 · Đèn sương trong vườn | 71 | 6 Tảo bạc | 120 |
| decoration-75 · Cầu đá dưới trăng | 75 | 6 Đậu sao | 120 |
| decoration-80 · Viền luống hoa bạc | 80 | 6 Dưa hổ phách | 120 |
| decoration-81 · Vòm cây cho Kỳ lân | 81 | 6 Dưa hổ phách | 120 |
| decoration-83 · Mẫu chòi nghỉ bờm bạc | 83 | 6 Dưa hổ phách | 120 |
| decoration-87 · Hàng rào khu sinh vật lớn | 87 | 6 Nấm sương | 120 |
| decoration-91 · Cổng ba vòm | 91 | 6 Nấm sương | 160 |
| decoration-95 · Bệ trưng bày vảy Rồng | 95 | 6 Hoa nhật quang | 160 |
| decoration-98 · Đài quan sát Rồng | 98 | 6 Hoa nhật quang | 160 |
| decoration-99 · Mẫu bố trí Đại khu vườn | 99 | 6 Hoa nhật quang | 160 |

Mô phỏng chạy lại (`node garden-v05/sim-progression.mjs 240`, xem `progression-sim.md`): mọi thửa và chuồng mở cùng ngày hoặc lệch 1 ngày so với trước; cấp 100 ở ngày 203 thay vì 204.

### 5.5 Đường lách chi phí và cách chặn

| Đường lách | Hiện trạng | Cách chặn (server phải giữ) |
|---|---|---|
| **Tài khoản phụ** chuyển nông sản sang tài khoản chính | Không có tính năng tặng hay đổi nông sản giữa các vườn | Không thêm API tặng hoặc đổi nông sản. Galleons trừ từ ví của chính người bấm xây. Chuyển Galleons trên diễn đàn là việc của kinh tế diễn đàn, ngoài phạm vi vườn |
| **Tặng quà** | Không có | Như trên |
| **Thăm vườn** lặp lại để nhận quà | Mỗi vườn danh dự chỉ nhận 1 lần (`helpedIds`); hiện lưu trên máy | Server lưu `helpedIds` và trả quà, không tin máy khách |
| **Lễ hội** lặp mốc | Mỗi mốc nhận 1 lần mỗi lễ hội; quà chỉ là nước, nước phép, nông sản | Server tính điểm và đánh dấu mốc theo `eventId` (đã quyết: lễ hội lên server trước gắn kết) |
| **Đổi nhiệm vụ cú** (lên cấp giữa ngày, xóa bộ nhớ, đổi máy) | Bộ nhiệm vụ cố định theo ngày ngay lần đọc đầu; prototype lưu trên máy | Server giữ bộ nhiệm vụ của `dayKey` (giờ Việt Nam) từ lần đọc đầu; không chọn lại khi lên cấp |
| **Thành tựu / gắn kết** nhận nhiều lần | Mỗi quà có ID, nhận 1 lần | Server lưu ID đã nhận |
| **Mua nông sản bằng Galleons** để bỏ qua thời gian | Chỉ mua được hạt (hạn mức 12 gói/ngày/loại), vẫn phải chờ cây lớn; khẩu phần mua được không dùng để xây | Giữ hạn mức hạt; không bán nông sản thành phẩm |
| **Hủy xây để lấy lại** | Không có lệnh hủy; dời công trình (`moveBuilding`) không hoàn gì | Không thêm lệnh hủy hay hoàn tiền |
| **Nhổ cây** để đếm nhiệm vụ | Đã sửa (mục 5.2) | Server đã sửa giống prototype (Phase 4 bước 1) |
| **Hồ sơ thử (lab, `testProfile`)** có 1.000 mỗi loại | Chỉ chạy trên máy, gắn `developerProfile` | Server không bao giờ nhận trạng thái do máy khách gửi |
| **Hai tab cùng bấm xây** | Engine kiểm tra rồi mới trừ | Một transaction cho cả vườn và ví, có `requestId` chống lặp (máy khách đã gửi `requestId` cho mọi lệnh) |

### 5.6 Bảng giá Galleons cho backend

Phiên server Phase 4 port bảng dưới vào `functions/games/garden-wallet-catalog.js` (giá cửa hàng) và `garden-balance` (`cropCost`, `galleons` của công trình và trang trí). Nguồn sự thật: `garden-v05/balance-data.mjs` và `garden-v05/garden-store-catalog.mjs`. Thần thiếp không sửa repo HPVNN.

**Thay đổi so với server hiện tại**
1. Bỏ công thức `kits` và `kits_flax`, bỏ mục `kit` khỏi kho, bỏ `kitCost`.
2. Lệnh `build {expansionId}` và `buyDecoration {level}`: kiểm tra đủ nông sản và `spendable >= galleons`, rồi trừ nông sản trong vườn và ghi một dòng sổ cái trừ Galleons, cùng một transaction. Mã lỗi khi thiếu Galleons nên tách riêng với thiếu nông sản, để giao diện báo đúng.
3. Nhãn `gentle_growth`: «Nước phép»; mô tả: «Tưới một hàng đang lớn: giảm 10% thời gian gốc, tối đa một lần mỗi cây; không nhận XP khi dùng.» Giá 60 G, hạn mức 2/ngày, không đổi.
4. Quà nhiệm vụ, rương, lễ hội, gắn kết, thành tựu, thăm vườn theo mục 5.3; nhiệm vụ theo mục 5.2.
5. `schemaVersion 2`, `balanceVersion balance-2026-10-18`. Không migration: open beta bắt đầu mới.

**Công trình và trang trí theo cấp:** xem hai bảng ở mục 5.4 (cột Galleons).

**Cửa hàng (không đổi giá, chỉ đổi nhãn nước phép)**

| id cửa hàng | Loại | Cấp | Giá (G) | Số lượng/gói | Hạn mức/ngày |
|---|---|---|---|---|---|
| seed_pumpkin | seed | 1 | 2 | 3 | 12 |
| seed_daisy | seed | 2 | 2 | 3 | 12 |
| seed_strawberry | seed | 4 | 2 | 3 | 12 |
| seed_oats | seed | 6 | 2 | 3 | 12 |
| seed_carrot | seed | 8 | 2 | 3 | 12 |
| seed_lettuce | seed | 12 | 3 | 3 | 12 |
| seed_dittany | seed | 16 | 4 | 3 | 12 |
| seed_puffapod | seed | 20 | 4 | 3 | 12 |
| seed_mandrake | seed | 24 | 5 | 3 | 12 |
| seed_clover | seed | 28 | 6 | 3 | 12 |
| seed_beet | seed | 32 | 7 | 3 | 12 |
| seed_maize | seed | 36 | 8 | 3 | 12 |
| seed_moonherb | seed | 40 | 8 | 3 | 12 |
| seed_flax | seed | 44 | 9 | 3 | 12 |
| seed_sunflower | seed | 48 | 10 | 3 | 12 |
| seed_valerian | seed | 52 | 11 | 3 | 12 |
| seed_mint | seed | 56 | 12 | 3 | 12 |
| seed_blueberry | seed | 60 | 12 | 3 | 12 |
| seed_firepepper | seed | 64 | 13 | 3 | 12 |
| seed_silverkelp | seed | 68 | 14 | 3 | 12 |
| seed_starbean | seed | 72 | 15 | 3 | 12 |
| seed_ambermelon | seed | 78 | 16 | 3 | 12 |
| seed_mistmushroom | seed | 84 | 17 | 3 | 12 |
| seed_sunpetal | seed | 92 | 19 | 3 | 12 |
| water | water | 1 | 5 | 9 | 24 |
| puff_feed | food | 10 | 15 | 1 | 2 |
| bow_feed | food | 18 | 27 | 1 | 2 |
| niffler_feed | food | 26 | 39 | 1 | 2 |
| moon_feed | food | 34 | 51 | 1 | 2 |
| kneazle_feed | food | 42 | 63 | 1 | 2 |
| diri_feed | food | 50 | 75 | 1 | 2 |
| fwoo_feed | food | 58 | 87 | 1 | 2 |
| hippo_feed | food | 66 | 99 | 1 | 2 |
| thestral_feed | food | 74 | 111 | 1 | 2 |
| unicorn_feed | food | 82 | 123 | 1 | 2 |
| dog_feed | food | 90 | 135 | 2 | 2 |
| dragon_feed | food | 94 | 141 | 2 | 2 |
| gentle_growth | boost | 6 | 60 | 1 | 2 |
| decor_pumpkin_lantern | decoration | 1 | 80 | 1 | 1 |
| decor_broom_rack | decoration | 3 | 120 | 1 | 1 |
| decor_cauldron | decoration | 6 | 180 | 1 | 1 |
| decor_mandrake_planter | decoration | 10 | 240 | 1 | 1 |
| decor_floating_candles | decoration | 16 | 360 | 1 | 1 |
| decor_vine_arch | decoration | 24 | 600 | 1 | 1 |
