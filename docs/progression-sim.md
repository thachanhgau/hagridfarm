# Phase 3 — Mô phỏng nhịp cấp

> 18/10/2026 · Claude Code (Anthropic) · Chạy lại: `node garden-v05/sim-progression.mjs 240`
> Mục **[CẦN QUYẾT]** chờ chủ dự án duyệt. Bảng dưới chạy lại ngày 18/10/2026 sau đợt gộp tài nguyên (V24.9.31, `economy-audit.md` mục 5): bộ vật liệu đã bỏ, thửa/chuồng tốn nông sản + Galleons.

## Cách làm

Một bot chơi **engine thật** (`progression-engine.mjs`), mỗi ngày đúng giờ: 2 lượt (08:00, 20:00), 3 lượt (08:00, 13:00, 21:00) hoặc 4 lượt (08:00, 12:00, 17:00, 22:00). Mỗi lượt bot làm theo thứ tự:
1. Nhận hết: công trình, mẻ chế biến, sản phẩm sinh vật, cây chín.
2. Xây thửa/chuồng kế tiếp khi đủ cấp và đủ nông sản (Galleons tính vào chi phí, bot không bị chặn bởi ví).
3. Đón sinh vật mới khi chuồng còn chỗ.
4. Chế biến khẩu phần còn thiếu, giữ lại nông sản cho công trình kế tiếp.
5. Cho ăn.
6. Gieo kín mọi hàng trống: ưu tiên cây cần cho công thức, còn lại chọn cây nhiều XP nhất mà vẫn kịp chín trước lượt sau.

Galleons tính theo luật ví: mỗi ô gieo tốn 1 hạt (giá cửa hàng / 3) và 1 nước (5 G / 9). Cột "trong đó xây" là Galleons trả cho thửa/chuồng. Cột "sau nước từ nhiệm vụ cú" trừ phần nước nhận từ 3 nhiệm vụ và rương mỗi ngày (luật 18/10/2026).

**Giới hạn:** bot là người chơi **hoàn hảo**: không bao giờ lỡ lượt, không để ô trống, không mua trang trí, không dùng nước phép, không tính quà lễ hội, gắn kết, thành tựu. Người thật sẽ **chậm hơn** và **tiêu ít hơn mỗi ngày**, nhưng tổng chi để lên cùng một cấp thì gần như vậy.

| Mốc | 2 lượt/ngày | 3 lượt/ngày | 4 lượt/ngày |
|---|---|---|---|
| Cấp 5 | ngày 2 | ngày 1 | ngày 1 |
| Cấp 10 | ngày 5 | ngày 4 | ngày 3 |
| Cấp 20 | ngày 13 | ngày 11 | ngày 10 |
| Cấp 30 | ngày 26 | ngày 21 | ngày 22 |
| Cấp 40 | ngày 42 | ngày 35 | ngày 37 |
| Cấp 50 | ngày 63 | ngày 53 | ngày 57 |
| Cấp 60 | ngày 87 | ngày 75 | ngày 81 |
| Cấp 70 | ngày 116 | ngày 101 | ngày 110 |
| Cấp 80 | ngày 148 | ngày 130 | ngày 144 |
| Cấp 90 | ngày 185 | ngày 164 | ngày 182 |
| Cấp 100 | ngày 228 | ngày 203 | ngày 227 |
| Cấp sau 240 ngày | 100 | 100 | 100 |

## Mở thửa và chuồng (3 lượt/ngày)

| Công trình | Cấp yêu cầu | Mở vào ngày | Cấp lúc mở |
|---|---|---|---|
| pen_1 | 10 | 4 | 11 |
| plot_4 | 12 | 5 | 13 |
| pen_2 | 22 | 13 | 23 |
| plot_5 | 24 | 15 | 25 |
| plot_6 | 36 | 30 | 36 |
| pen_3 | 38 | 33 | 38 |
| plot_7 | 48 | 50 | 48 |
| pen_4 | 54 | 62 | 54 |
| plot_8 | 60 | 76 | 60 |
| pen_5 | 70 | 102 | 70 |
| plot_9 | 72 | 107 | 72 |
| plot_10 | 84 | 145 | 84 |
| pen_6 | 86 | 152 | 86 |
| plot_11 | 96 | 189 | 96 |
| plot_12 | 100 | 204 | 100 |

## Chi phí mỗi ngày (3 lượt/ngày, trung bình theo tháng)

