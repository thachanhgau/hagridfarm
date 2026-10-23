import {getGardenStorage} from './garden-storage.mjs?v=24.9.75';
import {CROP} from './balance-data.mjs?v=24.9.75';
export const OWL_QUEST_STORAGE_KEY = 'hpvn-garden-v21-owl-quests';

// Owl quests, V24.9.8 (docs/economy-audit.md): three per day, picked by level and
// by what the player has unlocked, counting only real farm work (cells planted,
// crops harvested, batches crafted, meals fed). Free taps (weather, rotating,
// postcards, tours, petting) no longer complete anything.
export const OWL_QUEST_VERSION = 26;
export const DAILY_QUEST_COUNT = 3;

const bandTarget = (level) => (level < 6 ? 6 : level < 20 ? 9 : 12);

// Each entry builds one quest for a given context {level, hasCreature, feedItem}.
// `reward.itemId` without `bonusQty` only picks the icon; it grants nothing.
export const OWL_QUEST_POOL = Object.freeze([
  {id: 'q_plant', always: true, route: 'plant', triggers: ['plant', 'replant'],
    build: ({level}) => {const n = bandTarget(level); return {title: `Gieo ${n} ô`, target: n, reward: {kind: 'water', amount: n, itemId: 'pumpkin'}};}},
  {id: 'q_harvest', always: true, route: 'plant', triggers: ['harvest'],
    build: ({level}) => {const n = bandTarget(level); return {title: `Gặt ${n} cây`, target: n, reward: {kind: 'water', amount: level < 6 ? 6 : 8, itemId: 'pumpkin'}};}},
  {id: 'q_harvest_runs', route: 'plant', triggers: ['harvestRun'],
    // One run below level 6, so a one-visit day can still finish all three (docs/festival-pacing.md).
    build: ({level}) => {const n = level < 6 ? 1 : 2; return {title: `Gặt ${n} lần`, target: n, reward: {kind: 'water', amount: 6, itemId: 'pumpkin'}};}},
  {id: 'q_craft', minLevel: 6, route: 'craft', triggers: ['craft'],
    build: () => ({title: 'Chế biến 2 mẻ', target: 2, reward: {kind: 'water', amount: 4, itemId: 'oats', bonusQty: 4}})},
  {id: 'q_feed', needsCreature: true, route: 'creature', triggers: ['feed'],
    build: ({feedItem}) => ({title: 'Cho ăn 2 bữa', target: 2, reward: {kind: 'water', amount: 4, itemId: feedItem || 'puff_feed', bonusQty: 1}})},
  {id: 'q_claim', needsCreature: true, route: 'creature', triggers: ['claimAnimals'],
    build: () => ({title: 'Thu sản phẩm', target: 1, reward: {kind: 'water', amount: 8, itemId: 'pumpkin'}})},
]);

// Kept for older imports: the always-on pair is today's fixed core.
export const DAILY_OWL_QUEST_TEMPLATES = OWL_QUEST_POOL.filter((q) => q.always);
export const BONUS_DAILY_TASK_TEMPLATES = [];

export const DAILY_GRAND_CHEST_TARGET = DAILY_QUEST_COUNT;
export const DAILY_GRAND_CHEST_REWARD = Object.freeze({
  kind: 'boost',
  amount: 1,
  waterBonus: 12,
  itemId: 'boost',
  eventPoints: 20,
  label: 'Rương Cú Vàng: +1 Nước phép, +12 Nước, +20 điểm lễ hội',
});

// What today's quests may ask for; the game sets it from the live garden.
let questContext = {level: 1, hasCreature: false, feedItem: null};
export function setOwlQuestContext({level = 1, hasCreature = false, feedItem = null} = {}) {
  questContext = {level: Math.max(1, Number(level) || 1), hasCreature: Boolean(hasCreature), feedItem: feedItem || null};
  return questContext;
}

