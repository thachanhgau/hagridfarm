# Cất trang trí của vườn

Trong **Trang trí → Trang trí của vườn**, dùng **Cất** hoặc **Đặt lại** cho
ao và các trang trí lối đi đã nhận. Đài kỷ vật có cùng nút ở phần **Kỷ vật
sinh vật**. Quyền sở hữu, số kỷ vật, tài nguyên, giá và Galleons không đổi.

Cất phải bỏ cả vật thể khỏi danh sách vẽ/chọn và bỏ footprint/silhouette
khỏi kiểm tra đặt đồ. Người chơi có thể đặt món đã mua vào chỗ trống đó.
Đặt lại giữ nền/vị trí gốc; nếu nền đang được thay bằng món mua, giao diện
yêu cầu dời hoặc cất món đó trước. Không tự đẩy vật phẩm sang vị trí khác.

Trạng thái là `garden.decorations.hiddenDefaults`, một danh sách ID tùy chọn
do server lưu, không phải visual prefs riêng trên thiết bị. Bản lưu cũ thiếu
trường này vẫn bày đầy đủ như trước. API hiện có `performHagridGardenAction`
nhận `setDefaultDecorationVisibility` với `itemId`, boolean `visible`,
`expectedRevision`, `requestId`. Server kiểm tra ID/ownership, đổi revision
một lần và dùng cơ chế retry/idempotency hiện có. Không tạo thưởng khi cất.

`default-decor.mjs` và `default-decor.test.mjs` sở hữu hợp đồng phía nguồn;
`scripts/garden/prototype-parity.test.mjs` của HPVN đối chiếu fixture/handler
và whitelist `functions/games/garden-default-decor-ids.json`. Whitelist có
42 ID: ao, 29 trang trí lối đi và 12 loài kỷ vật. Lều, nhà kính, Hagrid,
bưu cục, thửa, chuồng, đường chính và rừng biên giữ chức năng hiện có.
Kiểm tra phục hồi đè lên vật phẩm là kiểm tra hình học phía client, giống
các ràng buộc nền/che khuất của cơ chế đặt đồ hiện có.

`qa-v19/default-decor-qa.mjs` chạy iframe opaque và chặn mọi kết nối ngoài:
Chrome/WebKit, 1280×800, 375×812, 812×375; điện thoại dùng touch thật trong
browser emulation. Kiểm tra cất/đặt lại từng loại, mất khỏi paint/pick,
đặt đèn mua vào nền ao, từ chối đặt lại ao khi bị chiếm, cất đèn rồi đặt
lại ao, và giữ nguyên inventory/ownership. Đây là fixture trong bộ nhớ,
không phải tài khoản hay ví thật.

Khi phát hành phải có backend mới trước client. Mọi export dùng normalizer
garden cần giữ trường mới; không cập nhật client đơn lẻ rồi nhận là đã lưu
theo tài khoản. Bản lưới V24.9.81 được giữ; mã client đổi cache sang V24.9.82.
