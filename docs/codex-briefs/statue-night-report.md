Bộ tượng Dobby ban đêm — artwork, 04/11/2026

Đã xuất 12 PNG RGBA, pivot (64,160), hai master sheet 1536×1408, prompt và các lần thử trong garden-v05/environment/statue-night/masters/. Công cụ: built-in ImageGen. Preview: statue-night-preview.png, đủ hai tượng × hai hướng × năm cột, 1× và 3× nearest-neighbour. Cỏ ngày #3F6A45; các cột đêm phủ rgba(10,18,34,.44) lên cả cảnh và tượng ngày, rồi mới vẽ sprite đêm.

Kiểm tra kỹ thuật đạt 12/12: palette PALETTE, alpha 0/255, cover-rule 0 pixel hở, x trong 4…123, margin ít nhất 1 px, khung thân lệch gốc không quá 2 px, alpha giống hệt giữa n0/n1/n2. n1 sáng hơn n0, n2 tối hơn; không có chuyển động. Mực tổng tính cả halo/pool nên được phép vượt khung gốc. Khung ghi xMin,yMin,xMax,yMax (inclusive).

Giới hạn thị giác cần ghi rõ: halo Hắc Ám hiện khoảng 80–84 px, còn nhỏ hơn mục tiêu 1.3–1.6× bề ngang đầu kể cả tai (khoảng 83 px). Hai lần yêu cầu tăng halo vẫn cho vòng nhỏ; lần cuối giữ riêng trong variants và không dùng. Vì vậy sáu file Hắc Ám đạt kỹ thuật nhưng chưa đạt trọn tỷ lệ halo của brief. Spring rider dùng halo khoảng 88 px với đầu kể cả tai khoảng 64 px. Preview là bằng chứng artwork cục bộ, chưa phải tích hợp game hay chủ dự án duyệt mỹ thuật.

Cách dựng: master thô do ImageGen trả 1310×1201 được lưu nguyên trong variants; bản master chuẩn hóa nearest-neighbour thành 1536×1408 (ô 512×704), không tạo thêm chi tiết. Script build-statue-night.mjs dùng area average 4×4, key nền tối, căn chiều cao thân về khung gốc, lượng tử redmean về PALETTE, hấp thụ màu blur đơn lẻ trừ điểm tương phản mạnh. Mặt nạ gốc và vùng lân cận tối đa 2 px giữ silhouette, phần thiếu lấy màu vẽ từ master gần nhất, không lấy màu tượng ngày. Vùng halo và pool được trích từ master; pool giới hạn trong diamond đỉnh trước (64,160), tâm (64,128), rộng128 cao64. n0 giữ hình chung; n1/n2 đổi độ sáng các vùng có luma>95 theo các cột tham chiếu, rồi lượng tử lại — không trích riêng geometry của từng cột vì master có sai khác nhỏ giữa frame.

Đã chạy build-runtime-webp.mjs và --check: 1207 conversions + 8 WebP có sẵn. Builder tự nhận đủ 12 ảnh environment/statue-night; khi build đã đối chiếu RGBA sau giải mã lossless/exact. Không sửa builder. Hai tệp runtime-webp-manifest.json và runtime-image-url.mjs là đầu ra tự sinh của lệnh được yêu cầu. Không commit/push/deploy. Không sửa event-assets, decor-assets hay statue-glow.

Các bộ màu dùng thực tế:

C1: #142620 #231F2E #41465C #4A3042 #4A3C2C #735044 #874056 #8B4A3F #A57554 #B49A66 #C75B4B #C97952 #E7AE73 #ED8A45 #F5D69A #FFC36B

C2: #142620 #231F2E #41465C #4A3042 #4A3C2C #735044 #874056 #8B4A3F #C75B4B #C97952 #E7AE73 #ED8A45 #F5D69A #FFC36B

C3: #142620 #231F2E #41465C #4A3042 #4A3C2C #735044 #777044 #874056 #8B4A3F #A57554 #B49A66 #C75B4B #C97952 #E7AE73

