# Codex brief — «Đốt vườn» fire pack for Hagrid Farm (01/11/2026)

You are Codex working in the Hagrid Farm source repo (this directory). The owner chose you for the art because your
image generation is better: «nói codex tạo visual thật hoành tráng» — make it spectacular. Claude Code (Anthropic) wrote
this brief, writes the game code that draws these files, and will verify your result.

## What it is for

KTV Gia Tinh can set a member's garden on fire: the whole isometric garden «chìm trong biển lửa» for a while. The game
code (not you) draws your sprites many times across the garden at random tiles, adds a red-orange screen glow, embers
and smoke. You only make the sprite sheets below.

## Read first

`docs/art-bible.md` (hard rules: 1 source px = 1 game px, the 32-colour palette in `garden-v05/palette.mjs`, light from
top-left, selective dark outline `#231F2E`, pivot at the feet). Fire uses mostly the «Lửa · bí ngô» ramp
`#874056 #C75B4B #ED8A45 #FFC36B` plus `#F5D69A` / `#E7AE73` for the hot core and `#231F2E` / `#4A3042` / `#41465C` for
smoke and char. Pixel art, chunky clusters, crisp edges, NO anti-aliased soft gradients, NO text.

## Files to produce (exact names and sizes — the code already expects them)

All in `garden-v05/environment/fire/`, PNG with transparent background, frames laid out left→right in ONE row,
no gaps, every frame the same size, the flame base (pivot) centred at the bottom of each frame.

| file | frame size | frames | content |
|---|---|---|---|
| `flame-large.png` | 64×96 | 8 | A tall roaring bonfire flame column, licking and swaying; loops seamlessly (frame 8 → frame 1). Base is a 48 px wide burning clump that sits on one 64×32 isometric tile. Bright yellow-white core, orange body, deep red tips breaking into separate tongues. |
| `flame-small.png` | 32×48 | 8 | Smaller flicker for filling gaps between big flames; seamless loop; same look. |
| `smoke.png` | 48×48 | 6 | A dark smoke puff rising and fading (frame 1 dense small → frame 6 large, thin, mostly transparent pixels by dithering, not alpha blur). Colours `#231F2E #4A3042 #41465C #687486`. |
| `scorch.png` | 64×32 | 1 | Charred ground decal exactly on the 64×32 iso diamond: black-brown char with a few glowing orange cracks/embers. Nothing outside the diamond. |
| `fire-banner.png` | 360×120 | 1 | A UI title illustration (not drawn in the garden): a wall of flame with the silhouette of Hagrid's garden fence and pumpkins burning, for the top of the «Vườn đang cháy» notice. This one may be richer/painterly-pixel, still the palette. |

Make several candidates per file with your image tool, pick the most spectacular one that still reads at 1×, then reduce
it to the palette and the exact pixel size (nearest-neighbour; do not blur). Keep your raw generations in
`garden-v05/environment/fire/masters/` (that folder is never shipped).

## After drawing

1. `SHARP_MODULE=/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp node garden-v05/build-runtime-webp.mjs`
   (it picks up `environment/fire/*.png` and writes `runtime-webp/environment/fire/*.webp` plus the manifests).
   Then `node garden-v05/build-runtime-webp.mjs --check`.
2. Make a contact sheet `docs/codex-briefs/garden-fire-preview.png`: each sheet at 1× and 3×, plus a mock of ~20
   large + ~20 small flames scattered on a grass background with the scorch decal under them.
3. `git status` — only `garden-v05/environment/fire/**`, `garden-v05/runtime-webp/environment/fire/**`, the webp
   manifests / `runtime-image-url.mjs` the builder regenerates, and your report/preview may change.

## Hard rules

- No git commit, no push, no deploy. Do not edit any `.mjs` game code, CSS, `functions/` or the HPVNN repo.
- If image generation is unavailable or you hit a usage limit, stop and say so in the report; do not fake art with code.

## Report

Write `docs/codex-briefs/garden-fire-report.md`: each file, size, frame count, the master it came from, and anything
you were unsure about. Finish your final message with the same summary.
