// 25.0 S7 part 1 «Gia tinh đón đông»: the hearth sits where it hides no plot; vớ lock texts; nudges.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {GARDEN_STAGES, stageContains} from './garden-growth.mjs';
import {FEAST_SPOT, FOLIAGE, HEARTH, HEARTH_SPOT, TREE_FILES, XMAS_FILES, hearthObjects, ornamentLock, ornamentPin, sockLock, sockTask, xmasNudge} from './garden-xmas.mjs';

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

test('every hearth, feast and house-tree frame exists', () => {
  for (const f of [...XMAS_FILES, ...TREE_FILES]) assert.ok(fs.existsSync(new URL('./' + f, import.meta.url)), f);
});

// 05/11/2026 owner: a decoration could stand inside the hearth (the placement rule did not know it).
test('no decoration may stand on the December hearth', async () => {
  const {HEARTH_GROUND, decorSpotProblem} = await import('./decor-placement-ui.mjs');
  const {decorFootprintRect} = await import('./decor-runtime.mjs');
  assert.deepEqual(HEARTH_GROUND, {...decorFootprintRect(...HEARTH_SPOT, [2, 2])});
  const scene = JSON.parse(fs.readFileSync(new URL('./scene-data.json', import.meta.url)));
  const reason = decorSpotProblem(16, 1.5, {map: scene, stage: GARDEN_STAGES.at(-1), state: {decorations: []}, decorations: {}, itemId: 'decor_cauldron'});
  assert.equal(reason, 'Chỗ này là lò sưởi Giáng sinh.');
});

// S7 part 2: the Đêm Noel feast stands off every plot, off the hearth, and behind every visitor and gia tinh stop.
test('the feast spot clears every plot and the hearth; decorations may not stand on it', async () => {
  const scene = JSON.parse(fs.readFileSync(new URL('./scene-data.json', import.meta.url)));
  assert.ok(stageContains(GARDEN_STAGES[0], ...FEAST_SPOT));
  const box = ([c, r], w, h, px, py) => { const [x, y] = iso(c, r); return [x - px, y - py, x - px + w, y - py + h]; };
  const feast = box(FEAST_SPOT, 80, 56, 40, 52), hearth = box(HEARTH_SPOT, HEARTH.width, HEARTH.height, HEARTH.pivotX, HEARTH.pivotY);
  assert.ok(feast[2] <= hearth[0] || hearth[2] <= feast[0] || feast[3] <= hearth[1] || hearth[3] <= feast[1], 'feast overlaps the hearth');
  for (const p of scene.plots) {
    const corners = [[p.col, p.row], [p.col + p.width, p.row], [p.col, p.row + p.height], [p.col + p.width, p.row + p.height]].map(([c, r]) => iso(c - 0.5, r - 0.5));
    const xs = corners.map((c) => c[0]), ys = corners.map((c) => c[1]);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2, hw = (Math.max(...xs) - Math.min(...xs)) / 2, hh = (Math.max(...ys) - Math.min(...ys)) / 2;
    for (let i = 0; i <= 16; i++) for (let j = 0; j <= 16; j++) {
      const px = feast[0] + 80 * i / 16, py = feast[1] + 56 * j / 16;
      assert.ok(Math.abs(px - cx) / hw + Math.abs(py - cy) / hh > 1, `feast covers plot at ${p.col},${p.row}`);
    }
  }
  const {FRIENDS} = await import('./garden-friends.mjs');
  const rows = Object.values(FRIENDS).flatMap((f) => (f.stops ?? []).map((s) => s[1]));
  assert.ok(rows.length > 0 && rows.every((r) => r > FEAST_SPOT[1]), 'a visitor stops behind the feast');
  const {decorSpotProblem} = await import('./decor-placement-ui.mjs');
  const reason = decorSpotProblem(12, 0.6, {map: scene, stage: GARDEN_STAGES.at(-1), state: {decorations: []}, decorations: {}, itemId: 'decor_cauldron'});
  assert.equal(reason, 'Chỗ này là bàn tiệc Đêm Noel.');
});

test('hearthObjects by date: Đêm Noel feast and carried tree, New Year fireworks at night only, no hearth in January', () => {
  const view = {hearth: true, chapter: null, egg: null, eve: {claimed: false}, newYear: {year: 2027}};
  const day = hearthObjects(iso, view, [], {clock: 500, night: false}).map((o) => o.id ?? o.kind);
  assert.deepEqual(day, ['xmas-feast', 'xmas-carried-tree']);
  // A decoration already standing on the feast ground keeps it: the feast is not drawn over it.
  const taken = {placements: ['decor_cauldron'], positions: {decor_cauldron: [12, 0.5]}};
  assert.deepEqual(hearthObjects(iso, view, [], {clock: 500, decorations: taken}).map((o) => o.id), ['xmas-carried-tree']);
  const night = hearthObjects(iso, view, [], {clock: 500, night: true});
  assert.ok(night.filter((o) => o.kind === 'fx').length >= 1);
  assert.equal(hearthObjects(iso, view, [], {clock: 0, night: true}).filter((o) => o.kind === 'fx').length, 0); // reduced motion
  const elves = [];
  assert.deepEqual(hearthObjects(iso, {hearth: false, champion: {won: true}}, elves), []);
  assert.deepEqual(elves, []);
});

test('ornaments: lock texts, and every pin sits inside its stage foliage', () => {
  const yule = {today: 0, cap: 2};
  const o = {n: 3, crop: 'strawberry', qty: 3, hung: false, unlocked: true};
  assert.equal(ornamentLock({...o, hung: true}, yule), 'Đã treo');
  assert.equal(ornamentLock({...o, unlocked: false}, yule), 'Mở 20/12');
  assert.equal(ornamentLock(o, {today: 2, cap: 2}, {strawberry: 9}), 'Mai treo tiếp');
  assert.equal(ornamentLock(o, yule, {strawberry: 2}), 'Thiếu Dâu tây');
  assert.equal(ornamentLock(o, yule, {strawberry: 3}), '');
  FOLIAGE.forEach(([ax, ay, by, bl, br], stage) => {
    const pins = Array.from({length: 12}, (_, i) => ornamentPin(stage, i + 1));
    assert.equal(new Set(pins.map(String)).size, 12);
    for (const [x, y] of pins) {
      assert.ok(y > ay && y <= by, `stage ${stage} pin ${x},${y} outside the foliage height`);
      const half = (br - bl) / 2 * (y - ay) / (by - ay);
      assert.ok(Math.abs(x - ax) <= half + 0.5, `stage ${stage} pin ${x},${y} outside the foliage width`);
    }
  });
});

test('part 2 nudges: New Year frame, Đêm Noel present, an ornament, banh tuyết left', () => {
  const base = {letters: {ready: false}, chapter: null, egg: null};
  assert.match(xmasNudge({...base, newYear: {claimed: false, ready: true, year: 2027}}), /khung Pháo hoa 2027/);
  assert.match(xmasNudge({...base, eve: {claimed: false}}), /Đêm Noel/);
  assert.match(xmasNudge({...base, yule: {today: 0, cap: 2, ornaments: [{unlocked: true, hung: false}]}}), /cây thông nhà/);
  assert.match(xmasNudge({...base, snow: {today: 1, cap: 3}}), /còn 2 banh tuyết/);
  assert.equal(xmasNudge({...base, snow: {today: 3, cap: 3}}), '');
});
