import {getGardenStorage} from './garden-storage.mjs';
import {el, button, visualItemIcon} from './ui-utils.mjs?v=24.9.27';
import {stableHash} from './scene-animation.mjs?v=24.9.27';
import {dayKeyFor} from './garden-quests.mjs?v=24.9.27';

export const EVENT_STORAGE_KEY = 'hpvn-garden-v23-events';
export const AFFINITY_STORAGE_KEY = 'hpvn-garden-v23-affinity';

export const HOGWARTS_EVENTS = Object.freeze([
  Object.freeze({
    id: 'event_halloween',
    art: './v24-art/event-halloween.webp',
    label: 'Đêm Hội Bí Ngô Rừng Cấm',
    shortLabel: '🎃 Lễ hội Bí ngô',
    icon: '🎃',
    badge: 'LỄ HỘI MÙA THU · SAMHAIN HARVEST',
    recommendedAtmosphere: 'night',
    recommendedWeather: 'autumn',
    particleCount: 22,
    particleColors: Object.freeze(['#e7ae73', '#b378ff', '#ffc36b']),
    tint: 'rgba(66, 28, 12, 0.10)',
    bannerColor: '#ed8a45',
    description:
      'Đèn lồng bí ngô và đom đóm tím phép thuật bay lượn quanh lều bác Hagrid. Thu hoạch nông sản, chế biến khẩu phần và chăm sóc sinh vật để tích Điểm Lễ Hội Samhain!',
    hagridLine: 'Đêm hội Bí ngô Rừng Cấm rực rỡ quá! Nhớ thu hoạch bí ngô và thắp đèn lồng nhé!',
    milestones: Object.freeze([
      Object.freeze({
        id: 'hal_m1',
        points: 30,
        title: 'Giỏ Quà Đêm Samhain',
        reward: Object.freeze({kind: 'water', amount: 15, itemId: 'pumpkin', bonusQty: 4, label: '+15 Nước tưới & +4 Bí ngô'}),
      }),
      Object.freeze({
        id: 'hal_m2',
        points: 75,
        title: 'Lồng Đèn Phù Thủy Rừng Cấm',
        reward: Object.freeze({kind: 'kit', amount: 2, itemId: 'mandrake', bonusQty: 3, label: '+2 Bộ vật liệu & +3 Nhân sâm'}),
      }),
      Object.freeze({
        id: 'hal_m3',
        points: 150,
        title: 'Đại Tiệc Bí Ngô Hogwarts',
        reward: Object.freeze({kind: 'boost', amount: 2, waterBonus: 20, itemId: 'kit', bonusQty: 3, label: '+2 Phân bón, +20 Nước & +3 Bộ vật liệu'}),
      }),
    ]),
  }),
  Object.freeze({
    id: 'event_yule',
    art: './v24-art/event-yule.webp',
    label: 'Dạ Vũ Noel Hogwarts',
    shortLabel: '🎄 Dạ vũ Noel',
    icon: '🎄',
    badge: 'LỄ HỘI MÙA ĐÔNG · YULE BALL',
    recommendedAtmosphere: 'night',
    recommendedWeather: 'snow',
    particleCount: 26,
    particleColors: Object.freeze(['#f5d69a', '#b7dee0', '#e8f0ed']),
    tint: 'rgba(18, 44, 62, 0.10)',
    bannerColor: '#70a8b6',
    description:
      'Ánh sao bạc và pha lê băng tuyết tỏa sáng dọc hàng rào gỗ. Cùng bác Hagrid chuẩn bị bữa ăn ấm áp cho các sinh vật huyền bí trong mùa lễ Giáng sinh!',
    hagridLine: 'Giáng sinh ấm áp bên lều gỗ! Tuyết phủ trắng lối đi và trà nóng đã sẵn sàng!',
    milestones: Object.freeze([
      Object.freeze({
        id: 'yule_m1',
        points: 30,
        title: 'Tất Quà Bên Lò Sưởi',
        reward: Object.freeze({kind: 'water', amount: 15, itemId: 'blueberry', bonusQty: 4, label: '+15 Nước tưới & +4 Việt quất'}),
      }),
      Object.freeze({
        id: 'yule_m2',
        points: 75,
        title: 'Hộp Nhạc Tuyết Bạc',
        reward: Object.freeze({kind: 'kit', amount: 2, itemId: 'moonherb', bonusQty: 3, label: '+2 Bộ vật liệu & +3 Cỏ trăng'}),
      }),
      Object.freeze({
        id: 'yule_m3',
        points: 150,
        title: 'Ngôi Sao Đại Sảnh Đường',
        reward: Object.freeze({kind: 'boost', amount: 2, waterBonus: 20, itemId: 'starbean', bonusQty: 4, label: '+2 Phân bón, +20 Nước & +4 Đậu sao'}),
      }),
    ]),
  }),
  Object.freeze({
    id: 'event_herbology_fair',
    art: './v24-art/event-herbology.webp',
    label: 'Hội Chợ Thảo Dược & Sinh Vật',
    shortLabel: '🌿 Hội chợ Thảo dược',
    icon: '🌿',
    badge: 'NGÀY HỘI NHÀ KÍNH · HERBOLOGY FAIR',
    recommendedAtmosphere: 'day',
    recommendedWeather: 'clear',
    particleCount: 20,
    particleColors: Object.freeze(['#b7dee0', '#f5d69a', '#b0bd67']),
    tint: 'rgba(36, 74, 48, 0.08)',
    bannerColor: '#71934b',
    description:
      'Bào tử thảo dược phát quang bay lượn quanh Nhà kính Số 3. Giáo sư Sprout và Newt Scamander mở hội giao lưu hạt giống và kỷ vật sinh vật quý!',
    hagridLine: 'Hội chợ Thảo dược đang mở hội! Giáo sư Sprout và Newt khen khu vườn của con lắm!',
    milestones: Object.freeze([
      Object.freeze({
        id: 'herb_m1',
        points: 30,
        title: 'Túi Hạt Giống Nhà Kính Số 3',
        reward: Object.freeze({kind: 'water', amount: 15, itemId: 'clover', bonusQty: 4, label: '+15 Nước tưới & +4 Cỏ ba lá'}),
      }),
      Object.freeze({
        id: 'herb_m2',
        points: 75,
        title: 'Cẩm Nang Chăm Thú Của Newt',
        reward: Object.freeze({kind: 'kit', amount: 2, itemId: 'insects', bonusQty: 4, label: '+2 Bộ vật liệu & +4 Côn trùng'}),
      }),
      Object.freeze({
        id: 'herb_m3',
        points: 150,
        title: 'Cúp Vàng Hội Chợ Thảo Dược',
        reward: Object.freeze({kind: 'boost', amount: 2, waterBonus: 20, itemId: 'sunpetal', bonusQty: 3, label: '+2 Phân bón, +20 Nước & +3 Hoa nhật quang'}),
      }),
    ]),
  }),
  Object.freeze({
    id: 'none',
    art: './v24-art/weather-clear.webp',
    label: 'Ngày thường Rừng Cấm',
    shortLabel: '✨ Ngày thường',
    icon: '✨',
    badge: 'NHỊP SỐNG THƯ GIÃN · RỪNG CẤM',
    recommendedAtmosphere: 'day',
    recommendedWeather: 'clear',
    particleCount: 0,
    particleColors: Object.freeze([]),
    tint: null,
    bannerColor: '#b49a66',
    description: 'Khung cảnh Rừng Cấm thanh bình nguyên bản, không bật hiệu ứng hạt Lễ hội.',
    hagridLine: 'Một ngày yên bình bên bìa Rừng Cấm.',
    milestones: Object.freeze([]),
  }),
]);

