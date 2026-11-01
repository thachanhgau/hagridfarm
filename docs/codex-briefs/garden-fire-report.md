# Garden fire pack — 2026-11-01

Completed all five requested transparent PNG assets in `garden-v05/environment/fire/`, their lossless runtime WebPs, and `garden-fire-preview.png` beside this report. Built-in ImageGen produced two candidates for each asset (10 raw generations); every raw image is retained in `environment/fire/masters/`.

| File | Sheet size | Frame size | Frames | Selected master |
|---|---|---|---|---|
| `flame-large.png` | 512×96 | 64×96 | 8 | `masters/large-a.png` |
| `flame-small.png` | 256×48 | 32×48 | 8 | `masters/small-a.png` |
| `smoke.png` | 288×48 | 48×48 | 6 | `masters/smoke-a.png` |
| `scorch.png` | 64×32 | 64×32 | 1 | `masters/scorch-a.png` |
| `fire-banner.png` | 360×120 | 360×120 | 1 | `masters/banner-b.png` |

The selected large flame has the strongest broad hot core and varied curling tongues. Small A matches it and remains readable at 1×. Smoke A has substantial billowing clusters; the later frames dissolve with ordered pixel dithering. Scorch A has clear branching ember cracks. Banner B gives the strongest wall of fire behind a readable broken fence and pumpkins.

## Processing and provenance

All art originates in ImageGen, then is sampled onto the exact native pixel grid with nearest-neighbour and reduced to the approved palette. Frames were separated using inspected alpha/content bounds, rather than assuming equal source cells. Each exported frame occupies an equal cell in a single uninterrupted row. Flame bases are centred at the bottom; the large burning clump is within 48px width. The scorch export is clipped to the 64×32 pixel-centre diamond. Banner is a UI illustration only.

`environment/fire/provenance.json` records prompts, original generation paths, SHA-256 hashes, selection and crop information. `masters/generation-inputs.json` retains the generation inputs; `masters/process.py` retains the export/contact-sheet processing (Pillow + NumPy, run from the repo root). No game drawing code was edited. `masters/verification.json` contains native dimensions, hashes, colour counts, smoke coverage, and loop-boundary pixel comparisons.

## Verification

- Viewed all 10 candidates together, then inspected the exported contact sheet at native and 3× nearest-neighbour sizes.
- All five PNGs have exact dimensions, expected frame count and binary alpha (0/255). Every visible RGB belongs to `palette.mjs`. Flames use eight approved colours; smoke uses exactly its four specified colours.
- Every flame frame reaches the bottom row. The 8→1 pixel-change fraction is no greater than the largest interior transition: large 33.1% versus 38.0%; small 6.25% versus 39.6%. This supports loop continuity but does not replace playback in the consuming game.
- Smoke progresses from a small dense puff to a rising sparse field; final frame contains 77 opaque pixels out of 2304. No blurred alpha.
- Scorch has zero opaque pixels outside the diamond.
- Preview includes every complete sheet at 1× and 3× and a grass composite with exactly 20 large + 20 small flames, with scorch beneath all 40 placements.
- Ran the requested `SHARP_MODULE=… node garden-v05/build-runtime-webp.mjs` successfully. Encoder compared decoded RGBA for all 1131 converted images; eight existing WebPs retained.
- Ran `node garden-v05/build-runtime-webp.mjs --check`: **WebP pack verified: 1131 lossless conversions + 8 existing WebP.** Masters/provenance are excluded by the existing builder.

## Scope and remaining limits

No commit, push or deployment. No backend, CSS, functions or HPVNN changes. Runtime animation speed and final garden integration belong to the consuming game and have not been verified here; the preview is a static asset composite. Palette hot white is represented by approved `#F5D69A`, rather than adding pure white.

Initial status contained only untracked `docs/codex-briefs/garden-fire.md`. During this work, concurrent changes appeared in `garden-sale-acp-ui.mjs`, `garden-visits-ui.mjs`, `mobile-game.mjs`, `scene-renderer.mjs`, `index.html`, and untracked `garden-fire.mjs` / `garden-visit-fire.css`. Those files were not touched or reverted. This task's changes are limited to `environment/fire/**`, `runtime-webp/environment/fire/**`, the regenerated `runtime-webp-manifest.json` / `runtime-image-url.mjs`, and this report/preview. Existing runtime WebPs have no tracked byte changes outside the new fire pack.
