V19 — Rừng Cấm tự nhiên và lối ra khỏi rừng, 2026-10-14
Agent: Antigravity (Google DeepMind), desktop app. Continues V18/paused V19 in garden-v05.
Scenery only: Forbidden Forest tree placement uses organic multi-scale clusters
(oak/pine 0.5x–2.25x, grove/log 0.65x–1.35x, deterministic seed + horizontal flips)
with a minimum 60px trunk spacing and 27% cool/dark forest ground shade.
A curved dirt exit trail leads from the active gate (all 6 stages) through the
western forest with canopy clearance and a "← Lối ra" signpost on the outer shoulder.
Fixed repeating wallpaper road by splitting --scenic-ground into a non-repeating
western trail continuation tile and a repeating road-free forest wallpaper tile.
Tapered SCENIC_HILLS ends with smooth bell-and-swell envelopes and tile-wrapped
dark moss patches; clipped farm meadow to active stageBoundary so stages 1–5 have
dark Forbidden Forest ground and natural multi-scale trees up to the active fence.
Synchronous WebP data-URL fallback eliminates the blank green flash before toBlob.
Verification: 85/85 tests; syntax checks; browser verified 320x720, 390x844,
667x375, 1280x720 at levels 1 and 100 with zero console/network errors.
Preview: http://127.0.0.1:62795/qa-v19/ui-fixture.html?wallet=emulator&qa=1&level=100
Evidence, protected hashes, patch and before-files: ../qa-v19/.
Manifest: ../garden-v19-manifest.json. Camera, engine, economy, state/layout
schemas, account adapter, original artwork and V16 trays retain their V18 hashes.
Main snapshot tab untouched; main-account recovery remains BLOCKED.
No purchase/reset/reseed, server/emulator restart, production action, push or
deployment. Artifact outside Git; no repository commit. Source-only delivery;
V14 ZIP remains the previous package and does not include V18/V19.

V18 — Khung toàn vườn và bìa Rừng Cấm, 2026-10-14
Agent: Codex (OpenAI), desktop app. Continues V17 source in garden-v05.
Camera defaults to the complete active fenced garden, using visible HUD/dock
bounds. Zoom-out stops at that fit; manual zoom-in remains available. Selection
keeps overview, Home restores it, and dock/viewport resize reframes the scene.
Short landscape opens with the action tray collapsed to retain usable height.
Scenery: four broad layered ridges replace the eight isolated mounds; dense,
scaled oak/pine canopies use the existing immutable sprites and cool cached tint.
Perimeter rectangles stay outside the full farm/greenhouse reservations. Wrapped
forest wallpaper and matching edge sprites continue beyond the world canvas.
Active meadow receives a slight cool shade; gameplay sprites remain readable.
Verification: 82/82 tests; camera regression failed on V17 and passes V18;
syntax checks; deterministic forest/ridge and exclusion probes. Browser verified
320x720,390x844,667x375,1280x720, levels1/100, zoom floor/+ and Home. No errors
in direct preview tabs. UI fixture uses synthetic data, never account writes.
Preview: http://127.0.0.1:62795/qa-v18/ui-fixture.html?wallet=emulator&qa=1&level=100
Evidence, protected hashes, patch and before-files: ../qa-v18/.
Manifest: ../garden-v18-manifest.json. Engine, economy, state/layout schemas,
account adapter, approved source artwork and V16 trays retain their hashes.
Main snapshot tab untouched; main-account recovery remains BLOCKED.
No purchase/reset/reseed, server/emulator restart, production action, push or
 deployment. Artifact outside Git; no repository commit. Source-only delivery;
V14 ZIP remains the previous package and does not include V18.