const EVENT_MAP = new Map(HOGWARTS_EVENTS.map((e) => [e.id, e]));

export function normalizeEventMode(value) {
  const key = String(value ?? '').trim().toLowerCase();
  return EVENT_MAP.has(key) ? key : 'event_halloween';
}

export function eventConfig(mode) {
  return EVENT_MAP.get(normalizeEventMode(mode)) ?? HOGWARTS_EVENTS[0];
}

export function nextEventMode(current) {
  const norm = normalizeEventMode(current);
  const idx = HOGWARTS_EVENTS.findIndex((e) => e.id === norm);
  return HOGWARTS_EVENTS[(idx + 1) % HOGWARTS_EVENTS.length].id;
}

export const FESTIVAL_ACTION_POINTS = Object.freeze({
  plant: 10,
  replant: 12,
  harvest: 15,
  care: 6,
  craft: 12,
  claimCraft: 12,
  adopt: 20,
  feed: 15,
  claimAnimals: 18,
  pet: 10,
  rotate: 8,
  helpTour: 25,
  startTour: 10,
  dailyChest: 50,
  postcard: 12,
  shareFloo: 15,
});

// Free actions (switching themes, rotating, sharing, petting) only earn
// festival points a few times per local day; real farm work is uncapped
// because seeds, water and timers already bound it.
export const FREE_FESTIVAL_ACTIONS_PER_DAY = Object.freeze({rotate: 3, pet: 3, postcard: 1, shareFloo: 1, startTour: 1});

function normalizePointsByEvent(raw, activeEventId, legacyPoints) {
  const pointsByEvent = {};
  if (raw && typeof raw === 'object') {
    for (const [id, value] of Object.entries(raw)) pointsByEvent[normalizeEventMode(id)] = Math.max(0, Number(value) || 0);
  } else {
    // Pre-V24.9 saves kept one shared pool; it belongs to the event that was active.
    pointsByEvent[activeEventId] = Math.max(0, Number(legacyPoints) || 0);
  }
  return pointsByEvent;
}

function withPointViews(state) {
  state.points = state.pointsByEvent[state.activeEventId] || 0;
  state.totalPoints = Object.values(state.pointsByEvent).reduce((sum, value) => sum + value, 0);
  return state;
}

