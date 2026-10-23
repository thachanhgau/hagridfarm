import {getGardenStorage} from './garden-storage.mjs?v=24.9.67';
import {el, button, visualItemIcon} from './ui-utils.mjs?v=24.9.67';
import {stableHash} from './scene-animation.mjs?v=24.9.67';
import {dayKeyFor} from './garden-quests.mjs?v=24.9.67';
import {pixelIcon, rewardChips} from './pixel-icons.mjs?v=24.9.67';

export const EVENT_STORAGE_KEY = 'hpvn-garden-v23-events';
export const AFFINITY_STORAGE_KEY = 'hpvn-garden-v23-affinity';

// Milestone rewards add up to about three days of owl-quest rewards per festival
// (docs/festival-pacing.md, section 8.5). Bonus crops unlock at level 1–4.
const milestones = (prefix, crop, cropLabel, [t1, t2, t3]) => Object.freeze([
  Object.freeze({id: `${prefix}_m1`, points: 100, title: t1, reward: Object.freeze({kind: 'water', amount: 20, itemId: crop, bonusQty: 4, label: `+20 Nước tưới & +4 ${cropLabel}`})}),
  Object.freeze({id: `${prefix}_m2`, points: 450, title: t2, reward: Object.freeze({kind: 'boost', amount: 1, waterBonus: 25, label: '+1 Nước phép & +25 Nước'})}),
  Object.freeze({id: `${prefix}_m3`, points: 1000, title: t3, reward: Object.freeze({kind: 'boost', amount: 2, waterBonus: 47, label: '+2 Nước phép & +47 Nước'})}),
]);

