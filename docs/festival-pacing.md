# Nhịp lễ hội — Khu Vườn Hagrid

Phase 3, mục 4 trong `economy-audit.md`. Ngày đo: 18/10/2026, trên nhánh `phase3-festival-pacing` (gốc `1d4e2f7`).
Số liệu sinh bằng `cd garden-v05 && node sim-progression.mjs festival`: bot chơi engine thật, gieo mọi hàng trống mỗi lượt (giống `progression-sim.md`).

## 1. Kết luận ngắn

- **Lễ hội chưa có lịch.** Người chơi tự chọn một trong 3 lễ hội bất cứ lúc nào, cả 3 mở song song và không bao giờ đóng. Cũng không có độ dài lễ hội.
- **Mốc quá thấp so với lượng điểm kiếm được.** Người chơi mới, 3 lượt/ngày, kiếm khoảng 500 điểm/ngày, trong khi mốc cao nhất là 150. Họ xong cả 3 mốc ngay **trong lượt chơi thứ 2 của ngày đầu**. Người chơi nhẹ (1 lượt/ngày) xong vào ngày 2.
- **Cả 9 mốc của 3 lễ hội** (tổng 450 điểm) xong trong 1–3 ngày, vì đổi lễ hội là miễn phí. Sau đó phần lễ hội không còn phần thưởng nào.
- **Điểm tăng theo quy mô vườn**, không theo việc có ghé chơi hay không: cấp 60 kiếm gấp 2,5 lần cấp 1, và 3 lượt/ngày kiếm gấp 3,5 lần 1 lượt/ngày.
- **Đã sửa 2 lỗi trong code** (mục 6): nút «Chăm cây» và lệnh «Chuyển» thửa/chuồng cho điểm lễ hội miễn phí, không giới hạn.
- **Đề xuất khởi điểm:** mỗi lễ hội kéo dài 14 ngày theo lịch thật, mốc 100 / 450 / 1000, điểm từ việc vườn tối đa 60/ngày, thao tác miễn phí tối đa 20/ngày. Theo mô phỏng, người chơi thường xong mốc 3 vào ngày 8–9, người chơi nhẹ vào ngày 9–12.

## 2. Hiện trạng cơ chế

### 2.1 Lịch và độ dài

| Hạng mục | Hiện trạng (code) |
|---|---|
| Cách bật lễ hội | Người chơi chọn trong bảng Lễ hội (`selectEvent` / `applyEventTheme` trong `mobile-game.mjs`). Có thể ép bằng tham số `?event=`. |
| Lịch thật | **Không có.** Không có mã nào đọc ngày tháng để mở hoặc đóng lễ hội. |
| Độ dài | **Không giới hạn.** Điểm của mỗi lễ hội (`pointsByEvent`) được giữ mãi. |
| Số lễ hội | 3: «Đêm Hội Bí Ngô Rừng Cấm», «Dạ Vũ Noel Hogwarts», «Hội Chợ Thảo Dược & Sinh Vật». Ngoài ra có «Ngày thường», không có mốc. |
| Mốc | Cả 3 lễ hội đều có mốc 30 / 75 / 150, mỗi mốc nhận một lần (`claimedMilestones`). |
| Điểm tặng sẵn | Save mới có sẵn 35 điểm cho Bí ngô (`loadEventState` mặc định), nên mốc 1 nhận được ngay khi vào game. |
| Điểm thuộc lễ hội nào | Thuộc lễ hội đang bật lúc làm thao tác (V24.9). Đổi lễ hội không chuyển điểm sang. |

### 2.2 Nguồn điểm

Điểm được tính **theo lệnh trên giao diện, không theo số ô**: gieo một hàng 3 ô được 10 điểm, «Gặt tất cả» được 15 điểm dù gặt bao nhiêu cây.

