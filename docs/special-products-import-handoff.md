# Hagrid Farm — bàn giao import Sản phẩm đặc biệt

Ngày: 20/10/2026. Đây là bàn giao bộ asset, chưa tích hợp gameplay/cửa hàng và chưa có giá bán được chủ dự án duyệt.

## Nguồn và trạng thái

- Repo nguồn: ~/Downloads/hagrid-farm (symlink tới repo standalone), nhánh main. Baseline đọc khi đóng gói: dd0be8a40aefbed62249f8931a8a351480956679, cache 24.9.54. Hãy kiểm tra HEAD/status mới trước khi sửa vì các phiên khác có thể tiếp tục làm việc.
- Bộ asset được commit ở garden-v05/special-products-assets/. Xác định commit chứa nó bằng Git; không phụ thuộc thư mục artifact của phiên Codex hay ZIP ngoài repo.
- Đọc docs/art-bible.md, docs/core-design.md, docs/economy-audit.md và README.md trước khi import. Giữ nguyên mọi dirty file không thuộc nhiệm vụ, đặc biệt qa-v19/ftue-smoke/report.json đã dirty lúc intake.
- Không sửa bằng tay bản vendored client/public/game/khu-vuon-hagrid trong HPVNN. Nguồn client nằm trong Hagrid Farm; backend/wallet và công cụ sync nằm trong repo HPVNN.

## Bộ asset đã có

Nguồn sự thật của bộ: special-products-assets/manifest.json và specs.json. Có 30 ID sp_*; giữ nguyên ID để client/server/receipt/ownership thống nhất.

- 30 master được manifest chọn, 60 base PNG native, 240 frame idle, 30 spritesheet, thumbnail 2×/3×. masters/variants/ chỉ lưu phiên bản cũ, không tự import chúng.
- Sprite alpha 0/255; mỗi món dùng 3 dải / tối đa 12 màu thuộc palette sprite 24 màu. Kích thước, pivot chân, footprintTiles và durationsMs có trong manifest.
- 22 món có ánh sáng cục bộ; 8 món tĩnh với các frame lặp giống nhau. Đây không phải bộ clip tương tác mở tủ, nở trứng, vuốt ve hoặc nhận thưởng.
- Mỗi món có bookReference (tập/chương) và designAdaptation. Không biến chi tiết bệ đỡ, tỷ lệ thu nhỏ hoặc họa tiết diễn giải thành khẳng định nguyên tác.
- Xem qa/collection-overview.png (có tên), qa/contact-sheet.png (hai góc), README.md, generation-log.json và prompts.json.
- Đã pass export 30/30, palette/alpha/edge/anchor checks và kiểm tra SHA-256 cho 450 output PNG cùng 30 master. Bằng chứng: qa/validation.json và qa/final-integrity.json.
- Chưa có QA trong cảnh game, trên iPhone thật hay production. Browser preview ở phiên tạo bị chặn file:; không xem đó là bằng chứng runtime.

## Công việc Claude cần làm

Hoàn thành import local vào game và cửa hàng với nhóm mang tên chính xác **Sản phẩm đặc biệt**. Giữ sáu món trang trí đang bán và 29 decor tiến trình.

