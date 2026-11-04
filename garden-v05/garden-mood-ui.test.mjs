// 25.0 S4 «Đàn thú: tâm trạng và tương tác»: the panel only reads snapshot.mood (server garden-mood-core).
import test from 'node:test';
import assert from 'node:assert/strict';
import {moodTiles, trickNames, visitShow, tendText, TRICKS, NORBERT} from './garden-mood-ui.mjs';
import {CREATURE} from './progression-engine.mjs';

const view = {roamsLeft: 2, winter: false, happy: 80};
const entry = (more = {}) => ({mood: 60, done: [], lessons: 0, lessonToday: false, coat: 0, roamUntil: null, ...more});
const kinds = tiles => tiles.map(t => t.kind);

test('every species has three tricks; the roadmap examples come first', () => {
  for (const sp of [...Object.keys(CREATURE), NORBERT]) assert.equal(TRICKS[sp]?.length, 3, sp);
  assert.deepEqual([TRICKS.hippogriff[0], TRICKS.fwooper[0], TRICKS.puffskein[0]], ['Cúi chào', 'Hót', 'Lăn tròn']);
  assert.deepEqual(trickNames('hippogriff', 5), ['Cúi chào']);
  assert.equal(visitShow({hippogriff: 2}, () => 'Bằng-Mã'), 'Bằng-Mã xòe cánh');
});

test('tiles: riding only Bằng-Mã and Vong mã at gắn kết 5; Norbert never roams; done kinds wait for the next cycle', () => {
  assert.deepEqual(kinds(moodTiles({species: 'puffskein', entry: entry(), view})), ['play', 'groom', 'train', 'roam']);
  const ride = moodTiles({species: 'hippogriff', entry: entry(), view, bondLevel: 4}).find(t => t.kind === 'ride');
  assert.deepEqual([ride.enabled, ride.state], [false, 'Gắn kết cấp 5']);
  assert.equal(moodTiles({species: 'thestral', entry: entry(), view, bondLevel: 5}).find(t => t.kind === 'ride').enabled, true);
  assert.deepEqual(kinds(moodTiles({species: NORBERT, entry: entry(), view})), ['play', 'groom', 'train']);
  assert.ok(kinds(moodTiles({species: 'niffler', entry: entry(), view: {...view, winter: true}})).includes('reclaim'));
  const played = moodTiles({species: 'kneazle', entry: entry({done: ['play'], lessonToday: true}), view});
  assert.deepEqual(played.filter(t => !t.enabled).map(t => [t.kind, t.state]), [['play', 'Xong lượt'], ['train', 'Mai học tiếp']]);
  const now = 1_000_000;
  const roam = t => t.find(x => x.kind === 'roam');
  assert.equal(roam(moodTiles({species: 'kneazle', entry: entry({roamUntil: now + 60_000}), view, now})).enabled, false);
  assert.deepEqual([roam(moodTiles({species: 'kneazle', entry: entry({roamUntil: now - 1}), view, now})).label], ['Đón về']);
  assert.equal(roam(moodTiles({species: 'kneazle', entry: entry(), view: {...view, roamsLeft: 0}, now})).state, 'Hết lượt hôm nay');
  assert.match(tendText({species: 'kneazle', kind: 'roam', back: true, found: {kneazle_feed: 1}, mood: 70}, () => 'Kneazle'), /mang theo 1 phần ăn/);
});
