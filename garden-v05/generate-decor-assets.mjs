// Deterministic native export for the garden decoration & character masters,
// including 4-frame idle/motion animations and 2-angle (default / right-facing)
// variants for all placeable decorations.
//
// The masters remain untouched. This script removes only low-alpha generated
// fringes, samples with nearest-neighbour, quantizes every opaque pixel to the
// shared 24-color palette, and emits binary-alpha RGBA sprites plus QA data.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const sharp = require(process.env.SHARP_MODULE || '/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root = path.dirname(new URL(import.meta.url).pathname);
const assetRoot = path.join(root, 'decor-assets');
const masterRoot = path.join(assetRoot, 'masters');
const nativeRoot = path.join(assetRoot, 'native');
const qaRoot = path.join(assetRoot, 'qa');

const paletteHex = [
  '#231F2E', '#4A3042', '#735044', '#A57554', '#41465C', '#687486',
  '#A6B1AE', '#D6D8BF', '#24483F', '#3F6A45', '#71934B', '#B0BD67',
  '#8B4A3F', '#C97952', '#E7AE73', '#F5D69A', '#874056', '#C75B4B',
  '#ED8A45', '#FFC36B', '#3E3B70', '#6961A6', '#70A8B6', '#B7DEE0',
];
const palette = paletteHex.map((hex) => [0, 2, 4].map((offset) => parseInt(hex.slice(1 + offset, 3 + offset), 16)));
const paletteByHex = Object.fromEntries(paletteHex.map((hex, index) => [hex, palette[index]]));
const paletteKeys = new Set(palette.map(([r, g, b]) => `${r},${g},${b}`));
const alphaThreshold = 192;

const prompts = {
  decor_pumpkin_lantern: 'Single carved pumpkin lantern on a small rustic post, warm candle inside, cozy 2D dimetric pixel-art garden decoration, transparent background.',
  decor_broom_rack: 'Exactly three flying brooms on a rustic timber rack, chunky readable 2D dimetric pixel art, transparent background.',
  decor_cauldron: 'Round black iron cauldron with violet potion and small blocky pixel vapour, cozy 2D dimetric pixel art, transparent background.',
  decor_mandrake_planter: 'Terracotta planter with a cute root-face mandrake, leafy head, and red earmuffs hanging on the rim, 2D dimetric pixel art, transparent background.',
  decor_floating_candles: 'Exactly three floating candles with tiny flames above a small brass stand, cozy 2D dimetric pixel art, transparent background.',
  decor_vine_arch: 'Rustic wooden garden arch wrapped in vines with a few small glowing blooms, 2D dimetric pixel art, transparent background.',
  gardener_friend: 'Canonical half-giant Hogwarts gamekeeper with wild bushy dark-brown beard and mane, long moleskin overcoat over dark waistcoat and brass-buckled belt, holding a glowing brass lantern and folded pink umbrella, 2D dimetric pixel-art character sprite, transparent background.',
  owl_post: 'Cute snowy messenger owl perched on a rustic carved wooden T-perch post with a hanging parchment letter sealed with red wax, 2D dimetric pixel-art garden prop, transparent background.',
  herbology_greenhouse: 'Cozy wizarding Herbology greenhouse in 2:1 dimetric isometric projection with warm timber framing, stone brick base, teal glass panes, and potted magical herbs inside, transparent background.',
};

const specs = [
  {id: 'decor_pumpkin_lantern', kind: 'decor', storeItem: true, rotatable: true, master: 'decor_pumpkin_lantern.png', width: 64, height: 96, pivotX: 32, pivotY: 80, maxWidth: 56, footprintTiles: [1, 1], durations: [460, 220, 420, 220]},
  {id: 'decor_broom_rack', kind: 'decor', storeItem: true, rotatable: true, master: 'decor_broom_rack.png', width: 96, height: 96, pivotX: 48, pivotY: 80, maxWidth: 88, footprintTiles: [2, 1], durations: [520, 260, 480, 260]},
  {id: 'decor_cauldron', kind: 'decor', storeItem: true, rotatable: true, master: 'decor_cauldron.png', width: 64, height: 96, pivotX: 32, pivotY: 80, maxWidth: 56, footprintTiles: [1, 1], durations: [420, 240, 420, 240]},
  {id: 'decor_mandrake_planter', kind: 'decor', storeItem: true, rotatable: true, master: 'decor_mandrake_planter.png', width: 64, height: 96, pivotX: 32, pivotY: 80, maxWidth: 56, footprintTiles: [1, 1], durations: [480, 220, 440, 220]},
  {id: 'decor_floating_candles', kind: 'decor', storeItem: true, rotatable: true, master: 'decor_floating_candles.png', width: 80, height: 104, pivotX: 40, pivotY: 88, maxWidth: 72, footprintTiles: [1, 1], durations: [400, 220, 400, 220]},
  {id: 'decor_vine_arch', kind: 'decor', storeItem: true, rotatable: true, master: 'decor_vine_arch.png', width: 128, height: 128, pivotX: 64, pivotY: 104, maxWidth: 120, footprintTiles: [2, 1], durations: [560, 280, 520, 280]},
  {id: 'gardener_friend', kind: 'character', storeItem: false, rotatable: false, master: 'gardener_friend.png', width: 72, height: 108, pivotX: 36, pivotY: 96, maxWidth: 64, footprintTiles: [1, 1], durations: [640, 320, 220, 360]},
  {id: 'owl_post', kind: 'scenery', storeItem: false, rotatable: false, master: 'owl_post.png', width: 72, height: 96, pivotX: 36, pivotY: 88, maxWidth: 58, footprintTiles: [1, 1], durations: [580, 280, 200, 320]},
  {id: 'herbology_greenhouse', kind: 'scenery', storeItem: false, rotatable: false, master: 'herbology_greenhouse.png', width: 156, height: 152, pivotX: 78, pivotY: 118, drawBottomY: 142, maxWidth: 140, footprintTiles: [2, 2], durations: [680, 340, 640, 340]},
];