function dayHash(text) {
  let h = 2166136261;
  for (const ch of String(text)) h = Math.imul(h ^ ch.codePointAt(0), 16777619);
  return h >>> 0;
}

function rewardLabel(r) {
  const names = {water: 'Nước', boost: 'Nước phép'};
  return [r.amount ? `+${r.amount} ${names[r.kind] || r.kind}` : '', r.bonusQty ? `+${r.bonusQty} ${CROP[r.itemId]?.label || 'khẩu phần'}` : '', r.waterBonus ? `+${r.waterBonus} Nước` : ''].filter(Boolean).join(', ');
}

/** Pure: today's three quests for a context; the same day and context always give the same set. */
export function pickDailyQuests(dayKey, context = questContext) {
  const eligible = OWL_QUEST_POOL.filter((q) => (q.minLevel ?? 1) <= context.level && (!q.needsCreature || context.hasCreature));
  const core = eligible.filter((q) => q.always);
  const extra = eligible.filter((q) => !q.always);
  const picked = [...core];
  if (extra.length) picked.push(extra[dayHash(dayKey) % extra.length]);
  return picked.slice(0, DAILY_QUEST_COUNT).map((q) => {
    const built = q.build(context);
    return {
      id: q.id,
      sender: 'Bác Hagrid',
      title: built.title,
      target: built.target,
      triggers: [...q.triggers],
      reward: {...built.reward, label: rewardLabel(built.reward)},
      route: q.route,
      progress: 0,
      claimed: false,
    };
  });
}

export function dayKeyFor(nowMs = Date.now()) {
  const d = new Date(Number.isFinite(nowMs) ? nowMs : Date.now());
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function createDefaultOwlQuests(dayKey = dayKeyFor(), streakDays = 1, context = questContext) {
  return {
    version: OWL_QUEST_VERSION,
    dayKey,
    streakDays: Math.max(1, Number(streakDays) || 1),
    grandChestClaimed: false,
    level: context.level,
    quests: pickDailyQuests(dayKey, context),
    bonusQuests: [],
  };
}

// Connected play: the server owns today's quests, chest and streak. `useServerDaily(response.daily)`
// after every wallet response; loads then read it and local counting/claiming stands down.
let serverDaily = null;
export function useServerDaily(daily = null) {
  serverDaily = daily && Array.isArray(daily.quests) ? {
    version: OWL_QUEST_VERSION,
    dayKey: daily.dayKey,
    streakDays: Math.max(1, Number(daily.streakDays) || 1),
    grandChestClaimed: Boolean(daily.chest?.claimed),
    quests: daily.quests.map((q) => ({...q})),
    // «Việc thêm» and Rương Bác Hagrid exist only in connected play.
    bonusQuests: Array.isArray(daily.bonusQuests) ? daily.bonusQuests.map((q) => ({...q})) : [],
    bonusChest: daily.bonusChest ? {...daily.bonusChest} : null,
    server: true,
  } : null;
  return serverDaily;
}

export function loadOwlQuests(storage = getGardenStorage(), nowMs = Date.now()) {
  if (serverDaily) return structuredClone(serverDaily);
  const today = dayKeyFor(nowMs);
  const previousDay = new Date(Number.isFinite(nowMs) ? nowMs : Date.now());
  previousDay.setDate(previousDay.getDate() - 1);
  const yesterday = dayKeyFor(previousDay.getTime());
  const fallback = createDefaultOwlQuests(today, 1);
  if (!storage || typeof storage.getItem !== 'function') return fallback;
  try {
    const raw = storage.getItem(OWL_QUEST_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.quests)) return fallback;
    const prevStreak = Math.max(1, Number(parsed.streakDays) || 1);
    if (parsed.dayKey !== today) {
      const nextStreak = parsed.dayKey === yesterday ? prevStreak + 1 : 1;
      return createDefaultOwlQuests(today, nextStreak);
    }
    // Same day, older format: start today's new set but keep the streak and chest flag,
    // so updating mid-day can never re-open a chest already opened.
    if (parsed.version !== OWL_QUEST_VERSION) {
      return {...createDefaultOwlQuests(today, prevStreak), grandChestClaimed: Boolean(parsed.grandChestClaimed)};
    }
    // Same day: the set, targets and rewards stay as they were picked this morning.
    return {
      version: OWL_QUEST_VERSION,
      dayKey: today,
      streakDays: prevStreak,
      grandChestClaimed: Boolean(parsed.grandChestClaimed),
      level: Number(parsed.level) || 1,
      quests: parsed.quests.filter((q) => q && typeof q.id === 'string' && Array.isArray(q.triggers)).map((q) => ({
        ...q,
        target: Math.max(1, Number(q.target) || 1),
        progress: Math.min(Math.max(1, Number(q.target) || 1), Math.max(0, Number(q.progress) || 0)),
        claimed: Boolean(q.claimed),
      })),
      bonusQuests: [],
    };
  } catch {
    return fallback;
  }
}

