// Technical exporter for the care-animation atlases. It copies the supplied
// masters into a new provenance directory and writes only new native-care
// frames plus the care manifest/runtime extension. Existing level assets are
// read-only inputs.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const sharp = require(process.env.SHARP_MODULE || '/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root = path.dirname(fileURLToPath(import.meta.url));
const levelManifestPath = path.join(root, 'level-assets.json');
const sourceRoot = '/Users/thachanh/.codex/generated_images/01a1336a-1a81-7fd1-838a-938d62b6dd7d';

const PALETTE_HEX = [
  '231F2E', '4A3042', '735044', 'A57554', '41465C', '687486',
  'A6B1AE', 'D6D8BF', '24483F', '3F6A45', '71934B', 'B0BD67',
  '8B4A3F', 'C97952', 'E7AE73', 'F5D69A', '874056', 'C75B4B',
  'ED8A45', 'FFC36B', '3E3B70', '6961A6', '70A8B6', 'B7DEE0'
];
const PALETTE = PALETTE_HEX.map((hex) => [0, 2, 4].map((offset) => parseInt(hex.slice(offset, offset + 2), 16)));
const PALETTE_KEYS = new Set(PALETTE_HEX.map((hex) => parseInt(hex, 16)));
const ALPHA_THRESHOLD = 192;
const CELL_WIDTH = 362;
const CELL_HEIGHT = 362;
const ROWS = 3;
const COLUMNS = 4;
const CARE_CLIPS = {
  idle: {frames: [4, 5, 4], durations: [760, 180, 760], loop: true},
  eat: {frames: [6, 6, 4, 6], durations: [300, 420, 340, 820], loop: false},
  care: {frames: [7, 4, 7, 4], durations: [260, 620, 260, 820], loop: false}
};
const ATLAS_SPECS = [
  {
    sourceName: 'exec-4e585585-28e0-4782-81e9-8eb10dfbf683.png',
    outputName: 'creatures-a-care.png',
    species: ['mooncalf', 'kneazle', 'diricawl']
  },
  {
    sourceName: 'exec-84f3f575-5997-449c-87a2-ea69767fb716.png',
    outputName: 'creatures-b-care.png',
    species: ['fwooper', 'thestral', 'unicorn']
  }
];

const mkdir = (relative) => fs.mkdir(path.join(root, relative), {recursive: true});
const writeJson = (relative, value) => fs.writeFile(path.join(root, relative), `${JSON.stringify(value, null, 2)}\n`);
const hashBytes = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');

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

function rowCuts(raw) {
  const counts=Array.from({length:raw.info.height},()=>0);
  for(let y=0;y<raw.info.height;y++)for(let x=0;x<raw.info.width;x++)if(raw.data[(y*raw.info.width+x)*4+3]>=ALPHA_THRESHOLD)counts[y]++;
  const cuts=[0];
  for(let row=1;row<ROWS;row++){
    const center=Math.round(raw.info.height*row/ROWS),min=center-80,max=center+80;
    let start=-1,best=null;
    for(let y=min;y<=max+1;y++){
      if(y<=max&&counts[y]===0){if(start<0)start=y;}
      else if(start>=0){if(!best||y-start>best[1]-best[0])best=[start,y];start=-1;}
    }
    if(!best)throw Error('No transparent separator between care rows '+row);
    cuts.push(Math.floor((best[0]+best[1])/2));
  }
  return [...cuts,raw.info.height];
}
function cellBounds(raw, row, column) {
  const {data,info}=raw,cuts=rowCuts(raw),xStart=column*CELL_WIDTH,yStart=cuts[row],height=cuts[row+1]-yStart;
  const local=Buffer.alloc(CELL_WIDTH*height*4);
  for(let y=0;y<height;y++){
    const sourceOffset=((yStart+y)*info.width+xStart)*4;
    data.copy(local,y*CELL_WIDTH*4,sourceOffset,sourceOffset+CELL_WIDTH*4);
  }
  return {local,width:CELL_WIDTH,height,rect:{x:xStart,y:yStart,w:CELL_WIDTH,h:height},bounds:alphaBounds(local,CELL_WIDTH,height)};
}

