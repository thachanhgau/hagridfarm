import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import scene from './scene-data.json' with {type: 'json'};
import motion from './motion-data.json' with {type: 'json'};
import * as E from './progression-engine.mjs';
import {FESTIVAL_FILES} from './garden-seasonal-world.mjs';
import {runtimeImageUrl} from './runtime-image-url.mjs';

globalThis.FARM_SCENE = structuredClone(scene);
globalThis.FARM_MOTION = motion;
vm.runInNewContext(fs.readFileSync(new URL('./level-assets.js',import.meta.url),'utf8'),{window:{FARM_MOTION:motion}});
const {createGarden} = await import('./scene-renderer.mjs');
const manifest = JSON.parse(fs.readFileSync(new URL('./decor-assets-manifest.json', import.meta.url), 'utf8'));

function recordingCanvas() {
  const requested = new Set();
  const drawn = [];
  const drawCalls = [];
  const context = new Proxy({}, {get: (o, k) => k === 'drawImage' ? (image,...args) => {drawn.push(image.source);drawCalls.push({file:image.source,args});} : k === 'measureText' ? () => ({width: 64}) : k === 'getImageData' ? (x, y, width, height) => ({width, height, data: new Uint8ClampedArray(width * height * 4)}) : (o[k] ??= () => {})});
  class RecordingImage {
    naturalWidth = 64; naturalHeight = 64;
    set src(value) { this.source=value; requested.add(value); queueMicrotask(() => this.onload?.()); }
  }
  const canvas = {
    width: 0, height: 0, dataset: {}, getContext: () => context,
    getBoundingClientRect() { return {left: 0, top: 0, width: 1, height: 1}; },
    ownerDocument: {createElement: () => recordingCanvas().canvas, defaultView: {Image: RecordingImage}},
  };
  return {canvas, requested, drawn, drawCalls};
}


test('orchard roots meet the centre of every pit at every growth stage',async()=>{
 const {EDGE_LAYOUT}=await import('./garden-growth.mjs'),{EDGE_SCENERY}=await import('./edge-art.mjs');
 const {canvas,drawCalls}=recordingCanvas(),garden=await createGarden(canvas,{decorAssets:manifest.items});
 const now=1_700_000_000_000,state=E.testProfile(500,now);
 state.built=[...new Set([...state.built,'edge_1','edge_2','edge_3'])];
 for(const stage of [0,1,2]){
  const orchard={trees:EDGE_LAYOUT.pits.map((p,i)=>({kind:['apple','pear','plum'][i%3],readyAt:now+(stage===0?100:1)*3600000,ripe:stage===2}))};
  const options={now,clock:0,propsVisible:true,orchard};
  garden.render(state,options);await new Promise(resolve=>setImmediate(resolve));drawCalls.length=0;garden.render(state,options);
  for(const [i,pit]of EDGE_LAYOUT.pits.entries()){
   const spec=EDGE_SCENERY[`tree-${orchard.trees[i].kind}-${stage}`],call=drawCalls.filter(c=>c.file===runtimeImageUrl(spec.file))[i<3?0:1];
   assert.ok(call,'tree was not drawn');
   const [x,y]=[scene.origin.x+(pit[0]-pit[1])*32,scene.origin.y+(pit[0]+pit[1])*16];
   assert.deepEqual(call.args.slice(0,2),[Math.round(x-spec.groundCentre.x),Math.round(y-spec.groundCentre.y)]);
  }
 }
});

test('front pen rails occlude a large resident while back rails remain behind it',async()=>{
 const {canvas}=recordingCanvas(),garden=await createGarden(canvas,{decorAssets:manifest.items});
 const now=1_700_000_000_000,state=E.testProfile(500,now);
 state.built=[...new Set([...state.built,...Array.from({length:6},(_,i)=>'pen_'+(i+1))])];
 state.creatures=E.DB.animals.filter(a=>a.habitat!=='pond').map(a=>({id:'creature-'+a.id,type:'creature',species:a.id,adoptedAt:now,mealsCompleted:a.mealsToAdult,meal:null,cyclesClaimed:0}));
 garden.render(state,{now,clock:0,propsVisible:true});
 const order=garden.order(),dragon=order.findIndex(o=>o.id==='dragon');assert.ok(dragon>=0);
 const back=order.findIndex(o=>o.id==='pen_6:fence:back'),front=order.findIndex(o=>o.id==='pen_6:fence:front');
 assert.ok(back>=0&&back<dragon,'back rails behind the resident');assert.ok(front>dragon,'front rails in front of the resident');
});

