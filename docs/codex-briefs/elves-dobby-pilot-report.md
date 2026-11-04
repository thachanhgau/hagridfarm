# Living Dobby pilot — 2026-11-04

Delivered six native PNG sprites in `garden-v05/elves/dobby/`: `idle.png`, `walk-1.png`, `walk-2.png`, `sweep.png`, `water.png`, `carry.png`. This is an art pilot awaiting owner approval; no other house-elves were drawn.

## Artwork and selection

Two six-pose sheets were generated with the built-in `image_gen.imagegen` tool. Both raw masters are preserved in `garden-v05/elves/masters/`; exact prompts are in `garden-v05/elves/prompts.json`. Candidate B was selected after inspecting both reduced sheets: clearer round eyes, simpler pillowcase folds, and complementary green/purple sock strides. Living Dobby has warm tan skin, a red-orange wool hat with bobble, green eyes, cream pillowcase and odd socks, distinct from the existing bare-headed statues. Light comes from the upper left; dark outlines use palette colours.

The source was cut using alpha bounds, with the inter-row boundary at source y=460 rather than a nominal equal grid, preserving the overhead basket. A uniform 0.1 source scale was sampled with nearest-neighbour, then mapped to the nearest of the 24 sprite colours without dithering. Alpha was thresholded at 128 to 0/255, transparent RGB cleared to zero, and frames translated onto their common canvas. Body foot centres were aligned to x=32 rather than centring the props. The sweep's generated lower snow/bristle-tip pixels were repositioned relative to the body by 2 native pixels so both snow and sock soles end at row 58. No character artwork was synthesized with drawing code.

## Native checks: 6/6 passed

| Frame | Opaque bounds, inclusive | Ink width × height | Palette colours |
|---|---|---|---|
| idle | (16,17)–(47,58) | 32×42 | 20 |
| walk-1 | (17,18)–(47,58) | 31×41 | 21 |
| walk-2 | (16,18)–(47,58) | 32×41 | 19 |
| sweep | (6,15)–(44,58) | 39×44 | 21 |
| water | (9,15)–(45,58) | 37×44 | 22 |
| carry | (18,9)–(48,58) | 31×50 | 20 |

All six decode as 64×64 RGBA, contain only alpha 0/255, have no opaque pixels below row 58, retain at least one transparent pixel at every canvas edge, and use only `SPRITE_PALETTE`. No opaque pure black or white outline. Both walking frames have their hat top at row 18. Five ordinary poses have ink height 41–44; carry is 50 pixels including the basket. All widths are below 56. Distinct output SHA-256 values, full source/output hashes, crop rectangles, palette usage, translations and measurements are recorded in `garden-v05/elves/provenance.json`.

## Preview

`docs/codex-briefs/elves-dobby-pilot-preview.png` uses a plain `#71934B` grass background and no text. Top row: idle, walk-1, walk-2, sweep, water, carry at 1×. Middle two rows: the same order at 4× nearest-neighbour. Bottom left: Dobby and the original Hagrid `gardener_friend/frame-01.png` at 1×. Bottom right: both at 4×, with their lowest opaque foot pixels on a common line. Dobby's ordinary ink height is about half Hagrid's 90-pixel ink height. The exported preview was visually inspected. Owner approval of likeness and final 1× readability remains pending; animation and in-game acceptance belong to Claude Code's integration work.

## Runtime builder

Executed the requested build command with the specified `SHARP_MODULE`: success, 1,133 lossless PNG conversions plus 8 existing WebPs; builder verified decoded RGBA equality. Executed `node garden-v05/build-runtime-webp.mjs --check`: success, 1,133 conversions plus 8 existing WebPs verified.

**Integration limit:** the existing builder's fixed `folders` list does not include `elves/`, so its success does not package or validate the six new Dobby PNGs as runtime WebPs. No builder or runtime path code was edited to widen the art-only scope. `runtime-image-url.mjs` and the runtime manifest have no resulting Git diff after the requested rebuild.

## Scope

No commit, push, deploy, CSS, backend, or HPVNN changes. No authored `.mjs` changes. Existing brief/log files were preserved. During this art task, `scene-renderer.mjs` changes and new `garden-elves.mjs` / `garden-elves.test.mjs` appeared in the shared checkout; these were not created, edited, reverted, or validated by this art task. The report claims native image and preview verification only, not browser, production, or physical-device proof.
