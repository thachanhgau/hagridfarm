import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {FRIENDS, FRIEND_FILES, GROUPS, friendVisit, friendPose, friendObjects, friendLine, friendGiftText, tapFriend} from './garden-friends.mjs';
import {GARDEN_STAGES, stageContains} from './garden-growth.mjs';
import {DECORATION_LAYOUT} from './default-decor.mjs';

const iso = (col, row) => [(col - row) * 32, (col + row) * 16];
const DAY = Date.parse('2026-12-01T06:00:00+07:00');

test('five 3-hour visits a day from 06 to 21 h; every group at most once; nobody at night', () => {
  const groups = [0, 1, 2, 3, 4].map((slot) => friendVisit(DAY + slot * 3 * 3600000 + 1).group);
  assert.equal(new Set(groups).size, 5);
  assert.equal(friendVisit(DAY - 1), null);
  assert.equal(friendVisit(DAY + 15 * 3600000), null);
  assert.deepEqual(friendObjects(iso, 1, DAY - 1), []);
  assert.deepEqual(friendObjects(iso, 1, DAY + 1, [], {night: true}), []);
  assert.deepEqual(Object.values(GROUPS).flat().sort(), Object.keys(FRIENDS).sort());
});

test('the schedule matches the server (garden-friend-core) over a month', {skip: !process.env.GARDEN_HPVNN_ROOT && 'GARDEN_HPVNN_ROOT unset'}, () => {
  const server = createRequire(import.meta.url)(process.env.GARDEN_HPVNN_ROOT + '/functions/games/garden-friend-core.js');
  for (let t = DAY; t < DAY + 31 * 86400000; t += 3600000 * 0.75) {
    const a = friendVisit(t), b = server.friendVisit(t);
    assert.deepEqual(a && [a.group, a.members, a.endsAt], b && [b.group, b.members, b.endsAt], new Date(t).toISOString());
  }
  for (const [group, members] of Object.entries(GROUPS)) assert.deepEqual(server.FRIEND_GROUPS[group].members, members);
});

test('every friend frame exists as a runtime image', () => {
  const manifest = JSON.parse(fs.readFileSync(new URL('./runtime-webp-manifest.json', import.meta.url)));
  const sources = new Set(manifest.images.map((image) => image.source));
  for (const file of FRIEND_FILES) assert.ok(sources.has(file), file);
});

test('brooms hover and pass the Quaffle; Ginny throws snowballs in winter and flies otherwise; the twins light fireworks', () => {
  const a = friendPose('harry', 100), b = friendPose('harry', 1700);
  assert.deepEqual([a[2], b[2]], ['fly-throw', 'fly-catch']);
  assert.ok(a[4] > 20);
  assert.deepEqual(friendPose('harry', 0)[2], 'fly-throw');
  const at = (pose) => { for (let clock = 1; ; clock += 53) if (friendPose('ginny', clock, {winter: true})[2] === pose) return clock; };
  assert.equal(friendPose('ginny', at('snowball'))[2], 'fly-throw');
  let t = DAY; while (friendVisit(t).group !== 'harry-ron') t += 3 * 3600000;
  const people = [];
  assert.equal(friendObjects(iso, 500, t, people).length, 1, 'the Quaffle');
  assert.deepEqual(people.map((o) => o.id), ['harry', 'ron']);
  t = DAY; while (friendVisit(t).group !== 'twins') t += 3 * 3600000;
  assert.ok(friendObjects(iso, 300, t).length > 0, 'fireworks');
  assert.equal(friendObjects(iso, 0, t).length, 0, 'reduced motion: no fireworks');
  const twins = [];
  friendObjects(iso, 1, t, twins);
  assert.equal(twins[1].asset.file, 'environment/friends/fred/' + friendPose('george', 1)[2] + '.png');
});

test('tap lines loop and stay short; the gift toast names the friend, gift and today\'s count', () => {
  for (const [id, friend] of Object.entries(FRIENDS)) {
    assert.equal(friendLine(id, friend.lines.length), friend.lines[0]);
    for (const line of friend.lines) assert.ok(line.split(' ').length <= 12, line);
  }
  assert.equal(friendGiftText({friendId: 'hermione', gift: {kind: 'water', amount: 2, itemId: 'elf_sock', bonusQty: 1}, gifts: 2, cap: 3}), 'Hermione tặng 💧 2 · Vớ len gia tinh 1 (2/3 hôm nay)');
});

