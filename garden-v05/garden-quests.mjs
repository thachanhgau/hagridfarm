import {getGardenStorage} from './garden-storage.mjs';
export const OWL_QUEST_STORAGE_KEY = 'hpvn-garden-v21-owl-quests';

export const DAILY_OWL_QUEST_TEMPLATES = [
  {
    id: 'quest_hagrid_harvest',
    sender: 'Bác Hagrid',
    senderRole: 'Người giữ chìa khóa & khu vườn',
    title: 'Gieo hạt hoặc thu hoạch 3 luống thảo mộc',
    description: 'Hãy ra các thửa đất quanh lều, gieo một hàng hạt giống mới hoặc gặt cây chín mang về kho.',
    target: 1,
    triggers: ['plant', 'replant', 'harvest', 'care'],
    reward: {kind: 'kit', amount: 2, itemId: 'kit', label: '+2 Bộ vật liệu xây dựng'},
    route: 'plant',
    routeLabel: 'Ra thửa đất',
  },
  {
    id: 'quest_sprout_craft',
    sender: 'Giáo sư Pomona Sprout',
    senderRole: 'Nhà kính Thảo dược học',
    title: 'Chế biến khẩu phần hoặc thu thập nông sản',
    description: 'Ghé chiếc vạc chế biến khẩu phần cho sinh vật hoặc chăm sóc các luống cây thảo dược.',
    target: 1,
    triggers: ['craft', 'claimCraft', 'harvest', 'care'],
    reward: {kind: 'water', amount: 15, itemId: 'pumpkin', bonusQty: 3, label: '+15 Nước suối & +3 Bí ngô'},
    route: 'craft',
    routeLabel: 'Mở vạc chế biến',
  },
  {
    id: 'quest_hemxeo_creature',
    sender: 'Tiệm Phép Thuật Hẻm Xéo',
    senderRole: 'Hội Bảo trợ Sinh vật & Cảnh quan',
    title: 'Thăm sinh vật hoặc xoay góc trang trí',
    description: 'Cho sinh vật ăn, vuốt ve người bạn trong chuồng hoặc xoay thử góc nhìn ↖/↗ của một vật phẩm.',
    target: 1,
    triggers: ['feed', 'claimAnimals', 'adopt', 'pet', 'rotate'],
    reward: {kind: 'boost', amount: 1, itemId: 'kit', bonusQty: 1, label: '+1 Phân bón & +1 Bộ vật liệu'},
    route: 'creature',
    routeLabel: 'Thăm chuồng nuôi',
  },
];

export const BONUS_DAILY_TASK_TEMPLATES = [
  {
    id: 'quest_neighbor_tour',
    sender: 'Newt Scamander & Charlie Weasley',
    senderRole: 'Hội Giao Lưu Khu Vườn Mẫu',
    title: 'Ghé thăm hoặc chăm giúp Khu Vườn Mẫu',
    description: 'Mở bảng Tham quan Vườn Mẫu, dạo bước học hỏi bố cục hoặc bấm Chăm giúp để nhận quà lưu niệm.',
    target: 1,
    triggers: ['helpTour', 'startTour', 'shareFloo', 'postcard'],
    reward: {kind: 'water', amount: 12, itemId: 'insects', bonusQty: 3, label: '+12 Nước suối & +3 Côn trùng'},
    route: 'tour',
    routeLabel: 'Tham quan Vườn Mẫu',
  },
  {
    id: 'quest_festival_spirit',
    sender: 'Ban Lễ Hội Hogwarts',
    senderRole: 'Ủy ban Sự kiện Bốn Mùa',
    title: 'Hưởng ứng Lễ hội hoặc Gắn kết Sinh vật (×2)',
    description: 'Đổi chủ đề Lễ hội / Thời tiết, vuốt ve gắn kết sinh vật trên sân hoặc thu hoạch mùa vụ.',
    target: 2,
    triggers: ['pet', 'feed', 'harvest', 'plant', 'eventChange', 'weatherChange'],
    reward: {kind: 'kit', amount: 2, itemId: 'moonherb', bonusQty: 2, label: '+2 Bộ vật liệu & +2 Cỏ trăng'},
    route: 'events',
    routeLabel: 'Mở bảng Lễ hội',
  },
];

