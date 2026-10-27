import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from './progression-engine.mjs';
const T0 = 1_800_000_000_000;
const {petControlState, openingPetSpecies} = await import('./pet-controls.mjs');
const view = (state, species = 'puffskein', now = T0, ready = true) => petControlState({E, state, species, now, ready});

test('adoption explains level, capacity, starter grant and exact preparation cost', () => {
  const locked = view(E.newGame(T0));
  assert.equal(locked.phase, 'locked');
  assert.equal(locked.help, 'roadmap');
  let state = E.testProfile(10, T0);
  state.built = state.built.filter(id => !id.startsWith('pen_'));
  assert.equal(view(state).phase, 'no-space');
  assert.equal(view(state).help, 'build');
  state = E.testProfile(22, T0);
  const puff = view(state);
  assert.equal(puff.need, 0);
  assert.equal(puff.canAct, true);
  const config = E.CREATURE.bowtruckle;
  state.inventory[config.feed] = config.mealPortions * 3 - 1;
  const before = JSON.stringify(state), shortage = view(state, 'bowtruckle');
  assert.equal(shortage.phase, 'no-food');
  assert.equal(shortage.shortage, 1);
  assert.equal(shortage.help, 'food');
  assert.equal(JSON.stringify(state), before, 'deriving UI never changes a save');
  state.inventory[config.feed]++;
  const ready = view(state, 'bowtruckle');
  assert.equal(ready.canAct, true);
  assert.deepEqual(ready.command, {action: 'adopt', species: 'bowtruckle'});
  assert.equal(E.adopt(state, 'bowtruckle', T0).inventory[config.feed], 0);
});

test('one action follows hungry → eating → ready → hungry with engine parity', () => {
  let state = E.adopt(E.testProfile(10, T0), 'puffskein', T0);
  const before = JSON.stringify(state), hungry = view(state);
  assert.equal(hungry.phase, 'hungry');
  assert.equal(hungry.need, E.CREATURE.puffskein.mealPortions);
  assert.deepEqual(hungry.command, {action: 'feed', species: 'puffskein'});
  assert.equal(JSON.stringify(state), before);
  state = E.feed(state, 'puffskein', T0);
  const at = state.creatures[0].meal.readyAt;
  assert.equal(view(state, 'puffskein', at - 1).phase, 'eating');
  assert.equal(view(state, 'puffskein', at - 1).canAct, false);
  const ready = view(state, 'puffskein', at);
  assert.equal(ready.phase, 'ready');
  assert.equal(ready.canAct, true);
  assert.deepEqual(ready.command, {action: 'claimAnimals', species: 'puffskein'});
  state = E.claimAnimals(state, 'puffskein', at);
  assert.equal(view(state, 'puffskein', at).phase, 'hungry');
  assert.equal(view(state, 'puffskein', at).mealsDone, 1);
});

test('missing food and pending wallet never enable a command', () => {
  const state = E.adopt(E.testProfile(10, T0), 'puffskein', T0);
  state.inventory[E.CREATURE.puffskein.feed] = 0;
  assert.equal(view(state).help, 'food');
  assert.equal(view(state).canAct, false);
  state.inventory[E.CREATURE.puffskein.feed] = 20;
  assert.equal(view(state, 'puffskein', T0, false).canAct, false);
});

test('opening the dock prioritizes a ready pet without passive retargeting', () => {
  let state = E.testProfile(22, T0);
  state = E.adopt(state, 'puffskein', T0);
  state = E.adopt(state, 'bowtruckle', T0);
  state = E.feed(state, 'bowtruckle', T0);
  const now = state.creatures[1].meal.readyAt;
  assert.equal(openingPetSpecies({E, state, species:'puffskein', now}), 'bowtruckle');
  assert.equal(view(state, 'puffskein', now).command.species, 'puffskein');
});
