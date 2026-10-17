import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import * as E from './progression-engine.mjs';
import {
  HOGWARTS_EVENTS,
  normalizeEventMode,
  eventConfig,
  nextEventMode,
  loadEventState,
  recordFestivalAction,
  claimEventMilestone,
  hasClaimableEventMilestone,
  computeEventParticles,
  drawEventOverlay,
  CREATURE_AFFINITY_LEVELS,
  affinityLevelForXp,
  recordCreatureAffinity,
  evaluateCreatureAffinity,
  claimAffinityGift,
  buildGuestbookEntries,
} from './garden-events.mjs';
import {
  loadOwlQuests,
  saveOwlQuests,
  allDailyTasks,
  dailyCompletionSummary,
  recordOwlQuestAction,
  syncQuestsWithGardenState,
  claimDailyGrandChest,
  DAILY_GRAND_CHEST_REWARD,
} from './garden-quests.mjs';
import {hagridSpeechFor, atmosphereConfig, weatherConfig} from './garden-atmosphere.mjs';
import {extractPostcardMeta} from './garden-postcard.mjs';
import {
  loadVisualPrefs,
  saveVisualPrefs,
  createHpvnBridge,
  createHpvnHostBridge,
  auditIos16SourceCompatibility,
} from './hpvn-bridge.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function createMemoryStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  };
}

test('V23.0 Hogwarts Seasonal Festivals cycle, persist, and grant 3-tier milestone rewards', () => {
  assert.equal(HOGWARTS_EVENTS.length, 4);
  assert.equal(normalizeEventMode('event_yule'), 'event_yule');
  assert.equal(normalizeEventMode('invalid'), 'event_halloween');

  assert.equal(nextEventMode('event_halloween'), 'event_yule');
  assert.equal(nextEventMode('event_yule'), 'event_herbology_fair');
  assert.equal(nextEventMode('event_herbology_fair'), 'none');
  assert.equal(nextEventMode('none'), 'event_halloween');

  const storage = createMemoryStorage();
  const initial = loadEventState(storage);
  assert.equal(initial.activeEventId, 'event_halloween');
  assert.equal(initial.points, 35);
  assert.equal(hasClaimableEventMilestone(storage), true); // 35 >= 30 for hal_m1

  let granted = null;
  const claim1 = claimEventMilestone('hal_m1', {
    storage,
    onGrantReward: (reward) => {
      granted = reward;
    },
  });
  assert.equal(claim1.ok, true);
  assert.equal(granted.kind, 'water');
  assert.equal(granted.bonusQty, 4);

  // Duplicate claim blocked
  const dup = claimEventMilestone('hal_m1', {storage});
  assert.equal(dup.ok, false);
  assert.equal(dup.reason, 'ALREADY_CLAIMED');

  // Insufficient points for tier 2 (75 pts)
  const early = claimEventMilestone('hal_m2', {storage});
  assert.equal(early.ok, false);
  assert.equal(early.reason, 'INSUFFICIENT_POINTS');

  // Record festival actions to reach tier 2
  recordFestivalAction('dailyChest', 50, storage);
  const updated = loadEventState(storage);
  assert.equal(updated.points, 85);
  const claim2 = claimEventMilestone('hal_m2', {storage});
  assert.equal(claim2.ok, true);
});

test('V23.0 Festival particles & Hagrid festival speech work deterministically', () => {
  const halParticles = computeEventParticles('event_halloween', 1200);
  assert.equal(halParticles.length, 22);
  const yuleParticles = computeEventParticles('event_yule', 1200);
  assert.equal(yuleParticles.length, 26);
  const herbParticles = computeEventParticles('event_herbology_fair', 1200);
  assert.equal(herbParticles.length, 20);
  const noneParticles = computeEventParticles('none', 1200);
  assert.equal(noneParticles.length, 0);

  let fillRectCalls = 0;
  const mockCtx = {
    save() {},
    restore() {},
    fillRect() {
      fillRectCalls += 1;
    },
  };
  const res = drawEventOverlay(mockCtx, 2400, 1500, {eventMode: 'event_halloween', clock: 500});
  assert.equal(res.eventMode, 'event_halloween');
  assert.equal(res.particles, 22);
  assert.ok(fillRectCalls > 22);

  const line = hagridSpeechFor({}, {atmosphereMode: 'night', weatherMode: 'autumn', eventMode: 'event_halloween'});
  assert.ok(line.includes('Bí ngô'));
});

