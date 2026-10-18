import test from 'node:test';
import assert from 'node:assert/strict';
import {createFixtureServer} from '../qa-v19/fixture-wallet.mjs';
import {createGardenClient} from './garden-emulator-client.mjs';
import {serverRefusal} from './ui-utils.mjs';
import {useServerDaily, loadOwlQuests, recordOwlQuestAction, claimOwlQuest, OWL_QUEST_STORAGE_KEY} from './garden-quests.mjs';
import {useServerFestival, loadEventState, recordFestivalAction, claimEventMilestone, EVENT_STORAGE_KEY} from './garden-events.mjs';
import {createGardenStorage} from './garden-storage.mjs';

// Phase 4 (reconcile doc 8.1–8.2): connected play uses the server's daily rules. The fixture
// wallet stands in for performHagridGardenAction; these pin the shapes the prototype relies on.
const memory = () => {const m = new Map(); return {getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v))};};
const HALLOWEEN = '2026-10-25';
const fixture = (options = {}) => {
  const server = createFixtureServer({simulate: true, day: HALLOWEEN, ...options});
  return {server, client: createGardenClient(async (name, data) => server.handle(name, data))};
};
const reasonOf = async promise => {try {await promise;} catch (e) {return e.reason;} return 'resolved';};

test('connected claims: quest, chest and festival milestone come from server commands and responses', async () => {
  const {client} = fixture({quests: 'done', points: 100});
  const first = await client.read();
  assert.equal(first.dayKey, HALLOWEEN);
  assert.equal(first.daily.quests.length, 3);
  assert.equal(first.daily.chest.ready, true);
  assert.equal(first.festival.active.seasonKey, 'event_halloween@2026');
  const water = first.garden.supplies.water;
  for (const q of first.daily.quests) {
    const snap = await client.act({action: 'claimQuest', questId: q.id});
    assert.equal(snap.receipt.questId, q.id);
    assert.equal(snap.receipt.festivalPoints, 15);
  }
  const afterQuests = client.snapshot;
  assert.equal(afterQuests.garden.supplies.water, water + first.daily.quests.reduce((n, q) => n + q.reward.amount, 0));
  assert.ok(afterQuests.daily.quests.every(q => q.claimed));
  const chest = await client.act({action: 'claimChest'});
  assert.equal(chest.receipt.festivalPoints, 20);
  assert.equal(chest.daily.chest.claimed, true);
  assert.equal(chest.garden.supplies.boost, first.garden.supplies.boost + 1);
  assert.equal(chest.festival.active.points, 100 + 45 + 20);
  const milestone = await client.act({action: 'claimFestival', milestoneKey: 'hal_m1@2026'});
  assert.deepEqual(milestone.receipt.reward.kind, 'water');
  assert.ok(milestone.garden.festival.claimedMilestones.includes('hal_m1@2026'));
  assert.equal(milestone.festival.active.milestones[0].claimed, true);
  assert.equal(await reasonOf(client.act({action: 'claimFestival', milestoneKey: 'hal_m2@2026'})), 'festival-incomplete');
  assert.equal(await reasonOf(client.act({action: 'claimFestival', milestoneKey: 'hal_m1'})), 'festival-not-found');
});

test('a retried claim with the same requestId replays its receipt; a new requestId is refused', async () => {
  const {server} = fixture({quests: 'done'});
  const snap = server.handle('getHagridGarden', {});
  const questId = snap.daily.quests[0].id;
  const command = {action: 'claimQuest', questId, expectedRevision: snap.garden.progression.revision, requestId: 'tap-1'};
  const once = server.handle('performHagridGardenAction', command);
  const twice = server.handle('performHagridGardenAction', command);
  assert.deepEqual(twice.receipt, once.receipt);
  assert.equal(twice.garden.supplies.water, once.garden.supplies.water, 'replay pays nothing');
  assert.equal(twice.garden.progression.revision, once.garden.progression.revision);
  assert.throws(() => server.handle('performHagridGardenAction', {...command, questId: 'q_harvest'}), e => e.reason === 'request-id-conflict');
  assert.throws(() => server.handle('performHagridGardenAction', {...command, expectedRevision: once.garden.progression.revision, requestId: 'tap-2'}), e => e.reason === 'already-claimed');
});

