# Codex brief — 25.0 S7: the Noel set of bậc Tận Sức (6 two-view decoration masters)

Claude Code (Anthropic) imports, tests and commits after you. **Your job is the masters and the pack build only.**
Read `docs/codex-briefs/elves-part2.md` (same pack and pipeline), `docs/grid-fit-guideline.md` §1–3, and the
style text in `garden-v05/event-assets/specs.json`. Keep exploration short.

**Only the ids named in the run prompt.** A trial run draws one id; the batch run draws the ones listed there.

## Decorations — `garden-v05/event-assets/masters/<id>.png`

Specs (subject, canvas, footprint, `inkMax`) and palettes are already in `event-assets/specs.json` and
`item-palettes.json`. Same two-view master as the statues and the elf tent: LEFT half default isometric view, RIGHT
half the same object turned 90° (a real turned view, NOT a mirror), same size and baseline, generous margins.
Christmas pieces for a wizard garden in winter: warm, cosy, readable at 1×; big pixel clusters, no fine noise.

| id | name | footprint | canvas · pivot | ink ≤ | must read as |
| --- | --- | --- | --- | --- | --- |
| `sp_xmas_firebolt` | Cây chổi Tia Chớp quà Giáng sinh | 1×1 | 64×128 · (32,112) | 56×104 | a fine racing broom upright in a stand, torn red gift paper at its foot |
| `sp_xmas_butterbeer` | Quầy bia bơ quán Ba Cây Chổi | 2×1 (long strip) | 96×112 · (48,96) | 88×92 | a low snowy bar counter with foaming tankards and a copper keg |
| `sp_xmas_honeydukes` | Tủ kẹo tiệm Công tước Mật | 2×1 (long strip) | 96×144 · (48,128) | 88×124 | a sweetshop cabinet full of bright sweet jars under a snowy awning |
| `sp_xmas_invisibility_cloak` | Áo khoác tàng hình trong gói quà | 1×1 | 64×96 · (32,80) | 56×72 | an opened parcel with a silvery cloak spilling out, part of it vanishing |
| `sp_xmas_weasley_tree` | Cây thông Giáng sinh nhà Weasley | 2×2 | 128×208 · (64,192) | 120×184 | a decorated family fir tree with a scowling gnome in a tutu on top |
| `sp_xmas_yule_roses` | Vườn hồng đêm Dạ vũ | 3×2 (long) | 160×176 · (80,160) | 152×152 | rose bushes with glowing fairies, a stone Father Christmas and reindeer sleigh |

Long footprints: the long side runs along the strip in the left view and along the other axis in the turned view.
Ink width at least 0.6 × canvas width (`grid-fit-guideline.md` §3); the base sits on the pivot row.

Then build (writes only inside `event-assets/`):
`DECOR_PACK_DIR=$PWD/garden-v05/event-assets SHARP_MODULE=/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp node garden-v05/halloween-assets/build-assets.mjs`

Ids still without a master are reported as missing and skipped; that is expected until the batch run. After a
trial run also write `docs/codex-briefs/xmas-set-s7-trial.png`: the trial id's native default and right views side by
side at 3× nearest-neighbour on #D6D8BF.

Check `native/<id>.png` and `<id>_right.png` at 1× and 3×. The four existing items' native files (`ev_*`) must stay
byte-identical (`git status`); if the build rewrote them, revert those files. Redo a master that reads badly (old
one to `masters/variants/<id>-v<N>.png`).

No other files. No git commit, push or deploy. Stop and say so if you hit a usage limit or an image refusal (do not
rename or describe around a refused subject). End with a short table: id, master path, native ink box per facing,
your verdict.
