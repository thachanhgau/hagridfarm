# V24.8.3 — compact embed host header
2026-10-17. User requested redesign of the large button cluster above the iframe.

- Preview: http://127.0.0.1:62795/qa-v19/embed-preview.html?v=24.8.3
- Only implementation owner changed: qa-v19/embed-preview.html. Game remains V24.8 / cache 24.8.2. Previous: HANDOFF-V24.8.md.
- Replaced thirteen always-visible buttons and long heading/status with crest, connection dot and three icon/label disclosure controls: festivals, scenery, visits. Art tiles reuse existing V24 assets. Added clear-weather choice. Panels overlay instead of pushing game down; close after selection, outside pointer, iframe focus or Escape, returning focus for close/selection/Escape.
- Browser QA in local IAB: 360×780 (header 64px) and 1280×800 (header 68px), no horizontal overflow; all visible header targets >=44px; all 10 tile images loaded. Confirmed snow/clear, night/day, Yule/Halloween, Newt/home reflected inside iframe. Escape and auto-close passed; no captured console errors.
- UI-only change: targeted browser verification, no new engine tests; prior V24.8 engine suite 139/139. Physical iOS and production not tested. Fixture remains read-only memory preview.
- No Git, accounts, deployments or server lifecycle changes. Port 62795 retained.
- Recovery and screenshots: /Users/thachanh/.codex/visualizations/2026/10/17/01a1480f-4d73-7520-ad5b-221575ca7c7b/v249/before.html, embed-preview.html, header-mobile.png, picker-mobile.png.
