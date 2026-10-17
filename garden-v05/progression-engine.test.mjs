import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  DB,
  CROP,
  CREATURE,
  ProgressionError,
  newGame,
  nowFor,
  housingCapacity,
  levelInfo,
  growth,
  lineCells,
  plant,
  harvest,
  uproot,
  adopt,
  feed,
  claimAnimals,
  craft,
  claimCraft,
  build,
  claimBuildings,
  moveBuilding,
  replant,
  exchangeKeepsake,
  buyDecoration,
  advanceTime,
  restoreChecked,
  testProfile,
} from './progression-engine.mjs';

const NOW = 1_800_000_000_000;
const HOUR = 60 * 60 * 1000;
const day = (hours) => hours * HOUR;
const APPROVED = JSON.parse(readFileSync(new URL('../outputs/hagrid-levels-20261013/balance-data.json', import.meta.url), 'utf8'));

function selectFields(rows, fields) {
  return rows.map((row) => Object.fromEntries(fields.map((field) => [field, row[field]])));
}

function codeOf(fn, code) {
  assert.throws(fn, (error) => error instanceof ProgressionError && error.code === code);
}

function emptyCreatureProfile(level = 10) {
  const profile = structuredClone(testProfile(level, NOW));
  profile.creatures = [];
  return profile;
}

test('approved balance exposes all crops, creatures, levels, recipes, and Vietnamese labels', () => {
  assert.equal(DB.crops.length, 24);
  assert.equal(DB.animals.length, 12);
  assert.equal(DB.recipes.length, 29);
  assert.equal(DB.levels.length, 100);
  assert.equal(CROP.daisy.label, 'Cúc trắng');
  assert.equal(CROP.dittany.label, 'Bạch tiên');
  assert.equal(CREATURE.hippogriff.label, 'Bằng Mã');
  assert.equal(CROP.pumpkin.rarity, 'common');
  assert.equal(CROP.pumpkin.rarityLabel, 'Thường');
  assert.equal(CREATURE.dragon.rarity, 'legendary');
  assert.equal(CREATURE.dragon.rarityLabel, 'Huyền thoại');
  assert.equal(CROP.pumpkin.growMs, 2 * HOUR);
  assert.equal(CREATURE.dragon.level, 94);
  assert.equal(CREATURE.dragon.lateProgression, true);
  assert.equal(CREATURE.puffskein.level, 10);
  assert.equal(DB.decorations.length, 29);
  assert.equal(DB.decorations[0].cost, 0);
  assert.equal(DB.decorations.at(-1).cost, 3);
});

test('line helper returns exactly the eight legal three-cell lines', () => {
  assert.deepEqual(lineCells('horizontal', 0), [0, 1, 2]);
  assert.deepEqual(lineCells('horizontal', 2), [6, 7, 8]);
  assert.deepEqual(lineCells('vertical', 1), [1, 4, 7]);
  assert.deepEqual(lineCells('diagonal', 0), [0, 4, 8]);
  assert.deepEqual(lineCells('diagonal', 1), [2, 4, 6]);
  codeOf(() => lineCells('diagonal', 2), 'INVALID_INDEX');
  codeOf(() => lineCells('row', 0), 'INVALID_LINE');
});

test('plant is immutable, awards per-cell plant XP, and rejects partial or occupied lines atomically', () => {
  const initial = newGame(NOW);
  const first = plant(initial, 0, lineCells('horizontal', 0), 'pumpkin', NOW);
  assert.equal(initial.plots[0].slots.filter(Boolean).length, 0);
  assert.equal(first.plots[0].slots.filter(Boolean).length, 3);
  assert.equal(first.xp, CROP.pumpkin.plantXP * 3);
  const before = JSON.stringify(first);
  codeOf(() => plant(first, 0, [0, 1], 'pumpkin', NOW), 'INVALID_SELECTION');
  assert.equal(JSON.stringify(first), before);
  codeOf(() => plant(first, 0, lineCells('vertical', 0), 'pumpkin', NOW), 'OCCUPIED_SLOT');
  assert.equal(JSON.stringify(first), before);
  assert.equal(first.lastEvents.every((event) => typeof event === 'string'), true);
});

