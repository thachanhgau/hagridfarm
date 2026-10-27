import test from 'node:test';
import assert from 'node:assert/strict';
import {PREMIUM_PRODUCTS,bundlePercent,saleTotal,saleLeft} from './premium-products.mjs?v=24.9.88';
import {STORE_CATALOG,CATALOG_VERSION} from './garden-store-catalog.mjs?v=24.9.88';
import {ITEM_ART} from './item-art.mjs?v=24.9.88';
import {itemArtKey} from './ui-utils.mjs?v=24.9.88';

// Level-500 roadmap P4 (§10): what the store shows must equal what the server charges (garden-premium-core saleTotal).
test('the premium catalog is in the store mirror with the P4 catalog version', () => {
 assert.equal(CATALOG_VERSION, 'garden-2026-10-24-halloween-approved');
 for (const item of PREMIUM_PRODUCTS) assert.ok(STORE_CATALOG.includes(item), item.id);
 const spring = STORE_CATALOG.find(item => item.id === 'spring_water');
 assert.deepEqual([spring.stockCap, spring.usesPerDay, spring.bundles], [60, 10, true]);
});

test('bundles ×5/×10/×30 and a sale add up to at most 50% off', () => {
 const rain = PREMIUM_PRODUCTS.find(item => item.id === 'spring_rain');
 assert.deepEqual([1, 4, 5, 10, 29, 30].map(bundlePercent), [0, 0, 10, 20, 20, 30]);
 assert.equal(saleTotal(rain, 10), 50400);
 assert.equal(saleTotal({ ...rain, sale: { percent: 30 } }, 30), 94500);
 const nest = PREMIUM_PRODUCTS.find(item => item.id === 'warm_nest_1');
 assert.equal(saleTotal({ ...nest, sale: { percent: 25 } }, 1), 3750);
});

test('a sale shows its real end: minutes when close, the clock time otherwise', () => {
 const now = Date.parse('2026-10-22T20:35:00+07:00');
 assert.equal(saleLeft({ endsAt: Date.parse('2026-10-22T21:00:00+07:00') }, now), 'còn 25 phút');
 assert.equal(saleLeft({ endsAt: Date.parse('2026-10-22T22:30:00+07:00') }, now), 'đến 22:30');
});

test('every premium item resolves to its canonical native art identity', () => {
 for (const item of PREMIUM_PRODUCTS) {
  const key = item.kind === 'nest' ? 'premium_warm_nest' : `premium_${item.id}`;
  assert.equal(itemArtKey(item.id, {kind: item.kind}), key, item.id);
  assert.ok(ITEM_ART[key]?.file, `Missing native art for ${key}`);
 }
});

test('unknown premium art is explicit and never the generic medal', () => {
 assert.equal(itemArtKey('premium_future_item', {kind: 'premium'}), null);
});
