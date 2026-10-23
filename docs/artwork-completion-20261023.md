# Hoàn thiện artwork Hagrid V24.9.74

Theo yêu cầu hoàn tất phần còn lại; Halloween được bỏ qua theo chỉ dẫn cuối của chủ dự án. Không thay catalog, giá, quyền sở hữu, save, backend hoặc mở bán thêm đồ.

| Phần hoàn thiện | Kết quả |
|---|---|
| 26 cây | 23 cây còn thiếu và Yến mạch/Cà rốt/Xà lách: 258 pose idle/action mới; giữ bốn ảnh lớn lên. Toàn bộ 32 cây có idle/action riêng. |
| 12 sinh vật | 240 pose góc phải gồm bốn tuổi và idle/action/eat/care; 116 pose bên trái bổ sung cho 11 loài, giữ nguyên bộ Chó ba đầu trắng đã đủ. |
| Hagrid, cú đưa thư, nhà kính | Mỗi cảnh bốn pose được vẽ riêng; Hagrid chỉ vẫy chào khi tương tác. Kiểm kê cũ nói chưa có master là chưa chính xác: master tĩnh đã có, phần thiếu là pose hoạt động riêng. |
| Đồ môi trường và kỷ vật | 12 đạo cụ theo loài + 12 tượng theo loài; thay sản vật đặt trên đế bằng mã. |
| Cảnh báo cắt atlas | 13 → 0: đặt đường cắt giữa khe alpha; 128 PNG lớn lên giữ nguyên byte. |

Tổng **650 khung native mới**. Giữ master, prompt chính xác, hash nguồn và output. Bộ runtime có **1.007 WebP / 3.474.214 byte**; PNG/WebP đối chiếu RGBA từng pixel. 49 atlas chuyển động giữ nguyên RGBA của từng frame native, giảm số request so với tải riêng 614 ảnh cây/sinh vật. Native 1× và cảnh thật đã được xem; không dùng master lớn làm bằng chứng cho độ rõ ở kích thước chơi.

Runtime gọi clip cây khi chăm và thu hoạch; thu hoạch phát pose của cây vừa lấy ra. Góc phải của sinh vật dùng art riêng và hitbox cùng tọa độ ảnh, không lật ngang. Giữ dừng chuyển động theo cài đặt hệ thống.

Kiểm chứng: **275/275** test nguồn; toàn bộ 650 frame đúng palette24, alpha0/255, có khoảng trong suốt quanh canvas và khớp hash. Không thiếu ảnh hoặc trùng danh tính trong 985 ảnh được tham chiếu. Chrome/WebKit kiểm 24 tổ hợp hai góc × bốn thời tiết × ba thời điểm, đủ 32 cây/12 sinh vật, các clip ăn/chăm/nhận thưởng, chăm/thu hoạch cây, hitbox và reduced motion. Gallery/shop tiếp tục đạt bốn viewport 320/375/812/1280. Fixture chặn mọi request ngoài nguồn cục bộ, không chạm tài khoản/dịch vụ thật.

Lighthouse13.5 mobile mô phỏng, trung vị ba lượt trước/sau: điểm **52→52**, FCP 8.415→9.030ms, LCP 12.015→12.795ms, TBT245,5→253,5ms; cảnh level500 4.438.530→4.901.744byte (+10,4%). Đây là fixture toàn cảnh tải sẵn; không phải số đo trên điện thoại thật. Bằng chứng máy đọc: [artwork-completion-20261023.json](artwork-completion-20261023.json).

Bản nguồn đã kiểm cục bộ; bằng chứng nhập và triển khai ghi ở repo HPVN sau release. Chưa kiểm trên iPhone vật lý hoặc chơi đăng nhập.
