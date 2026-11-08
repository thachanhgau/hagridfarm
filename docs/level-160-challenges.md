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
- TODO (art): khung Floo «Thợ vườn Tận Sức» (key `hagrid-tan-suc`) đang mượn kiểu khung Bậc thầy; cần art riêng và
  vẽ sao mốc thắng (server đã lưu `stars` = số mốc B đã thắng).

### B. Thử thách mốc 50 cấp (200, 250, …, 450)
- Mở ở mốc, tự bấm bắt đầu, chạy 7 ngày (dừng khi nghỉ). Mỗi mốc một đề, xoay vòng 3 loại:
  «7 ngày không cây héo» (duty), «mọi sinh vật vui ≥ 80 trong 3 ngày liền» (mood), «10 dấu đơn khó» (A).
- Thắng: huy hiệu thành tựu riêng mốc + sao trên khung Floo. Thua: thử lại sau 7 ngày. Không chặn lên cấp.

### C. Khẩu vị sinh vật (từ 160)
- Mỗi ngày mỗi loài có một «món thích» (hash uid+ngày+loài) trong các cây đã mở mà loài ăn được.
- Bữa có món thích: tâm trạng +10 thêm. Từ 160, tâm trạng chỉ lên ≥ 80 khi trong ngày đã có một bữa món thích
  (mức ×2 sản vật khi vui đã có, `garden-mood-core.js`).
