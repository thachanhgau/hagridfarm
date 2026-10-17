import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CROP,
  CREATURE,
  GameRuleError,
  advanceTime,
  adopt,
  growth,
  harvest,
  lineCells,
  newGame,
  plant,
  restore,
  restoreChecked,
} from './game-engine.mjs';

const NOW = 1_700_000_000_000;

function codeOf(fn) {
  try {
    fn();
  } catch (error) {
    assert.ok(error instanceof GameRuleError, `expected GameRuleError, got ${error}`);
    return error.code;
  }
  assert.fail('expected operation to reject');
}

test('exports six crop configs with Vietnamese labels and rarity durations', () => {
  assert.deepEqual(Object.keys(CROP), ['pumpkin', 'strawberry', 'daisy', 'dittany', 'puffapod', 'mandrake']);
  assert.deepEqual(
    Object.fromEntries(Object.entries(CROP).map(([id, item]) => [id, [item.rarity, item.growMs]])),
    {
      pumpkin: ['common', 120_000],
      strawberry: ['uncommon', 300_000],
      daisy: ['common', 120_000],
      dittany: ['rare', 900_000],
      puffapod: ['rare', 900_000],
      mandrake: ['epic', 1_800_000],
    },
  );
  assert.equal(CROP.daisy.label, 'Cúc trắng');
  assert.equal(CROP.dittany.label, 'Bạch tiên');
  for (const item of Object.values(CROP)) {
    assert.match(item.label, /\S/);
    assert.match(item.rarityLabel, /\S/);
  }
});

test('exports creature rarity display and late-progression gates', () => {
  assert.deepEqual(
    Object.fromEntries(Object.entries(CREATURE).map(([id, item]) => [id, [item.growMs, item.rarity, item.lateProgression, item.level]])),
    {
      puffskein: [300_000, 'common', false, null],
      bowtruckle: [600_000, 'uncommon', false, null],
      niffler: [1_200_000, 'rare', false, null],
      hippogriff: [2_400_000, 'epic', false, null],
      dragon: [5_400_000, 'legendary', true, null],
      'three-headed-dog': [5_400_000, 'legendary', true, null],
    },
  );
  assert.equal(CREATURE.hippogriff.label, 'Bằng Mã');
  for (const item of Object.values(CREATURE)) assert.match(item.rarityLabel, /\S/);
});

test('new game has three plots and nine empty slots each', () => {
  const state = newGame(NOW);
  assert.equal(state.plots.length, 3);
  assert.deepEqual(state.plots.map((plot) => plot.slots.length), [9, 9, 9]);
  assert.ok(state.plots.every((plot) => plot.slots.every((slot) => slot === null)));
  assert.equal(state.offsetMs, 0);
});

test('lineCells maps the eight legal planting lines', () => {
  assert.deepEqual(lineCells('horizontal', 0), [0, 1, 2]);
  assert.deepEqual(lineCells('horizontal', 2), [6, 7, 8]);
  assert.deepEqual(lineCells('vertical', 0), [0, 3, 6]);
  assert.deepEqual(lineCells('vertical', 2), [2, 5, 8]);
  assert.deepEqual(lineCells('diagonal', 0), [0, 4, 8]);
  assert.deepEqual(lineCells('diagonal', 1), [2, 4, 6]);
  assert.equal(codeOf(() => lineCells('diagonal', 2)), 'INVALID_LINE');
  assert.equal(codeOf(() => plant(newGame(NOW), 0, [4], 'pumpkin', NOW)), 'INVALID_SELECTION');
  const ordered = plant(newGame(NOW), 0, [2, 1, 0], 'pumpkin', NOW);
  assert.ok(ordered.plots[0].slots.slice(0, 3).every(Boolean));
});

test('planting is atomic and never overwrites occupied slots', () => {
  let state = newGame(NOW);
  state = plant(state, 0, lineCells('horizontal', 0), 'pumpkin', NOW);
  const before = JSON.stringify(state);
  assert.equal(codeOf(() => plant(state, 0, lineCells('vertical', 0), 'daisy', NOW)), 'OCCUPIED_SLOT');
  assert.equal(JSON.stringify(state), before);
  assert.equal(codeOf(() => plant(state, 0, [3, 3], 'daisy', NOW)), 'INVALID_SELECTION');
  assert.equal(JSON.stringify(state), before);
  assert.equal(codeOf(() => plant(state, 3, [3], 'daisy', NOW)), 'INVALID_PLOT');
  assert.equal(JSON.stringify(state), before);
});