test('water beds draw the actual aquatic crop sprite instead of rectangular stand-ins',async()=>{
 const {canvas}=recordingCanvas(),garden=await createGarden(canvas,{decorAssets:manifest.items});
 const now=1_700_000_000_000,state=E.testProfile(500,now);state.built=[...new Set([...state.built,'pond_1'])];
 garden.render(state,{now,clock:0,propsVisible:true,pond:{lots:[],beds:[[{species:'silverkelp',plantedAt:now-100000,readyAt:now+100000},null,null]]}});
 assert.ok(garden.order().some(o=>o.id==='silverkelp'),'aquatic bed must contain a real crop actor');
});

test('pond creatures defer submerged art and render their real growth stage, never a dry adult sprite',async()=>{
  const {SUBMERGED_CREATURE_FILES,submergedCreatureFrame}=await import('./pond-creature-art.mjs');
  const {canvas,requested,drawCalls}=recordingCanvas(),garden=await createGarden(canvas,{decorAssets:manifest.items});
  const now=1_700_000_000_000,state=E.testProfile(500,now);
  state.built=[...new Set([...state.built,'pond_1','pond_2','pond_3'])];
  const entry={id:'creature-grindylow',type:'creature',species:'grindylow',level:E.CREATURE.grindylow.level,adoptedAt:now,mealsCompleted:0,meal:null,cyclesClaimed:0,preview:false};
  state.creatures=[entry];
  for(const file of SUBMERGED_CREATURE_FILES)assert.ok(!requested.has(runtimeImageUrl(file)),'surface sprites loaded before a pond creature is drawn');
  const options={now,clock:0,propsVisible:true,pond:{beds:[],lots:[]}};
  garden.render(state,options);await new Promise(resolve=>setImmediate(resolve));
  for(const meals of [0,E.CREATURE.grindylow.mealsToAdult]){
    entry.mealsCompleted=meals;drawCalls.length=0;garden.render(state,options);
    const stage=E.growth(entry,now).stage,frame=submergedCreatureFrame('grindylow',stage,0);
    const call=drawCalls.find(c=>c.file===runtimeImageUrl(frame.file));assert.ok(call,'pond did not draw a submerged sprite');
    assert.deepEqual(call.args.slice(0,4),[frame.atlasRect.x,frame.atlasRect.y,frame.width,frame.height]);
  }
});

test('built deep pond, aquatic beds and nook draw their authored snow variants', async () => {
  const winterKit = await import('./garden-winter.mjs');
  const {canvas,drawn}=recordingCanvas(),garden=await createGarden(canvas,{decorAssets:manifest.items});
  const now=1_700_000_000_000,state=E.testProfile(500,now);
  state.built=[...new Set([...state.built,'pond_1','pond_2','pond_3'])];
  const options={now,clock:0,weatherMode:'snow',propsVisible:true,winterKit,pond:{beds:Array.from({length:10},()=>[null,null,null]),lots:[]}};
  garden.render(state,options);
  await new Promise(resolve=>setImmediate(resolve));
  garden.render(state,options);
  for(const id of ['pond-3','pond-bed','pond-nook'])assert.ok(drawn.includes(runtimeImageUrl('environment/winter/'+id+'-snow.png')),id+' still draws summer art');
});