const mkdir = (directory) => fs.mkdir(directory, {recursive: true});

function nearestPalette(r, g, b, cache) {
  const key = (r << 16) | (g << 8) | b;
  if (cache.has(key)) return cache.get(key);
  let best = 0;
  let distance = Infinity;
  palette.forEach(([pr, pg, pb], index) => {
    const candidate = (r - pr) ** 2 * 2 + (g - pg) ** 2 * 3 + (b - pb) ** 2;
    if (candidate < distance) {
      distance = candidate;
      best = index;
    }
  });
  cache.set(key, best);
  return best;
}

function opaqueBounds(data, width, height, threshold = alphaThreshold) {
  let x0 = width;
  let y0 = height;
  let x1 = -1;
  let y1 = -1;
  let count = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * 4 + 3] < threshold) continue;
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x);
      y0 = Math.min(y0, y);
      y1 = Math.max(y1, y);
      count += 1;
    }
  }
  if (x1 < 0) throw new Error('master has no pixels above alpha threshold');
  return {x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1, count};
}

function outputBounds(data, width, height) {
  let x0 = width;
  let y0 = height;
  let x1 = -1;
  let y1 = -1;
  let count = 0;
  let partialAlpha = 0;
  let outsidePalette = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const alpha = data[index + 3];
      if (alpha !== 0 && alpha !== 255) partialAlpha += 1;
      if (alpha === 0) continue;
      const key = `${data[index]},${data[index + 1]},${data[index + 2]}`;
      if (!paletteKeys.has(key)) outsidePalette += 1;
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x);
      y0 = Math.min(y0, y);
      y1 = Math.max(y1, y);
      count += 1;
    }
  }
  if (x1 < 0) throw new Error('native sprite has no opaque pixels');
  return {
    bounds: {x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1},
    opaquePixelCount: count,
    partialAlpha,
    outsidePalette,
    edgeContact: x0 === 0 || y0 === 0 || x1 === width - 1 || y1 === height - 1,
  };
}

function renderNearest(source, sourceBounds, spec) {
  const {data, info} = source;
  const bottomY = spec.drawBottomY ?? spec.pivotY;
  const maxHeight = Math.min(spec.height - 8, bottomY - 4);
  const scale = Math.min(spec.maxWidth / sourceBounds.w, maxHeight / sourceBounds.h);
  const drawWidth = Math.max(1, Math.round(sourceBounds.w * scale));
  const drawHeight = Math.max(1, Math.round(sourceBounds.h * scale));
  const originX = Math.round(spec.pivotX - drawWidth / 2);
  const originY = bottomY - drawHeight;
  if (originX < 2 || originY < 2 || originX + drawWidth > spec.width - 2 || originY + drawHeight > spec.height - 2) {
    throw new Error(`${spec.id}: placement would clip (${originX},${originY},${drawWidth},${drawHeight})`);
  }
  const output = Buffer.alloc(spec.width * spec.height * 4);
  const paletteCache = new Map();
  for (let y = 0; y < drawHeight; y += 1) {
    const sourceY = sourceBounds.y + Math.min(sourceBounds.h - 1, Math.floor(y / scale));
    for (let x = 0; x < drawWidth; x += 1) {
      const sourceX = sourceBounds.x + Math.min(sourceBounds.w - 1, Math.floor(x / scale));
      const sourceIndex = (sourceY * info.width + sourceX) * 4;
      if (data[sourceIndex + 3] < alphaThreshold) continue;
      const paletteIndex = nearestPalette(data[sourceIndex], data[sourceIndex + 1], data[sourceIndex + 2], paletteCache);
      const [r, g, b] = palette[paletteIndex];
      const outputIndex = ((originY + y) * spec.width + originX + x) * 4;
      output[outputIndex] = r;
      output[outputIndex + 1] = g;
      output[outputIndex + 2] = b;
      output[outputIndex + 3] = 255;
    }
  }
  cleanSpriteFringe(output, spec);
  return {output, drawWidth, drawHeight, scale};
}

