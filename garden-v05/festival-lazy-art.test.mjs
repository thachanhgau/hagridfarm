import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import scene from './scene-data.json' with {type: 'json'};
import motion from './motion-data.json' with {type: 'json'};
import * as E from './progression-engine.mjs';
import {FESTIVAL_FILES} from './garden-seasonal-world.mjs';
import {runtimeImageUrl} from './runtime-image-url.mjs';

globalThis.FARM_SCENE = structuredClone(scene);
globalThis.FARM_MOTION = motion;
const {createGarden} = await import('./scene-renderer.mjs');
const manifest = JSON.parse(fs.readFileSync(new URL('./decor-assets-manifest.json', import.meta.url), 'utf8'));

function recordingCanvas() {
  const requested = new Set();
  const context = new Proxy({}, {get: (o, k) => k === 'measureText' ? () => ({width: 64}) : (o[k] ??= () => {})});
  class RecordingImage {
    naturalWidth = 64; naturalHeight = 64;
    set src(value) { requested.add(value); queueMicrotask(() => this.onload?.()); }
  }
  const canvas = {
    width: 0, height: 0, dataset: {}, getContext: () => context,
    getBoundingClientRect() { return {left: 0, top: 0, width: 1, height: 1}; },
    ownerDocument: {createElement: () => recordingCanvas().canvas, defaultView: {Image: RecordingImage}},
  };
  return {canvas, requested};
}

test('25.0 budget: festival art waits until its season or a placed piece draws it', async () => {
  const festival = manifest.items.filter(a => a.collection === 'festival');
  assert.ok(festival.length >= 30, 'the Halloween pack is in the manifest');
  const urlsOf = a => [a.file, ...(a.frames ?? []), a.rightFile, ...(a.rightFrames ?? [])].filter(Boolean).map(runtimeImageUrl);
  const {canvas, requested} = recordingCanvas();
  const garden = await createGarden(canvas, {decorAssets: manifest.items});
  assert.ok(requested.size > 100, 'the rest of the scene still loads before the first frame');
  for (const url of [...FESTIVAL_FILES.map(runtimeImageUrl), ...festival.flatMap(urlsOf)]) assert.ok(!requested.has(url), url + ' loaded out of season');

  const state = E.testProfile(100, 1_700_000_000_000);
  garden.render(state, {now: 1_700_000_000_000, clock: 0, propsVisible: true, eventMode: 'none'});
  assert.ok(!requested.has(runtimeImageUrl('world-v241/hero-halloween.png')), 'no festival, no hero');

  const piece = festival.find(a => a.id === 'hw_violet_mist_pond');
  garden.render(state, {
    now: 1_700_000_000_000, clock: 0, propsVisible: true, eventMode: 'event_halloween',
    decorations: {owned: [piece.id], placements: [piece.id], positions: {[piece.id]: [2.5, 26]}, rotations: {}},
  });
  assert.ok(requested.has(runtimeImageUrl('world-v241/hero-halloween.png')), 'the open festival loads its hero');
  assert.ok(urlsOf(piece).some(url => requested.has(url)), 'a placed festival piece loads after its season');
  assert.ok(!requested.has(runtimeImageUrl('world-v241/hero-yule.png')), 'other festivals stay unloaded');
});
