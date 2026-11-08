# Khu Vườn Hagrid — Thử thách từ cấp 160

Owner 08/11/2026: «lên plan nếu từ level 160 trở lên có gì challenge hơn cho player» → «làm hết đi» (cả 6 phần A–F,
gồm cả phần có thể làm mất sản lượng: E luân canh, F thời tiết).

## 0. Hiện trạng
- 2 lượt/ngày: cấp 160 ≈ ngày 77, cấp 500 ≈ ngày 203 (`level-500-roadmap.md` §3). Đoạn 160–500 chỉ mở 5 cây
  (160, 200, 250, 310, 380, 450) và 4 thửa (160, 200, 260, 330).
- Vòng ngày giữ nguyên từ cấp 20: 3 đơn hàng, thông thạo cây, Cúp Nhà (`functions/games/garden-retention-core.js`).
- Khó hơn duy nhất: bậc trách nhiệm từ 130 (`big-update-25-roadmap.md` §5), là phạt.

## 1. Luật chung (giữ của roadmap)
- Thưởng: danh tiếng, trang trí, vật phẩm tiêu hao. Không tăng XP hay sản lượng vĩnh viễn.
- Người 2 lượt/ngày làm được hết: mọi hạn ≥ 24 giờ, mọi chuỗi bỏ lỡ một ngày vẫn còn đường thắng.
- Server tính hết, cùng transaction với việc chơi; không push; không thêm lượt đọc Firestore ngoài daily doc sẵn có.
- «Nhờ bác Hagrid trông vườn» (duty leave) dừng mọi đồng hồ thử thách; E và F không áp dụng lúc nghỉ.
- UI theo `hpvnn-game-ui`: một khung, một lưới, dữ liệu thay câu giải thích, nút 44 px, không emoji làm chrome.
- Chữ tiếng Việt, tên HP theo Lý Lan.

## 2. Các phần

### A. Đơn khó của bác Hagrid (từ 160)
- Thêm 1 đơn mỗi ngày trên bảng đơn (`pickOrders`), id `hard-<day>`. Ba phần: 2 cây trong 8 cây mới nhất,
  1 món chế biến (công thức đã mở), 1 sản vật sinh vật trưởng thành (nếu có).
- Người chơi chọn 1–3 sao khi nhận: số lượng ×1/×2/×3. Hạn 48 giờ từ lúc nhận; chỉ một đơn khó đang mở.
- Thưởng: XP = XP thu hoạch của đúng hàng giao (rào #16), điểm Cúp 20/30/40 (vẫn trong trần 60/ngày),
  «dấu thử thách» = số sao. Đủ 30 dấu: khung Floo «Thợ vườn Tận Sức» (danh tiếng).
- Trễ hạn: đơn hết, không phạt.
- Rào: chỉ giao từ kho của chính mình (đã vậy); một đơn khó mỗi ngày mỗi tài khoản; thưởng theo sao tăng nhanh hơn
  công sức để chọn 1 sao không lợi hơn.

### B. Thử thách mốc 50 cấp (200, 250, …, 450)
- Mở ở mốc, tự bấm bắt đầu, chạy 7 ngày (dừng khi nghỉ). Mỗi mốc một đề, xoay vòng 3 loại:
  «7 ngày không cây héo» (duty), «mọi sinh vật vui ≥ 80 trong 3 ngày liền» (mood), «10 dấu đơn khó» (A).
- Thắng: huy hiệu thành tựu riêng mốc + sao trên khung Floo. Thua: thử lại sau 7 ngày. Không chặn lên cấp.

### C. Khẩu vị sinh vật (từ 160)
- Mỗi ngày mỗi loài có một «món thích» (hash uid+ngày+loài) trong các cây đã mở mà loài ăn được.
- Bữa có món thích: tâm trạng +10 thêm. Từ 160, tâm trạng chỉ lên ≥ 80 khi trong ngày đã có một bữa món thích
  (mức ×2 sản vật khi vui đã có, `garden-mood-core.js`).
- UI: món thích hiện bằng icon cây trên thẻ sinh vật.

### D. Hạng Tận Sức trong Cúp Nhà (từ 160)
- Thành viên ≥ 160 tính điểm vào bảng riêng «Hạng Tận Sức» theo nhà; nhà thắng hạng này cho khung Floo riêng.
- Giữ trần 60 điểm/ngày, cách tính điểm như cũ; người < 160 không đổi gì.

### E. Luân canh (từ 160)
- Mỗi thửa nhớ 3 loài thu hoạch gần nhất. Cùng một loài lần thứ 3 liên tiếp: −25% sản lượng mỗi vụ tiếp theo,
  sàn 50%. Trồng loài khác nhóm (lá, củ, hoa, thảo dược, quả) thì đất về 100% ngay vụ đó.
- Thửa hiện dấu «đất mệt» (pixel, không chữ) khi vụ tới sẽ bị giảm; ô hạt giống báo trước khi gieo.
- Mô phỏng lại nhịp lên cấp (`docs/level-500-sim`) trước khi bật: người chơi xoay vòng đúng không được chậm hơn.

### F. Tuần thời tiết khắc nghiệt (từ 200)
- Một tuần mỗi tháng (tuần thứ hash(tháng) % 3 + 2), thư cú báo trước 2 ngày. Ba loại xoay vòng:
  - Sương giá Rừng Cấm: cây 8 giờ lớn chậm ×1,5; cây chịu lạnh (Củ u, Cỏ chút chít, Rong nước xiết) gặt ×2.
  - Mưa dầm: không cần tưới; ma lùm vào gấp đôi (duty).
  - Nắng hạn: cây 3 giờ cần tưới 2 lần; Hoa nhật quang, Ớt lửa gặt ×2.
- Dùng `garden-day-event-core.js`; hiện trên HUD bằng biểu tượng thời tiết + đồng hồ.

## 3. Thứ tự làm
1. A + B (dùng đơn hàng và thành tựu sẵn có).
2. C + D.
3. E, rồi F (sau mô phỏng).
Mỗi đợt: server HPVNN (`functions/games/garden-*`, test `functions/test/garden-*`), client Hagrid (`garden-v05`,
`node --test`), kiểm trình duyệt bằng fixture `qa-v19/ui-fixture.html`. Chỉ phát hành khi owner thử trên 3026;
client và Functions phát hành cùng lúc, bump `?v=`.

## 4. Rào chắn (nối `produce-market-plan.md`, số tiếp theo sau #44)
- #45 Đơn khó chỉ một mỗi ngày mỗi tài khoản; nick phụ không giao hộ (kho riêng).
- #46 Thưởng sao: điểm Cúp vẫn dưới trần ngày; dấu thử thách không đổi ra Galleons hay vật phẩm bán được.
- #47 Thử thách mốc: đồng hồ trên server, dừng khi nghỉ; không reset bằng cách đổi thiết bị.
- #48 Món thích chọn trong cây đã mở; không mua được món thích bằng Galleons diễn đàn.
- #49 Luân canh và thời tiết không cộng với bậc trách nhiệm thành mất trắng: sàn 50% sản lượng, không giết cây.
