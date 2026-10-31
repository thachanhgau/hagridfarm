# Codex brief — «Mừng HPVN 2 tháng» statues (2 masters)

Owner wants two 2×2 garden statues as the reward of the «Mừng HPVN 2 tháng» event. Claude Code (Anthropic) imports,
tests, commits and releases them after you finish. **Your job is the two masters only.**

Read `grid-fit-pilot-01.md` (master rules) and `docs/grid-fit-guideline.md` §1–3 (2×2 row) first; keep exploration short.

## Items

Pack: `garden-v05/event-assets/` (`specs.json` has the subject, style, size and `inkMax`; `item-palettes.json` the
12 allowed colors per item). Both: footprint 2×2, native canvas 128×176, pivot (64, 160), ink ≤ 112×150.

| id | subject (short) | ramps |
| --- | --- | --- |
| `ev_dobby_spring_rider` | statue of Dobby riding a blue hippogriff spring-rider toy on a coiled spring, stone plinth | stone, warm, magic |
| `ev_dark_dobby_red` | «Dobby Hắc Ám»: Dobby carved in deep red stone, glowing amber eyes, sly grin, raising a sock, dark plinth | fire, wood, stone |

## Steps

1. For each id, make a master with your image generation tool: transparent background, ONE wide sheet, LEFT half =
   default isometric view, RIGHT half = the same statue turned 90° (a real turned view, NOT a mirror), same size and
   baseline, generous transparent margins. Use the `style` + `subject` text from `specs.json`. Save as
   `garden-v05/event-assets/masters/<id>.png`.
2. Build the native sprites (this only writes inside `event-assets/`):
   `DECOR_PACK_DIR=$PWD/garden-v05/event-assets SHARP_MODULE=/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp node garden-v05/halloween-assets/build-assets.mjs`
3. Look at `event-assets/native/<id>.png` and `<id>_right.png` at 1× and 3×. Dobby must read as Dobby at native size
   (big ears, big eyes, pillowcase); the spring rider must read as a rocking toy on a spring; the dark one must read red.
   Redo a master that reads badly (old one to `masters/variants/<id>-v<N>.png`).

No other files. No git commit, push or deploy. Stop and say so if you hit a usage limit. End with a short table:
id, master path, native ink box per facing, your verdict.