test('level and housing helpers expose derived UI state without mutating the save', () => {
  const state = testProfile(22, NOW);
  const info = levelInfo(state);
  assert.equal(housingCapacity(state), 4);
  assert.equal(info.level, 22);
  assert.equal(info.xp, DB.levels[21].totalXP);
  assert.equal(info.xpInLevel, 0);
  assert.equal(info.xpToNext, DB.levels[21].xpToNext);
  assert.equal(info.beds, 4);
  assert.equal(info.plots, state.plots.length);
  assert.equal(JSON.stringify(state).includes('"lastEvents":["'), true);
});

test('plot type cap is enforced against a crafted valid three-species save', () => {
  const crafted = testProfile(100, NOW);
  crafted.plots[0].slots = [
    { id: 'a', type: 'crop', species: 'pumpkin', plantedAt: NOW, growMs: CROP.pumpkin.growMs },
    null,
    null,
    { id: 'b', type: 'crop', species: 'daisy', plantedAt: NOW, growMs: CROP.daisy.growMs },
    null,
    null,
    { id: 'c', type: 'crop', species: 'strawberry', plantedAt: NOW, growMs: CROP.strawberry.growMs },
    null,
    null,
  ];
  crafted.plots[0].patterns = [];
  crafted.plots[0].cooldowns = Array(9).fill(0);
  const before = JSON.stringify(crafted);
  codeOf(() => plant(crafted, 0, lineCells('vertical', 1), 'mandrake', NOW), 'TYPE_CAP');
  assert.equal(JSON.stringify(crafted), before);
});

test('crop lifecycle honors exact 0, .25, .65, and 1 boundaries', () => {
  let state = newGame(NOW);
  state = plant(state, 0, lineCells('horizontal', 0), 'pumpkin', NOW);
  const entry = state.plots[0].slots[0];
  const logicalStart = nowFor(state, NOW);
  assert.equal(growth(entry, logicalStart).stage, 0);
  assert.equal(growth(entry, logicalStart + CROP.pumpkin.growMs * 0.25).stage, 1);
  assert.equal(growth(entry, logicalStart + CROP.pumpkin.growMs * 0.65).stage, 2);
  assert.equal(growth(entry, logicalStart + CROP.pumpkin.growMs).stage, 3);
  assert.equal(growth(entry, logicalStart + CROP.pumpkin.growMs).mature, true);
});

test('advanceTime keeps existing age but new plants and adoptions start at stage zero after reload', () => {
  let state = newGame(NOW);
  state = advanceTime(state, day(1));
  state = plant(state, 0, lineCells('horizontal', 0), 'pumpkin', NOW);
  const plantLogical = nowFor(state, NOW);
  assert.equal(growth(state.plots[0].slots[0], plantLogical).stage, 0);
  const restoredPlant = restoreChecked(JSON.stringify(state), NOW);
  assert.equal(growth(restoredPlant.plots[0].slots[0], nowFor(restoredPlant, NOW)).stage, 0);

  let animalState = emptyCreatureProfile(10);
  animalState = advanceTime(animalState, day(1));
  animalState.inventory.puff_feed = 10;
  animalState = adopt(animalState, 'puffskein', NOW);
  assert.equal(animalState.creatures[0].meal, null);
  assert.equal(growth(animalState.creatures[0], nowFor(animalState, NOW)).stage, 0);
  const restoredAnimal = restoreChecked(JSON.stringify(animalState), NOW);
  assert.equal(growth(restoredAnimal.creatures[0], nowFor(restoredAnimal, NOW)).stage, 0);
  const afterElapsed = advanceTime(restoredAnimal, day(0.25));
  assert.equal(growth(afterElapsed.creatures[0], nowFor(afterElapsed, NOW)).stage, 0);
});

test('harvest requires every explicit target to be mature and all-target harvest is atomic', () => {
  let state = newGame(NOW);
  state = plant(state, 0, lineCells('horizontal', 0), 'pumpkin', NOW);
  const before = JSON.stringify(state);
  codeOf(() => harvest(state, 0, [0, 1, 2], NOW), 'IMMATURE');
  assert.equal(JSON.stringify(state), before);
  state = advanceTime(state, CROP.pumpkin.growMs);
  const harvested = harvest(state, 0, null, NOW);
  assert.equal(harvested.inventory.pumpkin, 3);
  assert.equal(harvested.plots[0].slots.every((entry) => entry === null), true);
  assert.equal(harvested.xp, CROP.pumpkin.plantXP * 3 + CROP.pumpkin.harvestXP * 3);
});

