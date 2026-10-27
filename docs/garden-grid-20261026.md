# Hagrid: common pixel and ground grid

One logical square is 64×32 world pixels in the existing 2:1 isometric view.
All ground dimensions are integer multiples of that square, at least 1×1.
Height above the ground is separate: a tall tree can occupy 2×2 ground while
its canopy extends above that base. A sprite is drawn with its own native
width, height and foot pivot; moving or turning it never rescales the image.

| Ground | World-pixel bounding box |
| --- | --- |
| 1×1 crop / small decoration | 64×32 |
| 2×1 decoration | 96×48 |
| 2×2 decoration | 128×64 |
| 3×2 decoration | 160×80 |
| 3×3 plot (9 crop cells) | 192×96 |
| 5×3 pen (2 residents) | 256×128 |

`garden-v05/garden-grid.mjs` owns projection, inverse projection, snapping,
plot geometry and pixel measurement. The former independent 1.25 plot
enlargement is removed. `garden-object-metrics.mjs` assigns native sizes,
pivots and whole-cell footprints to crops, creatures, fixed scenery, earned
decorations, shop decorations, keepsakes, habitats, forest, plots and pens.
Shop footprints come directly from the catalog; fixed scenery uses the same
rectangles for its specification and placement collision. Pen collision now
matches the painted fence, without the old half-cell offset. Pens no longer
stretch to fill spare space at the perimeter.

The placement bar reports the oriented footprint and projected ground pixels.
Its ground outline shows every occupied square, including interior seams.
Forest artwork uses only integer magnification (1× or 2×), with its clearance
rectangle calculated at that same scale. The existing camera may zoom the
whole scene to fit a phone; these measurements are world pixels at zoom 1.

How new art must size itself to its footprint (canvas, pivot, ink box per footprint) and the current misfits: [grid-fit-guideline.md](grid-fit-guideline.md), checked by `node garden-v05/audit-grid-fit.mjs`.

The rebuildable per-object sheet is `docs/garden-grid-metrics.json`:

```
node garden-v05/export-grid-metrics.mjs
node garden-v05/export-grid-metrics.mjs --check
```

The exporter loads the same bootstrap scripts as index.html, including later
crop/creature artwork overrides. Do not generate the sheet from the original
motion-data.json alone. A new asset declares its footprint and native frame
dimensions; it must not introduce a private cell scale. Extend map/stage bounds
deliberately; scene metadata now accounts for the existing southern expansion.

Saved layout IDs, item coordinates, facing, inventory and prices are retained.
The existing half-cell positioning precision and old 7.15-row sockets remain
compatible with the server; this is positioning precision, not a smaller item
footprint. No member save migration is needed. Geometry tests cover all 162
crop cells, moved pens, both decoration views and legacy coordinates. Browser
fixture QA remains separate from production or physical-device acceptance.
