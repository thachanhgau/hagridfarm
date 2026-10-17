import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from './progression-engine.mjs';
import {TUTORIAL_LINES, TUTORIAL_GUEST, advanceTutorial, tutorialEligible, loadTutorial, saveTutorial} from './garden-tutorial.mjs';

test('only an untouched level-1 garden starts the tutorial', () => {
  const fresh = E.newGame(Date.now());
  assert.equal(tutorialEligible(fresh), true);
  assert.equal(tutorialEligible(E.plant(fresh, 0, [0, 1, 2], 'pumpkin', Date.now())), false);
  assert.equal(tutorialEligible(E.testProfile(30, Date.now())), false);
});

test('steps follow real game facts, including out-of-order play', () => {
  assert.equal(advanceTutorial('plant', {}), 'plant');
  assert.equal(advanceTutorial('plant', {planted: true}), 'grow');
  assert.equal(advanceTutorial('plant', {planted: true, mature: true}), 'harvest');
  assert.equal(advanceTutorial('grow', {planted: true, mature: true}), 'harvest');
  assert.equal(advanceTutorial('harvest', {harvested: true}), 'feed');
  assert.equal(advanceTutorial('plant', {harvested: true}), 'feed');
  assert.equal(advanceTutorial('feed', {harvested: true}), 'feed'); // feeding waits for the tap
});

test('Hagrid lines stay within eight words and the guest never joins the garden', () => {
  for (const line of Object.values(TUTORIAL_LINES)) assert.ok(line.split(/\s+/).length <= 8, line);
  assert.ok(E.CREATURE[TUTORIAL_GUEST.species].level > 1); // why it must be a visiting guest
});

test('tutorial step persists and bad saves fall back to null', () => {
  const m = new Map(), s = {getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v)};
  assert.equal(loadTutorial(s), null);
  saveTutorial(s, 'harvest'); assert.equal(loadTutorial(s), 'harvest');
  m.set('hagrid-tutorial-v1', '{"step":"nope"}'); assert.equal(loadTutorial(s), null);
});

test('the engine time skip matures the first pumpkins exactly', () => {
  const t = Date.now();
  let g = E.plant(E.newGame(t), 0, [0, 1, 2], 'pumpkin', t);
  g = E.advanceTime(g, E.CROP.pumpkin.growMs);
  assert.ok(g.plots[0].slots.filter(Boolean).every((e) => E.growth(e, E.nowFor(g, t)).mature));
  assert.equal(E.harvest(g, 0, [0, 1, 2], t).inventory.pumpkin, 3);
});
