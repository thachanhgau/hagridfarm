// Technical exporter for the level sprite atlases. It never writes to the
// masters; every output is a new nearest-neighbour, binary-alpha PNG.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const sharp = require(process.env.SHARP_MODULE || '/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root = path.dirname(fileURLToPath(import.meta.url));
const sourceConfigPath = path.join(root, 'level-asset-sources.json');
const balancePath = path.join(root, 'balance-data.json');

const PALETTE_HEX = [
  '231F2E', '4A3042', '735044', 'A57554', '41465C', '687486',
  'A6B1AE', 'D6D8BF', '24483F', '3F6A45', '71934B', 'B0BD67',
  '8B4A3F', 'C97952', 'E7AE73', 'F5D69A', '874056', 'C75B4B',
  'ED8A45', 'FFC36B', '3E3B70', '6961A6', '70A8B6', 'B7DEE0'
];
const PALETTE = PALETTE_HEX.map((hex) => [0, 2, 4].map((offset) => parseInt(hex.slice(offset, offset + 2), 16)));
const PALETTE_KEYS = new Set(PALETTE_HEX.map((hex) => parseInt(hex, 16)));
const ALPHA_THRESHOLD = 192;
const ROWS = 3;
const COLUMNS = 4;

// width, height, pivotX, pivotY, maximum adult bounds width and height.
const TARGETS = {
  oats: [64, 96, 32, 80, 54, 66],
  carrot: [64, 96, 32, 80, 54, 66],
  lettuce: [64, 96, 32, 80, 54, 66],
  clover: [64, 96, 32, 80, 54, 66],
  beet: [64, 96, 32, 80, 54, 66],
  maize: [64, 96, 32, 80, 54, 66],
  flax: [64, 96, 32, 80, 54, 66],
  sunflower: [64, 96, 32, 80, 54, 66],
  mint: [64, 96, 32, 80, 54, 66],
  blueberry: [64, 96, 32, 80, 54, 66],
  firepepper: [64, 96, 32, 80, 54, 66],
  silverkelp: [64, 96, 32, 80, 54, 66],
  moonherb: [64, 96, 32, 80, 54, 66],
  valerian: [64, 96, 32, 80, 54, 66],
  starbean: [64, 96, 32, 80, 54, 66],
  ambermelon: [64, 96, 32, 80, 54, 66],
  mistmushroom: [64, 96, 32, 80, 54, 66],
  sunpetal: [64, 96, 32, 80, 54, 66],
  mooncalf: [96, 128, 48, 112, 68, 88],
  kneazle: [96, 96, 48, 80, 64, 65],
  diricawl: [96, 96, 48, 80, 58, 58],
  fwooper: [96, 96, 48, 80, 58, 65],
  thestral: [160, 160, 80, 144, 115, 105],
  unicorn: [160, 160, 80, 144, 110, 105]
};

const cropGrowth = ['Gieo hạt', 'Nảy mầm', 'Đang lớn', 'Trưởng thành'];
const creatureGrowth = ['Con mới nở', 'Con nhỏ', 'Thiếu niên', 'Trưởng thành'];

const mkdir = (relative) => fs.mkdir(path.join(root, relative), {recursive: true});
const writeJson = (relative, value) => fs.writeFile(path.join(root, relative), `${JSON.stringify(value, null, 2)}\n`);

function parseArgs(argv) {
  return {partial: argv.includes('--partial'), help: argv.includes('--help') || argv.includes('-h')};
}

function usage() {
  console.log('Usage: node build-level-assets.mjs [--partial]');
  console.log('Default mode requires all eight source atlases; --partial exports available groups.');
}

