import {getGardenStorage} from './garden-storage.mjs';
import {el, button} from './ui-utils.mjs?v=24.9.26';

export const ACHIEVEMENTS_STORAGE_KEY = 'hpvn-garden-v22-achievements';

export const KEEPER_ACHIEVEMENTS = Object.freeze([
  Object.freeze({
    id: 'ach_sprout_apprentice',
    icon: '🌱',
    title: 'Tập Sự Thảo Dược',
    badge: '🌱 Tập Sự Thảo Dược',
    category: 'Khởi đầu',
    description: 'Khởi đầu hành trình chăm sóc những thửa đất đầu tiên bên lều bác Hagrid.',
    reward: Object.freeze({kind: 'water', amount: 8, itemId: 'pumpkin', bonusQty: 3, label: '+8 Nước tưới & +3 Bí ngô'}),
    check(state) {
      const level = Number(state?.level) || 1;
      return {unlocked: level >= 1, current: Math.min(1, level), target: 1, progressText: 'Mở sẵn từ Cấp 1'};
    },
  }),
  Object.freeze({
    id: 'ach_creature_friend',
    icon: '🐾',
    title: 'Bạn Thân Sinh Vật',
    badge: '🐾 Bạn Thân Sinh Vật',
    category: 'Sinh vật',
    description: 'Đón nuôi ít nhất 2 loài sinh vật huyền bí về khu vườn Rừng Cấm.',
    reward: Object.freeze({kind: 'water', amount: 10, itemId: 'puff_feed', bonusQty: 3, label: '+10 Nước tưới & +3 Khẩu phần'}),
    check(state) {
      const count = Array.isArray(state?.creatures) ? state.creatures.length : 0;
      return {unlocked: count >= 2, current: Math.min(2, count), target: 2, progressText: `${count}/2 loài sinh vật`};
    },
  }),
  Object.freeze({
    id: 'ach_herbology_artisan',
    icon: '🌿',
    title: 'Nghệ Nhân Thảo Dược',
    badge: '🌿 Nghệ Nhân Thảo Dược',
    category: 'Cây trồng',
    description: 'Đạt Cấp 24 (mở khóa Nhân sâm) hoặc mở rộng từ 5 thửa đất trở lên.',
    reward: Object.freeze({kind: 'water', amount: 12, itemId: 'mandrake', bonusQty: 2, label: '+12 Nước tưới & +2 Nhân sâm'}),
    check(state) {
      const level = Number(state?.level) || 1;
      const plots = Array.isArray(state?.plots) ? state.plots.length : 3;
      const unlocked = level >= 24 || plots >= 5;
      return {unlocked, current: Math.min(24, level), target: 24, progressText: `Cấp ${level}/24 · ${plots}/5 thửa`};
    },
  }),
  Object.freeze({
    id: 'ach_master_brewer',
    icon: '⚗',
    title: 'Bậc Thầy Chế Biến',
    badge: '⚗ Bậc Thầy Chế Biến',
    category: 'Chế biến',
    description: 'Đạt Cấp 35 hoặc tích trữ ít nhất 20 đơn vị vật tư & khẩu phần trong kho.',
    reward: Object.freeze({kind: 'kit', amount: 2, itemId: 'insects', bonusQty: 4, label: '+2 Bộ vật liệu & +4 Côn trùng'}),
    check(state) {
      const level = Number(state?.level) || 1;
      const invTotal = state?.inventory && typeof state.inventory === 'object'
        ? Object.values(state.inventory).reduce((a, b) => a + (Number(b) || 0), 0)
        : 0;
      const unlocked = level >= 35 || invTotal >= 20;
      return {unlocked, current: Math.min(20, invTotal), target: 20, progressText: `Kho ${invTotal}/20 món · Cấp ${level}/35`};
    },
  }),
  Object.freeze({
    id: 'ach_forest_architect',
    icon: '🏡',
    title: 'Kiến Trúc Sư Rừng Cấm',
    badge: '🏡 Kiến Trúc Sư Rừng Cấm',
    category: 'Công trình',
    description: 'Mở rộng khu vườn đạt từ 7 thửa đất trở lên (Chương 4: Bìa rừng mở lối).',
    reward: Object.freeze({kind: 'kit', amount: 3, itemId: 'kit', bonusQty: 3, label: '+3 Bộ vật liệu xây dựng'}),
    check(state) {
      const plots = Array.isArray(state?.plots) ? state.plots.length : 3;
      return {unlocked: plots >= 7, current: Math.min(7, plots), target: 7, progressText: `${plots}/7 thửa đất`};
    },
  }),
  Object.freeze({
    id: 'ach_landscape_artist',
    icon: '✨',
    title: 'Nghệ Sĩ Cảnh Quan',
    badge: '✨ Nghệ Sĩ Cảnh Quan',
    category: 'Cảnh quan',
    description: 'Sở hữu ít nhất 4 vật phẩm trang trí lối đi hoặc vật phẩm Tiệm Hẻm Xéo.',
    reward: Object.freeze({kind: 'water', amount: 15, itemId: 'flax', bonusQty: 3, label: '+15 Nước tưới & +3 Lanh'}),
    check(state, extra = {}) {
      const earned = Array.isArray(state?.decorations) ? state.decorations.length : 0;
      const storeOwned = Array.isArray(extra?.decorations?.owned) ? extra.decorations.owned.length : 0;
      const total = earned + storeOwned;
      return {unlocked: total >= 4, current: Math.min(4, total), target: 4, progressText: `${total}/4 vật phẩm trang trí`};
    },
  }),
  Object.freeze({
    id: 'ach_keepsake_curator',
    icon: '🏆',
    title: 'Người Giữ Kỷ Vật',
    badge: '🏆 Người Giữ Kỷ Vật',
    category: 'Bộ sưu tập',
    description: 'Sưu tầm và trưng bày ít nhất 3 Kỷ vật sinh vật trên bệ đá lối đi phía Nam.',
    reward: Object.freeze({kind: 'kit', amount: 2, itemId: 'moonherb', bonusQty: 2, label: '+2 Bộ vật liệu & +2 Cỏ trăng'}),
    check(state) {
      const keepsakes = state?.keepsakes && typeof state.keepsakes === 'object'
        ? Object.values(state.keepsakes).reduce((a, b) => a + (Number(b) || 0), 0)
        : 0;
      return {unlocked: keepsakes >= 3, current: Math.min(3, keepsakes), target: 3, progressText: `${keepsakes}/3 kỷ vật`};
    },
  }),
  Object.freeze({
    id: 'ach_hippogriff_rider',
    icon: '🦅',
    title: 'Kỵ Sĩ Bằng-Mã',
    badge: '🦅 Kỵ Sĩ Bằng-Mã',
    category: 'Sinh vật',
    description: 'Đạt Cấp 66 hoặc đón Bằng-Mã kiêu hãnh về chăm sóc trong khu vườn.',
    reward: Object.freeze({kind: 'water', amount: 15, itemId: 'fish', bonusQty: 4, label: '+15 Nước tưới & +4 Cá nhỏ'}),
    check(state) {
      const level = Number(state?.level) || 1;
      const hasHippo = Array.isArray(state?.creatures) && state.creatures.some((c) => c.species === 'hippogriff');
      const unlocked = level >= 66 || hasHippo;
      return {unlocked, current: Math.min(66, level), target: 66, progressText: hasHippo ? 'Đã đón Bằng-Mã' : `Cấp ${level}/66`};
    },
  }),
  Object.freeze({
    id: 'ach_unicorn_guardian',
    icon: '🦄',
    title: 'Hộ Vệ Kỳ Lân',
    badge: '🦄 Hộ Vệ Kỳ Lân',
    category: 'Sinh vật',
    description: 'Đạt Cấp 82 hoặc đón Kỳ lân bờm bạc về dưới vòm cây Rừng Cấm.',
    reward: Object.freeze({kind: 'water', amount: 18, itemId: 'starbean', bonusQty: 3, label: '+18 Nước tưới & +3 Đậu sao'}),
    check(state) {
      const level = Number(state?.level) || 1;
      const hasUnicorn = Array.isArray(state?.creatures) && state.creatures.some((c) => c.species === 'unicorn');
      const unlocked = level >= 82 || hasUnicorn;
      return {unlocked, current: Math.min(82, level), target: 82, progressText: hasUnicorn ? 'Đã đón Kỳ lân' : `Cấp ${level}/82`};
    },
  }),
  Object.freeze({
    id: 'ach_dragon_tamer',
    icon: '🐉',
    title: 'Bậc Thầy Luyện Rồng',
    badge: '🐉 Bậc Thầy Luyện Rồng',
    category: 'Huyền thoại',
    description: 'Đạt Cấp 94 hoặc chăm sóc Rồng và Chó ba đầu trong khu bảo tồn.',
    reward: Object.freeze({kind: 'kit', amount: 3, itemId: 'firepepper', bonusQty: 3, label: '+3 Bộ vật liệu & +3 Ớt lửa'}),
    check(state) {
      const level = Number(state?.level) || 1;
      const hasDragon = Array.isArray(state?.creatures) && state.creatures.some((c) => c.species === 'dragon');
      const unlocked = level >= 94 || hasDragon;
      return {unlocked, current: Math.min(94, level), target: 94, progressText: hasDragon ? 'Đã đón Rồng' : `Cấp ${level}/94`};
    },
  }),
  Object.freeze({
    id: 'ach_forest_envoy',
    icon: '🦉',
    title: 'Sứ Giả Rừng Cấm',
    badge: '🦉 Sứ Giả Rừng Cấm',
    category: 'Cộng đồng',
    description: 'Ghé thăm chăm giúp khu vườn bạn bè hoặc đạt Cấp 50+ trên hành trình.',
    reward: Object.freeze({kind: 'water', amount: 12, itemId: 'sunflower', bonusQty: 3, label: '+12 Nước tưới & +3 Hướng dương'}),
    check(state, extra = {}) {
      const level = Number(state?.level) || 1;
      const helpedCount = Number(extra?.helpedGardensCount) || 0;
      const unlocked = helpedCount >= 1 || level >= 50;
      return {
        unlocked,
        current: helpedCount >= 1 ? 1 : Math.min(50, level),
        target: helpedCount >= 1 ? 1 : 50,
        progressText: helpedCount >= 1 ? `Đã chăm giúp ${helpedCount} vườn` : `Chăm giúp 1 vườn mẫu hoặc đạt Cấp 50`,
      };
    },
  }),
  Object.freeze({
    id: 'ach_grand_keeper',
    icon: '👑',
    title: 'Đại Quản Gia Rừng Cấm',
    badge: '👑 Đại Quản Gia Rừng Cấm',
    category: 'Đỉnh cao',
    description: 'Chinh phục mốc Cấp 100 · Mở khóa toàn vẹn 6 chương Đại khu vườn Hagrid.',
    reward: Object.freeze({kind: 'kit', amount: 5, itemId: 'sunpetal', bonusQty: 3, label: '+5 Bộ vật liệu & +3 Hoa nhật quang'}),
    check(state) {
      const level = Number(state?.level) || 1;
      return {unlocked: level >= 100, current: Math.min(100, level), target: 100, progressText: `Cấp ${level}/100`};
    },
  }),
]);

