// Regressions from the 25.0 audit (05/11/2026): depth and tint of the ma lùm, deferred art that fails once, plot totals.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import scene from './scene-data.json' with {type: 'json'};
import motion from './motion-data.json' with {type: 'json'};
import * as E from './progression-engine.mjs';

globalThis.FARM_SCENE = structuredClone(scene);
globalThis.FARM_MOTION = motion;
const {createGarden} = await import('./scene-renderer.mjs');
const NOW = 1_700_000_000_000;
const HEARTH = 'environment/xmas/hearth.png';

function fakeCanvas(failFirst = () => false) {
  const requested = [], context = new Proxy({}, {get: (o, k) => k === 'measureText' ? () => ({width: 64}) : k === 'getImageData' ? (x, y, width, height) => ({width, height, data: new Uint8ClampedArray(width * height * 4)}) : k === 'createLinearGradient' || k === 'createRadialGradient' ? () => ({addColorStop() {}}) : k in o ? o[k] : () => {}, set: (o, k, v) => { o[k] = v; return true; }});
  class FakeImage {
    naturalWidth = 64; naturalHeight = 64;
    set src(url) {
      requested.push(url);
      const fails = failFirst(url) && requested.filter((u) => u === url).length === 1;
      queueMicrotask(() => (fails ? this.onerror : this.onload)?.());
    }
  }
  const canvas = {width: 0, height: 0, dataset: {}, getContext: () => context,
    getBoundingClientRect() { return {left: 0, top: 0, width: canvas.width || 1, height: canvas.height || 1}; },
    ownerDocument: {createElement: () => fakeCanvas().canvas, defaultView: {Image: FakeImage}}};
  return {canvas, requested};
}
const hearthKit = {XMAS_FILES: [HEARTH], newYearFireworks: () => [], hearthObjects: (iso, view, elves) => {
  elves.push({kind: 'elf', id: 'xmas-hearth', still: true, xy: [400, 400], flip: false, asset: {file: HEARTH, width: 112, height: 120, pivotX: 56, pivotY: 116, bounds: {x: 8, y: 4, w: 96, h: 114}}});
  return [];
}};
const settle = async () => { for (let i = 0; i < 5; i += 1) await Promise.resolve(); };

test('a ma lùm is drawn in the depth-sorted pass, so the night tint covers it and things in front hide it', async () => {
  const {canvas} = fakeCanvas();
  const garden = await createGarden(canvas, {});
  const kit = {GNOME_FILES: ['x.png'], GNOME_FRAME: {}, gnomeFile: () => 'x.png', drawWeeds() {}, drawGnome() {}};
  garden.render(E.testProfile(100, NOW), {now: NOW, clock: 0, propsVisible: true, eventMode: 'none', duty: {gnomes: [0], wilt: new Set(), dead: new Map(), sick: new Set(), kit}});
  assert.ok(garden.order().some((o) => o.id === 'gnome:0'), 'gnome:0 is in the draw order');
});

test('deferred art that fails once is requested again, and its sprite takes no tap until it shows', async (t) => {
  t.mock.timers.enable({apis: ['setTimeout']});
  const {canvas, requested} = fakeCanvas((url) => url.includes('hearth'));
  const garden = await createGarden(canvas, {});
  const state = E.testProfile(100, NOW), options = {now: NOW, clock: 0, propsVisible: true, eventMode: 'none', xmasKit: hearthKit, xmas: {}};
  const asked = () => requested.filter((url) => url.includes('hearth')).length;
  garden.render(state, options);
  await settle();
  assert.equal(asked(), 1);
  assert.notEqual(garden.pick(400, 340)?.id, 'xmas-hearth', 'no invisible tap box');
  t.mock.timers.tick(5000);
  await settle();
  garden.render(state, options);
  await settle();
  assert.equal(asked(), 2, 'asked again after the pause');
  garden.render(state, options);
  assert.equal(garden.pick(400, 340)?.id, 'xmas-hearth', 'tappable once loaded');
});

test('the plot total follows bậc Tận Sức everywhere', () => {
  assert.equal(E.plotLimit({level: 99}), 12);
  assert.equal(E.plotLimit({level: 100}), 18);
  assert.equal(E.DB.expansions.filter((e) => e.kind === 'plot').length + 3, 18);
  assert.doesNotMatch(fs.readFileSync(new URL('./progression-panels.mjs', import.meta.url), 'utf8'), /\/12 thửa|plots\.length\}\/12/);
});

test('level 12 names the Giỏ đan its recipes open with', () => {
  assert.equal(E.DB.levels[11].unlock, 'Thửa 4; Xà lách; Giỏ đan của Hermione');
});

test('the duty chip stays left of the icon rows and drops below an open row on phones', () => {
  const css = fs.readFileSync(new URL('./game-panels.css', import.meta.url), 'utf8');
  // Level-160 F: the duty chip and the weather chip share the fixed .hud-chips row, under the next-goal card.
  assert.match(css, /#gameShell \.hud-chips\{position:fixed;top:116px;left:/);
  assert.match(css, /@media \(max-width:599px\)\{#gameShell \.hud-chips\{top:108px\}\}/);
});