function hashBytes(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function projection(raw, axis) {
  const {data, info} = raw;
  const length = axis === 'row' ? info.height : info.width;
  const values = new Array(length).fill(0);
  if (axis === 'row') {
    for (let y = 0; y < info.height; y += 1) {
      let count = 0;
      for (let x = 0; x < info.width; x += 1) {
        if (data[(y * info.width + x) * 4 + 3] >= ALPHA_THRESHOLD) count += 1;
      }
      values[y] = count;
    }
  } else {
    for (let x = 0; x < info.width; x += 1) {
      let count = 0;
      for (let y = 0; y < info.height; y += 1) {
        if (data[(y * info.width + x) * 4 + 3] >= ALPHA_THRESHOLD) count += 1;
      }
      values[x] = count;
    }
  }
  return values;
}

function zeroRuns(values, start, end) {
  const runs = [];
  let begin = null;
  for (let index = start; index <= end + 1; index += 1) {
    if (index <= end && values[index] === 0) {
      if (begin === null) begin = index;
    } else if (begin !== null) {
      runs.push({start: begin, end: index - 1, length: index - begin});
      begin = null;
    }
  }
  return runs;
}

/** Find transparent valleys near expected grid boundaries, without fixed cuts. */
function findCuts(values, count, axis, warnings) {
  const cuts = [0];
  const length = values.length;
  let previous = 0;
  for (let part = 1; part < count; part += 1) {
    const target = Math.round((length * part) / count);
    const window = Math.max(8, Math.round(length / (count * 2)));
    const start = Math.max(previous + 1, target - window);
    const end = Math.min(length - 1, target + window);
    const runs = zeroRuns(values, start, end);
    let cut;
    if (runs.length) {
      const run = runs.sort((a, b) => {
        const distanceA = Math.abs(((a.start + a.end) / 2) - target);
        const distanceB = Math.abs(((b.start + b.end) / 2) - target);
        return distanceA - distanceB || b.length - a.length;
      })[0];
      // Keep the boundary inside a transparent run and as near the nominal
      // position as possible. This retains unequal atlas gutters safely.
      cut = Math.max(run.start, Math.min(run.end, target));
    } else {
      cut = start;
      let minimum = values[start];
      for (let index = start + 1; index <= end; index += 1) {
        if (values[index] < minimum) {
          minimum = values[index];
          cut = index;
        }
      }
      warnings.push({
        type: 'crosscut-alpha',
        axis,
        boundary: part,
        target,
        selected: cut,
        opaquePixelsAtCut: minimum,
        message: `${axis} boundary ${part} has no transparent valley; selected the lowest alpha projection and retained the warning.`
      });
    }
    if (cut <= previous) cut = previous + 1;
    cuts.push(cut);
    previous = cut;
  }
  cuts.push(length);
  return cuts;
}

function alphaBounds(data, width, height, threshold = ALPHA_THRESHOLD) {
  let x0 = width;
  let y0 = height;
  let x1 = -1;
  let y1 = -1;
  let count = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * 4 + 3] < threshold) continue;
      x0 = Math.min(x0, x);
      y0 = Math.min(y0, y);
      x1 = Math.max(x1, x);
      y1 = Math.max(y1, y);
      count += 1;
    }
  }
  if (!count) return {x: 0, y: 0, w: 0, h: 0, count: 0, edge: false};
  return {x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1, count, edge: x0 === 0 || y0 === 0 || x1 === width - 1 || y1 === height - 1};
}

function cropBounds(raw, left, top, right, bottom) {
  const {data, info} = raw;
  const width = right - left;
  const height = bottom - top;
  const local = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    const sourceOffset = ((top + y) * info.width + left) * 4;
    data.copy(local, y * width * 4, sourceOffset, sourceOffset + width * 4);
  }
  return {local, width, height, bounds: alphaBounds(local, width, height)};
}

function closestPaletteIndex(r, g, b, cache) {
  const key = (r << 16) | (g << 8) | b;
  if (cache.has(key)) return cache.get(key);
  let best = 0;
  let distance = Infinity;
  PALETTE.forEach((color, index) => {
    const score = (r - color[0]) ** 2 * 2 + (g - color[1]) ** 2 * 3 + (b - color[2]) ** 2;
    if (score < distance) {
      distance = score;
      best = index;
    }
  });
  cache.set(key, best);
  return best;
}

