# Hagrid — danh sách hình lệch lưới (2026-10-27)

Tạo bởi `node garden-v05/audit-grid-fit.mjs` theo [guideline khớp ô](grid-fit-guideline.md). Số đo là pixel thế giới ở zoom 1, đo từ phần có màu (alpha > 0) của file đang chạy trong game. Không sửa tay file này.

Đã đo 147 món (242 hình, tính cả hai hướng xoay). Lệch: **73 món** — nặng 35, vừa 25, nhẹ 13. Đạt: 74.

Cột «Tạo lại»: canvas rộng × cao, pivot (x, y) = điểm chân, khung mực tối đa rộng × cao. Vẽ lại hoặc xuất lại từ master ở kích thước đó; không thu nhỏ ảnh đã xuất. «Hoặc nền» là nền nhỏ nhất vừa hình hiện tại, chỉ dùng khi chủ dự án muốn giữ nguyên hình (đổi catalog + server, không áp cho save cũ).

## Đồ trang trí cửa hàng (mua) — 58 món

| Mức | Món | Nền (ô · px) | Hình hiện tại (mực · canvas · pivot) | Lỗi | Cách sửa | Tạo lại: canvas · pivot · khung mực | Hoặc nền |
|---|---|---|---|---|---|---|---|
| nặng | Vương miện Ravenclaw `sp_ravenclaw_diadem` | 1×1 · 64×32 | 106×80 · 112×104 · (56,100) | tràn trái 21, phải 21 px; 46% chân đế nằm ngoài nền (hướng trái) | vẽ nhỏ lại | 64×64 · (32,48) · ≤ 56×42 | 2×2 |
| nặng | Sách Quái Vật về Quái Vật `sp_monster_book` | 1×1 · 64×32 | 106×98 · 112×104 · (56,100) | tràn trái 21, phải 21 px (hướng trái) | vẽ nhỏ lại | 64×80 · (32,64) · ≤ 56×52 | 2×2 |
| nặng | Nhật ký Riddle và nanh Tử Xà `sp_riddle_diary` | 1×1 · 64×32 | 102×98 · 112×104 · (56,100) | tràn trái 19, phải 19 px; 43% chân đế nằm ngoài nền (hướng trái) | vẽ nhỏ lại | 64×80 · (32,64) · ≤ 56×54 | 2×2 |
| nặng | Nón Phân Loại trên ghế `sp_sorting_hat` | 1×1 · 64×32 | 98×133 · 104×144 · (52,140) | tràn trái 17, phải 17 px; 43% chân đế nằm ngoài nền; cao hơn trần 5 px (hướng trái) | vẽ nhỏ lại | 64×96 · (32,80) · ≤ 56×76 | 2×1 |
| nặng | Tổ nhện trong bí ngô `hw_pumpkin_spider_nest` | 1×1 · 64×32 | 98×80 · 104×96 · (52,92) | tràn trái 17, phải 17 px; 56% chân đế nằm ngoài nền (hướng trái) | vẽ nhỏ lại | 64×80 · (32,64) · ≤ 56×46 | 2×1 |
| nặng | Cầu đậu phượng hoàng Fawkes `sp_fawkes_perch` | 1×1 · 64×32 | 93×186 · 128×192 · (64,188) | tràn trái 14, phải 15 px; cao hơn trần 58 px (hướng trái) | vẽ nhỏ lại | 64×144 · (32,128) · ≤ 56×112 | 2×1 |
| nặng | Cánh cửa Phòng Chứa Bí Mật `sp_chamber_serpent_door` | 1×3 · 128×64 | 186×166 · 192×208 · (96,204) | tràn trái 29, phải 29 px; 54% chân đế nằm ngoài nền (hướng trái) | vẽ nhỏ lại | 128×128 · (64,112) · ≤ 120×107 | 3×3 |
| nặng | Giá treo mũ phù thủy `hw_witch_hat_rack` | 1×1 · 64×32 | 93×138 · 104×144 · (52,140) | tràn trái 14, phải 15 px; 40% chân đế nằm ngoài nền; cao hơn trần 10 px (hướng trái) | vẽ nhỏ lại | 64×112 · (32,96) · ≤ 56×83 | 2×1 |
| nặng | Cổng Halloween bằng rễ cây `hw_root_halloween_gate` | 1×3 · 128×64 | 186×174 · 192×208 · (96,204) | tràn trái 29, phải 29 px; 70% chân đế nằm ngoài nền (hướng trái) | vẽ nhỏ lại | 128×144 · (64,128) · ≤ 120×112 | 3×3 |
| nặng | Trứng rồng Norbert bên lò sưởi `sp_norbert_egg` | 1×2 · 96×48 | 138×134 · 144×160 · (72,156) | tràn trái 21, phải 21 px; 35% chân đế nằm ngoài nền (hướng trái) | vẽ nhỏ lại | 96×112 · (48,96) · ≤ 88×85 | 3×2 |
| nặng | Giàn đèn nhện `hw_spider_light_garland` | 1×2 · 96×48 | 138×91 · 144×112 · (72,108) | tràn trái 21, phải 21 px; 71% chân đế nằm ngoài nền (hướng trái) | vẽ nhỏ lại | 96×80 · (48,64) · ≤ 88×58 | 3×2 |
| nặng | Dây chuyền opal bị nguyền `sp_cursed_opal_necklace` | 1×1 · 64×32 | 90×127 · 96×136 · (48,132) | tràn trái 13, phải 13 px; 49% chân đế nằm ngoài nền (hướng trái) | vẽ nhỏ lại | 64×112 · (32,96) · ≤ 56×79 | 2×1 |
| nặng | Chồng bí ngô khắc mặt `hw_pumpkin_stack` | 1×1 · 64×32 | 90×106 · 96×112 · (48,108) | tràn trái 13, phải 13 px; 44% chân đế nằm ngoài nền (hướng trái) | vẽ nhỏ lại | 64×96 · (32,80) · ≤ 56×66 | 2×1 |
| nặng | Hốc cây có cú đêm `hw_owl_tree_hollow` | 1×1 · 64×32 | 90×112 · 96×136 · (48,132) | tràn trái 13, phải 13 px; 43% chân đế nằm ngoài nền (hướng trái) | vẽ nhỏ lại | 64×96 · (32,80) · ≤ 56×70 | 2×1 |
| nặng | Bàn pha độc dược Halloween `hw_halloween_potion_table` | 1×2 · 96×48 | 134×114 · 144×120 · (72,116) | tràn trái 19, phải 19 px; 35% chân đế nằm ngoài nền (hướng trái) | vẽ nhỏ lại | 96×96 · (48,80) · ≤ 88×75 | 3×2 |
| nặng | Chiếc cúp Hufflepuff `sp_hufflepuff_cup` | 1×1 · 64×32 | 89×98 · 96×104 · (48,100) | tràn trái 12, phải 13 px; 34% chân đế nằm ngoài nền (hướng trái) | vẽ nhỏ lại | 64×96 · (32,80) · ≤ 56×62 | 2×1 |
| nặng | Bụi hoa mắt tròn `hw_eyeball_flowers` | 1×1 · 64×32 | 89×83 · 104×104 · (52,100) | tràn trái 9, phải 16 px (hướng trái) | vẽ nhỏ lại | 64×80 · (32,64) · ≤ 56×52 | 2×1 |
| nặng | Xe đẩy táo bọc kẹo `hw_caramel_apple_cart` | 1×2 · 96×48 | 132×138 · 144×144 · (72,140) | tràn trái 18, phải 18 px; 36% chân đế nằm ngoài nền (hướng trái) | vẽ nhỏ lại | 96×112 · (48,96) · ≤ 88×92 | 2×2 |
| nặng | Thanh gươm Gryffindor `sp_sword_gryffindor` | 1×1 · 64×32 | 86×170 · 104×176 · (52,172) | tràn trái 11, phải 11 px; 35% chân đế nằm ngoài nền; cao hơn trần 42 px (hướng trái) | vẽ nhỏ lại | 64×144 · (32,128) · ≤ 56×111 | 2×1 |
| nặng | Bằng-Mã bên vườn bí ngô `sp_buckbeak_pumpkins` | 2×2 · 128×64 | 170×142 · 176×160 · (88,156) | tràn trái 21, phải 21 px (hướng trái) | vẽ nhỏ lại | 128×128 · (64,112) · ≤ 120×100 | 3×3 |
| nặng | Hang tơ Aragog `sp_aragog_hollow` | 2×2 · 128×64 | 170×159 · 176×176 · (88,172) | tràn trái 21, phải 21 px (hướng trái) | vẽ nhỏ lại | 128×144 · (64,128) · ≤ 120×112 | 3×3 |
| nặng | Lều phù thủy mái vẹo `hw_crooked_witch_hut` | 2×2 · 128×64 | 169×202 · 192×208 · (96,204) | tràn trái 20, phải 21 px (hướng phải) | vẽ nhỏ lại | 128×176 · (64,160) · ≤ 120×143 | 3×3 |
| nặng | Nhà bí ngô thu nhỏ `hw_mini_pumpkin_house` | 2×2 · 128×64 | 169×170 · 176×176 · (88,172) | tràn trái 20, phải 21 px (hướng phải) | vẽ nhỏ lại | 128×144 · (64,128) · ≤ 120×121 | 3×3 |
| nặng | Bánh ngày giỗ Nick Suýt Mất Đầu `sp_deathday_cake` | 2×1 · 96×48 | 122×133 · 128×144 · (64,140) | tràn trái 13, phải 13 px (hướng phải) | vẽ nhỏ lại | 96×128 · (48,112) · ≤ 88×96 | 2×2 |
| nặng | Bản đồ của Đạo tặc `sp_marauders_map` | 1×2 · 96×48 | 122×96 · 128×112 · (64,108) | tràn trái 13, phải 13 px; 40% chân đế nằm ngoài nền (hướng trái) | vẽ nhỏ lại | 96×96 · (48,80) · ≤ 88×69 | 2×2 |
| nặng | Snitch giữ Hòn Đá Phục Sinh `sp_snitch_resurrection_stone` | 1×2 · 96×48 | 122×81 · 128×104 · (64,100) | tràn trái 13, phải 13 px (hướng trái) | vẽ nhỏ lại | 96×80 · (48,64) · ≤ 88×58 | 2×2 |
| nặng | Liễu Roi và chiếc Ford Anglia `sp_whomping_anglia` | 2×3 · 160×80 | 202×214 · 208×224 · (104,220) | tràn trái 21, phải 21 px (hướng trái) | vẽ nhỏ lại | 160×192 · (80,176) · ≤ 152×161 | — |
| nặng | Cây cổ thụ treo đèn `hw_lantern_ancient_tree` | 2×3 · 160×80 | 202×210 · 208×224 · (104,220) | tràn trái 21, phải 21 px (hướng trái) | vẽ nhỏ lại | 160×192 · (80,176) · ≤ 152×158 | — |
| nặng | Xe máy bay của Sirius `sp_sirius_motorbike` | 1×3 · 128×64 | 154×121 · 160×128 · (80,124) | tràn trái 13, phải 13 px; 45% chân đế nằm ngoài nền (hướng trái) | vẽ nhỏ lại | 128×128 · (64,112) · ≤ 120×94 | 3×2 |
| nặng | Chiếc Cốc Lửa `sp_goblet_fire` | 1×1 · 64×32 | 74×170 · 112×176 · (56,172) | tràn trái 5, phải 5 px; cao hơn trần 42 px (hướng trái) | vẽ nhỏ lại | 64×160 · (32,144) · ≤ 56×128 | 2×1 |
| nặng | Đèn đầu lâu `hw_skull_lantern` | 1×1 · 64×32 | 70×98 · 80×104 · (40,100) | 56% chân đế nằm ngoài nền (hướng phải) | vẽ nhỏ lại | 64×112 · (32,96) · ≤ 56×78 | 2×1 |
| nặng | Ao sương tím `hw_violet_mist_pond` | 2×3 · 160×80 | 165×114 · 192×144 · (96,140) | tràn trái 15 px (hướng trái) | vẽ nhỏ lại | 160×128 · (80,112) · ≤ 152×105 | 3×3 |
| nặng | Vạc kẹo sôi `hw_candy_cauldron` | 1×1 · 64×32 | 63×68 · 96×112 · (48,108) | tràn phải 14 px; 42% chân đế nằm ngoài nền (hướng phải) | căn lại tâm | 64×80 · (32,64) · giữ 56×60 | — |
| nặng | Góc ô hồng của Hagrid `sp_hagrid_umbrella` | 2×1 · 96×48 | 87×89 · 128×144 · (64,140) | tràn trái 15 px (hướng phải) | căn lại tâm | 96×112 · (48,96) · giữ 87×89 | — |
| vừa | Đèn lồng hình nhà ma `hw_haunted_house_lantern` | 1×1 · 64×32 | 83×114 · 96×120 · (48,116) | tràn trái 9, phải 10 px; 34% chân đế nằm ngoài nền (hướng trái) | vẽ nhỏ lại | 64×112 · (32,96) · ≤ 56×77 | 2×1 |
| vừa | Mề đay Slytherin `sp_slytherin_locket` | 1×1 · 64×32 | 82×96 · 88×112 · (44,108) | tràn trái 9, phải 9 px (hướng trái) | vẽ nhỏ lại | 64×96 · (32,80) · ≤ 56×66 | 2×1 |
| vừa | Nhẫn gia tộc Gaunt `sp_gaunt_ring` | 1×1 · 64×32 | 82×90 · 88×96 · (44,92) | tràn trái 9, phải 9 px (hướng trái) | vẽ nhỏ lại | 64×96 · (32,80) · ≤ 56×61 | 2×1 |
| vừa | Cái Xoay Thời Gian `sp_time_turner` | 1×1 · 64×32 | 82×114 · 88×128 · (44,124) | tràn trái 9, phải 9 px; 46% chân đế nằm ngoài nền (hướng trái) | vẽ nhỏ lại | 64×112 · (32,96) · ≤ 56×78 | 2×1 |
| vừa | Biển gỗ Halloween `hw_halloween_sign` | 1×1 · 64×32 | 81×122 · 96×128 · (48,124) | tràn trái 8, phải 9 px; 43% chân đế nằm ngoài nền (hướng trái) | vẽ nhỏ lại | 64×112 · (32,96) · ≤ 56×84 | 2×1 |
| vừa | Đèn lồng dơi `hw_bat_lantern` | 1×1 · 64×32 | 81×114 · 88×120 · (44,116) | tràn trái 8, phải 9 px; 37% chân đế nằm ngoài nền (hướng trái) | vẽ nhỏ lại | 64×112 · (32,96) · ≤ 56×79 | 2×1 |
| vừa | Giá chổi `decor_broom_rack` | 1×2 · 96×48 | 119×92 · 128×128 · (64,104) | tràn trái 11, phải 12 px; 47% chân đế nằm ngoài nền (hướng trái) | vẽ nhỏ lại | 96×96 · (48,80) · ≤ 88×68 | 2×2 |
| vừa | Giàn mạng nhện đọng sương `hw_dewy_cobweb_frame` | 1×2 · 96×48 | 114×130 · 128×136 · (64,132) | tràn trái 9, phải 9 px; 47% chân đế nằm ngoài nền (hướng trái) | vẽ nhỏ lại | 96×128 · (48,112) · ≤ 88×100 | 2×2 |
| vừa | Cây khô treo dơi `hw_dead_bat_tree` | 1×2 · 96×48 | 113×138 · 128×144 · (64,140) | tràn trái 8, phải 9 px (hướng trái) | vẽ nhỏ lại | 96×128 · (48,112) · ≤ 88×107 | 2×2 |
| vừa | Xe Đò Hiệp Sĩ `sp_knight_bus` | 3×1 · 128×64 | 150×170 · 160×176 · (80,172) | tràn trái 11, phải 11 px; 41% chân đế nằm ngoài nền (hướng phải) | vẽ nhỏ lại | 128×160 · (64,144) · ≤ 120×136 | 3×2 |
| vừa | Vòm màn che ở Bộ Pháp Thuật `sp_department_veil` | 2×2 · 128×64 | 148×202 · 176×208 · (88,204) | tràn trái 10, phải 10 px (hướng trái) | vẽ nhỏ lại | 128×192 · (64,176) · ≤ 120×164 | 3×2 |
| vừa | Đèn ma vải `hw_cloth_ghost_lantern` | 1×1 · 64×32 | 74×119 · 80×128 · (40,124) | tràn trái 5, phải 5 px; 41% chân đế nằm ngoài nền (hướng trái) | vẽ nhỏ lại | 64×112 · (32,96) · ≤ 56×90 | 2×1 |
| vừa | Quả cầu ma nhỏ `hw_ghost_orb` | 1×1 · 64×32 | 74×94 · 80×104 · (40,100) | tràn trái 5, phải 5 px; 49% chân đế nằm ngoài nền (hướng trái) | vẽ nhỏ lại | 64×96 · (32,80) · ≤ 56×71 | 2×1 |
| vừa | Cụm nấm hình đầu lâu `hw_skull_mushrooms` | 1×1 · 64×32 | 73×82 · 96×88 · (48,84) | tràn trái 4, phải 5 px (hướng trái) | vẽ nhỏ lại | 64×96 · (32,80) · ≤ 56×63 | 2×1 |
| vừa | Quân mã cờ phù thủy `sp_wizard_chess_knight` | 2×1 · 96×48 | 109×170 · 128×176 · (64,172) | tràn trái 6, phải 7 px (hướng phải) | vẽ nhỏ lại | 96×160 · (48,144) · ≤ 88×137 | 2×2 |
| vừa | Cái Tưởng Ký `sp_pensieve` | 1×2 · 96×48 | 108×122 · 128×128 · (64,124) | tràn trái 6, phải 6 px (hướng trái) | vẽ nhỏ lại | 96×128 · (48,112) · ≤ 88×99 | 2×2 |
| vừa | Tủ Biến Mất `sp_vanishing_cabinet` | 1×2 · 96×48 | 108×202 · 144×208 · (72,204) | tràn trái 6, phải 6 px; cao hơn trần 10 px (hướng trái) | vẽ nhỏ lại | 96×192 · (48,176) · ≤ 88×165 | 2×2 |
| vừa | Gốc cây mặt quỷ `hw_grinning_stump` | 1×2 · 96×48 | 106×87 · 112×104 · (56,100) | tràn trái 5, phải 5 px (hướng trái) | vẽ nhỏ lại | 96×96 · (48,80) · ≤ 88×72 | 2×2 |
| vừa | Tấm gương Ảo Ảnh `sp_mirror_erised` | 1×2 · 96×48 | 105×202 · 144×208 · (72,204) | tràn trái 4, phải 5 px; cao hơn trần 10 px (hướng trái) | vẽ nhỏ lại | 96×192 · (48,176) · ≤ 88×169 | 2×2 |
| vừa | Cái Tắt-Sáng `sp_deluminator` | 1×1 · 64×32 | 65×98 · 80×104 · (40,100) | 32% chân đế nằm ngoài nền (hướng trái) | vẽ lại chân đế | 64×112 · (32,96) · ≤ 56×84 | — |
| vừa | Rương nháy mắt `hw_blinking_chest` | 2×1 · 96×48 | 92×86 · 112×96 · (56,92) | tràn trái 7 px (hướng phải) | căn lại tâm | 96×112 · (48,96) · giữ 92×86 | — |
| vừa | Tủ sách há miệng `hw_monster_bookcase` | 1×2 · 96×48 | 79×112 · 112×144 · (56,140) | tràn trái 7 px (hướng trái) | căn lại tâm | 96×144 · (48,128) · giữ 79×112 | — |
| vừa | Bàn Tay Vẻ Vang `sp_hand_glory` | 1×1 · 64×32 | 52×130 · 80×136 · (40,132) | 33% chân đế nằm ngoài nền; cao hơn trần 2 px (hướng phải) | vẽ lại chân đế | 64×160 · (32,144) · ≤ 51×128 | — |
| nhẹ | Nến lơ lửng `decor_floating_candles` | 1×1 · 64×32 | 31×83 · 80×104 · (40,88) | chỉ phủ 48% bề ngang nền (hướng trái) | vẽ to hơn (tuỳ chọn) | 64×128 · (32,112) · ≥ 39×104 | — |

