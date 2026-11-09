import {POND_SCENERY} from './pond-art.mjs?v=25.0.2';
export {POND_SCENERY};
// Garden expansion phase 1 «Hồ nuôi» (docs/garden-expansion-plan.md §2.1, §6): the pond dock, the fishing game and the
// pond art paths. Everything comes from the server's snapshot.pond (HPVNN garden pond core); the server keeps every
// number and rule, this module only shows them and sends {action:'pond', kind, …}.
import {DB} from './balance-data.mjs?v=25.0.2';
import {el, button, num, duration, itemDisplayName, itemArtKey, itemArtVisual, visualItemIcon, icon} from './ui-utils.mjs?v=25.0.2';
import {pixelIcon, ICONS, costChips} from './pixel-icons.mjs?v=25.0.2';
import {flowArtSpec} from './flow-item-ui.mjs?v=25.0.2';

export const POND_LEVEL = 130;
export const POND_TIERS = Object.freeze(DB.expansions.filter(e => e.kind === 'pond'));
export const FRY = Object.freeze({
 carp: {label: 'Cá chép', item: 'fish', store: 'fry_carp'},
 goldfish: {label: 'Cá vàng', item: 'goldfish', store: 'fry_goldfish'},
});
const CROP = Object.fromEntries(DB.crops.map(c => [c.id, c]));

// Scene dimensions and anchors come directly from the authored art pack.
export const POND_FALLBACK = 'environment/layers/pond.png';
export const POND_ART_SHIPPED = Boolean(flowArtSpec('goldfish'));
export const pondScenery = id => (POND_ART_SHIPPED ? POND_SCENERY[id] ?? null : null);

/** Built pond tier (0–3) from the built expansion ids; tours and the scene read it from the save. */
export const pondTier = built => POND_TIERS.filter(e => (built || []).includes(e.id)).length;
export const tierFootprint = tier => POND_TIERS[tier - 1]?.footprint ?? [3, 2];
export const tierLabel = tier => POND_TIERS[tier - 1]?.label ?? 'Ao';
/** Fallback pond.png (3×2 ground) scaled to the tier's ground: the iso width grows with long + short. */
export const tierScale = tier => {const [a, b] = tierFootprint(tier); return (a + b) / 5;};

/** A contract pixel icon (pond, net, rod, algae), else an existing one until the art lands. */
export const px = (name, fallback, scale = 1) => pixelIcon(ICONS[name] ? name : fallback, scale);
/** Item art (pond-art registers goldfish, fry_*), else a pixel icon. */
export function itemIcon(items, id, size = 24, fallback = 'water') {
 return itemArtVisual(itemArtKey(id) || id, size) || pixelIcon(fallback, size >= 32 ? 2 : 1);
}

/** Fry: its own icon (pond-art), else the fish it grows into, else a pixel icon (goldfish: a star, so the two differ). */
export function fryIcon(items, fry, size = 20, {grown = false} = {}) {
 const f = FRY[fry], fallback = fry === 'goldfish' ? 'star' : 'water';
 return (!grown && itemArtVisual(itemArtKey(f.store) || f.store, size)) || itemIcon(items, f.item, size, fallback);
}

const ripeAt = (entry, now) => Boolean(entry && (entry.ripe || Number(entry.readyAt) <= now));

/** The pond's lots: empty, growing (with readyAt) or ripe. */
export function lotTiles(pond, now) {
 return (pond?.lots || []).map((lot, index) => (!lot ? {index, state: 'empty'}
  : {index, state: ripeAt(lot, now) ? 'ripe' : 'growing', fry: lot.fry, readyAt: Number(lot.readyAt)}));
}

/** Beds of three cells: which cells are empty, how many are ripe, the next readyAt. */
export function bedTiles(pond, now) {
 return (pond?.beds || []).map((cells, index) => {
  const view = cells.map(c => (!c ? null : {species: c.species, ripe: ripeAt(c, now), readyAt: Number(c.readyAt)}));
  const growing = view.filter(c => c && !c.ripe);
  return {index, cells: view, empty: view.flatMap((c, i) => (c ? [] : [i])), ripe: view.filter(c => c?.ripe).length,
   readyAt: growing.length ? Math.min(...growing.map(c => c.readyAt)) : null};
 });
}

