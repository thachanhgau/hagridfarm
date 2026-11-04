# Codex brief — Hagrid Farm 25.0 S2: the other house-elves (04/11/2026)

You are Codex in the Hagrid Farm repo. You only draw masters; Claude Code reduces them to native sprites and checks.
The owner approved Dobby in exactly this style: **`garden-v05/environment/elves/masters/dobby-v2-b.png`** — open it and
match it: chunky low-resolution pixel art, every sprite pixel one flat square block (that master's blocks are ~11.6 px;
keep the **same block size** so every elf comes out at the same pixel density), clean 1-block dark outline `#231F2E`, big
flat shapes, no texture noise, no anti-aliasing, no gradients, no glow, no text, transparent background. Light from the
top-left. Colours only from the 24 sprite colours in `garden-v05/palette.mjs`, at most 12 per sheet.

## Sheets

Four sheets, each **1536 × 1024**, a 3 × 2 grid of **512 × 512 cells**, one pose per cell, in the order given
(row 1 left→right, then row 2). In every cell the feet rest at y ≈ 480 and the body is centred on x = 256, and an elf is
**the same height as Dobby in dobby-v2-b** (hat/ear top ≈ 20–60 px from the cell top). Three-quarter view toward the
lower-left, like Dobby. Two candidates per sheet with your image tool; keep the better one (closest to Dobby's style and
block size) and say why.

| file (in `garden-v05/environment/elves/masters/`) | character | poses |
|---|---|---|
| `dobby-v2-extra.png` | **Dobby**, the same design as dobby-v2-b | `sleep` (curled up asleep sitting on the ground, head on knees, hat over his eyes, a small "z" made of 3 blocks is fine), `feed` (pouring a scoop of feed down to the lower-left), `harvest` (pulling up a carrot with both hands), `cheer` (jumping with both arms up, happy), `hat` (holding up a new knitted wool hat proudly with both hands), `sock` (holding up a single knitted sock, delighted) |
| `winky.png` | **Winky** (book version, never the film CGI): a female house-elf, smaller and rounder than Dobby, very large **brown** eyes (`#735044`/`#A57554`), round nose, wearing a **tea towel tied like a toga** (`#C97952`/`#E7AE73` checks are too fine: use plain warm orange with one darker stripe), a small blue knitted scarf (`#70A8B6`) for winter | `idle`, `walk-1`, `walk-2` (2-frame walk), `water` (small tin watering can), `carry` (a basket of eggs held in front), `sleep` (asleep sitting by a fire, hands folded) |
| `kitchen-elf-a.png` | **a Hogwarts kitchen house-elf**: a tea towel worn as a toga with a small plain **shield shape** on the chest (no letters, no crest details), long droopy ears, blue-grey eyes, a little older-looking | `idle`, `walk-1`, `walk-2`, `sweep` (twig broom, puff of snow), `carry` (a stack of three plates or a covered pot), `sleep` |
| `kitchen-elf-b.png` | **another Hogwarts kitchen house-elf**, clearly different from A: shorter, round face, ears that stick up, a white chef-style tea towel tied as an apron, carrying a wooden spoon in idle | `idle`, `walk-1`, `walk-2`, `sweep`, `water`, `sleep` |

Walk frames: walk-1 left foot forward, walk-2 right foot forward, head at the same height. Each pose must stay inside its own
cell with ≥ 16 px of empty margin to the cell edges.

Add every prompt to `garden-v05/environment/elves/prompts.json` (append, keep earlier entries). Do not write native frames
or previews and do not run any builder: Claude does the reduction.

Hard rules: no commit/push/deploy; do not edit `.mjs`, CSS, `functions/` or HPVNN; if image generation or usage is
unavailable, stop and say so — never fake the art with code. Report in `docs/codex-briefs/elves-batch-01-report.md`.