test('land creatures without walk clips keep their ground anchors across animation clocks', async () => {
  const {canvas} = recordingCanvas();
  const garden = await createGarden(canvas, {decorAssets: manifest.items, allowMissingAssets: true});
  const now = 1_700_000_000_000, state = E.testProfile(500, now);
  const species = ['hippogriff', 'thestral', 'unicorn', 'porlock', 'crup'];
  state.built = [...new Set([...state.built, 'edge_1', 'edge_2'])];
  state.creatures = species.map(id => ({id: 'creature-' + id, type: 'creature', species: id,
    level: E.CREATURE[id].level, adoptedAt: now, mealsCompleted: E.CREATURE[id].mealsToAdult,
    meal: null, cyclesClaimed: 0, preview: false}));
  const anchors = clock => {
    garden.render(state, {now, clock, propsVisible: true, eventMode: 'none'});
    return garden.order().filter(o => species.includes(o.id)).sort((a,b) => a.id.localeCompare(b.id));
  };
  const still = anchors(0);
  assert.equal(still.length, species.length);
  for (const clock of [1200, 8000, 31000]) assert.deepEqual(anchors(clock), still);
});

test('25.0 budget: festival art waits until its season or a placed piece draws it', async () => {
  const festival = manifest.items.filter(a => a.collection === 'festival');
  assert.ok(festival.length >= 30, 'the Halloween pack is in the manifest');
  const urlsOf = a => [a.file, ...(a.frames ?? []), a.rightFile, ...(a.rightFrames ?? [])].filter(Boolean).map(runtimeImageUrl);
  const {canvas, requested} = recordingCanvas();
  const garden = await createGarden(canvas, {decorAssets: manifest.items});
  assert.ok(requested.size > 100, 'the rest of the scene still loads before the first frame');
  for (const url of [...FESTIVAL_FILES.map(runtimeImageUrl), ...festival.flatMap(urlsOf)]) assert.ok(!requested.has(url), url + ' loaded out of season');

  const state = E.testProfile(100, 1_700_000_000_000);
  garden.render(state, {now: 1_700_000_000_000, clock: 0, propsVisible: true, eventMode: 'none'});
  assert.ok(!requested.has(runtimeImageUrl('world-v241/hero-halloween.png')), 'no festival, no hero');

  const piece = festival.find(a => a.id === 'hw_violet_mist_pond');
  garden.render(state, {
    now: 1_700_000_000_000, clock: 0, propsVisible: true, eventMode: 'event_halloween',
    decorations: {owned: [piece.id], placements: [piece.id], positions: {[piece.id]: [2.5, 26]}, rotations: {}},
  });
  assert.ok(requested.has(runtimeImageUrl('world-v241/hero-halloween.png')), 'the open festival loads its hero');
  assert.ok(urlsOf(piece).some(url => requested.has(url)), 'a placed festival piece loads after its season');
  assert.ok(!requested.has(runtimeImageUrl('world-v241/hero-yule.png')), 'other festivals stay unloaded');
});

test('25.0 budget: event pieces and Dobby\'s work poses load only when first drawn', async () => {
  const {elfWorkFiles} = await import('./garden-elves.mjs');
  const event = manifest.items.filter(a => a.collection === 'event');
  // S7: the six Noel pieces of bậc Tận Sức ship in the event pack too, so a shop that never placed one never loads them.
  const noel = ['sp_xmas_butterbeer', 'sp_xmas_firebolt', 'sp_xmas_honeydukes', 'sp_xmas_invisibility_cloak', 'sp_xmas_weasley_tree', 'sp_xmas_yule_roses'];
  assert.deepEqual(event.map(a => a.id).sort(), ['ev_champion_tree', 'ev_dark_dobby_red', 'ev_dobby_spring_rider', 'ev_elf_tent', 'ev_kitchen_corner', ...noel]);
  const urlsOf = a => [a.file, ...(a.frames ?? []), a.rightFile, ...(a.rightFrames ?? [])].filter(Boolean).map(runtimeImageUrl);
  const {canvas, requested} = recordingCanvas();
  const garden = await createGarden(canvas, {decorAssets: manifest.items});
  const work = elfWorkFiles().map(runtimeImageUrl);
  assert.deepEqual(work, ['environment/elves/dobby/harvest.png', 'environment/elves/dobby/feed.png'].map(runtimeImageUrl));
  for (const url of [...work, ...event.flatMap(urlsOf)]) assert.ok(!requested.has(url), url + ' loaded before the first frame');
  const state = E.testProfile(100, 1_700_000_000_000);
  const tent = event.find(a => a.id === 'ev_elf_tent');
  garden.render(state, {
    now: 1_700_000_000_000, clock: 0, propsVisible: true, eventMode: 'none',
    decorations: {owned: [tent.id], placements: [tent.id], positions: {[tent.id]: [2.5, 26]}, rotations: {}},
  });
  assert.ok(urlsOf(tent).some(url => requested.has(url)), 'a placed Lều gia tinh loads');
  for (const url of event.filter(a => noel.includes(a.id)).flatMap(urlsOf)) assert.ok(!requested.has(url), url + ' loaded with only the tent placed');
});

