# Hagrid Garden V24.5 — visual controls and settings
2026-10-17. Standalone prototype outside Git. Keep HTTP 62795 / PID 72246.

## Entry
- Embed: http://127.0.0.1:62795/qa-v19/embed-preview.html?v=24.5
- Full: http://127.0.0.1:62795/qa-v19/ui-fixture.html?wallet=emulator&qa=1&level=100&view=overview&v=24.5
- Previous: HANDOFF-V24.4.md. Runtime cache 24.5. World art remains V24.4.
- Fixture remains a memory-only preview; never substitute source index.html?wallet=emulator.

## Changes
- garden-controls-ui.mjs / garden-controls.css: game-art icons for sow/harvest/creatures, coloured craft/build glyphs, stronger selected tool, clearer count badges, 44px+ controls, quick settings beside zoom. Existing action handlers and level gates preserved.
- garden-settings-ui.mjs: four whole-card switches (sound, movement, scenery, grid) with explicit accessible states, focus restoration, fullscreen/save export, illustrated scenery shortcut and truthful save/session status. QA tools remain below in local QA sessions.
- Persistent motionEnabled/propsVisible/grid visual preferences with safe legacy defaults. Main runtime and preview runtime aligned. OS reduced motion wins; movement switch shows effective off and is disabled under system reduction. CSS motion and canvas ambient motion freeze together; existing action clock remains unchanged.
- No gameplay/reward rules or raster assets changed. No Git/account/server mutations. Bounded Luna authored settings component; lead reviewed DOM, callback/error handling, integrated and visually verified.

## Verification
- 139/139 node tests pass (137 baseline + preference round-trip / legacy-default regressions).
- Actual IAB: level 1 desktop, level 100 narrow embedded viewport; all four settings toggled and restored, motion-paused class confirmed, scenery removal visually checked; direct settings/scenery navigation and Plant/Creature/Craft/Build selection verified. No runtime errors.
- Preference persistence verified by unit storage round trip; preview intentionally does not retain preferences after reload. Physical iPhone and OS reduced-motion toggle not tested on device; reduced-motion branch covered by worker DOM smoke and existing renderer tests.
- Server remains PID 72246 on 127.0.0.1:62795.

## Evidence/recovery
- v245-controls.png, v245-settings.png, v245-tests.log in this QA folder.
- v245-recovery/: before/, staged/, baseline.json, applied.json, guarded apply.py and integration script (recovery snapshot outside Git).
- v24.5-sha256.json current manifest; previous handoffs/manifests preserved.
