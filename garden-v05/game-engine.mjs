/**
 * Small, deterministic gameplay model for the Hagrid garden prototype.
 *
 * State transitions are immutable: every mutator returns a new state and
 * leaves the supplied state untouched. `state.offsetMs` is the prototype's
 * explicit "advance time" control. New plant/creature start timestamps are
 * stored in logical time (`now + offsetMs`), while `virtualOffsetMs` mirrors
 * the state offset so `growth(entry, now)` can be used without passing the
 * whole state. `advanceTime` updates both the state offset and every existing
 * entry's mirror. `restore` rebuilds the mirror from the saved offset, so
 * elapsed growth survives a reload/offline session and new entries still
 * start at stage 0 after a time advance.
 */

const PLOT_COUNT = 3;
const SLOTS_PER_PLOT = 9;
const MAX_DISTINCT_CROP_SPECIES = 3;
const MAX_HOUSED_CREATURES = 3;
const STATE_VERSION = 1;
const MAX_TIME_MS = 8_640_000_000_000_000; // ECMAScript's finite TimeClip range.
const STAGE_THRESHOLDS = Object.freeze([0, 0.25, 0.65, 1]);
const LEGAL_PLANT_LINE_KEYS = Object.freeze([
  '0,1,2', '3,4,5', '6,7,8',
  '0,3,6', '1,4,7', '2,5,8',
  '0,4,8', '2,4,6',
]);

const RARITY_GROW_MS = Object.freeze({
  common: 2 * 60 * 1000,
  uncommon: 5 * 60 * 1000,
  rare: 15 * 60 * 1000,
  epic: 30 * 60 * 1000,
});

const RARITY_LABEL = Object.freeze({
  common: 'Thường',
  uncommon: 'Không thường',
  rare: 'Hiếm',
  epic: 'Sử thi',
  legendary: 'Huyền thoại',
});

const cropRecords = {
  pumpkin: {
    id: 'pumpkin',
    label: 'Bí ngô',
    rarity: 'common',
    rarityLabel: RARITY_LABEL.common,
    growMs: RARITY_GROW_MS.common,
  },
  strawberry: {
    id: 'strawberry',
    label: 'Dâu tây',
    rarity: 'uncommon',
    rarityLabel: RARITY_LABEL.uncommon,
    growMs: RARITY_GROW_MS.uncommon,
  },
  daisy: {
    id: 'daisy',
    label: 'Cúc trắng',
    rarity: 'common',
    rarityLabel: RARITY_LABEL.common,
    growMs: RARITY_GROW_MS.common,
  },
  dittany: {
    id: 'dittany',
    label: 'Bạch tiên',
    rarity: 'rare',
    rarityLabel: RARITY_LABEL.rare,
    growMs: RARITY_GROW_MS.rare,
  },
  puffapod: {
    id: 'puffapod',
    label: 'Puffapod',
    rarity: 'rare',
    rarityLabel: RARITY_LABEL.rare,
    growMs: RARITY_GROW_MS.rare,
  },
  mandrake: {
    id: 'mandrake',
    label: 'Mandrake',
    rarity: 'epic',
    rarityLabel: RARITY_LABEL.epic,
    growMs: RARITY_GROW_MS.epic,
  },
};