V17 — Cỏ liên tục và đồi quanh vườn, 2026-10-14
Agent: Codex (OpenAI), desktop app. Continues V16 source in garden-v05.
Scenery only: approved grass pixels now cover the complete ground and continue
past canvas edges with camera pan/zoom. Eight raised grassy hills have lit crowns,
shaded slopes and mossy rock outcrops. Existing forest sprites are kept whole and
thinned near the hill crowns; trees stay separate from the repeating ground.
Backdrop/terrain are cached; a page-owned Blob URL avoids large CSS data-URI limits.
Farm and greenhouse exclusion masks preserve all fixed gameplay footprints.
Engine, save/layout data, prices, account adapter, original artwork, camera and
V16 tray sources retain their recorded hashes. No data mutation or new assets.
Verification: 81/81 tests, syntax checks, deterministic hill/mask/immutable-map
probe; browser levels1/100, first-plot/overview, native zoom/pan, 320x720,
390x844,667x375,1280x720: backdrop present, no page overflow, dock inside viewport.
Direct level1 scene has no console errors. Iframe automation emitted a
MutationObserver error absent from app source; see browser-evidence.json.
Preview (synthetic read-only, consuming canonical V17 scene source):
http://127.0.0.1:62795/qa-v17/ui-fixture.html?wallet=emulator&qa=1&level=100
Evidence, patch, protected hashes and before-files: ../qa-v17/.
Manifest: ../garden-v17-manifest.json. Main snapshot tab untouched; main-account
recovery remains BLOCKED. No purchase/reset/reseed, server/emulator restart,
production change, push or deploy. Artifact outside Git; no repository commit.
V14 ZIP remains unchanged and does not contain V17; current delivery is source.

V16 — Khay ngang Nuôi, Chế biến và Xây, 2026-10-14
Agent: Codex (OpenAI), desktop app. Continues accepted V15 in garden-v05.
Three matching 48px horizontal item trays, selected-name captions, fixed actions,
mouse wheel/native horizontal scroll and keyboard selection. Selection never
adopts/crafts/builds. Creature care and full craft/build lists remain under ⋯.
Craft batches 1/3/10; timed recipes stay at one. Missing resources, prerequisites,
built/queued jobs and connection readiness gate the action. Ready jobs require
an explicit claim. Engine, prices, backend, original art and save schema unchanged.
Verification: 81/81 tests; syntax checks; browser fixtures 320x720,390x844,
667x375,1280x720 with no page overflow and selected card visible. Collapsed 52px.
In-memory-only adoption/feed/claim, craft batches/timed jobs, build/claim,
missing resources and level1 empty state passed. No console errors observed.
Evidence, patch and before-files: ../qa-v16/; manifest: ../garden-v16-manifest.json.
Preview (synthetic, no account writes):
http://127.0.0.1:62795/qa-v16/ui-fixture.html?wallet=emulator&qa=1&level=100
Main snapshot tab untouched. Main-account recovery remains BLOCKED, not solved
by QA. No account purchases/reset, emulator lifecycle changes, push or deployment.
Source is an artifact outside Git; no repository commit. V14 ZIP remains the
previous package, unchanged; V16 source is not packaged in that ZIP.
Antigravity hpvnn-ui-designer unavailable; design integration completed by lead.

V15 — Chọn hạt bằng khay cuộn ngang, 2026-10-14
Agent: Codex (OpenAI), desktop app. Continue approved V14 artifact.
Reuses existing seed tray for direct crop selection with 48px artwork cards,
seed counts and selected name/supplies caption. Native horizontal scrolling,
mouse wheel and keyboard selection; direction and Sow remain fixed beside it.
Creature selector, original assets, game engine, economy and backend unchanged.
74/74 tests pass. Read-only fixtures verified 320x720,390x844,667x375,1280x720,
level1 locks, last crop, one selected item, wheel/keyboard, direction and collapse.
Fresh preview console has no errors; independent Luna review found no blocker.
Evidence/fixture: ../qa-v15/. Before-files preserved in ../qa-v15/before-v15/.
QA account already had full plots/970G when opened; no transactions or resets
performed. Main tab untouched; main-account recovery remains BLOCKED.
Preview (in-memory, writes disabled):
http://127.0.0.1:62795/qa-v15/ui-fixture.html?wallet=emulator&qa=1&level=100
Live UI stays in garden-v05. No server/emulator restart, push or deployment.
Artifact outside Git; no repository commit. V14 ZIP retained unchanged;
it is the previous release package, not a package of these V15 source changes.

V14 — Nhà kính đúng phối cảnh, 2026-10-14
Glass roof with pane ribs and reflected sky, plants visible behind glass walls.
Ground edges use the garden 2:1 axes; vertical posts and projected glass door.
North fence reroutes behind the greenhouse; front entrance is unobstructed.
Only scenery, fence presentation, cache URLs and one expected fence count changed.
Verification: 74/74 tests, browser QA100 (1140G unchanged), level1 preview,
no console errors; screenshots and test log in ../qa-v14/.
Original main tab retained without reload/data actions. Main recovery below
remains BLOCKED. No backend change, deployment, or repository commit.
Continue with ../CONTINUE-PROMPT-v14.txt and the existing assets, not a restart.

