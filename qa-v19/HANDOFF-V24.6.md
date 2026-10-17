# Hagrid Garden V24.6 — image-led menus
2026-10-17. Standalone prototype outside Git. HTTP 62795 remains PID 72246.

- Preview: http://127.0.0.1:62795/qa-v19/embed-preview.html?v=24.6
- Previous baseline: HANDOFF-V24.5.md. Runtime cache 24.6; world art remains V24.4. Fixture wallet remains memory-only.
- AAA reference researched: https://interfaceingame.com/games/hogwards-legacy/ (Game Menu image inspected), https://interfaceingame.com/games/ghost-of-tsushima/. Layout inspiration only; all garden artwork stays existing local pixel art.
- Menu is now six medallion destinations around the current weather illustration; audio shortcut replaced by Events (audio remains in Settings). Settings: scene image + four switches; redundant On/Off text removed, utilities/status under Khác, save errors always visible. QA controls collapsed. Active tool alone keeps its label; all controls retain accessible names. Repeated plot status moves to seed options; cooldown stays visible. Crop/creature captions shortened.
- Keyboard trap now includes summary controls and excludes descendants of closed details. Switch focus restoration, OS reduced-motion lock, existing preference persistence and callbacks preserved.
- Changed owners: garden-menu-ui.mjs (new), garden-settings-ui.mjs, garden-controls.css, progression-panels.mjs, v24-visuals.mjs, wizard-ui.mjs and both mobile runtimes. Other runtime imports/HTML bumped for cache consistency.
- Verified: 139/139 Node tests. Browser: level 1 desktop and 360×780, level 100 embedded; all six menu routes, four switches toggled/restored, Khác expand/collapse and Tab wrap, scenery route, seed details access. No runtime errors observed. Physical iPhone/Safari not tested.
- Recovery and visual evidence: /Users/thachanh/.codex/visualizations/2026/10/17/01a1480f-4d73-7520-ad5b-221575ca7c7b/v246/ contains before/, staged/, SHA guards, apply.py, tests.log, menu-360.png, settings-360.png, menu-mobile.png and settings-mobile.png.
- v24.6-sha256.json covers current prototype assets/runtime and this handoff. No Git, production data or server lifecycle changes.
