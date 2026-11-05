# 25.0 S7 — Gia tinh đón đông: artwork report

Delivered one generated master sheet (1536×1024, 2 rows × 4 columns; final cell empty), seven native PNGs and their lossless runtime WebPs. Built-in ImageGen was used. No alternate generations were needed; `masters/variants/` is empty.

## Placement coordinates

Coordinates are native hearth pixels. Boxes use `(x0,y0,x1,y1)` with exclusive right/bottom boundaries.

- Mantel front-face box: **(12,48,92,60)**. Keep holly at the far-left end clear.
- Firebox floor centre / egg pivot placement: **(56,104)**.
- Preview loop pins: **(16+8i,50)** for i=0…9; first five closed, last five open. Draw socks at `(pinX−7,pinY−1)`.
- Draw egg-2 at **(45,79)**, so its pivot `(11,25)` lands at `(56,104)`.
- Preview is an artwork placement fixture, not game/runtime integration evidence. Ten stockings slightly overlap at this scale; their loops and toes remain distinguishable.

## Processing and verification

Read art-bible §§1–3, grid-fit §§1–2 and viewed Dobby idle before generation. The requested canvas sizes take precedence over the generic footprint sizing table; no catalog/footprint was changed.

Master prompt: one seven-object cozy 16-bit pixel-art sheet on flat #FF00FF, two rows/four columns in table order; top-left lighting, selective #231F2E outline; rough grey fieldstone outdoor hearth in shallow 3/4 isometric view, bare dark wooden mantel at 40% height, holly, rear/side flames and empty central floor; closed red/cream/green right-toed knitted stocking and matching opened present/holly variant; four identical black green-sheen eggs with progressively glowing cracks, chip, then lifted lid and tiny snout; no text, gradients or antialiasing. The palette was supplied explicitly from SPRITE_PALETTE plus #E07A3A.

Postprocessing: key-colour removal, crop and nearest-neighbour reduction into exact canvases; nearest RGB palette quantization, binary alpha and transparent RGB zeroed. Thin generated cracks and the tiny generated upper-right shell chip were coverage-preserved where nearest-neighbour sampling missed them. Open and closed stockings share the exact lower body and loop-top pixels. Eggs 1–2 retain egg-0 shell pixels outside cracks/chip; all stages share lower shell pixels. No art was synthesized as a code substitute.

All seven PNGs pass exact dimensions, approved palette (24 sprite colours plus permitted #E07A3A), alpha restricted to 0/255, and at least one transparent pixel of border. Hearth ink ends on y=116, its foot pivot. Egg ink ends on y=24, with bottom-centre pivot at y=25. Sock loops start on y=1. Preview inspected at native and 3× nearest-neighbour scale on #D6D8BF, including ten stockings and egg-2, and all four eggs side by side.

WebP builder confirms decoded RGBA equality for 1,248 PNG conversions; `node garden-v05/build-runtime-webp.mjs --check` passes with 1,248 conversions plus 8 existing WebPs.

Scope: authored only environment/xmas, its generated runtime-webp pack, generated runtime-image-url.mjs/runtime-webp-manifest.json, and this report/preview. No commit, push, deploy, game-code edit or integration test performed. Initial status already contained changes in garden-store-catalog.mjs, premium-store.test.mjs, special-products.mjs, special-products.test.mjs and untracked brief/log. Further unrelated game-code and roadmap changes appeared concurrently and were left untouched. In the final status these unrelated tracked changes were absent; only the requested artwork/report/preview, generated WebP manifest/URL module, and pre-existing untracked last.log remained. This session did not commit or alter those unrelated files.

| File | Canvas | Pivot | Ink box (exclusive max) | Verdict |
|---|---|---|---|---|
| hearth.png | 112×120 | (56,116) | (10,3,101,117) | PASS |
| sock.png | 14×20 | (7,1) | (4,1,13,19) | PASS |
| sock-open.png | 14×20 | (7,1) | (3,1,13,19) | PASS |
| egg-0.png | 22×26 | (11,25) | (2,5,20,25) | PASS |
| egg-1.png | 22×26 | (11,25) | (2,5,20,25) | PASS |
| egg-2.png | 22×26 | (11,25) | (2,5,20,25) | PASS |
| egg-3.png | 22×26 | (11,25) | (2,1,20,25) | PASS |
