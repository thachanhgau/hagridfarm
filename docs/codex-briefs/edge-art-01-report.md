# Hagrid expansion phase 3, part 1 — 2026-11-08

10/10 requested design masters delivered using built-in ImageGen. All ten were visually inspected after placement. No subject was refused. Native reduction, registration, animation acceptance and commits remain Claude Code's work.

| id | master path | size | candidate kept and why | verdict |
|---|---|---|---|---|
| kappa-left-motion-v01 | `garden-v05/creature-motion-assets/masters/kappa-left-motion-v01.png` | 1024×1024 | **B over A**: broader, simpler grey-green skin clusters, clearer blink and prominent head-water oval; A has busier scale patches | good |
| kappa-right-motion-v01 | `garden-v05/creature-motion-assets/masters/kappa-right-motion-v01.png` | 1024×1024 | A, newly generated using left B as identity reference; right-facing bow retains visible tilted head water | good |
| kappa-growth-v01 | `garden-v05/creature-motion-assets/masters/kappa-growth-v01.png` | 1024×512 | A; blue head puddle and pale eyes at all four ages, both facings | good |
| porlock-left-motion-v01 | `garden-v05/creature-motion-assets/masters/porlock-left-motion-v01.png` | 1024×1024 | **C over A/B**: crossed forearms hiding face and clearer split hooves; A mostly covers cheeks, B has only eight views and is rejected | good |
| porlock-right-motion-v01 | `garden-v05/creature-motion-assets/masters/porlock-right-motion-v01.png` | 1024×1024 | A from left C; upright shaggy guardian, projecting nose, crossed-arm hiding pose and food sequence | good |
| porlock-growth-v01 | `garden-v05/creature-motion-assets/masters/porlock-growth-v01.png` | 1024×512 | A; shaggy mop, large nose and two hooves retained throughout four ages and both facings | good |
| habitat_kappa | `garden-v05/masters-complete-objects/habitat_kappa.png` | 1024×1024 | A; five broad mossy stones, murky water, floating wooden bowl and cucumber on rim | good |
| habitat_porlock | `garden-v05/masters-complete-objects/habitat_porlock.png` | 1024×1024 | **B over A**: weathered grey-brown roof replaces golden-orange roof; two posts, hay heap and adjoining trough remain simple | good |
| keepsake_kappa | `garden-v05/masters-complete-objects/keepsake_kappa.png` | 1024×1024 | A; monkey hunch, pale eyes and blue head inset, matching low two-step grey plinth and blank gold front inset | good |
| keepsake_porlock | `garden-v05/masters-complete-objects/keepsake_porlock.png` | 1024×1024 | A; upright shaggy guardian, large nose, clear split hooves and matching plinth/inset | good |

## Verification and provenance

- Read art-bible sections 1–4, `SPRITE_PALETTE`, phase-2 report and placement example. Visually inspected all six named creature references plus the named habitat/keepsake master references. Existing artwork and concurrent work were preserved.
- `edge-art/prompts-creatures.json` contains **14 exact submitted prompts**: ten selected masters and four rejected candidates. Each records id, destination, original ImageGen file path and explicit file references. All 14 original source and destination paths were checked to exist. Original tool outputs remain unchanged.
- Prompt assembly had an early error: Kappa B and rejected Porlock B contain literal `undefined` in their submitted prompt strings. Those exact strings are preserved rather than rewritten after generation. Kappa B was selected by visual inspection of its complete 16-pose result; Porlock B was rejected for its eight-view layout, and a fully specified C was generated.
- `edge-art/place-creatures.py` only crops, places and resizes generated artwork using nearest-neighbour. No painting, alpha cleanup, mirroring or quantization. No builders or importers were executed.
- `edge-art/verification-creatures.json` records sizes, visible bounds, alpha counts and SHA-256 for all ten masters. Four motion sheets have sixteen occupied cells each; two growth sheets have eight each: **80/80 cells** verified.
- At alpha ≥128 every sheet cell's lower occupied bound is local y=210 (exclusive bound, last occupied row 209). Horizontal occupied margins are ≥32 px on each side; top margins are ≥32 px. Thus visible occupied bounds have ≥64 px horizontal gaps and ≥78 px vertical gaps. This checks occupied content, not absolute absence of faint alpha residue.
- Growth occupied heights are 63/97/132/164 master pixels per facing: adult/newborn ratio 2.60×. Four motion sheets use one uniform scaling factor within each sheet. Objects are centered on transparent 1024×1024 canvases.
- Right-facing sheets were separately generated from the selected left identity references; no programmatic mirroring. Top-left lighting was requested throughout.
- Final PNGs all contain real alpha-zero pixels and opaque pixels. They also contain partial alpha; these are design masters, not binary-alpha native sprites.

## Limits for Claude's native pass

- Verdict **good** means useful design master. Soft internal shading, edge halos, partial alpha and colours outside the exact 24-colour set remain. Reconstruct the coarse native pixel grid and flatten materials during reduction; do not treat these as exact-palette finished sprites.
- Preserve Kappa's visible blue head dent in every frame, grey-green monkey silhouette, webbing and broad scale patches. Keep Porlock on two split hooves with two short arms and four stubby fingers. Finger count and webbing need careful reconstruction at native size.
- Check adult dimensions across independently generated motion/growth sheets against approximately Kappa 54×56 and Porlock 52×56. Placement normalizes canvas and baseline, not identical anatomy or native pixel density between ages/sheets.
- Care blink timing is imperfect: Porlock right care blink resembles the closed-eye happy frame. Idle and action secondary movement is subtle; verify nose twitch, hair sway, finger flex and head shake while building the native loop.
- Food contact during bending, small care-hand contact, scale patch readability, splash connection and the depth of Kappa's courtesy bow need inspection at native size. No native/runtime acceptance is claimed.
- Habitats deliberately use broad blocks for 36×28 reduction. Keep the grey-brown roof distinct from the pale hay and retain the tiny floating bowl in the pool.
- No native frames, previews, runtime modules, commits, pushes or deployments were created by this pass. No HPVNN or `functions/` changes. All new scripts/JSON are confined to `docs/codex-briefs/edge-art/`; the ten new PNG masters occupy only the requested destinations.

## Refusals

None. Built-in image generation remained available; all requested subjects were generated.
