// «Gia tinh đón đông» (25.0 S7 part 1; server HPVNN functions/games/garden-xmas-core.js, fence #36). From the server's open
// day (2026: the release day, later years 01/12) an outdoor hearth stands behind Thửa 3 with ten vớ on its mantel (chapter 1,
// until 10/12: one opens a day, each asks the gia
// tinh a small crop delivery, the tenth gives the Lều gia tinh) and, after bác Hagrid's three letters, the dragon egg in
// its fire: one stoke a VN day, 21 hatch Norbert (S4 companion). The server keeps every count and cap; this module only
// draws `snapshot.xmas` and sends action `xmas`. mobile-game imports it once the server sends `xmas` (never before the
// open day), and its frames load the first time they are drawn (festival-lazy-art.test.mjs).
// Part 2 (chapters 2–5, server garden-xmas-chapters.js): «Trận ném tuyết» 11–17/12 (3 banh tuyết a day, House Cup
// points, nine earn the «Áo len bà Weasley» Floo frame), «Dạ vũ Noel» 18–31/12 (twelve ornaments for the house tree,
// whose size follows the house's share of the points), «Đêm Noel» 24–25/12 (feast at the hearth, bác Hagrid carries a
// tree, a present with a letter), «Pháo hoa Giao thừa» 31/12 (fireworks at night, the 2027 Floo frame).
import {el,num} from './ui-utils.mjs?v=25.1.9';
import {runtimeImageUrl} from './runtime-image-url.mjs?v=25.1.9';
import {fireworks} from './garden-friends.mjs?v=25.1.9';
import {FEAST_GROUND, decorOnGround} from './decor-placement-ui.mjs?v=25.1.9';
import {iconButton} from './pixel-icons.mjs?v=25.1.9';
import {showHagridLetter} from './hagrid-letter-ui.mjs?v=25.1.9';

const file = (name) => `environment/xmas/${name}.png`;
export const XMAS_FILES = ['hearth', 'sock', 'sock-open', 'egg-0', 'egg-1', 'egg-2', 'egg-3', 'feast', 'carried-tree'].map(file);
export const TREE_FILES = [0, 1, 2, 3].map((n) => file(`house-tree-${n}`)); // panel only, loaded when it opens
// Đêm Noel: the elves' feast on the back strip left of the hearth (garden-xmas.test.mjs keeps it off every plot and the
// hearth; decor-placement-ui FEAST_GROUND keeps decorations off it), and the
// cut fir on bác Hagrid's shoulder (gardener at col -2, row 8; hand ~80 px above his feet).
export const FEAST_SPOT = [12, 0.4]; // row 0.4: every visitor and gia tinh stop lies in front of it
const FEAST = {width: 80, height: 56, pivotX: 40, pivotY: 52, bounds: {x: 0, y: 0, w: 0, h: 0}};
const GARDENER = [-2, 8], CARRIED = {width: 64, height: 48, pivotX: 8, pivotY: 40}, HAND = [10, -80];
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

let thrown = null; // {target, start}: the last banh tuyết, drawn as an arc for THROW_MS
const THROW_MS = 900;
const snowball = (from, to, k) => {
  const x = Math.round(from[0] + (to[0] - from[0]) * k), y = Math.round(from[1] + (to[1] - from[1]) * k - Math.sin(k * Math.PI) * 40);
  return {kind: 'fx', xy: [x, y + 300], draw: (ctx) => { ctx.fillStyle = '#E8F0ED'; ctx.fillRect(x - 2, y - 2, 4, 4); ctx.fillStyle = '#B7DEE0'; ctx.fillRect(x, y, 2, 2); }};
};

/** Pháo hoa Giao thừa: from 18:00 VN on the day the server sends `newYear`, whatever scene the member saved. The renderer
 * draws them after the night tint so they stay bright. */
export function newYearFireworks(iso, view, {clock = 0, now = Date.now()} = {}) {
  if (!view?.newYear || view.hearth === false || clock <= 0 || new Date(now + 7 * 3600000).getUTCHours() < 18) return [];
  const [x, y] = iso(...HEARTH_SPOT);
  return [-90, 0, 90].map((dx, i) => fireworks([Math.round(x) + dx, Math.round(y) - 40 * (i % 2)], clock, i)).filter(Boolean);
}

/** The hearth goes into `elves` (picked like a gia tinh, id 'xmas-hearth'); returns the vớ and egg drawn over it, and
 * by date the Đêm Noel feast and carried tree and a thrown banh tuyết. */
