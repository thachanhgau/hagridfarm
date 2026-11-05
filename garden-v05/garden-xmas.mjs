// «Gia tinh đón đông» (25.0 S7 part 1; server HPVNN functions/games/garden-xmas-core.js, fence #36). In December an
// outdoor hearth stands behind Thửa 3 with ten vớ on its mantel (chapter 1, 01–10/12: one opens a day, each asks the gia
// tinh a small crop delivery, the tenth gives the Lều gia tinh) and, after bác Hagrid's three letters, the dragon egg in
// its fire: one stoke a VN day, 21 hatch Norbert (S4 companion). The server keeps every count and cap; this module only
// draws `snapshot.xmas` and sends action `xmas`. mobile-game imports it once the server sends `xmas` (never outside
// December), and its frames load the first time they are drawn (festival-lazy-art.test.mjs).
import {el,num} from './ui-utils.mjs?v=24.9.96';
import {iconButton} from './pixel-icons.mjs?v=24.9.96';
import {showHagridLetter} from './hagrid-letter-ui.mjs?v=24.9.96';

const file = (name) => `environment/xmas/${name}.png`;
export const XMAS_FILES = ['hearth', 'sock', 'sock-open', 'egg-0', 'egg-1', 'egg-2', 'egg-3'].map(file);
export const HEARTH_SPOT = [16, 1.3]; // behind the gap between Thửa 3 and 4: the tall sprite hides no plot (garden-xmas.test.mjs)
export const HEARTH = {width: 112, height: 120, pivotX: 56, pivotY: 116, bounds: {x: 8, y: 4, w: 96, h: 114}};
// Where vớ and egg sit on hearth.png (Codex report docs/codex-briefs/xmas-hearth-s7-report.md).
export const MANTEL = {x0: 18, x1: 86, y: 58}, FIREBOX = [56, 104]; // Codex report: mantel face (12,48,92,60), egg pivot (56,104)
const SOCK = {width: 14, height: 20, pivotX: 7, pivotY: 1}, EGG = {width: 22, height: 26, pivotX: 11, pivotY: 25};
const CROPS = {pumpkin: 'Bí ngô', daisy: 'Cúc trắng', strawberry: 'Dâu tây'};
const GIFT = {water: '💧', boost: '✨'};

// An overlay drawn at the hearth's own spot, shifted by its pivot so it lands at (x, y) on hearth.png.
const overlay = (id, xy, frame, name, [x, y]) => ({kind: 'elf', id, still: true, xy, flip: false,
  asset: {...frame, file: file(name), pivotX: HEARTH.pivotX - x + frame.pivotX, pivotY: HEARTH.pivotY - y + frame.pivotY, bounds: {x: 0, y: 0, w: 0, h: 0}}});

/** The hearth goes into `elves` (picked like a gia tinh, id 'xmas-hearth'); returns the vớ and egg drawn over it. */
export function hearthObjects(iso, view, elves = []) {
  if (!view) return [];
  const [x, y] = iso(...HEARTH_SPOT), xy = [Math.round(x), Math.round(y)];
  elves.push({kind: 'elf', id: 'xmas-hearth', still: true, xy, flip: false, asset: {...HEARTH, file: file('hearth')}});
  const socks = view.chapter?.socks ?? [];
  const step = (MANTEL.x1 - MANTEL.x0) / 9;
  const out = socks.map((s, i) => overlay(`xmas-sock-${s.n}`, xy, SOCK, s.opened ? 'sock-open' : 'sock', [Math.round(MANTEL.x0 + i * step), MANTEL.y + (i % 2) * 3]));
  if (view.egg && !view.egg.hatched) out.push(overlay('xmas-egg', xy, EGG, `egg-${view.egg.stage}`, FIREBOX));
  return out;
}

const pad = (n) => String(n).padStart(2, '0');
const giftText = (gift) => Object.entries(gift).map(([k, v]) => `${GIFT[k] || k} ${v}`).join(' ');
export const sockTask = (s) => `Nộp ${s.qty} ${CROPS[s.crop] || s.crop}: ${s.label}`;
/** Why a vớ cannot open now ('' when it can). */
export function sockLock(s, chapter, stock = {}) {
  if (s.opened) return 'Đã mở';
  if (!chapter.open) return 'Hết hạn';
  if (!s.unlocked) return `Mở ${pad(s.n)}/12`;
  if (chapter.today >= chapter.cap) return 'Mai mở tiếp';
  return (stock[s.crop] || 0) >= s.qty ? '' : `Thiếu ${CROPS[s.crop] || s.crop}`;
}

