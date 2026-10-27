# Codex brief — draw masters only (grid-fit batches 03+)

Owner 27/10/2026: Codex **only makes the images**. Claude Code (Anthropic) does everything else: export, import, audit,
tests, review and commit. Do not run builders, importers, audits or tests. Do not open other docs beyond what is named
here. Keep exploration minimal to save usage.

## For each id in the launch prompt

The launch prompt gives each item's pack, footprint, max ink box (w×h at native size) and a placement note.

1. Read that item's row in `<pack>/prompts.json` (base prompt) and `<pack>/specs.json` (`subject`). Look at the current
   master `<pack>/masters/<id>.png` so the new one stays the same object and style.
2. Generate ONE new master with your image generation tool, transparent background, same layout as the pack's masters:
   - LEFT half = default isometric view, RIGHT half = the alternate view rotated 90° (not a mirror). Same scale and
     baseline, each view fully inside its half, with a wide transparent gap in the middle.
   - Each view's proportion ≈ the max ink box (the builder scales it down to that box, so a view that is too wide comes
     out tiny).
   - It must read at the max ink box size: big chunky silhouette, few large pixel clusters, no fine detail.
   - Ground contact sits on the footprint seen from above. For strips (1×2, 1×3, 2×3) the object runs **along** the
     strip: default view along the rows (upper-right ↔ lower-left), alternate view along the columns
     (upper-left ↔ lower-right). Nothing wider at the base than the strip.
   - Keep the pack palette/outline/light rules from the base prompt. Keep the book-faithful subject.
3. Move the old master to `<pack>/masters/variants/<id>-v<N>.png` (next free N). Save the new one as
   `<pack>/masters/<id>.png`.
4. Look at your result once, scaled down to the max ink box, and regenerate if it does not read. At most 3 tries per item.

## Hand-off

Write `docs/codex-briefs/masters-<NN>.json`: `{ "<id>": { "prompt": "<final prompt>", "tries": n, "note": "<doubts>" } }`.
End with a one-line-per-item summary. No git commit, push or deploy. If you hit a usage limit, stop. Already-saved
masters are fine; list which ids are missing.
