# Khu Vườn Hagrid — Mở rộng vườn: hồ nuôi, thú mới, khu Bìa Rừng, đồ mới

Owner 08/11/2026: «plan mở rộng và phát triển cái vườn lên 1 tầm cao mới, nhiều đồ hoặc thêm thú, hoặc có cái hồ nuôi gì đó».
Trạng thái: **owner duyệt 08/11/2026** («130 mở nha và làm đi, hình nào ko có thì codex làm»): hồ mở cấp 130; câu cá có; Quái Tôm Đuôi Nổ được làm cháy ô cỏ; bản đồ lớn thì kéo để xem. Số liệu là điểm xuất phát, phải chạy mô phỏng (`docs/level-500-sim`) trước khi chốt.

## 0. Hiện trạng (08/11/2026)
- Vườn: 18 thửa 3×3, 6 chuồng, 12 chỗ sinh vật (`FARM_LAYOUT`), 12 loài (cấp 10–94), 32 cây.
- Ao chỉ là đồ trang trí (`scene:pond`). «Nuôi cá nhỏ», «Bánh cá dự trữ», «Nuôi cá bằng Tảo bạc» là công thức chế biến cho thú ăn đạm.
- Cây dưới nước đã có nhưng trồng trên thửa thường: Tảo bạc (khay nước), Cỏ mang cá, Rong nước xiết.
- Đoạn cấp 100–500 rất thưa: sau cấp 94 không có loài mới (`level-160-challenges.md` §0).
- Rừng Cấm bao quanh vườn đã có mã dọn rừng (`forest-clearance.mjs`, `forest-surround.mjs`).

