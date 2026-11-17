// Garden expansion phase 3 «Vườn cây lâu năm» (docs/garden-expansion-plan.md §11): the orchard dock and Hagrid's three
// requests text. Everything comes from snapshot.orchard (server garden-orchard-core); this module only shows it and
// sends {action:'orchard', kind: plant|harvest|fell, …}.
import {el, button, num, duration, itemDisplayName, itemArtVisual} from './ui-utils.mjs?v=26.5';
import {pixelIcon, ICONS} from './pixel-icons.mjs?v=26.5';

const EDGE_STEPS = 3;
export const SAPLINGS = Object.freeze({apple: {label: 'Táo', item: 'sapling_apple'}, pear: {label: 'Lê', item: 'sapling_pear'}, plum: {label: 'Mận', item: 'sapling_plum'}});

/** «Việc bác Hagrid nhờ» card line: step N of M and the price (0 Galleons; the crops show as chips). */
export const edgeStepText = (step, total, galleons = 0) => `Việc bác Hagrid nhờ · bước ${step}/${total} · ${num(galleons)} Galleons`;

const ripeAt = (tree, now) => Boolean(tree && (tree.ripe || Number(tree.readyAt) <= now));

/** From the unlock level until the orchard stands: Hagrid's next request and the steps done. */
export const edgeProgress = (edge, level) => (!edge || level < edge.unlockLevel || edge.step >= EDGE_STEPS ? null : {next: `edge_${edge.step + 1}`, text: `${edge.step}/${EDGE_STEPS}`});

/** Six pits: empty, growing (with readyAt) or ripe. */
export const treeTiles = (orchard, now) => (orchard?.trees || []).map((tree, index) => (!tree ? {index, state: 'empty'}
 : {index, state: ripeAt(tree, now) ? 'ripe' : 'growing', kind: tree.kind, readyAt: Number(tree.readyAt)}));

export const ripeCount = (orchard, now) => treeTiles(orchard, now).filter(t => t.state === 'ripe').length;

/** Sapling kinds to pick from with their stock; the selection falls to one in stock. */
export function saplingChoices(orchard, selected) {
 const choices = Object.entries(SAPLINGS).map(([id, s]) => ({id, label: s.label, count: Number(orchard?.saplings?.[id]) || 0}));
 const id = choices.find(c => c.id === selected && c.count)?.id ?? choices.find(c => c.count)?.id ?? selected ?? 'apple';
 return {choices, selected: id};
}

/** Toast after «Hái quả»: «Táo ×4 · Lê ×4». */
export const harvestText = items => Object.entries(items || {}).filter(([, n]) => n > 0).map(([id, n]) => `${itemDisplayName(id, id)} ×${num(n)}`).join(' · ');

/**
 * Header facts for pit `index` (null when out of range): the tree's state and clock, what one harvest gives (server
 * fruitPerTree), how many trees of its kind stand, and the whole orchard's ripe count and next ripe time for «Hái».
 */
export function pitInfo(orchard, index, now) {
 const tiles = treeTiles(orchard, now), tile = tiles[index];
 if (!tile) return null;
 const growing = tiles.filter(t => t.state === 'growing');
 return {...tile, perHarvest: Number(orchard.fruitPerTree) || 0, treeMs: Number(orchard.treeMs) || 0,
  sameKind: tile.kind ? tiles.filter(t => t.kind === tile.kind).length : 0,
  ripeTotal: tiles.filter(t => t.state === 'ripe').length, nextRipeAt: growing.length ? Math.min(...growing.map(t => t.readyAt)) : null};
}

/** Pit to show when nothing valid is picked: the first ripe tree, else the first tree, else pit 0. */
export const defaultPit = tiles => {const ripe = tiles.findIndex(t => t.state === 'ripe'); return ripe >= 0 ? ripe : Math.max(0, tiles.findIndex(t => t.state !== 'empty'));};

/**
 * The «Vườn cây» dock, laid out like the sow dock (#plantDock): portrait · name and facts · Chặt/Mua · one primary button,
 * then one tray with the six pits. An empty pit's caption is the sapling picker. A tree's primary is «Hái» (every ripe tree,
 * one server call) or, until something ripens, the time left on its face; an empty pit's primary plants the chosen
 * sapling there (or opens the store). «Chặt» asks for a second tap on the same button. `render(ctx)` redraws from
 * ctx = {orchard, now, inventory}; `act(command, text)` runs a server command; `onBuy()` opens the sapling store.
 */