test('a lost claim response is retried with the same requestId and claims once', async () => {
  const server = createFixtureServer({quests: 'done'});
  let lose = true;
  const sent = [];
  const client = createGardenClient(async (name, data) => {
    const result = server.handle(name, data);
    if (name === 'performHagridGardenAction') {sent.push(data.requestId); if (lose) {lose = false; throw Error('response lost after commit');}}
    return result;
  });
  const first = await client.read();
  await assert.rejects(client.act({action: 'claimChest'}), /response lost/);
  const snap = await client.act({action: 'claimChest'});
  assert.equal(sent.length, 2);
  assert.equal(sent[0], sent[1]);
  assert.equal(snap.garden.supplies.boost, first.garden.supplies.boost + 1);
  assert.equal(snap.daily.chest.claimed, true);
});

test('builds check crops before Galleons and debit Galleons once per requestId', () => {
  const short = createFixtureServer({simulate: true, scenario: 'missing', galleons: 0});
  const base = short.handle('getHagridGarden', {});
  const build = {action: 'build', expansionId: 'plot_12', expectedRevision: base.garden.progression.revision};
  assert.throws(() => short.handle('performHagridGardenAction', {...build, requestId: 'b0'}), e => e.reason === 'missing-crops' && /not enough \w+/.test(e.details.detail));

  const poor = createFixtureServer({simulate: true, galleons: 100});
  const before = poor.handle('getHagridGarden', {});
  assert.throws(() => poor.handle('performHagridGardenAction', {...build, requestId: 'b1'}), e => e.reason === 'insufficient-galleons' && e.details.required === 750);
  const unchanged = poor.handle('getHagridGarden', {});
  assert.deepEqual(unchanged.garden, before.garden);
  assert.deepEqual(unchanged.wallet, before.wallet);
  assert.equal(poor.ledger.length, 0);

  const rich = createFixtureServer({simulate: true});
  const start = rich.handle('getHagridGarden', {});
  const paid = rich.handle('performHagridGardenAction', {...build, requestId: 'b2'});
  const again = rich.handle('performHagridGardenAction', {...build, requestId: 'b2'});
  assert.equal(paid.receipt.galleons, 750);
  assert.equal(paid.wallet.spendable, start.wallet.spendable - 750);
  assert.equal(again.wallet.spendable, paid.wallet.spendable);
  assert.deepEqual(rich.ledger.map(row => [row.requestId, row.amount, row.reasonCode]), [['b2', 750, 'garden_build']]);
});

test('free taps stop counting at their cap, festival free points stop at 20, placing counts as rotate', () => {
  const {server} = fixture();
  let snap = server.handle('getHagridGarden', {});
  const tap = (kind, id) => server.handle('performHagridGardenAction', {action: 'freeAction', kind, expectedRevision: 0, requestId: id}).receipt;
  assert.deepEqual([1, 2, 3, 4].map(i => tap('pet', 'c' + i).freeAction.counted), [true, true, true, false]);
  for (const [i, kind] of ['postcard', 'shareFloo'].entries()) tap(kind, 'f' + i);
  snap = server.handle('getHagridGarden', {});
  assert.equal(snap.daily.freeActions.pet.used, 3);
  // «Chăm cây» is its own `care` action (it ripens crops); a bare care tap is refused.
  assert.throws(() => tap('care', 'c-bare'), e => e.reason === 'invalid-action-input');
  assert.equal(snap.festival.today.free, 20);
  assert.throws(() => tap('moveBuilding', 'm1'), e => e.reason === 'invalid-action-input');
  const rev = snap.garden.progression.revision;
  const placed = server.handle('performHagridGardenAction', {action: 'placeDecoration', itemId: 'decor_pumpkin_lantern', slot: null, expectedRevision: rev, requestId: 'p1'});
  assert.equal(placed.receipt.freeAction.kind, 'rotate');
  assert.equal(placed.daily.freeActions.rotate.used, 1);
  assert.throws(() => server.handle('performHagridGardenAction', {action: 'placeDecoration', itemId: 'decor_pumpkin_lantern', slot: null, expectedRevision: rev + 1, requestId: 'p2'}), e => e.reason === 'action-noop');
});

test('fixture day keys follow Asia/Ho_Chi_Minh, not the device clock', () => {
  const late = Date.parse('2026-10-18T17:30:00Z'); // 00:30 on 19/10 in Vietnam
  const server = createFixtureServer({now: () => late});
  assert.equal(server.handle('getHagridGarden', {}).dayKey, '2026-10-19');
});

