# Hagrid V24.9.84 — pet care game buttons

Commit: SELF. Parent129871ac08fb26f975d7a4c5ab4ce50f7aa93093. Local only.

The inline care row uses seven game tiles with pixel icons, short labels, tinted icon glows, raised edges and small stock badges. Petting uses a pink heart; rotation the existing replay arrow; bonding a chest with a small heart. Magic water, premium meal, Skele-Gro and pen feast use their existing native item artwork. No new raster, network dependency, action, cost or timer is introduced.

Tiles are76–88px wide and at least66px tall. Seven fit the desktop panel; phones retain native horizontal scrolling. Hover lifts a tile and tilts its icon; pressing depresses it. Disabled tiles retain readable labels and stock counts. Reduced-motion preferences suppress these transforms/transitions. Full action names remain accessible when a visual label is shortened.

`renderPetCareButtons` creates the icon/label nodes once and updates only the stock badge. The previous premium refresh wrote button.textContent every tick, which would erase icons. The existing target/use-limit display now lives in garden-premium-controls.mjs; it retains crop-button text while the pet row owns its markup. The engine/server remain authoritative. mobile-game.mjs shrinks754→745 physical lines. Cache queries move together to24.9.84.

## Verification

- The new icon check failed on the prior text-only row, then passed.
- Source306/306 tests, zero failures/skips. WebP pack1,141+8 and313 grid metrics verified unchanged.
- Opaque, intercepted in-memory fixture:24/24 Chrome/WebKit cases across five viewports. Checks include image loading, stock badge5→4, icon node identity surviving premium/timer refresh, exact existing commands and costs, focus, care actions, portrait fit and bounds. No page errors, external requests, dock/page overflow or touch targets under44px. A focused follow-up also explicitly waits for the bonding panel to close before finishing the two desktop cases.
- Evidence: qa-v19/pet-game-buttons-qa.json. Browser-emulated touch and desktop WebKit do not prove physical-iPhone/iOS16 or production acceptance.

Import this committed source through HPVNN scripts/sync-hagrid-garden.mjs. The clean continuation checkout is HPVNN .worktrees/hagrid-pet-game-buttons, based on9a072acef with committed prior Hagrid history merged. The previous dirty hagrid-removable-decor checkout stays intact for recovery/review; its pet UI implementation was already preserved in parent129871a. Do not hand-edit public game output or publish without release authorization.
