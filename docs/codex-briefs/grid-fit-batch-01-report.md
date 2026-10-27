# Grid-fit batch 01 — report

2026-10-27 · source worktree `hagrid-source` · branch `claude/hagrid-greenhouse-ground` · starting HEAD `b6cdeb02832dcce00ecb08f6248d6178360eb485`.

Completed **6/6 items, 12/12 facings**. New transparent two-view masters were generated with the built-in `image_gen` tool, exported directly through the special pack's native sampling/quantization pipeline, imported into this source repository's runtime assets, and encoded to lossless WebP. Original masters are archived at `garden-v05/special-products-assets/masters/variants/<id>-v1.png`; all six archives match HEAD byte for byte. No exported native PNG was resized.

## Changes and review notes

- The special pack builder now reads optional `item.inkMax` from `specs.json`, using the existing dimension formula when absent and `pivotY = h - 16` when present. The two special pilot caps moved into specs; their image bytes are unchanged. The Halloween pack was not touched, and its pilot gate is also unchanged.
- Caps are 88×85 (Norbert), 100×94 (Sirius), 152×161 (Liễu Roi), 120×112 (Aragog), 56×68 (Nón Phân Loại), and 51×128 (Cốc Lửa). Where the audit target differs between facings, the shared cap uses the stricter height/width. Actual aspect ratio can yield smaller ink bounds.
- Norbert retains one cracked dark egg, orange coals and copper kettle in a compact stone hearth; both ground contacts pass the rotated 1×2 strip.
- Sirius was regenerated after its first alternate view failed the ground test (36% outside). The selected master places the front wheel lower-left in default and lower-right in alternate. A 100-pixel cap fits the actual strips and remains above the 77-pixel minimum for W=128.
- Liễu Roi retains the turquoise car, bent open door and sparse branches; roots stay compact. The alternate view shows the rear of the car.
- Aragog was regenerated after 1×/3× inspection exposed a root fragment crossing the master midpoint. The selected master has a clear central gap and no stray fragment in the native alternate view. One large spider and two small spiders remain in each view; tiny eye/leg details naturally merge at native size.
- Nón Phân Loại retains the crooked expressive patched hat on a narrow wooden stool. Cốc Lửa retains the wooden bowl, blue-violet flame, blank parchment and small stone pedestal. The alternate flame makes its ink taller (128 versus 110 pixels); both remain within their caps.
- Base prompts and exact generation/refinement prompts are saved in `special-products-assets/prompts.json` under each batch item. Selected master hashes and native output hashes are in the regenerated pack provenance. Existing palette, binary alpha and motion rules remain in force.

## Verification

- `node garden-v05/audit-grid-fit.mjs`: **12/12 batch rows have no issues**. Every non-batch audit row equals HEAD. The full repository has 64 remaining misfit items outside this batch.
- `GARDEN_PROTOTYPE_DIR=$PWD/garden-v05 node --test garden-v05/*.test.mjs`: **315 passed, 0 failed, 1 skipped**, 316 total. The existing skipped test is client/Functions decoration-space parity, requiring a separately paired Functions checkout. Log: `/tmp/hagrid-grid-fit-batch-01-tests.tap`.
- `node garden-v05/build-runtime-webp.mjs` and `--check`: **1,141 lossless conversions + 8 existing WebP verified**. The build compares decoded RGBA, including transparent RGB.
- Visually inspected both facings of all six native PNGs at **1× and nearest-neighbour 3×**, including the final regenerated Aragog. Inspection sheets: `/tmp/<id>-batch01-1x3x.png`. Main silhouettes remain readable; no seam fragments remain.
- Scope guard restored non-batch runtime records exactly. Only the six batch records differ in runtime manifest, pack manifest, provenance item records and QA item records. No unrelated PNG/WebP bytes differ; all three pilot items' image outputs are byte-identical to HEAD. Refreshed `decor-flow-manifest.json` hashes only for batch IDs present in `unchangedEntryHashes`.
- `git diff --check`: passed.

Browser scene checks were skipped as requested. Claude still needs to inspect actual placement/rotation, adjacency and mobile readability before committing/importing into HPVNN. Native/audit proof does not establish those scene results.

No footprint, label, price, catalog, server code, `functions/`, or HPVNN checkout was changed. No commit, push or deploy was performed. Changes remain in this source working tree.

## Per-item results

Master paths below are relative to `garden-v05/special-products-assets/`. Ink boxes are union bounds from the runtime audit; every view ends at its pivot row.

| ID | Master | Canvas | Pivot | Default ink (x,y,w,h) | Right ink (x,y,w,h) | Audit |
|---|---|---|---|---|---|---|
| `sp_norbert_egg` | [masters/sp_norbert_egg.png](../../garden-v05/special-products-assets/masters/sp_norbert_egg.png) | 96×112 | (48,96) | (9,11,78,85) | (15,11,67,85) | Both pass |
| `sp_sirius_motorbike` | [masters/sp_sirius_motorbike.png](../../garden-v05/special-products-assets/masters/sp_sirius_motorbike.png) | 128×128 | (64,112) | (14,33,100,79) | (14,33,100,79) | Both pass |
| `sp_whomping_anglia` | [masters/sp_whomping_anglia.png](../../garden-v05/special-products-assets/masters/sp_whomping_anglia.png) | 160×192 | (80,176) | (14,15,133,161) | (19,15,123,161) | Both pass |
| `sp_aragog_hollow` | [masters/sp_aragog_hollow.png](../../garden-v05/special-products-assets/masters/sp_aragog_hollow.png) | 128×144 | (64,128) | (4,39,120,89) | (4,36,120,92) | Both pass |
| `sp_sorting_hat` | [masters/sp_sorting_hat.png](../../garden-v05/special-products-assets/masters/sp_sorting_hat.png) | 64×96 | (32,80) | (7,12,51,68) | (4,13,56,67) | Both pass |
| `sp_goblet_fire` | [masters/sp_goblet_fire.png](../../garden-v05/special-products-assets/masters/sp_goblet_fire.png) | 64×160 | (32,144) | (7,34,51,110) | (7,16,50,128) | Both pass |
