# Khu Vườn Hagrid 25.0 — «Noel của gia tinh»

> **Trạng thái:** ĐÃ DUYỆT 04/11/2026 (chủ dự án: «Duyệt cả ba» — giá, tương tác thú, rủi ro bỏ bê; kế hoạch chung đã trình cùng ngày) · Claude Code (Anthropic)
> Gốc: Hagrid `main` @ 0e9e8c5 (24.9.96, đang chạy production), HPVNN `codex/production` @ f622322c5.
> Mục «Mặc định» là đề xuất của Claude chưa được trả lời riêng; chủ dự án đổi được trước khi làm phần đó.

## 1. Đích

- **Đợt 1 — 01/12/2026:** S1–S6 và chương 1 Giáng sinh. Trứng rồng giao từ 01/12, ấp 21 ngày, nở trong Dạ Vũ Noel.
- **Đợt 2 — 10/12/2026:** chương 2–5, mở theo ngày bằng `season`/`opensAt` sẵn có.
- S1 (giá) độc lập, phát hành sớm khi xong.
- Bản Tết 25.1: 6 loài bậc Tận Sức (chuồng 7–9), Lớp học bác Hagrid, Sổ tay sinh vật.

Cắt nếu trễ, theo thứ tự: chương 5 → S6 còn 4 nhân vật (Harry, Ron, Hermione, Neville) → trứng nở vào Tết.

## 2. Các phần (một phiên mỗi phần, tự chuyển phiên khi gần 250k context)

| # | Phần | Nội dung | Codex | Phụ thuộc |
|---|---|---|---|---|
| S0 | Nền móng | Số liệu gốc (phân bố cấp, quay lại D1/D7, Galleons); ngân sách tốc độ (LCP điện thoại < 8 s, ảnh lễ hội chỉ tải khi mùa mở); script chạy Codex tự chờ hết giới hạn; tra Lý Lan mọi tên mới (§7) | 0 | — |
| S1 | Giá cửa hàng | §3; mở bán 30 sản phẩm đặc biệt (`SPECIAL_PRICES_APPROVED`, server `forSale`) theo giá §3 | 0 | — |
| S2 | Gia tinh làm chủ đạo | **Phần 1 xong 04/11/2026** (nét Dobby duyệt «OK»): Dobby, Winky, 2 gia tinh bếp đi vòng làm việc (tưới, quét tuyết, khiêng giỏ), đêm ngủ cạnh lều, chạm → reo mừng + một câu; ảnh v3 chi tiết (owner chưa ưng bản khối, 04/11) thu nhỏ theo diện tích bằng `build-elf-art.mjs`, gia tinh cao 52–60 px; Lighthouse `qa-v19/s2-lighthouse.json` LCP 14.295 ms, 4.318.381 B. **Còn phần 2:** gia tinh trông vườn, công thức đan mũ/tất, Lều gia tinh, Góc bếp (thiết kế trong ghi chú S2). Dobby, Winky, 2 gia tinh bếp Hogwarts đi lại, quét tuyết, tưới, khiêng giỏ, ngủ cạnh lò; **Gia tinh trông vườn** (§5); Hermione đan mũ/tất len (công thức chế biến mới) để trả công; Lều gia tinh, Góc bếp | ~6 | S0 |
| S3 | Mùa đông thật + bộ lông hiếm | Tuyết, sương mù, hồ băng, hơi thở, đèn đêm đông; code phủ tuyết mép trên cho mọi ảnh sẵn có (màu `#D6D8BF`/`#B7DEE0`); Codex chỉ vẽ lều phủ tuyết, hồ băng, rừng đông. Tuyết trên nền: thử trước bằng bộ vẽ mảng ngẫu nhiên sẵn có (`meadow-ground.mjs`) với màu tuyết; nếu mép tuyết–cỏ trông giả thì Codex vẽ **bộ 16 Wang góc** (cỏ/tuyết, ô 64×32) và code chọn ô theo độ dày tuyết ở 4 góc mỗi ô, tuyết dày dần theo số ngày tuyết rơi Bộ lông hiếm (đông, bạc, Noel) = đổi màu trong bảng 32 màu bằng code, chỉ để trang điểm | ~5 | S0 |
| S4 | Đàn thú: tâm trạng và tương tác | §4; tính cách mùa đông từng loài; **rồng con Norbert là bạn đồng hành** (loài Rồng cấp 94 đã có, Norbert không cho Vảy Rồng) | ~8 | S0 |
| S5 | Bậc trách nhiệm (cấp ≥ 130) | §5; khung Floo mỗi 10 cấp (việc còn treo của P3 `level-500-roadmap.md`) | ~2 | S2, S4 |
| S6 | Harry và bạn bè ghé vườn | Harry–Ron bay chổi chuyền Quaffle, Hermione đọc sách/đan mũ, Neville chăm Nhân sâm, Luna cho vong mã ăn, Ginny ném tuyết, Fred–George pháo hoa; chạm → một câu + quà nhỏ có trần ngày. Pixel chibi theo sách, **không giống mặt diễn viên** | ~10 | S0 |
| S7 | Chuỗi sự kiện Giáng sinh | §6; bộ sản phẩm đặc biệt Noel cho bậc Tận Sức (việc còn treo của P3) | ~10 | S2, S6 |
| S8 | Kiểm thử, phát hành | Mô phỏng cân bằng, đủ test, 3026 `--lan`, iPhone thật, hai đợt | — | tất cả |