test('server daily/festival switch: loads read the response, local counting and claiming stand down', () => {
  const storage = memory();
  const {server} = fixture({quests: 'done', points: 120});
  const snap = server.handle('getHagridGarden', {});
  try {
    useServerDaily(snap.daily);
    useServerFestival(snap);
    const quests = loadOwlQuests(storage);
    assert.equal(quests.server, true);
    assert.deepEqual(quests.quests.map(q => q.id), snap.daily.quests.map(q => q.id));
    recordOwlQuestAction('plant', 5, storage);
    assert.equal(storage.getItem(OWL_QUEST_STORAGE_KEY), null, 'no local quest write');
    assert.equal(claimOwlQuest(quests.quests[0].id, {storage}).reason, 'SERVER_OWNED');
    const festival = loadEventState(storage);
    assert.equal(festival.points, 120);
    assert.equal(festival.day, HALLOWEEN);
    assert.equal(festival.freeCaps.care, 3);
    assert.equal(recordFestivalAction('harvest', null, storage).addedPoints, 0);
    assert.equal(storage.getItem(EVENT_STORAGE_KEY), null, 'no local festival write');
    assert.equal(claimEventMilestone('hal_m1@2026', {storage}).reason, 'SERVER_OWNED');
  } finally {
    useServerDaily(null);
    useServerFestival(null);
  }
});

test('local play (no wallet) still counts and claims on the device store', () => {
  const storage = createGardenStorage({scope: 'local-test', persistent: false});
  const quests = loadOwlQuests(storage);
  assert.equal(quests.server, undefined);
  const plant = quests.quests.find(q => q.id === 'q_plant');
  recordOwlQuestAction('plant', plant.target, storage);
  const claim = claimOwlQuest('q_plant', {storage});
  assert.equal(claim.ok, true);
  assert.equal(loadOwlQuests(storage).quests.find(q => q.id === 'q_plant').claimed, true);
  assert.equal(loadEventState(storage).server, undefined);
});

test('server refusals read as one icon and a few words', () => {
  const labels = {pumpkin: 'Bí ngô', oats: 'Yến mạch'};
  assert.deepEqual(serverRefusal({reason: 'missing-crops', details: {missing: [{resource: 'oats', required: 9, have: 4}]}}, {labels}), {reason: 'missing-crops', item: 'oats', text: 'Thiếu 5 Yến mạch'});
  assert.deepEqual(serverRefusal({reason: 'missing-crops', details: {detail: 'not enough oats'}}, {labels}), {reason: 'missing-crops', px: 'harvest', text: 'Thiếu nông sản'}, 'no regex on the engine text');
  assert.deepEqual(serverRefusal({reason: 'insufficient-galleons', details: {required: 750, spendable: 600, shortBy: 150}}), {reason: 'insufficient-galleons', px: 'coin', text: 'Thiếu 150 G'});
  assert.equal(serverRefusal({reason: 'missing-supply', details: {resource: 'seeds.pumpkin'}}, {labels}).text, 'Thiếu hạt Bí ngô');
  assert.equal(serverRefusal({reason: 'wallet-frozen'}).px, 'coin');
  assert.equal(serverRefusal({reason: 'already-claimed'}).text, 'Đã nhận rồi');
  assert.equal(serverRefusal({reason: 'model-rejected', details: {modelCode: 'STATION_BUSY'}}, {modelText: code => ({STATION_BUSY: 'Đang bận'})[code]}).text, 'Đang bận');
  assert.equal(serverRefusal({reason: 'something-new', message: 'Lỗi lạ'}).text, 'Lỗi lạ');
});

// Bonding and achievements (server commit 763528ded, garden-keeper-core.js).
import {useServerBonding, evaluateCreatureAffinity, recordCreatureAffinity, claimAffinityGift} from './garden-events.mjs';
import {useServerAchievements, evaluateAchievements, claimAchievementReward} from './garden-achievements.mjs';

const act = (server, command, requestId) => server.handle('performHagridGardenAction', {...command, expectedRevision: server.handle('getHagridGarden', {}).garden.progression.revision, requestId});

