# Hagrid Farm (Khu Vườn Hagrid) — standalone prototype

**Project name for every agent: Hagrid Farm.** Open it at `~/Downloads/hagrid-farm` (a link to this folder, `~/.codex/visualizations/2026/10/13/01a1336a-1a81-7fd1-838a-938d62b6dd7d`; the real path stays so worktrees and sessions keep working).

| Part | Where |
| --- | --- |
| GitHub | https://github.com/thachanhgau/hagridfarm (`origin`, branch `main`; first push 18/10/2026) |
| Game client (this repo, branch `main`) | `garden-v05/`, QA in `qa-v19/` |
| Side branches (git worktrees next to this folder) | `../hagrid-game-panels` (`ui-game-panels`), `../hagrid-icon-hud`, `../hagrid-festival`, `../hagrid-festival-cal`, `../hagrid-profile` — list with `git worktree list` |
| Server (Functions, Galleons wallet) | HPVNN repo, branch `claude/hagrid-garden-phase4-8688d1`, `functions/games/garden-*`, doc `docs/garden/phase4-reconcile.md` |


Independent local Git repository created with owner approval on 2026-10-17. This repository is separate from HPVNN and its worktrees. Baseline: V24.9 (preview cache 24.9.2).

- Source and pixel-art assets: `garden-v05/`
- Read-only fixture and embed host: `qa-v19/`
- Latest handoff: `qa-v19/HANDOFF-V24.9.md`
- SHA-256 manifest: `qa-v19/v24.9.10-sha256.json`
- Thiết kế (đã duyệt): `docs/core-design.md`, `docs/art-bible.md` · Playtest (nháp): `docs/playtest-plan.md`
- Bộ ảnh V24.9.66: `docs/artwork-refresh-20261022.md`; xem `qa-v19/art-gallery.html` (98 mẫu/khung), hoặc fixture `level=500&scenario=habitats` để xem đủ 12 thú trong 6 chuồng.
- WebP V24.9.67: chạy `node garden-v05/build-runtime-webp.mjs` sau mọi lần xuất lại PNG; `--check` phát hiện bản WebP cũ. Bộ chạy chỉ dùng WebP, giữ PNG nguồn. Kết quả và kích thước trong `docs/webp-runtime-20261023.md`.

## Preview

Existing HTTP server: port **62795**, PID **72246** at repository creation. Reuse it; do not stop or replace it as part of Git work.

- Embedded: http://127.0.0.1:62795/qa-v19/embed-preview.html?v=24.9.3
- Standalone fixture: http://127.0.0.1:62795/qa-v19/ui-fixture.html?wallet=emulator&qa=1&level=100&view=overview&v=24.9.2
- Local play with save: http://127.0.0.1:62795/garden-v05/index.html?qa=1&v=24.9.2

The fixture uses in-memory sample data and does not write an account. Source emulator mode is a separate integration path and is not needed for visual review.

## Verification

Run `node --test *.test.mjs` inside `garden-v05/` (143 tests passed at initial commit; 162 at V24.9.9). Latest UI evidence covers desktop 1024px, mobile 375px, embedded host and standalone fixture; physical iOS and production acceptance are not claimed.

Only the active prototype, its assets and selected QA evidence are tracked. Historical sibling versions, ZIP exports and recovery copies stay local and ignored. Remote `origin` = https://github.com/thachanhgau/hagridfarm (added 18/10/2026 at the owner's request). Push and deployment still need the owner's explicit OK each time.