const creatureRecords = {
  puffskein: {
    id: 'puffskein',
    label: 'Puffskein',
    rarity: 'common',
    rarityLabel: RARITY_LABEL.common,
    growMs: 5 * 60 * 1000,
    lateProgression: false,
    level: null,
    regularAdoption: true,
  },
  bowtruckle: {
    id: 'bowtruckle',
    label: 'Bowtruckle',
    rarity: 'uncommon',
    rarityLabel: RARITY_LABEL.uncommon,
    growMs: 10 * 60 * 1000,
    lateProgression: false,
    level: null,
    regularAdoption: true,
  },
  niffler: {
    id: 'niffler',
    label: 'Niffler',
    rarity: 'rare',
    rarityLabel: RARITY_LABEL.rare,
    growMs: 20 * 60 * 1000,
    lateProgression: false,
    level: null,
    regularAdoption: true,
  },
  hippogriff: {
    id: 'hippogriff',
    label: 'Bằng Mã',
    rarity: 'epic',
    rarityLabel: RARITY_LABEL.epic,
    growMs: 40 * 60 * 1000,
    lateProgression: false,
    level: null,
    regularAdoption: true,
  },
  dragon: {
    id: 'dragon',
    label: 'Rồng',
    rarity: 'legendary',
    rarityLabel: RARITY_LABEL.legendary,
    growMs: 90 * 60 * 1000,
    lateProgression: true,
    level: null,
    regularAdoption: false,
  },
  'three-headed-dog': {
    id: 'three-headed-dog',
    label: 'Chó ba đầu',
    rarity: 'legendary',
    rarityLabel: RARITY_LABEL.legendary,
    growMs: 90 * 60 * 1000,
    lateProgression: true,
    level: null,
    regularAdoption: false,
  },
};

function freezeRecords(records) {
  const frozen = Object.fromEntries(
    Object.entries(records).map(([id, record]) => [id, Object.freeze({ ...record })]),
  );
  return Object.freeze(frozen);
}

/** Crop definitions. Values are frozen so a renderer cannot mutate rules. */
export const CROP = freezeRecords(cropRecords);
/** Creature definitions. Values are frozen so a renderer cannot mutate rules. */
export const CREATURE = freezeRecords(creatureRecords);

export const LIMITS = Object.freeze({
  plotCount: PLOT_COUNT,
  slotsPerPlot: SLOTS_PER_PLOT,
  maxDistinctCropSpeciesPerPlot: MAX_DISTINCT_CROP_SPECIES,
  maxHousedCreatures: MAX_HOUSED_CREATURES,
});

export const GROWTH_STAGES = Object.freeze({
  thresholds: STAGE_THRESHOLDS,
  count: STAGE_THRESHOLDS.length,
});

export const MAX_TIMESTAMP_MS = MAX_TIME_MS;

/** Error thrown for a rejected game-rule operation. */
export class GameRuleError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'GameRuleError';
    this.code = code;
  }
}

function reject(code, message) {
  throw new GameRuleError(code, message);
}

function assertFiniteTime(value, name = 'now') {
  if (!Number.isFinite(value) || Math.abs(value) > MAX_TIME_MS) {
    reject('INVALID_TIMESTAMP', `${name} must be a finite millisecond timestamp`);
  }
  return value;
}

function assertNonNegativeDuration(value, name) {
  if (!Number.isFinite(value) || value < 0 || value > MAX_TIME_MS) {
    reject('INVALID_DURATION', `${name} must be a finite non-negative duration`);
  }
  return value;
}

function logicalStartTime(now, offsetMs) {
  const logical = now + offsetMs;
  if (!Number.isFinite(logical) || Math.abs(logical) > MAX_TIME_MS) {
    reject('INVALID_TIMESTAMP', 'logical start timestamp exceeds supported range');
  }
  return logical;
}

function assertInteger(value, name) {
  if (!Number.isInteger(value)) {
    reject('INVALID_INDEX', `${name} must be an integer`);
  }
  return value;
}

function assertSpecies(config, species, kind) {
  if (typeof species !== 'string' || !Object.prototype.hasOwnProperty.call(config, species)) {
    reject('UNKNOWN_SPECIES', `Unknown ${kind} species: ${String(species)}`);
  }
  return species;
}

function assertPlotIndex(plotIndex) {
  assertInteger(plotIndex, 'plotIndex');
  if (plotIndex < 0 || plotIndex >= PLOT_COUNT) {
    reject('INVALID_PLOT', `plotIndex must be between 0 and ${PLOT_COUNT - 1}`);
  }
  return plotIndex;
}

/**
 * Return the three slot indices for a 3x3 selection line.
 *
 * `lineCells('horizontal', row)` and `lineCells('vertical', col)` use 0..2;
 * `lineCells('diagonal', diagonal)` uses 0 for top-left -> bottom-right and
 * 1 for top-right -> bottom-left.  The returned array is frozen.
 */
