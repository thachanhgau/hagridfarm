# Creatures art phase 2 — master delivery, 2026-11-08

**16/16 requested masters delivered with built-in ImageGen; 3/3 new 16×16 grids delivered. Verdict: 16 good as design masters.** Native reconstruction, palette reduction, registration and runtime acceptance remain Claude Code's work. No subject was refused.

| id | master path | size | candidate kept and why | verdict |
|---|---|---|---|---|
| crup-left-motion-v01 | `garden-v05/creature-motion-assets/masters/crup-left-motion-v01.png` | 1024×1024 | **B over A**: left-facing jump, conspicuous two-prong tail and no floating shake marks; A's jump looks right | good |
| crup-right-motion-v01 | `garden-v05/creature-motion-assets/masters/crup-right-motion-v01.png` | 1024×1024 | A, independently generated from left B; right-facing terrier and fork silhouette retained | good |
| crup-growth-v01 | `garden-v05/creature-motion-assets/masters/crup-growth-v01.png` | 1024×512 | A; fork present from puppy onward, four clear stages in both directions | good |
| knarl-left-motion-v01 | `garden-v05/creature-motion-assets/masters/knarl-left-motion-v01.png` | 1024×1024 | **B over A**: complete small seed hand inside frame, larger quill clusters and tighter curled ball; A clips a care hand | good |
| knarl-right-motion-v01 | `garden-v05/creature-motion-assets/masters/knarl-right-motion-v01.png` | 1024×1024 | A from left B; round ball action, pale quill tips, suspicious expression and happy hand-feeding | good |
| knarl-growth-v01 | `garden-v05/creature-motion-assets/masters/knarl-growth-v01.png` | 1024×512 | A; shorter rounder hoglet quills grow into adult pale-tipped spikes | good |
| salamander-left-motion-v01 | `garden-v05/creature-motion-assets/masters/salamander-left-motion-v01.png` | 1024×1024 | **B over A**: lower, slimmer lizard and connected mouth flame; A is taller and its flame appears detached | good |
| salamander-right-motion-v01 | `garden-v05/creature-motion-assets/masters/salamander-right-motion-v01.png` | 1024×1024 | A from left B; right-facing rearing action, yellow eyes, attached flames and long curled tail | good |
| salamander-growth-v01 | `garden-v05/creature-motion-assets/masters/salamander-growth-v01.png` | 1024×512 | A; one small hatchling flame, four stages and low adult lizard silhouette | good |
| habitat_crup | `garden-v05/masters-complete-objects/habitat_crup.png` | 1024×1024 | A; simple plank kennel, dark roof, round doorway and adjoining bowl | good |
| habitat_knarl | `garden-v05/masters-complete-objects/habitat_knarl.png` | 1024×1024 | A; broad leaf blocks, short mossy log and large dark end hollow | good |
| habitat_salamander | `garden-v05/masters-complete-objects/habitat_salamander.png` | 1024×1024 | A; grey stone ring, flat ember blocks, two crossed sticks and one tiny flame | good |
| keepsake_crup | `garden-v05/masters-complete-objects/keepsake_crup.png` | 1024×1024 | A; sitting terrier with clear fork, matching two-step grey plinth and blank gold inset | good |
| keepsake_knarl | `garden-v05/masters-complete-objects/keepsake_knarl.png` | 1024×1024 | A; frowning quill ball and protruding snout on the same plinth family | good |
| keepsake_salamander | `garden-v05/masters-complete-objects/keepsake_salamander.png` | 1024×1024 | A; orange lizard, curled tail, one flame and matching plinth/inset | good |
| items-sheet | `garden-v05/masters-items/creatures-2/items-sheet.png` | 1536×1024 | **E**, assembled from six separately generated cutouts; A–D all retain an exterior soft halo. Quill component B corrects A's four tips to exactly five | good |

## Checks and provenance

