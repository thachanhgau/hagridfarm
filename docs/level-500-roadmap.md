# Khu Vườn Hagrid — Lộ trình cấp 500, tốc độ và cửa hàng cao cấp

> 21/10/2026 · Claude Code (Anthropic) · **ĐÃ DUYỆT 21/10/2026.** P1 đã phát hành 21/10/2026. P2 đã làm (nhánh `level-500-p2`, HPVNN `codex/hagrid-level-p2`), chưa deploy; khung Floo theo 10 cấp chuyển sang P3 cùng hình pixel. P3–P5 chưa làm (mục 13). Mọi số liệu đến từ mô phỏng trên engine thật
> (`docs/level-500-sim/`), không phải dữ liệu người chơi. Mục 14 là các điểm còn chờ chủ dự án quyết.

## 0. Chủ dự án đã chốt (21/10/2026)

1. Nâng trần cấp lên **500**; cấp 101–500 **chỉ hiện khi đã đạt cấp 100**.
2. **Cấp 500 trong tối đa 1 năm**, mốc tính cho người chơi đều đặn 2 lượt/ngày.
3. Rút thời gian cây, cho **sinh vật lớn nhanh hơn**, rà lại các hỗ trợ tăng tốc.
4. Mô phỏng người cày 20–30 lượt/ngày; **thêm việc cho người cày** thay vì chặn họ.
5. Bán **vật phẩm giá cao** giúp tăng nhanh (cả cho sinh vật), chạy **flash sale**, bán **gói số lượng lớn có giảm giá**.
6. Mọi giao dịch dùng **Galleons của diễn đàn** (ví HPVNN, không có tiền thật).

## 1. Hiện trạng (balance-2026-10-18)

| Hạng mục | Hiện tại |
|---|---|
| Cấp | 1–100, tổng 4.450.020 XP. Server chặn `level > 100` (`garden-validators.mjs:225`, `garden-wallet-core.js:107,296`) |
| Cây | 24 loại: 2h, 4h, 6h (nhiều nhất), 14h, 20h |
| Sinh vật | 12 loài, mỗi bữa 6h, 6–36 bữa để trưởng thành (Rồng 36 bữa = 18 ngày nếu vào 2 lượt/ngày) |
| Thửa / chuồng | 12 thửa (thửa 12 ở cấp 100), 6 chuồng, 12 sinh vật |
| Nhịp (bot không lỡ lượt) | Cấp 100 ngày 203 (3 lượt/ngày), 228 (2 lượt/ngày); tốn ≈ 159.000 G |
| Tăng tốc đang có | Người mới ×0,1–0,5 dưới cấp 20 (cây, bữa ăn, chế biến, xây); Chăm cây −15 phút, 3 lần/ngày; Nước phép −10% một hàng, 60 G; Nước suối thần cả thửa chín và gặt ngay (có XP), 500 G, cấp 30, 10 chai/ngày |

Vấn đề chính:
- Cây 14h/20h lệch với nhịp 2–3 lượt/ngày.
- Cuối game rất chậm (cấp 90→100 mất 39 ngày).
- Cây ngắn luôn thua cây dài, cả theo XP mỗi lần gặt lẫn XP mỗi giờ.
- Nước phép −10% gần như vô nghĩa.
- Sinh vật, chế biến và công trình không có hỗ trợ nào sau cấp 19.

## 2. So sánh với các game lớn

| Game | Luật | Áp dụng |
|---|---|---|
| Hay Day (Supercell) | Lúa mì 2 phút. Từ cấp 50, mỗi cấp cần thêm +11.000 XP; từ cấp 500 là +20.000. Người chơi đã lên quá cấp 1000. Mở đất cần Land Deed, Mallet, Marker Stake rơi ngẫu nhiên, và người chơi phàn nàn vì hiếm | Đường XP tuyến tính sau cấp cao; **không** khóa mở rộng bằng đồ rơi ngẫu nhiên |
| Hay Day Derby | Đội thi theo tuần, 12 nhiệm vụ mỗi người, toàn việc làm hằng ngày | Cúp Nhà theo mùa |
| Township (Playrix) | 381 lần mở rộng; chi phí xu + dân số + dụng cụ, thêm dần theo tầng | Chi phí mở rộng thêm thành phần theo tầng |
| Stardew Valley | Speed-Gro −10/−25/−33%, cộng dồn với nghề. Bản 1.6 có Mastery sau cấp tối đa, mỗi bậc một phần thưởng | Thưởng sau cấp tối đa là tiện ích và danh tiếng |
| FarmVille 2 | Thông thạo cây: 3 dải băng, dải đầu tặng biển trang trí | Thông thạo cây cho người cày |
| Diablo 3 Paragon | Cấp vô hạn, khung đổi mỗi 10 cấp, người khác nhìn thấy; bị chê vì sức mạnh tăng mãi | Khung Floo mỗi 10 cấp; không cộng sức mạnh vô hạn |

Mốc giữ chân người chơi (GameAnalytics, dữ liệu 2025): trung vị D1 22%, D7 4%, D30 0,7%; nhóm 10% tốt nhất 40/12/4%. Đặt ngưỡng riêng sau khi có số liệu beta.

