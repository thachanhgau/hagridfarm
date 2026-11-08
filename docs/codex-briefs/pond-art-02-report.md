# Pond phase 1 redo — pond-3 only (2026-11-08)

| Master | Size | Candidate kept | Verdict |
|---|---|---|---|
| `garden-v05/environment/pond/masters/pond-3.png` | 1152×768 RGBA | B, original generation | **redo** |

## Choice

Generated two candidates using the built-in image tool, with `masters/pond-2.png` as the explicit family/style reference and `guide-pond-3.png` as geometry reference. Kept B: its continuous grassy bank covers both front edges, four-plank jetty has two posts, two fish silhouettes occupy the shallow water, and the broad stepped water bands avoid the old empty dark field. Grey rocks, cattails, grass tufts and lily pads follow pond-2 more closely. Two front rocks keep water visible. A has a less clearly four-plank jetty and a larger dark centre.

One targeted cleanup of B was attempted, not a third design candidate. Rejected: it retained haze and removed the back-bank ribbon weed. Kept the original B, whose provenance is the `candidate-b-kept` entry in prompts.json.

## Verification and unresolved requirements

- Saved at exactly 1152×768 using nearest-neighbour resizing from 1536×1024; no palette reduction, native export, builder or importer.
- Original previous master copied byte-for-byte to `garden-v05/environment/pond/masters/pond-3-v1.png` before replacement.
- Real alpha exists and there is no white backdrop. **The required hard transparent contour is NOT achieved:** soft coloured haze remains outside the outline, with partial alpha. Smooth shading also remains inside some regions. Do not treat this as an accepted master.
- General dimetric parallelogram silhouette is present, but precise guide occupancy is NOT met: the generated front corner is shifted right relative to guide x512, and haze spills beyond the intended footprint. A nearest-neighbour canvas resize does not repair geometry.
- Deep centre is visually dark blue; exact uniform #3E3B70 and exact pond-2 pixel density are not certified.
- No generation refused or unavailable. The tool completed but failed the hard edge/flat colour constraints, including the cleanup request.
- Appended prompts for A, kept B and rejected B cleanup, including generated source paths and reference files. Original generated files remain at the image tool destination.

## Scope

Only the replacement master, its v1 backup, `garden-v05/environment/pond/prompts.json` and this report were written. No native sprites, builders, git operations or HPVNN changes. Claude Code reduction has not been performed. This attempt remains **redo**; the bank/content improvement is saved for review, but it is not ready for acceptance.

Saved alpha check: 332807 fully transparent pixels; 551929 partially transparent pixels; 0 fully opaque pixels.