| Tháng | Cấp cuối tháng | Ô gieo/ngày | Galleons/ngày | trong đó xây | Sau nước từ nhiệm vụ cú |
|---|---|---|---|---|---|
| 1 | 36 | 119 | 228.5 | 3.3 | 208.5 |
| 2 | 53 | 172 | 490.0 | 10.0 | 469.4 |
| 3 | 66 | 198 | 696.1 | 16.7 | 675.5 |
| 4 | 76 | 220 | 891.1 | 26.7 | 870.5 |
| 5 | 86 | 239 | 1002.6 | 16.7 | 982.0 |
| 6 | 94 | 263 | 1094.8 | 16.7 | 1074.2 |
| 7 | 100 | 283 | 1205.4 | 45.0 | 1184.8 |
| 8 | 100 | 317 | 1288.3 | 0.0 | 1267.7 |

## Galleons cho mở rộng so với thu nhập (p50 772 G/ngày, p25 36 G/ngày)

| Công trình | Nông sản | Galleons | Ngày thu nhập p50 | Ngày thu nhập p25 |
|---|---|---|---|---|
| pen_1 | 6 Bí ngô + 6 Cà rốt | 0 | 0.00 | 0.0 |
| plot_4 | 9 Bí ngô + 9 Yến mạch | 0 | 0.00 | 0.0 |
| pen_2 | 12 Cà rốt + 12 Xà lách | 0 | 0.00 | 0.0 |
| plot_5 | 12 Yến mạch + 12 Bạch tiễn | 0 | 0.00 | 0.0 |
| plot_6 | 18 Puffapod + 18 Cỏ ba lá | 100 | 0.13 | 2.8 |
| pen_3 | 18 Củ cải đỏ + 18 Cà rốt | 100 | 0.13 | 2.8 |
| plot_7 | 24 Ngô vàng + 24 Lanh | 200 | 0.26 | 5.6 |
| pen_4 | 27 Hướng dương + 27 Cỏ ba lá | 200 | 0.26 | 5.6 |
| plot_8 | 15 Nữ lang + 30 Bạc hà | 300 | 0.39 | 8.3 |
| pen_5 | 18 Việt quất + 36 Ớt lửa | 400 | 0.52 | 11.1 |
| plot_9 | 18 Tảo bạc + 36 Đậu sao | 400 | 0.52 | 11.1 |
| plot_10 | 21 Dưa hổ phách + 42 Ngô vàng | 500 | 0.65 | 13.9 |
| pen_6 | 21 Nấm sương + 45 Ớt lửa | 500 | 0.65 | 13.9 |
| plot_11 | 24 Hoa nhật quang + 48 Đậu sao | 600 | 0.78 | 16.7 |
| plot_12 | 27 Hoa nhật quang + 27 Dưa hổ phách | 750 | 0.97 | 20.8 |

Tổng Galleons mở rộng: 4050 G (16.9 G/ngày trên 240 ngày). Galleons cho trang trí cấp: 2040 G, không bắt buộc.

Thêm (3 lượt/ngày): tuần đầu tốn khoảng **124 G/ngày** (865 G cả tuần). Phần hạt chiếm 59% chi phí ở tuần đầu, 85% ở tháng 6. **Tổng để lên cấp 100: khoảng 159.300 G**, trong đó 4.050 G cho thửa/chuồng. Số sinh vật: 4 (tháng 1), 7 (tháng 3), 12 (tháng 6).

So với trước đợt gộp: không công trình nào mở muộn hơn; 10 công trình mở cùng ngày, pen_3, pen_4, plot_9, plot_11 sớm hơn 1 ngày, plot_12 sớm hơn 2 ngày (bot lên cấp nhanh hơn một chút vì gieo thêm cây cho công trình). Cấp 100 ở ngày 203 thay vì 204. Chi phí trung bình mỗi tháng thay đổi từ −2 tới +43 G/ngày, gồm Galleons xây và hạt cho nông sản xây.

## Phát hiện

