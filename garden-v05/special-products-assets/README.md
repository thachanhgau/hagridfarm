# Dấu ấn Harry Potter — 30 sản phẩm đặc biệt

Bộ asset tạo bằng builtin image_gen, đối chiếu đồ vật và cảnh trong 7 tập Harry Potter với nguồn FullHP tại máy. Dùng cho trang trí Hagrid Farm; giá bán và tích hợp cửa hàng chưa nằm trong gói này.

## Nội dung

- 30 master PNG nền trong suốt, mỗi master gồm hai góc nhìn thật, không lật gương.
- 60 PNG native; 240 frame idle (4 frame × 2 góc × 30 món), 30 sprite sheet và thumbnail 2×/3×.
- Sprite được dựng trên lưới pixel, alpha nhị phân, tối đa 12 màu thuộc 3 dải trong bảng 24 màu của game.
- 22 món có thay đổi ánh sáng cục bộ; 8 món giữ khung tĩnh. Không có clip tương tác mở tủ, nở trứng, cử động sinh vật hoặc nhận thưởng. Reduced motion giữ frame 0.
- Manifest có kích thước, pivot chân, footprint, thời lượng frame, palette và nguồn tập/chương. generation-log.json/prompts.json lưu prompt tạo ảnh và hai lượt sửa theo truyện. Ảnh gốc từng bản được giữ tại masters/variants/.

## Xem và sử dụng

Mở qa/collection-overview.png để xem cả bộ có tên; qa/contact-sheet.png để so hai góc ở pixel native. Mở preview.html trong trình duyệt máy để xem frame, hai góc, zoom nguyên 1×/2× và overlay 4 thời tiết × 3 thời điểm. Đây là bảng duyệt asset, không phải kiểm thử trong cảnh game. Trình duyệt tự động của phiên này chặn giao thức file:, nên không ghi nhận bằng chứng browser/mobile/runtime từ preview.

Chạy `node build-assets.mjs` để tái xuất; cần sharp có sẵn trong runtime Codex hoặc cài trong môi trường. Kiểm tra kỹ thuật ghi trong qa/validation.json. Quy tắc mỹ thuật nguồn: docs/art-bible.md.

Các bệ đỡ, kích thước thu nhỏ, bố cục trưng bày và vài họa tiết là chuyển thể tạo hình. Hình thức trang trí không có nghĩa vật thể gốc được bán trong cốt truyện. Không sao chép nội dung toàn văn ebook vào gói.

## Căn cứ trong truyện

