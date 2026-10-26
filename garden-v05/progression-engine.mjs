/**
 * Hagrid garden progression engine for the v05 local prototype.
 *
 * Rules live in balance-data.mjs, which is generated from the approved
 * balance-data.json. State transitions are immutable: every mutator validates
 * the complete request first, then returns a new plain state. Timestamps in
 * entries are logical timestamps. `nowFor(state, wallNow)` adds the explicit
 * prototype offset; `growth` receives a logical timestamp directly. This keeps
 * existing ages through advanceTime and keeps a newly planted/adopted entry at
 * stage zero after the clock is advanced.
 * `layout` maps each logical plot or pen index to a fixed map slot. Layout
 * moves are presentation-only swaps: they never reorder logical save data or
 * award XP.
 */

import { DB, CROP, CREATURE, RECIPE, EXPANSION, MAX_LEVEL, TAN_SUC_LEVEL } from './balance-data.mjs?v=24.9.81';

export { DB, CROP, CREATURE, MAX_LEVEL, TAN_SUC_LEVEL };

/** «Cấp 37/100» below the bậc Tận Sức, «Cấp 100 ★k» above it (roadmap §12). */
export function levelLabel(level) {
  return level > TAN_SUC_LEVEL ? `Cấp ${TAN_SUC_LEVEL} ★${level - TAN_SUC_LEVEL}` : `Cấp ${level}/${TAN_SUC_LEVEL}`;
}

const MAX_TIME_MS = 8_640_000_000_000_000;
const MAX_SAFE = Number.MAX_SAFE_INTEGER;
const STAGE_THRESHOLDS = Object.freeze([0, 0.25, 0.65, 1]);
const LEGAL_LINES = Object.freeze([
  '0,1,2', '3,4,5', '6,7,8',
  '0,3,6', '1,4,7', '2,5,8',
  '0,4,8', '2,4,6',
]);
const BASE_PLOT_IDS = Object.freeze(['plot_1', 'plot_2', 'plot_3']);
const BASE_PLOT_COUNT = BASE_PLOT_IDS.length;
const PLOT_SLOTS = DB.limits.plotSlots;
const MAX_DISTINCT_CROPS = DB.limits.maxCropSpeciesPerPlot;
const MAX_CRAFT_BATCHES = DB.limits.maxCraftBatches;
const MAX_EVENTS = 64;
const PLOT_EXPANSIONS = Object.freeze(DB.expansions.filter((entry) => entry.kind === 'plot'));
const PEN_EXPANSIONS = Object.freeze(DB.expansions.filter((entry) => entry.kind === 'pen'));
const LAYOUT_COUNTS = Object.freeze({ plots: 18, pens: 6 });
// Level-500 roadmap P3: saves from before thửa 13–18 hold 12 plot sockets and none of the bậc Tận Sức crops.
const LEGACY_PLOT_SOCKETS = 12;
const LATE_CROP_IDS = new Set(DB.crops.filter((crop) => crop.level > TAN_SUC_LEVEL).map((crop) => crop.id));
const DECORATIONS = Object.freeze(Object.fromEntries(DB.decorations.map((entry) => [entry.id, entry])));
const CROP_IDS = Object.freeze(Object.keys(CROP));
const CREATURE_IDS = Object.freeze(Object.keys(CREATURE));
const RECIPE_IDS = Object.freeze(Object.keys(RECIPE));
const EXPANSION_IDS = Object.freeze(Object.keys(EXPANSION));

const inventoryIdSet = new Set(CROP_IDS);
for (const recipe of Object.values(RECIPE)) {
  inventoryIdSet.add(recipe.output);
  for (const input of Object.keys(recipe.inputs)) inventoryIdSet.add(input);
}
for (const species of CREATURE_IDS) {
  inventoryIdSet.add(CREATURE[species].feed);
  inventoryIdSet.add(`produce_${species}`);
}
const INVENTORY_IDS = Object.freeze([...inventoryIdSet]);
const INVENTORY_ID_SET = new Set(INVENTORY_IDS);
const CREATURE_ID_SET = new Set(CREATURE_IDS);
const CROP_ID_SET = new Set(CROP_IDS);
const RECIPE_ID_SET = new Set(RECIPE_IDS);
const EXPANSION_ID_SET = new Set(EXPANSION_IDS);
const DECORATION_ID_SET = new Set(Object.keys(DECORATIONS));

export const LIMITS = Object.freeze({
  plotSlots: PLOT_SLOTS,
  initialPlots: BASE_PLOT_COUNT,
  maxCropSpeciesPerPlot: MAX_DISTINCT_CROPS,
  maxCraftBatches: MAX_CRAFT_BATCHES,
  stageThresholds: STAGE_THRESHOLDS,
});

export class ProgressionError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'ProgressionError';
    this.code = code;
  }
}

function reject(code, message) {
  throw new ProgressionError(code, message);
}

function isPlainObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function cloneValue(value) {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(cloneValue);
  return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, cloneValue(child)]));
}

function assertFiniteTime(value, name = 'timestamp') {
  if (!Number.isFinite(value) || Math.abs(value) > MAX_TIME_MS) {
    reject('INVALID_TIMESTAMP', `${name} must be a finite millisecond timestamp`);
  }
  return value;
}

function assertDuration(value, name = 'duration') {
  if (!Number.isFinite(value) || value < 0 || value > MAX_TIME_MS) {
    reject('INVALID_DURATION', `${name} must be finite, non-negative, and bounded`);
  }
  return value;
}

function assertSafeInteger(value, name) {
  if (!Number.isSafeInteger(value)) reject('INVALID_NUMBER', `${name} must be a safe integer`);
  return value;
}

function assertNonNegativeInteger(value, name) {
  assertSafeInteger(value, name);
  if (value < 0) reject('INVALID_NUMBER', `${name} must be non-negative`);
  return value;
}

function assertIndex(value, name, maxExclusive) {
  assertSafeInteger(value, name);
  if (value < 0 || value >= maxExclusive) reject('INVALID_INDEX', `${name} is out of range`);
  return value;
}

function assertKnown(map, value, kind) {
  if (typeof value !== 'string' || !Object.prototype.hasOwnProperty.call(map, value)) {
    reject(`UNKNOWN_${kind.toUpperCase()}`, `Unknown ${kind}: ${String(value)}`);
  }
  return value;
}

function assertRootClock(state) {
  if (!isPlainObject(state)) reject('INVALID_STATE', 'state must be an object');
  if (!Number.isFinite(state.offsetMs) || state.offsetMs < 0 || state.offsetMs > MAX_TIME_MS) {
    reject('INVALID_STATE', 'state offsetMs must be finite and non-negative');
  }
}

/** Convert a wall-clock reading into the state logical clock. */
export function nowFor(state, wallNow) {
  assertRootClock(state);
  const wall = assertFiniteTime(wallNow, 'wallNow');
  return assertFiniteTime(wall + state.offsetMs, 'logical timestamp');
}

function logicalStart(state, wallNow) {
  return nowFor(state, wallNow);
}

function stateLogicalMarker(state) {
  return assertFiniteTime(state.createdAt + state.offsetMs, 'logical timestamp');
}

function lineKey(cells) {
  return [...cells].sort((a, b) => a - b).join(',');
}

