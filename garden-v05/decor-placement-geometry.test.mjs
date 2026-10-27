import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import scene from './scene-data.json' with {type: 'json'};
import {CREATURE} from './balance-data.mjs';
import {GARDEN_PATHS} from './garden-landscape.mjs';
import {GARDEN_STAGES, stageContains, keepsakeAnchorRow} from './garden-growth.mjs';
import {earnedDecorArt} from './earned-decor-sprites.mjs';
import {
  DECORATION_SPACE,
  KEEPSAKE_LEGACY_LAYOUT,
  KEEPSAKE_ACCESS_PATHS,
  KEEPSAKE_DISPLAY_LAYOUT,
  decorationSpaceContains,
  keepsakeGroundRect,
  keepsakeDisplayPlacements,
  keepsakeObstacles,
  keepsakeSpriteRect,
  placementSuggestions,
  rectIntersects,
} from './decor-placement-geometry.mjs';
import {KEEPSAKE_ART} from './complete-object-art.mjs';

const overlap = (left, right) => Math.max(0, Math.min(left.right, right.right) - Math.max(left.left, right.left))
  * Math.max(0, Math.min(left.bottom, right.bottom) - Math.max(left.top, right.top));
const area = rect => Math.max(0, rect.right - rect.left) * Math.max(0, rect.bottom - rect.top);
const iso = (col, row) => [scene.origin.x + (col - row) * scene.tileWidth / 2, scene.origin.y + (col + row) * scene.tileHeight / 2];
const allKeepsakes = Object.fromEntries(Object.keys(CREATURE).map(species => [species, 1]));
const rectArea = rect => Math.max(0, rect.right - rect.left) * Math.max(0, rect.bottom - rect.top);
const overlapRatio = (left, right) => overlap(left, right) / Math.min(rectArea(left), rectArea(right));
const require = createRequire(import.meta.url);
const spriteRect = (asset, col, row) => {
  const [x, y] = iso(col, row);
  const bounds = asset?.bounds ?? {x: 0, y: 0, w: asset?.width ?? 0, h: asset?.height ?? 0};
  const left = x - (asset?.pivotX ?? 0) + bounds.x;
  const top = y - (asset?.pivotY ?? 0) + bounds.y;
  return {left, top, right: left + bounds.w, bottom: top + bounds.h};
};
const plotPhysicalBounds = (plot) => {
  // Keep the test on the same physical contract as scene-renderer.mjs. The
  // Crop ground shares the common 1×1 tile; each plot covers exactly 3×3.
  const scale = Number(scene.plotCellScale) || 1;
  const centerCol = Number(plot.col) + (Number(plot.width) - 1) / 2;
  const centerRow = Number(plot.row) + (Number(plot.height) - 1) / 2;
  return {
    c0: centerCol - Number(plot.width) * scale / 2,
    c1: centerCol + Number(plot.width) * scale / 2,
    r0: centerRow - Number(plot.height) * scale / 2,
    r1: centerRow + Number(plot.height) * scale / 2,
  };
};
const earnedLayout = [
  ['decoration-3', -.5, 3, 2, 1], ['decoration-7', 5.75, 3, 2, 1], ['decoration-11', 12.25, 3, 2, 1], ['decoration-15', 18.75, 3, 2, 1],
  ['decoration-19', -.5, 6, 2, 1], ['decoration-23', 5.75, 6, 2, 1], ['decoration-27', 12.25, 6, 2, 1], ['decoration-30', 18.75, 6, 2, 1],
  ['decoration-31', -.5, 7, 2, 1], ['decoration-35', 5.75, 7, 1, 1], ['decoration-39', 12.25, 7, 2, 1], ['decoration-43', 18.75, 7, 2, 1],
  ['decoration-46', -.5, 9, 2, 1], ['decoration-47', 5.75, 9, 2, 1], ['decoration-51', 12.25, 9, 2, 1], ['decoration-55', 18.75, 9, 2, 1],
  ['decoration-59', -.5, 13, 2, 1], ['decoration-63', 5.75, 13, 2, 1], ['decoration-67', 12.25, 13, 2, 1], ['decoration-71', 18.75, 13, 2, 1],
  ['decoration-75', -.5, 14, 2, 1], ['decoration-80', 5.75, 14, 2, 1], ['decoration-81', 12.25, 14, 2, 1], ['decoration-83', 18.75, 14, 2, 1],
  ['decoration-87', -.5, 15, 2, 1], ['decoration-91', 5.75, 15, 2, 1], ['decoration-95', 12.25, 15, 2, 1], ['decoration-98', 18.75, 15, 2, 1], ['decoration-99', 25, 15, 2, 1],
];
const findCanonicalServerModule = () => {
  const testDirectory = path.dirname(fileURLToPath(import.meta.url));
  const configuredRoot = process.env.GARDEN_HPVNN_ROOT;
  if (configuredRoot) {
    const candidate = path.resolve(configuredRoot, 'functions', 'games', 'garden-decoration-space.js');
    return fs.existsSync(candidate) ? candidate : null;
  }

  // The source worktree does not necessarily contain the paired Functions
  // checkout. Without an explicit pair, only inspect this worktree's own git
  // root; never choose another checkout because it happens to export 33.5.
  let gitRoot = null;
  try {
    gitRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], {
      cwd: testDirectory,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
  const candidate = path.join(gitRoot, 'functions', 'games', 'garden-decoration-space.js');
  return fs.existsSync(candidate) ? candidate : null;
};

test('placement space matches the final 33.5-row scene edge', () => {
  assert.deepEqual(DECORATION_SPACE, {minCol: -5, maxCol: 33, minRow: -1, maxRow: 33.5});
  assert.equal(KEEPSAKE_DISPLAY_LAYOUT.length, Object.keys(CREATURE).length);
  assert.deepEqual(KEEPSAKE_DISPLAY_LAYOUT.map(entry => entry.species), Object.keys(CREATURE));
  assert.deepEqual(KEEPSAKE_LEGACY_LAYOUT.map(entry => entry.col + .5), [2.5, 4.5, 6.5, 8.5, 10.5, 12.5, 14.5, 16.5, 18.5, 20.5, 22.5, 24.5]);
  assert.equal(decorationSpaceContains(DECORATION_SPACE.minCol, DECORATION_SPACE.minRow), true);
  assert.equal(decorationSpaceContains(DECORATION_SPACE.maxCol, DECORATION_SPACE.maxRow), true);
  assert.equal(decorationSpaceContains(DECORATION_SPACE.maxCol + .5, DECORATION_SPACE.maxRow), false);
  assert.equal(decorationSpaceContains(DECORATION_SPACE.maxCol, DECORATION_SPACE.maxRow + .5), false);
});

const canonicalServerPath = findCanonicalServerModule();
test('client decoration space stays in parity with the canonical Functions bound', {skip: !canonicalServerPath}, () => {
  const serverPath = canonicalServerPath;
  const server = require(serverPath);
  assert.ok(server.DECORATION_SPACE, `${serverPath}: canonical DECORATION_SPACE export is required`);
  assert.deepEqual(DECORATION_SPACE, server.DECORATION_SPACE);
  assert.strictEqual(server.DECORATION_BOUNDS, server.DECORATION_SPACE);
  for (const point of [[-5, -1], [33, 33.5]]) assert.equal(server.isDecorationSpot(point), true);
  for (const point of [[33.5, 33.5], [33, 34], [33, 33.25]]) assert.equal(server.isDecorationSpot(point), false);
});

test('pre-final keepsakes retain the legacy one-row frontier without paired overlaps', () => {
  const levels = [1, 10, 24, 48, 72];
  for (const level of levels) {
    const stage = GARDEN_STAGES.find(entry => entry.level === level);
    const obstacles = keepsakeObstacles({keepsakes: allKeepsakes}, stage, (...at) => iso(...at), keepsakeAnchorRow);
    const expectedCount = level === 1 ? 10 : 12; // the final two legacy columns are outside the level-1 right edge
    assert.equal(obstacles.placements.length, expectedCount, `level ${level}: visible statues`);
    assert.deepEqual(obstacles.placements.map(entry => entry.anchor[0]), Array.from({length: expectedCount}, (_, index) => 2.5 + index * 2));
    assert.equal(new Set(obstacles.placements.map(entry => entry.anchor.join(','))).size, expectedCount, `level ${level}: unique anchors`);
    assert.ok(obstacles.placements.every(entry => stageContains(stage, ...entry.anchor)), `level ${level}: stage-contained anchors`);
    assert.deepEqual(obstacles.access, [], `level ${level}: final-plaza path is not reserved early`);
    for (let left = 0; left < obstacles.ground.length; left += 1) {
      for (let right = left + 1; right < obstacles.ground.length; right += 1) {
        assert.equal(rectIntersects(obstacles.ground[left], obstacles.ground[right]), false, `level ${level}: ground overlap ${left}/${right}`);
      }
    }
  }
  // Chapter 6 (level 100) already holds the whole plaza and its access path.
  for (const stage of GARDEN_STAGES.filter(entry => entry.level >= 100)) {
    const final = keepsakeDisplayPlacements(stage, keepsakeAnchorRow);
    assert.equal(final.length, 12, `level ${stage.level}: plaza`);
    assert.deepEqual([...new Set(final.map(entry => entry.anchor[1]))], [24.5, 26.5]);
    const {ground, access} = keepsakeObstacles({keepsakes: allKeepsakes}, stage, (...at) => iso(...at), keepsakeAnchorRow);
    for (const rect of [...ground, ...access]) {
      for (const [col, row] of [[rect.c0, rect.r0], [rect.c1, rect.r0], [rect.c0, rect.r1], [rect.c1, rect.r1]]) {
        assert.ok(stageContains(stage, col, row), `level ${stage.level}: plaza inside the opened land`);
      }
    }
  }
});

test('keepsake plaza uses real bases, authored silhouettes, and a reachable side path', () => {
  const state = {keepsakes: Object.fromEntries(Object.keys(CREATURE).map(species => [species, 1]))};
  const obstacles = keepsakeObstacles(state, {bottom: 33.5}, (...at) => iso(...at, scene));
  assert.equal(obstacles.ground.length, 12);
  assert.equal(obstacles.screen.length, 12);
  for (const ground of obstacles.ground) {
    assert.ok(ground.c0 >= DECORATION_SPACE.minCol && ground.c1 <= DECORATION_SPACE.maxCol);
    assert.ok(ground.r0 >= DECORATION_SPACE.minRow && ground.r1 <= DECORATION_SPACE.maxRow);
    assert.equal(scene.plots.some(plot => rectIntersects(ground, plotPhysicalBounds(plot))), false);
    assert.equal(scene.pens.some(pen => rectIntersects(ground, {
      c0: pen.col, c1: pen.col + pen.width, r0: pen.row, r1: pen.row + pen.height,
    })), false);
    assert.equal(obstacles.access.some(access => rectIntersects(ground, access)), false);
  }
  for (let left = 0; left < obstacles.screen.length; left += 1) {
    for (let right = left + 1; right < obstacles.screen.length; right += 1) {
      assert.ok(overlap(obstacles.screen[left], obstacles.screen[right])
        <= 0.1 * Math.min(area(obstacles.screen[left]), area(obstacles.screen[right])));
    }
  }
  assert.ok(KEEPSAKE_ACCESS_PATHS.some(path => path.c0 <= 16 && path.c1 >= 16 && path.r0 <= 22.5 && path.r1 >= 23));
  assert.ok(GARDEN_PATHS.some(path => path.some(([col, row]) => col === 16 && row === 22.5)));
});

test('final plaza clears physical plots, fixed pond/hut, earned decor, and all twelve statues', () => {
  const obstacles = keepsakeObstacles({keepsakes: allKeepsakes}, GARDEN_STAGES.at(-1), (...at) => iso(...at), keepsakeAnchorRow);
  assert.equal(obstacles.ground.length, 12);
  assert.equal(plotPhysicalBounds(scene.plots[0]).c1 - plotPhysicalBounds(scene.plots[0]).c0, 3);
  const plots = scene.plots.map(plotPhysicalBounds);
  for (const statue of obstacles.ground) {
    assert.ok(plots.every(plot => !rectIntersects(statue, plot)), 'statue ground must clear 3×3 physical plots');
  }
  for (let left = 0; left < obstacles.ground.length; left += 1) {
    for (let right = left + 1; right < obstacles.ground.length; right += 1) {
      assert.equal(rectIntersects(obstacles.ground[left], obstacles.ground[right]), false, `statue ground overlap ${left}/${right}`);
      assert.ok(overlapRatio(obstacles.screen[left], obstacles.screen[right]) <= .1, `statue screen overlap ${left}/${right}`);
    }
  }

  const pond = scene.objects.find(object => object.id === 'pond');
  const hut = scene.objects.find(object => object.id === 'hut');
  for (const object of [pond, hut]) {
    const asset = scene.props.find(prop => prop.id === object.id);
    const fixed = spriteRect(asset, object.col, object.row);
    assert.ok(obstacles.screen.every(statue => overlapRatio(statue, fixed) <= .1), `${object.id}: fixed sprite remains readable`);
  }
  for (const [id, col, row, width, height] of earnedLayout) {
    const asset = earnedDecorArt(id);
    assert.ok(asset, `${id}: earned art exists`);
    const fixed = spriteRect(asset, col + width / 2, row + height);
    assert.ok(obstacles.screen.every(statue => overlapRatio(statue, fixed) <= .1), `${id}: earned sprite remains readable`);
  }
});

test('geometry reads saves without moving existing placed decorations', () => {
  const saved = {
    keepsakes: {...allKeepsakes},
    decorations: {
      placements: ['decoration-3', {itemId: 'decoration-99', facing: 'right'}],
      positions: {'decoration-3': [3.5, 7], 'decoration-99': [26.5, 25]},
    },
  };
  const before = structuredClone(saved);
  keepsakeObstacles(saved, GARDEN_STAGES.at(-1), (...at) => iso(...at), keepsakeAnchorRow);
  assert.deepEqual(saved, before);
});

test('all twelve keepsakes retain authored silhouette metadata', () => {
  for (const placement of KEEPSAKE_DISPLAY_LAYOUT) {
    const art = KEEPSAKE_ART[placement.species];
    assert.ok(art?.authored, placement.species);
    assert.ok(art.bounds.w > 0 && art.bounds.h > 0, placement.species);
    const rect = keepsakeSpriteRect(placement, (...at) => iso(...at, scene), {bottom: 33.5});
    assert.ok(rect.right > rect.left && rect.bottom > rect.top, placement.species);
    assert.equal(keepsakeGroundRect(placement, {bottom: 33.5}).c1 - keepsakeGroundRect(placement, {bottom: 33.5}).c0, 1);
  }
});

test('placement suggestions are bounded and nearest-first', () => {
  const grid = [
    {at: [5, 5], ok: true},
    {at: [1, 1], ok: false},
    {at: [4.5, 5], ok: true},
    {at: [9, 9], ok: true},
  ];
  assert.deepEqual(placementSuggestions(grid, [5, 5], 2).map(spot => spot.at), [[5, 5], [4.5, 5]]);
  assert.equal(placementSuggestions(grid, [5, 5], 1).length, 1);
});

test('rotation stays a preview until the explicit placement action', () => {
  const source = fs.readFileSync(new URL('./decor-placement-ui.mjs', import.meta.url), 'utf8');
  assert.equal(source.includes('save(at,true)'), false);
  assert.match(source, /suggestions:placementSuggestions\([^\n]+,at,18\)/);
  assert.match(source, /apply\.textContent=.*Đặt góc này/);
});
