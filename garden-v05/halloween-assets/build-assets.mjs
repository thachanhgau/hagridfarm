#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let sharp;
try {
  sharp = require(process.env.SHARP_MODULE || 'sharp');
} catch {
  sharp = require('sharp');
}

// DECOR_PACK_DIR builds another pack with this pipeline (event-assets: «Mừng HPVN 2 tháng» statues).
const ROOT = process.env.DECOR_PACK_DIR ? path.resolve(process.env.DECOR_PACK_DIR) : path.dirname(fileURLToPath(import.meta.url));
const SPECS_FILE = path.join(ROOT, 'specs.json');
const ITEM_PALETTE_FILE = path.join(ROOT, 'item-palettes.json');
const MASTER_DIR = path.join(ROOT, 'masters');
const NATIVE_DIR = path.join(ROOT, 'native');
const SPRITESHEET_DIR = path.join(ROOT, 'spritesheets');
const THUMBNAIL_DIR = path.join(ROOT, 'thumbnails');
const QA_DIR = path.join(ROOT, 'qa');
const PARTIAL = process.argv.includes('--partial');
const ALPHA_THRESHOLD = 192;
const FRAME_COUNT = 4;
const EDGE_MARGIN = 2;
const DURATIONS = {
  glow: [520, 260, 480, 260],
  blink: [640, 180, 920, 180],
  sway: [520, 260, 520, 260],
  bubbles: [420, 220, 420, 220],
  static: [600, 300, 600, 300],
};