export function loadEventState(storage = getGardenStorage()) {
  const defaults = () => withPointViews({
    version: 24,
    activeEventId: 'event_halloween',
    pointsByEvent: {event_halloween: 35},
    claimedMilestones: [],
    freeDay: '',
    freeCounts: {},
  });
  if (!storage || typeof storage.getItem !== 'function') return defaults();
  try {
    const raw = storage.getItem(EVENT_STORAGE_KEY);
    if (!raw) return defaults();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return defaults();
    const activeEventId = normalizeEventMode(parsed.activeEventId);
    return withPointViews({
      version: 24,
      activeEventId,
      pointsByEvent: normalizePointsByEvent(parsed.pointsByEvent, activeEventId, parsed.points),
      claimedMilestones: Array.isArray(parsed.claimedMilestones)
        ? parsed.claimedMilestones.filter((id) => typeof id === 'string')
        : [],
      freeDay: typeof parsed.freeDay === 'string' ? parsed.freeDay : '',
      freeCounts: parsed.freeCounts && typeof parsed.freeCounts === 'object' ? {...parsed.freeCounts} : {},
    });
  } catch {
    return defaults();
  }
}

export function saveEventState(state, storage = getGardenStorage()) {
  if (!state || typeof state !== 'object') return state;
  const activeEventId = normalizeEventMode(state.activeEventId);
  // pointsByEvent is the source of truth; `points` is only the active-event view.
  const normalized = {
    version: 24,
    activeEventId,
    pointsByEvent: normalizePointsByEvent(state.pointsByEvent, activeEventId, state.points),
    claimedMilestones: Array.isArray(state.claimedMilestones)
      ? [...new Set(state.claimedMilestones.filter((id) => typeof id === 'string'))]
      : [],
    freeDay: typeof state.freeDay === 'string' ? state.freeDay : '',
    freeCounts: state.freeCounts && typeof state.freeCounts === 'object' ? {...state.freeCounts} : {},
  };
  if (!storage || typeof storage.setItem !== 'function') return withPointViews(normalized);
  try {
    storage.setItem(EVENT_STORAGE_KEY, JSON.stringify(normalized));
  } catch { return null; }
  return withPointViews(normalized);
}

export function recordFestivalAction(actionType, customPoints = null, storage = getGardenStorage(), nowMs = Date.now()) {
  const state = loadEventState(storage);
  let delta = customPoints != null
    ? Math.max(0, Number(customPoints) || 0)
    : (FESTIVAL_ACTION_POINTS[actionType] || 5);
  const freeLimit = FREE_FESTIVAL_ACTIONS_PER_DAY[actionType];
  if (freeLimit != null) {
    const today = dayKeyFor(nowMs);
    if (state.freeDay !== today) {
      state.freeDay = today;
      state.freeCounts = {};
    }
    const used = Number(state.freeCounts[actionType]) || 0;
    if (used >= freeLimit) delta = 0;
    else state.freeCounts[actionType] = used + 1;
  }
  state.pointsByEvent[state.activeEventId] = (state.pointsByEvent[state.activeEventId] || 0) + delta;
  const saved = saveEventState(state, storage);
  return {state: saved || withPointViews(state), addedPoints: delta};
}

export function claimEventMilestone(milestoneId, {storage = getGardenStorage(), onGrantReward = null} = {}) {
  const state = loadEventState(storage);
  const allMilestones = HOGWARTS_EVENTS.flatMap((e) => e.milestones.map((m) => ({...m, eventId: e.id, eventLabel: e.label})));
  const target = allMilestones.find((m) => m.id === milestoneId);
  if (!target) return {ok: false, reason: 'NOT_FOUND', state};
  if (state.claimedMilestones.includes(target.id)) return {ok: false, reason: 'ALREADY_CLAIMED', state};
  // Each festival spends only its own points, so switching themes cannot reuse one pool.
  if ((state.pointsByEvent[target.eventId] || 0) < target.points) return {ok: false, reason: 'INSUFFICIENT_POINTS', state};

  state.claimedMilestones.push(target.id);
  if (!saveEventState(state, storage)) return {ok: false, reason: 'SAVE_FAILED'};
  if (typeof onGrantReward === 'function') {
    onGrantReward(target.reward, target);
  }
  return {ok: true, milestone: target, reward: target.reward, state};
}

export function hasClaimableEventMilestone(storage = getGardenStorage()) {
  const state = loadEventState(storage);
  return HOGWARTS_EVENTS.some((e) => e.milestones.some(
    (m) => (state.pointsByEvent[e.id] || 0) >= m.points && !state.claimedMilestones.includes(m.id),
  ));
}

