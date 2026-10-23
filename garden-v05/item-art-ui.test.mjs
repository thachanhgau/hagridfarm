import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DB } from './balance-data.mjs?v=24.9.65';
import { ITEM_ART } from './item-art.mjs?v=24.9.74';

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
 earnedDecorIcon,
 itemArtKey,
 levelUnlockVisual,
 visualItemIcon,
} = await import('./ui-utils.mjs?v=24.9.74');

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
  ...DB.recipes.map(recipe => `recipe_${recipe.id}`),
  ...DB.animals.map(animal => `produce_${animal.id}`),
  ...DB.decorations.map(decoration => decoration.id),
 ];
 const missing = ids.filter(id => !ITEM_ART[id]?.file);
 assert.deepEqual(missing, []);
 assert.equal(new Set(ids).size, ids.length);
 assert.equal(new Set(ids.map(id => `${ITEM_ART[id].file}|${JSON.stringify(ITEM_ART[id].bounds)}`)).size, ids.length, 'distinct item-art regions');
 for (const id of ids) assert.ok(Number(ITEM_ART[id].width) > 0 && Number(ITEM_ART[id].height) > 0, id);
});

test('canonical outputs alias recipe art while recipe cards keep variant art', () => {
 const items = new Map();
 for (const recipe of DB.recipes) {
  const key = `recipe_${recipe.id}`;
  assert.equal(itemArtKey(key), key);
  assert.equal(findAttribute(visualItemIcon(items, key, { size: 44 }), 'data-art-key'), key);
 }
 for (const output of new Set(DB.recipes.map(recipe => recipe.output))) {
  assert.equal(itemArtKey(output), `recipe_${output}`);
  assert.equal(findAttribute(visualItemIcon(items, output, { size: 44 }), 'data-art-key'), `recipe_${output}`);
 }
});

test('produce and keepsake art never fall back to the creature sprite', () => {
 const items = new Map([['puffskein', { frames: [{}, {}, {}, { file: 'creature.png', width: 48, height: 48, bounds: { x: 0, y: 0, w: 48, h: 48 } }] }]]);
 const produce = visualItemIcon(items, 'produce_puffskein', { size: 44, kind: 'produce' });
 const keepsake = visualItemIcon(items, 'keepsake_puffskein', { size: 44, kind: 'keepsake' });
 assert.equal(findAttribute(produce, 'data-art-key'), 'produce_puffskein');
 assert.equal(findAttribute(keepsake, 'data-art-key'), 'produce_puffskein');
 assert.equal(findAttribute(keepsake, 'data-presentation'), 'trophy-pedestal');
 assert.equal(findAttribute(findClass(keepsake, 'keepsake-pedestal-badge'), 'data-art-key'), 'reward_trophy');
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

 for (const decoration of DB.decorations) {
  assert.equal(findAttribute(earnedDecorIcon(decoration.id, { size: 44 }), 'data-art-key'), decoration.id);
 }

 for (const level of [5, 45]) {
  const row = DB.levels.find(entry => entry.level === level);
  assert.ok(row);
  const visual = levelUnlockVisual(row, DB, items, 44).visual;
  assert.equal(Boolean(findAttribute(visual, 'src')?.includes('decor_pumpkin_lantern')), false);
 }
 const pumpkinFallbacks = DB.levels
  .map(row => ({ level: row.level, src: findAttribute(levelUnlockVisual(row, DB, items, 44).visual, 'src') }))
  .filter(entry => entry.src?.includes('decor_pumpkin_lantern'));
 assert.deepEqual(pumpkinFallbacks, []);
 assert.equal(findAttribute(levelUnlockVisual(DB.levels.find(entry => entry.level === 45), DB, items, 44).visual, 'src'), 'flax.png');
});

test('all six pen expansions use distinct native enclosure art while retaining expansion identity', () => {
 const pens = DB.expansions.filter(expansion => expansion.kind === 'pen');
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
