# Phase 3 — Rà soát kinh tế và nhiệm vụ cú

> 18/10/2026 · Claude Code (Anthropic). Số liệu đọc từ code prototype (`balance-data`, `garden-store-catalog`, `garden-quests`, `garden-events`) và backend ví trên nhánh `codex/hagrid-garden-wallet-local-20261013` (`functions/games/garden-action-core.js`, chỉ đọc).
> Mục **[CẦN QUYẾT]** là đề xuất chờ chủ dự án duyệt. Phần nhiệm vụ cú làm ngay vì core-design đã duyệt hướng đi ("3 nhiệm vụ/ngày, chỉ gắn với hành động thật").

## 1. Bản đồ tài nguyên hiện tại

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
| **Điểm lễ hội** | Thao tác nông trại, nhận quà nhiệm vụ (+15), rương (+50), thao tác miễn phí (có trần từ V24.9) | 3 mốc / lễ hội (30 / 75 / 150) | Tách riêng từng lễ hội từ V24.9 |
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
3. **Gộp tài nguyên** về 4 loại (core-design mục 5): một đợt riêng, phải sửa cả backend và có migration bản lưu.
4. **Nhịp lễ hội**: chạy theo lịch thật, độ dài mỗi lễ, điểm cần cho 3 mốc so với lượng điểm kiếm được mỗi ngày.
5. **Gộp bảng**: Hồ sơ người giữ vườn (Thành tựu, Sổ tay, Lưu bút, Bưu thiếp).