function rasterizeFrame(cell, target, adultScale, paletteCache, warnings, itemId, stage) {
  const [width, height, pivotX, pivotY] = target;
  const margin = 4;
  const {bounds} = cell;
  const requestedScale = adultScale;
  const scale = bounds.count
    ? Math.min(adultScale, (width - margin * 2) / bounds.w, (height - margin * 2) / bounds.h)
    : adultScale;
  const outputWidth = Math.max(1, Math.round(bounds.w * scale));
  const outputHeight = Math.max(1, Math.round(bounds.h * scale));
  // The source bounds are sampled from the cell into a fresh local raster, so
  // the destination origin is based on the local bounds size. Including the
  // source-space x/y here would double-apply the crop offset and push content
  // into the native canvas edge.
  const offsetX = Math.round(pivotX - (bounds.w * scale) / 2);
  const offsetY = Math.round(pivotY - bounds.h * scale);
  const output = Buffer.alloc(width * height * 4);
  let clippedPixels = 0;
  for (let y = 0; y < outputHeight; y += 1) {
    for (let x = 0; x < outputWidth; x += 1) {
      const sourceX = bounds.x + Math.min(bounds.w - 1, Math.floor((x + 0.5) / scale));
      const sourceY = bounds.y + Math.min(bounds.h - 1, Math.floor((y + 0.5) / scale));
      const sourceIndex = (sourceY * cell.width + sourceX) * 4;
      if (cell.local[sourceIndex + 3] < ALPHA_THRESHOLD) continue;
      const destinationX = offsetX + x;
      const destinationY = offsetY + y;
      if (destinationX < 0 || destinationX >= width || destinationY < 0 || destinationY >= height) {
        clippedPixels += 1;
        continue;
      }
      const paletteIndex = closestPaletteIndex(cell.local[sourceIndex], cell.local[sourceIndex + 1], cell.local[sourceIndex + 2], paletteCache);
      const color = PALETTE[paletteIndex];
      const destinationIndex = (destinationY * width + destinationX) * 4;
      output[destinationIndex] = color[0];
      output[destinationIndex + 1] = color[1];
      output[destinationIndex + 2] = color[2];
      output[destinationIndex + 3] = 255;
    }
  }
  if (clippedPixels) {
    warnings.push({
      type: 'output-clip',
      item: itemId,
      stage,
      clippedPixels,
      message: `${itemId} stage ${stage} clipped ${clippedPixels} output pixels; inspect the target bounds before accepting the export.`
    });
  }
  const outputBounds = alphaBounds(output, width, height);
  if (!outputBounds.count) {
    warnings.push({type: 'empty-output', item: itemId, stage, message: `${itemId} stage ${stage} produced an empty output frame.`});
  }
  if (outputBounds.edge) {
    warnings.push({type: 'output-edge-contact', item: itemId, stage, bounds: outputBounds, message: `${itemId} stage ${stage} touches its native canvas edge.`});
  }
  return {output, outputBounds, width, height, pivotX, pivotY, requestedScale, scale, clippedPixels};
}

function findCatalogRecord(balance, id, kind) {
  const collection = kind === 'crop' ? balance.crops : balance.animals;
  const record = collection.find((entry) => entry.id === id);
  if (!record) throw new Error(`Missing ${kind} ${id} in balance-data.json`);
  return record;
}

function itemKind(groupFile) {
  return groupFile.startsWith('creatures-') ? 'creature' : 'crop';
}

function expectedTarget(id) {
  if (!TARGETS[id]) throw new Error(`No native target configured for ${id}`);
  return TARGETS[id];
}

