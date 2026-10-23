const EVENT_DURATIONS = Object.freeze({
  // Match the authored four-frame animal gestures in motion-care-data.js.
  // The runtime remains finite for crops and legacy creatures without those
  // clips, while the new clips can reach their final authored frame.
  eat: 1880,
  claim: 960,
  plant: 720,
  harvest: 760,
  water: 900,
  care: 1960,
});

const KIND_ALIASES = Object.freeze({
  eat: 'eat',
  feed: 'eat',
  feeding: 'eat',
  claim: 'claim',
  collect: 'claim',
  harvest: 'harvest',
  plant: 'plant',
  water: 'water',
  care: 'care',
});

const BREEZE_STEPS = Object.freeze([
  Object.freeze({x: 0, y: 0}),
  Object.freeze({x: 1, y: 0}),
  Object.freeze({x: 0, y: -1}),
  Object.freeze({x: -1, y: 0}),
]);

const CREATURE_MOTION_STEPS = Object.freeze([
  Object.freeze({swayX: 0, bobY: 0}),
  Object.freeze({swayX: 1, bobY: -1}),
  Object.freeze({swayX: 0, bobY: -1}),
  Object.freeze({swayX: -1, bobY: 0}),
  Object.freeze({swayX: 0, bobY: -2}),
  Object.freeze({swayX: 0, bobY: -1}),
]);

function finite(value, fallback = 0) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function positiveDuration(value, fallback = 240) {
  return Math.max(1, finite(value, fallback));
}

