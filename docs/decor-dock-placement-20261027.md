# Hagrid V24.9.85 — decor dock and native-pixel placement

Commit: SELF. Parent96f74ab05875fdfc0aeeb31c2bf26f0f5e37f4c6 (pet game buttons). Local only.

Xây now contains Công trình and Trang trí. Construction keeps its existing controls and handlers in a separate pane. The decor tray contains only owned, known artwork, preserves selection/focus/scroll and labels placed/stored items. Đặt/Di chuyển opens the existing preview; Cất uses the existing placeDecoration command. The shop and default garden/keepsake collection remain one tap away. Previews/cancel never buy or save. Returning from placement/shop restores the invoking control. Landscape thumbnails have bounded labels; the selected item retains its full name.

The placement board uses the same64×32 projected cells as the garden. Its stepped integer-pixel edges, small corner handles, check/cross and translucent fill use the approved palette. The old bright half-cell checker carpet is replaced with a local cell guide and small candidate anchors. One raster layer is cached per changed preview and reused during camera redraws; unchanged drag positions do not rerasterize it. Artwork, footprints, native pivots and saved coordinates are not rescaled or migrated.

New items prefer whole-cell positions. Existing half-cell positions remain valid, and the1 ô/½ ô control selects movement precision without auto-saving. Dragging the selected sprite changes its preview and keeps the camera still. Dragging elsewhere pans; a second pointer changes to pinch. Four nudge buttons and arrow keys move the preview; Shift offers half-cell keyboard adjustment. R rotates, Enter confirms when allowed, Escape cancels. Invalid positions retain the normal reason and disabled confirmation, including keyboard confirmation. Pointer/keyboard handlers are cleaned up on close.

## Reference and scope

- Hay Day's official [Edit Mode](https://support.supercell.com/hay-day/en/articles/edit-mode.html) separates editing, storage, shop access and explicit layout confirmation.
- Nintendo's official [New Horizons tips](https://play.nintendo.com/news-tips/tips-tricks/animal-crossing-new-horizons-discover-tips/) show a decorating guide with rotate/grab/store controls. These interaction patterns informed the compact controls; the pixel geometry and artwork remain Hagrid's own.
- Existing half-cell server precision and collision validation stay authoritative. No wallet, reward, ownership, price, listener or backend change was made. Cache queries move together to24.9.85. Existing exports remain compatible.

## Verification

- Source313/313 tests, zero failures/skips. New checks cover owned-only decor, immutable saves, whole/half snapping, sprite grab bounds, integer raster steps,64×32 cells, layer reuse and switching a drag into pinch without picking the garden. Existing palette guard passes. The existing preview guard still caps suggestions at18 after filtering for movement precision.
- Build/decor:8/8 intercepted opaque Chrome/WebKit cases across1280×800,375×812,320×568 and812×375. They stash/place/cancel, switch back to intact construction, open shop/default decor, preserve inventory/ownership/money/focus, and check bounds/touch targets.
- Placement:8/8 cases at DPR1 and8/8 at DPR2, plus a focused DPR2 phone check. Chrome phone cases use DevTools-emulated native touch; WebKit uses mouse dragging in touch-enabled viewports. Whole/half nudge, keyboard rotation, drag without camera pan, blocked Enter and cancellation are verified with unchanged saved state. No external requests/page errors.
- Reports: qa-v19/build-decor-qa.json and qa-v19/placement-qa.json. These are in-memory fixtures, not signed-in full-app, physical-iPhone/iOS16 or production acceptance.

The source renderer shrinks1881→1855 lines, work-trays532→531, mobile-game remains745. These owners still exceed500 and retain that debt; new modules stay scoped. Import through HPVNN scripts/sync-hagrid-garden.mjs into the clean hagrid-pet-game-buttons continuation. Keep the prior dirty hagrid-removable-decor checkout intact. Demo3147 and app3026 remain separate; no push/deploy is authorized.
