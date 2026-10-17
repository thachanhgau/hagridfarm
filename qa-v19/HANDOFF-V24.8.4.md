# V24.8.4 — one visible scene-control location in embed
2026-10-17. Standalone prototype, outside Git; server 62795 preserved.

- Preview: http://127.0.0.1:62795/qa-v19/embed-preview.html?v=24.8.4
- Previous: HANDOFF-V24.8.3.md. Display remains V24.8. Only entry runtime and v24-ui.css cache move to 24.8.4; dependencies unchanged.
- Host iframe explicitly passes sceneControls=host. Both mobile runtimes hide the HUD extras only when that flag is present AND window is framed. CSS enforces display:none for hidden extras. Standalone keeps both controls even with the flag in its URL; other embeds without flag keep them too.
- Event and scenery objects remain present for synchronization. Menu/reward paths and gameplay unchanged.
- QA: embedded HUD shortcuts hidden; host rain and Yule commands confirmed in child DOM; 360×780 visual check and no browser console errors. Standalone with the same query flag retains both buttons and opens scenery panel. Both runtime syntax checks pass. Prior engine suite 139/139 not rerun for this presentation-only adjustment. No physical iOS or production proof.
- Recovery/evidence: /Users/thachanh/.codex/visualizations/2026/10/17/01a1480f-4d73-7520-ad5b-221575ca7c7b/v2484 (before/, staged/, baseline.json, apply.py, embed-mobile.png).
