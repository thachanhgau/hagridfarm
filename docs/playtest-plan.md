# Phase 2 — Kịch bản playtest 5 người

> **Trạng thái:** BẢN NHÁP chờ chủ dự án duyệt · 17/10/2026 · Claude Code (Anthropic)
> Mục tiêu: biết người mới có **tự** qua được ba phút đầu và **muốn chơi tiếp** không, dựa trên quan sát thật thay vì phỏng đoán.
> Đi kèm: [`playtest-observation.csv`](playtest-observation.csv) (bảng quan sát), bộ ghi sự kiện ẩn danh trong game (mục 6), `garden-v05/playtest-summary.mjs` (gộp kết quả).

## 1. Cổng duyệt (đã chốt trong plan)

**Đạt** khi **≥ 4/5** người: (a) tự hoàn thành ba phút đầu, không bấm Bỏ qua và người điều phối không phải gợi ý; và (b) trả lời "có" hoặc "chắc có" ở câu hỏi 3 (mục 5).
**Chưa đạt** → quay lại Phase 1 sửa đúng các điểm kẹt tìm được, **không** thêm tính năng mới, rồi thử lại với người khác.

## 2. Chọn người chơi

- 5 thành viên HPVN (có thể mời 6–7 để dự phòng người vắng).
- Trộn nhóm: ít nhất 2 người **ít chơi game**, ít nhất 2 người dùng **iPhone**, ít nhất 1 người chơi game nông trại trên điện thoại.
- Chưa từng thấy bản thử, không phải người trong nhóm làm game.
- Mỗi buổi 25–30 phút, một người một buổi (không chơi theo nhóm, tránh chỉ bài cho nhau).

## 3. Cách đưa bản thử đến người chơi [CẦN QUYẾT]

| Cách | Ưu | Nhược |
|---|---|---|
| **A. Ngồi cùng hoặc gọi video**, người chơi dùng máy của chủ dự án hoặc mở qua mạng LAN | Không phải công khai bản thử, quan sát được nét mặt | Phải hẹn lịch; muốn mở qua LAN thì server phải nhận truy cập từ mạng nội bộ (hiện chỉ nghe `127.0.0.1`) |
| **B. Đưa link** bản thử lên một địa chỉ tĩnh, người chơi tự mở trên máy mình | Đúng máy và thói quen thật của họ | Phải đăng bản thử lên mạng; cần chủ dự án cho phép nơi đăng và ai được xem |

Đề xuất: **A cho 2–3 người đầu** để quan sát kỹ, **B cho số còn lại** nếu chủ dự án đồng ý đăng.

Mỗi người phải bắt đầu bằng **vườn mới tinh**: mở bằng **cửa sổ ẩn danh/riêng tư** của trình duyệt (bản lưu nằm trong trình duyệt). Dùng chung máy thì đóng cửa sổ ẩn danh rồi mở cái mới cho người sau.

Link dùng cho playtest (thay địa chỉ máy chủ khi đăng):
`…/garden-v05/index.html?playtest=1`
Không thêm `qa=1`: người chơi thấy đúng bản thật. Nhãn hồng "● Đang ghi thử nghiệm ẩn danh" ở góc dưới trái cho biết bộ ghi đang bật.

## 4. Kịch bản buổi chơi (người điều phối đọc theo)

**Trước buổi (2 phút, người điều phối tự làm):** mở cửa sổ ẩn danh; mở link; thấy nhãn "Đang ghi…"; bật tiếng; mở bảng quan sát và ghi giờ bắt đầu.

**Giới thiệu (≤ 2 phút), đọc gần đúng nguyên văn:**
> "Cảm ơn bạn. Đây là bản thử của một trò chơi nhỏ. Hôm nay mình thử **trò chơi**, không thử bạn, nên không có làm đúng hay sai. Bạn cứ chơi như ở nhà. Nếu được, bạn **nói to** điều mình đang nghĩ, kể cả 'không hiểu chỗ này'. Mình sẽ không giúp trong lúc chơi, vì mình cần biết game tự nói được với bạn đến đâu. Game chỉ ghi các thao tác một cách ẩn danh: không tên, không tài khoản, không chữ bạn gõ. Bạn đồng ý chứ?"
> Nếu quay màn hình: hỏi riêng một câu đồng ý nữa.

**Chơi tự do (10 phút)**
- Người điều phối **không chỉ, không gật đầu, không chạm vào màn hình**. Chỉ ghi vào bảng quan sát.
- Kẹt **quá 60 giây**: chỉ hỏi *"Bạn đang nghĩ gì?"*.
- Kẹt **quá 2 phút**: gợi ý **ít nhất có thể** ("Thử nhìn quanh màn hình xem"), rồi ghi `gợi ý` ở cột *Mức*. Người này không còn tính là "tự qua".
- Người chơi muốn dừng: dừng luôn, ghi lại lúc dừng và lý do.