| Nguồn | Điểm | Giới hạn |
|---|---|---|
| Gieo một hàng (`plant`) | 10 | Không. Bị chặn bởi hạt, nước và thời gian lớn. |
| Gieo lại cả thửa (`replant`) | 12 | Không |
| Gặt (`harvest`, gặt tất cả) | 15 | Không |
| Chế biến / nhận mẻ chế biến | 12 / 12 | Không |
| Nhận nuôi / cho ăn / thu sản phẩm (mỗi loài) | 20 / 15 / 18 | Không |
| Lệnh khác: mở thửa, nhận công trình, nhổ cây, mua đồ trang trí, đổi kỷ vật | 5 (mặc định) | Không. Đều tốn tài nguyên. |
| Nhận quà nhiệm vụ cú | 15 × 3 | 3 nhiệm vụ/ngày |
| Rương Cú Vàng | 20 | 1/ngày, khi xong cả 3 nhiệm vụ |
| Xoay đồ (cả khi đổi lễ hội) / vuốt ve / bưu thiếp / Floo / tham quan | 8 (đổi lễ hội: 10–12) / 10 / 12 / 15 / 10 | 3 / 3 / 1 / 1 / 1 lần mỗi ngày |
| Chăm cây / chuyển thửa-chuồng | 6 / 5 | **Trước bản sửa: không giới hạn.** Sau bản sửa: 3 / 1 lần mỗi ngày. |
| Phụ chăm vườn danh dự (`helpTour`) | 25 × 3 | Mỗi vườn một lần/ngày (3 vườn) |

Tổng thao tác miễn phí tối đa mỗi ngày: 159 điểm (chưa có sinh vật) hoặc 189 điểm (có sinh vật, cộng 30 điểm vuốt ve).

## 3. Điểm mỗi ngày

Mỗi ô là trung bình 14 ngày, tính từ ngày bot đạt cấp đó. Ba nhịp chơi: 3 lượt/ngày (08:00, 13:00, 21:00), 2 lượt/ngày (08:00, 20:00), 1 lượt/ngày (20:00).

| Nhịp | Cấp | Việc vườn | Nhiệm vụ cú | Rương | Tổng (không thao tác miễn phí) | Thao tác miễn phí tối đa |
|---|---|---|---|---|---|---|
| 3 lượt/ngày | 1 | 447 | 41 | 14 | 502 | 159 |
| 3 lượt/ngày | 10 | 544 | 42 | 16 | 601 | 189 |
| 3 lượt/ngày | 30 | 787 | 45 | 20 | 852 | 189 |
| 3 lượt/ngày | 60 | 1220 | 45 | 20 | 1285 | 189 |
| 2 lượt/ngày | 1 | 300 | 40 | 13 | 352 | 159 |
| 2 lượt/ngày | 10 | 369 | 42 | 16 | 427 | 189 |
| 2 lượt/ngày | 30 | 596 | 42 | 16 | 654 | 189 |
| 2 lượt/ngày | 60 | 966 | 45 | 20 | 1031 | 189 |
| 1 lượt/ngày | 1 | 117 | 29 | 0 | 146 | 159 |
| 1 lượt/ngày | 10 | 159 | 32 | 3 | 194 | 189 |
| 1 lượt/ngày | 30 | 280 | 38 | 10 | 327 | 189 |
| 1 lượt/ngày | 60 | 480 | 40 | 13 | 532 | 189 |

Đọc bảng:
- Việc vườn chiếm 80–95% số điểm. Vườn mới có 3 thửa × 3 hàng = 9 lệnh gieo, tức 90 điểm, ngay trong lượt đầu tiên.
- Nhiệm vụ cú và rương góp tối đa 65 điểm/ngày. Phần này gần như bằng nhau giữa mọi người chơi.
- Nếu người chơi dùng «Gieo lại» cả thửa (12 điểm) thay cho gieo từng hàng (3 × 10 điểm), điểm từ việc gieo giảm 60%. Dù vậy mốc 150 vẫn chỉ cần khoảng 1 ngày.

## 4. Thời gian tới mốc với giá trị hiện tại

Cách đọc «ngày N · lượt K»: lượt chơi thứ K của ngày thứ N, kể từ khi người chơi bắt đầu lễ hội ở cấp đó. Bảng không tính thao tác miễn phí và không tính 35 điểm tặng sẵn.

