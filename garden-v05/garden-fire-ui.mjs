// «Đốt vườn» from the visiting banner (HPH, owner 01/11/2026) and «Chữa cháy» for everyone:
// the sheet sets the fire on the garden being visited (manageHagridGardenSales mode 'fire'), the price
// mirrors the server (garden-fire-handlers: 10 G per hour left, rounded up, 10–500 G).
import {el, button} from './ui-utils.mjs?v=25.1.4';

export const fireOutPrice = (until, now = Date.now()) => Math.min(500, Math.max(1, Math.ceil((until - now) / 3_600_000)) * 10);

const MODES = [['visual', 'Chỉ hình'], ['real', 'Cháy thật']];
const UNITS = [['m', 'Phút', 1], ['h', 'Giờ', 60], ['d', 'Ngày', 1440]];

/** One sheet for the whole game; open({username, burning}) for the garden on screen. */
export function createFireSheet({call, notify, onDone, host = document.body}) {
  const state = {mode: 'visual', amount: 1, unit: 'h', armed: false, busy: false, username: '', burning: false};
  const status = el('p', {class: 'fire-sheet-status', role: 'status', 'aria-live': 'polite'});
  const body = el('div', {class: 'fire-sheet-body'});
  const sheet = el('section', {id: 'fireSheet', class: 'fire-sheet', hidden: true, role: 'dialog', 'aria-label': 'Đốt vườn'}, [body, status]);
  host.append(sheet);
  const chips = (list, current, pick) => el('div', {class: 'fire-sheet-chips', role: 'group'}, list.map(([id, name]) =>
    button(name, () => pick(id), {class: 'fire-chip', 'aria-pressed': String(id === current)})));
  async function send(fire) {
    const minutes = Math.round(state.amount) * UNITS.find(([id]) => id === state.unit)[2];
    if (fire !== 'off' && !(minutes >= 1 && minutes <= 43200)) { status.textContent = '1 phút – 30 ngày.'; return; }
    if (fire === 'real' && !state.armed) { state.armed = true; status.textContent = 'Cháy thật xoá mọi cây đang trồng.'; render(); setTimeout(() => { state.armed = false; render(); }, 5000); return; }
    state.armed = false; state.busy = true; render();
    try {
      const reply = await call({mode: 'fire', username: state.username, fire, ...(fire === 'off' ? {} : {minutes})});
      notify?.(fire === 'off' ? `💧 Đã dập lửa vườn ${reply.fire.toUsername}.` : `🔥 Vườn ${reply.fire.toUsername} chìm trong biển lửa${reply.fire.burned ? ` · ${reply.fire.burned} cây cháy rụi` : ''}.`);
      close(); onDone?.();
    } catch (e) { status.textContent = e.message; } finally { state.busy = false; render(); }
  }
  function render() {
    body.replaceChildren(
      el('strong', {class: 'fire-sheet-title', text: `Đốt vườn ${state.username}`}),
      chips(MODES, state.mode, id => { state.mode = id; render(); }),
      el('div', {class: 'fire-sheet-time'}, [
        el('input', {type: 'number', min: '1', step: '1', inputmode: 'numeric', value: String(state.amount), 'aria-label': 'Thời gian', oninput: e => { state.amount = Number(e.target.value); }}),
        chips(UNITS.map(([id, name]) => [id, name]), state.unit, id => { state.unit = id; render(); }),
      ]),
      el('div', {class: 'fire-sheet-actions'}, [
        button('Huỷ', close),
        state.burning ? button('Dập lửa', () => send('off'), {disabled: state.busy}) : null,
        button(state.busy ? 'Đang đốt…' : state.armed ? 'Chạm lần nữa' : '🔥 Đốt', () => send(state.mode), {class: 'primary acp-fire', disabled: state.busy}),
      ]),
    );
  }
  function close() { sheet.hidden = true; status.textContent = ''; }
  return {
    open({username, burning = false}) { Object.assign(state, {username, burning, armed: false}); status.textContent = ''; render(); sheet.hidden = false; },
    close,
  };
}