1. **Nhịp cấp gần mục tiêu, dồn ở đầu.** Người chơi hoàn hảo 3 lượt/ngày đạt cấp 100 ở ngày 204 (khoảng 6,7 tháng), dài hơn mục tiêu 4–6 tháng một chút. Người thật có lẽ mất 8–12 tháng. Đầu game rất nhanh (cấp 10 ngày 4, cấp 30 ngày 21), cuối game chậm (cấp 90 → 100 mất 39 ngày).
2. **Chi phí Galleons tăng khoảng 5 lần** từ tháng 1 (≈ 220 G/ngày) tới tháng 6 (≈ 1.080 G/ngày), vì có thêm thửa và hạt cấp cao đắt hơn (tới 6,3 G/hạt). Nhiệm vụ cú chỉ bù khoảng 16 G/ngày.
3. **Chưa biết người chơi chịu được mức này không.** Galleons trên diễn đàn đến từ điểm danh 7 ngày, thưởng game, lãi ngân hàng, vòng quay. Lượng của từng nguồn do admin cấu hình trên dữ liệu live, không có trong code. **Cần số liệu thật**: một thành viên tích cực kiếm trung bình bao nhiêu G/ngày.
4. ~~**Bộ vật liệu không phải nút thắt.**~~ Đã bỏ bộ vật liệu (18/10/2026). Với chi phí nông sản mới, cấp độ vẫn là thứ chặn chính; nông sản chỉ làm chậm tối đa một lượt.
5. **Chơi dày không được thưởng.** XP/giờ của cây tăng theo cấp; cây 6 giờ có XP/giờ cao nhất, không có cây ngắn nào "đáng" để vào game thường xuyên hơn. Trong mô phỏng, 4 lượt/ngày còn chậm hơn 3 lượt (một phần do bot chỉ chọn cây kịp chín trước lượt sau).

## Đề xuất [CẦN QUYẾT]

| # | Vấn đề | Lựa chọn | Thần thiếp đề xuất |
|---|---|---|---|
| A | Galleons/ngày | (1) Giữ, nếu thu nhập diễn đàn đủ; (2) giảm giá hạt cấp cao (ví dụ trần 3 G/hạt); (3) cho bán nông sản / sản phẩm sinh vật lấy Galleons, có trần ngày; (4) quà nhiệm vụ cú tặng hạt thay vì nước | Quyết **sau khi có số thu nhập thật**. Nếu thu nhập < 300 G/ngày thì (2) + (4) trước, (3) để sau vì phải chống cày |
| B | Thời gian lên cấp 100 | (1) Giữ (~6,7 tháng với người chơi hoàn hảo); (2) giảm XP cần ở cấp 70–100 khoảng 20% để người hoàn hảo xong ~5,5 tháng | (1) **Giữ**: game nuôi dài hơi, đầu game đã nhanh. Xem lại sau playtest thật |
| C | Chơi dày không có lợi | (1) Giữ; (2) thêm "thưởng gặt tươi" khi gặt trong vòng 1 giờ sau khi chín; (3) thêm cây 2–3 giờ ở mỗi tầng cấp với XP/giờ ngang cây 6 giờ | (3) nếu muốn người chơi quay lại ban ngày; nếu không thì (1) |
| D | Bộ vật liệu dư thừa | (1) Giữ; (2) tăng chi phí; (3) gộp vào chi phí xây (core-design mục 5) | **Xong (18/10/2026)**: bỏ hẳn, chi phí thành nông sản + Galleons |

## Phương án A: khung quyết định (chủ dự án giao chọn, 18/10/2026)

Chủ dự án: *"em tự tra … rồi chọn phương án A"*. Quy tắc dưới đây được chốt **trước khi có số**, để số liệu không làm lệch lựa chọn. Kết quả nằm ở mục *Kết quả* bên dưới.

**Số cần lấy:** `bash docs/galleons-income.sh` (chỉ đọc BigQuery, chỉ ra số tổng hợp). Dùng **I = `p50_per_day`**, tức thu nhập mỗi ngày của thành viên ở giữa (không tính vòng quay, vay, cược; bỏ tài khoản admin/HPH).

**Chi phí tham chiếu cho người chơi thật** (giả định chơi bằng 60% người chơi hoàn hảo; con số giả định, sẽ chỉnh khi có playtest):

| | Giá hiện tại | Trần 3 G/hạt | Trần 2 G/hạt |
|---|---|---|---|
| Người hoàn hảo, tháng 1 / 3 / 6 (G/ngày) | 221 / 678 / 1.081 | 221 / 552 / 732 | 213 / 420 / 557 |
| Người thật ≈ 60%, tháng 1 / 6 (G/ngày) | ≈ 130 / 650 | ≈ 130 / 440 | ≈ 130 / 335 |
| Tổng tới cấp 100 (người hoàn hảo) | ≈ 156.500 | ≈ 116.200 | ≈ 90.100 |

