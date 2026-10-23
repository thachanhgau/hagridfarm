# Nhập Halloween V24.9.75

Đưa25 artwork nguồn còn lại vào collection festival hiện hữu: đủ30 món/60 góc. Năm entry và50 PNG cũ giữ nguyên byte, giá/ID/ownership/save không đổi. Nguồn đã có master; đợt này là tích hợp, không tuyên bố tạo lại artwork. 25 món mới:16 glow cục bộ,9 tĩnh; không quảng cáo blink/sway chưa được vẽ.

200 frame mới được ghép25 atlas, RGBA đối chiếu từng rect; hai base ảnh riêng cho mỗi món dùng trong shop. Runtime thêm75 WebP, tổng1.082 ảnh/3.762.734byte. Giữ master/PNG/prompt/QA ngoài runtime. Importer idempotent; native/frame/pivot/footprint giữ nguồn. Các rect ở hai góc được truyền qua decorFrameAt đến renderer, reduced motion dừng frame0.

Sửa placement: save có key kỷ vật bằng0 không được chiếm đất. Khi đã có tượng chỉ bảo vệ dải tượng thực tế, không chặn toàn bộ cánh đồng phía sau. Regression và kiểm tra đủ60 hướng đặt/xoay/cất đạt.

Giá dự thảo lấy đúng bảng từ ae27ee23a (25 món90.400G); phê duyệt từ log ngoài bị kiểm duyệt tự động từ chối làm căn cứ bật bán. Cả client/server giữ HALLOWEEN_NEW_PRICES_APPROVED=false và forSale:false cho25 món, chờ xác nhận trực tiếp ở chat này; năm món cũ không bị khóa. Đây là điều kiện mở bán, không phải thiếu hình.

Kiểm chứng:277/277 source tests; WebP1.074 chuyển đổi RGBA exact +8 có sẵn, image audit1.060 file tham chiếu không thiếu/trùng danh tính. Chrome/WebKit:30 thẻ shop, hai góc375px/1280px, ví fixture mua30 món và retry không trừ lại,60 hướng đặt/xoay, cất30 không mất sở hữu. Finance matrix1061 trên project emulator riêng demo-hpvnn-halloween-art xác nhận25 món chờ duyệt bị từ chối và0 ghi ví/ledger. Không giao dịch ví thật.

Lighthouse mobile median3: điểm52→52; FCP9.045→9.090ms/LCP12.885→12.990ms/TBT253,5→251,5ms; fixturelevel5004.901.744→5.258.637byte (+7,3%). Chưa thử iPhone vật lý hoặc giao dịch đăng nhập production.