Codex: khoảng 50 tấm, mỗi tấm 6 món, mức `medium`. Mỗi phần chạy thử 1 tấm trước; tấm đầu của S2 (Dobby) và S6 (Harry) chờ chủ dự án duyệt nét nhân vật. Quy trình: brief theo art bible và `grid-fit-guideline.md` → masters → builder sẵn có → `build-runtime-webp.mjs` → `verify-image-assets.mjs`, `audit-grid-fit.mjs` → Claude soát và trả lại record Codex sửa nhầm → chủ dự án duyệt trên `qa-v19/art-gallery.html`.

## 3. Giá cửa hàng (S1)

Thu nhập 30 ngày tới 04/11/2026 (`docs/galleons-income.sh`): trung vị 32.430 G/thành viên/ngày (đa số từ `manual_reward`), tự chơi trung vị 101 G/ngày; dòng Khu vườn chi `garden_build` 28.560 G cả tháng.

- **Giá mới = giá cũ × min(8, 3 + cấp mở món / 50)**, làm tròn: < 100 G tới 1 G, < 1.000 G tới 10 G, còn lại tới 100 G.
- Đồ lễ hội (`FESTIVAL_PRODUCTS`, đều cấp 1): **× 4** cố định.
- Hạt và nước có cấp mở ≤ 24: **giữ giá cũ** (người mới chưa có Quầy chợ).
- Áp cho cả danh mục server (nguồn sự thật) và bản sao client, đổi `CATALOG_VERSION`. Sale và ACP bảng giá áp trên giá mới. Quầy chợ không sửa: giá bán đã tính theo giá hạt.
- «Xả kho» (bán cả kho một lần, vượt trần): **giữ giá chợ mới** (owner 04/11/2026). Ai trữ cây cấp > 24 trồng bằng hạt giá cũ được thêm 5–14 G mỗi cây khi xả; không làm đường giá cũ riêng.

| Món | Cấp | Cũ | Mới |
|---|---|---|---|
| Nến lơ lửng | 16 | 360 | 1.200 |
| Nón Phân Loại trên ghế | 25 | 1.400 | 4.900 |
| Phúc Lạc Dược | 40 | 3.000 | 11.400 |
| Mưa suối thần | 50 | 6.300 | 25.200 |
| Xe Đò Hiệp Sĩ | 84 | 7.800 | 36.500 |
| Ổ ấm chuồng 6 | 86 | 15.000 | 70.800 |
| Hạt Bẫy Quỷ | 450 | 6 | 48 |
| Cây cổ thụ treo đèn (lễ hội) | 1 | 7.200 | 28.800 |

