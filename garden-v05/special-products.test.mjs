import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {SPECIAL_PRODUCTS, SPECIAL_PRICES_APPROVED} from './special-products.mjs';
import {STORE_CATALOG} from './garden-store-catalog.mjs';

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
    assert.ok(item.price >= 900 && item.level >= 25, item.id);
    assert.match(item.description, /chỉ để trang trí/);
    for (const key of ['xp', 'reward', 'yield', 'galleonsBonus']) assert.equal(item[key], undefined);
  }
  // The six older store decorations are unchanged and still sold below every special product.
  const older = STORE_CATALOG.filter(item => item.kind === 'decoration' && !item.collection);
  assert.deepEqual(older.map(item => [item.id, item.price]), [['decor_pumpkin_lantern', 80], ['decor_broom_rack', 120], ['decor_cauldron', 180], ['decor_mandrake_planter', 240], ['decor_floating_candles', 360], ['decor_vine_arch', 600]]);
});
