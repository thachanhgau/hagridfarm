import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HOGWARTS_EVENTS, FESTIVAL_DAYS, EVENT_STORAGE_KEY, LEGACY_MILESTONES,
  vnDayKey, festivalStatus, festivalActionKind, loadEventState, recordFestivalAction,
  claimEventMilestone, pendingFestivalRewards, hasClaimableEventMilestone,
} from './garden-events.mjs';

const memory = () => {const m = new Map(); return {getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v))};};
const vn = (iso) => Date.parse(`${iso}+07:00`);
const DAY = 86400000;
// An existing player, so the late-join grace does not apply.
const veteran = (extra = {}) => {
  const s = memory();
  s.setItem(EVENT_STORAGE_KEY, JSON.stringify({version: 25, activeEventId: 'none', joinDay: '2026-01-01', pointsBySeason: {}, claimedMilestones: [], ...extra}));
  return s;
};

test('the festival day key follows Vietnam midnight, not UTC or the device', () => {
  assert.equal(vnDayKey(Date.parse('2026-10-23T16:59:59Z')), '2026-10-23');
  assert.equal(vnDayKey(Date.parse('2026-10-23T17:00:00Z')), '2026-10-24');
  // 23:59 on 23/10 in Vietnam earns nothing; one minute later Lễ Hội Ma is open.
  assert.equal(recordFestivalAction('harvest', null, veteran(), vn('2026-10-23T23:59:00')).addedPoints, 0);
  assert.equal(recordFestivalAction('harvest', null, veteran(), vn('2026-10-24T00:00:00')).addedPoints, 15);
  // Last minute of 06/11 still counts; 00:00 on 07/11 does not.
  assert.equal(recordFestivalAction('harvest', null, veteran(), vn('2026-11-06T23:59:00')).addedPoints, 15);
  assert.equal(recordFestivalAction('harvest', null, veteran(), vn('2026-11-07T00:00:00')).addedPoints, 0);
});

test('four 14-day festivals, one at a time, with the next one and a countdown off-season', () => {
  const seasonal = HOGWARTS_EVENTS.filter((e) => e.season);
  assert.deepEqual(seasonal.map((e) => e.id), ['event_halloween', 'event_yule', 'event_herbology_fair', 'event_quidditch_cup']);
  // Walk two years day by day: each festival runs exactly 14 days and they never overlap.
  const runs = new Map();
  for (let t = Date.UTC(2026, 0, 1); t < Date.UTC(2028, 0, 1); t += DAY) {
    const key = new Date(t).toISOString().slice(0, 10);
    const s = festivalStatus(key);
    if (s.active) runs.set(s.active.seasonKey, (runs.get(s.active.seasonKey) || 0) + 1);
    else assert.ok(s.next.daysUntil > 0);
  }
  assert.equal(runs.size, 8);
  for (const days of runs.values()) assert.equal(days, FESTIVAL_DAYS);

  const off = festivalStatus('2026-10-18');
  assert.equal(off.active, null);
  assert.equal(off.next.id, 'event_halloween');
  assert.equal(off.next.daysUntil, 6);
  const first = festivalStatus('2026-10-24');
  assert.equal(first.active.daysLeft, 14);
  assert.equal(festivalStatus('2026-11-06').active.daysLeft, 1);
  // Across New Year the next festival is next spring's.
  assert.equal(festivalStatus('2027-01-01').next.seasonKey, 'event_herbology_fair@2027');
  assert.equal(festivalStatus('2027-06-20').active.id, 'event_quidditch_cup');
});

test('a player who joins mid-festival gets 14 days for that first festival only', () => {
  assert.equal(festivalStatus('2026-11-10', '2026-11-05').active.end, '2026-11-18');
  assert.equal(festivalStatus('2026-11-19', '2026-11-05').active, null);
  // Joining on the first day, or off-season, changes nothing.
  assert.equal(festivalStatus('2026-11-07', '2026-10-24').active, null);
  assert.equal(festivalStatus('2026-12-31', '2026-10-18').active.end, '2026-12-31');
  // A Dạ vũ Noel join on 31/12 runs into January, still before the spring festival.
  assert.equal(festivalStatus('2027-01-13', '2026-12-31').active.seasonKey, 'event_yule@2026');
  // A brand-new save mid-festival sees the full 14 days.
  const fresh = loadEventState(memory(), vn('2026-11-01T12:00:00'));
  assert.equal(fresh.joinDay, '2026-11-01');
  assert.equal(festivalStatus(fresh.day, fresh.joinDay).active.daysLeft, 14);
});

