# Xmas S7 part 2 — native asset handoff

Completed: two image-generated masters, eight principal native PNGs, champion animation/package derivatives, six environment runtime WebPs, preview. No commit, push or deployment.

| Native PNG | Canvas | Pivot | Ink box | Foliage triangle / tabletop | Verdict |
|---|---|---|---|---|---|
| ev_champion_tree.png | 128×208 | (64,192) | (22,8)–(105,191) | — | PASS |
| ev_champion_tree_right.png | 128×208 | (64,192) | (21,8)–(107,191) | — | PASS |
| house-tree-0.png | 96×160 | (48,156) | (28,117)–(67,156) | A(48,117); y=135; x=36…59 | PASS |
| house-tree-1.png | 96×160 | (48,156) | (24,77)–(72,156) | A(48,77); y=134; x=24…72 | PASS |
| house-tree-2.png | 96×160 | (48,156) | (18,42)–(78,156) | A(48,42); y=134; x=18…78 | PASS |
| house-tree-3.png | 96×160 | (48,156) | (13,7)–(83,156) | A(48,27); y=134; x=13…83 | PASS |
| feast.png | 80×56 | (40,52) | (8,3)–(71,52) | Tabletop (8,25)–(71,44) | PASS |
| carried-tree.png | 64×48 | (8,40) | (1,2)–(58,45) | — | PASS |

Coordinates are native pixels, origin top-left; box corners are inclusive. Foliage triangles use apex A, base y, and base left/right x; these are placement envelopes, so ornament code should also mask against foliage alpha and avoid tinsel. Stage 3 apex excludes the gold star. The tabletop box encloses the projected tabletop, including occupied dish areas; it is not an empty rectangle.

## Masters and generation

Built-in imagegen, two calls (no procedural substitute artwork):
- `garden-v05/event-assets/masters/ev_champion_tree.png`: two real isometric views; slender fir, gold stars and topper, silver tinsel, three floating candles, snowy stone planter, trophy and present. Rotate cup/gift, planter seams and asymmetric foliage between views. Exact configured twelve colors.
- `garden-v05/environment/xmas/masters/xmas-part2-sheet.png`: 2×3 cells, row-major sapling / 80px fir / 115px silver-tinsel fir / full star-topped fir / feast / diagonal carried fir. Magenta key background, chunky pixel clusters, top-left light, sprite palette, no text, no baubles or ornaments on house trees.

Native processing: key removal, object crop, nearest-neighbour reduction, weighted nearest sprite-palette quantization, binary alpha and native-canvas placement. The same generated tub/snow contact crop from the full-tree cell is reused identically at y=136…159 across all four stages. Their total ink heights are exactly 40, 80, 115, 150px. No game code, CSS or tests edited.

The champion configuration supplied twelve colors including silver but declared the ordinary fire ramp, which did not contain those silvers. Added the `champion_silver_flame` four-color ramp and changed only champion ramp membership; its supplied twelve colors stay unchanged.

## Verification

- Event pack builder: packaged 11/11 items, complete.
- All 100 pre-existing event native PNGs SHA-256 identical to start; zero restoration needed.
- Eight principal natives: exact canvas, >=1px transparent border, alpha only 0/255, palette checks pass. Champion ink <=120×184, base within 1px of (64,192).
- Preview inspected at 1× and 3× nearest-neighbour on #D6D8BF. Champion differs visibly from the gnome-topped Weasley tree; house trees contain no baubles/ornaments.
- Runtime WebP builder: 1,276 lossless conversions + 8 existing WebPs, decoded RGBA identical. `node garden-v05/build-runtime-webp.mjs --check` PASS.
- Existing unrelated code/config/log changes were present before this task and preserved. This task only wrote authorized asset/build-output/preview/report paths. During final scope review, additional changes appeared concurrently in `garden-friends.mjs`, `garden-xmas.mjs` and `scene-renderer.mjs`; this task did not write or revert them.
- Runtime placement, imports, tests and commits remain Claude Code’s handoff scope.

## File bytes

- `garden-v05/event-assets/masters/ev_champion_tree.png`: 1391×1131, 1169989 bytes.
- `garden-v05/environment/xmas/masters/xmas-part2-sheet.png`: 1003×1568, 1396974 bytes.
- `garden-v05/event-assets/native/ev_champion_tree.png`: 128×208, 4444 bytes.
- `garden-v05/event-assets/native/ev_champion_tree_right.png`: 128×208, 4204 bytes.
- `garden-v05/environment/xmas/house-tree-0.png`: 96×160, 932 bytes.
- `garden-v05/environment/xmas/house-tree-1.png`: 96×160, 1645 bytes.
- `garden-v05/environment/xmas/house-tree-2.png`: 96×160, 2491 bytes.
- `garden-v05/environment/xmas/house-tree-3.png`: 96×160, 3238 bytes.
- `garden-v05/environment/xmas/feast.png`: 80×56, 1673 bytes.
- `garden-v05/environment/xmas/carried-tree.png`: 64×48, 1108 bytes.
