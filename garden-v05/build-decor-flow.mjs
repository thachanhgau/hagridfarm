// Export six authored two-angle decor masters through the native pixel-art
// pipeline and replace only their runtime art records.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { authoredCells } from './authored-atlas.mjs';
import { exportSprite } from './build-complete-objects.mjs';
import { packNativeAtlas } from './native-atlas.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const sharp = require(process.env.SHARP_MODULE || '/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

export const DECOR_FLOW_IDS = Object.freeze([
  'sp_hagrid_umbrella',
  'hw_violet_mist_pond',
  'hw_blinking_chest',
  'hw_monster_bookcase',
  'hw_eyeball_flowers',
  'hw_candy_cauldron',
]);

// The audit identified these four as the real motion targets. The umbrella
// and pond retain static-pose intent unless their source record says otherwise.
const ANIMATED_IDS = new Set([
  'hw_blinking_chest',
  'hw_monster_bookcase',
  'hw_eyeball_flowers',
  'hw_candy_cauldron',
]);

const rootPath = file => path.isAbsolute(file) ? file : path.join(root, file);
const readJson = async file => JSON.parse(await fs.readFile(rootPath(file), 'utf8'));

function sourceItems(source) {
  return Array.isArray(source) ? source : source?.items;
}

function unionBounds(frames) {
  const x = Math.min(...frames.map(frame => frame.bounds.x));
  const y = Math.min(...frames.map(frame => frame.bounds.y));
  const right = Math.max(...frames.map(frame => frame.bounds.x + frame.bounds.w));
  const bottom = Math.max(...frames.map(frame => frame.bounds.y + frame.bounds.h));
  return { x, y, w: right - x, h: bottom - y };
}

function fits(pose, spec, scale) {
  const width = Math.max(1, Math.round(pose.bounds.w * scale));
  const height = Math.max(1, Math.round(pose.bounds.h * scale));
  const x = Math.round(spec.pivotX - (pose.anchorX == null ? width / 2 : (pose.anchorX - pose.bounds.x) * scale));
  const y = spec.pivotY - height;
  return x >= 1 && y >= 1 && x + width < spec.width && y + height < spec.height;
}

function nativeScale(poses, spec) {
  const widest = Math.max(...poses.map(pose => pose.bounds.w));
  const tallest = Math.max(...poses.map(pose => pose.bounds.h));
  let low = 0;
  let high = Math.min(spec.width / widest, spec.height / tallest);
  // Source masters are intentionally larger than the native canvas. Sampling
  // may therefore be fractional; exportSprite still rounds every native
  // output dimension and coordinate to an integer pixel.
  for (let attempt = 0; attempt < 48; attempt += 1) {
    const middle = (low + high) / 2;
    if (poses.every(pose => fits(pose, spec, middle))) low = middle;
    else high = middle;
  }
  let scale = Number(low.toFixed(9));
  while (scale > 0 && !poses.every(pose => fits(pose, spec, scale))) scale = Number((scale - 1e-6).toFixed(9));
  if (!(scale > 0)) throw new Error(`${spec.id}: authored poses do not fit its native canvas`);
  return scale;
}

function assertUnique(ids, label) {
  if (new Set(ids).size !== ids.length) throw new Error(`${label}: duplicate IDs`);
}

