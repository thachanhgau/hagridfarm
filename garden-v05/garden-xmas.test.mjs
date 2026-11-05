// 25.0 S7 part 1 «Gia tinh đón đông»: the hearth sits where it hides no plot; vớ lock texts; nudges.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {GARDEN_STAGES, stageContains} from './garden-growth.mjs';
import {HEARTH, HEARTH_SPOT, XMAS_FILES, hearthObjects, sockLock, sockTask, xmasNudge} from './garden-xmas.mjs';

const iso = (c, r) => [(c - r) * 32, (c + r) * 16];
const socks = (opened = 0, unlocked = 10) => Array.from({length: 10}, (_, i) => ({n: i + 1, crop: 'pumpkin', qty: 3, label: 'x', gift: {water: 3}, opened: i < opened, unlocked: i < unlocked}));

test('the hearth stands inside stage 1 and its whole sprite clears every plot', () => {
  const scene = JSON.parse(fs.readFileSync(new URL('./scene-data.json', import.meta.url)));
  assert.ok(stageContains(GARDEN_STAGES[0], ...HEARTH_SPOT));
  const [x, y] = iso(...HEARTH_SPOT), left = x - HEARTH.pivotX, top = y - HEARTH.pivotY;
  // Screen-space diamond of each plot; the sprite box must not reach into any of them.
  for (const p of scene.plots) {
    const corners = [[p.col, p.row], [p.col + p.width, p.row], [p.col, p.row + p.height], [p.col + p.width, p.row + p.height]].map(([c, r]) => iso(c - 0.5, r - 0.5));
    const xs = corners.map((c) => c[0]), ys = corners.map((c) => c[1]);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2, hw = (Math.max(...xs) - Math.min(...xs)) / 2, hh = (Math.max(...ys) - Math.min(...ys)) / 2;
    for (let i = 0; i <= 16; i++) for (let j = 0; j <= 16; j++) {
      const px = left + HEARTH.width * i / 16, py = top + HEARTH.height * j / 16;
      assert.ok(Math.abs(px - cx) / hw + Math.abs(py - cy) / hh > 1, `hearth covers plot at ${p.col},${p.row}`);
    }
  }
});

test('hearthObjects: the hearth is pickable, ten vớ and the egg draw over it, nothing without a view', () => {
  const elves = [];
  assert.deepEqual(hearthObjects(iso, null, elves), []);
  const over = hearthObjects(iso, {chapter: {socks: socks(3)}, egg: {stage: 2, hatched: false}}, elves);
  assert.deepEqual(elves.map((e) => e.id), ['xmas-hearth']);
  assert.equal(over.length, 11);
  assert.deepEqual(over.slice(0, 4).map((o) => o.asset.file), ['environment/xmas/sock-open.png', 'environment/xmas/sock-open.png', 'environment/xmas/sock-open.png', 'environment/xmas/sock.png']);
  assert.equal(over[10].asset.file, 'environment/xmas/egg-2.png');
  assert.ok(over.every((o) => o.still && o.xy[0] === elves[0].xy[0] && o.xy[1] === elves[0].xy[1]));
  assert.equal(hearthObjects(iso, {chapter: null, egg: {stage: 4, hatched: true}}, []).length, 0);
});

test('vớ lock texts follow the server view; nudges point at the letter, a vớ, then the fire', () => {
  const chapter = {open: true, today: 0, cap: 2};
  const [s1, , , s4] = socks(0, 3);
  assert.equal(sockLock(s1, chapter, {pumpkin: 3}), '');
  assert.equal(sockLock(s1, chapter, {pumpkin: 2}), 'Thiếu Bí ngô');
  assert.equal(sockLock(s4, chapter, {pumpkin: 9}), 'Mở 04/12');
  assert.equal(sockLock(s1, {...chapter, today: 2}, {pumpkin: 9}), 'Mai mở tiếp');
  assert.equal(sockLock(s1, {...chapter, open: false}, {pumpkin: 9}), 'Hết hạn');
  assert.equal(sockLock({...s1, opened: true}, chapter), 'Đã mở');
  assert.equal(sockTask(s1), 'Nộp 3 Bí ngô: x');
  const view = {letters: {ready: true}, chapter: {open: true, today: 0, cap: 2, socks: socks(0, 1)}, egg: {hatched: false, stokedToday: false}};
  assert.match(xmasNudge(view), /Thư của bác Hagrid/);
  assert.match(xmasNudge({...view, letters: {ready: false}}), /vớ mới/);
  assert.match(xmasNudge({...view, letters: {ready: false}, chapter: null}), /ủ lửa/);
  assert.equal(xmasNudge(null), '');
});

test('the seven hearth frames exist', () => {
  for (const f of XMAS_FILES) assert.ok(fs.existsSync(new URL('./' + f, import.meta.url)), f);
});