export function computeEventParticles(
  eventMode = 'event_halloween',
  clock = 0,
  bounds = {left: 180, top: 120, right: 2220, bottom: 1360},
) {
  const cfg = eventConfig(eventMode);
  if (cfg.id === 'none' || cfg.particleCount <= 0) return [];
  const t = Number.isFinite(Number(clock)) && Number(clock) > 0 ? Number(clock) : 0;
  const left = bounds?.left ?? 180;
  const top = bounds?.top ?? 120;
  const spanX = Math.max(240, (bounds?.right ?? 2220) - left);
  const spanY = Math.max(180, (bounds?.bottom ?? 1360) - top);
  const particles = [];

  for (let i = 0; i < cfg.particleCount; i += 1) {
    const h = stableHash(`event:${cfg.id}:${i}`);
    const u = (h & 0xffff) / 0xffff;
    const v = ((h >>> 16) & 0xffff) / 0xffff;
    const phase = (h % 628) / 100;
    const driftX = t > 0 ? Math.sin(t / 1100 + phase) * 20 : 0;
    const driftY = t > 0 ? Math.cos(t / 950 + phase * 1.2) * 16 : 0;
    const pulse = t > 0 ? 0.55 + 0.45 * Math.sin(t / 440 + phase) : 0.85;
    const x = left + (((u * spanX + driftX) % spanX) + spanX) % spanX;
    const y = top + (((v * spanY + driftY) % spanY) + spanY) % spanY;
    const color = cfg.particleColors[i % cfg.particleColors.length] || '#f5d69a';
    particles.push({
      eventId: cfg.id,
      x: Math.round(x),
      y: Math.round(y),
      size: i % 3 === 0 ? 5 : 4,
      alpha: Number(pulse.toFixed(2)),
      color,
      variant: i % 3,
    });
  }
  return particles;
}

export function drawEventOverlay(ctx, width, height, {eventMode = 'event_halloween', clock = 0, stageBounds = null} = {}) {
  const cfg = eventConfig(eventMode);
  if (!ctx || cfg.id === 'none' || cfg.particleCount <= 0) {
    return {eventMode: cfg.id, particles: 0};
  }
  const bounds = stageBounds || {left: 180, top: 120, right: width - 180, bottom: height - 120};
  const list = computeEventParticles(cfg.id, clock, bounds);
  ctx.save?.();
  if (cfg.tint) {
    ctx.fillStyle = cfg.tint;
    ctx.fillRect?.(0, 0, width, height);
  }
  for (const p of list) {
    if (cfg.id === 'event_halloween') {
      // Mini floating pumpkin lantern / purple wisp
      ctx.fillStyle = 'rgba(255, 158, 68, 0.22)';
      ctx.fillRect?.(p.x - p.size, p.y - p.size, p.size * 2 + 2, p.size * 2 + 2);
      ctx.fillStyle = p.color;
      ctx.fillRect?.(p.x - 2, p.y - 2, p.size, p.size);
      ctx.fillStyle = '#3f6a45';
      ctx.fillRect?.(p.x - 1, p.y - 4, 2, 2);
    } else if (cfg.id === 'event_yule') {
      // Twinkling Yule crystal star
      ctx.fillStyle = p.color;
      ctx.fillRect?.(p.x - 1, p.y - p.size, 2, p.size * 2);
      ctx.fillRect?.(p.x - p.size, p.y - 1, p.size * 2, 2);
    } else {
      // Herbology glowing pollen spore
      ctx.fillStyle = 'rgba(168, 230, 207, 0.25)';
      ctx.fillRect?.(p.x - 4, p.y - 4, 8, 8);
      ctx.fillStyle = p.color;
      ctx.fillRect?.(p.x - 2, p.y - 2, 4, 4);
    }
  }
  ctx.restore?.();
  return {eventMode: cfg.id, particles: list.length};
}

/**
 * V23.0 Gameplay Pillar: Creature Affinity & Bonding System (5 Heart Levels)
 */
export const CREATURE_AFFINITY_LEVELS = Object.freeze([
  Object.freeze({level: 1, minXp: 0, title: 'Mới quen', badge: '🌱 Cấp 1', hearts: '♡', reward: null}),
  Object.freeze({
    level: 2,
    minXp: 20,
    title: 'Quấn quýt',
    badge: '🐾 Cấp 2',
    hearts: '♥',
    reward: Object.freeze({kind: 'water', amount: 8, itemId: 'pumpkin', bonusQty: 2, label: '+8 Nước & +2 Bí ngô'}),
  }),
  Object.freeze({
    level: 3,
    minXp: 50,
    title: 'Thân thiết',
    badge: '♥ Cấp 3',
    hearts: '♥♥',
    reward: Object.freeze({kind: 'water', amount: 12, itemId: 'kit', bonusQty: 1, label: '+12 Nước & +1 Bộ vật liệu'}),
  }),
  Object.freeze({
    level: 4,
    minXp: 100,
    title: 'Tri kỷ Rừng Cấm',
    badge: '💖 Cấp 4',
    hearts: '♥♥♥',
    reward: Object.freeze({kind: 'boost', amount: 1, itemId: 'kit', bonusQty: 2, label: '+1 Phân bón & +2 Bộ vật liệu'}),
  }),
  Object.freeze({
    level: 5,
    minXp: 180,
    title: 'Bạn Tâm Giao Huyền Thoại',
    badge: '👑 Cấp 5',
    hearts: '♥♥♥♥♥',
    reward: Object.freeze({kind: 'boost', amount: 2, waterBonus: 15, itemId: 'kit', bonusQty: 3, label: '+2 Phân bón, +15 Nước & +3 Bộ vật liệu'}),
  }),
]);