| Nhịp | Cấp | Mốc 30 | Mốc 75 | Mốc 150 |
|---|---|---|---|---|
| 3 lượt/ngày | 1 | ngày 1 · lượt 1 | ngày 1 · lượt 1 | ngày 1 · lượt 2 |
| 3 lượt/ngày | 10 | ngày 1 · lượt 1 | ngày 1 · lượt 1 | ngày 1 · lượt 2 |
| 3 lượt/ngày | 30 | ngày 1 · lượt 1 | ngày 1 · lượt 1 | ngày 1 · lượt 1 |
| 3 lượt/ngày | 60 | ngày 1 · lượt 1 | ngày 1 · lượt 1 | ngày 1 · lượt 1 |
| 2 lượt/ngày | 1 | ngày 1 · lượt 1 | ngày 1 · lượt 1 | ngày 1 · lượt 2 |
| 2 lượt/ngày | 10 | ngày 1 · lượt 1 | ngày 1 · lượt 1 | ngày 1 · lượt 2 |
| 2 lượt/ngày | 30 | ngày 1 · lượt 1 | ngày 1 · lượt 1 | ngày 1 · lượt 1 |
| 2 lượt/ngày | 60 | ngày 1 · lượt 1 | ngày 1 · lượt 1 | ngày 1 · lượt 1 |
| 1 lượt/ngày | 1 | ngày 1 · lượt 1 | ngày 1 · lượt 1 | ngày 2 · lượt 1 |
| 1 lượt/ngày | 10 | ngày 1 · lượt 1 | ngày 1 · lượt 1 | ngày 1 · lượt 1 |
| 1 lượt/ngày | 30 | ngày 1 · lượt 1 | ngày 1 · lượt 1 | ngày 1 · lượt 1 |
| 1 lượt/ngày | 60 | ngày 1 · lượt 1 | ngày 1 · lượt 1 | ngày 1 · lượt 1 |

Nếu tính cả thao tác miễn phí, mọi trường hợp xong cả 3 mốc ngay trong lượt 1 của ngày 1.

## 5. Khoảng trống, chồng lấn và lễ hội đầu tiên của người mới

- **Chồng lấn:** hoàn toàn. Cả 3 lễ hội mở cùng lúc, mọi lúc. Không có khoảng trống nào vì không có lịch.
- **Lặp lại hằng năm:** không làm được. Mã mốc (`hal_m1`…) và `claimedMilestones` không gắn với mùa, nên một lễ hội «quay lại» vào năm sau sẽ không có mốc nào để nhận.
- **Người mới có xong lễ hội đầu tiên không:** có, nhưng quá dễ. Mốc 1 của Bí ngô nhận được ngay nhờ 35 điểm tặng sẵn. Mốc 150 xong ngay trong ngày đầu, trừ người chơi 1 lượt/ngày (xong vào ngày 2).
- Với lịch đề xuất ở mục 7, khoảng trống giữa các lễ hội là 41, 78 và 204 ngày. Khoảng trống giữa năm (03/04–23/10) quá dài, xem **[CẦN QUYẾT] 3**.

## 6. Danh sách phát hiện

1. **Lỗi, đã sửa — nút «Chăm cây» cho điểm lễ hội không giới hạn.** `cropCareButton` gọi `recordFestivalAction('care')`: 6 điểm mỗi lần bấm, không tốn gì và không có trần. Điều này trái với quy tắc đã ghi ngay trên `FREE_FESTIVAL_ACTIONS_PER_DAY` (thao tác miễn phí chỉ được tính vài lần mỗi ngày). Người chơi có thể bấm liên tục và đạt 150 điểm sau 25 lần bấm.
   Bản sửa: thêm `care: 3` vào `FREE_FESTIVAL_ACTIONS_PER_DAY`. Quà nhiệm vụ cú trước đây cũng ghi dưới tên `'care'` (với 15 điểm), nên được chuyển sang loại riêng `questClaim: 15` để không bị trần mới chặn (`mobile-game.mjs`, `handleClaimDailyQuest`). Điểm nhận quà nhiệm vụ không đổi.
