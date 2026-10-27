# Hagrid V24.9.83 — compact pet care menu

Commit: SELF. Parent source92b186f272d482e92a8a7c149ce7c056b8c6a46e. Local only; import this committed source with HPVNN scripts/sync-hagrid-garden.mjs.

The Nuôi dock separates owned pets from adoption, labels each pet's current state and keeps one primary action visible: adopt, feed, wait or finish/claim. Costs, unlocks, capacity, starter food and meal timestamps come from the existing engine. Explicitly opening the dock prioritizes a ready pet; passive refresh preserves selection, focus and scroll. Missing food and housing lead to the existing shop or build view without purchasing anything automatically. Closing the shop returns focus to its invoking control, including touch devices.

Owner feedback moved petting, rotation, bonding gifts and existing premium care controls directly into the dock. The separate heart dialog is removed. The menu is at most660px wide (previously820px); mature-pet fixtures measure237px tall on desktop,257px on portrait phones and223px in short landscape. All actions retain at least44px touch height. Existing native horizontal scrolling holds the pet list and care row.

Portraits render at40px inside a48px box; tray portraits render at30px. Each uses the existing sprite bounds to fit the complete character. No world scale, artwork, save, reward, wallet price, server command or timer interval changes. The older grid and default-decoration stashing stay intact. Runtime cache queries move together to24.9.83. mobile-game.mjs shrinks from766 to754 physical lines.

## Verification

- Source306/306 tests pass, zero skips/failures. New pure-state tests exercise lifecycle and exact adoption/feeding costs without mutating saves.
- Strict intercepted opaque iframe:24/24 Chrome/WebKit cases, five viewport sizes from320px portrait to1280px desktop and812×375 landscape. Touch is emulated on phone cases. Tests cover adoption and its food charge, locks, capacity, shortage/shop/focus, feeding, pending requests, actual meal timers, claim, ready-pet priority, passive focus/selection, all12 portrait fits, direct petting/rotation/bonding and meal boost/premium controls. No page errors, external requests, page/dock overflow or sub44px buttons.
- The prior WebP pack1,141 conversions +8 existing and313 grid specifications were verified unchanged. No raster bytes changed.
- Browser report: qa-v19/pet-controls-qa.json. Browser fixtures use an in-memory wallet. This does not claim a signed-in full-app save, physical iPhone/iOS16 or production acceptance.

## Layout maintenance

Give thumbnail helpers the actual target raster size. Shrinking a64px layout box with a CSS transform inside a smaller portrait leaves its original layout footprint and can spill into the label. Center a40px bounded sprite in a48px box instead. The pet column explicitly stretches its children: inherited dock align-items:center otherwise lets a long care row keep its content width despite overflow-x:auto. Keep nested scrolling on the row and preserve its DOM nodes during refresh.