const hex = (value) => value.toUpperCase();
const rgb = (value) => {
  const color = value.replace('#', '');
  return [
    Number.parseInt(color.slice(0, 2), 16),
    Number.parseInt(color.slice(2, 4), 16),
    Number.parseInt(color.slice(4, 6), 16),
  ];
};
const colorKey = (r, g, b) => (r << 16) | (g << 8) | b;

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const rel = (file) => path.relative(ROOT, file).split(path.sep).join('/');
const writeJson = (file, value) => fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`);

function boundsOf(data, width, height, threshold = ALPHA_THRESHOLD) {
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;
  let count = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * 4 + 3] < threshold) continue;
      count += 1;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }
  return count === 0
    ? null
    : { x: left, y: top, w: right - left + 1, h: bottom - top + 1, count };
}

function crop(data, width, height, x0, cropWidth) {
  const result = Buffer.alloc(cropWidth * height * 4);
  for (let y = 0; y < height; y += 1) {
    const from = y * width * 4 + x0 * 4;
    const to = y * cropWidth * 4;
    data.copy(result, to, from, from + cropWidth * 4);
  }
  return { data: result, width: cropWidth, height };
}

// Generated views may be unequally centered. Split inside the transparent gap
// so neither view loses pixels or inherits a fragment from its neighbor.
function splitMasterViews(master, itemId) {
  const columns = new Uint32Array(master.width);
  for (let y = 0; y < master.height; y += 1) {
    for (let x = 0; x < master.width; x += 1) {
      if (master.data[(y * master.width + x) * 4 + 3] >= ALPHA_THRESHOLD) columns[x] += 1;
    }
  }
  const gaps = [];
  const lo = Math.floor(master.width * 0.35);
  const hi = Math.ceil(master.width * 0.65);
  for (let x = lo; x < hi; x += 1) {
    if (columns[x]) continue;
    const start = x;
    while (x + 1 < hi && !columns[x + 1]) x += 1;
    gaps.push({ start, end: x });
  }
  const center = master.width / 2;
  const distance = (gap) => Math.max(gap.start - center, center - gap.end, 0);
  gaps.sort((a, b) => distance(a) - distance(b) || (b.end - b.start) - (a.end - a.start));
  if (!gaps.length) throw new Error(`${itemId}: no transparent central gap separates the two master views`);
  const gap = gaps[0];
  const splitX = Math.floor((gap.start + gap.end + 1) / 2);
  return {
    left: crop(master.data, master.width, master.height, 0, splitX),
    right: crop(master.data, master.width, master.height, splitX, master.width - splitX),
    splitX,
    gap,
  };
}

function sampleOpaquePixel(view, x, y) {
  const centerX = Math.round(x);
  const centerY = Math.round(y);
  let best = null;
  for (let radius = 0; radius <= 2; radius += 1) {
    for (let yy = centerY - radius; yy <= centerY + radius; yy += 1) {
      for (let xx = centerX - radius; xx <= centerX + radius; xx += 1) {
        if (xx < 0 || yy < 0 || xx >= view.width || yy >= view.height) continue;
        const index = (yy * view.width + xx) * 4;
        const alpha = view.data[index + 3];
        if (!best || alpha > best.alpha) {
          best = {
            alpha,
            r: view.data[index],
            g: view.data[index + 1],
            b: view.data[index + 2],
          };
        }
      }
    }
    if (best?.alpha >= ALPHA_THRESHOLD) return best;
  }
  return best;
}

function nearestPalette(r, g, b, palette) {
  let best = palette[0];
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const candidate of palette) {
    const [pr, pg, pb] = rgb(candidate);
    const distance = (r - pr) ** 2 * 2 + (g - pg) ** 2 * 3 + (b - pb) ** 2;
    if (distance < bestDistance) {
      best = candidate;
      bestDistance = distance;
    }
  }
  return rgb(best);
}

function renderNearest(view, item, palette) {
  const sourceBounds = boundsOf(view.data, view.width, view.height);
  if (!sourceBounds) throw new Error(`${item.id}: ${view.angle} view has no opaque pixels`);

  const gridFit = item.inkMax;
  const maxWidth = gridFit?.[0] ?? item.w - EDGE_MARGIN * 2 - 2;
  const maxHeight = gridFit?.[1] ?? item.h - EDGE_MARGIN * 2 - 2;
  const scale = Math.min(maxWidth / sourceBounds.w, maxHeight / sourceBounds.h);
  const drawWidth = Math.max(1, Math.round(sourceBounds.w * scale));
  const drawHeight = Math.max(1, Math.round(sourceBounds.h * scale));
  const pivotX = Math.floor(item.w / 2);
  const pivotY = gridFit ? item.h - 16 : item.h - EDGE_MARGIN - 2;
  const originX = Math.round(pivotX - drawWidth / 2);
  const originY = pivotY - drawHeight;
  if (
    originX < EDGE_MARGIN ||
    originY < EDGE_MARGIN ||
    originX + drawWidth > item.w - EDGE_MARGIN ||
    originY + drawHeight > item.h - EDGE_MARGIN
  ) {
    throw new Error(`${item.id}: ${view.angle} view cannot fit inside its native canvas`);
  }

  const output = Buffer.alloc(item.w * item.h * 4);
  for (let y = 0; y < drawHeight; y += 1) {
    for (let x = 0; x < drawWidth; x += 1) {
      const sourceX = sourceBounds.x + ((x + 0.5) * sourceBounds.w) / drawWidth - 0.5;
      const sourceY = sourceBounds.y + ((y + 0.5) * sourceBounds.h) / drawHeight - 0.5;
      const pixel = sampleOpaquePixel(view, sourceX, sourceY);
      if (!pixel || pixel.alpha < ALPHA_THRESHOLD) continue;
      const [r, g, b] = nearestPalette(pixel.r, pixel.g, pixel.b, palette);
      const index = ((originY + y) * item.w + originX + x) * 4;
      output[index] = r;
      output[index + 1] = g;
      output[index + 2] = b;
      output[index + 3] = 255;
    }
  }
  return {
    data: output,
    width: item.w,
    height: item.h,
    pivotX,
    pivotY,
    sourceBounds,
  };
}

function inspectOutput(view, paletteSet, itemPaletteSet, itemId, angle) {
  let partialAlpha = false;
  let outsidePalette = false;
  let outsideItemPalette = false;
  let edgeContact = false;
  for (let y = 0; y < view.height; y += 1) {
    for (let x = 0; x < view.width; x += 1) {
      const index = (y * view.width + x) * 4;
      const alpha = view.data[index + 3];
      if (alpha !== 0 && alpha !== 255) partialAlpha = true;
      if (alpha !== 255) continue;
      if (!paletteSet.has(colorKey(view.data[index], view.data[index + 1], view.data[index + 2]))) {
        outsidePalette = true;
      }
      if (!itemPaletteSet.has(colorKey(view.data[index], view.data[index + 1], view.data[index + 2]))) {
        outsideItemPalette = true;
      }
      if (x < EDGE_MARGIN || y < EDGE_MARGIN || x >= view.width - EDGE_MARGIN || y >= view.height - EDGE_MARGIN) {
        edgeContact = true;
      }
    }
  }
  const bounds = boundsOf(view.data, view.width, view.height, 255);
  if (!bounds) throw new Error(`${itemId}: ${angle} output is empty`);
  if (partialAlpha) throw new Error(`${itemId}: ${angle} output has non-binary alpha`);
  if (outsidePalette) throw new Error(`${itemId}: ${angle} output contains a color outside the spec palette`);
  if (outsideItemPalette) throw new Error(`${itemId}: ${angle} output contains a color outside its item palette subset`);
  if (edgeContact) throw new Error(`${itemId}: ${angle} output touches its native edge`);
  return {
    bounds,
    alphaBinary: true,
    paletteOnly: true,
    itemPaletteOnly: true,
    edgeClipped: false,
  };
}

const GLOW_LIGHT_TARGETS = new Map([
  ['#ED8A45', '#FFC36B'],
  ['#FFC36B', '#F5D69A'],
  ['#F5D69A', '#FFC36B'],
  ['#70A8B6', '#B7DEE0'],
  ['#B7DEE0', '#70A8B6'],
  ['#6961A6', '#B7DEE0'],
]);
const GLOW_DIM_TARGETS = new Map([
  ['#F5D69A', '#FFC36B'],
  ['#FFC36B', '#ED8A45'],
  ['#B7DEE0', '#70A8B6'],
  ['#70A8B6', '#6961A6'],
  ['#6961A6', '#3E3B70'],
]);

function buildGlowMaps(palette) {
  const allowed = new Set(palette.map((value) => colorKey(...rgb(value))));
  const build = (targets) => {
    const map = new Map();
    for (const [source, target] of targets) {
      const sourceKey = colorKey(...rgb(source));
      if (!allowed.has(sourceKey)) continue;
      const replacement = nearestPalette(...rgb(target), palette);
      if (colorKey(...replacement) !== sourceKey) map.set(sourceKey, replacement);
    }
    return map;
  };
  const light = build(GLOW_LIGHT_TARGETS);
  const dim = build(GLOW_DIM_TARGETS);
  return { light, dim, keys: new Set([...light.keys(), ...dim.keys()]) };
}

function findGlowTarget(base, width, height, glowMaps) {
  const rootBand = Math.floor(height * 0.75);
  const visited = new Uint8Array(width * height);
  const components = [];
  for (let y = 0; y < rootBand; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const start = y * width + x;
      const startIndex = start * 4;
      const startKey = colorKey(base[startIndex], base[startIndex + 1], base[startIndex + 2]);
      if (visited[start] || base[startIndex + 3] !== 255 || !glowMaps.keys.has(startKey)) continue;
      const queue = [start];
      const pixels = [];
      visited[start] = 1;
      while (queue.length) {
        const current = queue.pop();
        const cx = current % width;
        const cy = Math.floor(current / width);
        const index = current * 4;
        const key = colorKey(base[index], base[index + 1], base[index + 2]);
        pixels.push({ x: cx, y: cy, key });
        for (const [nx, ny] of [[cx - 1, cy], [cx + 1, cy], [cx, cy - 1], [cx, cy + 1]]) {
          if (nx < 0 || ny < 0 || nx >= width || ny >= rootBand) continue;
          const next = ny * width + nx;
          if (visited[next]) continue;
          const nextIndex = next * 4;
          const nextKey = colorKey(base[nextIndex], base[nextIndex + 1], base[nextIndex + 2]);
          if (base[nextIndex + 3] !== 255 || !glowMaps.keys.has(nextKey)) continue;
          visited[next] = 1;
          queue.push(next);
        }
      }
      const mappableCount = pixels.filter(({ key }) => glowMaps.light.has(key) || glowMaps.dim.has(key)).length;
      if (!mappableCount) continue;
      const componentBounds = pixels.reduce((result, pixel) => ({
        left: Math.min(result.left, pixel.x),
        top: Math.min(result.top, pixel.y),
        right: Math.max(result.right, pixel.x),
        bottom: Math.max(result.bottom, pixel.y),
      }), { left: width, top: height, right: -1, bottom: -1 });
      components.push({
        pixels,
        mappableCount,
        averageLuma: pixels.reduce((sum, { key }) => {
          const [r, g, b] = [key >> 16, (key >> 8) & 0xff, key & 0xff];
          return sum + r + g + b;
        }, 0) / (pixels.length * 3),
        bbox: {
          x: componentBounds.left,
          y: componentBounds.top,
          w: componentBounds.right - componentBounds.left + 1,
          h: componentBounds.bottom - componentBounds.top + 1,
        },
      });
    }
  }
  const opaque = boundsOf(base, width, height, 255);
  const maxPixels = Math.max(4, Math.floor((opaque?.count || 0) * 0.12));
  const candidates = components.filter((component) => component.pixels.length <= maxPixels);
  candidates.sort((a, b) => b.mappableCount - a.mappableCount || b.pixels.length - a.pixels.length || b.averageLuma - a.averageLuma);
  const selected = candidates[0];
  return selected
    ? { ...selected, maxPixels, rootBand }
    : null;
}

function motionPlan(base, item, palette) {
  const requested = item.motion || 'static';
  if (requested !== 'glow') {
    return {
      requested,
      rendered: 'static',
      fallback: 'No explicit motion mask is present; four exported poses remain identical.',
      effect: null,
    };
  }
  const glowMaps = buildGlowMaps(palette);
  const effect = findGlowTarget(base, item.w, item.h, glowMaps);
  if (!effect) {
    return {
      requested,
      rendered: 'static',
      fallback: 'No small connected bright component is safe to animate; four exported poses remain identical.',
      effect: null,
    };
  }
  return { requested, rendered: 'glow', fallback: null, effect, glowMaps };
}

function applyGlow(base, width, frame, effect, glowMaps) {
  if (!effect || frame === 0 || frame === 3) return Buffer.from(base);
  const output = Buffer.from(base);
  const map = frame === 1 ? glowMaps.light : glowMaps.dim;
  for (const { x, y, key } of effect.pixels) {
    const replacement = map.get(key);
    if (!replacement) continue;
    const index = (y * width + x) * 4;
    output[index] = replacement[0];
    output[index + 1] = replacement[1];
    output[index + 2] = replacement[2];
  }
  return output;
}

function frameFor(base, item, plan, frame) {
  if (plan.rendered === 'glow') return applyGlow(base, item.w, frame, plan.effect, plan.glowMaps);
  return Buffer.from(base);
}

function serializableMotionPlan(plan) {
  return {
    requested: plan.requested,
    rendered: plan.rendered,
    fallback: plan.fallback,
    effect: plan.effect
      ? {
        bbox: plan.effect.bbox,
        pixelCount: plan.effect.pixels.length,
        mappableCount: plan.effect.mappableCount,
        maxPixels: plan.effect.maxPixels,
        rootBand: plan.effect.rootBand,
      }
      : null,
  };
}

function rootedAlphaEqual(base, frame, width, height) {
  const rootBand = Math.floor(height * 0.75);
  for (let y = rootBand; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const baseAlpha = base[(y * width + x) * 4 + 3];
      const frameAlpha = frame[(y * width + x) * 4 + 3];
      if (baseAlpha !== frameAlpha) return false;
    }
  }
  return true;
}

async function readMaster(file) {
  const rendered = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (rendered.info.channels !== 4) throw new Error(`${rel(file)}: expected RGBA master`);
  return { data: rendered.data, width: rendered.info.width, height: rendered.info.height };
}

async function writePng(file, view) {
  await sharp(view.data, { raw: { width: view.width, height: view.height, channels: 4 } })
    .png()
    .toFile(file);
}

function scaledNearest(view, scale) {
  const width = view.width * scale;
  const height = view.height * scale;
  const output = Buffer.alloc(width * height * 4);
  for (let y = 0; y < view.height; y += 1) {
    for (let x = 0; x < view.width; x += 1) {
      const sourceIndex = (y * view.width + x) * 4;
      if (view.data[sourceIndex + 3] === 0) continue;
      for (let yy = 0; yy < scale; yy += 1) {
        for (let xx = 0; xx < scale; xx += 1) {
          const targetIndex = ((y * scale + yy) * width + x * scale + xx) * 4;
          output[targetIndex] = view.data[sourceIndex];
          output[targetIndex + 1] = view.data[sourceIndex + 1];
          output[targetIndex + 2] = view.data[sourceIndex + 2];
          output[targetIndex + 3] = 255;
        }
      }
    }
  }
  return { data: output, width, height };
}

async function writeSpriteSheet(file, item, defaultFrames, rightFrames) {
  const width = item.w * FRAME_COUNT;
  const height = item.h * 2;
  const output = Buffer.alloc(width * height * 4);
  for (const [row, frames] of [defaultFrames, rightFrames].entries()) {
    frames.forEach((frame, column) => {
      for (let y = 0; y < item.h; y += 1) {
        const sourceStart = y * item.w * 4;
        const targetStart = ((row * item.h + y) * width + column * item.w) * 4;
        frame.copy(output, targetStart, sourceStart, sourceStart + item.w * 4);
      }
    });
  }
  await writePng(file, { data: output, width, height });
}

function blitNative(target, targetWidth, targetHeight, source, sourceWidth, sourceHeight, x0, y0) {
  for (let y = 0; y < sourceHeight; y += 1) {
    for (let x = 0; x < sourceWidth; x += 1) {
      const sourceIndex = (y * sourceWidth + x) * 4;
      if (source[sourceIndex + 3] === 0) continue;
      const targetX = x0 + x;
      const targetY = y0 + y;
      if (targetX < 0 || targetY < 0 || targetX >= targetWidth || targetY >= targetHeight) continue;
      const targetIndex = (targetY * targetWidth + targetX) * 4;
      target[targetIndex] = source[sourceIndex];
      target[targetIndex + 1] = source[sourceIndex + 1];
      target[targetIndex + 2] = source[sourceIndex + 2];
      target[targetIndex + 3] = 255;
    }
  }
}

async function writeContactSheet(records, background) {
  const columns = 5;
  const cardWidth = 480;
  const cardHeight = 300;
  const halfWidth = cardWidth / 2;
  const rows = Math.max(1, Math.ceil(records.length / columns));
  const width = columns * cardWidth;
  const height = rows * cardHeight;
  const output = Buffer.alloc(width * height * 4);
  const [r, g, b] = rgb(background);
  for (let index = 0; index < width * height; index += 1) {
    output[index * 4] = r;
    output[index * 4 + 1] = g;
    output[index * 4 + 2] = b;
    output[index * 4 + 3] = 255;
  }
  records.forEach((record, index) => {
    const cardX = (index % columns) * cardWidth;
    const cardY = Math.floor(index / columns) * cardHeight;
    if (record.width > halfWidth || record.height > cardHeight - 16) {
      throw new Error(`${record.id}: native sprite does not fit the exact-1x contact-sheet card`);
    }
    const y = cardY + cardHeight - record.height - 8;
    const defaultX = cardX + Math.floor((halfWidth - record.width) / 2);
    const alternateX = cardX + halfWidth + Math.floor((halfWidth - record.width) / 2);
    blitNative(output, width, height, record.defaultView.data, record.width, record.height, defaultX, y);
    blitNative(output, width, height, record.rightView.data, record.width, record.height, alternateX, y);
  });
  const file = path.join(QA_DIR, 'contact-sheet.png');
  await writePng(file, { data: output, width, height });
  return rel(file);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[character]));
}

function previewHtml(records, status, missing, collection) {
  const data = records.map((record) => ({
    id: record.id,
    label: record.label,
    group: record.group,
    requestedMotion: record.motionRequested,
    renderedMotion: record.motionRendered,
    framesIdentical: record.framesIdentical,
    foot: record.foot,
    width: record.width,
    height: record.height,
    subject: record.subject,
    bookReference: record.bookReference,
    designAdaptation: record.designAdaptation,
    defaultFile: record.defaultFile,
    rightFile: record.rightFile,
    defaultFrames: record.defaultFrames,
    rightFrames: record.rightFrames,
  }));
  const missingText = missing.length ? `<p class="missing">Missing masters: ${missing.join(', ')}</p>` : '';
  return `<!doctype html>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Hagrid Farm decoration asset preview</title>