test('bond gifts and achievements are claimed once by server command; replays pay nothing', () => {
  const server = createFixtureServer();
  const start = server.handle('getHagridGarden', {});
  assert.deepEqual(start.bonding.creatures.find(c => c.species === 'puffskein').gifts.filter(g => g.claimable).map(g => g.giftId), ['puffskein:lv2', 'puffskein:lv3']);
  const command = {action: 'claimBondGift', giftId: 'puffskein:lv2', expectedRevision: start.garden.progression.revision, requestId: 'g1'};
  const gift = server.handle('performHagridGardenAction', command);
  const replay = server.handle('performHagridGardenAction', command);
  assert.equal(gift.receipt.giftId, 'puffskein:lv2');
  assert.equal(gift.garden.supplies.water, start.garden.supplies.water + 8);
  assert.equal(gift.garden.progression.inventory.pumpkin, start.garden.progression.inventory.pumpkin + 2);
  assert.equal(replay.garden.supplies.water, gift.garden.supplies.water);
  assert.ok(gift.garden.bonding.claimedGifts.includes('puffskein:lv2'));
  assert.equal(gift.bonding.creatures.find(c => c.species === 'puffskein').gifts[0].claimed, true);
  assert.throws(() => act(server, {action: 'claimBondGift', giftId: 'puffskein:lv2'}, 'g2'), e => e.reason === 'already-claimed');
  assert.throws(() => act(server, {action: 'claimBondGift', giftId: 'puffskein:lv4'}, 'g3'), e => e.reason === 'bond-incomplete');
  assert.throws(() => act(server, {action: 'claimBondGift', giftId: 'dragon:lv2'}, 'g4'), e => e.reason === 'bond-not-found');

  const ach = act(server, {action: 'claimAchievement', achievementId: 'ach_sprout_apprentice'}, 'a1');
  assert.equal(ach.receipt.achievementId, 'ach_sprout_apprentice');
  assert.equal(ach.achievements.items[0].claimed, true);
  assert.equal(ach.achievements.claimableCount, start.achievements.claimableCount - 1);
  assert.throws(() => act(server, {action: 'claimAchievement', achievementId: 'ach_sprout_apprentice'}, 'a2'), e => e.reason === 'already-claimed');
  assert.throws(() => act(server, {action: 'claimAchievement', achievementId: 'ach_nope'}, 'a3'), e => e.reason === 'achievement-not-found');
  const young = createFixtureServer({level: 5});
  assert.throws(() => act(young, {action: 'claimAchievement', achievementId: 'ach_grand_keeper'}, 'a4'), e => e.reason === 'achievement-locked');
});

test('bonding counts pets per creature per day apart from the free-tap cap, and real feeds', () => {
  const server = createFixtureServer({simulate: true});
  const pet = (species, id) => server.handle('performHagridGardenAction', {action: 'freeAction', kind: 'pet', species, expectedRevision: 0, requestId: id}).receipt;
  const gains = [1, 2, 3, 4].map(i => pet('kneazle', 'k' + i).bonding[0]);
  assert.deepEqual(gains.map(b => b.gain), [12, 12, 12, 0]);
  assert.equal(gains[3].capped, true);
  const other = pet('niffler', 'n1');
  assert.equal(other.freeAction.counted, false, 'free-tap cap of 3 is spent');
  assert.equal(other.bonding[0].gain, 12, 'bonding still counts for another creature');
  assert.throws(() => pet('dragon', 'd1'), e => e.reason === 'no-creature');
  const fed = act(server, {action: 'feed', species: 'puffskein'}, 'f1');
  assert.deepEqual(fed.receipt.bonding.map(b => [b.species, b.gain]), [['puffskein', 20]]);
  assert.equal(fed.garden.bonding.bySpecies.puffskein.xp, 90 + 20);
});

test('server bonding/achievement switch: cards come from the response, local counting and claiming stand down', () => {
  const storage = memory();
  const server = createFixtureServer();
  const snap = act(server, {action: 'claimAchievement', achievementId: 'ach_sprout_apprentice'}, 'a1');
  try {
    useServerBonding(snap);
    useServerAchievements(snap.achievements);
    const bond = evaluateCreatureAffinity(snap.garden.progression, storage);
    assert.equal(bond.claimableCount, snap.bonding.claimableCount);
    assert.equal(bond.entries.find(e => e.species === 'niffler').level, 5);
    assert.equal(recordCreatureAffinity('niffler', 'pet', storage, snap.garden.progression), null);
    assert.equal(claimAffinityGift('niffler:lv2', {gameState: snap.garden.progression, storage}).reason, 'SERVER_OWNED');
    const ach = evaluateAchievements(snap.garden.progression, {}, storage);
    assert.equal(ach.items[0].claimed, true);
    assert.equal(ach.unlockedCount, snap.achievements.unlockedCount);
    assert.equal(claimAchievementReward('ach_creature_friend', {state: snap.garden.progression, storage}).reason, 'SERVER_OWNED');
  } finally {
    useServerBonding(null);
    useServerAchievements(null);
  }
  const local = createGardenStorage({scope: 'local-bond', persistent: false});
  const state = snap.garden.progression;
  assert.equal(recordCreatureAffinity('niffler', 'pet', local, state).gain, 12);
  assert.equal(claimAchievementReward('ach_sprout_apprentice', {state, storage: local}).ok, true);
});

