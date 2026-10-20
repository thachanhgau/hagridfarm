import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from './progression-engine.mjs';
import {nextGoal} from './next-goal.mjs';

const NOW = 1_800_000_000_000;

test('a new garden aims at the next level and names what it unlocks', () => {
  const goal = nextGoal(E, E.newGame(NOW));
  assert.deepEqual(goal.need, {id: 'xp', n: 30, route: 'plant'});
  assert.equal(goal.target.id, 'daisy');
  assert.equal(goal.label, 'Cấp 2 · Cúc trắng');
});

test('an unbuilt expansion asks for the first crop of its cost still short', () => {
  const state = E.testProfile(12, NOW);
  state.built = state.built.filter((id) => id !== 'plot_4');
  state.creatures = [{species: 'puffskein'}];
  state.inventory = {...state.inventory, pumpkin: 2, oats: 6};
  const goal = nextGoal(E, state);
  assert.equal(goal.target.id, 'plot_4');
  assert.equal(goal.label, 'Mở thửa');
  assert.deepEqual(goal.need, {id: 'pumpkin', n: 7, route: 'plant'}); // plot_4 costs 9 pumpkin + 9 oats
  state.inventory = {...state.inventory, pumpkin: 9};
  assert.deepEqual(nextGoal(E, state).need, {id: 'oats', n: 3, route: 'plant'});
  state.inventory = {...state.inventory, oats: 9};
  assert.equal(nextGoal(E, state).route, 'build');
});

test('a free bed points at the next creature to adopt', () => {
  const goal = nextGoal(E, E.testProfile(10, NOW));
  assert.equal(goal.target.id, 'puffskein');
  assert.equal(goal.need, null);
  assert.equal(goal.route, 'creature');
});

test('past 90% of a level the chip shows the XP still needed, even with a building waiting', () => {
  const state = E.testProfile(12, NOW);
  state.built = state.built.filter((id) => id !== 'plot_4');
  state.plots = state.plots.slice(0, 3);
  const row = E.DB.levels[11];
  state.xp = row.totalXP + 10;
  assert.equal(nextGoal(E, state).target.id, 'plot_4');
  state.xp = row.totalXP + Math.ceil(row.xpToNext * 0.95);
  const goal = nextGoal(E, state);
  assert.deepEqual(goal.need, {id: 'xp', n: row.xpToNext - Math.ceil(row.xpToNext * 0.95), route: 'plant'});
  assert.ok(goal.label.startsWith('Cấp 13'));
});
