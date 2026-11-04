// Export the gia tinh frames (25.0 S2) from their Codex masters into native 56×56 sprites.
// Masters are chunky pixel art drawn as square blocks on 3 × 2 sheets of 512 px cells (style: dobby-v2-b, owner OK
// 04/11/2026). A fine illustration shrunk off its grid looked «không nét, nhìn vỡ», so each native pixel here is exactly
// one master block: block size measured per sheet, grid phase from the colour edges, the block centre's main colour,
// palette24. Usage: node garden-v05/build-elf-art.mjs [elf ids…]
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {SPRITE_PALETTE} from './palette.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const sharp = createRequire(import.meta.url)(process.env.SHARP_MODULE || '/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const sha256 = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
const RGB = SPRITE_PALETTE.map((hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)));
export const CANVAS = {width: 56, height: 56, pivotX: 28, pivotY: 52};

// Per elf: sheets of [master, six pose names in cell order (row 1 left→right, then row 2)].
const M = 'environment/elves/masters/';
export const ELF_SOURCES = {
  dobby: [[M + 'dobby-v2-b.png', ['idle', 'walk-1', 'walk-2', 'sweep', 'water', 'carry']], [M + 'dobby-v2-extra.png', ['sleep', 'feed', 'harvest', 'cheer', 'hat', 'sock']]],
  winky: [[M + 'winky.png', ['idle', 'walk-1', 'walk-2', 'water', 'carry', 'sleep']]],
  'kitchen-a': [[M + 'kitchen-elf-a.png', ['idle', 'walk-1', 'walk-2', 'sweep', 'carry', 'sleep']]],
  'kitchen-b': [[M + 'kitchen-elf-b.png', ['idle', 'walk-1', 'walk-2', 'sweep', 'water', 'sleep']]],
};
const CELL = 512;

// Redmean distance: cheap and close to perceived difference for a 24-colour pick.
function nearest(r, g, b, allowed = RGB.keys()) {
  let best = 0, bestD = Infinity;
  for (const i of allowed) {
    const [pr, pg, pb] = RGB[i], m = (r + pr) / 2;
    const d = (2 + m / 256) * (r - pr) ** 2 + 4 * (g - pg) ** 2 + (2 + (255 - m) / 256) * (b - pb) ** 2;
    if (d < bestD) { bestD = d; best = i; }
  }
  return best;
}

// Masters drawn on a block grid: image models keep blocks but not their size (Dobby v2: ~11.6 px, asked for 8), so
// `grid` is the block size measured once per master (one size keeps every frame the same height; a per-frame search
// drifted 10.4–12.7). Colour edges sit on block lines, so the phase is where edge positions modulo the block line up;
// each native pixel is the most common colour of its block's centre.
// Returns {px, w, h, phase, block}.
export function reduceGrid(data, W, [left, top, rw, rh], guess) {
  const idx = new Int16Array(rw * rh);
  for (let y = 0; y < rh; y++) for (let x = 0; x < rw; x++) {
    const i = ((top + y) * W + left + x) * 4;
    idx[y * rw + x] = data[i + 3] < 128 ? -1 : nearest(data[i], data[i + 1], data[i + 2]);
  }
  const xs = [], ys = [];
  for (let y = 1; y < rh; y++) for (let x = 1; x < rw; x++) {
    const c = idx[y * rw + x];
    if (c !== idx[y * rw + x - 1]) xs.push(x);
    if (c !== idx[(y - 1) * rw + x]) ys.push(y);
  }
  const line = (edges, block) => {
    let re = 0, im = 0;
    for (const e of edges) { re += Math.cos(2 * Math.PI * e / block); im += Math.sin(2 * Math.PI * e / block); }
    return {r: Math.hypot(re, im) / edges.length, phase: ((Math.atan2(im, re) / (2 * Math.PI)) * block + block) % block};
  };
  const fit = {block: guess, phase: [line(xs, guess).phase, line(ys, guess).phase]};
  const {block, phase} = fit, inset = block / 4;
  const w = Math.floor((rw - phase[0]) / block), h = Math.floor((rh - phase[1]) / block), px = new Int16Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const tally = new Map(), bx = phase[0] + x * block, by = phase[1] + y * block;
    for (let sy = Math.round(by + inset); sy < by + block - inset; sy++) for (let sx = Math.round(bx + inset); sx < bx + block - inset; sx++) {
      const c = idx[sy * rw + sx];
      tally.set(c, (tally.get(c) || 0) + 1);
    }
    px[y * w + x] = [...tally].sort((p, q) => q[1] - p[1])[0][0];
  }
  return {px, w, h, phase, block};
}