export function createOrchardDock({dock, act, onBuy}) {
 let sapling = 'apple', chosen = false, pit = null, confirm = null, last = null, tray = null;
 const art = (key, size, fallback) => itemArtVisual(key, size) || pixelIcon(fallback, size >= 32 ? 2 : 1);
 const stat = (name, value, label) => el('span', {class: 'stat', title: label, 'aria-label': label}, [pixelIcon(name, 1), value]);
 const timer = at => el('span', {'data-until': at, 'data-prefix': '', text: duration(at - last.now)});
 const tool = (name, short, label, fn, extra = '') => {
  const b = button('', fn, {class: 'orchard-tool' + extra, 'aria-label': label, title: label});
  b.append(pixelIcon(name, 2), el('span', {text: short}));
  return b;
 };
 function render(ctx) {
  last = ctx;
  const {orchard, now} = ctx;
  dock.classList.toggle('orchard-sow', Boolean(orchard));
  if (!orchard) {dock.replaceChildren(); tray = null; return;}
  const tiles = treeTiles(orchard, now), pick = saplingChoices(orchard, sapling);
  if (!chosen) sapling = pick.selected; // a kind in stock until the player picks one (an empty pick opens the store)
  if (!tiles[pit]) pit = defaultPit(tiles);
  const info = pitInfo(orchard, pit, now);
  if (info.state === 'empty') confirm = null;
  const name = SAPLINGS[info.kind]?.label ?? info.kind, fruit = n => `${num(n)} ${itemDisplayName(info.kind, name)}`;
  let portrait, title, facts, side, go;
  if (info.state === 'empty') {
   const s = SAPLINGS[sapling], have = pick.choices.find(c => c.id === sapling)?.count || 0;
   portrait = art(s.item, 48, 'seed');
   title = `Cây ${s.label.toLowerCase()} non`;
   // The sapling picker takes the facts line: stock on each chip, the 72 h / ×4 facts sit on every tree's header.
   facts = pick.choices.map(c => {
    const b = button('', () => {sapling = c.id; chosen = true; render(ctx);}, {'aria-pressed': String(c.id === sapling), 'aria-label': `Cây ${c.label.toLowerCase()} non · ${num(c.count)}`, title: `Cây ${c.label.toLowerCase()} non`});
    b.append(art(SAPLINGS[c.id].item, 32, 'seed'), el('span', {class: 'orchard-badge', 'aria-hidden': 'true', text: num(c.count)}));
    return b;
   });
   side = have ? tool('shop', 'Mua', 'Mua cây non', () => onBuy?.()) : null;
   go = have ? {glyph: 'sow', label: 'Trồng', fn: () => act({action: 'orchard', kind: 'plant', spot: info.index, sapling}, `Trồng cây ${s.label.toLowerCase()} · hố ${info.index + 1}.`)}
    : {glyph: 'shop', label: 'Mua', fn: () => onBuy?.()};
  } else {
   const ripe = info.state === 'ripe', stock = Number(ctx.inventory?.[info.kind]) || 0;
   portrait = art(ripe ? info.kind : 'sapling_' + info.kind, 48, 'orchard');
   title = `Cây ${name.toLowerCase()}`;
   facts = [ripe ? stat('check', 'Chín', 'Đã chín') : stat('clock', timer(info.readyAt), 'Chín sau ' + duration(info.readyAt - now)),
    ...(info.perHarvest ? [stat('fruit', '×' + num(info.perHarvest), `Mỗi lần hái ${fruit(info.perHarvest)}`)] : []),
    stat('orchard', num(info.sameKind), `${num(info.sameKind)} cây ${name.toLowerCase()} trong vườn`),
    ...(ctx.inventory ? [stat('chest', num(stock), `Kho: ${fruit(stock)}`)] : [])];
   const felling = confirm === info.index;
   side = tool('close', felling ? 'Chặt?' : 'Chặt', felling ? `Xác nhận chặt cây ${name.toLowerCase()} · hố ${info.index + 1}` : `Chặt cây ${name.toLowerCase()} · hố ${info.index + 1}`,
    felling ? () => {confirm = null; act({action: 'orchard', kind: 'fell', spot: info.index}, `Đã chặt cây ${name.toLowerCase()}.`);} : () => {confirm = info.index; render(ctx);}, felling ? ' is-confirm' : '');
   go = info.ripeTotal ? {glyph: 'harvest', label: `Hái ×${info.ripeTotal}`, fn: () => act({action: 'orchard', kind: 'harvest'}, 'Hái quả.')}
    : {glyph: 'clock', wait: info.nextRipeAt};
  }
  const primary = button('', go.fn || (() => {}), {class: 'primary orchard-go', id: 'orchardHarvest', disabled: !go.fn,
   'aria-label': go.wait ? 'Hái · chín sau ' + duration(go.wait - now) : go.label});
  primary.append(pixelIcon(go.glyph, 1), go.wait ? timer(go.wait) : el('span', {text: go.label}));
  const pits = tiles.map(t => {
   const b = button('', () => {pit = t.index; confirm = null; render(ctx);}, {'aria-pressed': String(t.index === info.index), class: t.state === 'ripe' ? 'is-ripe' : t.state === 'empty' ? 'is-empty' : '',
    'aria-label': t.state === 'empty' ? `Hố ${t.index + 1} · trống` : `Hố ${t.index + 1} · ${SAPLINGS[t.kind]?.label ?? t.kind} · ${t.state === 'ripe' ? 'chín' : 'còn ' + duration(t.readyAt - now)}`});
   if (t.state === 'empty') b.append(pixelIcon('plus', 2));
   else b.append(art(t.state === 'ripe' ? t.kind : 'sapling_' + t.kind, 40, 'orchard'), el('span', {class: 'orchard-badge', 'aria-hidden': 'true', text: t.state === 'ripe' ? 'Chín' : duration(t.readyAt - now)}));
   return b;
  });
  // The game redraws every second: keep the tray where the player scrolled it.
  const scrolled = tray?.scrollLeft || 0;
  tray = el('div', {class: 'item-tray orchard-tray', role: 'group', 'aria-label': 'Hố cây'}, pits);
  dock.replaceChildren(
   el('div', {class: 'dock-portrait', 'aria-hidden': 'true'}, [portrait]),
   el('div', {class: 'seed-caption'}, [el('strong', {text: title}), info.state === 'empty' ? el('div', {class: 'item-tray orchard-pick', role: 'group', 'aria-label': 'Chọn cây non'}, facts) : el('span', {}, facts)]),
   ...(side ? [side] : []),
   primary,
   el('div', {class: 'seed-side'}, [tray]),
  );
  tray.scrollLeft = scrolled;
 }
 return {render, rerender: () => last && render(last), cancelConfirm: () => {confirm = null;}};
}
