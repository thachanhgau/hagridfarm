# Phase 3 — Mô phỏng nhịp cấp

> 18/10/2026 · Claude Code (Anthropic) · Chạy lại: `node garden-v05/sim-progression.mjs 240`
> Mục **[CẦN QUYẾT]** chờ chủ dự án duyệt. Chưa sửa con số balance nào trong đợt này.

## Cách làm

Một bot chơi **engine thật** (`progression-engine.mjs`), mỗi ngày đúng giờ: 2 lượt (08:00, 20:00), 3 lượt (08:00, 13:00, 21:00) hoặc 4 lượt (08:00, 12:00, 17:00, 22:00). Mỗi lượt bot làm theo thứ tự:
1. Nhận hết: công trình, mẻ chế biến, sản phẩm sinh vật, cây chín.
2. Xây thửa/chuồng kế tiếp khi đủ cấp và bộ vật liệu.
3. Đón sinh vật mới khi chuồng còn chỗ.
4. Chế biến bộ vật liệu và khẩu phần còn thiếu.
5. Cho ăn.
6. Gieo kín mọi hàng trống: ưu tiên cây cần cho công thức, còn lại chọn cây nhiều XP nhất mà vẫn kịp chín trước lượt sau.

Galleons tính theo luật ví: mỗi ô gieo tốn 1 hạt (giá cửa hàng / 3) và 1 nước (5 G / 9). Cột "sau nước từ nhiệm vụ cú" trừ phần nước nhận từ 3 nhiệm vụ và rương mỗi ngày (luật V24.9.8).

**Giới hạn:** bot là người chơi **hoàn hảo**: không bao giờ lỡ lượt, không để ô trống, không mua trang trí, không dùng phân bón, không tính quà lễ hội, gắn kết, thành tựu. Người thật sẽ **chậm hơn** và **tiêu ít hơn mỗi ngày**, nhưng tổng chi để lên cùng một cấp thì gần như vậy.

| Mốc | 2 lượt/ngày | 3 lượt/ngày | 4 lượt/ngày |
|---|---|---|---|
| Cấp 5 | ngày 2 | ngày 1 | ngày 1 |
| Cấp 10 | ngày 5 | ngày 4 | ngày 3 |
| Cấp 20 | ngày 13 | ngày 11 | ngày 10 |
| Cấp 30 | ngày 26 | ngày 21 | ngày 22 |
| Cấp 40 | ngày 43 | ngày 35 | ngày 37 |
| Cấp 50 | ngày 63 | ngày 53 | ngày 57 |
| Cấp 60 | ngày 88 | ngày 75 | ngày 81 |
| Cấp 70 | ngày 117 | ngày 101 | ngày 111 |
| Cấp 80 | ngày 149 | ngày 131 | ngày 144 |
| Cấp 90 | ngày 186 | ngày 165 | ngày 184 |
| Cấp 100 | ngày 229 | ngày 204 | ngày 228 |
| Cấp sau 240 ngày | 100 | 100 | 100 |

## Mở thửa và chuồng (3 lượt/ngày)

| Công trình | Cấp yêu cầu | Mở vào ngày | Cấp lúc mở |
|---|---|---|---|
| pen_1 | 10 | 4 | 11 |
| plot_4 | 12 | 5 | 12 |
| pen_2 | 22 | 13 | 23 |
| plot_5 | 24 | 15 | 24 |
| plot_6 | 36 | 30 | 36 |
| pen_3 | 38 | 34 | 39 |
| plot_7 | 48 | 50 | 48 |
| pen_4 | 54 | 63 | 54 |
| plot_8 | 60 | 76 | 60 |
| pen_5 | 70 | 102 | 70 |
| plot_9 | 72 | 108 | 72 |
| plot_10 | 84 | 145 | 84 |
| pen_6 | 86 | 152 | 86 |
| plot_11 | 96 | 190 | 96 |
| plot_12 | 100 | 206 | 100 |

## Chi phí mỗi ngày (3 lượt/ngày, trung bình theo tháng)

| Tháng | Cấp cuối tháng | Ô gieo/ngày | Galleons/ngày | Sau nước từ nhiệm vụ cú |
|---|---|---|---|---|
| 1 | 36 | 118 | 221.2 | 205.6 |
| 2 | 53 | 171 | 472.2 | 456.1 |
| 3 | 66 | 199 | 678.0 | 661.9 |
| 4 | 76 | 223 | 854.1 | 837.9 |
| 5 | 85 | 245 | 1003.3 | 987.2 |
| 6 | 94 | 264 | 1080.5 | 1064.4 |
| 7 | 100 | 287 | 1162.2 | 1146.1 |
| 8 | 100 | 317 | 1290.7 | 1274.6 |