## 3. Nhịp mục tiêu và kết quả mô phỏng

Bộ số đầy đủ: mục 4–8, giá hạt tối đa 2 G. Người thật được ước bằng bot chia 0,6. Đây là giả định cũ của `progression-sim.md`, cần kiểm lại khi có playtest.

| Mốc (ngày) | 1 lượt | **2 lượt** | 3 lượt | Cày 20 lượt (07–23h) | Cày 30 lượt (06–24h) | Cày 30 lượt cả đêm |
|---|---|---|---|---|---|---|
| Cấp 100 | ≈105 | **51** | 36 | 27 | 23 | 19 |
| Cấp 200 | ≈192 | **94** | 70 | 61 | 50 | 42 |
| Cấp 300 | — | **131** | 101 | 92 | 75 | 63 |
| Cấp 500 | ≈409 | **203** | 161 | 154 | 126 | 105 |
| G/ngày (tháng 4+) | ≈370 | ≈820 | ≈1.230 | ≈900 | ≈1.100 | ≈1.300 |

- Người thật 2 lượt/ngày: cấp 100 sau khoảng 3 tháng, **cấp 500 sau khoảng 11 tháng**.
- Người 1 lượt/ngày: khoảng 13,5 tháng nếu chơi hoàn hảo. Số của cột 1 lượt chạy trước khi giảm bữa ăn sinh vật, nên có thể sớm hơn 1–2 ngày.
- Cày nhiều chỉ nhanh tối đa khoảng 2 lần, vì thời gian lớn của cây là sàn tự nhiên.
- Tổng Galleons tới cấp 500 ở mọi kiểu chơi ≈ 134.000–143.000 G.
- **Trần XP theo ngày bị loại:** trần 2× phạt người 2 lượt (cấp 500 lùi sang ngày 225), trần 3× gần như không kìm được người cày.

## 4. Đường XP 1–500

| Đoạn | Công thức |
|---|---|
| Cấp 1–20 | Giữ nguyên |
| Cấp 21–99 | Tăng hình học từ 5.360 (cấp 20) lên 40.000 (cấp 99) |
| Cấp 100–499 | `40.000 + 110 × (L − 99)` |

| Cấp | XP cần (cũ) | XP cần (mới) | Tổng tới cấp (mới) | Tổng cũ |
|---|---|---|---|---|
| 30 | 10.460 | 6.913 | 103.332 | 119.770 |
| 50 | 31.410 | 11.499 | 281.292 | 487.640 |
| 70 | 60.480 | 19.126 | 577.303 | 1.366.700 |
| 90 | 118.370 | 31.814 | 1.069.676 | 3.080.430 |
| 99 | 153.050 | 40.000 | 1.387.360 | 4.296.970 |
| 100 | — | 40.110 | 1.427.360 | 4.450.020 |
| 200 | — | 51.110 | 5.982.860 | — |
| 300 | — | 62.110 | 11.638.360 | — |
| 400 | — | 73.110 | 18.393.860 | — |
| 500 | — | (trần) | 26.249.360 | — |

Cấp sau luôn cần nhiều XP hơn cấp trước. Bảng đủ 500 dòng: `docs/level-500-sim/levels-500.csv`.

## 5. Cây

Thời gian: 2h→1h, 4h→2h, 6h→3h, 14h→6h, 20h→8h. XP cộng thêm cho cây ngắn: 1h ×1,5, 2h ×1,4, 3h ×1,4, 6h ×1,2, 8h ×1. Kết quả:
- **Cây ngắn hơn một chút tính theo XP mỗi giờ:** thưởng người vào game thường xuyên.
- **Cây dài hơn hẳn tính theo XP mỗi lần gặt:** người vào ít gieo cây 8h qua đêm mà không thiệt.

