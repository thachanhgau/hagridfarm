# Codex brief — 25.0 S2 part 2: two knitting icons and two elf decorations (3 masters)

Claude Code (Anthropic) imports, tests and commits after you. **Your job is the masters and the pack build only.**
Read `docs/codex-briefs/hpvn-2-months-statues.md` (same pack and pipeline), `docs/grid-fit-guideline.md` §1–3, and the
style text in `garden-v05/event-assets/specs.json`. Keep exploration short.

## A. Item icons — `garden-v05/masters-items/elf-knits.png`

ONE transparent sheet, exactly 1 row × 2 columns, equal cells, each subject centred with generous transparent gaps
between and around them (the importer cuts at transparent valleys; nothing may touch a cell edge). Style: match the
existing `garden-v05/masters-items/recipes-a.png` (look at it): chunky pixel-art inventory icon, top-left light,
selective dark-purple outline, 24-colour palette from `specs.json` style text, no text. Subjects, left to right, from
`garden-v05/item-art-sources.json` group `elf-knits`:
1. `recipe_elf_hat` — lumpy hand-knitted woolly elf hat, red and gold stripes, big pompom, a knitting needle through it.
2. `recipe_elf_sock` — one long hand-knitted woolly sock, bright mismatched green and purple stripes, darned heel.
They are shown at about 48 px tall: big readable silhouettes, chunky knit texture, no fine detail.

## B. Decorations — `garden-v05/event-assets/masters/<id>.png`

Specs (subject, canvas, footprint, `inkMax`) and palettes are already in `event-assets/specs.json` and
`item-palettes.json`. Same two-view master as the statues: LEFT half default isometric view, RIGHT half the same object
turned 90° (a real turned view, NOT a mirror), same size and baseline, generous margins.

| id | name | footprint | canvas · pivot | ink ≤ |
| --- | --- | --- | --- | --- |
| `ev_elf_tent` | Lều gia tinh | 2×2 | 128×176 · (64,160) | 112×150 |
| `ev_kitchen_corner` | Góc bếp | 2×1 (long strip: hearth and table side by side along it; in the turned view along the other axis) | 96×112 · (48,96) | 88×92 |

Then build (writes only inside `event-assets/`):
`DECOR_PACK_DIR=$PWD/garden-v05/event-assets SHARP_MODULE=/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp node garden-v05/halloween-assets/build-assets.mjs`

Check `event-assets/native/<id>.png` and `<id>_right.png` at 1× and 3×: the tent must read as a little patched tent with
sock bunting; the kitchen corner as a hearth with a steaming copper pot next to a small table. The two existing statues'
native files must stay byte-identical (`git status`); if the build rewrote them, revert those files. Redo a master that
reads badly (old one to `masters/variants/<id>-v<N>.png`).

No other files. No git commit, push or deploy. Stop and say so if you hit a usage limit. End with a short table:
id, master path, native ink box per facing (or icon ink box), your verdict.