| # | Sản phẩm | Nguồn | Liên hệ |
|---|---|---|---|
| 1 | Góc ô hồng của Hagrid | Hòn Đá Phù Thủy · chương 4 | Chiếc ô hồng của Hagrid; bố cục trưng bày là chuyển thể cho game. |
| 2 | Trứng rồng Norbert bên lò sưởi | Hòn Đá Phù Thủy · chương 14 | Trứng rồng được ấp trong lò sưởi nhà Hagrid. |
| 3 | Xe máy bay của Sirius | Hòn Đá Phù Thủy · chương 1 | Chiếc xe máy của Sirius được Hagrid dùng đưa Harry tới đường Privet. |
| 4 | Liễu Roi và chiếc Ford Anglia | Phòng Chứa Bí Mật · chương 5 | Harry và Ron đâm xe vào cây Liễu Roi. |
| 5 | Bằng-Mã bên vườn bí ngô | Tên Tù Nhân Ngục Azkaban · chương 21 | Bằng-Mã được giải cứu ở khu vực nhà Hagrid trong đêm dùng Xoay Thời Gian. |
| 6 | Hang tơ Aragog | Phòng Chứa Bí Mật · chương 15 | Aragog và bầy nhện trong Rừng Cấm. |
| 7 | Tấm gương Ảo Ảnh | Hòn Đá Phù Thủy · chương 12 | Tấm gương cho người xem thấy điều họ khao khát nhất. |
| 8 | Nón Phân Loại trên ghế | Hòn Đá Phù Thủy · chương 7 | Nón Phân Loại được đặt trên ghế trong lễ phân loại. |
| 9 | Chiếc Cốc Lửa | Chiếc Cốc Lửa · chương 16 | Chiếc cốc bằng gỗ chọn các quán quân Tam Pháp Thuật. |
| 10 | Cái Tưởng Ký | Chiếc Cốc Lửa · chương 30 | Chậu đá chứa và xem ký ức trong văn phòng Dumbledore. |
| 11 | Cầu đậu phượng hoàng Fawkes | Phòng Chứa Bí Mật · chương 12 | Phượng hoàng Fawkes trong văn phòng Dumbledore. |
| 12 | Quân mã cờ phù thủy | Hòn Đá Phù Thủy · chương 16 | Bàn cờ phù thủy khổng lồ trong thử thách bảo vệ Hòn Đá Phù Thủy. |
| 13 | Nhật ký Riddle và nanh Tử Xà | Phòng Chứa Bí Mật · chương 17 | Harry dùng nanh Tử Xà phá hủy quyển nhật ký. |
| 14 | Mề đay Slytherin | Bảo Bối Tử Thần · chương 19 | Chiếc mề đay Trường Sinh Linh Giá được phá hủy bằng thanh gươm. |
| 15 | Nhẫn gia tộc Gaunt | Hoàng Tử Lai · chương 10 | Chiếc nhẫn gia tộc Gaunt, về sau được nhận diện là Trường Sinh Linh Giá. |
| 16 | Chiếc cúp Hufflepuff | Bảo Bối Tử Thần · chương 26 | Chiếc cúp được lấy khỏi hầm Lestrange ở Gringotts. |
| 17 | Vương miện Ravenclaw | Bảo Bối Tử Thần · chương 31 | Vương miện thất lạc của Ravenclaw trong Phòng Theo Yêu Cầu. |
| 18 | Tủ Biến Mất | Hoàng Tử Lai · chương 27 | Chiếc tủ Draco sửa để nối Hogwarts với Borgin và Burkes. |
| 19 | Bàn Tay Vẻ Vang | Phòng Chứa Bí Mật · chương 4 | Cổ vật trong cửa tiệm Borgin và Burkes. |
| 20 | Dây chuyền opal bị nguyền | Hoàng Tử Lai · chương 12 | Dây chuyền khiến Katie Bell bị nguyền. |
| 21 | Cánh cửa Phòng Chứa Bí Mật | Phòng Chứa Bí Mật · chương 16 | Vách đá có hai con rắn quấn nhau, mắt bằng ngọc lục bảo, mở bằng Xà Ngữ. |
| 22 | Vòm màn che ở Bộ Pháp Thuật | Hội Phượng Hoàng · chương 34 | Vòm đá có màn che trong Sở Bảo Mật. |
| 23 | Sách Quái Vật về Quái Vật | Tên Tù Nhân Ngục Azkaban · chương 1 | Cuốn sách Hagrid gửi tặng Harry và dùng cho môn Chăm Sóc Sinh Vật Huyền Bí. |
| 24 | Bánh ngày giỗ Nick Suýt Mất Đầu | Phòng Chứa Bí Mật · chương 8 | Bánh hình bia mộ trong bữa tiệc ngày giỗ lần thứ 500 của Nick. |
| 25 | Bản đồ của Đạo tặc | Tên Tù Nhân Ngục Azkaban · chương 10 | Fred và George trao cho Harry bản đồ các lối đi bí mật Hogwarts. |
| 26 | Cái Xoay Thời Gian | Tên Tù Nhân Ngục Azkaban · chương 21 | Dụng cụ Hermione dùng cùng Harry để quay lại thời gian. |
| 27 | Cái Tắt-Sáng | Bảo Bối Tử Thần · chương 7 | Dumbledore để lại dụng cụ thu ánh sáng cho Ron. |
| 28 | Snitch giữ Hòn Đá Phục Sinh | Bảo Bối Tử Thần · chương 34 | Harry mở quả Snitch trước khi đi vào Rừng Cấm. |
| 29 | Thanh gươm Gryffindor | Phòng Chứa Bí Mật · chương 17 | Thanh gươm xuất hiện từ Nón Phân Loại trong trận đối đầu Tử Xà. |
| 30 | Xe Đò Hiệp Sĩ | Tên Tù Nhân Ngục Azkaban · chương 3 | Chiếc xe buýt ba tầng đón Harry sau khi rời nhà Dursley. |


## Bàn giao import

Thư mục này chỉ lưu bộ asset nguồn, chưa được game tải. Đọc docs/special-products-import-handoff.md ở gốc repo trước khi import. Chỉ mang PNG native và manifest runtime cần thiết vào gói chạy; giữ master/preview/QA/prompts ngoài đầu vào triển khai. Có thể cung cấp Sharp qua biến SHARP_MODULE nếu môi trường chưa cài sharp. Không có thay đổi giá bán, ví hay giao dịch trong commit asset.