export function affinityLevelForXp(xp = 0) {
  const safeXp = Math.max(0, Number(xp) || 0);
  let current = CREATURE_AFFINITY_LEVELS[0];
  let next = null;
  for (let i = 0; i < CREATURE_AFFINITY_LEVELS.length; i += 1) {
    if (safeXp >= CREATURE_AFFINITY_LEVELS[i].minXp) {
      current = CREATURE_AFFINITY_LEVELS[i];
      next = CREATURE_AFFINITY_LEVELS[i + 1] || null;
    }
  }
  return {
    level: current.level,
    title: current.title,
    badge: current.badge,
    hearts: current.hearts,
    xp: safeXp,
    nextMinXp: next ? next.minXp : current.minXp,
    isMax: !next,
  };
}

export function loadAffinityState(storage = getGardenStorage()) {
  const defaults = {
    version: 23,
    bySpecies: {},
    claimedGifts: [],
  };
  if (!storage || typeof storage.getItem !== 'function') return defaults;
  try {
    const raw = storage.getItem(AFFINITY_STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return defaults;
    const bySpecies = {};
    if (parsed.bySpecies && typeof parsed.bySpecies === 'object') {
      for (const [k, v] of Object.entries(parsed.bySpecies)) {
        bySpecies[k] = {
          xp: Math.max(0, Number(v?.xp) || 0),
          pets: Math.max(0, Number(v?.pets) || 0),
          petDay: typeof v?.petDay === 'string' ? v.petDay : '',
          petsToday: Math.max(0, Number(v?.petsToday) || 0),
        };
      }
    }
    return {
      version: 23,
      bySpecies,
      claimedGifts: Array.isArray(parsed.claimedGifts)
        ? parsed.claimedGifts.filter((id) => typeof id === 'string')
        : [],
    };
  } catch {
    return defaults;
  }
}

export function saveAffinityState(state, storage = getGardenStorage()) {
  if (!state || typeof state !== 'object') return state;
  if (!storage || typeof storage.setItem !== 'function') return state;
  try {
    storage.setItem(AFFINITY_STORAGE_KEY, JSON.stringify(state));
  } catch { return null; }
  return state;
}

// Petting is free, so only the first few pets per creature each day add affinity.
export const AFFINITY_PETS_PER_DAY = 3;

export function recordCreatureAffinity(speciesId, actionType = 'pet', storage = getGardenStorage(), gameState = {}, nowMs = Date.now()) {
  if (!speciesId) return null;
  const state = loadAffinityState(storage);
  const creature = gameState.creatures?.find(cr => cr.species === speciesId);
  const prev = state.bySpecies[speciesId] || {xp: (creature?.mealsCompleted || 0) * 15, pets: 0, petDay: '', petsToday: 0};
  const beforeLv = affinityLevelForXp(prev.xp).level;
  const today = dayKeyFor(nowMs);
  const petsToday = prev.petDay === today ? prev.petsToday || 0 : 0;
  const isPet = actionType === 'pet';
  const capped = isPet && petsToday >= AFFINITY_PETS_PER_DAY;
  const gain = capped ? 0 : actionType === 'claimAnimals' ? 25 : actionType === 'feed' ? 20 : actionType === 'adopt' ? 15 : 12;
  const nextEntry = {
    xp: prev.xp + gain,
    pets: prev.pets + (isPet && !capped ? 1 : 0),
    petDay: isPet ? today : prev.petDay || '',
    petsToday: isPet ? petsToday + (capped ? 0 : 1) : prev.petDay === today ? petsToday : 0,
  };
  state.bySpecies[speciesId] = nextEntry;
  saveAffinityState(state, storage);
  const afterInfo = affinityLevelForXp(nextEntry.xp);
  return {
    species: speciesId,
    gain,
    capped,
    petsLeftToday: Math.max(0, AFFINITY_PETS_PER_DAY - nextEntry.petsToday),
    leveledUp: afterInfo.level > beforeLv,
    info: afterInfo,
    pets: nextEntry.pets,
    state,
  };
}

export function evaluateCreatureAffinity(gameState = {}, storage = getGardenStorage()) {
  const affState = loadAffinityState(storage);
  const creatures = Array.isArray(gameState?.creatures) ? gameState.creatures : [];
  const entries = creatures.map((cr) => {
    const saved = affState.bySpecies[cr.species];
    // Give adult creatures a baseline affinity if not yet interacted
    const baseXp = saved ? saved.xp : (cr.mealsCompleted || 0) * 15;
    const info = affinityLevelForXp(baseXp);
    const claimableLevels = CREATURE_AFFINITY_LEVELS.filter(
      (lv) => lv.reward && info.level >= lv.level && !affState.claimedGifts.includes(`${cr.species}:lv${lv.level}`),
    );
    return {
      species: cr.species,
      xp: baseXp,
      pets: saved?.pets || 0,
      ...info,
      claimableGifts: claimableLevels.map((lv) => ({
        giftId: `${cr.species}:lv${lv.level}`,
        level: lv.level,
        title: lv.title,
        reward: lv.reward,
      })),
    };
  });
  const totalAffinityLevels = entries.reduce((sum, e) => sum + e.level, 0);
  const claimableCount = entries.reduce((sum, e) => sum + e.claimableGifts.length, 0);
  return {
    entries,
    bySpeciesMap: new Map(entries.map((e) => [e.species, e])),
    totalAffinityLevels,
    claimableCount,
  };
}

export function claimAffinityGift(giftId, {gameState = {}, storage = getGardenStorage(), onGrantReward = null} = {}) {
  const affState = loadAffinityState(storage);
  if (affState.claimedGifts.includes(giftId)) {
    return {ok: false, reason: 'ALREADY_CLAIMED'};
  }
  const summary = evaluateCreatureAffinity(gameState, storage);
  const allGifts = summary.entries.flatMap((e) => e.claimableGifts.map((g) => ({...g, species: e.species})));
  const found = allGifts.find((g) => g.giftId === giftId);
  if (!found) {
    return {ok: false, reason: 'NOT_ELIGIBLE'};
  }
  affState.claimedGifts.push(giftId);
  // Persist baseline xp if it came from mealsCompleted
  const speciesEntry = summary.bySpeciesMap.get(found.species);
  if (speciesEntry && !affState.bySpecies[found.species]) {
    affState.bySpecies[found.species] = {xp: speciesEntry.xp, pets: speciesEntry.pets};
  }
  if (!saveAffinityState(affState, storage)) return {ok: false, reason: 'SAVE_FAILED'};
  if (typeof onGrantReward === 'function') {
    onGrantReward(found.reward, found);
  }
  return {
    ok: true,
    gift: found,
    reward: found.reward,
  };
}

/**
 * V23.0 Visitor Guestbook Notes from Hogwarts Friends
 */
export function buildGuestbookEntries({gameState = {}, eventMode = 'event_halloween', helpedCount = 0, totalAffinity = 0} = {}) {
  const lv = Number(gameState?.level) || 1;
  const evt = eventConfig(eventMode);
  const notes = [
    {
      id: 'note_hagrid',
      author: 'Rubeus Hagrid',
      role: 'Người giữ khóa và gác sân ở Hogwarts',
      avatar: '🧔',
      stamp: evt.shortLabel,
      message: evt.hagridLine,
    },
    {
      id: 'note_sprout',
      author: 'Giáo sư Sprout',
      role: 'Chủ nhiệm Nhà Hufflepuff · Thảo dược học',
      avatar: '🌿',
      stamp: `Vườn Cấp ${lv}`,
      message:
        lv >= 45
          ? `Các luống Nhân sâm và thảo dược quý của con lên đều tăm tắp! Nhà kính Số 3 luôn rộng cửa đón con ghé thăm.`
          : `Nhớ tưới nước đều đặn và xoay vòng các giống cây trên thửa đất nhé, thảo mộc Rừng Cấm rất nhạy cảm với thời tiết đấy!`,
    },
    {
      id: 'note_newt',
      author: 'Newt Scamander',
      role: 'Tác giả Quái vật kỳ thú và nơi tìm ra chúng',
      avatar: '🦄',
      stamp: `Gắn kết ♥ ${totalAffinity}`,
      message:
        totalAffinity >= 8
          ? `Thật kỳ diệu! Các sinh vật trong vườn quấn quýt với con chẳng kém gì đám Puffskein và Niffler trong chiếc vali của tôi.`
          : `Mỗi khi rảnh rỗi, hãy chạm nhẹ vào sinh vật trên sân để vuốt ve chúng nhé — sự gắn kết sẽ mang lại nhiều điều bất ngờ!`,
    },
  ];
  if (helpedCount > 0 || lv >= 70) {
    notes.push({
      id: 'note_charlie',
      author: 'Charlie Weasley',
      role: 'Khu Bảo Tồn Rồng Romania',
      avatar: '🐉',
      stamp: helpedCount > 0 ? `Đã giao lưu ${helpedCount} vườn` : 'Bậc thầy Sinh vật',
      message:
        'Cảm ơn bồ đã ghé thăm và phụ chăm sóc khu bảo tồn! Đám Rồng và Bằng-Mã gửi tặng bồ vài túi hạt giống Ớt lửa đấy!',
    });
  }
  return notes;
}

function eventArt(cfg, className = '') {
  if (!cfg?.art) {
    return el('span', {
      class: `v24-event-art-placeholder ${className}`.trim(),
      role: 'img',
      'aria-label': cfg?.label || 'Ngày thường',
    });
  }
  return el('img', {
    class: `v24-event-art ${className}`.trim(),
    src: cfg.art,
    alt: cfg.label,
    width: 640,
    height: 360,
    loading: 'lazy',
    decoding: 'async',
  });
}

export function renderAffinitySection({
  E,
  items = null,
  creatureFacings = {},
  state = {},
  speciesId = null,
  onPetCreature,
  onClaimAffinityGift,
  storage = getGardenStorage(),
} = {}) {
  const summary = evaluateCreatureAffinity(state, storage);
  const entries = speciesId
    ? summary.entries.filter((entry) => entry.species === speciesId)
    : summary.entries;
  const root = el('section', {
    class: 'v24-affinity-section event-affinity-section',
    'data-affinity-view': 'true',
  }, [
    el('div', {class: 'journey-section-head'}, [
      el('div', {}, [
        el('small', {class: 'journey-kicker', text: 'GẮN KẾT'}),
        el('h3', {text: speciesId ? 'Mức gắn kết sinh vật' : `Tổng cấp gắn kết · ${summary.totalAffinityLevels}`}),
      ]),
    ]),
  ]);

  if (!entries.length) {
    root.append(el('p', {
      class: 'journey-subcopy',
      text: speciesId
        ? 'Đón sinh vật về vườn để bắt đầu gắn kết.'
        : 'Đón sinh vật về vườn để bắt đầu gắn kết.',
    }));
    return root;
  }

  const grid = el('div', {class: 'cards affinity-cards-grid'});
  for (const entry of entries) {
    const spec = E?.CREATURE?.[entry.species] || {label: entry.species};
    const pct = entry.isMax ? 100 : Math.min(100, Math.round((entry.xp / Math.max(1, entry.nextMinXp)) * 100));
    const nextGift = entry.claimableGifts[0] || null;
    const card = el('article', {
      class: `card affinity-card${nextGift ? ' is-ready' : ''}`,
      'data-affinity-species': entry.species,
    }, [
      el('div', {class: 'v24-affinity-card-head'}, [
        visualItemIcon(items, entry.species, {
          size: 48,
          facing: creatureFacings?.[entry.species] === 'right' ? 'right' : 'default',
        }),
        el('div', {class: 'tour-card-top'}, [
          el('span', {class: 'journey-stage-badge', text: `Cấp ${entry.level}`}),
          el('span', {class: 'affinity-hearts-pill', text: entry.hearts}),
        ]),
      ]),
      el('strong', {class: 'tour-card-title', text: spec.label}),
      el('small', {
        class: 'tour-card-keeper',
        text: entry.isMax
          ? `${entry.xp} XP · Tối đa`
          : `${entry.xp}/${entry.nextMinXp} XP`,
      }),
      el('div', {class: 'progress'}, [el('span', {style: `width:${pct}%`})]),
      nextGift?.reward?.label
        ? el('small', {class: 'v24-affinity-reward', text: nextGift.reward.label})
        : null,
      el('div', {class: 'actions'}, [
        button('Vuốt ve', () => onPetCreature?.(entry.species), {
          class: nextGift ? '' : 'primary',
          'aria-label': `Vuốt ve ${spec.label}`,
          'data-affinity-pet': entry.species,
        }),
        ...(nextGift
          ? [button('Nhận', () => onClaimAffinityGift?.(nextGift.giftId), {
            class: 'primary',
            'aria-label': `Nhận quà cấp ${nextGift.level} cho ${spec.label}`,
            'data-claim-affinity-gift': nextGift.giftId,
          })]
          : []),
      ]),
    ]);
    grid.append(card);
  }
  root.append(grid);
  return root;
}

export function renderGuestbookSection({
  state = {},
  eventMode = 'event_halloween',
  extra = {},
  storage = getGardenStorage(),
} = {}) {
  const activeCfg = eventConfig(eventMode);
  const affinitySummary = evaluateCreatureAffinity(state, storage);
  const guestbook = buildGuestbookEntries({
    gameState: state,
    eventMode: activeCfg.id,
    helpedCount: Number(extra?.helpedGardensCount) || 0,
    totalAffinity: affinitySummary.totalAffinityLevels,
  });
  const root = el('section', {class: 'v24-guestbook-section event-guestbook-section', 'data-guestbook-view': 'true'}, [
    el('div', {class: 'journey-section-head'}, [
      el('div', {}, [
        el('small', {class: 'journey-kicker', text: 'LƯU BÚT'}),
        el('h3', {text: 'Lời nhắn từ bạn bè'}),
      ]),
    ]),
  ]);
  const grid = el('div', {class: 'cards guestbook-grid'});
  for (const note of guestbook) {
    grid.append(el('article', {class: 'card guestbook-card', 'data-guestbook-id': note.id}, [
      el('div', {class: 'tour-card-top'}, [
        el('span', {class: 'journey-stage-badge', text: `${note.avatar} ${note.author}`}),
        el('span', {class: 'almanac-status-pill is-ready', text: note.stamp}),
      ]),
      el('small', {class: 'tour-card-keeper', text: note.role}),
      el('p', {text: `"${note.message}"`}),
    ]));
  }
  root.append(grid);
  return root;
}

export function renderEventsAndTasksSection({
  E,
  items = null,
  state = {},
  extra = {},
  eventMode = 'event_halloween',
  onSelectEvent,
  onApplyEventTheme,
  onClaimEventMilestone,
  // Keep the daily callback surface for callers that still pass it. Daily work
  // is rendered by the Owl letter only in V24.
  onClaimDailyQuest,
  onClaimGrandChest,
  onRouteQuest,
  onPetCreature,
  onClaimAffinityGift,
  storage = getGardenStorage(),
  nowMs = Date.now(),
} = {}) {
  void E;
  void state;
  void extra;
  void onClaimDailyQuest;
  void onClaimGrandChest;
  void onRouteQuest;
  void onPetCreature;
  void onClaimAffinityGift;
  void nowMs;
  const evtState = loadEventState(storage);
  const activeCfg = eventConfig(eventMode || evtState.activeEventId);
  const root = el('div', {class: 'v24-events-panel events-panel-root', 'data-events-view': 'true'});
  const selection = el('section', {
    class: 'v24-event-selection event-theme-switcher',
    role: 'group',
    'aria-label': 'Chọn sự kiện',
  });
  for (const ev of HOGWARTS_EVENTS) {
    const label = ({event_halloween:'Bí ngô',event_yule:'Giáng sinh',event_herbology_fair:'Thảo dược',none:'Ngày thường'})[ev.id];
    const apply = () => {
      if (typeof onApplyEventTheme === 'function') onApplyEventTheme(ev);
      else onSelectEvent?.(ev.id);
    };
    const choice = button('', apply, {
      class: `v24-event-choice journey-tab-btn${ev.id === activeCfg.id ? ' primary' : ''}`,
      'aria-label': label,
      'aria-pressed': String(ev.id === activeCfg.id),
      'data-select-event': ev.id,
      'data-apply-event-theme': ev.id,
    });
    choice.append(eventArt(ev, 'v24-event-choice-art'), el('span', {class: 'v24-event-choice-label', text: label}));
    selection.append(choice);
  }
  root.append(selection);

  const eventTitle = activeCfg.id === 'none'
    ? 'Ngày thường'
    : activeCfg.shortLabel.replace(/^[^\s]+\s/, '');
  root.append(el('section', {
    class: 'journey-hero-card event-hero-card v24-event-hero',
    'data-active-event': activeCfg.id,
  }, [
    eventArt(activeCfg, 'v24-event-hero-art'),
    el('h3', {class: 'v24-event-hero-title', text: eventTitle}),
  ]));

  const milestonesToShow = activeCfg.milestones.slice(0, 3);
  if (milestonesToShow.length) {
    const maxPoints = milestonesToShow.at(-1)?.points || 150;
    const pct = Math.min(100, Math.round((evtState.points / maxPoints) * 100));
    const milestoneSec = el('section', {class: 'event-milestones-section v24-event-progress'}, [
      el('div', {class: 'journey-section-head'}, [
        el('div', {}, [
          
          el('h3', {text: `${evtState.points} / ${maxPoints} điểm`}),
        ]),
        el('span', {class: 'journey-stage-pill', text: `${pct}%`}),
      ]),
      el('div', {class: 'progress v24-event-progress-bar'}, [el('span', {style: `width:${pct}%`})]),
    ]);
    const mGrid = el('div', {class: 'cards event-milestones-grid v24-event-milestones'});
    for (const ms of milestonesToShow) {
      const unlocked = evtState.points >= ms.points;
      const claimed = evtState.claimedMilestones.includes(ms.id);
      const progressPct = Math.min(100, Math.round((evtState.points / ms.points) * 100));
      mGrid.append(el('article', {
        class: `card event-milestone-card v24-event-milestone${claimed ? ' is-claimed' : unlocked ? ' is-ready' : ''}`,
        'data-milestone-id': ms.id,
      }, [
        el('div', {class: 'v24-event-milestone-head'}, [
          visualItemIcon(items, ms.reward.itemId || ms.reward.kind, {
            size: 34,
            kind: ms.reward.kind || '',
          }),
          el('span', {class: 'journey-stage-badge', text: `${ms.points} điểm`}),
        ]),
        
        el('div', {class: 'progress'}, [el('span', {style: `width:${progressPct}%`})]),
        el('small', {class: 'v24-event-reward', text: ms.reward.label}),
        button(
          claimed ? 'Đã nhận' : unlocked ? 'Nhận' : 'Chưa đủ',
          () => onClaimEventMilestone?.(ms.id),
          {
            class: unlocked && !claimed ? 'primary' : '',
            disabled: !unlocked || claimed,
            'data-claim-milestone': ms.id,
          },
        ),
      ]));
    }
    milestoneSec.append(mGrid);
    root.append(milestoneSec);
  }
  return root;
}