export function lineCells(orientation, line) {
  const kind = orientation;
  if (kind !== 'horizontal' && kind !== 'vertical' && kind !== 'diagonal') {
    reject('INVALID_LINE', 'orientation must be horizontal, vertical, or diagonal');
  }
  assertInteger(line, 'line');
  if (line < 0 || line > 2 || (kind === 'diagonal' && line > 1)) {
    reject('INVALID_LINE', `line is out of range for ${kind}`);
  }
  if (kind === 'horizontal') return Object.freeze([line * 3, line * 3 + 1, line * 3 + 2]);
  if (kind === 'vertical') return Object.freeze([line, line + 3, line + 6]);
  return Object.freeze(line === 0 ? [0, 4, 8] : [2, 4, 6]);
}

function normalizeIndices(indices) {
  if (typeof indices === 'number') indices = [indices];
  if (!Array.isArray(indices) || indices.length === 0) {
    reject('INVALID_SELECTION', 'selection must contain at least one slot index');
  }
  const result = [];
  const seen = new Set();
  for (const rawIndex of indices) {
    assertInteger(rawIndex, 'slot index');
    if (rawIndex < 0 || rawIndex >= SLOTS_PER_PLOT) {
      reject('INVALID_SELECTION', `slot index must be between 0 and ${SLOTS_PER_PLOT - 1}`);
    }
    if (seen.has(rawIndex)) reject('INVALID_SELECTION', 'selection cannot contain duplicate slots');
    seen.add(rawIndex);
    result.push(rawIndex);
  }
  return result;
}

function assertPlantLine(indices) {
  const key = [...indices].sort((a, b) => a - b).join(',');
  if (!LEGAL_PLANT_LINE_KEYS.includes(key)) {
    reject('INVALID_SELECTION', 'planting requires exactly one complete horizontal, vertical, or diagonal line');
  }
}

function makePlot(slots = Array(SLOTS_PER_PLOT).fill(null)) {
  return { slots };
}

function emptyInventory() {
  return Object.fromEntries(Object.keys(CROP).map((species) => [species, 0]));
}

function makeEmptyState(now) {
  return {
    version: STATE_VERSION,
    createdAt: now,
    offsetMs: 0,
    plots: Array.from({ length: PLOT_COUNT }, () => makePlot()),
    inventory: emptyInventory(),
    creatures: [],
  };
}

function plainCloneEntry(entry) {
  return entry == null ? null : { ...entry };
}

function cloneState(state) {
  return {
    version: state.version,
    createdAt: state.createdAt,
    offsetMs: state.offsetMs,
    plots: state.plots.map((plot) => makePlot(plot.slots.map(plainCloneEntry))),
    inventory: { ...state.inventory },
    creatures: state.creatures.map((entry) => ({ ...entry })),
  };
}

function readSlots(plot) {
  if (!plot || typeof plot !== 'object') reject('INVALID_STATE', 'plot must be an object');
  const slots = plot.slots;
  if (!Array.isArray(slots) || slots.length !== SLOTS_PER_PLOT) {
    reject('INVALID_STATE', 'each plot must contain nine slots');
  }
  return slots;
}

function assertEntryTimestamp(entry, field) {
  assertFiniteTime(entry[field], field);
  const virtualOffsetMs = entry.virtualOffsetMs ?? 0;
  assertNonNegativeDuration(virtualOffsetMs, 'virtualOffsetMs');
  return virtualOffsetMs;
}

function validateCropEntry(entry) {
  if (!entry || typeof entry !== 'object' || entry.type !== 'crop') {
    reject('INVALID_STATE', 'plot slots may contain crop entries or null');
  }
  const species = assertSpecies(CROP, entry.species, 'crop');
  const virtualOffsetMs = assertEntryTimestamp(entry, 'plantedAt');
  return {
    type: 'crop',
    species,
    plantedAt: entry.plantedAt,
    growMs: CROP[species].growMs,
    virtualOffsetMs,
  };
}

