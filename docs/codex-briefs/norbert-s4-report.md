# Norbert S4 master report — 2026-11-04

Generated 2/2 candidates using the built-in `image_gen.imagegen` tool with true transparency requested and `v3-dobby.png` supplied as a style reference. Selected candidate A, copied byte-for-byte to `garden-v05/environment/elves/masters/v4-norbert.png`. This is a visual master selection; **the brief's strict technical requirements are not satisfied**.

## Selection

A has the sweeter upward-looking expression, a clearer wool-ball pounce, more compact upright proportions, and fewer nonuniform cell-local 6 px blocks than B. B has simpler dark wing shapes, but is taller, has more nonuniform blocks and its play/puff alpha-threshold bounds reach cell edges. Both show the requested six poses in row-major order, orange eyes, a long muzzle, horn buds, dorsal ridges and a spade tail. The walks visibly differ, and the puff contains two orange sparks.

Visual limitations: A's wings read partly opened rather than tightly folded like a wet umbrella; its sleep tail does not clearly wrap around the snout. Walk head heights differ by about 1 px. The outline/light resemble the reference visually, but there is halo-like shading and sub-block detail. These are not approved production sprites.

## Read-only verification

Decoded original PNG bytes with Python standard-library `struct`/`zlib`; no image edits or generated code artwork. Tested exact palette membership, alpha, and uniform RGBA in every cell-local 6×6 block, including the final 2 px edge strips of each 512 px cell. Hidden RGB is ignored where alpha is zero. All prior prompt entries were checked for preservation.

| Check | A — selected | B |
|---|---:|---:|
| PNG dimensions | 1536 × 1024 | 1536 × 1024 |
| Visible RGB colours (maximum 14 required) | 32,597 | 30,016 |
| Visible pixels outside sprite palette | 414,845 | 500,125 |
| Fully transparent pixels | 1,158,002 | 1,072,739 |
| Partially transparent pixels | 414,862 | 500,125 |
| Fully opaque pixels | 0 | 0 |
| Nonuniform 6 px blocks / all blocks | 15,089 / 44,376 | 18,002 / 44,376 |

All occupied blocks in both candidates are nonuniform. The alpha channel exists, but every visible pixel is partially transparent; hard alpha and flat-colour acceptance fail. A's alpha ≥128 upright bounds measure approximately 339–342 px high (56.5–57 blocks), above the requested 288–324 px. Its standing bottom edges are around local y435–438, above the requested y≈470. Bounds at alpha ≥128 do not prove the requested empty margins because faint alpha extends beyond them. Exact measurements for all six cells are preserved under `norbert_s4.verification` in `prompts.json`.

## Provenance and handoff

- Selected file: `garden-v05/environment/elves/masters/v4-norbert.png`.
- Selected SHA-256: `ad5dde3ea99b066d6d0b5297096a5c5c54f64ef1403480eb0630e25530874378`.
- Both full prompts, original generation paths, candidate hashes, selection and verification results were appended to `garden-v05/environment/elves/prompts.json`; earlier entries remain intact. The unselected candidate remains at its recorded generation source and was not copied into the repository.
- No resizing, native frames, previews, builders, commits, pushes or deployments. No `.mjs`, CSS, `functions/` or HPVNN edits. The existing brief and log were preserved.

The requested generation/comparison and master handoff are complete. Strict art acceptance remains failed: the selected master needs further image-tool or artist work on grid, exact palette, binary alpha, folded-wing poses, height and foot baseline before it can satisfy the brief. Resizing alone does not resolve those defects. No runtime or production acceptance is claimed.
