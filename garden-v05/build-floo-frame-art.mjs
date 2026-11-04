// Export the Floo level-frame art (25.0 S5) from its Codex masters into small WebP files for HPVNN
// (client/public/images/floo-items/hagrid-level/). Each 512 px cell is area-averaged so its ink fits the target size,
// mapped to palette24 and tidied like the gia tinh (build-elf-art.mjs); a band corner also gets its 180° turn for the
// bubble's bottom-right. Usage: node garden-v05/build-floo-frame-art.mjs <HPVNN client/public/images/floo-items/hagrid-level>
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {RGB, sha256, sharp, shrink, tidy} from './build-elf-art.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const CELL = 512;
const M = 'environment/floo-frames/masters/';
// [master, [name, size, canvas width] per cell in order]; a band corner fits 22 × 22, the star 11 (on a 12 px tile, no
// extra rim: at that size the rim would eat it), the badge 32.
const corner = (n) => [`band-${n}`, 22, 22];
const SHEETS = [
  [M + 'level-frames-a.png', [1, 2, 3, 4, 5, 6].map(corner)],
  [M + 'level-frames-b.png', [...[7, 8, 9, 10].map(corner), ['star', 11, 12], ['badge-500', 32, 32]]],
];

// Ink box of a cell: rows and columns with at least 4 solid pixels (Codex leaves a soft halo and stray dots).
function ink(data, W, left, top) {
  const cols = new Array(CELL).fill(0), rows = new Array(CELL).fill(0);
  for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++) if (data[((top + y) * W + left + x) * 4 + 3] >= 230) { cols[x]++; rows[y]++; }
  // The longest unbroken run: a neighbour cell's item may poke over the cell edge.
  const span = (counts) => {
    let best = [0, -1], start = -1;
    counts.forEach((c, i) => {
      if (c >= 4) { if (start < 0) start = i; if (i - start > best[1] - best[0]) best = [start, i]; } else start = -1;
    });
    return best;
  };
  const [x0, x1] = span(cols), [y0, y1] = span(rows);
  return {x0, y0, w: x1 - x0 + 1, h: y1 - y0 + 1};
}

const out = process.argv[2];
if (!out) throw Error('usage: node build-floo-frame-art.mjs <out dir>');
await fs.mkdir(out, {recursive: true});
await fs.mkdir(path.join(root, 'environment/floo-frames/masters/native'), {recursive: true});
const files = [];
for (const [master, items] of SHEETS) {
  const bytes = await fs.readFile(path.join(root, master));
  const {data, info} = await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject: true});
  for (const [index, [name, size, width]] of items.entries()) {
    const left = (index % 3) * CELL, top = Math.floor(index / 3) * CELL, box = ink(data, info.width, left, top);
    const scale = size / Math.max(box.w, box.h), {px: raw, n} = shrink(data, info.width, left, top, scale), px = name === 'star' ? raw : tidy(raw, n);
    const sx = Math.floor(box.x0 * scale), sy = Math.floor(box.y0 * scale), rgba = Buffer.alloc(width * size * 4);
    for (let y = 0; y < size; y++) for (let x = 0; x < Math.min(size, width); x++) {
      const c = px[(sy + y) * n + sx + x];
      if (sy + y < n && sx + x < n && c >= 0) rgba.set([...RGB[c], 255], (y * width + x) * 4);
    }
    const raw4 = {raw: {width, height: size, channels: 4}};
    const variants = [[name, sharp(rgba, raw4)], ...(name.startsWith('band-') ? [[`${name}-end`, sharp(rgba, raw4).rotate(180)]] : [])];
    for (const [file, image] of variants) {
      const webp = await image.webp({lossless: true, exact: true}).toBuffer();
      await fs.writeFile(path.join(out, `${file}.webp`), webp);
      files.push({file: `${file}.webp`, size: webp.length, sha256: sha256(webp)});
    }
    await fs.writeFile(path.join(root, `environment/floo-frames/masters/native/${name}.png`), await sharp(rgba, raw4).png().toBuffer()); // review copy
  }
}
await fs.writeFile(path.join(root, 'environment/floo-frames/provenance.json'), JSON.stringify({tool: 'build-floo-frame-art.mjs',
  masters: await Promise.all(SHEETS.map(async ([m]) => ({master: m, sha256: sha256(await fs.readFile(path.join(root, m)))}))), files}, null, 2) + '\n');
console.log(files.map((f) => `${f.file} ${f.size} B`).join('\n'));