2. **Lỗi, đã sửa — lệnh «Chuyển» thửa/chuồng cho 5 điểm mỗi lần, không giới hạn.** `moveBuilding` không tốn gì, nhưng rơi vào mức mặc định 5 điểm. Bản sửa: ghi rõ `moveBuilding: 5` và thêm trần `moveBuilding: 1` mỗi ngày.
3. Một ngày chơi cho số điểm gấp khoảng 1 đến 43 lần mốc 30 / 75 / 150 (mục 3 và 4). Đây là vấn đề cân bằng, không phải lỗi: thần thiếp chỉ đề xuất, không đổi.
4. Điểm việc vườn không có trần và tăng theo số thửa. Vì vậy chênh lệch giữa người chơi nặng và nhẹ rất lớn (1285 so với 146 điểm/ngày).
5. Thao tác miễn phí có trần nhưng tổng trần vẫn cao (159–189 điểm/ngày). Phần lớn đến từ «Phụ chăm vườn danh dự» (75 điểm) và tự nó đã vượt mốc 150.
6. Đổi lễ hội dùng chung trần của «xoay» (`recordFestivalAction('rotate', 10|12)`): đổi lễ hội 3 lần trong ngày sẽ làm thao tác xoay đồ hết điểm. Lỗi này nhỏ, chưa sửa.
7. Người chơi 1 lượt/ngày ở cấp dưới 6 và chưa có sinh vật **không bao giờ mở được Rương Cú Vàng**. Ở giai đoạn đó, nhiệm vụ thứ ba luôn là «Gặt 2 lần» (`q_harvest_runs`), mà chỉ có một lần gặt mỗi ngày. Vấn đề này thuộc `garden-quests.mjs` (phiên chính đang sửa), nên thần thiếp chỉ ghi nhận.
8. Dòng 19 của `economy-audit.md` vẫn ghi rương cho +50 điểm lễ hội; code từ V24.9.8 cho +20 (dòng 57 của tài liệu đã đúng). Thần thiếp không sửa tài liệu đó vì phiên chính đang giữ.
9. Thuật ngữ: tên «Dạ Vũ Noel» / «Dạ vũ Noel» có vẻ không khớp bản dịch Lý Lan. Thần thiếp nhớ bản này gọi Yule Ball là «Dạ vũ Giáng sinh» (bảng chọn trong game cũng đã ghi «Giáng sinh»), nhưng chưa đối chiếu với bản in. «Samhain» không xuất hiện trong truyện. **[CẦN QUYẾT] 6**.

## 7. Đề xuất giá trị khởi điểm (chưa áp dụng vào code)

| Hạng mục | Hiện tại | Đề xuất khởi điểm |
|---|---|---|
| Lịch | Không có, người chơi tự chọn | Theo lịch thật, mỗi thời điểm chỉ một lễ hội tính điểm. Ngoài lịch, giao diện lễ hội vẫn bật được để trang trí nhưng không tính điểm. |
| Bí ngô | luôn mở | 24/10–06/11 (14 ngày, có 31/10) |
| Dạ vũ | luôn mở | 18/12–31/12 (14 ngày, có 25/12) |
| Thảo dược | luôn mở | 20/03–02/04 (14 ngày, quanh xuân phân) |
| Mốc | 30 / 75 / 150 | 100 / 450 / 1000 |
| Điểm việc vườn | không trần | giữ điểm mỗi lệnh, trần 60/ngày |
| Nhiệm vụ cú + rương | 15 × 3 + 20 | giữ nguyên (tối đa 65/ngày) |
| Thao tác miễn phí | trần riêng từng loại, tổng 159–189/ngày | thêm trần chung 20/ngày |
| Điểm tặng sẵn | 35 cho Bí ngô | bỏ, hoặc chỉ là quà chào mừng trong lễ hội đầu tiên |
| Khóa mốc | `hal_m1`… dùng vĩnh viễn | gắn với mùa, ví dụ `event_halloween@2026`, để năm sau nhận lại được |

Mức tối đa mỗi ngày theo đề xuất: 60 + 65 + 20 = 145 điểm. Người chơi 1 lượt/ngày đạt trần việc vườn ngay trong lượt duy nhất, nên khoảng cách giữa người chơi nặng và nhẹ thu hẹp lại, chủ yếu còn ở nhiệm vụ cú và rương.