| Cây | Cấp | Cũ | Mới | Dưới cấp 20 | XP mỗi ô | XP/giờ (cũ → mới) |
|---|---|---|---|---|---|---|
| Bí ngô | 1 | 2h | 1h | 6 phút | 12 → 18 | 6,0 → 18,0 |
| Cúc trắng | 2 | 4h | 2h | 12 phút | 24 → 34 | 6,0 → 17,0 |
| Dâu tây | 4 | 4h | 2h | 12 phút | 25 → 35 | 6,3 → 17,5 |
| Yến mạch | 6 | 6h | 3h | 36 phút | 51 → 71 | 8,5 → 23,7 |
| Cà rốt | 8 | 4h | 2h | 24 phút | 26 → 36 | 6,5 → 18,0 |
| Xà lách | 12 | 6h | 3h | 54 phút | 55 → 77 | 9,2 → 25,7 |
| Bạch tiễn | 16 | 6h | 3h | 1,5h | 58 → 81 | 9,7 → 27,0 |
| Puffapod | 20 | 6h | 3h | — | 61 → 85 | 10,2 → 28,3 |
| Nhân sâm | 24 | 14h | 6h | — | 127 → 152 | 9,1 → 25,3 |
| Cỏ ba lá | 28 | 6h | 3h | — | 66 → 92 | 11,0 → 30,7 |
| Củ cải đỏ | 32 | 6h | 3h | — | 69 → 97 | 11,5 → 32,3 |
| Ngô vàng | 36 | 6h | 3h | — | 72 → 101 | 12,0 → 33,7 |
| Cỏ trăng | 40 | 14h | 6h | — | 148 → 178 | 10,6 → 29,7 |
| Lanh | 44 | 6h | 3h | — | 77 → 108 | 12,8 → 36,0 |
| Hướng dương | 48 | 6h | 3h | — | 80 → 112 | 13,3 → 37,3 |
| Nữ lang | 52 | 14h | 6h | — | 165 → 198 | 11,8 → 33,0 |
| Bạc hà | 56 | 6h | 3h | — | 85 → 119 | 14,2 → 39,7 |
| Việt quất | 60 | 14h | 6h | — | 175 → 210 | 12,5 → 35,0 |
| Ớt lửa | 64 | 6h | 3h | — | 90 → 126 | 15,0 → 42,0 |
| Tảo bạc | 68 | 14h | 6h | — | 186 → 223 | 13,3 → 37,2 |
| Đậu sao | 72 | 6h | 3h | — | 96 → 134 | 16,0 → 44,7 |
| Dưa hổ phách | 78 | 20h | 8h | — | 299 | 14,9 → 37,4 |
| Nấm sương | 84 | 20h | 8h | — | 311 | 15,6 → 38,9 |
| Hoa nhật quang | 92 | 20h | 8h | — | 327 | 16,4 → 40,9 |

**Tám cây cho cấp 101–500.** Tên theo bản dịch Lý Lan, đã đối chiếu `resource/FullHP` ngày 21/10/2026; chưa có hình.

| Cấp | Cây (Lý Lan) | Bản gốc | Bằng chứng | Thời gian | XP mỗi ô |
|---|---|---|---|---|---|
| 105 | Rong nước xiết | fluxweed | HP2 («rong nước xiết phải được hái vào đêm trăng tròn») | 3h | 185 |
| 130 | Củ u | Bubotuber | HP4 («Củ u. Phải vắt tụi nó… thu hoạch mủ») | 8h | 410 |
| 160 | Cỏ chút chít | knotgrass | HP2 | 3h | 226 |
| 200 | Sung-quéo | shrivelfig | HP3 («lột vỏ trái Sung-quéo») | 8h | 503 |
| 250 | Cỏ mang cá | Gillyweed | HP4, 9 lần | 3h | 272 |
| 310 | Mimbulus mimbletonia | Mimbulus mimbletonia | HP5, 8 lần | 8h | 605 |
| 380 | Bông-đòng-đưa | Flitterbloom | HP5 | 3h | 322 |
| 450 | Bẫy Quỷ | Devil's Snare | HP1–HP5, 7 lần | 8h | 716 |

Các tên dự phòng đã kiểm: cây mũ thầy tu / bả chó sói / cây phụ tử (HP1), ngải tây (HP1), phong lữ có răng nanh (HP5), phân rồng (HP2, HP5). Không dùng «lan nhật quang» (asphodel) vì dễ nhầm với Hoa nhật quang đang có.

Cây 3h được tính bằng 45% XP của cây 8h cùng tầng. Mô phỏng đang dùng cây 3h ở mức 120/148/178/210 XP. Bot 2 lượt/ngày gần như chỉ trồng cây 8h nên nhịp không đổi; người cày sẽ nhanh hơn một chút, cần chạy lại khi làm P3.

**Chạy lại với P3 (21/10/2026, cây và thửa thật trong game, `run500.mjs` không thêm cây giả nữa):**

| Kiểu chơi | Cấp 100 | Cấp 200 | Cấp 300 | Cấp 500 | G/ngày tháng 4 | Tổng G tới cấp 500 | Thửa 13 / 18 mở |
|---|---|---|---|---|---|---|---|
| 2 lượt (08:00, 21:00) | 51 | 94 | 131 | **202** | 822 | 138.043 | ngày 57 / 143 |
| Cày 20 lượt (07–23h) | 27 | 55 | 81 | **135** | 2.031 | 232.518 | ngày 32 / 91 |
| Cày 30 lượt (07–23h) | 27 | 56 | 82 | 136 | 2.028 | 233.453 | ngày 32 / 91 |

- Người 2 lượt/ngày không đổi (203 → 202).
- Người cày nhanh hơn khoảng 12% (154 → 135) vì cây 3h mới là lựa chọn nhiều XP/giờ nhất, nhưng tiêu gần gấp đôi Galleons cho hạt: khoảng 2.000 G/ngày, cao hơn thu nhập trung vị 772 G/ngày. Hết Galleons thì họ chậm lại, nên không cần chặn thêm. Bot không bị giới hạn Galleons, nên con số 135 là mức nhanh nhất có thể.

## 6. Sinh vật và chế biến

Mỗi bữa ăn 6h → 3h; **số bữa để trưởng thành giảm một nửa** (mốc giai đoạn cũng chia đôi, XP mỗi mốc giữ nguyên). Mẻ chế biến có hẹn giờ (côn trùng, cá) 6h → 3h.