V13 — Không gian khu vườn lớn dần, 2026-10-14
Agent: Codex (OpenAI), desktop app. Local artifact implementation.
Six spatial chapters: 1 Sân nhỏ bên lều; 10 Khoảng sân sinh vật;
24 Vườn thảo dược; 48 Trang trại bìa rừng; 72 Miền sinh vật kỳ thú;
100 Đại khu vườn Hagrid. Starter land is 255/1026 (~25%) final area.
Terrain, paths and fence follow the frontier; unopened ground stays forest.
Stepped chapter 4/5 boundaries keep the final plot wing closed until 100.
Plot/pen ghosts appear at their existing unlock levels; actual building,
prices, saves, XP and server authority remain unchanged. Stage growth does
not grant free buildings. Existing moved buildings and owned decor promote
the frontier to remain visible. Keepsakes follow the open southern aisle.
New layout/decor UI offers sockets within the open frontier (presentation
constraint only, not a new server authorization rule). Initial hut/first-plot
framing retained; Home and later stage transitions frame the current frontier.
Roadmap/Build include six-stage details. Render cache is replaced per stage.
Read-only preview: growth-preview.html (six buttons + same-scale comparison).
Preview fixtures build eligible expansions only in memory, without storage,
auth or emulator mutations. Original main tab was never reloaded or changed.
Verification: 74/74 tests; every level1..100 buildable footprint fits;
monotone land area, final wing exclusion until100, legacy layout/keepsakes,
joined fences/one gate, hidden early ghosts and unchanged picking verified.
Browser: all6 chapters; same-scale comparison; connected QA100 at1140G,
roadmap; overview390x844,667x375,390x300; preview320px iframe no overflow.
Evidence ../qa-v13/{browser-evidence.json,tests.log,stage-*.png,viewport.html}.
Native screenshot clipping produced an imperfect portrait harness capture;
use stage-*.png and connected-*.png for visual review. DOM measurements are
recorded separately. Two bounded Luna reviews used; lead reviewed/integrated.
Source snapshot /private/tmp/garden-before-v13; artifact outside Git, no commit.
No backend/service/data changes or deployment. Original main-account recovery
is STILL BLOCKED as documented below; this UI work does not resolve it.

V12 — HUD và thao tác chơi gọn hơn, 2026-10-14
Agent: Codex (OpenAI). Local artifact UI only.
Plant dock at 390x844 reduced from 155px to 114px; collapsed 52px.
Selected crop/creature chips open existing panels; direction and main action
share one row. Unowned creatures retain a selection action in their panel.
Hide empty inventory badge from first paint; 44px tool/camera targets.
Browser checks: 320x720,390x844,667x375,390x300,1280x720; crop selection,
direction, collapse/expand, supply shortcut and creature selection passed.
67/67 automated tests pass. Read-only Luna diff review findings repaired.
No purchases, adoption, sowing or service/data changes during this slice.
Evidence: ../qa-v12/. Original main garden tab remains untouched; original
main-account recovery is STILL BLOCKED as documented below. No deployment.
Artifact is outside Git; no repository commit for this UI slice.

V11 — UI cửa hàng gọn hơn, 2026-10-14
Agent: Codex (OpenAI), desktop app. Task: tiếp tục chỉnh UI của prototype.
Cửa hàng dùng header/ví/bộ lọc cố định và danh mục cuộn riêng; desktop3cột,
điện thoại2cột, khung ngang thấp thu gọn thẻ để thấy nút. Nút mua và đồ sở
hữu khác kiểu; thẻ hiển thị nơi đặt/đang cất, đặt lại miễn phí. Đổi bộ lọc
giữ focus; Escape trả focus về cửa hàng. Bảng đặt đồ chọn sẵn vị trí hiện
tại; nút zoom/home44x44. Không đổi giá, vật phẩm, tài khoản, backend hoặc ảnh.
Files: garden-store-ui.mjs,decor-placement-ui.mjs,wizard-ui.css,index.html,
mobile-game.mjs (cache imports only). Tests67/67. IAB QA320x720,390x844,
667x375 through fixed-size iframe; desktop1280x720. No horizontal/card
text overflow observed;44px action buttons; selected location/noop state;
keyboard filter Tab/Escape passed. No purchases/data writes this turn.
Evidence: ../qa-v11/{browser-evidence.json,tests.log,store-390.png,
store-667.png,store-desktop.png,viewport.html}. Source before-copy retained
at/private/tmp/garden-before-v11. External artifact is not Git-managed;
no repository source edits/commit/push/deployment. Main retained tab1 was
not reloaded or closed; prior main-member recovery blocker remains below.

