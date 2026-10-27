import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import scene from './scene-data.json' with {type: 'json'};
import motion from './motion-data.json' with {type: 'json'};
import {GARDEN_STAGES} from './garden-growth.mjs';
globalThis.FARM_SCENE = structuredClone(scene);
globalThis.FARM_MOTION = motion;
const {decorSpotProblem, decorSpotGrid, decorOnGround, groundRect} = await import('./decor-placement-ui.mjs');

const {iso} = await import('./scene-renderer.mjs');
const {decorFootprintRect, snapDecorSpot} = await import('./decor-runtime.mjs');
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
  // Unbuilt plot and pen bases are free ground (owner 20/10/2026); built or queued ones are not.
  assert.equal(at(29, 1), '');
  assert.match(at(29, 1, {state: {decorations: [], built: ['pen_1']}}), /chuồng/);
  assert.match(at(29, 1, {state: {decorations: [], construction: [{id: 'pen_1'}]}}), /chuồng/);
  assert.match(at(0, 4), /cảnh vật/);
  assert.match(at(1, 8), /công trình/);
  assert.match(at(12.5, 8.5), /Chồng/);
  // Moving the item itself never collides with its own spot.
  assert.equal(at(12.5, 8.5, {itemId: 'decor_cauldron'}), '');
  assert.match(at(6, 20, {stage: GARDEN_STAGES[0]}), /chưa mở/);
  // An earned decoration's aisle cell is taken only once the garden has it.
  assert.equal(at(6, 4), '');
  assert.match(at(6, 4, {state: {decorations: ['decoration-7']}}), /đồ trang trí của vườn/);
});

test('large pieces: the whole footprint counts, turned with the facing, off paths and the fence', () => {
  // The front tile alone is free aisle ground, but a 3×2 reaches back onto plot 1.
  // Long side along the rows in the default view, along the columns in the right view; centred under the foot.
  assert.deepEqual(decorFootprintRect(6, 7.5, [3, 2]), {c0: 4.5, c1: 6.5, r0: 5.5, r1: 8.5});
  assert.deepEqual(decorFootprintRect(6.5, 7, [3, 2], 'right'), {c0: 4.5, c1: 7.5, r0: 5.5, r1: 7.5});
  assert.deepEqual(decorFootprintRect(6, 7, [1, 1]), {c0: 5.5, c1: 6.5, r0: 6.5, r1: 7.5});
  assert.equal(at(6, 7), '');
  assert.match(at(6, 7, {itemId: 'sp_whomping_anglia'}), /thửa|lối đi/);
  // A 1×1 may sit at the aisle edge; a 2×2 there would cover the path.
  assert.equal(at(7, 8), '');
  assert.match(at(7, 8, {itemId: 'sp_aragog_hollow'}), /lối đi/);
  // Large pieces keep 0.9 tile off the fence: the north-west corner is open ground but too close.
  assert.equal(at(-4, 1), '');
  assert.match(at(-3, 1, {itemId: 'sp_buckbeak_pumpkins'}), /rào/);
  // A placed Knight Bus reaches back along the rows in its default view; turned right, it lies along the columns.
  const bus = {owned: ['sp_knight_bus'], placements: ['sp_knight_bus'], positions: {sp_knight_bus: [-2, 4]}, rotations: {}};
  const near = (col, row, rotations) => decorSpotProblem(col, row, {map: scene, stage: last, state: {decorations: []}, decorations: {...bus, rotations}, itemId: 'decor_mandrake_planter'});
  assert.match(near(-2, 2, {}), /Chồng/);
  assert.equal(near(-2, 2, {sp_knight_bus: 'right'}), '');
  assert.match(near(-3.5, 3.5, {sp_knight_bus: 'right'}), /Chồng/);
});

test('every footprint snaps onto whole cells, in both views, for bought pieces and garden defaults', () => {
  const onLine = value => Math.abs(((value % 1) + 1) % 1 - 0.5) < 1e-9;
  for (const footprint of [[1, 1], [2, 1], [2, 2], [3, 1], [3, 2], [3, 3]]) for (const facing of ['default', 'right']) for (const centred of [false, true]) {
    for (const spot of [[6, 7], [6.5, 7], [6.25, 7.75], [-2.5, 4]]) {
      const snapped = snapDecorSpot(spot, footprint, facing, centred);
      assert.ok(snapped.every(n => Number.isInteger(n * 2)), 'server half-tile spot');
      assert.ok(Math.hypot(snapped[0] - spot[0], snapped[1] - spot[1]) <= Math.SQRT1_2 + 1e-9);
      const rect = decorFootprintRect(...snapped, footprint, facing, centred);
      assert.ok(Object.values(rect).every(onLine), `${footprint} ${facing} ${centred}: ${JSON.stringify(rect)}`);
    }
  }
});