test('uproot preserves a per-cell readyAt cooldown and replant skips blocked templates', () => {
  let state = newGame(NOW);
  state = plant(state, 0, lineCells('horizontal', 0), 'pumpkin', NOW);
  state = uproot(state, 0, [0, 1, 2], NOW);
  codeOf(() => plant(state, 0, lineCells('horizontal', 0), 'pumpkin', NOW), 'COOLDOWN');
  const blocked = replant(state, 0, NOW);
  assert.equal(blocked.plots[0].slots.every((entry) => entry === null), true);
  state = advanceTime(state, CROP.pumpkin.growMs);
  const replanted = replant(state, 0, NOW);
  assert.equal(replanted.plots[0].slots.filter(Boolean).length, 3);
});

test('adoption is gated by level and housing, then manual feeding starts the first meal', () => {
  const fresh = newGame(NOW);
  codeOf(() => adopt(fresh, 'puffskein', NOW), 'LOCKED_CREATURE');
  let state = emptyCreatureProfile(10);
  state.built = state.built.filter((id) => id !== 'pen_1');
  state.creatures = [];
  codeOf(() => adopt(state, 'puffskein', NOW), 'HOUSING_FULL');
  state = build(state, 'pen_1', NOW);
  const beforeXp = state.xp;
  state = adopt(state, 'puffskein', NOW);
  assert.equal(state.xp, beforeXp);
  assert.equal(state.creatures[0].meal, null);
  assert.equal(state.inventory.puff_feed, 1003);
  state = feed(state, 'puffskein', NOW);
  assert.equal(state.creatures[0].meal !== null, true);
  assert.equal(state.inventory.puff_feed, 1002);
  assert.equal(state.xp, beforeXp + CREATURE.puffskein.feedXP);
  codeOf(() => adopt(state, 'puffskein', NOW), 'ALREADY_ADOPTED');
  codeOf(() => adopt(state, 'dragon', NOW), 'LOCKED_CREATURE');

  let bow = emptyCreatureProfile(18);
  bow.inventory.bow_feed = 4;
  bow = adopt(bow, 'bowtruckle', NOW);
  assert.equal(bow.inventory.bow_feed, 1);
  assert.equal(bow.creatures[0].meal, null);
  bow = feed(bow, 'bowtruckle', NOW);
  assert.equal(bow.inventory.bow_feed, 0);
});

test('juvenile milestones and adult cycles grant XP exactly once at claim boundaries', () => {
  let state = emptyCreatureProfile(10);
  state.built = state.built.filter((id) => id !== 'pen_1');
  state = build(state, 'pen_1', NOW);
  state.inventory.puff_feed = 100;
  const startXp = state.xp;
  state = adopt(state, 'puffskein', NOW);
  assert.equal(state.xp, startXp);
  state = feed(state, 'puffskein', NOW);
  assert.equal(state.xp, startXp + CREATURE.puffskein.feedXP);
  for (let meal = 1; meal <= 6; meal += 1) {
    state = advanceTime(state, 6 * HOUR);
    state = claimAnimals(state, 'puffskein', NOW);
    if (meal < 6) state = feed(state, 'puffskein', NOW);
  }
  const config = CREATURE.puffskein;
  assert.equal(state.creatures[0].mealsCompleted, config.mealsToAdult);
  assert.equal(growth(state.creatures[0], nowFor(state, NOW)).stage, 3);
  assert.equal(state.xp - startXp, config.feedXP * config.mealsToAdult + config.stageXP.reduce((sum, value) => sum + value, 0));
  codeOf(() => claimAnimals(state, 'puffskein', NOW), 'NOT_READY');
  state = feed(state, 'puffskein', NOW);
  state = advanceTime(state, 6 * HOUR);
  state = claimAnimals(state, 'puffskein', NOW);
  assert.equal(state.inventory.produce_puffskein, 1);
  assert.equal(state.xp - startXp, config.feedXP * (config.mealsToAdult + 1) + config.stageXP.reduce((sum, value) => sum + value, 0) + config.adultClaimXP);
  codeOf(() => claimAnimals(state, 'puffskein', NOW), 'NOT_READY');
});

