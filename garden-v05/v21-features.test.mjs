import test from 'node:test';
import assert from 'node:assert/strict';
import scene from './scene-data.json' with {type: 'json'};
import motion from './motion-data.json' with {type: 'json'};
import * as E from './progression-engine.mjs';
import {
  extractPostcardMeta,
  renderPostcardCanvas,
  buildAlmanacChains,
} from './garden-postcard.mjs';
import {
  DAILY_OWL_QUEST_TEMPLATES,
  dayKeyFor,
  loadOwlQuests,
  recordOwlQuestAction,
  syncQuestsWithGardenState,
  claimOwlQuest,
  hasClaimableOwlQuest,
} from './garden-quests.mjs';

globalThis.FARM_SCENE = structuredClone(scene);
globalThis.FARM_MOTION = motion;

const {
  drawDecorationShape,
  drawDecoration,
  drawKeepsake,
  decorationPlacements,
  createGarden,
} = await import('./scene-renderer.mjs');

function makeMockCtx() {
  const calls = [];
  const ctx = new Proxy({}, {
    get(_target, prop) {
      if (prop === 'measureText') return (str) => ({width: String(str).length * 7});
      if (prop === 'calls') return calls;
      return (...args) => {
        calls.push([prop, args]);
      };
    },
    set(_target, prop, val) {
      calls.push([`set:${prop}`, val]);
      return true;
    },
  });
  return ctx;
}

test('V21 Direction 1: drawKeepsake renders stepped shrine pedestal + miniature creature sprite and drawDecoration animates 4 phases across all 29 path decorations', async () => {
  const ctxWithSprite = makeMockCtx();
  const fakeSprite = {width: 64, height: 64, naturalWidth: 64, naturalHeight: 64};
  drawKeepsake(
    ctxWithSprite,
    {species: 'puffskein', count: 3, xy: [500, 400]},
    900,
    {spriteImage: fakeSprite, spriteFrame: {width: 64, height: 64}},
  );
  assert.ok(ctxWithSprite.calls.some(([fn]) => fn === 'drawImage'), 'drawKeepsake should draw miniature creature sprite when provided');
  assert.ok(ctxWithSprite.calls.some(([fn, args]) => fn === 'fillText' && String(args[0]).includes('×3')), 'drawKeepsake should render count badge ×3');

  const ctxFallback = makeMockCtx();
  drawKeepsake(ctxFallback, {species: 'three-headed-dog', count: 1, xy: [520, 400]}, 0);
  assert.ok(ctxFallback.calls.some(([fn, args]) => fn === 'fillText' && args[0] === '3D'), 'drawKeepsake fallback should render 3D emblem');

  const placements = decorationPlacements(scene);
  assert.equal(placements.length, 29);
  for (const placement of placements) {
    for (const phase of [0, 1, 2, 3]) {
      const c = makeMockCtx();
      drawDecorationShape(c, placement.shape, 300, 200, phase);
      assert.ok(c.calls.length > 0, `Shape ${placement.shape} rendered 0 commands at phase ${phase}`);
    }
    const cRight = makeMockCtx();
    drawDecoration(cRight, {...placement, facing: 'right'}, 840);
    assert.ok(cRight.calls.some(([fn]) => fn === 'scale'), `Decoration ${placement.id} should flip horizontally when facing=right`);
  }
});

test('V21 Direction 1b: createGarden makes keepsake pedestals pickable on the south aisle', async () => {
  const ctx = makeMockCtx();
  class MissingImage {
    set src(value) {
      this.file = value;
      queueMicrotask(() => this.onerror?.(new Error(`missing ${value}`)));
    }
  }
  const fakeCanvas = {
    width: 0,
    height: 0,
    dataset: {},
    getContext: () => ctx,
    getBoundingClientRect() {
      return {left: 0, top: 0, width: this.width || 1, height: this.height || 1};
    },
    ownerDocument: {
      createElement: () => ({width: 0, height: 0, getContext: () => makeMockCtx()}),
      defaultView: {Image: MissingImage},
    },
  };

  const garden = await createGarden(fakeCanvas, {allowMissingAssets: true});
  const state = E.testProfile(100, 1_700_000_000_000);
  state.keepsakes = {puffskein: 2, dragon: 1};
  garden.render(state, {now: 1_700_000_000_000, clock: 800, propsVisible: false});

  const kpOrder = garden.order().filter((o) => o.type === 'keepsake');
  assert.equal(kpOrder.length, 2);
});