function validateCreatureEntry(entry) {
  if (!entry || typeof entry !== 'object' || entry.type !== 'creature') {
    reject('INVALID_STATE', 'creatures must be creature entries');
  }
  const species = assertSpecies(CREATURE, entry.species, 'creature');
  const virtualOffsetMs = assertEntryTimestamp(entry, 'adoptedAt');
  const config = CREATURE[species];
  if (entry.preview !== undefined && typeof entry.preview !== 'boolean') {
    reject('INVALID_STATE', 'creature preview must be boolean');
  }
  return {
    type: 'creature',
    species,
    adoptedAt: entry.adoptedAt,
    growMs: config.growMs,
    virtualOffsetMs,
    preview: entry.preview === true,
    level: config.level,
  };
}

/** Strictly validate a state that was already created by this module. */
function validateState(state) {
  if (!state || typeof state !== 'object' || Array.isArray(state)) {
    reject('INVALID_STATE', 'state must be an object');
  }
  if (state.version !== STATE_VERSION) reject('INVALID_STATE', 'unsupported state version');
  assertFiniteTime(state.createdAt ?? 0, 'createdAt');
  assertNonNegativeDuration(state.offsetMs ?? 0, 'offsetMs');
  if (!Array.isArray(state.plots) || state.plots.length !== PLOT_COUNT) {
    reject('INVALID_STATE', 'state must contain three plots');
  }
  if (!state.inventory || typeof state.inventory !== 'object' || Array.isArray(state.inventory)) {
    reject('INVALID_STATE', 'state inventory must be an object');
  }
  for (const species of Object.keys(CROP)) {
    const count = state.inventory[species] ?? 0;
    if (!Number.isSafeInteger(count) || count < 0) {
      reject('INVALID_STATE', `inventory count for ${species} must be a non-negative integer`);
    }
  }
  const normalizedPlots = [];
  for (const plot of state.plots) {
    const sourceSlots = readSlots(plot);
    const slots = sourceSlots.map((entry) => (entry === null ? null : validateCropEntry(entry)));
    const distinct = new Set(slots.filter(Boolean).map((entry) => entry.species));
    if (distinct.size > MAX_DISTINCT_CROP_SPECIES) {
      reject('TYPE_CAP', `a plot can contain at most ${MAX_DISTINCT_CROP_SPECIES} crop species`);
    }
    normalizedPlots.push(makePlot(slots));
  }
  if (!Array.isArray(state.creatures) || state.creatures.length > MAX_HOUSED_CREATURES) {
    reject('HOUSING_FULL', `at most ${MAX_HOUSED_CREATURES} creatures may be housed`);
  }
  const normalizedCreatures = state.creatures.map(validateCreatureEntry);
  return {
    version: STATE_VERSION,
    createdAt: state.createdAt ?? 0,
    offsetMs: state.offsetMs ?? 0,
    plots: normalizedPlots,
    inventory: Object.fromEntries(Object.keys(CROP).map((species) => [species, state.inventory[species] ?? 0])),
    creatures: normalizedCreatures,
  };
}

function timedStart(entry) {
  if (entry.type === 'crop') return entry.plantedAt;
  if (entry.type === 'creature') return entry.adoptedAt;
  if (Number.isFinite(entry.startedAt)) return entry.startedAt;
  if (Number.isFinite(entry.plantedAt)) return entry.plantedAt;
  if (Number.isFinite(entry.adoptedAt)) return entry.adoptedAt;
  reject('INVALID_ENTRY', 'timed entry has no valid start timestamp');
}

function timedGrowMs(entry) {
  if (entry.type === 'crop') return CROP[entry.species]?.growMs;
  if (entry.type === 'creature') return CREATURE[entry.species]?.growMs;
  if (Number.isFinite(entry.growMs)) return entry.growMs;
  return undefined;
}

/**
 * Return the four-stage lifecycle at `now`.
 *
 * Stage 0 starts at normalized progress 0, stage 1 at .25, stage 2 at .65,
 * and stage 3 (mature) at 1.  The entry's virtual offset is included so a
 * caller can pass the same wall-clock `now` before and after `advanceTime`.
 */
