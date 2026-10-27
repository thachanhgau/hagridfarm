import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import scene from './scene-data.json' with {type: 'json'};
import motion from './motion-data.json' with {type: 'json'};
import {STORE_CATALOG} from './garden-store-catalog.mjs';
import {CREATURE, DB} from './balance-data.mjs';
import {GARDEN_STAGES, stageContains} from './garden-growth.mjs';
import {KEEPSAKE_LEGACY_LAYOUT} from './decor-placement-geometry.mjs';
import {earnedDecorArt} from './earned-decor-sprites.mjs';

globalThis.FARM_SCENE = structuredClone(scene);
globalThis.FARM_MOTION = motion;
const {decorSpotProblem} = await import('./decor-placement-ui.mjs');
const {createGarden, iso} = await import('./scene-renderer.mjs');

const manifest = JSON.parse(fs.readFileSync(new URL('./decor-assets-manifest.json', import.meta.url), 'utf8'));
const assetOf = id => manifest.items.find(item => item.id === id);
const storeItems = STORE_CATALOG.filter(item => item.kind === 'decoration');
const earnedIds = DB.decorations.map(item => item.id);
const keepsakes = Object.fromEntries(Object.keys(CREATURE).map(species => [species, 1]));
const heroIds = ['sp_whomping_anglia', 'hw_violet_mist_pond', 'hw_lantern_ancient_tree'];
const heroDecorations = {
  owned: heroIds.slice(),
  placements: heroIds.slice(),
  positions: {
    hw_violet_mist_pond: [2.5, 26],
    sp_whomping_anglia: [22, 25.5],
    hw_lantern_ancient_tree: [27.5, 25.5],
  },
  rotations: {
    hw_violet_mist_pond: 'default',
    sp_whomping_anglia: 'default',
    hw_lantern_ancient_tree: 'default',
  },
};
const emptyStoreDecorations = {owned: [], placements: [], positions: {}, rotations: {}};

const fullState = () => ({
  level: 500,
  plots: scene.plots.map(() => ({slots: Array(9).fill(null)})),
  built: scene.pens.map(pen => pen.id),
  decorations: earnedIds.slice(),
  keepsakes: {...keepsakes},
});

const finalStage = GARDEN_STAGES.at(-1);
const capacitySpots = [];
for (let row = finalStage.minRow ?? -1; row <= finalStage.bottom; row += .5) {
  for (let col = -5; col <= finalStage.right; col += .5) {
    if (stageContains(finalStage, col, row)) capacitySpots.push([col, row]);
  }
}

function evaluateCapacity(item, facing, state, decorations) {
  const blocked = Object.create(null);
  let free = 0;
  for (const [col, row] of capacitySpots) {
    const reason = decorSpotProblem(col, row, {
      map: scene,
      stage: finalStage,
      state,
      decorations,
      itemId: item.id,
      facing,
      asset: assetOf(item.id),
      iso,
      assetOf,
    });
    if (!reason) free += 1;
    else blocked[reason] = (blocked[reason] ?? 0) + 1;
  }
  return {id: item.id, facing, evaluated: capacitySpots.length, free, blocked};
}

test('capacity fixture covers the authored full garden and actual three-hero save shape', () => {
  assert.equal(scene.plots.length, 18);
  assert.equal(scene.pens.length, 6);
  assert.equal(earnedIds.length, 29);
  assert.equal(Object.keys(keepsakes).length, 12);
  assert.equal(storeItems.length, 66);
  assert.equal(capacitySpots.length, 4950);
  assert.deepEqual(Object.keys(heroDecorations).sort(), ['owned', 'placements', 'positions', 'rotations']);
  assert.deepEqual(heroDecorations.owned, heroIds);
  assert.deepEqual(heroDecorations.placements, heroIds);
  for (const id of [...heroIds, ...storeItems.map(item => item.id)]) assert.ok(assetOf(id), `${id}: runtime asset manifest entry`);
  for (const id of earnedIds) assert.ok(earnedDecorArt(id), `${id}: authored earned art`);
});

test('every store decoration and facing has capacity against the full garden with no placed store objects', () => {
  const state = fullState();
  const stateBefore = structuredClone(state);
  const records = [];
  for (const item of storeItems) {
    for (const facing of ['default', 'right']) records.push(evaluateCapacity(item, facing, state, emptyStoreDecorations));
  }
  assert.equal(records.length, 132);
  assert.equal(new Set(records.map(record => record.id)).size, 66);
  assert.deepEqual(new Set(records.map(record => record.facing)), new Set(['default', 'right']));
  for (const record of records) {
    const blocked = Object.values(record.blocked).reduce((sum, count) => sum + count, 0);
    assert.equal(record.evaluated, capacitySpots.length, `${record.id}/${record.facing}: every candidate evaluated`);
    assert.ok(record.free > 0, `${record.id}/${record.facing}: at least one usable candidate`);
    assert.equal(record.free + blocked, record.evaluated, `${record.id}/${record.facing}: capacity partition`);
  }
  assert.deepEqual(state, stateBefore, 'capacity probing must not mutate the garden save');
});

