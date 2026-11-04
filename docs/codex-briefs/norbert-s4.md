# Codex brief — Hagrid Farm 25.0 S4: baby Norbert, the garden companion (04/11/2026)

You are Codex in the Hagrid Farm repo. You only draw masters; Claude Code resizes them into game sprites itself.
Follow `docs/art-bible.md`. Match the look and quality of the approved house-elf masters
(`garden-v05/environment/elves/masters/v3-dobby.png`) — same pixel style, same light, same outline.

## Character (HP1, book version — never film CGI)

**Norbert**, Hagrid's baby **Hắc long Na Uy** (Norwegian Ridgeback), a few weeks old: skinny jet-black body
(`#231F2E`/`#41465C` with `#687486` highlights), a row of small bony ridges down the back, big bony spiky wings
folded like a wet umbrella, a long snout with wide nostrils, stubby horn buds, large bulging **orange** eyes with a white
highlight, a thin tail with a small spade tip. Cute and mischievous, not scary. Smaller than Dobby.

## Style rules (so the resize stays clean)

- True pixel art on **one square grid of exactly 6 × 6 px blocks** (every block one flat colour, edges on multiples of 6 from
  the cell's top-left). No anti-aliasing, gradients, blur, glow, drop shadow or sub-block noise. Transparent background.
- Norbert about **48–54 blocks tall** standing (head top to feet). 1-block dark outline; on the black body use `#41465C`
  rim-lights on the top-left edges so the shape reads on dark grass. Colours only from the 24 sprite colours in
  `garden-v05/palette.mjs`, ≤ 14 on the sheet.

## Sheet

`garden-v05/environment/elves/masters/v4-norbert.png`: 1536 × 1024 PNG, a 3 × 2 grid of 512 × 512 cells, one pose per cell in
this order (row 1 left→right, then row 2); feet at y ≈ 470, body centred on x = 256, ≥ 24 px empty margin. Three-quarter view
toward the lower-left.

1. `idle` — sitting up, wings folded, looking up happily.
2. `walk-1` — waddling, left foot forward.
3. `walk-2` — waddling, right foot forward (legs visibly different from walk-1, head at the same height).
4. `sleep` — curled up in a ball, tail around the snout, eyes shut, wings folded.
5. `play` — pouncing on a small red wool ball (`#C75B4B`) with the front paws, tail up.
6. `puff` — sneezing a small puff of grey smoke with two tiny orange sparks from the nostrils (no big fire).

Make two candidates with your image tool and keep the better (cuter, closest to the 6 px grid). Append the prompt to
`garden-v05/environment/elves/prompts.json` (keep earlier entries). Do not resize, write native frames or previews, or run
builders.

Hard rules: no commit/push/deploy; do not edit `.mjs`, CSS, `functions/` or HPVNN; if image generation or usage is
unavailable, stop and say so — never fake art with code. Report in `docs/codex-briefs/norbert-s4-report.md`.
