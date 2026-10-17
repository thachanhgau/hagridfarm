// Anonymous playtest log (docs/playtest-plan.md). Off unless the page URL has
// ?playtest=1. Records only game events: no account, name, typed text, user agent
// or IP. Times are milliseconds since the session started. Stays on this device
// until the tester exports the JSON file and sends it.
export const PLAYTEST_KEY = 'hagrid-playtest-log-v1';
export const PLAYTEST_MAX_EVENTS = 3000;
export const IDLE_GAP_MS = 20000;

function randomId() {
  const bytes = new Uint8Array(8);
  globalThis.crypto?.getRandomValues?.(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Coarse context only: enough to group results, too little to identify a person. */
export function deviceContext(win = globalThis) {
  const w = Number(win.innerWidth) || 0;
  return {
    screen: w < 430 ? 'phone' : w < 1024 ? 'tablet' : 'desktop',
    orientation: (Number(win.innerHeight) || 0) >= w ? 'portrait' : 'landscape',
    touch: Boolean(win.matchMedia?.('(pointer: coarse)')?.matches),
    reducedMotion: Boolean(win.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches),
  };
}

export function createPlaytestLog({enabled, storage = globalThis.localStorage, now = () => Date.now(), context = {}} = {}) {
  if (!enabled) return {enabled: false, track() {}, events: () => [], exportJson: () => null, clear() {}};
  const started = now();
  const session = {id: randomId(), date: new Date(started).toISOString().slice(0, 10), ...context};
  let saved = [];
  try { saved = JSON.parse(storage?.getItem?.(PLAYTEST_KEY) || '[]'); } catch {}
  const log = Array.isArray(saved) ? saved : [];
  function persist() {
    try { storage?.setItem?.(PLAYTEST_KEY, JSON.stringify(log.slice(-PLAYTEST_MAX_EVENTS))); } catch {}
  }
  function track(type, data = {}) {
    const entry = {s: session.id, t: Math.max(0, now() - started), type};
    for (const [key, value] of Object.entries(data)) {
      // Only short scalars are kept, so free text or objects can never leak in.
      if (typeof value === 'number' || typeof value === 'boolean') entry[key] = value;
      else if (typeof value === 'string') entry[key] = value.slice(0, 60);
    }
    log.push(entry);
    if (log.length > PLAYTEST_MAX_EVENTS) log.splice(0, log.length - PLAYTEST_MAX_EVENTS);
    persist();
  }
  track('session_start', session);
  return {
    enabled: true,
    session,
    track,
    events: () => log.slice(),
    exportJson: () => JSON.stringify({kind: 'hagrid-playtest', version: 1, exportedAt: new Date(now()).toISOString().slice(0, 10), events: log}, null, 1),
    clear() { log.length = 0; persist(); },
  };
}

/** Per-session summary used by playtest-summary.mjs and the observation sheet. */
export function summarizePlaytest(events = []) {
  const bySession = new Map();
  for (const e of events) {
    if (!bySession.has(e.s)) bySession.set(e.s, []);
    bySession.get(e.s).push(e);
  }
  return [...bySession.entries()].map(([id, list]) => {
    list.sort((a, b) => a.t - b.t);
    const start = list.find((e) => e.type === 'session_start') || {};
    const first = (pred) => list.find(pred)?.t ?? null;
    const steps = {};
    for (const e of list) if (e.type === 'tutorial_step' && steps[e.step] === undefined) steps[e.step] = e.t;
    const count = (type) => list.filter((e) => e.type === type).length;
    let idle = {ms: 0, before: null, step: null}, step = null;
    for (let i = 1; i < list.length; i += 1) {
      if (list[i - 1].type === 'tutorial_step') step = list[i - 1].step;
      const gap = list[i].t - list[i - 1].t;
      // Time spent away (tab hidden) or after the player stopped is not being stuck.
      if (list[i - 1].type !== 'hidden' && list[i].type !== 'session_end' && gap > idle.ms) idle = {ms: gap, before: list[i].type, step};
    }
    const last = list[list.length - 1] || {t: 0};
    const actions = {};
    for (const e of list) if (e.type === 'action') actions[e.action] = (actions[e.action] || 0) + 1;
    return {
      session: id,
      date: start.date ?? null,
      screen: start.screen ?? null,
      touch: start.touch ?? null,
      durationMs: last.t,
      newGarden: start.newGarden ?? null,
      tutorialSteps: steps,
      tutorialDone: steps.done !== undefined,
      tutorialSkipped: count('tutorial_skip') > 0,
      lastTutorialStep: Object.keys(steps).sort((a, b) => steps[a] - steps[b]).pop() ?? null,
      firstPlantMs: first((e) => e.type === 'action' && e.action === 'plant'),
      firstHarvestMs: first((e) => e.type === 'action' && e.action === 'harvest'),
      actions,
      blocked: count('action_blocked'),
      errors: count('action_error'),
      panels: count('panel'),
      longestIdle: idle.ms >= IDLE_GAP_MS ? idle : null,
      levelReached: Math.max(1, ...list.filter((e) => e.type === 'level_up').map((e) => e.level)),
    };
  });
}
