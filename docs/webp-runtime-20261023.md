# Hagrid Farm V24.9.67 · WebP runtime

Theo yêu cầu chủ dự án, toàn bộ ảnh raster dùng trong game chuyển sang WebP. Master và PNG native được giữ nguyên để xuất lại; không thay pixel, kích thước, alpha, pivot, frame, ID hay giá.

- **901 PNG runtime → 901 WebP lossless**, `exact:true`, effort6. Từng ảnh được giải mã trước/sau và so đủ RGBA byte bằng byte, bao gồm màu ẩn dưới alpha0: 901/901 bằng nhau.
- **8 WebP có sẵn giữ nguyên byte**, không nén lại làm giảm chất lượng. 7 ảnh vốn dùng VP8, Quidditch dùng VP8L; việc này không khôi phục chi tiết đã mất trong ảnh cũ.
- Gói cũ có912 ảnh (904PNG+8WebP), **7.437.379 byte**. Ba ảnh không được game dùng (`decor-assets/qa/decor-contact-sheet-2x4.png`, `environment/hut.png`, `environment/props-v03.png`) vẫn được giữ tại nguồn và không còn đóng gói. Gói mới **909 WebP, 2.977.412 byte**, giảm **59,97%** so với gói ảnh cũ. Riêng 909 ảnh đang thực sự dùng giảm **29,42%** nhờ nén (4.218.211→2.977.412 byte).
- `runtime-webp-manifest.json` lưu đường dẫn, kích thước, số byte và SHA256 nguồn/đầu ra. `runtime-image-url.mjs` do exporter sinh, ánh xạ tại chỗ tải ảnh; manifest hình/pivot/cache vẫn nhận cùng ID nguồn. Revision `ee301f9be424` gắn trên URL WebP để làm mới cache.
- UI dùng `el('img',...)`, Canvas dùng loader `createGarden`, thumbnail xoay và nền dock cùng đi qua URL resolver. Các SVG icon bằng code, ảnh avatar ngoài game, blob dựng cảnh và postcard xuất cho người dùng giữ cơ chế hiện có.
- Importer HPVNN kiểm tra SHA cả nguồn lẫn WebP trước khi đóng gói, bỏ PNG/JPEG/GIF, chỉ chép các output được manifest liệt kê và8 WebP cũ. Không ship PNG fallback hoặc master.

## Kiểm tra

`node --test garden-v05/*.test.mjs`: **243 pass, 0 fail**. `node garden-v05/build-runtime-webp.mjs --check`: 901 chuyển đổi +8 WebP cũ, đúng hash.

`node qa-v19/image-ui-qa.mjs` và `HAGRID_QA_WEBKIT=1 node qa-v19/image-ui-qa.mjs`: Chrome906/WebKit905 request ảnh HTTP, **tất cả WebP**, không lỗi trang/HTTP. Đủ98 thẻ/khung,29 cặp góc,12 thú/6 chuồng,375×812/812×375/1280×800,4 thời tiết×3 thời điểm, clip ăn/vuốt ve chó trắng đủ4 frame. Report `qa-v19/image-ui-{chrome,webkit}-webp-20261023.json`.

Đo Lighthouse mobile trước/sau: `qa-v19/webp-lighthouse-20261023.json` (trung vị3, baseline V24.9.66 đã đo, fixture localhost). Điểm51→52; lượng tải HTTP5.719.975→4.481.004 byte (giảm21,66%); FCP8.178ms không đổi, LCP11.779→11.778ms, TBT290→268ms. Đây là kiểm chứng cục bộ; chưa push/deploy hay kiểm thiết bị thật.