1. Đọc manifest asset cũ (decor-assets-manifest.json/.js), loader, renderer, garden-store-catalog.mjs, garden-store-ui.mjs và decor-runtime/decor-placement-ui trước khi nối. Chuyển schema batch sang schema runtime hiện có: defaultFile → file; defaultFrames → frames; rightFile/rightFrames giữ; pivot.x/y → pivotX/pivotY; durationsMs → durations. Dùng bounds thật của PNG, không phỏng đoán hoặc mirror góc phải.
2. Chỉ đưa native/frame và metadata runtime cần dùng vào thư mục asset hiện hữu hoặc một thư mục runtime có allowlist rõ. Đừng phát hành masters, variants, thumbnails/QA/preview, prompt/log hay tài liệu nghiên cứu. scripts/sync-hagrid-garden.mjs hiện chỉ copy các ASSET_DIRS có sẵn, nên thư mục special-products-assets chưa tự xuất hiện trong bản HPVNN. Ưu tiên dùng tuyến decor-assets hiện hữu nếu phù hợp.
3. Manifest trong iframe HPVNN dùng JS wrapper window.FARM_DECOR_MANIFEST vì opaque sandbox/CSP chặn fetch JSON. Kế thừa tuyến đang chạy; không thêm fetch JSON riêng làm game mất asset.
4. Thêm nhóm Sản phẩm đặc biệt, ảnh xem trước hai góc, tên và mô tả ngắn gắn với truyện. UI mua/sở hữu/đặt/cất/xoay phải nhất quán với nhóm trang trí cũ. Vật phẩm thuần trang trí; không thêm XP, sản lượng, quyền năng, tiền thưởng hoặc cơ chế nhận nuôi.
5. Bản client 24.9.54 đã có đặt tự do qua positions[itemId]=[col,row], còn adapter vẫn phải tương thích bản lưu socket cũ. Không quay lại giới hạn sáu socket cố định. Với đồ lớn 2×2, 3×1, 3×2, kiểm tra toàn bộ footprint và góc xoay, đường đi, thửa/chuồng/công trình/rào và che khuất; chỉ kiểm tra tâm món hoặc khoảng cách một ô là chưa đủ.
6. Đối chiếu backend hiện tại trước khi nối chế độ connected. Các điểm cần kiểm tra: functions/games/garden-wallet-catalog.js, garden-wallet-core.js, garden-action-input.js, garden-action-core.js và test liên quan. Tại snapshot intake, primary HPVNN còn kiểm tra slot 0–5; đừng mặc định đã có positions hoặc whitelist sp_*. Đồng bộ request/schema/catalog/ownership và fixture/emulator theo nguồn hiện hành.
7. Lập bảng giá cao đề xuất dựa trên economy-audit và giá trang trí hiện tại; ghi rõ mức mở cấp nếu cần. Giá chưa được chủ dự án duyệt: vẫn hoàn thành import, bố cục và flow ở local/fixture; không để connected mode trừ ví thật theo giá tự đoán. Đưa bảng giá cụ thể, review được, cho chủ dự án duyệt sau khi phần local đã xong.
8. Mọi logic mua phải do server quyết định, dùng transaction/idempotency/ledger đang có; không để client tự thêm ownership hoặc trừ tiền. Giữ dữ liệu cũ tương thích, không reset save.

## Kiểm tra và ranh giới

- Hagrid Farm: node --test *.test.mjs trong garden-v05/; thêm kiểm tra có ích cho asset/catalog/placement mới, không chỉ test lại dữ liệu khai báo.
- Backend nếu sửa: theo AGENTS.md + skill/domain liên quan trong HPVNN; dùng linked worktree và baseline/isolation gates, xác định đúng emulator trước test. Kiểm tra catalog parity, mua một lần, level/giá, thiếu tiền, replay/two-tab, ownership, persistence vị trí/hướng và invalid input.
- Kiểm tra ảnh trong cảnh thật ở 375px, desktop, hai góc, ngày/chiều/đêm và bốn thời tiết; vật không lơ lửng/trượt chân, không chắn vùng chơi và vẫn nhận ra ở zoom nhỏ. Giảm chuyển động dùng frame tĩnh.
- Giữ server standalone 62795 nếu đang chạy; không dừng/đổi nó để làm Git. HPVNN chỉ dùng runtime 3026 theo launcher/repo contract; không tạo thêm Next.js runtime. Không đọc/ghi tài khoản, ví hoặc dữ liệu production để QA.
- Ghi rõ thay đổi, bằng chứng và phần chưa kiểm được. Commit local có phạm vi sau khi kiểm tra đạt; không gom dirty file khác. Không push, deploy hoặc bật bán production trong nhiệm vụ import local này.
