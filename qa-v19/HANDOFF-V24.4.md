# Hagrid Garden V24.4 — personal creature habitats
2026-10-17. Standalone prototype outside Git. Preserve server 62795 / PID 72246.

## Entry
- Embed: http://127.0.0.1:62795/qa-v19/embed-preview.html?v=24.4.1
- Standard full: http://127.0.0.1:62795/qa-v19/ui-fixture.html?wallet=emulator&qa=1&level=100&view=overview&v=24.4.1
- All twelve species QA: http://127.0.0.1:62795/qa-v19/ui-fixture.html?wallet=emulator&qa=1&level=100&view=overview&scenario=habitats&v=24.4.1
- Logical version 24.4, runtime cache 24.4.1. Previous handoff HANDOFF-V24.3.md.
- Fixture is read-only memory wallet. Do not substitute source index.html?wallet=emulator.

## Changes
- New garden-creature-habitats.mjs defines hand-authored pixel art for all 12 adoptable species: Puffskein basket, Bowtruckle fern stump, Niffler coin satchel, Mooncalf lunar stone, Kneazle scratching log/toy, Diricawl birdbath, Fwooper feather perch, Hippogriff saddle rack, Thestral blue lantern, Unicorn lily pool, three-headed-dog three bowls/bone, Dragon basalt ember nest.
- Themes follow actual occupants and their scene slots, not pen numbers. Moving a pen or changing occupants updates the bounded static pen canvas cache. Empty pens retain generic water/straw. No gameplay state or hitbox added.
- Small motion pass shares the renderer clock, four slow phases (600ms/phase), pixel-aligned 1–2px displacement/glints. No new RAF/timer. clock=0/reduced motion freezes it. All static and moving details draw below every creature.
- Four weather palettes and snow caps. Pens retain low V24.3 borders and open west gate.
- Pen signs moved below the south corner so they do not overlay tall heads or the new props.
- scenario=habitats is an opt-in disposable QA fixture; default showcase unchanged.

## Verification
- 137/137 node --test *.test.mjs PASS (133 baseline + 4 habitat regressions).
- Coverage: all engine species have distinct art; actual occupant mapping/adoption order; translated layout; immutable inputs; all weather/phase pixel bounds; >60px anchor clearance from creature ground anchors; deterministic animation and frozen reduced motion.
- Actual IAB all-twelve fixture, top and bottom pens, clear/snow; direct Dragon click displayed +12 affinity. Narrow embedded default showcase connected; direct Bowtruckle click displayed +12 affinity. No runtime errors.
- New art is native code pixels; no external raster generation, external service, account write, commit/push/deploy or server restart.
- Bounded Luna read-only audit independently checked species/layout mapping, cache bounds/invalidation, draw/pick ordering and reduced motion; no blocker found.
- Physical iPhone/Safari not tested.

## Evidence / recovery
/Users/thachanh/.codex/visualizations/2026/10/17/01a1480f-4d73-7520-ad5b-221575ca7c7b/v244/
- before/, staged/, baseline.json, applied.json and guarded apply.py.
- tests-final.log, habitats-clear.png, iframe-v244.png.
- Integrity manifest v24.4-sha256.json; old handoffs/manifests retained.
