// Export the gia tinh frames (25.0 S2) from their Codex masters into native 56×56 sprites.
// AI masters have an uneven ~5 px pixel grid, so nearest-neighbour at another scale breaks pixels (owner 04/11/2026:
// «không nét, nhìn vỡ»). Here every native pixel is the area average of its source box, then palette24, rare colours
// merged, lone pixels absorbed and a dark rim on the silhouette. Usage: node garden-v05/build-elf-art.mjs
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
const RIM = 0; // '#231F2E'
export const CANVAS = {width: 56, height: 56, pivotX: 28, pivotY: 52};

// Per elf: master, `grid` (block size of a grid master) or one `scale` for every frame, and per pose the master rect plus the body's foot centre (master x).
export const ELF_SOURCES = {
  dobby: {
    master: 'environment/elves/masters/dobby-v2-b.png',
    grid: 11.6, // measured: colour runs of 11–12 px
    poses: {
      idle: {rect: [0, 0, 512, 512], footX: 256},
      'walk-1': {rect: [512, 0, 512, 512], footX: 768},
      'walk-2': {rect: [1024, 0, 512, 512], footX: 1280},
      sweep: {rect: [0, 512, 512, 512], footX: 256},
      water: {rect: [512, 512, 512, 512], footX: 768},
      carry: {rect: [1024, 512, 512, 512], footX: 1280},
    },
  },
};

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

// Area-average a master rect into w×h: returns palette indices, -1 = transparent (coverage < 50 %).
function reduce(data, W, [left, top, rw, rh], w, h) {
  const out = new Int16Array(w * h).fill(-1), fx = rw / w, fy = rh / h, colour = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let a = 0, r = 0, g = 0, b = 0, area = 0;
    const x0 = left + x * fx, x1 = x0 + fx, y0 = top + y * fy, y1 = y0 + fy;
    for (let sy = Math.floor(y0); sy < y1; sy++) for (let sx = Math.floor(x0); sx < x1; sx++) {
      const k = (Math.min(sx + 1, x1) - Math.max(sx, x0)) * (Math.min(sy + 1, y1) - Math.max(sy, y0)), i = (sy * W + sx) * 4, al = data[i + 3] / 255 * k;
      a += al; r += data[i] * al; g += data[i + 1] * al; b += data[i + 2] * al; area += k;
    }
    if (a / area >= 0.5) colour.push([y * w + x, r / a, g / a, b / a]);
  }
  for (const [i, r, g, b] of colour) out[i] = nearest(r, g, b);
  // Colours under 0.6 % of the sprite become the nearest colour that stays.
  const count = new Map();
  for (const c of out) if (c >= 0) count.set(c, (count.get(c) || 0) + 1);
  const keep = [...count].filter(([, n]) => n >= colour.length * 0.006).map(([c]) => c);
  for (const [i, r, g, b] of colour) if (!keep.includes(out[i])) out[i] = nearest(r, g, b, keep);
  return out;
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

const neighbours = (x, y, w, h, eight) => (eight ? [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]] : [[0, -1], [-1, 0], [1, 0], [0, 1]])
  .map(([dx, dy]) => [x + dx, y + dy]).filter(([nx, ny]) => nx >= 0 && ny >= 0 && nx < w && ny < h).map(([nx, ny]) => ny * w + nx);

function clean(px, w, h) {
  // A pixel whose colour no neighbour shares takes its neighbours' most common colour.
  const next = px.slice();
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, c = px[i];
    if (c < 0 || c === RIM) continue;
    const near = neighbours(x, y, w, h, true).map((j) => px[j]).filter((n) => n >= 0);
    if (near.length < 3 || near.includes(c)) continue;
    const tally = new Map();
    for (const n of near) tally.set(n, (tally.get(n) || 0) + 1);
    next[i] = [...tally].sort((p, q) => q[1] - p[1])[0][0];
  }
  // Dark rim: every opaque pixel touching transparency (art bible rule 4, like Hagrid's sprite).
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    if (next[i] >= 0 && (x === 0 || y === 0 || x === w - 1 || y === h - 1 || neighbours(x, y, w, h, false).some((j) => px[j] < 0))) next[i] = RIM;
  }
  return next;
}

export async function buildElf(id) {
  const source = ELF_SOURCES[id];
  const master = await fs.readFile(path.join(root, source.master));
  const {data, info} = await sharp(master).ensureAlpha().raw().toBuffer({resolveWithObject: true});
  const frames = [], grids = [];
  for (const [pose, {rect, footX}] of Object.entries(source.poses)) {
    // Grid masters keep their authored pixels as they are; illustration masters get the averaging clean-up.
    let w, h, px, footNative;
    if (source.grid) {
      let phase, block;
      ({px, w, h, phase, block} = reduceGrid(data, info.width, rect, source.grid));
      footNative = (footX - rect[0] - phase[0]) / block;
      grids.push(block.toFixed(2));
    } else {
      w = Math.round(rect[2] * source.scale); h = Math.round(rect[3] * source.scale);
      px = clean(reduce(data, info.width, rect, w, h), w, h);
      footNative = (footX - rect[0]) * source.scale;
    }
    let bottom = h - 1;
    while (bottom > 0 && !px.slice(bottom * w, bottom * w + w).some((c) => c >= 0)) bottom--;
    const x0 = CANVAS.pivotX - Math.round(footNative), y0 = CANVAS.pivotY - bottom;
    const out = Buffer.alloc(CANVAS.width * CANVAS.height * 4);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const c = px[y * w + x], cx = x0 + x, cy = y0 + y;
      if (c < 0) continue;
      if (cx < 1 || cy < 1 || cx >= CANVAS.width - 1 || cy > CANVAS.pivotY) throw Error(`${id}/${pose}: ink leaves the canvas margin`);
      out.set([...RGB[c], 255], (cy * CANVAS.width + cx) * 4);
    }
    const file = `environment/elves/${id}/${pose}.png`, png = await sharp(out, {raw: {width: CANVAS.width, height: CANVAS.height, channels: 4}}).png().toBuffer();
    await fs.writeFile(path.join(root, file), png);
    frames.push({file, sourceRect: rect, footX, size: [w, h], offset: [x0, y0], sha256: sha256(png)});
  }
  return {id, master: source.master, masterSha256: sha256(master), ...(source.grid ? {grids} : {scale: source.scale}), canvas: CANVAS, frames};
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const elves = [];
  for (const id of Object.keys(ELF_SOURCES)) elves.push(await buildElf(id));
  const file = path.join(root, 'environment/elves/provenance.json');
  const provenance = JSON.parse(await fs.readFile(file, 'utf8'));
  provenance.export = {tool: 'build-elf-art.mjs', method: 'grid masters: block-grid phase search, centre-mode colour per block, palette24; illustration masters: area average, colours < 0.6 % merged, lone pixels absorbed, #231F2E rim', elves};
  await fs.writeFile(file, JSON.stringify(provenance, null, 2) + '\n');
  console.log(elves.map((e) => `${e.id}: ${e.frames.map((f) => f.size.join('×')).join(' ')} ${e.grids ?? ''}`).join('\n'));
}
