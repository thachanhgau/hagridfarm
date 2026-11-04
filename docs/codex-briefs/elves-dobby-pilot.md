# Codex brief — Hagrid Farm 25.0 S2: living Dobby, pilot sheet (04/11/2026)

You are Codex in the Hagrid Farm repo. You only draw. Claude Code (Anthropic) writes the code that uses the frames and
checks them; the owner approves this pilot before the other house-elves are drawn, so quality of the character matters most.

Read `docs/art-bible.md` (five hard rules, palette, light from top-left, outline `#231F2E` or the darkest ramp colour, no
pure black, no white outline) and use only the 24 sprite colours in `garden-v05/palette.mjs`. Pixel art, crisp, no text.

## Character

**Dobby the house-elf, alive, walking around Hagrid's garden in winter** (book version, never the film actor/CGI face):
tiny and thin, huge bat-like ears, very large round green eyes (tennis-ball eyes, use `#71934B`/`#B0BD67`), long pointed
nose, pale tan skin (`#E7AE73` with `#C97952`/`#A57554` shading), long thin fingers. He wears an old pillowcase tied like
a tunic, **a knitted wool hat shaped like a tea cosy** (warm red/orange `#C75B4B`/`#ED8A45`, a tiny bobble), and **two
odd socks** (one striped, one plain, different colours). Cheerful, eager, a little clumsy.

He must look clearly different from the two existing Dobby **statues** (`garden-v05/event-assets/native/ev_dobby_spring_rider_right.png`,
`ev_dark_dobby_red_right.png`): those are bare-headed stone/bronze statues. Living Dobby = warm colours, hat, socks.
Match the pixel density and detail of `garden-v05/native-complete-objects/gardener_friend/frame-01.png` (Hagrid, 80×112,
ink 58×90): Dobby is the same style, just much smaller.

## Files (exact names/sizes), all in `garden-v05/elves/dobby/`, PNG, RGBA, binary alpha (0/255)

Six frames, each **64 × 64**, the same canvas for every frame. Feet on the ground at **row 58**, horizontally centred on
**x = 32** (pivot (32, 58)): the lowest opaque pixel of each frame is on row 58, nothing below it. Body ink **38–46 px tall**
(hat included), whole ink including props **≤ 56 px wide** and inside 1 px of transparent margin on every edge.
Facing: three-quarter view toward the **lower-left** (the code mirrors for walking right). Same size, same face in all six.

| file | pose |
|---|---|
| `idle.png` | standing, hands together, ears up, smiling |
| `walk-1.png` | walking step, left foot forward, ears bouncing |
| `walk-2.png` | walking step, right foot forward (pairs with walk-1 as a 2-frame walk loop; head at the same height ±1 px) |
| `sweep.png` | sweeping snow with a small twig broom held across the body, a puff of snow at the bristles |
| `water.png` | watering with a small tin watering can tipped forward, a few water drops (`#70A8B6`/`#B7DEE0`) |
| `carry.png` | carrying a wicker basket of vegetables (pumpkin, carrots) held up over his head with both hands, still feet on row 58 (basket may make the ink up to 56 px tall) |

Make several candidates with your image tool (one sheet with the six poses and clear gaps works well), pick the best that
reads at 1×, then cut, reduce to the palette and the exact canvas with nearest-neighbour (no smoothing, no dithering) and
align each frame's feet to (32, 58). Raw generations go in `garden-v05/elves/masters/`; prompts in
`garden-v05/elves/prompts.json`; source/output SHA-256 in `garden-v05/elves/provenance.json`.

Then `SHARP_MODULE=/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp node garden-v05/build-runtime-webp.mjs`
and `node garden-v05/build-runtime-webp.mjs --check`.

Write `docs/codex-briefs/elves-dobby-pilot-preview.png`: the six frames at 1× and 4× on a plain grass `#71934B` background,
plus Dobby `idle.png` standing next to Hagrid `gardener_friend/frame-01.png` at 1× and 4× (feet on the same line) for scale.

Hard rules: no commit/push/deploy; do not edit `.mjs`, CSS, `functions/` or HPVNN (if the WebP builder rewrites the revision
in `runtime-image-url.mjs`, leave that change in place and say so); if image generation or usage is unavailable, stop and
say so — never fake the art with code. Report in `docs/codex-briefs/elves-dobby-pilot-report.md`.
