import test from 'node:test';
import assert from 'node:assert/strict';
import {loadEventState, saveEventState, recordFestivalAction, claimEventMilestone, recordCreatureAffinity, hasClaimableEventMilestone, EVENT_STORAGE_KEY} from './garden-events.mjs';

const memory = () => {const m = new Map(); return {getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v))};};
const day = Date.parse('2026-10-17T10:00:00');

test('festival points belong to one festival; switching cannot reuse them', () => {
  const s = memory();
  recordFestivalAction('dailyChest', 150, s);
  assert.equal(claimEventMilestone('hal_m3', {storage: s}).ok, true);
  const ev = loadEventState(s); ev.activeEventId = 'event_yule'; saveEventState(ev, s);
  assert.equal(loadEventState(s).points, 0);
  assert.equal(claimEventMilestone('yule_m1', {storage: s}).reason, 'INSUFFICIENT_POINTS');
});

test('legacy shared pool migrates to the event that was active', () => {
  const s = memory();
  s.setItem(EVENT_STORAGE_KEY, JSON.stringify({version: 23, activeEventId: 'event_herbology_fair', points: 90, claimedMilestones: []}));
  const ev = loadEventState(s);
  assert.deepEqual(ev.pointsByEvent, {event_herbology_fair: 90});
  assert.equal(ev.points, 90);
  assert.equal(hasClaimableEventMilestone(s), true);
});

test('free actions earn festival points only a few times per day', () => {
  const s = memory();
  const gains = Array.from({length: 6}, () => recordFestivalAction('rotate', 10, s, day).addedPoints);
  assert.deepEqual(gains, [10, 10, 10, 0, 0, 0]);
  assert.equal(recordFestivalAction('rotate', 10, s, day + 86400000).addedPoints, 10);
  assert.equal(recordFestivalAction('harvest', null, s, day).addedPoints, 15);
});

test('the crop-care tap and moving buildings are capped; owl quest claims are not', () => {
  const s = memory();
  const care = Array.from({length: 5}, () => recordFestivalAction('care', null, s, day).addedPoints);
  assert.deepEqual(care, [6, 6, 6, 0, 0]);
  const moves = Array.from({length: 3}, () => recordFestivalAction('moveBuilding', null, s, day).addedPoints);
  assert.deepEqual(moves, [5, 0, 0]);
  const claims = Array.from({length: 4}, () => recordFestivalAction('questClaim', null, s, day).addedPoints);
  assert.deepEqual(claims, [15, 15, 15, 15]);
});

test('petting adds affinity three times per creature per day', () => {
  const s = memory(), game = {creatures: [{species: 'puffskein', mealsCompleted: 0}]};
  const gains = Array.from({length: 5}, () => recordCreatureAffinity('puffskein', 'pet', s, game, day).gain);
  assert.deepEqual(gains, [12, 12, 12, 0, 0]);
  assert.equal(recordCreatureAffinity('puffskein', 'feed', s, game, day).gain, 20);
  assert.equal(recordCreatureAffinity('puffskein', 'pet', s, game, day + 86400000).gain, 12);
});
