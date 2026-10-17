# V23.0 — Asset & Motion QA

Chốt ngày 2026-10-17; tiếp nối HANDOFF-V23.0-QA.md. Chỉ prototype ngoài Git. Server 62795/PID72246 được giữ nguyên. Không gọi dịch vụ ví thật, không deploy.

## Phạm vi kiểm tra
- Decode toàn bộ 431 tệp ảnh trong garden-v05, bao gồm master và ảnh QA/lịch sử: không lỗi decode.
- 576 bản ghi manifest/runtime: không thiếu tệp, không lệch kích thước khai báo. Con số có tham chiếu trùng giữa các manifest.
- Đối chiếu contact sheets của toàn bộ 24 cây + 12 sinh vật, frame trưởng thành/idle/action/care/eat; 9 sprite decor/NPC, trong đó 6 decor có hai hướng. Canvas thật tải 385 asset, không missing.
- Trang motion-review.html hiển thị mọi frame/clip, 29 decor vẽ bằng code và các lớp cảnh nền; cả hai hướng dùng chung pha. Có pause, bước100ms và reduced motion.
- Kiểm tra bằng Chromium local: source, fixture level1/100 ở390×844 và embed; không page errors, ảnh vỡ hay tràn ngang.

## Đã sửa
1. Idle không tự chen clip action/care cắt ngang ở960ms. Sáu loài mới không còn nhảy về frame trưởng thành tĩnh giữa chu kỳ idle. Ăn/vuốt ve chỉ chạy khi có thao tác.
2. Không cộng thêm bob/sway vào sprite đang có idle nhiều frame hoặc cử chỉ authored; chân giữ đúng điểm neo.
3. Cây dùng một frame chỉ lay phần lá phía trên; gốc/rễ không trượt theo cả bitmap. Cây đã có idle nhiều frame dùng chuyển động gốc.
4. Tách đồng hồ hết hạn hiệu ứng khỏi đồng hồ hình ảnh. Reduced motion giữ hình tĩnh nhưng sự kiện vẫn kết thúc, không tích tụ vô hạn.
5. Hitbox sinh vật hướng phải được lật cùng hình, tránh chạm phần thân mà không chọn được.

## Kết quả
- 119/119 node tests PASS (thêm5 kiểm tra asset/clip/idle/timeline/hướng decor).
- Browser chứng minh lower-strip gốc cây không đổi tọa độ qua4 mốc; care trong reduced motion hết hạn; click đúng mép sprite rồng hướng phải.
- Render clip8giây từ Canvas thật: idle/care/eat và đổi hướng; xem artifact bên dưới.
- Không cần tạo thêm bitmap: frame sẵn có đủ và hình dáng nhất quán; sửa ở cách phát/neo. Không thay master, sprite PNG hay catalog.
- Chưa xác nhận trên thiết bị iPhone/Safari thật. Kiểm tra hình ảnh/nhịp này không phải chứng minh hiệu năng mọi thiết bị.

## Preview
- Phòng motion: http://127.0.0.1:62795/qa-v19/motion-review.html
- Game: http://127.0.0.1:62795/qa-v19/ui-fixture.html?wallet=emulator&qa=1&level=100&view=overview&v=23.0-motion

## Evidence và phục hồi
Artifact directory: /Users/thachanh/.codex/visualizations/2026/10/17/01a1480f-4d73-7520-ad5b-221575ca7c7b/motion-qa

- asset-audit.json: inventory, dimensions, alpha bounds và raw-frame hashes.
- creature-*.png, crop-*.png, decor-*.png: contact sheets.
- scene-motion-final.png, actors-runtime.png, hagrid-motion-review.webm: renderer thật.
- tests.log, browser-motion.log, browser-final.log: kiểm thử.
- before/: code trước sửa; baseline.json; motion.patch. Không phục hồi ghi đè nếu đã có thay đổi tiếp theo.

Manifest mới v23.0-motion-sha256.json phủ431ảnh và mọi source/runtime top-level của garden-v05 cùng fixture/preview liên quan; manifest QA trước là mốc lịch sử, không còn đại diện code mới.

Tệp sửa/thêm:
- garden-v05/mobile-game.mjs
- garden-v05/motion-qa.test.mjs
- garden-v05/scene-animation.mjs
- garden-v05/scene-renderer.mjs
- qa-v19/mobile-fixture.mjs
- qa-v19/motion-review.html
