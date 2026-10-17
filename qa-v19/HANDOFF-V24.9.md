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

## V24.9.4 — Phase 1: ba phút đầu với Hagrid (core-design mục 6)
- `garden-tutorial.mjs` (thuần): 6 bước intro → plant → grow → harvest → feed → owl → done; tiến theo dữ kiện thật của luống 1 (đã gieo / đã chín / đã gặt), nên làm khác thứ tự vẫn không kẹt. Mỗi lời Hagrid ≤ 8 từ. Bước lưu trong bản lưu theo phiên (`hagrid-tutorial-v1`); chỉ chạy cho vườn mới tinh ở phiên chơi thường, local. Người chơi cũ, phiên thử, fixture/ví đều bỏ qua. QA: `?qa=1&tutorial=1` chạy lại nếu vườn còn trống.
- Không có trang hướng dẫn chữ: máy quay lướt (`camera.glide`) tới khung ôm Hagrid + luống 1; luống có viền vàng nhấp nháy + mũi tên pixel; nút cần bấm phát sáng (`.tutorial-pulse`, chọn nút đang hiển thị: Gieo hoặc Gặt của thẻ ngữ cảnh); cây chín rung; nút nhỏ "Bỏ qua" ở cột máy quay.
- "Nước phép": dùng `E.advanceTime` đúng bằng thời gian cây còn thiếu, một lần duy nhất.
- Puffskein mở ở cấp 10 nên bước cho ăn dùng Puffskein **của Hagrid ghé chơi** (`guestActor` trong renderer, bong bóng "Đói…", chạm để cho ăn): không vào `state.creatures`, không đổi balance đã duyệt.
- Kết thúc mở Thư cú và đánh dấu `done`. Lên cấp 2 sau lần gặt đầu (+33 XP) hiện màn lên cấp sẵn có.
- Giảm chuyển động: máy quay nhảy thẳng tới khung, viền/mũi tên đứng yên, nút chỉ sáng tĩnh (đã kiểm bằng code; chưa chụp ảnh riêng chế độ này).
- Kiểm chứng: 152/152 test (thêm `tutorial.test.mjs`). Browser 518 px: chạy trọn 6 bước trên vườn mới, tải lại giữa chừng vẫn tiếp đúng bước; phát hiện và sửa khung máy quay cắt mất Hagrid, nút Gặt thật là `#contextAction`, nút Bỏ qua đè thông báo/xuống dòng, khách đứng sát mép. Vườn cũ và bản nhúng không bị ảnh hưởng, không lỗi console.

## V24.9.5 — Phase 1: idle + hành động cho vòng chơi đầu (art-bible mục 5)
- Ba phút đầu (bí ngô, Puffskein) đã đủ 12 frame từ trước. Vòng 5 phút cấp 1–12 thiếu: yến mạch (cấp 6), cà rốt (8), xà lách (12) chỉ có 4 frame lớn lên.
- `build-idle-assets.mjs` (dùng `sharp` có sẵn như các script build khác): 7 frame mới mỗi loại `native-levels/<id>/frame-05..11.png` = frame trưởng thành dịch nguyên dải hàng pixel. Ngọn lay ±1/±2 px, rướn 1 px; gốc cố định 25% (cà rốt 42%). Sinh `idle-assets-manifest.json` (pose, nguồn, sha256) và `motion-idle-data.js` (vá `FARM_MOTION` khi tải, sau `motion-care-data.js`, chỉ áp một lần). Clip idle 8 bước, 2,2 giây, lặp; clip hành động 6 bước, 0,94 giây.
- Renderer: cây chín ở luống đang chọn phát clip hành động định kỳ (3,4 giây; trong bước gặt của hướng dẫn là 1,5 giây). Cây không có clip vẫn dùng kiểu rung pixel cũ trong hướng dẫn. Giảm chuyển động: cây đứng yên ở frame trưởng thành.
- Sửa lỗi tiềm ẩn có từ trước: nhánh `qaActor` trong renderer gọi biến `allowMissing` không tồn tại (chưa trang nào dùng nhánh này).
- Kiểm chứng: 156/156 test (thêm `idle-assets.test.mjs`: gốc không dịch, không thêm màu so với frame gốc, đúng kích thước/pivot, clip đúng art-bible, vá runtime chỉ áp một lần). `motion-review.html`: idle yến mạch chạy qua 5 frame khác nhau. Phiên thử cấp 12: gieo đủ ba loại, tua 6 giờ, hiển thị bình thường, không lỗi console. Chuyển động lệch 1–2 px, chưa quay video để so trên điện thoại thật.

