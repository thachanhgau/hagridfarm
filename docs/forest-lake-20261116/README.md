# Forbidden Lake forest refresh — 16 November 2026

The owner requested remaking the repeated bare trees around the lake. Replace the shared old oak with a dense ancient grove: two intertwined trunks, layered broadleaf canopy, hanging moss/ivy and fern undergrowth. The winter master preserves the crown under thick snow rather than switching to a leafless silhouette. Existing pine, smaller grove and log assets remain as the other silhouettes in the seeded composition.

Base source d827bbc includes the integrated 11×8 Forbidden Lake, Noel/ACP updates and the corrected nook at (12.5,-3). This task changes only the two oak images/HD selections and their authoring/export records. Original190×176 canvas, pivot95,174, root anchors, flips/scales and all forest placement/clearance/rendering code remain unchanged. Matching HD380×352 comes from the authored masters, not upscaled native pixels.

Generation: built-in image_gen; guide, full prompt set, two retained1254×1254 masters, shared crop and uniform export are under `garden-v05/environment/forest-v06/masters/lake-ring-20261116/`. Native palette is the existing sprite palette plus snow white; binary alpha with transparent margins. No skew/rotation after export. Trees are organic: root pixels and unchanged geometry are checked, no fabricated straight-edge certification of foliage.

`node garden-v05/build-forest-oak.mjs` publishes both seasons and records frozen hashes. The old forest builder delegates oak to this export; HD recovery prioritizes the two reviewed previews and skips their superseded atlas cells. Regenerate runtime WebP → HD → WebP, then check. Only the two oak mappings change; other1556 HD selections are identical.

Proof in pixel-proof.json: native/HD image matches, binary alpha/palette/margins, observed root bottoms within2px of original pivot, geometry source hashes unchanged. Upper winter crown region190×105 has12852 opaque pixels versus3979 previously (3.23× canopy coverage); this is an artwork-coverage measure, not a tree-count claim. Forest paths, all expanded boundaries and wrapped canopy families retain their clearance tests.

Tests: 28 focused forest/scene/winter pass; full source504 total,501 pass, one pre-existing MAX_LEVEL10000-versus500 assertion, two skipped. Original ghost well/cottage13 protected files and all six lake native/HD exports still pass. Local browser/import evidence is recorded separately in HPVNN; no push/deploy.
