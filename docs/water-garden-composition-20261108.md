# Water beds and orchard composition correction

Owner rejected the raised snowy water rows and orchard roots sitting near the back corner. Replace the channels with authored low mossy banks, open teal water and restrained snowcaps. Replace raised square orchard pits with smaller organic mulch basins, preserving all six logical planting centres.

Root cause: orchard sprites have roots at groundCentre.y110, while the generic decoration pivot is126 (includes footprint lift). Orchard renderer now anchors the roots using groundCentre; no saved tree slots or gameplay coordinates changed. Regression renders all six slots at every growth stage and compares actual draw origins to the root anchor; it failed16px before repair.

Three original generated masters, prompts and hashes are under `garden-v05/environment/pond/masters/beds-orchard-20261108/`. Rebuild focused assets with `node garden-v05/build-water-garden-refresh.mjs` AFTER the original pond/edge/winter builders, then `node garden-v05/build-runtime-webp.mjs`. The builder preserves128×88 channel canvases and576×314 orchard canvas, binary alpha, palette and2px grid; earth basins are extracted from authored art and aligned to existing planting slots. Source art stays out of runtime imports.

Verification: existing broad source suite403 pass /2 skip /0 fail, excluding historical progression-engine fixture as before; two focused orchard tests pass after adding basin-centre coverage. Winter provenance and water palette checks pass; WebP1382+8 verified. Actual3026 browser proof recorded separately in the HPVNN import. No release or physical-device claim.

## Legibility follow-up

Owner reported broken perimeter pixels and saplings too small to distinguish from soil. Stage0 packing now allows76×84px instead of32×44px, preserving the existing root anchor and 2px grid. Adult stages remain unchanged. The ground builder clears the old basin perimeter before re-centring soil, removing the displaced dark-green ring that turned into dotted outlines under snow. Outer alpha is clipped to the exact10×8 shared-grid footprint with a continuous dimetric edge. A minimum readable sapling ink-size regression failed before repair. Source suite404 pass /2 skip /0 fail (same historical fixture exclusion);13 focused renderer/orchard checks pass.