## V24.9.6 — Phase 2 chuẩn bị: playtest 5 người + ghi sự kiện ẩn danh
- `docs/playtest-plan.md` (BẢN NHÁP, có mục [CẦN QUYẾT]): cổng duyệt ≥ 4/5, chọn người, hai cách đưa bản thử (ngồi cùng/LAN hoặc đăng link: cần chủ dự án duyệt nơi đăng), kịch bản đọc nguyên văn, quy tắc 60 giây / 2 phút, 5 câu phỏng vấn, cách xuất nhật ký, cách tổng hợp. `docs/playtest-observation.csv`: bảng quan sát theo từng bước hướng dẫn.
- `garden-playtest.mjs`: chỉ bật với `?playtest=1` trên vườn local; luôn hiện nhãn "● Đang ghi thử nghiệm ẩn danh". Ghi: phiên, ẩn/hiện, bước hướng dẫn, bỏ qua, thao tác, bị chặn, lỗi, loại chạm, bảng mở, lên cấp, nhận quà, thông báo (≤ 60 ký tự). Chỉ giữ giá trị số/boolean/chuỗi ngắn; không tên, tài khoản, chữ gõ, IP, user agent. Thời gian tương đối, ngày không kèm giờ, mã phiên ngẫu nhiên. Lưu trong trình duyệt tối đa 3.000 sự kiện; xuất bằng Cài đặt → Khác → "Xuất nhật ký thử". Không gửi đi đâu.
- `playtest-summary.mjs`: `node playtest-summary.mjs nguoi-*.json` → bảng mỗi phiên (thời lượng, gieo/gặt đầu, bước cuối, xong/bỏ qua, chặn, lỗi, khoảng lặng lâu nhất kèm bước, cấp) + dòng cổng dữ liệu. Khoảng lặng không tính lúc tab ẩn hoặc sau khi dừng chơi.
- Kiểm chứng: 159/159 test (thêm `playtest.test.mjs`: tắt hẳn khi thiếu cờ, không lọt object/chữ dài, tóm tắt đúng). Browser (origin `localhost` để có bộ nhớ riêng, không xoá bản lưu thử nào): nhãn hiện; nhật ký đúng thứ tự; tóm tắt trong trang khớp; nút xuất tạo `hagrid-playtest-<mã>.json` (đã chặn tải về thật khi QA). Trang thường và bản nhúng không bật bộ ghi. Nút "Bỏ qua" giờ nở sang trái, không bị cắt chữ.

