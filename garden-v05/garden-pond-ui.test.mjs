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

const P = await import('./garden-pond-ui.mjs?v=26.24');
const {ICONS} = await import('./pixel-icons.mjs?v=26.24');
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
 assert.deepEqual([1, 2, 3].map(P.tierScale), [3.8, 3.8, 3.8]);
});

test('quick fill: store packs for the free slots, the server price tier, plant commands bed by bed', () => {
 const seed = {id: 'seed_fluxweed', price: 31, quantity: 3, dailyLimit: 1000, dailyRemaining: 4, overflowMultiplier: 5};
 assert.deepEqual(P.quickFill(seed, 30, 2000), {packs: 10, cost: 4 * 31 + 6 * 31 * 5, short: 0}, 'past the daily price tier ×5');
 assert.deepEqual(P.quickFill({price: 34, quantity: 2, dailyLimit: 1000}, 5, 100), {packs: 3, cost: 102, short: 2});
 assert.equal(P.quickFill({...seed, forSale: false}, 3), null);
 assert.equal(P.quickFill(null, 3), null);
 assert.equal(P.quickFill(seed, 0), null);
 const beds = P.bedTiles(pond(), NOW);
 assert.deepEqual(P.plantCommands(beds, 'fluxweed').map(c => [c.bed, c.cells]), [[0, [1, 2]], [1, [0, 1, 2]]]);
 assert.deepEqual(P.plantCommands(beds, 'fluxweed', 3).map(c => [c.bed, c.cells]), [[0, [1, 2]], [1, [0]]]);
});

test('fishing bar: the server triangle wave, bands and result labels', () => {
 const token = {at: NOW, periodMs: 1600, zone: [0.3, 0.7], sweet: [0.45, 0.55], expiresAt: NOW + 60000};
 assert.deepEqual([0, 400, 800, 1200, 1600, 2000].map(t => P.castPos(token, t)), [0, 0.5, 1, 0.5, 0, 0.5]);
 assert.deepEqual([0.5, 0.35, 0.9].map(pos => P.castBand(token, pos)), ['sweet', 'zone', 'miss']);
 assert.deepEqual(P.receiptItems({fish: 3, goldfish: 0}), [['fish', 3, 'Cá nhỏ']]);
 assert.equal(P.pondReceiptText({items: {goldfish: 1, fish: 3}}), 'Cá vàng ×1 · Cá nhỏ ×3');
 for (const text of Object.values(P.CAST_RESULT)) assert.doesNotMatch(text, /\p{Extended_Pictographic}|!/u);
});