function normalizeCells(cells, { requireLine = false, allowNull = false } = {}) {
  if (cells === null || cells === undefined) {
    if (allowNull) return null;
    reject('INVALID_SELECTION', 'selection is required');
  }
  if (!Array.isArray(cells) || cells.length === 0) reject('INVALID_SELECTION', 'selection must contain at least one slot');
  const normalized = [];
  const seen = new Set();
  for (const raw of cells) {
    const index = assertIndex(raw, 'slot index', PLOT_SLOTS);
    if (seen.has(index)) reject('INVALID_SELECTION', 'selection cannot contain duplicate slots');
    seen.add(index);
    normalized.push(index);
  }
  if (requireLine && (normalized.length !== 3 || !LEGAL_LINES.includes(lineKey(normalized)))) {
    reject('INVALID_SELECTION', 'planting requires exactly one complete horizontal, vertical, or diagonal line');
  }
  return normalized.sort((a, b) => a - b);
}

/** Return one of the eight legal three-cell planting lines. */
export function lineCells(direction, index) {
  if (!['horizontal', 'vertical', 'diagonal'].includes(direction)) {
    reject('INVALID_LINE', 'direction must be horizontal, vertical, or diagonal');
  }
  assertIndex(index, 'line index', direction === 'diagonal' ? 2 : 3);
  if (direction === 'horizontal') return Object.freeze([index * 3, index * 3 + 1, index * 3 + 2]);
  if (direction === 'vertical') return Object.freeze([index, index + 3, index + 6]);
  return Object.freeze(index === 0 ? [0, 4, 8] : [2, 4, 6]);
}

function emptyInventory() {
  return Object.fromEntries(INVENTORY_IDS.map((id) => [id, 0]));
}

function emptyKeepsakes() {
  return Object.fromEntries(CREATURE_IDS.map((species) => [species, 0]));
}

function makePlot() {
  return {
    slots: Array(PLOT_SLOTS).fill(null),
    cooldowns: Array(PLOT_SLOTS).fill(0),
    patterns: [],
  };
}

function expansionCapacity(built) {
  let capacity = 0;
  for (const entry of PEN_EXPANSIONS) {
    if (built.includes(entry.id)) capacity = entry.capacityAfter;
  }
  return capacity;
}

/** Return the number of housed creatures allowed by the claimed pen builds. */
export function housingCapacity(state) {
  const base = normalizeState(state);
  return expansionCapacity(base.built);
}

/** Return level progress and the unlock row in a UI-friendly plain object. */
export function levelInfo(state) {
  const base = normalizeState(state);
  const row = DB.levels[base.level - 1];
  return {
    level: base.level,
    xp: base.xp,
    xpInLevel: base.xp - row.totalXP,
    xpToNext: row.xpToNext,
    totalXP: row.totalXP,
    nextTotalXP: base.level < DB.levels.length ? DB.levels[base.level].totalXP : null,
    unlock: row.unlock,
    plots: base.plots.length,
    beds: expansionCapacity(base.built),
  };
}

function builtPlotCount(built) {
  return BASE_PLOT_COUNT + PLOT_EXPANSIONS.filter((entry) => built.includes(entry.id)).length;
}

function levelForXp(xp) {
  let level = 1;
  for (const row of DB.levels) {
    if (xp >= row.totalXP) level = row.level;
    else break;
  }
  return level;
}

function syncLevel(state) {
  state.level = levelForXp(state.xp);
}

function addXp(state, amount, logicalNow, source) {
  assertNonNegativeInteger(amount, 'XP');
  if (amount === 0) return;
  if (state.xp > MAX_SAFE - amount) reject('XP_OVERFLOW', 'XP exceeds safe integer range');
  state.xp += amount;
  syncLevel(state);
  pushEvent(state, 'xp', logicalNow, { amount, source, level: state.level });
}

function pushEvent(state, type, at, detail = {}) {
  // Keep the event log directly displayable by the prototype UI and safe to
  // persist as plain JSON. The timestamp is deliberately retained in the
  // message so logs can explain actions after a reload or virtual-time jump.
  const fields = Object.entries(detail)
    .map(([key, value]) => `${key}=${value && typeof value === 'object' ? JSON.stringify(value) : String(value)}`)
    .join(' ');
  const timestamp = `at=${at}`;
  state.lastEvents.push(`${type}: ${timestamp}${fields ? ` ${fields}` : ''}`);
  if (state.lastEvents.length > MAX_EVENTS) state.lastEvents.splice(0, state.lastEvents.length - MAX_EVENTS);
}

function finish(state, type, logicalNow, detail = {}) {
  state.revision += 1;
  pushEvent(state, type, logicalNow, detail);
  return state;
}

function makeInitialState(now) {
  const state = {
    schemaVersion: DB.schemaVersion,
    balanceVersion: DB.balanceVersion,
    createdAt: now,
    xp: 0,
    level: 1,
    offsetMs: 0,
    plots: Array.from({ length: BASE_PLOT_COUNT }, makePlot),
    layout: { plots: identityPermutation(LAYOUT_COUNTS.plots), pens: identityPermutation(LAYOUT_COUNTS.pens) },
    creatures: [],
    inventory: emptyInventory(),
    jobs: [],
    construction: [],
    built: [...BASE_PLOT_IDS],
    keepsakes: emptyKeepsakes(),
    decorations: [],
    lastEvents: [],
    revision: 0,
  };
  return state;
}

function identityPermutation(length) {
  return Array.from({ length }, (_, index) => index);
}

function normalizePermutation(raw, length, name) {
  if (!Array.isArray(raw) || raw.length !== length) reject('INVALID_STATE', `${name} layout must contain exactly ${length} slots`);
  const seen = new Set();
  return raw.map((value, index) => {
    if (!Number.isSafeInteger(value) || value < 0 || value >= length || seen.has(value)) {
      reject('INVALID_STATE', `${name} layout must be an exact permutation at index ${index}`);
    }
    seen.add(value);
    return value;
  });
}

function normalizeLayout(raw) {
  if (raw === undefined) {
    return { plots: identityPermutation(LAYOUT_COUNTS.plots), pens: identityPermutation(LAYOUT_COUNTS.pens) };
  }
  if (!isPlainObject(raw)) reject('INVALID_STATE', 'layout must be an object');
  const plots = Array.isArray(raw.plots) && raw.plots.length === LEGACY_PLOT_SOCKETS
    ? [...raw.plots, ...identityPermutation(LAYOUT_COUNTS.plots).slice(LEGACY_PLOT_SOCKETS)]
    : raw.plots;
  return {
    plots: normalizePermutation(plots, LAYOUT_COUNTS.plots, 'plots'),
    pens: normalizePermutation(raw.pens, LAYOUT_COUNTS.pens, 'pens'),
  };
}

function normalizeInventory(raw) {
  if (!isPlainObject(raw)) reject('INVALID_STATE', 'inventory must be an object');
  for (const id of Object.keys(raw)) {
    if (!INVENTORY_ID_SET.has(id)) reject('UNKNOWN_INVENTORY_ID', `unknown inventory id: ${id}`);
  }
  const result = emptyInventory();
  for (const id of INVENTORY_IDS) {
    if (!Object.prototype.hasOwnProperty.call(raw, id) && !LATE_CROP_IDS.has(id)) reject('INVALID_STATE', `inventory.${id} is missing`);
    const count = raw[id] ?? 0;
    assertNonNegativeInteger(count, `inventory.${id}`);
    result[id] = count;
  }
  return result;
}

