import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const sharp = require(process.env.SHARP_MODULE || '/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(here);
const manifest = JSON.parse(await fs.readFile(path.join(here, 'manifest.json'), 'utf8'));
const palette = new Set(manifest.palette.map((hex) => {
  const value = hex.slice(1);
  return `${parseInt(value.slice(0, 2), 16)},${parseInt(value.slice(2, 4), 16)},${parseInt(value.slice(4, 6), 16)}`;
}));
const hash = (data) => crypto.createHash('sha256').update(data).digest('hex');

async function readFrame(file) {
  return sharp(path.join(here, file)).ensureAlpha().raw().toBuffer({resolveWithObject: true});
}

function alphaBounds(data, width, height) {
  let x0 = width, y0 = height, x1 = -1, y1 = -1, count = 0;
  for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) {
    if (data[(y * width + x) * 4 + 3] === 0) continue;
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); count += 1;
  }
  return count ? {x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1, count, edge: x0 === 0 || y0 === 0 || x1 === width - 1 || y1 === height - 1} : {x: 0, y: 0, w: 0, h: 0, count, edge: false};
}

function trimmedPixels(raw) {
  const bounds = alphaBounds(raw.data, raw.info.width, raw.info.height);
  const data = Buffer.alloc(bounds.w * bounds.h * 4);
  for (let y = 0; y < bounds.h; y += 1) {
    const start = ((bounds.y + y) * raw.info.width + bounds.x) * 4;
    raw.data.copy(data, y * bounds.w * 4, start, start + bounds.w * 4);
  }
  return {bounds, data};
}

function differsFromHorizontalFlip(raw) {
  let different = 0;
  for (let y = 0; y < raw.info.height; y += 1) for (let x = 0; x < raw.info.width; x += 1) {
    const left = (y * raw.info.width + x) * 4;
    const right = (y * raw.info.width + (raw.info.width - 1 - x)) * 4;
    for (let channel = 0; channel < 4; channel += 1) if (raw.data[left + channel] !== raw.data[right + channel]) different += 1;
  }
  return different;
}

test('manifest covers all 12 creatures with four authored right-facing clips', async () => {
  assert.equal(manifest.items.length, 12);
  assert.equal(new Set(manifest.items.map((item) => item.id)).size, 12);
  assert.equal(manifest.direction, 'right-authored; no runtime horizontal flip');
  assert.equal(manifest.assetRoot, 'creature-motion-assets/');
  assert.deepEqual(manifest.requestedMissingEatCare, ['puffskein', 'bowtruckle', 'niffler', 'hippogriff', 'dragon']);
  assert.equal(manifest.animationContract.distinctFramesPerClip, 4);
  for (const item of manifest.items) {
    assert.equal(item.direction, 'right-authored');
    assert.ok(['FARM_MOTION', 'FARM_LEVEL_ASSETS'].includes(item.sourceCollection));
    assert.ok(item.generation.prompt.length > 100);
    for (const clip of ['idle', 'action', 'eat', 'care']) {
      const spec = item.clips[clip];
      assert.deepEqual(spec.phases.length, 4, `${item.id} ${clip} phases`);
      assert.equal(spec.frames.length, 4, `${item.id} ${clip} frames`);
      assert.deepEqual(spec.frameIndices, spec.frames.map((file) => item.frames.findIndex((frame) => frame.file === file)));
      assert.equal(spec.durations.length, 4, `${item.id} ${clip} durations`);
      assert.ok(spec.durations.every((duration) => Number.isFinite(duration) && duration > 0));
      assert.ok(spec.frames.every((file) => file.startsWith(`native/${item.id}/right-${clip}-`)));
    }
  }
});

