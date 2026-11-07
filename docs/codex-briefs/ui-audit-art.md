# Codex brief — UI audit 07/11/2026: missing art (masters only)

Claude Code (Anthropic) imports, wires into code, tests and commits after you. **Your job: draw the masters below
and write the 16×16 icon grids. No game code edits, no importer runs, no git.**

Read first (keep exploration short): `docs/art-bible.md` (palette, outline #231F2E, binary alpha, big pixel
clusters), `garden-v05/palette.mjs` (SPRITE_PALETTE, the approved 24 colours), and look at the style references
named per row. Every native result must be readable at 1× and use only the 24 colours once exported.

## How to deliver
- Large art (§A–§D): one master PNG per id, drawn big (≥ 4× the native canvas, transparent background, generous
  margin, no text, no frame) in `garden-v05/masters-items/ui-audit/<id>.png`. You may draw sheets of up to 6 items
  per image and crop them apart; keep each crop centred with the base on the same row.
- Then make a native preview per id with nearest-neighbour downscale + palette snap (write a throwaway script under
  `docs/codex-briefs/ui-audit/` only; reuse the palette-snap logic of `garden-v05/build-item-art.mjs` by reading it, do
  NOT run that exporter): `docs/codex-briefs/ui-audit/native/<id>.png` at the native canvas size.
- Contact sheet: `docs/codex-briefs/ui-audit-preview.png`, every native at 3× nearest-neighbour on #D6D8BF with the id
  under each.
- 16×16 icons (§E): write them as grids in the same format as `garden-v05/pixel-icons.mjs` (one char per pixel, the
  `INK` keys there, `.` = transparent) into a NEW file `docs/codex-briefs/ui-audit/pixel-icons-new.mjs` exporting
  `export const NEW_ICONS = { id: [16 strings of 16 chars], … }`. Match the weight and outline of the existing
  `chest`, `owl`, `heart`, `xp`, `profile` grids. Also render them into the contact sheet at 3×.

## A. Status bubbles (scene canvas) — native canvas given; style ref: pixel icon `feed`, `heart`, Hagrid's speech bubble in `garden-v05/environment/`
| id | native | must read as |
| --- | --- | --- |
| `bubble_meal_ready` | 28×36 | cream speech bubble, tail bottom-left, a steaming bowl inside |
| `bubble_hungry` | 28×36 | same bubble shape, a bold red "!" inside |
| `bubble_heart_small` | 9×8 | tiny pink heart (affinity count marker), dark outline |

## B. Progress & chapters — native 64×64, ink ≤ 52×48, base on row 56; style ref `garden-v05/native-items/reward_medal.png`, `reward_trophy.png`, `expansion_plot.png`
| id | must read as |
| --- | --- |
| `tan_suc` | "Bậc Tận Sức" (post-level-100 mastery rank): a golden star-shaped badge on a small green-and-gold ribbon, distinct from the medal and trophy |
| `chapter_1` | Hagrid's stone hut with a smoking chimney and a small pumpkin patch |
| `chapter_2` | a small glass greenhouse with plants inside |
| `chapter_3` | a forest edge: a big oak with a lantern |
| `chapter_4` | a garden pond with reeds and a stepping stone |
| `chapter_5` | a creature pen: low wooden fence with a puffskein inside |
| `chapter_6` | a hippogriff paddock: fence corner and a hippogriff silhouette |
| `chapter_7` | "Cánh đồng Tận Sức": a wide field of six tidy crop plots south of a fence, golden light |

## C. Achievement badges — native 64×64, ink ≤ 40×40, base on row 56; style ref `reward_medal.png` (same coin/badge family, each with its own emblem)
| id | emblem |
| --- | --- |
| `ach_sprout_apprentice` | a sprouting seedling |
| `ach_creature_friend` | a paw print |
| `ach_herbology_artisan` | a trowel crossed with a leaf |
| `ach_master_brewer` | a small bubbling cauldron |
| `ach_forest_architect` | a tiny wooden gazebo |
| `ach_landscape_artist` | a garden arch with vines |
| `ach_keepsake_curator` | an open keepsake box |
| `ach_hippogriff_rider` | a hippogriff head in profile |
| `ach_unicorn_guardian` | a white unicorn head |
| `ach_dragon_tamer` | a dragon egg with flames |
| `ach_forest_envoy` | a lantern on a forest path |
| `ach_grand_keeper` | Hagrid's big key ring |

## D. Redraws and one shared item
| id | native | style ref | must read as |
| --- | --- | --- | --- |
| `seed_packet` | 64×64, ink ≤ 48×56 | `native-items/supply_water.png` | an empty paper seed packet (no text, no crop drawn; the game places the crop sprite on it) |
| `hero_yule` | 128×183 (same pivot as `garden-v05/world-v241/hero-yule.png`) | `decor-assets/native/decor_vine_arch.png` | redraw of the current Yule festival gate in proper pixel art (open the current file to copy composition) |
| `hero_halloween` | 128×80 (as `world-v241/hero-halloween.png`) | `halloween-assets/native/*` | redraw of the Halloween gate |
| `hero_herbology` | 136×158 (as `world-v241/hero-herbology.png`) | `decor_vine_arch.png` | redraw of the Herbology festival gate |
| `cottage_corner` | 150×75 (as `world-v242/cottage-corner.png`) | `environment/layers/hut.png` | redraw of the cottage corner piece |
| `event_quidditch` | 640×360 (as `v24-art/event-quidditch.webp`) | `v24-art/event-yule.webp`, `event-halloween.webp`, `event-herbology.webp` | Quidditch festival card in the same painterly style as its three siblings, no text. This one is NOT palette-snapped; deliver it as `docs/codex-briefs/ui-audit/native/event_quidditch.png` at 640×360 |

The four §D redraws must keep the current canvas size and foot position exactly; palette24 and binary alpha.

## E. 16×16 icon grids (into `pixel-icons-new.mjs`)
`tansuc` (small star badge), `work` (Hagrid's wicker basket), `acp` (Ministry seal on a ledger), `seal` (a round wax
seal, replaces a ✦ glyph), `star`, `star_empty`, `heart_empty`, `guest_hagrid` (big bearded face), `guest_sprout`
(witch with a patched hat), `guest_newt` (man with a battered case), `guest_charlie` (red-haired with a dragon-hide
glove). The four `guest_*` are tiny portrait seals; name the characters in your image prompts if you use images.

## Rules
- Only the files and folders named above. No edits to existing files. No git commit, push or deploy.
- If image generation refuses a subject, stop that item and list it; do not rename or describe around it.
- If you hit a usage limit, stop and say so.
- End with a table: id, master path, native path, native ink box, your verdict (good / redo).
