import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import scene from './scene-data.json' with {type: 'json'};
import motion from './motion-data.json' with {type: 'json'};
import * as E from './progression-engine.mjs';
import {runtimeImageUrl} from './runtime-image-url.mjs';
import {PALETTE} from './palette.mjs';
import {WATER_CROPS, TRAY_ART, cutTray, isWaterPlot, drawWaterBed} from './water-crop-art.mjs';

// Owner 15/11/2026 «biến cái vườn thành nước»: a plot holding a water crop is a water bed, its crops have no tray.
globalThis.FARM_SCENE = structuredClone(scene);
globalThis.FARM_MOTION = motion;
vm.runInNewContext(fs.readFileSync(new URL('./level-assets.js', import.meta.url), 'utf8'), {window: {FARM_MOTION: motion}});
const {createGarden, plotCorners} = await import('./scene-renderer.mjs');
const sharp = createRequire(import.meta.url)(process.env.SHARP_MODULE || '/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');

test('water crops are the bed crops (server BED_CROPS, mirrored by the QA wallet)', () => {
  const wallet = fs.readFileSync(new URL('../qa-v19/fixture-wallet.mjs', import.meta.url), 'utf8');
  assert.deepEqual(JSON.parse(wallet.match(/const BED_CROPS=(\[[^\]]+\])/)[1]), [...WATER_CROPS]);
  assert.equal(isWaterPlot([null, {species: 'pumpkin'}, {species: 'gillyweed'}]), true);
  assert.equal(isWaterPlot([null, {species: 'pumpkin'}]), false);
});

test('Tảo bạc ships without its tray at 1× and in the builders’ records', async () => {
  const levels = JSON.parse(fs.readFileSync(new URL('./level-assets.json', import.meta.url), 'utf8')).items.find(i => i.id === 'silverkelp');
  const complete = JSON.parse(fs.readFileSync(new URL('./crop-complete-manifest.json', import.meta.url), 'utf8')).items.find(i => i.id === 'silverkelp');
  const frames = [...levels.frames.slice(1), ...complete.frames];
  assert.equal(frames.length, 13);
  for (const frame of frames) {
    assert.ok(TRAY_ART.test(frame.file) && frame.trayCut, frame.file);
    const {data, info} = await sharp(new URL(frame.file, import.meta.url).pathname).ensureAlpha().raw().toBuffer({resolveWithObject: true});
    assert.equal(cutTray(data, info.width, info.height), 0, frame.file + ' still has a tray rim');
  }
});

function recordingCanvas() {
  const drawn = [], fills = [];
  let fillStyle = null;
  const context = new Proxy({}, {
    get: (o, k) => k === 'drawImage' ? (image, ...args) => drawn.push({file: image.source, args})
      : k === 'fillRect' ? (...args) => fills.push([fillStyle, ...args])
      : k === 'fillStyle' ? fillStyle
      : k === 'measureText' ? () => ({width: 64})
      : k === 'getImageData' ? (x, y, width, height) => ({width, height, data: new Uint8ClampedArray(width * height * 4)})
      : (o[k] ??= () => {}),
    set: (o, k, v) => { if (k === 'fillStyle') fillStyle = v; else o[k] = v; return true; },
  });
  class RecordingImage { naturalWidth = 64; naturalHeight = 64; set src(value) { this.source = value; queueMicrotask(() => this.onload?.()); } }
  const canvas = {
    width: 0, height: 0, dataset: {}, getContext: () => context,
    getBoundingClientRect() { return {left: 0, top: 0, width: 1, height: 1}; },
    ownerDocument: {createElement: () => recordingCanvas().canvas, defaultView: {Image: RecordingImage}},
  };
  return {canvas, drawn, fills};
}

test('a water-crop plot draws water and no soil; a land plot keeps its soil tiles', async () => {
  const soil = runtimeImageUrl('environment/layers/tile-soil.png');
  for (const weatherMode of ['clear', 'snow']) {
    const {canvas, drawn, fills} = recordingCanvas(), garden = await createGarden(canvas, {allowMissingAssets: true});
    const now = 1_700_000_000_000, state = E.testProfile(500, now);
    const crop = (species, i) => ({id: species + i, type: 'crop', species, plantedAt: now - 1000, growMs: 3_600_000});
    state.plots[0].slots = state.plots[0].slots.map((_, i) => crop(i % 3 ? 'silverkelp' : 'pumpkin', i));
    state.plots[1].slots = state.plots[1].slots.map((_, i) => crop('pumpkin', i));
    const options = {now, clock: 0, weatherMode};
    garden.render(state, options); await new Promise(resolve => setImmediate(resolve));
    drawn.length = 0; fills.length = 0; garden.render(state, options);
    const inside = (plot, x, y) => {
      const [b, r, f, l] = plotCorners(scene.plots[plot]), cx = (l[0] + r[0]) / 2, cy = (b[1] + f[1]) / 2;
      return Math.abs(x - cx) / ((r[0] - l[0]) / 2) + Math.abs(y - cy) / ((f[1] - b[1]) / 2) <= 1.001;
    };
    const soilIn = plot => drawn.filter(c => c.file === soil && inside(plot, c.args[0] + 32, c.args[1] + 16)).length;
    assert.equal(soilIn(0), 0, 'water plot still draws soil');
    assert.equal(soilIn(1), 9, 'land plot lost its soil');
    const water = fills.filter(([c, x, y, w, h]) => c === '#24483f' && inside(0, x + w / 2, y + h / 2));
    assert.ok(water.length > 40, 'water plot has no water');
    assert.ok(!fills.some(([c, x, y, w, h]) => c === '#24483f' && w > 4 && inside(1, x + w / 2, y + h / 2)), 'land plot drew water');
  }
});

test('the water bed stays inside its plot, on device pixels, in palette colours', () => {
  const palette = new Set(PALETTE.map(c => c.toLowerCase())), corners = plotCorners(scene.plots[2]);
  for (const weatherMode of ['clear', 'snow']) for (const d of [1, 2]) {
    const fills = [];
    let fillStyle;
    const ctx = {getTransform: () => ({a: d}), set fillStyle(v) { fillStyle = v; }, get fillStyle() { return fillStyle; }, fillRect: (...a) => fills.push([fillStyle, ...a])};
    drawWaterBed(ctx, corners, {weatherMode, index: 2, stems: [[corners[0][0], corners[0][1] + 40]]});
    assert.ok(fills.length > 50);
    const xs = corners.map(p => p[0]), ys = corners.map(p => p[1]);
    for (const [c, x, y, w, h] of fills) {
      assert.ok(palette.has(c.toLowerCase()), c);
      assert.ok(x >= Math.min(...xs) - 1 && x + w <= Math.max(...xs) + 1 && y >= Math.min(...ys) - 1 && y + h <= Math.max(...ys) + 1);
      assert.ok([x, y, w, h].every(n => Math.abs(n * d - Math.round(n * d)) < 1e-6));
    }
    if (weatherMode === 'snow') assert.ok(fills.some(([c]) => c === '#e8f0ed'), 'no ice in snow');
  }
});
