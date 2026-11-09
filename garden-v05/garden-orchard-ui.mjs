// Garden expansion phase 3 «Vườn cây lâu năm» (docs/garden-expansion-plan.md §11): the orchard dock and Hagrid's three
// requests text. Everything comes from snapshot.orchard (server garden-orchard-core); this module only shows it and
// sends {action:'orchard', kind: plant|harvest|fell, …}.
import {el, button, num, duration, itemDisplayName, itemArtVisual} from './ui-utils.mjs?v=25.1.0';
import {pixelIcon, ICONS} from './pixel-icons.mjs?v=25.1.0';

export const SAPLINGS = Object.freeze({apple: {label: 'Táo', item: 'sapling_apple'}, pear: {label: 'Lê', item: 'sapling_pear'}, plum: {label: 'Mận', item: 'sapling_plum'}});

/** «Việc bác Hagrid nhờ» card line: step N of M and the price (0 Galleons; the crops show as chips). */
export const edgeStepText = (step, total, galleons = 0) => `Việc bác Hagrid nhờ · bước ${step}/${total} · ${num(galleons)} Galleons`;

const ripeAt = (tree, now) => Boolean(tree && (tree.ripe || Number(tree.readyAt) <= now));

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
 * The «Vườn cây» dock. `render(ctx)` redraws from ctx = {orchard, now}; `act(command, text)` runs a server command.
 * «Chặt» asks for a second tap inside the dock (no browser dialog).
 */
export function createOrchardDock({dock, act}) {
 let sapling = 'apple', confirm = null, last = null;
 const glyph = (name, fallback) => pixelIcon(ICONS[name] ? name : fallback, 1);
 function render(ctx) {
  last = ctx;
  const {orchard, now} = ctx;
  if (!orchard) {dock.replaceChildren(); return;}
  const tiles = treeTiles(orchard, now), ripe = tiles.filter(t => t.state === 'ripe').length, pick = saplingChoices(orchard, sapling);
  sapling = pick.selected;
  if (confirm !== null && tiles[confirm]?.state === 'empty') confirm = null;
  const have = pick.choices.find(c => c.id === sapling)?.count || 0;
  const harvest = button('', () => act({action: 'orchard', kind: 'harvest'}, 'Hái quả.'), {class: 'pond-action primary', id: 'orchardHarvest', disabled: !ripe, 'aria-label': 'Hái quả',title:'Hái tất cả quả chín'});
  harvest.append(glyph('harvest', 'seed'), el('span', {text: 'Hái'}),el('b',{class:'action-count',text:String(ripe)}));
  const picker = el('div', {class: 'pond-pick', role: 'group', 'aria-label': 'Chọn cây non'}, pick.choices.map(c => {
   const b = button('', () => {sapling = c.id; confirm = null; render(ctx);}, {'aria-pressed': String(c.id === sapling), 'aria-label': `${c.label} · ${num(c.count)}`, title: c.label});
   b.append(itemArtVisual('sapling_'+c.id,28),el('b', {text: num(c.count)}));
   return b;
  }));
  const cells = tiles.map(t => {
   if (t.state === 'empty') {
    const b = button('', () => act({action: 'orchard', kind: 'plant', spot: t.index, sapling}, `Trồng cây ${SAPLINGS[sapling].label.toLowerCase()} · hố ${t.index + 1}.`),
     {class: 'pond-lot is-empty', disabled: !have, 'aria-label': `Hố ${t.index + 1} · trồng ${SAPLINGS[sapling].label}`});
    b.append(glyph('seed', 'seed'), el('small', {text: '+'}));
    return b;
   }
   if (confirm === t.index) {
    const b = button('', () => {confirm = null; act({action: 'orchard', kind: 'fell', spot: t.index}, `Đã chặt cây ${SAPLINGS[t.kind]?.label.toLowerCase() ?? ''}.`);},
     {class: 'pond-lot is-confirm', 'aria-label': `Hố ${t.index + 1} · xác nhận chặt`});
    b.append(glyph('close', 'seed'), el('small', {text: 'Chặt?'}));
    return b;
   }
   const b = button('', () => {confirm = t.index; render(ctx);},
    {class: 'pond-lot' + (t.state === 'ripe' ? ' is-ripe' : ''), 'aria-label': `Hố ${t.index + 1} · ${SAPLINGS[t.kind]?.label ?? t.kind} · ${t.state === 'ripe' ? 'chín' : 'còn ' + duration(t.readyAt - now)} · chạm để chặt`});
   b.append(itemArtVisual(t.state==='ripe'?t.kind:'sapling_'+t.kind,36),el('span', {text: SAPLINGS[t.kind]?.label ?? t.kind}),
    t.state === 'ripe' ? el('small', {class:'slot-ready',text: '✓','aria-hidden':'true'}) : el('small', {'data-until': t.readyAt, 'data-prefix': '', text: duration(t.readyAt - now)}));
   return b;
  });
  dock.replaceChildren(...[
   el('div', {class: 'pond-head'}, [el('div', {class: 'pond-title'}, [el('strong', {text: 'Vườn cây'}), el('span', {class: 'pond-meta', text: `${tiles.filter(t => t.state !== 'empty').length}/${tiles.length}`})]),
    el('div', {class: 'pond-actions'}, [confirm!==null?button('Hủy',()=>{confirm=null;render(ctx);},{class:'pond-action','aria-label':'Hủy chặt cây'}):null,harvest])]),
   tiles.some(t=>t.state==='empty')?el('div', {class: 'pond-row-head'}, [picker]):null,
   el('div', {class: 'pond-tiles', role: 'group', 'aria-label': 'Hố cây'}, cells),
  ].filter(Boolean));
 }
 return {render, rerender: () => last && render(last), cancelConfirm: () => {confirm = null;}};
}
