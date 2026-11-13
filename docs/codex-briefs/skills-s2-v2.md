# Codex brief — Season 2 skill icons, round 2 (13/11/2026)

You are Codex in the Hagrid Farm repo. **You only draw masters.** Claude Code (Anthropic) reduces them to 64×64 native
icons (nearest-neighbour, alpha threshold 192, game palette), builds the atlas, tests and commits after you.

Round 1 (`docs/codex-briefs/skills-s2.md`, your report `docs/codex-briefs/skills-s2-report.md`) rated all 18 «redo»:
creatures did not look like the game's own sprites, and small props (sprouts, notes, drops, dotted paths, seeds)
vanished at 40 px. The owner asked for a redraw. Read the round-1 brief for style, palette and the skill of each icon;
this brief only changes **how** to draw.

## What changes

1. **One image generation per icon** (18 generations, one cell each), not one per sheet. Before each, build a
   reference image for that species: its game sprite enlarged 8× nearest-neighbour (paths in the round-1 table; for the
   three-headed dog use any frame that exists in `garden-v05/creature-motion-assets/native/three-headed-dog/`), and
   **pass it to the image tool as the reference**. Ask for the same creature: same body shape, proportions, face,
   colours and outline as the reference, just larger and in the skill's pose.
2. **Likeness first.** If the reference and a written detail disagree, follow the reference (round 1: the
   three-headed dog is cream in the game, not brown; the salamander is a salamander, no horns or wings; the porlock is
   the game's shaggy pony-like creature, not a goblin or cat face; the Kneazle has the game's slender face and strong
   ear tufts; the hippogriff has the game's head).
3. **At most one prop, big and touching the creature** (at least a quarter of the subject's size). Drop everything
   else:
   | id | keep only |
   |---|---|
   | puffskein | pink tongue curled round one big seed |
   | bowtruckle | big garden shears in its hands |
   | niffler | brown soil mound it digs from + one big blue water drop |
   | mooncalf | big pale crescent moon behind its head |
   | kneazle | round magnifying lens in front of one green eye |
   | diricawl | one side dissolving into big feather pixels, a big carrot in its beak |
   | fwooper | beak open, one big music note |
   | hippogriff | wing wrapped round a wooden bucket of blue water |
   | thestral | a big lantern hanging from its mouth |
   | unicorn | spiral horn + one big red heart |
   | three-headed-dog | three alert heads + a big crescent moon behind |
   | dragon | short hard-edged flame onto one dry weed tuft |
   | grindylow | long fingers holding a net with one big orange carp (tiny gold crown allowed) |
   | crup | forked tail, the ma lùm (`environment/duty/masters/ma-lum.png`) running just ahead, touching distance |
   | knarl | spiky ball on big brown soil furrows under it |
   | salamander | curled round a flame, one big snowflake touching its tail |
   | kappa | bowing, a thick water stream from its head dish |
   | porlock | wooden shepherd's crook held upright |
4. **Hard edges, solid colour.** No soft glow, smoke or semi-transparent spill around flames, water or feathers:
   anything fainter than ~75 % opacity is cut by Claude's threshold and leaves holes. Light from the top-left, dark
   outline `#231F2E`, transparent background.
5. Subject fills the cell: about 420×420 of 512, creature large, compact silhouette that reads at 40 px.

## Delivery

- Place the 18 cells, in the round-1 order, on three sheets in **`garden-v05/masters-items/skills-s2-v2/`**:
  `skills-sheet-{1,2,3}.png`, each 1536×1024, 3 columns × 2 rows of 512×512 cells, ≥ 40 px empty margin, crop/place
  with nearest-neighbour only (a small script under `docs/codex-briefs/skills-s2-v2/` is fine).
- Check every cell at 40 px (512 → 64 → 40, nearest) on a dark background before placing. Regenerate a cell **at most
  once** if it fails likeness or its prop is unreadable; keep the better one. Rejected images go to
  `docs/codex-briefs/skills-s2-v2/`.
- Record prompts in `docs/codex-briefs/skills-s2-v2/prompts.json` (`{"items": []}`, one entry per icon: `id`,
  `prompt`, `generatedFile`, `referenceFiles`).
- Hard rules: no git commit/push/deploy; do not edit existing files; do not run any builder or importer; do not touch
  HPVNN or `functions/`. If image generation refuses a subject, stop that item, list the refusal text, never rename or
  describe around it. If image generation or usage is unavailable, stop and say so: never fake art with code.
- Report in `docs/codex-briefs/skills-s2-v2-report.md`: id, cell, regenerated or not, verdict (good / redo) and why.