test('structured refusals (server ad615d0d1): every missing crop with its shortfall, shortBy for Galleons', () => {
  const short = createFixtureServer({simulate: true, scenario: 'missing'});
  let error;
  try {act(short, {action: 'build', expansionId: 'plot_12'}, 'b1');} catch (e) {error = e;}
  assert.deepEqual(error.details.missing, [{resource: 'sunpetal', required: 27, have: 0}, {resource: 'ambermelon', required: 27, have: 0}]);
  const labels = {sunpetal: 'Hoa nhật quang', ambermelon: 'Dưa hổ phách'};
  assert.deepEqual(serverRefusal(error, {labels}), {reason: 'missing-crops', item: 'sunpetal', text: 'Thiếu 27 Hoa nhật quang · 27 Dưa hổ phách'});
  const poor = createFixtureServer({simulate: true, galleons: 100});
  try {act(poor, {action: 'build', expansionId: 'plot_12'}, 'b2');} catch (e) {error = e;}
  assert.deepEqual([error.details.required, error.details.spendable, error.details.shortBy], [750, 100, 650]);
  assert.equal(serverRefusal(error).text, 'Thiếu 650 G');
  assert.equal(serverRefusal({reason: 'bond-incomplete'}).px, 'heart');
  assert.equal(serverRefusal({reason: 'achievement-locked'}).text, 'Thành tựu chưa mở');
});

test('a decoration turned in place stores its facing in decorations.rotations and counts as one rotate', () => {
  const server = createFixtureServer();
  const turned = act(server, {action: 'placeDecoration', itemId: 'decor_pumpkin_lantern', slot: 0, facing: 'right'}, 'r1');
  assert.equal(turned.garden.decorations.rotations.decor_pumpkin_lantern, 'right');
  assert.equal(turned.receipt.freeAction.kind, 'rotate');
  assert.throws(() => act(server, {action: 'placeDecoration', itemId: 'decor_pumpkin_lantern', slot: 0, facing: 'right'}, 'r2'), e => e.reason === 'action-noop');
});

test('fixture mirrors the server: fast growth below level 20, care ripens 15 minutes sooner 3 times a day, level gift', () => {
  // The fixture plants on the real clock, so timings are checked to the second.
  const server = createFixtureServer({simulate: true, level: 1, scenario: 'empty'});
  let rev = server.handle('getHagridGarden', {}).garden.progression.revision;
  const act = (fields, id) => { const r = server.handle('performHagridGardenAction', {expectedRevision: rev, requestId: id, ...fields}); rev = r.garden.progression.revision; return r; };
  const planted = act({action: 'plant', plotIndex: 0, cells: [0, 1, 2], species: 'pumpkin'}, 'p1');
  const slot = planted.garden.progression.plots[0].slots[0];
  assert.ok(Math.abs(slot.plantedAt - (Date.now() - Math.round(slot.growMs * 0.9))) < 1000);
  const cared = act({action: 'care', plotIndex: 0, cells: [0, 1, 2]}, 'c1');
  assert.ok(Math.abs(cared.garden.progression.plots[0].slots[0].plantedAt - (Date.now() - slot.growMs)) < 1000);
  assert.throws(() => act({action: 'care', plotIndex: 0, cells: [0, 1, 2]}, 'c2'), e => e.reason === 'invalid-care-target');
  const boost = cared.garden.supplies.boost;
  const harvested = act({action: 'harvest', plotIndex: 0, cells: [0, 1, 2]}, 'h1');
  assert.equal(harvested.garden.progression.level, 2);
  assert.equal(harvested.garden.supplies.boost, boost + 1);
});
