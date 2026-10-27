# Codex brief — grid-fit redraw batches (after pilot 01)

The owner approved pilot 01 (`grid-fit-pilot-01.md` and its report) and wants the remaining **nặng** misfits redrawn the
same way, batch by batch. The launch prompt names this batch's ids. Work only on those ids. Claude Code (Anthropic)
verifies, commits and imports after you finish.

Read `grid-fit-pilot-01.md` first: its rules, per-item steps and hard rules all still apply. This file only adds what the
pilot taught. To save usage, keep exploration short. The pilot report already explains the pipelines.

## Targets

The target for each id is in `docs/grid-fit-audit.json` → `rows[]` (match `id`, both facings): `footprint`, `anchor`,
`target.canvas`, `target.pivot`, `target.ink` (max ink box), `fix` and `issues`. Do not change any footprint.

- `vẽ nhỏ lại` / `vẽ lại chân đế` / `hạ chiều cao`: new master with `image_gen`, as in the pilot.
- `căn lại tâm`: the art is fine. Re-export it centred on pivotX inside the target canvas. **No new master** unless the
  re-export cannot pass the audit.
- 1×N / N×M strips: the ground contact follows the strip (default view along the rows, alternate along the columns),
  like the pilot gate. If the bottom rows cannot fit the strip at the max width, export narrower (the pilot gate used
  84 px). Never go below 0.6 W.

## Pipelines (from the pilot)

- Special pack `garden-v05/special-products-assets`: `build-assets.mjs`, then `import-runtime.mjs`.
- Halloween pack `garden-v05/halloween-assets`: `build-assets.mjs`, then **`garden-v05/build-halloween-runtime.mjs`**
  (atlas records). Do **not** use `import-runtime.mjs … festival` for this pack: it writes per-frame records without
  the atlas. `build-halloween-runtime.mjs` keeps five legacy items byte-for-byte (`originalIds`; `hw_pumpkin_stack` is
  one). If a batch id is in that list, make it import like the other 25 and keep the remaining legacy ones untouched.
- Flow items (runtime file `decor-assets/native/flow-<id>.png`): `garden-v05/build-decor-flow.mjs` and its sources
  (`flow-art-sources.json`). Same canvas/pivot rules.
- `hero-halloween` (festival hero, **centre** anchor, `world-v241/hero-halloween.png`, record in
  `garden-seasonal-world.mjs`): find its source/master. Fix only the canvas edge and width per its audit row.
- Then `node garden-v05/build-runtime-webp.mjs` (and `--check`).

### Per-item ink cap

The pilot added per-id maps in both pack builders (`gridFit`). Move them into the pack `specs.json` as an optional
`inkMax: [w, h]` per item: the builder reads `item.inkMax`, falls back to today's formula when it is missing, and uses
`pivotY = h − 16` when it is present. Do this once, in the first batch that touches each pack, and keep the three pilot
items' output byte-identical.

### Scope guard (the pilot's importer touched other items)

After importing, compare `garden-v05/decor-assets-manifest.json` with `HEAD`. Only this batch's ids may differ: restore
every other record exactly. Restore any other item's PNG/WebP bytes, and delete files newly created for items outside
the batch. Then refresh `unchangedEntryHashes` in `decor-flow-manifest.json` **only** for this batch's ids that appear
there (sha256 of `JSON.stringify(record)`, see `decor-flow.test.mjs`).

## Verify, then report

1. `node garden-v05/audit-grid-fit.mjs`: every batch id has no issues in either facing. The other ids' rows are unchanged.
2. `GARDEN_PROTOTYPE_DIR=$PWD/garden-v05 node --test garden-v05/*.test.mjs`: 0 failures.
3. Look at the native PNGs at 1× and 3×. Redo a master that reads badly at native size.
4. Skip browser scene checks (the browsers abort in your sandbox). Claude checks the scene.

Write `docs/codex-briefs/grid-fit-batch-<NN>-report.md`. Give a short table per item: master path, canvas, pivot, ink
per facing, audit result. Add notes on doubts. End your final message with the same table.

No git commit, push or deploy. Stop and say so if you hit a usage limit. Leave finished items in a consistent,
passing state rather than half-done ones.
