# Dobby pilot v2 — master candidates, 04/11/2026

Status: two generated candidates saved, but **neither meets the requested native-grid master specification**. Do not treat either as an approved source for lossless 8:1 reduction. Image generation was available and used; its output did not obey the exact block, palette and transparency constraints, even after a targeted correction of each sheet.

## Deliverables

- `garden-v05/environment/elves/masters/dobby-v2-a.png`
- `garden-v05/environment/elves/masters/dobby-v2-b.png`
- Exact generation prompts and correction prompts appended to `garden-v05/environment/elves/prompts.json`; both v1 entries and the v1 selection remain intact.

Both files are unmodified imagegen PNG outputs, 1536 × 1024 with an alpha channel, showing six poses in the requested order: idle, walk-1, walk-2 / sweep, water, carry. No raster processing, quantization, resizing, native-frame creation or preview generation was performed.

## Which looks closer?

**B looks closer to the intended block construction**, because its tunic, basket, broom and facial shading use larger, simpler shapes, with fewer tiny transitions than A. Its corrective edit retained pupils and made broader steps. A was kept from its initial generation because its correction erased the distinct pupils. A has rounder eyes and a friendlier face, but more small irregular detail. This is a relative visual preference, not grid compliance.

Neither is an exact 8×8-block drawing. Both retain nonuniform colour and alpha inside every occupied grid block. Their visible dark halos are residual partially transparent background pixels, not an acceptable clean transparent surround. B's eyes also remain too large/angular for the requested 4–5 native-pixel circles; neither sheet proves the exact baseline, native outline width or pose dimensions. B's walking poses need a sock-side consistency review.

## Read-only master inspection

No builder or native reduction/check pipeline was run. The following measurements inspect the master RGBA bytes only, with grid origin (0,0). Fully transparent RGB is ignored when comparing block uniformity. A compliant block contains one identical RGBA value throughout, or is entirely transparent.

| Measurement | A | B |
|---|---:|---:|
| Canvas | 1536 × 1024 | 1536 × 1024 |
| Fully transparent pixels | 758,242 | 989,086 |
| Partially transparent pixels | 814,622 | 583,778 |
| Distinct RGB colours where alpha > 0 | 91,833 | 72,480 |
| Nonuniform occupied 8×8 blocks | 17,563 / 17,563 | 10,325 / 10,325 |

The required maximum is 12 exact palette colours and zero nonuniform blocks. These masters fail those requirements; an alpha channel alone does not establish clean transparency. B has less residual background and fewer colour variations, but still fails.

SHA-256:

```text
A 9207f1bb636b24a1a41e53af97830efd0462197b0085620f61569d41a0265b6f
B 44f2e53cca48282820f37387959dfa5bd4e3bd5e8f07548316553bc7600c8651
```

## Scope and handoff

Only the two requested master PNGs, prompts JSON and this report were written. Existing dirty native frames, provenance, v2 brief/log and `build-elf-art.mjs` were left untouched. No `.mjs`, CSS, `functions/` or HPVNN edits; no builders, commit, push or deployment.

The strict art outcome remains unresolved: clean native-grid masters must be generated or authored successfully before Claude's reduction can preserve every intended pixel. These files are retained as honest visual candidates, not substitutes produced with code.
