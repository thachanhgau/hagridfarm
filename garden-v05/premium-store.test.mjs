import test from 'node:test';
import assert from 'node:assert/strict';
import {PREMIUM_PRODUCTS,bundlePercent,saleTotal,saleLeft} from './premium-products.mjs?v=25.1.7';
import {STORE_CATALOG,CATALOG_VERSION,storePrice} from './garden-store-catalog.mjs?v=25.1.7';
import {ITEM_ART} from './item-art.mjs?v=25.1.7';
import {itemArtKey} from './ui-utils.mjs?v=25.1.7';

// Level-500 roadmap P4 (§10): what the store shows must equal what the server charges (garden-premium-core saleTotal).
test('the premium catalog is in the store mirror with the 25.0 catalog version', () => {
 assert.equal(CATALOG_VERSION, 'garden-2026-11-08-edge-3');
 for (const item of PREMIUM_PRODUCTS) assert.deepEqual(STORE_CATALOG.find(x => x.id === item.id), storePrice(item), item.id);
 const spring = STORE_CATALOG.find(item => item.id === 'spring_water');
 assert.deepEqual([spring.stockCap, spring.usesPerDay, spring.bundles], [60, 10, true]);
});

test('bundles ×5/×10/×30 and a sale add up to at most 90% off (HPH ACP, owner 10/11/2026)', () => {
 const rain = PREMIUM_PRODUCTS.find(item => item.id === 'spring_rain');
 assert.deepEqual([1, 4, 5, 10, 29, 30].map(bundlePercent), [0, 0, 10, 20, 20, 30]);
 assert.equal(saleTotal(rain, 10), 50400);
 assert.equal(saleTotal({ ...rain, sale: { percent: 30 } }, 30), 75600);
 assert.equal(saleTotal({ ...rain, sale: { percent: 90 } }, 30), 18900);
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

// Server pricedPurchase: a hand sale on a regular item takes its percent off the tiered total.
test('a hand sale on seeds discounts the tiered total; no sale keeps it', async () => {
 const {packTotal} = await import('./ui-utils.mjs?v=25.1.7');
 const seed = {price: 6, dailyLimit: 1000, dailyRemaining: 2, overflowMultiplier: 5};
 assert.equal(packTotal(seed, 3), 6 * 2 + 6 * 5);
 assert.equal(packTotal({...seed, sale: {percent: 50}}, 3), 21);
 assert.equal(packTotal({price: 3, dailyLimit: 1, sale: {percent: 90}}, 1), 1);
});