test('V23.0 Daily Tasks include 5 tasks, consecutive streak counter, and Grand Owl Chest', () => {
  const storage = createMemoryStorage();
  const day1 = new Date('2026-10-14T09:00:00Z').getTime();
  let qState = loadOwlQuests(storage, day1);
  assert.equal(qState.quests.length, 3);
  assert.equal(qState.bonusQuests.length, 2);
  assert.equal(allDailyTasks(qState).length, 5);
  assert.equal(qState.streakDays, 1);
  saveOwlQuests(qState, storage);

  // Cannot claim Grand Chest before 3 tasks are completed
  const earlyChest = claimDailyGrandChest({storage, nowMs: day1});
  assert.equal(earlyChest.ok, false);
  assert.equal(earlyChest.claimed, false);

  // Complete 3 tasks (plant -> quest_hagrid_harvest, craft -> quest_sprout_craft, helpTour -> quest_neighbor_tour)
  recordOwlQuestAction('plant', 1, storage, day1);
  recordOwlQuestAction('craft', 1, storage, day1);
  recordOwlQuestAction('helpTour', 1, storage, day1);
  qState = loadOwlQuests(storage, day1);

  const summary = dailyCompletionSummary(qState);
  assert.equal(summary.completedCount, 3);
  assert.equal(summary.totalCount, 5);
  assert.equal(summary.grandReady, true);

  let chestReward = null;
  const chestRes = claimDailyGrandChest({
    storage,
    nowMs: day1,
    onGrantReward: (r) => {
      chestReward = r;
    },
  });
  assert.equal(chestRes.ok, true);
  assert.equal(chestRes.claimed, true);
  assert.equal(chestReward.label, DAILY_GRAND_CHEST_REWARD.label);
  assert.equal(chestReward.eventPoints, 50);

  // Next consecutive day increments streakDays to 2
  const day2 = new Date('2026-10-15T09:00:00Z').getTime();
  const nextDayState = loadOwlQuests(storage, day2);
  assert.equal(nextDayState.streakDays, 2);
  assert.equal(nextDayState.grandChestClaimed, false);

  // Lifetime garden progress must not complete a new day.
  const synced = syncQuestsWithGardenState(nextDayState, E.testProfile(50, day2), day2, {
    helpedGardensCount: 2,
    eventPoints: 60,
  });
  const syncedSummary = dailyCompletionSummary(synced);
  assert.equal(syncedSummary.completedCount, 0);
});

test('V23.0 Creature Affinity 5-Heart Bonding system levels up and grants creature gifts', () => {
  assert.equal(CREATURE_AFFINITY_LEVELS.length, 5);
  assert.equal(affinityLevelForXp(0).level, 1);
  assert.equal(affinityLevelForXp(25).level, 2);
  assert.equal(affinityLevelForXp(60).level, 3);
  assert.equal(affinityLevelForXp(120).level, 4);
  assert.equal(affinityLevelForXp(200).level, 5);

  const storage = createMemoryStorage();
  const gameState = E.adopt(E.testProfile(30, Date.now()), 'puffskein', Date.now());
  assert.ok(gameState.creatures.length > 0);
  const firstSpecies = gameState.creatures[0].species;

  // Pet creature twice to reach >= 20 XP (12 + 12 = 24 XP -> Level 2)
  recordCreatureAffinity(firstSpecies, 'pet', storage);
  const secondPet = recordCreatureAffinity(firstSpecies, 'pet', storage);
  assert.equal(secondPet.info.level, 2);
  assert.equal(secondPet.pets, 2);

  const evalSummary = evaluateCreatureAffinity(gameState, storage);
  assert.ok(evalSummary.totalAffinityLevels >= gameState.creatures.length);
  const spEntry = evalSummary.bySpeciesMap.get(firstSpecies);
  assert.ok(spEntry.claimableGifts.some((g) => g.giftId === `${firstSpecies}:lv2`));

  let giftReward = null;
  const claimRes = claimAffinityGift(`${firstSpecies}:lv2`, {
    gameState,
    storage,
    onGrantReward: (r) => {
      giftReward = r;
    },
  });
  assert.equal(claimRes.ok, true);
  assert.equal(giftReward.kind, 'water');

  // Cannot claim same gift twice
  const dupClaim = claimAffinityGift(`${firstSpecies}:lv2`, {gameState, storage});
  assert.equal(dupClaim.ok, false);
  assert.equal(dupClaim.reason, 'ALREADY_CLAIMED');
});

