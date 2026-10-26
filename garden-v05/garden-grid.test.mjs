import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import scene from './scene-data.json' with {type: 'json'};
import motion from './motion-data.json' with {type: 'json'};

globalThis.FARM_SCENE = scene;
globalThis.FARM_MOTION = motion;
const renderer = await import('./scene-renderer.mjs');

test('crop, pen and decoration ground all use the same 64×32 pixel cell', () => {
  assert.equal(scene.plotCellScale, 1);
  for (const plot of scene.plots) {
    const ground = renderer.plotPhysicalBounds(plot, scene);
    assert.equal(ground.width, 3);
    assert.equal(ground.height, 3);
    const a = renderer.iso(...renderer.plotCellPosition(plot, 0, scene), scene);
    const b = renderer.iso(...renderer.plotCellPosition(plot, 1, scene), scene);
    assert.deepEqual([b[0] - a[0], b[1] - a[1]], [32, 16]);
    for (let cell = 0; cell < 9; cell++) {
      const point = renderer.iso(...renderer.plotCellPosition(plot, cell, scene), scene);
      assert.deepEqual(renderer.pickFromWorld(...point, 18, scene), {plot: plot.id, index: cell});
    }
  }
});

test('pen collision ground agrees with its painted fence, including after a move', async () => {
  const {groundRect} = await import('./decor-placement-ui.mjs');
  const {penFencePieces} = await import('./garden-pen-details.mjs');
  for (const pen of [...scene.pens, {...scene.pens[0], col: 10, row: 8}]) {
    const pieces = penFencePieces(pen, (c, r) => [c, r]);
    const points = pieces.flatMap(p => [p.a, p.b]);
    assert.deepEqual(groundRect('pen', pen, scene), {
      c0: Math.min(...points.map(p => p[0])), c1: Math.max(...points.map(p => p[0])),
      r0: Math.min(...points.map(p => p[1])), r1: Math.max(...points.map(p => p[1])),
    });
  }
});

test('every placed asset has a native pixel size, foot pivot and whole-cell footprint', async () => {
  const {gardenObjectMetrics} = await import('./garden-object-metrics.mjs');
  const decor = JSON.parse(fs.readFileSync(new URL('./decor-assets-manifest.json', import.meta.url))).items;
  const metrics = gardenObjectMetrics(scene, motion, decor, renderer.DECORATION_LAYOUT);
  for (const entry of metrics) {
    assert.ok(entry.footprint.every(n => Number.isInteger(n) && n >= 1), entry.id);
    assert.ok(entry.sprite.width > 0 && entry.sprite.height > 0, entry.id);
    assert.ok(Number.isFinite(entry.sprite.pivotX) && Number.isFinite(entry.sprite.pivotY), entry.id);
    const [cols, rows] = entry.footprint;
    assert.equal(entry.ground.width, (cols + rows) * 32, entry.id);
    assert.equal(entry.ground.height, (cols + rows) * 16, entry.id);
    assert.equal(entry.pixelScale, 1, entry.id);
  }
  for (const item of [...motion.items, ...decor]) assert.ok(metrics.some(m => m.id === item.id), item.id);
  assert.equal(metrics.filter(m => m.kind === 'plot').length, 18);
  assert.equal(metrics.filter(m => m.kind === 'pen').length, 6);
  assert.equal(metrics.filter(m => m.kind === 'earned-decoration').length, Object.keys(renderer.DECORATION_LAYOUT).length * 2);
});

test('forest instances use integer pixel magnification, with footprint seams for large pieces', async () => {
  const {createForestSurround, FOREST_ASSETS} = await import('./forest-surround.mjs');
  const {canopyClusters} = await import('./forest-composition.mjs');
  const {drawFootprintGrid} = await import('./garden-grid.mjs');
  assert.ok(createForestSurround(scene).placements.every(p => Number.isInteger(p.scale) && p.scale >= 1));
  const sizes = Object.fromEntries(FOREST_ASSETS.map(a => [a.id, a]));
  for (const tree of canopyClusters(scene, sizes)) {
    assert.ok(Number.isInteger(tree.w / sizes[tree.id].width));
    assert.equal(tree.w / sizes[tree.id].width, tree.h / sizes[tree.id].height);
  }
  const lines = [];
  const context = {save() {}, restore() {}, beginPath() {}, closePath() {}, fill() {}, stroke() {}, moveTo() {}, lineTo(...p) {lines.push(p);}};
  drawFootprintGrid(context, {c0: 0, c1: 3, r0: 0, r1: 2}, (c, r) => [c, r], true);
  assert.deepEqual(lines.slice(3), [[1, 2], [2, 2], [3, 1]], '3×2 ground has three internal unit seams');
});

test('moving or rotating uses the same dimensions and never mutates old saved coordinates', async () => {
  const {spriteGridMetrics, footprintPixels, worldToGrid, snapGridPoint} = await import('./garden-grid.mjs');
  const {decorFootprintRect, decorSpot} = await import('./decor-runtime.mjs');
  const saved = {placements: ['decor_cauldron'], positions: {decor_cauldron: [12.5, 8]}};
  const before = JSON.stringify(saved);
  for (const facing of ['default', 'right']) {
    const spec = spriteGridMetrics({width: 160, height: 192, pivotX: 80, pivotY: 176}, [3, 2], facing);
    for (const [col, row] of [[3, 7], [12.5, 8], [-2, 3.5]]) {
      const rect = decorFootprintRect(col, row, [3, 2], facing);
      assert.equal(rect.c1 - rect.c0, spec.footprint[0]);
      assert.equal(rect.r1 - rect.r0, spec.footprint[1]);
      assert.deepEqual(snapGridPoint(worldToGrid(...renderer.iso(col, row, scene), scene)), [col, row]);
    }
    assert.deepEqual(spec.ground, footprintPixels(spec.footprint));
    assert.equal(spec.sprite.width, 160);
  }
  assert.deepEqual(decorSpot(saved, 'decor_cauldron'), [12.5, 8]);
  assert.deepEqual(decorSpot({placements: ['decor_cauldron']}, 'decor_cauldron'), [3, 7.15]);
  assert.equal(JSON.stringify(saved), before);
});