test('crafting uses one timed job per station and claims only after ready', () => {
  let state = testProfile(21, NOW);
  state.inventory.oats = 100;
  state.inventory.lettuce = 100;
  state.inventory.daisy = 100;
  state.inventory.insects = 0;
  state.inventory.bow_feed = 0;
  const startXp = state.xp;
  codeOf(() => craft(state, 'insects', 2, NOW), 'TIMED_BATCH_LIMIT');
  assert.equal(state.jobs.length, 0);
  state = craft(state, 'insects', 1, NOW);
  assert.equal(state.jobs.length, 1);
  assert.equal(state.xp, startXp);
  const malformedJob = structuredClone(state);
  malformedJob.jobs[0].batches = 2;
  codeOf(() => restoreChecked(malformedJob, NOW), 'INVALID_STATE');
  codeOf(() => craft(state, 'insects_alt', 1, NOW), 'STATION_BUSY');
  codeOf(() => claimCraft(state, NOW), 'NOT_READY');
  state = advanceTime(state, 6 * HOUR);
  state = claimCraft(state, NOW);
  assert.equal(state.inventory.insects, 12);
  state = craft(state, 'bow_feed', 1, NOW);
  assert.equal(state.inventory.bow_feed, 6);
  state = craft(state, 'bow_feed', 2, NOW);
  assert.equal(state.inventory.bow_feed, 18);
  assert.equal(state.xp, startXp);
});

test('building is explicit, sequential, timed, and materializes capacity only on claim', () => {
  let state = testProfile(12, NOW);
  state.built = state.built.filter((id) => id !== 'plot_4');
  state.plots = state.plots.slice(0, 3);
  const startXp = state.xp;
  state = build(state, 'plot_4', NOW);
  assert.equal(state.plots.length, 3);
  assert.equal(state.construction.length, 1);
  assert.equal(state.xp, startXp);
  codeOf(() => build(state, 'plot_5', NOW), 'LOCKED_EXPANSION');
  state = advanceTime(state, HOUR);
  state = claimBuildings(state, NOW);
  assert.equal(state.plots.length, 4);
  assert.equal(state.built.includes('plot_4'), true);
  codeOf(() => claimBuildings(state, NOW), 'NOT_READY');
});

test('layout defaults to identity for new and legacy saves, then rejects malformed permutations', () => {
  const identityPlots = Array.from({ length: 12 }, (_, index) => index);
  const identityPens = Array.from({ length: 6 }, (_, index) => index);
  const fresh = newGame(NOW);
  assert.deepEqual(fresh.layout, { plots: identityPlots, pens: identityPens });

  const legacy = structuredClone(fresh);
  delete legacy.layout;
  const restoredLegacy = restoreChecked(legacy, NOW);
  assert.deepEqual(restoredLegacy.layout, { plots: identityPlots, pens: identityPens });

  const duplicate = structuredClone(fresh);
  duplicate.layout.plots[1] = 0;
  codeOf(() => restoreChecked(duplicate, NOW), 'INVALID_STATE');
  const outOfRange = structuredClone(fresh);
  outOfRange.layout.pens[0] = 6;
  codeOf(() => restoreChecked(outOfRange, NOW), 'INVALID_STATE');
  const missingPens = structuredClone(fresh);
  delete missingPens.layout.pens;
  codeOf(() => restoreChecked(missingPens, NOW), 'INVALID_STATE');
  const wrongLength = structuredClone(fresh);
  wrongLength.layout.plots = wrongLength.layout.plots.slice(0, 11);
  codeOf(() => restoreChecked(wrongLength, NOW), 'INVALID_STATE');
});