function cleanSpriteFringe(buf, spec) {
  const {width, height, id} = spec;
  const copy = Buffer.from(buf);
  const isOpaque = (x, y) => x >= 0 && x < width && y >= 0 && y < height && copy[(y * width + x) * 4 + 3] === 255;

  // 1. Remove isolated 1px boundary spikes (e.g., stray 2 white dots above Hagrid's hair).
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      if (!isOpaque(x, y)) continue;
      const n4 = (isOpaque(x - 1, y) ? 1 : 0) + (isOpaque(x + 1, y) ? 1 : 0)
        + (isOpaque(x, y - 1) ? 1 : 0) + (isOpaque(x, y + 1) ? 1 : 0);
      if (n4 <= 1) {
        const idx = (y * width + x) * 4;
        buf[idx] = 0;
        buf[idx + 1] = 0;
        buf[idx + 2] = 0;
        buf[idx + 3] = 0;
      }
    }
  }

  // 2. For Hagrid (gardener_friend), clean cool grey/cream anti-aliasing artifacts from white-keyed master.
  if (id === 'gardener_friend') {
    const snap = Buffer.from(buf);
    const opaqueAt = (x, y) => x >= 0 && x < width && y >= 0 && y < height && snap[(y * width + x) * 4 + 3] === 255;
    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const idx = (y * width + x) * 4;
        if (snap[idx + 3] === 0) continue;
        const isCoolFringe = isColor(snap, idx, '#D6D8BF')
          || isColor(snap, idx, '#A6B1AE')
          || isColor(snap, idx, '#B7DEE0')
          || isColor(snap, idx, '#687486')
          || isColor(snap, idx, '#41465C');
        if (!isCoolFringe) continue;
        const touchesEdge = !opaqueAt(x - 1, y) || !opaqueAt(x + 1, y) || !opaqueAt(x, y - 1) || !opaqueAt(x, y + 1);
        const replacement = touchesEdge ? paletteByHex['#231F2E'] : paletteByHex['#4A3042'];
        buf[idx] = replacement[0];
        buf[idx + 1] = replacement[1];
        buf[idx + 2] = replacement[2];
      }
    }
  }
}

function mirrorBufferHorizontally(sourceBuffer, spec) {
  const {width, height, pivotX} = spec;
  const mirrored = Buffer.alloc(width * height * 4);
  const bounds = outputBounds(sourceBuffer, width, height).bounds;
  // Mirror around the sprite's visual center while keeping within [2, width - 3].
  const center2 = bounds.x * 2 + bounds.w - 1;
  const shift = Math.round(pivotX * 2 - 1 - center2);
  const safeShift = Math.max(2 - bounds.x, Math.min(width - 2 - (bounds.x + bounds.w), shift));
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const srcIdx = (y * width + x) * 4;
      if (sourceBuffer[srcIdx + 3] === 0) continue;
      const mx = center2 - x + safeShift;
      if (mx < 2 || mx >= width - 2) continue;
      const dstIdx = (y * width + mx) * 4;
      mirrored[dstIdx] = sourceBuffer[srcIdx];
      mirrored[dstIdx + 1] = sourceBuffer[srcIdx + 1];
      mirrored[dstIdx + 2] = sourceBuffer[srcIdx + 2];
      mirrored[dstIdx + 3] = 255;
    }
  }
  return mirrored;
}

function setPixelSafe(buf, width, height, x, y, hex) {
  const rx = Math.round(x);
  const ry = Math.round(y);
  if (rx < 2 || rx >= width - 2 || ry < 2 || ry >= height - 2) return;
  const rgb = paletteByHex[hex];
  if (!rgb) return;
  const idx = (ry * width + rx) * 4;
  buf[idx] = rgb[0];
  buf[idx + 1] = rgb[1];
  buf[idx + 2] = rgb[2];
  buf[idx + 3] = 255;
}

function drawSparkleCluster(buf, width, height, cx, cy, coreHex = '#F5D69A', rimHex = '#FFC36B') {
  setPixelSafe(buf, width, height, cx, cy, coreHex);
  setPixelSafe(buf, width, height, cx - 1, cy, rimHex);
  setPixelSafe(buf, width, height, cx + 1, cy, rimHex);
  setPixelSafe(buf, width, height, cx, cy - 1, rimHex);
  setPixelSafe(buf, width, height, cx, cy + 1, rimHex);
}

