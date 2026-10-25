// Reward feedback that lives above the canvas: "+N" chips fly from the plot or
// creature into the Kho/level buttons, which then bump. Reduced motion keeps
// the same chips but only fades them in place beside the target.
import {el, visualItemIcon} from './ui-utils.mjs?v=24.9.77';

/** Positive inventory changes between two progression snapshots, largest first. */
export function rewardDeltas(before = {}, after = {}) {
  const was = before?.inventory || {}, now = after?.inventory || {};
  return Object.keys(now)
    .map((id) => ({id, amount: (Number(now[id]) || 0) - (Number(was[id]) || 0)}))
    .filter((entry) => entry.amount > 0)
    .sort((a, b) => b.amount - a.amount);
}

export function createJuice({layer, items, reducedMotion}) {
  function centerOf(node) {
    const r = node?.getBoundingClientRect?.();
    return r && r.width ? [r.left + r.width / 2, r.top + r.height / 2] : null;
  }

  function bump(target) {
    if (!target || reducedMotion()) return;
    target.animate?.([{transform: 'scale(1)'}, {transform: 'scale(1.18)'}, {transform: 'scale(1)'}], {duration: 260, easing: 'ease-out'});
  }

  function chip({amount, id = null, label = '', from, target, delay = 0, size = 1}) {
    const to = centerOf(target);
    if (!to || !amount) return;
    const node = el('div', {class: `juice-chip${size > 1 ? ' is-combo' : ''}`, 'aria-hidden': 'true'}, [
      el('b', {text: `+${amount}`}),
      id ? visualItemIcon(items, id, {size: 22}) : el('span', {class: 'juice-chip-label', text: label}),
    ]);
    layer.append(node);
    const still = reducedMotion() || !from;
    const start = still ? [to[0] - 34, to[1] + 30] : from;
    node.style.left = `${start[0]}px`;
    node.style.top = `${start[1]}px`;
    const done = () => node.remove();
    if (still || typeof node.animate !== 'function') {
      // Static feedback: the chip appears next to the target, then fades.
      const anim = node.animate?.([{opacity: 0}, {opacity: 1, offset: 0.15}, {opacity: 1, offset: 0.8}, {opacity: 0}], {duration: 1100, delay});
      if (anim) anim.onfinish = done; else setTimeout(done, 1100 + delay);
      return;
    }
    const dx = to[0] - start[0], dy = to[1] - start[1];
    const anim = node.animate([
      {transform: `translate(-50%,-50%) scale(${0.6 * size})`, opacity: 0},
      {transform: `translate(-50%,calc(-50% - 26px)) scale(${1.1 * size})`, opacity: 1, offset: 0.25},
      {transform: `translate(-50%,calc(-50% - 30px)) scale(${size})`, opacity: 1, offset: 0.45},
      {transform: `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(0.55)`, opacity: 0.9},
    ], {duration: 900, delay, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'backwards'});
    anim.onfinish = () => { done(); bump(target); };
  }

  return {chip};
}
