import test from 'node:test';
import assert from 'node:assert/strict';

import {applyGardenReward, createGardenStorage} from './garden-storage.mjs';
import {
  DAILY_GRAND_CHEST_TARGET,
  allDailyTasks,
  claimDailyGrandChest,
  claimOwlQuest,
  createDefaultOwlQuests,
  dailyCompletionSummary,
  loadOwlQuests,
  recordOwlQuestAction,
  saveOwlQuests,
  syncQuestsWithGardenState,
} from './garden-quests.mjs';
import {
  EVENT_STORAGE_KEY,
  claimAffinityGift,
  claimEventMilestone,
  recordFestivalAction,
  evaluateCreatureAffinity,
  loadEventState,
  recordCreatureAffinity,
  saveEventState,
} from './garden-events.mjs';

const DAY_1 = Date.parse('2026-10-17T09:00:00+07:00');
const DAY_2 = Date.parse('2026-10-18T09:00:00+07:00');
const DAY_3 = Date.parse('2026-10-20T09:00:00+07:00');
const DAY_1_KEY = '2026-10-17';

function makeStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    raw(key) {
      return values.has(key) ? values.get(key) : null;
    },
  };
}

function throwingWrites(storage) {
  return {
    getItem: (key) => storage.getItem(key),
    setItem() {
      throw new Error('quota exceeded');
    },
  };
}

test('garden storage commits one envelope and rolls back on a failed write', () => {
  const backend = makeStorage();
  const storage = createGardenStorage({scope: 'rollback-fixture', storage: backend});

  storage.setItem('progress', 'before');
  const persistedBefore = backend.raw(storage.storageKey);
  const realSetItem = backend.setItem;
  backend.setItem = () => {
    throw new Error('quota exceeded');
  };

  assert.throws(() => storage.transaction(() => {
    storage.setItem('progress', 'after');
    storage.setItem('newReward', 'kit');
  }), /quota exceeded/);
  assert.equal(backend.raw(storage.storageKey), persistedBefore);
  assert.equal(storage.getItem('progress'), 'before');
  assert.equal(storage.getItem('newReward'), null);

  backend.setItem = realSetItem;
});

test('garden storage scopes persistent reloads and keeps preview saves in memory', () => {
  const backend = makeStorage();
  const member = createGardenStorage({scope: 'member-a', storage: backend});
  const otherMember = createGardenStorage({scope: 'member-b', storage: backend});

  member.setItem('progress', 'persisted');
  assert.equal(otherMember.getItem('progress'), null);
  assert.equal(
    createGardenStorage({scope: 'member-a', storage: backend}).getItem('progress'),
    'persisted',
  );

  const preview = createGardenStorage({scope: 'preview', persistent: false, storage: backend});
  preview.setItem('progress', 'ephemeral');
  assert.equal(preview.getItem('progress'), 'ephemeral');
  assert.equal(
    createGardenStorage({scope: 'preview', persistent: false, storage: backend}).getItem('progress'),
    null,
  );
  assert.equal(backend.raw(preview.storageKey), null);
});

test('rewards add water, nước phép and their bonus item; a kit reward is refused', () => {
  const inventory = {mandrake: 4};
  const supplies = {water: 5, boost: 1};
  applyGardenReward(inventory, supplies, {kind: 'water', amount: 8, itemId: 'mandrake', bonusQty: 3});
  assert.deepEqual([supplies.water, inventory.mandrake], [13, 7]);
  applyGardenReward(inventory, supplies, {kind: 'boost', amount: 2, waterBonus: 27});
  assert.deepEqual(supplies, {water: 40, boost: 3});
  assert.throws(() => applyGardenReward(inventory, supplies, {kind: 'kit', amount: 2}), /kit/);
});

test('daily sync does not convert lifetime garden state into today progress', () => {
  const questState = createDefaultOwlQuests(DAY_1_KEY);
  const lifetimeState = {
    xp: 999999,
    inventory: {pumpkin: 1000},
    creatures: [{species: 'puffskein', mealsCompleted: 99}],
    decorations: [{id: 'pumpkin_lantern'}],
  };

  const synced = syncQuestsWithGardenState(questState, lifetimeState, {
    helpedGardensCount: 99,
    eventPoints: 999,
  });
  assert.equal(synced, questState);
  assert.equal(dailyCompletionSummary(synced).completedCount, 0);
  assert.ok(allDailyTasks(synced).every((quest) => quest.progress === 0));
});