export function loadAchievementPrefs(storage = getGardenStorage()) {
  const defaults = {
    selectedTitleId: 'ach_sprout_apprentice',
    claimedIds: [],
  };
  if (!storage || typeof storage.getItem !== 'function') return defaults;
  try {
    const raw = storage.getItem(ACHIEVEMENTS_STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return defaults;
    return {
      selectedTitleId: typeof parsed.selectedTitleId === 'string' ? parsed.selectedTitleId : defaults.selectedTitleId,
      claimedIds: Array.isArray(parsed.claimedIds) ? parsed.claimedIds.filter((id) => typeof id === 'string') : [],
    };
  } catch {
    return defaults;
  }
}

export function saveAchievementPrefs(prefs = {}, storage = getGardenStorage()) {
  const normalized = {
    selectedTitleId: typeof prefs.selectedTitleId === 'string' ? prefs.selectedTitleId : 'ach_sprout_apprentice',
    claimedIds: Array.isArray(prefs.claimedIds) ? prefs.claimedIds.filter((id) => typeof id === 'string') : [],
  };
  if (!storage || typeof storage.setItem !== 'function') return normalized;
  try {
    storage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(normalized));
  } catch {}
  return normalized;
}

export function evaluateAchievements(state = {}, extra = {}, storage = getGardenStorage()) {
  const prefs = loadAchievementPrefs(storage);
  const items = KEEPER_ACHIEVEMENTS.map((ach) => {
    const status = ach.check(state, extra);
    const claimed = prefs.claimedIds.includes(ach.id);
    const selected = prefs.selectedTitleId === ach.id;
    return {
      ...ach,
      unlocked: Boolean(status.unlocked),
      current: status.current,
      target: status.target,
      progressText: status.progressText,
      claimed,
      selected,
    };
  });

  const unlockedList = items.filter((i) => i.unlocked);
  let activeTitle = items.find((i) => i.id === prefs.selectedTitleId && i.unlocked);
  if (!activeTitle) {
    activeTitle = unlockedList[unlockedList.length - 1] || items[0];
  }

  return {
    items,
    unlockedCount: unlockedList.length,
    totalCount: items.length,
    activeTitle,
    selectedTitleId: activeTitle.id,
  };
}