export function growth(entry, now) {
  if (!entry || typeof entry !== 'object') reject('INVALID_ENTRY', 'growth entry must be an object');
  const timestamp = assertFiniteTime(now);
  const startedAt = assertFiniteTime(timedStart(entry), 'entry timestamp');
  const growMs = timedGrowMs(entry);
  if (!Number.isFinite(growMs) || growMs <= 0) reject('INVALID_ENTRY', 'growth entry has no positive grow time');
  const virtualOffsetMs = entry.virtualOffsetMs ?? 0;
  assertNonNegativeDuration(virtualOffsetMs, 'virtualOffsetMs');
  const elapsedMs = Math.max(0, (timestamp - startedAt) + virtualOffsetMs);
  const normalized = Math.min(1, elapsedMs / growMs);
  let stage = 0;
  if (normalized >= STAGE_THRESHOLDS[3]) stage = 3;
  else if (normalized >= STAGE_THRESHOLDS[2]) stage = 2;
  else if (normalized >= STAGE_THRESHOLDS[1]) stage = 1;
  return {
    stage,
    normalized,
    progress: normalized,
    elapsedMs,
    growMs,
    mature: stage === 3,
  };
}

/** Start an empty three-plot game. */
export function newGame(now) {
  return makeEmptyState(assertFiniteTime(now));
}

/** Plant exactly one legal three-slot line atomically. */
export function plant(state, plotIndex, indices, species, now) {
  const base = validateState(state);
  const time = assertFiniteTime(now);
  const plot = assertPlotIndex(plotIndex);
  const crop = assertSpecies(CROP, species, 'crop');
  const selected = normalizeIndices(indices);
  assertPlantLine(selected);
  const sourceSlots = base.plots[plot].slots;
  if (selected.some((index) => sourceSlots[index] !== null)) {
    reject('OCCUPIED_SLOT', 'planting cannot overwrite an occupied slot');
  }
  const distinct = new Set(sourceSlots.filter(Boolean).map((entry) => entry.species));
  distinct.add(crop);
  if (distinct.size > MAX_DISTINCT_CROP_SPECIES) {
    reject('TYPE_CAP', `a plot can contain at most ${MAX_DISTINCT_CROP_SPECIES} crop species`);
  }
  const next = cloneState(base);
  const logicalStart = logicalStartTime(time, base.offsetMs);
  for (const index of selected) {
    next.plots[plot].slots[index] = {
      type: 'crop',
      species: crop,
      plantedAt: logicalStart,
      growMs: CROP[crop].growMs,
      virtualOffsetMs: base.offsetMs,
    };
  }
  return next;
}

/** Harvest selected mature plants atomically, adding one item per cleared slot. */
export function harvest(state, plotIndex, indices, now) {
  const base = validateState(state);
  const time = assertFiniteTime(now);
  const plot = assertPlotIndex(plotIndex);
  const selected = normalizeIndices(indices);
  const sourceSlots = base.plots[plot].slots;
  const selectedEntries = selected.map((index) => sourceSlots[index]);
  if (selectedEntries.some((entry) => entry === null)) reject('EMPTY_SLOT', 'cannot harvest an empty slot');
  for (const entry of selectedEntries) {
    if (!growth(entry, time).mature) reject('IMMATURE', 'all selected plants must be mature before harvest');
  }
  const next = cloneState(base);
  for (const [position, index] of selected.entries()) {
    const entry = selectedEntries[position];
    next.plots[plot].slots[index] = null;
    next.inventory[entry.species] += 1;
  }
  return next;
}

/** Adopt a creature; late-progression species require the explicit preview bypass. */
export function adopt(state, species, now, preview = false) {
  const base = validateState(state);
  const time = assertFiniteTime(now);
  const creature = assertSpecies(CREATURE, species, 'creature');
  if (typeof preview !== 'boolean') reject('INVALID_PREVIEW_FLAG', 'preview must be boolean');
  if (base.creatures.length >= MAX_HOUSED_CREATURES) {
    reject('HOUSING_FULL', `at most ${MAX_HOUSED_CREATURES} creatures may be housed`);
  }
  const config = CREATURE[creature];
  if (config.lateProgression && !preview) {
    reject('LOCKED_CREATURE', `${creature} is reserved for late progression or explicit preview`);
  }
  const next = cloneState(base);
  const logicalStart = logicalStartTime(time, base.offsetMs);
  next.creatures.push({
    type: 'creature',
    species: creature,
    adoptedAt: logicalStart,
    growMs: config.growMs,
    virtualOffsetMs: base.offsetMs,
    preview,
    level: config.level,
  });
  return next;
}