/** The hearth panel: the ten vớ, bác Hagrid's letters, the egg's fire. `act` sends action `xmas` and resolves {ok, receipt}. */
export function createXmasCare({getSnapshot, act, notify}) {
  const body = el('div', {class: 'elf-care-body'});
  const dialog = el('dialog', {id: 'xmasCare', class: 'owl-letter elf-care', 'aria-labelledby': 'xmasCareTitle'}, [
    el('div', {class: 'popover-heading'}, [el('h2', {id: 'xmasCareTitle', text: 'Gia tinh đón đông'}), iconButton('close', 'Đóng', () => dialog.close(), {class: 'gp-close'})]),
    body,
  ]);
  (document.getElementById('gameShell') || document.body).append(dialog);
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  const send = async (fields, after) => { const res = await act({action: 'xmas', ...fields}); if (res?.ok && res.receipt?.xmas) after(res.receipt.xmas); render(); };

  function render() {
    const snap = getSnapshot(), view = snap?.xmas, stock = snap?.garden?.progression?.inventory || {};
    if (!view) { body.replaceChildren(el('p', {class: 'meta', text: 'Lò sưởi chỉ đỏ lửa trong tháng 12.'})); return; }
    const rows = [];
    const ch = view.chapter;
    if (ch) {
      rows.push(el('p', {class: 'meta', text: `Mười chiếc vớ (01–10/12) · hôm nay ${ch.today}/${ch.cap} · ${ch.tent ? 'đã nhận Lều gia tinh' : 'đủ 10 vớ nhận Lều gia tinh'}`}));
      for (const s of ch.socks) {
        const lock = sockLock(s, ch, stock);
        rows.push(el('div', {class: 'gp-hero elf-wage', 'data-xmas-sock': String(s.n)}, [
          el('div', {class: 'gp-hero-copy'}, [el('strong', {text: `Vớ ${s.n} · ${giftText(s.gift)}${s.n === 10 ? ' · Lều gia tinh' : ''}`}), el('small', {text: s.opened || s.unlocked ? sockTask(s) : '???'})]),
          iconButton('chest', `Mở vớ ${s.n}`, () => send({kind: 'sock', n: s.n}, (r) => {
            notify(`🧦 Vớ ${r.n}: ${giftText(r.gift)}`);
            if (r.letter) showHagridLetter({greeting: r.letter.greeting, mode: 'gift', letter: r.letter});
          }), {text: lock || 'Mở vớ', class: lock ? '' : 'primary', disabled: Boolean(lock)}),
        ]));
      }
    }
    const L = view.letters;
    if (L.read < L.total || !view.egg?.hatched) {
      rows.push(el('div', {class: 'gp-hero elf-wage'}, [
        el('div', {class: 'gp-hero-copy'}, [el('strong', {text: `Thư bác Hagrid ${L.read}/${L.total}`}), el('small', {text: L.read >= L.total ? 'Trứng rồng đã nằm trong lò sưởi.' : L.ready ? 'Cú vừa tới!' : 'Mai cú tới tiếp.'})]),
        iconButton('letter', 'Đọc thư', () => {
          if (!L.ready) { const last = L.texts[L.read - 1]; if (last) showHagridLetter({greeting: last.greeting, mode: 'gift', letter: last}); return; }
          send({kind: 'letter'}, (r) => showHagridLetter({greeting: r.letter.greeting, mode: 'gift', letter: r.letter}));
        }, {text: L.ready ? 'Nhận thư' : 'Đọc lại', class: L.ready ? 'primary' : '', disabled: !L.ready && L.read === 0}),
      ]));
    }
    const egg = view.egg;
    if (egg) {
      rows.push(el('div', {class: 'owl-chest-meter'}, [
        el('small', {text: egg.hatched ? 'Norbert đã nở!' : 'Trứng rồng'}),
        el('div', {class: 'gp-meter', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(egg.need), 'aria-valuenow': String(egg.stokes)}, [el('span', {style: `width:${Math.round(egg.stokes / egg.need * 100)}%`})]),
        el('b', {text: `${egg.stokes}/${egg.need}`}),
      ]));
      if (!egg.hatched) rows.push(iconButton('care', 'Ủ lửa cho trứng rồng', () => send({kind: 'stoke'}, (r) => notify(r.hatched ? '🐉 Trứng nở rồi! Norbert lạch bạch ra khỏi lò sưởi.' : `🔥 Đã ủ lửa · ${r.stokes}/${egg.need} ngày`)),
        {text: egg.stokedToday ? 'Mai ủ tiếp' : 'Ủ lửa', class: egg.stokedToday ? '' : 'primary', disabled: egg.stokedToday}));
    }
    body.replaceChildren(...rows);
  }
  return {open() { render(); dialog.showModal(); }, sync() { if (dialog.open) render(); }};
}

/** A one-line nudge after a server reply: a letter is waiting, a vớ can open, the fire wants stoking ('' when none). */
export function xmasNudge(view) {
  if (!view) return '';
  if (view.letters.ready) return '🦉 Thư của bác Hagrid vừa tới: chạm lò sưởi để đọc.';
  if (view.chapter?.open && view.chapter.today < view.chapter.cap && view.chapter.socks.some((s) => s.unlocked && !s.opened)) return '🧦 Có vớ mới trên lò sưởi.';
  if (view.egg && !view.egg.hatched && !view.egg.stokedToday) return '🔥 Trứng rồng cần ủ lửa hôm nay.';
  return '';
}
