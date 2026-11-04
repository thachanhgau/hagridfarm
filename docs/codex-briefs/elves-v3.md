# Codex brief — Hagrid Farm 25.0 S2: the four house-elves, beautiful version (v3, 04/11/2026)

You are Codex in the Hagrid Farm repo. You only draw masters; Claude Code resizes them into game sprites itself.
Owner: «4 con tinh vẫn chưa ưng lắm — kêu Codex làm sao đẹp». The chunky v2 sheets were crisp but too plain; the first
detailed Dobby (`garden-v05/environment/elves/masters/dobby-candidate-b.png`) had the charm. Make them **beautiful**:
lovable, expressive, polished pixel art of the quality of the best cozy farm games, matching the look of Hagrid
(`garden-v05/native-complete-objects/gardener_friend/frame-01.png`) and the owl post (`native-complete-objects/owl_post/frame-01.png`).

## Style rules (so the resize stays clean)

- True pixel art drawn on **one square pixel grid of exactly 6 × 6 px blocks** for every sheet (every block one flat colour,
  block edges on multiples of 6 from the cell's top-left). No anti-aliasing, no gradients, no blur, no glow, no drop shadow,
  no texture noise smaller than a block. Transparent background.
- Each character about **64–70 blocks tall** (hat or ear tip to feet), so it fits a game sprite of that size: detail must read at
  that size — big expressive eyes with a clear white highlight and dark pupil, readable hands, 2–3 shades per material.
- 1-block dark outline (`#231F2E` or the darkest shade of the part), light from the top-left. Colours only from the 24 sprite
  colours in `garden-v05/palette.mjs`, ≤ 16 per sheet.
- Book versions, never film actors/CGI faces. Same height and proportions for the three adult-sized elves; Winky slightly smaller.

## Characters (keep the designs from `docs/codex-briefs/elves-batch-01.md`)

- **Dobby**: huge bat ears, big round green eyes, long nose, pillowcase tunic, red-orange tea-cosy wool hat with bobble,
  one green and one purple sock.
- **Winky**: rounder and smaller, huge brown eyes, round nose, plain warm-orange tea towel toga with one darker stripe, small blue scarf.
- **Kitchen elf A** (Hogwarts kitchens): long droopy ears, blue-grey eyes, a little older, tea towel toga with a plain shield shape (no letters).
- **Kitchen elf B**: shorter, round face, upright ears, white tea towel tied as a chef's apron, wooden spoon.

## Sheets

1536 × 1024 PNG, a 3 × 2 grid of 512 × 512 cells, one pose per cell in the listed order (row 1 left→right, then row 2); feet at
y ≈ 470 in the cell, body centred on x = 256, ≥ 24 px empty margin to the cell edges. Three-quarter view toward the lower-left.
Walk-1 = left foot clearly forward, walk-2 = right foot clearly forward (visibly different legs), head at the same height.

| file in `garden-v05/environment/elves/masters/` | poses |
|---|---|
| `v3-dobby.png` | idle, walk-1, walk-2, sweep (twig broom, snow puff), water (tin can, drops), carry (vegetable basket overhead) |
| `v3-dobby-extra.png` | sleep (sitting, head on knees, hat over eyes), feed (pouring a scoop), harvest (pulling a carrot), cheer (jumping, arms up), hat (holding up a knitted hat), sock (holding up one knitted sock) |
| `v3-winky.png` | idle, walk-1, walk-2, water, carry (basket of eggs), sleep (sitting by a tiny fire) |
| `v3-kitchen-a.png` | idle, walk-1, walk-2, sweep, carry (three plates or a covered pot), sleep |
| `v3-kitchen-b.png` | idle, walk-1, walk-2, sweep, water, sleep |

Make two candidates per sheet with your image tool and keep the better (prettier, closest to the 6 px grid). Append prompts to
`garden-v05/environment/elves/prompts.json`. Do not resize, write native frames, previews or run builders.

Hard rules: no commit/push/deploy; do not edit `.mjs`, CSS, `functions/` or HPVNN; if image generation or usage is
unavailable, stop and say so — never fake art with code. Report in `docs/codex-briefs/elves-v3-report.md`.