## 4. Đàn thú: thang tâm trạng (S4)

Mỗi con có tâm trạng 0–100. Cho ăn, chơi, chải lông làm tăng; tâm trạng cao thì nhiều sản phẩm hơn và ra bộ lông hiếm nhanh hơn. Mỗi tương tác tính một lần mỗi con mỗi chu kỳ.

| Tương tác | Ghi chú |
|---|---|
| Chơi đồ chơi | Đào mỏ – đồ lấp lánh, Kneazle – cuộn len, Chó ba đầu – thổi sáo cho ngủ (HP1) |
| Chải lông, tắm | Điều kiện ra bộ lông hiếm |
| Dạy trò | 3 trò mỗi loài qua nhiều ngày; biểu diễn khi có người thăm vườn (Bằng-Mã cúi chào, Fwooper hót, Puffskein lăn) |
| Thả rông 1 giờ | Ra nguyên liệu, không ra Galleons, có trần ngày |
| Cưỡi bay qua vườn | Bằng-Mã, vong mã; mở khi gắn bó tối đa |
| Khám bệnh | Thuốc chế từ nông sản hoặc Thuốc Mọc Xương |

Tính cách mùa đông: Đào mỏ trộm đồ trên cây thông nhà (chạm đòi lại → điểm lễ hội), Puffskein lăn thành cục tuyết, Kneazle sưởi cạnh lò, Fwooper hót Noel, vong mã chỉ hiện rõ khi Luna ghé, kỳ lân để dấu chân bạc.

Không làm: sinh sản (chuồng 2 chỗ, mở đường nhân thú bán lấy Galleons).

## 5. Bậc trách nhiệm từ cấp 130 (S5)

Sửa luật «không phạt khi vắng mặt» của `core-design.md` §1: luật cũ giữ cho cấp 1–129. Khi chạm cấp 130 bác Hagrid gửi thư báo trước. **Thú không bao giờ chết, đồ đã mua không bao giờ mất.** Mọi đồng hồ tính trên server; đồng hồ tới hậu quả luôn hiện rõ.

| Vườn | Hậu quả |
|---|---|
| Cây chín quá 24 giờ | Héo, thu hoạch −50% (hình héo bằng code giảm màu) |
| Quá 48 giờ | Chết khô, mất hạt, phải dọn thửa |
| Không vào vườn quá 24 giờ | Cỏ dại; ma lùm ăn trộm nông sản chín, người chơi tóm quăng ra (HP2, «dọn dẹp ma lùm ma bụi») |

| Tâm trạng thú | Hậu quả |
|---|---|
| < 50 | Sản phẩm −50% |
| < 25 | Ốm, ngừng sản phẩm, phải chữa |
| 0 suốt 24 giờ | Bỏ vào Rừng Cấm; dụ về cần mồi và 1 ngày |
| Rồng bị bỏ đói | Phun lửa đốt vườn, dùng cơ chế đốt vườn và «Dập lửa · N G» sẵn có |

Đỡ cho người chơi:
- **Gia tinh trông vườn:** tối đa **6 việc/ngày** (mặc định) cho ăn hoặc gặt hộ, trả công bằng mũ/tất len làm từ việc chơi.
- **«Nhờ bác Hagrid trông vườn»:** tối đa 7 ngày mỗi 30 ngày; trong lúc nghỉ vườn dừng cả héo lẫn lớn.
- **Cảnh báo:** thư cú trong game và dấu ở biểu tượng Game Zone, tối đa 1 lần/ngày; không gửi thông báo đẩy (ngân sách đọc Firestore).

## 6. Chuỗi sự kiện Giáng sinh (S7)

