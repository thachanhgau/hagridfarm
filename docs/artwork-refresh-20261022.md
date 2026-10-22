# Hagrid Farm · Bộ ảnh V24.9.66

Đã thay các hình trùng nghĩa, hình tạm và 29 trang trí bị chủ dự án đánh giá thấp; sau đó làm lại 6 mái trú chuồng và Chó ba đầu theo ảnh chó trắng chủ dự án cung cấp. Công việc trong nhánh `codex/unique-art`, bắt đầu từ `7ea31c2`; chỉ kiểm chứng cục bộ, chưa push/deploy.

## Kiểm toán và thay thế

| Nhóm | Trước | Sau |
|---|---|---|
| Cây bậc Tận Sức | 8 loài dùng bản đổi màu của cây cũ | 8 thiết kế riêng × 4 giai đoạn, giữ ID và thời gian |
| Công thức | 27 công thức dùng chung 14 hình đầu ra | 27 hình có nguyên liệu, vật chứa và dáng riêng; kho đầu ra/khẩu phần dùng hình công thức chính tương ứng |
| Sản vật / kỷ vật | 12 loài dùng lại hình con thú | 12 sản vật riêng; kỷ vật dùng cùng sản vật trên bệ/huy hiệu để giữ đúng danh tính |
| Trang trí theo cấp | 29 món dùng hình khối đơn giản, một cặp icon giống nhau | 29 thiết kế chi tiết × 2 góc vẽ riêng, cả UI lẫn cảnh chơi |
| Công trình | 21 lần mở rộng dùng 2 hình chung | Bản vẽ thửa đánh dấu đúng vị trí/ID; 6 mái trú riêng cho 6 chuồng |
| Vật tư | Nước suối thần dùng lại icon Nước phép | Hình suối riêng |
| Mở khóa | Cấp 5/45 rơi về bí ngô trang trí | Đúng chuồng/cây lanh |
| Chó ba đầu | Chó nâu tai rủ | Chó trắng tai nhọn, mõm dài và mũi nâu hồng theo ảnh tham chiếu; 16 khung lớn lên/idle/ăn/vuốt ve |

Kiểm toán ban đầu: 804 tham chiếu, 800 đường dẫn, không thiếu file; 105 nhóm hash trùng đều thuộc nhiều góc/frame của cùng món. Vì vậy chỉ kiểm hash chưa đủ phát hiện các hình tạm/trùng nghĩa trong bảng trên.

Sau thay thế: **913 tham chiếu / 909 file**, **0 file thiếu**, **0 nhóm trùng giữa các danh tính khác nhau**. 106 nhóm alias cùng món được giữ có chủ ý, gồm sheet `action`/`eat` của chó. `qa-v19/image-audit-20261022.json` ghi số liệu. Bộ Halloween nguồn có 30 thiết kế nhưng chỉ 5 món đang trong catalog; không tự thêm 25 món chưa được mở bán hay sửa giá.

## Nguồn và cách xuất

- Tạo bằng công cụ ImageGen tích hợp. Prompt và đầu ra đã chọn nằm trong `*-art-sources.json`, `*-art-generation.json`, `item-art-generation.json`, phần provenance của `level-asset-sources.json` và `three-headed-dog-art-generation.json`.
- Master lưu trong `masters-items/`, `masters-levels/crops-{g,h,i}.png`, `masters/three-headed-dog-white-v01.png`. Master cũ của chó vẫn được giữ để phục hồi.
- `node garden-v05/build-item-art.mjs` xuất 103 view native: 39 công thức/sản vật + 58 góc trang trí + 6 mái trú. File và pivot được dùng chung qua `item-art.mjs`.
- Chuồng 1–3: canvas 128×112, pivot 64/96; chuồng 4–6: 160×144, pivot 80/128. Đã tăng từ bản thử 96px sau khi đặt cạnh thú lớn. Chuồng vẫn là sân 5×3 ô, 2 chỗ thú, mái trú mở ở phía sau; thú đứng trong sân và giữ hình/hitbox riêng.
- Chó: chạy `analyze-sources.py --only=three-headed-dog` bằng Python có Pillow/numpy, rồi `node garden-v05/build-native.mjs --only=three-headed-dog`. Giữ canvas lớn lên 64/128/128/160px và pivot trưởng thành 80/128. Chế độ scoped không ghi lại hình loài khác hay môi trường. Default analyzer cũng giữ master chó trắng làm nguồn chuẩn.
- Kiểm tra 151 frame mới: đúng palette 24 màu, alpha nhị phân, không rỗng, không chạm mép canvas; hash master/output được xác minh. 169 file native/môi trường ngoài chó không thay đổi trong lần xuất chó.

## Bằng chứng

- `node --test garden-v05/*.test.mjs`: **240 pass, 0 fail**.
- `node garden-v05/verify-image-assets.mjs`: không thiếu file, không trùng giữa các món.
- `node qa-v19/image-ui-qa.mjs` và `HAGRID_QA_WEBKIT=1 node qa-v19/image-ui-qa.mjs`: Chrome/WebKit, 98 thẻ/khung, 29 cặp góc riêng, 12 món thức ăn shop riêng; thử chọn/chạm đủ 12 thú, 6 mái được vẽ vào đúng canvas cache; 375×812, 812×375, 1280×800, giảm chuyển động, 4 thời tiết × 3 thời điểm; không lỗi trang hay HTTP ≥400. Report: `qa-v19/image-ui-{chrome,webkit}-20261022.json`.
- Đã sửa lỗi dịch tọa độ cache hai lần làm mái trú biến mất, phát hiện khi nhìn cảnh thật dù unit test trước đó đã pass; QA trình duyệt có kiểm tra destination của cả 6 mái.
- Parity prototype/server: **9 pass**, giữ nguyên dữ liệu cân bằng, catalog, giá và các quy tắc ví.
- Lighthouse mobile, trung vị 3 lượt: điểm 48 → 51; FCP 8.103 → 8.178 ms, LCP 11.628 → 11.779 ms, TBT 374 → 290 ms; dung lượng tải 5.434.020 → 5.719.975 byte (+5,3%). Đây là fixture localhost với throttling mobile, không phải đo production; xem `qa-v19/image-lighthouse-20261022.json`.

Xem `qa-v19/art-gallery.html` để rà từng hình và đổi góc; fixture `qa-v19/ui-fixture.html?wallet=emulator&qa=1&level=500&scenario=habitats&view=overview` cho cảnh có đủ thú. Chưa kiểm trên iPhone thật, tài khoản thật hay production. Đồng bộ HPVNN bằng `scripts/sync-hagrid-garden.mjs` sau khi commit nguồn; importer phải bao gồm `native-items`, không chép master vào client.
