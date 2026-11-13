# Floo frame badges S2 — generation report

Date: 2026-11-13. Scope: the four master sheets requested in `floo-frame-badges-s2.md`.

## Result

Generated 4/4 sheets with the built-in `image_gen.imagegen` tool, two candidates per sheet (8 calls total). Each first candidate was visibly off-brief, so exactly one retry was made. Selected masters were copied byte-for-byte to `garden-v05/environment/floo-frames/masters/`:

| Master | Candidate kept | Visible subjects | Selection reason |
| --- | --- | --- | --- |
| `frame-badges-a.png` | 2 | Six mastery/gardener/firework badges | Simpler sprout and broader flat-looking clusters than candidate 1. |
| `frame-badges-b.png` | 1 | Five house/grand cups | Cleaner shared cup shape and exactly two leaves at the grand cup foot; retry added extra leaf shapes. |
| `tan-suc-gems-a.png` | 2 | Six tier gems in the requested order | Smaller silhouettes closer to the requested tiny gem scale. |
| `tan-suc-gems-b.png` | 2 | Ruby, pearl, aurora and sun; two visually unused cells | Simpler facets and an orange sun core rather than the literal heart symbol in candidate 1. |

**These are selected generated candidates, not fully compliant pixel-art masters.** Both attempts for every sheet retain soft halos, non-flat colours and irregular pixel geometry. No further retry or code-drawn substitute was made, as instructed.

## Verification

All eight PNGs decode as 1536 × 1024, 8-bit RGBA, non-interlaced. Read-only inspection decoded PNG scanlines with Python standard-library `struct`/`zlib`; no image was transformed. All selected destination SHA-256 hashes match the original generated files. Full prompts, source paths, hashes, selection flags and per-cell measurements for all eight attempts were appended to `garden-v05/environment/floo-frames/prompts.json`; its four prior entries were preserved.

Selected-file measurements (visible colour means RGB where alpha > 0):

| Master | Semitransparent pixels | Visible RGB colours | Off-palette RGB colours | Uniform 16 × 16 RGBA blocks |
| --- | ---: | ---: | ---: | ---: |
| `frame-badges-a.png` | 530375 | 51621 | 51618 | 0 / 6144 |
| `frame-badges-b.png` | 450300 | 39941 | 39938 | 0 / 6144 |
| `tan-suc-gems-a.png` | 125898 | 17390 | 17386 | 0 / 6144 |
| `tan-suc-gems-b.png` | 195528 | 22066 | 22063 | 0 / 6144 |

All selected files have alpha range 0–254, with no fully opaque pixels. The uniform-block test compares complete RGBA values, including hidden RGB in transparent pixels. The visible art also plainly has non-flat shading and inconsistent block sizes. Every populated cell exceeds six visible RGB colours. Alpha-positive bounds extend beyond the allowed ink footprint and into the required 48 px empty margins; therefore the 20 × 20 / 9 × 9 logical-block budgets and strict centring/margins are not certified.

The supposedly empty cell in badges B contains 796 alpha-positive pixels. The two supposedly empty cells in gems B contain 409 and 183 alpha-positive pixels. They appear unused visually but fail exact transparency. Palette, binary alpha, grid, halo, margins and empty-cell requirements remain failed. Masters need downstream review before use; this report does not claim native-size or runtime acceptance.

## Boundaries

No resize, cropping, quantisation, native frame, preview generation or builder execution. No `.mjs`, CSS, `functions/` or HPVNN edits. No commit, push or deployment.

Pre-existing work was preserved: modified `garden-v05/build-floo-frame-art.mjs`, plus untracked `docs/codex-briefs/floo-frame-badges-s2.md`, `floo-frame-badges-s2-last.md` and `floo-frame-badges-s2-last.log`. They were not changed by this task.
