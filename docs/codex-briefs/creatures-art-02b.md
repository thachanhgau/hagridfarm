# Codex brief — phase 2 redo: two item icons (08/11/2026)

You are Codex in the Hagrid Farm repo. **You only draw masters.** Same rules, style and delivery as
`docs/codex-briefs/creatures-art-02.md` (read its sections C and Delivery) and its report
`docs/codex-briefs/creatures-art-02-report.md`. Keep exploration short.

Claude reduced `garden-v05/masters-items/creatures-2/items-sheet.png` (1536×1024, 3×2 cells of 512) to 64×64 icons
(object ≤ 40×40 px). Four cells are good. Two fail at native size:

| cell | id | problem at 40 px | redraw as |
|---|---|---|---|
| row 1, col 1 | `produce_crup` | the white fur has no dark outline on its left and top, so it dissolves into light backgrounds; reads as a cloud | **one plump tuft of terrier fur**: a compact teardrop/flame-shaped tuft, white with **two big tan-brown patches**, a **thick continuous `#231F2E` outline all the way round**, tied at the bottom with a thick red ribbon bow. Few big shapes, no wispy hairs |
| row 2, col 3 | `salamander_feed` | the chilli is tiny and brown-red, lost among the twigs | a **short bundle of 4–5 thick dry twigs** (grey-brown) tied with twine, with **one big bright red chilli** (`#C75B4B` body, `#8B4A3F` shade, green stalk `#71934B`) lying **across the front of the bundle**, the chilli about half the icon's width and clearly the brightest thing |

Draw each as one big readable object with a thick outline, flat colours, light from the top-left, transparent
background, no halo (the report notes A–D had soft exterior halos: avoid that).

Deliver `garden-v05/masters-items/creatures-2/items-sheet-v2.png`: **1536×1024, same 3×2 layout**, with the four
good cells copied **pixel-for-pixel unchanged** from `items-sheet.png` and the two cells above replaced (base at
y ≈ 440 of the cell, ≥ 48 px margin). You may compose it with a small crop/place script under
`docs/codex-briefs/creatures-art-2/` (nearest-neighbour only, no painting). Do not modify `items-sheet.png`.
Append the new prompts to `docs/codex-briefs/creatures-art-2/prompts.json` (master = the v2 sheet, with
`generatedFiles` for the two new sources). Make two candidates per item, keep the better one.

Hard rules as before: no git, no builders, no other file edits, no HPVNN/`functions/`. On a refusal, stop and
report it. Report in `docs/codex-briefs/creatures-art-02b-report.md` (candidate kept and why, verdict).