export function hearthObjects(iso, view, elves = [], {clock = 0, decorations = null} = {}) {
  if (!view || view.hearth === false) return [];
  const [x, y] = iso(...HEARTH_SPOT), xy = [Math.round(x), Math.round(y)];
  elves.push({kind: 'elf', id: 'xmas-hearth', still: true, xy, flip: false, asset: {...HEARTH, file: file('hearth')}});
  const socks = view.chapter?.socks ?? [];
  const step = (MANTEL.x1 - MANTEL.x0) / 9;
  const out = socks.map((s, i) => overlay(`xmas-sock-${s.n}`, xy, SOCK, s.opened ? 'sock-open' : 'sock', [Math.round(MANTEL.x0 + i * step), MANTEL.y + (i % 2) * 3]));
  if (view.egg && !view.egg.hatched) out.push(overlay('xmas-egg', xy, EGG, `egg-${view.egg.stage}`, FIREBOX));
  if (view.eve) {
    const [fx, fy] = iso(...FEAST_SPOT), [gx, gy] = iso(...GARDENER);
    // A piece placed there before the ground was kept free wins: no feast drawn over it.
    if (!decorOnGround(FEAST_GROUND, decorations)) out.push({kind: 'elf', id: 'xmas-feast', still: true, xy: [Math.round(fx), Math.round(fy)], flip: false, asset: {...FEAST, file: file('feast')}});
    out.push({kind: 'elf', id: 'xmas-carried-tree', still: true, xy: [Math.round(gx), Math.round(gy) + 1], flip: false,
      asset: {...CARRIED, file: file('carried-tree'), pivotX: CARRIED.pivotX - HAND[0], pivotY: CARRIED.pivotY - HAND[1], bounds: {x: 0, y: 0, w: 0, h: 0}}});
  }
  if (thrown && clock > 0) {
    const k = (clock - thrown.start) / THROW_MS, target = elves.find((o) => o.id === thrown.target);
    if (k >= 1) thrown = null;
    else if (k >= 0) out.push(snowball([xy[0], xy[1] - 60], target ? [target.xy[0], target.xy[1] - 40] : [xy[0] - 160, xy[1] - 120], k));
  }
  return out;
}