test('V23.0 Visitor Guestbook, Postcard & HPVN Bridge support eventMode and totalAffinity', async () => {
  const gameState = E.testProfile(100, Date.now());
  const notes = buildGuestbookEntries({
    gameState,
    eventMode: 'event_yule',
    helpedCount: 3,
    totalAffinity: 25,
  });
  assert.equal(notes.length, 4);
  assert.equal(notes[0].author, 'Rubeus Hagrid');
  assert.ok(notes[0].message.includes('Giáng sinh'));

  // Visual prefs persistence with eventMode
  const storage = createMemoryStorage();
  saveVisualPrefs({atmosphereMode: 'night', weatherMode: 'snow', eventMode: 'event_yule'}, storage);
  const loadedPrefs = loadVisualPrefs(storage);
  assert.equal(loadedPrefs.eventMode, 'event_yule');

  // Postcard metadata includes eventLabel and totalAffinity
  const meta = extractPostcardMeta({
    state: gameState,
    atmosphere: atmosphereConfig('night'),
    weather: weatherConfig('snow'),
    event: eventConfig('event_yule'),
    playerName: 'Harry',
    keeperTitle: '👑 Đại Phù Thủy Khu Vườn',
    totalAffinity: 30,
  });
  assert.equal(meta.eventLabel, '🎄 Dạ vũ Noel');
  assert.equal(meta.totalAffinity, 30);

  // Host <-> Iframe bridge supports setEvent
  const postedToIframe = [];
  const postedToParent = [];
  let currentEvent = 'event_halloween';

  const fakeIframeWindow = {
    listeners: [],
    addEventListener(type, fn) {
      if (type === 'message') this.listeners.push(fn);
    },
    removeEventListener() {},
    postMessage(msg) {
      postedToIframe.push(msg);
      for (const fn of this.listeners) fn({data: msg});
    },
  };
  const fakeHostWindow = {
    listeners: [],
    addEventListener(type, fn) {
      if (type === 'message') this.listeners.push(fn);
    },
    removeEventListener() {},
    postMessage(msg) {
      postedToParent.push(msg);
      for (const fn of this.listeners) fn({data: msg});
    },
  };
  fakeIframeWindow.parent = fakeHostWindow;

  const gardenBridge = createHpvnBridge({
    win: fakeIframeWindow,
    getState: () => gameState,
    getEvent: () => eventConfig(currentEvent),
    onSetEvent: (mode) => {
      currentEvent = eventConfig(mode).id;
    },
  });

  const hostBridge = createHpvnHostBridge({
    win: fakeHostWindow,
    iframe: {contentWindow: fakeIframeWindow},
  });

  hostBridge.setEvent('event_herbology_fair');
  assert.equal(currentEvent, 'event_herbology_fair');

  const flooMsg = await gardenBridge.shareGardenToFloo({
    state: gameState,
    event: eventConfig(currentEvent),
    totalAffinity: 28,
  });
  assert.equal(flooMsg.envelope.source, 'hpvn-hagrid-garden');
  assert.ok(flooMsg.text.includes('Hội chợ Thảo dược'));
  assert.ok(flooMsg.text.includes('♥ Gắn kết 28'));
});

test('V23.0 iOS Safari 16.0+ compatibility across all .mjs modules', () => {
  const dirs = [__dirname, path.resolve(__dirname, '../qa-v19')];
  for (const dir of dirs) {
    for (const entry of fs.readdirSync(dir)) {
      if (!entry.endsWith('.mjs')) continue;
      const fullPath = path.join(dir, entry);
      const code = fs.readFileSync(fullPath, 'utf8');
      const audit = auditIos16SourceCompatibility(code);
      assert.equal(audit.compatible, true, `${entry} failed iOS 16 audit: ${audit.issues.join(', ')}`);
    }
  }
});