async function processGroup(group, balance, globalWarnings) {
  const kind = itemKind(group.file);
  const sourceRelative = path.join('masters-levels', `${group.file}.png`);
  const sourcePath = path.join(root, sourceRelative);
  const sourceBytes = await fs.readFile(sourcePath);
  const sourceSha256 = hashBytes(sourceBytes);
  const raw = await sharp(sourceBytes).ensureAlpha().raw().toBuffer({resolveWithObject: true});
  const {info} = raw;
  const warnings = [];
  const rowProjection = projection(raw, 'row');
  const columnProjection = projection(raw, 'column');
  const rowCuts = findCuts(rowProjection, ROWS, 'row', warnings);
  const columnCuts = findCuts(columnProjection, COLUMNS, 'column', warnings);
  const extraction = {
    rows: ROWS,
    columns: COLUMNS,
    threshold: ALPHA_THRESHOLD,
    rowCuts,
    columnCuts,
    rowProjection: {length: rowProjection.length, nonzero: rowProjection.filter(Boolean).length, maximum: Math.max(...rowProjection)},
    columnProjection: {length: columnProjection.length, nonzero: columnProjection.filter(Boolean).length, maximum: Math.max(...columnProjection)},
    warnings: warnings.map((warning) => warning.message)
  };
  const paletteCache = new Map();
  const items = [];
  for (let row = 0; row < group.ids.length; row += 1) {
    const id = group.ids[row];
    const catalog = findCatalogRecord(balance, id, kind);
    const target = expectedTarget(id);
    const rowTop = rowCuts[row];
    const rowBottom = rowCuts[row + 1];
    const cells = [];
    for (let stage = 0; stage < COLUMNS; stage += 1) {
      const left = columnCuts[stage];
      const right = columnCuts[stage + 1];
      const cell = cropBounds(raw, left, rowTop, right, rowBottom);
      if (!cell.bounds.count) warnings.push({type: 'empty-source-cell', item: id, stage, message: `${id} stage ${stage} has no opaque pixels after the alpha threshold.`});
      if (cell.bounds.edge) {
        warnings.push({type: 'source-edge-contact', item: id, stage, bounds: cell.bounds, message: `${id} stage ${stage} reaches its detected cell edge; the atlas cut may cross its silhouette.`});
      }
      cells.push(cell);
    }
    const adult = cells[3].bounds;
    const [, , pivotX, pivotY, maxAdultWidth, maxAdultHeight] = target;
    const adultScale = adult.count
      ? Math.min(maxAdultWidth / adult.w, maxAdultHeight / adult.h)
      : 1;
    const frameRecords = [];
    await mkdir(path.join('native-levels', id));
    for (let stage = 0; stage < COLUMNS; stage += 1) {
      const rendered = rasterizeFrame(cells[stage], target, adultScale, paletteCache, warnings, id, stage);
      const frameRelative = path.join('native-levels', id, `frame-${String(stage + 1).padStart(2, '0')}.png`);
      await sharp(rendered.output, {raw: {width: rendered.width, height: rendered.height, channels: 4}}).png().toFile(path.join(root, frameRelative));
      frameRecords.push({
        file: frameRelative,
        width: rendered.width,
        height: rendered.height,
        pivotX: rendered.pivotX,
        pivotY: rendered.pivotY,
        sourceFrame: stage,
        sourceRect: {
          x: columnCuts[stage],
          y: rowTop,
          w: columnCuts[stage + 1] - columnCuts[stage],
          h: rowBottom - rowTop,
          bounds: cells[stage].bounds
        },
        bounds: rendered.outputBounds,
        scale: rendered.scale,
        adultScale,
        clippedPixels: rendered.clippedPixels
      });
    }
    const item = {
      id,
      label: catalog.label,
      kind,
      balance: {level: catalog.level, rarity: catalog.rarity, sourceRecord: kind === 'crop' ? 'crops' : 'animals'},
      growth: kind === 'crop' ? cropGrowth : creatureGrowth,
      source: sourceRelative,
      sourceSha256,
      sourceDimensions: {width: info.width, height: info.height},
      extraction: {
        group: group.file,
        row,
        rows: ROWS,
        columns: COLUMNS,
        rowCuts,
        columnCuts,
        alphaThreshold: ALPHA_THRESHOLD,
        warnings: warnings.filter((warning) => warning.item === id || !warning.item).map((warning) => warning.message)
      },
      frames: frameRecords,
      clips: {
        growth: {frames: [0, 1, 2, 3], durations: [900, 900, 900, 900], loop: false},
        idle: {frames: [3], durations: [1200], loop: true},
        action: {frames: [3], durations: [1200], loop: true}
      },
      notes: [
        'Bản xuất mới 1×: nearest resize, alpha 0/255, bảng màu 24 màu dùng chung.',
        'Idle/action dùng frame trưởng thành tĩnh; không giả chuyển động chưa được minh hoạ.'
      ]
    };
    items.push(item);
  }
  globalWarnings.push(...warnings.map((warning) => ({group: group.file, ...warning})));
  return {
    file: sourceRelative,
    ids: group.ids,
    kind,
    sourceSha256,
    sourceDimensions: {width: info.width, height: info.height},
    extraction,
    items
  };
}