function normalizeCooldowns(raw) {
  if (!Array.isArray(raw) || raw.length !== PLOT_SLOTS) reject('INVALID_STATE', 'plot cooldowns must contain nine entries');
  return raw.map((value, index) => {
    if (!Number.isFinite(value) || value < 0 || value > MAX_TIME_MS) reject('INVALID_STATE', `invalid cooldown at slot ${index}`);
    return value;
  });
}

function normalizePatterns(raw, level) {
  if (!Array.isArray(raw)) reject('INVALID_STATE', 'plot patterns must be an array');
  const seen = new Set();
  return raw.map((pattern) => {
    if (!isPlainObject(pattern)) reject('INVALID_STATE', 'plot pattern must be an object');
    const cells = normalizeCells(pattern.cells, { requireLine: true });
    const species = assertKnown(CROP, pattern.species, 'crop species');
    if (CROP[species].level > level) reject('LOCKED_CROP', `pattern crop ${species} is above current level`);
    const key = `${lineKey(cells)}:${species}`;
    if (seen.has(key)) reject('INVALID_STATE', 'duplicate plot pattern');
    seen.add(key);
    return { cells, species };
  });
}

function normalizeCropEntry(raw, seenIds, level) {
  if (!isPlainObject(raw) || raw.type !== 'crop') reject('INVALID_STATE', 'plot slots must contain crop entries or null');
  const species = assertKnown(CROP, raw.species, 'crop species');
  if (CROP[species].level > level) reject('LOCKED_CROP', `crop ${species} is above current level`);
  if (typeof raw.id !== 'string' || raw.id.length === 0 || seenIds.has(raw.id)) reject('INVALID_STATE', 'crop ids must be unique non-empty strings');
  seenIds.add(raw.id);
  const plantedAt = assertFiniteTime(raw.plantedAt, 'plantedAt');
  if (!Object.prototype.hasOwnProperty.call(raw, 'growMs')) reject('INVALID_STATE', 'crop growMs is missing');
  const growMs = raw.growMs;
  if (growMs !== CROP[species].growMs) reject('INVALID_STATE', 'crop growMs does not match balance data');
  return { id: raw.id, type: 'crop', species, plantedAt, growMs };
}

function normalizeMeal(raw, species) {
  if (raw === null) return null;
  if (!isPlainObject(raw)) reject('INVALID_STATE', 'creature meal must be an object or null');
  if (typeof raw.id !== 'string' || raw.id.length === 0) reject('INVALID_STATE', 'meal id is required');
  const startedAt = assertFiniteTime(raw.startedAt, 'meal.startedAt');
  const readyAt = assertFiniteTime(raw.readyAt, 'meal.readyAt');
  if (readyAt < startedAt || readyAt - startedAt !== CREATURE[species].growMs) reject('INVALID_STATE', 'meal timestamps do not match creature growMs');
  const portions = assertNonNegativeInteger(raw.portions, 'meal.portions');
  if (portions !== CREATURE[species].mealPortions) reject('INVALID_STATE', 'meal portions do not match creature balance');
  if (typeof raw.xpGranted !== 'boolean') reject('INVALID_STATE', 'meal.xpGranted must be boolean');
  return { id: raw.id, startedAt, readyAt, portions, xpGranted: raw.xpGranted };
}

function normalizeCreature(raw, seenIds, seenSpecies, level) {
  if (!isPlainObject(raw) || raw.type !== 'creature') reject('INVALID_STATE', 'creatures must be creature entries');
  const species = assertKnown(CREATURE, raw.species, 'creature species');
  if (seenSpecies.has(species)) reject('DUPLICATE_CREATURE', `only one ${species} may be housed`);
  seenSpecies.add(species);
  if (typeof raw.id !== 'string' || raw.id.length === 0 || seenIds.has(raw.id)) reject('INVALID_STATE', 'creature ids must be unique non-empty strings');
  seenIds.add(raw.id);
  const config = CREATURE[species];
  if (config.level > level) reject('LOCKED_CREATURE', `creature ${species} is above current level`);
  const adoptedAt = assertFiniteTime(raw.adoptedAt, 'adoptedAt');
  if (!Object.prototype.hasOwnProperty.call(raw, 'mealsCompleted')) reject('INVALID_STATE', 'mealsCompleted is missing');
  const mealsCompleted = assertNonNegativeInteger(raw.mealsCompleted, 'mealsCompleted');
  if (mealsCompleted > config.mealsToAdult) reject('INVALID_STATE', 'mealsCompleted exceeds creature lifecycle');
  if (!Object.prototype.hasOwnProperty.call(raw, 'cyclesClaimed')) reject('INVALID_STATE', 'cyclesClaimed is missing');
  const cyclesClaimed = assertNonNegativeInteger(raw.cyclesClaimed, 'cyclesClaimed');
  if (!Object.prototype.hasOwnProperty.call(raw, 'meal')) reject('INVALID_STATE', 'creature meal is missing');
  const meal = normalizeMeal(raw.meal, species);
  if (raw.level !== config.level) reject('INVALID_STATE', 'creature level does not match balance data');
  if (raw.preview !== undefined && typeof raw.preview !== 'boolean') reject('INVALID_STATE', 'creature preview must be boolean');
  return {
    id: raw.id,
    type: 'creature',
    species,
    level: config.level,
    adoptedAt,
    mealsCompleted,
    meal,
    cyclesClaimed,
    preview: raw.preview === true,
  };
}

function normalizeBuilt(raw, level) {
  if (!Array.isArray(raw)) reject('INVALID_STATE', 'built must be an array');
  const built = [...raw];
  const seen = new Set();
  for (const id of built) {
    if (typeof id !== 'string' || seen.has(id)) reject('INVALID_STATE', 'built ids must be unique strings');
    if (!BASE_PLOT_IDS.includes(id) && !EXPANSION_ID_SET.has(id)) reject('UNKNOWN_EXPANSION', `unknown built id: ${id}`);
    if (EXPANSION_ID_SET.has(id)) {
      const entry = EXPANSION[id];
      if (entry.level > level) reject('INVALID_STATE', `built expansion ${id} is above current level`);
    }
    seen.add(id);
  }
  for (const id of BASE_PLOT_IDS) if (!seen.has(id)) reject('INVALID_STATE', 'the three starting plots must remain built');
  for (const collection of [PLOT_EXPANSIONS, PEN_EXPANSIONS]) {
    for (let index = 1; index < collection.length; index += 1) {
      if (seen.has(collection[index].id) && !seen.has(collection[index - 1].id)) {
        reject('INVALID_STATE', `built ${collection[index].id} is missing its prerequisite`);
      }
    }
  }
  return built;
}

