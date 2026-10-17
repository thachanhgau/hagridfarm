# V24.9 — QA sâu: chặn cày thưởng, sinh vật trong chuồng, cache module
17/10/2026. Agent: Claude Code (Anthropic). Ngoài Git; server 62795 / PID 72246 giữ nguyên.

- Preview: http://127.0.0.1:62795/qa-v19/ui-fixture.html?wallet=emulator&qa=1&level=100&view=overview&v=24.9.2
- Bản nhúng: http://127.0.0.1:62795/qa-v19/embed-preview.html?v=24.9.3 · Chơi local có lưu: ../garden-v05/index.html?qa=1&v=24.9.2
- Trước đó: HANDOFF-V24.8.5.md. Bản trước khi sửa (417 file nguồn): /Users/thachanh/.codex/visualizations/2026/10/17/01a1480f-4d73-7520-ad5b-221575ca7c7b/claude-qa/before/

## Lỗi đã sửa
1. Điểm lễ hội dùng chung một quỹ cho cả 3 lễ hội; `claimEventMilestone` không kiểm lễ hội của mốc → đổi lễ hội (miễn phí) là nhận đủ 9 mốc bằng 150 điểm. Nay `pointsByEvent` riêng từng lễ; `points` chỉ là điểm của lễ đang bật. Save cũ (v23, `points` chung) được gán cho lễ đang bật khi tải.
2. Hành động miễn phí cộng điểm lễ hội không giới hạn (đổi lễ +10, áp chủ đề +12, xoay đồ/sinh vật, vuốt ve, bưu thiếp, khoe Floo, tham quan). Nay `FREE_FESTIVAL_ACTIONS_PER_DAY` = rotate 3, pet 3, postcard/shareFloo/startTour 1 mỗi ngày. Việc nông trại thật (gieo, gặt, chế biến, cho ăn) giữ nguyên.
3. Chạm sinh vật = vuốt ve +12 gắn kết không giới hạn → spam lên cấp 5 và lấy hết quà trong vài giây. Nay `AFFINITY_PETS_PER_DAY` = 3 lần/sinh vật/ngày; lần sau hiện "đã đủ vuốt ve hôm nay". Cho ăn/thu hoạch không bị giới hạn.
4. Sinh vật lớn (Bằng Mã) đứng đè lên rào sau chuồng vì ô đứng thứ nhất chỉ cách mép 0,35 ô. Dời ô thứ nhất của 6 chuồng (27.35, r+1.35) → (27.9, r+1.9) trong scene-data.js/json; vẫn cách đồ trang trí chuồng > 60px.
5. Cùng một module được nạp với nhiều chuỗi version (`ui-utils`, `garden-growth`, `garden-seasonal-world`, `v24-visuals`) → 2 bản module chạy song song; iframe nhúng còn trỏ `&v=24.8.5.1` nên chạy toàn bộ code cũ từ cache. Đồng bộ mọi import runtime về `?v=24.9`; `garden-storage`, `progression-engine`, `balance-data` giữ không version như cũ.
6. Desktop 1024×768: tranh lễ hội cao 548px đẩy mốc quà ra khỏi màn hình. Giới hạn tranh `min(24vh,240px)`, thumbnail `min(10vh,80px)`; panel vừa một màn hình, mobile không đổi.

## Kiểm chứng
- 143/143 test pass (139 cũ + 4 test mới ở garden-v05/v249-qa.test.mjs). Log: v249-tests.log. Manifest: v24.9-sha256.json (593 file).
- Browser: fixture level 100 và bản nhúng không lỗi console, 0 asset thiếu, 0 module trùng, 0 file version 24.8. Vuốt ve lần 4–5 trả gain 0; đổi lễ hội 6 lần chỉ 3 lần đầu có điểm, Thảo dược hiện 10 điểm của riêng nó. Bằng Mã đứng trong chuồng. Save local v23 cũ tải được, cây đã gieo vẫn còn.
- Ngoài ý định: 6 file *.test.mjs chỉ đổi đường dẫn import sang `?v=24.9` (cùng bản module với code); không đổi logic test. scene-layout.test.mjs đổi giá trị kỳ vọng sang toạ độ mới.
- Chưa test trên iPhone/Safari thật. Ngày tính theo giờ máy, nên chỉnh đồng hồ máy vẫn lách được trần ngày (giới hạn của prototype chạy phía client).