test('a tall piece may not stand in front of a plot and hide it', () => {
  const where = {itemId: 'sp_fawkes_perch', asset: assetOf('sp_fawkes_perch'), iso};
  // Just below plot 2's front corner: free ground, but the 188 px perch covers the plot behind it.
  assert.match(at(11, 7, where), /chồng lên thửa/);
  assert.equal(at(11, 7, {itemId: 'sp_fawkes_perch'}), '');
});

test('every special and Halloween product fits somewhere in the full garden, in both views', () => {
  for (const item of manifest.items.filter(item => ['special','festival'].includes(item.collection))) {
    for (const facing of ['default', 'right']) assert.ok(free(item.id, facing), `${item.id} ${facing}`);
  }
});

test('placement grid: green where the item fits, grey where it cannot, only on opened ground', () => {
  const stage = GARDEN_STAGES[0];
  const grid = decorSpotGrid(stage, ([c, r]) => decorSpotProblem(c, r, {map: scene, stage, state: {decorations: []}, decorations: {}, itemId: 'decor_cauldron', asset: assetOf('decor_cauldron'), iso}));
  const ok = grid.filter(g => g.ok).length;
  assert.ok(grid.every(g => g.at[0] <= stage.right && g.at[1] <= stage.bottom));
  assert.ok(ok > 0 && ok < grid.length);
  // The starter garden is mostly plots, hut and buildings; about a tenth of its half-tile spots stay green for a 1×1.
  assert.ok(ok / grid.length > 0.08, `${ok}/${grid.length}`);
});

test('a plot or pen is not built over a placed decoration', () => {
  const pen = scene.pens.find(p => p.id === 'pen_1');
  const on = {owned: ['decor_cauldron'], placements: ['decor_cauldron'], positions: {decor_cauldron: [pen.col + 1, pen.row + 1]}};
  assert.equal(decorOnGround(groundRect('pen', pen, scene), on), 'decor_cauldron');
  assert.equal(decorOnGround(groundRect('pen', pen, scene), {...on, positions: {decor_cauldron: [6, 7.5]}}), null);
});

test('2×1 and 3×1 pieces may stand on a path; 2×2 and up may not', () => {
  assert.equal(at(7, 8.5, {itemId: 'decor_broom_rack'}), '');
  assert.match(at(7, 8.5, {itemId: 'sp_aragog_hollow'}), /lối đi/);
});

 test('zero-count keepsake keys reserve no land; earned keepsakes protect their own base, not a whole strip',()=>{
 const state={plots:[],built:[],decorations:[],keepsakes:{puffskein:0}};
 assert.equal(at(10,30,{state,decorations:{}}),'');
 state.keepsakes.puffskein=1;assert.equal(at(10,30,{state,decorations:{}}),'');
 assert.equal(at(10,26,{state,decorations:{}}),'');
 assert.match(at(4.5,24.5,{state,decorations:{}}),/kỷ vật/);
 });

// Owner 25/10/2026: pieces stood over plots, pens, the hut and each other. Done when every piece fits many
// areas of the full garden without sharing more than a sliver of screen with a plot, pen, scenery or piece.
test('full garden: no piece covers a plot, pen, scenery or another piece, and each still fits many areas', () => {
  const full = {plots: Array(18).fill({}), built: scene.pens.map(p => p.id), decorations: []};
  const check = (id, col, row, decorations = {}) => decorSpotProblem(col, row, {map: scene, stage: last, state: full, decorations, itemId: id, asset: assetOf(id), iso, assetOf});
  // Spots the old 40 % / 25 % rules allowed in a packed garden (QA 25/10/2026).
  assert.match(check('hw_caramel_apple_cart', 7, 9), /thửa/);
  assert.match(check('sp_knight_bus', 20.5, 10.5), /thửa/);
  assert.match(check('sp_vanishing_cabinet', -3.5, 6.5), /lều/);
  const placed = {owned: ['sp_sorting_hat'], placements: ['sp_sorting_hat'], positions: {sp_sorting_hat: [5, 23]}};
  assert.equal(check('sp_sorting_hat', 5, 23), '');
  // Footprints touch but do not overlap; the sprites would.
  assert.equal(check('sp_goblet_fire', 5, 24), '');
  assert.match(check('sp_goblet_fire', 5, 24, placed), /Chỗ này chồng lên Nón/);
  for (const item of manifest.items.filter(item => ['special', 'festival'].includes(item.collection))) {
    for (const facing of ['default', 'right']) {
      let spots = 0;
      const regions = new Set();
      for (let row = -1; row <= last.bottom; row += 0.5) for (let col = -5; col <= last.right; col += 0.5) {
        if (decorSpotProblem(col, row, {map: scene, stage: last, state: full, decorations: {}, itemId: item.id, facing, asset: item, iso})) continue;
        spots++;
        regions.add(`${Math.floor(col / 8)},${Math.floor(row / 8)}`);
      }
      assert.ok(spots >= 60 && regions.size >= 4, `${item.id} ${facing}: ${spots} spots in ${regions.size} areas`);
    }
  }
});
