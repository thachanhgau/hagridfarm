import {getGardenStorage} from './garden-storage.mjs';
import {el, button} from './ui-utils.mjs?v=24.9.18';
import {atmosphereConfig, weatherConfig} from './garden-atmosphere.mjs?v=24.9.18';

export const TOUR_STORAGE_KEY = 'hpvn-garden-v22-tour';

export function dateKeyFor(nowMs = Date.now()) {
  const d = new Date(Number.isFinite(nowMs) ? nowMs : Date.now());
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const HONOR_GARDENS = Object.freeze([
  Object.freeze({
    id: 'tour_sprout',
    ownerName: 'Giáo sư Pomona Sprout',
    keeperTitle: '🌿 Nghệ Nhân Thảo Dược',
    badge: 'NHÀ KÍNH SỐ 3 · HUFFLEPUFF',
    title: 'Vườn Thảo Dược Nhà Kính Số 3',
    subtitle: 'Cấp 45 · Chương 3/6 · 6 Thửa thảo dược quý & Bowtruckle',
    description:
      'Khu vườn mẫu mực của Chủ nhiệm Nhà Hufflepuff với các luống Nhân sâm, Bạch tiên, Puffapod, Cỏ trăng và Lanh xếp đối xứng dưới lá thu vàng Rừng Cấm.',
    level: 45,
    atmosphereMode: 'day',
    weatherMode: 'autumn',
    crops: Object.freeze([
      [0, [0, 1, 2], 'mandrake', true],
      [0, [3, 4, 5], 'dittany', true],
      [0, [6, 7, 8], 'puffapod', true],
      [1, [0, 1, 2], 'moonherb', true],
      [1, [3, 4, 5], 'flax', true],
      [1, [6, 7, 8], 'clover', false],
      [2, [0, 1, 2], 'pumpkin', true],
      [2, [3, 4, 5], 'daisy', true],
      [3, [0, 4, 8], 'mandrake', true],
      [4, [2, 4, 6], 'dittany', true],
      [5, [0, 1, 2], 'moonherb', false],
    ]),
    creatures: Object.freeze([
      {species: 'puffskein', adult: true, facing: 'default'},
      {species: 'bowtruckle', adult: true, facing: 'right'},
      {species: 'niffler', adult: true, facing: 'default'},
      {species: 'mooncalf', adult: true, facing: 'right'},
      {species: 'kneazle', adult: false, facing: 'right'},
    ]),
    keepsakes: Object.freeze({
      puffskein: 3,
      bowtruckle: 4,
      niffler: 2,
      mooncalf: 2,
    }),
    storePlacements: Object.freeze([
      'decor_mandrake_planter',
      'decor_pumpkin_lantern',
      'decor_cauldron',
      'decor_vine_arch',
      null,
      null,
    ]),
    storeRotations: Object.freeze({
      decor_mandrake_planter: 'right',
      decor_pumpkin_lantern: 'default',
      decor_cauldron: 'right',
      decor_vine_arch: 'default',
    }),
    reward: Object.freeze({
      kind: 'water',
      amount: 8,
      itemId: 'mandrake',
      bonusQty: 2,
      label: '+8 Nước tưới & +2 Nhân sâm',
    }),
  }),
  Object.freeze({
    id: 'tour_newt',
    ownerName: 'Newt Scamander',
    keeperTitle: '🦄 Hộ Vệ Kỳ Lân',
    badge: 'VALI KỲ THÚ · KHU BẢO TỒN',
    title: 'Khu Bảo Tồn Sinh Vật Kỳ Thú',
    subtitle: 'Cấp 78 · Chương 5/6 · 9 Thửa đất & 8 Sinh vật huyền bí',
    description:
      'Không gian mở rộng tới rừng rậm với Bằng-Mã, Vong mã, Fwooper, Diricawl, Kneazle và Mooncalf được chăm sóc chu đáo dưới làn mưa phùn thảo dược.',
    level: 78,
    atmosphereMode: 'dusk',
    weatherMode: 'rain',
    crops: Object.freeze([
      [0, [0, 1, 2], 'starbean', true],
      [0, [3, 4, 5], 'silverkelp', true],
      [1, [0, 1, 2], 'ambermelon', true],
      [1, [3, 4, 5], 'valerian', true],
      [2, [0, 1, 2], 'sunflower', true],
      [2, [6, 7, 8], 'blueberry', true],
      [3, [0, 4, 8], 'firepepper', true],
      [4, [0, 1, 2], 'moonherb', true],
      [5, [3, 4, 5], 'mint', true],
    ]),
    creatures: Object.freeze([
      {species: 'puffskein', adult: true, facing: 'right'},
      {species: 'bowtruckle', adult: true, facing: 'default'},
      {species: 'niffler', adult: true, facing: 'right'},
      {species: 'mooncalf', adult: true, facing: 'default'},
      {species: 'kneazle', adult: true, facing: 'right'},
      {species: 'diricawl', adult: true, facing: 'default'},
      {species: 'fwooper', adult: true, facing: 'right'},
      {species: 'hippogriff', adult: true, facing: 'default'},
      {species: 'thestral', adult: true, facing: 'right'},
    ]),
    keepsakes: Object.freeze({
      puffskein: 2,
      bowtruckle: 3,
      niffler: 4,
      mooncalf: 3,
      kneazle: 2,
      diricawl: 2,
      fwooper: 2,
      hippogriff: 3,
      thestral: 1,
    }),
    storePlacements: Object.freeze([
      'decor_broom_rack',
      'decor_floating_candles',
      'decor_vine_arch',
      'decor_mandrake_planter',
      'decor_cauldron',
      'decor_pumpkin_lantern',
    ]),
    storeRotations: Object.freeze({
      decor_broom_rack: 'right',
      decor_floating_candles: 'default',
      decor_vine_arch: 'right',
      decor_mandrake_planter: 'default',
      decor_cauldron: 'right',
      decor_pumpkin_lantern: 'right',
    }),
    reward: Object.freeze({
      kind: 'water',
      amount: 10,
      itemId: 'insects',
      bonusQty: 4,
      label: '+10 Nước tưới & +4 Côn trùng',
    }),
  }),
  Object.freeze({
    id: 'tour_charlie',
    ownerName: 'Charlie Weasley',
    keeperTitle: '🐉 Đại Quản Gia Rừng Cấm',
    badge: 'ĐẠI KHU VƯỜN CẤP 100 · ROMANIA',
    title: 'Đại Khu Bảo Tồn Rồng & Bờ Hồ Đen',
    subtitle: 'Cấp 100 · Chương 6/6 · Trọn 12 Thửa, 12 Sinh vật & 12 Đài Kỷ Vật',
    description:
      'Đỉnh cao Đại khu vườn cấp 100 dưới đêm tuyết rơi Hogwarts: Rồng, Chó ba đầu, Kỳ lân, Bằng-Mã và toàn bộ 12 đài kỷ vật tỏa sáng dọc lối đi phía Nam.',
    level: 100,
    atmosphereMode: 'night',
    weatherMode: 'snow',
    crops: Object.freeze([
      [0, [0, 1, 2], 'sunpetal', true],
      [0, [3, 4, 5], 'firepepper', true],
      [0, [6, 7, 8], 'mistmushroom', true],
      [1, [0, 1, 2], 'ambermelon', true],
      [1, [3, 4, 5], 'starbean', true],
      [2, [0, 1, 2], 'silverkelp', true],
      [2, [3, 4, 5], 'moonherb', true],
      [3, [0, 4, 8], 'sunpetal', true],
      [4, [2, 4, 6], 'mandrake', true],
      [5, [0, 1, 2], 'blueberry', true],
      [6, [3, 4, 5], 'valerian', true],
      [7, [0, 1, 2], 'sunflower', true],
    ]),
    creatures: Object.freeze([
      {species: 'puffskein', adult: true, facing: 'default'},
      {species: 'bowtruckle', adult: true, facing: 'right'},
      {species: 'niffler', adult: true, facing: 'default'},
      {species: 'mooncalf', adult: true, facing: 'right'},
      {species: 'kneazle', adult: true, facing: 'default'},
      {species: 'diricawl', adult: true, facing: 'right'},
      {species: 'fwooper', adult: true, facing: 'default'},
      {species: 'hippogriff', adult: true, facing: 'right'},
      {species: 'thestral', adult: true, facing: 'default'},
      {species: 'unicorn', adult: true, facing: 'right'},
      {species: 'three-headed-dog', adult: true, facing: 'default'},
      {species: 'dragon', adult: true, facing: 'right'},
    ]),
    keepsakes: Object.freeze({
      puffskein: 5,
      bowtruckle: 4,
      niffler: 5,
      mooncalf: 3,
      kneazle: 3,
      diricawl: 3,
      fwooper: 4,
      hippogriff: 5,
      thestral: 3,
      unicorn: 4,
      'three-headed-dog': 3,
      dragon: 5,
    }),
    storePlacements: Object.freeze([
      'decor_floating_candles',
      'decor_vine_arch',
      'decor_pumpkin_lantern',
      'decor_broom_rack',
      'decor_cauldron',
      'decor_mandrake_planter',
    ]),
    storeRotations: Object.freeze({
      decor_floating_candles: 'right',
      decor_vine_arch: 'default',
      decor_pumpkin_lantern: 'right',
      decor_broom_rack: 'default',
      decor_cauldron: 'right',
      decor_mandrake_planter: 'right',
    }),
    reward: Object.freeze({
      kind: 'kit',
      amount: 2,
      itemId: 'firepepper',
      bonusQty: 2,
      label: '+2 Bộ vật liệu & +2 Ớt lửa',
    }),
  }),
]);

export function getHonorGarden(tourId) {
  return HONOR_GARDENS.find((g) => g.id === tourId) || HONOR_GARDENS[0];
}

export function buildHonorGardenSnapshot(tourId, E, nowMs = Date.now()) {
  const tour = getHonorGarden(tourId);
  const state = E.testProfile(tour.level, nowMs);

  if (tour.level >= 100 && !state.built.includes('plot_12')) {
    state.built.push('plot_12');
    state.plots.push({
      slots: Array(9).fill(null),
      cooldowns: Array(9).fill(0),
      patterns: [],
    });
  }

  for (const [plotIdx, cells, cropId, mature] of tour.crops) {
    const spec = E.CROP?.[cropId];
    if (!spec || !state.plots[plotIdx]) continue;
    const plantedAt = mature
      ? nowMs - spec.growMs - 3600000
      : nowMs - Math.floor(spec.growMs * 0.45);
    for (const cell of cells) {
      state.plots[plotIdx].slots[cell] = {
        id: `tour-${tour.id}-p${plotIdx}-s${cell}`,
        type: 'crop',
        species: cropId,
        plantedAt,
        growMs: spec.growMs,
      };
    }
  }

  const maxSpots = E.housingCapacity(state);
  const creatureFacings = {};
  for (const item of tour.creatures) {
    const spec = E.CREATURE?.[item.species];
    if (!spec || state.creatures.length >= maxSpots) continue;
    creatureFacings[item.species] = item.facing === 'right' ? 'right' : 'default';
    state.creatures.push({
      id: `tour-${tour.id}-cr-${item.species}`,
      type: 'creature',
      species: item.species,
      level: spec.level,
      adoptedAt: nowMs - 72 * 3600000,
      mealsCompleted: item.adult ? spec.mealsToAdult : Math.max(1, Math.floor(spec.mealsToAdult / 2)),
      meal: null,
      cyclesClaimed: item.adult ? 2 : 0,
      preview: false,
    });
  }

  const decorationRotations = {};
  for (let i = 0; i < E.DB.decorations.length; i += 1) {
    const dec = E.DB.decorations[i];
    if (dec.level <= tour.level && !state.decorations.includes(dec.id)) {
      state.decorations.push(dec.id);
      decorationRotations[dec.id] = i % 2 === 1 ? 'right' : 'default';
    }
  }

  for (const [species, count] of Object.entries(tour.keepsakes || {})) {
    if (species in state.keepsakes) {
      state.keepsakes[species] = count;
    }
  }

  const decorations = {
    owned: tour.storePlacements.filter(Boolean),
    placements: [...tour.storePlacements],
    rotations: {...tour.storeRotations},
  };

  return {
    tour,
    state,
    decorations,
    decorationRotations,
    creatureFacings,
    atmosphereMode: tour.atmosphereMode,
    weatherMode: tour.weatherMode,
  };
}

export function loadTourProgress(storage = getGardenStorage(), nowMs = Date.now()) {
  const today = dateKeyFor(nowMs);
  const defaults = {dateKey: today, helpedIds: []};
  if (!storage || typeof storage.getItem !== 'function') return defaults;
  try {
    const raw = storage.getItem(TOUR_STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.dateKey !== today || !Array.isArray(parsed.helpedIds)) {
      return defaults;
    }
    return {
      dateKey: today,
      helpedIds: parsed.helpedIds.filter((id) => typeof id === 'string'),
    };
  } catch {
    return defaults;
  }
}

export function saveTourProgress(progress, storage = getGardenStorage()) {
  if (!storage || typeof storage.setItem !== 'function') return progress;
  try {
    storage.setItem(TOUR_STORAGE_KEY, JSON.stringify(progress));
  } catch {}
  return progress;
}

export function helpHonorGarden(tourId, {
  storage = getGardenStorage(),
  nowMs = Date.now(),
  onReward,
} = {}) {
  const tour = getHonorGarden(tourId);
  const progress = loadTourProgress(storage, nowMs);
  if (progress.helpedIds.includes(tour.id)) {
    return {ok: false, alreadyHelped: true, tour, progress};
  }
  const next = {
    dateKey: progress.dateKey,
    helpedIds: [...progress.helpedIds, tour.id],
  };
  saveTourProgress(next, storage);
  if (typeof onReward === 'function') {
    onReward(tour.reward, tour);
  }
  return {
    ok: true,
    alreadyHelped: false,
    reward: tour.reward,
    tour,
    progress: next,
  };
}

export function renderTourSection({
  activeTourId = null,
  onStartTour,
  onStopTour,
  onHelpTour,
  storage = getGardenStorage(),
  nowMs = Date.now(),
} = {}) {
  const progress = loadTourProgress(storage, nowMs);
  const root = el('div', {class: 'tour-panel-root'});

  const hero = el('section', {class: 'journey-hero-card tour-hero-card'}, [
    el('div', {class: 'journey-hero-main'}, [
      el('div', {class: 'journey-medal-seal'}, [
        el('small', {text: 'THAM QUAN'}),
        el('b', {text: `${HONOR_GARDENS.length}`}),
      ]),
      el('div', {class: 'journey-hero-copy'}, [
        el('small', {class: 'journey-kicker', text: 'VƯỜN DANH DỰ'}),
        el('h3', {
          text: activeTourId
            ? `Đang ghé thăm: ${getHonorGarden(activeTourId).ownerName}`
            : 'Thăm vườn',
        }),
        el('p', {
          text: 'Chăm giúp · nhận quà mỗi ngày.',
        }),
      ]),
    ]),
    ...(activeTourId && typeof onStopTour === 'function'
      ? [
          el('div', {class: 'actions'}, [
            button('Về vườn', () => onStopTour(), {
              class: 'primary',
              'data-stop-tour': 'true',
            }),
          ]),
        ]
      : []),
  ]);
  root.append(hero);

  const list = el('div', {class: 'cards tour-cards-grid'});
  for (const tour of HONOR_GARDENS) {
    const isVisiting = activeTourId === tour.id;
    const helped = progress.helpedIds.includes(tour.id);
    const atmo = atmosphereConfig(tour.atmosphereMode);
    const weather = weatherConfig(tour.weatherMode);

    const card = el('article', {
      class: `card tour-garden-card${isVisiting ? ' is-visiting' : ''}`,
      'data-tour-id': tour.id,
    }, [
      el('div', {class: 'tour-card-top'}, [
        el('span', {class: 'journey-stage-badge', text: `Cấp ${tour.level}`}),
        el('span', {
          class: 'almanac-status-pill is-ready',
          text: `${atmo.shortLabel} · ${weather.shortLabel}`,
        }),
      ]),
      el('strong', {class: 'tour-card-title', text: tour.ownerName}),
      el('small', {class: 'tour-card-keeper', text: `Cấp ${tour.level}`}),
      el('details', {}, [el('summary', {text:'Về khu vườn'}), el('p', {text:tour.description})]),
      el('div', {class: 'tour-reward-pill'}, [
        el('span', {text: tour.reward.label}),
        el('b', {text: helped ? 'Đã nhận' : ''}),
      ]),
    ]);

    const btnRow = el('div', {class: 'actions'});
    if (isVisiting) {
      btnRow.append(
        button('Về vườn', () => onStopTour?.(), {
          'data-stop-tour': 'true',
        }),
      );
    } else {
      btnRow.append(
        button('Ghé thăm', () => onStartTour?.(tour.id), {
          class: 'primary',
          'data-start-tour': tour.id,
        }),
      );
    }
    btnRow.append(
      button(
        helped ? 'Đã giúp' : 'Chăm giúp',
        () => onHelpTour?.(tour.id),
        {
          disabled: helped,
          'data-help-tour': tour.id,
        },
      ),
    );
    card.append(btnRow);
    list.append(card);
  }
  root.append(list);
  return root;
}