// «Dạ vũ Noel» ornaments, drawn by code on house-tree-N.png at pins inside its foliage triangle (Codex report
// docs/codex-briefs/xmas-s7-part2-report.md): [apexX, apexY, baseY, baseLeft, baseRight].
export const FOLIAGE = [[48, 117, 135, 36, 59], [48, 77, 134, 24, 72], [48, 42, 134, 18, 78], [48, 27, 134, 13, 83]];
// Twelve pins as (fraction down the foliage, fraction across its width there), spread so none touch.
const PINS = [[.18, 0], [.34, -.5], [.34, .5], [.5, -.7], [.5, 0], [.5, .7], [.66, -.45], [.66, .45], [.8, -.8], [.8, 0], [.8, .8], [.92, -.3]];
export function ornamentPin(stage, n) {
  const [ax, ay, by, bl, br] = FOLIAGE[stage] ?? FOLIAGE[0], [u, v] = PINS[(n - 1) % PINS.length];
  const y = ay + (by - ay) * u, half = (br - bl) / 2 * u;
  return [Math.round(ax + v * half), Math.round(y)];
}
// [pixels as [dx, dy, w, h, colour]]: small enough for the sapling, readable at 2×.
const ORNAMENT_ART = {
  star: [[-1, -2, 3, 5, '#FFC36B'], [-2, -1, 5, 3, '#FFC36B'], [0, 0, 1, 1, '#F5D69A']],
  tinsel: [[-3, 0, 7, 1, '#D6D8BF'], [-2, 1, 2, 1, '#A6B1AE'], [1, 1, 2, 1, '#A6B1AE']],
  mistletoe: [[-2, -1, 2, 2, '#71934B'], [1, -1, 2, 2, '#71934B'], [0, 0, 1, 1, '#E8F0ED']],
  bell: [[-1, -2, 3, 3, '#D6D8BF'], [-2, 0, 5, 1, '#A6B1AE'], [0, 1, 1, 1, '#FFC36B']],
  candle: [[0, -3, 1, 1, '#FFC36B'], [-1, -2, 3, 4, '#F5D69A']],
  cracker: [[-3, -1, 7, 2, '#C75B4B'], [-1, -1, 3, 2, '#FFC36B']],
  fairy: [[-1, -1, 3, 3, '#E07A9E'], [0, 0, 1, 1, '#F5D69A'], [-2, -2, 1, 1, '#B7DEE0'], [2, -2, 1, 1, '#B7DEE0']],
  candy: [[0, -2, 2, 5, '#E8F0ED'], [0, -1, 2, 1, '#C75B4B'], [0, 1, 2, 1, '#C75B4B'], [2, -2, 1, 2, '#C75B4B']],
  wreath: [[-2, -2, 5, 1, '#3F6A45'], [-2, 2, 5, 1, '#3F6A45'], [-2, -1, 1, 3, '#3F6A45'], [2, -1, 1, 3, '#3F6A45'], [0, -2, 1, 1, '#C75B4B']],
  sweater: [[-2, -2, 5, 4, '#C75B4B'], [-3, -2, 1, 2, '#C75B4B'], [3, -2, 1, 2, '#C75B4B'], [0, -1, 1, 2, '#FFC36B']],
  bauble: [[-1, -2, 3, 1, '#C75B4B'], [-2, -1, 5, 3, '#C75B4B'], [-1, 2, 3, 1, '#C75B4B'], [-1, -1, 1, 1, '#F5D69A']],
  angel: [[-1, -2, 3, 2, '#B0BD67'], [-2, 0, 5, 3, '#E8F0ED'], [-3, -1, 1, 2, '#D6D8BF'], [3, -1, 1, 2, '#D6D8BF']],
};
function drawOrnament(ctx, id, [x, y]) {
  ctx.fillStyle = '#231F2E';
  for (const [dx, dy, w, h] of ORNAMENT_ART[id] ?? []) ctx.fillRect(x + dx - 1, y + dy - 1, w + 2, h + 2);
  for (const [dx, dy, w, h, c] of ORNAMENT_ART[id] ?? []) { ctx.fillStyle = c; ctx.fillRect(x + dx, y + dy, w, h); }
}
/** The member's house tree at its stage with the ornaments they hung, as a 96×160 canvas shown at 2×. */
function treeCanvas(stage, ornaments) {
  const canvas = el('canvas', {class: 'xmas-tree', width: '96', height: '160', role: 'img', style: 'width:192px;height:320px;image-rendering:pixelated;display:block;margin:0 auto 8px',
    'aria-label': `Cây thông nhà, bậc ${stage + 1}/4, ${ornaments.filter((o) => o.hung).length} món trang trí`});
  const img = new Image();
  let tries = 0;
  img.onerror = () => { if (++tries < 3) setTimeout(() => { img.src = runtimeImageUrl(TREE_FILES[stage] ?? TREE_FILES[0]); }, 3000); else canvas.hidden = true; };
  img.onload = () => {
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0);
    for (const o of ornaments) if (o.hung) drawOrnament(ctx, o.id, ornamentPin(stage, o.n));
  };
  img.src = runtimeImageUrl(TREE_FILES[stage] ?? TREE_FILES[0]);
  return canvas;
}

const giftText = (gift) => Object.entries(gift).map(([k, v]) => `${GIFT[k] || k} ${v}`).join(' ');
export const sockTask = (s) => `Nộp ${s.qty} ${CROPS[s.crop] || s.crop}: ${s.label}`;
const NAMES = {harry: 'Harry', ron: 'Ron', hermione: 'Hermione', ginny: 'Ginny'};
/** What hanging one really adds: the member's room under the Cúp Nhà day cap, nothing without a house. Hanging stays allowed. */
export const ornamentPoints = (yule, cup) => (yule.house ? Math.max(0, Math.min(yule.cup, (cup?.dailyCap ?? yule.cup) - (cup?.today ?? 0))) : 0);
/** Why an ornament cannot be hung now ('' when it can). */
export function ornamentLock(o, yule, stock = {}) {
  if (o.hung) return 'Đã treo';
  if (!o.unlocked) return `Mở ${17 + o.n}/12`;
  if (yule.today >= yule.cap) return 'Mai treo tiếp';
  return (stock[o.crop] || 0) >= o.qty ? '' : `Thiếu ${CROPS[o.crop] || o.crop}`;
}
let lastBoard = null; // an action reply has no tree board: keep the last read's
/** Why a vớ cannot open now ('' when it can). */
export function sockLock(s, chapter, stock = {}) {
  if (s.opened) return 'Đã mở';
  if (!chapter.open) return 'Hết hạn';
  if (!s.unlocked) return `Mở ${s.opens}`;
  if (chapter.today >= chapter.cap) return 'Mai mở tiếp';
  return (stock[s.crop] || 0) >= s.qty ? '' : `Thiếu ${CROPS[s.crop] || s.crop}`;
}

