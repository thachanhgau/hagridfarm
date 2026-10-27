# Codex brief — redraw 3 Hagrid Farm decorations to fit their grid footprint (pilot 01)

You are Codex working in the Hagrid Farm source repo (this directory). The owner chose you for the art because your
image generation is better. Claude Code (Anthropic) wrote this brief and will verify your result afterwards.

## Read first

1. `docs/grid-fit-guideline.md` — the sizing rules (golden rule: all ink inside the W-wide column above the footprint;
   base standing on the real footprint, in the right direction; 1:1 pixel density, never resize an exported PNG).
2. `docs/art-bible.md` — palette, outline and lighting rules.
3. The item's existing row in `docs/grid-fit-audit.json` (`rows[]`, match `id`) and its spec/prompt in the pack folder.

## The three items

| id | pack | footprint (ground px) | today | target canvas · pivot · max ink | main problem |
|---|---|---|---|---|---|
| `sp_ravenclaw_diadem` | `garden-v05/special-products-assets` | 1×1 (64×32) | ink 106×80 | 64×64 · (32,48) · ≤ 56×42 | 21 px over each side; 46% of base off the tile |
| `sp_buckbeak_pumpkins` | `garden-v05/special-products-assets` | 2×2 (128×64) | ink 170×142 | 128×128 · (64,112) · ≤ 120×100 | 21 px over each side |
| `hw_root_halloween_gate` | `garden-v05/halloween-assets` | 1×3 (128×64) | ink 186×174 | 128×144 · (64,128) · ≤ 120×112 | 29 px over each side; 70% of base off the footprint |

Keep the footprint. Do not change any catalog `footprint`, prices, server code or `functions/`.

## What to do per item

1. **New master with your image generation tool**, transparent background, same two-view layout as the pack's existing
   masters (LEFT half = default view, RIGHT half = the alternate view rotated 90°, NOT a mirror; same size, same
   baseline). Reuse the pack's prompt text in `prompts.json` as the base, then add:
   - It will be shown at only the max ink size above (e.g. 56×42 px for the diadem): chunky readable silhouette, few big
     pixel clusters, no fine detail that disappears when small.
   - The object's ground contact must sit on the footprint diamond seen from above. For the 1×3 gate the footprint is a
     long diagonal strip (3 tiles along one axis): the gate's two posts stand at the ends of that strip and the arch spans
     along it, in the default view running along the rows and in the alternate view along the columns. Not a frontal
     gate facing the camera.
   - Width/height proportion of each view should match the max ink box (diadem ≈ 4:3 wide, Buckbeak ≈ 6:5, gate ≈ 1:1).
   - Book-faithful object (Ravenclaw diadem; Buckbeak the hippogriff by Hagrid's pumpkin patch; root-arch Halloween gate)
     per `specs.json` `subject`. Vietnamese names must stay as in the pack (Lý Lan translation wording).
2. Move the old master to `masters/variants/<id>-v<N>.png` (next free N) and save the new one as `masters/<id>.png`.
3. Set the item's `w`/`h` in the pack `specs.json` to the target canvas. If the pack builder cannot give ink ≤ max ink
   (its `maxWidth = w − 6`), adjust the builder only for this, minimally, so ink ≤ W − 8 and stays centred on pivotX with
   the bottom of the ink on the pivot row. Do not change other items' output.
4. Rebuild and import, then rebuild webp:
   ```
   SHARP_MODULE=/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp node garden-v05/<pack>/build-assets.mjs
   node garden-v05/special-products-assets/import-runtime.mjs                      # special pack
   node garden-v05/special-products-assets/import-runtime.mjs garden-v05/halloween-assets festival   # halloween pack
   node garden-v05/build-runtime-webp.mjs
   ```
   (Read each script's header first; use the documented arguments if they differ.) Check with `git status` that only
   these three items' files plus the regenerated manifests changed. If a rebuild rewrites other items' PNGs with
   different bytes, stop and revert those.
5. Verify: `node garden-v05/audit-grid-fit.mjs` — these three ids must have **no issues** in either facing in
   `docs/grid-fit-audit.json`. Then `node --test garden-v05/*.test.mjs` must pass.
6. Look at the result yourself at 1× and 3× (crop the native PNGs) and judge readability. Redo the master if it reads
   badly at native size.

## Hard rules

- No git commit, no push, no deploy. Leave the changes in the working tree.
- Do not touch the HPVNN repo, `functions/`, catalog footprints or other items.
- If image generation is unavailable or you hit a usage limit, stop and say so in the report; do not fake art with code.

## Report

Write `docs/codex-briefs/grid-fit-pilot-01-report.md`: per item the new master path, the native size, the ink box and
pivot from the audit, any builder change, test results, and anything you were unsure about. Finish your final message
with the same summary.
