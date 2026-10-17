# Khu Vườn Hagrid — Thiết kế cốt lõi

> **Trạng thái:** ĐÃ DUYỆT 17/10/2026 (chủ dự án: "đồng ý và làm tiếp"), các đề xuất [CẦN QUYẾT] được chấp nhận như ghi · 17/10/2026 · Claude Code (Anthropic)
> Mọi mục ghi **[CẦN QUYẾT]** là đề xuất, chưa phải quyết định. Sau khi duyệt, tài liệu này là la bàn cho mọi việc ở Phase 1 trở đi.

## 1. Game là gì

**Một câu:** Chăm khu vườn và sinh vật huyền bí cạnh lều bác Hagrid, vài phút mỗi ngày, ngay trong diễn đàn HPVN, rồi khoe với bạn cùng nhà.

**Khán giả chính [CẦN QUYẾT]**
- Đề xuất: thành viên HPVN đang hoạt động, trưởng thành, yêu Harry Potter, **không nhất thiết chơi game nhiều**. Họ mở diễn đàn hằng ngày, có 2–5 phút rảnh.
- Hệ quả: chạm là hiểu; không bắt đọc; không phạt khi vắng mặt (cây chín không héo, sinh vật không chết).

**Không phải là:** game cày cuốc, game PvP, game nạp tiền.

**Nhịp tổng thể (đã có trong `balance-data`):** cấp 1–100 trong khoảng 4–6 tháng, khoảng 3 lượt chơi mỗi ngày. Phase 3 sẽ kiểm chứng con số này bằng mô phỏng.

## 2. Ba trụ cảm xúc

| Trụ | Người chơi cảm thấy | Hệ thống phục vụ |
|---|---|---|
| **Chăm sóc** | "Vườn của mình đang sống, cần mình" | Gieo/gặt, cho ăn, vuốt ve, thời tiết, ngày/đêm |
| **Lớn lên** | "Hôm nay vườn đẹp hơn hôm qua" | Mở thửa/chuồng, 6 giai đoạn vườn, sinh vật mới, trang trí |
| **Khoe & kết nối** | "Bạn bè thấy vườn mình" | Floo, thăm vườn, House Cup (Phase 5) |

Quy tắc: **tính năng không phục vụ ít nhất một trụ thì không làm.** Tính năng phục vụ cùng trụ với một tính năng có sẵn thì gộp lại.

## 3. Vòng chơi

| Nhịp | Người chơi làm | Phần thưởng cảm nhận | Đo bằng |
|---|---|---|---|
| **30 giây** | Chạm luống → gặt → gieo lại; chạm sinh vật → cho ăn | Hình, tiếng, số `+N` bay vào kho | Mỗi thao tác chính có đủ 3 phản hồi |
| **5 phút** | Gom nông sản → chế biến khẩu phần → cho ăn → thu sản phẩm → mở/xây | Thanh tiến độ mục tiêu gần nhích lên | Một phiên chơi luôn có ít nhất một mục tiêu gần |
| **1 ngày** | Quay lại thấy cây chín, sinh vật đói, thư cú mới | Rương cú, cây đã chín | Tỉ lệ quay lại hôm sau |
| **1 mùa** | Lễ hội theo lịch thật (Halloween, Giáng sinh, Hội chợ thảo dược) | Đồ trang trí giới hạn, cảnh vườn đổi | Số người nhận đủ mốc lễ |

## 4. Rà soát tính năng: Giữ / Gộp / Đóng băng [CẦN QUYẾT]

"Đóng băng" nghĩa là ẩn khỏi giao diện, vẫn giữ code và save, có thể bật lại sau.

| Tính năng hiện có | Đề xuất | Lý do |
|---|---|---|
| Gieo, chăm, gặt (24 loại cây) | **Giữ, làm sâu** | Lõi của trụ Chăm sóc. Phase 1 chỉ cần 6 loại đầu thật đẹp |
| Sinh vật: nhận nuôi, cho ăn, thu sản phẩm (12 loài) | **Giữ, làm sâu** | Lõi. Phase 1 tập trung 4–6 loài đầu |
| Chế biến khẩu phần | **Giữ** | Nối cây với sinh vật: vòng 5 phút |
| Mở thửa/chuồng, 6 giai đoạn vườn | **Giữ** | Lõi của trụ Lớn lên |
| Trang trí, cửa hàng, xoay góc | **Giữ, đơn giản hoá** | Trụ Lớn lên và Khoe. Bỏ xoay góc khỏi luồng chính |
| Độ gắn kết 5 cấp | **Gộp** vào thẻ sinh vật | Không cần bảng riêng |
| Kỷ vật | **Gộp** vào quà gắn kết | Hai cơ chế cùng ý nghĩa "sinh vật tặng lại" |
| Nhiệm vụ cú 5/ngày + Rương | **Giữ, rút xuống 3/ngày** | Lý do quay lại mỗi ngày. Nhiệm vụ chỉ gắn với hành động thật, không có "đổi thời tiết" |
| Lễ hội (3 chủ đề, 3 mốc) | **Giữ, chạy theo lịch** | Bỏ nút tự chọn lễ hội: mỗi thời điểm chỉ một lễ |
| Thời tiết (4) + ngày/đêm (3) | **Giữ, tự động** | Ngày/đêm theo giờ thật; thời tiết đổi theo ngày. Bỏ nút chọn khỏi luồng chính (để lại trong Cài đặt) |
| Thành tựu 12 + danh hiệu | **Gộp** → "Hồ sơ người giữ vườn" | Cùng trụ, giảm số bảng |
| Sổ tay (almanac), Lưu bút, Bưu thiếp | **Gộp** → "Hồ sơ" | Như trên |
| Thăm 3 vườn mẫu NPC | **Đóng băng** | Phase 5 thay bằng vườn thành viên thật |
| Khoe lên Floo | **Đóng băng** đến Phase 4–5 | Cần server và tài khoản thật để có ý nghĩa |
| Phiên lab / công cụ QA | **Giữ, chỉ hiện khi `qa=1`** | Công cụ nội bộ |