**Quy tắc chọn:**
1. **I ≥ 650 G/ngày** → **A1**: giữ giá. Khu vườn là chỗ tiêu Galleons lành mạnh của diễn đàn.
2. **330 ≤ I < 650** → **A2 với trần 3 G/hạt**, cộng **A4**: quà nhiệm vụ "Gieo N ô" đổi từ N nước sang N hạt của loại cây đang gieo nhiều nhất.
3. **130 ≤ I < 330** → **A2 với trần 2 G/hạt**, cộng **A4**.
4. **I < 130** → như mục 3, **cộng A3**: cho bán nông sản lấy Galleons, có trần mỗi ngày bằng khoảng 30% chi phí tháng 1 (≈ 40 G/ngày), chỉ tính trên server. Trước khi làm A3, phải rà các đường lách giới hạn (nhiều tài khoản, nhiều tab).

Mọi thay đổi giá đều phải sửa ở **cả** `garden-store-catalog.mjs` của prototype **và** `functions/games/garden-wallet-catalog.js` của backend; mô phỏng chạy lại bằng tham số `seedPriceCap`.

### Kết quả (18/10/2026): chọn **A1, giữ giá**

Nguồn: BigQuery `hpvnn-archive.galleons.ledger`, chỉ đọc, chỉ lấy số tổng hợp (chủ dự án cho phép ngày 18/10/2026). Đã loại 3 tài khoản từng rút ngân hàng (admin/HPH). Lệnh chạy: `docs/galleons-income.sh` và các truy vấn ghi dưới đây.

**Giới hạn của dữ liệu**
- Sổ cái mới có từ **02/10/2026**, nên mới có **17 ngày**. Số 30 ngày trong script đang chia cho 30, tức thấp hơn thực tế.
- Chỉ có **52 thành viên** có giao dịch, trung bình hoạt động 8,3/17 ngày.
- Ngày 16–17/10 có một đợt thưởng tay đột biến, **≈ 12 triệu G trong 2 ngày** (các ngày khác 7.000–620.000 G). Vì vậy số đại diện là khoảng **02–15/10 (14 ngày)**, không tính đợt này.

| G/ngày/thành viên (lịch, 02–15/10) | p25 | p50 | p75 | p90 |
|---|---|---|---|---|
| Thu nhập (trò chơi + điểm danh + thưởng tay) | 36 | **772** | 9.007 | 14.149 |
| Chỉ trò chơi + điểm danh | — | 61 | 689 | — |

Thêm vài số:
- Tính cả 16–17/10: p50 ≈ 3.580 G/ngày.
- Thưởng tay là nguồn chính: 51/52 thành viên có nhận, trung vị 7 lần, tổng 60.702 G trong 17 ngày.
- Vòng quay đang **trả ra ròng** cho thành viên: khoảng +990 G/ngày/thành viên theo cách chia 30 ngày.
- Cửa hàng diễn đàn thu khoảng 7.560 G/ngày/thành viên theo cách chia 30 ngày.

**Áp quy tắc:** I = p50 = 772 G/ngày ≥ 650, nên chọn **A1**. Giá hạt và nước giữ nguyên, không đổi quà nhiệm vụ.
- Có 31/51 thành viên kiếm được ≥ 221 G/ngày (chi phí tháng 1 của người hoàn hảo).
- Có 28/51 thành viên kiếm được ≥ 678 G/ngày (chi phí tháng 3).

**Rủi ro còn lại [CẦN QUYẾT]**
1. **Một phần tư thành viên kiếm ≤ 36 G/ngày**, dưới cả chi phí tuần 1 (≈ 122 G/ngày người hoàn hảo, ≈ 73 G/ngày người thật). Nhóm này sẽ bị chặn sớm. Có thể làm một "lưới đỡ" nhỏ theo A3 (bán nông sản, trần thấp), nhưng phải rà đường lách giới hạn trước. Chưa làm.
2. **Thu nhập dựa vào thưởng tay của ban quản trị.** Nếu thưởng tay giảm, chỉ còn trò chơi + điểm danh (p50 61 G/ngày), lúc đó quy tắc sẽ ra A2 + A4, thậm chí A3.
3. **Chạy lại khi sổ cái đủ 60 ngày** (khoảng 01/12/2026) bằng `bash docs/galleons-income.sh 60`. Nếu p50 tụt dưới 650 thì áp lại quy tắc trên.
