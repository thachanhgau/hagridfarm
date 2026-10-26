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
  levelLabel,
  MAX_LEVEL,
} from './progression-engine.mjs';

const NOW = 1_800_000_000_000;
const HOUR = 60 * 60 * 1000;
const day = (hours) => hours * HOUR;
// The approved source predates the Lý Lan name pass (V24.9.2); numbers must match exactly,
// names are compared after the same renames the game applied.
const LY_LAN_NAMES = [['Bằng Mã', 'Bằng-Mã'], ['Thestral', 'Vong mã'], ['Mandrake', 'Nhân sâm'], ['Bạch tiên', 'Bạch tiễn'], ['Bowtruckle', 'Que Xạo'], ['Niffler', 'Đào mỏ'], ['Sợi lông ba màu', 'Sợi lông trắng Chó ba đầu'], ['Cần mới', 'Có sprite']];
const APPROVED = levelP1(JSON.parse(
  LY_LAN_NAMES.reduce((text, [from, to]) => text.replaceAll(from, to), readFileSync(new URL('../outputs/hagrid-levels-20261013/balance-data.json', import.meta.url), 'utf8')),
));

// Level-500 roadmap P1 (docs/level-500-roadmap.md §4–6, owner 21/10/2026) on top of the approved source:
// crop times 2/4/6/14/20h → 1/2/3/6/8h with ×1,5/1,4/1,4/1,2/1 XP; 3h meals, half the meals and stage marks;
// timed crafts 3h; levels 21–99 geometric from 5.360 up to 40.000 XP.
function levelP1(source) {
  const HOURS = {2: 1, 4: 2, 6: 3, 14: 6, 20: 8}, XPM = {1: 1.5, 2: 1.4, 3: 1.4, 6: 1.2, 8: 1};
  const crops = source.crops.map((c) => {
    const hours = HOURS[c.hours], totalXP = Math.round(c.totalXP * XPM[hours]), plantXP = Math.round(totalXP * 0.1);
    return {...c, hours, totalXP, plantXP, harvestXP: totalXP - plantXP};
  });
  const animals = source.animals.map((a) => ({...a, hours: 3, mealsToAdult: Math.ceil(a.mealsToAdult / 2), stageMeals: a.stageMeals.map((m) => Math.ceil(m / 2)), minAdultDays: a.minAdultDays / 2}));
  const recipes = source.recipes.map((r) => (r.hours > 0 ? {...r, hours: 3} : r));
  const v20 = source.levels[19].xpToNext;
  let total = 0;
  const levels = source.levels.map((l) => {
    const xpToNext = l.level > 20 && l.level < 100 ? Math.round(v20 * (40000 / v20) ** ((l.level - 20) / 79)) : l.xpToNext;
    const row = {...l, xpToNext, totalXP: total};
    total += xpToNext;
    return row;
  });
  return {...source, crops, animals, recipes, levels};
}

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
  assert.equal(DB.crops.length, 32); // level-500 roadmap P3: eight bậc Tận Sức crops
  assert.equal(DB.animals.length, 12);
  assert.equal(DB.recipes.length, 27); // the two kit recipes were removed on 18/10/2026
  assert.equal(DB.levels.length, 500);
  assert.equal(CROP.daisy.label, 'Cúc trắng');
  assert.equal(CROP.dittany.label, 'Bạch tiễn');
  assert.equal(CREATURE.hippogriff.label, 'Bằng-Mã');
  assert.equal(CROP.pumpkin.rarity, 'common');
  assert.equal(CROP.pumpkin.rarityLabel, 'Thường');
  assert.equal(CREATURE.dragon.rarity, 'legendary');
  assert.equal(CREATURE.dragon.rarityLabel, 'Huyền thoại');
  assert.equal(CROP.pumpkin.growMs, HOUR); // level-500 roadmap §5: 2h → 1h
  assert.equal(CREATURE.dragon.level, 94);
  assert.equal(CREATURE.dragon.lateProgression, true);
  assert.equal(CREATURE.puffskein.level, 10);
  assert.equal(DB.decorations.length, 29);
  assert.deepEqual([DB.decorations[0].cropCost, DB.decorations[0].galleons], [{}, 0]);
  assert.deepEqual([DB.decorations.at(-1).cropCost, DB.decorations.at(-1).galleons], [{sunpetal: 6}, 160]);
  assert.equal(DB.recipes.some((r) => r.output === 'kit'), false);
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
  const config = CREATURE.puffskein;
  for (let meal = 1; meal <= config.mealsToAdult; meal += 1) {
    state = advanceTime(state, config.growMs);
    state = claimAnimals(state, 'puffskein', NOW);
    if (meal < config.mealsToAdult) state = feed(state, 'puffskein', NOW);
  }
  assert.equal(state.creatures[0].mealsCompleted, config.mealsToAdult);
  assert.equal(growth(state.creatures[0], nowFor(state, NOW)).stage, 3);
  assert.equal(state.xp - startXp, config.feedXP * config.mealsToAdult + config.stageXP.reduce((sum, value) => sum + value, 0));
  codeOf(() => claimAnimals(state, 'puffskein', NOW), 'NOT_READY');
  state = feed(state, 'puffskein', NOW);
  state = advanceTime(state, config.growMs);
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
  state = advanceTime(state, 3 * HOUR);
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
  const identityPlots = Array.from({ length: 18 }, (_, index) => index);
  const identityPens = Array.from({ length: 6 }, (_, index) => index);
  const fresh = newGame(NOW);
  assert.deepEqual(fresh.layout, { plots: identityPlots, pens: identityPens });

  const legacy = structuredClone(fresh);
  delete legacy.layout;
  const restoredLegacy = restoreChecked(legacy, NOW);
  assert.deepEqual(restoredLegacy.layout, { plots: identityPlots, pens: identityPens });
  // A save from before thửa 13–18 keeps its 12 sockets; the six new ones follow in order.
  const twelve = structuredClone(fresh);
  twelve.layout.plots = [1, 0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  for (const id of ['fluxweed', 'devilssnare']) delete twelve.inventory[id];
  const restoredTwelve = restoreChecked(twelve, NOW);
  assert.deepEqual(restoredTwelve.layout.plots, [1, 0, ...identityPlots.slice(2)]);
  assert.equal(restoredTwelve.inventory.devilssnare, 0);
  const noPumpkin = structuredClone(fresh);
  delete noPumpkin.inventory.pumpkin;
  codeOf(() => restoreChecked(noPumpkin, NOW), 'INVALID_STATE');

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
  assert.deepEqual(moved.layout.plots, [11, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 0, 12, 13, 14, 15, 16, 17]);
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
  assert.deepEqual([...restored.layout.plots].sort((a, b) => a - b), allSlots(18));
  assert.deepEqual([...restored.layout.pens].sort((a, b) => a - b), allSlots(6));
  codeOf(() => moveBuilding(restored, 'plot', 11, 0), 'NOT_BUILT');
  codeOf(() => moveBuilding(restored, 'garden', 0, 0), 'INVALID_KIND');
  codeOf(() => moveBuilding(restored, 'plot', 0, 18), 'INVALID_INDEX');
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
  assert.equal(decor.inventory.puffapod, 994); // decoration-23 costs 6 Puffapod (+ Galleons via the wallet)
  codeOf(() => buyDecoration(decor, 23), 'ALREADY_OWNED');
  codeOf(() => buyDecoration(decor, 27), 'LOCKED_DECORATION');
  decor = testProfile(27, NOW);
  decor.inventory.mandrake = 5;
  codeOf(() => buyDecoration(decor, 27), 'MISSING_RESOURCE');
});