V10 STATUS — feature QA passed; main-member recovery remains blocked, 2026-10-13 23:50 +07
New UI and seven native raster assets are implemented; 67 artifact tests pass.
Backend source remains uncommitted in hagrid-garden-wallet-local-20261013.
Baseline reconciliation merge1faf6d762; production baselinea11844f99; root81ef clean.
During runtime refresh the old launcher stopped standalone PID79031 without
an existing export; its in-memory Auth/Firestore state became unavailable.
Main IAB tab1 retains the old client snapshot. DO NOT reload or close it.
No main-member reseed or inferred reconstruction was performed. Main Auth,
profile/account/state/daily documents remain absent. All three callables reject
that member with not-registered before creating state. UI evidence records
wallet200210+bank4822=205032G,level6,XP1084,seeds21,water33,boost1 and crops.
These observations are partial, not a complete recovery; timestamps, IDs and
ledger/lifetime/operation history have no verified recovery source. Existing
browser tools cannot export the complete retained JS snapshot; native app
control was refused. No manual user action is being assumed complete.
A separate QA-only emulator is running at5001/8080/9099, PID53410. The repaired
launcher uses export-on-exit, imports only verified exports, and exports before
standalone stop. Current Auth/Firestore export was verified without stopping.
Only QA and integration Auth users exist; main member is absent.
Independent QA passed: Functions481+1skip; scenario1048 1/1; scoped integration;
4 launcher tests. Browser bought pumpkin80G and arch600G, tested placement,
reload persistence, stash/re-place free and occupied-slot blocking. Final QA
bank1320G, exactly2 ledger rows, placements[pumpkin,null,null,null,null,arch].
Screenshot/DOM evidence is1280x720; no fresh390px proof in this final run because
the viewport override did not affect the QA tab. Browser error log empty.
No push/deploy. Feature can be reviewed in the separate QA tab; overall task
cannot be called fully recovered while the original member state is missing.
Evidence: ../qa-v10/. Historical packages remain preserved.

V10 — Góc vườn phù thủy và cửa hàng trang trí, 2026-10-13
Bản local: HUD gọn, chạm cây để chăm/gặt theo hàng, thư cú theo trạng thái
vườn, người giữ vườn, nhà kính và chạm thú để chọn/vuốt ve. Thư/chăm/vuốt
ve không cộng XP, không thay đồng hồ hay kinh tế cây/thú.
Sáu món trang trí: đèn bí ngô80G/cấp1, giá chổi120G/cấp3, vạc180G/cấp6,
chậu Mandrake240G/cấp10, nến lơ lửng360G/cấp16, vòm dây leo600G/cấp24.
Giá đề xuất cho emulator; mua một lần, đặt/di chuyển/cất miễn phí tại sáu
vị trí ngoài thửa/chuồng. Sở hữu và vị trí do máy chủ lưu; không dùng XP.
Tranh mới có master riêng, sprite native RGBA/palette24/binary alpha,
manifest/pivot và bảng kiểm ở decor-assets/. Giữ nguyên tất cả ảnh cũ.
Trang mặc định ?wallet=emulator dùng garden-demo-member; kiểm thử UI dùng
?wallet=emulator&qa=1&decorQA=1 với garden-decor-browser-qa, tách dữ liệu.
Chỉ local/emulator, chưa tích hợp route HPVN hoặc deploy production.

V09 — Larger and closer plots (local)
Current package: hagrid-garden-bigger-plots-v09.zip.
Plot cells are25% wider/taller; each plot still contains9 logical cells.
Gaps shrink from4 to2.75 logical units. All picking, soil, frame and crop
positions follow the same geometry. Paths and decorations fit the new aisles.
Plant button explains blockers or opens the needed supply category; purchases
are manual. Existing emulator garden progress is preserved. See HANDOFF.txt
and qa-v09/tests.log (62 pass). No backend/economy/raster change or deployment.
Older version notes are historical context.

