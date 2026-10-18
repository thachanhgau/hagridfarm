import test from 'node:test';
import assert from 'node:assert/strict';
import {loadEventState, saveEventState, recordFestivalAction, claimEventMilestone, recordCreatureAffinity, hasClaimableEventMilestone, EVENT_STORAGE_KEY} from './garden-events.mjs';

const memory = () => {const m = new Map(); return {getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v))};};
const day = Date.parse('2026-10-17T10:00:00');

// A Lễ Hội Ma day (24/10–06/11), 10:00 in Vietnam.
const festivalDay = Date.parse('2026-10-28T10:00:00+07:00');

test('festival points belong to the calendar season; the garden theme cannot move them', () => {
  const s = memory();
  recordFestivalAction('dailyChest', 150, s, festivalDay);
  assert.equal(claimEventMilestone('hal_m1@2026', {storage: s, nowMs: festivalDay}).ok, true);
  const ev = loadEventState(s, festivalDay); ev.activeEventId = 'event_yule'; saveEventState(ev, s, festivalDay);
  assert.equal(loadEventState(s, festivalDay).points, 150);
  assert.equal(claimEventMilestone('yule_m1@2026', {storage: s, nowMs: festivalDay}).reason, 'INSUFFICIENT_POINTS');
});

test('a legacy shared pool keeps the milestones it had reached as claimable rewards', () => {
  const s = memory();
  s.setItem(EVENT_STORAGE_KEY, JSON.stringify({version: 23, activeEventId: 'event_herbology_fair', points: 90, claimedMilestones: []}));
  const ev = loadEventState(s, festivalDay);
  assert.deepEqual(ev.legacyClaimable, ['herb_m1', 'herb_m2']);
  assert.equal(ev.points, 0);
  assert.equal(hasClaimableEventMilestone(s, festivalDay), true);
});

test('free actions earn festival points only a few times per day', () => {
  const s = memory();
  const gains = Array.from({length: 4}, () => recordFestivalAction('rotate', 8, s, festivalDay).addedPoints);
  assert.deepEqual(gains, [8, 8, 4, 0]);
  assert.equal(recordFestivalAction('rotate', 8, s, festivalDay + 86400000).addedPoints, 8);
  assert.equal(recordFestivalAction('harvest', null, s, festivalDay).addedPoints, 15);
});

test('the crop-care tap and moving buildings are capped; owl quest claims are not', () => {
  const s = memory();
  const care = Array.from({length: 5}, () => recordFestivalAction('care', null, s, festivalDay).addedPoints);
  assert.deepEqual(care, [6, 6, 6, 0, 0]);
  const m = memory();
  assert.deepEqual(Array.from({length: 3}, () => recordFestivalAction('moveBuilding', null, m, festivalDay).addedPoints), [5, 0, 0]);
  const claims = Array.from({length: 4}, () => recordFestivalAction('questClaim', null, s, festivalDay).addedPoints);
  assert.deepEqual(claims, [15, 15, 15, 15]);
});

test('petting adds affinity three times per creature per day', () => {
  const s = memory(), game = {creatures: [{species: 'puffskein', mealsCompleted: 0}]};
  const gains = Array.from({length: 5}, () => recordCreatureAffinity('puffskein', 'pet', s, game, day).gain);
  assert.deepEqual(gains, [12, 12, 12, 0, 0]);
  assert.equal(recordCreatureAffinity('puffskein', 'feed', s, game, day).gain, 20);
  assert.equal(recordCreatureAffinity('puffskein', 'pet', s, game, day + 86400000).gain, 12);
});
