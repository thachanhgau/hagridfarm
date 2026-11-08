# Pond art 05 — Góc nghỉ

One new master, generated with the built-in `image_gen` tool using the supplied ground guide and current `pond-3.png` as references.

| Master | Canvas | Subject | Review |
|---|---|---|---|
| `garden-v05/environment/pond/masters/pond-nook.png` | 768×992 RGBA | Gnarled willow-like tree rooted in the rear half, drooping dark-green fronds and moss; front-facing mossy stone bench; one short stone lantern with a small flat yellow flame; four mossy rocks, ferns, pale toadstools and two front stepping stones. | Keep for composition and handoff. Dark, cozy and readable beside the pond; no guide marks, text, glow halo or external ground shadow visible. |

## Placement and visual review

- `docs/codex-briefs/pond-art/place-pond-05.mjs` crops unused bottom margin, resizes with nearest-neighbour and places the generated artwork on a transparent 768×992 canvas. No painting, palette reduction, native export or registration.
- Ground lateral corners are approximately (4,792) and (764,792), the front tip approximately (384,984); the implied rear corner is (384,600), hidden by the tree and props. This fits the guide's 3×3 tile diamond with rounded tips. Tree canopy remains inside the canvas width and rises into the headroom. The tree's ground contact is behind the bench.
- Inspected `docs/codex-briefs/pond-art-05-preview.png`: 744×346 contact sheet on #5E7B3B, nook at exactly 192×248 (×1/4) beside pond-3 at 480×298 (×1/3), nearest-neighbour, canvas bottoms aligned. Bench, lantern flame and stepping stones remain distinguishable at native viewing scale. Rock shapes, outline treatment and muted greens belong to the pond family.

## Verification and downstream limit

Placement script passed dimension, nonempty-artwork, real-alpha and unchanged-pond-reference assertions. Master has 350,447 fully transparent pixels, 810 fully opaque pixels and 410,599 partially transparent pixels, with 39,519 visible RGB values. Most interior alpha is 253: the image tool did not produce strict binary-alpha, exact-palette pixels despite the prompt. Broad color clusters look like pixel art, but this is a generated master, **not a verified native-grid sprite**. Exact 24-color mapping, hard alpha and uniform native pixels remain for Claude's reduction pass; do not register this master directly as runtime art.

- Master SHA-256: `34798e94cd49c2f46300a47b8ff48a660e51fe66282142a38f785b4063ebab9f`.
- Unchanged pond-3 SHA-256: `b61e127c20d76ef51cbd6bf9503a8ba31c2869102310f4d28a28094906634654`.
- Full final prompt, generated source path, references and placement parameters: `docs/codex-briefs/pond-art/pond-05-records.json`; provenance entry appended to `garden-v05/environment/pond/prompts.json`.
- Machine-readable measurements: `docs/codex-briefs/pond-art/pond-05-checks.json`.
- Reproduce placement/preview: `node docs/codex-briefs/pond-art/place-pond-05.mjs` from repository root. Original generated source is retained at the path in the record.

No runtime builders/importers/tests, sprite registration, commits, pushes or deployments were run. Existing dirty `garden-v05/build-pond-art.mjs` and `garden-v05/garden-growth.mjs` were left untouched. No `.mjs` outside `docs/codex-briefs/pond-art/` was edited. Nothing was refused.
