# Khu Vườn Hagrid V24.0 — compact UI & illustrated scenery

Date: 2026-10-17. Status: implemented in the standalone prototype, local QA passed.
Owner: primary Codex lead; bounded art and panel workers completed and reviewed.
No Git edits, commit, push, deployment or production-account writes. Existing Python server PID 72246 still serves 127.0.0.1:62795.

## Entry points

- Full preview: http://127.0.0.1:62795/qa-v19/ui-fixture.html?wallet=emulator&qa=1&level=100&view=overview&v=24.0
- Level 1: same URL with level=1.
- Embed: http://127.0.0.1:62795/qa-v19/embed-preview.html?v=24.0
- Local persistent QA garden: http://127.0.0.1:62795/garden-v05/index.html?qa=1&v=24.0
- Source: ../garden-v05. Preserve original V23 handoffs/manifests.
- IMPORTANT: the fixture wallet is in memory. Do not use garden-v05/index.html?wallet=emulator as an interchangeable fixture: that path still targets the old real emulator client.

## V24 changes

- Two secondary HUD entries: Lễ hội and Khung cảnh. Tasks live in Cú. Profile owns progression/achievements; creature cards link directly to affinity.
- Six menu tiles: Thăm vườn, Bưu thiếp, Sổ tay, Lưu bút, Âm thanh, Cài đặt.
- Events show four compact theme choices, artwork, points and three milestones. Ngày thường has no milestones. Selecting an event applies its recommended weather/time; weather/time remain independently selectable.
- Seven new 640×360 WebP illustrations: three events and four weather scenes; total 717,618 bytes. Day/dusk/night cards reuse clear art with presentation variants.
- Added restrained procedural environmental accents: ground puddles/ripples, fallen leaves, snow patches, roof drips/snow, holiday lights/tree/pumpkins/bunting. Sun rays only appear with clear weather outside night. Existing sprite/motion pipeline retained.
- Shortened labels throughout planting, animals, crafting, building, layout, collection entry points, profile and shop. Longer rules/lore moved into optional details where applicable. Costs, quantities, conditions, timers and destructive uproot explanation remain.
- Owl shows five compact task rows, exact reward quantities and the 3/5 chest. Removed letter boilerplate and nested list scrolling; repaired contrast.
- Mobile fixes: event thumbnails no longer clip labels at 320px; almanac grid fits narrow panels; shop available balance is fully visible.
- New files: v24-visuals.mjs, garden-v24-scenery.mjs, v24-panels.css, v24-ui.css, v24-ui.test.mjs, v24-art/*.
- Existing storage envelope remains v23 deliberately; no migration or wipe.

## Verification

- 121/121 Node tests pass (119 baseline + 2 scenery invariants). Test log: /Users/thachanh/.codex/visualizations/2026/10/17/01a1480f-4d73-7520-ad5b-221575ca7c7b/v24/tests.log.
- Chrome viewport QA: level 1 and 100 at 320×720, 390×844, 667×375 landscape and 1280×720.
- Events/scenery/menu: no horizontal document/panel overflow, missing images, HTTP error responses or JavaScript page errors in the 8-case matrix.
- All 19 panel routes rendered at 320px. Found and repaired almanac overflow, then verified it fits. Creature card → Gắn kết route works.
- Shop opens, shows complete 2,500 Galleons preview balance without overflow at 320px. Bưu thiếp opens.
- Embed QA at 390×844 and 1280×800: host event/weather/night commands reach iframe, bridge ready, no outer/inner overflow or page errors.
- Local QA save: rain+dusk override and event choice persist unchanged across reload. Planting three slots persists with XP=3 after reload.
- Fixture event reward: +15 water/+4 pumpkin, duplicate returns ALREADY_CLAIMED.
- Fixture affinity reward: +8 water/+2 pumpkin, duplicate blocked; pet grants +12 affinity XP.
- Daily task reward buttons grant expected kit/boost/crop quantities. Chest becomes available at 3/5; observed +25 water/+2 boost/+3 kit, duplicate returns ALREADY_CLAIMED. Event-point reward also covered by Node tests.
- Full reward/storage regression tests pass. Fixture intentionally resets on reload and does not save to a real account.
- Evidence: /Users/thachanh/.codex/visualizations/2026/10/17/01a1480f-4d73-7520-ad5b-221575ca7c7b/v24/qa-evidence.json. Some entries show diagnostic failures before fixes; finalQA/storeFinalQA record repaired results.
- Screenshots: /Users/thachanh/.codex/visualizations/2026/10/17/01a1480f-4d73-7520-ad5b-221575ca7c7b/v24/ (qa-*, final-*, embed-*, V24-mobile-scenery.png).

## Art provenance / recovery

- Built-in image_gen generated all seven images. Full prompts, source output paths, verified WebP hashes and sizes: ../garden-v05/v24-art/provenance.json.
- Preserved PNG masters: /Users/thachanh/.codex/visualizations/2026/10/17/01a1480f-4d73-7520-ad5b-221575ca7c7b/v24/art/artmasters/.
- Before copies, baseline hashes, staged outputs and guarded apply record: /Users/thachanh/.codex/visualizations/2026/10/17/01a1480f-4d73-7520-ad5b-221575ca7c7b/v24/.
- New complete SHA-256 manifest: v24.0-sha256.json. Earlier V23 manifest stays unchanged.

## Limits / next handoff

- Mobile checks use Chrome viewport emulation, not a physical iPhone/Safari run. Source uses no new CSS nesting, regex lookbehind or ES2024 API; real iOS 16 device acceptance remains unverified.
- Illustration cards are separate artwork; the game canvas adds procedural atmosphere accents rather than reproducing the entire illustrated composition.
- Keep server 62795 alive. Remain outside Git until owner explicitly requests repository integration.