export function saveOwlQuests(questState, storage = getGardenStorage()) {
  if (serverDaily) return questState;
  if (!storage || typeof storage.setItem !== 'function' || !questState) return questState;
  try {
    storage.setItem(OWL_QUEST_STORAGE_KEY, JSON.stringify(questState));
  } catch {
    return null;
  }
  return questState;
}

export function allDailyTasks(questState) {
  if (!questState) return [];
  return [
    ...(Array.isArray(questState.quests) ? questState.quests : []),
    ...(Array.isArray(questState.bonusQuests) ? questState.bonusQuests : []),
  ];
}

export function dailyCompletionSummary(questState) {
  const list = allDailyTasks(questState);
  // Rương Cú Vàng counts the owl quests only; bonus quests feed Rương Bác Hagrid.
  const completedCount = (Array.isArray(questState?.quests) ? questState.quests : []).filter((q) => q.progress >= q.target).length;
  const claimedCount = list.filter((q) => q.claimed).length;
  const totalCount = list.length;
  const grandReady = completedCount >= DAILY_GRAND_CHEST_TARGET && !questState?.grandChestClaimed;
  return {
    completedCount,
    claimedCount,
    totalCount,
    targetForGrand: DAILY_GRAND_CHEST_TARGET,
    grandReady,
    grandClaimed: Boolean(questState?.grandChestClaimed),
    streakDays: Math.max(1, Number(questState?.streakDays) || 1),
  };
}

/**
 * Quest counts for one successful command: [trigger, amount] pairs.
 * Cells planted and harvested come from the plot diff; only `harvest` counts as a
 * harvest (uproot also empties cells but grows nothing). Meals count each creature
 * whose meal started, so feeding three creatures at once is three meals.
 */
export function questAmounts(act, before, after, command = null) {
  const out = [];
  let planted = 0, harvested = 0;
  const plots = Math.max(before?.plots?.length || 0, after?.plots?.length || 0);
  for (let p = 0; p < plots; p += 1) {
    const a = before?.plots?.[p]?.slots || [], b = after?.plots?.[p]?.slots || [];
    for (let i = 0; i < 9; i += 1) {
      if (b[i] && (!a[i] || a[i].id !== b[i].id)) planted += 1;
      if (a[i] && (!b[i] || b[i].id !== a[i].id)) harvested += 1;
    }
  }
  if (planted) out.push(['plant', planted]);
  if (act === 'harvest' && harvested) out.push(['harvest', harvested], ['harvestRun', 1]);
  if (act === 'craft') out.push(['craft', Math.max(1, Number(command?.batches) || 1)]);
  if (act === 'feed') {
    const was = new Map((before?.creatures || []).map((c) => [c.species, c.meal?.id]));
    const meals = (after?.creatures || []).filter((c) => c.meal && c.meal.id !== was.get(c.species)).length;
    if (meals) out.push(['feed', meals]);
  }
  if (act === 'claimAnimals' || act === 'adopt') out.push([act, 1]);
  return out;
}

