# Codex brief — UI audit 07/11/2026: code fixes (branch `ui-audit-code`)

Claude Code (Anthropic) reviews, tests in a browser and commits after you. **Your job: work through the to-do list
`docs/ui-audit-20261107.md`, sections C1 → C7 in order. Skip section W and "Owner decisions".**

Read first, briefly: `docs/ui-audit-20261107.md` (the list, with file:line for every item),
`/Users/thachanh/Downloads/HPVNN.nosync/.agents/skills/hpvnn-game-ui/SKILL.md` (UI rules, especially "Inside a
dialog or panel: one frame, one grid, no explaining"), `docs/art-bible.md` §palette. Client code is in `garden-v05/`.

## How to work
- One item at a time: read the code it names (and its callers), make the smallest fix that solves it at the root,
  then tick it `[x]` in `docs/ui-audit-20261107.md` and add ` — done: <files>` at the end of the line. If an item is
  wrong, already fixed, or needs a decision, tick it `[~]` and add ` — skipped: <reason>`. A rerun continues from the
  first unticked item, so tick as you go.
- Fix shared code once (a shared CSS rule or helper) instead of patching each caller.
- Pixel art stays crisp: integer scales only, `image-rendering: pixelated`, colours from the approved palette.
- Text is Vietnamese; keep Harry Potter terms exactly as they already appear in the game (Lý Lan wording). Do not
  invent new names.
- Do NOT change game rules, prices, rewards, server calls or save data, beyond what an item explicitly asks.
- Do NOT bump the `?v=` module stamps, do NOT touch `qa-v19/` except items C1.1, C1.6, C1.10, C3.12.
- Tests: `cd garden-v05 && node --test *.test.mjs` must stay at 362 pass / 0 fail (baseline). Run it after each
  section (C1, C2, …). If a test asserts the old behaviour an item removes, update that test and say so.
  For each logic fix in C1/C2, add or extend one small test when an existing test file covers that module.
- Visual check (optional, recommended for C3/C4): Playwright is at
  `/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright`; a working
  page loader is in `/private/tmp/claude-501/-Users-thachanh-Downloads-HPVNN-nosync/5cc32bd3-011f-47d8-8a90-a9fa25907c5f/scratchpad/audit/desktop/run.mjs`
  (all requests served in-process; do not start servers on 3026, 5001, 62795). Measure with getBoundingClientRect at
  375×667, 390×844, 844×390 and 1280×800.

## Rules
- Only files inside this worktree. No git commit, push or deploy. No new dependencies.
- If you hit a usage limit, stop; the list's ticks show where you were.
- End with: a table of section → items done / skipped, the final test count, and every test you changed.