| Sinh vật | Cấp | Cũ | Mới (mốc giai đoạn) | Ngày tới trưởng thành, 2 lượt/ngày (cũ → mới) | 3 lượt/ngày |
|---|---|---|---|---|---|
| Puffskein | 10 | 6 × 6h | 3 × 3h (1/2/3) | 3 → 1,5 | 1 |
| Que Xạo | 18 | 9 × 6h | 5 × 3h (2/3/5) | 4,5 → 2,5 | 1,7 |
| Đào mỏ, Mooncalf, Kneazle, Diricawl | 26–50 | 12 × 6h | 6 × 3h (2/4/6) | 6 → 3 | 2 |
| Fwooper, Bằng-Mã, Vong mã, Kỳ lân | 58–82 | 30 × 6h | 15 × 3h (4/10/15) | 15 → 7,5 | 5 |
| Chó ba đầu, Rồng | 90–94 | 36 × 6h | 18 × 3h (5/12/18) | 18 → 9 | 6 |

Chỉ rút bữa ăn còn 3h thì người 2 lượt/ngày không thấy khác gì. Phải **giảm nửa số bữa** thì người vào ít mới thấy sinh vật lớn nhanh. XP chủ yếu đến từ cây, nên thay đổi này chỉ dời mốc cấp 500 khoảng 2–5 ngày.

## 7. Mở rộng vườn

- Thửa 4–12 và chuồng 1–6 giữ chi phí cũ (mở sớm hơn nhiều vì lên cấp nhanh hơn: thửa 12 ở ngày 63 thay vì 230, với 2 lượt/ngày).
- Thêm 6 thửa cho cấp 101+, dồn vào đầu dải:

| Thửa | Cấp | Nông sản (P3, 21/10/2026) | Galleons | Mở vào, mô phỏng P3 (2 lượt / cày 20 lượt) |
|---|---|---|---|---|
| 13 | 110 | 30 Hoa nhật quang + 48 Rong nước xiết | 800 | ngày 57 / 32 |
| 14 | 130 | 36 Củ u + 54 Rong nước xiết | 1.000 | 67 / 37 |
| 15 | 160 | 42 Củ u + 60 Cỏ chút chít | 1.200 | 79 / 46 |
| 16 | 200 | 48 Sung-quéo + 66 Cỏ chút chít | 1.400 | 96 / 57 |
| 17 | 260 | 54 Sung-quéo + 72 Cỏ mang cá | 1.600 | 117 / 72 |
| 18 | 330 | 60 Mimbulus mimbletonia + 78 Cỏ mang cá | 1.800 | 143 / 91 |

Mỗi thửa xây 24 giờ. Trên bản đồ, sáu thửa nằm một hàng ở bìa nam (hàng 28,5), hai bên lối chính, trong giai đoạn vườn thứ 7 «Cánh đồng Tận Sức» (mở ở cấp 110). Ao, lối đi và sân kỷ vật giữ nguyên.

## 8. Galleons cho vòng chơi chính

- **Giá hạt tối đa 2 G/hạt.** Quyết định A1 ngày 18/10/2026 giữ giá vì nhịp cũ chậm; nhịp nhanh làm số lần gieo mỗi ngày tăng, nên đổi sang trần giá. Kết quả cho người 2 lượt/ngày: 163 / 481 / 749 / 817 G/ngày ở tháng 1 / 2 / 4 / 7, ngang thu nhập trung vị của diễn đàn (772 G/ngày). Tổng tới cấp 500 ≈ 141.500 G; với trần 3 G là 189.300 G.
- Nước tưới giữ 5 G / 9.
- **Không giảm giá hạt và nước khi sale**, để vòng chơi chính công bằng cho mọi người.

## 9. Hỗ trợ tăng tốc thường (miễn phí hoặc giá thấp)

| Hỗ trợ | Đề xuất |
|---|---|
| Tăng tốc người mới | Giữ (×0,1–0,5 dưới cấp 20, áp cho cây, bữa ăn, chế biến, xây) |
| Chăm cây (miễn phí, 3 lần/ngày) | −15 phút → **−25% thời gian một hàng** |
| Vuốt ve (miễn phí, 3 lần/ngày) | Thêm: sinh vật đang ăn được **−25% bữa** |
| Nước phép (60 G, 10 lần dùng/ngày) | −10% → **−25%**; dùng cho **một hàng cây, một bữa sinh vật hoặc một mẻ chế biến**. Chỉ một loại chai, không thêm bậc (giữ đúng 4 loại tài nguyên) |
| Nước suối thần (500 G, cấp 30) | Giữ hiệu lực và 10 chai/ngày, nhưng đổi thành **giới hạn dùng**; thêm cách dùng: **xây xong ngay một công trình** |

Với người 2 lượt/ngày, các hỗ trợ giảm % không thêm XP, vì cây đã chín trước lượt sau. Chúng giúp người vào nhiều lượt bắt thêm một lần gặt.

## 10. Cửa hàng cao cấp (Galleons diễn đàn)

### 10.1 Mô phỏng