test('moveBuilding swaps built logical buildings with built or unbuilt slots without changing gameplay data', () => {
  let state = testProfile(100, NOW);
  state = plant(state, 0, lineCells('horizontal', 0), 'pumpkin', NOW);
  state = uproot(state, 0, [0], NOW);
  state = adopt(state, 'puffskein', NOW);
  state = feed(state, 'puffskein', NOW);
  state = craft(state, 'insects', 1, NOW);
  state = build(state, 'plot_12', NOW);
  const before = structuredClone(state);

  const moved = moveBuilding(state, 'plot', 0, 11);
  assert.deepEqual(moved.layout.plots, [11, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 0]);
  assert.deepEqual(moved.layout.pens, before.layout.pens);
  assert.deepEqual(state, before);
  for (const key of ['schemaVersion', 'balanceVersion', 'createdAt', 'xp', 'level', 'offsetMs', 'plots', 'creatures', 'inventory', 'jobs', 'construction', 'built', 'keepsakes', 'decorations', 'developerProfile', 'snapshotDeveloperFlag']) {
    assert.deepEqual(moved[key], before[key], `${key} survives a layout move`);
  }
  assert.equal(moved.revision, before.revision + 1);
  assert.equal(moved.lastEvents.at(-1).startsWith('moveBuilding:'), true);
  assert.equal(moved.built.includes('plot_12'), false, 'the target slot may be an unbuilt placeholder');
  assert.equal(before.plots[0].cooldowns[0] > 0, true, 'fixture includes a non-zero crop cooldown');
  assert.equal(moved.plots[0].slots[1].id, before.plots[0].slots[1].id);
  assert.equal(moved.creatures[0].meal.id, before.creatures[0].meal.id);
  assert.equal(moved.jobs[0].id, before.jobs[0].id);
  assert.equal(moved.construction[0].id, before.construction[0].id);

  const movedPen = moveBuilding(moved, 'pen', 0, 5);
  assert.deepEqual(movedPen.layout.pens, [5, 1, 2, 3, 4, 0]);
  assert.deepEqual(movedPen.layout.plots, moved.layout.plots);
  assert.equal(movedPen.xp, moved.xp);
  assert.equal(movedPen.revision, moved.revision + 1);

  const restored = restoreChecked(JSON.stringify(movedPen), NOW);
  assert.deepEqual(restored.layout, movedPen.layout);
  assert.deepEqual(restored.plots, movedPen.plots);
  assert.deepEqual(restored.creatures, movedPen.creatures);
  assert.deepEqual(restored.jobs, movedPen.jobs);
  assert.deepEqual(restored.construction, movedPen.construction);
  assert.deepEqual(restored.inventory, movedPen.inventory);
  assert.deepEqual(restored.built, movedPen.built);

  const allSlots = (length) => Array.from({ length }, (_, index) => index);
  assert.deepEqual([...restored.layout.plots].sort((a, b) => a - b), allSlots(12));
  assert.deepEqual([...restored.layout.pens].sort((a, b) => a - b), allSlots(6));
  codeOf(() => moveBuilding(restored, 'plot', 11, 0), 'NOT_BUILT');
  codeOf(() => moveBuilding(restored, 'garden', 0, 0), 'INVALID_KIND');
  codeOf(() => moveBuilding(restored, 'plot', 0, 12), 'INVALID_INDEX');
});

test('keepsakes and decorations consume only their stated resources and never XP', () => {
  let state = testProfile(100, NOW);
  const startXp = state.xp;
  state.inventory.produce_puffskein = 5;
  state = exchangeKeepsake(state, 'puffskein');
  assert.equal(state.keepsakes.puffskein, 1);
  assert.equal(state.inventory.produce_puffskein, 0);
  assert.equal(state.xp, startXp);

  let decor = testProfile(23, NOW);
  const decorXp = decor.xp;
  for (const level of [3, 7, 11, 15, 19, 23]) decor = buyDecoration(decor, level);
  assert.equal(decor.decorations.length, 6);
  assert.equal(decor.xp, decorXp);
  assert.equal(decor.inventory.kit, 997);
  codeOf(() => buyDecoration(decor, 23), 'ALREADY_OWNED');
});