### 7.1 Thời gian tới mốc theo đề xuất (không thao tác miễn phí, lễ hội 14 ngày)

| Nhịp | Cấp | Mốc 100 | Mốc 450 | Mốc 1000 |
|---|---|---|---|---|
| 3 lượt/ngày | 1 | ngày 1 · lượt 3 | ngày 4 · lượt 3 | ngày 9 · lượt 3 |
| 3 lượt/ngày | 10 | ngày 2 · lượt 1 | ngày 5 · lượt 1 | ngày 9 · lượt 3 |
| 3 lượt/ngày | 30 | ngày 1 · lượt 3 | ngày 4 · lượt 3 | ngày 8 · lượt 3 |
| 3 lượt/ngày | 60 | ngày 1 · lượt 3 | ngày 4 · lượt 3 | ngày 8 · lượt 3 |
| 2 lượt/ngày | 1 | ngày 2 · lượt 1 | ngày 5 · lượt 1 | ngày 9 · lượt 2 |
| 2 lượt/ngày | 10 | ngày 1 · lượt 2 | ngày 4 · lượt 2 | ngày 9 · lượt 1 |
| 2 lượt/ngày | 30 | ngày 1 · lượt 2 | ngày 4 · lượt 2 | ngày 9 · lượt 2 |
| 2 lượt/ngày | 60 | ngày 1 · lượt 2 | ngày 4 · lượt 2 | ngày 8 · lượt 2 |
| 1 lượt/ngày | 1 | ngày 2 · lượt 1 | ngày 6 · lượt 1 | ngày 12 · lượt 1 |
| 1 lượt/ngày | 10 | ngày 2 · lượt 1 | ngày 5 · lượt 1 | ngày 11 · lượt 1 |
| 1 lượt/ngày | 30 | ngày 2 · lượt 1 | ngày 5 · lượt 1 | ngày 10 · lượt 1 |
| 1 lượt/ngày | 60 | ngày 1 · lượt 1 | ngày 5 · lượt 1 | ngày 9 · lượt 1 |

### 7.2 Theo đề xuất, có thao tác miễn phí (trần chung 20/ngày)

| Nhịp | Cấp | Mốc 100 | Mốc 450 | Mốc 1000 |
|---|---|---|---|---|
| 3 lượt/ngày | 1 | ngày 1 · lượt 3 | ngày 4 · lượt 1 | ngày 8 · lượt 3 |
| 3 lượt/ngày | 10 | ngày 1 · lượt 3 | ngày 4 · lượt 3 | ngày 8 · lượt 1 |
| 3 lượt/ngày | 30 | ngày 1 · lượt 3 | ngày 4 · lượt 1 | ngày 7 · lượt 3 |
| 3 lượt/ngày | 60 | ngày 1 · lượt 3 | ngày 4 · lượt 1 | ngày 7 · lượt 3 |
| 2 lượt/ngày | 1 | ngày 1 · lượt 2 | ngày 4 · lượt 2 | ngày 8 · lượt 2 |
| 2 lượt/ngày | 10 | ngày 1 · lượt 2 | ngày 4 · lượt 1 | ngày 8 · lượt 1 |
| 2 lượt/ngày | 30 | ngày 1 · lượt 2 | ngày 4 · lượt 1 | ngày 8 · lượt 1 |
| 2 lượt/ngày | 60 | ngày 1 · lượt 2 | ngày 4 · lượt 1 | ngày 7 · lượt 2 |
| 1 lượt/ngày | 1 | ngày 2 · lượt 1 | ngày 5 · lượt 1 | ngày 10 · lượt 1 |
| 1 lượt/ngày | 10 | ngày 1 · lượt 1 | ngày 5 · lượt 1 | ngày 10 · lượt 1 |
| 1 lượt/ngày | 30 | ngày 1 · lượt 1 | ngày 4 · lượt 1 | ngày 8 · lượt 1 |
| 1 lượt/ngày | 60 | ngày 1 · lượt 1 | ngày 4 · lượt 1 | ngày 8 · lượt 1 |

### 7.3 Người vào muộn (cấp 1, không thao tác miễn phí): mốc cao nhất đạt được khi lễ hội còn N ngày