function isColor(buf, idx, hex) {
  const rgb = paletteByHex[hex];
  return rgb && buf[idx] === rgb[0] && buf[idx + 1] === rgb[1] && buf[idx + 2] === rgb[2];
}

/**
 * Build 4 deterministic pixel-art animation frames [f0, f1, f2, f3] from a
 * quantized native buffer WITHOUT ever slicing a sprite into disjoint regions.
 * Grounded sprites stay 100% solid (zero regional dx/dy displacement) and
 * animate through in-place pixel-art shading waves, eye blinks, flame/potion
 * cycles, and exterior magical sparkles. Floating items translate uniformly
 * as a single rigid body.
 */
function unionBounds(list) {
  const x = Math.min(...list.map((b) => b.x)), y = Math.min(...list.map((b) => b.y));
  return {x, y, w: Math.max(...list.map((b) => b.x + b.w)) - x, h: Math.max(...list.map((b) => b.y + b.h)) - y};
}

function buildAnimatedFrames(baseBuffer, spec, mirrored = false) {
  const {width, height, id} = spec;
  const b = outputBounds(baseBuffer, width, height).bounds;
  const dir = mirrored ? -1 : 1;

  function isInteriorPixel(x, y) {
    if (x <= 1 || x >= width - 2 || y <= 1 || y >= height - 2) return false;
    const idx = (y * width + x) * 4;
    if (baseBuffer[idx + 3] === 0 || isColor(baseBuffer, idx, '#231F2E')) return false;
    return baseBuffer[((y - 1) * width + x) * 4 + 3] === 255
      && baseBuffer[((y + 1) * width + x) * 4 + 3] === 255
      && baseBuffer[(y * width + (x - 1)) * 4 + 3] === 255
      && baseBuffer[(y * width + (x + 1)) * 4 + 3] === 255;
  }

  function transformFrame(frameIndex) {
    if (frameIndex === 0) return Buffer.from(baseBuffer);

    // Only mid-air floating items translate as a single rigid body (never piecewise!).
    const wholeDy = id === 'decor_floating_candles'
      ? (frameIndex === 2 ? -2 : -1)
      : 0;

    const out = wholeDy === 0 ? Buffer.from(baseBuffer) : Buffer.alloc(width * height * 4);
    const midSplitY = b.y + Math.floor(b.h * 0.46);
    const topSplitY = b.y + Math.floor(b.h * 0.28);

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const srcIdx = (y * width + x) * 4;
        if (baseBuffer[srcIdx + 3] === 0) continue;
        let r = baseBuffer[srcIdx];
        let g = baseBuffer[srcIdx + 1];
        let bl = baseBuffer[srcIdx + 2];

        if (id === 'gardener_friend') {
          // Hagrid: gentle breathing highlight on beard/coat, warm lantern flicker, and eye blink.
          // Never displace sub-regions so the silhouette remains 100% solid and uncut.
          if (frameIndex === 2
            && y >= b.y + Math.floor(b.h * 0.14) && y <= b.y + Math.floor(b.h * 0.24)
            && x >= b.x + Math.floor(b.w * 0.32) && x <= b.x + Math.floor(b.w * 0.68)) {
            if (isColor(baseBuffer, srcIdx, '#F5D69A') || isColor(baseBuffer, srcIdx, '#E7AE73')) {
              [r, g, bl] = paletteByHex['#4A3042'];
            }
          }
          // Subtle breathing sheen across chest/coat interior only (organic dithered pattern, no line)
          if (isInteriorPixel(x, y) && y >= topSplitY && y <= b.y + Math.floor(b.h * 0.68)) {
            const belowIdx = ((y + 1) * width + x) * 4;
            if ((frameIndex === 1 || frameIndex === 3) && (x + y * 3 + frameIndex) % 5 === 0) {
              if (isColor(baseBuffer, srcIdx, '#735044') && isColor(baseBuffer, belowIdx, '#A57554')) {
                [r, g, bl] = paletteByHex['#A57554'];
              } else if (isColor(baseBuffer, srcIdx, '#4A3042') && isColor(baseBuffer, belowIdx, '#735044')) {
                [r, g, bl] = paletteByHex['#735044'];
              }
            }
          }
          // Warm lantern flame flicker
          if (y > b.y + Math.floor(b.h * 0.38)) {
            if (isColor(baseBuffer, srcIdx, '#ED8A45') && frameIndex === 1) [r, g, bl] = paletteByHex['#FFC36B'];
            else if (isColor(baseBuffer, srcIdx, '#FFC36B') && frameIndex === 2) [r, g, bl] = paletteByHex['#F5D69A'];
            else if (isColor(baseBuffer, srcIdx, '#F5D69A') && frameIndex === 3) [r, g, bl] = paletteByHex['#FFC36B'];
          }
        } else if (id === 'owl_post') {
          // Snowy owl eye blink + feather sheen + red wax seal glint (no regional cut)
          if (frameIndex === 2 && y >= b.y + Math.floor(b.h * 0.08) && y <= b.y + Math.floor(b.h * 0.25)) {
            if (isColor(baseBuffer, srcIdx, '#ED8A45') || isColor(baseBuffer, srcIdx, '#FFC36B') || isColor(baseBuffer, srcIdx, '#F5D69A')) {
              [r, g, bl] = paletteByHex['#735044'];
            }
          } else if ((frameIndex === 1 || frameIndex === 3) && isInteriorPixel(x, y) && y < b.y + Math.floor(b.h * 0.52)) {
            if (isColor(baseBuffer, srcIdx, '#A6B1AE') && (x + y + frameIndex) % 4 === 0) {
              [r, g, bl] = paletteByHex['#D6D8BF'];
            }
          }
          if (isColor(baseBuffer, srcIdx, '#C75B4B') && frameIndex === 1) {
            [r, g, bl] = paletteByHex['#ED8A45'];
          }
        } else if (id === 'herbology_greenhouse') {
          // Shimmering glass panes & interior herbs without moving frame pixels
          if (isColor(baseBuffer, srcIdx, '#71934B') && (x + y + frameIndex) % 5 === 0) {
            [r, g, bl] = paletteByHex['#B0BD67'];
          } else if (isColor(baseBuffer, srcIdx, '#B0BD67') && (x + y + frameIndex) % 6 === 0) {
            [r, g, bl] = paletteByHex['#71934B'];
          } else if (isColor(baseBuffer, srcIdx, '#B7DEE0') && (x + y + frameIndex * 3) % 9 === 0) {
            [r, g, bl] = paletteByHex['#F5D69A'];
          } else if (isColor(baseBuffer, srcIdx, '#70A8B6') && (x + y + frameIndex * 2) % 11 === 0) {
            [r, g, bl] = paletteByHex['#B7DEE0'];
          }
        } else if (id === 'decor_pumpkin_lantern') {
          // Candle flicker inside carved pumpkin
          if (isColor(baseBuffer, srcIdx, '#ED8A45')) {
            if (frameIndex === 1) [r, g, bl] = paletteByHex['#FFC36B'];
            else if (frameIndex === 3) [r, g, bl] = paletteByHex['#C97952'];
          } else if (isColor(baseBuffer, srcIdx, '#FFC36B')) {
            if (frameIndex === 1) [r, g, bl] = paletteByHex['#F5D69A'];
            else if (frameIndex === 2) [r, g, bl] = paletteByHex['#ED8A45'];
          } else if (isColor(baseBuffer, srcIdx, '#F5D69A') && frameIndex === 3) {
            [r, g, bl] = paletteByHex['#FFC36B'];
          }
        } else if (id === 'decor_broom_rack') {
          // Enchanted golden bristle shimmer along the brooms
          if (isColor(baseBuffer, srcIdx, '#E7AE73') && (x + y + frameIndex) % 4 === 0) {
            [r, g, bl] = paletteByHex['#FFC36B'];
          } else if (isColor(baseBuffer, srcIdx, '#FFC36B') && (x + y + frameIndex) % 3 === 0) {
            [r, g, bl] = paletteByHex['#F5D69A'];
          }
        } else if (id === 'decor_cauldron') {
          // Bubbling purple & teal potion shimmer
          if (isColor(baseBuffer, srcIdx, '#6961A6') && (x + y + frameIndex) % 4 === 0) {
            [r, g, bl] = paletteByHex['#B7DEE0'];
          } else if (isColor(baseBuffer, srcIdx, '#3E3B70') && (x + y + frameIndex) % 5 === 0) {
            [r, g, bl] = paletteByHex['#6961A6'];
          } else if (isColor(baseBuffer, srcIdx, '#70A8B6') && (x + y + frameIndex) % 3 === 0) {
            [r, g, bl] = paletteByHex['#B7DEE0'];
          }
        } else if (id === 'decor_mandrake_planter') {
          // Leaf crown vitality shimmer
          if (y < midSplitY) {
            if (isColor(baseBuffer, srcIdx, '#71934B') && (x + y + frameIndex) % 4 === 0) {
              [r, g, bl] = paletteByHex['#B0BD67'];
            } else if (isColor(baseBuffer, srcIdx, '#3F6A45') && (x + y + frameIndex) % 5 === 0) {
              [r, g, bl] = paletteByHex['#71934B'];
            }
          }
        } else if (id === 'decor_floating_candles') {
          // Whole-sprite hover (wholeDy) + dancing candle flames
          if (isColor(baseBuffer, srcIdx, '#FFC36B') && frameIndex === 2) [r, g, bl] = paletteByHex['#F5D69A'];
          else if (isColor(baseBuffer, srcIdx, '#F5D69A') && frameIndex === 3) [r, g, bl] = paletteByHex['#ED8A45'];
          else if (isColor(baseBuffer, srcIdx, '#ED8A45') && frameIndex === 1) [r, g, bl] = paletteByHex['#FFC36B'];
        } else if (id === 'decor_vine_arch') {
          // Blooming blossoms & emerald vine shimmer
          if (isColor(baseBuffer, srcIdx, '#F5D69A') || isColor(baseBuffer, srcIdx, '#FFC36B')) {
            if (frameIndex === 2) [r, g, bl] = paletteByHex['#B7DEE0'];
            else if (frameIndex === 1) [r, g, bl] = paletteByHex['#F5D69A'];
          } else if (isColor(baseBuffer, srcIdx, '#71934B') && (x + y + frameIndex) % 6 === 0) {
            [r, g, bl] = paletteByHex['#B0BD67'];
          }
        }

        const ny = Math.max(2, Math.min(height - 3, y + wholeDy));
        const dstIdx = (ny * width + x) * 4;
        out[dstIdx] = r;
        out[dstIdx + 1] = g;
        out[dstIdx + 2] = bl;
        out[dstIdx + 3] = 255;
      }
    }

    // Add crisp pixel-art ambient sparkles/embers per frame so motion is unmistakable
    const cx = b.x + Math.floor(b.w / 2);
    if (id === 'gardener_friend') {
      const lx = mirrored ? b.x + Math.floor(b.w * 0.82) : b.x + Math.floor(b.w * 0.18);
      const ly = b.y + Math.floor(b.h * 0.56) - frameIndex;
      drawSparkleCluster(out, width, height, lx, ly, '#F5D69A', '#ED8A45');
    } else if (id === 'owl_post') {
      if (frameIndex === 1 || frameIndex === 3) {
        const sx = mirrored ? b.x + Math.floor(b.w * 0.22) : b.x + Math.floor(b.w * 0.78);
        const sy = b.y + Math.floor(b.h * 0.18) - (frameIndex === 3 ? 2 : 0);
        setPixelSafe(out, width, height, sx, sy, '#F5D69A');
        setPixelSafe(out, width, height, sx + dir, sy - 1, '#FFC36B');
      }
    } else if (id === 'herbology_greenhouse') {
      const gx = cx + (frameIndex - 2) * 14 * dir;
      const gy = b.y + Math.floor(b.h * 0.34) - (frameIndex % 2) * 3;
      drawSparkleCluster(out, width, height, gx, gy, '#F5D69A', '#B7DEE0');
    } else if (id === 'decor_pumpkin_lantern') {
      const py = b.y + Math.max(2, Math.floor(b.h * 0.12) - frameIndex);
      drawSparkleCluster(out, width, height, cx + (frameIndex - 2) * 2 * dir, py, '#F5D69A', '#ED8A45');
    } else if (id === 'decor_broom_rack') {
      const bx = b.x + Math.floor(b.w * (0.25 + 0.22 * (frameIndex - 1)));
      const by = b.y + Math.floor(b.h * 0.22) - (frameIndex % 2) * 2;
      drawSparkleCluster(out, width, height, bx, by, '#F5D69A', '#FFC36B');
    } else if (id === 'decor_cauldron') {
      const vx = cx + (frameIndex === 1 ? -3 : frameIndex === 2 ? 2 : -1) * dir;
      const vy = Math.max(4, b.y + 4 - frameIndex);
      drawSparkleCluster(out, width, height, vx, vy, '#B7DEE0', '#6961A6');
    } else if (id === 'decor_mandrake_planter') {
      const mx = cx + (frameIndex === 1 ? 4 : frameIndex === 3 ? -4 : 0) * dir;
      const my = Math.max(4, b.y + 5 - frameIndex);
      setPixelSafe(out, width, height, mx, my, '#B0BD67');
      setPixelSafe(out, width, height, mx + dir, my - 1, '#F5D69A');
    } else if (id === 'decor_floating_candles') {
      const fx = cx + (frameIndex - 2) * 5 * dir;
      const fy = Math.max(4, b.y + 4 - (frameIndex % 2) * 2);
      drawSparkleCluster(out, width, height, fx, fy, '#F5D69A', '#FFC36B');
    } else if (id === 'decor_vine_arch') {
      const ax = cx + (frameIndex === 1 ? -10 : frameIndex === 2 ? 0 : 10) * dir;
      const ay = b.y + Math.floor(b.h * 0.24) - (frameIndex % 2) * 2;
      drawSparkleCluster(out, width, height, ax, ay, '#F5D69A', '#B0BD67');
    }

    // Continuity invariant: for grounded items (wholeDy === 0), no opaque pixel in baseBuffer may ever become transparent!
    if (wholeDy === 0) {
      for (let i = 0; i < baseBuffer.length; i += 4) {
        if (baseBuffer[i + 3] === 255 && out[i + 3] !== 255) {
          throw new Error(`${id} frame ${frameIndex}: animation introduced a transparent cut at byte ${i}`);
        }
      }
    }

    return out;
  }

  return [0, 1, 2, 3].map(transformFrame);
}