| Vật phẩm thử | 2 lượt | Cày 20 | Cày 30 |
|---|---|---|---|
| Không dùng gì | 203 | 154 | 126 |
| Thuốc nhân XP ×1,5 trong 2h, 1 lần/ngày | 163 | 153 | 122 |
| Thuốc nhân XP ×2 trong 3h, 1 lần/ngày | 136 | 143 | 119 |
| Cả vườn chín ngay, 1 lần/ngày (≈ 7.200 G/ngày) | 138 | 118 | 113 |
| Cả vườn chín ngay, 2 lần/ngày (≈ 13.300 G/ngày) | — | — | 109 |

- Thuốc nhân XP theo giờ giúp người vào ít nhiều hơn người cày.
- Vật phẩm **thêm lượt gặt** mới giúp người cày.
- Tiêu mạnh tay nhất thì cấp 500 vẫn không sớm hơn khoảng **3,5 tháng**.

### 10.2 Danh mục

Tên lấy từ truyện thì theo Lý Lan (đã đối chiếu). Tên còn lại là tiếng Việt mô tả, không gắn với tên riêng trong truyện.

| Nhóm | Vật phẩm | Hiệu lực | Giá | Giới hạn dùng | Cấp |
|---|---|---|---|---|---|
| Cây | Nước suối thần (đang có) | 1 thửa chín và gặt ngay | 500 G | 10/ngày | 30 |
| Cây | **Mưa suối thần** | Cả vườn chín và gặt ngay | **6.300 G cố định** (không tính theo số thửa: xem 10.5) | 1/ngày; từ cấp 101: 2/ngày | 50 |
| Cây | **Phúc Lạc Dược** (Felix Felicis, HP6, 31 lần trong bản dịch) | XP ×1,5 trong 2 giờ, phần thưởng thêm tối đa bằng 50% XP cần của cấp hiện tại | 3.000 G | 1/ngày, không cộng dồn | 40 |
| Sinh vật | **Bữa ăn thượng hạng** | 1 sinh vật xong bữa ngay | 120 G | 30/ngày | 10 |
| Sinh vật | **Tiệc chuồng** | Mọi sinh vật xong bữa ngay | 900 G | 3/ngày | 26 |
| Sinh vật | **Thuốc Mọc Xương** (Skele-Gro, HP2) | Tính thêm 3 bữa vào tiến trình trưởng thành (không cho sản vật) | 400 G | 3 chai/sinh vật/ngày | 18 |
| Sinh vật | **Ổ ấm** (vĩnh viễn) | Bữa ăn của chuồng đó nhanh hơn 20% | Chuồng 1–6: 5.000 / 7.000 / 9.000 / 11.000 / 13.000 / 15.000 G | 1 lần mỗi chuồng | Theo chuồng |
| Trang trí | Sản phẩm đặc biệt (30 món, giá chờ duyệt) và bộ mới cho các mốc 110/150/200/300/400/500 | Chỉ trang trí | **Sàn 500 G mỗi món** (chủ dự án, 21/10/2026); bảng hiện tại 1.400–9.000 G | Sở hữu 1 lần | 25+ |

Ước tính tay cho vật phẩm sinh vật (chưa mô phỏng):
- Tiệc chuồng cho khoảng 7.800 XP mỗi lần; 3 lần/ngày ≈ +7% XP với người cày ở cấp 200.
- Rồng cần 6 chai Thuốc Mọc Xương (2.400 G) để trưởng thành ngay.

### 10.3 Flash sale

Dùng lại hệ «đợt sale» của Hẻm Xéo (`functions/galleons/gringotts-pricing-core.js`). Hệ này đã có sẵn giảm theo % hoặc đồng giá, phạm vi tất cả / nhóm / món, giờ bắt đầu và kết thúc, giảm 1–90%, tối đa 50 đợt, và ghi nhật ký admin. Cần cho `garden-wallet-catalog.js` đọc thêm tài liệu giá này.

| Loại | Thời điểm | Giảm | Hàng |
|---|---|---|---|
| Giờ vàng | 20:00–22:00 hằng ngày | −20% | Vật phẩm cây cao cấp |
| Flash 30 phút | Ngẫu nhiên 1–2 lần/tuần, báo trên Floo | −30% | Mưa suối thần, Tiệc chuồng |
| Cuối tuần sinh vật | Thứ Bảy, Chủ Nhật | −25% | Vật phẩm sinh vật, Ổ ấm |
| Lễ hội | Theo lịch lễ | −20–40% | Đồ và gói lễ hội |

Luật:
- Giảm tối đa 40% cho vật phẩm cao cấp; không giảm hạt và nước.
- Giá tính trên server **lúc giao dịch**.
- Đồng hồ đếm ngược phải đúng thật; không dùng chiêu «sắp hết hàng» giả.

### 10.4 Gói mua nhiều

×5 giảm 10%, ×10 giảm 20%, ×30 giảm 30%, áp cho vật phẩm dùng một lần. Cộng dồn với sale nhưng tổng giảm tối đa **50%**.