function mapTimedEntries(state, callback) {
  return {
    ...state,
    plots: state.plots.map((plot) => makePlot(plot.slots.map((entry) => (entry ? callback(entry) : null)))),
    creatures: state.creatures.map(callback),
  };
}

/** Advance only the explicit prototype clock; no interval or speed timer is used. */
export function advanceTime(state, ms) {
  const base = validateState(state);
  const duration = assertNonNegativeDuration(ms, 'ms');
  if (base.offsetMs + duration > MAX_TIME_MS) reject('INVALID_DURATION', 'virtual time exceeds supported range');
  const nextOffset = base.offsetMs + duration;
  return mapTimedEntries(
    { ...cloneState(base), offsetMs: nextOffset },
    (entry) => ({ ...entry, virtualOffsetMs: entry.virtualOffsetMs + duration }),
  );
}

function sanitizeSavedState(raw, now) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) reject('INVALID_STATE', 'saved data must be an object');
  if (raw.version !== STATE_VERSION) reject('INVALID_STATE', 'unsupported saved state version');
  const offsetMs = raw.offsetMs ?? 0;
  assertNonNegativeDuration(offsetMs, 'offsetMs');
  const createdAt = raw.createdAt ?? now;
  assertFiniteTime(createdAt, 'createdAt');
  if (!Array.isArray(raw.plots) || raw.plots.length !== PLOT_COUNT) reject('INVALID_STATE', 'saved data must contain three plots');
  const plots = raw.plots.map((rawPlot) => {
    const rawSlots = rawPlot?.slots;
    if (!Array.isArray(rawSlots) || rawSlots.length !== SLOTS_PER_PLOT) reject('INVALID_STATE', 'saved plot must contain nine slots');
    const slots = rawSlots.map((rawEntry) => {
      if (rawEntry === null) return null;
      const entry = validateCropEntry(rawEntry);
      // The state offset is the single saved virtual clock. Discard a stale
      // per-entry mirror and rebuild it consistently.
      return { ...entry, virtualOffsetMs: offsetMs };
    });
    const distinct = new Set(slots.filter(Boolean).map((entry) => entry.species));
    if (distinct.size > MAX_DISTINCT_CROP_SPECIES) reject('TYPE_CAP', 'saved plot exceeds the crop type cap');
    return makePlot(slots);
  });
  if (!raw.inventory || typeof raw.inventory !== 'object' || Array.isArray(raw.inventory)) reject('INVALID_STATE', 'saved inventory must be an object');
  const inventory = emptyInventory();
  for (const species of Object.keys(CROP)) {
    const count = raw.inventory[species] ?? 0;
    if (!Number.isSafeInteger(count) || count < 0) reject('INVALID_STATE', `invalid saved inventory count for ${species}`);
    inventory[species] = count;
  }
  if (!Array.isArray(raw.creatures) || raw.creatures.length > MAX_HOUSED_CREATURES) reject('HOUSING_FULL', 'saved housing exceeds three creatures');
  const creatures = raw.creatures.map((rawEntry) => ({ ...validateCreatureEntry(rawEntry), virtualOffsetMs: offsetMs }));
  return {
    version: STATE_VERSION,
    createdAt,
    offsetMs,
    plots,
    inventory,
    creatures,
  };
}

/**
 * Parse and validate a saved state. Any malformed saved payload falls back to
 * a fresh game at `now`, while an invalid `now` still rejects explicitly.
 */
export function restoreChecked(serialized, now) {
  const time = assertFiniteTime(now);
  const raw = typeof serialized === 'string' ? JSON.parse(serialized) : serialized;
  return sanitizeSavedState(raw, time);
}

export function restore(serialized, now) {
  const time = assertFiniteTime(now);
  try {
    return restoreChecked(serialized, time);
  } catch {
    return newGame(time);
  }
}