function normalizeConstruction(raw, built, level) {
  if (!Array.isArray(raw)) reject('INVALID_STATE', 'construction must be an array');
  const seen = new Set();
  const kinds = new Set();
  return raw.map((job) => {
    if (!isPlainObject(job)) reject('INVALID_STATE', 'construction job must be an object');
    const id = assertKnown(EXPANSION, job.id, 'expansion id');
    const entry = EXPANSION[id];
    if (built.includes(id) || seen.has(id)) reject('INVALID_STATE', `expansion ${id} is already built or queued`);
    if (entry.level > level) reject('INVALID_STATE', `construction ${id} is above current level`);
    if (kinds.has(entry.kind)) reject('STATION_BUSY', `only one ${entry.kind} construction may run at once`);
    const prior = (entry.kind === 'plot' ? PLOT_EXPANSIONS : PEN_EXPANSIONS).findIndex((candidate) => candidate.id === id);
    if (prior > 0 && !built.includes((entry.kind === 'plot' ? PLOT_EXPANSIONS : PEN_EXPANSIONS)[prior - 1].id)) {
      reject('PREREQUISITE', `construction ${id} is missing its prerequisite`);
    }
    const startedAt = assertFiniteTime(job.startedAt, 'construction.startedAt');
    const readyAt = assertFiniteTime(job.readyAt, 'construction.readyAt');
    if (readyAt < startedAt || readyAt - startedAt !== entry.hours * 60 * 60 * 1000) reject('INVALID_STATE', 'construction timing does not match balance data');
    if (job.kind !== entry.kind) reject('INVALID_STATE', 'construction kind does not match balance data');
    seen.add(id);
    kinds.add(entry.kind);
    return { id, kind: entry.kind, startedAt, readyAt };
  });
}

function normalizeJobs(raw, level) {
  if (!Array.isArray(raw)) reject('INVALID_STATE', 'jobs must be an array');
  const seen = new Set();
  const stations = new Set();
  return raw.map((job) => {
    if (!isPlainObject(job)) reject('INVALID_STATE', 'craft job must be an object');
    const id = job.id;
    if (typeof id !== 'string' || id.length === 0 || seen.has(id)) reject('INVALID_STATE', 'craft job ids must be unique');
    const recipeId = assertKnown(RECIPE, job.recipeId, 'recipe id');
    const recipe = RECIPE[recipeId];
    if (recipe.level > level) reject('LOCKED_RECIPE', `job recipe ${recipeId} is above current level`);
    if (recipe.hours <= 0) reject('INVALID_STATE', 'instant recipes cannot be queued');
    if (stations.has(recipe.station)) reject('STATION_BUSY', `only one timed job may run at ${recipe.station}`);
    if (job.station !== recipe.station || job.output !== recipe.output || job.count !== recipe.count) reject('INVALID_STATE', 'craft job does not match recipe data');
    const batches = assertSafeInteger(job.batches, 'job.batches');
    if (batches !== 1) reject('INVALID_STATE', 'timed craft jobs must contain exactly one batch');
    const startedAt = assertFiniteTime(job.startedAt, 'job.startedAt');
    const readyAt = assertFiniteTime(job.readyAt, 'job.readyAt');
    if (readyAt < startedAt || readyAt - startedAt !== recipe.hours * 60 * 60 * 1000) reject('INVALID_STATE', 'craft job timing does not match balance data');
    seen.add(id);
    stations.add(recipe.station);
    return { id, recipeId, station: recipe.station, batches, output: recipe.output, count: recipe.count, startedAt, readyAt };
  });
}

// Balance 2026-10-21 (Hagrid Farm docs/level-500-roadmap.md §12): a save from the previous balance moves over once,
// before the strict checks. Growing crops, meals and timed crafts keep their start and finish on the new, shorter
// timers; a creature past the new meal count is adult at once, with the XP of every stage it newly passed; the level
// follows the new XP curve. Anything malformed is left as it is for the checks to reject.
const PREVIOUS_BALANCE = 'balance-2026-10-18';
const PREVIOUS_STAGE_MEALS = Object.freeze({
  puffskein: [2, 4, 6], bowtruckle: [3, 6, 9], niffler: [3, 8, 12], mooncalf: [3, 8, 12], kneazle: [3, 8, 12], diricawl: [3, 8, 12],
  fwooper: [8, 20, 30], hippogriff: [8, 20, 30], thestral: [8, 20, 30], unicorn: [8, 20, 30], 'three-headed-dog': [9, 24, 36], dragon: [9, 24, 36],
});
const known = (map, id) => typeof id === 'string' && Object.prototype.hasOwnProperty.call(map, id);

function migrateBalance(raw) {
  if (raw.balanceVersion !== PREVIOUS_BALANCE) return raw;
  const next = cloneValue(raw);
  next.balanceVersion = DB.balanceVersion;
  for (const plot of Array.isArray(next.plots) ? next.plots : []) {
    for (const entry of Array.isArray(plot?.slots) ? plot.slots : []) {
      if (entry?.type === 'crop' && known(CROP, entry.species)) entry.growMs = CROP[entry.species].growMs;
    }
  }
  for (const creature of Array.isArray(next.creatures) ? next.creatures : []) {
    if (!known(CREATURE, creature?.species)) continue;
    const config = CREATURE[creature.species];
    if (isPlainObject(creature.meal) && Number.isFinite(creature.meal.startedAt)) creature.meal.readyAt = creature.meal.startedAt + config.growMs;
    const eaten = creature.mealsCompleted;
    if (!Number.isSafeInteger(eaten) || eaten < 0 || !Number.isSafeInteger(next.xp)) continue;
    creature.mealsCompleted = Math.min(eaten, config.mealsToAdult);
    config.stageMeals.forEach((meals, stage) => {
      if (meals <= creature.mealsCompleted && PREVIOUS_STAGE_MEALS[creature.species][stage] > eaten) next.xp += config.stageXP[stage];
    });
  }
  for (const job of Array.isArray(next.jobs) ? next.jobs : []) {
    if (known(RECIPE, job?.recipeId) && RECIPE[job.recipeId].hours > 0 && Number.isFinite(job.startedAt)) {
      job.readyAt = job.startedAt + RECIPE[job.recipeId].hours * 60 * 60 * 1000;
    }
  }
  if (Number.isSafeInteger(next.xp) && next.xp >= 0) next.level = levelForXp(next.xp);
  return next;
}