/** Water crops a bed takes at this level (server bedCrops, CROP level ≤ garden level), with seed counts. */
export function bedCropChoices(pond, level, seeds = {}) {
 return (pond?.bedCrops || []).filter(id => CROP[id] && CROP[id].level <= level).map(id => ({id, label: CROP[id].label, seeds: Number(seeds[id]) || 0}));
}

/** What the head buttons show. */
export function pondActions(pond, now) {
 const lots = lotTiles(pond, now), beds = bedTiles(pond, now);
 return {
  ripeLots: lots.filter(l => l.state === 'ripe').length,
  ripeCells: beds.reduce((n, b) => n + b.ripe, 0),
  murky: Boolean(pond?.murky),
  castOpen: (pond?.tier || 0) >= 1 && !pond?.cast?.today,
 };
}

/** Marker position 0..1 at `t` ms after token.at (server rule: a triangle wave over periodMs). */
export function castPos(token, t) {
 const phase = (((t % token.periodMs) + token.periodMs) % token.periodMs) / token.periodMs;
 return phase < 0.5 ? 2 * phase : 2 - 2 * phase;
}
const within = (pos, [a, b]) => pos >= a && pos <= b;
/** Which band a tap lands in (the server decides; this only lights the bar). */
export const castBand = (token, pos) => (within(pos, token.sweet) ? 'sweet' : within(pos, token.zone) ? 'zone' : 'miss');

export const CAST_RESULT = Object.freeze({goldfish: 'Trúng tâm', fish: 'Trúng', decor: 'Trúng · quà', miss: 'Hụt'});

/** Item rows of a receipt ({fish: 3}) as [id, count, label]. */
export const receiptItems = items => Object.entries(items || {}).filter(([, n]) => n > 0).map(([id, n]) => [id, n, itemDisplayName(id, id)]);

/** Toast after «Kéo lưới» / «Gặt luống»: data only. */
export function pondReceiptText(receipt) {
 const rows = receiptItems(receipt?.items).map(([, n, label]) => `${label} ×${num(n)}`);
 return rows.length ? rows.join(' · ') : '';
}

/**
 * The «Hồ» dock. `render(ctx)` redraws it from ctx = {pond, state, level, now, seeds, galleons, creature, buildChoice};
 * `act(command, text)` runs a server command; `openCast()` opens the fishing game; `care()` opens the grindylow in Nuôi.
 */