// Block size of a sheet: runs of one colour along rows are whole blocks, so take the weighted mean of the two most
// common neighbouring run lengths (Dobby v2: 11 px ×139, 12 px ×203 → 11.6).
function measureBlock(data, W, H) {
  const runs = new Map();
  for (let y = 0; y < H; y += 2) {
    let run = 1;
    for (let x = 1; x < W; x++) {
      const i = (y * W + x) * 4, j = i - 4;
      if (data[i + 3] > 128 && Math.abs(data[i] - data[j]) + Math.abs(data[i + 1] - data[j + 1]) + Math.abs(data[i + 2] - data[j + 2]) < 30) run++;
      else { if (run >= 5 && run <= 24) runs.set(run, (runs.get(run) || 0) + 1); run = 1; }
    }
  }
  const n = (r) => runs.get(r) || 0;
  const r = [...runs.keys()].sort((a, b) => n(b) + n(b + 1) - n(a) - n(a + 1))[0];
  return (r * n(r) + (r + 1) * n(r + 1)) / (n(r) + n(r + 1));
}

export async function buildElf(id) {
  await fs.mkdir(path.join(root, 'environment/elves', id), {recursive: true});
  const sheets = [];
  for (const [masterFile, poses] of ELF_SOURCES[id]) {
    const master = await fs.readFile(path.join(root, masterFile));
    const {data, info} = await sharp(master).ensureAlpha().raw().toBuffer({resolveWithObject: true});
    const grid = measureBlock(data, info.width, info.height), frames = [];
    for (const [index, pose] of poses.entries()) {
      const rect = [(index % 3) * CELL, Math.floor(index / 3) * CELL, CELL, CELL];
      const {px, w, h, phase, block} = reduceGrid(data, info.width, rect, grid);
      let bottom = h - 1;
      while (bottom > 0 && !px.slice(bottom * w, bottom * w + w).some((c) => c >= 0)) bottom--;
      // Feet stand at the cell's centre column (the brief puts the body on x = 256).
      const x0 = CANVAS.pivotX - Math.round((CELL / 2 - phase[0]) / block), y0 = CANVAS.pivotY - bottom;
      const out = Buffer.alloc(CANVAS.width * CANVAS.height * 4);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const c = px[y * w + x], cx = x0 + x, cy = y0 + y;
        if (c < 0) continue;
        if (cx < 1 || cy < 1 || cx >= CANVAS.width - 1 || cy > CANVAS.pivotY) throw Error(`${id}/${pose}: ink leaves the canvas margin`);
        out.set([...RGB[c], 255], (cy * CANVAS.width + cx) * 4);
      }
      const file = `environment/elves/${id}/${pose}.png`, png = await sharp(out, {raw: {width: CANVAS.width, height: CANVAS.height, channels: 4}}).png().toBuffer();
      await fs.writeFile(path.join(root, file), png);
      frames.push({file, sourceRect: rect, size: [w, h], offset: [x0, y0], sha256: sha256(png)});
    }
    sheets.push({master: masterFile, masterSha256: sha256(master), block: Number(grid.toFixed(2)), frames});
  }
  return {id, canvas: CANVAS, sheets};
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const elves = [];
  for (const id of process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(ELF_SOURCES)) elves.push(await buildElf(id));
  const file = path.join(root, 'environment/elves/provenance.json');
  const provenance = JSON.parse(await fs.readFile(file, 'utf8'));
  provenance.export = {tool: 'build-elf-art.mjs', method: 'one native pixel per master block: block from colour run lengths, phase from colour edges, block-centre main colour, palette24', elves};
  await fs.writeFile(file, JSON.stringify(provenance, null, 2) + '\n');
  console.log(elves.map((e) => `${e.id}: ${e.sheets.map((s) => `${path.basename(s.master)} block ${s.block}`).join(', ')}`).join('\n'));
}
