// Owner 05/11/2026 («fix mấy cái lỗi mà mấy cái asset nó đè lên nhân vật»): Dobby stood in front of «Mẫu sân tròn dưới
// trăng» yet was drawn under it, and a ripe crop of Thửa 5 covered his legs in the row-8.9 aisle. Two rules:
// draw order compares a decoration's footprint, not its foot point (depthCompare), and no character stands where a crop,
// a default decoration or a fixed piece drawn after it covers its body. Rects are ink bounding boxes, so they overstate.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import scene from './scene-data.json' with {type: 'json'};
import {ELVES, NORBERT, elfPose} from './garden-elves.mjs';
import {FRIENDS, friendPose} from './garden-friends.mjs';
import {depthCompare, decorFootprintRect} from './decor-runtime.mjs';
import {decorationPlacements} from './default-decor.mjs';
import {ITEM_ART} from './item-art.mjs';
import {WIZARD_LAYOUT} from './wizard-scenery.mjs';
import {HEARTH_SPOT, HEARTH} from './garden-xmas.mjs';

const iso = (c, r) => [(c - r) * 32, (c + r) * 16];
const point = (c, r) => ({c0: c, c1: c, r0: r, r1: r});
const inkBox = (x, y, a, flip = false) => {
  const l = a.bounds.x - a.pivotX, r = l + a.bounds.w;
  return {x0: x + (flip ? -r : l), x1: x + (flip ? -l : r), y0: y + a.bounds.y - a.pivotY, y1: y + a.bounds.y + a.bounds.h - a.pivotY};
};
const ELF = {pivotX: 40, pivotY: 76, bounds: {x: 11, y: 14, w: 53, h: 63}};
const FRIEND = {pivotX: 40, pivotY: 76, bounds: {x: 11, y: 8, w: 58, h: 69}};

// Everything that can stand in front of a character: the tallest ripe crop on every plot cell, every earned decoration
// at its home, Hagrid, Fang, the owl, the greenhouse and the December hearth.
const crops = JSON.parse(fs.readFileSync(new URL('./crop-complete-manifest.json', import.meta.url))).items.flatMap((item) => item.frames);
const reach = crops.reduce((e, f) => ({l: Math.max(e.l, f.pivotX - f.bounds.x), r: Math.max(e.r, f.bounds.x + f.bounds.w - f.pivotX), u: Math.max(e.u, f.pivotY - f.bounds.y)}), {l: 0, r: 0, u: 0});
const occluders = [];
for (const p of scene.plots) for (let i = 0; i < p.width * p.height; i++) {
  const c = p.col + i % p.width, r = p.row + Math.floor(i / p.width), [x, y] = iso(c, r);
  occluders.push({id: `crop ${c},${r}`, xy: [x, y], ground: point(c, r), ink: {x0: x - reach.l, x1: x + reach.r, y0: y - reach.u, y1: y}});
}
for (const d of decorationPlacements(scene)) {
  const [x, y] = iso(...d.at);
  occluders.push({id: d.id, xy: [x, y], ground: decorFootprintRect(...d.at, d.footprint, d.facing), ink: inkBox(x, y, ITEM_ART[d.facing === 'right' ? d.id + '_right' : d.id] ?? ITEM_ART[d.id])});
}
for (const w of Object.values(WIZARD_LAYOUT)) {
  const [x, y] = iso(w.col, w.row), b = w.bounds;
  occluders.push({id: w.id, xy: [x, y], ground: w.id === 'greenhouse' ? null : point(w.col, w.row), ink: {x0: x + b.left, x1: x + b.right, y0: y + b.top, y1: y + b.bottom}});
}
{ const [x, y] = iso(...HEARTH_SPOT); occluders.push({id: 'hearth', xy: [x, y], ground: null, ink: inkBox(x, y, HEARTH)}); }

/** Share of a character's ink box covered by the largest sprite drawn after it. */
function cover(c, r, ink, skip = []) {
  const [x, y] = iso(c, r), me = {xy: [x, y], ground: point(c, r)}, area = (ink.x1 - ink.x0) * (ink.y1 - ink.y0);
  let worst = {share: 0, by: ''};
  for (const o of occluders) {
    if (skip.includes(o.id) || depthCompare(me, o) >= 0) continue;
    const w = Math.min(ink.x1, o.ink.x1) - Math.max(ink.x0, o.ink.x0), h = Math.min(ink.y1, o.ink.y1) - Math.max(ink.y0, o.ink.y0);
    if (w > 0 && h > 0 && w * h / area > worst.share) worst = {share: w * h / area, by: o.id};
  }
  return worst;
}
const walkerCover = (art) => (c, r, flip) => cover(c, r, inkBox(...iso(c, r), art, flip));
const walkers = [
  ...Object.entries(ELVES).map(([id, e]) => ({id, stops: e.stops, sleep: e.sleep, cover: walkerCover(ELF), at: (t) => elfPose(id, t)})),
  {id: 'norbert', stops: NORBERT.stops, sleep: NORBERT.sleep, cover: walkerCover(ELF), at: (t) => elfPose('norbert', t, NORBERT.stops)},
  ...Object.entries(FRIENDS).filter(([, f]) => f.stops).map(([id, f]) => ({id, stops: f.stops, cover: walkerCover(FRIEND), at: (t) => friendPose(id, t)})),
];