export function createPondDock({dock, items, act, openCast, care}) {
 let fry = 'carp', crop = null, section = 'fish';
 const head = (title, meta, actions) => el('div', {class: 'pond-head'}, [
  el('div', {class: 'pond-title'}, [el('strong', {text: title}), el('span', {class: 'pond-meta', text: meta})]),
  el('div', {class: 'pond-actions'}, actions),
 ]);
 const actionButton = (name, fallback, label, fn, {disabled = false, id, cls = ''} = {}) => {
  const b = button('', fn, {class: 'pond-action ' + cls, disabled, ...(id ? {id} : {}), 'aria-label': label, title: label});
  b.append(px(name, fallback, 2), el('span', {text: id === 'pondNet' ? 'Lưới' : id === 'pondCast' ? 'Câu' : id === 'pondClean' ? 'Rêu' : label}));
  if(id==='pondNet'&&/ · (\d+)$/.test(label))b.append(el('b',{class:'action-count',text:label.match(/ · (\d+)$/)[1]}));
  return b;
 };
 const pick = (choices, selected, onPick, label) => el('div', {class: 'pond-pick', role: 'group', 'aria-label': label}, choices.map(c => {
  const b = button('', () => onPick(c.id), {'aria-pressed': String(c.id === selected), 'aria-label': `${c.label} · ${num(c.count)}`, title: c.label});
  b.append(c.icon, el('b', {text: num(c.count)}));
  return b;
 }));

 function digRow(ctx) {
  const {buildChoice: choice, now} = ctx, entry = POND_TIERS[0], job = (ctx.state.construction || []).find(j => j.id === entry.id);
  const status = job ? (Number(job.readyAt) <= now ? 'Xong' : null) : `${entry.hours} giờ`;
  const meta = job && Number(job.readyAt) > now ? el('span', {class: 'pond-meta', 'data-until': job.readyAt, 'data-prefix': 'Còn ', text: 'Còn ' + duration(job.readyAt - now)}) : el('span', {class: 'pond-meta', text: status});
  const go = job ? (Number(job.readyAt) <= now ? () => act({action: 'claimBuildings'}, `${entry.label} đã đào xong.`) : null)
   : choice.canBuild ? () => act({action: 'build', expansionId: entry.id}, `Bắt đầu đào ${entry.label}.`) : null;
  const label = job ? (Number(job.readyAt) <= now ? 'Nhận' : 'Đang đào') : 'Đào ao';
  return [
   el('div', {class: 'pond-head'}, [el('div', {class: 'pond-title'}, [el('strong', {text: entry.label}), meta]),
    el('div', {class: 'pond-actions'}, [actionButton('pond', 'water', label, go || (() => {}), {disabled: !go, id: 'pondDig', cls: 'primary'})])]),
   job ? null : el('div', {class: 'pond-costs dock-costs', role: 'img', 'aria-label': 'Chi phí đào ao'}, costChips(items, choice.costs, choice.galleonNeed, choice.galleonShort)),
  ];
 }

 function lotsRow(ctx) {
  const {pond, now} = ctx, lots = lotTiles(pond, now), counts = pond.fry || {};
  if (!counts[fry] && counts[fry === 'carp' ? 'goldfish' : 'carp']) fry = fry === 'carp' ? 'goldfish' : 'carp';
  const choices = Object.entries(FRY).map(([id, f]) => ({id, label: f.label, count: counts[id] || 0, icon: fryIcon(items, id)}));
  const tiles = lots.map(lot => {
   const kind = lot.fry && FRY[lot.fry];
   const name = kind ? kind.label : 'Ô trống';
   if (lot.state === 'empty') {
    const b = button('', () => act({action: 'pond', kind: 'stock', lot: lot.index, fry}, `Thả ${FRY[fry].label} giống · ô ${lot.index + 1}.`),
     {class: 'pond-lot is-empty', disabled: !counts[fry], 'aria-label': `Ô ${lot.index + 1} · thả ${FRY[fry].label}`});
    b.append(fryIcon(items, fry,32), el('small', {text: '+'}));
    return b;
   }
   const ripe = lot.state === 'ripe';
   const b = button('', ripe ? () => act({action: 'pond', kind: 'net'}, 'Kéo lưới.') : () => {},
    {class: 'pond-lot' + (ripe ? ' is-ripe' : ''), disabled: !ripe, 'aria-label': `Ô ${lot.index + 1} · ${name} · ${ripe ? 'chín' : 'còn ' + duration(lot.readyAt - now)}`});
   b.append(fryIcon(items, lot.fry in FRY ? lot.fry : 'carp', 32, {grown: true}),
    ripe ? el('small', {class:'slot-ready',text: '✓','aria-hidden':'true'}) : el('small', {'data-until': lot.readyAt, 'data-prefix': '', text: duration(lot.readyAt - now)}));
   return b;
  });
  return [
   lots.some(l=>l.state==='empty')?el('div', {class: 'pond-row-head'}, [pick(choices, fry, id => {fry = id; render(ctx);}, 'Chọn cá giống')]):null,
   el('div', {class: 'pond-tiles', role: 'group', 'aria-label': 'Ô ao'}, tiles),
  ];
 }

 function bedsRow(ctx) {
  const {pond, now, level, seeds} = ctx, beds = bedTiles(pond, now), choices = bedCropChoices(pond, level, seeds);
  if (!beds.length) return [];
  if (!choices.some(c => c.id === crop)) crop = (choices.find(c => c.seeds > 0) || choices[0])?.id ?? null;
  const pickChoices = choices.map(c => ({id: c.id, label: c.label, count: c.seeds, icon: visualItemIcon(items, c.id, {size: 20, kind: 'harvest'})}));
  const have = choices.find(c => c.id === crop)?.seeds || 0;
  const tiles = beds.map(bed => {
   const plant = crop && bed.empty.length && have > 0, harvest = bed.ripe > 0;
   const cells = bed.cells.map(c => el('span', {class: 'pond-cell' + (c?.ripe ? ' is-ripe' : c ? ' is-growing' : '')},
    c ? [visualItemIcon(items, c.species, {size: 18, kind: 'harvest'})] : []));
   const fn = harvest ? () => act({action: 'pond', kind: 'harvest'}, 'Gặt luống.')
    : plant ? () => act({action: 'pond', kind: 'plant', bed: bed.index, cells: bed.empty.slice(0, have), species: crop}, `Gieo ${CROP[crop].label} · luống ${bed.index + 1}.`) : () => {};
   const state = harvest ? 'Gặt' : bed.empty.length ? 'Gieo' : bed.readyAt ? null : '';
   const b = button('', fn, {class: 'pond-bed' + (harvest ? ' is-ripe' : ''), disabled: !harvest && !plant,
    'aria-label': `Luống ${bed.index + 1} · ${harvest ? `chín ${bed.ripe}` : bed.empty.length ? `trống ${bed.empty.length}` : 'đang lớn'}`});
   b.append(el('span', {class: 'pond-cells'}, cells),
    state === null ? el('small', {'data-until': bed.readyAt, 'data-prefix': '', text: duration(bed.readyAt - now)}) : el('small', {text: state}));
   return b;
  });
  return [
   el('div', {class: 'pond-row-head'}, [el('span', {class: 'pond-label', text: `Luống · ${beds.length}`}),
    pickChoices.length ? pick(pickChoices, crop, id => {crop = id; render(ctx);}, 'Chọn cây nước') : el('span', {class: 'pond-meta', text: 'Cấp ' + Math.min(...(pond.bedCrops || []).map(id => CROP[id]?.level || 0))})]),
   el('div', {class: 'pond-tiles', role: 'group', 'aria-label': 'Luống ven hồ'}, tiles),
  ];
 }

 function creatureRow(ctx) {
  const list = ctx.creatures || (ctx.creature ? [ctx.creature] : []);
  if (!list.length || !ctx.pond.creatureSpots) return [];
  return list.map(c => {
   const art = items?.has?.(c.species) ? icon(items, c.species, 3, 44) : px('pond', 'water', 2);
   const b = button('', () => care(c.species), {class: 'pond-care', 'aria-label': `Chăm ${c.label}`, title:`Chăm ${c.label}`, disabled: c.locked});
   b.append(px('feed','feed',2));
   return el('div', {class: 'pond-creature'}, [el('span', {class: 'pond-creature-art', 'aria-hidden': 'true'}, [art]),
    el('div', {class: 'pond-title'}, [el('strong', {text: c.label}), el('span', {class: 'pond-meta', ...(c.readyAt ? {'data-until': c.readyAt, 'data-prefix': c.badge + ' · '} : {}), text: c.badge})]),
    el('span', {class: 'pond-food', title: itemDisplayName(c.feed)}, [itemIcon(items, c.feed, 20, 'feed'), el('b', {text: num(c.have)})]), b]);
  });
 }

 let last = null;
 function render(ctx) {
  last = ctx;
  const {pond, now} = ctx;
  if (!pond) {dock.replaceChildren(); return;}
  if (!pond.tier) {dock.replaceChildren(...digRow(ctx).filter(Boolean)); return;}
  const a = pondActions(pond, now), lots = pond.lots?.length || 0;
  const castLabel = a.castOpen ? 'Câu cá' : 'Mai câu tiếp';
  dock.replaceChildren(
   head(tierLabel(pond.tier), '', [
    actionButton('net', 'harvest', a.ripeLots ? `Kéo lưới · ${a.ripeLots}` : 'Kéo lưới', () => act({action: 'pond', kind: 'net'}, 'Kéo lưới.'), {disabled: !a.ripeLots, id: 'pondNet', cls: 'primary'}),
    ...(a.murky ? [actionButton('algae', 'tired', 'Vớt rêu', () => act({action: 'pond', kind: 'clean'}, 'Đã vớt rêu.'), {id: 'pondClean'})] : []),
    actionButton('rod', 'quill', castLabel, () => openCast(), {disabled: !a.castOpen, id: 'pondCast'}),
   ]),
   el('div',{class:'pond-tabs',role:'group','aria-label':'Chọn nhóm hồ'},[
    ['fish','fish','water','Cá',lots],['beds','seed','seed','Luống',pond.beds?.length||0],['creatures','feed','feed','Thú',(ctx.creatures||(ctx.creature?[ctx.creature]:[])).length],
   ].map(([id,glyph,fallback,label,count])=>{const b=button('',()=>{section=id;render(ctx);},{'aria-pressed':String(section===id),'aria-label':`${label} · ${count}`,title:label});b.append(px(glyph,fallback,1),el('span',{text:label}),el('b',{text:String(count)}));return b;})),
   el('div',{class:'pond-pane',hidden:section!=='fish','data-pane':'fish'},lotsRow(ctx)),
   el('div',{class:'pond-pane',hidden:section!=='beds','data-pane':'beds'},bedsRow(ctx)),
   el('div',{class:'pond-pane pond-pets',hidden:section!=='creatures','data-pane':'creatures'},creatureRow(ctx)),
  );
  dock.classList.toggle('is-murky', a.murky);
 }
 return {render, rerender: () => last && render(last)};
}

