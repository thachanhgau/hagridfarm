import test from 'node:test';
import assert from 'node:assert/strict';
import scene from './scene-data.json' with {type: 'json'};
import motion from './motion-data.json' with {type: 'json'};
import {GARDEN_STAGES} from './garden-growth.mjs';
globalThis.FARM_SCENE = structuredClone(scene);
globalThis.FARM_MOTION = motion;
const {decorSpotProblem} = await import('./decor-placement-ui.mjs');

const last = GARDEN_STAGES.at(-1);
const decorations = {owned: ['decor_cauldron', 'decor_broom_rack'], placements: ['decor_cauldron', null, null, null, null, null], positions: {decor_cauldron: [12.5, 8]}};
const at = (col, row, extra = {}) => decorSpotProblem(col, row, {map: scene, stage: last, state: {decorations: []}, decorations, itemId: 'decor_broom_rack', ...extra});

test('free placement: open ground is free; plots, pens, buildings, locked land and crowding are not', () => {
  assert.equal(at(6, 7.5), '');
  assert.equal(at(-3, 2), '');
  assert.match(at(3, 4), /thửa/);
  assert.match(at(29, 1), /chuồng/);
  assert.match(at(0, 4), /cảnh vật/);
  assert.match(at(2, -1), /công trình/);
  assert.match(at(12.5, 8.5), /Sát/);
  // Moving the item itself never collides with its own spot.
  assert.equal(at(12.5, 8.5, {itemId: 'decor_cauldron'}), '');
  assert.match(at(6, 20, {stage: GARDEN_STAGES[0]}), /chưa mở/);
  // An earned decoration's aisle cell is taken only once the garden has it.
  assert.equal(at(6, 3.5), '');
  assert.match(at(6, 3.5, {state: {decorations: ['decoration-7']}}), /đồ trang trí của vườn/);
});