| Nhịp | còn 14 ngày | còn 10 ngày | còn 7 ngày | còn 5 ngày | còn 3 ngày |
|---|---|---|---|---|---|
| 3 lượt/ngày | mốc 1000 | mốc 1000 | mốc 450 | mốc 450 | mốc 100 |
| 2 lượt/ngày | mốc 1000 | mốc 1000 | mốc 450 | mốc 450 | mốc 100 |
| 1 lượt/ngày | mốc 1000 | mốc 450 | mốc 450 | mốc 100 | mốc 100 |

Như vậy, người chơi 2–3 lượt/ngày vào trong 4–5 ngày đầu vẫn xong cả lễ hội; người chơi 1 lượt/ngày cần vào trong 2–3 ngày đầu. Người vào ở nửa sau lễ hội chỉ đạt mốc 2 hoặc thấp hơn.

## 8. Quyết định còn mở

- **[CẦN QUYẾT] 1 — Lịch thật hay tự chọn.** Đề xuất: theo lịch thật, mỗi lần một lễ hội. Đổi lại, cần mã kiểm tra ngày (theo giờ Việt Nam) và khóa mốc theo mùa.
- **[CẦN QUYẾT] 2 — Mốc và trần.** Khởi điểm là 100 / 450 / 1000 với trần việc vườn 60 và trần thao tác miễn phí 20. Nếu muốn người chơi nặng xong sớm hơn rõ rệt, có thể nâng trần việc vườn lên 90–120. Đổi lại, người chơi nhẹ sẽ bị bỏ xa hơn.
- **[CẦN QUYẾT] 3 — Khoảng trống 204 ngày giữa năm (03/04–23/10).** Có thể thêm một lễ hội mùa hè (ví dụ cuối năm học hoặc Quidditch), hoặc thêm lễ hội Tết Nguyên đán cho cộng đồng HPVN.
- **[CẦN QUYẾT] 4 — Người mới / người vào muộn.** Có thể cho lễ hội đầu tiên của tài khoản mới tính 14 ngày từ ngày tham gia, hoặc giữ chung lịch cho mọi người.
- **[CẦN QUYẾT] 5 — Phần thưởng mốc.** Khi mốc tăng 3–7 lần, phần thưởng hiện tại (ví dụ +15 Nước, +4 Bí ngô) cần xét lại cùng ngân sách tài nguyên trong `economy-audit.md`. Tài liệu này chưa đề cập phần thưởng.
- **[CẦN QUYẾT] 6 — Tên lễ hội theo Lý Lan.** Có đổi «Dạ Vũ Noel» thành «Dạ vũ Giáng sinh» và bỏ «Samhain» khỏi chữ trong game hay không (cần đối chiếu bản in trước).

## 9. Phương pháp và giới hạn

- `simulate()` trong `sim-progression.mjs` ghi lại từng lệnh mà bot thực hiện (`playSession` trả về `log`). `festivalDay()` tính điểm theo `FESTIVAL_ACTION_POINTS`, nhân với số lần bấm trên giao diện (cho ăn và thu sản phẩm tính theo từng loài, như các nút trong game). Hàm này dựng 3 nhiệm vụ cú của ngày bằng chính `pickDailyQuests` và cộng 20 điểm rương khi xong cả 3. `timeToMilestones()` đi qua từng lượt chơi.
- Thao tác miễn phí được giả định làm ở lượt đầu; quà nhiệm vụ và rương được nhận ở lượt cuối ngày.
- Bot chơi kiểu chăm chỉ: gieo mọi hàng trống và không bao giờ hết hạt. Người chơi thật có thể bỏ lượt hoặc dùng «Gieo lại», nên điểm việc vườn thực tế thấp hơn. Đây là số liệu mô phỏng, chưa phải số liệu đo từ người chơi.
- Trần 60/ngày và trần chung 20/ngày chỉ được mô phỏng trong `timeToMilestones` / `simulate({free: 20})`, **chưa có trong game**.
- Chạy lại: `cd garden-v05 && node sim-progression.mjs festival`. Kiểm thử: `node --test *.test.mjs` (165 test, tất cả đạt).