test('native outputs are palette24, binary-alpha, bounded by the adult pivot and fully sliced', async () => {
  for (const item of manifest.items) {
    assert.ok(item.generation.masterSha256);
    await fs.access(path.join(here, item.generation.masterFile));
    await fs.access(path.join(root, item.referenceFile || item.baseFrame));
    for (const frame of item.frames) {
      const raw = await readFrame(frame.file);
      assert.equal(raw.info.width, frame.width, frame.file);
      assert.equal(raw.info.height, frame.height, frame.file);
      const bounds = alphaBounds(raw.data, raw.info.width, raw.info.height);
      assert.deepEqual(bounds, frame.bounds, frame.file);
      assert.equal(bounds.edge, false, `${frame.file} touches canvas edge`);
      assert.equal(bounds.y + bounds.h, frame.pivotY, `${frame.file} loses ground baseline`);
      assert.equal(frame.clippedPixels, 0, `${frame.file} clipped authored pixels`);
      assert.equal(frame.binaryAlpha, true);
      assert.equal(frame.palette24, true);
      for (let index = 0; index < raw.data.length; index += 4) {
        const alpha = raw.data[index + 3];
        assert.ok(alpha === 0 || alpha === 255, `${frame.file} has non-binary alpha`);
        if (alpha) assert.ok(palette.has(`${raw.data[index]},${raw.data[index + 1]},${raw.data[index + 2]}`), `${frame.file} adds an unapproved colour`);
      }
    }
  }
});

test('each clip has authored pose differences beyond translation and is visibly asymmetric', async () => {
  for (const item of manifest.items) {
    for (const clip of ['idle', 'action', 'eat', 'care']) {
      const canonicalHashes = new Set();
      for (const file of item.clips[clip].frames) {
        const raw = await readFrame(file);
        canonicalHashes.add(hash(trimmedPixels(raw).data));
        assert.ok(differsFromHorizontalFlip(raw) > 0, `${file} is horizontally symmetric and could be a runtime flip`);
      }
      assert.equal(canonicalHashes.size, 4, `${item.id} ${clip} differs only by translation or repeats a frame`);
    }
  }
});

test('new right idle art is not the old adult frame flipped at runtime', async () => {
  for (const item of manifest.items) {
    const oldRaw = await sharp(path.join(root, item.generation.referenceFile)).ensureAlpha().raw().toBuffer({resolveWithObject: true});
    const newRaw = await readFrame(item.clips.idle.frames[0]);
    assert.equal(newRaw.info.width, oldRaw.info.width, item.id);
    assert.equal(newRaw.info.height, oldRaw.info.height, item.id);
    const flipped = Buffer.alloc(oldRaw.data.length);
    for (let y = 0; y < oldRaw.info.height; y += 1) for (let x = 0; x < oldRaw.info.width; x += 1) {
      const source = (y * oldRaw.info.width + x) * 4;
      const target = (y * oldRaw.info.width + (oldRaw.info.width - 1 - x)) * 4;
      oldRaw.data.copy(flipped, target, source, source + 4);
    }
    assert.notEqual(hash(newRaw.data), hash(flipped), `${item.id} right idle is only a horizontal runtime flip`);
  }
});

test('provenance records master and reference hashes plus the exact generation prompt', async () => {
  for (const item of manifest.items) {
    const masterFile = path.join(here, item.generation.masterFile);
    const referenceFile = path.join(root, item.generation.referenceFile);
    assert.equal(hash(await fs.readFile(masterFile)), item.generation.masterSha256, item.id);
    assert.equal(hash(await fs.readFile(referenceFile)), item.generation.referenceSha256, item.id);
    assert.equal(item.baseFrameSha256, item.generation.referenceSha256, item.id);
  }
});

test('runtime extension exposes an explicit parent load/apply hook', async () => {
  const runtime = await fs.readFile(path.join(root, 'creature-motion-data.js'), 'utf8');
  const motionItems = manifest.items.map((item) => ({id: item.id,frames:[],clips:{}}));
  globalThis.window = {FARM_MOTION: {items: motionItems}, FARM_LEVEL_ASSETS: {items: []}};
  new Function(runtime)();
  assert.equal(window.FARM_CREATURE_MOTION.items.length, 12);
  assert.equal(typeof window.FARM_CREATURE_MOTION_APPLY, 'function');
  assert.equal(window.FARM_CREATURE_MOTION_STATUS.complete, true);
  assert.ok(motionItems.every((item) => item.rightCreatureMotion?.direction === 'right-authored'));
});

test('native1x contact sheet is present and indexed', async () => {
  const sheet = path.join(here, manifest.contactSheet.file);
  const stat = await fs.stat(sheet);
  assert.ok(stat.size > 1000);
  assert.equal(manifest.contactSheet.nativeScale, 1);
  assert.equal(manifest.contactSheet.blocks.length, 12);
});
