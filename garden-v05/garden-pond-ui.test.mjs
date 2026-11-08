// Garden expansion phase 1 «Hồ nuôi» (docs/garden-expansion-plan.md §2.1, §6): the pond dock, the fishing bar and the
// pond art contract, from the server's snapshot.pond (HPVNN garden pond core).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

class FakeText {constructor(t) {this.textContent = String(t); this.parentNode = null;}}
class FakeElement {
 constructor(tagName) {
  Object.assign(this, {tagName, children: [], parentNode: null, attributes: {}, style: {}, dataset: {}, listeners: {}, _classes: new Set(), _text: ''});
  this.classList = {add: (...n) => n.forEach(x => this._classes.add(x)), remove: (...n) => n.forEach(x => this._classes.delete(x)),
   toggle: (n, on) => (on ? this._classes.add(n) : this._classes.delete(n)), contains: n => this._classes.has(n)};
 }
 set className(v) {this._classes = new Set(String(v).split(/\s+/).filter(Boolean));}
 get className() {return [...this._classes].join(' ');}
 set textContent(v) {this._text = String(v ?? ''); this.children = [];}
 get textContent() {return this._text || this.children.map(c => c.textContent).join('');}
 setAttribute(n, v) {this.attributes[n] = String(v);}
 getAttribute(n) {return this.attributes[n] ?? null;}
 addEventListener(type, fn) {this.listeners[type] = fn;}
 click() {if (!this.disabled) this.listeners.click?.({target: this});}
 append(...nodes) {for (const n of nodes) {n.parentNode = this; this.children.push(n);} this._text = '';}
 replaceChildren(...nodes) {this.children = []; this._text = ''; this.append(...nodes);}
}
globalThis.document = {createElement: t => new FakeElement(t), createTextNode: t => new FakeText(t), getElementById: () => null};

const P = await import('./garden-pond-ui.mjs?v=25.0.2');
const {ICONS} = await import('./pixel-icons.mjs?v=25.0.2');
const all = (node, fn, out = []) => {if (fn(node)) out.push(node); for (const c of node.children || []) all(c, fn, out); return out;};
const byClass = (node, cls) => all(node, n => n._classes?.has(cls));
const byId = (node, id) => all(node, n => n.attributes?.id === id)[0];

const NOW = 1_800_000_000_000, H = 3600000;
const pond = (more = {}) => ({unlockLevel: 130, tier: 1, footprint: [3, 2],
 lots: [{fry: 'carp', readyAt: NOW - 1, ripe: true}, {fry: 'goldfish', readyAt: NOW + 2 * H, ripe: false}],
 beds: [[{species: 'silverkelp', readyAt: NOW - 1, ripe: true}, null, null], [null, null, null]],
 bedCrops: ['silverkelp', 'gillyweed', 'fluxweed'], murky: false, murkySince: null, fry: {carp: 4, goldfish: 0},
 cast: {today: false, token: null}, creatureSpots: 2, ...more});

test('view helpers: lots, beds, water crops by level, head actions', () => {
 assert.deepEqual(P.lotTiles(pond(), NOW).map(l => l.state), ['ripe', 'growing']);
 assert.deepEqual(P.lotTiles(pond({lots: [null, {fry: 'carp', readyAt: NOW - 5}]}), NOW).map(l => l.state), ['empty', 'ripe'], 'a lot ripens on the client clock too');
 const [bed, empty] = P.bedTiles(pond(), NOW);
 assert.deepEqual([bed.ripe, bed.empty, empty.empty, empty.readyAt], [1, [1, 2], [0, 1, 2], null]);
 assert.deepEqual(P.bedCropChoices(pond(), 140, {silverkelp: 9}).map(c => [c.id, c.seeds]), [['silverkelp', 9], ['fluxweed', 0]], 'Cỏ mang cá opens at 250');
 assert.deepEqual(P.pondActions(pond({murky: true}), NOW), {ripeLots: 1, ripeCells: 1, murky: true, castOpen: true});
 assert.equal(P.pondActions(pond({cast: {today: true}}), NOW).castOpen, false);
 assert.deepEqual([P.pondTier(['plot_1']), P.pondTier(['pond_1']), P.pondTier(['pond_1', 'pond_2'])], [0, 1, 2]);
 assert.deepEqual([1, 2, 3].map(P.tierLabel), ['Ao cá', 'Hồ rong', 'Hồ sâu']);
 assert.deepEqual([1, 2, 3].map(P.tierScale), [1.8, 2.4, 3]);
});

