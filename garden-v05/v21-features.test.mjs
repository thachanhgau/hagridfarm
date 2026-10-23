import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import scene from './scene-data.json' with {type: 'json'};
import motion from './motion-data.json' with {type: 'json'};
import * as E from './progression-engine.mjs';
import {
  extractPostcardMeta,
  renderPostcardCanvas,
  buildAlmanacChains,
} from './garden-postcard.mjs';
import {dayKeyFor, loadOwlQuests, recordOwlQuestAction, syncQuestsWithGardenState, claimOwlQuest, hasClaimableOwlQuest, setOwlQuestContext, pickDailyQuests, OWL_QUEST_POOL} from './garden-quests.mjs';
import {ITEM_ART} from './item-art.mjs?v=24.9.70';
import {earnedDecorArt} from './earned-decor-sprites.mjs?v=24.9.70';

globalThis.FARM_SCENE = structuredClone(scene);
globalThis.FARM_MOTION = motion;

const {
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

test('V21 Direction 1: drawKeepsake renders canonical produce art and every earned decoration draws authored default/right views', async () => {
  const ctxWithSprite = makeMockCtx();
  const fakeProduce = {width: 64, height: 64, naturalWidth: 64, naturalHeight: 64};
  const fakeProduceAsset = {width: 64, height: 64, pivotX: 32, pivotY: 56};
  drawKeepsake(
    ctxWithSprite,
    {species: 'puffskein', count: 3, xy: [500, 400]},
    0,
    {produceImage: fakeProduce, produceAsset: fakeProduceAsset},
  );
  assert.ok(ctxWithSprite.calls.some(([fn]) => fn === 'drawImage'), 'drawKeepsake should draw the canonical produce sprite when provided');
  assert.deepEqual(ctxWithSprite.calls.find(([fn]) => fn === 'drawImage')[1].slice(1), [484, 357, 32, 32]);
  assert.ok(ctxWithSprite.calls.some(([fn, args]) => fn === 'fillText' && String(args[0]).includes('×3')), 'drawKeepsake should render count badge ×3');

  const ctxFallback = makeMockCtx();
  drawKeepsake(ctxFallback, {species: 'three-headed-dog', count: 1, xy: [520, 400]}, 0);
  assert.ok(ctxFallback.calls.some(([fn, args]) => fn === 'fillText' && args[0] === '3D'), 'drawKeepsake should preserve the 3D species label');

  const produceIds = E.DB.animals.map(({id}) => `produce_${id}`);
  assert.equal(produceIds.length, 12);
  assert.equal(new Set(produceIds.map((id) => ITEM_ART[id]?.file)).size, 12);
  for (const id of produceIds) {
    const art = ITEM_ART[id];
    assert.ok(art?.file, `Missing produce art for ${id}`);
    assert.equal(art.width, 64, `${id} width`);
    assert.equal(art.height, 64, `${id} height`);
    assert.ok(fs.existsSync(new URL(art.file, import.meta.url)), `${id} file missing`);
  }

  const placements = decorationPlacements(scene);
  assert.equal(placements.length, E.DB.decorations.length);
  assert.equal(new Set(placements.map(({id}) => ITEM_ART[id]?.file)).size, 29);
  const fakeDecorSprite = {width: 96, height: 112, naturalWidth: 96, naturalHeight: 112};
  for (const placement of placements) {
    const defaultAsset = earnedDecorArt(placement.id, 'default');
    const rightAsset = earnedDecorArt(placement.id, 'right');
    assert.ok(defaultAsset?.file, `Missing default authored view for ${placement.id}`);
    assert.ok(rightAsset?.file, `Missing right authored view for ${placement.id}`);
    assert.notEqual(defaultAsset.file, rightAsset.file, `${placement.id} must use two authored views`);
    assert.equal(defaultAsset.width, 96, `${placement.id} default width`);
    assert.equal(defaultAsset.height, 112, `${placement.id} default height`);
    assert.equal(defaultAsset.pivotX, 48, `${placement.id} default pivotX`);
    assert.equal(defaultAsset.pivotY, 96, `${placement.id} default pivotY`);
    assert.equal(rightAsset.width, 96, `${placement.id} right width`);
    assert.equal(rightAsset.height, 112, `${placement.id} right height`);
    assert.equal(rightAsset.pivotX, 48, `${placement.id} right pivotX`);
    assert.equal(rightAsset.pivotY, 96, `${placement.id} right pivotY`);

    for (const [facing, asset] of [['default', defaultAsset], ['right', rightAsset]]) {
      const context = makeMockCtx();
      assert.equal(drawDecoration(context, {...placement, facing}, 0, {asset, image: fakeDecorSprite}), true);
      const draw = context.calls.find(([fn]) => fn === 'drawImage');
      assert.ok(draw, `${placement.id} ${facing} should draw its authored sprite`);
      assert.deepEqual(draw[1].slice(1), [Math.round(placement.xy[0] - 48), Math.round(placement.xy[1] - 96), 96, 112]);
      assert.ok(!context.calls.some(([fn]) => fn === 'scale'), `${placement.id} ${facing} must not mirror on canvas`);
    }
    const missingImageContext = makeMockCtx();
    assert.equal(drawDecoration(missingImageContext, {...placement, facing: 'default'}, 0, {asset: defaultAsset}), false);
    assert.equal(missingImageContext.calls.length, 0, `${placement.id} missing image should skip cleanly`);
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
  state.decorations = ['decoration-3'];
  state.decorationRotations = {'decoration-3': 'right'};
  garden.render(state, {now: 1_700_000_000_000, clock: 800, propsVisible: false});

  const kpOrder = garden.order().filter((o) => o.type === 'keepsake');
  assert.equal(kpOrder.length, 2);
  const decorPlacement = decorationPlacements(scene).find(({id}) => id === 'decoration-3');
  const decorAsset = earnedDecorArt('decoration-3', 'right');
  assert.ok(decorAsset, 'decoration-3 right view is required for picking');
  const hitX = decorPlacement.xy[0] - decorAsset.pivotX + decorAsset.bounds.x + Math.floor(decorAsset.bounds.w / 2);
  const hitY = decorPlacement.xy[1] - decorAsset.pivotY + decorAsset.bounds.y + Math.floor(decorAsset.bounds.h / 2);
  assert.deepEqual(garden.pick(hitX, hitY), {
    kind: 'earned-decoration',
    itemId: 'decoration-3',
    label: decorPlacement.label,
    facing: 'right',
  });
});

test('V21 Direction 2: renderPostcardCanvas composites 960x620 Hogwarts postcard and buildAlmanacChains links all 12 creatures and 32 crops', () => {
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
  assert.equal(almanac.cropUsages.length, 32);
  for (const chain of almanac.creatureChains) {
    assert.ok(chain.ingredients.length >= 1, `Creature ${chain.creatureId} should list feed ingredients`);
    assert.ok(chain.produceLabel.length > 0);
  }
});

test('V21 Direction 3 (V24.9.8 rules): owl quests count real work and pay out once per day', () => {
  const store = new Map();
  const mockStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
  };
  const now = 1_700_000_000_000;
  setOwlQuestContext({level: 1});
  const initial = loadOwlQuests(mockStorage, now);
  assert.equal(initial.dayKey, dayKeyFor(now));
  assert.equal(initial.quests.length, 3);
  assert.equal(hasClaimableOwlQuest(initial), false);

  // Free taps no longer count; one row of three is not yet the six cells asked for.
  for (const free of ['weatherChange', 'eventChange', 'rotate', 'postcard', 'startTour', 'pet']) recordOwlQuestAction(free, 1, mockStorage, now);
  assert.equal(recordOwlQuestAction('plant', 3, mockStorage, now).newlyCompleted.length, 0);
  const afterPlant = recordOwlQuestAction('plant', 3, mockStorage, now);
  assert.deepEqual(afterPlant.newlyCompleted.map((q) => q.id), ['q_plant']);
  assert.equal(hasClaimableOwlQuest(afterPlant.state), true);

  const granted = [];
  const claimRes = claimOwlQuest('q_plant', {storage: mockStorage, nowMs: now, onGrantReward: (reward, quest) => granted.push({reward, questId: quest.id})});
  assert.equal(claimRes.ok, true);
  assert.equal(granted[0].reward.kind, 'water');
  assert.equal(granted[0].reward.amount, 6); // refunds the water the six cells used
  assert.equal(claimOwlQuest('q_plant', {storage: mockStorage, nowMs: now}).reason, 'ALREADY_CLAIMED');

  const synced = syncQuestsWithGardenState(loadOwlQuests(mockStorage, now), E.testProfile(50, now));
  assert.equal(synced.quests.filter((q) => q.progress >= q.target).length, 1);
});

test('V24.9.8: daily quests follow level and unlocks, and stay fixed for the day', () => {
  const day = '2026-10-18';
  const ids = (ctx) => pickDailyQuests(day, ctx).map((q) => q.id);
  assert.deepEqual(ids({level: 1, hasCreature: false}).slice(0, 2), ['q_plant', 'q_harvest']);
  assert.ok(ids({level: 1, hasCreature: false}).every((id) => !['q_craft', 'q_feed', 'q_claim'].includes(id)));
  for (let d = 1; d <= 28; d += 1) {
    const third = pickDailyQuests(`2026-10-${String(d).padStart(2, '0')}`, {level: 3, hasCreature: false})[2].id;
    assert.equal(third, 'q_harvest_runs');
  }
  const lv30 = pickDailyQuests(day, {level: 30, hasCreature: true, feedItem: 'bow_feed'});
  assert.equal(lv30[0].target, 12);
  assert.deepEqual([lv30[1].reward.kind, lv30[1].reward.amount], ['water', 8]);
  assert.deepEqual(pickDailyQuests(day, {level: 30, hasCreature: true}), pickDailyQuests(day, {level: 30, hasCreature: true}));
  const feed = OWL_QUEST_POOL.find((q) => q.id === 'q_feed').build({feedItem: 'bow_feed'});
  assert.equal(feed.reward.itemId, 'bow_feed');
});