function makeContactSheet(nativeItems, cellWidth = 640, cellHeight = 640, scale = 4) {
  const columns = 3;
  const rows = Math.ceil(nativeItems.length / columns);
  const sheetWidth = columns * cellWidth;
  const sheetHeight = rows * cellHeight;
  const sheet = Buffer.alloc(sheetWidth * sheetHeight * 4);
  const [backgroundR, backgroundG, backgroundB] = palette[0];
  for (let index = 0; index < sheet.length; index += 4) {
    sheet[index] = backgroundR;
    sheet[index + 1] = backgroundG;
    sheet[index + 2] = backgroundB;
    sheet[index + 3] = 255;
  }
  nativeItems.forEach(({spec, output}, cellIndex) => {
    const scaledWidth = spec.width * scale;
    const scaledHeight = spec.height * scale;
    const cellX = (cellIndex % columns) * cellWidth + Math.floor((cellWidth - scaledWidth) / 2);
    const cellY = Math.floor(cellIndex / columns) * cellHeight + Math.floor((cellHeight - scaledHeight) / 2);
    for (let y = 0; y < spec.height; y += 1) {
      for (let x = 0; x < spec.width; x += 1) {
        const sourceIndex = (y * spec.width + x) * 4;
        const r = output[sourceIndex];
        const g = output[sourceIndex + 1];
        const b = output[sourceIndex + 2];
        const a = output[sourceIndex + 3];
        if (a === 0) continue;
        for (let yy = 0; yy < scale; yy += 1) {
          for (let xx = 0; xx < scale; xx += 1) {
            const destinationIndex = (((cellY + y * scale + yy) * sheetWidth) + cellX + x * scale + xx) * 4;
            sheet[destinationIndex] = r;
            sheet[destinationIndex + 1] = g;
            sheet[destinationIndex + 2] = b;
            sheet[destinationIndex + 3] = 255;
          }
        }
      }
    }
  });
  return {sheet, width: sheetWidth, height: sheetHeight, columns, rows, cellWidth, cellHeight, scale};
}