test('winter scenery stays deferred until winter or explicit snow is selected', async () => {
  const winterKit = await import('./garden-winter.mjs'), {WINTER_FILES, winterSeason} = winterKit;
  assert.equal(WINTER_FILES.length, 20);
  for (const file of WINTER_FILES) assert.ok(fs.existsSync(new URL('./' + file, import.meta.url)), file + ' exists');
  const winterUrls = WINTER_FILES.map(runtimeImageUrl);
  const {canvas, requested} = recordingCanvas();
  const garden = await createGarden(canvas, {decorAssets: manifest.items});
  for (const url of winterUrls) assert.ok(!requested.has(url), url + ' loaded before the first frame');
  const state = E.testProfile(100, 1_700_000_000_000);
  garden.render(state, {now: 1_700_000_000_000, clock: 0, propsVisible: true, eventMode: 'none', weatherMode: 'snow', winterKit, winter: winterSeason(Date.parse('2026-11-30T12:00:00+07:00'))});
  for (const url of winterUrls) assert.ok(requested.has(url), url + ' must load when snow is selected outside calendar winter');
  garden.render(state, {now: 1_700_000_000_000, clock: 0, propsVisible: true, eventMode: 'none', winterKit, winter: winterSeason(Date.parse('2026-12-01T12:00:00+07:00'))});
  for (const url of winterUrls) assert.ok(requested.has(url), url + ' requested once winter starts');
});

test('25.0 S4 budget: Norbert loads only once he is drawn (S7 hatches him)', async () => {
  const {norbertFiles} = await import('./garden-elves.mjs');
  const urls = norbertFiles().map(runtimeImageUrl);
  assert.equal(urls.length, 6);
  for (const file of norbertFiles()) assert.ok(fs.existsSync(new URL('./' + file, import.meta.url)), file + ' exists');
  const {canvas, requested} = recordingCanvas();
  const garden = await createGarden(canvas, {decorAssets: manifest.items});
  const state = E.testProfile(100, 1_700_000_000_000);
  garden.render(state, {now: 1_700_000_000_000, clock: 0, propsVisible: true, eventMode: 'none'});
  for (const url of urls) assert.ok(!requested.has(url), url + ' loaded without Norbert');
  garden.render(state, {now: 1_700_000_000_000, clock: 0, propsVisible: true, eventMode: 'none', norbert: true});
  assert.ok(requested.has(runtimeImageUrl('environment/elves/norbert/idle.png')), 'a hatched Norbert loads');
});