function geometryFor(bounds, scale, pivotX, pivotY) {
  const width = Math.max(1, Math.round(bounds.w * scale));
  const height = Math.max(1, Math.round(bounds.h * scale));
  return {
    width,
    height,
    // Anchor the integer raster's last opaque row to pivotY. Rounding the
    // scaled float offset can otherwise place a half-pixel-height eat frame
    // one row below the shared ground baseline.
    x: Math.round(pivotX - width / 2),
    y: pivotY - height
  };
}

function resolveCanvas(base, cells, scale) {
  let requiredPadding = 0;
  const geometry = cells.map((cell) => geometryFor(cell.bounds, scale, base.pivotX, base.pivotY));
  // Keep at least a one-pixel transparent safety margin on every side. If a
  // care silhouette needs more room, add the same padding to both dimensions
  // and shift both pivot coordinates by that amount.
  for (const frame of geometry) {
    requiredPadding = Math.max(
      requiredPadding,
      1 - frame.x,
      1 - frame.y,
      frame.x + frame.width - (base.width - 1),
      frame.y + frame.height - (base.height - 1)
    );
  }
  const padding = Math.max(0, Math.ceil(requiredPadding));
  return {
    width: base.width + padding * 2,
    height: base.height + padding * 2,
    pivotX: base.pivotX + padding,
    pivotY: base.pivotY + padding,
    padding,
    baseWidth: base.width,
    baseHeight: base.height,
    basePivotX: base.pivotX,
    basePivotY: base.pivotY
  };
}

function rasterizeFrame(cell, scale, canvas, paletteCache) {
  const source = cell.bounds;
  const geometry = geometryFor(source, scale, canvas.pivotX, canvas.pivotY);
  const output = Buffer.alloc(canvas.width * canvas.height * 4);
  let clippedPixels = 0;
  for (let y = 0; y < geometry.height; y += 1) {
    for (let x = 0; x < geometry.width; x += 1) {
      const sourceX = source.x + Math.min(source.w - 1, Math.floor((x + 0.5) / scale));
      const sourceY = source.y + Math.min(source.h - 1, Math.floor((y + 0.5) / scale));
      const sourceIndex = (sourceY * cell.width + sourceX) * 4;
      if (cell.local[sourceIndex + 3] < ALPHA_THRESHOLD) continue;
      const destinationX = geometry.x + x;
      const destinationY = geometry.y + y;
      if (destinationX < 0 || destinationX >= canvas.width || destinationY < 0 || destinationY >= canvas.height) {
        clippedPixels += 1;
        continue;
      }
      const paletteIndex = closestPaletteIndex(cell.local[sourceIndex], cell.local[sourceIndex + 1], cell.local[sourceIndex + 2], paletteCache);
      const color = PALETTE[paletteIndex];
      const destinationIndex = (destinationY * canvas.width + destinationX) * 4;
      output[destinationIndex] = color[0];
      output[destinationIndex + 1] = color[1];
      output[destinationIndex + 2] = color[2];
      output[destinationIndex + 3] = 255;
    }
  }
  const bounds = alphaBounds(output, canvas.width, canvas.height);
  return {
    output,
    geometry,
    bounds,
    clippedPixels,
    binaryAlpha: true,
    palette24: true
  };
}

function frameRecord(relativeFile, rendered, cell, scale, canvas, careFrame) {
  return {
    file: relativeFile,
    width: canvas.width,
    height: canvas.height,
    pivotX: canvas.pivotX,
    pivotY: canvas.pivotY,
    careFrame,
    sourceFrame: careFrame,
    sourceRect: cell.rect,
    sourceBounds: cell.bounds,
    bounds: rendered.bounds,
    scale,
    baseline: {
      sourceBottom: cell.bounds.y + cell.bounds.h,
      outputBottom: rendered.bounds.y + rendered.bounds.h,
      pivotY: canvas.pivotY,
      anchor: 'source alpha-bounds bottom to native pivotY'
    },
    horizontalAnchor: 'source alpha-bounds center to native pivotX',
    clippedPixels: rendered.clippedPixels,
    edgeContact: rendered.bounds.edge
  };
}