## 1. Luật chung
- Theo roadmap cấp 500: phần thưởng sau cấp 100 không tăng XP hay sản lượng vĩnh viễn. Đồ có chức năng chỉ cho lợi ích nhỏ, theo ngày.
- Sản vật mới phải qua rào chênh giá của chợ (`produce-market-plan.md`, thêm từ #50).
- Mọi luật nằm trên server. Không thêm lượt đọc Firestore mỗi thao tác, và trạng thái mới phải gọn để doc vườn không phình.
- Tên HP theo Lý Lan và đều là tiếng Việt (owner 08/11). Sinh vật có trí khôn như người cá, nhân mã không bị nuôi; họ chỉ ghé thăm.
- Bậc trách nhiệm từ cấp 130 và các thử thách cấp 160 áp dụng cho hồ và thú mới theo cùng cách.

## 2. Bốn trụ cột

### 2.1 Hồ nuôi (mở cấp 130)
- **Đào hồ:** ao trang trí trở thành hồ thật, mở rộng theo 3 bậc như mở thửa.
  - Bậc 1 «Ao cá», cấp 130.
  - Bậc 2 «Hồ rong», cấp 200.
  - Bậc 3 «Hồ sâu», cấp 320.
  - Mỗi bậc là một ô to hơn trên bản đồ, đặt được ở chỗ trống như đồ trang trí lớn.
- **Thả cá giống:** cá chép, cá vàng (tên thường, không phải HP). Cá lớn theo giờ như cây. «Kéo lưới» thu cá, và cá thành nguồn đạm cho thú. Các công thức «Nuôi cá …» vẫn giữ làm đường thay thế.
- **Luống ven hồ:** Tảo bạc, Cỏ mang cá, Rong nước xiết trồng được trong 2–4 luống ven hồ, gặt thêm 1 phần mỗi vụ. Không tăng sản lượng vĩnh viễn, vì đây là chỗ trồng thêm theo bậc hồ.
- **Sinh vật hồ** (dùng chung chỗ sinh vật, có chuồng nước riêng):
  - **Thủy quái** (Grindylow, HP3, «con thủy quái»), cấp 150. Ăn cá nhỏ, cho «Rong thủy quái» (sản vật).
  - **Ma da** (Kappa, HP3), cấp 240. Ăn Dưa hổ phách hoặc Bí ngô, cho «Vảy ma da».
- **Khách hồ sâu** (sự kiện ngẫu nhiên, chỉ để xem và nhận trang trí, không bắt được):
  - **Con mực khổng lồ** (HP1–5) thò xúc tu lên, tặng một «Chuông gió vỏ ốc».
  - **Người cá** (HP4) hát dưới nước một đêm mỗi tuần; nghe hết bài được trang trí «Đá người cá».
- **Câu cá** (tùy owner): mỗi ngày 1 lượt câu, chạm đúng nhịp. Thưởng cá hoặc đồ trang trí, không XP. Dễ cho người 1 lượt/ngày.
- **Bậc trách nhiệm:** nước hồ «đục rêu» nếu 2 ngày không vào; cá lớn chậm một nửa đến khi «vớt rêu». Không có cá chết.

### 2.2 Thú mới (cấp 140–420), lấp khoảng trống sau cấp 100
| Cấp | Loài (Lý Lan) | Nguồn | Ăn | Sản vật | Ghi chú |
|---|---|---|---|---|---|
| 140 | Chó đuôi nĩa (Crup) | HP5 | đạm + cá | Vòng cổ lông | Chạy theo người chơi khi đi quanh vườn |
| 150 | Thủy quái (Grindylow) | HP3 | cá nhỏ | Rong thủy quái | Sống ở hồ (§2.1) |
| 180 | Nhím quậy (Knarl) | HP5 | hạt, củ | Lông gai | Nghi ngờ đồ ăn để sẵn: chỉ ăn khi được cho tay (một thao tác riêng) |
| 220 | Kỳ nhông lửa | HP2 | lá khô, Ớt lửa | Tro kỳ nhông | Sống trong lò lửa trại; tắt lửa thì bỏ đi (gắn với Dập lửa) |
| 240 | Ma da (Kappa) | HP3 | Dưa hổ phách, Bí ngô | Vảy ma da | Sống ở hồ |
| 280 | Ngựa lùn (Porlock) | HP5 | cỏ, yến mạch | Lông bờm | Canh chuồng Bằng-Mã, Kỳ lân: thú trong chuồng gần đó vui thêm |
| 340 | Cua lửa | HP4 | rong, cá | Vỏ ngọc | Mai có ngọc, làm đồ trang trí |
| 420 | Quái Tôm Đuôi Nổ | HP4, giống bác Hagrid lai | đạm, cá | Mồi lửa | Khó nuôi: bỏ đói từ cấp 130 thì «nổ đuôi» làm cháy một ô cỏ (dùng cơ chế lửa sẵn có) |

- Chỗ sinh vật: 12 → 18, thêm 3 «chuồng mở rộng» ở cấp 140, 220, 340 (mỗi chuồng thêm 2 chỗ). Chỗ ở hồ tính riêng: 2 chỗ.
- Mỗi loài mới có: sprite 2 hướng, các cảnh ăn, chăm, đứng yên, đồ chơi (`garden-mood-ui`), món thích (thử thách C) và thức ăn mới trong `balance-data`.

### 2.3 Khu Bìa Rừng Cấm (mở cấp 260)
- Dọn rừng phía bắc vườn thành 2 khu mới, giữ nguyên 18 thửa để không lệch cân bằng:
  - **Bãi chăn thả:** Bằng-Mã, Vong mã, Kỳ lân, Ngựa lùn được thả đi lại; thú ở bãi vui chậm giảm hơn.
  - **Vườn cây lâu năm:** cây trồng một lần, ra quả theo mùa (3 ngày một lần). Đề xuất táo, lê, mận (tên thường).
- Mở bằng chuỗi nhiệm vụ của bác Hagrid (3 bước), không bằng Galleons diễn đàn.
- Camera: bản đồ lớn hơn. Trên điện thoại giữ mức zoom tối thiểu hiện tại và kéo để xem; không thu nhỏ tự động.

### 2.4 Nhiều đồ hơn
- **Bộ trang trí theo khu:**
  - Hồ: cầu gỗ, thuyền nhỏ, đèn lồng nổi, bến câu.
  - Rừng: lều, hàng rào gỗ thô, đèn bão.
  - Bãi chăn: máng cỏ, cổng gỗ.
  - Mỗi bộ 6 món, đặt đủ bộ được danh hiệu và khung Floo.
- **Đồ có chức năng nhẹ**, mỗi tác dụng một lần mỗi ngày:
  - **Bù nhìn:** đuổi ma lùm một lần.
  - **Ghế đá:** thú chơi gần ghế vui thêm +5.
  - **Máng nước:** tưới hộ 1 thửa.
  - **Chuông gió vỏ ốc:** báo trước khách hồ sâu.
- **Chế tạo đồ trang trí từ sản vật** (lông, len, vảy, vỏ ngọc). Đây là chỗ tiêu sản vật cao cấp, giảm áp lực bán ra chợ.
- **Kệ trưng bày:** đặt kỷ vật và sản vật hiếm lên kệ, khách thăm vườn xem được.

## 3. Thứ tự phát hành (mỗi đợt 1–2 phiên, client + Functions cùng lúc, bump `?v=`)
| Đợt | Nội dung | Art cần (Codex vẽ) |
|---|---|---|
| 1 | Hồ bậc 1–2, cá, luống ven hồ, Thủy quái, câu cá (nếu duyệt) | Hồ 3 bậc, 2 loại cá, Thủy quái (2 hướng + cảnh ăn/chăm), 6 icon |
| 2 | Chuồng mở rộng, Chó đuôi nĩa, Nhím quậy, Kỳ nhông lửa | 3 loài × cảnh, chuồng mở rộng, thức ăn mới |
| 3 | Bìa Rừng Cấm (bãi chăn thả, vườn cây lâu năm), Ma da, Ngựa lùn | Nền khu mới, 3 cây lâu năm, 2 loài |
| 4 | Hồ sâu và khách (mực khổng lồ, người cá), Cua lửa, Quái Tôm Đuôi Nổ | Xúc tu, người cá dưới nước, 2 loài |
| 5 | Bộ trang trí theo khu, đồ chức năng, chế tạo, kệ trưng bày | ~30 món trang trí |

## 4. Rào chắn (nối tiếp #49)
- #50 Cá và sản vật mới: giá chợ dưới giá bữa ăn rẻ nhất mua được (như #41–#44).
- #51 Luống ven hồ và vườn cây lâu năm không cộng dồn với thông thạo cây để thành sản lượng vĩnh viễn.
- #52 Khách hồ sâu: đồ tặng một lần mỗi tài khoản; không đổi thiết bị để nhận lại (server giữ).
- #53 Câu cá: một lượt mỗi ngày, server tính kết quả; client chỉ gửi thời điểm chạm, server kiểm cửa sổ hợp lệ.
- #54 Đồ chức năng: một tác dụng mỗi ngày mỗi món loại, không cộng dồn khi đặt nhiều món giống nhau.

## 5. Cần owner quyết
1. Hồ mở từ cấp 120 (đề xuất), hay sớm hơn cho mọi người (ví dụ cấp 40)?
2. Có làm câu cá không?
3. Quái Tôm Đuôi Nổ có được «nổ» làm cháy ô cỏ khi bị bỏ đói không?
4. Bản đồ lớn hơn (khu Bìa Rừng): chấp nhận phải kéo để xem trên điện thoại?
5. Bắt đầu từ đợt 1 (hồ)?

## 6. Đợt 1: hợp đồng giữa code và hình
Code (nhánh `challenges-160` + HPVNN `codex/hagrid-challenges-160`) và hình (nhánh `pond-art`, Codex vẽ) chạy song song; ghép bằng các id và đường dẫn sau. Thiếu hình thì code phải hiện bản dự phòng (ảnh ao cũ, icon chung), không lỗi.

| Thứ | Id / đường dẫn | Bên làm |
|---|---|---|
| Hồ 3 bậc (iso, chân như `environment/layers/pond.png` 160×100) | `garden-v05/environment/pond/pond-1.png` (3×2 ô), `pond-2.png` (4×3), `pond-3.png` (5×4) | hình |
| Luống ven hồ (1×3 ô, khay nước) | `garden-v05/environment/pond/pond-bed.png` | hình |
| Cá giống (vật tư mua bằng G) | item `fry_carp`, `fry_goldfish` | id: code; ảnh 64×64: hình |
| Cá thu được | `fish` (đã có, «Cá nhỏ»; cá chép cho ra món này), `goldfish` «Cá vàng» (mới) | code; ảnh `goldfish`: hình |
| Thủy quái | loài `grindylow`, nhãn «Thủy quái», sản vật `produce_grindylow` «Rong thủy quái» | dữ liệu: code; sprite và các cảnh theo pipeline sinh vật hiện có: hình |
| Icon 16×16 | `pond`, `net`, `rod`, `algae` trong `pixel-icons.mjs` | hình |
| Đăng ký ảnh item mới | `garden-v05/pond-art.mjs` (`POND_ART`, cùng dạng `UI_AUDIT_ART`) + một dòng fallback trong `flow-item-ui.mjs` | hình |

**Kích thước hình đã giao (bên hình điền, 08/11/2026, nhánh `pond-art`).** Số đo theo pixel native, đọc trong `pond-art.mjs` (`POND_SCENERY`) thay vì chép tay. Hồ và luống theo đúng quy ước neo chân của đồ trang trí: nền `[dài, ngắn]` chạy cạnh dài theo hàng ở góc mặc định; vẽ ảnh ở `iso(col,row) − (pivotX, pivotY)` thì `decorFootprintRect(col, row, footprint)` nằm khít dưới hình (tâm nền trong ảnh = `groundCentre` = pivot − (0, 32 × footLift)). Góc phải là ảnh lật ngang, cùng canvas và pivot.

| Hình | File | Nền | Canvas | Pivot (chân) | Tâm nền | footLift | Khung mực |
|---|---|---|---|---|---|---|---|
| «Ao cá» | `environment/pond/pond-1.png` | 3×2 | 160×112 | (80, 102) | (80, 70) | 1 | x4 y21 153×86 |
| «Hồ rong» | `environment/pond/pond-2.png` | 4×3 | 224×152 | (112, 142) | (112, 94) | 1,5 | x5 y16 214×129 |
| «Hồ sâu» | `environment/pond/pond-3.png` | 5×4 | 288×192 | (144, 182) | (144, 118) | 2 | x5 y13 278×175 |
| Luống ven hồ | `environment/pond/pond-bed.png` | 3×1 | 128×88 | (64, 70) | (64, 54) | 0,5 | x1 y22 126×65 |
| Icon item | `native-items/{fry_carp,fry_goldfish,goldfish,produce_grindylow}.png` | — | 64×64 | (32, 56) | — | — | ≤ 40×40, đáy hàng 56 |

- Hồ là hình phẳng: mực phủ cả hình bình hành nền nên đáy mực thấp hơn pivot tới 8 px (luống 16 px); đó là góc trước của nền, không phải chân lơ lửng. Ảnh ao cũ `environment/layers/pond.png` (160×100, pivot 80,99) giữ làm bản dự phòng.
- Icon: `itemArtKey` / `visualItemIcon` (ui-utils) tìm thấy 4 id qua `flowArtSpec` (fallback `POND_ART` trong `flow-item-ui.mjs`). `fish` «Cá nhỏ» đã có hình (`recipe_fish`), không vẽ thêm.
- Thủy quái: `window.FARM_MOTION.items` có `id: 'grindylow'` (do `creature-motion-data.js` thêm từ `creature-motion-assets/pond-creatures.json`), canvas 96×96, pivot (48, 80), con trưởng thành ~42×56 (tầng «sinh vật vừa», cỡ Diricawl). `frames[0..3]` là 4 tuổi lớn; clip `idle` 4–7, `action` 8–11, `eat` 12–15, `care` 16–19; `creatureView(item,'right')` trả hướng phải vẽ riêng cùng chỉ số. `HABITAT_ART.grindylow` (40×36, pivot 20,31) và `KEEPSAKE_ART.grindylow` (56×56, pivot 28,50) trong `complete-object-art.mjs`. Code chỉ cần thêm loài vào `balance-data`; không cần nạp file mới.
- Icon 16×16 `pond`, `net`, `rod`, `algae` đã có trong `ICONS` của `pixel-icons.mjs`.

File chỉ bên hình sửa: `pixel-icons.mjs`, `pond-art.mjs`, `flow-item-ui.mjs`, manifest và data của sprite sinh vật. File chỉ bên code sửa: `balance-data*`, engine, UI, `scene-renderer.mjs`, fixture, server.

## 7. Đợt 1: phía client (nhánh `challenges-160`, 08/11/2026)
- **Đọc từ server:** `snapshot.pond` (null dưới cấp 130): `tier`, `lots` (fry, readyAt, ripe), `beds` (3 ô: species, readyAt, ripe), `bedCrops`, `murky`, `fry` {carp, goldfish}, `cast` {today, token}, `creatureSpots`; `garden.supplies.fryCarp/fryGoldfish`; `serverNow` (đồng hồ cho câu cá). Bậc hồ trong cảnh lấy từ `built` (pond_1..3), nên vườn bạn bè cũng thấy hồ.
- **Gửi:** `{action:'pond', kind}` với `stock {lot, fry}`, `net`, `plant {bed, cells, species}`, `harvest`, `clean`, `castStart`, `cast {tapMs}`; đào/nâng hồ là `build` pond_1..3 + `claimBuildings`. Lỗi `cast-running` thì dùng lại `details.token`.
- **Giao diện:** nút «Hồ» trên thanh công cụ (chỉ khi có `pond`), khay `#pondDock` (`garden-pond-ui.mjs`): Kéo lưới · Vớt rêu (khi đục) · Câu cá; ô ao với chọn cá giống; luống với chọn cây nước; dòng Thủy quái mở khay Nuôi. Bậc 0: «Đào ao» = pond_1. Chạm hồ trong cảnh mở khay «Hồ». Cửa hàng có tab «Cá giống».
- **Hình code đọc** (`POND_SCENERY` trong `garden-pond-ui.mjs`, cùng số với `pond-art.mjs`): `environment/pond/pond-{1,2,3}.png` (vẽ tại iso(col,row) − pivot), `environment/pond/pond-bed.png` (luống 1×3, phía tây hồ). Chỉ tải sau khi đã ghép nhánh hình (nhận biết qua `flowArtSpec('goldfish')`), để không có lỗi 404; test so với `runtime-webp-manifest.json`. Thiếu hình: `environment/layers/pond.png` phóng theo bậc (×1 / ×1,4 / ×1,8), luống vẽ bằng ô nước viền gỗ, Thủy quái vẽ bằng khối pixel nếu chưa có sprite. Icon `pond`, `net`, `rod`, `algae` (thiếu thì `water`, `harvest`, `quill`, `tired`); icon vật phẩm qua `itemArtKey`/`itemArtSpec` (thiếu thì icon pixel).
- **QA:** `qa-v19/ui-fixture.html?wallet=emulator&level=140|210&simulate=1[&murky=1]`.

## 8. Đợt 1: số liệu đã chốt và mô phỏng cấp 500 (server HPVNN `codex/hagrid-challenges-160`, 08/11/2026)
| Thứ | Số |
|---|---|
| Bậc hồ (xây như thửa, một công trình hồ một lúc, chạy song song thửa/chuồng) | pond_1 «Ao cá» cấp 130, 12 giờ, Tảo bạc 24 + Rong nước xiết 36 + 800 G · pond_2 «Hồ rong» 200, 24 giờ, Tảo bạc 36 + Cỏ chút chít 54 + 1.200 G · pond_3 «Hồ sâu» 320, 24 giờ, Sung-quéo 48 + Cỏ mang cá 60 + 1.600 G (thửa cùng cấp: 1.000 / 1.400 / 1.800 G) |
| Ô ao / luống | 2 / 4 / 6 ô ao; 2 luống ở bậc 1, 4 từ bậc 2, mỗi luống 3 ô |
| Cá giống (tiệm, gói 2, cấp 130) | «Cá chép giống», «Cá vàng giống»: 34 G một gói (như gói hạt cấp 130) |
| Cá lớn (×0,5 như cây) | cá chép 4 giờ → 3 Cá nhỏ; cá vàng 8 giờ → 1 Cá vàng; «Kéo lưới» không cho XP |
| Luống ven hồ | Tảo bạc, Cỏ mang cá, Rong nước xiết; 1 nông sản một ô, đếm thông thạo, không luân canh/thời tiết; **XP bằng nửa thửa** (mô phỏng dưới) |
| Rêu | 2 ngày không vào (từ cấp 130) → cá lớn nửa tốc độ tới «Vớt rêu»; nghỉ «Nhờ bác Hagrid» dừng đồng hồ |
| Câu cá (rào #53) | token server, chu kỳ kim 1,6 s, vùng trúng ±0,12, giữa ±0,035; giữa → 1 Cá vàng, trúng → 3 Cá nhỏ, trượt → 1 Cá nhỏ; 4% Đèn bí ngô (một lần); không XP |
| Thủy quái | cấp 150, 2 chỗ ở hồ riêng (cần Ao cá), 18 bữa, 2 phần; XP 128 / 1.152, giai đoạn 8.294 / 12.441 / 20.736; «Khẩu phần Thủy quái» = 6 Cá nhỏ + 3 Tảo bạc (hoặc + 3 Rong nước xiết từ 152) |
| Chợ (rào #50) | Cá vàng 25 G; Rong thủy quái 32 G (loài trên cấp 94 lấy giá Rồng); bữa mua rẻ nhất ≈ 133 G; «Tiệc chuồng» chỉ cho thú trong chuồng |

Mô phỏng (`docs/level-500-sim/runPond.mjs` + `sim-pond.patch`, trên bản sao `garden-v05` như README; bot xây hồ, giữ mọi ô ao thả cá chép, trồng luống mỗi lượt, câu cá mỗi ngày, nuôi Thủy quái), 2 lượt/ngày (08:00, 21:00):

| Trường hợp | Cấp 200 | Cấp 300 | Cấp 500 |
|---|---|---|---|
| Không có hồ | ngày 94 | 131 | 202 |
| Hồ, luống đủ XP thửa | 93 | 128 | 195 (−3,5%) |
| **Hồ, luống nửa XP (đã chọn)** | 93 | 129 | **197 (−2,5%)** |
| Chỉ cá + Thủy quái, luống 0 XP | 93 | 129 | 199 (−1,5%) |

Cá thêm ~7.900 Cá nhỏ trong 300 ngày, nhỏ so với công thức «Nuôi cá nhỏ» (12 con một mẻ), nên kinh tế bữa ăn không đổi đáng kể; XP thêm chủ yếu từ luống và Thủy quái.

## 9. Đợt 2: hợp đồng giữa code và hình (08/11/2026)
Loài mới (id / nhãn Lý Lan / cấp): `crup` «Chó đuôi nĩa» 140 · `knarl` «Nhím quậy» 180 · `salamander` «Kỳ nhông lửa» 220. Chuồng mở rộng `pen_ext_1..3` ở cấp 140, 220, 340, mỗi cái +2 chỗ (12 → 18).

| Thứ | Id / đường dẫn | Bên làm |
|---|---|---|
| Sprite 3 loài (4 tuổi + idle/action/eat/care, 2 hướng) | `creature-motion-assets/native/<id>/…`, `FARM_MOTION.items` id `<id>` | hình (pipeline như `grindylow`) |
| Chỗ ở + tượng kỷ vật | `HABITAT_ART.<id>`, `KEEPSAKE_ART.<id>` | hình |
| Icon sản vật / thức ăn 64×64 | `produce_<id>`, `<id>_feed` trong `POND_ART` (hoặc một `creature-art-2.mjs` cùng dạng, nối vào `flowArtSpec`) | hình; nhãn, công thức: code |
| Icon 16×16 | `paw`, `hand_feed`, `campfire` | hình |
| Ô kỷ vật thêm (Thủy quái + 3 loài mới) và chỗ đặt luống ven hồ không đè đồ trang trí | `KEEPSAKE_DISPLAY_LAYOUT`, server + client | code |

File chỉ bên hình sửa: `pixel-icons.mjs`, `pond-art.mjs`/`creature-art-2.mjs`, `flow-item-ui.mjs`, manifest/data sprite sinh vật, test số lượng art, `garden-creature-habitats.mjs` (chuyển động chỗ ở). File chỉ bên code sửa: `balance-data*`, engine, UI, `scene-renderer.mjs`, fixture, server.

## 10. Đợt 2: số liệu đã chốt và mô phỏng cấp 500 (code, 08/11/2026)
Server HPVNN `codex/hagrid-challenges-160`, client `challenges-160`. Không đổi gì dưới cấp 140, không đổi giá hay phần thưởng cũ.

| Thứ | Số |
|---|---|
| Chó đuôi nĩa `crup` | cấp 140, 20 bữa (6/13/20), 2 phần; XP 84 / bữa, 756 / lần nhận trưởng thành; giai đoạn 5.443 / 8.165 / 13.608. Món: «Khẩu phần Chó đuôi nĩa» `crup_feed` 140 = 6 Cá nhỏ + 3 Củ u; `crup_knotgrass` 160 = 6 Cá nhỏ + 3 Cỏ chút chít. Sản vật «Vòng cổ lông» |
| Nhím quậy `knarl` | cấp 180, 22 bữa (6/14/22), 2 phần; XP 88 / 792; 5.702 / 8.554 / 14.256. `knarl_feed` 180 = 3 Củ u + 3 Ngô vàng; `knarl_sunflower` 182 = 3 Cỏ chút chít + 3 Hướng dương. «Lông gai». `feeding: "hand"` |
| Kỳ nhông lửa `salamander` | cấp 220, 24 bữa (7/16/24), 2 phần; XP 92 / 828; 5.962 / 8.942 / 14.904. `salamander_feed` 220 = 3 Ớt lửa + 3 Sung-quéo; `salamander_knotgrass` 222 = 3 Ớt lửa + 3 Cỏ chút chít. «Tro kỳ nhông» |
| Tiệm | «Thức ăn …» 2 phần, giá gốc max(10, ⌈cấp × 1,5⌉) = 210 / 270 / 330 (bán 1.200 / 1.800 / 2.400 G như mọi món); `CATALOG_VERSION garden-2026-11-08-creatures-2` |
| Chợ (rào #50) | sản vật trên cấp 94 lấy giá Rồng: 32 G. «Tiệc chuồng» kết thúc tối đa 12 bữa một lần (chuồng giờ chứa 18), nên rào #41 vẫn giữ |
| Chuồng mở rộng `pen_ext_1..3` | kind `pen`, mỗi cái +2 chỗ: 140 (24 giờ, 36 Củ u + 54 Ớt lửa + 900 G) → 14 · 220 (48 Sung-quéo + 60 Cỏ chút chít + 1.300 G) → 16 · 340 (60 Mimbulus + 72 Cỏ mang cá + 1.700 G) → 18. Cần cái trước (chuồng 6 trước cái 1). Trong cảnh: 3 chuồng 5×3 cố định (không đổi chỗ) ở (27,5; 24,5), (22; 20,5), (22; 24,5), dùng hình chuồng cũ |

XP của 3 loài: số bữa và phần ăn tăng dần từ Thủy quái (18 → 20/22/24 bữa), nhưng XP mỗi bữa giữ ở dải Vong mã–Kỳ lân (84/88/92). Với XP tăng tiếp từ Thủy quái (132/138/146) mô phỏng ra ngày 194 (−4,0%), vượt rào 3%.

Mô phỏng (`docs/level-500-sim/runCreatures.mjs` + `sim-creatures.patch`, chồng lên `runPond.mjs`, `sim-pond.patch`, `sim-hooks.patch` như README; bot đón loài mới khi chuồng còn chỗ, cho Nhím quậy ăn tận tay mỗi lượt), 2 lượt/ngày (08:00, 21:00):

| Trường hợp | Cấp 200 | Cấp 300 | Cấp 500 |
|---|---|---|---|
| Không hồ, không đợt 2 | ngày 94 | 131 | 202 |
| Đợt 1 (hồ) | 93 | 129 | 197 (−2,5%) |
| Chỉ đợt 2 | 94 | 130 | 200 (−1,0%) |
| **Đợt 1 + đợt 2 (đã chọn)** | 93 | 128 | **196 (−3,0%)** |
| Đợt 1 + 2, XP tăng từ Thủy quái (132/138/146) | 93 | 127 | 194 (−4,0%) |

Cơ chế riêng (server giữ luật; cảnh chỉ để xem):
- **Chó đuôi nĩa:** lần «Chơi» đầu tiên với nó mỗi ngày (giờ VN) cho mọi thú khác trong chuồng +5 tâm trạng (không tính thú hồ, không dùng mất lượt «Chơi» của con khác, vẫn theo trần cấp 160). `garden.mood.crupDay`. Trong cảnh nó chạy qua lại trước chân bác Hagrid và Fang khi cảnh đang chuyển động; cảnh đứng yên thì nó ở chuồng.
- **Nhím quậy:** «Cho ăn tất cả» và gia tinh bỏ qua nó; chỉ ăn bằng `feed {species:'knarl', hand:true}` (nút «Cho ăn tận tay» trên thẻ Nuôi), cùng giá, một chạm một bữa. Lệnh thường bị từ chối «Nhím quậy chỉ ăn khi được cho tận tay.»
- **Kỳ nhông lửa:** khi vườn cháy (`garden.fire`, «Đốt vườn» hay Rồng bỏ đói), giờ trong lửa làm tâm trạng nó tăng 1/giờ thay vì giảm; «Dập lửa» kết thúc lửa thì giảm lại như thường; đồng hồ ốm/bỏ đi của Bậc trách nhiệm tính lùi theo. Trong cảnh nó nằm cạnh món lửa đã đặt (Góc bếp, Trứng rồng Norbert bên lò sưởi, Chiếc Cốc Lửa); không có thì ở đá chỗ ở trong chuồng, không phạt.

Sửa từ đợt 1: ô kỷ vật cho Thủy quái và 3 loài mới (`KEEPSAKE_DISPLAY_LAYOUT` cột 19,5 và 2,5; server `garden-default-decor-ids.json`). Luống ven hồ là nền thật khi đặt đồ (không đặt đè luống; dời hồ thì luống cũng phải có chỗ trống) và đồ lễ hội (vạc, bí ngô) tránh hồ và luống. «Hồ sâu» (5×4) ở chỗ mặc định đè thửa 10 một hàng, nên chỗ mặc định của nó lùi xuống 1 hàng (13,5; 23); ở đó nó che một đoạn lối đi phía nam. Theo luật đặt đồ của người chơi thì không có chỗ nào cho «Hồ sâu» cùng 4 luống: cần owner chọn.

## 11. Đợt 3: luật và hợp đồng code/hình (Opus, 08/11/2026)
Owner 08/11: «Bắt đầu đợt 3 … Hình nào thiếu thì Codex vẽ». Không đổi gì dưới cấp 240, không đổi giá hay phần thưởng cũ. Mô phỏng phải giữ cấp 500 ở **ngày ≥ 196** (hiện 196, rào 3%).

### 11.1 Luật (server giữ)
| Thứ | Luật |
|---|---|
| Ma da `kappa` | cấp 240, `habitat: 'pond'` (dùng chung 2 chỗ hồ với Thủy quái, cần Ao cá), 20 bữa (6/13/20), 2 phần; **XP 120 / bữa** (thấp hơn Thủy quái 128 để không thành lối tắt). Món: `kappa_feed` 240 = 3 Dưa hổ phách + 3 Bí ngô; `kappa_fish` 242 = 3 Dưa hổ phách + 4 Cá nhỏ. Sản vật «Vảy ma da» `produce_kappa` 32 G |
| Ngựa lùn `porlock` | cấp 280, ở chuồng, 24 bữa (7/16/24), 2 phần; **XP 92 / bữa** (như Kỳ nhông lửa). `porlock_feed` 280 = 3 Yến mạch + 3 Cỏ ba lá; `porlock_apple` 282 = 3 Yến mạch + 2 Táo. «Lông bờm» `produce_porlock` 32 G. **Canh chuồng:** bữa đầu tiên của Ngựa lùn mỗi ngày VN cho Bằng-Mã, Vong mã, Kỳ lân +5 tâm trạng (`garden.mood.porlockDay`, cùng khuôn `crupDay`, theo trần cấp 160) |
| Việc bác Hagrid nhờ (mở khu, không tốn Galleons) | 3 expansion kind `edge`, cấp 260, xây như hồ (build + claimBuildings, chạy song song thửa/chuồng/hồ), **galleons 0**, phải xong bước trước: `edge_1` «Phát lối mòn» 12 giờ, 48 Đậu sao + 48 Nấm sương → bản đồ mở dải Bìa Rừng · `edge_2` «Rào bãi chăn» 24 giờ, 60 Lanh + 60 Yến mạch → mở Bãi chăn thả · `edge_3` «Ươm vườn cây» 24 giờ, 60 Hướng dương + 60 Cỏ ba lá → mở Vườn cây lâu năm |
| Bãi chăn thả | từ `edge_2`: Bằng-Mã, Vong mã, Kỳ lân, Ngựa lùn giảm tâm trạng **0,5 / giờ** thay vì 1 (chỉ là hệ số trong decay). Không đổi chỗ chuồng hay số chỗ; trong cảnh 4 loài này đi lại trong bãi |
| Vườn cây lâu năm | từ `edge_3`: 6 hố cây cố định. Cây non mua ở tiệm (tab «Cây non», cấp 260): «Cây táo non» `sapling_apple`, «Cây lê non» `sapling_pear`, «Cây mận non» `sapling_plum`, 120 G một cây (vào `garden.supplies`). Trồng vào hố trống; quả đầu sau 72 giờ, rồi cứ 72 giờ (giờ thật, không nhân tốc độ lớn, không thời tiết/luân canh/thông thạo, rào #51); hái = 4 quả, **không XP**. Quả chín không rơi, không cộng dồn vụ (chưa hái thì đồng hồ dừng). «Chặt cây» bỏ cây để trồng loại khác, không hoàn tiền. Quả: `apple` «Táo», `pear` «Lê», `plum` «Mận» — đồ trong kho, chợ 12 G (rào #50: dưới bữa rẻ nhất). `garden.orchard = { trees: [{kind, at}|null ×6] }` (`at` = lúc trồng hoặc lúc hái gần nhất) |
| Gửi | `{action:'orchard', kind}`: `plant {spot, sapling}`, `harvest` (mọi cây chín), `fell {spot}`. Snapshot: `orchard` (null khi chưa `edge_3`): `trees [{kind, readyAt, ripe}|null]`; `edge` {step 0–3} |

### 11.2 Bản đồ
- Dải Bìa Rừng là **cột 34–45** (bản đồ 34 → 46 cột khi đã có `edge_1`; chưa có thì vẫn 34, rừng phủ như cũ). Thêm cột theo chiều dương nên không tọa độ cũ nào đổi. Trên màn hình là phía phải-dưới; gọi là «Bìa Rừng Cấm» như plan.
- Bãi chăn thả: chữ nhật 10×8 ở (35, 6). Vườn cây: chữ nhật 10×8 ở (35, 18), 6 hố 2×2 ở (36,19) (39,19) (42,19) (36,22) (39,22) (42,22). Lối mòn 2 ô nối từ mép vườn cũ sang. Code được dời các số này nếu đè thứ gì, ghi lại số thật vào §11.4.
- Đồ trang trí của người chơi chưa đặt được trong dải mới ở đợt 3 (đợt 5 mới có bộ trang trí khu). Camera: kéo được tới dải mới; điện thoại giữ zoom tối thiểu hiện tại.

### 11.3 Hợp đồng hình (Codex vẽ; thiếu hình thì code vẽ bản dự phòng, không lỗi)
| Thứ | Id / đường dẫn |
|---|---|
| Sprite Ma da, Ngựa lùn (4 tuổi + idle/action/eat/care, 2 hướng; Ma da cỡ Thủy quái 96×96, Ngựa lùn cỡ Chó đuôi nĩa) | `FARM_MOTION.items` id `kappa`, `porlock`, pipeline như đợt 2 |
| Chỗ ở + tượng kỷ vật | `HABITAT_ART.kappa/porlock`, `KEEPSAKE_ART.kappa/porlock` |
| Icon 64×64 | `produce_kappa`, `produce_porlock`, `kappa_feed`, `porlock_feed`, `apple`, `pear`, `plum`, `sapling_apple`, `sapling_pear`, `sapling_plum` (đăng ký như `POND_ART`, một file `edge-art.mjs` cùng dạng, nối vào `flowArtSpec`) |
| Cây lâu năm (nền 2×2, 3 giai đoạn: non, lớn, có quả) | `garden-v05/environment/edge/tree-{apple,pear,plum}-{0,1,2}.png` |
| Nền khu | `environment/edge/pasture.png` (cỏ + hàng rào gỗ thô, nền 10×8), `environment/edge/orchard.png` (cỏ + 6 hố đất, nền 10×8), `environment/edge/trail.png` (lối mòn 2×1) |
| Icon 16×16 | `pasture`, `orchard`, `fruit` trong `pixel-icons.mjs` |
Số đo thật (canvas, pivot, tâm nền, footLift) bên hình ghi vào `edge-art.mjs` (`EDGE_SCENERY`) và bảng §11.4. File chỉ bên hình sửa / chỉ bên code sửa: như §9.

### 11.4 Số đo hình đã giao
(bên hình điền, 08/11/2026, nhánh `edge-art`.) Số đo theo pixel native, đọc trong `edge-art.mjs` (`EDGE_SCENERY`, `EDGE_ART`, `ORCHARD_PITS`) thay vì chép tay. Cây theo đúng quy ước neo chân của đồ trang trí (§6): pivot = tâm nền + (0, 32 × footLift), gốc cây đứng đúng tâm nền (y 110). **Riêng ba nền khu đặt theo ô bản đồ, không phải đồ trang trí:** nền là chữ nhật `cols × rows` ô (bãi chăn và vườn cây **10 cột × 8 hàng**, lối mòn **2 cột × 1 hàng**), vẽ ở `iso(col, row) − (pivotX, pivotY)` với (col, row) là ô góc trên-trái của chữ nhật thì `groundCentre` rơi đúng tâm chữ nhật; đáy mực chạm góc trước của nền (pivotY − 32 × footLift = height − 2). Cột chạy xuống-phải, hàng chạy xuống-trái, nên cạnh dài 10 ô là dải cột 35–44 như §11.2. `footprint` ghi `[dài, ngắn]` như `POND_SCENERY` cho khỏi lệch dạng. Chỉ có hướng mặc định (không có góc phải cho nền khu).

| Hình | File | Nền | Canvas | Pivot (chân) | Tâm nền | footLift | Khung mực |
|---|---|---|---|---|---|---|---|
| «Bãi chăn thả» | `environment/edge/pasture.png` | 10×8 | 576×314 | (288, 296) | (288, 168) | 4 | x2 y1 571×311 |
| «Vườn cây» (6 hố) | `environment/edge/orchard.png` | 10×8 | 576×314 | (288, 296) | (288, 168) | 4 | x1 y25 574×287 |
| «Lối mòn» | `environment/edge/trail.png` | 2×1 | 96×60 | (48, 50) | (48, 34) | 0,5 | x1 y11 94×47 |
| Táo non / lớn / có quả | `environment/edge/tree-apple-{0,1,2}.png` | 2×2 | 128×144 | (64, 126) | (64, 110) | 0,5 | x52 y75 24×35 / x17 y10 93×100 / x20 y10 89×100 |
| Lê non / lớn / có quả | `environment/edge/tree-pear-{0,1,2}.png` | 2×2 | 128×144 | (64, 126) | (64, 110) | 0,5 | x53 y74 23×36 / x30 y6 68×104 / x31 y6 67×104 |
| Mận non / lớn / có quả | `environment/edge/tree-plum-{0,1,2}.png` | 2×2 | 128×144 | (64, 126) | (64, 110) | 0,5 | x52 y75 24×35 / x16 y12 96×98 / x16 y12 95×98 |
| Icon item (10) | `native-items/{produce_kappa,produce_porlock,kappa_feed,porlock_feed,apple,pear,plum,sapling_apple,sapling_pear,sapling_plum}.png` | — | 64×64 | (32, 56) | — | — | ≤ 40×40, đáy hàng 56 |

- **Hố cây:** `orchard.png` có đúng 6 hố đất 2×2 ô ở độ lệch `[cột, hàng]` (1,1) (4,1) (7,1) (1,4) (4,4) (7,4) từ ô góc trên-trái, khớp §11.2 (36,19) … (42,22) khi vườn ở (35, 18); ghi trong `ORCHARD_PITS`. Tâm hố do Codex vẽ lệch tối đa vài pixel so với ô lý thuyết (đã đo ở mức master); cây đặt bằng neo tâm ô 2×2 nên không thấy lệch. Mỗi cây non/lớn/có quả cùng một gốc, cây có quả là cây lớn thêm 8 quả (viền cây không khít tuyệt đối từng pixel với bản không quả, chỉ cùng dáng).
- **Bãi chăn thả:** hàng rào gỗ thô quanh mép, cổng hở ở cạnh trước-trái, máng nước và bó cỏ khô ở góc sau; giữa để trống cho 4 loài ngựa đi lại. Ảnh vượt hình bình hành nền một chút ở cọc rào phía sau (đầu cọc cao hơn nền, y 1).
- **Sinh vật:** `FARM_MOTION.items` có `kappa` (Ma da) và `porlock` (Ngựa lùn), canvas 96×96, pivot (48, 80), 20 khung mỗi hướng như §6; con trưởng thành Ma da 52×49, Ngựa lùn 47×54 (Ngựa lùn đi thẳng hai chân hai móng như sách). `HABITAT_ART.kappa/porlock` 40×36 (mực 36×27, pivot 20,31), `KEEPSAKE_ART.kappa/porlock` 56×56 (mực 34×44 / 28×44, pivot 28,50).
- **Icon 16×16** `pasture`, `orchard`, `fruit` đã có trong `ICONS` của `pixel-icons.mjs`. Icon item 64×64 tìm thấy qua `flowArtSpec` (fallback `EDGE_ART` trong `flow-item-ui.mjs`).
- Thiếu hình thì code vẫn dùng được bản dự phòng; không có hình nào phải rơi xuống dự phòng ở bản này.

### 11.5 Số liệu đã chốt và mô phỏng
Client `challenges-160`, server HPVNN `codex/hagrid-challenges-160`. Không đổi gì dưới cấp 240, không đổi giá hay phần thưởng cũ. Số lấy từ `balance-data.mjs` và `garden-store-catalog.mjs` của bản này.

| Thứ | Số |
|---|---|
| Ma da `kappa` | cấp 240, ao cá (chung 2 chỗ hồ với Thủy quái), 20 bữa (6/13/20), 2 phần; XP 120 / bữa, 1.080 / lần nhận trưởng thành; giai đoạn 7.776 / 11.664 / 19.440. `kappa_feed` 240 = 3 Dưa hổ phách + 3 Bí ngô; `kappa_fish` 242 = 3 Dưa hổ phách + 4 Cá nhỏ. Tiệm «Thức ăn Ma da» giá gốc 360 (2 phần, tối đa 2 lần/ngày) |
| Ngựa lùn `porlock` | cấp 280, chuồng, 24 bữa (7/16/24), 2 phần; XP 92 / bữa, 828 / lần nhận; 5.962 / 8.942 / 14.904. `porlock_feed` 280 = 3 Yến mạch + 3 Cỏ ba lá; `porlock_apple` 282 = 3 Yến mạch + 2 Táo. Tiệm «Thức ăn Ngựa lùn» giá gốc 420 |
| Việc bác Hagrid nhờ | cấp 260, 0 Galleons, xong bước trước mới làm bước sau: `edge_1` 12 giờ, 48 Đậu sao + 48 Nấm sương · `edge_2` 24 giờ, 60 Lanh + 60 Yến mạch · `edge_3` 24 giờ, 60 Hướng dương + 60 Cỏ ba lá |
| Vườn cây | 6 hố từ `edge_3`; cây non «Cây táo / lê / mận non» ở tiệm, cấp 260, giá gốc 15 một cây (120 G theo §11.1), tối đa 6/ngày; quả đầu sau 72 giờ rồi cứ 72 giờ hái 4 quả, không XP. `CATALOG_VERSION garden-2026-11-08-edge-3` |

Mô phỏng (`docs/level-500-sim/runEdge.mjs` + `sim-edge.patch`, chồng lên `runCreatures.mjs`, `runPond.mjs` và các patch trước như README; bot xây `edge_1..3` ngay khi đủ cấp và cây, giữ Ma da và Ngựa lùn khi còn chỗ, trồng đủ 6 cây táo khi xong `edge_3` và hái mỗi lượt), 2 lượt/ngày (08:00, 21:00):

| Trường hợp | Cấp 200 | Cấp 300 | Cấp 500 |
|---|---|---|---|
| Không hồ, không đợt 2–3 | ngày 94 | 131 | 202 |
| Đợt 1 + 2 | 93 | 128 | 196 (−3,0%) |
| **Đợt 1 + 2 + 3 (đã chọn)** | 93 | 128 | **196 (−3,0%)** |
| Chỉ đợt 3 | 94 | 132 | 203 |

Đọc: đợt 3 giữ cấp 500 ở ngày 196, đúng rào ≥ 196 (không còn dư cho đợt sau). Bỏ Ma da hoặc bỏ Ngựa lùn thì ra ngày 197, bỏ chi phí cây của ba bước xây hay bỏ vườn cây vẫn ngày 196: mỗi con thú mới rút khoảng 1 ngày, còn lại do cây tốn ở cấp 260 bù lại; Thủy quái và Ma da vừa đủ 2 chỗ hồ nên không phải chọn giữa chúng. Quả táo không cho XP, chỉ thay một phần Cỏ ba lá của khẩu phần Ngựa lùn.

## 12. Hồ to trên đất «Bờ hồ» (owner 08/11/2026)

Owner: «mấy cái hồ nên to nó mới đã, ko nên cùng size với vườn», «làm nó hắc ám tí», chọn dời hồ sang đất mới. Hồ 3 bậc thành 5×4 / 7×5 / 9×6 (trước 3×2 / 4×3 / 5×4), quay ngang (ảnh lật), đặt cố định trên đất «Bờ hồ» phía nam rào, cột 11,5–27,5 × hàng 33,5–41,5 (`POND_LAND`, mở khi có pond_1); góc đông nam bản đồ nằm ngoài khung 2560×1440 nên không dùng được. Luống ven hồ phía tây hồ. Ao trang trí cũ giữ 3×2 ở chỗ cũ, server `scene:pond` về 3×2. Người chơi không đặt đồ trên đất hồ. Hình: Codex vẽ lại tối, u ám (`docs/codex-briefs/pond-art-03.md`). Chuồng mở rộng 8–9 dời từ cột 22 sang 21,5 cho cách cột chuồng chính đúng 1 ô.
