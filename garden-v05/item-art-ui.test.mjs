import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DB } from './balance-data.mjs?v=24.9.65';
import { ITEM_ART } from './item-art.mjs?v=25.1.9';
import { FLOW_ITEM_ART } from './flow-item-art.mjs?v=25.1.9';
import { KEEPSAKE_ART } from './complete-object-art.mjs?v=25.1.9';
import { flowArtSpec } from './flow-item-ui.mjs?v=25.1.9';
// Garden expansion species (pond §6, phase 2 §9) draw their feed and produce from POND_ART through the flowArtSpec fallback,
// not ITEM_ART, and have no recipe_<id> card art: they are checked by that source, the rest by ITEM_ART as before.
const viaFlow = id => !ITEM_ART[id]?.file && Boolean(flowArtSpec(id));
const FLOW_SPECIES = new Set(DB.animals.filter(a => a.habitat === 'pond' || viaFlow(`produce_${a.id}`)).map(a => a.id));
const FLOW_FEEDS = new Set(DB.animals.filter(a => FLOW_SPECIES.has(a.id)).map(a => a.feed));
const ANIMALS = DB.animals.filter(a => !FLOW_SPECIES.has(a.id));
const RECIPES = DB.recipes.filter(r => !FLOW_FEEDS.has(r.output));

class FakeText {
 constructor(text) { this.textContent = String(text); this.parentNode = null; }
}

class FakeElement {
 constructor(tagName) {
  this.tagName = tagName;
  this.children = [];
  this.parentNode = null;
  this.attributes = {};
  this.style = {};
  this._html = '';
  this._classes = new Set();
  this.classList = {
   add: (...names) => names.forEach(name => this._classes.add(name)),
   toggle: (name, enabled) => enabled ? this._classes.add(name) : this._classes.delete(name),
  };
 }
 set className(value) { this._classes = new Set(String(value).split(/\s+/).filter(Boolean)); }
 get className() { return [...this._classes].join(' '); }
 set textContent(value) { this._text = String(value ?? ''); this.children = []; this._html = ''; }
 get textContent() { return this._text || this.children.map(child => child.textContent).join(''); }
 set innerHTML(value) { this._html = String(value ?? ''); this.children = []; this._text = ''; }
 get innerHTML() { return this._html || this.children.map(child => child.innerHTML || child.textContent).join(''); }
 setAttribute(name, value) { this.attributes[name] = String(value); }
 append(...nodes) {
  for (const node of nodes) {
   if (node.parentNode) node.parentNode.children = node.parentNode.children.filter(child => child !== node);
   node.parentNode = this;
   this.children.push(node);
  }
  this._text = '';
  this._html = '';
 }
}

globalThis.document = {
 createElement: tagName => new FakeElement(tagName),
 createTextNode: text => new FakeText(text),
 getElementById: () => null,
};

const {
 cropVisualKind,
 earnedDecorIcon,
 itemDisplayName,
 itemArtKey,
 levelUnlockVisual,
 visualItemIcon,
} = await import('./ui-utils.mjs?v=25.1.9');
const {makeRecipeIcon} = await import('./recipe-art-ui.mjs?v=25.1.9');
const {costChips, rewardChips} = await import('./pixel-icons.mjs?v=25.1.9');

function findAttribute(node, name) {
 if (node?.attributes?.[name] !== undefined) return node.attributes[name];
 for (const child of node?.children || []) {
  const found = findAttribute(child, name);
  if (found !== undefined) return found;
 }
 return undefined;
}

function findClass(node, className) {
 if (node?.className?.split?.(/\s+/).includes(className)) return node;
 for (const child of node?.children || []) {
  const found = findClass(child, className);
  if (found) return found;
 }
 return null;
}

