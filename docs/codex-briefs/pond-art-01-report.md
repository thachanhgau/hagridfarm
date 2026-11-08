# Pond art phase 1 — master delivery, 2026-11-08

10/10 requested master files drawn with the built-in ImageGen tool; four new 16×16 grids written. **9 good as design masters / 1 redo.** These are generation masters for Claude's reduction, not native sprites or runtime acceptance. No subject was refused.

| id | master path | size | candidate kept and why | verdict |
|---|---|---|---|---|
| pond-1 | `garden-v05/environment/pond/masters/pond-1.png` | 960×672 | A; three fish shadows, one lily pad, grey rock and cattail family | good |
| pond-2 | `garden-v05/environment/pond/masters/pond-2.png` | 1120×760 | A; more reeds, long ribbon weed, lily pads and two fish shadows | good |
| pond-3 | `garden-v05/environment/pond/masters/pond-3.png` | 1152×768 | C; strongest broad stepped dark centre and front-right four-plank/two-post jetty; A/B also retained | **redo** |
| pond-bed | `garden-v05/environment/pond/masters/pond-bed.png` | 1024×704 | A; long low wooden water/mud tray, four small shoots, no large crop | good |
| items-sheet (`fry_carp`, `fry_goldfish`, `goldfish`, `produce_grindylow`) | `garden-v05/masters-items/pond/items-sheet.png` | 1024×1024 | A; matching three-fry bags, brown/red ties, left-facing plump goldfish, dark weed bundle/two drips | good |
| grindylow-left-motion-v01 | `garden-v05/creature-motion-assets/masters/grindylow-left-motion-v01.png` | 1024×1024 | **B over A**; smooth compact humanoid body, two horns and readable long fingers; A adds a reptile-like dorsal frill | good |
| grindylow-right-motion-v01 | `garden-v05/creature-motion-assets/masters/grindylow-right-motion-v01.png` | 1024×1024 | A, generated from left B; separately drawn right-facing poses, top-left lighting requested | good |
| grindylow-growth-v01 | `garden-v05/creature-motion-assets/masters/grindylow-growth-v01.png` | 1024×512 | A; eight calm poses, left/right rows, adult design follows B | good |
| habitat_grindylow | `garden-v05/masters-complete-objects/habitat_grindylow.png` | 1024×1024 | A; simple empty stone nook/arch, blue pool and one weed strand | good |
| keepsake_grindylow | `garden-v05/masters-complete-objects/keepsake_grindylow.png` | 1024×1024 | B; removed A's unsolicited floating water drops; raised fingers, two-step grey plinth and gold inset | good |

## Remaining art limits

- **Pond-3 needs another drawing pass:** visible soft exterior halo and smooth water shading persist after a targeted edit and a fresh generation from the guide (three attempts total). It is delivered for comparison, not approved for reduction as-is. No code-painted substitute or alpha cleanup was used.
- The other images have genuine transparency and broad pixel shapes, but generated edges retain partial alpha and small colour variations. They are not binary-alpha, exact-palette native artwork. Palette reduction, pixel-grid reconstruction and native review remain Claude's assigned work.
- Pond shapes follow the guides visually, but exact polygon registration is **not certified**. After nearest-neighbour canvas sizing, alpha≥128 content x bounds are pond-1 `[22,938)`, pond-2 `[25,1094)`, pond-3 `[5,1148)`, bed `[9,1017)`. Upright reeds affect the overall top bounds; no ground-only pixel mask was fabricated. Keep exact footprint fit as a separate acceptance check, especially before approving the scenery masters.
- Motion sheets show all 16 requested phases in order. Fish in approach poses and the named care cues/drops are intentionally separate. Fingers, horns, grabbed fish and limbs are visually attached. Growth-stage scaling gives heights 65/100/135/170 master pixels (adult/newborn 2.62×); this is master placement, not native density verification.
- All poses were requested with top-left light; independent generation does not prove frame-to-frame palette or anatomy identity. Review those again during reduction.

## Verification and provenance

- Read `docs/art-bible.md` sections 1–4, `SPRITE_PALETTE`, and the named references. Viewed the three native item references at 8× nearest-neighbour.
- Opened all ten final masters after placement. Checked PNG dimensions and real alpha-zero pixels in each.
- Motion/growth: all occupied cell bounds (alpha≥128) end at local y=210. Motion content fits x=32…224 or narrower, leaving at least 64 px horizontal gap and over 70 px vertical gap between adjacent occupied bounds.
- Growth heights verified 65/100/135/170 in both rows. Item bases verified at local y=440; every occupied item bound has ≥48 px cell margin.
- `docs/codex-briefs/pond-art/pixel-icons-new.mjs` exports `NEW_ICONS` with `pond`, `net`, `rod`, `algae`; each has sixteen 16-character strings using existing `INK` keys only. Validated by importing this file alone; no runtime module was imported.
- `garden-v05/environment/pond/prompts.json` contains **14 entries**: ten selected masters plus four rejected candidates. Every entry has `id`, `master`, exact `prompt`, tool-written `generatedFile`, and `referenceFiles`; all source/delivery paths verified to exist.
- Rejected candidates live only under `docs/codex-briefs/pond-art/`. `generation-records.json` records placement sizes; `place-masters.py` only crops/places generated cell art and uses nearest-neighbour sizing, preserving source alpha. It does not paint artwork, quantize colours, export native frames or invoke an importer. Original tool files remain unchanged.
- No builders/importers, native exports, runtime tests, commits, pushes or deploys were run. No HPVNN or `functions/` changes were made.
- Concurrent changes appeared during this session in `garden-v05/build-creature-complete.mjs`, `creature-motion-data.js`, `flow-item-ui.mjs`, and new pond builder scripts. Those were not edited or executed by this art pass. Existing brief/log/guide files were preserved.

## Refusals

None. Image generation remained available throughout.