test('three legal lines fill a plot; a fourth species is rejected by saved-state validation', () => {
  let state = newGame(NOW);
  state = plant(state, 0, lineCells('horizontal', 0), 'pumpkin', NOW);
  state = plant(state, 0, lineCells('horizontal', 1), 'daisy', NOW);
  state = plant(state, 0, lineCells('horizontal', 2), 'strawberry', NOW);
  const before = JSON.stringify(state);
  assert.equal(codeOf(() => plant(state, 0, lineCells('diagonal', 0), 'mandrake', NOW)), 'OCCUPIED_SLOT');
  assert.equal(JSON.stringify(state), before);
  const invalid = JSON.parse(JSON.stringify(state));
  invalid.plots[0].slots[8].species = 'mandrake';
  assert.deepEqual(restore(invalid, NOW), newGame(NOW));
});

test('growth uses exact 0/.25/.65/1 boundaries and mature harvest clears slots', () => {
  const state = plant(newGame(NOW), 0, lineCells('horizontal', 0), 'pumpkin', NOW);
  const entry = state.plots[0].slots[0];
  const growMs = CROP.pumpkin.growMs;
  assert.equal(growth(entry, NOW).stage, 0);
  assert.equal(growth(entry, NOW + growMs * 0.25).stage, 1);
  assert.equal(growth(entry, NOW + growMs * 0.65).stage, 2);
  assert.equal(growth(entry, NOW + growMs).stage, 3);
  assert.equal(growth(entry, NOW + growMs).mature, true);
  assert.equal(codeOf(() => harvest(state, 0, [0], NOW + growMs - 1)), 'IMMATURE');
  const harvested = harvest(state, 0, [0], NOW + growMs);
  assert.equal(harvested.plots[0].slots[0], null);
  assert.equal(harvested.inventory.pumpkin, 1);
  assert.equal(state.plots[0].slots[0].species, 'pumpkin');
});

test('harvest validates all selected entries before changing any slot', () => {
  let state = newGame(NOW);
  state = plant(state, 0, lineCells('horizontal', 0), 'pumpkin', NOW);
  state = plant(state, 0, lineCells('horizontal', 1), 'strawberry', NOW);
  const before = JSON.stringify(state);
  assert.equal(codeOf(() => harvest(state, 0, [0, 3], NOW + CROP.pumpkin.growMs)), 'IMMATURE');
  assert.equal(JSON.stringify(state), before);
  assert.equal(codeOf(() => harvest(state, 0, [6], NOW)), 'EMPTY_SLOT');
});

test('timestamps and virtual time survive JSON reload/offline advancement', () => {
  let state = plant(newGame(NOW), 1, lineCells('vertical', 2), 'strawberry', NOW);
  const savedAt = JSON.stringify(state);
  const restored = restore(savedAt, NOW + 10);
  assert.equal(restored.plots[1].slots[8].plantedAt, NOW);
  assert.equal(growth(restored.plots[1].slots[8], NOW + 10).stage, 0);
  const advanced = advanceTime(restored, CROP.strawberry.growMs * 0.65);
  assert.equal(advanced.offsetMs, CROP.strawberry.growMs * 0.65);
  assert.equal(growth(advanced.plots[1].slots[8], NOW + 10).stage, 2);
  const reloaded = restore(JSON.stringify(advanced), NOW + 10);
  assert.equal(growth(reloaded.plots[1].slots[8], NOW + 10).stage, 2);
  assert.equal(reloaded.offsetMs, advanced.offsetMs);
});

test('planting and adopting after virtual time start at stage 0 while older entries retain age', () => {
  const planted = plant(newGame(NOW), 0, lineCells('horizontal', 0), 'pumpkin', NOW);
  const advanced = advanceTime(planted, CROP.pumpkin.growMs * 0.65);
  assert.equal(growth(advanced.plots[0].slots[0], NOW).stage, 2);

  const afterPlant = plant(advanced, 0, lineCells('horizontal', 1), 'pumpkin', NOW);
  assert.equal(growth(afterPlant.plots[0].slots[0], NOW).stage, 2);
  assert.equal(growth(afterPlant.plots[0].slots[3], NOW).stage, 0);
  const reloadedPlant = restore(JSON.stringify(afterPlant), NOW);
  assert.equal(growth(reloadedPlant.plots[0].slots[0], NOW).stage, 2);
  assert.equal(growth(reloadedPlant.plots[0].slots[3], NOW).stage, 0);

  const afterAdoption = adopt(advanced, 'puffskein', NOW);
  assert.equal(growth(afterAdoption.creatures[0], NOW).stage, 0);
  const reloadedCreature = restore(JSON.stringify(afterAdoption), NOW);
  assert.equal(growth(reloadedCreature.creatures[0], NOW).stage, 0);
});