export function syncQuestsWithGardenState(questState, gameState = null, extraOrNow = {}, maybeExtra = null) {
  if (!questState || !Array.isArray(questState.quests) || !gameState) return questState;
  // Daily progress is recorded by today's successful actions, never lifetime inventory/XP.

  return questState;
}

export function recordOwlQuestAction(actionType, amount = 1, storage = getGardenStorage(), nowMs = Date.now()) {
  if (serverDaily) return {state: loadOwlQuests(), newlyCompleted: []};
  const current = loadOwlQuests(storage, nowMs);
  const inc = Math.max(1, Number(amount) || 1);
  const newlyCompleted = [];
  for (const q of allDailyTasks(current)) {
    if (q.claimed) continue;
    if (Array.isArray(q.triggers) && q.triggers.includes(actionType)) {
      const before = q.progress;
      q.progress = Math.min(q.target, q.progress + inc);
      if (before < q.target && q.progress >= q.target) {
        newlyCompleted.push(q);
      }
    }
  }
  saveOwlQuests(current, storage);
  return {state: current, newlyCompleted};
}

export function claimOwlQuest(questId, {storage = getGardenStorage(), nowMs = Date.now(), onGrantReward = null} = {}) {
  if (serverDaily) return {ok: false, reason: 'SERVER_OWNED'};
  const current = loadOwlQuests(storage, nowMs);
  const quest = allDailyTasks(current).find((q) => q.id === questId);
  if (!quest) return {ok: false, reason: 'NOT_FOUND', state: current};
  if (quest.claimed) return {ok: false, reason: 'ALREADY_CLAIMED', state: current};
  if (quest.progress < quest.target) return {ok: false, reason: 'INCOMPLETE', state: current};

  quest.claimed = true;
  if (!saveOwlQuests(current, storage)) return {ok: false, reason: 'SAVE_FAILED'};
  if (typeof onGrantReward === 'function') {
    onGrantReward(quest.reward, quest);
  }
  return {ok: true, claimed: true, quest, reward: quest.reward, state: current};
}

export function claimDailyGrandChest({storage = getGardenStorage(), nowMs = Date.now(), onGrantReward = null} = {}) {
  if (serverDaily) return {ok: false, reason: 'SERVER_OWNED'};
  const current = loadOwlQuests(storage, nowMs);
  const summary = dailyCompletionSummary(current);
  if (current.grandChestClaimed) {
    return {ok: false, claimed: false, reason: 'ALREADY_CLAIMED', state: current, summary};
  }
  if (summary.completedCount < DAILY_GRAND_CHEST_TARGET) {
    return {ok: false, claimed: false, reason: 'INCOMPLETE', state: current, summary};
  }
  current.grandChestClaimed = true;
  if (!saveOwlQuests(current, storage)) return {ok: false, reason: 'SAVE_FAILED'};
  if (typeof onGrantReward === 'function') {
    onGrantReward(DAILY_GRAND_CHEST_REWARD, {id: 'daily_grand_chest', title: 'Rương Đại Lễ Cú Đưa Thư'});
  }
  return {
    ok: true,
    claimed: true,
    reward: DAILY_GRAND_CHEST_REWARD,
    state: current,
    summary: dailyCompletionSummary(current),
  };
}

export function hasClaimableOwlQuest(questState) {
  if (!questState || !Array.isArray(questState.quests)) return false;
  const anyTaskReady = allDailyTasks(questState).some((q) => !q.claimed && q.progress >= q.target);
  const summary = dailyCompletionSummary(questState);
  return anyTaskReady || summary.grandReady || Boolean(questState.bonusChest?.ready);
}

export const hasClaimableQuest = hasClaimableOwlQuest;