test('farm work counts 60 points a day, free actions 20, owl quests always; caps reset at VN midnight', () => {
  assert.equal(festivalActionKind('plant'), 'farm');
  assert.equal(festivalActionKind('unlockPlot'), 'farm');
  assert.equal(festivalActionKind('helpTour'), 'free');
  assert.equal(festivalActionKind('dailyChest'), 'quest');
  const s = veteran();
  const t = vn('2026-10-28T08:00:00');
  assert.deepEqual([15, 15, 15, 15, 15].map(() => recordFestivalAction('harvest', null, s, t).addedPoints), [15, 15, 15, 15, 0]);
  assert.deepEqual(['helpTour', 'helpTour', 'pet'].map((a) => recordFestivalAction(a, null, s, t).addedPoints), [20, 0, 0]);
  assert.equal(recordFestivalAction('questClaim', null, s, t).addedPoints, 15);
  assert.equal(recordFestivalAction('dailyChest', 20, s, t).addedPoints, 20);
  const state = loadEventState(s, t);
  assert.deepEqual([state.farmToday, state.freeToday, state.points], [60, 20, 115]);
  // 23:59 is the same day; 00:00 VN is a new one.
  assert.equal(recordFestivalAction('plant', null, s, vn('2026-10-28T23:59:00')).addedPoints, 0);
  assert.equal(recordFestivalAction('plant', null, s, vn('2026-10-29T00:00:00')).addedPoints, 10);
  assert.equal(recordFestivalAction('helpTour', null, s, vn('2026-10-29T00:00:00')).addedPoints, 20);
});

test('milestones are 100 / 450 / 1000 and claimed per season, so next year can earn them again', () => {
  for (const e of HOGWARTS_EVENTS.filter((x) => x.season)) assert.deepEqual(e.milestones.map((m) => m.points), [100, 450, 1000]);
  const s = veteran();
  recordFestivalAction('dailyChest', 100, s, vn('2026-10-25T10:00:00'));
  assert.equal(claimEventMilestone('hal_m1@2026', {storage: s, nowMs: vn('2026-10-25T10:00:00')}).ok, true);
  recordFestivalAction('dailyChest', 100, s, vn('2027-10-25T10:00:00'));
  assert.equal(claimEventMilestone('hal_m1@2027', {storage: s, nowMs: vn('2027-10-25T10:00:00')}).ok, true);
  assert.equal(claimEventMilestone('hal_m1@2027', {storage: s, nowMs: vn('2027-10-25T10:00:00')}).reason, 'ALREADY_CLAIMED');
  assert.equal(claimEventMilestone('hal_m1@x', {storage: s}).reason, 'NOT_FOUND');
});

test('a milestone reached but not claimed stays claimable after its festival ends', () => {
  const s = veteran();
  recordFestivalAction('dailyChest', 450, s, vn('2026-11-06T20:00:00'));
  const after = vn('2026-11-20T10:00:00');
  const pending = pendingFestivalRewards(loadEventState(s, after));
  assert.deepEqual(pending.map((m) => m.key), ['hal_m1@2026', 'hal_m2@2026']);
  assert.equal(hasClaimableEventMilestone(s, after), true);
  assert.equal(claimEventMilestone('hal_m2@2026', {storage: s, nowMs: after}).ok, true);
  assert.deepEqual(pendingFestivalRewards(loadEventState(s, after)).map((m) => m.key), ['hal_m1@2026']);
});

test('V24 saves migrate: claimed stay claimed, reached-but-unclaimed old rewards stay claimable, old points do not carry over', () => {
  const s = memory();
  s.setItem(EVENT_STORAGE_KEY, JSON.stringify({
    version: 24,
    activeEventId: 'event_yule',
    pointsByEvent: {event_halloween: 160, event_yule: 40},
    claimedMilestones: ['hal_m1', 'hal_m2'],
    freeDay: '2026-10-17',
    freeCounts: {rotate: 3},
  }));
  const now = vn('2026-10-28T10:00:00');
  const state = loadEventState(s, now);
  assert.equal(state.version, 25);
  assert.equal(state.activeEventId, 'event_yule');
  assert.deepEqual(state.legacyClaimable, ['hal_m3', 'yule_m1']);
  assert.deepEqual(state.claimedMilestones, ['hal_m1', 'hal_m2']);
  assert.equal(state.points, 0);
  let granted = null;
  const res = claimEventMilestone('hal_m3', {storage: s, nowMs: now, onGrantReward: (r) => { granted = r; }});
  assert.equal(res.ok, true);
  assert.deepEqual(granted, LEGACY_MILESTONES.hal_m3.reward);
  assert.equal(claimEventMilestone('hal_m3', {storage: s, nowMs: now}).reason, 'ALREADY_CLAIMED');
  assert.equal(claimEventMilestone('hal_m1', {storage: s, nowMs: now}).reason, 'ALREADY_CLAIMED');
  // The migration is saved once, so reloading does not bring old rewards back.
  assert.deepEqual(loadEventState(s, now).legacyClaimable, ['yule_m1']);
  // Old claims do not block this year's milestones.
  recordFestivalAction('dailyChest', 100, s, now);
  assert.equal(claimEventMilestone('hal_m1@2026', {storage: s, nowMs: now}).ok, true);
});