export function selectKeeperTitle(achId, {
  state = {},
  extra = {},
  storage = getGardenStorage(),
} = {}) {
  const summary = evaluateAchievements(state, extra, storage);
  const target = summary.items.find((i) => i.id === achId);
  if (!target || !target.unlocked) {
    return {ok: false, reason: 'LOCKED', summary};
  }
  const prefs = loadAchievementPrefs(storage);
  saveAchievementPrefs({...prefs, selectedTitleId: target.id}, storage);
  const updated = evaluateAchievements(state, extra, storage);
  return {ok: true, title: target, summary: updated};
}

export function claimAchievementReward(achId, {
  state = {},
  extra = {},
  storage = getGardenStorage(),
  onReward,
} = {}) {
  const summary = evaluateAchievements(state, extra, storage);
  const target = summary.items.find((i) => i.id === achId);
  if (!target || !target.unlocked) {
    return {ok: false, reason: 'LOCKED', summary};
  }
  if (target.claimed) {
    return {ok: false, reason: 'ALREADY_CLAIMED', summary};
  }
  const prefs = loadAchievementPrefs(storage);
  saveAchievementPrefs({
    ...prefs,
    claimedIds: [...prefs.claimedIds, target.id],
  }, storage);
  if (typeof onReward === 'function') {
    onReward(target.reward, target);
  }
  const updated = evaluateAchievements(state, extra, storage);
  return {ok: true, reward: target.reward, achievement: target, summary: updated};
}

