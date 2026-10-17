# Khu Vườn Hagrid — standalone prototype

Independent local Git repository created with owner approval on 2026-10-17. This repository is separate from HPVNN and its worktrees. Baseline: V24.9 (preview cache 24.9.2).

- Source and pixel-art assets: `garden-v05/`
- Read-only fixture and embed host: `qa-v19/`
- Latest handoff: `qa-v19/HANDOFF-V24.9.md`
- SHA-256 manifest: `qa-v19/v24.9.9-sha256.json`
- Thiết kế (đã duyệt): `docs/core-design.md`, `docs/art-bible.md` · Playtest (nháp): `docs/playtest-plan.md`

## Preview

Existing HTTP server: port **62795**, PID **72246** at repository creation. Reuse it; do not stop or replace it as part of Git work.

- Embedded: http://127.0.0.1:62795/qa-v19/embed-preview.html?v=24.9.3
- Standalone fixture: http://127.0.0.1:62795/qa-v19/ui-fixture.html?wallet=emulator&qa=1&level=100&view=overview&v=24.9.2
- Local play with save: http://127.0.0.1:62795/garden-v05/index.html?qa=1&v=24.9.2

The fixture uses in-memory sample data and does not write an account. Source emulator mode is a separate integration path and is not needed for visual review.

## Verification

Run `node --test *.test.mjs` inside `garden-v05/` (143 tests passed at initial commit; 162 at V24.9.9). Latest UI evidence covers desktop 1024px, mobile 375px, embedded host and standalone fixture; physical iOS and production acceptance are not claimed.

Only the active prototype, its assets and selected QA evidence are tracked. Historical sibling versions, ZIP exports and recovery copies stay local and ignored. No remote or publication is configured by this initialization. Future push, integration or deployment needs explicit authorization.
