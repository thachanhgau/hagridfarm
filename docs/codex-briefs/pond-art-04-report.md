# Pond art 04 — all tiers on the same large ground

2026-11-08. Two replacement masters drawn with built-in ImageGen, using final `pond-3.png` as the style/geometry reference and each new 6×9 guide as the ground reference. No native export, builder/importer, commit, push or deployment performed.

| Master in `garden-v05/environment/pond/masters/` | Canvas | Drawing and verdict |
|---|---|---|
| `pond-1.png` | 1440×894 RGBA | Ao cá: broad murky blue-violet water, five fish shadows, three grey-green lily pads, mossy grey rocks, dark cattails, fallen log on the front-right bank. No jetty or deep black centre. Selected first candidate: clear least-developed tier with the same large footprint. |
| `pond-2.png` | 1440×894 RGBA | Hồ rong: darker blue-violet stepped centre, long submerged ribbon weed in the shallows, half-sunk log, two pale eyes, denser dark back reeds, mossy rocks, sparse pads and bubbles. No jetty; centre remains blue rather than black. Selected first candidate: richer and darker while retaining the shared rim and pixel motifs. |
| `pond-3.png` | 1440×894 RGBA | Existing final Hồ sâu, unchanged byte for byte. Reference only. |

## Review and verification

`docs/codex-briefs/pond-art-04-preview.png` is 1536×346, with the three masters side by side, each nearest-neighbour ×1/3 (480×298), on solid `#5E7B3B`, with 24-pixel margins/gaps. The actual saved preview was visually inspected. All three read as the same big pond progressing from fish water to weed water to the nearly black deep pool. Rocks, reeds, rim, water colours and apparent pixel block density closely follow the final third tier. No guide seams, red marks, lettering, flowers, skulls or gore are visible.

Ground silhouettes were visually compared with the guide and final third pond. This is not certification of pixel-exact rim geometry or an identical underlying square-pixel lattice: ImageGen redraws those details. Final placement used nearest-neighbour only, from generated 1591×988 sources to 1440×894 canvases.

Run `node docs/codex-briefs/pond-art/place-pond-04.mjs` from the repository root to reproduce placement, preview and checks. Assertions passed for all three 1440×894 canvases, visible artwork, real transparent pixels, and the protected final pond hash before/after. The script does not paint, quantize, threshold alpha or export native assets. Detailed output and final SHA-256 values are in `docs/codex-briefs/pond-art/pond-04-checks.json`.

## Native cleanup boundary

These are generated drawing masters. Despite the explicit flat-colour, opaque-square-pixel prompts, subtle colour variation and partial alpha remain, as they also do in the protected final third master. The strict no-gradient/no-antialiasing, exact palette24 and exact block-grid rules are not fully satisfied at master level. Claude must inspect and clean the native reduction; do not describe these as compliant game sprites yet.

| Master | Fully transparent pixels | Opaque pixels | Partial-alpha pixels | Visible RGB colours |
|---|---:|---:|---:|---:|
| pond-1 | 605375 | 569 | 681416 | 43270 |
| pond-2 | 588773 | 820 | 697767 | 44944 |
| pond-3 (unchanged reference) | 568559 | 691 | 718110 | 44488 |

## Provenance and preserved files

The complete two final prompts, original generated file paths and reference paths are saved in `docs/codex-briefs/pond-art/pond-04-records.json` and appended to `garden-v05/environment/pond/prompts.json`. Both original generated PNGs remain at their recorded ImageGen paths. No refusal occurred.

Protected `pond-3.png` SHA-256: `b61e127c20d76ef51cbd6bf9503a8ba31c2869102310f4d28a28094906634654` (identical before/after).

Both shore-bed files retain their read-time hashes: master `93cf6924174f796298e259d8941d95b5a7373673b6e3b7bfb944f381cf8eb861`, native `15c4a9d4dd25632cd841dc746325b84ed6ed2f8340e6b04dc3b06b0d9bf67143`. All three current guides are byte-identical, SHA-256 `80d749e2971e67f7c903a907f7aa4daac0bf6548d4483fe4ad91af1fe5c67bdf`.

Only the two requested masters, appended prompt provenance, and this task's report/preview/support files were written. No `.mjs` outside `docs/codex-briefs/pond-art/` was edited. Other source changes were present or appeared during generation; they were left alone. Native reduction, registration, runtime testing and commit remain with Claude as assigned in the brief.