| Đường lách | Cách chặn (server giữ) |
|---|---|
| Mua gói lớn lúc sale rồi dùng mãi giá rẻ | Giới hạn **dùng** mỗi ngày, cộng **trần tồn kho** (ví dụ Suối thần 60 chai, Mưa suối thần 10, Tiệc chuồng 30). Không bán gói vượt trần |
| Cộng sale với gói | Tổng giảm tối đa 50% |
| Tài khoản phụ mua hộ | Vật phẩm gắn tài khoản, không có API tặng hay đổi giữa vườn |
| Nhiều tab mua cùng lúc | Giao dịch idempotent theo `requestId`; đếm trong cùng giao dịch |
| Nhiều tab dùng cùng lúc | Đếm số lần dùng theo ngày giờ Việt Nam, trong cùng giao dịch với lệnh dùng |

Hiện `dailyLimit` là **giới hạn mua**. Phải đổi sang giới hạn dùng **trước khi** bán gói.

### 10.5 Rào chắn trục lợi (bắt buộc trước khi mở bán)

Nguyên tắc: **mọi giới hạn do server giữ**, đếm trong cùng giao dịch với lệnh mua hoặc dùng. Ngày tính theo giờ Việt Nam.
Mỗi rào chắn phải có một test làm hỏng được nó (test thất bại khi bỏ rào).

| # | Đường trục lợi | Rào chắn |
|---|---|---|
| 1 | Sửa đồng hồ máy để cây chín sớm | Server giữ đồng hồ (`logicalNow`). Máy khách chỉ hiển thị |
| 2 | Gửi lại một lệnh, mở nhiều tab | Mỗi lệnh có `requestId` idempotent và `revision`; lệnh trùng hoặc cũ bị từ chối |
| 3 | Mua gói lớn lúc sale để dùng mãi | Giới hạn **dùng** mỗi ngày; **trần tồn kho** mỗi món (Nước suối thần 60, Mưa suối thần 10, Phúc Lạc Dược 10, Bữa ăn thượng hạng 150, Tiệc chuồng 30, Thuốc Mọc Xương 60). Không bán gói vượt trần |
| 4 | Cộng sale với gói để giảm quá sâu | Tổng giảm tối đa 50%; sale riêng tối đa 40%; không sale hạt và nước |
| 5 | Mua lúc sale sắp hết giờ | Giá tính trên server lúc giao dịch; hết giờ là hết giá sale |
| 6 | Admin đặt nhầm giảm 90% | Với hàng vườn cao cấp, server từ chối mức giảm trên 40%; nhật ký admin như Hẻm Xéo |
| 7 | **Mua Mưa suối thần lúc ít thửa (rẻ), dùng lúc nhiều thửa** | Giá **cố định 6.300 G**, không tính theo số thửa; chỉ mở từ cấp 50 |
| 8 | **Để vườn chín chờ, uống Phúc Lạc Dược rồi gặt một lần cả vườn** (cây không héo) | XP thưởng thêm của mỗi lọ có trần: tối đa 50% XP cần của cấp hiện tại. XP từ Nước suối thần và Mưa suối thần **không** được nhân |
| 9 | Phúc Lạc Dược cộng Mưa suối thần hai lần trong 2 giờ | Như mục 8; mỗi lọ chỉ có hiệu lực 1 lần/ngày, không cộng dồn |
| 10 | Thuốc Mọc Xương lấy XP giai đoạn rồi thả sinh vật, nuôi lại | Game không có lệnh thả sinh vật (`GARDEN_ACTIONS` không có `release`). XP giai đoạn chỉ nhận một lần cho mỗi sinh vật. Nếu sau này thêm lệnh thả, phải giữ cờ đã nhận theo loài |
| 11 | Bữa ăn thượng hạng / Tiệc chuồng nhận XP mà không cho ăn | Chỉ rút ngắn bữa **đang ăn**: vẫn phải tốn khẩu phần như thường |
| 12 | Nước suối thần dùng để xây ngay mà bỏ qua chi phí | Chỉ rút thời gian; nông sản và Galleons vẫn trừ lúc bắt đầu xây |
| 13 | Tài khoản phụ nuôi hộ, chuyển đồ | Không có API tặng hoặc đổi nông sản, vật phẩm, sinh vật giữa các vườn. Vật phẩm gắn tài khoản |
| 14 | Tài khoản phụ kiếm Galleons (điểm danh, vòng quay) rồi chuyển cho tài khoản chính | Ngoài phạm vi khu vườn: dựa vào lớp chống tài khoản phụ của diễn đàn (`wheel-gift-guard.js`, sổ cái). Theo dõi chi tiêu vườn bất thường trong báo cáo BigQuery |
| 15 | Tài khoản phụ kéo hạng Cúp Nhà | Thưởng xếp hạng chỉ là danh hiệu và trang trí; tính điểm chỉ từ việc chơi có trần mỗi ngày (như điểm lễ hội); yêu cầu tài khoản có hoạt động diễn đàn |
| 16 | Đơn hàng bác Hagrid: trồng cây rẻ rồi đổi lấy XP lớn | XP của đơn ≤ tổng XP gặt của chính số nông sản đó; thưởng Nước phép có trần mỗi ngày |
| 17 | Trồng cây rẻ rồi dùng Nước suối thần cho rẻ | Không phải lỗ hổng: XP nhận được vẫn theo cây; trồng cây rẻ thì nhận ít XP |
| 18 | Đổi múi giờ để có hai «ngày» | Ngày tính trên server theo giờ Việt Nam |
| 19 | Thêm tính năng bán nông sản lấy Galleons sau này | Hạt rẻ (tối đa 2 G) sẽ thành máy in Galleons. Không thêm việc bán nông sản nếu chưa rà lại toàn bảng này |
| 20 | Sale hoặc giá sai đã trừ tiền | Mua và trừ Galleons trong một giao dịch; lỗi thì không trừ. Không có hoàn tiền tay ngoài admin |

