import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from './progression-engine.mjs';
import {GUIDE, guideFacts, guideAutoDone, nextLesson} from './garden-guide.mjs';

const facts = (state, extra = {}) => guideFacts({E, state, now: Date.now(), connected: true, ...extra});

test('every lesson has a unique id the server accepts, a level up to 20 and something to press or read', () => {
  const ids = GUIDE.map(l => l.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.length <= 64);
  for (const l of GUIDE) {
    assert.match(l.id, /^[a-z0-9-]{1,32}$/);
    assert.ok(l.level >= 1 && l.level <= 20 && l.title && l.line);
  }
  assert.deepEqual(GUIDE.map(l => l.level), [...GUIDE.map(l => l.level)].sort((a, b) => a - b));
});

test('a lesson waits for its level and for something to act on, then for its own fact', () => {
  const state = E.newGame(Date.now());
  const quiet = facts(state);
  // Level 1, nothing growing, no quest ready, supplies unknown: nothing to show yet.
  assert.equal(nextLesson(1, quiet, new Set()), null);
  const planted = E.plant(state, 0, [0, 1, 2], 'pumpkin', Date.now());
  assert.equal(nextLesson(1, facts(planted), new Set()).id, 'care');
  assert.equal(nextLesson(1, facts(planted, {ev: new Set(['care'])}), new Set()), null);
  // Done ids from the server skip a lesson; level 2 opens «Gieo xen».
  assert.equal(nextLesson(2, facts(planted), new Set(['care'])).id, 'mix');
});

test('lessons already done in the garden finish silently instead of being shown', () => {
  const state = E.testProfile(12, Date.now());
  const done = guideAutoDone(12, facts(state), new Set());
  assert.ok(done.includes('pen') && done.includes('plot4') && done.includes('craft'), done.join(','));
  assert.ok(!done.includes('level20'));
});

test('past level 20 the notebook rests: nothing shown, nothing sent', () => {
  const state = E.testProfile(30, Date.now());
  assert.equal(nextLesson(30, facts(state), new Set()), null);
  assert.deepEqual(guideAutoDone(30, facts(state), new Set()), []);
});