export function stableHash(value) {
  let hash = 2166136261;
  for (const character of String(value ?? '')) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function normalizeCells(cells) {
  if (!Array.isArray(cells)) return [];
  return [...new Set(cells
    .map((cell) => Number(cell))
    .filter((cell) => Number.isInteger(cell) && cell >= 0 && cell < 9))]
    .sort((left, right) => left - right);
}

/** Canonicalize public animation names while retaining a small alias surface. */
export function normalizeAnimationKind(kind) {
  const key = String(kind ?? '').trim().toLowerCase();
  const normalized = KIND_ALIASES[key];
  if (!normalized) throw new Error(`Unknown garden animation: ${String(kind)}.`);
  return normalized;
}

/**
 * Choose one authored frame from a clip. Action clips are finite even when
 * their manifest marks them as looping; this keeps eating/care feedback short
 * and predictable while idle clips continue to loop.
 */
export function animationFrameAt(item, clipName, elapsed = 0, options = {}) {
  const clip = item?.clips?.[clipName];
  const frames = Array.isArray(clip?.frames) ? clip.frames : [];
  if (!frames.length) return null;
  const durations = frames.map((_, index) => positiveDuration(clip?.durations?.[index], 240));
  const duration = durations.reduce((sum, value) => sum + value, 0);
  const reducedMotion = options.reducedMotion === true;
  const loop = options.loop ?? (clip?.loop === true && clipName === 'idle');
  const rawElapsed = Math.max(0, finite(elapsed));
  const time = reducedMotion
    ? 0
    : loop && duration > 0
      ? rawElapsed % duration
      : Math.min(rawElapsed, duration);
  let remaining = time;
  let index = frames.length - 1;
  for (let frameIndex = 0; frameIndex < frames.length; frameIndex += 1) {
    if (remaining < durations[frameIndex] || frameIndex === frames.length - 1) {
      index = frameIndex;
      break;
    }
    remaining -= durations[frameIndex];
  }
  return {
    frame: frames[index],
    index,
    duration,
    elapsed: rawElapsed,
    progress: duration > 0 ? clamp(rawElapsed / duration, 0, 1) : 1,
    done: !loop && rawElapsed >= duration,
  };
}

/** Ambient playback never borrows a care/eat gesture or interrupts its loop. */
export function idleFrameAt(item, clock = 0, phaseSeed = '') {
  const reducedMotion = clock === 0;
  const offset = reducedMotion ? 0 : stableHash(`${item?.id}:${phaseSeed}`) % 1900;
  return animationFrameAt(item, 'idle', reducedMotion ? 0 : clock + offset, {loop: true, reducedMotion})?.frame
    ?? Math.min(3, Math.max(0, (item?.frames?.length || 1) - 1));
}

/** Pixel-aligned breeze offset shared by every crop item, including new IDs. */
export function cropBreeze(species, clock = 0, options = {}) {
  const reducedMotion = options.reducedMotion === true || finite(clock) === 0;
  if (reducedMotion) return {x: 0, y: 0, phase: 0, intensity: 0};
  const key = options.seed ? `${species}:${options.seed}` : species;
  const hash = stableHash(key);
  const period = 560 + (hash % 5) * 60;
  const offset = hash % period;
  const step = Math.floor((Math.max(0, finite(clock)) + offset) / 140) % BREEZE_STEPS.length;
  const vector = BREEZE_STEPS[step];
  return {x: vector.x, y: vector.y, phase: step, intensity: 1};
}

/**
 * Pixel-aligned breathing, swaying, and gentle hop motion for all creatures
 * (both immature and mature stages) so no creature stands frozen.
 */
export function creatureMotion(species, clock = 0, options = {}) {
  const facing = options.facing === 'right' ? 'right' : 'default';
  const reducedMotion = options.reducedMotion === true || finite(clock) === 0;
  if (reducedMotion) return {swayX: 0, bobY: 0, phase: 0, intensity: 0, sparkle: false, facing};
  const key = options.index !== undefined ? `${species}:${options.index}` : species;
  const hash = stableHash(key);
  const stepMs = 210 + (hash % 4) * 30;
  const offset = hash % 1600;
  const step = Math.floor((Math.max(0, finite(clock)) + offset) / stepMs) % CREATURE_MOTION_STEPS.length;
  const vector = CREATURE_MOTION_STEPS[step];
  const sparkleCycle = Math.floor((Math.max(0, finite(clock)) + offset) / 420) % 7;
  return {
    swayX: vector.swayX,
    bobY: vector.bobY,
    phase: step,
    intensity: 1,
    sparkle: sparkleCycle === 0 || sparkleCycle === 3,
    facing,
  };
}

/**
 * Select the active animated frame and subtle motion for a multi-frame decor,
 * character, or scenery asset from decor-assets-manifest.json.
 */
export function decorFrameAt(asset, clock = 0, options = {}) {
  if (!asset) return null;
  const facing = options.facing === 'right' ? 'right' : 'default';
  const baseFile = (facing === 'right' && asset.rightFile) ? asset.rightFile : asset.file;
  const frames = (facing === 'right' && Array.isArray(asset.rightFrames) && asset.rightFrames.length)
    ? asset.rightFrames
    : (Array.isArray(asset.frames) && asset.frames.length ? asset.frames : [baseFile]);
  const reducedMotion = options.reducedMotion === true || finite(clock) === 0;
  const rects=facing==='right'?asset.rightAtlasRects:asset.atlasRects;
  if (reducedMotion || frames.length <= 1) {
    return {file: frames[0] ?? baseFile, index: 0, facing, bobY: 0, swayX: 0,...(rects?.[0]?{atlasRect:rects[0]}:{})};
  }
  const durations = frames.map((_, index) => positiveDuration(asset.durations?.[index], 340));
  const totalDuration = durations.reduce((sum, d) => sum + d, 0);
  const offset = stableHash(options.seed ?? asset.id) % Math.max(1, totalDuration);
  let remaining = (Math.max(0, finite(clock)) + offset) % totalDuration;
  let chosenIndex = 0;
  for (let i = 0; i < frames.length; i += 1) {
    if (remaining < durations[i] || i === frames.length - 1) {
      chosenIndex = i;
      break;
    }
    remaining -= durations[i];
  }
  if (options.greet && frames.length >= 4) {
    chosenIndex = Math.floor(Math.max(0, finite(clock)) / 180) % 2 === 0 ? 3 : 1;
  }
  return {
    file: frames[chosenIndex] ?? baseFile,
    ...(rects?.[chosenIndex]?{atlasRect:rects[chosenIndex]}:{}),
    index: chosenIndex,
    facing,
    bobY: chosenIndex === 1 || chosenIndex === 3 ? -1 : 0,
    swayX: chosenIndex === 1 ? 1 : chosenIndex === 3 ? -1 : 0,
  };
}

function eventDuration(kind) {
  return EVENT_DURATIONS[kind] ?? EVENT_DURATIONS.care;
}

function normalizeTarget(target = {}) {
  const normalized = {};
  if (typeof target.species === 'string' && target.species.length > 0) normalized.species = target.species;
  if (Number.isInteger(Number(target.plot)) && Number(target.plot) >= 0) normalized.plot = Number(target.plot);
  const cells = normalizeCells(target.cells);
  if (cells.length) normalized.cells = cells;
  if (Number.isInteger(Number(target.cell)) && Number(target.cell) >= 0 && Number(target.cell) < 9) {
    normalized.cell = Number(target.cell);
  }
  if (Number.isInteger(Number(target.creatureIndex)) && Number(target.creatureIndex) >= 0) {
    normalized.creatureIndex = Number(target.creatureIndex);
  }
  return normalized;
}

/** Detect visual changes from immutable progression snapshots. */
export function detectStateEvents(before = {}, after = {}) {
  const events = [];
  const grouped = new Map();
  const addPlotEvent = (kind, plot, cell, species) => {
    const key = `${kind}|${plot}|${species ?? ''}`;
    let event = grouped.get(key);
    if (!event) {
      event = {kind, plot, cells: [], ...(species ? {species} : {})};
      grouped.set(key, event);
      events.push(event);
    }
    if (!event.cells.includes(cell)) event.cells.push(cell);
  };

  const beforePlots = Array.isArray(before?.plots) ? before.plots : [];
  const afterPlots = Array.isArray(after?.plots) ? after.plots : [];
  const plotCount = Math.max(beforePlots.length, afterPlots.length);
  for (let plot = 0; plot < plotCount; plot += 1) {
    const previousSlots = Array.isArray(beforePlots[plot]?.slots) ? beforePlots[plot].slots : [];
    const nextSlots = Array.isArray(afterPlots[plot]?.slots) ? afterPlots[plot].slots : [];
    const slotCount = Math.max(previousSlots.length, nextSlots.length);
    for (let cell = 0; cell < slotCount; cell += 1) {
      const previous = previousSlots[cell];
      const next = nextSlots[cell];
      if (!previous && next?.type === 'crop') addPlotEvent('plant', plot, cell, next.species);
      else if (previous?.type === 'crop' && !next) addPlotEvent('harvest', plot, cell, previous.species);
      else if (previous?.type === 'crop' && next?.type === 'crop' && previous.id !== next.id) {
        addPlotEvent('harvest', plot, cell, previous.species);
        addPlotEvent('plant', plot, cell, next.species);
      }
    }
  }

  const beforeCreatures = new Map((Array.isArray(before?.creatures) ? before.creatures : [])
    .map((entry, index) => [entry?.id ?? entry?.species ?? `index-${index}`, entry]));
  for (const [index, entry] of (Array.isArray(after?.creatures) ? after.creatures : []).entries()) {
    const key = entry?.id ?? entry?.species ?? `index-${index}`;
    const previous = beforeCreatures.get(key);
    if (!previous || !entry) continue;
    if (!previous.meal && entry.meal) {
      events.push({kind: 'eat', species: entry.species, creatureIndex: index});
    } else if (previous.meal && !entry.meal) {
      events.push({kind: 'claim', species: entry.species, creatureIndex: index});
    }
  }
  return events.map((event) => event.cells
    ? {...event, cells: event.cells.sort((left, right) => left - right)}
    : event);
}

export function eventProgress(event, clock = 0, options = {}) {
  const duration = Math.max(1, finite(event?.duration, eventDuration(event?.kind)));
  const reducedMotion = options.reducedMotion === true || finite(clock) === 0;
  const elapsed = reducedMotion ? 0 : clamp(finite(clock) - finite(event?.startedAt), 0, duration);
  return {elapsed, duration, progress: duration > 0 ? elapsed / duration : 1, done: elapsed >= duration};
}

export function matchesAnimationTarget(event, target = {}) {
  if (!event) return false;
  let constrained = false;
  if (event.species !== undefined) {
    constrained = true;
    if (event.species !== target.species) return false;
  }
  if (event.plot !== undefined) {
    constrained = true;
    if (event.plot !== target.plot) return false;
  }
  if (event.cells?.length && target.cell !== undefined) {
    constrained = true;
    if (!event.cells.includes(target.cell)) return false;
  }
  if (event.creatureIndex !== undefined && target.creatureIndex !== undefined) {
    constrained = true;
    if (event.creatureIndex !== target.creatureIndex) return false;
  }
  return constrained;
}

export function selectAnimation(events, target = {}) {
  return [...(Array.isArray(events) ? events : [])].reverse().find((event) => matchesAnimationTarget(event, target)) ?? null;
}

/** Small stateful queue owned by one renderer instance. */
export function createAnimationRuntime() {
  let clock = 0;
  let sequence = 0;
  const events = [];

  function setClock(nextClock) {
    clock = Math.max(0, finite(nextClock));
    return clock;
  }

  function animate(kind, target = {}, startedAt = clock) {
    const normalizedKind = normalizeAnimationKind(kind);
    const start = Math.max(0, finite(startedAt, clock));
    const event = {
      id: `garden-animation-${++sequence}`,
      kind: normalizedKind,
      ...normalizeTarget(target),
      startedAt: start,
      duration: eventDuration(normalizedKind),
    };
    event.endsAt = event.startedAt + event.duration;
    events.push(event);
    return {...event};
  }

  function active(at = clock, options = {}) {
    const time = Math.max(0, finite(at, clock));
    for (let index = events.length - 1; index >= 0; index -= 1) {
      if (events[index].endsAt < time) events.splice(index, 1);
    }
    return events
      .filter((event) => event.startedAt <= time)
      .map((event) => ({...event, ...eventProgress(event, time, options)}));
  }

  function react(before, after, options = {}) {
    const start = options.clock === undefined ? clock : setClock(options.clock);
    return detectStateEvents(before, after).map((event) => animate(event.kind, event, start));
  }

  return {
    setClock,
    animate,
    react,
    active,
    events: () => events.map((event) => ({...event})),
  };
}

// Juice offsets are whole pixels sampled from short curves, never scaling, so
// sprites keep their pixel grid (docs/art-bible.md rule 1). Progress 0 is also
// what reduced motion reports, so every curve returns 0 there.
const HOP_CURVES = Object.freeze({
  plant: Object.freeze([3, 1, -2, -3, -1, 0]),
  eat: Object.freeze([0, -2, -4, -3, -1, 0]),
  claim: Object.freeze([0, -3, -5, -2, 0, 0]),
});

export function eventHop(event) {
  const curve = HOP_CURVES[event?.kind];
  const progress = finite(event?.progress);
  if (!curve || progress <= 0 || progress >= 1) return 0;
  return curve[Math.min(curve.length - 1, Math.floor(progress * curve.length))];
}

/** A harvested crop's last frame rises and fades out; null means draw nothing. */
export function harvestPop(event) {
  const progress = finite(event?.progress);
  if (event?.kind !== 'harvest' || progress <= 0 || progress >= 1) return null;
  const ease = 1 - (1 - progress) ** 3;
  return {dy: -Math.round(ease * 18), alpha: Math.round((1 - progress) * 10) / 10};
}

export {EVENT_DURATIONS};
