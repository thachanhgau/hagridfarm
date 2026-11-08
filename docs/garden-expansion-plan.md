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

File chỉ bên hình sửa: `pixel-icons.mjs`, `pond-art.mjs`, `flow-item-ui.mjs`, manifest và data của sprite sinh vật. File chỉ bên code sửa: `balance-data*`, engine, UI, `scene-renderer.mjs`, fixture, server.

## 7. Đợt 1: phía client (nhánh `challenges-160`, 08/11/2026)
- **Đọc từ server:** `snapshot.pond` (null dưới cấp 130): `tier`, `lots` (fry, readyAt, ripe), `beds` (3 ô: species, readyAt, ripe), `bedCrops`, `murky`, `fry` {carp, goldfish}, `cast` {today, token}, `creatureSpots`; `garden.supplies.fryCarp/fryGoldfish`; `serverNow` (đồng hồ cho câu cá). Bậc hồ trong cảnh lấy từ `built` (pond_1..3), nên vườn bạn bè cũng thấy hồ.
- **Gửi:** `{action:'pond', kind}` với `stock {lot, fry}`, `net`, `plant {bed, cells, species}`, `harvest`, `clean`, `castStart`, `cast {tapMs}`; đào/nâng hồ là `build` pond_1..3 + `claimBuildings`. Lỗi `cast-running` thì dùng lại `details.token`.
- **Giao diện:** nút «Hồ» trên thanh công cụ (chỉ khi có `pond`), khay `#pondDock` (`garden-pond-ui.mjs`): Kéo lưới · Vớt rêu (khi đục) · Câu cá; ô ao với chọn cá giống; luống với chọn cây nước; dòng Thủy quái mở khay Nuôi. Bậc 0: «Đào ao» = pond_1. Chạm hồ trong cảnh mở khay «Hồ». Cửa hàng có tab «Cá giống».
- **Hình code đọc** (`POND_SCENERY` trong `garden-pond-ui.mjs`, cùng số với `pond-art.mjs`): `environment/pond/pond-{1,2,3}.png` (vẽ tại iso(col,row) − pivot), `environment/pond/pond-bed.png` (luống 1×3, phía tây hồ). Chỉ tải sau khi đã ghép nhánh hình (nhận biết qua `flowArtSpec('goldfish')`), để không có lỗi 404; test so với `runtime-webp-manifest.json`. Thiếu hình: `environment/layers/pond.png` phóng theo bậc (×1 / ×1,4 / ×1,8), luống vẽ bằng ô nước viền gỗ, Thủy quái vẽ bằng khối pixel nếu chưa có sprite. Icon `pond`, `net`, `rod`, `algae` (thiếu thì `water`, `harvest`, `quill`, `tired`); icon vật phẩm qua `itemArtKey`/`itemArtSpec` (thiếu thì icon pixel).
- **QA:** `qa-v19/ui-fixture.html?wallet=emulator&level=140|210&simulate=1[&murky=1]`.
