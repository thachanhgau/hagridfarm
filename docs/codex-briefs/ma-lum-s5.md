# Codex brief — Hagrid Farm 25.0 S5: ma lùm, the garden gnome (04/11/2026)

You are Codex in the Hagrid Farm repo. You only draw masters; Claude Code resizes them into game sprites itself.
Follow `docs/art-bible.md`. Match the look and quality of the approved house-elf masters
(`garden-v05/environment/elves/masters/v3-dobby.png`) — same pixel style, same light, same outline.

## Character (HP2 «Phòng chứa bí mật», book version — never a garden-centre gnome, never a film look)

A **ma lùm** from the Weasleys' garden: small and leathery, a large bald knobbly head exactly like a potato
(`#A57554`/`#C97952`, `#735044` shade), small hard feet, tiny sharp eyes, a wide grumpy mouth, bony little hands; brown
rags or nothing. Mischievous and greedy, not scary. It is a garden pest that steals ripe crops. About half Dobby's height.
It sits in a clump of weeds (`#3F6A45`/`#71934B`/`#B0BD67` blades) and must stand out on dark soil and on grass: give the
head a `#E7AE73` rim-light on its top-left edge.

## Style rules (so the resize stays clean)

- True pixel art on **one square grid of exactly 6 × 6 px blocks** (every block one flat colour, edges on multiples of 6
  from the cell's top-left). No anti-aliasing, gradients, blur, glow, drop shadow or sub-block noise. Transparent
  background.
- The gnome about **40–44 blocks tall** standing (head top to feet); weeds up to 10 blocks tall around its feet.
  1-block `#231F2E` outline. Colours only from the 24 sprite colours in `garden-v05/palette.mjs`, ≤ 12 on the sheet.

## Sheet

`garden-v05/environment/duty/masters/ma-lum.png`: 1024 × 1024 PNG, a 2 × 2 grid of 512 × 512 cells, one pose per cell in
this order (row 1 left→right, then row 2); feet at y ≈ 470, body centred on x = 256, ≥ 24 px empty margin. Three-quarter
view toward the lower-left.

1. `idle` — crouching in the weeds, hugging a stolen small pumpkin `#ED8A45`, looking around slyly.
2. `chew-1` — biting the pumpkin, cheeks full, eyes squeezed.
3. `chew-2` — same pose, mouth open (the pumpkin with a bite missing), head 1 block lower.
4. `flung` — the gnome spinning in the air upside-down, arms and legs out, dizzy (no weeds, no motion lines).

Make two candidates with your image tool and keep the better (closest to the 6 px grid, clearest potato head). Append the
prompt to `garden-v05/environment/duty/prompts.json` (create it as a JSON array). Do not resize, write native frames or
previews, or run builders.

Hard rules: no commit/push/deploy; do not edit `.mjs`, CSS, `functions/` or HPVNN; if image generation or usage is
unavailable, stop and say so — never fake art with code. Report in `docs/codex-briefs/ma-lum-s5-report.md`.
