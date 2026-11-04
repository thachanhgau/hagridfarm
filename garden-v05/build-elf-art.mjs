// Export the gia tinh frames (25.0 S2) from their Codex masters into native sprites.
// Masters are detailed pixel art on 3 × 2 sheets of 512 px cells whose block grid is uneven (6–8 px), so sampling one
// block per pixel drifts and breaks pixels (owner 04/11/2026: «không nét, nhìn vỡ»). Instead each sheet is shrunk by
// area average so a reference pose's ink is exactly `height` px, mapped to palette24, then lone pixels (the blur that
// averaging leaves) take their neighbours' colour unless they are a strong accent (pupils, eye highlights), and the
// silhouette gets a #231F2E rim. Usage: node garden-v05/build-elf-art.mjs [elf ids…]
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {SPRITE_PALETTE} from './palette.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
export const sharp = createRequire(import.meta.url)(process.env.SHARP_MODULE || '/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
export const sha256 = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
export const RGB = SPRITE_PALETTE.map((hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)));
const LUMA = RGB.map(([r, g, b]) => 0.3 * r + 0.59 * g + 0.11 * b);
const RIM = 0; // '#231F2E'
const CELL = 512;
export const CANVAS = {width: 80, height: 80, pivotX: 40, pivotY: 76};

// Per elf: sheets of [master, pose names in cell order (row 1 left→right, then row 2), reference pose, its ink height,
// columns (3)].
const M = 'environment/elves/masters/';
export const ELF_SOURCES = {
  dobby: [[M + 'v3-dobby.png', ['idle', 'walk-1', 'walk-2', 'sweep', 'water', 'carry'], 'idle', 60], [M + 'v3-dobby-extra.png', ['sleep', 'feed', 'harvest', 'cheer', 'hat', 'sock'], 'hat', 60]],
  winky: [[M + 'v3-winky.png', ['idle', 'walk-1', 'walk-2', 'water', 'carry', 'sleep'], 'idle', 52]],
  'kitchen-a': [[M + 'v3-kitchen-a.png', ['idle', 'walk-1', 'walk-2', 'sweep', 'carry', 'sleep'], 'idle', 60]],
  'kitchen-b': [[M + 'v3-kitchen-b.png', ['idle', 'walk-1', 'walk-2', 'sweep', 'water', 'sleep'], 'idle', 55]],
  // 25.0 S4: baby Norbert, the companion (hatched by S7's egg).
  norbert: [[M + 'v4-norbert.png', ['idle', 'walk-1', 'walk-2', 'sleep', 'play', 'puff'], 'idle', 50]],
  // 25.0 S5: ma lùm (a 2 × 2 sheet), drawn in the weeds of a neglected plot.
  'ma-lum': [['environment/duty/masters/ma-lum.png', ['idle', 'chew-1', 'chew-2', 'flung'], 'idle', 28, 2]],
};

// Redmean distance: close to perceived difference for this palette (OKLab tipped skin to orange and lost Dobby's hat).
function nearest(r, g, b) {
  let best = 0, bestD = Infinity;
  for (const [i, [pr, pg, pb]] of RGB.entries()) {
    const m = (r + pr) / 2, d = (2 + m / 256) * (r - pr) ** 2 + 4 * (g - pg) ** 2 + (2 + (255 - m) / 256) * (b - pb) ** 2;
    if (d < bestD) { bestD = d; best = i; }
  }
  return best;
}

// Ink rows of a cell (alpha ≥ 128): [top, bottom].
function inkRows(data, W, left, top) {
  let t = -1, b = -1;
  for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++) if (data[((top + y) * W + left + x) * 4 + 3] >= 128) { if (t < 0) t = y; b = y; break; }
  return [t, b];
}

// Area-average a CELL square at `scale` into palette indices, -1 = transparent (coverage < 50 %).
export function shrink(data, W, left, top, scale) {
  const n = Math.round(CELL * scale), f = CELL / n, px = new Int16Array(n * n).fill(-1);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    let a = 0, r = 0, g = 0, b = 0;
    const x0 = x * f, x1 = x0 + f, y0 = y * f, y1 = y0 + f;
    for (let sy = Math.floor(y0); sy < y1; sy++) for (let sx = Math.floor(x0); sx < x1; sx++) {
      const k = (Math.min(sx + 1, x1) - Math.max(sx, x0)) * (Math.min(sy + 1, y1) - Math.max(sy, y0)), i = ((top + sy) * W + left + sx) * 4, al = data[i + 3] / 255 * k;
      a += al; r += data[i] * al; g += data[i + 1] * al; b += data[i + 2] * al;
    }
    if (a / (f * f) >= 0.5) px[y * n + x] = nearest(r / a, g / a, b / a);
  }
  return {px, n};
}

