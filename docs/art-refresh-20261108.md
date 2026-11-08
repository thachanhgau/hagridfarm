# Creature and aquatic-bed artwork refresh — 2026-11-08

Six creature atlases were redrawn using built-in image_gen with Kneazle and unicorn as style references. Full prompts, master paths and SHA-256 live in `garden-v05/creature-motion-assets/masters/refresh-20261108/provenance.json`. The three anatomy corrections are recorded in those prompts. Original masters remain intact.

Runtime sprites retain 96×96 cells, pivot (48,80), five four-frame clips and their previous timing. Left views are offline mirrors of the authored right poses; no runtime flipping or new animation loop. The aquatic beds now use authored moss-stone pond art; planting coordinates, counts and game rules are unchanged.

Rebuild these refreshed assets with `node garden-v05/build-art-refresh.mjs`, then `node garden-v05/build-runtime-webp.mjs`. Run the refresh builder after older creature builders, which otherwise regenerate the previous art. It uses the existing silhouette recovery, palette rasterizer and atlas packer. The pond image is fitted to the existing 128×88 sprite canvas.

Validation: 394 tests passed, 2 skipped, using all garden-v05 *.test.mjs recursively except progression-engine.test.mjs, which requires the absent ignored historical outputs/hagrid-levels-20261013/balance-data.json. The existing pond scenery expectation was repaired to include pond-nook. Refresh checks cover all 240 directional frames, clipping, clip variation, master hashes and atlas pixels. WebP rebuild verifies decoded RGBA identity. Chrome fixture on the existing 3026 origin: levels 150/230/330 and 390×844 layout; no page errors, missing files, or horizontal page overflow. This is disposable fixture proof, not authenticated or physical-device acceptance.