test('the persisted three-hero placement triple clears each hero against the other two', () => {
  const state = fullState();
  const stateBefore = structuredClone(state);
  const decorationsBefore = structuredClone(heroDecorations);
  for (const id of heroIds) {
    const [col, row] = heroDecorations.positions[id];
    assert.equal(decorSpotProblem(col, row, {
      map: scene,
      stage: finalStage,
      state,
      decorations: heroDecorations,
      itemId: id,
      facing: heroDecorations.rotations[id],
      asset: assetOf(id),
      iso,
      assetOf,
    }), '', `${id}: saved position is clear against the other two heroes`);
  }
  assert.deepEqual(state, stateBefore, 'hero collision checks must not mutate the garden save');
  assert.deepEqual(heroDecorations, decorationsBefore, 'hero collision checks must not rewrite the saved placement triple');
});

function fakeContext() {
  const target = {};
  return new Proxy(target, {
    get(object, key) {
      if (key === 'measureText') return () => ({width: 64});
      if (!(key in object)) object[key] = () => {};
      return object[key];
    },
  });
}

function fakeCanvas() {
  const context = fakeContext();
  const canvas = {
    width: 0,
    height: 0,
    dataset: {},
    getContext: () => context,
    getBoundingClientRect() {
      return {left: 0, top: 0, width: this.width || 1, height: this.height || 1};
    },
  };
  class MissingImage {
    set src(value) {
      this.file = value;
      queueMicrotask(() => this.onerror?.(new Error(`missing ${value}`)));
    }
  }
  canvas.ownerDocument = {
    createElement: () => fakeCanvas(),
    defaultView: {Image: MissingImage},
  };
  return canvas;
}

test('an imported level-1 keepsake retains early visibility and leaves store positions unchanged', async () => {
  const state = {
    offsetMs: 0,
    level: 1,
    plots: Array.from({length: 3}, () => ({slots: Array(9).fill(null)})),
    built: [],
    construction: [],
    decorations: [],
    keepsakes: {dragon: 1},
  };
  const storeBefore = structuredClone(heroDecorations);
  const stateBefore = structuredClone(state);
  const garden = await createGarden(fakeCanvas(), {allowMissingAssets: true});
  garden.render(state, {
    now: 1_700_000_000_000,
    clock: 0,
    propsVisible: false,
    decorations: heroDecorations,
  });
  assert.equal(garden.growthStage().id, 2, 'legacy dragon column keeps the imported save on the visible east stage');
  const dragon = garden.order().find(object => object.type === 'keepsake' && object.id === 'keepsake:dragon');
  assert.ok(dragon, 'the imported dragon keepsake remains rendered');
  const [dragonX, dragonY] = iso(24, 8, scene);
  assert.deepEqual(garden.pick(dragonX, dragonY), {kind: 'keepsake', species: 'dragon', count: 1});
  assert.deepEqual(state, stateBefore, 'rendering must not alter keepsake counts');
  assert.deepEqual(heroDecorations, storeBefore, 'rendering must not alter owned/placements/positions/rotations');
  assert.deepEqual(KEEPSAKE_LEGACY_LAYOUT.at(-1).species, 'dragon');
});

test('a store piece allowed beside a plot never takes the tap meant for a crop cell', async () => {
  const now = 1_700_000_000_000;
  const state = {
    ...fullState(),
    offsetMs: 0,
    plots: scene.plots.map(() => ({slots: Array.from({length: 9}, (_, index) => ({id: `c${index}`, type: 'crop', species: 'pumpkin', plantedAt: now - 1e9, growMs: 1000}))})),
    construction: [],
  };
  const itemId = 'decor_broom_rack', at = [7.5, 20.5];
  assert.equal(decorSpotProblem(...at, {map: scene, stage: finalStage, state, decorations: emptyStoreDecorations, itemId, facing: 'default', asset: assetOf(itemId), iso, assetOf}), '', 'the spot is a valid placement');
  const garden = await createGarden(fakeCanvas(), {allowMissingAssets: true, decorAssets: manifest.items});
  garden.render(state, {now, clock: 0, propsVisible: false, decorations: {owned: [itemId], placements: [itemId], positions: {[itemId]: at}, rotations: {}}});
  const {plotCellPosition} = await import('./scene-renderer.mjs');
  const cell = iso(...plotCellPosition(scene.plots[8], 8));
  const asset = assetOf(itemId), [x, y] = iso(...at), b = asset.bounds;
  assert.ok(cell[0] >= x - asset.pivotX + b.x - 5 && cell[1] >= y - asset.pivotY + b.y - 5 && cell[1] <= y - asset.pivotY + b.y + b.h + 5, 'the crop cell lies in the piece tap box');
  assert.notEqual(garden.pick(...cell)?.kind, 'decoration', 'the crop cell keeps its tap');
  assert.equal(garden.pick(x, y - 20)?.kind, 'decoration', 'the piece itself stays tappable');
});
