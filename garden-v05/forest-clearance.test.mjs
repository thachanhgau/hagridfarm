import test from 'node:test';
import assert from 'node:assert/strict';
import {GARDEN_STAGES, stageBoundary} from './garden-growth.mjs';
import {forestRectOutsideBoundary} from './forest-clearance.mjs';

const scene = {origin: {x: 1120, y: 300}, tileWidth: 64, tileHeight: 32};
const point = (scene, col, row) => [scene.origin.x + (col - row) * scene.tileWidth / 2, scene.origin.y + (col + row) * scene.tileHeight / 2];
const around = ([x, y], size = 8) => ({left: x - size, top: y - size, right: x + size, bottom: y + size});

test('all seven stage polygons reject contained and edge-crossing sprites', () => {
  for (const stage of GARDEN_STAGES) {
    const boundary = stageBoundary(stage);
    assert.equal(forestRectOutsideBoundary({left: 0, top: 0, right: 80, bottom: 20}, scene, boundary), true, `stage ${stage.id} far outside`);
    assert.equal(forestRectOutsideBoundary(around(point(scene, 10, 4), 4), scene, boundary), false, `stage ${stage.id} contained`);
    const a = boundary[0], b = boundary[1];
    assert.equal(forestRectOutsideBoundary(around(point(scene, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2), 5), scene, boundary), false, `stage ${stage.id} edge`);
    assert.equal(forestRectOutsideBoundary(around(point(scene, ...boundary[0]), 5), scene, boundary), false, `stage ${stage.id} corner`);
  }
});

test('concave cutouts remain available to the outside forest', () => {
  assert.equal(forestRectOutsideBoundary(around(point(scene, 5, 20), 5), scene, stageBoundary(GARDEN_STAGES[3])), true);
  assert.equal(forestRectOutsideBoundary(around(point(scene, 23, 20), 5), scene, stageBoundary(GARDEN_STAGES[4])), true);
  assert.equal(forestRectOutsideBoundary(around(point(scene, 11, 31), 5), scene, stageBoundary(GARDEN_STAGES[6])), false);
});

test('clearance protects the fence height, fixed-row expansion, and translated scenes', () => {
  const stage = GARDEN_STAGES[0], boundary = stageBoundary(stage), [x, y] = point(scene, ...boundary[0]);
  assert.equal(forestRectOutsideBoundary({left: x - 5, top: y - 45, right: x + 5, bottom: y - 40}, scene, boundary), false);
  const moved = {...scene, origin: {x: 400, y: -120}}, [mx, my] = point(moved, 10, 4);
  assert.equal(forestRectOutsideBoundary(around([mx, my], 4), moved, boundary), false);
});