## V24.9.7 — Phase 2 cổng tạm: hoãn playtest người thật, tự kiểm ba phút đầu
- Quyết định chủ dự án (17/10/2026): hoãn playtest 5 người tới trước beta; cổng tạm ghi ở `docs/playtest-plan.md` mục 0.
- `qa-v19/ftue-smoke.mjs`: Playwright + WebKit chơi trọn 6 bước trên 5 cỡ màn (SE 320, iPhone 13 dọc/ngang, iPad mini, desktop). Chạy: `WEBKIT_PATH=$HOME/Library/Caches/ms-playwright/webkit-2365/pw_run.sh node qa-v19/ftue-smoke.mjs` (Playwright đi kèm cần WebKit 2336 nhưng máy chỉ có 2365; không tải thêm gì). Kết quả: 5/5 đạt.
- Lỗi tìm được và đã sửa (chi tiết `docs/ftue-review.md`): Bỏ qua đè Puffskein trên SE (chạm thành bỏ qua); dock che luống/Puffskein ở màn ngang; vùng chạm khách quá nhỏ; lời Hagrid 6–7 px; lời bước gieo sai thao tác; toast che lời Hagrid; nút Gặt/Gieo mờ 1 giây sau mỗi thao tác (lỗi chung cho mọi người chơi); nút Bỏ qua bị cắt.
- Thay đổi chính: `camera.safeArea()` + `camera.frameWorld()` (dùng chung với `focusPlot`, không đổi khung cũ); lời hướng dẫn là bóng thoại HTML `.tutorial-bubble` 13 px bám theo đầu Hagrid (`muteHagridSpeech` tắt bóng vẽ trong cảnh); `.tutorial-compact` trên màn ngang thấp; vùng chạm khách ≥ 44 px trong `pick()`; `run()` làm mới thẻ cây ngay sau thao tác; `drawHagridSpeechBubble` thêm `scale`/`align` (mặc định giữ nguyên hình cũ).
- 159/159 test. Còn chờ: chủ dự án tự chơi trên iPhone thật (bước 3 của cổng tạm).

## V24.9.8 — Phase 3 bắt đầu: rà soát kinh tế + nhiệm vụ cú mới
- `docs/economy-audit.md`: bản đồ 10 loại tài nguyên (kiếm/tiêu). Phát hiện: chơi trên máy gieo miễn phí, nước/phân bón không có chỗ tiêu (luật trừ chỉ có ở backend, nhánh `codex/hagrid-garden-wallet-local-20261013`: 1 nước + 1 hạt mỗi ô); trong game không có nguồn Galleons; 7 loại tài nguyên so với mục tiêu 4; quà không theo cấp. Các việc tiếp theo ghi ở mục 4 (mô phỏng nhịp cấp, nguồn Galleons, gộp tài nguyên, nhịp lễ hội, gộp bảng): chờ duyệt.
- Nhiệm vụ cú cũ: cả 5 xong trong vài giây không cần chơi (đổi thời tiết, xoay đồ, bưu thiếp…), tên không khớp điều kiện, mỗi ngày phát 52 nước, 8 bộ vật liệu, 3 phân bón, 125 điểm lễ hội.
- `garden-quests.mjs` mới (version 25): 3 nhiệm vụ/ngày từ `OWL_QUEST_POOL`, chọn theo cấp và việc đã mở (`setOwlQuestContext` từ game). Gieo N ô / Gặt N cây luôn có (N = 6/9/12 theo cấp), cái thứ ba chọn theo ngày trong Gặt 2 lần / Chế biến 2 mẻ (cấp 6+) / Cho ăn 2 bữa / Thu sản phẩm (có sinh vật). Rương mở ở 3/3: +1 phân bón, +12 nước, +20 điểm lễ hội. Bộ nhiệm vụ cố định trong ngày; bản lưu kiểu cũ trong ngày được thay bằng bộ mới nhưng giữ chuỗi ngày và cờ đã mở rương.
- `mobile-game.mjs` `questAmounts`: đếm theo dữ kiện thật từ state trước/sau (ô được gieo, cây được gặt, +1 lần gặt, số mẻ chế biến, mỗi bữa ăn). Các lệnh ghi cho thao tác miễn phí vẫn còn trong code nhưng không còn khớp nhiệm vụ nào.
- Kiểm chứng: 160/160 test (viết lại 2 test khoá thiết kế cũ, thêm test chọn theo cấp/ngày). Browser phiên thử cấp 12: bộ cũ trong ngày chuyển sang bộ mới, gặt 6 cây → 6/9, thư cú 3 dòng gọn. Test ba phút đầu vẫn đạt 5/5.
