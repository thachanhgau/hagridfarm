import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import scene from './scene-data.json' with {type: 'json'};
import motion from './motion-data.json' with {type: 'json'};
import {GARDEN_STAGES} from './garden-growth.mjs';
globalThis.FARM_SCENE = structuredClone(scene);
globalThis.FARM_MOTION = motion;
const {decorSpotProblem, decorSpotGrid} = await import('./decor-placement-ui.mjs');

const {iso} = await import('./scene-renderer.mjs');
const {decorFootprintRect} = await import('./decor-runtime.mjs');
const manifest = JSON.parse(fs.readFileSync(new URL('./decor-assets-manifest.json', import.meta.url)));
const assetOf = id => manifest.items.find(item => item.id === id);
const last = GARDEN_STAGES.at(-1);
const decorations = {owned: ['decor_cauldron', 'decor_mandrake_planter'], placements: ['decor_cauldron', null, null, null, null, null], positions: {decor_cauldron: [12.5, 8]}};
const at = (col, row, extra = {}) => decorSpotProblem(col, row, {map: scene, stage: last, state: {decorations: []}, decorations, itemId: 'decor_mandrake_planter', ...extra});
const free = (id, facing) => {
  for (let row = -1; row <= 27; row += 0.5) for (let col = -5; col <= 33; col += 0.5) {
    if (!decorSpotProblem(col, row, {map: scene, stage: last, state: {decorations: []}, decorations: {}, itemId: id, facing, asset: assetOf(id), iso})) return [col, row];
  }
  return null;
};

test('free placement: open ground is free; plots, pens, buildings, locked land and crowding are not', () => {
  assert.equal(at(6, 7.5), '');
  assert.equal(at(-3, 2), '');
  assert.match(at(3, 4), /thửa/);
  assert.match(at(29, 1), /chuồng/);
  assert.match(at(0, 4), /cảnh vật/);
  assert.match(at(3, 0), /công trình/);
  assert.match(at(12.5, 8.5), /Chồng/);
  // Moving the item itself never collides with its own spot.
  assert.equal(at(12.5, 8.5, {itemId: 'decor_cauldron'}), '');
  assert.match(at(6, 20, {stage: GARDEN_STAGES[0]}), /chưa mở/);
  // An earned decoration's aisle cell is taken only once the garden has it.
  assert.equal(at(6, 3.5), '');
  assert.match(at(6, 3.5, {state: {decorations: ['decoration-7']}}), /đồ trang trí của vườn/);
});

test('large pieces: the whole footprint counts, turned with the facing, off paths and the fence', () => {
  // The front tile alone is free aisle ground, but a 3×2 reaches back onto plot 1.
  // Long side along the rows in the default view, along the columns in the right view; centred under the foot.
  assert.deepEqual(decorFootprintRect(6, 7, [3, 2]), {c0: 4.25, c1: 6.25, r0: 4.75, r1: 7.75});
  assert.deepEqual(decorFootprintRect(6, 7, [3, 2], 'right'), {c0: 3.75, c1: 6.75, r0: 5.25, r1: 7.25});
  assert.deepEqual(decorFootprintRect(6, 7, [1, 1]), {c0: 5.5, c1: 6.5, r0: 6.5, r1: 7.5});
  assert.equal(at(6, 7), '');
  assert.match(at(6, 7, {itemId: 'sp_whomping_anglia'}), /thửa|lối đi/);
  // A 1×1 may sit at the aisle edge; a 2×2 there would cover the path.
  assert.equal(at(7, 8.5), '');
  assert.match(at(7, 8.5, {itemId: 'sp_aragog_hollow'}), /lối đi/);
  // Large pieces keep 0.9 tile off the fence: the north-west corner is open ground but too close.
  assert.equal(at(-4, 0), '');
  assert.match(at(-3.5, 0.5, {itemId: 'sp_buckbeak_pumpkins'}), /rào/);
  // A placed Knight Bus reaches back along the rows in its default view; turned right, it lies along the columns.
  const bus = {owned: ['sp_knight_bus'], placements: ['sp_knight_bus'], positions: {sp_knight_bus: [-2, 4]}, rotations: {}};
  const near = (col, row, rotations) => decorSpotProblem(col, row, {map: scene, stage: last, state: {decorations: []}, decorations: {...bus, rotations}, itemId: 'decor_mandrake_planter'});
  assert.match(near(-2, 2, {}), /Chồng/);
  assert.equal(near(-2, 2, {sp_knight_bus: 'right'}), '');
  assert.match(near(-3.5, 3.5, {sp_knight_bus: 'right'}), /Chồng/);
});

test('a tall piece may not stand in front of a plot and hide it', () => {
  const where = {itemId: 'sp_fawkes_perch', asset: assetOf('sp_fawkes_perch'), iso};
  // Just below plot 2's front corner: free ground, but the 188 px perch covers the plot behind it.
  assert.match(at(11, 7, where), /che mất/);
  assert.equal(at(11, 7, {itemId: 'sp_fawkes_perch'}), '');
});

test('every special product fits somewhere in the full garden, in both views', () => {
  for (const item of manifest.items.filter(item => item.collection === 'special')) {
    for (const facing of ['default', 'right']) assert.ok(free(item.id, facing), `${item.id} ${facing}`);
  }
});

test('placement grid: green where the item fits, grey where it cannot, only on opened ground', () => {
  const stage = GARDEN_STAGES[0];
  const grid = decorSpotGrid(stage, ([c, r]) => decorSpotProblem(c, r, {map: scene, stage, state: {decorations: []}, decorations: {}, itemId: 'decor_cauldron', asset: assetOf('decor_cauldron'), iso}));
  const ok = grid.filter(g => g.ok).length;
  assert.ok(grid.every(g => g.at[0] <= stage.right && g.at[1] <= stage.bottom));
  assert.ok(ok > 0 && ok < grid.length);
  // A small piece may stand at the edge of a plot without counting as hiding it: about twice the ground of the old 12 px rule stays green.
  assert.ok(ok / grid.length > 0.35, `${ok}/${grid.length}`);
});