<style>
  :root { color-scheme: dark; font: 14px/1.4 system-ui, sans-serif; background: #231F2E; color: #D6D8BF; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: clamp(12px, 4vw, 20px); background: #231F2E; overflow-x: hidden; }
  body[data-time="dusk"] .stage { filter: saturate(.86) brightness(.92); }
  body[data-time="night"] .stage { filter: saturate(.74) brightness(.72) hue-rotate(8deg); }
  h1 { margin: 0 0 6px; color: #F5D69A; overflow-wrap: anywhere; }
  .intro, .missing { max-width: 100%; overflow-wrap: anywhere; }
  .toolbar { display: flex; flex-wrap: wrap; gap: 6px; margin: 14px 0 18px; }
  button, label { border: 1px solid #735044; border-radius: 999px; padding: 6px 10px; background: #4A3042; color: #D6D8BF; cursor: pointer; }
  button:hover, label:hover { border-color: #FFC36B; }
  .missing { color: #FFC36B; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 360px), 1fr)); gap: 12px; }
  article { min-width: 0; width: 100%; border: 1px solid #735044; border-radius: 12px; padding: 10px; background: rgba(74,48,66,.76); }
  h2 { font-size: 15px; margin: 0 0 2px; color: #F5D69A; overflow-wrap: anywhere; }
  .meta, .lore { color: #A6B1AE; font-size: 12px; margin-bottom: 6px; overflow-wrap: anywhere; }
  .lore { color: #D6D8BF; }
  .stage { position: relative; display: flex; flex-wrap: wrap; justify-content: center; align-items: flex-end; min-height: 170px; gap: 16px; max-width: 100%; overflow: auto; background: #231F2E; border-radius: 8px; padding: 8px; }
  .stage::after { content: ""; position: absolute; inset: 0; pointer-events: none; z-index: 3; background: transparent; opacity: 0; mix-blend-mode: screen; }
  body[data-weather="rain"] .stage::after { background: #3E3B70; opacity: .22; }
  body[data-weather="fog"] .stage::after { background: #70A8B6; opacity: .16; }
  body[data-weather="snow"] .stage::after { background: #D6D8BF; opacity: .2; }
  figure { position: relative; z-index: 2; flex: 0 0 var(--native-w); width: var(--native-w); margin: 0; text-align: center; }
  figcaption { width: var(--native-w); color: #A6B1AE; font-size: 11px; overflow-wrap: anywhere; }
  img { display: block; width: var(--native-w); height: var(--native-h); max-width: none; object-fit: fill; image-rendering: pixelated; }
  body.zoom-2x .stage figure { flex-basis: var(--zoom-w); width: var(--zoom-w); }
  body.zoom-2x .stage figcaption { width: var(--zoom-w); }
  body.zoom-2x .stage img { width: var(--zoom-w); height: var(--zoom-h); }
  .reduced { margin-left: auto; }
  @media (max-width: 600px) { .grid { grid-template-columns: minmax(0, 1fr); } }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; } }
</style>
<h1>${escapeHtml(collection)} — ${status}</h1>
<p class="intro">Two real master views per item; native pixel dimensions are preserved at 1×. Frames are idle-only package previews.</p>
<div class="toolbar">
  <button data-weather="clear">Weather clear</button><button data-weather="rain">Weather rain</button><button data-weather="fog">Weather fog</button><button data-weather="snow">Weather snow</button>
  <button data-time="day">Time day</button><button data-time="dusk">Time dusk</button><button data-time="night">Time night</button>
  <button id="zoom">Zoom 1×</button><label class="reduced"><input id="reduce" type="checkbox"> reduced motion</label>
</div>
${missingText}<main class="grid" id="grid"></main>
<script>
const items = ${JSON.stringify(data)};
const grid = document.querySelector('#grid');
const reduced = document.querySelector('#reduce');
const active = new Map();
for (const item of items) {
  const card = document.createElement('article');
  card.innerHTML = '<h2></h2><div class="meta"></div><div class="lore"></div><div class="stage"><figure><img><figcaption>default</figcaption></figure><figure><img><figcaption>alternate</figcaption></figure></div>';
  card.querySelector('h2').textContent = item.label;
  const renderedMotion = Array.isArray(item.renderedMotion) ? item.renderedMotion.join('/') : item.renderedMotion;
  const motionLabel = item.framesIdentical ? 'static fallback' : item.requestedMotion + ' → ' + renderedMotion;
  card.querySelector('.meta').textContent = item.id + ' · ' + item.group + ' · foot ' + item.foot.join('×') + ' · ' + motionLabel;
  const ref = item.bookReference;
  card.querySelector('.lore').textContent = ref
    ? 'Quyển ' + ref.book + ' · Chương ' + ref.chapter + ' · ' + (ref.term || '') + ' · ' + (ref.lore || '')
    : 'Collection group: ' + item.group + (item.subject ? ' · ' + item.subject : '');
  if (item.designAdaptation) card.querySelector('.lore').textContent += ' · ' + item.designAdaptation;
  const stage = card.querySelector('.stage');
  stage.style.setProperty('--native-w', item.width + 'px');
  stage.style.setProperty('--native-h', item.height + 'px');
  stage.style.setProperty('--zoom-w', (item.width * 2) + 'px');
  stage.style.setProperty('--zoom-h', (item.height * 2) + 'px');
  const images = [...card.querySelectorAll('img')];
  images.forEach((image) => { image.width = item.width; image.height = item.height; });
  images[0].src = item.defaultFile;
  images[1].src = item.rightFile;
  images[0].alt = item.label + ' default';
  images[1].alt = item.label + ' alternate';
  active.set(card, { images, frames: [item.defaultFrames, item.rightFrames], index: 0 });
  grid.append(card);
}
function play() {
  const shouldReduce = reduced.checked || matchMedia('(prefers-reduced-motion: reduce)').matches;
  for (const state of active.values()) {
    state.index = shouldReduce ? 0 : (state.index + 1) % 4;
    state.images.forEach((image, view) => { image.src = state.frames[view][state.index]; });
  }
}
setInterval(play, 320);
document.querySelector('#zoom').onclick = (event) => {
  const zoomed = document.body.classList.toggle('zoom-2x');
  event.currentTarget.textContent = zoomed ? 'Zoom 2×' : 'Zoom 1×';
};
document.querySelectorAll('[data-weather]').forEach((button) => button.onclick = () => document.body.dataset.weather = button.dataset.weather);
document.querySelectorAll('[data-time]').forEach((button) => button.onclick = () => document.body.dataset.time = button.dataset.time);
</script>`;
}

async function main() {
  const specs = JSON.parse(await fs.readFile(SPECS_FILE, 'utf8'));
  const palette = [...new Set((specs.style.match(/#[0-9A-Fa-f]{6}/g) || []).map(hex))];
  if (palette.length !== 24) throw new Error(`specs.json must provide 24 palette colors; found ${palette.length}`);
  if (!Array.isArray(specs.items) || specs.items.length === 0) throw new Error('specs.json has no items');
  if (new Set(specs.items.map((item) => item.id)).size !== specs.items.length) throw new Error('specs.json contains duplicate item IDs');
  const paletteSet = new Set(palette.map((value) => colorKey(...rgb(value))));
  let paletteDocument = null;
  try {
    paletteDocument = JSON.parse(await fs.readFile(ITEM_PALETTE_FILE, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const itemPaletteById = new Map();
  for (const item of specs.items) {
    const configured = paletteDocument?.items?.find((entry) => entry.id === item.id);
    if (paletteDocument && !configured) throw new Error(`${item.id}: item-palettes.json has no palette entry`);
    const colors = (configured?.colors || palette).map(hex);
    const ramps = configured?.ramps || [];
    if (paletteDocument && (ramps.length !== 3 || colors.length !== 12)) {
      throw new Error(`${item.id}: expected exactly 3 ramps and 12 item-palette colors`);
    }
    if (colors.some((value) => !palette.includes(value))) {
      throw new Error(`${item.id}: item palette contains a color outside the global 24-color palette`);
    }
    if (paletteDocument) {
      const rampColors = [...new Set(ramps.flatMap((name) => paletteDocument.rampDefinitions?.[name] || []).map(hex))];
      if (rampColors.length !== colors.length || rampColors.some((value) => !colors.includes(value))) {
        throw new Error(`${item.id}: item palette colors do not match its declared ramps`);
      }
    }
    itemPaletteById.set(item.id, { ramps, colors });
  }
  const itemPaletteSha256 = paletteDocument ? sha256(await fs.readFile(ITEM_PALETTE_FILE)) : null;
  await fs.mkdir(NATIVE_DIR, { recursive: true });
  await fs.mkdir(SPRITESHEET_DIR, { recursive: true });
  await fs.mkdir(THUMBNAIL_DIR, { recursive: true });
  await fs.mkdir(QA_DIR, { recursive: true });

  const missing = [];
  const available = [];
  for (const item of specs.items) {
    const file = path.join(MASTER_DIR, `${item.id}.png`);
    try {
      await fs.access(file);
      available.push({ item, file });
    } catch {
      missing.push(item.id);
    }
  }
  if (!PARTIAL && missing.length) {
    throw new Error(`Missing ${missing.length} master(s). Use --partial only for an intentional partial package: ${missing.join(', ')}`);
  }
  if (available.length === 0 && !PARTIAL) throw new Error('No masters found under masters/');

  const records = [];
  const provenanceItems = [];
  const validationItems = [];
  for (const { item, file } of available) {
    const itemPalette = itemPaletteById.get(item.id);
    const itemPaletteSet = new Set(itemPalette.colors.map((value) => colorKey(...rgb(value))));
    const master = await readMaster(file);
    if (master.width < 2) throw new Error(`${rel(file)}: master must contain two horizontal views`);
    const split = splitMasterViews(master, item.id);
    const leftSource = split.left;
    const rightSource = split.right;
    const sourceLeftBounds = boundsOf(leftSource.data, leftSource.width, leftSource.height);
    const sourceRightBounds = boundsOf(rightSource.data, rightSource.width, rightSource.height);
    if (!sourceLeftBounds || !sourceRightBounds) throw new Error(`${item.id}: both master halves must contain opaque pixels`);

    const defaultView = renderNearest({ ...leftSource, angle: 'default' }, { ...item, angle: 'default' }, itemPalette.colors);
    const rightView = renderNearest({ ...rightSource, angle: 'alternate' }, { ...item, angle: 'alternate' }, itemPalette.colors);
    const defaultRawHash = sha256(defaultView.data);
    const rightRawHash = sha256(rightView.data);
    if (defaultRawHash === rightRawHash) throw new Error(`${item.id}: alternate view is byte-identical to default view; provide a real alternate view`);

    const views = [
      { key: 'default', view: defaultView, right: false },
      { key: 'alternate', view: rightView, right: true },
    ];
    const outputFiles = {};
    const frameFiles = {};
    const frameBuffers = {};
    const motionPlans = {};
    const validation = { id: item.id, dimensions: { width: item.w, height: item.h }, views: {} };
    for (const { key, view, right } of views) {
      const stem = right ? `${item.id}_right` : item.id;
      const baseFile = path.join(NATIVE_DIR, `${stem}.png`);
      await writePng(baseFile, view);
      const baseCheck = inspectOutput(view, paletteSet, itemPaletteSet, item.id, key);
      const plan = motionPlan(view.data, item, itemPalette.colors);
      const frames = [];
      const frameChecks = [];
      const buffers = [];
      for (let frame = 0; frame < FRAME_COUNT; frame += 1) {
        const buffer = frameFor(view.data, item, plan, frame);
        const frameView = { data: buffer, width: item.w, height: item.h };
        const frameFile = path.join(NATIVE_DIR, `${stem}_f${frame}.png`);
        await writePng(frameFile, frameView);
        const check = inspectOutput(frameView, paletteSet, itemPaletteSet, item.id, `${key} frame ${frame}`);
        if (!rootedAlphaEqual(view.data, buffer, item.w, item.h)) {
          throw new Error(`${item.id}: ${key} frame ${frame} moves the grounded bottom quarter`);
        }
        frames.push(rel(frameFile));
        buffers.push(buffer);
        frameChecks.push({ ...check, rootedBottomQuarter: true });
      }
      outputFiles[key] = rel(baseFile);
      frameFiles[key] = frames;
      frameBuffers[key] = buffers;
      motionPlans[key] = plan;
      validation.views[key] = {
        base: { ...baseCheck, bounds: baseCheck.bounds },
        frames: frameChecks,
        motion: serializableMotionPlan(plan),
        framesIdentical: new Set(buffers.map((buffer) => sha256(buffer))).size === 1,
      };
    }

    const spriteSheetFile = path.join(SPRITESHEET_DIR, `${item.id}.png`);
    await writeSpriteSheet(spriteSheetFile, item, frameBuffers.default, frameBuffers.alternate);
    const thumbnailFiles = { '2x': {}, '3x': {} };
    for (const scale of [2, 3]) {
      const scaleKey = `${scale}x`;
      for (const [key, view] of [['default', defaultView], ['alternate', rightView]]) {
        const stem = key === 'alternate' ? `${item.id}_right` : item.id;
        const thumbnailFile = path.join(THUMBNAIL_DIR, scaleKey, `${stem}.png`);
        await fs.mkdir(path.dirname(thumbnailFile), { recursive: true });
        await writePng(thumbnailFile, scaledNearest(view, scale));
        thumbnailFiles[scaleKey][key] = rel(thumbnailFile);
      }
    }

    const sourceSha256 = await sha256(await fs.readFile(file));
    const pngHashes = {};
    const generatedFiles = [
      ...Object.values(outputFiles),
      ...Object.values(frameFiles).flat(),
      rel(spriteSheetFile),
      ...Object.values(thumbnailFiles).flatMap((group) => Object.values(group)),
    ];
    for (const fileName of generatedFiles) {
      pngHashes[fileName] = await sha256(await fs.readFile(path.join(ROOT, fileName)));
    }
    const renderedMotions = Object.values(motionPlans).map((plan) => plan.rendered);
    const allFramesIdentical = Object.values(validation.views).every((view) => view.framesIdentical);
    const record = {
      id: item.id,
      label: item.label,
      group: item.group,
      subject: item.subject,
      designAdaptation: item.designAdaptation,
      motion: item.motion,
      motionRequested: item.motion || 'static',
      motionRendered: renderedMotions,
      motionPlan: Object.fromEntries(Object.entries(motionPlans).map(([key, plan]) => [key, serializableMotionPlan(plan)])),
      framesIdentical: allFramesIdentical,
      motionNote: allFramesIdentical
        ? `Requested ${item.motion || 'static'}; four exported idle poses are intentionally identical because no safe semantic motion mask is available.`
        : 'Localized glow is limited to a connected bright component above the grounded quarter.',
      animationScope: 'idle-only',
      palette: { ramps: itemPalette.ramps, colors: itemPalette.colors },
      bookReference: item.book && item.chapter
        ? { book: item.book, chapter: item.chapter, term: item.term, lore: item.lore }
        : null,
      footprintTiles: item.foot,
      width: item.w,
      height: item.h,
      pivot: { x: defaultView.pivotX, y: defaultView.pivotY },
      defaultFile: outputFiles.default,
      rightFile: outputFiles.alternate,
      defaultFrames: frameFiles.default,
      rightFrames: frameFiles.alternate,
      spriteSheet: rel(spriteSheetFile),
      thumbnails: thumbnailFiles,
      durationsMs: DURATIONS[renderedMotions.includes('glow') ? 'glow' : 'static'],
      source: `masters/${item.id}.png`,
      sourceSha256,
      pngSha256: pngHashes,
      defaultView: { data: defaultView.data, width: defaultView.width, height: defaultView.height },
      rightView: { data: rightView.data, width: rightView.width, height: rightView.height },
      frameBuffers,
    };
    records.push(record);
    provenanceItems.push({
      id: item.id,
      source: record.source,
      sourceSha256,
      sourceCanvas: {
        width: master.width,
        height: master.height,
        splitX: split.splitX,
        transparentGap: split.gap,
        defaultWidth: leftSource.width,
        alternateWidth: rightSource.width,
        discardedCenterColumns: 0,
      },
      sourceViews: { default: sourceLeftBounds, alternate: sourceRightBounds },
      palette: { ramps: itemPalette.ramps, colors: itemPalette.colors },
      motionPlans: Object.fromEntries(Object.entries(motionPlans).map(([key, plan]) => [key, serializableMotionPlan(plan)])),
      outputs: pngHashes,
    });
    validationItems.push({
      ...validation,
      palette: { ramps: itemPalette.ramps, colors: itemPalette.colors },
      twoViews: { present: true, rawHashesDiffer: true },
      motion: {
        requested: item.motion || 'static',
        rendered: renderedMotions,
        frameCount: FRAME_COUNT,
        framesIdentical: allFramesIdentical,
        rootedBottomQuarter: true,
      },
      exports: { spriteSheet: rel(spriteSheetFile), thumbnails: thumbnailFiles },
    });
  }

  const contactSheet = await writeContactSheet(records, palette[0]);
  const specsSha256 = sha256(await fs.readFile(SPECS_FILE));
  const status = missing.length ? 'partial' : 'complete';
  const manifest = {
    schema: 'hagrid-farm.decor-assets.v1',
    collection: specs.collection,
    version: specs.version,
    status,
    expectedItemCount: specs.items.length,
    packagedItemCount: records.length,
    missing,
    palette,
    itemPaletteSource: paletteDocument ? 'item-palettes.json' : null,
    alphaThreshold: ALPHA_THRESHOLD,
    nativeCanvas: 'per-item dimensions from specs.json; RGBA, binary alpha',
    views: { default: 'left view split at transparent central gap', alternate: 'right view split at transparent central gap; never mirrored' },
    items: records.map(({ defaultView, rightView, frameBuffers, ...record }) => record),
    qa: { validation: 'qa/validation.json', contactSheet },
    preview: 'preview.html',
  };
  const provenance = {
    schema: 'hagrid-farm.decor-assets.provenance.v1',
    generatedAt: new Date().toISOString(),
    tool: 'build-assets.mjs',
    specs: { file: 'specs.json', sha256: specsSha256 },
    itemPalettes: itemPaletteSha256 ? { file: 'item-palettes.json', sha256: itemPaletteSha256 } : null,
    sourceContract: 'Masters are preserved under masters/; each contains a real left default and right alternate view, separated at a verified transparent gap.',
    processing: {
      sourceSplit: 'nearest transparent central gap at alpha threshold; retains both complete views without seam fragments',
      paletteNearest: 'weighted RGB distance (2,3,1), quantized to each item palette subset from item-palettes.json; global 24-color validation remains enforced',
      alphaThreshold: ALPHA_THRESHOLD,
      sampling: 'hard nearest pixel grid with opaque-neighborhood fallback; no smooth resize',
      anchor: 'centered x pivot; items with inkMax use native height minus sixteen pixels, other ids minus four; every frame keeps the grounded bottom quarter alpha rooted',
      animation: 'four idle frames per angle; only a small connected glow component may recolor; blink/sway/bubbles fall back to truthful identical poses without an explicit mask',
    },
    items: provenanceItems,
  };
  const validation = {
    schema: 'hagrid-farm.decor-assets.qa.v1',
    status,
    assertions: {
      expectedItemCount: specs.items.length,
      packagedItemCount: records.length,
      allExpectedMastersPresent: missing.length === 0,
      twoViewsPerMaster: true,
      masterViewsSeparatedByTransparentGap: true,
      fourFramesPerAngle: true,
      spriteSheetPerItem: true,
      nearestThumbnails2x3x: true,
      motionFallbackDocumented: true,
      staticFramesTruthful: true,
      glowLocalized: true,
      paletteOnly: true,
      perItemPaletteOnly: true,
      itemPaletteConfigured: Boolean(paletteDocument),
      binaryAlpha: true,
      noEdgeClipping: true,
      groundedBottomQuarterUnchanged: true,
    },
    items: validationItems,
  };
  await writeJson(path.join(ROOT, 'manifest.json'), manifest);
  await writeJson(path.join(ROOT, 'provenance.json'), provenance);
  await writeJson(path.join(QA_DIR, 'validation.json'), validation);
  await fs.writeFile(path.join(ROOT, 'preview.html'), previewHtml(records, status, missing, specs.collection));
  console.log(`Packaged ${records.length}/${specs.items.length} item(s) (${status}).`);
  console.log(`QA contact sheet: ${path.join(ROOT, contactSheet)}`);
  if (missing.length) console.log(`Missing masters: ${missing.join(', ')}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
