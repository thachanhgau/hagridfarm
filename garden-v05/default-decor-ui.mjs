import {el} from './ui-utils.mjs?v=24.9.85';
import {iconButton} from './pixel-icons.mjs?v=24.9.85';
import {isDefaultDecorHidden} from './default-decor.mjs?v=24.9.85';
import {runtimeImageUrl} from './runtime-image-url.mjs?v=24.9.85';

export function defaultDecorToggle(ctx, id, label, refresh) {
  const hidden = isDefaultDecorHidden(ctx.getDecorations?.(), id);
  const control = iconButton('scenery', (hidden ? 'Đặt lại ' : 'Cất ') + label, async () => {
    control.disabled = true;
    try { await ctx.setDefaultDecorVisibility(id, hidden); }
    catch (error) { ctx.notify?.(error.message || 'Chưa thể đổi trang trí.'); }
    finally {
      refresh();
      document.querySelector(`[data-default-decor-toggle="${id}"]`)?.focus({preventScroll: true});
    }
  }, {text: hidden ? 'Đặt lại' : 'Cất', 'aria-pressed': String(!hidden), 'data-default-decor-toggle': id, disabled: !ctx.getSession?.().connected});
  return control;
}

export function renderGardenDefaults(ctx, {s, wallet, tile, priceRow, canPay, run, refresh, turnText}) {
  const root = el('section', {class: 'garden-default-decor'});
  root.append(el('h3', {class: 'gp-section-title', text: 'Trang trí của vườn'}), el('p', {class: 'meta', text: 'Cất để lấy chỗ đặt món đã mua. Đồ vẫn thuộc về bạn và có thể đặt lại.'}));
  const grid = el('div', {class: 'cards gp-tiles'});
  const pond = el('article', {class: 'gp-tile'}, [
    el('div', {class: 'gp-tile-art'}, [el('img', {src: runtimeImageUrl('environment/layers/pond.png'), alt: '', width: 88, height: 56})]),
    el('strong', {class: 'gp-tile-name', text: 'Ao trang trí'}),
    el('div', {class: 'gp-tile-actions'}, [defaultDecorToggle(ctx, 'scene:pond', 'ao trang trí', refresh)]),
  ]);
  grid.append(pond);
  const earnedRot = ctx.getEarnedDecorRotations?.() ?? s.decorationRotations ?? {};
  for (const d of ctx.E.DB.decorations.filter(d => d.level <= s.level)) {
    const owned = s.decorations.includes(d.id), hidden = isDefaultDecorHidden(ctx.getDecorations?.(), d.id);
    const facing = earnedRot[d.id] === 'right' ? 'right' : 'default';
    const card = tile(d.label, d.id, {kind: 'decoration', facing, badge: hidden ? 'Đang cất' : '2 góc'});
    if (!owned && !d.free) card.append(priceRow(s, d, wallet));
    const row = el('div', {class: 'gp-tile-actions'});
    if (owned) {
      row.append(defaultDecorToggle(ctx, d.id, d.label, refresh));
      if (!hidden && ctx.rotateEarnedDecoration) row.append(iconButton('arrow', `Xoay ${d.label} · ${turnText(facing)}`, () => {ctx.rotateEarnedDecoration(d.id); refresh();}, {'data-rotate-earned-decor': d.id, class: facing === 'right' ? 'is-flipped' : ''}));
    } else row.append(iconButton('plus', 'Nhận ' + d.label, () => run(x => ctx.E.buyDecoration(x, d.level), 'Đã thêm ' + d.label + ' vào vườn.', {action: 'buyDecoration', level: d.level}), {text: 'Nhận', class: 'primary', disabled: s.level < d.level || !canPay(s, d, wallet)}));
    card.append(row);
    grid.append(card);
  }
  root.append(grid);
  return root;
}
