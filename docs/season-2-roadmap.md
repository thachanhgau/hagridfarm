# Khu Vườn Hagrid Mùa 2 — «Tài năng sinh vật» (26.0)

> 13/11/2026 · Claude Code (Anthropic) · Phần 0 (spec). Nhánh `season-2` từ `hud-fit-20261113` 982f3eb (bản đang lên production).
> Chủ dự án 13/11/2026: «nâng hagrid farm lên season 2 … kỹ năng đặc biệt của thú nuôi … support khu vườn», «mọi thú đều giúp», «đổi năng lực của thuỷ quái xịn hơn».

## 1. Đích

Mỗi loài trong 18 loài của vườn có một kỹ năng giúp vườn. Nuôi thêm loài mới là thêm người giúp. Kỹ năng dựng trên các hệ đã có (gắn bó, trò, tâm trạng, trách nhiệm, hồ, luân canh, thời tiết, lửa), không thêm chỗ cày mới.

## 2. Luật chung

| Luật | Nội dung |
|---|---|
| Ai giúp | **Mọi thú** đã đón (chủ dự án chọn 13/11), không có ô hay đội trực |
| Bậc 1 | Thú trưởng thành **và** gắn bó cấp 3 «Thân thiết» (`garden-keeper-core` BOND_LEVELS) |
| Bậc 2 | Gắn bó cấp 5 **và** thuộc đủ 3 trò (`lessons` = 9, `garden-mood-core`); 3 trò hết là đồ trang trí |
| Chỉ giúp khi vui | Tâm trạng ≥ 50 (`LOW_MOOD`), không ốm, không ở Rừng Cấm, không đang đi dạo |
| Lượt | Chủ động: lượt theo ngày giờ VN, lưu trong `garden.skills` = { dayKey, used: { [species]: n } }. Thụ động: tự chạy |
| Lệnh | Một lệnh mới `skill` { species, target? } trong `GARDEN_ACTIONS` + `DAILY_ACTIONS`; kỹ năng thụ động chạy trong lượt server sẵn có (duty, pond, soil, fire, mood) |

## 3. Bảng kỹ năng

Chủ động = bấm, có lượt/ngày (bậc 1 / bậc 2). Thụ động = tự chạy.

