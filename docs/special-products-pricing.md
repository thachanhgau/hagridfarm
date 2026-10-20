# Sản phẩm đặc biệt — bảng giá đề xuất (CHỜ DUYỆT)

> 20/10/2026 · Claude Code (Anthropic). Giá và cấp mở dưới đây **chưa được chủ dự án duyệt**.
> Nguồn trong code: `garden-v05/special-products.mjs` (`SPECIAL_PRICES_APPROVED = false`) và bản server
> HPVNN `functions/games/garden-wallet-catalog.js` (mọi món `forSale: false`, server từ chối mua với lý do
> `not-for-sale` trước khi trừ Galleons). Chỉ ví xem thử trong bộ nhớ (`qa-v19/fixture-wallet.mjs`) bán theo giá này.

## Căn cứ

- Thu nhập Galleons từ diễn đàn: p50 772 G/ngày, p25 36 G/ngày (`economy-audit.md` mục A1).
- Trang trí cửa hàng hiện có: 80–600 G, mở cấp 1–24. Không công trình nào vượt một ngày thu nhập p50.
- Sản phẩm đặc biệt chỉ để trang trí (không XP, sản lượng, quyền năng hay thưởng), nên là nơi **tiêu Galleons
  tự nguyện** cho người chơi lâu năm: mở từ cấp 25, ngay sau món trang trí cuối (cấp 24), rải tới cấp 90.
- Giá theo cỡ trong vườn và độ nổi tiếng trong truyện. Mỗi món tương đương 1,2–7,8 ngày thu nhập p50.

| Nhóm | Số món | Giá |
|---|---|---|
| Kỷ vật nhỏ 1×1 | 14 | 900–2.200 G |
| Tiểu cảnh 2×1 | 9 | 1.500–2.800 G |
| Tiểu cảnh lớn 2×2 | 3 | 3.600–4.200 G |
| Tiểu cảnh dài 3×1 | 3 | 4.000–5.200 G |
| Liễu Roi và Ford Anglia 3×2 | 1 | 6.000 G |

Cả bộ: **70.500 G**, khoảng 91 ngày thu nhập p50. Người ở p25 (36 G/ngày) chỉ mua được vài món nhỏ sau nhiều
tuần; đây là món sưu tầm, không chặn tiến trình nào.

## Bảng giá

| Sản phẩm | ID | Chiếm đất | Cấp mở | Giá (G) | Ngày p50 |
|---|---|---|---|---|---|
| Nón Phân Loại trên ghế | `sp_sorting_hat` | 1×1 | 25 | 900 | 1,2 |
| Sách Quái Vật về Quái Vật | `sp_monster_book` | 1×1 | 25 | 900 | 1,2 |
| Góc ô hồng của Hagrid | `sp_hagrid_umbrella` | 2×1 | 25 | 1.500 | 1,9 |
| Cái Tắt-Sáng | `sp_deluminator` | 1×1 | 28 | 1.000 | 1,3 |
| Bánh ngày giỗ Nick Suýt Mất Đầu | `sp_deathday_cake` | 2×1 | 30 | 1.600 | 2,1 |
| Cái Xoay Thời Gian | `sp_time_turner` | 1×1 | 32 | 1.200 | 1,6 |
| Bàn Tay Vẻ Vang | `sp_hand_glory` | 1×1 | 34 | 1.100 | 1,4 |
| Bản đồ của Đạo tặc | `sp_marauders_map` | 2×1 | 35 | 1.800 | 2,3 |
| Dây chuyền opal bị nguyền | `sp_cursed_opal_necklace` | 1×1 | 36 | 1.200 | 1,6 |
| Chiếc Cốc Lửa | `sp_goblet_fire` | 1×1 | 38 | 1.400 | 1,8 |
| Nhật ký Riddle và nanh Tử Xà | `sp_riddle_diary` | 1×1 | 40 | 1.500 | 1,9 |
| Quân mã cờ phù thủy | `sp_wizard_chess_knight` | 2×1 | 40 | 2.000 | 2,6 |
| Cầu đậu phượng hoàng Fawkes | `sp_fawkes_perch` | 1×1 | 42 | 1.600 | 2,1 |
| Nhẫn gia tộc Gaunt | `sp_gaunt_ring` | 1×1 | 44 | 1.500 | 1,9 |
| Cái Tưởng Ký | `sp_pensieve` | 2×1 | 46 | 2.200 | 2,8 |
| Mề đay Slytherin | `sp_slytherin_locket` | 1×1 | 48 | 1.600 | 2,1 |
| Trứng rồng Norbert bên lò sưởi | `sp_norbert_egg` | 2×1 | 50 | 2.400 | 3,1 |
| Chiếc cúp Hufflepuff | `sp_hufflepuff_cup` | 1×1 | 52 | 1.600 | 2,1 |
| Tấm gương Ảo Ảnh | `sp_mirror_erised` | 2×1 | 54 | 2.800 | 3,6 |
| Vương miện Ravenclaw | `sp_ravenclaw_diadem` | 1×1 | 56 | 1.800 | 2,3 |
| Tủ Biến Mất | `sp_vanishing_cabinet` | 2×1 | 58 | 2.800 | 3,6 |
| Thanh gươm Gryffindor | `sp_sword_gryffindor` | 1×1 | 60 | 2.200 | 2,8 |
| Bằng-Mã bên vườn bí ngô | `sp_buckbeak_pumpkins` | 2×2 | 62 | 3.600 | 4,7 |
| Snitch giữ Hòn Đá Phục Sinh | `sp_snitch_resurrection_stone` | 2×1 | 64 | 2.600 | 3,4 |
| Hang tơ Aragog | `sp_aragog_hollow` | 2×2 | 66 | 3.800 | 4,9 |
| Xe máy bay của Sirius | `sp_sirius_motorbike` | 3×1 | 70 | 4.000 | 5,2 |
| Vòm màn che ở Bộ Pháp Thuật | `sp_department_veil` | 2×2 | 74 | 4.200 | 5,4 |
| Cánh cửa Phòng Chứa Bí Mật | `sp_chamber_serpent_door` | 3×1 | 78 | 4.500 | 5,8 |
| Xe Đò Hiệp Sĩ | `sp_knight_bus` | 3×1 | 84 | 5.200 | 6,7 |
| Liễu Roi và chiếc Ford Anglia | `sp_whomping_anglia` | 3×2 | 90 | 6.000 | 7,8 |

## Cần chủ dự án quyết

1. Duyệt (hoặc sửa) giá và cấp mở ở bảng trên.
2. Khi duyệt: sửa giá trong `special-products.mjs` (đặt `SPECIAL_PRICES_APPROVED = true`) và trong
   `garden-wallet-catalog.js` (bỏ `forSale: false`, đổi `CATALOG_VERSION`), chạy test parity của HPVNN,
   rồi phát hành Functions trước, client sau.
3. Hạn mức: mỗi món sở hữu một lần (`dailyLimit 1`, `quantity 1`) như trang trí cũ; không bán lại.