test('item art covers every recipe, produce and earned decoration identity', () => {
 const ids = [
  ...RECIPES.map(recipe => `recipe_${recipe.id}`),
  ...ANIMALS.map(animal => `produce_${animal.id}`),
  ...DB.decorations.map(decoration => decoration.id),
 ];
 const missing = ids.filter(id => !ITEM_ART[id]?.file);
 assert.deepEqual(missing, []);
 assert.equal(new Set(ids).size, ids.length);
 const supply=ITEM_ART.supply_water;
 const size=Math.ceil(Math.max(supply.bounds.w,supply.bounds.h)*0.85/0.88);
 const nearFit=visualItemIcon(new Map(),'water',{size});
 const nearWidth=Number(/width:([\d.]+)px/.exec(findClass(nearFit,'item-art-img').style.cssText)[1]);
 assert.ok(nearWidth*supply.bounds.w/supply.width<=size, 'a near-native fit is never scaled past its slot');
 const decor=DB.decorations[0].id;
 assert.ok(findClass(earnedDecorIcon(decor,{size:44}),'item-art-img').style.cssText.includes(`width:${ITEM_ART[decor].width/2}px`), 'decoration stays at exactly 0.5×');

 assert.equal(new Set(ids.map(id => `${ITEM_ART[id].file}|${JSON.stringify(ITEM_ART[id].bounds)}`)).size, ids.length, 'distinct item-art regions');
 for (const id of ids) assert.ok(Number(ITEM_ART[id].width) > 0 && Number(ITEM_ART[id].height) > 0, id);
});

test('canonical outputs use shared flow art while recipe cards keep variant art', () => {
 const items = new Map();
 for (const recipe of RECIPES) {
  const key = `recipe_${recipe.id}`;
  assert.equal(itemArtKey(key), key);
  assert.equal(findAttribute(visualItemIcon(items, key, { size: 44 }), 'data-art-key'), key);
 }
 for (const output of new Set(RECIPES.map(recipe => recipe.output))) {
  const key = itemArtKey(output);
  assert.equal(key, `recipe_${output}`);
  assert.ok(ITEM_ART[key]?.file, `Missing canonical output art for ${output}`);
  assert.equal(findAttribute(visualItemIcon(items, output, { size: 44, kind: 'output' }), 'data-art-key'), key);
 }
});

test('harvest icons use generated flow art without changing seed/live crop sprites', () => {
 const items = new Map([
  ['pumpkin', { frames: [{}, {}, {}, { file: 'pumpkin-live.png', width: 48, height: 48, bounds: { x: 0, y: 0, w: 48, h: 48 } }] }],
  ['puffskein', { frames: [{}, {}, {}, { file: 'creature.png', width: 48, height: 48, bounds: { x: 0, y: 0, w: 48, h: 48 } }] }],
 ]);
 const seed = visualItemIcon(items, 'pumpkin', { size: 26, kind: 'seed' });
 const live = visualItemIcon(items, 'pumpkin', { size: 26 });
 assert.ok(seed.className.includes('is-seed-packet'));
 assert.ok(live.className.includes('is-sprite'));
 assert.equal(findAttribute(seed, 'data-art-key'), 'seed_packet', 'the seed card is the shared paper packet, not harvest art');
 assert.equal(findAttribute(live, 'data-art-key'), undefined);
 for (const crop of DB.crops) {
  assert.equal(cropVisualKind(crop.id), 'harvest');
  const key = itemArtKey(crop.id, { kind: 'harvest' });
  assert.equal(key, `harvest_${crop.id}`);
  assert.ok(FLOW_ITEM_ART[key]?.file, key);
  assert.equal(findAttribute(visualItemIcon(items, crop.id, { size: 26, kind: 'harvest' }), 'data-art-key'), key);
 }
 assert.equal(cropVisualKind('puff_feed'), '');
 const futureCrop = visualItemIcon(new Map([['future_crop', {frames: [{}, {}, {}, {file: 'live.png', width: 48, height: 48, bounds: {x: 0, y: 0, w: 48, h: 48}}]}]]), 'future_crop', {size: 26, kind: 'harvest'});
 assert.ok(findClass(futureCrop, 'is-art-missing'), 'missing harvest art must not fall back to the live plant sprite');
 assert.equal(findClass(futureCrop, 'is-sprite'), null);
 assert.equal(futureCrop.textContent.includes('◇'), false);
});