Phải chạy lại ma trận test tài chính (`test:galleons-matrix`, emulator) và thêm test cho các mục 3–12 trước khi phát hành P4.

## 11. Việc cho người cày và giữ chân người chơi

| Việc | Nội dung |
|---|---|
| Thông thạo cây | 3 bậc cho mỗi cây trong 32 loại; đủ cả bộ mất 6–12 tháng; thưởng biển, danh hiệu, khung Floo |
| Đơn hàng bác Hagrid (kiểu xe hàng Hay Day, tàu Township) | Bảng đơn tiêu nhiều nông sản và sản vật; thưởng XP, Nước phép, điểm sưu tập |
| Cúp Nhà theo mùa (kiểu Derby) | Xếp theo việc chơi trong tuần hoặc tháng, không theo tổng cấp; nhiệm vụ là việc chơi bình thường |
| Sưu tập sau cấp 100 | Sản phẩm đặc biệt mới, sản vật hiếm |
| Huy hiệu Floo | Khung mỗi 10 cấp, sao ★ mỗi 50 cấp, huy hiệu cấp 500 |
| Giữ nguyên | Nhiệm vụ cú 3/ngày, lễ hội theo lịch, không phạt khi vắng mặt |

Thưởng sau cấp 100 **không tăng sản lượng hay XP mãi mãi**: chỉ danh tiếng, trang trí và vật phẩm tiêu hao.

## 12. Ẩn cấp trên 100 và chuyển dữ liệu

- **Trước cấp 100:**
  - Giao diện vẫn ghi «/100».
  - Thành tựu «Cấp 100/100» giữ nguyên.
  - Server không gửi thông tin cấp trên 100 cho người dưới cấp 100.
- **Khi đạt cấp 100:**
  - Thư bác Hagrid mở **bậc Tận Sức** (cấp 101–500).
  - Vòng cấp đổi sang dạng «Cấp 100 ★1».
  - Cửa hàng hiện các món cấp 101+.
- **Đổi đường XP:** cấp được tính lại từ XP đang có. Vườn hiện tại có thể nhảy cấp, nhưng chủ dự án xác nhận chưa ai tới cấp 100 nên không cần xử lý riêng.
- **Cây đang trồng:** validator từ chối `growMs` khác balance. Cần một bước chuyển: cây cũ chín theo thời gian mới, `plantedAt` giữ nguyên.
- **Sinh vật đang lớn:** sinh vật đã ăn quá số bữa mới thì trưởng thành ngay, nhận XP các mốc đã vượt.
- `balanceVersion` mới, đổi `CATALOG_VERSION`. Prototype và server phải khớp (test parity).

## 13. Lộ trình triển khai

| Giai đoạn | Nội dung | Nơi sửa | Điều kiện xong |
|---|---|---|---|
| **P0** | Chủ dự án duyệt tài liệu này và mục 14 | — | Có quyết định |
| **P1 – Cân bằng 1–100** | Thời gian và XP cây; sinh vật và chế biến; giá hạt tối đa 2 G; Chăm cây, Vuốt ve, Nước phép mới; bước chuyển cây và sinh vật đang lớn | Prototype `balance-data`, `garden-store-catalog`, `progression-engine`; HPVNN `garden-model/garden-balance.mjs`, `garden-action-core.js`, `garden-wallet-catalog.js` | Test prototype và functions pass; parity; mô phỏng khớp mục 3; xem trên 3026 (375px và desktop) |
| **P2 – Cấp 101–500** | Đường XP mới; mở trần 500 ở validator và ví; ẩn trên 100; màn mở khóa; ★ và khung Floo | Như P1, thêm HUD, Hồ sơ, Floo | Test; xem trên 3026 |
| **P3 – Nội dung sau 100** | 8 cây mới (tên Lý Lan, hình), thửa 13–18, bộ sản phẩm đặc biệt mới | Prototype và server, hình pixel | Mô phỏng lại với cây 3h ở mức 45% (**đã làm 21/10/2026**, mục 5; hình cây đang là hình tạm, prompt cho Codex ở `garden-v05/level-asset-sources.json` nhóm crops-g/h/i; khung Floo và bộ sản phẩm đặc biệt mới chưa làm) |
| **P4 – Cửa hàng cao cấp** | Đổi giới hạn mua sang giới hạn dùng và trần tồn kho; 7 vật phẩm mục 10.2; đọc đợt sale Hẻm Xéo; gói ×5/×10/×30 | `garden-wallet-core.js`, `garden-wallet-catalog.js`, `garden-action-core.js`, cửa hàng prototype | Test tài chính (ma trận Galleons) pass; rà đủ đường lách mục 10.4 |
| **P5 – Giữ chân** | Thông thạo cây, Đơn hàng bác Hagrid, Cúp Nhà theo mùa | Prototype và server | Đo D1/D7/D30 sau beta |