test('the pond dock is the sow dock: one tray, one primary button that works the whole pond', async () => {
 const dock = new FakeElement('section'), sent = [], cares = [];
 let casts = 0;
 const ui = P.createPondDock({dock, items: new Map(), act: async (cmd, text) => sent.push([cmd, text]), openCast: () => casts++, care: sp => cares.push(sp)});
 const ctx = {pond: pond(), state: {construction: [], built: ['pond_1']}, level: 140, now: NOW, seeds: {silverkelp: 2},
  creature: {species: 'grindylow', label: 'Thủy quái', feed: 'grindylow_feed', have: 4, badge: 'Cấp 150', locked: true}};
 ui.render(ctx);
 const tray = () => byClass(dock, 'pond-tray')[0].children, go = () => byId(dock, 'pondGo');
 assert.deepEqual(tray().map(b => b.attributes['data-section']), ['fish', 'fish', 'beds', 'beds', 'creatures'], 'fry, water crops at 140, the pond creature');
 assert.equal(dock.classList.contains('pond-sow'), true);
 assert.equal(byClass(dock, 'seed-caption')[0].textContent, 'Cá chép giốngÔ 2/2 · chín 1');
 assert.equal(go().textContent, 'Lưới ×1');
 go().click(); byId(dock, 'pondCast').click();
 assert.deepEqual(sent.shift()[0], {action: 'pond', kind: 'net'});
 assert.equal(casts, 1);
 assert.equal(byId(dock, 'pondClean'), undefined, '«Vớt rêu» only while murky');
 // Beds: ripe first, then «Gieo» fills empty cells across beds up to the seeds held.
 tray()[2].click();
 assert.equal(go().textContent, 'Gặt ×1');
 ui.render({...ctx, pond: pond({beds: [[null, null, null], [null, {species: 'silverkelp', readyAt: NOW + H}, null]]}), seeds: {silverkelp: 4}});
 assert.equal(go().textContent, 'Gieo ×4');
 go().click(); await new Promise(r => setTimeout(r));
 assert.deepEqual(sent.splice(0).map(([cmd]) => cmd), [{action: 'pond', kind: 'plant', bed: 0, cells: [0, 1, 2], species: 'silverkelp'}, {action: 'pond', kind: 'plant', bed: 1, cells: [0], species: 'silverkelp'}]);
 // Fish: empty lots and fry held → «Thả», one command a lot; nothing to do → the next timer.
 ui.show('fish');
 ui.render({...ctx, pond: pond({murky: true, lots: [null, null, null], cast: {today: true}})});
 assert.equal(go().textContent, 'Thả ×3');
 go().click(); await new Promise(r => setTimeout(r));
 assert.deepEqual(sent.splice(0).map(([cmd]) => cmd.lot), [0, 1, 2]);
 assert.ok(byId(dock, 'pondClean'));
 assert.deepEqual([byId(dock, 'pondCast').disabled, byId(dock, 'pondCast').textContent.trim()], [true, 'Đã câu']);
 ui.render({...ctx, pond: pond({lots: [{fry: 'carp', readyAt: NOW + H}]})});
 assert.equal(go().disabled, true);
 assert.equal(go().children.at(-1).attributes['data-until'], String(NOW + H), 'its timer ticks with tickTimers');
 // Creature chip: «Chăm», locked below its level.
 tray().at(-1).click();
 assert.equal(go().textContent, 'Chăm');
 assert.equal(go().disabled, true, 'Thủy quái opens at 150');
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
  [[608, 486, 304, 476, 11, 8], [608, 486, 304, 476, 11, 8], [608, 486, 304, 476, 11, 8], [128, 88, 64, 70, 3, 1], [224, 248, 112, 230, 3, 3]]);
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

const O=await import('./garden-orchard-ui.mjs');
test('orchard dock: a tree header with Chặt (two taps) and «Hái» waiting, an empty pit plants the chosen sapling',()=>{
 const dock=new FakeElement('section'),sent=[],bought=[],ui=O.createOrchardDock({dock,act:cmd=>sent.push(cmd),onBuy:()=>bought.push(1)});
 const tray=()=>byClass(dock,'orchard-tray')[0].children,tool=()=>byClass(dock,'orchard-tool')[0];
 const orchard={fruitPerTree:4,treeMs:72*H,trees:Array.from({length:6},(_,i)=>({kind:['apple','pear','plum'][i%3],readyAt:NOW+(i+1)*H})),saplings:{apple:2,pear:0,plum:0}};
 ui.render({orchard,now:NOW,inventory:{apple:7}});
 assert.equal(byId(dock,'orchardHarvest').disabled,true);assert.equal(byClass(dock,'orchard-pick').length,0);
 assert.equal(tray().length,6);assert.equal(tray()[0].getAttribute('aria-pressed'),'true');
 assert.match(byId(dock,'orchardHarvest').getAttribute('aria-label'),/chín sau 1g/);
 assert.equal(byClass(dock,'seed-caption')[0].children[0].textContent,'Cây táo');
 tray()[1].click();assert.equal(byClass(dock,'seed-caption')[0].children[0].textContent,'Cây lê');
 tool().click();assert.equal(sent.length,0);assert.ok(tool()._classes.has('is-confirm'));
 tray()[0].click();assert.ok(!tool()._classes.has('is-confirm'),'another pick cancels Chặt');
 tool().click();tool().click();assert.deepEqual(sent.pop(),{action:'orchard',kind:'fell',spot:0});
 ui.render({orchard:{...orchard,trees:[null,...orchard.trees.slice(1)]},now:NOW});
 assert.equal(byClass(dock,'orchard-pick')[0].children.length,3);
 byId(dock,'orchardHarvest').click();assert.deepEqual(sent.pop(),{action:'orchard',kind:'plant',spot:0,sapling:'apple'});
 byClass(dock,'orchard-pick')[0].children[1].click();byId(dock,'orchardHarvest').click();assert.equal(bought.length,1,'no pear sapling: the primary opens the store');
 ui.render({orchard:{...orchard,trees:orchard.trees.map(t=>({...t,ripe:true}))},now:NOW});
 assert.equal(byId(dock,'orchardHarvest').getAttribute('aria-label'),'Hái ×6');
 byId(dock,'orchardHarvest').click();assert.deepEqual(sent.pop(),{action:'orchard',kind:'harvest'});
});

test('Forbidden Lake is larger, stays on shore land, and clears beds, nook and its approach', async()=>{
 const {pondHome,pondFootprint,pondBedRects,POND_NOOK}=await import('./default-decor.mjs'),{decorFootprintRect}=await import('./decor-runtime.mjs'),{POND_LAND:L}=await import('./garden-growth.mjs');
 const disjoint=(a,b)=>a.c1<=b.c0||b.c1<=a.c0||a.r1<=b.r0||b.r1<=a.r0;
 let first;
 for(const built of [['pond_1'],['pond_1','pond_2'],['pond_1','pond_2','pond_3']]){
  const size=pondFootprint(built),at=pondHome(null,built),rect=decorFootprintRect(...at,size,'right');
  assert.deepEqual(size,[11,8]);assert.ok(size[0]*size[1]>=54*1.6,'at least 60% more ground');
  assert.ok(rect.c0>=L.col&&rect.c1<=L.right&&rect.r0>=L.rowTop&&rect.r1<=L.rowBottom);
  assert.equal((rect.c0+rect.c1)/2,20.5,'approach remains centred');assert.ok(L.rowBottom-rect.r1>=3,'front path stays clear');
  assert.ok(disjoint(rect,decorFootprintRect(...POND_NOOK.at,POND_NOOK.footprint)),'nook must clear enlarged shore');
  for(const b of pondBedRects(at,built,10)){assert.ok(disjoint(rect,b),'paddies must stay outside lake');assert.ok(disjoint(decorFootprintRect(...POND_NOOK.at,POND_NOOK.footprint),b),'nook stays off the paddies');}
  assert.ok(rect.c0-decorFootprintRect(...POND_NOOK.at,POND_NOOK.footprint).c1>=2,'nook stands clear of the lake woodland');
  if(first)assert.deepEqual(rect,first,'upgrading does not move the lake');first=rect;
 }
});

test('willow nook overhangs no paddy and keeps off the col-7.5 path (owner 16/11 «ko che hết mấy cái hồ nhỏ», «dời cái cây lên đây»)',async()=>{
 const {POND_NOOK,pondBedRects}=await import('./default-decor.mjs'),{decorFootprintRect}=await import('./decor-runtime.mjs');
 const {POND_SCENERY:POND_ART}=await import('./pond-art.mjs'),{inPondLand}=await import('./garden-growth.mjs');
 const art=POND_ART['pond-nook'],half=Math.max(art.pivotX,art.width-art.pivotX)/32,[c,r]=POND_NOOK.at; // 32 px per screen column
 for(const b of pondBedRects(null,['pond_3'],10))for(const bc of [b.c0,b.c1])for(const br of [b.r0,b.r1])assert.ok(Math.abs(bc-br-(c-r))>=half||bc+br>c+r||bc+br<c+r-art.pivotY/16,'canopy clears every paddy'); // 16 px per screen row
 const rect=decorFootprintRect(...POND_NOOK.at,POND_NOOK.footprint);
 assert.ok(rect.c1<=7,'clear of the col-7.5 path');
 assert.ok(inPondLand(c,r)&&rect.r0>=-13.5,'foot on the shore meadow, behind the paddies');
 const scene=JSON.parse((await import('node:fs')).readFileSync(new URL('./scene-data.json',import.meta.url)));
 assert.ok(scene.origin.y+(c+r)*16-art.pivotY+art.bounds.y>=0,'crown inside the scene top (owner «cây bị cắt»)');
});

test('«Sổ cá» cells: six in order, caught from the snapshot plus the fresh catch', async () => {
 const P = await import('./garden-pond-ui.mjs');
 const cells = P.bookCells({caught: ['rarefish_moon'], all: P.RARE_FISH}, 'rarefish_koi');
 assert.deepEqual(cells.map(c => [c.id, c.caught, c.fresh]).filter(([, caught]) => caught), [['rarefish_koi', true, true], ['rarefish_moon', true, false]]);
 assert.equal(cells[0].label, 'Cá chép koi');
 assert.equal(P.bookCells(null).length, 6);
});
