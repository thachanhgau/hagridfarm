// First three minutes with Hagrid (docs/core-design.md section 6). No guide pages:
// the scene points (glowing plot, shaking crop, hungry Puffskein) and Hagrid says
// one short line per step. Steps advance from real game facts, so a player who
// acts out of order is never stuck.
export const TUTORIAL_KEY = 'hagrid-tutorial-v1';
export const TUTORIAL_STEPS = Object.freeze(['intro', 'plant', 'grow', 'harvest', 'feed', 'owl', 'done']);
export const TUTORIAL_PLOT = 0;

// Each line stays within eight words.
export const TUTORIAL_LINES = Object.freeze({
  intro: 'Chào con! Vườn này của con đấy.',
  plant: 'Bấm nút sáng, gieo bí ngô nào!',
  grow: 'Nước phép đây, lớn nhanh nào!',
  harvest: 'Chín rồi! Gặt về kho thôi.',
  feed: 'Puffskein của bác đói, cho ăn nhé!',
  owl: 'Thư cú tới! Mỗi ngày một lá.',
});

// Puffskein unlocks at level 10, so the first feed is Hagrid's own pet visiting:
// it never joins state.creatures and the approved balance stays untouched.
export const TUTORIAL_GUEST = Object.freeze({species: 'puffskein', col: 1.2, row: 7});

/** True only for an untouched new garden; everyone else skips the tutorial. */
export function tutorialEligible(state) {
  if (!state || state.level !== 1 || state.xp !== 0) return false;
  if ((state.creatures || []).length) return false;
  return !(state.plots || []).some((plot) => (plot?.slots || []).some(Boolean));
}

export function loadTutorial(storage) {
  try {
    const step = JSON.parse(storage?.getItem?.(TUTORIAL_KEY) || 'null')?.step;
    return TUTORIAL_STEPS.includes(step) ? step : null;
  } catch {
    return null;
  }
}

export function saveTutorial(storage, step) {
  try {
    storage?.setItem?.(TUTORIAL_KEY, JSON.stringify({step}));
  } catch {}
  return step;
}

/** Facts come from the live state: {planted, mature, harvested} for TUTORIAL_PLOT. */
export function advanceTutorial(step, facts = {}) {
  if (step === 'plant' && facts.planted) return facts.mature ? 'harvest' : 'grow';
  if (step === 'grow' && facts.mature) return 'harvest';
  if ((step === 'plant' || step === 'grow' || step === 'harvest') && facts.harvested) return 'feed';
  return step;
}
