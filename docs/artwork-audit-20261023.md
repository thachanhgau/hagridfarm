# Rà soát artwork Hagrid — 23/10/2026

Rà theo bản nguồn `8211de5` đang được HPVN nhập vào, gồm cả hình vẽ trong mã và clip chuyển động. Có file WebP, hash khác nhau hoặc clip mang tên `idle` chưa chứng minh artwork đã được vẽ mới. Bản kiểm kê từng ID: [artwork-audit-20261023.json](artwork-audit-20261023.json).

## Đã cập nhật: artwork vật phẩm còn dùng SVG

| Mẫu mới | Trước | Phạm vi hiển thị |
|---|---|---|
| Nước tưới | SVG xô nước trong huy hiệu tròn | Cửa hàng, kho vật tư |
| Nước phép | SVG lọ thuốc và ngôi sao | Cửa hàng, kho, thưởng |
| Nước suối thần | SVG suối hình khối | Cửa hàng cao cấp, kho |
| Mưa suối thần | SVG mây và giọt nước | Cửa hàng cao cấp, kho |
| Phúc Lạc Dược | SVG lọ thuốc vàng | Cửa hàng cao cấp, kho |
| Bữa ăn thượng hạng | SVG bát thức ăn | Cửa hàng cao cấp, kho |
| Tiệc chuồng | SVG bàn và ba bát giống nhau | Cửa hàng cao cấp, kho |
| Thuốc Mọc Xương | SVG chai có hình xương | Cửa hàng cao cấp, kho |
| Ổ ấm chuồng | SVG tổ và trứng | Sáu nâng cấp ổ ấm chuồng 1–6 |
| Mở thửa | SVG sơ đồ ô vuông | 15 thẻ mở thửa; số thửa là nhãn HTML |
| Huy chương | SVG ngôi sao dự phòng | Thẻ thưởng / mốc không có vật phẩm riêng |
| Cúp kỷ vật | SVG cúp gắn trên sản vật | Huy hiệu kỷ vật của 12 loài |

**12 thiết kế mới**, trong đó chín thiết kế phục vụ 14 mặt hàng vật tư/cao cấp. Sáu ổ ấm dùng cùng một thiết kế vì là cùng loại nâng cấp theo chuồng; các thửa dùng cùng hình luống và tên/số thửa trong thẻ. Đây không phải 14 hoặc 15 thiết kế riêng. Côn trùng và cá đã có ảnh công thức tốt: bỏ SVG dự phòng, tra đúng `recipe_insects` / `recipe_fish`.

Đã tạo master riêng bằng ImageGen tích hợp, giữ nguyên alpha nguồn; xuất về canvas native 64×64, tối đa 24 màu, alpha 0/255, pivot cố định bằng pipeline hiện có. Tất cả ảnh mới có prompt và hash trong `supply-art-sources.json` / `item-art-manifest.json`. Master/PNG ở nguồn; game nhận WebP lossless. Gói có **922 WebP**, gồm 914 ảnh chuyển đổi và tám ảnh có sẵn. Các ảnh native cũ không bị vẽ lại trong đợt này. URL module tăng `24.9.72` để trình duyệt tải đúng mã và manifest mới.

## Artwork chưa hoàn thiện, vẫn còn sau đợt này

