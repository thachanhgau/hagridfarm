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
| S1 | Giá cửa hàng | §3 | 0 | — |
| S2 | Gia tinh làm chủ đạo | Dobby, Winky, 2 gia tinh bếp Hogwarts đi lại, quét tuyết, tưới, khiêng giỏ, ngủ cạnh lò; **Gia tinh trông vườn** (§5); Hermione đan mũ/tất len (công thức chế biến mới) để trả công; Lều gia tinh, Góc bếp | ~6 | S0 |
| S3 | Mùa đông thật + bộ lông hiếm | Tuyết, sương mù, hồ băng, hơi thở, đèn đêm đông; code phủ tuyết mép trên cho mọi ảnh sẵn có (màu `#D6D8BF`/`#B7DEE0`); Codex chỉ vẽ lều phủ tuyết, hồ băng, rừng đông. Bộ lông hiếm (đông, bạc, Noel) = đổi màu trong bảng 32 màu bằng code, chỉ để trang điểm | ~5 | S0 |
| S4 | Đàn thú: tâm trạng và tương tác | §4; tính cách mùa đông từng loài; **rồng con Norbert là bạn đồng hành** (loài Rồng cấp 94 đã có, Norbert không cho Vảy Rồng) | ~8 | S0 |
| S5 | Bậc trách nhiệm (cấp ≥ 130) | §5 | ~2 | S2, S4 |
| S6 | Harry và bạn bè ghé vườn | Harry–Ron bay chổi chuyền Quaffle, Hermione đọc sách/đan mũ, Neville chăm Nhân sâm, Luna cho vong mã ăn, Ginny ném tuyết, Fred–George pháo hoa; chạm → một câu + quà nhỏ có trần ngày. Pixel chibi theo sách, **không giống mặt diễn viên** | ~10 | S0 |
| S7 | Chuỗi sự kiện Giáng sinh | §6 | ~10 | S2, S6 |
| S8 | Kiểm thử, phát hành | Mô phỏng cân bằng, đủ test, 3026 `--lan`, iPhone thật, hai đợt | — | tất cả |

Codex: khoảng 50 tấm, mỗi tấm 6 món, mức `medium`. Mỗi phần chạy thử 1 tấm trước; tấm đầu của S2 (Dobby) và S6 (Harry) chờ chủ dự án duyệt nét nhân vật. Quy trình: brief theo art bible và `grid-fit-guideline.md` → masters → builder sẵn có → `build-runtime-webp.mjs` → `verify-image-assets.mjs`, `audit-grid-fit.mjs` → Claude soát và trả lại record Codex sửa nhầm → chủ dự án duyệt trên `qa-v19/art-gallery.html`.

## 3. Giá cửa hàng (S1)

Thu nhập 30 ngày tới 04/11/2026 (`docs/galleons-income.sh`): trung vị 32.430 G/thành viên/ngày (đa số từ `manual_reward`), tự chơi trung vị 101 G/ngày; dòng Khu vườn chi `garden_build` 28.560 G cả tháng.

- **Giá mới = giá cũ × min(8, 3 + cấp mở món / 50)**, làm tròn: < 100 G tới 1 G, < 1.000 G tới 10 G, còn lại tới 100 G.
- Đồ lễ hội (`FESTIVAL_PRODUCTS`, đều cấp 1): **× 4** cố định.
- Hạt và nước có cấp mở ≤ 24: **giữ giá cũ** (người mới chưa có Quầy chợ).
- Áp cho cả danh mục server (nguồn sự thật) và bản sao client, đổi `CATALOG_VERSION`. Sale và ACP bảng giá áp trên giá mới. Quầy chợ không sửa: giá bán đã tính theo giá hạt.

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
| Không vào vườn quá 24 giờ | Cỏ dại; quỷ lùn ăn trộm nông sản chín, người chơi tóm quăng ra (HP2) |

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

gia tinh, Dobby, Winky, Kreacher, tên hội S.P.E.W., Norbert và giống rồng Na Uy, Fang, quỷ lùn (khử quỷ lùn HP2), Neville, Luna, Ginny, Fred, George, Quaffle, áo len bà Weasley, Quái tôm nổ đuôi, ngựa có cánh Beauxbatons, phượng hoàng, Aragog.

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

## 9. Mặc định chưa được trả lời riêng

- Phát hành 2 đợt (01/12 và 10/12).
- Trứng rồng miễn phí qua nhiệm vụ.
- Gia tinh trông vườn 6 việc/ngày; 4 gia tinh, chưa có Kreacher.
- 6 loài bậc Tận Sức vào bản Tết 25.1.