test('recipe output art uses a display name instead of exposing the output id', () => {
 const recipe = DB.recipes.find(entry => entry.id === 'puff_feed');
 const visual = makeRecipeIcon(recipe, new Map(), 40);
 assert.equal(findAttribute(visual, 'aria-label'), `Thành phẩm ${itemDisplayName(recipe.output, recipe.label)}`);
 assert.doesNotMatch(findAttribute(visual, 'aria-label'), new RegExp(recipe.output));
});

test('shared inventory and reward surfaces route crop ids to harvest art', () => {
 const reward = rewardChips(new Map(), {itemId: 'pumpkin', bonusQty: 2});
 const costs = costChips(new Map(), [{id: 'pumpkin', have: 1, need: 2}]);
 assert.equal(findAttribute(reward, 'data-art-key'), 'harvest_pumpkin');
 assert.equal(findAttribute(costs[0], 'data-art-key'), 'harvest_pumpkin');
});

test('produce keeps its product art while inventory keepsakes use world statues without a cup badge', () => {
 const items = new Map([['puffskein', { frames: [{}, {}, {}, { file: 'creature.png', width: 48, height: 48, bounds: { x: 0, y: 0, w: 48, h: 48 } }] }]]);
 for (const animal of ANIMALS) {
  const key = `keepsake_${animal.id}`;
  assert.ok(KEEPSAKE_ART[animal.id]?.file, key);
  assert.equal(itemArtKey(key, { kind: 'keepsake' }), key);
 }
 const produce = visualItemIcon(items, 'produce_puffskein', { size: 44, kind: 'produce' });
 const keepsake = visualItemIcon(items, 'keepsake_puffskein', { size: 44, kind: 'keepsake' });
 assert.equal(findAttribute(produce, 'data-art-key'), 'produce_puffskein');
 assert.equal(findAttribute(keepsake, 'data-art-key'), 'keepsake_puffskein');
 assert.equal(findAttribute(keepsake, 'data-presentation'), 'keepsake-statue');
 assert.equal(findClass(keepsake, 'keepsake-pedestal-badge'), null);
 assert.ok(findAttribute(keepsake, 'src')?.includes(KEEPSAKE_ART.puffskein.file.replace(/\.png$/, '')));
 assert.equal(findAttribute(produce, 'src') === 'creature.png', false);
});

