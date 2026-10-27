# Khu Vườn Hagrid — Guideline khớp ô lưới cho hình mới

> **Trạng thái:** bản 27/10/2026, Claude Code (Anthropic), chờ chủ dự án duyệt. Bổ sung cho [art bible](art-bible.md) mục 2 và [chuẩn lưới 26/10](garden-grid-20261026.md); không thay luật màu, viền, chuyển động.
> Áp dụng cho mọi hình **đứng trên mặt đất trong vườn**: đồ trang trí (mua, mặc định, đồ lễ hội), công trình, tượng kỷ vật, cổng lễ hội, cây trồng. Không áp cho cây rừng ngoài rào, ổ/đệm trong chuồng (habitat), icon UI.
> Kiểm bằng máy: `node garden-v05/audit-grid-fit.mjs` → [danh sách lệch hiện tại](grid-fit-misfits.md) và `grid-fit-audit.json`.

## 1. Một ô và một nền

- Một ô lưới là hình thoi **64 × 32 px** (pixel thế giới, zoom 1). Tâm ô ở số nguyên, mép ô ở k + 0,5.
- Một vật chiếm **nền** gồm số ô nguyên: `cột × hàng`, nhỏ nhất 1 × 1. Nền là thứ duy nhất server kiểm khi đặt đồ.
- Nền `c × r` chiếu lên màn hình thành hình thoi rộng **W = (c + r) × 32** và cao **H = (c + r) × 16**. Xoay đồ chỉ đổi `c` với `r`, nên W và H giữ nguyên ở cả hai hướng.
- **Luật vàng: toàn bộ phần có màu của hình nằm trong cột dọc rộng W phía trên nền của nó.** Mái, tán cây, khói được cao lên trên, nhưng không được chìa sang ô bên cạnh. Lý do: hai món đặt sát nhau chỉ được kiểm nền; nếu hình tràn ngang, hai hình sẽ đè lên nhau dù nền hợp lệ (ví dụ cổng rễ cây Halloween 1×3 hiện tràn 29 px mỗi bên).

## 2. Điểm chân (pivot) — hai kiểu neo

Renderer đặt `pivotX, pivotY` của ảnh đúng vào điểm neo trên lưới, không co giãn. Hình phải được vẽ theo đúng kiểu neo của nhóm:

| Kiểu neo | Nhóm | Pivot nằm ở | Tâm hình thoi nền (trong ảnh) | Đáy hình được phép ở |
|---|---|---|---|---|
| **Neo chân** | Đồ trang trí mua, đồ trang trí mặc định, ao | Điểm chân trước của vật | `(pivotX, pivotY − 32 × lift)` | đúng hàng `pivotY` (±3 px) |
| **Neo tâm** | Lều, nhà kính, bác Hagrid, trạm cú, tượng kỷ vật, cổng lễ hội, cây trồng | Tâm nền | `(pivotX, pivotY)` | từ `pivotY − 4` đến `pivotY + H/2 + 2` |

`lift = ceil((c + r)/2 − 1) / 2` (hàm `footLift`): nền được nhấc lên nửa ô để góc trước của nền nằm ngay dưới chân. Với neo chân, **phần mực dưới cùng của hình phải nằm đúng hàng pivot**; pipeline xuất ảnh hiện đã làm vậy.

**Chân đế phải đứng trên nền thật, đúng hướng.** Nền 1 × 3 là một dải chéo chạy theo hàng, không phải hình thoi vuông: vật dài (cổng, ghế, xe) phải vẽ dọc theo dải đó ở hướng trái và dọc theo cột ở hướng phải. Bộ kiểm lấy phần mực ở H/2 hàng dưới cùng (đế) và đòi ít nhất 70% nằm trong nền thật (dung sai 4 px).

`pivotX` luôn là **giữa** hình thoi nền: phần có màu phải cân hai bên quanh `pivotX`. Vật lệch dáng (ô nghiêng, cây cong) vẫn phải nằm trong cột W, không dời pivot ra mép để "đứng bằng gốc".

## 3. Bảng kích thước cho hình mới

Chọn nền **trước khi vẽ**, rồi vẽ theo dòng tương ứng. Canvas rộng đúng W, pivot ở giữa; số đo là phần có màu (alpha > 0).

| Nền | Hình thoi W × H | Neo chân: canvas · pivot | Bề ngang mực | Chiều cao mực | Góc trước nằm dưới pivot |
|---|---|---|---|---|---|
| 1 × 1 | 64 × 32 | 64 × (h + 20, làm tròn lên bội 16) · (32, canvas − 16) | **39 – 56** px | ≤ 128 px | 16 px |
| 2 × 1 | 96 × 48 | 96 × … · (48, canvas − 16) | **58 – 88** px | ≤ 192 px | 8 px |
| 3 × 1, 2 × 2 | 128 × 64 | 128 × … · (64, canvas − 16) | **77 – 120** px | ≤ 224 px | 16 px |
| 3 × 2 | 160 × 80 | 160 × … · (80, canvas − 16) | **96 – 152** px | ≤ 224 px | 8 px |
| 3 × 3 | 192 × 96 | 192 × … · (96, canvas − 16) | **116 – 184** px | ≤ 224 px | 16 px |

