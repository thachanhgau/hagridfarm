// Season 2 Phần 2b (docs/season-2-roadmap.md §7): level cap 10,000, flat 84,000 XP past 500, computed rows,
// «Tận Sức N» to 9900, roadmap marks past 500, 4-digit badges.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as E from './progression-engine.mjs?v=26.9';
import {nextGoal} from './next-goal.mjs?v=26.9';
import {levelName} from './ui-utils.mjs?v=26.9';

const NOW = 1_800_000_000_000;

test('levels 501–10,000 are computed rows, a flat 84,000 XP each; the table keeps 500 stored rows', () => {
  assert.equal(E.DB.levels.length, 500);
  assert.equal(E.MAX_LEVEL, 10_000);
  assert.deepEqual(E.levelRow(499), E.DB.levels[498]);
  assert.deepEqual([500, 501, 9_999, 10_000].map((l) => [E.levelRow(l).totalXP, E.levelRow(l).xpToNext]),
    [[26_249_360, 84_000], [26_333_360, 84_000], [824_165_360, 84_000], [824_249_360, 0]]);
  assert.deepEqual([E.levelRow(501).unlock, E.levelRow(600).reward, E.levelRow(3_000).reward, E.levelRow(650).reward],
    ['Bậc Tận Sức ★401', '+2 Nước phép', '+2 Nước phép · khung Floo', undefined]);
  const p = E.testProfile(10_000, NOW);
  assert.deepEqual([p.level, E.levelInfo(p).xpToNext, E.levelInfo(p).nextTotalXP], [10_000, 0, null]);
  const q = E.testProfile(4_321, NOW);
  assert.deepEqual([E.levelInfo(q).xpInLevel, E.levelInfo(q).xpToNext, E.levelInfo(q).nextTotalXP], [0, 84_000, E.levelRow(4_322).totalXP]);
  assert.throws(() => E.testProfile(10_001, NOW), /between 1 and 10000/);
});

test('a garden crosses 500 → 501 and stops at 10,000 by XP alone', () => {
  const state = E.testProfile(500, NOW);
  state.xp = E.levelRow(501).totalXP - 1;
  assert.equal(E.levelInfo({...state, level: 500}).level, 500);
  assert.equal(E.levelInfo({...state, xp: state.xp + 1, level: 501}).level, 501);
  assert.equal(E.levelInfo({...state, xp: E.levelRow(10_000).totalXP * 2, level: 10_000}).level, 10_000);
});

test('labels: «Tận Sức N» runs to 9900; the mark of 4 digits is tagged so the ring and badges shrink it', () => {
  assert.equal(levelName(600), 'Tận Sức 500');
  assert.equal(levelName(10_000), 'Tận Sức 9900');
  const icons = fs.readFileSync(new URL('./pixel-icons.mjs', import.meta.url), 'utf8');
  assert.match(icons, /String\(n\)\.length > 3 \? \{class: 'is-4'\}/);
  assert.match(fs.readFileSync(new URL('./icon-hud.css', import.meta.url), 'utf8'), /\.level-ring b\.is-tan-suc b\.is-4\{font-size:9px/);
  assert.match(fs.readFileSync(new URL('./game-panels.css', import.meta.url), 'utf8'), /\.journey-level-badge\{[^}]*white-space:nowrap;display:inline-flex/);
});

test('roadmap past 500: the 100-level marks of the current thousand plus the level itself, never 9,500 tabs', () => {
  assert.equal(E.roadmapMarks(500), null);
  assert.deepEqual(E.roadmapMarks(501), [501, 600, 700, 800, 900, 1_000]);
  assert.deepEqual(E.roadmapMarks(2_345), [2_100, 2_200, 2_300, 2_345, 2_400, 2_500, 2_600, 2_700, 2_800, 2_900, 3_000]);
  assert.deepEqual(E.roadmapMarks(10_000), [9_100, 9_200, 9_300, 9_400, 9_500, 9_600, 9_700, 9_800, 9_900, 10_000]);
  assert.match(fs.readFileSync(new URL('./progression-panels.mjs', import.meta.url), 'utf8'), /marks&&roadStart>T\?marks\.map\(E\.levelRow\)/);
});

test('next goal past 500 names the next bậc and the XP left; no level goal at 10,000', () => {
  const state = E.testProfile(777, NOW);
  state.xp += 80_000; // past 90 % of the level
  const goal = nextGoal(E, state);
  assert.deepEqual([goal.need, goal.label], [{id: 'xp', n: 4_000, route: 'plant'}, 'Bậc Tận Sức ★678']);
  const top = E.testProfile(10_000, NOW);
  top.xp += 5_000_000;
  assert.notEqual(nextGoal(E, top)?.target.kind, 'level');
});

test('HPH «Nhảy tới cấp» takes 1–10,000 like the server', () => {
  const acp = fs.readFileSync(new URL('./garden-sale-acp-ui.mjs', import.meta.url), 'utf8');
  assert.match(acp, /level>=1&&level<=10000/);
  assert.match(acp, /max:'10000'/);
});
