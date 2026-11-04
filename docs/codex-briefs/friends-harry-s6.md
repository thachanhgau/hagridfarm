# Codex brief — Hagrid Farm 25.0 S6: Harry visits the garden (pilot sheet, 04/11/2026)

You are Codex in the Hagrid Farm repo. You only draw masters; Claude Code resizes them into game sprites itself.
Follow `docs/art-bible.md`. Match the look and quality of the approved house-elf masters
(`garden-v05/environment/elves/masters/v3-dobby.png`, `v3-winky.png`) — same pixel style, same light, same outline —
and stand beside Hagrid (`garden-v05/native-complete-objects/gardener_friend/frame-01.png`).

This is the **pilot**: the owner approves Harry's look before Ron, Hermione, Neville, Luna, Ginny, Fred and George are drawn.

## Character (book version, HP1–HP3 — never the film)

**Harry Potter**, about 12, a cute **chibi** (big head ≈ 40 % of the height, small body): thin, knobbly knees,
**untidy jet-black hair** sticking up at the back, **round glasses**, bright **green** eyes with a white highlight,
a thin **lightning-bolt scar** on the forehead (2–3 blocks, `#C75B4B`), friendly grin.
Winter clothes: Mrs Weasley's hand-knitted **emerald-green wool sweater** (plain, no letter), a scarlet-and-gold striped
Gryffindor scarf, dark trousers, brown boots.

**He must not look like any film actor.** Stylised chibi face: simple shapes, no realistic nose or jaw, no actor likeness,
no film costume (no film-style robes or film glasses frames). If a candidate reads like a film still, redraw it.

Props: his broom (the **Nimbus Two Thousand**: dark polished wooden handle, neat bundle of twigs at the tail, no lettering),
the **Quaffle** (a bright red leather ball, `#C75B4B`/`#874056`, about the size of his head), a snowball (`#E8F0ED`-ish white
from the sprite palette: use `#D6D8BF` + `#B7DEE0` shading).

## Style rules (so the resize stays clean)

- True pixel art on **one square grid of exactly 6 × 6 px blocks** (every block one flat colour, edges on multiples of 6 from
  the cell's top-left). No anti-aliasing, gradients, blur, glow, drop shadow or sub-block noise. Transparent background,
  hard alpha.
- Harry about **64–68 blocks tall** standing (hair top to feet) — a little taller than Dobby. 1-block dark outline
  (`#231F2E`), light from the top-left. Colours only from the 24 sprite colours in `garden-v05/palette.mjs`, ≤ 16 on the sheet.

## Sheet

`garden-v05/environment/friends/masters/harry.png`: 1536 × 1024 PNG, a 3 × 2 grid of 512 × 512 cells, one pose per cell in
this order (row 1 left→right, then row 2); feet (or the broom's lowest point) at y ≈ 470, body centred on x = 256,
≥ 24 px empty margin. Three-quarter view toward the lower-left.

1. `idle` — standing, waving one hand, smiling.
2. `walk-1` — walking, left foot clearly forward.
3. `walk-2` — walking, right foot clearly forward (legs visibly different from walk-1, head at the same height).
4. `fly-throw` — sitting astride the broom (broom roughly horizontal, twigs to the right), arm back about to throw the Quaffle.
5. `fly-catch` — same broom position, both hands forward catching the Quaffle.
6. `snowball` — standing, throwing a snowball overarm, scarf flying.

Make two candidates with your image tool and keep the better (closest to the book, most charming, closest to the 6 px grid).
Save both as `harry-candidate-a.png` / `harry-candidate-b.png` beside the chosen file. Append the prompt to
`garden-v05/environment/friends/prompts.json` (create it as `{"entries": []}` if missing). Do not resize, write native frames
or previews, or run builders.

Hard rules: no commit/push/deploy; do not edit `.mjs`, CSS, `functions/` or HPVNN; if image generation or usage is
unavailable, stop and say so — never fake art with code. Report in `docs/codex-briefs/friends-harry-s6-report.md`.