V08.1 — Pixel lawn, compact dock, aligned plot frame (local)
Current package: hagrid-garden-pixel-dock-v08.zip.
Uses the approved grass texture without repeated diamond borders; original
raster art remains unchanged. Safe flower clumps use existing Daisy/Clover.
Unified compact bottom dock, 56px item artwork, native action-options dialog,
pixel trim on the player and dock. Plot frame/soil/picking align correctly.
See HANDOFF.txt, qa-v08/tests.log and browser-checks.json for exact limits.
The following older version notes are preserved as historical context.

V07 — Pixel paths and fenced garden (local preview)
Current package: hagrid-garden-landscape-v07.zip.
Narrow paths from the house, continuous wooden perimeter, expanded scenic
meadow with small foliage. Only fixed slots inside the fence are usable.
All earlier house/lawn/camera fixes are included. No new backend or raster
art changes; see HANDOFF.txt and qa-v06/landscape-tests.log (56 tests).
The following V06/V05.5 notes are retained as historical integration context.

KHU VƯỜN HAGRID — V06 FOREST — LOCAL / EMULATOR ONLY

MỞ BẢN CHƠI
- Ví Gringotts trên emulator riêng:
  http://127.0.0.1:62795/garden-v05/index.html?wallet=emulator
- Bản mẫu ngoại tuyến, giữ bản lưu v05 cũ:
  http://127.0.0.1:62795/garden-v05/index.html
- Phiên QA/cấp thử dùng ?qa=1&lab=1, tách khỏi hai phiên trên.
Không kết nối tài khoản hoặc số dư production; không deploy.

THAY ĐỔI V06
- Khu rừng pixel bao quanh phần đất chơi: sồi già, thông, cụm cây cong,
  gỗ mục/rêu. Khu đất, ô trồng, chuồng và trạng thái v05.5 được giữ nguyên.
- Forest raster mới sinh bằng image_gen built-in; source và prompt lưu ở
  masters-forest/, export/pivot/hash trong forest-assets.json.
- Chỉ thay phần trình bày local; backend vẫn commit 94f78f0cc.
- Hagrid CHƯA được thêm: công cụ tạo ảnh từ chối yêu cầu. Không thay bằng
  nhân vật khác. Cần artwork do người dùng cung cấp để tích hợp tiếp.

THAY ĐỔI V05.5
- Chơi được dọc và ngang; khay thao tác dọc có thể thu gọn. Avatar, tên,
  cấp và thanh XP nằm trong HUD; fullscreen không ép xoay máy.
- Chỉ hiện cây, sinh vật, công thức, công trình và trang trí đã mở.
  Bảng hành trình vẫn cho xem kế hoạch 100 cấp. Lên cấp có hộp thông báo
  liệt kê từng nội dung vừa mở; phải đóng để tiếp tục.
- Mooncalf, Kneazle, Diricawl, Fwooper, Thestral và Kỳ lân có sprite
  trưởng thành neutral/blink/eat/care riêng. Idle lặp chậm; ăn/chăm sóc
  là phản ứng hữu hạn khi bấm thao tác, không nhai suốt bữa 6 giờ.
- 18 cây mới có lá rung theo pixel, gốc giữ cố định; chăm/tưới có phản ứng
  hữu hạn. Sinh vật non giữ đúng hình theo tuổi với hiệu ứng chăm/cho ăn.
  Giảm chuyển động của hệ điều hành được tôn trọng.
- Nút Chăm/Vuốt ve là tương tác thư giãn, không cộng XP hoặc rút thời gian.

VÍ VÀ CỬA HÀNG — BẢN NỐI EMULATOR
Backend dùng galleons_accounts và galleons_ledger cùng postEntry hiện có
của HPVN; trừ bankBalance trước balance, reasonCode store_purchase.
Các tài khoản demo thuộc project demo-hpvnn-garden, không phải ví thật.
Mỗi ô gieo tiêu 1 hạt + 1 phần nước; Gieo lại cũng phải trả đủ vật tư.
Mua không cho XP. Giá, mở khóa, tiến độ, thời gian, vật tư, hạn mức và
requestId được máy chủ kiểm tra trong giao dịch nguyên tử.

Giá thử nghiệm:
- Hạt: gói 3 hạt, max(2, ceil(cấp/5)) G, 12 gói/ngày/loại.
- Nước: 9 phần/gói, 5 G, 24 gói/ngày.
- Thức ăn: đủ một bữa/gói, max(10, ceil(cấp×1.5)) G,
  2 gói/ngày/loài. Vẫn chế biến được từ sản vật.
