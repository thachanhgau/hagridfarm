# Bàn giao: mở rộng vườn Hagrid (08/11/2026)

Owner: «làm cho xong đi». Làm rẻ: **mỗi lần 1 agent, Sonnet cho việc máy móc, Opus chỉ để thiết kế luật và kiểm; đổi phiên ở ~150k context.** Hình nào thiếu thì Codex vẽ (`docs/codex-briefs/run-codex.sh`, tốn tài khoản ChatGPT chứ không tốn Claude).

## Đã xong (local, chưa push/deploy)
- Client: Hagrid nhánh `challenges-160` @ 2ca1715 (worktree `~/.codex/visualizations/2026/10/13/hagrid-challenges`). Gồm: UI audit, 6 thử thách cấp 160 (A–F), đợt 1 hồ nuôi, đợt 2 (crup, knarl, salamander, chuồng mở rộng). Test 405/0.
- Server: HPVNN `.worktrees/hagrid-challenges-160` nhánh `codex/hagrid-challenges-160` @ e4b0131b1. Test `garden-*` 241/0.
- Plan: `docs/garden-expansion-plan.md` (§6 và §9 là hợp đồng code/hình, §8 và §10 là mô phỏng), `docs/level-160-challenges.md`.

## Còn lại
1. Đợt 3: Khu Bìa Rừng Cấm (bãi chăn thả, vườn cây lâu năm), Ma da (cấp 240, hồ), Ngựa lùn (280).
2. Đợt 4: khách hồ sâu (mực khổng lồ, người cá), Cua lửa (340), Quái Tôm Đuôi Nổ (420, nổ đuôi đốt ô cỏ khi bị bỏ đói).
3. Đợt 5: bộ trang trí theo khu, đồ chức năng, chế tạo, kệ trưng bày.
4. Hỏi owner: Hồ sâu 5×4 + 4 luống chưa có chỗ đặt hợp lệ (đang đè một phần lối đi phía nam).
5. Phát hành (khi owner duyệt): bump `?v=` (25.0.2 → mới, mọi import), merge vào `main` của Hagrid, sync sang HPVNN, deploy Functions + client cùng lúc.

## Cách làm mỗi đợt (rẻ)
- Opus viết hợp đồng (id, đường dẫn) vào plan → 1 agent Sonnet chạy Codex vẽ + nhập hình → xong mới tới 1 agent Sonnet code (server + client + test + fixture) → Opus kiểm: test, 1 lần chụp trình duyệt, mô phỏng (giới hạn: lên cấp 500 không nhanh quá ~3% so với 202 ngày; hiện 196).
- Không chụp ảnh lặp nhiều vòng; agent không đọc nguyên `balance-data.mjs` (dòng rất dài), chỉ grep phần cần.

## Đợt 3 — tiến độ (08/11/2026)
- Hình: `edge-art` e1a76a6, đã gộp (efd7e2c).
- Server: HPVNN c3964d740 (garden-*.test.js 250/0; `garden-progression.test.mjs` 19/4 có sẵn từ trước, không do đợt 3).
- Client: f79b28c (WIP: balance, catalog, engine, mood, kỷ vật). Test 395/10 (10 assert đếm/phiên bản cần cập nhật như đợt 2).
- Client còn làm:
  1. [x] (ba19d87) Cảnh: `EDGE_STAGE` (stage 8) trong `garden-growth.mjs` khi `built` có `edge_1`; `right` 33.5 + `edgeRight` 45.5; outline [-5.5,-.5],[33.5,-.5],[33.5,5.5],[45.5,5.5],[45.5,25.5],[33.5,25.5],[33.5,33.5],[-.5,33.5],[-.5,9.5],[-5.5,9.5]; `stageContains` chặn col > 33.5 ngoài hàng 5.5–25.5; `map.columns` 46 khi có `edge_1` (canvas 2560×1440 đủ chỗ). Giữ `GARDEN_STAGES`, `backdropBoundary`.
  2. [x] (ba19d87) Nền pasture/orchard/trail vẽ cạnh `drawV24Ground`, gốc = `iso(tâm chữ nhật) − groundCentre` (bãi chăn tâm 39.5,9.5; vườn cây 39.5,21.5). Cây là vật sắp theo chiều sâu tại tâm hố +.5,+.5; nạp muộn qua `deferredFiles`. Ngựa đi lại trong bãi (35–44 × 6–13) khi có `edge_2` (mẫu: Chó đuôi nĩa chạy).
  3. [x] (ba19d87) Camera: `fitBounds()` trả khung cũ khi màn hẹp (điện thoại giữ zoom tối thiểu), khung mở rộng cho kéo và máy tính.
  4. [x] (a3a7aa6) Khay vườn cây theo mẫu `garden-pond-ui.mjs` (trồng + chọn cây non, hái hết, chặt).
  5. [x] (a3a7aa6) 3 bước edge trong UI xây: nhánh `edge` trong `progression-panels.mjs` (đang ghi «Tổng N chỗ nuôi»), icon `edge_N` dự phòng trong `ui-utils`.
  6. [x] (a3a7aa6) Tab tiệm «Cây non» (`garden-store-ui.mjs`, mẫu «Cá giống»); nhãn Táo/Lê/Mận.
  7. [x] (a3a7aa6) Dòng Ma da trong khay hồ (`mobile-game.mjs` ~770); `STAND_IN_TONES` cho 2 loài.
  8. [x] (ba19d87) Fixture `level=290` hiện khu.
  9. [x] (a3a7aa6) Sửa 10 test, thêm `garden-edge.test.mjs`.
  10. [x] Mô phỏng cấp 500 (`runCreatures.mjs` + patch) và điền §11.5; rào: ngày ≥ 196.
- **Đợt 3 xong local (08/11/2026):** client 372abf7 + sim 7cc37af (412/0), server HPVNN c3964d740 (garden-*.test.js 250/0). Sim cấp 500: ngày 196 (đúng mép rào; mỗi loài mới kéo sớm ~1 ngày, chi phí việc Hagrid trả lại). Giá cây non 120 G đã kiểm (15 × 400/50).
- Chưa ai xem tận mắt: khay vườn cây, thanh công cụ có thêm nút «Vườn cây», ô cấp ở fixture level=290 (hiện 190?). Owner thử trên 3026.
- Lỗi hình nhỏ: vệt hồng ở cổng bãi chăn; tay Ngựa lùn khó đọc ở cỡ thật.
- Đợt 4 kế tiếp: mực khổng lồ, người cá, Cua lửa (340), Quái Tôm Đuôi Nổ (420). Sim đang ở 196: đợt 4 cần XP mỗi bữa thấp hơn hoặc chi phí bù, vì không còn chỗ.
