import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from './progression-engine.mjs';
import {TUTORIAL_LINES, TUTORIAL_GUEST, TUTORIAL_PLOT, REPLAY_STEPS, HAGRID_LETTER, advanceTutorial, tutorialEligible, tutorialStart, letterGreeting, loadTutorial, saveTutorial} from './garden-tutorial.mjs';
import {createFixtureServer} from '../qa-v19/fixture-wallet.mjs';
import {createGardenClient} from './garden-emulator-client.mjs';

const memory = () => {const m = new Map(); return {getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v))};};
// The same facts mobile-game.mjs tutorialFacts() reads, at the real clock.
const facts = (g) => {
  const slots = g.plots[TUTORIAL_PLOT].slots, now = E.nowFor(g, Date.now()), planted = slots.some(Boolean);
  return {planted, mature: slots.some((e) => e && E.growth(e, now).mature), harvested: !planted && (g.inventory.pumpkin || 0) > 0};
};
const reasonOf = async (promise) => {try {await promise;} catch (e) {return e.reason;} return 'resolved';};

test('only an untouched level-1 garden starts the tutorial', () => {
  const fresh = E.newGame(Date.now());
  assert.equal(tutorialEligible(fresh), true);
  assert.equal(tutorialEligible(E.plant(fresh, 0, [0, 1, 2], 'pumpkin', Date.now())), false);
  assert.equal(tutorialEligible(E.testProfile(30, Date.now())), false);
});

test('steps follow real game facts, including out-of-order play', () => {
  assert.equal(advanceTutorial('plant', {}), 'plant');
  assert.equal(advanceTutorial('plant', {planted: true}), 'grow');
  assert.equal(advanceTutorial('plant', {planted: true, mature: true}), 'harvest');
  assert.equal(advanceTutorial('grow', {planted: true, mature: true}), 'harvest');
  assert.equal(advanceTutorial('harvest', {harvested: true}), 'feed');
  assert.equal(advanceTutorial('plant', {harvested: true}), 'feed');
  assert.equal(advanceTutorial('feed', {harvested: true}), 'feed'); // feeding waits for the tap
});

test('Hagrid lines stay within eight words and the guest never joins the garden', () => {
  for (const line of Object.values(TUTORIAL_LINES)) assert.ok(line.split(/\s+/).length <= 8, line);
  assert.ok(E.CREATURE[TUTORIAL_GUEST.species].level > 1); // why it must be a visiting guest
});

test('tutorial step persists and bad saves fall back to null', () => {
  const m = new Map(), s = {getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v)};
  assert.equal(loadTutorial(s), null);
  saveTutorial(s, 'harvest'); assert.equal(loadTutorial(s), 'harvest');
  m.set('hagrid-tutorial-v1', '{"step":"nope"}'); assert.equal(loadTutorial(s), null);
});

test('the engine time skip matures the first pumpkins exactly', () => {
  const t = Date.now();
  let g = E.plant(E.newGame(t), 0, [0, 1, 2], 'pumpkin', t);
  g = E.advanceTime(g, E.CROP.pumpkin.growMs);
  assert.ok(g.plots[0].slots.filter(Boolean).every((e) => E.growth(e, E.nowFor(g, t)).mature));
  assert.equal(E.harvest(g, 0, [0, 1, 2], t).inventory.pumpkin, 3);
});

test('Hagrid\'s letter opens once for a new garden, then the saved step resumes', () => {
  const s = memory(), fresh = E.newGame(Date.now());
  assert.equal(tutorialStart(fresh, {saved: loadTutorial(s)}), 'letter');
  saveTutorial(s, 'intro'); // Bắt đầu pressed
  assert.equal(tutorialStart(fresh, {saved: loadTutorial(s)}), 'intro');
  saveTutorial(s, 'done');
  assert.equal(tutorialStart(fresh, {saved: loadTutorial(s)}), 'done');
});

test('existing gardens never see the letter, local or connected', () => {
  const t = Date.now(), fresh = E.newGame(t);
  assert.equal(tutorialStart(E.testProfile(30, t)), 'done');
  assert.equal(tutorialStart(E.plant(fresh, 0, [0, 1, 2], 'pumpkin', t)), 'done');
  assert.equal(tutorialStart(fresh, {connected: true}), 'letter'); // server revision 0
  assert.equal(tutorialStart({...fresh, revision: 4}, {connected: true}), 'done'); // the server has changed it before
});