/**
 * «Câu cá»: a bobber over the pond and a bar with the zone and sweet bands; one tap. `start()` resolves the token
 * (castStart, or the running one); `cast(tapMs)` resolves receipt.pond. `serverNow()` is the server clock.
 */
export function createCastGame({host, items, start, cast, serverNow}) {
 const title = el('h2', {id: 'pondCastTitle', text: 'Câu cá'});
 const close = button('', () => dialog.close(), {class: 'gp-close', 'aria-label': 'Đóng'});
 close.append(pixelIcon('close', 2));
 const marker = el('span', {class: 'cast-marker'});
 const zone = el('span', {class: 'cast-zone'}), sweet = el('span', {class: 'cast-sweet'});
 const bar = el('div', {class: 'cast-bar', role: 'img', 'aria-label': 'Nhịp câu'}, [zone, sweet, marker]);
 const bobber = el('span', {class: 'cast-bobber', 'aria-hidden': 'true'});
 const art = pondScenery('pond-1') || {file: POND_FALLBACK, width: 160, height: 100};
 const stage = el('div', {class: 'cast-stage'}, [el('img', {src: art.file, alt: '', width: art.width, height: art.height}), bobber]);
 const result = el('div', {class: 'cast-result', role: 'status'});
 const tap = button('Giật cần', undefined, {class: 'primary cast-tap', id: 'castTap'}); // one handler (onclick), swapped to «Đóng» after the cast
 const dialog = el('dialog', {id: 'pondCastGame', class: 'owl-letter pond-cast', 'aria-labelledby': 'pondCastTitle'},
  [el('div', {class: 'popover-heading'}, [title, close]), stage, bar, result, tap]);
 host.append(dialog);
 dialog.addEventListener('click', e => {if (e.target === dialog) dialog.close();});
 dialog.addEventListener('close', () => {cancelAnimationFrame(frame); token = null;});
 let token = null, frame = 0, done = false;
 const pct = v => `${(v * 100).toFixed(2)}%`;
 function loop() {
  if (!token || done) return;
  const pos = castPos(token, serverNow() - token.at);
  marker.style.left = pct(pos);
  bar.dataset.band = castBand(token, pos);
  frame = requestAnimationFrame(loop);
 }
 async function open() {
  done = false; result.replaceChildren(); tap.textContent = 'Giật cần'; tap.disabled = true; bar.dataset.band = '';
  if (!dialog.open) dialog.showModal();
  token = await start();
  if (!token || !dialog.open) {token = null; dialog.close(); return;} // closed while the token was on its way
  zone.style.left = pct(token.zone[0]); zone.style.width = pct(token.zone[1] - token.zone[0]);
  sweet.style.left = pct(token.sweet[0]); sweet.style.width = pct(token.sweet[1] - token.sweet[0]);
  tap.disabled = false; tap.onclick = strike;
  loop();
 }
 async function strike() {
  if (!token || done) return;
  done = true; tap.disabled = true; cancelAnimationFrame(frame);
  const tapMs = Math.max(0, Math.round(serverNow() - token.at));
  const r = await cast(tapMs);
  if (!r) {done = false; tap.disabled = false; loop(); return;}
  if (Number.isFinite(r.pos)) marker.style.left = pct(r.pos);
  bar.dataset.band = r.result === 'goldfish' ? 'sweet' : r.result === 'miss' ? 'miss' : 'zone';
  result.replaceChildren(el('small', {class: 'pond-label', text: CAST_RESULT[r.result] || ''}),
   ...receiptItems(r.items).map(([id, n, label]) => el('span', {class: 'reward-chip', title: label}, [itemIcon(items, id, 20, 'water'), el('b', {text: '+' + num(n)})])));
  tap.textContent = 'Đóng'; tap.disabled = false; tap.onclick = () => dialog.close();
 }
 return {open, dialog};
}