| Chương | Ngày | Nội dung | Thưởng |
|---|---|---|---|
| 1. Gia tinh đón đông | 01–10/12 | Dobby đến vườn; lịch Mùa Vọng: mỗi ngày mở một chiếc tất trên lò sưởi kèm việc nhỏ cho gia tinh | Đủ 10 tất → Lều gia tinh |
| 2. Trận ném tuyết | 11–17/12 | Harry, Ron, Hermione, Ginny; chạm để ném, 3 lượt/ngày; điểm vào nhà | Áo len bà Weasley có chữ cái đầu tên, làm khung Floo |
| 3. Dạ Vũ Noel | 18–31/12 | Lễ hội sẵn có; cây thông chung của mỗi nhà lớn dần, tính vào House Cup; 12 đồ trang trí giới hạn | Cây thông nhà vô địch |
| 4. Đêm Noel | 24–25/12 | Bác Hagrid vác 12 cây thông qua vườn; gia tinh dọn tiệc | Quà bí mật kèm thư bác Hagrid |
| 5. Pháo hoa Giao thừa | 31/12 | Fred và George bắn pháo hoa trên trời đêm | Khung Floo «2027» |

Trứng rồng: giao miễn phí qua chuỗi thư cú (mặc định), ấp 21 ngày trong lò sưởi, ủ lửa có trần ngày, 4 giai đoạn nứt, nở thành Norbert bạn đồng hành.

## 7. Tên cần tra Lý Lan (S0, `resource/FullHP`)

Đã tra 04/11/2026 (S0) trong `HP1_VN.txt` … `HP7_VN.txt`, khớp chữ hoa/thường; số là số lần xuất hiện. Cả 19 mục đều có trong 7 cuốn.

| Mục | Chữ của Lý Lan (dùng trong game) | Sách · số lần | Ghi chú |
|---|---|---|---|
| house-elf | **gia tinh** | HP2 45 · HP3 2 · HP4 146 · HP5 99 · HP6 47 · HP7 101 | đầu câu «Gia tinh» (HP4 8, HP5 5, HP6 1) |
| Dobby | **Dobby** | HP2 154 · HP4 203 · HP5 70 · HP6 39 · HP7 49 | HP2 có chỗ gọi Dobby là «con quỷ lùn»: không dùng cách gọi đó |
| Winky | **Winky** | HP4 188 · HP5 5 | |
| Kreacher | **Kreacher** | HP5 119 · HP6 60 · HP7 143 | |
| S.P.E.W. | **H.V.Đ.C.Q.L.G.T** = **Hội Vận động cho Quyền lợi Gia tinh** | viết tắt HP4 12 · HP6 1; tên đủ HP4 1 · HP5 2 | Ron đọc chệch là «Hột Vịt Đẹt» (HP4) |
| Norbert | **Norbert** | HP1 18 · HP3 2 · HP4 2 · HP5 2 · HP7 5 | HP7: đổi tên «Norberta» |
| Norwegian Ridgeback | **Hắc long Na Uy** | HP1 1 | ba cách dịch: HP4 «rồng Na Uy loại Lưng nhô» (1), HP7 «rồng Lưng gai Na Uy» (1); chọn HP1, cuốn của Norbert |
| Fang | **Fang**, «con Fang» | Fang: HP1 18 · HP2 33 · HP3 7 · HP4 16 · HP5 18 · HP6 12 · HP7 7 | «con chó săn đen khổng lồ» (HP1) |
| garden gnome | **ma lùm** | HP2 21 · HP4 6 | khử gnome = «dọn dẹp ma lùm ma bụi» (HP2). HP6–7 lại gọi «quỷ lùn» (21), nhưng «quỷ lùn» còn chỉ Dobby (HP2), Chỏm Đỏ (HP3), leprechaun (HP4): game dùng «ma lùm» |
| Neville | **Neville** | HP1 131 · HP2 35 · HP3 121 · HP4 90 · HP5 299 · HP6 74 · HP7 97 | |
| Luna | **Luna** | HP5 158 · HP6 59 · HP7 150 | |
| Ginny | **Ginny** | HP1 5 · HP2 154 · HP3 19 · HP4 48 · HP5 244 · HP6 245 · HP7 135 | |
| Fred | **Fred** | HP1 35 · HP2 107 · HP3 83 · HP4 203 · HP5 339 · HP6 83 · HP7 95 | |
| George | **George** | HP1 32 · HP2 97 · HP3 69 · HP4 168 · HP5 294 · HP6 63 · HP7 78 | |
| Quaffle | **trái Quaffle** | HP1 2 · HP2 1 · HP3 12 · HP4 11 · HP5 32 · HP6 6 | «quả Quaffle» chỉ 1 lần (HP1) |
| Weasley sweater | **áo ấm Weasley** (HP1 2); **áo len đan tay của bà Weasley** (HP2 1) | «áo ấm» HP1 8 · HP2 2 · HP7 4; «áo len» 30 lần ở cả 7 cuốn | tên món: «Áo len bà Weasley» khớp HP2 |
| Blast-Ended Skrewt | **Quái Tôm Đuôi Nổ** (gọn: «Quái Tôm») | HP4 19 · HP5 1 · HP6 1 · HP7 1; «Quái Tôm» HP4 69 | không phải «Quái tôm nổ đuôi» |
| Beauxbatons winged horses | **ngựa có cánh khổng lồ của bà [Maxime]**, «ngựa bay» | HP4: mỗi cách 1 | sách không có tên giống (Abraxan chỉ ở HP5 bản Anh); «ngựa có cánh dơi» (HP5) là vong mã, đừng lẫn |
| phoenix | **phượng hoàng** (con của cụ Dumbledore: **Fawkes**) | HP1 2 · HP2 22 · HP4 16 · HP5 16 · HP6 11 · HP7 16; Fawkes HP2 31 · HP4 9 · HP5 14 · HP6 9 · HP7 2 | «Hội Phượng Hoàng» là tên riêng khác |
| Aragog | **Aragog** | HP2 19 · HP5 2 · HP6 26 · HP7 3 | |

