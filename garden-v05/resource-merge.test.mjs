// 18/10/2026 decisions (docs/economy-audit.md §5): quest rule fixes and the four-resource merge.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from './progression-engine.mjs';
import {OWL_QUEST_POOL, DAILY_GRAND_CHEST_REWARD, pickDailyQuests, questAmounts} from './garden-quests.mjs';
import {KEEPER_ACHIEVEMENTS} from './garden-achievements.mjs';
import {HOGWARTS_EVENTS, LEGACY_MILESTONES, CREATURE_AFFINITY_LEVELS} from './garden-events.mjs';
import {HONOR_GARDENS} from './garden-tour.mjs';
import {STORE_CATALOG} from './garden-store-catalog.mjs';

const NOW = 1_800_000_000_000;
const HOUR = 3_600_000;

test('"Gặt N lần" asks for one run below level 6 and two from level 6', () => {
  const runs = OWL_QUEST_POOL.find((q) => q.id === 'q_harvest_runs');
  assert.deepEqual([runs.build({level: 5}).target, runs.build({level: 5}).title], [1, 'Gặt 1 lần']);
  assert.deepEqual([runs.build({level: 6}).target, runs.build({level: 6}).title], [2, 'Gặt 2 lần']);
  const q = pickDailyQuests('2026-10-18', {level: 3, hasCreature: false})[2];
  assert.equal(q.id, 'q_harvest_runs');
  assert.equal(q.target, 1);
});

test('feeding three creatures at once counts three meals', () => {
  let s = E.testProfile(30, NOW);
  for (const species of ['puffskein', 'bowtruckle', 'niffler']) s = E.adopt(s, species, NOW);
  const fed = E.feed(s, null, NOW);
  assert.deepEqual(questAmounts('feed', s, fed), [['feed', 3]]);
  assert.deepEqual(questAmounts('feed', fed, fed), [], 'no new meal, no count');
});

test('uproot is not a harvest; harvest counts cells and one run', () => {
  const planted = E.plant(E.newGame(NOW), 0, E.lineCells('horizontal', 0), 'pumpkin', NOW);
  assert.deepEqual(questAmounts('plant', E.newGame(NOW), planted), [['plant', 3]]);
  assert.deepEqual(questAmounts('uproot', planted, E.uproot(planted, 0, [0, 1, 2], NOW)), []);
  const ripe = E.advanceTime(planted, 2 * HOUR);
  assert.deepEqual(questAmounts('harvest', ripe, E.harvest(ripe, null, null, NOW)), [['harvest', 3], ['harvestRun', 1]]);
});

test('no reward, recipe, cost or inventory slot mentions kits any more', () => {
  const contexts = [1, 5, 6, 20, 60].flatMap((level) => [{level, hasCreature: false}, {level, hasCreature: true, feedItem: 'puff_feed'}]);
  const rewards = [
    ...contexts.flatMap((ctx) => OWL_QUEST_POOL.filter((q) => (q.minLevel ?? 1) <= ctx.level).map((q) => q.build(ctx).reward)),
    DAILY_GRAND_CHEST_REWARD,
    ...KEEPER_ACHIEVEMENTS.map((a) => a.reward),
    ...HOGWARTS_EVENTS.flatMap((e) => e.milestones.map((m) => m.reward)),
    ...Object.values(LEGACY_MILESTONES).map((m) => m.reward),
    ...CREATURE_AFFINITY_LEVELS.map((l) => l.reward).filter(Boolean),
    ...HONOR_GARDENS.map((g) => g.reward).filter(Boolean),
  ];
  assert.ok(rewards.length > 30);
  for (const r of rewards) {
    assert.ok(['water', 'boost'].includes(r.kind), JSON.stringify(r));
    assert.notEqual(r.itemId, 'kit');
    assert.doesNotMatch(r.label || '', /vật liệu|Phân bón/i);
  }
  assert.equal('kit' in E.newGame(NOW).inventory, false);
  assert.equal(STORE_CATALOG.find((i) => i.kind === 'boost').label, 'Nước phép');
});

test('kit rewards were replaced at about 4 water per kit', () => {
  const harvest = OWL_QUEST_POOL.find((q) => q.id === 'q_harvest').build({level: 20}).reward;
  assert.deepEqual([harvest.kind, harvest.amount], ['water', 8]); // was +2 kits
  const craft = OWL_QUEST_POOL.find((q) => q.id === 'q_craft').build({level: 20}).reward;
  assert.deepEqual([craft.amount, craft.itemId, craft.bonusQty], [4, 'oats', 4]);
  const day = Array.from({length: 28}, (_, d) => `2026-10-${String(d + 1).padStart(2, '0')}`).find((k) => pickDailyQuests(k, {level: 20, hasCreature: false})[2].id === 'q_craft');
  assert.equal(pickDailyQuests(day, {level: 20, hasCreature: false})[2].reward.label, '+4 Nước, +4 Yến mạch');
  const m3 = HOGWARTS_EVENTS.find((e) => e.milestones.length).milestones[2].reward;
  assert.deepEqual([m3.kind, m3.amount, m3.waterBonus], ['boost', 2, 47]); // was +35 water +3 kits
});
