// Season 2 skill icons: the three Codex sheets (masters-items/skills-s2-v2, 3 × 2 cells each, briefs
// docs/codex-briefs/skills-s2.md + skills-s2-v2.md) → skills-s2.png, 6 × 3 cells of 64 px in SKILL_ORDER, nearest-neighbour and the
// sprite palette like the other item builds. garden-skills-card shows a cell at 40 px. Masters stay untouched.
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
import {authoredCells} from './authored-atlas.mjs';
import {quantize} from './build-pond-art.mjs';
const sharp = createRequire(import.meta.url)(process.env.SHARP_MODULE || '/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root = new URL('./', import.meta.url), CELL = 64, FIT = 58;
const dir = process.argv[2] || 'masters-items/skills-s2-v2'; // round 1: masters-items/skills-s2
const cells = [];
for (const n of [1, 2, 3]) {
  const raw = await sharp(await fs.readFile(new URL(`${dir}/skills-sheet-${n}.png`, root))).ensureAlpha().raw().toBuffer({resolveWithObject: true});
  cells.push(...authoredCells(raw, [3, 3]));
}
if (cells.length !== 18) throw Error(`Expected 18 icons, found ${cells.length}`);
const out = Buffer.alloc(CELL * 6 * CELL * 3 * 4), W = CELL * 6;
for (const [i, pose] of cells.entries()) {
  const scale = Math.min(FIT / pose.width, FIT / pose.height), w = Math.max(1, Math.round(pose.width * scale)), h = Math.max(1, Math.round(pose.height * scale));
  const ink = quantize(await sharp(pose.data, {raw: {width: pose.width, height: pose.height, channels: 4}}).resize(w, h, {kernel: 'nearest', fit: 'fill'}).raw().toBuffer());
  const x0 = (i % 6) * CELL + Math.floor((CELL - w) / 2), y0 = Math.floor(i / 6) * CELL + Math.floor((CELL - h) / 2);
  for (let row = 0; row < h; row++) ink.copy(out, ((y0 + row) * W + x0) * 4, row * w * 4, (row + 1) * w * 4);
}
await fs.writeFile(new URL('skills-s2.png', root), await sharp(out, {raw: {width: W, height: CELL * 3, channels: 4}}).png({palette: true}).toBuffer());
