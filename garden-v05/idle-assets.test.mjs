import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import {derivePose, IDLE_TARGETS, IDLE_CLIP, ACTION_CLIP} from './build-idle-assets.mjs';

const manifest = JSON.parse(readFileSync(new URL('./idle-assets-manifest.json', import.meta.url), 'utf8'));

test('pose shifts whole pixels and never moves the fixed base rows', () => {
  const w = 8, h = 10, src = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y += 1) for (let x = 2; x < 6; x += 1) src.writeUInt32BE(0x11000000 + y * 256 + x, (y * w + x) * 4);
  const out = derivePose(src, w, h, {x: 2, y: 0, w: 4, h: 10}, {amp: 2, lift: 1, fixed: 0.3}, {sway: 1, lift: 1});
  for (const y of [7, 8, 9]) assert.deepEqual(out.subarray(y * w * 4, (y + 1) * w * 4), src.subarray(y * w * 4, (y + 1) * w * 4));
  const colours = (b) => new Set([...Array(b.length / 4).keys()].map((i) => b.readUInt32BE(i * 4)).filter(Boolean));
  for (const c of colours(out)) assert.ok(colours(src).has(c)); // no new colours
});

test('early-loop crops gain idle and action clips that follow art-bible section 5', () => {
  assert.deepEqual(manifest.items.map((i) => i.id), IDLE_TARGETS.map((t) => t.id));
  const total = (clip) => clip.durations.reduce((a, b) => a + b, 0);
  assert.ok(total(IDLE_CLIP) >= 1200 && IDLE_CLIP.loop);
  assert.ok(new Set(IDLE_CLIP.frames).size >= 2 && new Set(IDLE_CLIP.frames).size <= 5);
  assert.ok(ACTION_CLIP.frames.length >= 4 && ACTION_CLIP.frames.length <= 6 && !ACTION_CLIP.loop);
  for (const item of manifest.items) {
    assert.equal(item.frames.length, 7);
    for (const f of item.frames) assert.ok(existsSync(new URL(f.file, import.meta.url)), f.file);
    for (const i of [...item.clips.idle.frames, ...item.clips.action.frames]) assert.ok(i >= 3 && i < 4 + item.frames.length);
  }
});

test('runtime patch adds the frames once, after the growth frames', () => {
  globalThis.window = {};
  for (const f of ['motion-data.js', 'level-assets.js', 'motion-care-data.js', 'motion-idle-data.js', 'motion-idle-data.js']) {
    new Function(readFileSync(new URL(f, import.meta.url), 'utf8'))();
  }
  const oats = window.FARM_MOTION.items.find((i) => i.id === 'oats');
  assert.equal(oats.frames.length, 11);
  assert.deepEqual(oats.clips.idle.frames, IDLE_CLIP.frames);
  assert.equal(oats.frames[3].file, 'native-levels/oats/frame-04.png');
});

test('derived frames keep the mature frame size, pivot and colours', async (t) => {
  let sharp;
  try { sharp = createRequire(import.meta.url)(process.env.SHARP_MODULE || '/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp'); } catch { t.skip('sharp not available'); return; }
  for (const item of manifest.items) {
    const read = async (file) => (await sharp(new URL(file, import.meta.url).pathname).ensureAlpha().raw().toBuffer({resolveWithObject: true}));
    const base = await read(item.frames[0].derivedFrom);
    const palette = new Set([...Array(base.data.length / 4).keys()].filter((i) => base.data[i * 4 + 3] > 0).map((i) => base.data.readUInt32BE(i * 4)));
    for (const f of item.frames) {
      const img = await read(f.file);
      assert.equal(img.info.width, base.info.width); assert.equal(img.info.height, base.info.height);
      for (let i = 0; i < img.data.length; i += 4) if (img.data[i + 3] > 0) assert.ok(palette.has(img.data.readUInt32BE(i)), `${f.file} adds a colour`);
    }
  }
});
