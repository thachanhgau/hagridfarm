# Artwork vật tư — pixel gọn, rõ nét (V24.9.73)

Chủ dự án phản hồi ảnh đã lên server bị vụn, tối và khó nhận diện; chọn “Pixel gọn, rõ nét — giữ phong cách game”. Bản này làm lại chín thiết kế vật tư/cao cấp, giữ ID, giá, catalog, điều kiện mở khóa và save.

Nguyên nhân được kiểm tra trực tiếp:

- Master cũ quá nhiều chi tiết nhỏ; lấy mẫu xuống vùng 52×48 rồi ép bảng màu tạo hình lấm tấm.
- `itemArtVisual` còn phóng ảnh theo tỷ lệ lẻ (thí dụ 52/48), làm mật độ pixel không đều.
- Card khóa cấp áp `grayscale(1) brightness(.5)`, khiến ảnh mất màu và tối thêm.

Đã tạo chín master `masters-items/*-v2.png`: xô nước, Nước phép, Nước suối thần, Mưa suối thần, Phúc Lạc Dược, Bữa ăn thượng hạng, Tiệc chuồng, Thuốc Mọc Xương và Ổ ấm. Các mẫu có dáng đơn giản, mảng màu lớn, biểu tượng rõ, bỏ vi chi tiết/glow/đốm sáng. Master cũ vẫn được giữ; prompt và đường dẫn nguồn mới nằm trong `supply-art-sources.json`.

Canvas vẫn 64×64 và bảng 24 màu; riêng chín mẫu này có vùng mực tối đa 40×40 để vừa kho ở 1×. Khi đủ chỗ, UI dùng tỷ lệ nguyên và tọa độ nguyên; ô nhỏ hơn ảnh vẫn thu vừa để không cắt hình. Card cửa hàng khóa cấp giữ nguyên màu ảnh, còn tên/nhãn khóa và thao tác mua giữ trạng thái cũ. Không áp thay đổi màu lên các màn khác.

Kiểm tra: regression render đã thất bại trước sửa và đạt sau sửa; toàn bộ **261/261** test nguồn; image audit **922** file, không thiếu/trùng danh tính, palette/alpha/provenance đạt; WebP vẫn RGBA exact. Chrome/WebKit × 320/375/812/1280 đạt, ảnh shop căn nguyên pixel. Fixture cấp 20 xác nhận chín hàng khóa còn ảnh màu (`filter:none`) và không có nút mua hoạt động. Gallery 125 thẻ giữ nguyên. Xem `qa-v19/supply-art-qa-20261023.json` và `artwork-quality-v2-20261023.json`.

Đánh giá ảnh native ở **1×** và crop shop ở đúng kích thước CSS (DPR2 xuất nửa kích thước vật lý); không dùng ảnh master phóng to làm bằng chứng về khả năng đọc icon. Ảnh/mã đã kiểm tra cục bộ; bằng chứng server sẽ được ghi ở repo HPVN sau release.