function normalizeState(raw) {
  if (!isPlainObject(raw)) reject('INVALID_STATE', 'state must be an object');
  raw = migrateBalance(raw);
  if (raw.schemaVersion !== DB.schemaVersion) reject('INVALID_STATE', 'unsupported schemaVersion');
  if (raw.balanceVersion !== DB.balanceVersion) reject('INVALID_STATE', 'unsupported balanceVersion');
  const createdAt = assertFiniteTime(raw.createdAt, 'createdAt');
  const xp = assertNonNegativeInteger(raw.xp, 'xp');
  const level = assertSafeInteger(raw.level, 'level');
  if (level < 1 || level > MAX_LEVEL || level !== levelForXp(xp)) reject('INVALID_STATE', 'level does not match XP');
  const offsetMs = assertDuration(raw.offsetMs, 'offsetMs');
  const revision = assertNonNegativeInteger(raw.revision, 'revision');
  const layout = normalizeLayout(raw.layout);
  const built = normalizeBuilt(raw.built, level);
  if (!Array.isArray(raw.plots) || raw.plots.length !== builtPlotCount(built)) reject('INVALID_STATE', 'plot count does not match built expansions');
  const seenIds = new Set();
  const plots = raw.plots.map((rawPlot) => {
    if (!isPlainObject(rawPlot) || !Array.isArray(rawPlot.slots) || rawPlot.slots.length !== PLOT_SLOTS) reject('INVALID_STATE', 'each plot must contain nine slots');
    const cooldowns = normalizeCooldowns(rawPlot.cooldowns);
    const patterns = normalizePatterns(rawPlot.patterns, level);
    const slots = rawPlot.slots.map((rawEntry) => (rawEntry === null ? null : normalizeCropEntry(rawEntry, seenIds, level)));
    const distinct = new Set(slots.filter(Boolean).map((entry) => entry.species));
    if (distinct.size > MAX_DISTINCT_CROPS) reject('TYPE_CAP', 'a plot can contain at most three crop species');
    return { slots, cooldowns, patterns };
  });
  const inventory = normalizeInventory(raw.inventory);
  const creaturesRaw = raw.creatures;
  if (!Array.isArray(creaturesRaw)) reject('INVALID_STATE', 'creatures must be an array');
  const seenSpecies = new Set();
    const creatures = creaturesRaw.map((entry) => normalizeCreature(entry, seenIds, seenSpecies, level));
  if (creatures.length > expansionCapacity(built)) reject('HOUSING_FULL', 'creatures exceed built housing capacity');
  if (!isPlainObject(raw.keepsakes)) reject('INVALID_STATE', 'keepsakes must be an object');
  for (const id of Object.keys(raw.keepsakes)) if (!CREATURE_ID_SET.has(id)) reject('UNKNOWN_CREATURE', `unknown keepsake species: ${id}`);
  const keepsakes = emptyKeepsakes();
  for (const species of CREATURE_IDS) {
    if (!Object.prototype.hasOwnProperty.call(raw.keepsakes, species)) reject('INVALID_STATE', `keepsakes.${species} is missing`);
    keepsakes[species] = assertNonNegativeInteger(raw.keepsakes[species], `keepsakes.${species}`);
  }
  if (!Array.isArray(raw.decorations)) reject('INVALID_STATE', 'decorations must be an array');
  const decorations = [];
  const seenDecorations = new Set();
  for (const id of raw.decorations) {
    if (typeof id !== 'string' || !DECORATION_ID_SET.has(id) || seenDecorations.has(id)) reject('INVALID_STATE', 'unknown or duplicate decoration');
    if (DECORATIONS[id].level > level) reject('LOCKED_DECORATION', `decoration ${id} is above current level`);
    seenDecorations.add(id);
    decorations.push(id);
  }
  if (!Array.isArray(raw.lastEvents) || raw.lastEvents.length > MAX_EVENTS) reject('INVALID_STATE', 'lastEvents is malformed');
  const lastEvents = raw.lastEvents.map((event) => {
    if (typeof event !== 'string' || event.length === 0) reject('INVALID_STATE', 'lastEvents entries must be non-empty strings');
    return event;
  });
  if (raw.developerProfile !== undefined && typeof raw.developerProfile !== 'boolean') reject('INVALID_STATE', 'developerProfile must be boolean');
  if (raw.snapshotDeveloperFlag !== undefined && typeof raw.snapshotDeveloperFlag !== 'boolean') reject('INVALID_STATE', 'snapshotDeveloperFlag must be boolean');
  return {
    schemaVersion: DB.schemaVersion,
    balanceVersion: DB.balanceVersion,
    createdAt,
    xp,
    level,
    offsetMs,
    plots,
    layout,
    creatures,
    inventory,
    jobs: normalizeJobs(raw.jobs, level),
    construction: normalizeConstruction(raw.construction, built, level),
    built,
    keepsakes,
    decorations,
    lastEvents,
    revision,
    ...(raw.developerProfile === undefined ? {} : { developerProfile: raw.developerProfile }),
    ...(raw.snapshotDeveloperFlag === undefined ? {} : { snapshotDeveloperFlag: raw.snapshotDeveloperFlag }),
  };
}

function cloneState(state) {
  return cloneValue(state);
}

function stateAndTime(state, wallNow) {
  const base = normalizeState(state);
  const logicalNow = nowFor(base, wallNow);
  return { base, logicalNow };
}

function requirePlot(base, plotIndex) {
  assertIndex(plotIndex, 'plotIndex', base.plots.length);
  return base.plots[plotIndex];
}

function requireCropUnlocked(base, species) {
  assertKnown(CROP, species, 'crop species');
  if (CROP[species].level > base.level) reject('LOCKED_CROP', `${species} is not unlocked at level ${base.level}`);
}

function requireCreatureUnlocked(base, species) {
  assertKnown(CREATURE, species, 'creature species');
  if (CREATURE[species].level > base.level) reject('LOCKED_CREATURE', `${species} is not unlocked at level ${base.level}`);
}

function requireRecipeUnlocked(base, recipeId) {
  assertKnown(RECIPE, recipeId, 'recipe id');
  if (RECIPE[recipeId].level > base.level) reject('LOCKED_RECIPE', `${recipeId} is not unlocked at level ${base.level}`);
}

function addInventory(state, id, amount) {
  if (!INVENTORY_ID_SET.has(id)) reject('UNKNOWN_INVENTORY_ID', `unknown inventory id: ${id}`);
  assertNonNegativeInteger(amount, 'inventory amount');
  if (state.inventory[id] > MAX_SAFE - amount) reject('INVENTORY_OVERFLOW', `inventory.${id} exceeds safe integer range`);
  state.inventory[id] += amount;
}

/** Check every crop of a build/decoration cost on `base`, then take them from `next`. */
function payCrops(base, next, cost) {
  for (const [id, count] of Object.entries(cost)) if (base.inventory[id] < count) reject('MISSING_RESOURCE', `not enough ${id}`);
  for (const [id, count] of Object.entries(cost)) consumeInventory(next, id, count);
}

function consumeInventory(state, id, amount) {
  assertNonNegativeInteger(amount, 'inventory amount');
  if (!INVENTORY_ID_SET.has(id) || state.inventory[id] < amount) reject('MISSING_RESOURCE', `not enough ${id}`);
  state.inventory[id] -= amount;
}

function nextCropId(state, plotIndex, cell) {
  return `crop-${state.revision + 1}-${plotIndex}-${cell}`;
}

function nextMealId(entry) {
  return `meal-${entry.id}-${entry.mealsCompleted}-${entry.cyclesClaimed}`;
}

function timedReady(readyAt, logicalNow) {
  return readyAt <= logicalNow;
}

/** Return a four-stage lifecycle for a crop or creature at logicalNow. */
export function growth(entry, logicalNow) {
  if (!isPlainObject(entry)) reject('INVALID_ENTRY', 'growth entry must be an object');
  const now = assertFiniteTime(logicalNow, 'logicalNow');
  if (entry.type === 'crop') {
    const species = assertKnown(CROP, entry.species, 'crop species');
    const startedAt = assertFiniteTime(entry.plantedAt, 'plantedAt');
    const growMs = CROP[species].growMs;
    const elapsedMs = Math.max(0, now - startedAt);
    const normalized = Math.min(1, elapsedMs / growMs);
    let stage = 0;
    if (normalized >= STAGE_THRESHOLDS[3]) stage = 3;
    else if (normalized >= STAGE_THRESHOLDS[2]) stage = 2;
    else if (normalized >= STAGE_THRESHOLDS[1]) stage = 1;
    return { type: 'crop', species, stage, normalized, progress: normalized, elapsedMs, growMs, mature: stage === 3 };
  }
  if (entry.type === 'creature') {
    const species = assertKnown(CREATURE, entry.species, 'creature species');
    const config = CREATURE[species];
    const mealsCompleted = Math.max(0, Math.min(config.mealsToAdult, entry.mealsCompleted ?? 0));
    const normalized = config.mealsToAdult === 0 ? 1 : mealsCompleted / config.mealsToAdult;
    let stage = 0;
    if (mealsCompleted >= config.stageMeals[2]) stage = 3;
    else if (mealsCompleted >= config.stageMeals[1]) stage = 2;
    else if (mealsCompleted >= config.stageMeals[0]) stage = 1;
    const mealReady = Boolean(entry.meal && timedReady(entry.meal.readyAt, now));
    return {
      type: 'creature', species, stage, normalized, progress: normalized,
      elapsedMs: entry.meal ? Math.max(0, now - entry.meal.startedAt) : 0,
      growMs: config.growMs, mature: stage === 3, mealsCompleted, mealsToAdult: config.mealsToAdult,
      mealReady,
    };
  }
  reject('INVALID_ENTRY', 'growth only accepts crop or creature entries');
}

