import test from 'node:test';
import assert from 'node:assert/strict';
import scene from './scene-data.json' with {type: 'json'};
import {drawNaturalMeadow} from './meadow-ground.mjs';

function fakeContext() {
  const operations = [];
  const context = {
    operations,
    globalAlpha: 1,
    imageSmoothingEnabled: true,
    save() { operations.push({kind: 'save'}); },
    restore() { operations.push({kind: 'restore'}); },
    beginPath() { operations.push({kind: 'beginPath'}); },
    moveTo(x, y) { operations.push({kind: 'moveTo', x, y}); },
    lineTo(x, y) { operations.push({kind: 'lineTo', x, y}); },
    closePath() { operations.push({kind: 'closePath'}); },
    clip() { operations.push({kind: 'clip'}); },
    fill() { operations.push({kind: 'fill', color: this.fillStyle, alpha: this.globalAlpha}); },
    stroke() { operations.push({kind: 'stroke', color: this.strokeStyle, alpha: this.globalAlpha}); },
    fillRect(x, y, width, height) {
      operations.push({kind: 'fillRect', x, y, width, height, color: this.fillStyle, alpha: this.globalAlpha});
    },
  };
  return context;
}

test('natural meadow is deterministic, clipped to scene regions, and seam-free by default', () => {
  const first = fakeContext();
  const second = fakeContext();
  const firstSummary = drawNaturalMeadow(first, scene);
  const secondSummary = drawNaturalMeadow(second, scene);

  assert.deepEqual(firstSummary, secondSummary);
  assert.equal(firstSummary.regions, 1 + scene.terrainExtensions.length);
  assert.ok(firstSummary.patches >= 18 && firstSummary.patches <= 42);
  assert.ok(firstSummary.tufts >= 34 && firstSummary.tufts <= 86);
  assert.deepEqual(first.operations, second.operations);
  assert.equal(first.operations.some((operation) => operation.kind === 'drawImage'), false);
  assert.equal(first.operations.some((operation) => operation.kind === 'stroke'), false);
  assert.equal(first.operations.filter((operation) => operation.kind === 'clip').length, 1);
  assert.equal(first.operations.filter((operation) => operation.kind === 'fill').length, 1 + firstSummary.patches);
  assert.ok(first.operations.some((operation) => operation.color === '#71934b'));
});

test('grid mode is an explicit overlay and still uses the same deterministic ground', () => {
  const context = fakeContext();
  const summary = drawNaturalMeadow(context, scene, {grid: true});
  assert.equal(summary.regions, 1 + scene.terrainExtensions.length);
  assert.ok(context.operations.some((operation) => operation.kind === 'stroke'));
  assert.ok(context.operations.some((operation) => operation.color === 'rgba(36,72,63,.42)'));
});