test('restoreChecked preserves logical ages and fails closed on malformed IDs, stock, and timestamps', () => {
  let state = newGame(NOW);
  state = plant(state, 0, lineCells('horizontal', 0), 'pumpkin', NOW);
  state = advanceTime(state, HOUR / 2);
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

test('level-500 P2: levels 100–500 follow the roadmap curve and the simulator table', () => {
  // docs/level-500-roadmap.md §4: xpToNext(L) = 40.000 + 110 × (L − 99) for 100–499; 500 is the cap.
  const csv = readFileSync(new URL('../docs/level-500-sim/levels-500.csv', import.meta.url), 'utf8').trim().split('\n').slice(1)
    .map((line) => line.split(',')).map(([level, , xpToNext, totalXP]) => [Number(level), Number(xpToNext), Number(totalXP)]);
  assert.deepEqual(DB.levels.map((row) => [row.level, row.xpToNext, row.totalXP]), csv);
  assert.equal(MAX_LEVEL, 500);
  assert.equal(DB.levels[99].unlock.includes('Tận Sức'), false); // nothing above 100 shows before 100 (§12)
  assert.equal(DB.levels[100].unlock, 'Bậc Tận Sức ★1');
  assert.equal(DB.levels[499].unlock, 'Bậc Tận Sức ★400; huy hiệu Cấp 500');
  assert.deepEqual([levelLabel(37), levelLabel(100), levelLabel(101), levelLabel(500)], ['Cấp 37/100', 'Cấp 100/100', 'Cấp 100 ★1', 'Cấp 100 ★400']);
  // XP past level 100 now counts: a level-100 garden with 40.110 more XP is level 101; 500 is the ceiling.
  const top = testProfile(500, NOW);
  assert.equal(levelInfo(top).xpToNext, 0);
  const s100 = testProfile(100, NOW);
  assert.equal(restoreChecked(JSON.stringify({...s100, xp: s100.xp + 40_110, level: 101}), NOW).level, 101);
  codeOf(() => restoreChecked(JSON.stringify({...s100, level: 101}), NOW), 'INVALID_STATE');
  codeOf(() => testProfile(501, NOW), 'INVALID_LEVEL');
});

test('every approved crop completes all lifecycle boundaries and harvests', () => {
  let state = testProfile(500, NOW);
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

test('every approved expansion builds sequentially from a normal level-500 progression state', () => {
  let state = testProfile(500, NOW);
  const startXp = state.xp;
  state.built = ['plot_1', 'plot_2', 'plot_3'];
  state.plots = state.plots.slice(0, 3);
  state.construction = [];

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
  assert.equal(state.plots.length, 18);
  assert.equal(housingCapacity(state), 12);
  assert.equal(state.construction.length, 0);
  assert.equal(state.xp, startXp);
});

test('engine core remains in parity with the approved 1-100 balance source and the level-500 P1 rules', () => {
  // 18/10/2026 (docs/economy-audit.md §5) overrides only these: kit recipes removed, expansion
  // kitCost replaced by cropCost + galleons, and the texts that named kits (3 crop uses, 3 level unlocks).
  const KIT_TEXT = {crops: ['pumpkin', 'oats', 'flax'], levels: [5, 6, 45]};
  const patch = (rows, key, ids, field) => rows.map((row) => (ids.includes(row[key]) ? {...row, [field]: (field === 'use' ? DB.crops : DB.levels).find((d) => d[key] === row[key])[field]} : row));
  const cropFields = ['id', 'label', 'level', 'hours', 'rarity', 'art', 'use', 'yieldPerCell', 'plantXP', 'harvestXP', 'totalXP'];
  const animalFields = ['id', 'label', 'level', 'rarity', 'hours', 'mealsToAdult', 'mealPortions', 'feed', 'feedXP', 'adultClaimXP', 'cycleXP', 'stageMeals', 'stageXP', 'minAdultDays', 'produce', 'producePerCycle', 'art'];
  const expansionFields = ['id', 'level', 'hours', 'capacityAfter'];
  const classic = (rows) => rows.filter((row) => row.level <= 100); // level-500 roadmap P3 adds crops and plots above 100
  assert.deepEqual(selectFields(classic(DB.crops), cropFields), selectFields(patch(APPROVED.crops, 'id', KIT_TEXT.crops, 'use'), cropFields));
  assert.deepEqual(selectFields(DB.animals, animalFields), selectFields(APPROVED.animals, animalFields));
  assert.deepEqual(DB.recipes, APPROVED.recipes.filter((r) => r.output !== 'kit'));
  assert.deepEqual(selectFields(classic(DB.expansions), expansionFields), selectFields(APPROVED.expansions, expansionFields));
  assert.deepEqual(
    selectFields(DB.levels.slice(0, 99), ['level', 'xpToNext', 'totalXP', 'plots', 'beds', 'unlock']),
    selectFields(patch(APPROVED.levels, 'level', KIT_TEXT.levels, 'unlock').slice(0, 99), ['level', 'xpToNext', 'totalXP', 'plots', 'beds', 'unlock']),
  );
  assert.equal(DB.levels[99].totalXP, 1_427_360);
  assert.deepEqual([DB.levels[29].xpToNext, DB.levels[29].totalXP, DB.levels[98].xpToNext], [6913, 103_332, 40_000]);
  assert.equal(DB.balanceVersion, 'balance-2026-10-21');
});

test('expansions and decorations cost unlocked crops plus Galleons; the first four expansions are crop-only', () => {
  for (const e of DB.expansions) {
    assert.equal('kitCost' in e, false, e.id);
    assert.ok(Number.isSafeInteger(e.galleons) && e.galleons >= 0, e.id);
    for (const [id, n] of Object.entries(e.cropCost)) assert.ok(CROP[id].level <= e.level && n > 0 && n % 3 === 0, `${e.id} ${id}`);
  }
  assert.deepEqual(DB.expansions.filter((e) => e.level <= 24).map((e) => e.galleons), [0, 0, 0, 0]);
  assert.ok(DB.expansions.filter((e) => e.level <= 100).every((e) => e.galleons < 772), 'no single expansion up to level 100 costs more than a p50 day of income');
  // Level-500 roadmap §7: thửa 13–18 at 800–1.800 G, paid in bậc Tận Sức crops.
  assert.deepEqual(DB.expansions.filter((e) => e.level > 100).map((e) => [e.id, e.level, e.galleons]),
    [['plot_13', 110, 800], ['plot_14', 130, 1000], ['plot_15', 160, 1200], ['plot_16', 200, 1400], ['plot_17', 260, 1600], ['plot_18', 330, 1800]]);
  for (const d of DB.decorations) for (const id of Object.keys(d.cropCost)) assert.ok(CROP[id].level <= d.level, d.id);
  let state = testProfile(12, NOW);
  state.built = state.built.filter((id) => id !== 'plot_4');
  state.plots = state.plots.slice(0, 3);
  state.inventory.pumpkin = 9;
  state.inventory.oats = 8;
  codeOf(() => build(state, 'plot_4', NOW), 'MISSING_RESOURCE');
  state.inventory.oats = 9;
  state = build(state, 'plot_4', NOW);
  assert.equal(state.inventory.pumpkin, 0);
  assert.equal(state.inventory.oats, 0);
  assert.deepEqual(Object.keys(state.construction[0]).sort(), ['id', 'kind', 'readyAt', 'startedAt']);
});

test('a balance-2026-10-18 save moves over once: new timers, adult past the new meal count with the stage XP passed, level from the new curve', () => {
  let state = emptyCreatureProfile(30);
  state = plant(state, 0, lineCells('horizontal', 0), 'oats', NOW);
  const timed = DB.recipes.find((recipe) => recipe.hours > 0 && recipe.level <= 30);
  state = craft(state, timed.id, 1, NOW);
  const meal = (id, n) => ({ id: `meal-${id}-${n}-0`, startedAt: NOW, readyAt: NOW + 6 * HOUR, portions: 1, xpGranted: true });
  state.creatures.push(
    { id: 'creature-puffskein', type: 'creature', species: 'puffskein', level: 10, adoptedAt: NOW, mealsCompleted: 5, meal: meal('creature-puffskein', 5), cyclesClaimed: 0, preview: false },
    { id: 'creature-bowtruckle', type: 'creature', species: 'bowtruckle', level: 18, adoptedAt: NOW, mealsCompleted: 4, meal: null, cyclesClaimed: 0, preview: false },
  );
  // The same garden as it was saved under the previous balance: 6h oats, 6h meal and craft, the old XP curve.
  const old = structuredClone(state);
  old.balanceVersion = 'balance-2026-10-18';
  for (const cell of [0, 1, 2]) old.plots[0].slots[cell].growMs = 6 * HOUR;
  old.jobs[0].readyAt = old.jobs[0].startedAt + 6 * HOUR;
  old.xp = 119_770; // level 30 on the old curve
  old.level = 30;
  const moved = restoreChecked(JSON.stringify(old), NOW);
  assert.equal(moved.balanceVersion, DB.balanceVersion);
  assert.deepEqual(moved.plots[0].slots.slice(0, 3).map((e) => e.growMs), Array(3).fill(CROP.oats.growMs));
  assert.equal(moved.jobs[0].readyAt, moved.jobs[0].startedAt + 3 * HOUR);
  const [puff, bow] = moved.creatures;
  assert.deepEqual([puff.mealsCompleted, puff.meal.readyAt, bow.mealsCompleted], [3, NOW + 3 * HOUR, 4]);
  // Puffskein: old stages 2/4/6 at 5 meals → new 1/2/3, so stage 3 is newly passed. Que Xạo: 3/6/9 at 4 → 2/3/5, stage 2.
  assert.equal(moved.xp, 119_770 + CREATURE.puffskein.stageXP[2] + CREATURE.bowtruckle.stageXP[1]);
  assert.equal(moved.level, DB.levels.filter((row) => row.totalXP <= moved.xp).at(-1).level);
  assert.ok(moved.level > 30);
  // Once only: the moved save restores unchanged; an unknown balance is still refused.
  assert.deepEqual(restoreChecked(moved, NOW), moved);
  codeOf(() => restoreChecked({ ...old, balanceVersion: 'balance-2026-01-01' }, NOW), 'INVALID_STATE');
});
