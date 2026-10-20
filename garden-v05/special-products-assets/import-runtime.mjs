#!/usr/bin/env node
// Imports the 30 «Sản phẩm đặc biệt» into the runtime decor route: copies only the native PNGs the game
// draws into ../decor-assets/native/ and writes their entries into ../decor-assets-manifest.json in the
// existing runtime schema (file/frames/durations/rightFile/rightFrames/pivotX/pivotY, bounds measured from
// the PNG alpha). Masters, thumbnails, sheets, QA, prompts and logs stay here and never ship.
//   node garden-v05/special-products-assets/import-runtime.mjs
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const game = path.resolve(here, '..');
const source = JSON.parse(fs.readFileSync(path.join(here, 'manifest.json'), 'utf8'));
const runtimePath = path.join(game, 'decor-assets-manifest.json');
const runtime = JSON.parse(fs.readFileSync(runtimePath, 'utf8'));

// Alpha bounding box of an 8-bit RGBA, non-interlaced PNG (what the asset build exports).
export function alphaBounds(file) {
  const png = fs.readFileSync(file);
  const width = png.readUInt32BE(16), height = png.readUInt32BE(20);
  if (png[24] !== 8 || png[25] !== 6 || png[28] !== 0) throw new Error(`${file}: expected 8-bit RGBA, not interlaced`);
  const chunks = [];
  for (let at = 8; at < png.length;) {
    const length = png.readUInt32BE(at), type = png.toString('ascii', at + 4, at + 8);
    if (type === 'IDAT') chunks.push(png.subarray(at + 8, at + 8 + length));
    at += length + 12;
  }
  const raw = zlib.inflateSync(Buffer.concat(chunks)), stride = width * 4;
  const rows = [];
  let previous = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)], line = Buffer.from(raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)));
    for (let i = 0; i < stride; i++) {
      const a = i >= 4 ? line[i - 4] : 0, b = previous[i], c = i >= 4 ? previous[i - 4] : 0;
      const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
      line[i] = (line[i] + [0, a, b, (a + b) >> 1, pa <= pb && pa <= pc ? a : pb <= pc ? b : c][filter]) & 255;
    }
    rows.push(line);
    previous = line;
  }
  let left = width, top = height, right = -1, bottom = -1;
  rows.forEach((line, y) => { for (let x = 0; x < width; x++) if (line[x * 4 + 3]) { left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y); } });
  return {width, height, x: left, y: top, w: right - left + 1, h: bottom - top + 1};
}

// Union over the base image and every frame of one view, so a lit frame never pokes past the hit box.
function viewBounds(files, item) {
  const boxes = files.map(file => alphaBounds(path.join(here, file)));
  for (const box of boxes) if (box.width !== item.width || box.height !== item.height) throw new Error(`${item.id}: canvas ${box.width}×${box.height} ≠ manifest ${item.width}×${item.height}`);
  const x = Math.min(...boxes.map(b => b.x)), y = Math.min(...boxes.map(b => b.y));
  return {x, y, w: Math.max(...boxes.map(b => b.x + b.w)) - x, h: Math.max(...boxes.map(b => b.y + b.h)) - y};
}

const runtimeFile = file => `decor-assets/${file}`;
const entries = source.items.map(item => {
  for (const file of [item.defaultFile, item.rightFile, ...item.defaultFrames, ...item.rightFrames]) {
    fs.copyFileSync(path.join(here, file), path.join(game, 'decor-assets', file));
  }
  return {
    id: item.id,
    kind: 'decor',
    collection: 'special',
    storeItem: true,
    rotatable: true,
    label: item.label,
    group: item.group,
    file: runtimeFile(item.defaultFile),
    frames: item.defaultFrames.map(runtimeFile),
    durations: [...item.durationsMs],
    rightFile: runtimeFile(item.rightFile),
    rightFrames: item.rightFrames.map(runtimeFile),
    rightBounds: viewBounds([item.rightFile, ...item.rightFrames], item),
    angles: ['default', 'right'],
    width: item.width,
    height: item.height,
    pivotX: item.pivot.x,
    pivotY: item.pivot.y,
    bounds: viewBounds([item.defaultFile, ...item.defaultFrames], item),
    footprintTiles: [...item.footprintTiles],
    motion: item.motion,
    framesIdentical: item.framesIdentical,
    bookReference: {book: item.bookReference.book, chapter: item.bookReference.chapter},
    lore: item.bookReference.lore,
    nativeSha256: item.pngSha256[item.defaultFile],
  };
});
runtime.items = [...runtime.items.filter(item => item.collection !== 'special'), ...entries];
fs.writeFileSync(runtimePath, `${JSON.stringify(runtime, null, 2)}\n`);
console.log(`special products: ${entries.length} items, ${entries.length * 10} PNGs → decor-assets/native`);
