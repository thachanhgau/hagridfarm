# Orchard and full-garden camera refresh, 2026-11-08

Owner requested further zoom-out and replacement of the orchard trees. Three authored species sheets and three matching snow sheets provide sapling, grown and fruit-bearing poses. Masters and exact prompts are retained in `garden-v05/environment/edge/masters/orchard-refresh-20261108/provenance.json`.

Rebuild with `node garden-v05/build-orchard-refresh.mjs`, then `node garden-v05/build-runtime-webp.mjs`. The focused builder replaces only orchard images/metadata, preserves the 128×144 canvas, (64,126) pivot and root baseline110, and snaps to the existing palette and 2px grid. Winter poses load through the existing deferred winter mapping, bypassing generic per-pixel snow caps. When rebuilding original edge assets, run this focused builder afterwards.

Camera overview now uses the full renderer fit bounds on both narrow and wide screens, removes the desktop map-width floor, and leaves20% zoom-out headroom inside the HUD/dock area. All existing button, wheel and pinch paths share that limit.

Checks: `node --test garden-v05/camera.test.mjs garden-v05/orchard-refresh.test.mjs garden-v05/festival-lazy-art.test.mjs`; `node garden-v05/build-runtime-webp.mjs --check`. Actual imported-browser evidence belongs to the HPVNN worktree. No production deployment or physical-device acceptance is claimed.