function buildMotionScript(manifest) {
  const data = JSON.stringify(manifest, null, 2);
  return `// Generated by build-care-assets.mjs. Load after level-assets.js.\n(() => {\n  const manifest = ${data};\n  window.FARM_CARE_ASSETS = manifest;\n  const itemsById = new Map((manifest.items || []).map((item) => [item.id, item]));\n  const collections = [window.FARM_LEVEL_ASSETS?.items, window.FARM_MOTION?.items];\n  const patched = new Set();\n  for (const collection of collections) {\n    if (!Array.isArray(collection)) continue;\n    for (const item of collection) {\n      const care = itemsById.get(item?.id);\n      if (!care || patched.has(item.id)) continue;\n      if (item.__gardenCareV05Applied) {\n        patched.add(item.id);\n        continue;\n      }\n      if (!Array.isArray(item.frames) || item.frames.length < 4) {\n        throw new Error(\`Care assets require four growth frames for \${item.id}.\`);\n      }\n      item.frames.push(...care.frames);\n      item.clips = {\n        ...(item.clips || {}),\n        idle: care.clips.idle,\n        eat: care.clips.eat,\n        care: care.clips.care\n      };\n      item.careAssets = {\n        version: manifest.version,\n        frames: care.frames.map((frame) => frame.file),\n        baseFrameSha256: care.baseFrameSha256\n      };\n      item.__gardenCareV05Applied = true;\n      patched.add(item.id);\n    }\n  }\n  const missing = (manifest.items || []).map((item) => item.id).filter((id) => !patched.has(id));\n  if (missing.length) throw new Error(\`Care assets loaded before level assets or missing targets: \${missing.join(', ')}\`);\n})();\n`;
}

function htmlEscape(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[character]));
}

function buildContactSheet(manifest) {
  const sections = manifest.items.map((item) => {
    const framesByIndex = new Map(item.frames.map((frame, index) => [index + 4, frame]));
    const growthCells = [0, 1, 2, 3].map((frameIndex) => {
      const file = `native-levels/${item.id}/frame-${String(frameIndex + 1).padStart(2, '0')}.png`;
      return `<figure><div class="swatch light"><img src="../${htmlEscape(file)}" alt="${htmlEscape(item.id)} growth frame ${frameIndex} light"><div class="meta">growth · frame ${frameIndex}</div></div></figure><figure><div class="swatch dark"><img src="../${htmlEscape(file)}" alt="${htmlEscape(item.id)} growth frame ${frameIndex} dark"><div class="meta">dark</div></div></figure>`;
    }).join('');
    const clipRows = ['idle', 'eat', 'care'].map((clipName) => {
      const clip = item.clips[clipName];
      const cells = clip.frames.map((frameIndex, index) => {
        const frame = framesByIndex.get(frameIndex);
        return `<figure><div class="swatch light"><img src="../${htmlEscape(frame.file)}" alt="${htmlEscape(item.id)} ${htmlEscape(clipName)} frame ${frameIndex} light"><div class="meta">${htmlEscape(clipName)} · frame ${frameIndex} · step ${index + 1}</div></div></figure><figure><div class="swatch dark"><img src="../${htmlEscape(frame.file)}" alt="${htmlEscape(item.id)} ${htmlEscape(clipName)} frame ${frameIndex} dark"><div class="meta">dark · ${frame.bounds.w}×${frame.bounds.h}</div></div></figure>`;
      }).join('');
      return `<h4>${htmlEscape(clipName)} · ${clip.frames.join(' → ')} · ${clip.durations.join(' / ')}ms</h4><div class="frames">${cells}</div>`;
    }).join('');
    return `<section><h2>${htmlEscape(item.label)} <small>${htmlEscape(item.id)}</small></h2><p class="source">neutral-scale ${item.neutralScale.toFixed(6)} · canvas ${item.canvas.width}×${item.canvas.height} · pivot ${item.canvas.pivotX},${item.canvas.pivotY} · source ${htmlEscape(item.atlas.file)}</p><h4>growth · frames 0 → 3</h4><div class="frames">${growthCells}</div>${clipRows}</section>`;
  }).join('');
  return `<!doctype html>\n<meta charset="utf-8">\n<title>Garden v05 care asset contact sheet</title>\n<style>\n:root{font:14px/1.4 system-ui,sans-serif;color:#231f2e;background:#f3eee5}body{margin:20px}h1{margin:0 0 5px}h2{margin:26px 0 3px;padding-bottom:4px;border-bottom:2px solid #a57554}h2 small{font-weight:400;opacity:.65}.source{margin:0 0 10px;opacity:.7;font-size:12px}h4{margin:12px 0 6px;text-transform:capitalize}.frames{display:grid;grid-template-columns:repeat(8,max-content);gap:7px;align-items:start}.swatch{display:grid;place-items:center;width:150px;min-height:150px;padding:8px;border-radius:7px}.swatch.light{background:#fff}.swatch.dark{background:#231f2e}.swatch img{display:block;max-width:150px;max-height:150px;image-rendering:pixelated;image-rendering:crisp-edges}.meta{margin-top:4px;font-size:10px;opacity:.72}.dark .meta{color:#fff}@media(max-width:1100px){.frames{grid-template-columns:repeat(4,max-content)}}@media(max-width:650px){body{margin:10px}.frames{grid-template-columns:repeat(2,max-content)}.swatch{width:128px;min-height:128px}.swatch img{max-width:128px;max-height:128px}}</style>\n<h1>Garden v05 care asset contact sheet</h1><p>Filesystem gallery only. Each source frame is shown on a light and dark checker surface; no browser QA is implied by this file.</p>${sections}\n`;
}

