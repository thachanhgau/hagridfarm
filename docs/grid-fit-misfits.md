# Hagrid — danh sách hình lệch lưới (2026-10-27)

Tạo bởi `node garden-v05/audit-grid-fit.mjs` theo [guideline khớp ô](grid-fit-guideline.md). Số đo là pixel thế giới ở zoom 1, đo từ phần có màu (alpha > 0) của file đang chạy trong game. Không sửa tay file này.

Đã đo 147 món (242 hình, tính cả hai hướng xoay). Lệch: **13 món** — nặng 0, vừa 0, nhẹ 13. Đạt: 134.

Cột «Tạo lại»: canvas rộng × cao, pivot (x, y) = điểm chân, khung mực tối đa rộng × cao. Vẽ lại hoặc xuất lại từ master ở kích thước đó; không thu nhỏ ảnh đã xuất. «Hoặc nền» là nền nhỏ nhất vừa hình hiện tại, chỉ dùng khi chủ dự án muốn giữ nguyên hình (đổi catalog + server, không áp cho save cũ).

## Đồ trang trí cửa hàng (mua) — 1 món

| Mức | Món | Nền (ô · px) | Hình hiện tại (mực · canvas · pivot) | Lỗi | Cách sửa | Tạo lại: canvas · pivot · khung mực | Hoặc nền |
|---|---|---|---|---|---|---|---|
| nhẹ | Nến lơ lửng `decor_floating_candles` | 1×1 · 64×32 | 31×83 · 80×104 · (40,88) | chỉ phủ 48% bề ngang nền (hướng trái) | vẽ to hơn (tuỳ chọn) | 64×128 · (32,112) · ≥ 39×104 | — |

## Đồ trang trí mặc định (mở theo cấp)

Tất cả đạt.

## Công trình và cảnh cố định — 1 món

| Mức | Món | Nền (ô · px) | Hình hiện tại (mực · canvas · pivot) | Lỗi | Cách sửa | Tạo lại: canvas · pivot · khung mực | Hoặc nền |
|---|---|---|---|---|---|---|---|
| nhẹ | Lều Hagrid `hut` | 3×3 · 192×96 | 164×184 · 164×184 · (82,184) | mực chạm mép canvas | nới canvas | 192×240 · (96,192) · giữ 164×184 | — |

## Tượng kỷ vật — 8 món

| Mức | Món | Nền (ô · px) | Hình hiện tại (mực · canvas · pivot) | Lỗi | Cách sửa | Tạo lại: canvas · pivot · khung mực | Hoặc nền |
|---|---|---|---|---|---|---|---|
| nhẹ | Tượng Bằng-Mã `keepsake_hippogriff` | 1×1 · 64×32 | 34×44 · 56×56 · (28,50) | chỉ phủ 53% bề ngang nền | vẽ to hơn (tuỳ chọn) | 64×80 · (32,64) · ≥ 39×50 | — |
| nhẹ | Tượng Rồng `keepsake_dragon` | 1×1 · 64×32 | 32×44 · 56×56 · (28,50) | chỉ phủ 50% bề ngang nền | vẽ to hơn (tuỳ chọn) | 64×80 · (32,64) · ≥ 39×54 | — |
| nhẹ | Tượng Kỳ lân `keepsake_unicorn` | 1×1 · 64×32 | 31×44 · 56×56 · (28,50) | chỉ phủ 48% bề ngang nền | vẽ to hơn (tuỳ chọn) | 64×80 · (32,64) · ≥ 39×55 | — |
| nhẹ | Tượng Vong mã `keepsake_thestral` | 1×1 · 64×32 | 30×44 · 56×56 · (28,50) | chỉ phủ 47% bề ngang nền | vẽ to hơn (tuỳ chọn) | 64×80 · (32,64) · ≥ 39×57 | — |
| nhẹ | Tượng Kneazle `keepsake_kneazle` | 1×1 · 64×32 | 29×44 · 56×56 · (28,50) | chỉ phủ 45% bề ngang nền | vẽ to hơn (tuỳ chọn) | 64×80 · (32,64) · ≥ 39×59 | — |
| nhẹ | Tượng Diricawl `keepsake_diricawl` | 1×1 · 64×32 | 26×44 · 56×56 · (28,50) | chỉ phủ 41% bề ngang nền | vẽ to hơn (tuỳ chọn) | 64×96 · (32,80) · ≥ 39×66 | — |
| nhẹ | Tượng Que Xạo `keepsake_bowtruckle` | 1×1 · 64×32 | 25×44 · 56×56 · (28,50) | chỉ phủ 39% bề ngang nền | vẽ to hơn (tuỳ chọn) | 64×96 · (32,80) · ≥ 39×69 | — |
| nhẹ | Tượng Mooncalf `keepsake_mooncalf` | 1×1 · 64×32 | 24×44 · 56×56 · (28,50) | chỉ phủ 38% bề ngang nền | vẽ to hơn (tuỳ chọn) | 64×96 · (32,80) · ≥ 39×72 | — |

## Cổng lễ hội — 1 món

| Mức | Món | Nền (ô · px) | Hình hiện tại (mực · canvas · pivot) | Lỗi | Cách sửa | Tạo lại: canvas · pivot · khung mực | Hoặc nền |
|---|---|---|---|---|---|---|---|
| nhẹ | Cổng Hội chợ Thảo dược `hero-herbology` | 2×2 · 128×64 | 132×155 · 132×155 · (66,154) | mực chạm mép canvas | nới canvas | 134×192 · (67,160) · giữ 132×155 | — |

## Cây trồng (giai đoạn chín) — 2 món

| Mức | Món | Nền (ô · px) | Hình hiện tại (mực · canvas · pivot) | Lỗi | Cách sửa | Tạo lại: canvas · pivot · khung mực | Hoặc nền |
|---|---|---|---|---|---|---|---|
| nhẹ | Bông-đòng-đưa `flitterbloom` | 1×1 · 64×32 | 34×31 · 64×96 · (32,80) | chỉ phủ 53% bề ngang nền | vẽ to hơn (tuỳ chọn) | 64×64 · (32,48) · ≥ 39×36 | — |
| nhẹ | Củ u `bubotuber` | 1×1 · 64×32 | 29×33 · 64×96 · (32,80) | chỉ phủ 45% bề ngang nền | vẽ to hơn (tuỳ chọn) | 64×64 · (32,48) · ≥ 39×44 | — |