Thêm (3 lượt/ngày): tuần đầu tốn khoảng **122 G/ngày** (851 G cả tuần). Phần hạt chiếm 59% chi phí ở tuần đầu, 86% ở tháng 6. **Tổng để lên cấp 100: khoảng 156.500 G.** Số sinh vật: 4 (tháng 1), 7 (tháng 3), 11 (tháng 6).

## Phát hiện

1. **Nhịp cấp gần mục tiêu, dồn ở đầu.** Người chơi hoàn hảo 3 lượt/ngày đạt cấp 100 ở ngày 204 (khoảng 6,7 tháng), dài hơn mục tiêu 4–6 tháng một chút. Người thật có lẽ mất 8–12 tháng. Đầu game rất nhanh (cấp 10 ngày 4, cấp 30 ngày 21), cuối game chậm (cấp 90 → 100 mất 39 ngày).
2. **Chi phí Galleons tăng khoảng 5 lần** từ tháng 1 (≈ 220 G/ngày) tới tháng 6 (≈ 1.080 G/ngày), vì có thêm thửa và hạt cấp cao đắt hơn (tới 6,3 G/hạt). Nhiệm vụ cú chỉ bù khoảng 16 G/ngày.
3. **Chưa biết người chơi chịu được mức này không.** Galleons trên diễn đàn đến từ điểm danh 7 ngày, thưởng game, lãi ngân hàng, vòng quay. Lượng của từng nguồn do admin cấu hình trên dữ liệu live, không có trong code. **Cần số liệu thật**: một thành viên tích cực kiếm trung bình bao nhiêu G/ngày.
4. **Bộ vật liệu không phải nút thắt.** Thửa/chuồng mở ngay khi đủ cấp. Công thức bộ vật liệu rẻ (3 bí ngô + 3 yến mạch → 3 bộ), nên cấp độ là thứ duy nhất chặn việc mở rộng.
5. **Chơi dày không được thưởng.** XP/giờ của cây tăng theo cấp; cây 6 giờ có XP/giờ cao nhất, không có cây ngắn nào "đáng" để vào game thường xuyên hơn. Trong mô phỏng, 4 lượt/ngày còn chậm hơn 3 lượt (một phần do bot chỉ chọn cây kịp chín trước lượt sau).

## Đề xuất [CẦN QUYẾT]

| # | Vấn đề | Lựa chọn | Thần thiếp đề xuất |
|---|---|---|---|
| A | Galleons/ngày | (1) Giữ, nếu thu nhập diễn đàn đủ; (2) giảm giá hạt cấp cao (ví dụ trần 3 G/hạt); (3) cho bán nông sản / sản phẩm sinh vật lấy Galleons, có trần ngày; (4) quà nhiệm vụ cú tặng hạt thay vì nước | Quyết **sau khi có số thu nhập thật**. Nếu thu nhập < 300 G/ngày thì (2) + (4) trước, (3) để sau vì phải chống cày |
| B | Thời gian lên cấp 100 | (1) Giữ (~6,7 tháng với người chơi hoàn hảo); (2) giảm XP cần ở cấp 70–100 khoảng 20% để người hoàn hảo xong ~5,5 tháng | (1) **Giữ**: game nuôi dài hơi, đầu game đã nhanh. Xem lại sau playtest thật |
| C | Chơi dày không có lợi | (1) Giữ; (2) thêm "thưởng gặt tươi" khi gặt trong vòng 1 giờ sau khi chín; (3) thêm cây 2–3 giờ ở mỗi tầng cấp với XP/giờ ngang cây 6 giờ | (3) nếu muốn người chơi quay lại ban ngày; nếu không thì (1) |
| D | Bộ vật liệu dư thừa | (1) Giữ; (2) tăng chi phí; (3) gộp vào chi phí xây (core-design mục 5) | (3) khi làm đợt gộp tài nguyên |

## Phương án A: khung quyết định (chủ dự án giao chọn, 18/10/2026)

Chủ dự án: *"em tự tra … rồi chọn phương án A"*. Lệnh đọc BigQuery production đã bị chế độ auto chặn, nên **chưa có số thu nhập thật**. Quy tắc dưới đây chốt trước; có số là áp ngay, không cần bàn lại.

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

**Bệ hạ cần cung cấp:** thu nhập Galleons trung bình mỗi ngày của một thành viên tích cực, và của một thành viên bình thường (lấy từ dữ liệu ví hoặc báo cáo Gringotts).