test('supply aliases, expansions, earned decorations and level fallbacks retain identity', () => {
 const items = new Map([['flax', { frames: [{}, {}, {}, { file: 'flax.png', width: 48, height: 48, bounds: { x: 0, y: 0, w: 48, h: 48 } }] }]]);
 assert.equal(itemArtKey('spring_water'), 'supply_spring_water');
 assert.equal(itemArtKey('gentle_growth'), 'supply_boost');
 assert.equal(findAttribute(visualItemIcon(items, 'spring_water', { size: 44 }), 'data-art-key'), 'supply_spring_water');
 assert.equal(findAttribute(visualItemIcon(items, 'gentle_growth', { size: 44 }), 'data-art-key'), 'supply_boost');
 for (const expansion of DB.expansions) {
  const visual = visualItemIcon(items, expansion.id, { size: 44 });
  assert.equal(findAttribute(visual, 'data-expansion-id'), expansion.id);
  if (expansion.kind === 'plot') {
   assert.equal(findAttribute(visual, 'data-art-key'), 'expansion_plot');
   assert.match(visual.textContent, new RegExp(`Thửa ${expansion.id.slice(5)}`));
  }
 }

 for (const animal of ANIMALS) {
  for (const id of [animal.feed, `produce_${animal.id}`]) {
   assert.ok(itemArtKey(id), `Missing canonical art for ${id}`);
   assert.equal(findClass(visualItemIcon(new Map(), id, {size:44}), 'is-art-missing'), null, id);
  }
 }
 for (const decoration of DB.decorations) {
  assert.equal(findAttribute(earnedDecorIcon(decoration.id, { size: 44 }), 'data-art-key'), decoration.id);
 }

 for (const level of [5, 45]) {
  const row = DB.levels.find(entry => entry.level === level);
  assert.ok(row);
  const visual = levelUnlockVisual(row, DB, items, 44).visual;
  assert.equal(Boolean(findAttribute(visual, 'src')?.includes('decor_pumpkin_lantern')), false);
 }
 const unknown = levelUnlockVisual({level:501,unlock:'Món chưa có tranh'}, DB, items, 44).visual;
 assert.equal(findAttribute(unknown,'src'), undefined, 'no other item may impersonate missing unlock art');
 assert.ok(unknown.className.includes('is-art-missing'));
 const pumpkinFallbacks = DB.levels
  .map(row => ({ level: row.level, src: findAttribute(levelUnlockVisual(row, DB, items, 44).visual, 'src') }))
  .filter(entry => entry.src?.includes('decor_pumpkin_lantern'));
 assert.deepEqual(pumpkinFallbacks, []);
 assert.equal(findAttribute(levelUnlockVisual(DB.levels.find(entry => entry.level === 45), DB, items, 44).visual, 'src'), 'flax.png');
});

test('all six pen expansions use distinct native enclosure art while retaining expansion identity', () => {
 const pens = DB.expansions.filter(expansion => /^pen_\d+$/.test(expansion.id)); // «Chuồng mở rộng» pen_ext_* reuse pen_6's art (phase 2)
 assert.equal(pens.length, 6);
 assert.equal(new Set(pens.map(({id}) => ITEM_ART[id]?.file)).size, 6);
 for (const {id} of pens) {
  const art = ITEM_ART[id];
  assert.ok(art?.file, `Missing pen art for ${id}`);
  assert.equal(art.width, Number(id.slice(-1)) >= 4 ? 160 : 128, `${id} width`);
  assert.equal(art.height, Number(id.slice(-1)) >= 4 ? 144 : 112, `${id} height`);
  const large = Number(id.slice(-1)) >= 4;
  assert.ok(art.bounds.w <= (large ? 144 : 112) && art.bounds.h <= (large ? 112 : 88), `${id} enclosure bounds exceed target`);
  assert.ok(fs.existsSync(new URL(art.file, import.meta.url)), `${id} file missing`);
  const visual = visualItemIcon(new Map(), id, {size: 44});
  assert.equal(findAttribute(visual, 'data-expansion-id'), id);
  assert.equal(findAttribute(visual, 'data-art-key'), id);
 }
});

test('garden expansion species without ITEM_ART have their feed and produce icons in POND_ART', () => {
 for (const id of FLOW_SPECIES) {
  const a = DB.animals.find(x => x.id === id);
  if (a.habitat === 'pond') continue; // Thủy quái's meal uses the fish-meal art
  for (const key of [a.feed, `produce_${a.id}`]) assert.ok(flowArtSpec(key)?.file, key);
 }
});

test('every current recipe, feed, produce, expansion and orchard item has an actual UI image',()=>{
 const ids=[...DB.recipes.map(r=>'recipe_'+r.id),...DB.animals.flatMap(a=>[a.feed,'produce_'+a.id]),...DB.expansions.map(e=>e.id),...DB.decorations.map(d=>d.id),'apple','pear','plum','sapling_apple','sapling_pear','sapling_plum','elf_hat','elf_sock'];
 for(const id of ids){
  const visual=visualItemIcon(new Map(),id,{size:48});
  assert.equal(findClass(visual,'is-art-missing'),null,id+' uses a placeholder');
  assert.ok(findClass(visual,'item-art-img'),id+' has no actual artwork');
 }
});