## V24.9.1 — Phase 0: tài liệu nền + một entry duy nhất
- `docs/core-design.md`, `docs/art-bible.md`, `docs/palette.svg`: BẢN NHÁP chờ chủ dự án duyệt (các mục [CẦN QUYẾT]).
- `qa-v19/mobile-fixture.mjs` đã xoá. `garden-v05/mobile-game.mjs` là entry duy nhất: `ui-fixture.html` đặt `<html data-wallet="fixture">` để nạp ví mẫu `qa-v19/fixture-wallet.mjs`; trang khác nạp `garden-emulator-client.mjs`. QA hook `window.__HAGRID_GARDEN_QA__` chỉ có khi `qa=1` (nay có cả ở bản chơi local).
- Entry cache `mobile-game.mjs?v=24.9.3`; iframe nhúng `&v=24.9.3`.
- Kiểm chứng: 143/143 test; fixture level 100, chơi local `qa=1` (save giữ 3 cây), local không `qa` (không có hook), bản nhúng (ready, ví mẫu): không lỗi console, 0 asset thiếu.
- Đối chiếu Lý Lan (chưa sửa nhãn trong game): Thestral → vong mã, Mandrake → Nhân sâm, Bằng Mã → Bằng-Mã, Dạ vũ Giáng sinh → Dạ vũ Noel. Xem core-design mục 7.

## V24.9.2 — Phase 1 mở đầu: tên Lý Lan + bảng màu 32
- Chủ dự án duyệt core-design và art-bible ("đồng ý và làm tiếp"); trạng thái ghi trong đầu hai tài liệu.
- Tên hiển thị: Bằng Mã → Bằng-Mã, Thestral → Vong mã, Mandrake → Nhân sâm, Dạ vũ Giáng sinh → Dạ vũ Noel (balance-data, engine, sự kiện, cửa hàng, thành tựu, tour, manifest asset). "Giáng sinh" cho lễ Christmas giữ nguyên (đúng Lý Lan). Id nội bộ (`thestral`, `mandrake`…) không đổi, save cũ không ảnh hưởng.
- `progression-engine.test.mjs` so balance với `outputs/hagrid-levels-20261013/balance-data.json` sau khi áp cùng bảng đổi tên; file gốc đã duyệt không bị sửa, số liệu vẫn phải khớp tuyệt đối.
- `garden-v05/palette.mjs`: 24 màu sprite + 8 màu cảnh. Toàn bộ mã màu trong 17 module vẽ bằng code đưa về màu gần nhất (OKLab). Tuyết của chuồng và cỏ tuyết chỉnh tay. `palette.test.mjs` khoá: không module runtime nào được dùng hex ngoài bảng. CSS chưa chuyển.
- Cache: mọi import runtime `?v=24.9.5`. 144/144 test. QA ảnh trước/sau ở trời quang, mưa, tuyết, thu-đêm, panel Kho; fixture, chơi local (save còn 3 cây), bản nhúng: không lỗi console, 0 asset thiếu.

## V24.9.3 — Phase 1: juice cho gieo, gặt, cho ăn
- Canvas (`scene-animation.mjs` `eventHop`, `harvestPop`; dùng trong `scene-renderer.mjs`): cây mới gieo nhú lên theo đường cong pixel nguyên 3→1→−2→−3→−1→0; sinh vật nảy khi ăn/được thu sản phẩm; cây vừa gặt để lại "bóng" quả chín bay lên 18 px và mờ dần. Không scale sprite (đúng art bible luật 1).
- DOM (`garden-juice.mjs`, CSS `.juice-chip` trong `v24-ui.css`): chip `+N <icon>` bay từ luống/chuồng vào nút Kho; `+N XP` bay vào huy hiệu cấp; nút đích nảy nhẹ khi chip tới. Chỉ hiện cho thao tác thật (không hiện khi tải game hoặc đồng bộ ví ban đầu).
- Âm thanh (`garden-audio.mjs` `comboStep`, `play(kind,{pitch})`): lặp cùng thao tác gieo/gặt/cho ăn trong 2,5 giây thì cao lên một cung mỗi lần, tối đa 4 bậc; chip combo viền vàng đậm và lớn hơn một chút. Không đổi phần thưởng.
- Giảm chuyển động (`body.motion-paused`, gồm cả cài đặt hệ thống): canvas không nảy/không bóng; chip đứng cạnh nút đích, chỉ mờ vào/ra; nút không nảy.
- Kiểm chứng: 147/147 test (thêm `juice.test.mjs`). Browser phiên thử cấp 10/30: gieo (+3 XP), gặt ×3 (+3 bí ngô bay vào Kho, kho 7.000→7.006), đón Puffskein (+3 khẩu phần), cho ăn (sự kiện eat, +18 XP); giảm chuyển động chỉ có keyframe opacity. Bản nhúng và vườn thường không lỗi, không chip khi tải. Âm thanh combo kiểm bằng test, chưa nghe thử trên thiết bị.
