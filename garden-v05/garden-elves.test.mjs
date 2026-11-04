import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ELVES, elfFiles, elfPose, elfObjects} from './garden-elves.mjs';
import {GARDEN_STAGES, stageContains} from './garden-growth.mjs';

test('every elf frame exists as a runtime image', () => {
  const manifest = JSON.parse(fs.readFileSync(new URL('./runtime-webp-manifest.json', import.meta.url)));
  const sources = new Set(manifest.images.map((image) => image.source));
  for (const file of elfFiles()) assert.ok(sources.has(file), file);
});

test('elves stay inside the first garden stage over a whole loop', () => {
  for (const id of Object.keys(ELVES)) {
    for (let clock = 1; clock < 120000; clock += 97) {
      const [col, row] = elfPose(id, clock);
      assert.ok(stageContains(GARDEN_STAGES[0], col, row), `${id} at ${col},${row}`);
    }
  }
});

test('reduced motion stands still; walking alternates frames and faces the way it goes', () => {
  assert.deepEqual(elfPose('dobby', 0).slice(2), ['idle', false]);
  const poses = new Set(), flips = new Set();
  for (let clock = 1; clock < 120000; clock += 53) { const [, , pose, flip] = elfPose('dobby', clock); poses.add(pose); flips.add(flip); }
  assert.deepEqual([...poses].sort(), ['carry', 'idle', 'sweep', 'walk-1', 'walk-2', 'water']);
  assert.deepEqual([...flips].sort(), [false, true]);
  const [object] = elfObjects((col, row) => [(col - row) * 32, (col + row) * 16], 0);
  assert.equal(object.asset.file, 'environment/elves/dobby/idle.png');
});
