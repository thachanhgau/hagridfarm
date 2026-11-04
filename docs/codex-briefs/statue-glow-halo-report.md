# Tượng Dobby — vòng hào quang sau đầu

Hoàn thành 4/4 bước. Chỉ làm art; không commit, push hoặc deploy.

[Preview](statue-glow-halo-preview.png): 4 phần theo thứ tự dark/default, dark/right, spring/default, spring/right. Mỗi phần có 1× và nearest-neighbour 3×; cột original dưới night tint, night + g0, night + g1, night + g2. Cỏ #3F6A45, tint rgba(10,18,34,.44) phủ cả cỏ và tượng trước khi chồng glow. Đã xem toàn bộ preview cuối. Đây là kiểm tra ảnh ghép offline; Claude Code phụ trách tích hợp game, test và commit.

## Nguồn và xử lý

Sao chép đủ 12 PNG glow trước khi sửa vào `masters/variants/aura-v1/`; bản sao khớp byte với HEAD ban đầu. Không thay master/prompt glow trước đó hoặc các biến thể cũ.

Dùng built-in ImageGen, hai lần tạo ảnh thành công, mỗi tượng một master sheet gồm hai vòng cho hai hướng. Tham chiếu night preview cùng sheet hai tượng gốc phóng 3× nearest-neighbour. Master và prompt:
- `masters/ev_dark_dobby_red-halo.png`: SHA256 `6a9005b097da6d5df14ccc399c13361ac88adcde11eb94c6f619f3d740a9149f`; exact prompt in `masters/ev_dark_dobby_red-halo.txt`.
- `masters/ev_dobby_spring_rider-halo.png`: SHA256 `42ce690d68d796e819d70a334d3d590a53d443a855c8b2f6b2cef66ec80def63`; exact prompt in `masters/ev_dobby_spring_rider-halo.txt`.

Nguồn ImageGen: `/Users/thachanh/.codex/generated_images/01a1a6f3-a697-7ce1-a00d-d7d02441a272/exec-6b1576df-4543-48ef-a624-0c9ab37deed6.png` (dark) và `exec-98e94ed3-a8ae-4d23-b519-72257adeeb54.png` (spring). Đã chép cả hai master vào workspace.

Trích contour dải sáng của vòng ImageGen bằng median theo góc; làm đều contour và đưa về lưới native, khóa lõi 2 px theo khoảng cách pháp tuyến, fringe ngoài 1–2 px checker thưa dần. Không dùng master khổ lớn trực tiếp trong game. Các hộp trích master inclusive: dark trái (135,111)–(948,604), phải (1221,111)–(2034,604); spring trái (81,117)–(907,674), phải (1072,117)–(1899,674).

Tâm native (x,y): dark mặc định (65,42), dark phải (62,42), spring mặc định (69,40), spring phải (62,40). Vòng ellipse gần tròn bao quanh tai, ngang khoảng 106–111 px kể fringe, cao khoảng 74–78 px trước khi tượng che. Lõi và vị trí không đổi giữa ba frame; g1 chỉ thêm fringe, g2 bớt fringe. Dark: #FFC36B / #F5D69A / #ED8A45; spring: #B7DEE0 / #E8F0ED / #70A8B6. Highlight trên-trái.

Loại mọi pixel vòng trùng alpha khác 0 của tượng gốc (nghiêm hơn chỉ alpha 255), nên đầu, tai, tay và thân đều che vòng. Sau đó ghép vòng dưới glow cũ: mọi pixel RGBA đã có trong glow cũ được giữ nguyên byte, kể cả mắt, rune, viền, aura và ground halo. Tổng cộng thêm 5000 pixel mới vào 12 frame.

## Kiểm tra

12/12: canvas 128×176 giữ nguyên pivot (64,160); alpha chỉ 0/255; RGB dưới alpha 0 bằng 0; màu thuộc palette.mjs; nội dung trong x4…123 và có viền trong suốt ít nhất 1 px. 0 pixel mới trên alpha tượng; 0 pixel glow cũ đổi màu hoặc mất. 12/12 WebP giải mã khớp RGBA PNG tuyệt đối.

Đã chạy đúng lệnh SHARP_MODULE được yêu cầu với build-runtime-webp.mjs, rồi node garden-v05/build-runtime-webp.mjs --check: PASS, 1195 lossless conversions + 8 existing WebP. Không viết tay mã game .mjs; chỉ runtime-image-url.mjs và runtime-webp-manifest.json được builder tái tạo. git diff chỉ có 12 PNG, 12 WebP và hai file builder đó; file mới gồm master/prompt, 12 bản sao, preview và report. Các brief/log có sẵn được giữ nguyên. Không sửa event-assets/, decor-assets/, CSS, tests, functions/ hoặc HPVNN.

## Bảng bàn giao

Đường dẫn tương đối với garden-v05/environment/statue-glow/. Hộp là bounds của mask vòng sau khi tượng che, chưa tính glow cũ. “Vòng px” là số pixel vòng còn lại sau che; trong ngoặc là số pixel mới thực sự thêm (phần trùng glow cũ giữ nguyên). “Px bị tượng che” là số pixel vòng bị loại trước ghép. Bounds fringe g2 có thể hẹp hơn; lõi không dịch chuyển. “Đạt” là đánh giá tài sản và preview, chưa phải duyệt của chủ dự án hoặc bằng chứng runtime.

| File | Hộp vòng (inclusive) | Vòng px (thêm mới) | Px bị tượng che | Kết luận |
|---|---|---:|---:|---|
| ev_dark_dobby_red-g0.png | (10,3)–(120,76) | 549 (448) | 220 | Đạt |
| ev_dark_dobby_red-g1.png | (10,3)–(120,76) | 577 (439) | 234 | Đạt |
| ev_dark_dobby_red-g2.png | (11,4)–(118,76) | 425 (361) | 182 | Đạt |
| ev_dark_dobby_red_right-g0.png | (7,3)–(117,78) | 607 (539) | 165 | Đạt |
| ev_dark_dobby_red_right-g1.png | (7,3)–(117,78) | 641 (539) | 171 | Đạt |
| ev_dark_dobby_red_right-g2.png | (8,4)–(116,76) | 473 (431) | 137 | Đạt |
| ev_dobby_spring_rider-g0.png | (16,3)–(121,61) | 424 (394) | 282 | Đạt |
| ev_dobby_spring_rider-g1.png | (16,3)–(121,62) | 455 (401) | 303 | Đạt |
| ev_dobby_spring_rider-g2.png | (17,5)–(120,61) | 353 (334) | 222 | Đạt |
| ev_dobby_spring_rider_right-g0.png | (10,3)–(113,63) | 436 (389) | 271 | Đạt |
| ev_dobby_spring_rider_right-g1.png | (10,3)–(113,63) | 468 (391) | 283 | Đạt |
| ev_dobby_spring_rider_right-g2.png | (11,5)–(112,62) | 353 (334) | 209 | Đạt |
