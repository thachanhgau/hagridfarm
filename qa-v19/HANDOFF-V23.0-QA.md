# Handoff V23.0 — QA và sửa lỗi local

Ngày chốt: 2026-10-17. Prototype ngoài Git; không tích hợp, commit, push hoặc deploy. Giữ server 62795/PID 72246. Handoff và manifest V23.0 gốc được giữ nguyên làm baseline (22/22 hash khớp trước sửa); dùng manifest QA mới để kiểm tra trạng thái sau sửa.

## Các sửa đổi
- HUD mobile không còn cắt nút cấp, kho và menu; bỏ nút lồng trong nút. Khi xoay sang ngang thấp, khay thao tác tự thu gọn và vẫn mở lại được.
- Nhiệm vụ ngày tính hành động thành công trong ngày, không tự hoàn thành từ thành tích trọn đời. Refresh chỉ đọc; ngày/streak cập nhật lúc mở phiên. Mốc đổi ngày dùng lịch địa phương.
- Sửa thưởng đồng thời bộ vật liệu và vật phẩm phụ; nhận thưởng qua cùng một đường xử lý. Vuốt ve giữ XP gắn kết đã có thay vì đặt lại về 12.
- Lưu core, vật tư và trạng thái nhận thưởng trong một envelope theo play/lab/QA. Giao dịch lưu thất bại không mất quyền nhận; khóa giữa các tab ngăn nhận trùng. Chuyển phiên tải lại đầy đủ thiết lập cảnh.
- Fixture ví là dữ liệu trong bộ nhớ: tải lại đặt lại cả ví và quyền nhận thưởng. Chế độ local không ví mới là chế độ lưu trên thiết bị. Ví server thật chưa có API thưởng V23 nên từ chối nhận thưởng thay vì báo nhận giả.
- UI kho local ghi rõ vật tư đã lưu; gameplay local vẫn gieo tự do theo thiết kế prototype.

## Bằng chứng
- node --test *.test.mjs: 114/114 PASS, gồm 7 regression tests mới.
- Chromium: level 1 và 100 ở 1280×720, 390×844, 320×720, 667×375: 8/8 viewport không cắt HUD; không page errors trong ma trận.
- Bản nhúng desktop/mobile: host đổi lễ hội/thời tiết/khung cảnh, đi thăm và về vườn hoạt động; chia sẻ chỉ vào feed host giả lập.
- UI nhận quà thư cú và Rương Cú Vàng, tải lại giữ cây/revision/vật tư. Chặn mở rương và nhận mốc thưởng lặp lại; hai tab cùng nhận một mốc chỉ cộng một lần.
- Mô phỏng lỗi localStorage: SAVE_FAILED, không cộng thưởng/đánh dấu; thử lại thành công. Quà thăm vườn cùng tiến độ nhiệm vụ nằm trong một giao dịch.
- Thưởng kit + mandrake đủ cả hai; gắn kết puffskein 90→102 sau vuốt ve. Preview tải lại trả cả ví lẫn quyền nhận về ban đầu.
- Đổi ngày: nhiệm vụ mới 0/5, rương khóa, streak tăng. Chuyển UI play→lab100→play giữ level1, thời tiết rain và kho đã lưu; lab clear riêng biệt.
- Đã kiểm tra trang source local và fixture. Browser QA cách ly, chặn network ngoài origin 127.0.0.1:62795; không gọi tài khoản/emulator thật.

## Giới hạn và điểm cần giữ khi tiếp tục
- Chưa kiểm thử trên iPhone/iPad Safari thật; viewport Chromium không thay thế kiểm thử thiết bị.
- Catalog hiện tại có vườn Charlie Weasley (không phải Luna); một số số lượng thưởng/tên mục tiêu khác mô tả handoff gốc. QA giữ catalog thực tế, không tự cân bằng lại.
- Phạm vi này không chứng minh thưởng server/đồng bộ nhiều thiết bị. Local supplies được lưu nhưng chi phí gameplay local vẫn là prototype.
- Antigravity không chạy audit: automatic approval review từ chối khả năng gửi source riêng tới dịch vụ ngoài chưa được cho phép. Lead kiểm tra bằng trình duyệt local.

## Tệp và bằng chứng
QA artifacts: /Users/thachanh/.codex/visualizations/2026/10/17/01a1480f-4d73-7520-ad5b-221575ca7c7b

Logs: tests-final.log, browser-final.log, browser-session-final.log, browser-help-final.log. Screenshots: qa-level*, qa-events*, qa-embed*, qa-landscape-final.png, qa-local-persisted-inventory.png.

Backup trước sửa: before-v23-qa/ (text/code và sha256.json; media giữ tại chỗ). Diff: v23-qa.patch. Không khôi phục hàng loạt nếu đã có thay đổi mới.

Các tệp sửa/thêm:
- garden-v05/garden-achievements.mjs
- garden-v05/garden-events.mjs
- garden-v05/garden-quests.mjs
- garden-v05/garden-storage.mjs
- garden-v05/garden-tour.mjs
- garden-v05/hpvn-bridge.mjs
- garden-v05/mobile-game.mjs
- garden-v05/progression-panels.mjs
- garden-v05/v21-features.test.mjs
- garden-v05/v23-features.test.mjs
- garden-v05/v23-qa.test.mjs
- garden-v05/wizard-ui.css
- garden-v05/wizard-ui.mjs
- qa-v19/fixture-wallet.mjs
- qa-v19/mobile-fixture.mjs