test('advanceTime is immutable, explicit, and rejects invalid durations', () => {
  const state = newGame(NOW);
  const advanced = advanceTime(state, 30_000);
  assert.equal(state.offsetMs, 0);
  assert.equal(advanced.offsetMs, 30_000);
  assert.equal(codeOf(() => advanceTime(state, -1)), 'INVALID_DURATION');
  assert.equal(codeOf(() => advanceTime(state, Number.NaN)), 'INVALID_DURATION');
  assert.equal(codeOf(() => advanceTime(state, Number.POSITIVE_INFINITY)), 'INVALID_DURATION');
});

test('regular creatures adopt, late creatures require explicit preview bypass, and growth works', () => {
  let state = newGame(NOW);
  state = adopt(state, 'puffskein', NOW);
  assert.equal(state.creatures.length, 1);
  const creature = state.creatures[0];
  assert.equal(growth(creature, NOW + CREATURE.puffskein.growMs).stage, 3);
  assert.equal(codeOf(() => adopt(state, 'dragon', NOW)), 'LOCKED_CREATURE');
  const preview = adopt(state, 'dragon', NOW, true);
  assert.equal(preview.creatures.at(-1).preview, true);
  assert.equal(preview.creatures.at(-1).level, null);
  assert.equal(codeOf(() => adopt(preview, 'three-headed-dog', NOW, 'yes')), 'INVALID_PREVIEW_FLAG');
  const full = adopt(preview, 'bowtruckle', NOW);
  assert.equal(full.creatures.length, 3);
  assert.equal(codeOf(() => adopt(full, 'hippogriff', NOW)), 'HOUSING_FULL');
});

test('restore sanitizes valid data and falls back for malformed or invalid saved data', () => {
  const valid = plant(newGame(NOW), 0, lineCells('horizontal', 0), 'pumpkin', NOW);
  const restored = restore(JSON.stringify(valid), NOW + 1);
  assert.equal(restored.plots[0].slots[0].species, 'pumpkin');
  assert.equal(restored.plots[0].slots[0].virtualOffsetMs, 0);
  assert.deepEqual(restore('{broken json', NOW), newGame(NOW));
  assert.deepEqual(restore({ version: 999 }, NOW), newGame(NOW));
  const invalid = JSON.parse(JSON.stringify(valid));
  invalid.plots[0].slots[0].plantedAt = Infinity;
  assert.deepEqual(restore(invalid, NOW), newGame(NOW));
  const badTypes = JSON.parse(JSON.stringify(valid));
  badTypes.plots[0].slots[1] = { type: 'crop', species: 'mandrake', plantedAt: NOW, virtualOffsetMs: 0 };
  badTypes.plots[0].slots[2] = { type: 'crop', species: 'strawberry', plantedAt: NOW, virtualOffsetMs: 0 };
  badTypes.plots[0].slots[3] = { type: 'crop', species: 'dittany', plantedAt: NOW, virtualOffsetMs: 0 };
  assert.deepEqual(restore(badTypes, NOW), newGame(NOW));
});

test('non-finite and absurd timestamps reject at every public time boundary', () => {
  for (const value of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.MAX_VALUE]) {
    assert.equal(codeOf(() => newGame(value)), 'INVALID_TIMESTAMP');
    assert.equal(codeOf(() => restore({}, value)), 'INVALID_TIMESTAMP');
  }
  const state = newGame(NOW);
  assert.equal(codeOf(() => plant(state, 0, lineCells('horizontal', 0), 'pumpkin', Number.NaN)), 'INVALID_TIMESTAMP');
  assert.equal(codeOf(() => adopt(state, 'puffskein', Number.POSITIVE_INFINITY)), 'INVALID_TIMESTAMP');
  assert.equal(codeOf(() => growth({ type: 'crop', species: 'pumpkin', plantedAt: NOW }, Number.MAX_VALUE)), 'INVALID_TIMESTAMP');
});


test('strict restore reports corrupted data rather than silently replacing saved progress', () => {
  const now=Date.now(), state=plant(newGame(now),0,lineCells('horizontal',0),'pumpkin',now);
  assert.deepEqual(restoreChecked(JSON.stringify(state),now+1000),state);
  assert.throws(()=>restoreChecked('{broken',now));
  assert.throws(()=>restoreChecked({...state,version:999},now));
  assert.throws(()=>restoreChecked({...state,plots:[]},now));
});
