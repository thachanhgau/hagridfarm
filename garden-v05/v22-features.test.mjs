import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import * as E from './progression-engine.mjs';
import {
  WEATHER_MODES,
  normalizeWeatherMode,
  weatherConfig,
  nextWeatherMode,
  computeWeatherParticles,
  drawWeatherOverlay,
  hagridSpeechFor,
} from './garden-atmosphere.mjs';
import {
  HONOR_GARDENS,
  buildHonorGardenSnapshot,
  loadTourProgress,
  helpHonorGarden,
} from './garden-tour.mjs';
import {
  KEEPER_ACHIEVEMENTS,
  evaluateAchievements,
  selectKeeperTitle,
  claimAchievementReward,
} from './garden-achievements.mjs';
import {
  loadVisualPrefs,
  saveVisualPrefs,
  formatFlooShareMessage,
  createHpvnBridge,
  createHpvnHostBridge,
  auditIos16SourceCompatibility,
} from './hpvn-bridge.mjs';
import { extractPostcardMeta } from './garden-postcard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function createMemoryStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  };
}

test('V22.0 Direction 1: Curated Honor Gardens & Daily Neighbor Care Rewards', () => {
  assert.equal(HONOR_GARDENS.length, 3);
  const now = Date.UTC(2026, 9, 14, 12, 0, 0);

  const sproutSnap = buildHonorGardenSnapshot('tour_sprout', E, now);
  assert.equal(sproutSnap.tour.ownerName, 'Giáo sư Pomona Sprout');
  assert.equal(sproutSnap.state.level, 45);
  assert.equal(sproutSnap.atmosphereMode, 'day');
  assert.equal(sproutSnap.weatherMode, 'autumn');
  assert.ok(sproutSnap.state.creatures.length >= 4);

  const newtSnap = buildHonorGardenSnapshot('tour_newt', E, now);
  assert.equal(newtSnap.tour.ownerName, 'Newt Scamander');
  assert.equal(newtSnap.state.level, 78);
  assert.equal(newtSnap.atmosphereMode, 'dusk');
  assert.equal(newtSnap.weatherMode, 'rain');
  assert.ok(newtSnap.state.creatures.length >= 8);

  const charlieSnap = buildHonorGardenSnapshot('tour_charlie', E, now);
  assert.equal(charlieSnap.tour.ownerName, 'Charlie Weasley');
  assert.equal(charlieSnap.state.level, 100);
  assert.equal(charlieSnap.state.plots.length, 12);
  assert.equal(charlieSnap.state.creatures.length, 12);
  assert.equal(charlieSnap.atmosphereMode, 'night');
  assert.equal(charlieSnap.weatherMode, 'snow');
  assert.equal(Object.values(charlieSnap.state.keepsakes).filter((v) => v > 0).length, 12);

  const storage = createMemoryStorage();
  let rewarded = null;
  const firstHelp = helpHonorGarden('tour_sprout', {
    storage,
    nowMs: now,
    onReward: (r) => {
      rewarded = r;
    },
  });
  assert.equal(firstHelp.ok, true);
  assert.equal(firstHelp.alreadyHelped, false);
  assert.equal(rewarded.itemId, 'mandrake');

  const duplicateHelp = helpHonorGarden('tour_sprout', { storage, nowMs: now });
  assert.equal(duplicateHelp.ok, false);
  assert.equal(duplicateHelp.alreadyHelped, true);

  const prog = loadTourProgress(storage, now);
  assert.deepEqual(prog.helpedIds, ['tour_sprout']);
});

test('V22.0 Direction 2: Weather & Magical Season Particle System', () => {
  assert.equal(WEATHER_MODES.length, 4);
  assert.equal(normalizeWeatherMode('RAIN'), 'rain');
  assert.equal(normalizeWeatherMode('unknown'), 'clear');

  assert.equal(nextWeatherMode('clear'), 'rain');
  assert.equal(nextWeatherMode('rain'), 'autumn');
  assert.equal(nextWeatherMode('autumn'), 'snow');
  assert.equal(nextWeatherMode('snow'), 'clear');

  const rainParticles = computeWeatherParticles('rain', 1200, { left: 0, right: 800, top: 0, bottom: 600 });
  assert.equal(rainParticles.length, weatherConfig('rain').particleCount);
  assert.equal(rainParticles[0].kind, 'rain');

  const autumnParticles = computeWeatherParticles('autumn', 1200, { left: 0, right: 800, top: 0, bottom: 600 });
  assert.equal(autumnParticles.length, weatherConfig('autumn').particleCount);
  assert.equal(autumnParticles[0].kind, 'autumn');

  const snowParticles = computeWeatherParticles('snow', 1200, { left: 0, right: 800, top: 0, bottom: 600 });
  assert.equal(snowParticles.length, weatherConfig('snow').particleCount);
  assert.equal(snowParticles[0].kind, 'snow');

  let rectDraws = 0;
  const mockCtx = {
    save() {},
    restore() {},
    fillRect() {
      rectDraws += 1;
    },
  };
  const drawn = drawWeatherOverlay(mockCtx, 800, 600, { weatherMode: 'snow', clock: 500 });
  assert.equal(drawn.weatherMode, 'snow');
  assert.equal(drawn.particles, weatherConfig('snow').particleCount);
  assert.ok(rectDraws > 20);

  const snowSpeech = hagridSpeechFor({ level: 50 }, { weatherMode: 'snow' });
  assert.ok(snowSpeech.includes('Tuyết'));
});

