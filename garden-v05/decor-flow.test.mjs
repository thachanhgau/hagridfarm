import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { SPRITE_PALETTE } from './palette.mjs';
import { DECOR_FLOW_IDS } from './build-decor-flow.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const sharp = require(process.env.SHARP_MODULE || '/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const sourcePath = path.join(root, 'decor-flow-sources.json');
const runtimePath = path.join(root, 'decor-assets-manifest.json');
const provenancePath = path.join(root, 'decor-flow-manifest.json');
const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const hashJson = value => sha256(Buffer.from(JSON.stringify(value)));
const resolveRoot = file => path.isAbsolute(file) ? file : path.join(root, file);
const palette = new Set(SPRITE_PALETTE.map(hex => hex.slice(1).match(/../g).map(value => parseInt(value, 16)).join(',')));
const animatedIds = new Set(['hw_blinking_chest', 'hw_monster_bookcase', 'hw_eyeball_flowers', 'hw_candy_cauldron']);
const unionBounds = frames => {
  const x = Math.min(...frames.map(frame => frame.bounds.x));
  const y = Math.min(...frames.map(frame => frame.bounds.y));
  const right = Math.max(...frames.map(frame => frame.bounds.x + frame.bounds.w));
  const bottom = Math.max(...frames.map(frame => frame.bounds.y + frame.bounds.h));
  return { x, y, w: right - x, h: bottom - y };
};

const hasSources = fsSync.existsSync(sourcePath);