export const DAILY_GRAND_CHEST_TARGET = 3;
export const DAILY_GRAND_CHEST_REWARD = Object.freeze({
  kind: 'boost',
  amount: 2,
  waterBonus: 25,
  itemId: 'kit',
  bonusQty: 3,
  eventPoints: 50,
  label: '🎁 Rương Cú Vàng: +25 Nước, +3 Bộ vật liệu, +2 Phân bón & +50 Điểm Lễ Hội',
});

export function dayKeyFor(nowMs = Date.now()) {
  const d = new Date(Number.isFinite(nowMs) ? nowMs : Date.now());
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function mapTemplateToQuest(tpl) {
  return {
    id: tpl.id,
    sender: tpl.sender,
    senderRole: tpl.senderRole,
    title: tpl.title,
    description: tpl.description,
    target: tpl.target,
    triggers: [...tpl.triggers],
    reward: {...tpl.reward},
    route: tpl.route,
    routeLabel: tpl.routeLabel,
    progress: 0,
    claimed: false,
  };
}

export function createDefaultOwlQuests(dayKey = dayKeyFor(), streakDays = 1) {
  return {
    version: 23,
    dayKey,
    streakDays: Math.max(1, Number(streakDays) || 1),
    grandChestClaimed: false,
    quests: DAILY_OWL_QUEST_TEMPLATES.map(mapTemplateToQuest),
    bonusQuests: BONUS_DAILY_TASK_TEMPLATES.map(mapTemplateToQuest),
  };
}

export function loadOwlQuests(storage = getGardenStorage(), nowMs = Date.now()) {
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
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.quests)) {
      return fallback;
    }
    const prevStreak = Math.max(1, Number(parsed.streakDays) || 1);
    if (parsed.dayKey !== today) {
      const nextStreak = parsed.dayKey === yesterday ? prevStreak + 1 : 1;
      return createDefaultOwlQuests(today, nextStreak);
    }
    const byId = new Map(parsed.quests.map((q) => [q.id, q]));
    const bonusById = new Map(Array.isArray(parsed.bonusQuests) ? parsed.bonusQuests.map((q) => [q.id, q]) : []);
    return {
      version: 23,
      dayKey: today,
      streakDays: prevStreak,
      grandChestClaimed: Boolean(parsed.grandChestClaimed),
      quests: fallback.quests.map((tpl) => {
        const saved = byId.get(tpl.id);
        if (!saved) return tpl;
        return {
          ...tpl,
          progress: Math.min(tpl.target, Math.max(0, Number(saved.progress) || 0)),
          claimed: Boolean(saved.claimed),
        };
      }),
      bonusQuests: fallback.bonusQuests.map((tpl) => {
        const saved = bonusById.get(tpl.id);
        if (!saved) return tpl;
        return {
          ...tpl,
          progress: Math.min(tpl.target, Math.max(0, Number(saved.progress) || 0)),
          claimed: Boolean(saved.claimed),
        };
      }),
    };
  } catch {
    return fallback;
  }
}

export function saveOwlQuests(questState, storage = getGardenStorage()) {
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
  const completedCount = list.filter((q) => q.progress >= q.target).length;
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

export function syncQuestsWithGardenState(questState, gameState = null, extraOrNow = {}, maybeExtra = null) {
  if (!questState || !Array.isArray(questState.quests) || !gameState) return questState;
  // Daily progress is recorded by today's successful actions, never lifetime inventory/XP.

  return questState;
}

export function recordOwlQuestAction(actionType, amount = 1, storage = getGardenStorage(), nowMs = Date.now()) {
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
  return anyTaskReady || summary.grandReady;
}

export const hasClaimableQuest = hasClaimableOwlQuest;