await mkdir(nativeRoot);
await mkdir(qaRoot);
const manifestItems = [];
const validation = [];
const nativeItems = [];

async function writeAndValidateBuffer(buffer, filePath, width, height, labelId) {
  await sharp(buffer, {raw: {width, height, channels: 4}}).png({compressionLevel: 9}).toFile(filePath);
  const checked = outputBounds(buffer, width, height);
  if (checked.partialAlpha || checked.outsidePalette || checked.edgeContact) {
    throw new Error(`${labelId}: QA failed ${JSON.stringify(checked)}`);
  }
  const sha256 = crypto.createHash('sha256').update(await fs.readFile(filePath)).digest('hex');
  return {checked, sha256, relativeFile: path.relative(root, filePath).split(path.sep).join('/')};
}

for (const spec of specs) {
  const masterFile = path.join(masterRoot, spec.master);
  const sourceSha256 = crypto.createHash('sha256').update(await fs.readFile(masterFile)).digest('hex');
  const source = await sharp(masterFile).ensureAlpha().raw().toBuffer({resolveWithObject: true});
  const sourceBounds = opaqueBounds(source.data, source.info.width, source.info.height);
  const {output, drawWidth, drawHeight, scale} = renderNearest(source, sourceBounds, spec);

  const baseNativeFile = path.join(nativeRoot, `${spec.id}.png`);
  const baseChecked = await writeAndValidateBuffer(output, baseNativeFile, spec.width, spec.height, spec.id);

  // Generate 4 animated frames for default angle
  const defaultBuffers = buildAnimatedFrames(output, spec, false);
  const defaultFrames = [];
  // Placement collides by these bounds, so they hold every frame (the candles bob above their base).
  const defaultBounds = [baseChecked.checked.bounds];
  for (let i = 0; i < defaultBuffers.length; i += 1) {
    const frameFile = path.join(nativeRoot, `${spec.id}_f${i}.png`);
    const res = await writeAndValidateBuffer(defaultBuffers[i], frameFile, spec.width, spec.height, `${spec.id}_f${i}`);
    defaultFrames.push(res.relativeFile);
    defaultBounds.push(res.checked.bounds);
  }

  // Generate right-facing angle + 4 animated frames for rotatable items
  let rightFile = null;
  let rightFrames = null;
  let rightBounds = null;
  if (spec.rotatable) {
    const mirroredBase = mirrorBufferHorizontally(output, spec);
    const rightNativeFile = path.join(nativeRoot, `${spec.id}_right.png`);
    const rightChecked = await writeAndValidateBuffer(mirroredBase, rightNativeFile, spec.width, spec.height, `${spec.id}_right`);
    rightFile = rightChecked.relativeFile;
    const rightAll = [rightChecked.checked.bounds];
    const rightBuffers = buildAnimatedFrames(mirroredBase, spec, true);
    rightFrames = [];
    for (let i = 0; i < rightBuffers.length; i += 1) {
      const frameFile = path.join(nativeRoot, `${spec.id}_right_f${i}.png`);
      const res = await writeAndValidateBuffer(rightBuffers[i], frameFile, spec.width, spec.height, `${spec.id}_right_f${i}`);
      rightFrames.push(res.relativeFile);
      rightAll.push(res.checked.bounds);
    }
    rightBounds = unionBounds(rightAll);
  }

  const master = path.relative(root, masterFile).split(path.sep).join('/');
  manifestItems.push({
    id: spec.id,
    kind: spec.kind,
    storeItem: spec.storeItem,
    rotatable: Boolean(spec.rotatable),
    file: baseChecked.relativeFile,
    frames: defaultFrames,
    durations: spec.durations,
    ...(rightFile ? {
      rightFile,
      rightFrames,
      rightBounds,
      angles: ['default', 'right'],
    } : {}),
    master,
    width: spec.width,
    height: spec.height,
    pivotX: spec.pivotX,
    pivotY: spec.pivotY,
    bounds: unionBounds(defaultBounds),
    footprintTiles: spec.footprintTiles,
    sourceSha256,
    nativeSha256: baseChecked.sha256,
    generationPromptId: spec.id,
  });
  validation.push({
    id: spec.id,
    source: {file: master, sha256: sourceSha256, threshold: alphaThreshold, bounds: sourceBounds},
    native: {
      file: baseChecked.relativeFile,
      frames: defaultFrames.length,
      rightFrames: rightFrames ? rightFrames.length : 0,
      width: spec.width,
      height: spec.height,
      pivotX: spec.pivotX,
      pivotY: spec.pivotY,
      drawWidth,
      drawHeight,
      scale,
      ...baseChecked.checked,
      sha256: baseChecked.sha256,
    },
  });
  nativeItems.push({spec, output});
}

