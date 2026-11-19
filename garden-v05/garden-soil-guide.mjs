// Owner 18/11/2026: the player guide «Ấn kỷ vật · Dùng ngay · Đất mệt», full words, no abbreviations, one frame,
// one segmented row, rows as separate cells. «Đất mệt» numbers mirror HPVN functions/games/garden-soil-core.js (HPVN
// test garden-soil-guide.test.js keeps them equal); «Ấn kỷ vật» and «Dùng ngay» rows come from the server view
// (snapshot.keepsakes, garden-keepsake-core), so their numbers live on the server only.
import {el,closeOnBackdrop} from './ui-utils.mjs?v=26.27';
import {iconButton} from './pixel-icons.mjs?v=26.27';
import {DB} from './balance-data.mjs?v=26.27';

export const SOIL_GUIDE = Object.freeze({level: 160, cellsPerRun: 9, tiredFrom: 3, step: 25, floor: 50});

const rows = (head, list, mine = () => -1) => el('div', {class: 'soil-guide-table' + (head.length > 2 ? ' is-wide' : ''), role: 'table', style: `--cols:${head.length}`}, [
 el('div', {class: 'soil-guide-row is-head', role: 'row'}, head.map(text => el('span', {role: 'columnheader', text}))),
 ...list.map((cells, r) => el('div', {class: 'soil-guide-row' + (mine(r) >= 0 ? ' is-mine' : ''), role: 'row'},
  cells.map((text, i) => el('span', {role: 'cell', 'data-label': head[i], text, class: i === mine(r) ? 'is-tier' : ''})))),
]);

function soilTab() {
 const g = SOIL_GUIDE;
 return [
  el('p', {text: `Từ cấp ${g.level}, một thửa đất trồng liên tiếp cùng một họ cây sẽ mệt dần. Cứ ${g.cellsPerRun} ô thu hoạch được tính là một vụ.`}),
  rows(['Vụ liên tiếp cùng họ cây', 'Sản lượng mỗi ô'], [
   ['Vụ thứ nhất và vụ thứ hai', '100%'],
   ['Vụ thứ ba', `${100 - g.step}%`],
   ['Từ vụ thứ tư trở đi', `${g.floor}% (mức thấp nhất)`],
  ]),
  rows(['Cách làm đất hồi lại', 'Kết quả'], [
   ['Trồng một họ cây khác (lá, củ, hoa, thảo dược, quả)', 'Đất tính lại từ đầu ngay ở lần thu hoạch đó'],
   ['Bón Phân bón trăng đóng gói (1 gói)', `Lùi lại một vụ (${g.cellsPerRun} ô thu hoạch), mỗi thửa một lần mỗi ngày, tính theo giờ Việt Nam`],
   ['Kỹ năng «Xới đất» của Nhím quậy', 'Đất tính lại từ đầu'],
  ]),
  el('p', {text: `Nhãn «Thu −${g.step}%» trên hạt giống cho biết: nếu gieo kín thửa bằng hạt đó, những ô thu hoạch cuối sẽ bị giảm bao nhiêu.`}),
  el('p', {text: 'Cây khác loài nhưng cùng họ vẫn tính chung một chuỗi. Khi Bác Hagrid trông vườn giúp, đất không mệt. Nút «Bón phân trăng» chỉ hiện ở thửa đang mệt. Ấn kỷ vật của Nhím quậy và Bê trăng làm đất hồi nhanh hơn.'}),
 ];
}

function sealTab(view) {
 const [a, b, c] = view.tiers, animals = DB.animals.filter(x => view.species[x.id]);
 return [
  el('p', {text: `Mỗi sinh vật trưởng thành cho một sản vật sau mỗi bữa ăn. Trong «Bộ sưu tập», cứ 5 sản vật cùng loài đổi được 1 kỷ vật. Khi số kỷ vật của một loài đạt mốc, Ấn kỷ vật của loài đó lên bậc và có hiệu lực ngay, không mất đi. Kỷ vật đã đổi không thể đổi ngược lại thành sản vật, không bán và không tặng được.`}),
  rows(['Bậc', 'Số kỷ vật cần có', 'Tương đương số sản vật'], [[a, 1], [b, 2], [c, 3]].map(([n, t]) => [`Bậc ${t}`, `${n} kỷ vật`, `${n * 5} sản vật`])),
  rows(['Sinh vật', 'Sản vật', 'Bậc 1', 'Bậc 2', 'Bậc 3'], animals.map(x => [x.label, x.produce, ...view.species[x.id].cells]),
   r => (view.species[animals[r].id].tier ? view.species[animals[r].id].tier + 1 : -1)),
  el('p', {text: 'Dòng tô đậm là bậc con đang có.'}),
 ];
}

function useTab(view) {
 const name = id => DB.animals.find(x => 'produce_' + x.id === id)?.produce || id;
 return [
  el('p', {text: 'Một số sản vật dùng được ngay để xử lý việc trong vườn. Mỗi lần dùng sẽ trừ sản vật trong kho. Lượt dùng tính lại lúc 0 giờ theo giờ Việt Nam.'}),
  rows(['Sản vật', 'Số lượng mỗi lần', 'Tác dụng', 'Khi nào dùng được', 'Giới hạn'], view.useNow.map(u => [name(u.item), u.amount, u.effect, u.when, u.limit])),
 ];
}

/** `tab`: 'seal' | 'use' | 'soil'; `view`: snapshot.keepsakes (null offline: only «Đất mệt»). */
export function openSoilGuide(tab = 'soil', view = null) {
 const tabs = [['seal', 'Ấn kỷ vật'], ['use', 'Dùng ngay'], ['soil', 'Đất mệt']].filter(([id]) => view || id === 'soil');
 if (!tabs.some(([id]) => id === tab)) tab = 'soil';
 const content = el('div', {class: 'soil-guide-body'});
 const seg = el('div', {class: 'creature-seg soil-guide-seg', role: 'tablist', 'aria-label': 'Hướng dẫn'});
 const show = id => {
  tab = id;
  content.replaceChildren(...({seal: () => sealTab(view), use: () => useTab(view), soil: soilTab})[id]());
  for (const b of seg.children) b.setAttribute('aria-selected', String(b.dataset.tab === id));
 };
 for (const [id, text] of tabs) seg.append(el('button', {type: 'button', role: 'tab', 'data-tab': id, text, onclick: () => show(id)}));
 const dialog = el('dialog', {class: 'owl-letter soil-guide' + (view ? ' is-wide' : ''), 'aria-labelledby': 'soilGuideTitle'}, [
  el('div', {class: 'popover-heading'}, [el('h2', {id: 'soilGuideTitle', text: view ? 'Hướng dẫn' : 'Hướng dẫn: Đất mệt'}), iconButton('close', 'Đóng', () => dialog.close(), {class: 'gp-close'})]),
  ...(tabs.length > 1 ? [seg] : []),
  content,
 ]);
 show(tab);
 (document.getElementById('gameShell') || document.body).append(dialog);
 closeOnBackdrop(dialog);
 dialog.addEventListener('close', () => dialog.remove());
 dialog.showModal();
}
