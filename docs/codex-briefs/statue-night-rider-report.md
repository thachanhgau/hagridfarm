# Dobby cưỡi thú nhún — night art redo

Hoàn tất 6/6 frame art. Built-in ImageGen tạo master, tham chiếu trực tiếp sprite ban ngày phóng nearest-neighbour; master giao 1536×1408, lưới 2×3, mỗi ô 512×704. Master/prompt: garden-v05/environment/statue-night/masters/ev_dobby_spring_rider.png và .txt. Bản cũ được cất ở masters/variants/rider-v1/.

Đã xem preview ở 1× và 3×: da ấm, áo trắng, thú xanh và bệ đá tách màu; mắt Dobby và thú có cyan/điểm trắng; vòng sáng tròn dày phía sau đầu/tai, rim sáng và điểm sáng lò xo. Ánh sáng nền cyan bị giới hạn trong diamond 128×64, tâm (64,128), đỉnh trước (64,160); do bệ chiếm gần hết diamond, phần pool nhìn thấy tập trung ở hai bên bệ. Bản night sáng hơn Dobby Hắc Ám đã duyệt. Verdict mỹ thuật: sẵn sàng chủ dự án xem lại qua preview; đây chưa phải phê duyệt của chủ dự án.

Dùng phương pháp reducer hiện có: area average 4×4, bảng PALETTE, dọn màu pixel đơn, cover repair từ màu master. N0 được dùng làm hình học chung; n1/n2 chỉ biến thiên vùng sáng cyan/trắng và effect, không có chuyển động. Script chỉ ghi rider; không tái tạo dark Dobby.

Kiểm độc lập: 128×176, pivot theo gốc (64,160), alpha 0/255; 0 màu ngoài PALETTE; 0 pixel gốc bị hở; 0 pixel ngoài margin; 0 pixel pool ra ngoài diamond; alpha mask giống nhau giữa n0/n1/n2. Hash 15 file Dobby Hắc Ám (PNG, master/reference/prompt, WebP) giữ nguyên byte. Không sửa game code, CSS, tests, originals, statue-glow; giữ dirt có sẵn. Không commit/push/deploy.

Runtime: build-runtime-webp.mjs và --check PASS; 1207 lossless conversions + 8 existing WebP, RGBA identical. Chỉ là kiểm art và codec tại workspace; phần tích hợp game do Claude Code tiếp tục.

Preview: docs/codex-briefs/statue-night-rider-preview.png — hai hướng, 1×/3×, day · night overlay · n0 · n1 · n2 · approved dark n0.

Màu thực dùng theo file:

- ev_dobby_spring_rider-n0.png: #142620 #231F2E #24483F #3E3B70 #3F6A45 #41465C #4A3042 #4A3C2C #5D6046 #687486 #6961A6 #70A8B6 #735044 #777044 #8B4A3F #A57554 #A6B1AE #B49A66 #B7DEE0 #C75B4B #C97952 #D6D8BF #E7AE73 #E8F0ED #ED8A45 #F5D69A #FFC36B
- ev_dobby_spring_rider-n1.png: #142620 #231F2E #24483F #3E3B70 #3F6A45 #41465C #4A3042 #4A3C2C #5D6046 #687486 #6961A6 #70A8B6 #735044 #777044 #8B4A3F #A57554 #B49A66 #C75B4B #C97952 #D6D8BF #E7AE73 #E8F0ED #ED8A45 #F5D69A #FFC36B
- ev_dobby_spring_rider-n2.png: #142620 #231F2E #24483F #3E3B70 #3F6A45 #41465C #4A3042 #4A3C2C #5D6046 #687486 #6961A6 #70A8B6 #735044 #777044 #8B4A3F #A57554 #A6B1AE #B49A66 #C75B4B #C97952 #D6D8BF #E7AE73 #ED8A45 #F5D69A #FFC36B
- ev_dobby_spring_rider_right-n0.png: #142620 #231F2E #24483F #3E3B70 #3F6A45 #41465C #4A3042 #4A3C2C #5D6046 #687486 #6961A6 #70A8B6 #735044 #777044 #8B4A3F #A57554 #A6B1AE #B49A66 #B7DEE0 #C75B4B #C97952 #D6D8BF #E7AE73 #E8F0ED #ED8A45 #F5D69A #FFC36B
- ev_dobby_spring_rider_right-n1.png: #142620 #231F2E #24483F #3E3B70 #3F6A45 #41465C #4A3042 #4A3C2C #5D6046 #687486 #6961A6 #70A8B6 #735044 #777044 #8B4A3F #A57554 #B49A66 #C75B4B #C97952 #D6D8BF #E7AE73 #E8F0ED #ED8A45 #F5D69A #FFC36B
- ev_dobby_spring_rider_right-n2.png: #142620 #231F2E #24483F #3E3B70 #3F6A45 #41465C #4A3042 #4A3C2C #5D6046 #687486 #6961A6 #70A8B6 #735044 #777044 #8B4A3F #A57554 #A6B1AE #B49A66 #C75B4B #C97952 #D6D8BF #E7AE73 #ED8A45 #F5D69A #FFC36B

| File | Ink box gốc → mới (inclusive) | Mất pixel | Màu | Verdict |
|---|---|---:|---:|---|
| ev_dobby_spring_rider-n0.png | [17,10,111,159] → [9,1,118,159] | 0 | 27 | PASS |
| ev_dobby_spring_rider-n1.png | [17,10,111,159] → [9,1,118,159] | 0 | 25 | PASS |
| ev_dobby_spring_rider-n2.png | [17,10,111,159] → [9,1,118,159] | 0 | 25 | PASS |
| ev_dobby_spring_rider_right-n0.png | [18,10,110,159] → [9,1,118,160] | 0 | 27 | PASS |
| ev_dobby_spring_rider_right-n1.png | [18,10,110,159] → [9,1,118,160] | 0 | 25 | PASS |
| ev_dobby_spring_rider_right-n2.png | [18,10,110,159] → [9,1,118,160] | 0 | 25 | PASS |