/** Start a fresh three-plot state at a finite wall timestamp. */
export function newGame(now) {
  return makeInitialState(assertFiniteTime(now, 'now'));
}

/** Plant one exact legal line. All checks complete before any returned state is changed. */
export function plant(state, plotIndex, cells, species, wallNow) {
  const { base, logicalNow } = stateAndTime(state, wallNow);
  const plot = requirePlot(base, plotIndex);
  requireCropUnlocked(base, species);
  const selected = normalizeCells(cells, { requireLine: true });
  if (selected.some((index) => plot.slots[index] !== null)) reject('OCCUPIED_SLOT', 'planting cannot overwrite an occupied slot');
  if (selected.some((index) => plot.cooldowns[index] > logicalNow)) reject('COOLDOWN', 'a slot is locked until the original crop would have been ready');
  const distinct = new Set(plot.slots.filter(Boolean).map((entry) => entry.species));
  distinct.add(species);
  if (distinct.size > MAX_DISTINCT_CROPS) reject('TYPE_CAP', 'a plot can contain at most three crop species');
  const next = cloneState(base);
  const config = CROP[species];
  for (const index of selected) {
    next.plots[plotIndex].slots[index] = {
      id: nextCropId(base, plotIndex, index),
      type: 'crop', species, plantedAt: logicalNow, growMs: config.growMs,
    };
  }
  next.plots[plotIndex].patterns = next.plots[plotIndex].patterns.filter((pattern) => !pattern.cells.some((index) => selected.includes(index)));
  next.plots[plotIndex].patterns.push({ cells: [...selected], species });
  addXp(next, config.plantXP * selected.length, logicalNow, 'plant');
  return finish(next, 'plant', logicalNow, { plot: plotIndex, cells: selected, species });
}

function resolveHarvestTargets(base, plotIndex, cells, logicalNow) {
  const targets = [];
  if (plotIndex === null || plotIndex === undefined) {
    if (cells !== null && cells !== undefined) reject('INVALID_SELECTION', 'cells cannot be supplied when harvesting all plots');
    base.plots.forEach((plot, p) => plot.slots.forEach((entry, index) => {
      if (entry && growth(entry, logicalNow).mature) targets.push([p, index]);
    }));
  } else {
    const plot = requirePlot(base, plotIndex);
    if (cells === null || cells === undefined) {
      plot.slots.forEach((entry, index) => {
        if (entry && growth(entry, logicalNow).mature) targets.push([plotIndex, index]);
      });
    } else {
      const selected = normalizeCells(cells);
      for (const index of selected) {
        const entry = plot.slots[index];
        if (!entry) reject('EMPTY_SLOT', 'cannot harvest an empty slot');
        if (!growth(entry, logicalNow).mature) reject('IMMATURE', 'all selected plants must be mature before harvest');
        targets.push([plotIndex, index]);
      }
    }
  }
  if (targets.length === 0) reject('NO_MATURE_CROPS', 'there are no mature crops to harvest');
  return targets;
}

/** Harvest selected mature crops, or every mature crop when plot/cells are null. */
export function harvest(state, plotIndex = null, cells = null, wallNow) {
  const { base, logicalNow } = stateAndTime(state, wallNow);
  const targets = resolveHarvestTargets(base, plotIndex, cells, logicalNow);
  const next = cloneState(base);
  let xp = 0;
  for (const [p, index] of targets) {
    const entry = next.plots[p].slots[index];
    next.plots[p].slots[index] = null;
    next.plots[p].cooldowns[index] = Math.max(next.plots[p].cooldowns[index], entry.plantedAt + entry.growMs);
    addInventory(next, entry.species, 1);
    xp += CROP[entry.species].harvestXP;
  }
  addXp(next, xp, logicalNow, 'harvest');
  return finish(next, 'harvest', logicalNow, { count: targets.length });
}

/** Remove any selected crops without XP and preserve their original readyAt cooldown. */
export function uproot(state, plotIndex, cells, wallNow) {
  const { base, logicalNow } = stateAndTime(state, wallNow);
  const plot = requirePlot(base, plotIndex);
  const selected = normalizeCells(cells);
  for (const index of selected) if (!plot.slots[index]) reject('EMPTY_SLOT', 'cannot uproot an empty slot');
  const next = cloneState(base);
  for (const index of selected) {
    const entry = next.plots[plotIndex].slots[index];
    next.plots[plotIndex].slots[index] = null;
    next.plots[plotIndex].cooldowns[index] = Math.max(next.plots[plotIndex].cooldowns[index], entry.plantedAt + entry.growMs);
  }
  return finish(next, 'uproot', logicalNow, { plot: plotIndex, cells: selected });
}

/** Reapply saved legal line templates, skipping occupied, cooldown, locked, or cap-breaking lines. */
export function replant(state, plotIndex, wallNow) {
  const { base, logicalNow } = stateAndTime(state, wallNow);
  const plot = requirePlot(base, plotIndex);
  const next = cloneState(base);
  const planted = [];
  const distinct = new Set(plot.slots.filter(Boolean).map((entry) => entry.species));
  for (const pattern of plot.patterns) {
    const cells = normalizeCells(pattern.cells, { requireLine: true });
    if (cells.some((index) => next.plots[plotIndex].slots[index] !== null)) continue;
    if (cells.some((index) => next.plots[plotIndex].cooldowns[index] > logicalNow)) continue;
    if (CROP[pattern.species].level > next.level) continue;
    if (!distinct.has(pattern.species) && distinct.size >= MAX_DISTINCT_CROPS) continue;
    for (const index of cells) {
      next.plots[plotIndex].slots[index] = {
        id: nextCropId(base, plotIndex, index),
        type: 'crop', species: pattern.species, plantedAt: logicalNow, growMs: CROP[pattern.species].growMs,
      };
    }
    distinct.add(pattern.species);
    planted.push({ cells, species: pattern.species });
    addXp(next, CROP[pattern.species].plantXP * cells.length, logicalNow, 'plant');
  }
  if (planted.length === 0) return base;
  return finish(next, 'replant', logicalNow, { plot: plotIndex, lines: planted });
}

function startMeal(state, entry, logicalNow, grantXp = true) {
  const config = CREATURE[entry.species];
  if (entry.meal !== null) reject('MEAL_IN_PROGRESS', `${entry.species} already has a meal in progress`);
  consumeInventory(state, config.feed, config.mealPortions);
  entry.meal = {
    id: nextMealId(entry),
    startedAt: logicalNow,
    readyAt: logicalNow + config.growMs,
    portions: config.mealPortions,
    xpGranted: grantXp,
  };
  if (grantXp) addXp(state, config.feedXP, logicalNow, 'feed');
}