test('decor flow exports six two-angle native atlases without altering unrelated records', { skip: !hasSources }, async () => {
  const source = JSON.parse(await fs.readFile(sourcePath, 'utf8'));
  const provenance = JSON.parse(await fs.readFile(provenancePath, 'utf8'));
  const runtime = JSON.parse(await fs.readFile(runtimePath, 'utf8'));
  const records = Array.isArray(source) ? source : source.items;
  assert.deepEqual(records.map(record => record.id).sort(), [...DECOR_FLOW_IDS].sort());
  assert.deepEqual(provenance.targetIds, [...DECOR_FLOW_IDS]);
  assert.deepEqual(provenance.animatedIds.sort(), [...animatedIds].sort());
  const runtimeById = new Map(runtime.items.map(item => [item.id, item]));
  const provenanceById = new Map(provenance.items.map(item => [item.id, item]));

  for (const id of DECOR_FLOW_IDS) {
    const item = runtimeById.get(id);
    const generated = provenanceById.get(id);
    const sourceRecord = records.find(record => record.id === id);
    assert.ok(item && generated, id);
    assert.equal(generated.masterSha256, sha256(await fs.readFile(resolveRoot(sourceRecord.master))), `${id}: master preserved`);
    assert.equal(generated.scale > 0 && Number.isFinite(generated.scale), true, `${id}: native sampling scale`);
    assert.equal(item.file, generated.thumbnails.file);
    assert.equal(item.rightFile, generated.thumbnails.rightFile);
    assert.deepEqual(item.frames, Array(4).fill(generated.atlas.file));
    assert.deepEqual(item.rightFrames, Array(4).fill(generated.atlas.file));
    if (animatedIds.has(id)) assert.equal(item.framesIdentical, false, `${id}: animated poses must be distinct`);
    assert.equal(item.atlasRects.length, 4);
    assert.equal(item.rightAtlasRects.length, 4);
    assert.match(item.file, new RegExp(`^decor-assets/native/flow-${id}\\.png$`));
    assert.match(item.rightFile, new RegExp(`^decor-assets/native/flow-${id}_right\\.png$`));
    assert.deepEqual(item.bounds, unionBounds(generated.frames.slice(0, 4)), `${id}: default bounds union`);
    assert.deepEqual(item.rightBounds, unionBounds(generated.frames.slice(4)), `${id}: right bounds union`);

    const target = generated.target;
    assert.deepEqual({ width: item.width, height: item.height, pivotX: item.pivotX, pivotY: item.pivotY }, {width:target.width,height:target.height,pivotX:target.pivotX,pivotY:target.pivotY});
    const atlas = await fs.readFile(resolveRoot(generated.atlas.file));
    const atlasInfo = await sharp(atlas).metadata();
    assert.equal(atlasInfo.width, generated.atlas.width, `${id}: atlas width`);
    assert.equal(atlasInfo.height, generated.atlas.height, `${id}: atlas height`);
    for (const [thumbnail, rect, hash] of [
      [item.file, item.atlasRects[0], generated.thumbnails.sha256],
      [item.rightFile, item.rightAtlasRects[0], generated.thumbnails.rightSha256],
    ]) {
      const thumbnailBytes = await fs.readFile(resolveRoot(thumbnail));
      assert.equal(sha256(thumbnailBytes), hash, `${id}: thumbnail hash`);
      const thumbnailInfo = await sharp(thumbnailBytes).metadata();
      assert.equal(thumbnailInfo.width, target.width, `${id}: thumbnail width`);
      assert.equal(thumbnailInfo.height, target.height, `${id}: thumbnail height`);
      const thumbnailPixels = await sharp(thumbnailBytes).ensureAlpha().raw().toBuffer();
      const atlasPixels = await sharp(atlas).extract({left:rect.x,top:rect.y,width:rect.w,height:rect.h}).ensureAlpha().raw().toBuffer();
      assert.ok(thumbnailPixels.equals(atlasPixels), `${id}: standalone thumbnail differs from atlas first pose`);
    }
    for (const [index, frame] of generated.frames.entries()) {
      const frameBytes = await fs.readFile(resolveRoot(frame.file));
      assert.equal(sha256(frameBytes), frame.sha256, `${id}: frame hash ${index}`);
      const raw = await sharp(frameBytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      assert.equal(raw.info.width, target.width, `${id}: frame width ${index}`);
      assert.equal(raw.info.height, target.height, `${id}: frame height ${index}`);
      assert.match(frame.file, new RegExp(`^native-crop-complete/decor-flow-${id}/frame-\\d+\\.png$`));
      assert.equal(frame.bounds.y + frame.bounds.h, target.pivotY, `${id}: baseline ${index}`);
      for (let offset = 0; offset < raw.data.length; offset += 4) {
        const alpha = raw.data[offset + 3];
        assert.ok(alpha === 0 || alpha === 255, `${id}: non-binary alpha ${index}`);
        if (alpha) assert.ok(palette.has(`${raw.data[offset]},${raw.data[offset + 1]},${raw.data[offset + 2]}`), `${id}: colour outside palette ${index}`);
      }
      const rect = index < 4 ? item.atlasRects[index] : item.rightAtlasRects[index - 4];
      const extracted = await sharp(atlas).extract({left:rect.x,top:rect.y,width:rect.w,height:rect.h}).ensureAlpha().raw().toBuffer();
      const original = await sharp(frameBytes).ensureAlpha().raw().toBuffer();
      assert.ok(extracted.equals(original), `${id}: atlas changed frame ${index}`);
      const atlasColumn = index % 4;
      const atlasRow = Math.floor(index / 4);
      assert.deepEqual(
        { x: rect.x, y: rect.y, w: rect.w, h: rect.h },
        { x: atlasColumn * target.width, y: atlasRow * target.height, w: target.width, h: target.height },
        `${id}: atlas rect ${index} uses its authored column/row`,
      );
    }
    if(animatedIds.has(id))for(const frames of [generated.frames.slice(0,4),generated.frames.slice(4)])assert.ok(new Set(frames.map(f=>f.sha256)).size>=3,`${id}: motion requires distinct authored poses`);
  }

  for (const [id, hash] of Object.entries(provenance.unchangedEntryHashes)) {
    assert.equal(hashJson(runtimeById.get(id)), hash, `${id}: unrelated record changed`);
  }
});

// Placement checks a store piece against others by its bounds, so they must hold every pixel any frame draws.
test('every store decoration bounds cover each drawn frame in both views', async () => {
  const { STORE_CATALOG } = await import('./garden-store-catalog.mjs');
  const runtime = JSON.parse(await fs.readFile(runtimePath, 'utf8'));
  const ids = STORE_CATALOG.filter(item => item.kind === 'decoration').map(item => item.id);
  assert.equal(ids.length, 66);
  for (const id of ids) {
    const item = runtime.items.find(entry => entry.id === id);
    for (const [view, frames, rects, bounds] of [['default', item.frames, item.atlasRects, item.bounds], ['right', item.rightFrames, item.rightAtlasRects, item.rightBounds]]) {
      for (const [index, file] of frames.entries()) {
        const rect = rects?.[index];
        let image = sharp(resolveRoot(file));
        if (rect) image = image.extract({ left: rect.x, top: rect.y, width: rect.w, height: rect.h });
        const { data, info } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
        for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
          if (!data[(y * info.width + x) * 4 + 3]) continue;
          assert.ok(x >= bounds.x && x < bounds.x + bounds.w && y >= bounds.y && y < bounds.y + bounds.h, `${id}/${view} frame ${index}: pixel (${x},${y}) outside bounds`);
        }
      }
    }
  }
});