Kết quả mong muốn: menu chính còn **4 mục**: Vườn · Kho · Thư cú · Hồ sơ (Cài đặt nằm trong Hồ sơ).

## 5. Tài nguyên [CẦN QUYẾT, chi tiết ở Phase 3]

Hiện có 7 loại người chơi phải để tâm: Galleons, nước, phân bón, bộ vật liệu, XP, điểm lễ hội, điểm gắn kết.

Đề xuất còn **4 loại người chơi thấy rõ**:
1. **Galleons**: mua hạt, trang trí. Có nối với ví diễn đàn không thì quyết ở Phase 4.
2. **Nông sản và khẩu phần** (kho): sinh ra từ gặt và chế biến, dùng cho ăn và cho nhiệm vụ.
3. **Nước**: giới hạn nhịp gieo trong ngày. Phân bón gộp thành "nước phép" (tăng tốc).
4. **XP / cấp**: mở khu mới.

Điểm lễ hội và điểm gắn kết là **thanh tiến độ** chứ không phải tiền tệ: không tiêu, không đổi.
Bộ vật liệu gộp vào chi phí xây bằng nông sản và Galleons.

Quy tắc cứng: **mọi phần thưởng từ hành động miễn phí có trần ngày; server là nguồn sự thật từ Phase 4.**

## 6. Ba phút đầu (kịch bản)

1. Mở game: máy quay lướt từ Rừng Cấm vào lều Hagrid (2 giây), Hagrid vẫy tay.
2. Một luống phát sáng nhấp nháy → người chơi chạm → khay hạt bật lên, bí ngô được chọn sẵn → chạm **Gieo**.
3. Hagrid đưa nước phép: cây lớn nhanh trước mắt (lần duy nhất).
4. Cây chín rung → chạm → **Gặt**: bí ngô bay vào kho, `+3`.
5. Puffskein lăn ra từ chuồng, có bong bóng "đói" → chạm → **Cho ăn** → tim bay lên.
6. Thư cú rơi xuống: nhiệm vụ đầu tiên. Từ đây người chơi tự chơi.

Toàn bộ chỉ dùng mũi tên, phát sáng và lời thoại ngắn (≤ 8 từ mỗi câu). Không có trang hướng dẫn nào.

## 7. Nguyên tắc giao diện và chữ

- Cảnh vườn chiếm **≥ 70%** màn hình khi đang chơi.
- Nút: động từ, tối đa 3 từ. Số liệu: icon + số.
- Không bao giờ cắt mất **giá, thời gian chờ, điều kiện, hậu quả** của một thao tác.
- Thuật ngữ Harry Potter theo bản dịch **Lý Lan**. Đối chiếu ngày 17/10/2026 với `resource/FullHP` (số lần xuất hiện trong bản tiếng Việt):

  | Tên cũ trong game | Theo Lý Lan | Bằng chứng |
  |---|---|---|
  | Bằng Mã | **Bằng-Mã** | HP3, "con Bằng-Mã" |
  | Thestral | **vong mã** | HP5 và HP7, 72 lần |
  | Mandrake | **Nhân sâm** | HP2, 12 lần |
  | Dạ vũ Giáng sinh | **Dạ vũ Noel** | HP4, 2 lần (1 lần "Dạ vũ Giáng sinh") |
  | Kỳ lân, Chó ba đầu, Rừng Cấm | giữ (viết thường "kỳ lân", "chó ba đầu" trong câu) | HP1–7 |
  | Bạch tiên (dittany) | chưa tìm thấy, cần tra tiếp | — |
  | Puffskein, Niffler, Kneazle, Mooncalf, Fwooper, Diricawl, Puffapod | không có trong 7 tập, giữ tên gốc | — |

  Đã sửa các nhãn này trong game ngày 17/10/2026 (V24.9.2).
- Một màn hình không cuộn khi đọc vẫn rõ; danh sách dài thì cuộn, không thu chữ quá nhỏ.

## 8. Tiêu chí thành công

| Mốc | Tiêu chí |
|---|---|
| Phase 1 xong | Người mới tự qua 3 phút đầu; 6 thao tác chính có hình, tiếng và số; không giật trên iPhone thật |
| Phase 2 (playtest) | ≥ 4/5 người tự qua vòng đầu và nói muốn chơi tiếp |
| Beta | Theo dõi tỉ lệ quay lại sau 1 và 7 ngày, thời lượng phiên. Ngưỡng đặt sau khi có số đầu tiên, không đoán trước |

## 9. Chủ dự án cần quyết

- [x] Khán giả chính (mục 1)
- [x] Bảng Giữ / Gộp / Đóng băng (mục 4)
- [x] Rút nhiệm vụ cú xuống 3/ngày
- [x] Thời tiết và ngày/đêm tự động theo giờ thật
- [x] Còn 4 loại tài nguyên (mục 5)
- [x] Galleons trong game có nối với ví diễn đàn không (có thể để tới Phase 4)
