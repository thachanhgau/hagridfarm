# Hagrid homestead refresh

Owner requested a more impressive, richly decorated home. Replace the small hut with an authored expanded stone cottage: layered slate roof, timber porch, right wing, three warm lanterns, lit windows, firewood lean-to, pumpkins, kettle, herb pots, barrel, broom, bench and stepping stones. Normal and snow versions share a 256×224 canvas and (128,216) anchor. Hut logical position (0,4), Hagrid, Fang, paths and saved coordinates are preserved. The separate old cottage-corner prop is replaced by the integrated yard; chimney smoke follows the new left chimney.

Built-in image_gen master, final prompt and checksums are retained in garden-v05/environment/homestead-20261108/. Rebuild with node garden-v05/build-homestead-art.mjs after base scene/winter builders, then node garden-v05/build-runtime-webp.mjs. Native nearest sampling, shared palette and binary alpha; no runtime resizing.

Verification: 38 focused scene/layout/winter/placement/renderer checks passed, one existing skip. WebP1396+8 RGBA parity. Browser acceptance and imported commit are recorded separately in HPVNN. Local only; no push/deploy.
