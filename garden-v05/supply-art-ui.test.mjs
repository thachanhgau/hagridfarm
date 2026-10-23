import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ITEM_ART } from './item-art.mjs?v=24.9.72';

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
  this._text = '';
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

const { itemArtKey, visualItemIcon } = await import('./ui-utils.mjs?v=24.9.72');

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

const CANONICAL_SURFACES = [
 ['water', 'supply_water', 'water'],
 ['boost', 'supply_boost', 'boost'],
 ['spring_water', 'supply_spring_water', 'spring'],
 ['spring_rain', 'premium_spring_rain', 'premium'],
 ['felix_felicis', 'premium_felix_felicis', 'premium'],
 ['prime_meal', 'premium_prime_meal', 'premium'],
 ['pen_feast', 'premium_pen_feast', 'premium'],
 ['skele_gro', 'premium_skele_gro', 'premium'],
 ['warm_nest_1', 'premium_warm_nest', 'nest'],
 ['plot_4', 'expansion_plot', ''],
 ['reward_medal', 'reward_medal', ''],
 ['reward_trophy', 'reward_trophy', ''],
];

test('future supply, premium, expansion and reward identities are canonical', () => {
 for (const [rawId, key, kind] of CANONICAL_SURFACES) {
  assert.equal(itemArtKey(rawId, kind ? { kind } : {}), key, rawId);
  assert.ok(ITEM_ART[key]?.file, `Missing native art for ${key}`);
 }
});

test('native item surfaces keep supply and premium classes without inline SVG', () => {
 const supplies = [
  visualItemIcon(new Map(), 'water', { size: 44 }),
  visualItemIcon(new Map(), 'boost', { size: 44 }),
  visualItemIcon(new Map(), 'spring_water', { size: 44 }),
 ];
 assert.ok(supplies.every(visual => visual.className.includes('is-supply')));
 assert.ok(supplies[2].className.includes('is-spring'));

 const premium = visualItemIcon(new Map(), 'spring_rain', { size: 44, kind: 'premium' });
 assert.ok(premium.className.includes('is-supply'));
 assert.ok(premium.className.includes('is-premium'));
 assert.equal(findAttribute(premium, 'data-art-key'), 'premium_spring_rain');

 const crafted = visualItemIcon(new Map(), 'insects', { size: 44 });
 assert.ok(crafted.className.includes('is-crafted'));
 assert.equal(findAttribute(crafted, 'data-art-key'), 'recipe_insects');
 assert.equal(findAttribute(visualItemIcon(new Map(), 'fish', { size: 44 }), 'data-art-key'), 'recipe_fish');

 const source = fs.readFileSync(new URL('./ui-utils.mjs', import.meta.url), 'utf8');
 assert.doesNotMatch(source, /<svg/i);
 for (const visual of [...supplies, premium, crafted]) assert.doesNotMatch(visual.innerHTML, /<svg/i);
});

test('unknown premium art remains explicit instead of falling back to a medal', () => {
 const visual = visualItemIcon(new Map(), 'premium_future_item', { size: 44, kind: 'premium' });
 assert.ok(visual.className.includes('is-supply'));
 assert.ok(visual.className.includes('is-premium'));
 assert.ok(visual.className.includes('is-art-missing'));
 assert.equal(findClass(visual, 'is-medal'), null);
 assert.equal(findAttribute(visual, 'data-art-key'), undefined);
});

test('plot cards use native plot art with accessible HTML labels and expansion identity', () => {
 const visual = visualItemIcon(new Map(), 'plot_12', { size: 44 });
 assert.equal(findAttribute(visual, 'data-expansion-id'), 'plot_12');
 assert.equal(findAttribute(visual, 'data-art-key'), 'expansion_plot');
 assert.equal(findAttribute(visual, 'aria-label'), 'Thửa 12');
 assert.match(visual.textContent, /Thửa 12/);
 assert.doesNotMatch(visual.innerHTML, /<svg/i);
});