// `season`: MM-DD start and end, inclusive, in Vietnam time. One festival at a time.
export const HOGWARTS_EVENTS = Object.freeze([
  Object.freeze({
    id: 'event_halloween',
    art: './v24-art/event-halloween.webp',
    label: 'Lễ Hội Ma ở Rừng Cấm',
    shortLabel: '🎃 Lễ Hội Ma',
    icon: '🎃',
    badge: 'MÙA THU · LỄ HỘI MA',
    season: Object.freeze({start: '10-24', end: '11-06'}),
    recommendedAtmosphere: 'night',
    recommendedWeather: 'autumn',
    particleCount: 22,
    particleColors: Object.freeze(['#e7ae73', '#b378ff', '#ffc36b']),
    tint: 'rgba(66, 28, 12, 0.10)',
    bannerColor: '#ed8a45',
    description:
      'Đèn lồng bí ngô và đom đóm tím phép thuật bay lượn quanh lều bác Hagrid. Thu hoạch nông sản, chế biến khẩu phần và chăm sóc sinh vật để tích điểm lễ hội!',
    hagridLine: 'Lễ Hội Ma ở Rừng Cấm rực rỡ quá! Nhớ thu hoạch bí ngô và thắp đèn lồng nhé!',
    milestones: milestones('hal', 'pumpkin', 'Bí ngô', ['Giỏ Quà Đêm Hội Ma', 'Lồng Đèn Phù Thủy Rừng Cấm', 'Đại Tiệc Bí Ngô Hogwarts']),
  }),
  Object.freeze({
    id: 'event_yule',
    art: './v24-art/event-yule.webp',
    label: 'Dạ Vũ Noel Hogwarts',
    shortLabel: '🎄 Dạ vũ Noel',
    icon: '🎄',
    badge: 'MÙA ĐÔNG · DẠ VŨ NOEL',
    season: Object.freeze({start: '12-18', end: '12-31'}),
    recommendedAtmosphere: 'night',
    recommendedWeather: 'snow',
    particleCount: 26,
    particleColors: Object.freeze(['#f5d69a', '#b7dee0', '#e8f0ed']),
    tint: 'rgba(18, 44, 62, 0.10)',
    bannerColor: '#70a8b6',
    description:
      'Ánh sao bạc và pha lê băng tuyết tỏa sáng dọc hàng rào gỗ. Cùng bác Hagrid chuẩn bị bữa ăn ấm áp cho các sinh vật huyền bí trong mùa lễ Giáng sinh!',
    hagridLine: 'Giáng sinh ấm áp bên lều gỗ! Tuyết phủ trắng lối đi và trà nóng đã sẵn sàng!',
    milestones: milestones('yule', 'strawberry', 'Dâu tây', ['Tất Quà Bên Lò Sưởi', 'Hộp Nhạc Tuyết Bạc', 'Ngôi Sao Đại Sảnh Đường']),
  }),
  Object.freeze({
    id: 'event_herbology_fair',
    art: './v24-art/event-herbology.webp',
    label: 'Hội Chợ Thảo Dược & Sinh Vật',
    shortLabel: '🌿 Hội chợ Thảo dược',
    icon: '🌿',
    badge: 'MÙA XUÂN · NHÀ KÍNH SỐ BA',
    season: Object.freeze({start: '03-20', end: '04-02'}),
    recommendedAtmosphere: 'day',
    recommendedWeather: 'clear',
    particleCount: 20,
    particleColors: Object.freeze(['#b7dee0', '#f5d69a', '#b0bd67']),
    tint: 'rgba(36, 74, 48, 0.08)',
    bannerColor: '#71934b',
    description:
      'Bào tử thảo dược phát quang bay lượn quanh nhà kính số ba. Giáo sư Sprout và Newt Scamander mở hội giao lưu hạt giống và kỷ vật sinh vật quý!',
    hagridLine: 'Hội chợ Thảo dược đang mở hội! Giáo sư Sprout và Newt khen khu vườn của con lắm!',
    milestones: milestones('herb', 'daisy', 'Cúc trắng', ['Túi Hạt Giống Nhà Kính Số Ba', 'Cẩm Nang Chăm Thú Của Newt', 'Cúp Vàng Hội Chợ Thảo Dược']),
  }),
  Object.freeze({
    id: 'event_quidditch_cup',
    art: './v24-art/event-quidditch.webp',
    label: 'Cúp Quidditch & Tiệc Cuối Năm Học',
    shortLabel: '🏆 Cúp Quidditch',
    icon: '🏆',
    badge: 'MÙA HÈ · CÚP NHÀ & CÚP QUIDDITCH',
    season: Object.freeze({start: '06-20', end: '07-03'}),
    recommendedAtmosphere: 'day',
    recommendedWeather: 'clear',
    particleCount: 18,
    particleColors: Object.freeze(['#f5d69a', '#c75b4b', '#71934b']),
    tint: 'rgba(80, 52, 12, 0.06)',
    bannerColor: '#ffc36b',
    description:
      'Cờ bốn nhà bay phấp phới quanh lều bác Hagrid. Năm học sắp hết: chăm vườn thật đều để góp nông sản cho bữa tiệc cuối năm học và mùa Cúp Quidditch!',
    hagridLine: 'Sắp tới tiệc cuối năm học rồi! Bác để dành bí ngô ngon nhất cho Đại Sảnh Đường đấy!',
    milestones: milestones('cup', 'pumpkin', 'Bí ngô', ['Lá Cờ Bốn Nhà', 'Chổi Bay Của Đội Nhà', 'Cúp Nhà Trong Đại Sảnh Đường']),
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
const SEASONAL_EVENTS = HOGWARTS_EVENTS.filter((e) => e.season);

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
  dailyChest: 20,
  postcard: 12,
  shareFloo: 15,
  questClaim: 15,
  moveBuilding: 5,
});

// Free actions (switching themes, rotating, sharing, petting, the crop-care tap,
// moving a plot or pen) only earn festival points a few times per day, and all
// free actions together (with honour-garden visits) at most 20 points a day.
export const FREE_FESTIVAL_ACTIONS_PER_DAY = Object.freeze({rotate: 3, pet: 3, postcard: 1, shareFloo: 1, startTour: 1, care: 3, moveBuilding: 1});

// The rules below are pure functions of a Vietnam day key, so a server can reuse
// them (Phase 4). Asia/Ho_Chi_Minh is UTC+7 all year with no daylight saving.
const VN_OFFSET_MS = 7 * 3600000;
const DAY_MS = 86400000;
export const FESTIVAL_DAYS = 14;
export const FESTIVAL_FARM_POINTS_PER_DAY = 60;
export const FESTIVAL_FREE_POINTS_PER_DAY = 20;
const QUEST_ACTIONS = new Set(['questClaim', 'dailyChest']);
const EVENT_STATE_VERSION = 25;

export function vnDayKey(nowMs = Date.now()) {
  return new Date((Number.isFinite(nowMs) ? nowMs : Date.now()) + VN_OFFSET_MS).toISOString().slice(0, 10);
}

const dayNumber = (key) => Date.parse(`${key}T00:00:00Z`) / DAY_MS;
const dayKeyOf = (n) => new Date(n * DAY_MS).toISOString().slice(0, 10);
const isDayKey = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

/** 'farm' (capped 60/day), 'free' (capped 20/day) or 'quest' (owl quests and chest, already 1/day each). */
export function festivalActionKind(actionType) {
  if (QUEST_ACTIONS.has(actionType)) return 'quest';
  return actionType in FREE_FESTIVAL_ACTIONS_PER_DAY || actionType === 'helpTour' ? 'free' : 'farm';
}

/**
 * The festival running on `dayKey` (Vietnam date) and the next one to open.
 * A save whose `joinDay` falls after a festival's first day gets 14 days from
 * that day for that festival, so new players can still finish their first one.
 */
export function festivalStatus(dayKey, joinDay = '') {
  const today = dayNumber(dayKey);
  const year = Number(dayKey.slice(0, 4));
  const join = isDayKey(joinDay) ? dayNumber(joinDay) : NaN;
  const windows = [];
  for (const y of [year - 1, year, year + 1]) {
    for (const event of SEASONAL_EVENTS) {
      const start = dayNumber(`${y}-${event.season.start}`);
      const end = dayNumber(`${y}-${event.season.end}`);
      const lateJoin = join > start && join <= end;
      windows.push({event, year: y, start, end: lateJoin ? Math.max(end, join + FESTIVAL_DAYS - 1) : end});
    }
  }
  windows.sort((a, b) => a.start - b.start);
  const view = (w) => ({id: w.event.id, event: w.event, year: w.year, seasonKey: `${w.event.id}@${w.year}`, start: dayKeyOf(w.start), end: dayKeyOf(w.end)});
  const current = windows.find((w) => w.start <= today && today <= w.end);
  const next = windows.find((w) => w.start > today);
  return {
    dayKey,
    active: current ? {...view(current), daysLeft: current.end - today + 1} : null,
    next: {...view(next), daysUntil: next.start - today},
  };
}

// Pre-V25 milestones: no season, thresholds 30 / 75 / 150. Rewards a save had
// already earned under those rules stay claimable after the migration.
const legacyReward = (amount, kind, itemId, bonusQty, label, waterBonus) => Object.freeze({kind, amount, ...(waterBonus ? {waterBonus} : {}), itemId, bonusQty, label});
export const LEGACY_MILESTONES = Object.freeze({
  hal_m1: {eventId: 'event_halloween', points: 30, title: 'Giỏ Quà Đêm Hội Ma', reward: legacyReward(15, 'water', 'pumpkin', 4, '+15 Nước tưới & +4 Bí ngô')},
  hal_m2: {eventId: 'event_halloween', points: 75, title: 'Lồng Đèn Phù Thủy Rừng Cấm', reward: legacyReward(8, 'water', 'mandrake', 3, '+8 Nước & +3 Nhân sâm')},
  hal_m3: {eventId: 'event_halloween', points: 150, title: 'Đại Tiệc Bí Ngô Hogwarts', reward: legacyReward(2, 'boost', 'pumpkin', 0, '+2 Nước phép & +32 Nước', 32)},
  yule_m1: {eventId: 'event_yule', points: 30, title: 'Tất Quà Bên Lò Sưởi', reward: legacyReward(15, 'water', 'blueberry', 4, '+15 Nước tưới & +4 Việt quất')},
  yule_m2: {eventId: 'event_yule', points: 75, title: 'Hộp Nhạc Tuyết Bạc', reward: legacyReward(8, 'water', 'moonherb', 3, '+8 Nước & +3 Cỏ trăng')},
  yule_m3: {eventId: 'event_yule', points: 150, title: 'Ngôi Sao Đại Sảnh Đường', reward: legacyReward(2, 'boost', 'starbean', 4, '+2 Nước phép, +20 Nước & +4 Đậu sao', 20)},
  herb_m1: {eventId: 'event_herbology_fair', points: 30, title: 'Túi Hạt Giống Nhà Kính Số Ba', reward: legacyReward(15, 'water', 'clover', 4, '+15 Nước tưới & +4 Cỏ ba lá')},
  herb_m2: {eventId: 'event_herbology_fair', points: 75, title: 'Cẩm Nang Chăm Thú Của Newt', reward: legacyReward(8, 'water', 'insects', 4, '+8 Nước & +4 Côn trùng')},
  herb_m3: {eventId: 'event_herbology_fair', points: 150, title: 'Cúp Vàng Hội Chợ Thảo Dược', reward: legacyReward(2, 'boost', 'sunpetal', 3, '+2 Nước phép, +20 Nước & +3 Hoa nhật quang', 20)},
});

const count = (v) => Math.max(0, Number(v) || 0);
const strings = (list) => (Array.isArray(list) ? [...new Set(list.filter((id) => typeof id === 'string'))] : []);

function legacyPoints(src) {
  const activeEventId = normalizeEventMode(src.activeEventId);
  if (!src.pointsByEvent || typeof src.pointsByEvent !== 'object') return {[activeEventId]: count(src.points)};
  const out = {};
  for (const [id, value] of Object.entries(src.pointsByEvent)) out[normalizeEventMode(id)] = count(value);
  return out;
}

/** Any stored shape (V23, V24, V25 or nothing) → a V25 state for `today` (Vietnam day key). */
export function normalizeEventState(raw, today) {
  const src = raw && typeof raw === 'object' ? raw : null;
  const current = src?.version === EVENT_STATE_VERSION;
  const claimedMilestones = strings(src?.claimedMilestones);
  let legacyClaimable = [];
  if (src && !current) {
    // Old points do not carry into the calendar; milestones they had reached stay claimable.
    const points = legacyPoints(src);
    legacyClaimable = Object.entries(LEGACY_MILESTONES)
      .filter(([id, m]) => (points[m.eventId] || 0) >= m.points && !claimedMilestones.includes(id))
      .map(([id]) => id);
  } else if (current) {
    legacyClaimable = strings(src.legacyClaimable).filter((id) => id in LEGACY_MILESTONES && !claimedMilestones.includes(id));
  }
  const pointsBySeason = {};
  if (current && src.pointsBySeason && typeof src.pointsBySeason === 'object') {
    for (const [key, value] of Object.entries(src.pointsBySeason)) {
      if (/^[a-z_]+@\d{4}$/.test(key)) pointsBySeason[key] = count(value);
    }
  }
  const sameDay = current && src.day === today;
  return {
    version: EVENT_STATE_VERSION,
    // The garden theme; it no longer decides which festival earns points.
    activeEventId: src ? normalizeEventMode(src.activeEventId) : festivalStatus(today, today).active?.id ?? 'none',
    joinDay: isDayKey(src?.joinDay) ? src.joinDay : today,
    pointsBySeason,
    claimedMilestones,
    legacyClaimable,
    day: today,
    farmToday: sameDay ? count(src.farmToday) : 0,
    freeToday: sameDay ? count(src.freeToday) : 0,
    freeCounts: sameDay && src.freeCounts && typeof src.freeCounts === 'object' ? {...src.freeCounts} : {},
  };
}

function withPointViews(state) {
  const active = festivalStatus(state.day, state.joinDay).active;
  state.seasonKey = active?.seasonKey ?? null;
  state.points = active ? state.pointsBySeason[active.seasonKey] || 0 : 0;
  state.totalPoints = Object.values(state.pointsBySeason).reduce((sum, value) => sum + value, 0);
  return state;
}

// Connected play: the server owns festival points, daily caps and claimed milestones.
// `useServerFestival(response)` after every wallet response; only the scene theme stays local.
let serverFestival = null;
export function useServerFestival(response = null) {
  const record = response?.garden?.festival, today = response?.festival?.today, day = response?.daily?.dayKey;
  serverFestival = record && today && isDayKey(day) ? {
    joinDay: record.joinDay,
    pointsBySeason: {...record.pointsBySeason},
    claimedMilestones: [...record.claimedMilestones],
    day,
    farmToday: count(today.farm),
    freeToday: count(today.free),
    freeCounts: Object.fromEntries(Object.entries(response.daily.freeActions || {}).map(([kind, v]) => [kind, count(v?.used)])),
    freeCaps: Object.fromEntries(Object.entries(response.daily.freeActions || {}).map(([kind, v]) => [kind, count(v?.cap)])),
  } : null;
  return serverFestival;
}

export function loadEventState(storage = getGardenStorage(), nowMs = Date.now()) {
  let parsed = null;
  try {
    const raw = storage?.getItem?.(EVENT_STORAGE_KEY);
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    parsed = null;
  }
  if (serverFestival) {
    const local = normalizeEventState(parsed, serverFestival.day);
    return withPointViews({...local, ...structuredClone(serverFestival), legacyClaimable: [], server: true});
  }
  return withPointViews(normalizeEventState(parsed, vnDayKey(nowMs)));
}

export function saveEventState(state, storage = getGardenStorage(), nowMs = Date.now()) {
  if (!state || typeof state !== 'object') return state;
  const {seasonKey, points, totalPoints, ...stored} = normalizeEventState({...state, version: EVENT_STATE_VERSION}, vnDayKey(nowMs));
  void seasonKey; void points; void totalPoints;
  if (typeof storage?.setItem !== 'function') return withPointViews(stored);
  try {
    storage.setItem(EVENT_STORAGE_KEY, JSON.stringify(stored));
  } catch { return null; }
  return withPointViews(stored);
}

/** Pure: adds one action's capped points to the running festival. `state` must be normalized for its day. */
export function applyFestivalAction(state, actionType, customPoints = null) {
  const active = festivalStatus(state.day, state.joinDay).active;
  if (!active) return {state, addedPoints: 0, offSeason: true};
  let delta = customPoints != null ? count(customPoints) : (FESTIVAL_ACTION_POINTS[actionType] ?? 5);
  const kind = festivalActionKind(actionType);
  if (kind === 'free') {
    const limit = FREE_FESTIVAL_ACTIONS_PER_DAY[actionType];
    const used = count(state.freeCounts[actionType]);
    if (limit != null && used >= limit) delta = 0;
    else if (limit != null) state.freeCounts[actionType] = used + 1;
    delta = Math.min(delta, FESTIVAL_FREE_POINTS_PER_DAY - state.freeToday);
    state.freeToday += delta;
  } else if (kind === 'farm') {
    delta = Math.min(delta, FESTIVAL_FARM_POINTS_PER_DAY - state.farmToday);
    state.farmToday += delta;
  }
  state.pointsBySeason[active.seasonKey] = (state.pointsBySeason[active.seasonKey] || 0) + delta;
  return {state: withPointViews(state), addedPoints: delta};
}

export function recordFestivalAction(actionType, customPoints = null, storage = getGardenStorage(), nowMs = Date.now()) {
  if (serverFestival) return {state: loadEventState(storage, nowMs), addedPoints: 0, server: true};
  const result = applyFestivalAction(loadEventState(storage, nowMs), actionType, customPoints);
  if (result.offSeason) return {state: result.state, addedPoints: 0, offSeason: true};
  const saved = saveEventState(result.state, storage, nowMs);
  return {state: saved || result.state, addedPoints: result.addedPoints};
}

/** A claim key is `hal_m1@2026` for a festival season, or a bare legacy id such as `hal_m1`. */
export function festivalMilestone(key) {
  const [id, year, extra] = String(key ?? '').split('@');
  if (extra !== undefined) return null;
  if (year === undefined) {
    const legacy = LEGACY_MILESTONES[id];
    return legacy ? {...legacy, id, key: id, legacy: true, eventLabel: eventConfig(legacy.eventId).label} : null;
  }
  if (!/^\d{4}$/.test(year)) return null;
  for (const e of SEASONAL_EVENTS) {
    const m = e.milestones.find((x) => x.id === id);
    if (m) return {...m, key, eventId: e.id, eventLabel: e.label, seasonKey: `${e.id}@${year}`};
  }
  return null;
}

/** Pure: can `state` claim milestone `key`? */
export function milestoneClaimCheck(state, key) {
  const target = festivalMilestone(key);
  if (!target) return {ok: false, reason: 'NOT_FOUND'};
  if (state.claimedMilestones.includes(target.key)) return {ok: false, reason: 'ALREADY_CLAIMED'};
  if (target.legacy) return state.legacyClaimable.includes(target.key) ? {ok: true, milestone: target} : {ok: false, reason: 'INSUFFICIENT_POINTS'};
  if ((state.pointsBySeason[target.seasonKey] || 0) < target.points) return {ok: false, reason: 'INSUFFICIENT_POINTS'};
  return {ok: true, milestone: target};
}

/** Reached but unclaimed milestones outside the running festival: old-save rewards and ended seasons. */
export function pendingFestivalRewards(state) {
  const out = state.legacyClaimable.map(festivalMilestone).filter(Boolean);
  for (const [seasonKey, points] of Object.entries(state.pointsBySeason)) {
    if (seasonKey === state.seasonKey) continue;
    const [eventId, year] = seasonKey.split('@');
    for (const m of EVENT_MAP.get(eventId)?.milestones ?? []) {
      const key = `${m.id}@${year}`;
      if (points >= m.points && !state.claimedMilestones.includes(key)) out.push(festivalMilestone(key));
    }
  }
  return out;
}

export function claimEventMilestone(milestoneKey, {storage = getGardenStorage(), onGrantReward = null, nowMs = Date.now()} = {}) {
  if (serverFestival) return {ok: false, reason: 'SERVER_OWNED'};
  const state = loadEventState(storage, nowMs);
  const check = milestoneClaimCheck(state, milestoneKey);
  if (!check.ok) return {...check, state};
  const target = check.milestone;
  state.claimedMilestones.push(target.key);
  state.legacyClaimable = state.legacyClaimable.filter((id) => id !== target.key);
  const saved = saveEventState(state, storage, nowMs);
  if (!saved) return {ok: false, reason: 'SAVE_FAILED'};
  if (typeof onGrantReward === 'function') onGrantReward(target.reward, target);
  return {ok: true, milestone: target, reward: target.reward, state: saved};
}

export function hasClaimableEventMilestone(storage = getGardenStorage(), nowMs = Date.now()) {
  const state = loadEventState(storage, nowMs);
  const active = festivalStatus(state.day, state.joinDay).active;
  const now = active
    ? active.event.milestones.some((m) => milestoneClaimCheck(state, `${m.id}@${active.year}`).ok)
    : false;
  return now || pendingFestivalRewards(state).length > 0;
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
    reward: Object.freeze({kind: 'water', amount: 16, label: '+16 Nước'}),
  }),
  Object.freeze({
    level: 4,
    minXp: 100,
    title: 'Tri kỷ Rừng Cấm',
    badge: '💖 Cấp 4',
    hearts: '♥♥♥',
    reward: Object.freeze({kind: 'boost', amount: 1, waterBonus: 8, label: '+1 Nước phép & +8 Nước'}),
  }),
  Object.freeze({
    level: 5,
    minXp: 180,
    title: 'Bạn Tâm Giao Huyền Thoại',
    badge: '👑 Cấp 5',
    hearts: '♥♥♥♥♥',
    reward: Object.freeze({kind: 'boost', amount: 2, waterBonus: 27, label: '+2 Nước phép & +27 Nước'}),
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

// Connected play: the server owns bonding. `useServerBonding(response)` after every wallet
// response; the cards then show `response.bonding` and local counting/claiming stands down.
let serverBonding = null;
export function useServerBonding(response = null) {
  const view = response?.bonding, saved = response?.garden?.bonding;
  serverBonding = view && Array.isArray(view.creatures) ? {view: structuredClone(view), saved: structuredClone(saved || {bySpecies: {}, claimedGifts: []})} : null;
  return serverBonding;
}

export function loadAffinityState(storage = getGardenStorage()) {
  if (serverBonding) return {version: 23, bySpecies: structuredClone(serverBonding.saved.bySpecies || {}), claimedGifts: [...(serverBonding.saved.claimedGifts || [])]};
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
  if (!speciesId || serverBonding) return null;
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
  const fromServer = new Map((serverBonding?.view.creatures || []).map((c) => [c.species, c]));
  const entries = creatures.map((cr) => {
    // Server card for the player's own creatures; a visited garden's other species fall back to the baseline below.
    const card = fromServer.get(cr.species);
    if (card) {
      const {gifts = [], ...info} = card;
      return {...info, claimableGifts: gifts.filter((g) => g.claimable).map(({giftId, level, title, reward}) => ({giftId, level, title, reward}))};
    }
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
  if (serverBonding) return {ok: false, reason: 'SERVER_OWNED'};
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
      stamp: lv > 100 ? `Vườn Cấp 100 ★${lv - 100}` : `Vườn Cấp ${lv}`,
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
          ? `Thật kỳ diệu! Các sinh vật trong vườn quấn quýt với con chẳng kém gì đám Puffskein và Đào mỏ trong chiếc vali của tôi.`
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
        el('h3', {text: 'Lời nhắn từ bạn bè'}),
      ]),
    ]),
  ]);
  const grid = el('div', {class: 'cards guestbook-grid'});
  for (const note of guestbook) {
    grid.append(el('article', {class: 'card guestbook-card', 'data-guestbook-id': note.id}, [
      el('div', {class: 'gp-letter-head'}, [
        el('span', {class: 'gp-seal', 'aria-hidden': 'true'}, [pixelIcon(GUEST_ICONS[note.id] || 'owl', 2)]),
        el('strong', {text: note.author, title: note.role}),
        el('span', {class: 'gp-stamp', text: stripEmoji(note.stamp)}),
      ]),
      el('p', {class: 'gp-letter-text', text: note.message}),
    ]));
  }
  root.append(grid);
  return root;
}

