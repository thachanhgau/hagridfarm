# Creatures art phase 2 redo — two item masters, 2026-11-08

**2/2 replacements delivered. Four ImageGen candidates generated; no refusals. Verdict: good as design masters.**

Master: `garden-v05/masters-items/creatures-2/items-sheet-v2.png` — **1536×1024 RGBA**, original 3×2 layout.

| id / cell | candidate kept and why | placed object bounds (cell-local, right/bottom exclusive) | verdict |
|---|---|---|---|
| `produce_crup` / row 1, col 1 | **A over B**: more upright teardrop tuft, two distinct large tan-brown patches, continuous dark top/left outline and a broad red bow. B leans farther and its upper patch merges into the point. | `(156,120)–(355,440)`, 199×320 | good |
| `salamander_feed` / row 2, col 3 | **B over A**: five thick twig shafts with blunt ends, clear binding, and a large red chilli across the foreground. A has a more sprawling branched silhouette; B groups the twigs more compactly. The chilli occupies roughly half to two-thirds of the bundle width and is the strongest colour accent. | `(96,133)–(416,440)`, 320×307 | good |

## Verification

- All four other 512×512 cells compare **pixel-for-pixel equal in decoded RGBA**, including RGB beneath transparent pixels, against `items-sheet.png`.
- Original file SHA-256 remains `c4260b04ba9dbb82c297c21b428e4970aca0fe3aeec0df5769862a76747298c4`.
- Final v2 SHA-256: `36ac9a7c8cd9c0191c0d6697733d7b36594a765fe153de3bf7c2507b6eb91644`.
- Both replacement objects end at local y=440 (last occupied row 439), have at least 72 px transparent margin, and fit within 320×320 master pixels.
- Inspected all four candidates and the final replacements on light and dark backgrounds. A temporary nearest-neighbour 1/8 readability check of the actual final cells gives a **25×40 px** fur object and **40×38 px** twig/chilli object in 64×64 frames. The fur retains its outline; the chilli remains clearly visible. No broad soft exterior halo is visible. No native assets were saved.
- `place-items-v2.py` only copies original cells, crops generated sources, resizes with nearest-neighbour and places them. The crop rectangle uses alpha≥128 to locate visible content; it does not rewrite source alpha. A second crop removes empty rows/columns after resizing. No painting, quantizing, alpha cleanup or builders were used.
- Assertions verify canvas dimensions, replacement margins/baseline, four unchanged cells, and the original file hash. Machine-readable results: `creatures-art-2/items-v2-verification.json`.

## Prompts and sources

- Built-in ImageGen; four separate calls, two candidates per item. All four unmodified generated PNGs are preserved as `creatures-art-2/produce_crup-v2-candidate-A.png`, `produce_crup-v2-candidate-B.png`, `salamander_feed-v2-candidate-A.png`, and `salamander_feed-v2-candidate-B.png`.
- Appended five records to `creatures-art-2/prompts.json`: four exact candidate prompts and one assembled-master record. Each points to the v2 master; the final record's `generatedFiles` lists the **two selected original tool sources**, with workspace copies in `componentSources`. The preceding 30 records remain intact.
- Reproduce composition and checks with `/usr/local/bin/python3 docs/codex-briefs/creatures-art-2/place-items-v2.py` (Pillow required).

## Limits and boundaries

These are design masters for Claude's native pass. Generated sources retain partial alpha and small internal colour/shading variations; exact 24-colour, binary-alpha native reconstruction and runtime acceptance are not certified here. No broad visible halo was observed in the final light/dark checks, which is a visual finding rather than a claim of binary alpha.

No git commands, builders, importers, runtime changes, HPVNN or `functions/` work. `items-sheet.png` was not modified. Existing files were preserved except the explicitly requested prompt append. No generation refusal occurred.
