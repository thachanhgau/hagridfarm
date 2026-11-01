# Codex brief — «Thăm vườn» Floo art for Hagrid Farm (01/11/2026)

You are Codex in the Hagrid Farm repo. Owner: the visit panel «không cool»; make two pieces that make it feel magical.
Claude Code (Anthropic) writes the code that uses them and will verify. Read `docs/art-bible.md` and use only the
palette in `garden-v05/palette.mjs` (Floo green = the «Cỏ · lá» ramp `#24483F #3F6A45 #71934B #B0BD67` plus the magic
ramp `#B7DEE0 #70A8B6` for the hottest core; wood/stone/brick from the other ramps). Pixel art, crisp, no text.

## Files (exact names/sizes), all in `garden-v05/environment/visit/`, PNG, transparent where noted

| file | size | content |
|---|---|---|
| `floo-hearth.png` | 360×120 | UI header illustration (not in the garden scene): a wide stone fireplace of Hagrid's hut seen from the front, roaring **emerald-green Floo flames** swirling up, green sparks, a flowerpot of Floo powder on the mantel at the left; the right ~45% darker/quieter (text and a button sit there). Opaque. |
| `portal-ring.png` | 80×80 | A round frame for a member's avatar: a ring of twisting garden vines with small leaves, two tiny pumpkins and a few glowing green Floo sparks, light from top-left. The centre circle of diameter 60 px (centre 40,40) must be **fully transparent**; nothing outside radius 40. |

Make several candidates with your image tool, pick the best that reads at 1×, reduce to the palette and exact size with
nearest-neighbour. Raw generations go in `garden-v05/environment/visit/masters/`.

Then `SHARP_MODULE=/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp node garden-v05/build-runtime-webp.mjs`
and `node garden-v05/build-runtime-webp.mjs --check`. Write `docs/codex-briefs/visit-floo-preview.png` (each at 1× and 3×,
plus the ring around a plain circle avatar).

Hard rules: no commit/push/deploy; do not edit `.mjs`, CSS, `functions/` or HPVNN; if image generation or usage is
unavailable, stop and say so — never fake art with code. Report in `docs/codex-briefs/visit-floo-report.md`.
