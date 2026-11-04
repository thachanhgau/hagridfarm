import test from 'node:test';
import assert from 'node:assert/strict';
import {winterSeason, winterFor, snowCovered, snowCapImageData, recolorCoatImageData, unlockedCoats, wornCoat, nextCoat, cycleCoat} from './garden-winter.mjs';

const at = (day) => Date.parse(day + 'T12:00:00+07:00');

test('winter runs 01/12 → end of February (VN) and snow deepens with each snowy day', () => {
  assert.equal(winterSeason(at('2026-11-30')).active, false);
  assert.equal(winterSeason(at('2027-03-01')).active, false);
  const first = winterSeason(at('2026-12-01'));
  assert.deepEqual([first.active, first.day, first.snowDays, first.christmas], [true, 1, 1, true]);
  assert.ok(first.depth > 0 && first.depth < 0.5, 'a dusting on the first day');
  assert.equal(winterSeason(Date.parse('2026-11-30T17:30:00Z')).day, 1, '00:30 on 01/12 in Vietnam is already winter');
  let last = 0;
  for (const day of ['2026-12-03', '2026-12-10', '2027-01-15', '2027-02-28']) {
    const w = winterSeason(at(day));
    assert.ok(w.active && w.depth >= last, day);
    last = w.depth;
  }
  assert.equal(last, 1, 'the meadow is white by late winter');
  assert.equal(winterSeason(at('2027-01-15')).christmas, false);
  assert.equal(winterFor(at('2026-06-01'), '2026-12-20').active, true, 'QA date override');
  assert.equal(winterFor(at('2026-06-01'), 'nonsense').active, false);
});

test('snow patches only grow: covered at a lower depth stays covered at a higher one', () => {
  let covered = 0;
  for (let x = 0; x < 400; x += 7) for (let y = 0; y < 300; y += 5) {
    if (snowCovered(x, y, 0.3)) { covered++; assert.ok(snowCovered(x, y, 0.6)); }
  }
  assert.ok(covered > 0);
  assert.equal(snowCovered(5, 5, 1), true);
  assert.equal(snowCovered(5, 5, 0), false);
});

function image(w, h, fill) {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const c = fill(x, y);
    if (c) data.set([...c, 255], (y * w + x) * 4);
  }
  return {width: w, height: h, data};
}
const px = (im, x, y) => [...im.data.slice((y * im.width + x) * 4, (y * im.width + x) * 4 + 4)];

test('snow caps sit on flat tops inside the silhouette, never on steep sides or past the edge', () => {
  // A box with a flat top (rows 4+) and a one-pixel-wide spire at x = 2 (steep).
  const im = snowCapImageData(image(10, 12, (x, y) => (y >= 4 && x >= 1 && x <= 8) || (x === 2 && y >= 0) ? [165, 117, 84] : null));
  assert.deepEqual(px(im, 5, 4).slice(0, 3), [214, 216, 191], 'flat top gets snow');
  assert.deepEqual(px(im, 5, 6).slice(0, 3), [183, 222, 224], 'then a cool shadow row');
  assert.deepEqual(px(im, 2, 0).slice(0, 3), [165, 117, 84], 'the spire tip keeps its colour');
  assert.equal(px(im, 5, 3)[3], 0, 'nothing drawn above the sprite');
});

test('rare coats are looks only: unlocked by bond and season, outline kept', () => {
  const dec = winterSeason(at('2026-12-20')), jan = winterSeason(at('2027-01-10')), jul = winterSeason(at('2026-07-01'));
  assert.deepEqual(unlockedCoats(1, dec), []);
  assert.deepEqual(unlockedCoats(3, dec), ['winter', 'noel']);
  assert.deepEqual(unlockedCoats(5, jan), ['winter', 'silver']);
  assert.deepEqual(unlockedCoats(5, jul), ['silver']);
  assert.equal(wornCoat('noel', 5, jan), null, 'Lông Noel only in December');
  assert.equal(nextCoat(null, 3, dec), 'winter');
  assert.equal(nextCoat('noel', 3, dec), null, 'cycles back to the normal coat');
  assert.deepEqual(cycleCoat({}, 'kneazle', 1, dec).coats, {}, 'locked: nothing changes');
  assert.deepEqual(cycleCoat({kneazle: 'noel'}, 'kneazle', 3, dec).coats, {}, 'back to the normal coat');
  // Orange fur (#ED8A45 #FFC36B) with an outline (#231F2E) and blue eyes (#70A8B6).
  const im = recolorCoatImageData(image(4, 1, (x) => [[237, 138, 69], [255, 195, 107], [35, 31, 46], [112, 168, 182]][x]), 'winter');
  assert.deepEqual(px(im, 0, 0).slice(0, 3), [214, 216, 191]);
  assert.deepEqual(px(im, 1, 0).slice(0, 3), [232, 240, 237]);
  assert.deepEqual(px(im, 2, 0).slice(0, 3), [35, 31, 46], 'outline unchanged');
  assert.deepEqual(px(im, 3, 0).slice(0, 3), [112, 168, 182], 'eyes unchanged');
});