// As garden-elves.test.mjs: feet keep off plots and fixed pieces; standing, a visitor hides no plot frame.
test('friends walk the aisles inside stage 1: never on a plot or a fixed piece, and standing they hide no plot frame', () => {
  const scene = JSON.parse(fs.readFileSync(new URL('./scene-data.json', import.meta.url)));
  const plots = scene.plots.map((p) => [p.col - 0.5, p.row - 0.5, p.col + p.width - 0.5, p.row + p.height - 0.5]);
  const cell = (c, r, w = 1, h = 1) => [c - w / 2, r - h / 2, c + w / 2, r + h / 2];
  const fixed = [
    ...Object.values(DECORATION_LAYOUT).map((d) => [d.col, d.row, d.col + d.width, d.row + d.height]),
    ...[1, 8].flatMap((r) => [6, 13, 19].map((c) => cell(c, r))),
    cell(9, 2, 2, 1), cell(-2, 8), cell(1, 8), cell(2.5, -1, 2, 2), cell(0, 4, 3, 3),
  ];
  const inside = (c, r, [c0, r0, c1, r1], m) => c > c0 - m && c < c1 + m && r > r0 - m && r < r1 + m;
  const b = {x: 11, y: 8, w: 58, h: 69}, pivot = [40, 76];
  const hidesPlot = (c, r, flip, lift) => {
    for (let i = 0; i <= 8; i++) for (let j = 0; j <= 8; j++) {
      const dx = (flip ? pivot[0] - b.x - b.w : b.x - pivot[0]) + b.w * i / 8, dy = b.y - pivot[1] - lift + b.h * j / 8;
      const pc = c + (dx / 32 + dy / 16) / 2, pr = r + (dy / 16 - dx / 32) / 2;
      if (plots.some((box) => inside(pc, pr, box, 0.05))) return true;
    }
    return false;
  };
  for (const id of Object.keys(FRIENDS)) {
    for (let clock = 1; clock < 400000; clock += 37) {
      const [c, r, pose, flip, lift] = friendPose(id, clock, {winter: clock < 200000});
      assert.ok(stageContains(GARDEN_STAGES[0], c, r), `${id} at ${c},${r}`);
      for (const box of [...plots, ...fixed]) assert.ok(!inside(c, r, box, 0.25), `${id} feet at ${c.toFixed(2)},${r.toFixed(2)} on ${box}`);
      if (!pose.startsWith('walk')) assert.ok(!hidesPlot(c, r, flip, lift), `${id} ${pose} at ${c},${r} hides a plot`);
    }
  }
});

test('a tap says a line and asks the server for the gift only while one is still due', async () => {
  const said = [], claims = [], cheers = [];
  const deps = (friends) => ({snapshot: {friends}, cheer: (id) => cheers.push(id), say: (t) => said.push(t),
    claim: (c) => { claims.push(c); return Promise.resolve({ok: true, receipt: {friend: {friendId: 'luna', gift: {kind: 'water', amount: 3}, gifts: 1, cap: 3}}}); }});
  const visit = {members: ['luna'], gifted: false};
  tapFriend('luna', 1, deps({visit, gifts: 0, cap: 3}));
  tapFriend('luna', 2, deps({visit: {...visit, gifted: true}, gifts: 1, cap: 3}));
  tapFriend('luna', 3, deps({visit, gifts: 3, cap: 3}));
  tapFriend('luna', 4, deps(undefined));
  assert.deepEqual(claims, [{action: 'greetFriend', friendId: 'luna'}]);
  assert.deepEqual(said.slice(0, 2), ['Luna: «' + FRIENDS.luna.lines[0] + '»', 'Luna: «' + FRIENDS.luna.lines[1] + '»']);
  assert.equal(cheers.length, 4);
});

test('QA ?friends=all draws all seven at once, with the Quaffle and fireworks', () => {
  const people = [], fx = friendObjects(iso, 300, DAY - 1, people, {all: true});
  assert.deepEqual(people.map((o) => o.id).sort(), Object.keys(FRIENDS).sort());
  assert.ok(fx.length >= 2);
});