Tra lại: `python3 -I` đếm chuỗi trong `resource/FullHP/HP*_VN.txt` (ugrep hỏng với regex tiếng Việt dài).

## 8. Rào chắn (nối tiếp `produce-market-plan.md` #32)

| # | Đường lách | Rào chắn |
|---|---|---|
| 33 | Gia tinh trông vườn thành bot | 6 việc/ngày; công trả bằng mũ/tất chỉ có từ việc chơi |
| 34 | Nghỉ phép để lợi | Vườn dừng lớn khi nghỉ; ≤ 7 ngày/30 ngày, tính trên server |
| 35 | Thả rông ra Galleons | Chỉ ra nguyên liệu, trần ngày |
| 36 | Quà nhân vật ghé vườn, ném tuyết | Trần ngày trên server, `requestId` idempotent |
| 37 | Cây thông nhà bị bơm điểm | Trần điểm mỗi thành viên mỗi ngày; bộ đếm chia mảnh, theo skill ngân sách đọc |
| 38 | Bơm tâm trạng bằng thao tác lặp | Mỗi tương tác một lần mỗi con mỗi chu kỳ |
| 39 | Bộ lông hiếm có lợi kinh tế | Chỉ để trang điểm |
| 40 | Dụ thú về, chữa bệnh | Chi bằng mồi hoặc Galleons theo cấp: là chỗ hút Galleons, không phải nguồn |

Gộp ngày 04/11/2026 (chủ dự án «Ok»): ba việc còn treo của kế hoạch cấp 500 vào S1, S5, S7 như bảng §2.

## 9. Mặc định chưa được trả lời riêng

- Phát hành 2 đợt (01/12 và 10/12).
- Trứng rồng miễn phí qua nhiệm vụ.
- Gia tinh trông vườn 6 việc/ngày; 4 gia tinh, chưa có Kreacher.
- 6 loài bậc Tận Sức vào bản Tết 25.1.

## 10. Ngân sách tốc độ (S0, 04/11/2026)

