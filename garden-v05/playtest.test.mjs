import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlaytestLog, summarizePlaytest, PLAYTEST_KEY} from './garden-playtest.mjs';

const memory = () => {const m = new Map(); return {m, getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v)};};

test('the log is completely off without ?playtest=1', () => {
  const s = memory();
  const log = createPlaytestLog({enabled: false, storage: s});
  log.track('action', {action: 'plant'});
  assert.equal(log.events().length, 0);
  assert.equal(s.m.size, 0);
});

test('only short scalars are stored, never objects or long text', () => {
  const s = memory();
  let t = 1000;
  const log = createPlaytestLog({enabled: true, storage: s, now: () => t, context: {screen: 'phone'}});
  t += 50;
  log.track('toast', {text: 'x'.repeat(200), player: {name: 'Harry'}, ok: true});
  const e = log.events().at(-1);
  assert.equal(e.text.length, 60);
  assert.equal(e.player, undefined);
  assert.equal(e.t, 50);
  assert.ok(JSON.parse(s.m.get(PLAYTEST_KEY)).length >= 2);
  assert.doesNotMatch(log.exportJson(), /Harry/);
});

test('summary reports tutorial progress, first actions, idle gaps and level', () => {
  const s = 'abc', ev = (t, type, extra = {}) => ({s, t, type, ...extra});
  const [r] = summarizePlaytest([
    ev(0, 'session_start', {screen: 'phone', newGarden: true}),
    ev(100, 'tutorial_step', {step: 'intro'}), ev(2700, 'tutorial_step', {step: 'plant'}),
    ev(31000, 'action', {action: 'plant'}), ev(31010, 'tutorial_step', {step: 'grow'}),
    ev(33000, 'tutorial_step', {step: 'harvest'}), ev(36000, 'action', {action: 'harvest'}),
    ev(36100, 'level_up', {level: 2}), ev(36200, 'tutorial_step', {step: 'feed'}),
    ev(40000, 'tutorial_step', {step: 'owl'}), ev(41500, 'tutorial_step', {step: 'done'}),
  ]);
  assert.equal(r.tutorialDone, true);
  assert.equal(r.firstPlantMs, 31000);
  assert.equal(r.firstHarvestMs, 36000);
  assert.equal(r.longestIdle.step, 'plant'); // 28 s stuck on "plant" is the signal to look at
  assert.equal(r.levelReached, 2);
  assert.equal(r.actions.plant, 1);
});