- **Bề ngang tối đa = W − 8** (chừa 4 px mỗi bên cho viền tối). Mẫu chuẩn là 29 đồ trang trí mặc định: nền 2 × 1, mực rộng 84 px trong canvas 96 × 112, pivot (48, 96) — đạt 100%.
- **Bề ngang tối thiểu = 0,6 W.** Nhỏ hơn thì vật trông lọt thỏm, khung nền khi đặt to hơn hẳn hình (tượng kỷ vật hiện 24–34 px trên ô 64).
- **Trần chiều cao = min(2 W, 224 px).** Cao hơn thì vật che quá nhiều ô phía sau và tràn khỏi màn hình điện thoại ở zoom nhỏ. Vật cần cao hơn (cột, cây) thì tăng nền, không tăng chiều cao.
- Neo tâm: canvas rộng W, pivot (W/2, canvas − H/2), đáy hình không thấp hơn `pivotY + H/2`.
- Chừa ít nhất **1 px trong suốt** quanh mực ở cả bốn mép canvas (để viền, hiệu ứng mùa và tint không bị cắt).
- **Mật độ pixel 1:1.** Không phóng ×2 hay thu nhỏ ảnh đã xuất. Hình to hay nhỏ đều là vẽ lại hoặc xuất lại từ master ở **kích thước đích**, rồi lượng tử 24 màu theo art bible.
- Hai hướng xoay (`default` và `_right`) cùng canvas, cùng pivot, cùng tuân bảng trên. Hướng phải thường là ảnh lật của hướng trái nên lệch tâm ở hướng này sẽ lệch ngược ở hướng kia.
- Mọi frame chuyển động dùng chung canvas và pivot; bounds = hợp của mọi frame (luật V24.9.80 giữ nguyên).

## 4. Quy trình nhận một hình mới

1. Chọn nền (dòng bảng mục 3). Ghi `footprint` vào catalog **trước** khi vẽ; nền phải khớp server (`functions/games` dùng cùng catalog/footprint).
2. Tạo master (vẽ tay hoặc ImageGen) theo tỉ lệ khung đích, rồi xuất native bằng pipeline (`build-decor-flow.mjs`, `build-item-art.mjs`, `build-complete-objects.mjs`) ở **đúng canvas/pivot** của bảng.
3. `node garden-v05/audit-grid-fit.mjs`: món mới phải **không có lỗi nào** trong `grid-fit-audit.json`.
4. Kiểm cảnh thật như art bible mục 8: đặt sát 2 món khác, xoay hai hướng, xem ở điện thoại 375 px.

## 5. Khi hình cũ không vừa nền

Ưu tiên **vẽ lại cho vừa nền hiện có**. Chỉ tăng nền khi chủ dự án muốn giữ hình và duyệt riêng, vì phải sửa catalog ở client lẫn server, test chồng nền, và món đã đặt trong save cũ có thể chồng lên món bên cạnh (không tự dời save). Cột «Hoặc nền» trong danh sách lệch ghi nền nhỏ nhất vừa hình hiện tại.

Cách sửa theo loại lỗi trong [danh sách lệch](grid-fit-misfits.md):

| Cách sửa | Khi nào | Làm gì |
|---|---|---|
| **vẽ nhỏ lại** | mực rộng hơn W + 4 | Xuất lại từ master với khung mực ≤ W − 8, giữ tỉ lệ; không thu nhỏ PNG đã xuất. |
| **căn lại tâm** | mực vừa W nhưng pivot lệch, tràn một bên | Xuất lại canvas rộng W với phần mực cân quanh `pivotX`. Không cần vẽ lại. |
| **vẽ lại chân đế** | hình vừa cột W nhưng đế đứng lệch khỏi nền (sai hướng dải, đế loe rộng) | Vẽ lại phần đế cho nằm trên nền thật, đúng hướng xoay; phần trên giữ nguyên. |
| **hạ chiều cao** | cao hơn trần | Vẽ lại thấp hơn, hoặc tăng nền (cần duyệt). |
| **vẽ to hơn (tuỳ chọn)** | mực hẹp hơn 0,6 W | Vẽ lại to hơn tới ≥ 0,6 W. Mức nhẹ, làm khi có thời gian. |
| **nới canvas** | mực chạm mép canvas | Thêm hàng/cột trong suốt, sửa pivot cho đúng; hình giữ nguyên. |

## 6. Ngưỡng của bộ kiểm

| Luật | Ngưỡng | Mức |
|---|---|---|
| Tràn ngang khỏi cột W | > 4 px một bên | vừa; > 12 px là nặng |
| Quá cao | > min(2 W, 224) | vừa; vượt > 16 px là nặng |
| Chân lơ lửng / lấn ô trước | đáy hình ngoài khoảng mục 2 | nặng |
| Chân đế lệch nền (chỉ neo chân) | > 30% mực ở H/2 hàng dưới nằm ngoài nền | vừa; > 50% là nặng |
| Nhỏ so với nền | mực < 0,55 W (hình mới nhắm ≥ 0,6 W) | nhẹ |
| Mực chạm mép canvas | 0 px trong suốt ở mép | nhẹ |
| Mật độ ×2 | ≥ 90% khối 2×2 một màu | nặng |

Ngưỡng nằm trong `FIT` ở đầu `audit-grid-fit.mjs`. Muốn đổi thì sửa tài liệu này trước.