**Chơi tiếp có hướng (5 phút, chỉ khi còn thời gian):** *"Bạn muốn làm gì tiếp với khu vườn?"* Quan sát họ tự chọn gì (gieo lại, thư cú, cửa hàng, khám phá…).

**Phỏng vấn (5 phút):** mục 5.

**Kết thúc (1 phút):** ⚙ Cài đặt → **Khác** → **Xuất nhật ký thử** → lưu file `hagrid-playtest-….json`. Đổi tên thành `nguoi-<số>.json` rồi gửi cho chủ dự án. Nếu bản thử bị đóng trước đó, nhật ký vẫn còn trong trình duyệt cho tới khi đóng cửa sổ ẩn danh: mở lại cùng cửa sổ để xuất.

## 5. Năm câu hỏi sau buổi chơi

1. Bạn thích **nhất** điều gì?
2. Chỗ nào khó hiểu hoặc khó làm **nhất**?
3. Ngày mai bạn có muốn mở lại không? (có / chắc có / chắc không / không). Vì sao?
4. Nếu kể cho bạn bè, bạn sẽ nói game này là gì? (một câu)
5. Có gì trong vườn bạn muốn **khoe** với người khác không?

Ghi đúng lời người chơi; không tóm tắt thay họ.

## 6. Bộ ghi sự kiện ẩn danh (đã có trong prototype)

- **Chỉ bật khi link có `?playtest=1`**, chỉ với vườn chơi trên máy (không chạy ở bản ví/fixture).
- **Ghi:** bắt đầu/kết thúc phiên, ẩn/hiện tab, từng bước hướng dẫn và nút Bỏ qua, mỗi thao tác (gieo, gặt, cho ăn, chế biến, xây…), thao tác bị chặn, lỗi, loại chạm trên cảnh, bảng được mở, lên cấp, nhận quà, nội dung thông báo của game (tối đa 60 ký tự).
- **Không ghi:** tên, tài khoản, chữ người chơi gõ, địa chỉ IP, user agent. Chỉ có ngữ cảnh thô: điện thoại / máy tính bảng / máy tính, dọc/ngang, có cảm ứng, có bật giảm chuyển động.
- Thời gian ghi bằng mili giây tính từ đầu phiên, kèm ngày (không giờ). Mã phiên là chuỗi ngẫu nhiên, không gắn với người.
- Nằm trong trình duyệt của người chơi (tối đa 3.000 sự kiện) cho tới khi họ xuất file. **Không tự gửi đi đâu.**
- Đề xuất: xoá file nhật ký sau khi tổng hợp xong, chậm nhất 30 ngày **[CẦN QUYẾT]**.

## 7. Tổng hợp sau 5 buổi

1. Chạy trong thư mục `garden-v05`:
   `node playtest-summary.mjs nguoi-1.json nguoi-2.json nguoi-3.json nguoi-4.json nguoi-5.json`
   Kết quả: bảng mỗi phiên (thời lượng, lần gieo/gặt đầu, bước hướng dẫn cuối, có bỏ qua không, số lần bị chặn/lỗi, **khoảng lặng lâu nhất và ở bước nào**, cấp đạt được) và dòng cổng dữ liệu.
2. Ghép với bảng quan sát: mỗi khoảng lặng lâu trong nhật ký phải có một dòng quan sát giải thích người chơi đang làm gì lúc đó.
3. Lập danh sách vấn đề: **tần suất** (bao nhiêu người gặp) × **mức độ** (kẹt hẳn / chậm / khó chịu nhẹ). Chọn **tối đa 5 vấn đề** để sửa.
4. Đối chiếu cổng duyệt ở mục 1, ghi quyết định: sang Phase 3, hay quay lại Phase 1 với 5 vấn đề đã chọn.
5. Viết `docs/playtest-r1-ket-qua.md` (1 trang): bảng tổng hợp, 5 vấn đề kèm bằng chứng (trích lời, mã phiên), quyết định.

## 8. Chủ dự án cần quyết

- [ ] Cách đưa bản thử (A, B hay kết hợp) và, nếu chọn B, nơi đăng và ai được xem
- [ ] Danh sách 5–7 người mời
- [ ] Có quay màn hình không (cần người chơi đồng ý riêng)
- [ ] Thời hạn xoá file nhật ký (đề xuất 30 ngày)