## Đồ trang trí mặc định (mở theo cấp)

Tất cả đạt.

## Công trình và cảnh cố định — 2 món

| Mức | Món | Nền (ô · px) | Hình hiện tại (mực · canvas · pivot) | Lỗi | Cách sửa | Tạo lại: canvas · pivot · khung mực | Hoặc nền |
|---|---|---|---|---|---|---|---|
| vừa | Ao trang trí `pond` | 2×3 · 160×80 | 176×112 · 176×112 · (88,112) | tràn trái 8, phải 8 px; mực chạm mép canvas | vẽ nhỏ lại | 160×128 · (80,112) · ≤ 152×97 | 3×3 |
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

## Cổng lễ hội — 3 món

| Mức | Món | Nền (ô · px) | Hình hiện tại (mực · canvas · pivot) | Lỗi | Cách sửa | Tạo lại: canvas · pivot · khung mực | Hoặc nền |
|---|---|---|---|---|---|---|---|
| nặng | Cổng bí ngô Halloween `hero-halloween` | 2×2 · 128×64 | 180×114 · 180×114 · (90,113) | tràn trái 26, phải 26 px; mực chạm mép canvas | vẽ nhỏ lại | 128×112 · (64,80) · ≤ 120×76 | 3×3 |
| vừa | Cổng lễ hội Giáng sinh `hero-yule` | 2×2 · 128×64 | 141×210 · 141×210 · (70,209) | tràn trái 6, phải 7 px; mực chạm mép canvas | vẽ nhỏ lại | 128×224 · (64,192) · ≤ 120×179 | 3×2 |
| nhẹ | Cổng Hội chợ Thảo dược `hero-herbology` | 2×2 · 128×64 | 132×155 · 132×155 · (66,154) | mực chạm mép canvas | nới canvas | 134×192 · (67,160) · giữ 132×155 | — |

## Cây trồng (giai đoạn chín) — 2 món

| Mức | Món | Nền (ô · px) | Hình hiện tại (mực · canvas · pivot) | Lỗi | Cách sửa | Tạo lại: canvas · pivot · khung mực | Hoặc nền |
|---|---|---|---|---|---|---|---|
| nhẹ | Bông-đòng-đưa `flitterbloom` | 1×1 · 64×32 | 34×31 · 64×96 · (32,80) | chỉ phủ 53% bề ngang nền | vẽ to hơn (tuỳ chọn) | 64×64 · (32,48) · ≥ 39×36 | — |
| nhẹ | Củ u `bubotuber` | 1×1 · 64×32 | 29×33 · 64×96 · (32,80) | chỉ phủ 45% bề ngang nền | vẽ to hơn (tuỳ chọn) | 64×64 · (32,48) · ≥ 39×44 | — |