- Phân bón: mở cấp 6, 60 G, 2 gói/ngày. Mỗi gói bón một hàng/cột/chéo
  ba cây đang lớn; rút 10% thời gian gốc, chỉ một lần mỗi cây.
Hạn mức theo ngày Việt Nam, đặt lại lúc 00:00. Giới hạn nằm trên máy chủ;
UI chỉ hiển thị vật tư đã mở và số gói còn mua được.
Đây là giá/cap local để duyệt, chưa chứng minh cân bằng nhiều tháng.

GAMEPLAY GIỮ TỪ V05
100 cấp; 24 cây, 12 sinh vật, 29 công thức, 29 mẫu trang trí.
Khởi đầu 3 thửa 3×3; mỗi thửa tối đa 3 loại cây. Gieo trọn hàng 3 ô.
Nhổ không hoàn hạt hoặc nhận XP; đất chờ tới thời điểm chín cũ.
Bữa ăn 6 giờ; cho ăn rồi nhận mới tiến triển. Không tự tiêu thức ăn khi vắng.
Chế biến, xây, trang trí, kỷ vật không nhận XP. Xây theo thứ tự và nhận
công trình khi xong mới tăng sức chứa; tối đa 12 thửa và 12 con.
Cấp 10 mở chuồng/Puffskein; Chó ba đầu cấp 90; Rồng cấp 94.
Đổi bố trí giữ cây, bữa ăn, cooldown và tiến độ theo công trình.
Nguồn cân bằng: https://chatgpt.com/space/page_3ff847da2c7881918013c38cbd64ba10

LƯU VÀ PHÂN TÁCH
Ngoại tuyến dùng LocalStorage hagrid-garden-v05-play/-lab; ?qa=1 thêm -qa.
Bản mẫu này vẫn có hạt miễn phí để kiểm tra và đồng hồ tua chỉ trong lab.
Ví emulator dùng trạng thái máy chủ; không nhập bản lưu local, không nhận
level/XP/offsetMs từ máy khách và không cung cấp nút tua thời gian.
UID trình diễn: garden-demo-member; UID kiểm thử backend riêng:
garden-integration-member. Token fixture chỉ dùng local, không phải đăng nhập
HPVN thật. Avatar/tên của phiên nối ví đọc từ hồ sơ emulator.

HÌNH ẢNH / NGUỒN
Giữ nguyên toàn bộ 300 file master/native/environment được baseline audit.
24 frame care mới trong native-care/; hai atlas ImageGen trong masters-care/.
Motion định nghĩa ở motion-care-data.js; exporter build-care-assets.mjs.
Audit qa-care/verify_care_assets.py xác nhận palette/alpha/pivot/biên/hash;
không sửa master cũ. Cây dùng chuyển động Canvas trên sprite hiện có.
Không có nhân vật Hagrid. Trang trí vẫn là hình procedural Canvas.

KIỂM CHỨNG
52 tests artifact PASS (engine, progression, animation, layout, thử lại giao dịch).
Audit 24 frame care PASS, 0 lỗi/cảnh báo, 300 file cũ giữ nguyên hash.
IAB đã chạy 18 cây mới × 3 ô, chăm và thu hoạch 54 cây;
6 sinh vật mới tới trưởng thành, cho ăn/chăm và tải lại;
hộp lên cấp, hồ sơ local, menu ẩn khóa, khay dọc thu gọn.
Bố cục 390×844 và 667×375 có ảnh kiểm chứng; thêm 320px/844px/1280px
được kiểm tra DOM. Không sử dụng Chrome cá nhân.
Kết quả emulator và commit backend cuối cùng nằm trong HANDOFF.txt.
Chưa kiểm chứng điện thoại thật, chơi dài hạn, tải lớn hoặc production.

KHỞI ĐỘNG BACKEND
Worktree và lệnh cụ thể xem HANDOFF.txt. Backend cần Node 24, JDK 21,
Firebase CLI và functions/node_modules riêng của worktree.
Launcher sinh entry riêng chỉ export ba callable của vườn, không tải
production index hoặc trigger mirror BigQuery. Cổng Firebase chuẩn:
Functions 5001, Firestore 8080, Auth 9099. HTTP 62795 chỉ phục vụ artifact
HTML/Canvas, không phải một Next.js runtime thứ hai.