async function main() {
  const levelManifest = JSON.parse(await fs.readFile(levelManifestPath, 'utf8'));
  const levelItems = new Map(levelManifest.items.map((item) => [item.id, item]));
  const atlasManifests = [];
  const outputItems = [];
  await mkdir('masters-care');
  await mkdir('native-care');
  const paletteCache = new Map();

  for (const spec of ATLAS_SPECS) {
    const sourcePath = path.join(sourceRoot, spec.sourceName);
    const sourceBytes = await fs.readFile(sourcePath);
    const targetPath = path.join(root, 'masters-care', spec.outputName);
    await fs.writeFile(targetPath, sourceBytes);
    const raw = await sharp(sourceBytes).ensureAlpha().raw().toBuffer({resolveWithObject: true});
    const {info} = raw;
    if (info.width !== CELL_WIDTH * COLUMNS || info.height !== CELL_HEIGHT * ROWS) {
      throw new Error(`${spec.sourceName} expected ${CELL_WIDTH * COLUMNS}×${CELL_HEIGHT * ROWS}, got ${info.width}×${info.height}`);
    }
    const atlasHash = hashBytes(sourceBytes);
    const atlasRecord = {
      file: `masters-care/${spec.outputName}`,
      sourcePath: sourcePath,
      sourceSha256: atlasHash,
      sourceDimensions: {width: info.width, height: info.height},
      rows: ROWS,
      columns: COLUMNS,
      cellDimensions: {width: CELL_WIDTH, rowCuts: rowCuts(raw)},
      species: spec.species
    };
    atlasManifests.push(atlasRecord);

    for (let row = 0; row < spec.species.length; row += 1) {
      const id = spec.species[row];
      const levelItem = levelItems.get(id);
      if (!levelItem) throw new Error(`Missing level asset item ${id}`);
      const base = levelItem.frames[3];
      const baseBytes = await fs.readFile(path.join(root, base.file));
      const actualBaseRaw = await sharp(baseBytes).ensureAlpha().raw().toBuffer({resolveWithObject: true});
      const actualBaseBounds = alphaBounds(actualBaseRaw.data, actualBaseRaw.info.width, actualBaseRaw.info.height);
      const baseBounds = {...(base.bounds || actualBaseBounds)};
      const cells = [];
      for (let column = 0; column < COLUMNS; column += 1) cells.push(cellBounds(raw, row, column));
      const neutral = cells[0].bounds;
      if (!neutral.count) throw new Error(`${id} neutral care frame is empty after alpha threshold`);
      const scale = baseBounds.h / neutral.h;
      if (!Number.isFinite(scale) || scale <= 0) throw new Error(`${id} invalid neutral scale ${scale}`);
      const baseCanvas = {width: base.width, height: base.height, pivotX: base.pivotX, pivotY: base.pivotY};
      const canvas = resolveCanvas(baseCanvas, cells, scale);
      const frames = [];
      const warnings = [];
      if (cells.some((cell) => cell.bounds.edge)) {
        warnings.push('Source silhouette touches a detected cell edge; inspect before accepting.');
      }
      if (canvas.padding) warnings.push(`Canvas padded uniformly by ${canvas.padding}px to preserve a one-pixel transparent edge.`);
      for (let careFrame = 0; careFrame < COLUMNS; careFrame += 1) {
        const cell = cells[careFrame];
        const rendered = rasterizeFrame(cell, scale, canvas, paletteCache);
        const relativeFile = path.join('native-care', id, `frame-${String(careFrame + 1).padStart(2, '0')}.png`);
        await fs.mkdir(path.dirname(path.join(root, relativeFile)), {recursive: true});
        await sharp(rendered.output, {raw: {width: canvas.width, height: canvas.height, channels: 4}}).png().toFile(path.join(root, relativeFile));
        frames.push(frameRecord(relativeFile, rendered, cell, scale, canvas, careFrame));
        if (rendered.clippedPixels) warnings.push(`${id} care frame ${careFrame + 1} clipped ${rendered.clippedPixels} pixels.`);
        if (rendered.bounds.edge) warnings.push(`${id} care frame ${careFrame + 1} touches the native canvas edge.`);
      }
      outputItems.push({
        id,
        label: levelItem.label,
        kind: levelItem.kind,
        growth: [...levelItem.growth],
        baseFrame: base.file,
        baseFrameSha256: hashBytes(baseBytes),
        baseBounds: actualBaseBounds,
        atlas: {...atlasRecord, row, rowSpecies: id},
        neutralScale: scale,
        canvas,
        frames,
        clips: CARE_CLIPS,
        growthPreserved: {
          frames: [...(levelItem.clips?.growth?.frames || [0, 1, 2, 3])],
          durations: [...(levelItem.clips?.growth?.durations || [900, 900, 900, 900])],
          loop: levelItem.clips?.growth?.loop === true
        },
        warnings
      });
    }
  }

  const manifest = {
    version: 1,
    status: 'complete: 6/6 care-animation species',
    generatedBy: 'build-care-assets.mjs',
    loadAfter: 'level-assets.js',
    palette: PALETTE_HEX.map((hex) => `#${hex}`),
    alphaThreshold: ALPHA_THRESHOLD,
    nearestResize: true,
    binaryAlpha: true,
    animationContract: {
      oldGrowthFramesPreserved: [0, 1, 2, 3],
      careFramesAppended: [4, 5, 6, 7],
      clips: CARE_CLIPS,
      durationsFiniteMs: true,
      baselineAnchor: 'alpha-bounds bottom to native adult pivotY',
      horizontalAnchor: 'alpha-bounds center to native adult pivotX'
    },
    sourceAtlases: atlasManifests,
    items: outputItems,
    itemCount: outputItems.length,
    frameCount: outputItems.reduce((sum, item) => sum + item.frames.length, 0),
    generatedAt: new Date().toISOString()
  };
  await writeJson('care-assets-manifest.json', manifest);
  await fs.writeFile(path.join(root, 'motion-care-data.js'), buildMotionScript(manifest));
  await fs.writeFile(path.join(root, 'qa-care', 'contact-sheet.html'), buildContactSheet(manifest));
  console.log(JSON.stringify({status: manifest.status, items: manifest.itemCount, frames: manifest.frameCount, atlases: atlasManifests.map((atlas) => ({file: atlas.file, sha256: atlas.sourceSha256})), paddedItems: outputItems.filter((item) => item.canvas.padding).map((item) => item.id), warnings: outputItems.flatMap((item) => item.warnings)}, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
