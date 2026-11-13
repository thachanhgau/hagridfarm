# Codex brief — Hagrid Floo frame badges and Tận Sức gems (13/11/2026)

You are Codex in the Hagrid Farm repo. You only draw masters; Claude Code cuts and shrinks them itself
(`garden-v05/build-floo-frame-art.mjs`). Follow `docs/art-bible.md` (palette, light from the top-left,
`#231F2E` outline, no pure black or white).

## What they are for

Members of HPVN wear garden frames on their Floo chat bubbles. Each frame pins **one small badge on the top edge of
the bubble** (shown about 20 × 20 px), and the ten «Tận Sức» level frames show a row of **gems** above the bubble (one
gem per thousand levels, shown 11 × 11 px, like the existing gold level star). The owner found the old hand-drawn
vector icons ugly: these must be real, charming pixel-art icons in the same family as the existing band corners and
star in `garden-v05/environment/floo-frames/masters/level-frames-*.png`. They sit on dark bubbles (`#142620`,
`#24202E`, deep red, deep blue), so they must read on dark: strong silhouette, clear outline, light top-left.

## Style rules (so the shrink stays clean)

- True pixel art on **one square grid of 16 × 16 px blocks** (every block one flat colour). No anti-aliasing,
  gradients, blur, glow, drop shadow or sub-block noise. Transparent background.
- Colours only from the 24 sprite colours in `garden-v05/palette.mjs`, ≤ 6 per item, 1-block `#231F2E` outline.
- **Badge:** fits a **20 × 20 block** square, centred, bold and simple (it ends up 20 px). No letters or numbers.
- **Gem:** fits **9 × 9 blocks**, a faceted cut stone seen from the front (diamond or round brilliant), one bright
  facet top-left, `#231F2E` outline. No letters or numbers.

## Sheets

All 1536 × 1024 PNG, a 3 × 2 grid of 512 × 512 cells, the item centred in its cell, ≥ 48 px empty margin to the cell
edge. Order: row 1 left → right, then row 2.

`garden-v05/environment/floo-frames/masters/frame-badges-a.png`
1. «Tập sự» (crop mastery 1): a tiny green seedling, two round leaves `#71934B`/`#B0BD67` on a short stem, from a little
   mound of soil `#8B4A3F`/`#C97952`.
2. «Thạo nghề» (mastery 2): a three-leaf sprig in silvery mint `#A6B1AE`/`#D6D8BF`/`#B7DEE0`, tied with a twine bow `#A57554`.
3. «Bậc thầy» (mastery 3): a golden sprig of three gold leaves `#FFC36B`/`#E7AE73` with one red berry `#C75B4B`.
4. «Đại sư» (mastery 4): a golden laurel wreath (open at the top) `#FFC36B`/`#E7AE73` with green tips `#71934B`, a gold
   five-point star `#F5D69A` in its middle.
5. «Thợ vườn Tận Sức»: a ripe round pumpkin `#ED8A45`/`#C97952` with a curly green vine and one leaf, a small garden trowel
   `#A6B1AE` leaning on it.
6. «Pháo hoa 2027»: a firework burst, eight rays of pink `#C75B4B`, gold `#FFC36B` and pale blue `#B7DEE0` around a bright
   gold core, a few sparks.

`garden-v05/environment/floo-frames/masters/frame-badges-b.png` — the same House Cup design in each cell: a gold
two-handled trophy `#FFC36B`/`#E7AE73`/`#A57554`, with the house colour as an enamel band on the bowl and the foot.
1. Gryffindor: band and foot `#C75B4B`/`#874056`.
2. Hufflepuff: band and foot `#231F2E`/`#41465C` (black), the gold brighter `#F5D69A`.
3. Ravenclaw: band and foot `#6961A6`/`#3E3B70`, bronze handles `#A57554`.
4. Slytherin: band and foot `#3F6A45`/`#24483F`, silver handles `#A6B1AE`/`#D6D8BF`.
5. «Cúp Tận Sức»: the grandest cup, all gold, a star on the bowl `#F5D69A`, two small leaves at the foot `#71934B`.
6. leave empty.

`garden-v05/environment/floo-frames/masters/tan-suc-gems-a.png` — the same gem cut in each cell, one stone per tier:
1. bronze `#A57554`/`#E7AE73`/`#735044`
2. silver `#A6B1AE`/`#D6D8BF`/`#687486`
3. gold `#FFC36B`/`#F5D69A`/`#E7AE73`
4. emerald `#71934B`/`#B0BD67`/`#3F6A45`
5. sapphire-ice `#70A8B6`/`#B7DEE0`/`#41465C`
6. amethyst `#6961A6`/`#B7DEE0`/`#3E3B70`

`garden-v05/environment/floo-frames/masters/tan-suc-gems-b.png`
1. ruby `#C75B4B`/`#ED8A45`/`#874056`
2. pearl: a round pearl, `#D6D8BF` with a `#B7DEE0` sheen and `#A6B1AE` shade
3. aurora: facets in three colours `#B7DEE0`, `#B0BD67`, `#6961A6`
4. sun: the grandest stone, gold `#FFC36B`/`#F5D69A` with an orange heart `#ED8A45` and four tiny rays
5. leave empty. 6. leave empty.

Make one candidate of each sheet with your image tool; if a candidate is clearly off-brief (wrong count, blurry,
anti-aliased, soft halo), make one more and keep the better. Append the prompts to
`garden-v05/environment/floo-frames/prompts.json` (keep the existing entries).
Do not resize, write native frames or previews, or run builders.

Hard rules: no commit/push/deploy; do not edit `.mjs`, CSS, `functions/` or HPVNN; if image generation or usage is
unavailable, stop and say so — never fake art with code. Report in `docs/codex-briefs/floo-frame-badges-s2-report.md`.