test('restoreChecked preserves logical ages and fails closed on malformed IDs, stock, and timestamps', () => {
  let state = newGame(NOW);
  state = plant(state, 0, lineCells('horizontal', 0), 'pumpkin', NOW);
  state = advanceTime(state, HOUR);
  const restored = restoreChecked(JSON.stringify(state), NOW);
  assert.deepEqual(restored.plots[0].slots[0], state.plots[0].slots[0]);
  assert.equal(growth(restored.plots[0].slots[0], nowFor(restored, NOW)).normalized, 0.5);
  codeOf(() => restoreChecked({ ...state, xp: -1 }, NOW), 'INVALID_NUMBER');
  codeOf(() => restoreChecked({ ...state, inventory: { ...state.inventory, nope: 1 } }, NOW), 'UNKNOWN_INVENTORY_ID');
  codeOf(() => restoreChecked({ ...state, plots: [] }, NOW), 'INVALID_STATE');
  codeOf(() => restoreChecked('{bad json', NOW), 'INVALID_SAVE');
  codeOf(() => restoreChecked(state, Number.NaN), 'INVALID_TIMESTAMP');
  codeOf(() => newGame(Number.POSITIVE_INFINITY), 'INVALID_TIMESTAMP');
});

test('testProfile covers every approved level and seeds only actual built capacity', () => {
  for (let level = 1; level <= 100; level += 1) {
    const state = testProfile(level, NOW);
    assert.equal(state.level, level);
    assert.equal(state.xp, DB.levels[level - 1].totalXP);
    assert.equal(state.plots.length, 3 + state.built.filter((id) => id.startsWith('plot_') && !id.match(/^plot_[123]$/)).length);
    assert.equal(state.creatures.length <= state.built.filter((id) => id.startsWith('pen_')).length * 2, true);
  }
  const end = testProfile(100, NOW);
  assert.equal(end.plots.length, 11);
  assert.equal(end.built.includes('plot_12'), false);
  assert.equal(end.creatures.length, 0);
  assert.equal(housingCapacity(end), 12);
});

test('every approved crop completes all lifecycle boundaries and harvests', () => {
  let state = testProfile(100, NOW);
  const line = lineCells('horizontal', 0);
  let expectedXp = state.xp;

  for (const crop of Object.values(CROP)) {
    const beforeInventory = state.inventory[crop.id];
    state = plant(state, 0, line, crop.id, NOW);
    const logicalStart = nowFor(state, NOW);
    const entry = state.plots[0].slots[0];
    assert.equal(growth(entry, logicalStart).stage, 0, `${crop.id} starts at stage 0`);
    state = advanceTime(state, crop.growMs * 0.25);
    assert.equal(growth(state.plots[0].slots[0], nowFor(state, NOW)).stage, 1, `${crop.id} reaches stage 1`);
    state = advanceTime(state, crop.growMs * 0.4);
    assert.equal(growth(state.plots[0].slots[0], nowFor(state, NOW)).stage, 2, `${crop.id} reaches stage 2`);
    state = advanceTime(state, crop.growMs * 0.35);
    assert.equal(growth(state.plots[0].slots[0], nowFor(state, NOW)).mature, true, `${crop.id} matures`);
    state = harvest(state, 0, line, NOW);
    assert.equal(state.plots[0].slots.every((slot) => slot === null), true, `${crop.id} clears its line`);
    assert.equal(state.inventory[crop.id], beforeInventory + 3, `${crop.id} harvest yield`);
    expectedXp += (crop.plantXP + crop.harvestXP) * 3;
  }

  assert.equal(state.xp, expectedXp);
});

