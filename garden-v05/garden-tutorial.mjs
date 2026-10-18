// First three minutes with Hagrid (docs/core-design.md section 6). No guide pages:
// Hagrid's welcome letter, then the scene points (glowing plot, shaking crop, hungry
// Puffskein) and Hagrid says one short line per step. Steps advance from real game
// facts, so a player who acts out of order is never stuck.
export const TUTORIAL_KEY = 'hagrid-tutorial-v1';
export const TUTORIAL_STEPS = Object.freeze(['letter', 'intro', 'plant', 'grow', 'harvest', 'feed', 'owl', 'done']);
// A replay walks the same lines on a timer and performs no game action.
export const REPLAY_STEPS = Object.freeze(['intro', 'plant', 'grow', 'harvest', 'feed', 'owl']);
export const REPLAY_STEP_MS = 3200;

// Hagrid's welcome letter, in Lý Lan's voice for him: "bác" for himself, "con" for the
// reader, "<tên> thân mến!" to open, signed plain "Hagrid". The seeds he mentions are the
// server's starter supplies (qa-v19/HANDOFF-V24.9.md) and local play's free supplies.
export const HAGRID_LETTER = Object.freeze({
  paragraphs: Object.freeze([
    'Bác mừng quá vì con đã tới!',
    'Bác giao cho con mảnh vườn nhỏ cạnh căn chòi của bác. Ở đây con gieo hạt, đợi cây chín thì gặt, rồi đem nuôi mấy sinh vật huyền bí từ bìa Rừng Cấm. Vườn càng xanh, bạn nhỏ ghé càng đông.',
    'Bác để sẵn ba hạt bí ngô với ít nước ngoài hiên rồi. Ra vườn đi con, bác chỉ cho!',
  ]),
  postscript: 'Tái bút: Đừng sợ con Fang, nó hiền khô à.',
  signature: 'Hagrid',
});
const PLACEHOLDER_NAMES = new Set(['', 'Người làm vườn', 'Thành viên thử nghiệm', 'Xem thử · không lưu']);
export function letterGreeting(name) {
  const clean = String(name ?? '').trim();
  return (PLACEHOLDER_NAMES.has(clean) ? 'Con' : clean) + ' thân mến!';
}
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

/**
 * Where a session starts: a saved step resumes, an untouched garden opens Hagrid's letter,
 * everyone else is done. With a wallet only a garden the server has never changed
 * (revision 0) counts as new, so an existing account never sees the tutorial again.
 */
export function tutorialStart(state, {saved = null, connected = false} = {}) {
  if (saved) return saved;
  if (!tutorialEligible(state) || (connected && state.revision !== 0)) return 'done';
  return 'letter';
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