| Loài (cấp) | Kỹ năng | Loại | Bậc 1 / Bậc 2 | Gắn vào |
|---|---|---|---|---|
| Quái lùng nhùng (10) | **Ăn vụn nhả hạt:** gặt một thửa, hoàn 1 hạt của cây vừa gặt (hạt giá ≤ 25 G) | chủ động | 1 / 2 | harvest |
| Que Xạo (18) | **Tỉa cành:** 1 thửa đang lớn bớt 15 phút (bằng một lần «Chăm giúp») | chủ động | 1 / 2 | plots |
| Đào mỏ (26) | **Đào kho báu:** đào thửa trống: 3–8 Nước, 10 % một hạt đã mở; 2 % một Nước phép (tối đa 1 lọ/tuần). Không Galleons, không sản vật bán chợ | chủ động | 1 / 2 | supplies |
| Mooncalf (34) | **Phân trăng:** 18:00–06:00, 1 thửa bớt 30 phút | chủ động | 1 / 2 | plots |
| Kneazle (42) | **Mắt tinh:** bản đồ đánh dấu thửa chín, bữa xong, cây sắp héo, thú sắp ốm | thụ động | luôn bật / thêm danh sách «việc cần làm» | chỉ client |
| Diricawl (50) | **Biến – hiện:** tự gặt 1 thửa đã chín ≥ 2 giờ khi chủ vắng (chặn héo; không gieo lại) | thụ động | 1 / 2 thửa | duty shift |
| Fwooper (58) | **Hát ru:** mọi thú trong chuồng +8 tâm trạng | chủ động | 1 lần +8 / 1 lần +12 | mood |
| Bằng-Mã (66) | **Chở nước:** +10 Nước | chủ động | 1 / 2 | supplies |
| Vong mã (74) | **Dẫn đường:** thú ở Rừng Cấm chỉ cần 1 bữa dụ và về ngay | thụ động | 1 con / mọi con | duty `fled` |
| Kỳ lân (82) | **Chữa lành:** chữa miễn phí 1 con ốm; dưới cấp 130 thành +15 tâm trạng 1 con | chủ động | 1 / 1 + 15 tâm trạng | duty cure |
| Chó ba đầu (90) | **Canh đêm:** 22:00–06:00 ma lùm không ăn cây | thụ động | luôn bật / thêm đuổi 1 con/ngày | duty gnome |
| Rồng (94) | **Thiêu cỏ:** dọn ngay thửa khô hoặc thửa bị ma lùm phá; rồng đói thêm 12 giờ mới gây cháy | chủ động | 2 / 4 thửa | duty, fire |
| Chó đuôi nĩa (140) | **Ăn ma lùm:** đuổi ma lùm đúng lúc nó định cắn | thụ động | 1 / 3 con | duty gnome |
| Thủy quái (150) | **Chúa tể đáy hồ** (xem 3.1) | thụ động + chủ động | | pond |
| Nhím quậy (180) | **Xới đất:** 1 thửa hết «đất mỏi» luân canh | chủ động | 1 / 2 | soil |
| Kỳ nhông lửa (220) | **Ở trong lửa:** khi vườn cháy thật, giữ được N thửa; tuần sương giá N thửa cây 8 giờ không chậm | thụ động | 2 / 4 thửa | fire, soil |
| Ma da (240) | **Dẫn nước:** tuần hạn hán cây 3 giờ tốn 1 nước/ô; Ruộng nước gieo không tốn nước | thụ động | hạn hán / + Ruộng nước | soil, pond |
| Ngựa lùn (280) | **Gác bãi chăn:** Bằng-Mã, Vong mã, Kỳ lân không xuống dưới 50 tâm trạng | thụ động | 50 / 60 | mood |

### 3.1 Thủy quái «Chúa tể đáy hồ» (chủ dự án: «xịn hơn»)

Theo sách: thủy quái sống trong rong đáy hồ, ngón tay dài bóp rất chặt.

- **Bậc 1:** hồ **không bao giờ đục** (`MURKY_AFTER` bỏ qua khi thủy quái giúp); lô cá chín được thủy quái **tự kéo lưới** vào kho, kể cả khi chủ vắng.
- **Bậc 2, thêm:** «Ngón tay dài»: lượt «Câu cá» trong ngày có vùng trúng rộng gấp đôi (`zoneHalf` 0,12 → 0,24, `sweetHalf` 0,035 → 0,07); mỗi ngày tự bắt thêm 1 cá con (chép) thả vào lô trống.
- Giữ nguyên: 1 lượt câu/ngày, trần giải 1 cá vàng/ngày, tỉ lệ Đèn bí ngô 4 %. Cá không cho XP (chỉ tính khi thú ăn).

## 4. Số liệu Phần 0

### 4.1 Nhịp cấp 500

Mô phỏng `docs/level-500-sim/runSkills.mjs` (+ `sim-skills.patch`, áp sau `sim-hooks`, `sim-pond`, `sim-creatures`, `sim-edge`), cùng tham số `$B` như README. Kỹ năng Que Xạo và Mooncalf (các kỹ năng duy nhất rút thời gian cây) bật từ lúc thú trưởng thành, bậc 2 sau 9 ngày; mỗi lượt dồn vào ô chín ngay, rồi gặt.

| Cách chơi | Không kỹ năng: cấp 100 / 300 / 500 | Có kỹ năng | Lượt dùng được |
|---|---|---|---|
| 2 lượt/ngày (08, 21) | ngày 51 / 128 / 196 | ngày 51 / 128 / 196 | 0 (cây đều chín trước lượt sau) |
| 3 lượt/ngày (08, 13, 21) | 36 / 94 / 148 | 36 / 94 / 148 | 0 |
| Người cày 20 lượt | 27 / 77 / 123 | 27 / 77 / 123 | 168 |
| Người cày, kỹ năng ×4 (60 / 120 phút) | | 27 / 77 / 123 | 984 |

