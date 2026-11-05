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
  const context = new Proxy({}, {get: (o, k) => k === 'measureText' ? () => ({width: 64}) : k === 'getImageData' ? (x, y, width, height) => ({width, height, data: new Uint8ClampedArray(width * height * 4)}) : (o[k] ??= () => {})});
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

test('25.0 budget: event pieces and Dobby\'s work poses load only when first drawn', async () => {
  const {elfWorkFiles} = await import('./garden-elves.mjs');
  const event = manifest.items.filter(a => a.collection === 'event');
  // S7: the six Noel pieces of bậc Tận Sức ship in the event pack too, so a shop that never placed one never loads them.
  const noel = ['sp_xmas_butterbeer', 'sp_xmas_firebolt', 'sp_xmas_honeydukes', 'sp_xmas_invisibility_cloak', 'sp_xmas_weasley_tree', 'sp_xmas_yule_roses'];
  assert.deepEqual(event.map(a => a.id).sort(), ['ev_champion_tree', 'ev_dark_dobby_red', 'ev_dobby_spring_rider', 'ev_elf_tent', 'ev_kitchen_corner', ...noel]);
  const urlsOf = a => [a.file, ...(a.frames ?? []), a.rightFile, ...(a.rightFrames ?? [])].filter(Boolean).map(runtimeImageUrl);
  const {canvas, requested} = recordingCanvas();
  const garden = await createGarden(canvas, {decorAssets: manifest.items});
  const work = elfWorkFiles().map(runtimeImageUrl);
  assert.deepEqual(work, ['environment/elves/dobby/harvest.png', 'environment/elves/dobby/feed.png'].map(runtimeImageUrl));
  for (const url of [...work, ...event.flatMap(urlsOf)]) assert.ok(!requested.has(url), url + ' loaded before the first frame');
  const state = E.testProfile(100, 1_700_000_000_000);
  const tent = event.find(a => a.id === 'ev_elf_tent');
  garden.render(state, {
    now: 1_700_000_000_000, clock: 0, propsVisible: true, eventMode: 'none',
    decorations: {owned: [tent.id], placements: [tent.id], positions: {[tent.id]: [2.5, 26]}, rotations: {}},
  });
  assert.ok(urlsOf(tent).some(url => requested.has(url)), 'a placed Lều gia tinh loads');
  for (const url of event.filter(a => noel.includes(a.id)).flatMap(urlsOf)) assert.ok(!requested.has(url), url + ' loaded with only the tent placed');
});

test('25.0 S3 budget: winter scenery (lều tuyết, hồ băng, rừng đông) loads only while winter is on', async () => {
  const winterKit = await import('./garden-winter.mjs'), {WINTER_FILES, winterSeason} = winterKit;
  assert.equal(WINTER_FILES.length, 6);
  for (const file of WINTER_FILES) assert.ok(fs.existsSync(new URL('./' + file, import.meta.url)), file + ' exists');
  const winterUrls = WINTER_FILES.map(runtimeImageUrl);
  const {canvas, requested} = recordingCanvas();
  const garden = await createGarden(canvas, {decorAssets: manifest.items});
  for (const url of winterUrls) assert.ok(!requested.has(url), url + ' loaded before the first frame');
  const state = E.testProfile(100, 1_700_000_000_000);
  garden.render(state, {now: 1_700_000_000_000, clock: 0, propsVisible: true, eventMode: 'none', weatherMode: 'snow', winterKit, winter: winterSeason(Date.parse('2026-11-30T12:00:00+07:00'))});
  for (const url of winterUrls) assert.ok(!requested.has(url), url + ' loaded outside winter (snow chosen in November)');
  garden.render(state, {now: 1_700_000_000_000, clock: 0, propsVisible: true, eventMode: 'none', winterKit, winter: winterSeason(Date.parse('2026-12-01T12:00:00+07:00'))});
  for (const url of winterUrls) assert.ok(requested.has(url), url + ' requested once winter starts');
});

test('25.0 S4 budget: Norbert loads only once he is drawn (S7 hatches him)', async () => {
  const {norbertFiles} = await import('./garden-elves.mjs');
  const urls = norbertFiles().map(runtimeImageUrl);
  assert.equal(urls.length, 6);
  for (const file of norbertFiles()) assert.ok(fs.existsSync(new URL('./' + file, import.meta.url)), file + ' exists');
  const {canvas, requested} = recordingCanvas();
  const garden = await createGarden(canvas, {decorAssets: manifest.items});
  const state = E.testProfile(100, 1_700_000_000_000);
  garden.render(state, {now: 1_700_000_000_000, clock: 0, propsVisible: true, eventMode: 'none'});
  for (const url of urls) assert.ok(!requested.has(url), url + ' loaded without Norbert');
  garden.render(state, {now: 1_700_000_000_000, clock: 0, propsVisible: true, eventMode: 'none', norbert: true});
  assert.ok(requested.has(runtimeImageUrl('environment/elves/norbert/idle.png')), 'a hatched Norbert loads');
});