test('daily rollover increments consecutive streaks, resets after a missed day, and deduplicates claims', () => {
  const storage = makeStorage();
  const initial = createDefaultOwlQuests(DAY_1_KEY);
  saveOwlQuests(initial, storage);
  recordOwlQuestAction('plant', 1, storage, DAY_1);
  assert.equal(loadOwlQuests(storage, DAY_1).quests[0].progress, 1);

  const nextDay = loadOwlQuests(storage, DAY_2);
  assert.equal(nextDay.dayKey, '2026-10-18');
  assert.equal(nextDay.streakDays, 2);
  saveOwlQuests(nextDay, storage);
  assert.equal(loadOwlQuests(storage, DAY_3).streakDays, 1);

  const claimStorage = makeStorage();
  const claimState = createDefaultOwlQuests(DAY_1_KEY);
  for (const quest of claimState.quests.slice(0, DAILY_GRAND_CHEST_TARGET)) {
    quest.progress = quest.target;
  }
  saveOwlQuests(claimState, claimStorage);

  let questCallbacks = 0;
  const firstQuest = claimOwlQuest(claimState.quests[0].id, {
    storage: claimStorage,
    nowMs: DAY_1,
    onGrantReward: () => { questCallbacks += 1; },
  });
  const duplicateQuest = claimOwlQuest(claimState.quests[0].id, {
    storage: claimStorage,
    nowMs: DAY_1,
    onGrantReward: () => { questCallbacks += 1; },
  });
  assert.equal(firstQuest.ok, true);
  assert.equal(duplicateQuest.reason, 'ALREADY_CLAIMED');
  assert.equal(questCallbacks, 1);

  let chestCallbacks = 0;
  const firstChest = claimDailyGrandChest({
    storage: claimStorage,
    nowMs: DAY_1,
    onGrantReward: () => { chestCallbacks += 1; },
  });
  const duplicateChest = claimDailyGrandChest({
    storage: claimStorage,
    nowMs: DAY_1,
    onGrantReward: () => { chestCallbacks += 1; },
  });
  assert.equal(firstChest.ok, true);
  assert.equal(duplicateChest.reason, 'ALREADY_CLAIMED');
  assert.equal(chestCallbacks, 1);
});

test('first pet preserves the meals-completed affinity baseline', () => {
  const storage = makeStorage();
  const gameState = {
    creatures: [{species: 'puffskein', mealsCompleted: 6}],
  };

  assert.equal(evaluateCreatureAffinity(gameState, storage).entries[0].xp, 90);
  const pet = recordCreatureAffinity('puffskein', 'pet', storage, gameState);
  assert.equal(pet.info.xp, 102);
  assert.equal(pet.info.level, 4);
  assert.equal(pet.pets, 1);
});

test('quest, event, chest, and affinity callbacks wait for a successful save', () => {
  const questSeed = makeStorage();
  const questState = createDefaultOwlQuests(DAY_1_KEY);
  for (const quest of questState.quests.slice(0, DAILY_GRAND_CHEST_TARGET)) {
    quest.progress = quest.target;
  }
  saveOwlQuests(questState, questSeed);
  const questStorage = throwingWrites(questSeed);
  let questCallback = 0;
  const failedQuest = claimOwlQuest(questState.quests[0].id, {
    storage: questStorage,
    nowMs: DAY_1,
    onGrantReward: () => { questCallback += 1; },
  });
  assert.equal(failedQuest.reason, 'SAVE_FAILED');
  assert.equal(questCallback, 0);

  let chestCallback = 0;
  const failedChest = claimDailyGrandChest({
    storage: questStorage,
    nowMs: DAY_1,
    onGrantReward: () => { chestCallback += 1; },
  });
  assert.equal(failedChest.reason, 'SAVE_FAILED');
  assert.equal(chestCallback, 0);

  const eventSeed = makeStorage();
  const festivalDay = Date.parse('2026-10-28T09:00:00+07:00');
  recordFestivalAction('dailyChest', 100, eventSeed, festivalDay);
  let eventCallback = 0;
  const failedEvent = claimEventMilestone('hal_m1@2026', {
    nowMs: festivalDay,
    storage: throwingWrites(eventSeed),
    onGrantReward: () => { eventCallback += 1; },
  });
  assert.equal(failedEvent.reason, 'SAVE_FAILED');
  assert.equal(eventCallback, 0);
  assert.ok(eventSeed.getItem(EVENT_STORAGE_KEY));

  const affinitySeed = makeStorage();
  let affinityCallback = 0;
  const failedAffinity = claimAffinityGift('puffskein:lv2', {
    gameState: {creatures: [{species: 'puffskein', mealsCompleted: 2}]},
    storage: throwingWrites(affinitySeed),
    onGrantReward: () => { affinityCallback += 1; },
  });
  assert.equal(failedAffinity.reason, 'SAVE_FAILED');
  assert.equal(affinityCallback, 0);
});

