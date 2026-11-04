# Codex brief — Dobby pilot v2: masters drawn ON the native pixel grid (04/11/2026)

You are Codex in the Hagrid Farm repo. You only draw masters; Claude Code reduces them to native sprites.
Owner on pilot v1: «con tinh pixel không nét, nhìn vỡ và không đẹp». Cause: the v1 masters were finely detailed
illustrations with an uneven ~5 px pixel grid; shrinking them to a 56 px sprite mixes or drops pixels.

## What to make

Two candidate sheets, each **1536 × 1024**, PNG with transparent background, a 3 × 2 grid of **512 × 512 cells**, one pose
per cell, same order as v1: row 1 `idle`, `walk-1`, `walk-2`; row 2 `sweep`, `water`, `carry`
(see `docs/codex-briefs/elves-dobby-pilot.md` for the character and the six poses; keep the same design: book Dobby,
huge bat ears, big round green eyes, long nose, pillowcase tunic, red-orange tea-cosy wool hat with bobble, one green and
one purple sock; never the film actor/CGI face).

**The grid rule (most important):** each sprite is designed as **low-resolution pixel art at most 56 × 60 sprite pixels**
(carry may be 64 tall with the basket), and every sprite pixel is drawn as an **exact 8 × 8 block** of one flat colour,
aligned to multiples of 8 from the cell's top-left corner. So a pose is at most 448 × 480 px inside its 512 × 512 cell,
feet resting on the cell's block row 60 (y = 480 within the cell), body centred on block column 32 (x = 256).

Style for that size, like `garden-v05/native-complete-objects/gardener_friend/frame-01.png` (Hagrid, 58 × 90 sprite pixels):
- big flat shapes, **no texture noise** (no knit pattern, no cloth folds smaller than 2 sprite pixels);
- a clean **1-sprite-pixel dark outline** (`#231F2E`) around the whole silhouette;
- at most **12 colours** per sheet, all from the 24 sprite colours in `garden-v05/palette.mjs`
  (skin `#F5D69A #E7AE73 #C97952`, hat `#C75B4B #ED8A45 #8B4A3F`, tunic `#D6D8BF #A6B1AE`, eyes `#B0BD67 #71934B`,
  socks `#71934B` / `#6961A6`, outline `#231F2E`); light from the top-left, one shade darker on the lower-right;
- the face must read at 1×: each eye a 4–5 sprite-pixel circle with a 1–2 pixel pupil, the nose a clear 1-pixel-wide line.

No anti-aliasing, no gradients, no glow or shadow outside the sprite, no text.

## Files

`garden-v05/environment/elves/masters/dobby-v2-a.png` and `dobby-v2-b.png`; add their prompts to
`garden-v05/environment/elves/prompts.json` (append, keep v1 entries). Do not write the native frames or a preview, do not
run any builder; Claude does the reduction and checks.

Hard rules: no commit/push/deploy; do not edit `.mjs`, CSS, `functions/` or HPVNN; if image generation or usage is
unavailable, stop and say so — never fake the art with code. Report in `docs/codex-briefs/elves-dobby-pilot-v2-report.md`
(which candidate looks closer to the 8 × 8 block grid and why).