**Đo:** `node qa-v19/art-flow-lighthouse.mjs garden-v05 qa-v19/<phần>-lighthouse.json` — Lighthouse 13.5, điện thoại 375 px, mạng chậm giả lập, fixture cấp 500 đủ chuồng, mọi request trả từ file cục bộ (không nén, không server), trung vị 3 lần. Chạy một mình: lượt đầu khi máy bận ra LCP 18,4 s.

| | Điểm | FCP | LCP | Tải trước khung đầu |
|---|---|---|---|---|
| 26/10 (`art-flow-20261026.md`) | 50 | 9.330 ms | 13.200 ms | 5.468.946 B |
| S0 trước (`qa-v19/s0-lighthouse-before.json`) | 49 | 9.975 ms | 14.235 ms | 4.629.071 B |
| S0 sau tải trễ ảnh lễ hội (`s0-lighthouse-after.json`) | 51 | 9.975 ms | 14.235 ms | **4.293.276 B** (−7,3 %) |

**Đã làm:** `createGarden` không chờ ảnh lễ hội trước khung đầu nữa (3 hero lễ hội và 30 món `collection: 'festival'`, 107 ảnh, ~336 KB). Ảnh tải lần đầu nó được vẽ: khi lễ hội đang mở, hoặc khi thành viên đã đặt món đó (đồ đã mua vẫn hiện sau mùa, trễ một khung 100 ms). Test: `garden-v05/festival-lazy-art.test.mjs`.

**Vì sao LCP chưa giảm:** LCP là dock gieo trồng, bị chặn bởi chuỗi tải trước khi vẽ: 14 file CSS (~250 KB) và 8 script dữ liệu thường (~620 KB, riêng `level-assets.js` 357 KB ≈ 4,5 s) rồi ~90 module. Thử trễ cả 353 ảnh đồ cửa hàng chưa đặt: tải giảm còn 3,74 MB nhưng LCP vẫn 14.235 ms, nên ảnh không phải nút thắt. Fixture không nén (Firebase Hosting nén JS/CSS), nên số tuyệt đối là cận trên. Fixture cũng nạp hai bản một số module (`qa-v19/fixture-wallet.mjs` còn tem `?v=24.9.40/63/81`); chỉ ảnh hưởng fixture.

**Ngân sách 25.0:**

1. **Không lùi (mỗi phần S2–S7):** LCP fixture trung vị ≤ 14.300 ms; tải trước khung đầu ≤ 4.400.000 B. Phần nào vượt thì sửa trước khi commit.
2. **Ảnh theo mùa không tải ngoài mùa:** mọi ảnh mới của lễ hội, Giáng sinh, mùa đông (S3 lều tuyết, hồ băng, rừng đông; S7 cây thông, tất, áo len) và nhân vật chỉ đến theo sự kiện (S6) đi vào `deferredFiles` trong `createGarden` (gắn `collection: 'festival'`, hoặc mở rộng điều kiện ở đó), và `festival-lazy-art.test.mjs` thêm khẳng định cho bộ đó. Dobby/gia tinh thường trực (S2) không thuộc diện này nhưng tính vào mục 1.
3. **Đích LCP < 8 s trên điện thoại:** chưa đạt (fixture 14,2 s). Cần một lát việc riêng cắt chuỗi chặn vẽ (gộp CSS, nạp script dữ liệu sau khung đầu hoặc chuyển thành JSON lấy khi cần), đo lại bằng fixture. S8 đo thêm trên iPhone thật qua `run-hpvnn-local.sh --lan` (mở lạnh tới khi hiện dock) và ghi cả hai số.
4. **Tem `?v=`:** mọi import trong `garden-v05` mang tem phiên bản hiện tại, cùng một tem cho một module. Kiểm: `rg -n "from ['\"]\./[^?'\"]+\.mjs['\"]" garden-v05 -g '!*.test.mjs' -g '!build-*'` chỉ còn công cụ CLI (`playtest-summary.mjs`).

Mỗi phần ghi vào báo cáo của mình: dòng Lighthouse (điểm, FCP, LCP, byte) cạnh số S0, và kết quả `node --test *.test.mjs`.