const contact = makeContactSheet(nativeItems);
const contactFile = path.join(qaRoot, 'decor-contact-sheet-2x4.png');
await sharp(contact.sheet, {raw: {width: contact.width, height: contact.height, channels: 4}}).png({compressionLevel: 9}).toFile(contactFile);
const contactRelative = path.relative(root, contactFile).split(path.sep).join('/');

const manifest = {
  version: 2,
  status: 'local generated masters with deterministic 4-frame native exports and 2-angle decor variants',
  generator: 'builtin image_gen',
  reference: 'garden-v03/environment/layers/hut.png and garden-v03/environment/garden-native.png viewed before generation',
  palette: paletteHex,
  pixelArt: {dimetricRatio: '2:1', outline: '1px native', sampling: 'nearest-neighbour', alpha: '0-or-255', alphaThreshold},
  promptsFile: 'decor-assets/prompts.json',
  contactSheet: {file: contactRelative, columns: contact.columns, rows: contact.rows, scale: contact.scale, cellWidth: contact.cellWidth, cellHeight: contact.cellHeight},
  items: manifestItems,
};
await fs.writeFile(path.join(root, 'decor-assets-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
await fs.writeFile(path.join(qaRoot, 'validation.json'), `${JSON.stringify({version: 2, palette: paletteHex, alphaThreshold, checks: validation}, null, 2)}\n`);
await fs.writeFile(path.join(assetRoot, 'prompts.json'), `${JSON.stringify({version: 2, tool: 'builtin image_gen', transparentBackground: true, styleReference: manifest.reference, sharedConstraints: ['cute chunky hard-edged pixel art', 'no blur, gradient, anti-aliasing, text, logos, people unless the gardener character is requested', 'exact 24-color palette', 'transparent RGBA'], items: specs.map((spec) => ({id: spec.id, prompt: prompts[spec.id]}))}, null, 2)}\n`);
console.log(JSON.stringify({items: manifestItems.length, totalFramesGenerated: manifestItems.reduce((n, item) => n + (item.frames?.length || 0) + (item.rightFrames?.length || 0), 0), contactSheet: contactRelative, qa: 'decor-assets/qa/validation.json'}));