Phát hành theo `/hpvnn-deploy`, Functions trước, client sau, và chỉ khi chủ dự án bảo.

## 14. Quyết định ngày 21/10/2026 và việc còn mở

| # | Nội dung | Kết quả |
|---|---|---|
| 1 | Người đã ở cấp 100 / vườn nhảy cấp khi đổi đường XP | **Không quan trọng**: chưa ai tới cấp 100. Cấp được tính lại từ XP đang có, không cần chuyển dữ liệu riêng |
| 2 | Tên | **Theo Lý Lan.** Dải 101–500 là **«bậc Tận Sức»** (N.E.W.T., «Kiểm tra Pháp thuật Tận Sức», HP3–HP6); cấp 1–100 tương ứng «Thường Đẳng» (O.W.L.). 8 cây ở mục 5. Vật phẩm: Phúc Lạc Dược, Thuốc Mọc Xương |
| 3 | Phúc Lạc Dược (trước gọi tạm «Bùa may mắn») | **Giữ, giữ tên Phúc Lạc Dược**, với trần ở mục 10.5 |
| 4 | Giới hạn và trục lợi | **Có giới hạn, rào hết đường trục lợi**: mục 10.5 |
| 5 | Giá sản phẩm đặc biệt | **Sàn 500 G mỗi món.** Bảng hiện tại 1.400–9.000 G đã đạt; server nên từ chối món đặc biệt dưới 500 G |
| 6 | Tăng tốc người mới hết ở cấp 20 (thành viên tara thấy cây «đổi giờ» khi lên cấp 20) | **Giữ ×0,5 mãi từ cấp 15** (cây, bữa ăn, chế biến, xây). Mô phỏng: người 2 lượt/ngày không đổi (cấp 500 ngày 202); người cày 20 lượt nhanh gấp đôi (ngày 135 → 68) và tiêu khoảng 4.000 G/ngày cho hạt. Chủ dự án chọn ngày 21/10/2026 sau khi xem số này |

Việc còn mở: chủ dự án duyệt giá từng món (`special-products-pricing.md`, `SPECIAL_PRICES_APPROVED = false`).

## 15. Giới hạn của mô phỏng

- Bot vào đúng giờ, cách đều nhau, không bao giờ lỡ lượt. Hệ số 0,6 giữa người thật và bot là giả định.
- Bot chưa dùng: tăng tốc người mới, Chăm cây, Vuốt ve, Nước phép, vật phẩm sinh vật, lễ hội, nhiệm vụ. Nhịp thật ở đầu game sẽ nhanh hơn.
- Cây và thửa sau cấp 100 là số nháp, chưa có hình.
- Thu nhập Galleons (p50 772 G/ngày) mới đo trên 14 ngày sổ cái. Đo lại khoảng 01/12/2026 bằng `docs/galleons-income.sh 60`.

## Nguồn

- Hay Day Wiki: [Experience](https://hayday.fandom.com/wiki/Experience), [Levels 76–100](https://hayday.fandom.com/wiki/Experience_Levels/Levels_76-100), [Marker Stake](https://hayday.fandom.com/wiki/Marker_Stake); [phàn nàn về đồ mở rộng](https://www.sikayetvar.com/en/hay-day-us/hay-day-expansion-items-too-hard-to-find-ruining-the-game); [SuperCheats](https://www.supercheats.com/hay-day/walkthrough/list-of-resources); Derby: [Sportskeeda](https://www.sportskeeda.com/esports/5-tips-completing-hayday-s-derby-event), [GameNGuide](https://www.gamenguide.com/articles/21857/20150312/hay-day-update-neighborhood-derby-adds-weekly-challenges-and-other-improvements-video.htm)
- Township Wiki: [Expansions](https://township.fandom.com/wiki/Expansions), [Community Buildings](https://township.fandom.com/wiki/Community_Buildings)
- Stardew Valley Wiki: [Speed-Gro](https://stardewvalleywiki.com/Speed-Gro), [Deluxe](https://stardewvalleywiki.com/Deluxe_Speed-Gro), [Hyper](https://stardewvalleywiki.com/Hyper_Speed-Gro); [Mastery – Prima Games](https://primagames.com/gaming/stardew-valley-mastery-system-explained)
- [FarmVille 2 Crop Mastery – AOL](https://www.aol.com/2012-09-06-farmville-2-crop-mastery.html)
- Diablo 3 Paragon: [Gamebanshee](https://gamebanshee.com/w994), [diễn đàn Blizzard](https://us.forums.blizzard.com/en/d3/t/please-no-infinite-scaling-in-d4/7883)
- [GameAnalytics benchmarks 2026](https://gamedevreports.substack.com/p/gameanalytics-mobile-and-pc-game)