test('25.0 elf statue glow: loads only at dusk/night for a placed statue; reduced motion holds n0', async () => {
  const winterKit = await import('./garden-winter.mjs'), {STATUE_GLOW_FILES, statueGlow} = winterKit;
  assert.equal(STATUE_GLOW_FILES.length, 12);
  for (const file of STATUE_GLOW_FILES) assert.ok(fs.existsSync(new URL('./' + file, import.meta.url)), file + ' exists');
  const {canvas, requested} = recordingCanvas();
  const garden = await createGarden(canvas, {decorAssets: manifest.items});
  const state = E.testProfile(100, 1_700_000_000_000);
  const id = 'ev_dark_dobby_red', glowUrls = STATUE_GLOW_FILES.map(runtimeImageUrl);
  const decorations = {owned: [id], placements: [id], positions: {[id]: [2.5, 26]}, rotations: {}};
  const base = {now: 1_700_000_000_000, clock: 0, propsVisible: true, eventMode: 'none', winterKit, decorations};
  garden.render(state, {...base, atmosphereMode: 'day'});
  for (const url of glowUrls) assert.ok(!requested.has(url), url + ' loaded by day');
  garden.render(state, {...base, atmosphereMode: 'night'});
  assert.ok(requested.has(runtimeImageUrl(`environment/statue-night/${id}-n0.png`)), 'the placed statue glows at night');
  assert.ok(!requested.has(runtimeImageUrl('environment/statue-night/ev_dobby_spring_rider-n0.png')), 'an unplaced statue stays unloaded');
  const object = {kind: 'store-decor', id, slot: 0, facing: 'right', asset: {pivotX: 64, pivotY: 160}};
  assert.equal(statueGlow(object, 0).file, `environment/statue-night/${id}_right-n0.png`);
  assert.deepEqual(new Set([0, 600, 1200, 1800].map(t => statueGlow(object, t + 1).file.slice(-6))), new Set(['n0.png', 'n1.png', 'n2.png']));
  assert.equal(statueGlow({...object, preview: true}, 0), null);
  assert.equal(statueGlow({...object, id: 'ev_elf_tent'}, 0), null);
});

test('25.0 S6 budget: visiting friends load only while a visit is drawn, never before the first frame', async () => {
  const friendsKit = await import('./garden-friends.mjs'), {FRIEND_FILES, friendVisit} = friendsKit;
  assert.equal(FRIEND_FILES.length, 42); // 7 sheets × 6 poses (Fred and George share one)
  const urls = FRIEND_FILES.map(runtimeImageUrl);
  const {canvas, requested} = recordingCanvas();
  const garden = await createGarden(canvas, {decorAssets: manifest.items});
  for (const url of urls) assert.ok(!requested.has(url), url + ' loaded before the first frame');
  const state = E.testProfile(100, 1_700_000_000_000), night = Date.parse('2026-12-01T22:00:00+07:00'), day = Date.parse('2026-12-01T10:00:00+07:00');
  garden.render(state, {now: night, clock: 0, propsVisible: true, eventMode: 'none', friendsKit});
  for (const url of urls) assert.ok(!requested.has(url), url + ' loaded with nobody visiting');
  garden.render(state, {now: day, clock: 0, propsVisible: true, eventMode: 'none', friendsKit});
  const visitor = friendVisit(day).members[0];
  assert.ok([...requested].some((url) => url.includes(`/friends/${friendsKit.FRIENDS[visitor].art || visitor}/`)), visitor + ' requested once visiting');
  for (const file of FRIEND_FILES) assert.ok(fs.existsSync(new URL('./' + file, import.meta.url)), file + ' exists');
});

test('25.0 S7 budget: the December hearth, vớ and dragon egg load only when the server sends `xmas`', async () => {
  const xmasKit = await import('./garden-xmas.mjs'), urls = xmasKit.XMAS_FILES.map(runtimeImageUrl);
  const {canvas, requested} = recordingCanvas();
  const garden = await createGarden(canvas, {decorAssets: manifest.items});
  for (const url of urls) assert.ok(!requested.has(url), url + ' loaded before the first frame');
  const state = E.testProfile(100, 1_700_000_000_000), now = Date.parse('2026-12-03T10:00:00+07:00');
  garden.render(state, {now, clock: 0, propsVisible: true, eventMode: 'none', xmasKit, xmas: null});
  for (const url of urls) assert.ok(!requested.has(url), url + ' loaded without a December view');
  const socks = [1, 2, 3].map((n) => ({n, opened: n === 1}));
  garden.render(state, {now, clock: 0, propsVisible: true, eventMode: 'none', xmasKit, xmas: {chapter: {socks}, egg: {stage: 1, hatched: false}}});
  for (const name of ['hearth', 'sock', 'sock-open', 'egg-1']) assert.ok([...requested].some((url) => url.includes(`/xmas/${name}.`)), name + ' requested once drawn');
});
