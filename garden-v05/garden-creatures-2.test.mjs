// Garden expansion phase 2 (docs/garden-expansion-plan.md §2.2, §9): three land species, «Chuồng mở rộng», keepsake slots,
// pond-bed ground. Art for the species comes from the creatures-art-2 merge; nothing here needs it.
import test from 'node:test';
import assert from 'node:assert/strict';
import scene from './scene-data.json' with {type: 'json'};
import * as E from './progression-engine.mjs';
import {EXTENSION_PENS, FARM_LAYOUT} from './garden-grid.mjs';
import {KEEPSAKE_DISPLAY_LAYOUT, keepsakeGroundRect} from './decor-placement-geometry.mjs';
import {decorationPlacements, pondHome, pondBedRects, pondBedCount, pondFootprint, POND_FACING, defaultDecorFootprint} from './default-decor.mjs';
import {gardenStage, inPondLand, stageContains} from './garden-growth.mjs';
import {decorFootprintRect, rectsOverlap} from './decor-runtime.mjs';
import {moodTiles, tendText, TRICKS} from './garden-mood-ui.mjs';

const NOW = Date.UTC(2026, 10, 10, 5);
const box = a => ({c0: a.col, c1: a.col + a.width, r0: a.row, r1: a.row + a.height});
const plotGround = p => ({c0: p.col - 0.5, c1: p.col + p.width - 0.5, r0: p.row - 0.5, r1: p.row + p.height - 0.5});

test('three land species and the pen extensions match the server balance; 18 land spots', () => {
  assert.deepEqual(['crup', 'knarl', 'salamander'].map(id => [E.CREATURE[id].label, E.CREATURE[id].level]),
    [['Chó đuôi nĩa', 140], ['Nhím quậy', 180], ['Kỳ nhông lửa', 220]]);
  assert.deepEqual(EXTENSION_PENS.map(p => [p.id, p.requiredLevel]), E.DB.expansions.filter(e => e.id.startsWith('pen_ext_')).map(e => [e.id, e.level]));
  assert.equal(FARM_LAYOUT.creatureSpotCount, 6 * 2 + EXTENSION_PENS.length * 2);
  assert.deepEqual([139, 140, 220, 340].map(level => E.housingCapacity(E.testProfile(level, NOW))), [12, 14, 16, 18]);
  for (const id of ['crup', 'knarl', 'salamander']) assert.ok(TRICKS[id]?.length === 3, id);
});

test('Nhím quậy eats only from the hand; feed-all passes it by', () => {
  let s = E.testProfile(190, NOW);
  s = E.adopt(s, 'puffskein', NOW);
  s = E.adopt(s, 'knarl', NOW);
  assert.throws(() => E.feed(s, 'knarl', NOW), e => e.code === 'HAND_FEED_ONLY');
  const all = E.feed(s, null, NOW);
  assert.equal(all.creatures.find(c => c.species === 'knarl').meal, null);
  assert.ok(all.creatures.find(c => c.species === 'puffskein').meal);
  const hand = E.feed(all, 'knarl', NOW, true);
  assert.equal(hand.inventory.knarl_feed, all.inventory.knarl_feed - 2);
});

test('the extension pens stand on free ground: no plot, pen, statue, default decoration, pond or pond bed', () => {
  const state = E.testProfile(350, NOW);
  const taken = [
    ...scene.plots.map(plotGround), ...scene.pens.slice(0, 6).map(box),
    ...KEEPSAKE_DISPLAY_LAYOUT.map(p => keepsakeGroundRect(p, {bottom: 33.5})),
    ...decorationPlacements(scene).map(d => decorFootprintRect(...d.at, d.footprint, d.facing)),
  ];
  for (const built of [['pond_1'], ['pond_1', 'pond_2'], ['pond_1', 'pond_2', 'pond_3']]) {
    const at = pondHome(scene, built);
    taken.push(decorFootprintRect(...at, defaultDecorFootprint('scene:pond', built)), ...pondBedRects(at, built, pondBedCount(built)));
  }
  for (const [i, pen] of EXTENSION_PENS.entries()) {
    assert.equal(pen.spots.length, 2);
    for (const spot of pen.spots) assert.ok(spot[0] > pen.col && spot[0] < pen.col + pen.width && spot[1] > pen.row && spot[1] < pen.row + pen.height, pen.id);
    for (const rect of taken) assert.equal(rectsOverlap(box(pen), rect), false, `${pen.id} overlaps ${JSON.stringify(rect)}`);
    for (const other of EXTENSION_PENS.slice(i + 1)) assert.equal(rectsOverlap(box(pen), box(other)), false);
  }
  assert.ok(state.built.includes('pen_ext_3'));
});

test('Bờ hồ: the built pond and its beds stand inside the pond land, clear of plots, pens and each other', () => {
  for (const built of [['pond_1'], ['pond_1', 'pond_2'], ['pond_1', 'pond_2', 'pond_3']]) {
    const at = pondHome(scene, built), pond = decorFootprintRect(...at, pondFootprint(built), POND_FACING);
    const beds = pondBedRects(at, built, pondBedCount(built));
    assert.equal(beds.length, [4, 7, 10][built.length - 1]);
    const stage = gardenStage({level: 400, built}, scene);
    for (const rect of [pond, ...beds]) {
      for (const plot of scene.plots.map(plotGround)) assert.equal(rectsOverlap(rect, plot), false, `${built.length}: ${JSON.stringify(rect)}`);
      for (const [c, r] of [[rect.c0, rect.r0], [rect.c1, rect.r1]]) assert.ok(inPondLand(c + (c === rect.c0 ? .5 : -.5), r + (r === rect.r0 ? .5 : -.5)) && stageContains(stage, c, r), JSON.stringify(rect));
    }
    for (const bed of beds) assert.equal(rectsOverlap(bed, pond), false);
  }
  assert.deepEqual(pondFootprint(['pond_1', 'pond_2', 'pond_3']), [9, 6]);
  assert.deepEqual(defaultDecorFootprint('scene:pond'), [3, 2]); // the decorative pond keeps its size and spot
});

test('Chó đuôi nĩa: «Chơi» says it cheers the pens until today\'s cheer is used', () => {
  const view = {roamsLeft: 2, crupCheered: false};
  const entry = {done: [], lessons: 0, roamUntil: null};
  assert.equal(moodTiles({species: 'crup', entry, view}).find(t => t.kind === 'play').state, 'Cả chuồng +5');
  assert.equal(moodTiles({species: 'crup', entry, view: {...view, crupCheered: true}}).find(t => t.kind === 'play').state, '');
  assert.equal(moodTiles({species: 'puffskein', entry, view}).find(t => t.kind === 'play').state, '');
  assert.match(tendText({species: 'crup', kind: 'play', mood: 72, cheered: ['puffskein', 'niffler'], cheer: 5}, () => 'Chó đuôi nĩa'), /2 bạn trong chuồng vui thêm \+5/);
});