test('a character in front of a decoration footprint is drawn after it, one behind before it', () => {
  const court = decorationPlacements(scene).find((d) => d.id === 'decoration-31');
  const ground = decorFootprintRect(...court.at, court.footprint, court.facing), decor = {xy: iso(...court.at), ground};
  const at = (c, r) => ({xy: iso(c, r), ground: point(c, r)});
  // Where Dobby used to stand: south of the court's west half, a foot point that sorted before the court's.
  assert.ok(depthCompare(at(3, 8.9), decor) > 0);
  assert.ok(depthCompare(at(ground.c1 + 0.3, 8), decor) > 0, 'east of it');
  assert.ok(depthCompare(at(4.3, ground.r0 - 0.3), decor) < 0, 'north of it, under its east end');
  assert.ok(depthCompare(at(ground.c0 - 0.3, 8), decor) < 0, 'west of it');
  // Points keep the old foot order.
  assert.ok(depthCompare(at(3, 9), at(4, 10)) < 0);
  assert.ok(depthCompare({xy: [0, 10]}, {xy: [0, 5]}) > 0);
});

test('no crop, default decoration or fixed piece covers a standing or sleeping character (≤ 20 % of its box)', () => {
  for (const w of walkers) {
    for (const [c, r, pose, stay, right] of w.stops) {
      if (!stay) continue;
      const k = w.cover(c, r, right === true);
      assert.ok(k.share <= 0.2, `${w.id} ${pose} at ${c},${r}: ${Math.round(k.share * 100)} % under ${k.by}`);
    }
    if (w.sleep) { const k = w.cover(...w.sleep, false); assert.ok(k.share <= 0.2, `${w.id} sleeps at ${w.sleep} under ${k.by}`); }
  }
  for (const id of ['gardener', 'owl', 'fang']) {
    const s = WIZARD_LAYOUT[id], [x, y] = iso(s.col, s.row), b = s.bounds;
    // Fang sits beside Hagrid on purpose (05/11/2026): characters may overlap each other, never an asset.
    const k = cover(s.col, s.row, {x0: x + b.left, x1: x + b.right, y0: y + b.top, y1: y + b.bottom}, ['gardener', 'fang', 'owl']);
    assert.ok(k.share <= 0.2, `${id} under ${k.by}`);
  }
});

test('walking, a character passes behind things but is never more than half hidden for over a tenth of its loop', () => {
  for (const w of walkers) {
    let samples = 0, hidden = 0;
    for (let clock = 1; clock < 200000; clock += 41) {
      const [c, r, , right] = w.at(clock);
      samples += 1;
      if (w.cover(c, r, right).share > 0.5) hidden += 1;
    }
    assert.ok(hidden / samples <= 0.1, `${w.id} half hidden ${Math.round(hidden / samples * 100)} % of the time`);
  }
});

test('characters do not share a standing spot, and visitors keep clear of the elves', () => {
  const spots = new Map();
  const add = (owner, c, r) => { const key = `${c},${r}`; assert.ok(!spots.has(key) || spots.get(key) === owner, `${owner} and ${spots.get(key)} both stand at ${key}`); spots.set(key, owner); };
  // Friends come one group at a time, so they only need to keep off the elves' and Norbert's spots.
  for (const w of walkers.filter((w) => !FRIENDS[w.id])) { for (const [c, r, , stay] of w.stops) if (stay) add(w.id, c, r); add(w.id, ...w.sleep); }
  // Bodies are ~55 px wide: a character stands at least 40 px (screen x) from another one's spot on the same band of rows.
  const elfSpots = [...spots].map(([key, owner]) => [...key.split(',').map(Number), owner]);
  const apart = ([c, r], [ec, er]) => { const [x, y] = iso(c, r), [ex, ey] = iso(ec, er); return Math.abs(x - ex) >= 40 || Math.abs(y - ey) >= 64; };
  for (const [c, r, owner] of elfSpots) for (const [ec, er, other] of elfSpots) if (owner !== other) assert.ok(apart([c, r], [ec, er]), `${owner} at ${c},${r} stands on ${other} at ${ec},${er}`);
  for (const w of walkers.filter((w) => FRIENDS[w.id])) for (const [c, r, , stay] of w.stops) if (stay) {
    for (const [ec, er, owner] of elfSpots) assert.ok(apart([c, r], [ec, er]), `${w.id} at ${c},${r} stands on ${owner} at ${ec},${er}`);
  }
});
