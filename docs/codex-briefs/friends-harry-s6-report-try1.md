# Harry S6 pilot — 2026-11-04

Status: BLOCKED — image generation returned no images. 0/2 candidate sheets generated; no chosen master.

Read `docs/art-bible.md` and `garden-v05/palette.mjs`; visually inspected the approved `v3-dobby.png`, `v3-winky.png`, and Hagrid `gardener_friend/frame-01.png` references. Used the imagegen skill and built-in `image_gen.imagegen` tool with transparent background requested.

Two candidate requests were submitted. Both failed with HTTP 400 `moderation_blocked`, moderation stage `output`, category `other`. The tool provided no image or detailed reason. Candidate B was already in flight when candidate A's failure became available. No further generation or fallback was attempted after both results were known.

| Candidate | Result | Request ID |
| --- | --- | --- |
| A | No image returned | `3bc60766-6d5d-4c6a-998f-cdc5142aa2fb` |
| B | No image returned | `0cc7470d-a1f6-4478-8b21-64a13740fd9e` |

Exact submitted prompts and failure metadata are recorded in `garden-v05/environment/friends/prompts.json`. Its file paths describe intended destinations, not existing artifacts.

`harry.png`, `harry-candidate-a.png`, and `harry-candidate-b.png` were not created. No visual comparison, dimensions, palette, alpha, grid, or pose acceptance could be performed. No substitute art was drawn with code. No resizing, native frames, previews, builders, runtime edits, commits, pushes, or deployments were performed. Existing brief/log files were preserved.

Remaining: generate both actual candidate sheets using an available image tool, inspect their visual and technical compliance, select the better sheet as `harry.png`, and submit the pilot for owner approval before drawing other friends.
