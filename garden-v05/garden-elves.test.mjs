import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ELVES, NORBERT, elfFiles, elfPose, elfObjects, elfLine, elfShiftText} from './garden-elves.mjs';
import {GARDEN_STAGES, stageContains} from './garden-growth.mjs';
import {DECORATION_LAYOUT} from './default-decor.mjs';

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

test('at night every elf sleeps at its own spot in the aisle; a tapped elf cheers, Dobby with his own pose', () => {
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
  assert.equal(elfShiftText([{kind: 'harvest', plotIndex: 0, crops: 3}, {kind: 'feed', species: 'puffskein'}]), '🧦 Gia tinh: Gặt thửa 1 · 3 cây; Cho Quái lùng nhùng ăn');
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

// Bug 04/11/2026: Dobby walked across the corner of Thửa 1 (straight legs between stops) and stood in the
// Halloween cauldron and on the owl's post. Feet keep off every plot, earned-decor slot, festival spot, Hagrid,
// the owl, the hut and the festival hero; a standing (or sleeping) elf hides no plot frame.
test('elves walk the aisles: never on a plot or a fixed piece, and standing they hide no plot frame', () => {
  const scene = JSON.parse(fs.readFileSync(new URL('./scene-data.json', import.meta.url)));
  const plots = scene.plots.map((p) => [p.col - 0.5, p.row - 0.5, p.col + p.width - 0.5, p.row + p.height - 0.5]);
  const cell = (c, r, w = 1, h = 1) => [c - w / 2, r - h / 2, c + w / 2, r + h / 2];
  const fixed = [
    ...Object.values(DECORATION_LAYOUT).map((d) => [d.col, d.row, d.col + d.width, d.row + d.height]),
    ...[1, 8].flatMap((r) => [6, 13, 19].map((c) => cell(c, r))), // festivalObjects spots in stage 1
    cell(9, 2, 2, 1), cell(-2, 8), cell(1, 8), cell(2.5, -1, 2, 2), cell(0, 4, 3, 3), // hero, Hagrid, owl, greenhouse, hut
  ];
  const inside = (c, r, [c0, r0, c1, r1], m) => c > c0 - m && c < c1 + m && r > r0 - m && r < r1 + m;
  const feetClear = (id, c, r) => {
    for (const box of [...plots, ...fixed]) assert.ok(!inside(c, r, box, 0.25), `${id} feet at ${c.toFixed(2)},${r.toFixed(2)} on ${box}`);
  };
  // The frame's screen box, turned back into grid offsets (iso: x = (col − row)·32, y = (col + row)·16).
  const b = {x: 11, y: 14, w: 53, h: 63}, pivot = [40, 76];
  const hidesPlot = (c, r, flip) => {
    for (let i = 0; i <= 8; i++) for (let j = 0; j <= 8; j++) {
      const dx = (flip ? pivot[0] - b.x - b.w : b.x - pivot[0]) + b.w * i / 8, dy = b.y - pivot[1] + b.h * j / 8;
      const pc = c + (dx / 32 + dy / 16) / 2, pr = r + (dy / 16 - dx / 32) / 2;
      if (plots.some((box) => inside(pc, pr, box, 0.05))) return true;
    }
    return false;
  };
  for (const [id, elf] of Object.entries(ELVES)) {
    for (let clock = 1; clock < 200000; clock += 37) feetClear(id, ...elfPose(id, clock).slice(0, 2));
    for (const [c, r, pose, stay, right] of elf.stops) if (stay > 0) assert.ok(!hidesPlot(c, r, right === true), `${id} ${pose} at ${c},${r} hides a plot`);
    feetClear(id, ...elf.sleep);
    assert.ok(!hidesPlot(...elf.sleep, false), `${id} sleeps over a plot`);
  }
  // Norbert keeps to the same ground (05/11/2026: his old loop crossed the row-8.9 aisle behind Thửa 5–6).
  for (let clock = 1; clock < 200000; clock += 37) feetClear('norbert', ...elfPose('norbert', clock, NORBERT.stops).slice(0, 2));
  feetClear('norbert', ...NORBERT.sleep);
});