function buildScript(manifest) {
  const data = JSON.stringify(manifest, null, 2);
  return `// Generated by build-level-assets.mjs. Load after motion-data.js.\n(() => {\n  const manifest = ${data};\n  const items = manifest.items || [];\n  window.FARM_LEVEL_ASSETS = manifest;\n  window.FARM_MOTION = window.FARM_MOTION || {version: 4, status: 'level assets only', palette: manifest.palette, pixelScale: 1, alphaThreshold: manifest.alphaThreshold, items: []};\n  if (!Array.isArray(window.FARM_MOTION.items)) window.FARM_MOTION.items = [];\n  const existing = new Set(window.FARM_MOTION.items.map((item) => item && item.id));\n  for (const item of items) {\n    if (!existing.has(item.id)) {\n      window.FARM_MOTION.items.push(item);\n      existing.add(item.id);\n    }\n  }\n})();\n`;
}

function htmlEscape(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[character]));
}

function buildReviewHtml(manifest) {
  const groups = manifest.groups.map((group) => {
    const items = group.items.map((item) => {
      const frames = item.frames.map((frame, index) => `
        <figure><div class="swatch light"><img src="${htmlEscape(frame.file)}" width="${frame.width}" height="${frame.height}" alt="${htmlEscape(item.id)} stage ${index + 1} on light background"></div><figcaption>stage ${index + 1} · ${frame.bounds.w}×${frame.bounds.h}</figcaption></figure>
        <figure><div class="swatch dark"><img src="${htmlEscape(frame.file)}" width="${frame.width}" height="${frame.height}" alt="${htmlEscape(item.id)} stage ${index + 1} on dark background"></div><figcaption>stage ${index + 1} · dark</figcaption></figure>`).join('');
      return `<article><h3>${htmlEscape(item.label)} <small>${htmlEscape(item.id)} · ${htmlEscape(item.kind)}</small></h3><div class="frames">${frames}</div></article>`;
    }).join('\n');
    return `<section><h2>${htmlEscape(group.file)} <small>${htmlEscape(group.kind)} · ${group.items.length} species</small></h2>${items}</section>`;
  }).join('\n');
  const warningList = manifest.warnings.length
    ? `<ul>${manifest.warnings.map((warning) => `<li>${htmlEscape(warning.message || warning)}</li>`).join('')}</ul>`
    : '<p>No extraction warnings.</p>';
  return `<!doctype html>
<meta charset="utf-8">
<title>Garden level asset review</title>
<style>
  :root { color-scheme: light dark; font: 14px/1.4 system-ui, sans-serif; }
  body { margin: 24px; background: #f3eee5; color: #231f2e; }
  h1, h2, h3 { margin: 0 0 8px; } h2 { border-bottom: 2px solid #a57554; padding-bottom: 4px; }
  h3 small, h2 small { font-weight: normal; opacity: .72; }
  section { margin: 28px 0; } article { margin: 18px 0; padding: 12px; background: #fffaf0; border: 1px solid #d6d8bf; border-radius: 8px; }
  .frames { display: grid; grid-template-columns: repeat(4, max-content); gap: 12px; align-items: start; }
  figure { margin: 0; min-width: 84px; } .swatch { display: grid; min-width: 84px; min-height: 84px; place-items: center; padding: 8px; border-radius: 6px; }
  .swatch.light { background: #fff; } .swatch.dark { background: #231f2e; }
  img { display: block; image-rendering: pixelated; image-rendering: crisp-edges; } figcaption { margin-top: 3px; font-size: 11px; opacity: .75; }
  .warning { padding: 10px 14px; border-left: 4px solid #c75b4b; background: #ffe2d9; }
  @media (max-width: 900px) { .frames { grid-template-columns: repeat(2, max-content); } }
</style>
<h1>Garden level asset review</h1>
<p>Status: <strong>${htmlEscape(manifest.status)}</strong> · ${manifest.itemCount} items · ${manifest.frameCount} frames · 1× source pixels</p>
<div class="warning"><strong>Extraction warnings</strong>${warningList}</div>
${groups}
`;
}

