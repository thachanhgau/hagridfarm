# Pond art 03 — larger, darker masters

2026-11-08. Built-in ImageGen, one initial generation and one targeted cleanup per pond. Three replacement masters saved; no native sprite export, builder/importer, commit, push or deployment performed.

| Master | Canvas | Drawing |
|---|---|---|
| `garden-v05/environment/pond/masters/pond-1.png` | 1152×744 RGBA | Ao cá, 4×5 tiles: murky blue-violet water, four fish shadows, three sparse lily pads, mossy grey rocks and dark cattails; least dark tier. |
| `garden-v05/environment/pond/masters/pond-2.png` | 1152×726 RGBA | Hồ rong, 5×7 tiles: darker water, denser back reeds, long submerged ribbon weed, half-sunk twisted log, paired pale eyes, fish and a bubble trail. |
| `garden-v05/environment/pond/masters/pond-3.png` | 1440×894 RGBA | Hồ sâu, 6×9 tiles: thin shallow rim, stepped blue-violet water to an almost-black centre, small rock islet, dead root and pale eyes, dark back reeds and mossy rocks; rotten front-right jetty with posts and a conspicuous missing-plank gap. |

The cleanup candidates were retained: clearer broad colour clusters and outlines, less mottled detail, and a readable missing plank in the third pond. The three share rock, cattail, lily-pad and water motifs; the larger ponds add water area. Each generation received its new guide as a reference along with the old master family. Ground silhouettes were visually compared with the guides; this is not a pixel-exact geometry certification. No guide seams, red dashes, pivot dots, lettering or flowers are visible.

## Preview and reproduction

`docs/codex-briefs/pond-art-03-preview.png` is 1248×346: three masters side by side, nearest-neighbour reductions ×1/4, ×1/3, ×1/3 (288×186, 384×242, 480×298), bottom-aligned on solid grass green `#5E7B3B`. Visually inspected at native size.

`node docs/codex-briefs/pond-art/place-pond-03.mjs` reproduces the master placement and contact sheet with the existing Sharp dependency. It only resizes by nearest-neighbour and saves onto the target transparent canvases; it does not paint, quantize, threshold alpha or export game assets. Its assertions passed for all three canvas sizes, visible artwork, real transparent pixels and three preview entries.

Full final and initial prompts, generated source paths, reference paths and selected candidates are recorded in `docs/codex-briefs/pond-art/pond-03-records.json`; the six prompt entries were also appended to `garden-v05/environment/pond/prompts.json`. Original generated sources remain at their recorded ImageGen paths.

## Strict-style limits for handoff

**These are generated masters, not fully compliant native pixel sprites.** The tool retained subtle shading/colour variation and partially transparent pixels despite explicit flat-colour/opaque-pixel cleanup prompts. Do not treat the no-gradient/no-antialiasing or exact per-tile pixel-grid requirements as fully verified. No refusal occurred. Source/native alignment, palette reduction, binary alpha and runtime registration/testing remain with Claude as specified by the brief; these should be inspected after reduction before acceptance.

| Master | Alpha 0 pixels | Alpha 255 pixels | Partial-alpha pixels | Distinct visible RGB colours |
|---|---:|---:|---:|---:|
| pond-1 | 455575 | 515 | 400998 | 33029 |
| pond-2 | 380268 | 766 | 455318 | 27284 |
| pond-3 | 568559 | 691 | 718110 | 44488 |

Most interior alpha is 253; there are also faint edge pixels. Genuine transparent background is present, but this is not binary alpha and the masters are not restricted to 24 colours. Preserve the authored design while performing the downstream native cleanup. The jetty is visually three surviving deck boards plus one missing-board gap; its precise four-plank-width construction still needs review at native resolution.

## Preserved scope

`pond-bed.png` was not redrawn or changed (SHA-256 `15c4a9d4dd25632cd841dc746325b84ed6ed2f8340e6b04dc3b06b0d9bf67143`). The three guides retain their read-time hashes. No `.mjs` outside `docs/codex-briefs/pond-art/` was edited by this task. Other worktree edits were present or appeared during generation and were left alone.
