import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {DB} from './progression-engine.mjs?v=24.9.65';
import {ITEM_ART} from './item-art.mjs?v=24.9.85';
import {earnedDecorArt,earnedDecorFiles,drawEarnedDecorSprite} from './earned-decor-sprites.mjs?v=24.9.85';

const decorationIds = DB.decorations.map(({id}) => id);
const rightRecord = (id) => ITEM_ART[`${id}_right`];

test('scene resolves the same two authored decoration views as the UI map', () => {
  assert.equal(decorationIds.length, 29);
  const defaultFiles = [];
  const rightFiles = [];
  for (const id of decorationIds) {
    const base = ITEM_ART[id];
    const right = rightRecord(id);
    assert.ok(base?.file, `missing default art for ${id}`);
    assert.ok(base?.rightFile || right?.file, `missing right art for ${id}`);
    assert.equal(base.width, 96, `${id} default width`);
    assert.equal(base.height, 112, `${id} default height`);
    assert.equal(base.pivotX, 48, `${id} default pivotX`);
    assert.equal(base.pivotY, 96, `${id} default pivotY`);
    assert.deepEqual(earnedDecorArt(id, 'default'), base);
    const authoredRight = earnedDecorArt(id, 'right');
    assert.equal(authoredRight.file, base.rightFile ?? right.file, `${id} right file`);
    assert.equal(authoredRight.pivotX, 48, `${id} right pivotX`);
    assert.equal(authoredRight.pivotY, 96, `${id} right pivotY`);
    assert.notEqual(base.file, authoredRight.file, `${id} must have two authored views`);
    for (const [view, record] of [['default', base], ['right', authoredRight]]) {
      assert.ok(record.bounds?.w <= 84 && record.bounds?.h <= 80, `${id} ${view} bounds exceed target`);
      assert.ok(fs.existsSync(new URL(record.file, import.meta.url)), `${id} ${view} file missing`);
    }
    defaultFiles.push(base.file);
    rightFiles.push(authoredRight.file);
  }
  assert.equal(new Set(defaultFiles).size, 29, 'default decoration views must be distinct');
  assert.equal(new Set(rightFiles).size, 29, 'right decoration views must be distinct');
  assert.equal(new Set(earnedDecorFiles()).size, 58, 'scene preload must include both views');
});

test('scene sprite draw keeps both authored views on one fixed root pivot', () => {
  const calls = [];
  const context = {drawImage: (...args) => calls.push(args)};
  const id = decorationIds[0];
  const image = {naturalWidth: 96, naturalHeight: 112};
  drawEarnedDecorSprite(context, image, earnedDecorArt(id, 'default'), 200, 300);
  drawEarnedDecorSprite(context, image, earnedDecorArt(id, 'right'), 200, 300);
  assert.deepEqual(calls.map((args) => args.slice(1)), [
    [152, 204, 96, 112],
    [152, 204, 96, 112],
  ]);
});