Kết luận: hai kỹ năng rút thời gian **không đổi ngày về đích**, kể cả khi mạnh gấp 4. Giữ nguyên.

### 4.2 Tiền hạt và nước (chỗ tiêu Galleons chính)

Giá: hạt 2–48 G (`garden-store-catalog`), nước 5 G / 9 phần. Chi mỗi ngày theo mô phỏng 2 lượt: tháng 1 ~211 G, tháng 7 ~810 G; người cày ~2.000 G.

| Kỹ năng (bậc 2) | Tiết kiệm tối đa/ngày |
|---|---|
| Quái lùng nhùng: 2 hạt ≤ 25 G | ≤ 50 G |
| Đào mỏ: 2 lần × (3–8 Nước + 10 % một hạt) | ~12 G |
| Bằng-Mã: 20 Nước | ~11 G |
| **Cộng (cấp cao)** | **~73 G = 9 % (2 lượt), 3,6 % (người cày)** |
| Cộng (cấp 26–33: lùng nhùng + Đào mỏ, hạt ≤ 5 G) | ~16 G = 7,6 % |

Kỳ lân chữa miễn phí chỉ dùng được khi thú ốm (tâm trạng < 25, vườn bị bỏ bê), nên không tính vào bảng; giới hạn 1 con/ngày. **Đã duyệt (chủ dự án 13/11/2026): giữ mức ~9 %**, bảng trên giữ nguyên (không bỏ hoàn hạt ở bậc 2).

### 4.3 Tên

Tên loài lấy đúng nhãn game hiện có (đã tra Lý Lan 08/11, `hpvnn-ly-lan-glossary`). Tên kỹ năng là từ mới của game, không phải thuật ngữ trong sách. Chi tiết theo sách *Sinh vật Huyền bí*: Crup ăn cả quỷ lùn; phân Mooncalf làm cây lớn nhanh; thủy quái có ngón tay dài, bóp chặt.

## 5. Rào chắn (nối tiếp #54)

Mỗi rào có một test hỏng khi bỏ rào.

- **#55** Kỹ năng không cộng XP, không tăng sản lượng lâu dài, không tạo Galleons. Sim 4.1 chạy lại trước khi phát hành.
- **#56** Việc do kỹ năng làm không tính nhiệm vụ, sứ mệnh, lễ hội, Cúp Nhà (như gia tinh, `garden-elf-core`).
- **#57** Server giữ lượt, bậc, tâm trạng, đồng hồ; lệnh `skill` có `requestId` và `revision`; nhiều tab không thêm lượt.
- **#58** Gặt hộ (Diricawl, thủy quái kéo lưới) không bao giờ gieo lại, nên không thêm vụ.
- **#59** Thủy quái: trần 1 cá vàng/ngày và 1 lượt câu/ngày giữ nguyên; vùng trúng do server đặt, client chỉ gửi ms như cũ (fence #53).
- **#60** Đào mỏ: không Galleons, không sản vật bán ở Quầy chợ; Nước phép tối đa 1 lọ/tuần.
- **#61** Không có lệnh thả thú (đã có, §10.5 #10), nên không nuôi lại để lấy lại lượt; tài khoản phụ không chuyển được đồ (§10.5 #13).
- **#62** Công tắc HPH trong ACP tắt toàn bộ kỹ năng (server từ chối lệnh `skill`, thụ động ngừng).

## 6. Các phần

