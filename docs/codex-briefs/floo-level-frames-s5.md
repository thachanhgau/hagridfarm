# Codex brief — Hagrid Farm 25.0 S5: Floo level frames, one per 10 levels (04/11/2026)

You are Codex in the Hagrid Farm repo. You only draw masters; Claude Code cuts and shrinks them itself.
Follow `docs/art-bible.md` (palette, light from the top-left, `#231F2E` outline, no pure black or white).

## What they are for

Members of HPVN earn a Floo chat frame every 10 garden levels (10 … 500). The chat bubble shows a small pixel
**corner ornament** at its top-left corner (and the same ornament turned 180° at the bottom-right), a gold **star**
repeated once per 50 levels, and at level 500 a **badge**. Each band of 50 levels has its own ornament, growing richer
from band 1 to band 10. The ornament sits on a dark bubble (`#142620`–`#24202E`), so it must read on dark.

## Style rules (so the shrink stays clean)

- True pixel art on **one square grid of exactly 16 × 16 px blocks** (every block one flat colour, edges on multiples of
  16 from the cell's top-left). No anti-aliasing, gradients, blur, glow, drop shadow or sub-block noise. Transparent
  background.
- Colours only from the 24 sprite colours in `garden-v05/palette.mjs`, ≤ 6 per item, 1-block `#231F2E` outline.
- **Corner ornament:** fits a 22 × 22 block square in the cell's top-left area: an L-shaped flourish hugging the top edge
  and the left edge (arms 18–22 blocks long, 2–4 blocks thick) with the motif sitting in the corner; the inside of the L
  stays empty (the message text goes there). No letters or numbers.
- **Star:** 9 × 9 blocks, five points, `#FFC36B`/`#F5D69A` with `#A57554`/`#4A3042` shade.
- **Badge 500:** 24 × 24 blocks, a round crest; no letters or numbers.

## Sheets

Both 1536 × 1024 PNG, a 3 × 2 grid of 512 × 512 cells, item placed with its top-left at (64, 64) of the cell, ≥ 24 px
empty margin elsewhere. Order: row 1 left → right, then row 2.

`garden-v05/environment/floo-frames/masters/level-frames-a.png`
1. band 1 (levels 10–50): green seedling sprouts on a twine of `#71934B`/`#B0BD67`.
2. band 2 (60–100): a pumpkin vine with one small pumpkin `#ED8A45`.
3. band 3 (110–150): Mandrake leaves (Nhân sâm) — tufted `#3F6A45` leaves, a tiny root face peeking.
4. band 4 (160–200): a Puffskein-fur rope with a brown owl feather `#A57554`.
5. band 5 (210–250): a silver-grey Hippogriff feather (Bằng-Mã) `#A6B1AE`/`#D6D8BF` on stone `#687486`.
6. band 6 (260–300): a moonlit vine with a pale Mooncalf crescent `#B7DEE0`/`#70A8B6`.

`garden-v05/environment/floo-frames/masters/level-frames-b.png`
1. band 7 (310–350): violet magic ivy `#6961A6`/`#3E3B70` with two sparks `#B7DEE0`.
2. band 8 (360–400): dragon scales in ember `#C75B4B`/`#874056` with a gold rim `#FFC36B`.
3. band 9 (410–450): wand-wood twigs (Bowtruckle home) `#735044` with gold leaves `#E7AE73`.
4. band 10 (460–500): a golden oak wreath `#FFC36B`/`#E7AE73` with Hagrid's lantern glowing `#F5D69A`.
5. the star.
6. the level-500 badge: a gold wreath ring around Hagrid's hut with a pumpkin, on `#24483F`.

Make two candidates of each sheet with your image tool and keep the better (cleanest 16 px grid, readable on dark).
Append the prompts to `garden-v05/environment/floo-frames/prompts.json` (create it as a JSON array).
Do not resize, write native frames or previews, or run builders.

Hard rules: no commit/push/deploy; do not edit `.mjs`, CSS, `functions/` or HPVNN; if image generation or usage is
unavailable, stop and say so — never fake art with code. Report in `docs/codex-briefs/floo-level-frames-s5-report.md`.