test('fishing bar: the server triangle wave, bands and result labels', () => {
 const token = {at: NOW, periodMs: 1600, zone: [0.3, 0.7], sweet: [0.45, 0.55], expiresAt: NOW + 60000};
 assert.deepEqual([0, 400, 800, 1200, 1600, 2000].map(t => P.castPos(token, t)), [0, 0.5, 1, 0.5, 0, 0.5]);
 assert.deepEqual([0.5, 0.35, 0.9].map(pos => P.castBand(token, pos)), ['sweet', 'zone', 'miss']);
 assert.deepEqual(P.receiptItems({fish: 3, goldfish: 0}), [['fish', 3, 'Cá nhỏ']]);
 assert.equal(P.pondReceiptText({items: {goldfish: 1, fish: 3}}), 'Cá vàng ×1 · Cá nhỏ ×3');
 for (const text of Object.values(P.CAST_RESULT)) assert.doesNotMatch(text, /\p{Extended_Pictographic}|!/u);
});

test('the pond dock renders data rows and sends the contract commands', () => {
 const dock = new FakeElement('section'), sent = [], cares = [];
 let casts = 0;
 const ui = P.createPondDock({dock, items: new Map(), act: (cmd, text) => sent.push([cmd, text]), openCast: () => casts++, care: sp => cares.push(sp)});
 const ctx = {pond: pond(), state: {construction: [], built: ['pond_1']}, level: 140, now: NOW, seeds: {silverkelp: 2},
  creature: {species: 'grindylow', label: 'Thủy quái', feed: 'grindylow_feed', have: 4, badge: 'Cấp 150', locked: true}};
 ui.render(ctx);
 assert.equal(byClass(dock, 'pond-title')[0].textContent, 'Ao cá2 ô · 2 luống');
 const net = byId(dock, 'pondNet'), cast = byId(dock, 'pondCast');
 assert.equal(net.textContent, 'Kéo lưới · 1');
 assert.equal(byId(dock, 'pondClean'), undefined, '«Vớt rêu» only while murky');
 net.click(); cast.click();
 assert.deepEqual(sent.shift()[0], {action: 'pond', kind: 'net'});
 assert.equal(casts, 1);
 const lots = byClass(dock, 'pond-lot');
 assert.equal(lots.length, 2);
 assert.equal(lots[1].disabled, true, 'a growing lot is not a button press');
 assert.equal(lots[1].children[1].attributes['data-until'], String(NOW + 2 * H), 'its timer ticks with tickTimers');
 const beds = byClass(dock, 'pond-bed');
 beds[0].click(); beds[1].click();
 assert.deepEqual(sent.map(([cmd]) => cmd), [{action: 'pond', kind: 'harvest'}, {action: 'pond', kind: 'plant', bed: 1, cells: [0, 1], species: 'silverkelp'}], 'two seeds plant two cells');
 assert.equal(byClass(dock, 'pond-care')[0].disabled, true, 'Thủy quái opens at 150');
 assert.equal(byClass(dock, 'pond-creature')[0].textContent.includes('Thủy quái'), true);
 // Murky, nothing ripe, today's cast used: the faces say why.
 ui.render({...ctx, pond: pond({murky: true, lots: [null, null], cast: {today: true}})});
 assert.equal(byId(dock, 'pondNet').disabled, true);
 assert.ok(byId(dock, 'pondClean'));
 assert.deepEqual([byId(dock, 'pondCast').disabled, byId(dock, 'pondCast').textContent], [true, 'Mai câu tiếp']);
 const empty = byClass(dock, 'pond-lot')[0];
 sent.length = 0; empty.click();
 assert.deepEqual(sent[0][0], {action: 'pond', kind: 'stock', lot: 0, fry: 'carp'});
 // No sentence anywhere: labels and numbers only.
 assert.doesNotMatch(dock.textContent, /\.\s|!|\p{Extended_Pictographic}/u);
});

