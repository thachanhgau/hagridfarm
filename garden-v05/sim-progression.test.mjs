import test from 'node:test';
import assert from 'node:assert/strict';
import {simulate, questWater, WATER_PRICE, freeFestivalPoints, timeToMilestones, FESTIVAL_MILESTONES} from './sim-progression.mjs';

test('the bot levels up, opens the first pen at level 10 and pays for every planted cell', () => {
  const run = simulate({days: 8});
  const levels = run.daily.map((d) => d.level);
  assert.ok(levels.every((l, i) => i === 0 || l >= levels[i - 1]));
  assert.ok(run.final.level >= 10);
  assert.ok(run.opened.pen_1 && run.opened.pen_1.level >= 10);
  assert.ok(run.final.creatures.some((c) => c.species === 'puffskein'));
  for (const d of run.daily) assert.ok(d.galleons >= d.cells * WATER_PRICE);
});

test('the simulation is deterministic and quest water follows the 18/10/2026 table', () => {
  assert.deepEqual(simulate({days: 3}).daily, simulate({days: 3}).daily);
  assert.equal(questWater(1), 6 + 6 + 5 + 12);
  assert.equal(questWater(30), 12 + 8 + 5 + 12);
});

test('festival points add up per UI command, owl quest claim and chest', () => {
  const run = simulate({days: 3});
  for (const {festival: f} of run.daily) {
    assert.equal(f.sessions.length, 3);
    assert.equal(f.farm, f.sessions.reduce((a, b) => a + b, 0));
    assert.equal(f.quests, f.questsDone * 15);
    assert.equal(f.chest, f.questsDone === 3 ? 20 : 0);
    assert.equal(f.total, f.farm + f.quests + f.chest);
  }
  // A new garden plants nine rows (10 points each) in its first session.
  assert.equal(run.daily[0].festival.sessions[0], 90);
  // Free taps would give 159 points; the game counts 20 a day.
  assert.equal(freeFestivalPoints(false), 3 * 8 + 12 + 15 + 10 + 3 * 6 + 5 + 3 * 25);
  assert.equal(simulate({days: 1, free: true}).daily[0].festival.free, 20);
  assert.deepEqual(FESTIVAL_MILESTONES, [100, 450, 1000]);
});

test('time to milestones walks sessions and honours a daily farm cap', () => {
  const day = {festival: {sessions: [50, 50], free: 0, quests: 15, chest: 0}};
  const daily = [day, day, day];
  assert.deepEqual(timeToMilestones(daily, 0, [30, 100, 200], {farmCap: Infinity}), [{day: 1, session: 1}, {day: 1, session: 2}, {day: 2, session: 2}]);
  // Capped at 60 a day (the game's default) the second session adds only 10 + 15.
  assert.deepEqual(timeToMilestones(daily, 0, [60, 100, 300], {maxDays: 3}), [{day: 1, session: 2}, {day: 2, session: 1}, null]);
});
