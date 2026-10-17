import test from 'node:test';
import assert from 'node:assert/strict';
import {simulate, questWater, WATER_PRICE} from './sim-progression.mjs';

test('the bot levels up, opens the first pen at level 10 and pays for every planted cell', () => {
  const run = simulate({days: 8});
  const levels = run.daily.map((d) => d.level);
  assert.ok(levels.every((l, i) => i === 0 || l >= levels[i - 1]));
  assert.ok(run.final.level >= 10);
  assert.ok(run.opened.pen_1 && run.opened.pen_1.level >= 10);
  assert.ok(run.final.creatures.some((c) => c.species === 'puffskein'));
  for (const d of run.daily) assert.ok(d.galleons >= d.cells * WATER_PRICE);
});

test('the simulation is deterministic and quest water follows the V24.9.8 table', () => {
  assert.deepEqual(simulate({days: 3}).daily, simulate({days: 3}).daily);
  assert.equal(questWater(1), 6 + 6 + 5 + 12);
  assert.equal(questWater(30), 12 + 5 + 12);
});