test('every approved creature reaches all juvenile milestones and claims repeated adult cycles', () => {
  let state = testProfile(100, NOW);

  for (const creature of Object.values(CREATURE)) {
    const beforeAdoptionXp = state.xp;
    state = adopt(state, creature.id, NOW);
    const entry = state.creatures.find((candidate) => candidate.species === creature.id);
    assert.equal(state.xp, beforeAdoptionXp, `${creature.id} adoption has no XP`);
    assert.equal(entry.meal, null, `${creature.id} adoption waits for manual feeding`);

    for (let meal = 1; meal <= creature.mealsToAdult; meal += 1) {
      const beforeFeedXp = state.xp;
      state = feed(state, creature.id, NOW);
      assert.equal(state.xp - beforeFeedXp, creature.feedXP, `${creature.id} feed XP`);
      state = advanceTime(state, creature.growMs);
      const beforeClaimXp = state.xp;
      state = claimAnimals(state, creature.id, NOW);
      const milestone = creature.stageMeals.indexOf(meal);
      const expectedClaimXp = milestone < 0 ? 0 : creature.stageXP[milestone];
      assert.equal(state.xp - beforeClaimXp, expectedClaimXp, `${creature.id} meal ${meal} milestone XP`);
      const claimed = state.creatures.find((candidate) => candidate.species === creature.id);
      const expectedStage = creature.stageMeals.reduce((stage, threshold, index) => (
        meal >= threshold ? index + 1 : stage
      ), 0);
      assert.equal(growth(claimed, nowFor(state, NOW)).stage, expectedStage, `${creature.id} meal ${meal} stage`);
    }

    const produceKey = `produce_${creature.id}`;
    const beforeProduce = state.inventory[produceKey];
    for (let cycle = 1; cycle <= 2; cycle += 1) {
      const beforeFeedXp = state.xp;
      state = feed(state, creature.id, NOW);
      assert.equal(state.xp - beforeFeedXp, creature.feedXP, `${creature.id} adult feed XP`);
      state = advanceTime(state, creature.growMs);
      const beforeClaimXp = state.xp;
      state = claimAnimals(state, creature.id, NOW);
      assert.equal(state.xp - beforeClaimXp, creature.adultClaimXP, `${creature.id} adult claim XP`);
      assert.equal(state.inventory[produceKey], beforeProduce + cycle * creature.producePerCycle, `${creature.id} produce`);
      assert.equal(state.creatures.find((candidate) => candidate.species === creature.id).cyclesClaimed, cycle);
    }
  }

  assert.equal(state.creatures.length, Object.keys(CREATURE).length);
  assert.equal(state.creatures.every((entry) => growth(entry, nowFor(state, NOW)).mature), true);
});

test('every approved expansion builds sequentially from a normal level-100 progression state', () => {
  let state = testProfile(100, NOW);
  const startXp = state.xp;
  state.built = ['plot_1', 'plot_2', 'plot_3'];
  state.plots = state.plots.slice(0, 3);
  state.construction = [];
  state.inventory.kit = 1000;

  for (const expansion of DB.expansions) {
    state = build(state, expansion.id, NOW);
    if (expansion.hours > 0) {
      assert.equal(state.built.includes(expansion.id), false, `${expansion.id} waits for claim`);
      state = advanceTime(state, expansion.hours * HOUR);
      state = claimBuildings(state, NOW);
    } else {
      assert.equal(state.built.includes(expansion.id), true, `${expansion.id} is immediate`);
    }
  }

  assert.equal(state.built.length, 3 + DB.expansions.length);
  assert.equal(state.plots.length, 12);
  assert.equal(housingCapacity(state), 12);
  assert.equal(state.construction.length, 0);
  assert.equal(state.xp, startXp);
});

test('engine core remains in parity with the approved 1-100 balance source', () => {
  const cropFields = ['id', 'label', 'level', 'hours', 'rarity', 'art', 'use', 'yieldPerCell', 'plantXP', 'harvestXP', 'totalXP'];
  const animalFields = ['id', 'label', 'level', 'rarity', 'hours', 'mealsToAdult', 'mealPortions', 'feed', 'feedXP', 'adultClaimXP', 'cycleXP', 'stageMeals', 'stageXP', 'minAdultDays', 'produce', 'producePerCycle', 'art'];
  const expansionFields = ['id', 'level', 'kitCost', 'hours', 'capacityAfter'];
  assert.deepEqual(selectFields(DB.crops, cropFields), selectFields(APPROVED.crops, cropFields));
  assert.deepEqual(selectFields(DB.animals, animalFields), selectFields(APPROVED.animals, animalFields));
  assert.deepEqual(DB.recipes, APPROVED.recipes);
  assert.deepEqual(selectFields(DB.expansions, expansionFields), selectFields(APPROVED.expansions, expansionFields));
  assert.deepEqual(
    selectFields(DB.levels, ['level', 'xpToNext', 'totalXP', 'plots', 'beds', 'unlock']),
    selectFields(APPROVED.levels, ['level', 'xpToNext', 'totalXP', 'plots', 'beds', 'unlock']),
  );
  assert.equal(DB.levels.at(-1).totalXP, 4_450_020);
});
