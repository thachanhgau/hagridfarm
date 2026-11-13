import {POND_SCENERY} from './pond-art.mjs?v=25.1.7';
export {POND_SCENERY};
// Garden expansion phase 1 «Hồ nuôi» (docs/garden-expansion-plan.md §2.1, §6): the pond dock, the fishing game and the
// pond art paths. Everything comes from the server's snapshot.pond (HPVNN garden pond core); the server keeps every
// number and rule, this module only shows them and sends {action:'pond', kind, …}.
import {DB} from './balance-data.mjs?v=25.1.7';
import {el, button, num, duration, itemDisplayName, itemArtKey, itemArtVisual, visualItemIcon, icon} from './ui-utils.mjs?v=25.1.7';
import {pixelIcon, ICONS, costChips} from './pixel-icons.mjs?v=25.1.7';
import {flowArtSpec} from './flow-item-ui.mjs?v=25.1.7';

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
 * The «Hồ» dock, laid out like the sow dock (#plantDock): portrait · name and counts · Câu/Rêu · one primary button,
 * then one tray with every choice (fry, water crops, pond creatures). The primary button works the whole pond: «Kéo
 * lưới»/«Gặt» take every ripe one (one server call), «Thả»/«Gieo» fill every empty lot or cell the stock covers (one call a
 * lot or bed). `render(ctx)` redraws it from ctx = {pond, state, level, now, seeds, creatures, buildChoice};
 * `act(command, text)` runs a server command (may return a promise); `openCast()` opens the fishing game; `care()` opens a
 * pond creature in Nuôi; `show(section)` picks fish, beds or creatures.
 */
export function createPondDock({dock, items, act, openCast, care}) {
 let section = 'fish', fry = 'carp', crop = null, pet = null, working = false;
 const actionButton = (name, fallback, label, short, fn, {disabled = false, id} = {}) => {
  const b = button('', fn, {class: 'pond-tool', disabled, id, 'aria-label': label, title: label});
  b.append(px(name, fallback, 2), el('span', {text: short}));
  return b;
 };
 // Runs commands one after another; only the last toast stays.
 const runAll = async (commands, text) => {
  if (working) return;
  working = true;
  try {for (const [i, c] of commands.entries()) await act(c, i === commands.length - 1 ? text : '');}
  finally {working = false;}
 };

 function digRow(ctx) {
  const {buildChoice: choice, now} = ctx, entry = POND_TIERS[0], job = (ctx.state.construction || []).find(j => j.id === entry.id);
  const status = job ? (Number(job.readyAt) <= now ? 'Xong' : null) : `${entry.hours} giờ`;
  const meta = job && Number(job.readyAt) > now ? el('span', {class: 'pond-meta', 'data-until': job.readyAt, 'data-prefix': 'Còn ', text: 'Còn ' + duration(job.readyAt - now)}) : el('span', {class: 'pond-meta', text: status});
  const go = job ? (Number(job.readyAt) <= now ? () => act({action: 'claimBuildings'}, `${entry.label} đã đào xong.`) : null)
   : choice.canBuild ? () => act({action: 'build', expansionId: entry.id}, `Bắt đầu đào ${entry.label}.`) : null;
  const label = job ? (Number(job.readyAt) <= now ? 'Nhận' : 'Đang đào') : 'Đào ao';
  const dig = button('', go || (() => {}), {class: 'pond-action primary', disabled: !go, id: 'pondDig', 'aria-label': label, title: label});
  dig.append(px('pond', 'water', 2), el('span', {text: label}));
  return [
   el('div', {class: 'pond-head'}, [el('div', {class: 'pond-title'}, [el('strong', {text: entry.label}), meta]), el('div', {class: 'pond-actions'}, [dig])]),
   job ? null : el('div', {class: 'pond-costs dock-costs', role: 'img', 'aria-label': 'Chi phí đào ao'}, costChips(items, choice.costs, choice.galleonNeed, choice.galleonShort)),
  ];
 }

 /** Tray chips: every fry, water crop and pond creature, with the stock count. */
 function choices(ctx) {
  const {pond} = ctx, counts = pond.fry || {}, list = [];
  for (const [id, f] of Object.entries(FRY)) list.push({section: 'fish', id, label: f.label + ' giống', count: counts[id] || 0, art: size => fryIcon(items, id, size)});
  if (pond.beds?.length) for (const c of bedCropChoices(pond, ctx.level, ctx.seeds)) list.push({section: 'beds', id: c.id, label: c.label, count: c.seeds, art: size => visualItemIcon(items, c.id, {size, kind: 'harvest'})});
  if (pond.creatureSpots) for (const c of ctx.creatures || (ctx.creature ? [ctx.creature] : [])) list.push({section: 'creatures', id: c.species, label: c.label, count: c.have, creature: c,
   art: size => (items?.has?.(c.species) ? icon(items, c.species, 3, size) : px('pond', 'water', 2))});
  return list;
 }

 /** Name line, counts line and the primary command for the chosen chip. */
 function plan(ctx, pick) {
  const {pond, now} = ctx, timer = at => el('span', {'data-until': at, 'data-prefix': '', text: duration(at - now)});
  if (pick.section === 'fish') {
   const lots = lotTiles(pond, now), empty = lots.filter(l => l.state === 'empty'), ripe = lots.filter(l => l.state === 'ripe').length;
   const growing = lots.filter(l => l.state === 'growing'), n = Math.min(empty.length, pick.count);
   const meta = `Ô ${lots.length - empty.length}/${lots.length}` + (ripe ? ` · chín ${ripe}` : '');
   if (ripe) return {meta, label: `Lưới ×${ripe}`, glyph: ['net', 'harvest'], go: () => act({action: 'pond', kind: 'net'}, 'Kéo lưới.')};
   if (n) return {meta, label: `Thả ×${n}`, glyph: ['pond', 'water'], go: () => runAll(empty.slice(0, n).map(l => ({action: 'pond', kind: 'stock', lot: l.index, fry: pick.id})), `Thả ${n} ${FRY[pick.id].label} giống.`)};
   if (empty.length) return {meta, label: 'Hết giống'};
   return {meta, wait: Math.min(...growing.map(l => l.readyAt)), timer};
  }
  if (pick.section === 'beds') {
   const beds = bedTiles(pond, now), ripe = beds.reduce((s, b) => s + b.ripe, 0), emptyCells = beds.reduce((s, b) => s + b.empty.length, 0);
   const cells = beds.length * 3, meta = `Luống ${beds.length} · ô ${cells - emptyCells}/${cells}` + (ripe ? ` · chín ${ripe}` : '');
   if (ripe) return {meta, label: `Gặt ×${ripe}`, glyph: ['harvest', 'harvest'], go: () => act({action: 'pond', kind: 'harvest'}, 'Gặt luống.')};
   let left = pick.count;
   const commands = [];
   for (const b of beds) {
    if (!left || !b.empty.length) continue;
    const take = b.empty.slice(0, left);
    left -= take.length;
    commands.push({action: 'pond', kind: 'plant', bed: b.index, cells: take, species: pick.id});
   }
   const n = pick.count - left;
   if (n) return {meta, label: `Gieo ×${n}`, glyph: ['sow', 'seed'], go: () => runAll(commands, `Gieo ${n} ${CROP[pick.id].label}.`)};
   if (emptyCells) return {meta, label: 'Hết hạt'};
   const growing = beds.filter(b => b.readyAt);
   return growing.length ? {meta, wait: Math.min(...growing.map(b => b.readyAt)), timer} : {meta, label: 'Đầy'};
  }
  const c = pick.creature;
  return {meta: c.readyAt ? null : c.badge, metaNode: c.readyAt ? el('span', {'data-until': c.readyAt, 'data-prefix': c.badge + ' · ', text: c.badge}) : null,
   label: 'Chăm', glyph: ['feed', 'feed'], go: c.locked ? null : () => care(c.species)};
 }

 let last = null;
 function render(ctx) {
  last = ctx;
  const {pond, now} = ctx;
  dock.classList.toggle('pond-sow', Boolean(pond?.tier));
  if (!pond) {dock.replaceChildren(); return;}
  if (!pond.tier) {dock.replaceChildren(...digRow(ctx).filter(Boolean)); return;}
  const list = choices(ctx), chosen = {fish: fry, beds: crop, creatures: pet}, choose = c => {({fish: () => (fry = c.id), beds: () => (crop = c.id), creatures: () => (pet = c.id)})[c.section]();};
  if (!list.some(c => c.section === section)) section = 'fish';
  const mine = list.filter(c => c.section === section);
  let pick = mine.find(c => c.id === chosen[section]) || mine.find(c => c.count > 0) || mine[0];
  choose(pick);
  const p = plan(ctx, pick), a = pondActions(pond, now);
  const go = button('', p.go || (() => {}), {class: 'primary pond-go', id: 'pondGo', disabled: !p.go});
  if (p.glyph) go.append(px(p.glyph[0], p.glyph[1], 1));
  go.append(p.wait ? p.timer(p.wait) : el('span', {text: p.label}));
  const tray = el('div', {class: 'item-tray pond-tray', role: 'group', 'aria-label': 'Chọn cá giống, cây nước hoặc sinh vật · cuộn ngang'}, list.map(c => {
   const b = button('', () => {section = c.section; choose(c); render(ctx);},
    {'data-section': c.section, 'aria-pressed': String(c === pick), 'aria-label': `${c.label} · ${num(c.count)}`, title: c.label});
   b.append(c.art(40), el('b', {class: 'pond-count', text: num(c.count)}));
   return b;
  }));
  dock.replaceChildren(
   el('div', {class: 'dock-portrait', 'aria-hidden': 'true'}, [pick.art(48)]),
   el('div', {class: 'seed-caption'}, [el('strong', {text: pick.label}), p.metaNode || el('span', {text: p.meta})]),
   el('div', {class: 'pond-tools'}, [
    ...(a.murky ? [actionButton('algae', 'tired', 'Vớt rêu', 'Rêu', () => act({action: 'pond', kind: 'clean'}, 'Đã vớt rêu.'), {id: 'pondClean'})] : []),
    actionButton('rod', 'quill', a.castOpen ? 'Câu cá' : 'Mai câu tiếp', 'Câu', () => openCast(), {disabled: !a.castOpen, id: 'pondCast'}),
   ]),
   go,
   el('div', {class: 'seed-side'}, [tray]),
  );
  dock.classList.toggle('is-murky', a.murky);
 }
 return {render, rerender: () => last && render(last), show: id => {section = id; if (last) render(last);}};
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
