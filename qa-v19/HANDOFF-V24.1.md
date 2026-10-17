# Khu Vườn Hagrid V24.1 — seasonal world scenery

Implemented 2026-10-17 in the standalone prototype. No Git changes, commit, push, deploy or production-account writes. Keep Python server PID 72246 on 127.0.0.1:62795 running.

## Entry points
- Full: http://127.0.0.1:62795/qa-v19/ui-fixture.html?wallet=emulator&qa=1&level=100&view=overview&v=24.1
- Level 1: change level=100 to level=1.
- Embed: http://127.0.0.1:62795/qa-v19/embed-preview.html?v=24.1
- Isolated persistent local QA: ../garden-v05/index.html?qa=1&v=24.1.
- Fixture uses a read-only memory wallet. Never substitute garden-v05/index.html?wallet=emulator: that targets the old actual emulator client.
- Previous handoff: HANDOFF-V24.0.md. Previous manifests preserved.

## Changes
- Three new transparent native pixel-art props inspired by the V24 illustration cards: Christmas tree/gifts, three-pumpkin arch/cauldron, herb market stand. Native PNGs in ../garden-v05/world-v241/; full generation/export provenance in provenance.json.
- Main prop sits on the north aisle, with guarded alternate sites if player layout/decor occupies it. Satellite lights, cauldrons, planters and arches avoid plot/pen footprints and existing decorations. Garden stage limits apply; objects join the existing depth sort without registering gameplay targets.
- Snow covers terrain, tree branches, hut/greenhouse roofs and fence rails, with path banks and icicles. Autumn changes tree foliage and deposits leaves. Rain darkens existing surfaces and adds puddles, ripples and roof drips. Clear weather restores original immutable pixels.
- Fence lights/bunting and prop highlights use the existing render clock. Roots do not bob/shear; reduced-motion clock zero freezes all added movement. Existing animated decor frames are reused.
- Warm light sources follow the exact placed event prop positions at night.
- Seasonal terrain and sprite derivatives are cached for the current weather only. Old background blob URLs are revoked; revision guards prevent late async background exports from overwriting newer seasons.
- Outer forest CSS backdrop uses the same atmosphere/weather tints and compositing order as Canvas, repairing the bright seam visible when zooming on a phone.
- Source/fixture renderer entry points and embed use V24.1. Storage envelope remains v23; no migration.

## Verification
- 126/126 Node tests pass (121 baseline + 5 seasonal placement/alpha/clock/light-anchor tests).
- Chrome viewport QA: level 1 and 100; desktop 1280×800, mobile 390×844 and 320×568, landscape 667×375; embed 1280×800 and 390×844.
- Four weather modes and three festivals: 388 runtime images loaded, no missing files, depth order sorted, no page errors or HTTP errors in the captured matrix. Herbology density corrected and rechecked: 13 festival props at level 100.
- UI Khung cảnh → Tuyết changes the world. Host event/weather/night controls reach the iframe. No horizontal document overflow in checked sizes.
- Canvas SHA-256 stays identical across two captures under reduced motion for each of the three festivals. Normal mode changes over time. Returning from all three recommended themes to clear/day/no-event restores the exact original Canvas hash.
- Real local QA source in a disposable browser context: Gieo ×3 grants +3 XP; planting revision=1 and selected rain persist after reload. Fixture plant action is intentionally read-only, not a failed gameplay test.
- Existing reward/storage tests pass; reward APIs were not changed in this slice.
- Final phone zoom inspection found and repaired the outer-backdrop night mismatch. Final screenshot: final-mobile-yule-detail.png.
- Mobile proof is Chrome viewport emulation, not physical iPhone/Safari. No new CSS nesting, lookbehind or ES2024 APIs were introduced.

## Evidence and recovery
Workspace: /Users/thachanh/.codex/visualizations/2026/10/17/01a1480f-4d73-7520-ad5b-221575ca7c7b/v241/
- qa-evidence.json, tests-final.log, final-*.png, embed-*.png, mobile100-*.png.
- art/*-master.png retains original generated masters.
- before/, baseline.json, staged/, applied.json and guarded apply.py retain the before/after scope.
- New complete integrity manifest: v24.1-sha256.json.
- Resume outside Git. Keep port 62795. Real iOS acceptance remains open.

## In-app browser cache repair — 24.1.2
Actual user IAB failed at stale module exports idleFrameAt and renderAffinitySection. Existing versioned module URLs were inconsistent across releases. All already-versioned runtime module URLs and HTML stylesheet/script entry URLs now use 24.1.2; unversioned storage module identity is preserved. Verified actual IAB iframe displays the full level-100 garden and host reports connected. Evidence: workspace v241/iframe-loaded-iab.png. 126/126 tests pass after the repair. Open embed-preview.html?v=24.1.2. Server 62795 kept running.