export function renderAchievementsSection({
  state = {},
  extra = {},
  storage = getGardenStorage(),
  onSelectTitle,
  onClaimReward,
  onOpenPostcard,
} = {}) {
  const summary = evaluateAchievements(state, extra, storage);
  const root = el('div', {class: 'achievements-panel-root'});

  const hero = el('section', {class: 'journey-hero-card achievements-hero-card'}, [
    el('div', {class: 'journey-hero-main'}, [
      el('div', {class: 'journey-medal-seal'}, [
        el('small', {text: 'DANH HIỆU'}),
        el('b', {text: `${summary.unlockedCount}/${summary.totalCount}`}),
      ]),
      el('div', {class: 'journey-hero-copy'}, [
        el('small', {class: 'journey-kicker', text: 'THÀNH TỰU'}),
        el('h3', {text: summary.activeTitle.badge}),
        el('p', {
          text: 'Chọn danh hiệu để đeo.',
        }),
      ]),
    ]),
    ...(typeof onOpenPostcard === 'function'
      ? [
          el('div', {class: 'actions'}, [
            button('Bưu thiếp', () => onOpenPostcard(), {
              class: 'primary',
              'data-open-postcard': 'true',
            }),
          ]),
        ]
      : []),
  ]);
  root.append(hero);

  const grid = el('div', {class: 'cards achievements-grid'});
  for (const ach of summary.items) {
    const isEquipped = summary.activeTitle.id === ach.id;
    const card = el('article', {
      class: `card achievement-card${ach.unlocked ? ' is-unlocked' : ' locked'}${isEquipped ? ' is-equipped' : ''}`,
      'data-achievement-id': ach.id,
    }, [
      el('div', {class: 'tour-card-top'}, [
        el('span', {class: 'journey-stage-badge', text: ach.category}),
        el('span', {
          class: `almanac-status-pill ${ach.unlocked ? 'is-ready' : 'is-locked'}`,
          text: isEquipped ? '✦ Đang đeo' : ach.unlocked ? '✓ Đã mở khóa' : '🔒 Chưa mở',
        }),
      ]),
      el('strong', {class: 'tour-card-title', text: `${ach.icon} ${ach.title}`}),
      el('small', {class: 'tour-card-keeper', text: ach.progressText}),
      el('details', {}, [el('summary', {text:'Điều kiện'}), el('p', {text:ach.description})]),
      el('div', {class: 'tour-reward-pill'}, [
        el('span', {text: ach.reward.label}),
        el('b', {text: ach.claimed ? '✓ Đã nhận' : ach.unlocked ? '✦ Sẵn sàng' : 'Chờ mở khóa'}),
      ]),
    ]);

    const btnRow = el('div', {class: 'actions'});
    btnRow.append(
      button(
        isEquipped ? 'Đang đeo' : ach.unlocked ? 'Đeo' : 'Chưa mở khóa',
        () => onSelectTitle?.(ach.id),
        {
          class: isEquipped ? '' : 'primary',
          disabled: !ach.unlocked || isEquipped,
          'data-equip-title': ach.id,
        },
      ),
    );
    if (ach.unlocked && !ach.claimed) {
      btnRow.append(
        button('Nhận', () => onClaimReward?.(ach.id), {
          'data-claim-achievement': ach.id,
        }),
      );
    }
    card.append(btnRow);
    grid.append(card);
  }
  root.append(grid);
  return root;
}