const around = (x, y, n, eight) => (eight ? [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]] : [[0, -1], [-1, 0], [1, 0], [0, 1]])
  .map(([dx, dy]) => [x + dx, y + dy]).filter(([u, v]) => u >= 0 && v >= 0 && u < n && v < n).map(([u, v]) => v * n + u);

export function tidy(px, n) {
  const next = px.slice();
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const i = y * n + x, c = px[i];
    if (c < 0) continue;
    const near = around(x, y, n, true).map((j) => px[j]).filter((v) => v >= 0);
    if (near.length < 5 || near.includes(c)) continue;
    const lumas = near.map((v) => LUMA[v]);
    const mean = lumas.reduce((sum, v) => sum + v, 0) / lumas.length;
    if ((LUMA[c] <= Math.min(...lumas) || LUMA[c] >= Math.max(...lumas)) && Math.abs(LUMA[c] - mean) > 60) continue; // a strong accent (pupil, highlight), not blur
    const tally = new Map();
    for (const v of near) tally.set(v, (tally.get(v) || 0) + 1);
    next[i] = [...tally].sort((p, q) => q[1] - p[1])[0][0];
  }
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const i = y * n + x;
    if (next[i] >= 0 && around(x, y, n, false).some((j) => next[j] < 0)) next[i] = RIM;
  }
  return next;
}

export async function buildElf(id) {
  await fs.mkdir(path.join(root, 'environment/elves', id), {recursive: true});
  const sheets = [];
  for (const [masterFile, poses, ref, height, cols = 3] of ELF_SOURCES[id]) {
    const master = await fs.readFile(path.join(root, masterFile));
    const rows = Math.ceil(poses.length / cols), meta = await sharp(master).metadata();
    // A master drawn at another size (the ma lùm came at 627 px cells) is first brought to 512 px cells.
    const sized = meta.width === cols * CELL ? sharp(master) : sharp(master).resize(cols * CELL, rows * CELL, {kernel: 'lanczos3'});
    const {data, info} = await sized.ensureAlpha().raw().toBuffer({resolveWithObject: true});
    const cellOf = (index) => [(index % cols) * CELL, Math.floor(index / cols) * CELL];
    const [rt, rb] = inkRows(data, info.width, ...cellOf(poses.indexOf(ref)));
    const scale = height / (rb - rt + 1), frames = [];
    for (const [index, pose] of poses.entries()) {
      const {px: raw, n} = shrink(data, info.width, ...cellOf(index), scale), px = tidy(raw, n);
      let bottom = n - 1;
      while (bottom > 0 && !px.slice(bottom * n, bottom * n + n).some((c) => c >= 0)) bottom--;
      // Feet stand on the cell's centre column (the brief puts the body on x = 256).
      const x0 = CANVAS.pivotX - Math.round(n / 2), y0 = CANVAS.pivotY - bottom;
      const out = Buffer.alloc(CANVAS.width * CANVAS.height * 4);
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        const c = px[y * n + x], cx = x0 + x, cy = y0 + y;
        if (c < 0) continue;
        if (cx < 1 || cy < 1 || cx >= CANVAS.width - 1 || cy > CANVAS.pivotY) throw Error(`${id}/${pose}: ink leaves the canvas margin`);
        out.set([...RGB[c], 255], (cy * CANVAS.width + cx) * 4);
      }
      const file = `environment/elves/${id}/${pose}.png`, png = await sharp(out, {raw: {width: CANVAS.width, height: CANVAS.height, channels: 4}}).png().toBuffer();
      await fs.writeFile(path.join(root, file), png);
      frames.push({file, cell: cellOf(index), sha256: sha256(png)});
    }
    sheets.push({master: masterFile, masterSha256: sha256(master), scale: Number(scale.toFixed(4)), frames});
  }
  return {id, canvas: CANVAS, sheets};
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const elves = [];
  for (const id of process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(ELF_SOURCES)) elves.push(await buildElf(id));
  const file = path.join(root, 'environment/elves/provenance.json');
  const provenance = JSON.parse(await fs.readFile(file, 'utf8'));
  provenance.export = {tool: 'build-elf-art.mjs', method: 'area average to a reference ink height, palette24 (redmean), lone pixels absorbed unless a strong accent, #231F2E rim', elves};
  await fs.writeFile(file, JSON.stringify(provenance, null, 2) + '\n');
  console.log(elves.map((e) => `${e.id}: ${e.sheets.map((s) => `${path.basename(s.master)} ×${s.scale}`).join(', ')}`).join('\n'));
}