test('tier 0 at level 130+: «Đào ao» is the pond_1 build with its cost', () => {
 const dock = new FakeElement('section'), sent = [];
 const ui = P.createPondDock({dock, items: new Map(), act: cmd => sent.push(cmd), openCast() {}, care() {}});
 const choice = {canBuild: true, costs: [{id: 'silverkelp', have: 30, need: 24}, {id: 'fluxweed', have: 36, need: 36}], galleonNeed: 800, galleonShort: false};
 ui.render({pond: pond({tier: 0, lots: [], beds: [], creatureSpots: 0}), state: {construction: [], built: []}, level: 130, now: NOW, seeds: {}, buildChoice: choice});
 assert.equal(byClass(dock, 'dock-cost').length, 3);
 byId(dock, 'pondDig').click();
 assert.deepEqual(sent, [{action: 'build', expansionId: 'pond_1'}]);
 ui.render({pond: pond({tier: 0, lots: [], beds: []}), state: {construction: [{id: 'pond_1', kind: 'pond', readyAt: NOW - 1}], built: []}, level: 130, now: NOW, seeds: {}, buildChoice: {...choice, canBuild: false}});
 byId(dock, 'pondDig').click();
 assert.deepEqual(sent.at(-1), {action: 'claimBuildings'});
});

test('art contract: scenery sizes, guarded scene files and pixel icon fallbacks', () => {
 assert.deepEqual(Object.values(P.POND_SCENERY).map(s => [s.width, s.height, s.pivotX, s.pivotY, ...s.footprint]),
  [[288, 186, 144, 176, 5, 4], [384, 242, 192, 224, 7, 5], [480, 298, 240, 288, 9, 6], [128, 88, 64, 70, 3, 1]]);
 for (const tier of [1, 2, 3]) assert.deepEqual(P.POND_SCENERY[`pond-${tier}`].footprint, P.tierFootprint(tier));
 const manifest = JSON.parse(fs.readFileSync(new URL('runtime-webp-manifest.json', import.meta.url)));
 const shipped = new Set(manifest.images.map(i => i.source));
 // Once pond-art has merged (its item art resolves), every scene file must exist and have its runtime WebP.
 if (P.POND_ART_SHIPPED) for (const s of Object.values(P.POND_SCENERY)) assert.ok(shipped.has(s.file), s.file);
 else for (const id of Object.keys(P.POND_SCENERY)) assert.equal(P.pondScenery(id), null, 'nothing is requested before the art exists');
 assert.ok(shipped.has(P.POND_FALLBACK));
 for (const [name, fallback] of [['pond', 'water'], ['net', 'harvest'], ['rod', 'quill'], ['algae', 'tired']]) {
  assert.ok(ICONS[fallback], fallback);
  assert.equal(P.px(name, fallback).attributes['data-icon'], ICONS[name] ? name : fallback);
 }
 // pond-art.mjs (pond-art branch) carries the same numbers.
 if (fs.existsSync(new URL('pond-art.mjs', import.meta.url))) return import('./pond-art.mjs').then(({POND_SCENERY}) => {
  for (const [id, s] of Object.entries(P.POND_SCENERY)) {
   const art = Object.values(POND_SCENERY).find(x => x?.file === s.file) ?? POND_SCENERY[id];
   for (const k of ['width', 'height', 'pivotX', 'pivotY']) assert.equal(art?.[k], s[k], id + ' ' + k);
  }
 });
});