test('the letter is short, signed by Hagrid and greets the member by name', () => {
  const words = [...HAGRID_LETTER.paragraphs, HAGRID_LETTER.postscript].join(' ').split(/\s+/).length;
  assert.ok(words >= 60 && words <= 90, String(words));
  assert.equal(HAGRID_LETTER.signature, 'Hagrid');
  assert.equal(letterGreeting('Luna'), 'Luna thân mến!');
  assert.equal(letterGreeting('Người làm vườn'), 'Con thân mến!');
  assert.equal(letterGreeting(undefined), 'Con thân mến!');
});

test('connected tutorial: a brand-new account plants, grows once on the server and harvests without the 2-hour wait', async () => {
  const server = createFixtureServer({scenario: 'new', simulate: true});
  const client = createGardenClient(async (name, data) => server.handle(name, data));
  let snap = await client.read();
  let g = snap.garden.progression;
  assert.equal(g.revision, 0);
  assert.equal(tutorialStart(g, {connected: true}), 'letter');
  assert.deepEqual([snap.garden.supplies.seeds.pumpkin, snap.garden.supplies.water], [3, 3]); // Hagrid's starter
  snap = await client.act({action: 'plant', plotIndex: 0, cells: [0, 1, 2], species: 'pumpkin'});
  g = snap.garden.progression;
  assert.equal(advanceTutorial('plant', facts(g)), 'grow');
  const started = Date.now();
  snap = await client.act({action: 'tutorialGrow', plotIndex: 0, cells: [0, 1, 2]});
  g = snap.garden.progression;
  assert.equal(advanceTutorial('grow', facts(g)), 'harvest');
  assert.ok(Date.now() - started < 1000);
  assert.equal(snap.receipt.festivalPoints, undefined); // no festival point for Hagrid's help
  snap = await client.act({action: 'harvest', plotIndex: 0, cells: [0, 1, 2]});
  assert.equal(snap.garden.progression.inventory.pumpkin, 3);
  assert.equal(advanceTutorial('harvest', facts(snap.garden.progression)), 'feed');
});

test('replaying the tutorial grants nothing twice: tutorialGrow is once per account and idempotent by requestId', async () => {
  const server = createFixtureServer({scenario: 'new', simulate: true});
  const act = (data) => server.handle('performHagridGardenAction', data);
  act({action: 'plant', plotIndex: 0, cells: [0, 1, 2], species: 'pumpkin', expectedRevision: 0, requestId: 'p1'});
  const first = act({action: 'tutorialGrow', plotIndex: 0, cells: [0, 1, 2], expectedRevision: 1, requestId: 'g1'});
  const lost = act({action: 'tutorialGrow', plotIndex: 0, cells: [0, 1, 2], expectedRevision: 1, requestId: 'g1'}); // retried lost response
  assert.deepEqual(lost.receipt, first.receipt);
  assert.equal(lost.garden.progression.revision, 2);
  assert.throws(() => act({action: 'tutorialGrow', plotIndex: 0, cells: [0, 1, 2], expectedRevision: 2, requestId: 'g2'}), (e) => e.reason === 'already-claimed');
  assert.equal(server.handle('getHagridGarden').garden.progression.revision, 2);
  // A replay only walks the lines: no grow step action, no saved progress.
  assert.ok(!REPLAY_STEPS.includes('letter') && !REPLAY_STEPS.includes('done'));
});

test('tutorialGrow is refused once the garden has grown past level 1 or on another plot', async () => {
  const server = createFixtureServer({level: 30, simulate: true});
  const client = createGardenClient(async (name, data) => server.handle(name, data));
  await client.read();
  assert.equal(await reasonOf(client.act({action: 'tutorialGrow', plotIndex: 0, cells: [0, 1, 2]})), 'tutorial-closed');
  const fresh = createFixtureServer({scenario: 'new', simulate: true});
  const c2 = createGardenClient(async (name, data) => fresh.handle(name, data));
  await c2.read();
  await c2.act({action: 'plant', plotIndex: 0, cells: [0, 1, 2], species: 'pumpkin'});
  assert.equal(await reasonOf(c2.act({action: 'tutorialGrow', plotIndex: 1, cells: [0, 1, 2]})), 'invalid-action-input');
});
