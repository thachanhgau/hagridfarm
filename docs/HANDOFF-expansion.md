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