| Mức | Nhóm | Hiện trạng và việc cần làm |
|---|---|---|
| P1 | **23 cây thiếu idle/action vẽ riêng** | Chỉ có bốn ảnh lớn lên; clip idle/action lặp ảnh trưởng thành, cộng dịch vị trí bằng mã. Cần atlas chuyển động được vẽ riêng. |
| P1 | **Năm sinh vật thiếu khung ăn/chăm sóc** | Puffskein, Que Xạo, Đào mỏ, Bằng-Mã và Rồng dùng chuyển động/hiệu ứng tim, nước bằng mã. Cần khung ăn và vuốt ve riêng. |
| P1 | **Ba cảnh nhân vật/công trình chưa có master riêng** | Hagrid (`gardener`), nhà kính (`greenhouse`), cú đưa thư (`owl`) vẫn do `wizard-scenery.mjs` vẽ bằng pixel trong mã. Đây là hình đang dùng, chưa phải artwork mới được tạo. |
| P2 | **Đạo cụ môi trường sống của 12 loài** | Máng, đồ chơi, chỗ trú và chi tiết riêng vẫn do `garden-creature-habitats.mjs` vẽ. Cần xem và thay theo loài nếu muốn bộ prop minh họa riêng. |
| P2 | **Kỷ vật 12 loài** | Hình sản vật đặt trên đế bằng mã; đợt này chỉ thay huy hiệu cúp trong UI. Chưa tạo 12 tượng/kỷ vật riêng. |
| P2 | **Góc phải của 12 sinh vật** | Runtime lật ngang ảnh trái; chưa có bộ góc phải được vẽ riêng. Cơ chế hiện tại vẫn hoạt động. |
| P2 | **13 cảnh báo atlas trên chín ID** | Yến mạch, Cà rốt, Rong nước xiết, Củ u, Sung-quéo, Bông-đòng-đưa, Bẫy Quỷ, Mooncalf, Kneazle. Phần xuất native báo `clippedPixels: 0`; cần xem khe cắt atlas, chưa có bằng chứng mất pixel ở output. |
| P2 | **25 món Halloween chưa nhập catalog/runtime** | Nguồn có 30 món/60 góc, catalog hiện dùng năm món. Đây là phần chưa tích hợp, không phải thiếu master. Việc nhập đủ món cần đồng bộ catalog client/server và kiểm tra giá trong một đợt riêng. |

Danh sách **23 cây**: Cỏ ba lá, Củ cải đỏ, Ngô vàng, Cỏ trăng, Lanh, Hướng dương, Nữ lang, Bạc hà, Việt quất, Ớt lửa, Tảo bạc, Đậu sao, Dưa hổ phách, Nấm sương, Hoa nhật quang, Rong nước xiết, Củ u, Cỏ chút chít, Sung-quéo, Cỏ mang cá, Mimbulus mimbletonia, Bông-đòng-đưa, Bẫy Quỷ.

Yến mạch, Cà rốt, Xà lách có bảy frame bổ sung bằng dịch hàng pixel của ảnh trưởng thành; vẫn là phương án chuyển động tạm, không phải khung được vẽ riêng. Sáu cây gốc có đủ 12 frame. Sáu sinh vật cấp cao và Chó ba đầu đã có bộ ăn/chăm sóc riêng.

Rào, lối đi, nền chuồng, viền luống và đá bước vẫn vẽ bằng mã để khớp hình học/địa hình. Không tự coi mọi hình Canvas là chất lượng thấp. HUD 16px là pixel grid có chủ ý; SVG của navigation/settings là icon giao diện, không nằm trong nhóm artwork hàng hóa đã thay.

Master, prompt và manifest của bộ Harry Potter/Halloween có đầy đủ trong repo nguồn (`special-products-assets/`, `halloween-assets/`). Chúng được loại khỏi runtime khi đóng gói có chủ ý; không được kết luận thiếu artwork chỉ vì không thấy master trong `client/public`.

## Kiểm chứng cục bộ

- `node --test garden-v05/*.test.mjs`: **260/260**. Worktree dùng liên kết đọc tới JSON cân bằng đã duyệt trong checkout nguồn chính; không sửa số liệu/giá.
- `node garden-v05/verify-image-assets.mjs`: **922 file**, không thiếu, không trùng hash giữa danh tính khác nhau; kiểm 164 frame native, palette/alpha/mép canvas và provenance.
- `node garden-v05/build-runtime-webp.mjs --check`: **914 + 8**; lúc xuất đối chiếu RGBA PNG/WebP từng pixel, không resize thêm.
- `node qa-v19/supply-art-qa.mjs`: Chrome + WebKit, 320×568, 375×812, 812×375, 1280×800; 125 thẻ gallery; 12 thẻ tab Cao cấp dùng bảy mẫu đúng danh tính; không SVG trong ô vật phẩm, không ảnh lỗi, không tràn trang, không lỗi JavaScript. Mọi yêu cầu được phục vụ bằng fixture trong bộ nhớ tại origin 3026; không khởi động server thứ hai, không gọi Firebase/ví thật.

Đây là đợt thay artwork SVG vật phẩm và cập nhật kiểm kê. Các mục tồn đọng phía trên chưa được báo hoàn thành. Chưa push, deploy, thử trên iPhone thật hoặc xác nhận production.