/** Adopt one unlocked species and charge only its separate preparation cost. */
export function adopt(state, species, wallNow) {
  const { base, logicalNow } = stateAndTime(state, wallNow);
  requireCreatureUnlocked(base, species);
  if (base.creatures.some((entry) => entry.species === species)) reject('ALREADY_ADOPTED', `${species} is already housed`);
  const capacity = expansionCapacity(base.built);
  if (base.creatures.length >= capacity) reject('HOUSING_FULL', 'build a pen before adopting another creature');
  const config = CREATURE[species];
  const starterGrant = species === 'puffskein' ? DB.limits.starterFeed : 0;
  const adoptionPrep = species === 'puffskein' ? 0 : config.mealPortions * 3;
  if (base.inventory[config.feed] < adoptionPrep) reject('MISSING_RESOURCE', `not enough ${config.feed} for adoption preparation`);
  const next = cloneState(base);
  if (starterGrant) addInventory(next, config.feed, starterGrant);
  if (adoptionPrep) consumeInventory(next, config.feed, adoptionPrep);
  const entry = {
    id: `creature-${species}`,
    type: 'creature', species, level: config.level, adoptedAt: logicalNow,
    mealsCompleted: 0, meal: null, cyclesClaimed: 0, preview: false,
  };
  next.creatures.push(entry);
  // Adoption is a zero-XP preparation action. Feeding is a separate user
  // action, which grants the feed XP immediately and starts the meal timer.
  return finish(next, 'adopt', logicalNow, { species });
}

/** Start meals for one species or all eligible creatures; null skips busy/hungry entries. */
export function feed(state, species = null, wallNow) {
  const { base, logicalNow } = stateAndTime(state, wallNow);
  if (species !== null) {
    assertKnown(CREATURE, species, 'creature species');
    const entry = base.creatures.find((candidate) => candidate.species === species);
    if (!entry) reject('NOT_ADOPTED', `${species} is not housed`);
    if (entry.meal) reject('MEAL_IN_PROGRESS', `${species} already has a meal in progress`);
    if (base.inventory[CREATURE[species].feed] < CREATURE[species].mealPortions) reject('MISSING_RESOURCE', `not enough ${CREATURE[species].feed}`);
    const next = cloneState(base);
    startMeal(next, next.creatures.find((candidate) => candidate.species === species), logicalNow);
    return finish(next, 'feed', logicalNow, { species });
  }
  const next = cloneState(base);
  const fed = [];
  for (const entry of next.creatures) {
    const config = CREATURE[entry.species];
    if (entry.meal || next.inventory[config.feed] < config.mealPortions) continue;
    startMeal(next, entry, logicalNow);
    fed.push(entry.species);
  }
  if (fed.length === 0) return base;
  return finish(next, 'feed', logicalNow, { species: fed });
}

function claimOneAnimal(state, entry, logicalNow) {
  const config = CREATURE[entry.species];
  if (!entry.meal || !timedReady(entry.meal.readyAt, logicalNow)) return false;
  const completedMeal = entry.meal;
  entry.meal = null;
  if (!completedMeal.xpGranted) addXp(state, config.feedXP, logicalNow, 'feed');
  if (entry.mealsCompleted < config.mealsToAdult) {
    entry.mealsCompleted += 1;
    const milestone = config.stageMeals.indexOf(entry.mealsCompleted);
    if (milestone >= 0) addXp(state, config.stageXP[milestone], logicalNow, 'growth');
  } else {
    addXp(state, config.adultClaimXP, logicalNow, 'adultClaim');
    addInventory(state, `produce_${entry.species}`, config.producePerCycle);
    entry.cyclesClaimed += 1;
  }
  pushEvent(state, 'animalClaim', logicalNow, { species: entry.species, mealsCompleted: entry.mealsCompleted });
  return true;
}

/** Claim only completed animal meals; does not auto-feed or grant future progress. */
export function claimAnimals(state, species = null, wallNow) {
  const { base, logicalNow } = stateAndTime(state, wallNow);
  if (species !== null) {
    assertKnown(CREATURE, species, 'creature species');
    if (!base.creatures.some((entry) => entry.species === species)) reject('NOT_ADOPTED', `${species} is not housed`);
  }
  const next = cloneState(base);
  const claimed = [];
  for (const entry of next.creatures) {
    if (species !== null && entry.species !== species) continue;
    if (claimOneAnimal(next, entry, logicalNow)) claimed.push(entry.species);
  }
  if (claimed.length === 0) reject('NOT_READY', 'no animal meal is ready to claim');
  return finish(next, 'claimAnimals', logicalNow, { species: claimed });
}

function recipeInputTotal(recipe, batches) {
  return Object.fromEntries(Object.entries(recipe.inputs).map(([id, count]) => [id, count * batches]));
}

/** Craft instant batches or queue one timed job per station. */
export function craft(state, recipeId, batches, wallNow) {
  const { base, logicalNow } = stateAndTime(state, wallNow);
  requireRecipeUnlocked(base, recipeId);
  assertSafeInteger(batches, 'batches');
  if (batches < 1 || batches > MAX_CRAFT_BATCHES) reject('INVALID_BATCHES', `batches must be between 1 and ${MAX_CRAFT_BATCHES}`);
  const recipe = RECIPE[recipeId];
  if (recipe.hours > 0 && batches !== 1) reject('TIMED_BATCH_LIMIT', 'timed recipes accept one batch per station job');
  const inputs = recipeInputTotal(recipe, batches);
  for (const [id, count] of Object.entries(inputs)) if (base.inventory[id] < count) reject('MISSING_RESOURCE', `not enough ${id}`);
  if (recipe.hours > 0 && base.jobs.some((job) => job.station === recipe.station)) reject('STATION_BUSY', `${recipe.station} already has a timed job`);
  const next = cloneState(base);
  for (const [id, count] of Object.entries(inputs)) consumeInventory(next, id, count);
  if (recipe.hours > 0) {
    next.jobs.push({
      id: `job-${base.revision + 1}-${recipeId}`,
      recipeId, station: recipe.station, batches, output: recipe.output, count: recipe.count,
      startedAt: logicalNow, readyAt: logicalNow + recipe.hours * 60 * 60 * 1000,
    });
  } else {
    addInventory(next, recipe.output, recipe.count * batches);
  }
  return finish(next, 'craft', logicalNow, { recipeId, batches, timed: recipe.hours > 0 });
}

/** Claim all completed timed craft jobs. */
export function claimCraft(state, wallNow) {
  const { base, logicalNow } = stateAndTime(state, wallNow);
  const ready = base.jobs.filter((job) => timedReady(job.readyAt, logicalNow));
  if (ready.length === 0) reject('NOT_READY', 'no craft job is ready to claim');
  const next = cloneState(base);
  next.jobs = next.jobs.filter((job) => !ready.some((candidate) => candidate.id === job.id));
  for (const job of ready) addInventory(next, job.output, job.count * job.batches);
  return finish(next, 'claimCraft', logicalNow, { jobs: ready.map((job) => job.id) });
}

function previousExpansion(entry) {
  const collection = entry.kind === 'plot' ? PLOT_EXPANSIONS : PEN_EXPANSIONS;
  const index = collection.findIndex((candidate) => candidate.id === entry.id);
  return index > 0 ? collection[index - 1] : null;
}

