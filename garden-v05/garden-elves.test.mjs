import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ELVES, elfFiles, elfPose, elfObjects, elfLine, elfShiftText} from './garden-elves.mjs';
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

test('at night every elf sleeps at its own spot by the hut; a tapped elf cheers, Dobby with his own pose', () => {
  const iso = (col, row) => [(col - row) * 32, (col + row) * 16];
  const night = elfObjects(iso, 12345, {night: true});
  assert.ok(night.every((o) => o.asset.file.endsWith('/sleep.png')));
  assert.equal(new Set(night.map((o) => o.xy.join())).size, night.length);
  for (const id of Object.keys(ELVES)) assert.ok(stageContains(GARDEN_STAGES[0], ...ELVES[id].sleep), id);
  const tapped = elfObjects(iso, 12345, {cheering: {dobby: true, winky: true}});
  assert.equal(tapped.find((o) => o.id === 'dobby').asset.file, 'environment/elves/dobby/cheer.png');
  assert.equal(tapped.find((o) => o.id === 'winky').asset.file, 'environment/elves/winky/idle.png');
});

test('after today\'s gia tinh jobs Dobby harvests at his watering stop and feeds at his sweeping stop', () => {
  const iso = (col, row) => [(col - row) * 32, (col + row) * 16];
  const at = (pose) => { for (let clock = 1; ; clock += 53) if (elfPose('dobby', clock)[2] === pose) return clock; };
  const dobby = (clock, work) => elfObjects(iso, clock, {work}).find((o) => o.id === 'dobby').asset.file;
  assert.equal(dobby(at('water'), []), 'environment/elves/dobby/water.png');
  assert.equal(dobby(at('water'), ['harvest']), 'environment/elves/dobby/harvest.png');
  assert.equal(dobby(at('sweep'), ['harvest', 'feed']), 'environment/elves/dobby/feed.png');
  assert.equal(elfObjects(iso, at('water'), {work: ['harvest'], night: true}).find((o) => o.id === 'dobby').asset.file, 'environment/elves/dobby/sleep.png');
  assert.equal(elfShiftText([{kind: 'harvest', plotIndex: 0, crops: 3}, {kind: 'feed', species: 'puffskein'}]), '🧦 Gia tinh: Gặt thửa 1 · 3 cây; Cho Puffskein ăn');
  assert.equal(elfShiftText(undefined), '');
});

test('tap lines loop per elf and stay short', () => {
  for (const [id, elf] of Object.entries(ELVES)) {
    assert.equal(elfLine(id, elf.lines.length), elf.lines[0]);
    for (const line of elf.lines) assert.ok(line.split(' ').length <= 12, line);
  }
});

test('sleeping elves do not lie on top of each other (≥ 40 screen px apart)', () => {
  const xs = Object.values(ELVES).map((elf) => (elf.sleep[0] - elf.sleep[1]) * 32).sort((a, b) => a - b);
  for (let i = 1; i < xs.length; i++) assert.ok(xs[i] - xs[i - 1] >= 40, xs.join());
});
