# Hagrid Farm · Rào khu nuôi V24.9.69

Theo yêu cầu của chủ dự án, bỏ cả sáu mái trú chồng lên thú. Sân vẫn giữ kích thước 5×3, hai vị trí thú mỗi sân, ID/giá/tiến trình/hitbox và hợp đồng ví không đổi.

- Rào gỗ/kim loại thấp chạy quanh bốn cạnh; cổng có thanh chéo ở cạnh tây, khớp lối đi và đá bước chân. Sáu khu có màu gỗ, nẹp và đầu cột riêng.
- Cột phía sau cao 24px, phía trước 18px. Toàn bộ rào nằm trong cache dưới thú, tránh che các loài nhỏ; không đặt mái/vật lớn lên thân hay cánh.
- 6 icon mở rộng được dựng bằng chính hàm vẽ rào trong `garden-pen-details.mjs` qua `build-item-art.mjs`. Không dùng master mái cũ; master vẫn giữ để phục hồi. Manifest ghi hash nguồn hàm vẽ và output.
- `build-runtime-webp.mjs` xuất lại ảnh không mất pixel, gồm alpha/RGB trong suốt. 901 PNG chuyển thành WebP, 8 WebP cũ giữ nguyên: tổng 909 ảnh, 2.964.906 byte. Các PNG và master nguồn không bị xóa.

Kiểm tra cục bộ: `node --test garden-v05/*.test.mjs` 249 đạt; `verify-image-assets.mjs` 913 tham chiếu/909 file, 0 thiếu, 0 trùng giữa danh tính, 151 frame mới đúng palette/alpha/bounds; `build-runtime-webp.mjs --check` đạt. Chrome/WebKit và bản nhập HPVN được ghi nhận sau khi chạy, xem các report `qa-v19/image-ui-*-fences-20261023.json`. Không có bằng chứng iPhone thật/tài khoản thật/production.


## Cổng, bảng tên và cây viền sân

Cổng ra dùng hai trụ gỗ nẹp sắt có đèn và hai cánh mở, lối giữa rộng 2,5 ô được căn đúng cột 16 ở cả 7 mốc mở sân. Tuyết/dây trang trí không được vẽ ngang lối mở. Bảng gỗ hai cột nằm ngoài rào và dưới đường, gồm đúng hai dòng: “Trang trại của Hagrid” và “Người giữ khoá trường Hogwarts”. Có kiểm tra chống bảng bị rào che, sau khi cảnh thật phát hiện lỗi đó ở bản thử đầu.

Lỗi cây xuyên rào gồm kiểm tra rừng theo bản đồ cũ 26 hàng, phép thử điểm bỏ sót tán lớn, rừng đất chưa mở chỉ kiểm tra gốc, và 6 cây trang trí cũ neo sát rào. `forest-clearance.mjs` kiểm tra giao nhau giữa toàn bộ hình chữ nhật sprite và đa giác biên sân hiện tại (kể cả chỗ lõm), thêm 10px khoảng trống và 52px cho chiều cao rào. Cùng phép thử áp dụng cho mọi lớp rừng, cả khi đổi thời tiết; bỏ các neo cây cũ khỏi lớp vẽ, giữ dữ liệu/asset nguồn.

`qa-v19/forest-ui-qa.mjs` bắt các lệnh Canvas drawImage thực tế, xác minh đủ 7 mốc ở cấp 1/10/24/48/72/100/110 trong Chrome và WebKit: không có cây được vẽ cắt vào biên bảo vệ, bảng đủ hai dòng và chữ vừa bảng. `exit-gate-20261023.png` lưu cảnh cổng/bảng; `pens-fences-20261023.png` lưu khu nuôi sau thay rào. Không chỉ dựa vào tọa độ gốc cây hoặc unit test.

Lighthouse mobile (trung vị 3 lượt, fixture localhost): V24.9.67 → V24.9.69: {'performance': 52, 'fcpMs': 8178, 'lcpMs': 11778, 'tbtMs': 268, 'bytes': 4481004} → {'performance': 51, 'fcpMs': 8104, 'lcpMs': 11554, 'tbtMs': 279, 'bytes': 4463683}. Báo cáo `qa-v19/enclosure-lighthouse-20261023.json`; không phải số đo production.
