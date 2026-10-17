import test from 'node:test';
import assert from 'node:assert/strict';
import {decorObjects, DECOR_SLOTS, DECOR_ANGLES, normalizeDecorFacing, decorFacingFor} from './decor-runtime.mjs';

const assets = new Map([['lantern', {id: 'lantern'}], ['arch', {id: 'arch'}]]);
const iso = (c, r) => [c - r, (c + r) / 2];

test('render only owned placements; preview does not mutate server snapshot', () => {
  const d = {owned: ['lantern'], placements: ['lantern', 'arch', null, null, null, null]};
  const before = JSON.stringify(d);
  assert.deepEqual(decorObjects(d, assets, iso).map((o) => o.id), ['lantern']);
  assert.equal(decorObjects(d, assets, iso)[0].facing, 'default');
  const preview = decorObjects(d, assets, iso, {itemId: 'lantern', slot: 4});
  assert.equal(preview.length, 1);
  assert.equal(preview[0].slot, 4);
  assert.equal(preview[0].preview, true);
  assert.equal(preview[0].facing, 'default');
  assert.equal(JSON.stringify(d), before);
  assert.equal(decorObjects(d, assets, iso, {itemId: 'lantern', slot: 8}).length, 0);
});

test('six placement sockets have distinct ground anchors', () => {
  assert.equal(DECOR_SLOTS.length, 6);
  assert.equal(new Set(DECOR_SLOTS.map((s) => `${s.col},${s.row}`)).size, 6);
  assert.deepEqual(DECOR_SLOTS.map((s) => s.id), [0, 1, 2, 3, 4, 5]);
});

test('decorations support two placement angles: default and right-facing', () => {
  assert.deepEqual(DECOR_ANGLES.map((a) => a.id), ['default', 'right']);
  assert.equal(normalizeDecorFacing('right'), 'right');
  assert.equal(normalizeDecorFacing(1), 'right');
  assert.equal(normalizeDecorFacing('default'), 'default');
  assert.equal(normalizeDecorFacing(undefined), 'default');

  const d = {
    owned: ['lantern', 'arch'],
    placements: ['lantern', 'arch', null, null, null, null],
    rotations: {lantern: 'right', arch: 'default'},
  };
  assert.equal(decorFacingFor(d, 'lantern'), 'right');
  assert.equal(decorFacingFor(d, 'arch'), 'default');
  const placed = decorObjects(d, assets, iso);
  assert.equal(placed.find((o) => o.id === 'lantern')?.facing, 'right');
  assert.equal(placed.find((o) => o.id === 'arch')?.facing, 'default');

  const previewRight = decorObjects(d, assets, iso, {itemId: 'arch', slot: 3, facing: 'right'});
  assert.equal(previewRight.find((o) => o.id === 'arch')?.facing, 'right');
});