async function auditManifest(manifest) {
  const frames = [];
  for (const item of manifest.items) {
    const target = expectedTarget(item.id);
    for (const frame of item.frames) {
      const raw = await sharp(path.join(root, frame.file)).ensureAlpha().raw().toBuffer({resolveWithObject: true});
      const {data, info} = raw;
      let binaryAlpha = true;
      let palette24 = true;
      for (let index = 0; index < data.length; index += 4) {
        const alpha = data[index + 3];
        if (alpha !== 0 && alpha !== 255) binaryAlpha = false;
        if (alpha === 255 && !PALETTE_KEYS.has((data[index] << 16) | (data[index + 1] << 8) | data[index + 2])) palette24 = false;
      }
      const bounds = alphaBounds(data, info.width, info.height, ALPHA_THRESHOLD);
      const pivot = Number.isInteger(frame.pivotX) && Number.isInteger(frame.pivotY) && frame.pivotX === target[2] && frame.pivotY === target[3];
      const nativeSize = info.width === target[0] && info.height === target[1];
      const record = {
        item: item.id,
        stage: frame.sourceFrame,
        file: frame.file,
        nativeSize,
        binaryAlpha,
        palette24,
        nonEmpty: bounds.count > 0,
        edgeContact: bounds.edge,
        pivot,
        bounds,
        pass: nativeSize && binaryAlpha && palette24 && bounds.count > 0 && !bounds.edge && pivot
      };
      frames.push(record);
    }
  }
  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    status: manifest.status,
    complete: manifest.complete,
    expected: {groups: 8, items: 24, frames: 96},
    actual: {groups: manifest.groups.length, items: manifest.items.length, frames: frames.length},
    palette: PALETTE_HEX.map((hex) => `#${hex}`),
    alphaThreshold: ALPHA_THRESHOLD,
    warnings: manifest.warnings,
    frames,
    allFramesPass: frames.length > 0 && frames.every((frame) => frame.pass)
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return;
  }
  const config = JSON.parse(await fs.readFile(sourceConfigPath, 'utf8'));
  const balance = JSON.parse(await fs.readFile(balancePath, 'utf8'));
  const missing = [];
  const available = [];
  for (const group of config.groups) {
    const sourcePath = path.join(root, 'masters-levels', `${group.file}.png`);
    try {
      await fs.access(sourcePath);
      available.push(group);
    } catch {
      missing.push(group.file);
    }
  }
  if (!args.partial && missing.length) {
    throw new Error(`Missing ${missing.length} atlas source(s): ${missing.join(', ')}. Use --partial only for a bounded available-source export.`);
  }
  if (!available.length) throw new Error('No level atlas sources are available.');
  await mkdir('native-levels');
  const warnings = [];
  const groups = [];
  for (const group of available) groups.push(await processGroup(group, balance, warnings));
  const items = groups.flatMap((group) => group.items);
  const manifest = {
    version: 1,
    status: missing.length ? `partial: ${available.length}/8 source atlas groups` : 'complete: 8/8 source atlas groups',
    complete: missing.length === 0,
    missingGroups: missing,
    sourceConfig: 'level-asset-sources.json',
    balanceData: 'balance-data.json',
    palette: PALETTE_HEX.map((hex) => `#${hex}`),
    alphaThreshold: ALPHA_THRESHOLD,
    nearestResize: true,
    groups,
    items,
    itemCount: items.length,
    frameCount: items.reduce((total, item) => total + item.frames.length, 0),
    warnings: warnings.map((warning) => ({group: warning.group, type: warning.type, message: warning.message, item: warning.item, stage: warning.stage})),
    generatedAt: new Date().toISOString()
  };
  const audit = await auditManifest(manifest);
  await writeJson('level-assets.json', manifest);
  await fs.writeFile(path.join(root, 'level-assets.js'), buildScript(manifest));
  await writeJson('level-asset-audit.json', audit);
  await fs.writeFile(path.join(root, 'level-assets-review.html'), buildReviewHtml(manifest));
  console.log(JSON.stringify({status: manifest.status, groups: groups.map((group) => group.file), items: manifest.itemCount, frames: manifest.frameCount, warnings: warnings.length, auditPass: audit.allFramesPass, missing}, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
