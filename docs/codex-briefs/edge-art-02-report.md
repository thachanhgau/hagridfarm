# Edge art 02 — scenery, trees and icons — 2026-11-08

14/14 requested master files delivered using built-in ImageGen; three new 16×16 icon grids delivered. **8 good as design masters / 6 redo.** This is a master-art handoff, not native sprite or runtime acceptance. No subject was refused.

| id | master path | size | candidate kept and why | verdict |
|---|---|---|---|---|
| pasture | `garden-v05/environment/edge/masters/pasture.png` | 1152×628 | B; cleaner flat clusters than A, rear two-rail fence, lower front rails, front-left gate gap, trough and hay bale, open centre; footprint remains wrong | **redo** |
| orchard | `garden-v05/environment/edge/masters/orchard.png` | 1152×628 | B; six empty brown pits and better guide-shaped meadow; measured pit positions still differ from orange targets | **redo** |
| trail | `garden-v05/environment/edge/masters/trail.png` | 768×480 | A; broad brown trail runs upper-left to lower-right, sparse stones/marks and grass along both sides | good |
| tree-apple-0 | `garden-v05/environment/edge/masters/tree-apple-0.png` | 1024×1152 | A; small thin staked tree, five leaf clusters, one tie, no fruit | good |
| tree-apple-1 | `garden-v05/environment/edge/masters/tree-apple-1.png` | 1024×1152 | A; round mid-green canopy, strong branching brown trunk, no fruit | good |
| tree-apple-2 | `garden-v05/environment/edge/masters/tree-apple-2.png` | 1024×1152 | A; eight readable red apples on matching design; edit alters underlying silhouette/branches | **redo** |
| tree-pear-0 | `garden-v05/environment/edge/masters/tree-pear-0.png` | 1024×1152 | A; thin staked young tree with lighter yellow-green leaves | good |
| tree-pear-1 | `garden-v05/environment/edge/masters/tree-pear-1.png` | 1024×1152 | A; taller narrower upright canopy, common trunk/leaf family, no fruit | good |
| tree-pear-2 | `garden-v05/environment/edge/masters/tree-pear-2.png` | 1024×1152 | A; eight clear yellow-green pear shapes; underlying tree is not identical to stage 1 | **redo** |
| tree-plum-0 | `garden-v05/environment/edge/masters/tree-plum-0.png` | 1024×1152 | A; dark-leaved thin sapling, wooden stake and tie | good |
| tree-plum-1 | `garden-v05/environment/edge/masters/tree-plum-1.png` | 1024×1152 | A; broad darker canopy, same branching brown trunk vocabulary, no fruit | good |
| tree-plum-2 | `garden-v05/environment/edge/masters/tree-plum-2.png` | 1024×1152 | A; eight purple fruit blobs; underlying tree changes during edit | **redo** |
| items-sheet-a | `garden-v05/masters-items/edge/items-sheet-a.png` | 1536×1024 | B; readable six objects in correct row-major cells; A/B/C all retain soft alpha halo residue, B keeps strongest original shapes | **redo** |
| items-sheet-b | `garden-v05/masters-items/edge/items-sheet-b.png` | 1024×1024 | A; plum, apple sapling, pear sapling, plum sapling in exact requested row-major order; matching tied root-ball sacks | good |

## Material limits for Claude

- **Pasture:** two image attempts retain incorrect ground registration. Rear post reaches near the intended x=512, but front corner remains around x=590 rather than x=640; rear ground is lower than the guide. Canvas size alone is not footprint acceptance.
- **Orchard:** six large brown-soil components confirmed. Their approximate measured centres are (508,181), (309,272.5), (696.5,272.5), (508,361), (889.5,361), (695,454.5), versus requested (512,176), (320,272), (704,272), (512,368), (896,368), (704,464). These colour-based bounds are diagnostics, not manually authored pit masks. Exact orange-square fit is not met.
- **Fruiting trees:** eight fruits each confirmed visually. ImageGen was explicitly instructed to preserve stage 1, but alpha-mask intersection-over-union with stage 1 is apple 92.1%, pear 92.4%, plum 89.8%. They must not be treated as the exact same tree plus fruit.
- **Tree placement:** all substantial-content bottom rows are y=880. The placement script centres the occupied bounds at x≈512 and uses equal full heights per grown/fruiting pair; it does not certify an identical anatomical trunk pivot. Sapling/full heights are 280/800 apple, 288/832 pear, 280/784 plum (34.6–35.7%). Structural root alignment still needs checking when rebuilding native grids.
- **Sheet A:** the first generation, a targeted halo-removal edit and a fresh generation all retained soft exterior alpha. Cropping/placement preserved source alpha; no code-painted replacement or alpha-cleanup mask was used.
- All images have real alpha-zero background pixels, but also partial alpha and small colour variation inside nominally flat clusters. “Good” means usable design master for Claude's pixel reconstruction and palette reduction, not exact 24-colour, binary-alpha art. Coarse-block density remains a reduction-stage check.
- Trail covers 99.863% of the guide ground at alpha≥128. Outside-guide content is 5,903 pixels, including stepped grass edges/tufts; strict no-spill acceptance is not certified. Orchard covers 99.459%, with 6,131 outside-guide ink pixels. No polygon clipping or filled-corner substitute was fabricated.

## Verification and provenance

- Read art bible sections 1–4, sprite palette, pond brief/report and placement example; viewed all named guides, grass/pond/tree references and the four native item references enlarged 8× with nearest neighbour.
- Opened all fourteen final masters after placement. Dimensions, alpha-zero presence, item cell margins and bases passed `node docs/codex-briefs/edge-art/verify-scenery.mjs`.
- Both sheets have every alpha≥128 occupied cell within ≥48px margins, local base exclusive y=440. Sheet B order verified visually.
- `pixel-icons-new.mjs` exports only `NEW_ICONS` with `pasture`, `orchard`, `fruit`; each has sixteen 16-character strings using existing INK keys. Imported this new grid file alone.
- `prompts-scenery.json` has 18 exact prompt records: 14 selected masters and 4 rejected candidates. All tool-written source paths, delivered paths and reference files exist. B ground references are preserved as the archived A masters they used.
- Rejected A ground masters and A/C sheet candidates stay under `docs/codex-briefs/edge-art/`; selected sheet B's unplaced source is also retained there. Original tool files remain unchanged.
- `scenery-placement.json` and `place-scenery.mjs` record/reproduce only generated-art cropping, nearest-neighbour scaling and transparent-canvas placement. They refuse to overwrite existing masters. `scenery-verification.json` and `geometry-verification.json` contain measured evidence.
- Branch verified as `edge-art`. No pre-existing files, creature work, builders/importers, native frames, runtime modules, HPVNN or `functions/` were edited or executed. No commits, pushes or deployments.

## Refusals

None. Image generation remained available.
