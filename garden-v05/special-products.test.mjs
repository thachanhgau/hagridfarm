import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {SPECIAL_PRODUCTS, SPECIAL_PRICES_APPROVED} from './special-products.mjs';
import {STORE_CATALOG, unlockedCatalog} from './garden-store-catalog.mjs';

const runtime = JSON.parse(fs.readFileSync(new URL('./decor-assets-manifest.json', import.meta.url)));
const source = JSON.parse(fs.readFileSync(new URL('./special-products-assets/manifest.json', import.meta.url)));
const special = runtime.items.filter(item => item.collection === 'special');

test('the 30 special products keep their ids, views, pivots, footprints and frame timing from the asset set', () => {
  assert.equal(SPECIAL_PRODUCTS.length, 30);
  assert.deepEqual(special.map(item => item.id).sort(), source.items.map(item => item.id).sort());
  for (const item of source.items) {
    const entry = special.find(x => x.id === item.id), sale = SPECIAL_PRODUCTS.find(x => x.id === item.id);
    assert.deepEqual([entry.pivotX, entry.pivotY, entry.width, entry.height], [item.pivot.x, item.pivot.y, item.width, item.height], item.id);
    assert.deepEqual(entry.footprintTiles, item.footprintTiles, item.id);
    assert.deepEqual([...sale.footprint], item.footprintTiles, item.id);
    assert.deepEqual(entry.durations, item.durationsMs, item.id);
    assert.equal(entry.frames.length, 4);
    assert.equal(entry.rightFrames.length, 4);
    // The right view is its own drawing, never the left one mirrored.
    assert.notEqual(entry.rightFile, entry.file);
    assert.ok(entry.bounds.y + entry.bounds.h <= entry.pivotY + 4 && entry.bounds.y + entry.bounds.h >= entry.pivotY - 8, `${item.id} foot`);
  }
});

test('only runtime PNGs ship: every file the manifest names exists under decor-assets/, nothing from masters or QA', () => {
  for (const item of special) {
    for (const file of [item.file, item.rightFile, ...item.frames, ...item.rightFrames]) {
      assert.match(file, /^decor-assets\/native\/sp_[a-z0-9_]+\.png$/);
      assert.ok(fs.existsSync(new URL(`./${file}`, import.meta.url)), file);
    }
  }
  const shipped = fs.readdirSync(new URL('./decor-assets/native/', import.meta.url)).filter(name => name.startsWith('sp_'));
  assert.equal(shipped.length, 300);
});

test('special products are decorations only, one each, in their own store group, priced high and not yet approved', () => {
  assert.equal(SPECIAL_PRICES_APPROVED, false);
  for (const item of SPECIAL_PRODUCTS) {
    assert.deepEqual(STORE_CATALOG.find(x => x.id === item.id), item);
    assert.equal(item.kind, 'decoration');
    assert.equal(item.collection, 'special');
    assert.deepEqual([item.quantity, item.dailyLimit], [1, 1]);
    // Seasonal pieces sell at any level, the rest from level 25.
    assert.ok(item.price >= 900 && (item.season ? item.level === 1 : item.level >= 25), item.id);
    assert.match(item.description, /chỉ để trang trí/);
    for (const key of ['xp', 'reward', 'yield', 'galleonsBonus']) assert.equal(item[key], undefined);
  }
  // The six older store decorations are unchanged and still sold below every special product.
  const older = STORE_CATALOG.filter(item => item.kind === 'decoration' && !item.collection);
  assert.deepEqual(older.map(item => [item.id, item.price]), [['decor_pumpkin_lantern', 80], ['decor_broom_rack', 120], ['decor_cauldron', 180], ['decor_mandrake_planter', 240], ['decor_floating_candles', 360], ['decor_vine_arch', 600]]);
});

test('Halloween pieces sell only during the Halloween festival, to every level, priced above the regular ones', () => {
  const cake = SPECIAL_PRODUCTS.find(item => item.id === 'sp_deathday_cake');
  assert.deepEqual([cake.season, cake.level, cake.price], ['event_halloween', 1, 4000]);
  const has = day => unlockedCatalog(1, day).some(item => item.id === 'sp_deathday_cake');
  assert.equal(has('2026-10-23'), false);
  assert.equal(has('2026-10-24'), true);
  assert.equal(has('2026-10-31'), true);
  assert.equal(has('2026-11-06'), true);
  assert.equal(has('2026-11-07'), false);
  assert.match(cake.description, /Chỉ bán trong Lễ Hội Ma/);
  // A level-1 member out of season sees none of the level-25+ special products either.
  assert.equal(unlockedCatalog(1, '2026-10-20').filter(item => item.collection === 'special').length, 0);
});

test('store lock: below level shows the level, off-season shows the opening day, in season sells at any level', async () => {
  const {STORE_CATALOG, storeLock} = await import('./garden-store-catalog.mjs');
  const arch = STORE_CATALOG.find(i => i.id === 'decor_vine_arch'), cake = STORE_CATALOG.find(i => i.season);
  assert.equal(storeLock(arch, 1, '2026-10-20'), 'Cấp 24');
  assert.equal(storeLock(arch, 24, '2026-10-20'), '');
  assert.equal(storeLock(cake, 1, '2026-10-20'), 'Mở bán 24/10');
  assert.equal(storeLock(cake, 1, '2026-10-25'), '');
  assert.equal(storeLock(cake, 100, '2026-11-20'), 'Mở bán 24/10');
});

test('Halloween festival pieces: five sprites in both views, sold only in Lễ Hội Ma at any level', async () => {
  const {FESTIVAL_PRODUCTS} = await import('./special-products.mjs');
  const pack = JSON.parse(fs.readFileSync(new URL('./halloween-assets/manifest.json', import.meta.url)));
  const sprites = runtime.items.filter(item => item.collection === 'festival');
  assert.deepEqual(FESTIVAL_PRODUCTS.map(i => i.id).sort(), pack.items.map(i => i.id).sort());
  assert.deepEqual(sprites.map(i => i.id).sort(), pack.items.map(i => i.id).sort());
  for (const item of FESTIVAL_PRODUCTS) {
    const sprite = sprites.find(x => x.id === item.id);
    assert.deepEqual(STORE_CATALOG.find(x => x.id === item.id), item);
    assert.deepEqual([item.season, item.level, item.kind, item.quantity], ['event_halloween', 1, 'decoration', 1]);
    assert.notEqual(sprite.rightFile, sprite.file);
    for (const file of [sprite.file, sprite.rightFile, ...sprite.frames, ...sprite.rightFrames]) assert.ok(fs.existsSync(new URL(`./${file}`, import.meta.url)), file);
    assert.equal(unlockedCatalog(1, '2026-10-23').some(x => x.id === item.id), false);
    assert.equal(unlockedCatalog(1, '2026-10-31').some(x => x.id === item.id), true);
  }
});