- UI: món thích hiện bằng icon cây trên thẻ sinh vật.
- Cách tính (đợt 2): «bữa có món thích» = bữa bắt đầu trong ngày VN mà hôm đó con đã chế biến khẩu phần của loài bằng
  công thức có món thích (thức ăn mua bằng Galleons không mang món thích, rào #48). Món thích chọn trong cây có trong
  công thức thức ăn của loài mà con đã mở; Norbert không ăn bữa nên không bị trần 79.

### D. Hạng Tận Sức trong Cúp Nhà (từ 160)
- Thành viên ≥ 160 tính điểm vào bảng riêng «Hạng Tận Sức» theo nhà; nhà thắng hạng này cho khung Floo riêng.
- Giữ trần 60 điểm/ngày, cách tính điểm như cũ; người < 160 không đổi gì.
- Điểm của người ≥ 160 vẫn vào bảng Nhà như cũ (bảng Nhà không đổi), đồng thời vào bảng `tanSuc` trên cùng document
  `garden_house_cup/{tuần}` (không thêm lượt đọc). Nhà nhất Hạng Tận Sức: ai góp từ 20 điểm hạng này được khung
  «Cúp Tận Sức» (`hagrid-cup-tan-suc`).
- TODO (art): khung Floo «Cúp Tận Sức» (key `hagrid-cup-tan-suc`) đang mượn kiểu khung Cúp Nhà với viền vàng `#e2b866`;
  cần art riêng.

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

## 3b. Tiến độ
- 08/11/2026 Claude Code (Anthropic): đợt 1 (A + B) xong trên nhánh, chưa phát hành. Server HPVNN
  `codex/hagrid-challenges-160` (`functions/games/garden-challenge-core.js`, action `challenge`: accept/deliver/start);
  client `challenges-160` (`garden-work-ui.mjs`: ô đơn khó + hàng thử thách mốc trong tab Đơn hàng).
  Huy hiệu mốc nằm ở hàng thử thách (cúp nhỏ mỗi mốc thắng), chưa vào danh sách Thành tựu (danh sách đó có thưởng
  Nước/vật phẩm, trái luật §1).
- 08/11/2026 Claude Code (Anthropic): đợt 2 (C + D) xong trên nhánh, chưa phát hành. Server `garden-mood-core.js`
  (món thích, +10, trần 79), `garden-retention-core.js` (Hạng Tận Sức, khung Cúp Tận Sức); client: icon món thích
  cạnh tên sinh vật ở dock Nuôi (`pet-controls.mjs`), bảng Hạng Tận Sức trong tab Cúp Nhà. Kèm sửa thư cú «vườn có N
  việc»: ngày đã báo lưu trên server (daily doc `owlSeen`, view `duty.owlDay`, action `duty`/`owlSeen`), mỗi ngày một
  lần trên mọi thiết bị.
- 08/11/2026 Claude Code (Anthropic): đợt 3 (E + F) xong trên nhánh, chưa phát hành. Server `garden-soil-core.js`
  (luân canh, thời tiết; móc vào `settleModelStep`, gieo trong `applyGardenAction`, ma lùm trong `garden-duty-core`),
  view `soil` (mỗi thửa `{tired, seeds}`) và `weather` (`{type, start, end, announced}`); client `garden-weather-ui.mjs`
  (chip thời tiết cạnh chip trách nhiệm, thư cú một lần mỗi tuần), dấu «đất mệt» trên bảng thửa, nhãn «−25%» trên ô hạt.
  Hàng chip trách nhiệm + thời tiết dời xuống dưới thẻ mục tiêu (`#nextGoal`), trước đây chip trách nhiệm che thẻ này.
  Cách hiểu đã chọn: một «vụ» = 9 ô đã gặt cùng nhóm trên một thửa (gặt từng hàng tính như gặt cả thửa); loài khác cùng
  nhóm vẫn nối chuỗi, chỉ khác nhóm mới về 100%; một lần gặt có nhiều nhóm thì nhóm khác tính trước, nên một hàng khác nhóm
  là đủ luân canh thửa đó. Chỉ giảm nông sản, không giảm XP. Nắng hạn «tưới 2 lần» = gieo cây 3 giờ tốn 2 Nước tưới mỗi ô
  (game không tưới từng ô sau khi gieo); Mưa dầm: gieo không tốn nước, ma lùm tới sau nửa thời gian.

## 3c. Mô phỏng E+F

Chạy 08/11/2026 bằng `docs/level-500-sim/runEF.mjs` + `sim-ef.patch` (trên bản sao `garden-v05` đã áp `sim-hooks.patch`),
gọi thẳng `functions/games/garden-soil-core.js` của HPVNN (`SOIL_CORE=<đường dẫn> node runEF.mjs '{…,"ef":"b"}' 8,21`).
(a) luật hiện tại; (b) E+F, người chơi luân canh (khi giống sắp gieo sẽ bị mệt thì gieo một hàng cây tốt nhất khác nhóm)
và chọn cây theo thời gian lớn của tuần thời tiết; (c) E+F, người chơi bất cẩn luôn gieo lại một cây.
«Nông sản mất» = phần E lấy đi trên số ô gặt từ cấp 160.

| Kiểu chơi | Trường hợp | Cấp 200 | Cấp 300 | Cấp 500 | Chậm hơn (a) ở cấp 500 | Nông sản mất từ 160 |
|---|---|---|---|---|---|---|
| 2 lượt (08, 21h) | (a) | 94 | 131 | 202 | — | — |
| 2 lượt | (b) | 95 | 132 | 205 | +1,5% | 0 |
| 2 lượt | (c) | 94 | 131 | 202 | 0 | 43% |
| 1 lượt (08h) | (a) | 187 | 261 | 403 | — | — |
| 1 lượt | (b) | 188 | 264 | 409 | +1,5% | 0 |
| 1 lượt | (c) | 187 | 261 | 403 | 0 | 42% |

- Bảng trên dùng thời gian lớn thật của game (từ cấp 15 cây lớn nửa thời gian, nên cây 8 giờ = 4 giờ, Sương giá = 6 giờ).
  Mô phỏng gốc không có nửa thời gian: ở đó Sương giá biến cây 8 giờ thành 12 giờ, lỡ khoảng đêm 11 giờ, (b) và (c) 2 lượt
  chậm +3,5% (cấp 500 ngày 209); với ×1,25 thì (b) về +1,5%. Trong game thật cây chậm ×1,5 vẫn kịp cả hai khoảng 11 và 13
  giờ, nên giữ ×1,5. Người chơi 3 lượt trở lên (khoảng 5 giờ) sẽ thấy Sương giá thật.
- Số đã chọn (giữ nguyên plan): vụ thứ 3 liên tiếp cùng nhóm −25%, mỗi vụ sau −25% nữa, sàn 50%; Sương giá ×1,5.
- (c) không chậm cấp vì E chỉ lấy nông sản, không lấy XP; cái giá là gần một nửa nông sản (gần sàn 50%), tức ít hàng bán chợ,
  đơn khó và xây thửa hơn. (b) chậm 1,5% vì mỗi 3 vụ có một hàng cây kém hơn.
- Mưa dầm và Nắng hạn chỉ đổi nước tưới và ma lùm, mô phỏng không tính (không đổi XP).

## 4. Rào chắn (nối `produce-market-plan.md`, số tiếp theo sau #44)
- #45 Đơn khó chỉ một mỗi ngày mỗi tài khoản; nick phụ không giao hộ (kho riêng).
- #46 Thưởng sao: điểm Cúp vẫn dưới trần ngày; dấu thử thách không đổi ra Galleons hay vật phẩm bán được.
- #47 Thử thách mốc: đồng hồ trên server, dừng khi nghỉ; không reset bằng cách đổi thiết bị.
- #48 Món thích chọn trong cây đã mở; không mua được món thích bằng Galleons diễn đàn.
- #49 Luân canh và thời tiết không cộng với bậc trách nhiệm thành mất trắng: sàn 50% sản lượng, không giết cây.
