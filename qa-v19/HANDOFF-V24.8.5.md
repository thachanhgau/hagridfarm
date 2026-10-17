# V24.8.5 — single-row HUD
2026-10-17. Outside Git; existing server 62795 preserved.

- Preview: http://127.0.0.1:62795/qa-v19/embed-preview.html?v=24.8.5.1
- Previous HANDOFF-V24.8.4.md. Display V24.8; runtime entries cache 24.8.5, v24-ui.css cache 24.8.5.1.
- Both HTML entries relocate existing owlMailButton into hud-actions before menuButton (same element ID and handler). v24-ui.css puts plot, level, wallet, inventory, owl and menu on a 44px row at <=1100px; compact level badge at <=600px, narrow 320px sizing keeps >=44px targets. No gameplay changes.
- Both runtimes apply host-scene-controls class from existing explicit embed flag. In that mode camera/toast/tour top offset drops from 116 to 64px. Standalone retains scene shortcuts on second row; its plot and owl are on first row.
- 139/139 Node tests pass. IAB QA: 320px host (305px inner frame) all six controls fit with >=44px targets; 360px host screenshot; wider 780px host all three level/plot/owl Y positions match and HUD 44px tall. Plot picker and owl letter opened/closed successfully after DOM move. Standalone level 1 at 360px retains scenes and same-row plot/owl; no captured console errors. No physical iOS testing.
- Recovery/evidence: /Users/thachanh/.codex/visualizations/2026/10/17/01a1480f-4d73-7520-ad5b-221575ca7c7b/v2485/before/, staged/, hud-mobile.png, tests.log. No Git, account, production or server lifecycle changes.
