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

test('an unbuilt expansion asks for the crop its kits are made from', () => {
  const state = E.testProfile(12, NOW);
  state.built = state.built.filter((id) => id !== 'plot_4');
  state.creatures = [{species: 'puffskein'}];
  state.inventory = {...state.inventory, kit: 0, pumpkin: 2, oats: 6};
  const goal = nextGoal(E, state);
  assert.equal(goal.target.id, 'plot_4');
  assert.equal(goal.label, 'Mở thửa');
  assert.deepEqual(goal.need, {id: 'pumpkin', n: 4, route: 'plant'}); // 6 kits = 2 batches of 3 pumpkin + 3 oats
  state.inventory = {...state.inventory, pumpkin: 6};
  assert.deepEqual(nextGoal(E, state).need, {id: 'kit', n: 6, route: 'craft'});
  state.inventory = {...state.inventory, kit: 6};
  assert.equal(nextGoal(E, state).route, 'build');
});

test('a free bed points at the next creature to adopt', () => {
  const goal = nextGoal(E, E.testProfile(10, NOW));
  assert.equal(goal.target.id, 'puffskein');
  assert.equal(goal.need, null);
  assert.equal(goal.route, 'creature');
});
