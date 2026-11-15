// docs/garden/no-overlap-rule.md (owner 15/11/2026: «các món đồ ở trên sẽ ko bị xuyên qua hoặc món dưới đè lên món
// trên»): draw order follows the ground (§3), sprites stay inside their footprint prism (§2) and walkers never step into
// a decoration's footprint (§4).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import scene from './scene-data.json' with {type: 'json'};
import {depthSort, decorFootprintRect} from './decor-runtime.mjs';
import {decorationPlacements} from './default-decor.mjs';
import {ELVES, NORBERT, clearStops, elfPose} from './garden-elves.mjs';
import {FRIENDS} from './garden-friends.mjs';
import {COMPLETE_SCENERY} from './complete-object-art.mjs';
import {sceneryGroundRect} from './garden-object-metrics.mjs';

const iso = (c, r) => [(c - r) * 32, (c + r) * 16];
const westOrNorth = (A, B) => A.c1 <= B.c0 || A.r1 <= B.r0;

test('§3 depthSort never draws a footprint before one wholly west or north of it', () => {
  let seed = 7;
  const rand = (n) => Math.floor(((seed = (seed * 16807) % 2147483647) / 2147483647) * n);
  for (let trial = 0; trial < 3000; trial++) {
    const objects = [];
    for (let k = 0; k < 10; k++) {
      const w = 1 + rand(3), h = 1 + rand(3), c0 = rand(12), r0 = rand(12), g = {c0, r0, c1: c0 + w, r1: r0 + h};
      if (objects.some(({ground: o}) => g.c0 < o.c1 && o.c0 < g.c1 && g.r0 < o.r1 && o.r0 < g.r1)) continue;
      objects.push({ground: g, xy: iso(c0 + w / 2, r0 + h)});
      if (rand(2)) {const c = rand(14), r = rand(14); objects.push({ground: {c0: c, c1: c, r0: r, r1: r}, xy: iso(c, r)});}
    }
    const order = depthSort(objects);
    assert.equal(order.length, objects.length);
    for (let i = 0; i < order.length; i++) for (let j = i + 1; j < order.length; j++) {
      const A = order[i].ground, B = order[j].ground;
      assert.ok(!(westOrNorth(B, A) && !westOrNorth(A, B)), `trial ${trial}: ${JSON.stringify(B)} drawn after ${JSON.stringify(A)}`);
    }
  }
});

test('§3 objects without ground keep foot order', () => {
  const objects = [{id: 'b', xy: [0, 9]}, {id: 'a', xy: [5, 3]}, {id: 'c', xy: [-1, 9]}];
  assert.deepEqual(depthSort(objects).map((o) => o.id), ['a', 'c', 'b']);
});

// Measured 15/11/2026: three overhung; P4 refit the two Halloween pieces (build-overhang-refit.mjs). The greenhouse
// record here is not what the scene draws: its authored COMPLETE_SCENERY frames replace it (scene-renderer decorAssets)
// on its 3×2 scenery ground, so the scene's own art and ground are measured. A new asset that overhangs does not enter the catalog.
// Characters (Hagrid) stand on a 0×0 foot point and are covered by character-cover.test.mjs instead.
const drawn = new Map(COMPLETE_SCENERY.map((asset) => [asset.id, asset]));

test('§2 every decoration sprite stays inside its footprint prism (≤ 2 px), both views', () => {
  const {items} = JSON.parse(fs.readFileSync(new URL('./decor-assets-manifest.json', import.meta.url)));
  const over = new Set();
  for (const record of items) for (const facing of ['default', 'right']) {
    const art = record.kind === 'scenery' ? drawn.get(record.id) : null, item = art ?? record, b = facing === 'right' ? item.rightBounds : item.bounds;
    if (!b || !record.footprintTiles) continue;
    const R = art ? sceneryGroundRect(record.id, 0, 0) : decorFootprintRect(0, 0, record.footprintTiles, facing);
    const left = (R.c0 - R.r1) * 32 - (b.x - item.pivotX), right = b.x + b.w - item.pivotX - (R.c1 - R.r0) * 32;
    const below = b.y + b.h - item.pivotY - (R.c1 + R.r1) * 16;
    if (Math.max(left, right, below) > 2) over.add(`${record.id} ${facing} ${left}/${right}/${below}`);
  }
  assert.deepEqual([...over], []);
});

const walkers = [
  ...Object.entries(ELVES).map(([id, e]) => [id, e.stops]), ['norbert', NORBERT.stops],
  ...Object.entries(FRIENDS).filter(([, f]) => f.stops).map(([id, f]) => [id, f.stops]),
];
const inRect = ([c, r], R) => c > R.c0 && c < R.c1 && r > R.r0 && r < R.r1;

test('§4 the authored routes keep clear of the default decorations', () => {
  const blocked = decorationPlacements(scene).map((d) => decorFootprintRect(...d.at, d.footprint, d.facing));
  for (const [id, stops] of walkers) assert.deepEqual(clearStops(stops, blocked), stops, id);
});

test('§4 a decoration dropped on a route turns the walker back before its footprint', () => {
  for (const [id, stops] of walkers) for (const stop of stops) for (const [w, h] of [[1, 1], [2, 1], [1, 3]]) {
    const R = {c0: stop[0] - w / 2 + 0.3, c1: stop[0] + w / 2 + 0.3, r0: stop[1] - h / 2, r1: stop[1] + h / 2};
    const cleared = clearStops(stops, [R]);
    if (!cleared) continue; // every stop covered: not drawn
    for (let t = 0; t < 120000; t += 37) assert.ok(!inRect(elfPose(id, t, cleared), R), `${id} inside ${JSON.stringify(R)} at ${t}`);
  }
});
