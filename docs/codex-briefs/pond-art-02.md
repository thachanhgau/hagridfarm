# Codex brief — pond phase 1, redo: «Hồ sâu» pond-3 only (08/11/2026)

You are Codex in the Hagrid Farm repo. **You only draw one master.** Claude Code (Anthropic) reduces it. Keep
exploration short. This redoes `pond-3` from `docs/codex-briefs/pond-art-01.md` §A (read that section once).

What was wrong with the current `garden-v05/environment/pond/masters/pond-3.png` (keep it as `pond-3-v1.png` beside
it before you write the new one): the **front edges have no bank** (water runs straight to the outline), the centre is
one big empty dark field, and it looks like a different family from pond-1/pond-2.

Draw a new `garden-v05/environment/pond/masters/pond-3.png`:
- **Exactly the family of `garden-v05/environment/pond/masters/pond-2.png`** (open it and pass it to your image tool
  as the style reference): the same grassy green bank with grass tufts running **all the way round, front edges
  included**, the same grey rocks, cattails and blue-violet water, same pixel block size relative to the canvas.
- Ground fills the parallelogram in `docs/codex-briefs/pond-art/guide-pond-3.png` (1152×768, pass it as the geometry
  reference) with softly rounded corners; reeds and posts may rise above the dashed line, nothing wider than the guide.
- Water: light shallow rim, then **two or three clear stepped bands** to a **deep dark-blue centre** (`#3E3B70`); a few
  lily pads and two fish shadows in the shallow band; some ribbon weed near the back bank.
- **A small wooden jetty** (4 planks, two posts) from the front-right bank toward the middle, standing on the bank.
- Rocks and cattails denser on the back rim, lower grass and two or three rocks on the front rim so the water stays visible.
- Flat pixel blocks, outline `#231F2E`, light from the top-left, no smooth shading, no soft halo: the edge must be a hard
  outline on **transparent** background (no white). Canvas 1152×768, transparent; place the result with
  nearest-neighbour only (you may reuse `docs/codex-briefs/pond-art/place-masters.py`).

Two candidates; keep the one closer to pond-2's look. Append the prompt entry (`id`, `master`, `prompt`,
`generatedFile`, `referenceFiles`) to `garden-v05/environment/pond/prompts.json`. No other files, no builders, no git,
no HPVNN. If image generation is refused or unavailable, stop and say so. Report in
`docs/codex-briefs/pond-art-02-report.md` (candidate kept and why, verdict).