test('V21 Direction 2: renderPostcardCanvas composites 960x620 Hogwarts postcard and buildAlmanacChains links all 12 creatures and 24 crops', () => {
  const state = E.testProfile(60, 1_700_000_000_000);
  state.keepsakes = {puffskein: 2, niffler: 1};
  state.decorations = ['decoration-3', 'decoration-7'];

  const meta = extractPostcardMeta({
    state,
    stage: {id: 4, name: 'Trảng cỏ Rừng Cấm'},
    atmosphere: {icon: '🌙', label: 'Đêm trăng Rừng Cấm'},
    playerName: 'Harry Potter',
  });
  assert.equal(meta.level, 60);
  assert.equal(meta.keepsakeTotal, 3);
  assert.equal(meta.decorTotal, 2);

  const mockCtx = makeMockCtx();
  const mockDoc = {
    createElement(tag) {
      assert.equal(tag, 'canvas');
      return {
        width: 0,
        height: 0,
        getContext: () => mockCtx,
      };
    },
  };
  const sourceCanvas = {width: 2400, height: 1500};
  const out = renderPostcardCanvas(sourceCanvas, {
    state,
    stage: {id: 4, name: 'Trảng cỏ Rừng Cấm'},
    atmosphere: {icon: '🌙', label: 'Đêm trăng Rừng Cấm'},
    playerName: 'Harry Potter',
  }, mockDoc);

  assert.equal(out.width, 960);
  assert.equal(out.height, 620);
  assert.ok(mockCtx.calls.some(([fn]) => fn === 'drawImage'), 'Postcard should composite the source garden canvas');
  assert.ok(
    mockCtx.calls.some(([fn, args]) => fn === 'fillText' && String(args[0]).includes('HARRY POTTER')),
    'Postcard should stamp uppercase player name',
  );

  const almanac = buildAlmanacChains(E.DB, state);
  assert.equal(almanac.creatureChains.length, 12);
  assert.equal(almanac.cropUsages.length, 24);
  for (const chain of almanac.creatureChains) {
    assert.ok(chain.ingredients.length >= 1, `Creature ${chain.creatureId} should list feed ingredients`);
    assert.ok(chain.produceLabel.length > 0);
  }
});

test('V21 Direction 3: Daily Owl Quests track actions, sync with garden state, and claim supply rewards once per day', () => {
  const store = new Map();
  const mockStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
  };
  const now = 1_700_000_000_000;
  assert.equal(DAILY_OWL_QUEST_TEMPLATES.length, 3);

  const initial = loadOwlQuests(mockStorage, now);
  assert.equal(initial.dayKey, dayKeyFor(now));
  assert.equal(initial.quests.length, 3);
  assert.equal(hasClaimableOwlQuest(initial), false);

  const afterPlant = recordOwlQuestAction('plant', 1, mockStorage, now);
  assert.equal(afterPlant.newlyCompleted.length, 1);
  assert.equal(afterPlant.newlyCompleted[0].id, 'quest_hagrid_harvest');
  assert.equal(hasClaimableOwlQuest(afterPlant.state), true);

  const granted = [];
  const claimRes = claimOwlQuest('quest_hagrid_harvest', {
    storage: mockStorage,
    nowMs: now,
    onGrantReward: (reward, quest) => granted.push({reward, questId: quest.id}),
  });
  assert.equal(claimRes.ok, true);
  assert.equal(granted.length, 1);
  assert.equal(granted[0].reward.kind, 'kit');

  const duplicate = claimOwlQuest('quest_hagrid_harvest', {storage: mockStorage, nowMs: now});
  assert.equal(duplicate.ok, false);
  assert.equal(duplicate.reason, 'ALREADY_CLAIMED');

  const synced = syncQuestsWithGardenState(loadOwlQuests(mockStorage, now), E.testProfile(50, now));
  assert.equal(synced.quests.filter((q) => q.progress >= q.target).length, 1);
});
