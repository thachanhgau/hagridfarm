# Grid-fit pilot 01 — report

2026-10-27 · source worktree `hagrid-source` · branch `claude/hagrid-greenhouse-ground` · starting HEAD `a403fd45b78b9609391dd950544907b48da9b624`.

The three local art/build deliverables are complete: new ImageGen masters, native exports, runtime imports, lossless WebP, and six issue-free grid-fit audit rows. Browser scene verification remains unconfirmed because both browser engines aborted before opening a page.

## Per-item results

Ink boxes below are `(x, y, width, height)` in the native PNG, measured by `garden-v05/audit-grid-fit.mjs`. Both views use the same canvas and pivot; ink ends exactly at the pivot row.

| Item | New master | Native canvas | Pivot | Default ink | Alternate ink | Audit |
|---|---|---|---|---|---|---|
| Vương miện Ravenclaw · `sp_ravenclaw_diadem` | [masters/sp_ravenclaw_diadem.png](../../garden-v05/special-products-assets/masters/sp_ravenclaw_diadem.png) | 64×64 | (32,48) | (4,7,56,41) | (7,6,51,42) | No issues in either facing |
| Bằng-Mã bên vườn bí ngô · `sp_buckbeak_pumpkins` | [masters/sp_buckbeak_pumpkins.png](../../garden-v05/special-products-assets/masters/sp_buckbeak_pumpkins.png) | 128×128 | (64,112) | (4,16,120,96) | (4,13,120,99) | No issues in either facing |
| Cổng Halloween bằng rễ cây · `hw_root_halloween_gate` | [masters/hw_root_halloween_gate.png](../../garden-v05/halloween-assets/masters/hw_root_halloween_gate.png) | 128×144 | (64,128) | (22,33,84,95) | (22,29,84,99) | No issues in either facing |

- Diadem: retained the silver eagle, single blue gem and purple cushion; replaced the wide bench with a narrow central carved stand so the lowest ink sits inside the 1×1 diamond.
- Buckbeak: grey eagle head/forequarters, folded wings, horse hindquarters, two orange pumpkins and a mossy stone. The final master has a wide central transparent gap, fixing the initial fixed-half split that clipped a tail and leaked a fragment into the alternate export.
- Gate: default posts follow the upper-right to lower-left row axis; alternate posts follow the upper-left to lower-right column axis. The 84-pixel export width keeps the lowest 32 ink rows within the narrow 1×3 ground strip. Both views remain above the guideline's 77-pixel minimum and below the brief's 120×112 maximum.

The source masters are respectively 1774×887, 2129×739 and 1832×859. Each contains two separately drawn views with top-left light. The original masters were moved to the next free variant, `masters/variants/<id>-v1.png`, in their respective packs. All three archived SHA-256 values match the original tracked masters byte for byte.

Generation used the built-in `image_gen` tool. The reused base prompts, grid-fit additions and selected refinement/spacing prompts are saved in each item's row in [special-products prompts](../../garden-v05/special-products-assets/prompts.json) or [Halloween prompts](../../garden-v05/halloween-assets/prompts.json). Selected master SHA-256 values are recorded in the regenerated pack provenance:

| ID | Master SHA-256 |
|---|---|
| `sp_ravenclaw_diadem` | `c5253352cefc922a47ae6fa4b8c421da7d979d12e46862034524b01aca599df1` |
| `sp_buckbeak_pumpkins` | `3e9d70c6dc8071fb443e3f45df59dab40eb8aff566ed578510b2a500e514b2ad` |
| `hw_root_halloween_gate` | `bc54f3d4fcc93432552495ec23338c1039daf527d9a94e5f8000c9730d70e0c0` |

## Builder and import changes

- `special-products-assets/build-assets.mjs`: item-specific maximum ink boxes of 56×42 and 120×100; those two IDs use `pivotY = h - 16`.
- `halloween-assets/build-assets.mjs`: only the gate uses an 84×112 maximum ink box and `pivotY = h - 16`. The narrower cap satisfies the actual diagonal base test. Provenance anchor descriptions now describe the pilot inset correctly.
- Existing master sampling, palette quantization and binary-alpha validation remain in use. Native PNGs were exported directly from masters; no exported sprite was resized. The 3× images were inspection copies only.
- Ran both pack builders and the documented import commands. The importer replaces whole collections and copies unrelated legacy PNGs. Stopped on that collateral change, restored all unrelated tracked PNG/WebP bytes and runtime records, and removed only the unrelated files newly created by this import. Final hash comparison finds **zero other-item PNG/WebP changes**; all unrelated pack records and grid-fit rows match the starting revision.
- Refreshed only the three affected `unchangedEntryHashes` in `decor-flow-manifest.json`; the existing regression test otherwise correctly rejected the newly authorized runtime records. No test assertions were removed or weakened.
- Pack manifests, provenance, validation, contact sheets and preview pages were regenerated for the three changed items. Eight new runtime PNG frames and their WebP counterparts belong only to the gate. Other items' outputs are unchanged.

## Verification

- `node garden-v05/audit-grid-fit.mjs`: all three IDs have **no issues in either facing**. The remaining 70 misfit items are outside this pilot; their audit rows are unchanged.
- `node garden-v05/build-runtime-webp.mjs`, then `--check`: **1,149 lossless conversions + 8 existing WebP verified**. Conversion checked decoded RGBA equality, including transparent RGB.
- `node --test garden-v05/*.test.mjs`: **315 passed, 0 failed, 1 skipped** (316 tests). The skipped check requires a separately paired HPVNN Functions checkout for client/server decoration-space parity. No paired checkout was selected for this source-only brief. Log: `/tmp/hagrid-grid-fit-pilot-01-tests.tap`.
- Inspected tight native crops of both views at **1× and nearest-neighbour 3×**. Diadem/eagle/cushion, Buckbeak/pumpkins and the diagonal open gate remain readable; the stray Buckbeak seam fragment is gone. Inspection sheets: `/tmp/<id>-pilot-final-1x3x.png`.
- `git diff --check`: passed. Scope/hash review preserved the original brief and other pre-existing work.

## Limits and summary

The additional 375-pixel scene/weather/day-night fixture check could not run: Chrome terminated with SIGABRT and WebKit with exit 134 before a page opened. In-game adjacency, interactive placement/rotation, weather readability and physical-device appearance therefore remain for the follow-up reviewer. Native 1×/3× inspection and machine grid-fit checks passed; they do not establish those browser/device results.

No catalog footprint, price, server code, `functions/` or HPVNN checkout was modified. No commit, push or deploy was performed; changes remain in this working tree.

Summary: three new masters installed and originals archived; native sizes 64×64 / 128×128 / 128×144 with pivots (32,48) / (64,112) / (64,128); all six grid-fit rows pass; WebP verified; tests 315 pass / 0 fail / 1 skip. Browser scene verification remains pending after browser-launch failures.