C4: #142620 #231F2E #41465C #4A3042 #4A3C2C #687486 #735044 #874056 #8B4A3F #A57554 #B49A66 #C75B4B #C97952 #E7AE73 #ED8A45 #F5D69A #FFC36B

C5: #142620 #231F2E #41465C #4A3042 #4A3C2C #687486 #735044 #874056 #8B4A3F #C75B4B #C97952 #E7AE73 #ED8A45 #F5D69A #FFC36B

C6: #142620 #231F2E #41465C #4A3042 #4A3C2C #687486 #735044 #777044 #874056 #8B4A3F #A57554 #B49A66 #C75B4B #C97952 #E7AE73

C7: #142620 #231F2E #24483F #3E3B70 #41465C #4A3042 #687486 #6961A6 #70A8B6 #A6B1AE #B7DEE0 #E8F0ED

C8: #142620 #231F2E #24483F #3E3B70 #41465C #4A3042 #687486 #6961A6 #70A8B6 #D6D8BF #E8F0ED

C9: #142620 #231F2E #24483F #3E3B70 #41465C #4A3042 #687486 #6961A6 #70A8B6 #A6B1AE #D6D8BF

C10: #142620 #231F2E #24483F #3E3B70 #41465C #4A3042 #687486 #6961A6 #70A8B6 #A6B1AE #B7DEE0

C11: #142620 #231F2E #24483F #3E3B70 #41465C #4A3042 #687486 #6961A6 #70A8B6 #A6B1AE

| File PNG · 128×176 | Byte | Mực tổng | Thân / gốc | Hở | Màu | Verdict |
|---|---:|---|---|---:|---|---|
| ev_dark_dobby_red-n0.png | 4351 | 14,3,114,161 | 14,8,114,161 / 14,10,114,159 | 0 | 16 · C1 | Kỹ thuật đạt; halo cần lớn hơn |
| ev_dark_dobby_red-n1.png | 4277 | 14,3,114,161 | 14,8,114,161 / 14,10,114,159 | 0 | 14 · C2 | Kỹ thuật đạt; halo cần lớn hơn |
| ev_dark_dobby_red-n2.png | 4321 | 14,3,114,161 | 14,8,114,161 / 14,10,114,159 | 0 | 14 · C3 | Kỹ thuật đạt; halo cần lớn hơn |
| ev_dark_dobby_red_right-n0.png | 4310 | 18,1,108,161 | 18,8,108,161 / 19,10,108,159 | 0 | 17 · C4 | Kỹ thuật đạt; halo cần lớn hơn |
| ev_dark_dobby_red_right-n1.png | 4263 | 18,1,108,161 | 18,8,108,161 / 19,10,108,159 | 0 | 15 · C5 | Kỹ thuật đạt; halo cần lớn hơn |
| ev_dark_dobby_red_right-n2.png | 4291 | 18,1,108,161 | 18,8,108,161 / 19,10,108,159 | 0 | 15 · C6 | Kỹ thuật đạt; halo cần lớn hơn |
| ev_dobby_spring_rider-n0.png | 4909 | 17,3,111,160 | 17,8,111,160 / 17,10,111,159 | 0 | 12 · C7 | Đạt |
| ev_dobby_spring_rider-n1.png | 4889 | 17,3,111,160 | 17,8,111,160 / 17,10,111,159 | 0 | 11 · C8 | Đạt |
| ev_dobby_spring_rider-n2.png | 4891 | 17,3,111,160 | 17,8,111,160 / 17,10,111,159 | 0 | 11 · C9 | Đạt |
| ev_dobby_spring_rider_right-n0.png | 4884 | 17,1,110,161 | 17,8,110,161 / 18,10,110,159 | 0 | 11 · C10 | Đạt |
| ev_dobby_spring_rider_right-n1.png | 4887 | 17,1,110,161 | 17,8,110,161 / 18,10,110,159 | 0 | 11 · C8 | Đạt |
| ev_dobby_spring_rider_right-n2.png | 4874 | 17,1,110,161 | 17,8,110,161 / 18,10,110,159 | 0 | 10 · C11 | Đạt |