test('25.0 elf statue glow: loads only at dusk/night for a placed statue; reduced motion holds n0', async () => {
  const winterKit = await import('./garden-winter.mjs'), {STATUE_GLOW_FILES, statueGlow} = winterKit;
  assert.equal(STATUE_GLOW_FILES.length, 12);
  for (const file of STATUE_GLOW_FILES) assert.ok(fs.existsSync(new URL('./' + file, import.meta.url)), file + ' exists');
  const {canvas, requested} = recordingCanvas();
  const garden = await createGarden(canvas, {decorAssets: manifest.items});
  const state = E.testProfile(100, 1_700_000_000_000);
  const id = 'ev_dark_dobby_red', glowUrls = STATUE_GLOW_FILES.map(runtimeImageUrl);
  const decorations = {owned: [id], placements: [id], positions: {[id]: [2.5, 26]}, rotations: {}};
  const base = {now: 1_700_000_000_000, clock: 0, propsVisible: true, eventMode: 'none', winterKit, decorations};
  garden.render(state, {...base, atmosphereMode: 'day'});
  for (const url of glowUrls) assert.ok(!requested.has(url), url + ' loaded by day');
  garden.render(state, {...base, atmosphereMode: 'night'});
  assert.ok(requested.has(runtimeImageUrl(`environment/statue-night/${id}-n0.png`)), 'the placed statue glows at night');
  assert.ok(!requested.has(runtimeImageUrl('environment/statue-night/ev_dobby_spring_rider-n0.png')), 'an unplaced statue stays unloaded');
  const object = {kind: 'store-decor', id, slot: 0, facing: 'right', asset: {pivotX: 64, pivotY: 160}};
  assert.equal(statueGlow(object, 0).file, `environment/statue-night/${id}_right-n0.png`);
  assert.deepEqual(new Set([0, 600, 1200, 1800].map(t => statueGlow(object, t + 1).file.slice(-6))), new Set(['n0.png', 'n1.png', 'n2.png']));
  assert.equal(statueGlow({...object, preview: true}, 0), null);
  assert.equal(statueGlow({...object, id: 'ev_elf_tent'}, 0), null);
});

test('25.0 S6 budget: visiting friends load only while a visit is drawn, never before the first frame', async () => {
  const friendsKit = await import('./garden-friends.mjs'), {FRIEND_FILES, friendVisit} = friendsKit;
  assert.equal(FRIEND_FILES.length, 42); // 7 sheets × 6 poses (Fred and George share one)
  const urls = FRIEND_FILES.map(runtimeImageUrl);
  const {canvas, requested} = recordingCanvas();
  const garden = await createGarden(canvas, {decorAssets: manifest.items});
  for (const url of urls) assert.ok(!requested.has(url), url + ' loaded before the first frame');
  const state = E.testProfile(100, 1_700_000_000_000), night = Date.parse('2026-12-01T22:00:00+07:00'), day = Date.parse('2026-12-01T10:00:00+07:00');
  garden.render(state, {now: night, clock: 0, propsVisible: true, eventMode: 'none', friendsKit});
  for (const url of urls) assert.ok(!requested.has(url), url + ' loaded with nobody visiting');
  garden.render(state, {now: day, clock: 0, propsVisible: true, eventMode: 'none', friendsKit});
  const visitor = friendVisit(day).members[0];
  assert.ok([...requested].some((url) => url.includes(`/friends/${friendsKit.FRIENDS[visitor].art || visitor}/`)), visitor + ' requested once visiting');
  for (const file of FRIEND_FILES) assert.ok(fs.existsSync(new URL('./' + file, import.meta.url)), file + ' exists');
});

test('25.0 S7 budget: the December hearth, vớ and dragon egg load only when the server sends `xmas`', async () => {
  const xmasKit = await import('./garden-xmas.mjs'), urls = xmasKit.XMAS_FILES.map(runtimeImageUrl);
  const {canvas, requested} = recordingCanvas();
  const garden = await createGarden(canvas, {decorAssets: manifest.items});
  for (const url of urls) assert.ok(!requested.has(url), url + ' loaded before the first frame');
  const state = E.testProfile(100, 1_700_000_000_000), now = Date.parse('2026-12-03T10:00:00+07:00');
  garden.render(state, {now, clock: 0, propsVisible: true, eventMode: 'none', xmasKit, xmas: null});
  for (const url of urls) assert.ok(!requested.has(url), url + ' loaded without a December view');
  const socks = [1, 2, 3].map((n) => ({n, opened: n === 1}));
  garden.render(state, {now, clock: 0, propsVisible: true, eventMode: 'none', xmasKit, xmas: {chapter: {socks}, egg: {stage: 1, hatched: false}}});
  for (const name of ['hearth', 'sock', 'sock-open', 'egg-1']) assert.ok([...requested].some((url) => url.includes(`/xmas/${name}.`)), name + ' requested once drawn');
});