| Phần | Việc | Xong khi |
|---|---|---|
| 0 | Spec này, sim, kinh tế | **Xong 13/11/2026**: chủ dự án duyệt mọi thú đều giúp, mức 4.2 (~9 %), đường XP phẳng |
| 1 | HPVNN `functions/games/garden-skill-core.js` (thuần) + lệnh `skill` + 12 kỹ năng cấp 10–94; test mỗi rào | **Xong local 13/11/2026**: HPVNN `c7bbe5405` (nhánh `claude/compassionate-proskuriakova-5ed8f0`, chưa push), garden 297/297 pass. Công tắc HPH `skillsOff` trong `galleons_config/garden_sales`. Diricawl chạy trong ca duty nên chỉ từ cấp 130; thú trưởng thành có gắn bó gốc ≥ 3 giúp ngay khi phát hành |
| 2 | 6 kỹ năng 130+ và các kỹ năng thụ động trong duty, pond, soil, fire | **Xong local 13/11/2026**: HPVNN `328ac4b9e` (nhánh `claude/funny-almeida-7e2129`, trên Phần 1, chưa push), garden 304/304 pass, test rào #58/#59 hỏng khi bỏ rào, một ngày giả lập qua handler thật trên Firestore emulator (`functions/test/garden-skills-emulator.cjs`). Kỳ nhông lửa giữ thửa cả khi ACP «Đốt vườn» thật (một luật chung `burnCrops`) |
| 2b | Trần cấp 10.000 (mục 7): công thức đường XP 501+, mọi chỗ đọc trần 500 ở client và server, mốc thưởng, bậc 3 | **Xong local 13/11/2026**: HPVNN `0ee7416ca` (nhánh `claude/hagrid-s2-levels-2f9474`, trên Phần 2, chưa push), client `season-2` 5c2a07b. Garden 314/314 pass, client 427 pass (1 lỗi có sẵn: `progression-engine.test.mjs` thiếu file `outputs/`). Mốc mỗi 100 cấp từ 600: **2 Nước phép** (như thưởng gắn bó cấp 5; trần trọn đời 95 mốc = 190 lọ), lưu `lv<N>` trong `achievements.claimedIds`; mỗi 1.000: khung Floo `hagrid-tan-suc-<N>` (chỗ giữ = khung Bậc thầy, art ở Phần 3). ACP nhảy cấp lưu mốc đi qua là `lv<N>-acp`, không trả bù (#64). #63: danh mục ≤ 500, giá chữa thú chốt cấp 500. Bậc 3: thú bậc 2 ở vườn cấp ≥ 1.000 thêm 1 lượt, kỹ năng luôn bật giữ nguyên. Sim `runSkills.mjs "r3":true`: cấp 500 ngày 196 / 148 / 123 không đổi. Lighthouse tải trước 5.111.788 → 5.086.790 B (`qa-v19/s2b-lighthouse*.json`) |
| 3 | Client: thẻ kỹ năng trong «Chăm bé», biểu tượng trên bảng chuồng, hiệu ứng nhẹ, thư bác Hagrid mở Mùa 2; Codex vẽ 18 biểu tượng | **Xong local 13/11/2026** (nhánh `season-2-ui`, chưa lên 3026, chủ dự án chưa duyệt ảnh). `garden-skills-ui.mjs` (nạp sau lần nhận ví đầu: dấu bản đồ, chỗ dùng được, dòng kỹ năng thụ động vừa chạy) + `garden-skills-card.mjs` (nạp cùng «Chăm bé»: bậc, lượt còn, lý do bé nghỉ, chip thửa/bé, «Nhờ bé»). Bảng chuồng: ★ kỹ năng sẵn sàng; Mắt tinh: bữa xong, ♡ bé sắp ốm (≤ 3 giờ), đồng hồ trên thửa sắp héo (≤ 3 giờ); bậc 2 thêm dòng việc cần làm. Kỹ năng thụ động: so `left` giữa hai snapshot cùng ngày → hoạt cảnh chăm + một dòng. Thư `SEASON_LETTER` (garden-tutorial) một lần, cờ `hagrid-s2-letter` lưu qua tùy chọn HPVN. ACP: ô «Tắt kỹ năng sinh vật» (`skillsOff`). Atlas `skills-s2.png` 6×3 ô 64 px (18.529 B, chỉ tải khi mở «Chăm bé») từ 3 tấm Codex qua `build-skills-art.mjs`; Codex tự chấm cả 18 ô «redo» (chưa giống hẳn sprite game, chi tiết nhỏ mất ở 40 px), chờ chủ dự án quyết vẽ lại. Fixture có `skills` + lệnh `skill` (gần đúng). Test client 432 pass (1 lỗi có sẵn `progression-engine.test.mjs`). Lighthouse (`qa-v19/s2-p3-lighthouse.json`, máy bận): tải trước 5.090.310 → 5.102.343 B (+12.033 B: module dấu 4,6 KB, nối dây mobile-game/renderer, CSS, thư, fixture), LCP 15.855–15.915 ms (mốc 15,6–15,9 s). Mốc 600+ không cần nút nhận: server tự trả |
| 4 | Functions + client cùng lúc, tem `?v=` 26.0 | Chủ dự án duyệt trên 3026 rồi mới deploy |

## 7. Trần cấp 10.000 (chủ dự án 13/11: «nâng level lên 10000 luôn»)

**Hiện trạng:** `MAX_LEVEL = DB.levels.length` (500 hàng trong `balance-data`); trên cấp 100 HUD ghi «Tận Sức N» (N = cấp − 100), vòng cấp vừa 3 chữ số (sửa 25.1.9); ACP HPH «Nhảy tới cấp» chặn 1–500; `next-goal`, bảng lộ trình (tab 20 cấp), Floo frame, Quầy chợ, đơn hàng và server (`garden-action-core`, `-wallet-core`, `-retention-core`, `-market-core`, `-sale-admin`, `-floo-frame`) đọc trần này.

**Cách làm (đề xuất):**

| Việc | Nội dung |
|---|---|
| Đường XP 501–10.000 | **Phẳng** (đã duyệt 13/11): mỗi cấp bằng bước 499 → 500 (40.000 + 110 × 400 = 84.000 XP). Tính bằng công thức trong `balance-data` và `garden-balance`, **không** thêm 9.500 hàng (giữ ngân sách tải trước khung đầu ≤ 4,4 MB) |
| Nhịp | Sau cấp 500 không còn mở cây hay thửa, XP/ngày giữ như cuối sim: 2 lượt ~240.000 → ~3 cấp/ngày, 10.000 sau ~9 năm; người cày ~330.000 → ~4 cấp/ngày, ~6,5 năm. Là trần «không có điểm dừng», không phải đích |
| Tên | Giữ «Tận Sức N» chạy tiếp tới «Tận Sức 9900»; vòng cấp và huy hiệu phải vừa 4 chữ số |
| Mốc thưởng 501+ | Mỗi 100 cấp: Nước phép (như thưởng gắn bó, có trần); mỗi 1.000 cấp: một khung Floo «Tận Sức» (10 khung); không thưởng XP hay sản lượng (#55) |
| Gắn với kỹ năng | **Bậc 3 «Tinh thông»** của mọi loài mở từ cấp 1.000: thêm 1 lượt cho kỹ năng chủ động, thụ động +1 thửa/con. Sim lại như 4.1 trước khi mở |
| Bảng lộ trình | Trên 500 hiện mốc 100 cấp thay vì tab 20 cấp (không vẽ 475 tab) |
| ACP | «Nhảy tới cấp» 1–10.000 |

**Rào chắn thêm:**

- **#63** Cấp > 500 không mở thêm cây, thửa, chuồng; mọi bảng giá theo cấp (chữa thú `CURE_PER_LEVEL`, đồ theo cấp) **chốt ở mức cấp 500**, để cấp cao không thành giá trên trời hay chỗ trục lợi.
- **#64** Mốc thưởng 501+ nhận một lần mỗi mốc, lưu theo mốc (nhảy cấp bằng ACP không trả bù thưởng các mốc đã bỏ qua).

**Đã quyết (chủ dự án 13/11/2026):** đường **phẳng 84.000 XP mỗi cấp** từ 501 tới 10.000 (không chọn đường thấp ~36.000 XP/cấp).

## 8. Chưa quyết (mặc định đang dùng)

- Kneazle gửi thông báo Floo: **không**, chỉ đánh dấu trên bản đồ (thông báo cần job định kỳ trên server).
- Norbert: chưa có kỹ năng (bạn đồng hành Noel).
- Hình thú đi lại khi dùng kỹ năng: để sau, đợt đầu dùng biểu tượng và hiệu ứng.