/** The hearth panel: the ten vớ, bác Hagrid's letters, the egg's fire. `act` sends action `xmas` and resolves {ok, receipt}. */
export function createXmasCare({getSnapshot, act, notify}) {
  const body = el('div', {class: 'elf-care-body'});
  const dialog = el('dialog', {id: 'xmasCare', class: 'owl-letter elf-care', 'aria-labelledby': 'xmasCareTitle'}, [
    el('div', {class: 'popover-heading'}, [el('h2', {id: 'xmasCareTitle', text: 'Lò sưởi Giáng sinh'}), iconButton('close', 'Đóng', () => dialog.close(), {class: 'gp-close'})]),
    body,
  ]);
  (document.getElementById('gameShell') || document.body).append(dialog);
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  const send = async (fields, after) => { const res = await act({action: 'xmas', ...fields}); if (res?.ok && res.receipt?.xmas) after(res.receipt.xmas); render(); };

  function render() {
    const snap = getSnapshot(), view = snap?.xmas, stock = snap?.garden?.progression?.inventory || {};
    if (!view) { body.replaceChildren(); if (dialog.open) dialog.close(); return; }
    const rows = [];
    const hero = (title, note, button) => el('div', {class: 'gp-hero elf-wage'}, [el('div', {class: 'gp-hero-copy'}, [el('strong', {text: title}), ...(note ? [el('small', {text: note})] : [])]), button]);
    if (view.newYear) {
      const N = view.newYear;
      rows.push(hero(`Pháo hoa Giao thừa · khung Floo «${N.year}»`, '',
        iconButton('chest', `Nhận khung Pháo hoa ${N.year}`, () => send({kind: 'newyear'}, (r) => notify(`🎆 Đã nhận khung Pháo hoa ${r.year}: đeo trong Khung Floo.`)),
          {text: N.claimed ? 'Đã nhận' : 'Nhận khung', class: N.claimed || !N.ready ? '' : 'primary', disabled: N.claimed || !N.ready})));
    }
    if (view.eve) {
      const E = view.eve;
      rows.push(hero(`Đêm Noel · quà bí mật ${giftText(E.gift)}`, '',
        iconButton('letter', 'Nhận quà Đêm Noel', () => send({kind: 'eve'}, (r) => {
          notify(`🎁 Quà Đêm Noel: ${giftText(r.gift)}`);
          showHagridLetter({greeting: r.letter.greeting, mode: 'gift', letter: r.letter});
        }), {text: E.claimed ? 'Đã nhận' : 'Nhận quà', class: E.claimed ? '' : 'primary', disabled: E.claimed})));
    }
    if (view.yule) {
      if (view.yule.board) lastBoard = {board: view.yule.board, stage: view.yule.stage, pointsAt: view.yule.points};
      const Y = {...lastBoard, ...view.yule};
      // Between reads, the member's own points since the last read are added to their house's row.
      if (!view.yule.board && lastBoard) Y.board = lastBoard.board.map((b) => (b.house === Y.house ? {...b, points: b.points + Y.points - lastBoard.pointsAt} : b)).sort((a, b) => b.points - a.points);
      rows.push(el('p', {class: 'meta', text: Y.house
        ? `Dạ vũ Noel (18–31/12) · cây thông nhà ${Y.houseLabel} · con góp ${num(Y.points)} điểm${Y.points >= Y.championMin ? '' : ` (từ ${Y.championMin} điểm mới nhận Cây thông nhà vô địch)`}`
        : 'Dạ vũ Noel (18–31/12) · cây thông nhà: cần cấp 20 và nhà trong Floo'}));
      if (Y.house) rows.push(treeCanvas(Y.stage ?? 0, Y.ornaments));
      if (Y.board) rows.push(el('ol', {class: 'xmas-board'}, Y.board.map((b) => el('li', b.house === Y.house ? {'aria-current': 'true'} : {}, [el('span', {text: b.label}), el('b', {text: num(b.points)})]))));
      rows.push(el('p', {class: 'meta', text: `Món trang trí: hôm nay ${Y.today}/${Y.cap}`}));
      const points = ornamentPoints(Y, snap?.houseCup);
      for (const o of Y.ornaments) {
        const lock = ornamentLock(o, Y, stock);
        rows.push(hero(`Món ${o.n} · ${o.label}`, o.hung ? `Nộp ${o.qty} ${CROPS[o.crop] || o.crop}` : o.unlocked ? `Nộp ${o.qty} ${CROPS[o.crop] || o.crop} · ${points ? `+${points}` : 0} điểm` : '???',
          iconButton('chest', `Treo ${o.label}`, () => send({kind: 'ornament', n: o.n}, () => notify(`🎄 Đã treo ${o.label} lên cây thông nhà.`)),
            {text: lock || 'Treo', class: lock ? '' : 'primary', disabled: Boolean(lock)})));
      }
    }
    if (view.snow) {
      const S = view.snow, full = S.today >= S.cap;
      rows.push(el('p', {class: 'meta', text: `Trận ném tuyết (11–17/12) · hôm nay ${S.today}/${S.cap} · mỗi banh tuyết +${S.cup} điểm Cúp Nhà · ${S.sweater ? 'đã có khung Áo len bà Weasley' : `${Math.min(S.throws, S.sweaterAt)}/${S.sweaterAt} tới khung Áo len bà Weasley`}`}));
      rows.push(el('div', {class: 'gp-actions xmas-snow'}, S.targets.map((id) => iconButton('care', `Ném banh tuyết vào ${NAMES[id] || id}`, () => send({kind: 'snowball', target: id}, (r) => {
        thrown = {target: id, start: performance.now()};
        notify(`❄ ${r.line}${r.sweater ? ' · Nhận khung Áo len bà Weasley!' : ''}`);
      }), {text: full ? 'Mai ném tiếp' : NAMES[id] || id, class: full ? '' : 'primary', disabled: full}))));
    }
    const ch = view.chapter;
    if (ch && !ch.open) rows.push(el('p', {class: 'meta', text: `Mười chiếc vớ: đã mở ${ch.socks.filter((s) => s.opened).length}/10${ch.tent ? ' · đã nhận Lều gia tinh' : ''}`}));
    if (ch?.open) {
      rows.push(el('p', {class: 'meta', text: `Mười chiếc vớ (tới 10/12) · hôm nay ${ch.today}/${ch.cap} · ${ch.tent ? 'đã nhận Lều gia tinh' : 'đủ 10 vớ nhận Lều gia tinh'}`}));
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
  return {open() { render(); if (getSnapshot()?.xmas) dialog.showModal(); }, sync() { if (dialog.open) render(); }};
}

let championShown = false;
/** A one-line nudge after a server reply: a letter is waiting, a vớ can open, the fire wants stoking ('' when none). */
export function xmasNudge(view, now = Date.now()) {
  if (!view) return '';
  // Inside HPVN localStorage forgets on every visit (index.html), so the news runs on 1–3 January only, not all month.
  if (view.champion?.won && !championShown && new Date(now + 7 * 3600000).getUTCDate() <= 3) {
    championShown = true;
    return `🏆 Nhà ${view.champion.houseLabel} thắng Dạ vũ Noel! Cây thông nhà vô địch đã vào kho đồ trang trí.`;
  }
  if (view.newYear && !view.newYear.claimed && view.newYear.ready) return `🎆 Giao thừa: nhận khung Pháo hoa ${view.newYear.year} ở lò sưởi.`;
  if (view.eve && !view.eve.claimed) return '🎁 Quà Đêm Noel của bác Hagrid đang chờ ở lò sưởi.';
  if (view.yule && view.yule.today < view.yule.cap && view.yule.ornaments.some((o) => o.unlocked && !o.hung)) return '🎄 Có món trang trí mới cho cây thông nhà.';
  if (view.snow && view.snow.today < view.snow.cap) return `❄ Trận ném tuyết: còn ${view.snow.cap - view.snow.today} banh tuyết hôm nay.`;
  if (view.letters.ready) return '🦉 Thư của bác Hagrid vừa tới: chạm lò sưởi để đọc.';
  if (view.chapter?.open && view.chapter.today < view.chapter.cap && view.chapter.socks.some((s) => s.unlocked && !s.opened)) return '🧦 Có vớ mới trên lò sưởi.';
  if (view.egg && !view.egg.hatched && !view.egg.stokedToday) return '🔥 Trứng rồng cần ủ lửa hôm nay.';
  return '';
}