test('V22.0 Direction 3: Keeper Achievements, Equipable Titles & Postcard Stamp', () => {
  assert.equal(KEEPER_ACHIEVEMENTS.length, 12);
  const storage = createMemoryStorage();
  const lv1State = E.newGame(Date.now());
  const eval1 = evaluateAchievements(lv1State, {}, storage);
  assert.equal(eval1.unlockedCount, 1);
  assert.equal(eval1.activeTitle.id, 'ach_sprout_apprentice');

  const lockedSelect = selectKeeperTitle('ach_grand_keeper', { state: lv1State, storage });
  assert.equal(lockedSelect.ok, false);

  const lv100State = buildHonorGardenSnapshot('tour_charlie', E, Date.now()).state;
  const eval100 = evaluateAchievements(lv100State, { helpedGardensCount: 2 }, storage);
  assert.equal(eval100.unlockedCount, 12);

  const selectGrand = selectKeeperTitle('ach_grand_keeper', {
    state: lv100State,
    extra: { helpedGardensCount: 2 },
    storage,
  });
  assert.equal(selectGrand.ok, true);
  assert.equal(selectGrand.title.badge, '👑 Đại Quản Gia Rừng Cấm');

  let claimedReward = null;
  const claimRes = claimAchievementReward('ach_grand_keeper', {
    state: lv100State,
    extra: { helpedGardensCount: 2 },
    storage,
    onReward: (r) => {
      claimedReward = r;
    },
  });
  assert.equal(claimRes.ok, true);
  assert.equal(claimedReward.itemId, 'sunpetal');

  const duplicateClaim = claimAchievementReward('ach_grand_keeper', {
    state: lv100State,
    extra: { helpedGardensCount: 2 },
    storage,
  });
  assert.equal(duplicateClaim.ok, false);

  const postcardMeta = extractPostcardMeta({
    state: lv100State,
    playerName: 'Harry',
    keeperTitle: selectGrand.title.badge,
    weather: weatherConfig('snow'),
  });
  assert.equal(postcardMeta.keeperTitle, '👑 Đại Quản Gia Rừng Cấm');
  assert.equal(postcardMeta.weatherLabel, '❄ Tuyết rơi');
});

test('V22.0 Direction 4: Host-Iframe Bridge Adapter & iOS Safari 16 Compatibility', async () => {
  const storage = createMemoryStorage();
  saveVisualPrefs({ atmosphereMode: 'night', weatherMode: 'snow' }, storage);
  const prefs = loadVisualPrefs(storage);
  assert.equal(prefs.atmosphereMode, 'night');
  assert.equal(prefs.weatherMode, 'snow');

  const flooText = formatFlooShareMessage({
    state: { level: 100, plots: Array(12).fill({}), creatures: Array(12).fill({}) },
    stageName: 'Đại khu vườn & Bờ Hồ Đen',
    atmosphereMode: 'night',
    weatherMode: 'snow',
    keeperTitle: '👑 Đại Quản Gia Rừng Cấm',
  });
  assert.ok(flooText.includes('👑 Đại Quản Gia Rừng Cấm'));
  assert.ok(flooText.includes('Tuyết rơi'));

  // Simulate bidirectional postMessage between Host Shell and Garden Iframe
  const hostListeners = [];
  const gardenListeners = [];
  const fakeHostWin = {
    addEventListener: (type, fn) => {
      if (type === 'message') hostListeners.push(fn);
    },
    removeEventListener: () => {},
    postMessage: (data) => {
      for (const fn of hostListeners) fn({ data });
    },
  };
  const fakeGardenWin = {
    parent: fakeHostWin,
    addEventListener: (type, fn) => {
      if (type === 'message') gardenListeners.push(fn);
    },
    removeEventListener: () => {},
    postMessage: (data) => {
      for (const fn of gardenListeners) fn({ data });
    },
  };

  let gardenAtmo = 'day';
  let gardenWeather = 'clear';
  let gardenTourId = null;
  let hostReceivedFloo = null;

  const gardenBridge = createHpvnBridge({
    win: fakeGardenWin,
    onSetAtmosphere: (m) => {
      gardenAtmo = m;
    },
    onSetWeather: (w) => {
      gardenWeather = w;
    },
    onStartTour: (id) => {
      gardenTourId = id;
    },
    onStopTour: () => {
      gardenTourId = null;
    },
    getState: () => ({ level: 88, plots: [1, 2, 3] }),
    getKeeperTitle: () => '🦄 Hộ Vệ Kỳ Lân',
  });

  const hostBridge = createHpvnHostBridge({
    win: fakeHostWin,
    targetWindow: fakeGardenWin,
    onShareFloo: (payload) => {
      hostReceivedFloo = payload;
    },
  });

  hostBridge.setAtmosphere('dusk');
  hostBridge.setWeather('autumn');
  hostBridge.tourGarden('tour_newt');
  assert.equal(gardenAtmo, 'dusk');
  assert.equal(gardenWeather, 'autumn');
  assert.equal(gardenTourId, 'tour_newt');

  await gardenBridge.shareToFloo();
  assert.ok(hostReceivedFloo);
  assert.equal(hostReceivedFloo.keeperTitle, '🦄 Hộ Vệ Kỳ Lân');

  // Verify iOS Safari 16 compatibility on all .mjs files in garden-v05
  const files = fs.readdirSync(__dirname).filter((f) => f.endsWith('.mjs'));
  for (const file of files) {
    const content = fs.readFileSync(path.join(__dirname, file), 'utf8');
    const res = auditIos16SourceCompatibility(content);
    assert.equal(res.compatible, true, `${file} failed iOS 16 audit: ${res.issues.join(', ')}`);
  }
});