/** Start an unlocked expansion; capacity changes only when its building is claimed. */
export function build(state, expansionId, wallNow) {
  const { base, logicalNow } = stateAndTime(state, wallNow);
  assertKnown(EXPANSION, expansionId, 'expansion id');
  const entry = EXPANSION[expansionId];
  if (entry.level > base.level) reject('LOCKED_EXPANSION', `${expansionId} is not unlocked at level ${base.level}`);
  if (base.built.includes(expansionId)) reject('ALREADY_BUILT', `${expansionId} is already built`);
  if (base.construction.some((job) => job.id === expansionId)) reject('ALREADY_QUEUED', `${expansionId} is already under construction`);
  if (base.construction.some((job) => job.kind === entry.kind)) reject('STATION_BUSY', `only one ${entry.kind} construction may run at once`);
  const previous = previousExpansion(entry);
  if (previous && !base.built.includes(previous.id)) reject('PREREQUISITE', `${expansionId} requires ${previous.id}`);
  const next = cloneState(base);
  payCrops(base, next, entry.cropCost);
  if (entry.hours === 0) {
    next.built.push(expansionId);
    return finish(next, 'build', logicalNow, { expansionId, immediate: true });
  }
  next.construction.push({
    id: expansionId, kind: entry.kind,
    startedAt: logicalNow, readyAt: logicalNow + entry.hours * 60 * 60 * 1000,
  });
  return finish(next, 'build', logicalNow, { expansionId, immediate: false });
}

/** Claim completed buildings and materialize new plot capacity. */
export function claimBuildings(state, wallNow) {
  const { base, logicalNow } = stateAndTime(state, wallNow);
  const ready = base.construction.filter((job) => timedReady(job.readyAt, logicalNow));
  if (ready.length === 0) reject('NOT_READY', 'no building is ready to claim');
  const next = cloneState(base);
  next.construction = next.construction.filter((job) => !ready.some((candidate) => candidate.id === job.id));
  for (const job of ready) {
    next.built.push(job.id);
    const entry = EXPANSION[job.id];
    if (entry.kind === 'plot') next.plots.push(makePlot());
  }
  return finish(next, 'claimBuildings', logicalNow, { expansions: ready.map((job) => job.id) });
}

/** Swap one built logical plot or pen with the occupant of a fixed map slot. */
export function moveBuilding(state, kind, index, targetSlot) {
  const base = normalizeState(state);
  if (kind !== 'plot' && kind !== 'pen') reject('INVALID_KIND', 'kind must be plot or pen');
  const layoutKey = `${kind}s`;
  const length = LAYOUT_COUNTS[layoutKey];
  const logicalIndex = assertIndex(index, 'building index', length);
  const slot = assertIndex(targetSlot, 'target slot', length);
  const buildingId = `${kind}_${logicalIndex + 1}`;
  if (!base.built.includes(buildingId)) reject('NOT_BUILT', `${buildingId} is not built`);

  const next = cloneState(base);
  const positions = next.layout[layoutKey];
  const sourceSlot = positions[logicalIndex];
  const occupant = positions.indexOf(slot);
  positions[logicalIndex] = slot;
  positions[occupant] = sourceSlot;
  return finish(next, 'moveBuilding', stateLogicalMarker(base), { kind, index: logicalIndex, targetSlot: slot });
}

/** Exchange five adult produce items for one species keepsake. */
export function exchangeKeepsake(state, species) {
  const base = normalizeState(state);
  assertKnown(CREATURE, species, 'creature species');
  const key = `produce_${species}`;
  if (base.inventory[key] < 5) reject('MISSING_RESOURCE', `need five ${key}`);
  const next = cloneState(base);
  consumeInventory(next, key, 5);
  next.keepsakes[species] += 1;
  return finish(next, 'exchangeKeepsake', stateLogicalMarker(base), { species });
}

/** Buy one explicitly listed decoration unlock; first five are free, later ones cost crops (Galleons go through the wallet). */
export function buyDecoration(state, level) {
  const base = normalizeState(state);
  assertSafeInteger(level, 'decoration level');
  const decoration = DB.decorations.find((entry) => entry.level === level);
  if (!decoration) reject('NOT_DECORATION', `level ${level} does not name a decoration unlock`);
  if (base.level < level) reject('LOCKED_DECORATION', `decoration level ${level} is not unlocked`);
  if (base.decorations.includes(decoration.id)) reject('ALREADY_OWNED', `decoration ${decoration.id} is already owned`);
  const next = cloneState(base);
  payCrops(base, next, decoration.cropCost);
  next.decorations.push(decoration.id);
  return finish(next, 'buyDecoration', stateLogicalMarker(base), { level, id: decoration.id });
}

/** Advance only the explicit prototype clock; no crop, meal, job, or build is auto-claimed. */
export function advanceTime(state, ms) {
  const base = normalizeState(state);
  const duration = assertDuration(ms, 'ms');
  if (base.offsetMs > MAX_TIME_MS - duration) reject('INVALID_DURATION', 'virtual time exceeds supported range');
  const next = cloneState(base);
  next.offsetMs += duration;
  return finish(next, 'advanceTime', stateLogicalMarker(next), { ms: duration });
}

/** Strict save validator. Malformed data throws and is never replaced in-place. */
export function restoreChecked(raw, now) {
  assertFiniteTime(now, 'now');
  let parsed = raw;
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch {
      reject('INVALID_SAVE', 'saved data is not valid JSON');
    }
  }
  return normalizeState(parsed);
}

function unlockedAtLevel(entry, level) {
  return entry.level <= level;
}

/** Build a deterministic developer snapshot with all currently unlocked resources. */
export function testProfile(level, now) {
  const timestamp = assertFiniteTime(now, 'now');
  assertSafeInteger(level, 'level');
  if (level < 1 || level > MAX_LEVEL) reject('INVALID_LEVEL', `testProfile level must be between 1 and ${MAX_LEVEL}`);
  const state = makeInitialState(timestamp);
  state.xp = DB.levels[level - 1].totalXP;
  state.level = level;
  // The newest unlocked plot stays unbuilt so the profile can try building it (plot_12 at level 100).
  const lastPlot = PLOT_EXPANSIONS.filter((entry) => unlockedAtLevel(entry, level) && entry.level >= 100).at(-1)?.id;
  const eligibleExpansions = DB.expansions.filter((entry) => unlockedAtLevel(entry, level) && entry.id !== lastPlot);
  for (const entry of eligibleExpansions) state.built.push(entry.id);
  state.plots = Array.from({ length: builtPlotCount(state.built) }, makePlot);
  for (const id of INVENTORY_IDS) {
    const crop = CROP[id];
    const creature = CREATURE_IDS.find((species) => CREATURE[species].feed === id);
    const outputLevels = DB.recipes.filter((recipe) => recipe.output === id).map((recipe) => recipe.level);
    const unlockLevels = [
      crop?.level,
      creature ? CREATURE[creature].level : undefined,
      ...outputLevels,
    ].filter((unlock) => Number.isSafeInteger(unlock));
    state.inventory[id] = unlockLevels.some((unlock) => unlock <= level) ? 1000 : 0;
  }
  state.developerProfile = true;
  state.snapshotDeveloperFlag = true;
  pushEvent(state, 'testProfile', timestamp, { level });
  return state;
}