- Read art-bible sections 1–4, `SPRITE_PALETTE`, the phase-1 report and all named creature, habitat, keepsake and native item references. Inspected native item references at 8× nearest-neighbour.
- All final masters were visually inspected after placement. `creatures-art-2/verify-masters.py` passes: 16 PNG sizes, real alpha-zero pixels, occupied cell bounds and provenance paths. `verification.json` records bounds, alpha counts and SHA-256 hashes.
- Six motion sheets contain sixteen poses each; three growth sheets contain eight each. Left/right sheets were generated separately with upper-left lighting requested, without programmatic mirroring.
- At alpha ≥128, every occupied motion/growth cell ends at local y=210. Horizontal cell margins are ≥32 px, giving ≥64 px between adjacent occupied bounds; vertical gaps are ≥32 px. These are visible-content bounds, not certification that faint alpha residue is absent.
- Growth heights in each facing row: Crup **57/88/118/150**, Knarl **51/80/107/135**, Salamander **42/65/87/104** master pixels. Adult/newborn height ratios are 2.63×, 2.65× and 2.48×.
- Item cells have their occupied base at local y=440 and ≥48 px empty margin on all four sides. Row-major order: `produce_crup`, `produce_knarl`, `produce_salamander`, `crup_feed`, `knarl_feed`, `salamander_feed`.
- Three keepsakes each have one large connected alpha≥128 component; the Crup's fork is connected to its statuette.
- `creatures-art-2/pixel-icons-new.mjs` exports `NEW_ICONS` with `paw`, `hand_feed`, `campfire`. Imported this new file alone and checked sixteen 16-character rows per icon against the existing `INK` keys. Passed; no runtime module was imported.
- `creatures-art-2/prompts.json` contains **30 provenance entries**: 16 final-master records, 7 rejected sheet candidates, 6 selected item component sources and 1 rejected four-quill component. There were **29 ImageGen calls**; the final item sheet is a crop/place composition of six tool-generated sources, not an additional drawing call. Its `generatedFile` names the first source, `generatedFiles` lists all six tool paths, and `componentSources` points to the six preserved workspace copies. All exact generation prompts are retained.
- Rejected candidates and selected item source cutouts are preserved only under `creatures-art-2/`. `place-masters.py` only crops, places and sizes generated artwork with nearest-neighbour; it does not paint, clean alpha, quantize or export native frames. Original tool outputs remain unchanged.
- Source growth sheets have uneven horizontal spacing. Placement now locates the largest alpha gutters instead of assuming equal source cells; this repaired an initially split Salamander growth placement. Final canvases still have exact 256×256 cells.

## Limits for Claude's reduction

- These are **generation/design masters**, not exact-palette native sprites. Partial alpha, small colour variations and soft shading within some materials remain. Reconstruct the actual pixel grid, flatten material shades and reduce to the 24-colour palette in the assigned native pass.
- The selected item assembly removes the broad exterior halos seen in A–D. The jar/cork/ash, biscuit and twine still contain more internal detail than their 40×40 target needs; simplify those details during native reconstruction.
- Frame anatomy, precise adult size across independently generated sheets, care blink timing, food-to-mouth contact and upper-left lighting need another check at native size. In particular, several care "blink" drawings hold closed eyes, and floor food in the bend poses is very close to the mouth; do not treat master inspection as proof of a clean native animation loop.
- Baselines are aligned to occupied artwork, including food/care cues. Jump/rearing artwork is placed at the same cell baseline; native animation pivots and airborne motion remain a separate registration decision.
- No builders/importers, native exports, runtime tests, commits, pushes or deploys were run. No HPVNN or `functions/` changes were made.
- During this art pass, concurrent modifications appeared in `garden-v05/build-pond-art.mjs` and `garden-v05/flow-item-ui.mjs`. Those existing files were neither edited nor executed here. The pre-existing phase-2 brief and log were preserved.

## Refusals

None. Image generation remained available throughout.