export async function buildDecorFlow({
  sourceFile = 'decor-flow-sources.json',
  runtimeFile = 'decor-assets-manifest.json',
  provenanceFile = 'decor-flow-manifest.json',
} = {}) {
  const source = await readJson(sourceFile);
  const records = sourceItems(source);
  if (!records) throw new Error(`${sourceFile}: expected an items array`);
  assertUnique(records.map(record => record.id), sourceFile);
  if (records.length !== DECOR_FLOW_IDS.length || records.some(record => !DECOR_FLOW_IDS.includes(record.id))) {
    throw new Error(`${sourceFile}: expected exactly ${DECOR_FLOW_IDS.join(', ')}`);
  }

  const runtime = await readJson(runtimeFile);
  if (!Array.isArray(runtime.items)) throw new Error(`${runtimeFile}: expected an items array`);
  assertUnique(runtime.items.map(item => item.id), runtimeFile);
  const runtimeById = new Map(runtime.items.map(item => [item.id, item]));
  for (const id of DECOR_FLOW_IDS) if (!runtimeById.has(id)) throw new Error(`${runtimeFile}: missing ${id}`);

  const unchangedHashes = Object.fromEntries(runtime.items
    .filter(item => !DECOR_FLOW_IDS.includes(item.id))
    .map(item => [item.id, sha256(Buffer.from(JSON.stringify(item)))]));
  const updates = new Map();
  const provenanceItems = [];

  for (const record of records) {
    const base = runtimeById.get(record.id);
    const spec = {
      id: `decor-flow-${record.id}`,
      width: Number(base.width),
      height: Number(base.height),
      pivotX: Number(base.pivotX),
      pivotY: Number(base.pivotY),
    };
    if (![spec.width, spec.height, spec.pivotX, spec.pivotY].every(Number.isInteger)) {
      throw new Error(`${record.id}: runtime width/height/pivot must remain integer values`);
    }

    const masterBytes = await fs.readFile(rootPath(record.master));
    const masterSha256 = sha256(masterBytes);
    if (record.masterSha256 && record.masterSha256 !== masterSha256) {
      throw new Error(`${record.id}: master provenance mismatch`);
    }
    const raw = await sharp(masterBytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const poses = authoredCells(raw, [4, 4]);
    for (const pose of poses) {
      const b=pose.mainBounds,base=[];
      for(let y=Math.max(b.y,b.y+b.h-Math.max(2,Math.round(b.h*.05)));y<b.y+b.h;y++)for(let x=b.x;x<b.x+b.w;x++)if(pose.data[(y*pose.width+x)*4+3]>=192)base.push(x);
      base.sort((a,b)=>a-b);pose.anchorX=base[Math.floor(base.length/2)]+.5;
    }
    const scale = nativeScale(poses, spec);
    const outputFolder = 'native-crop-complete';
    const assetFolder = `${outputFolder}/${spec.id}`;
    const frameRecords = [];
    for (const [index, pose] of poses.entries()) {
      frameRecords.push(await exportSprite({ ...record, id: spec.id, outputFolder }, pose, index, spec, scale));
    }
    const atlas = await packNativeAtlas(root, `${assetFolder}/atlas.png`, frameRecords);
    const defaultFrames = frameRecords.slice(0, 4);
    const rightFrames = frameRecords.slice(4);
    const atlasFile = atlas.file;
    const defaultThumbnail = `decor-assets/native/flow-${record.id}.png`;
    const rightThumbnail = `decor-assets/native/flow-${record.id}_right.png`;
    await fs.mkdir(path.dirname(rootPath(defaultThumbnail)), { recursive: true });
    await fs.copyFile(rootPath(defaultFrames[0].file), rootPath(defaultThumbnail));
    await fs.copyFile(rootPath(rightFrames[0].file), rootPath(rightThumbnail));
    const defaultThumbnailSha256 = sha256(await fs.readFile(rootPath(defaultThumbnail)));
    const rightThumbnailSha256 = sha256(await fs.readFile(rootPath(rightThumbnail)));
    const staticIntent = record.framesIdentical ?? base.framesIdentical ?? true;
    const framesIdentical = ANIMATED_IDS.has(record.id) ? false : Boolean(staticIntent);
    const runtimeUpdate = {
      ...base,
      file: defaultThumbnail,
      rightFile: rightThumbnail,
      frames: Array(4).fill(atlasFile),
      rightFrames: Array(4).fill(atlasFile),
      atlasRects: atlas.frames.slice(0, 4).map(frame => frame.atlasRect),
      rightAtlasRects: atlas.frames.slice(4).map(frame => frame.atlasRect),
      bounds: unionBounds(defaultFrames),
      rightBounds: unionBounds(rightFrames),
      framesIdentical,
      ...(Array.isArray(record.durations) && record.durations.length===4 ? {durations:record.durations} : {}),
    };
    updates.set(record.id, runtimeUpdate);
    provenanceItems.push({
      id: record.id,
      master: record.master,
      masterSha256,
      sourceRecord: record,
      outputFolder,
      assetFolder,
      scale,
      target: spec,
      frames: frameRecords,
      atlas,
      thumbnails: {
        file: defaultThumbnail,
        rightFile: rightThumbnail,
        sha256: defaultThumbnailSha256,
        rightSha256: rightThumbnailSha256,
      },
      runtime: runtimeUpdate,
    });
  }

  const updatedItems = runtime.items.map(item => updates.get(item.id) || item);
  const output = { ...runtime, items: updatedItems };
  for (const item of updatedItems) {
    if (DECOR_FLOW_IDS.includes(item.id)) continue;
    const before = unchangedHashes[item.id];
    const after = sha256(Buffer.from(JSON.stringify(item)));
    if (before !== after) throw new Error(`${item.id}: unrelated decor record changed`);
  }
  await fs.writeFile(rootPath(runtimeFile), `${JSON.stringify(output, null, 2)}\n`);
  const provenance = {
    version: 1,
    method: 'authored 2×4 angle master; common native sampling scale; integer native canvas coordinates; palette24; binary alpha; union bounds; exact atlas RGBA',
    sourceFile,
    runtimeFile,
    targetIds: [...DECOR_FLOW_IDS],
    animatedIds: [...ANIMATED_IDS],
    unchangedEntryHashes: unchangedHashes,
    items: provenanceItems,
  };
  await fs.writeFile(rootPath(provenanceFile), `${JSON.stringify(provenance, null, 2)}\n`);
  return { runtime: output, provenance };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  buildDecorFlow().then(result => {
    console.log(JSON.stringify({ ids: result.provenance.targetIds, atlases: result.provenance.items.length }));
  }).catch(error => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
