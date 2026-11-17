# Codex — Sổ cá: 6 cá hiếm + quà «Bể cá» (17/11/2026)

Làm theo luật vẽ đã có của repo (docs/art-bible.md) và đúng quy trình bộ 100 món mùa đông vẽ tay
(ImageGen, HD lanczos không ép bảng màu, native dựng lại từ HD như garden-v05/rebuild-winter-native.mjs).
Không sửa logic game, không đụng record của món khác, không commit. Claude Code làm phần luật chơi.

1. 6 icon vật phẩm (giống cỡ, góc nhìn và cách đặt của icon `goldfish` trong garden-v05/pond-art.mjs):
   - `rarefish_koi` «Cá chép koi» (trắng đỏ đốm)
   - `rarefish_salmon` «Cá hồi bạc» (bạc ánh xanh)
   - `rarefish_spiny` «Cá gai» (vây gai xanh rêu)
   - `rarefish_lantern` «Cá đèn» (cá nhỏ có cục sáng vàng trên đầu)
   - `rarefish_moon` «Cá trăng» (trắng ngà, vảy ánh tím nhạt)
   - `rarefish_dragon` «Cá vảy rồng» (đỏ vàng, vảy như rồng, hiếm nhất)
   Native + HD, đăng ký để game hiện được như `goldfish` (POND_ART + HD_ART).
2. Món trang trí quà `ev_fish_tank` «Bể cá sáu loài», 2×2, hai hướng default/right: bể kính khung gỗ có đủ 6 cá trên.
   Nhập như một món quà sự kiện `ev_*` (đi cùng `ev_elf_tent` trong special-products.mjs EVENT_ROWS), không bán.
3. Chạy test garden-v05 liên quan (art, hd, festival-lazy-art). Báo cáo ngắn vào docs/codex-briefs/rare-fish-01-report.md:
   file đã tạo/sửa, ảnh xem trước, test.
