# Hagrid Garden V24.7 — game dock
2026-10-17. Standalone outside Git. Server remains 127.0.0.1:62795, PID 72246.

- Entry: http://127.0.0.1:62795/qa-v19/embed-preview.html?v=24.7.2
- Full: http://127.0.0.1:62795/qa-v19/ui-fixture.html?wallet=emulator&qa=1&level=100&view=overview&v=24.7.2
- Previous: HANDOFF-V24.6.md. Display version V24.7, runtime cache 24.7.2; world art unchanged.
- Dock is now a separate full-width item shelf above the tool rail, with matching forest/brass styling. Tool rail moved in actual DOM order. Collapsed rail is 68px in portrait. Single unlocked seed uses a compact one-row shelf. Other trays expose 5–6 items at 360px; selected item name and primary action remain in a fixed footer.
- Distinct sickle icon for harvest, direction glyph + row number with full tooltip, concise creature status, crop illustration restored on narrow displays. Craft input/output use existing visualItemIcon art plus exact have/need and output amounts; full accessible summary/tooltips and blockers remain. Build cards have numbered badges. No new raster assets or gameplay/economy changes.
- Owners: garden-dock.css (new), both entry HTMLs, both mobile runtimes, garden-controls-ui.mjs, wizard-ui.mjs, work-trays.mjs. Existing DOM test shim gained classList.add to support the shared visual icon helper; assertions unchanged. Other runtime references bumped for cache consistency.
- 139/139 Node tests pass. Browser QA: 360×780 level 1 and 100, 780×360 landscape, narrow level-100 iframe. Verified all dock modes, expand/collapse, seed direction, last-item horizontal scrolling, creature options, craft batch counts and timed-batch lock, build empty state and numbered selection, >=44px visible targets, no horizontal dock overflow or runtime errors. Landscape auto-collapse preserved.
- Fixture is read-only memory preview: clicking craft action correctly reports no account write. Mutation/ready/claim logic covered by existing engine/work-tray tests, not claimed as live end-to-end reward QA. No physical Safari/iPhone test.
- Recovery/evidence: /Users/thachanh/.codex/visualizations/2026/10/17/01a1480f-4d73-7520-ad5b-221575ca7c7b/v247/ (before/, staged/, SHA guards, apply.py, tests.log, dock-level1-360.png, dock-craft-360.png, dock-creatures-360.png).
- Lead reviewed bounded Luna read-only dock/camera dependency audit. No Git, production data, account or server lifecycle changes.