const FREE_TAP_ICONS = Object.freeze({care: ['care', 'Chăm cây'], pet: ['heart', 'Vuốt ve'], rotate: ['scenery', 'Xoay, đổi cảnh'], postcard: ['profile', 'Bưu thiếp'], shareFloo: ['owl', 'Khoe Floo'], startTour: ['home', 'Tham quan'], moveBuilding: ['plot', 'Chuyển thửa']});
const shortDate = (key) => `${key.slice(8, 10)}/${key.slice(5, 7)}`;
const THEME_LABELS = Object.freeze({event_halloween: 'Hội Ma', event_yule: 'Dạ vũ Noel', event_herbology_fair: 'Thảo dược', event_quidditch_cup: 'Quidditch', none: 'Ngày thường'});

const GUEST_ICONS = Object.freeze({note_hagrid: 'home', note_sprout: 'sow', note_newt: 'heart', note_charlie: 'festival'});
const stripEmoji = (text = '') => String(text).replace(/^[^\p{L}\p{N}]+/u, '').trim();

// One stop on the festival reward track: the reward icon is the button, points and chips below.
function milestoneCard({items, ms, key, claimed, ready, label, onClaim, title = null, note = null}) {
  const state = claimed ? ' is-claimed' : ready ? ' is-ready' : ' is-locked';
  return el('div', {class: `event-milestone-card v24-event-milestone gp-track-stop${state}`, 'data-milestone-id': key}, [
    el('button', {
      type: 'button',
      class: `gp-track-node${ready && !claimed ? ' primary' : ''}`,
      disabled: !ready || claimed,
      'data-claim-milestone': key,
      'aria-label': `${label} · ${title ? title + ' · ' : ''}${ms.legacy ? 'Quà cũ' : ms.points + ' điểm'} · ${ms.reward.label}`,
      title: [title, note, ms.reward.label].filter(Boolean).join(' · '),
      onclick: () => onClaim?.(key),
    }, [
      visualItemIcon(items, ms.reward.itemId || ms.reward.kind, {size: 40, kind: ms.reward.kind || ''}),
      claimed ? el('span', {class: 'gp-corner is-done'}, [pixelIcon('check', 1)]) : ready ? null : el('span', {class: 'lock-badge'}, [pixelIcon('lock', 1)]),
    ]),
    el('b', {class: 'gp-track-points', text: ms.legacy ? 'Quà cũ' : String(ms.points)}),
    rewardChips(items, ms.reward),
  ]);
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
  const evtState = loadEventState(storage, nowMs);
  const status = festivalStatus(evtState.day, evtState.joinDay);
  const season = status.active ?? status.next;
  const cfg = season.event;
  const root = el('div', {class: 'v24-events-panel events-panel-root', 'data-events-view': 'true'});

  root.append(el('section', {
    class: 'journey-hero-card event-hero-card v24-event-hero',
    'data-active-event': status.active?.id ?? 'none',
    'data-festival-state': status.active ? 'in-season' : 'off-season',
  }, [
    eventArt(cfg, 'v24-event-hero-art'),
    el('div', {class: 'v24-event-hero-copy'}, [
      el('small', {class: 'journey-kicker', text: status.active ? 'ĐANG DIỄN RA' : 'LỄ HỘI TIẾP THEO'}),
      el('h3', {class: 'v24-event-hero-title', text: cfg.label}),
      el('p', {
        class: 'v24-event-hero-when',
        text: status.active
          ? `${shortDate(season.start)} – ${shortDate(season.end)} · còn ${status.active.daysLeft} ngày`
          : `Mở ngày ${shortDate(season.start)} · còn ${status.next.daysUntil} ngày`,
      }),
    ]),
  ]));

  const maxPoints = cfg.milestones.at(-1).points;
  const points = status.active ? evtState.points : 0;
  const pct = Math.min(100, Math.round((points / maxPoints) * 100));
  const milestoneSec = el('section', {class: 'event-milestones-section v24-event-progress'}, [
    el('div', {class: 'journey-section-head'}, [
      el('div', {}, [el('h3', {class: 'gp-points', text: `${points} / ${maxPoints}`})]),
      status.active ? el('span', {class: 'journey-stage-pill', text: `${pct}%`}) : el('span', {class: 'gp-state', title: 'Lễ hội chưa mở nên chưa tính điểm'}, [pixelIcon('lock', 1), el('span', {text: 'Chưa mở'})]),
    ]),
    status.active ? el('div', {class: 'v24-event-caps gp-chips', title: 'Điểm hôm nay · quà nhiệm vụ cú luôn được tính'}, [
      el('span', {class: 'reward-chip', 'aria-label': `Việc vườn ${evtState.farmToday}/${FESTIVAL_FARM_POINTS_PER_DAY} điểm`}, [pixelIcon('sow', 1), el('b', {text: `${evtState.farmToday}/${FESTIVAL_FARM_POINTS_PER_DAY}`})]),
      el('span', {class: 'reward-chip', 'aria-label': `Việc khác ${evtState.freeToday}/${FESTIVAL_FREE_POINTS_PER_DAY} điểm`}, [pixelIcon('heart', 1), el('b', {text: `${evtState.freeToday}/${FESTIVAL_FREE_POINTS_PER_DAY}`})]),
    ]) : null,
  ]);
  // Server play: today's free taps as icons with used/cap; a full one dims.
  if (evtState.server && evtState.freeCaps) {
    milestoneSec.append(el('div', {class: 'v24-free-caps', role: 'group', 'aria-label': 'Thao tác miễn phí hôm nay'},
      Object.entries(FREE_TAP_ICONS).filter(([kind]) => evtState.freeCaps[kind]).map(([kind, [px, label]]) => {
        const used = evtState.freeCounts[kind] || 0, cap = evtState.freeCaps[kind];
        return el('span', {class: `v24-free-cap${used >= cap ? ' is-full' : ''}`, 'data-free-kind': kind, title: `${label} ${used}/${cap}`, 'aria-label': `${label} ${used}/${cap}`}, [pixelIcon(px, 1), el('b', {text: `${used}/${cap}`})]);
      })));
  }
  // The bar runs from the first stop to the last; stops sit evenly, so fill each gap by its own points.
  const [p1, p2, p3] = cfg.milestones.map((m) => m.points);
  const fill = points <= p1 ? 0 : points <= p2 ? ((points - p1) / (p2 - p1)) * 50 : Math.min(100, 50 + ((points - p2) / (p3 - p2)) * 50);
  const mGrid = el('div', {class: 'event-milestones-grid v24-event-milestones gp-track', style: `--fill:${Math.round(fill)}`});
  for (const ms of cfg.milestones) {
    const key = `${ms.id}@${season.year}`;
    const claimed = evtState.claimedMilestones.includes(key);
    const ready = Boolean(status.active) && points >= ms.points;
    mGrid.append(milestoneCard({
      items, ms, key, claimed, ready,
      label: claimed ? 'Đã nhận' : ready ? 'Nhận' : status.active ? 'Chưa đủ' : 'Chưa mở',
      onClaim: onClaimEventMilestone,
    }));
  }
  milestoneSec.append(mGrid);
  root.append(milestoneSec);

  const pending = pendingFestivalRewards(evtState);
  if (pending.length) {
    const grid = el('div', {class: 'event-milestones-grid v24-event-milestones gp-track is-pending'});
    for (const ms of pending) {
      grid.append(milestoneCard({items, ms, key: ms.key, claimed: false, ready: true, label: 'Nhận', onClaim: onClaimEventMilestone, title: ms.title, note: ms.eventLabel}));
    }
    root.append(el('section', {class: 'event-milestones-section v24-event-pending', 'data-festival-pending': String(pending.length)}, [
      el('div', {class: 'journey-section-head'}, [el('div', {}, [el('h3', {text: 'Quà lễ hội chưa nhận'})])]),
      grid,
    ]));
  }

  const activeTheme = eventConfig(eventMode || evtState.activeEventId);
  const selection = el('div', {
    class: 'v24-event-selection event-theme-switcher',
    role: 'group',
    'aria-label': 'Chọn cảnh lễ hội',
  });
  for (const ev of HOGWARTS_EVENTS) {
    const label = THEME_LABELS[ev.id];
    const apply = () => {
      if (typeof onApplyEventTheme === 'function') onApplyEventTheme(ev);
      else onSelectEvent?.(ev.id);
    };
    const choice = button('', apply, {
      class: `v24-event-choice journey-tab-btn${ev.id === activeTheme.id ? ' primary' : ''}`,
      'aria-label': label,
      'aria-pressed': String(ev.id === activeTheme.id),
      'data-select-event': ev.id,
      'data-apply-event-theme': ev.id,
    });
    choice.append(eventArt(ev, 'v24-event-choice-art'), el('span', {class: 'v24-event-choice-label', text: label}));
    selection.append(choice);
  }
  root.append(el('section', {class: 'v24-event-themes'}, [
    el('div', {class: 'journey-section-head'}, [
      el('div', {}, [
        el('h3', {text: 'Cảnh lễ hội', title: 'Chỉ đổi cảnh trong vườn, không đổi lễ hội đang tính điểm.'}),
      ]),
    ]),
    selection,
  ]));
  return root;
}
