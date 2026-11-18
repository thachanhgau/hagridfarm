// Owner 18/11/2026: a player guide for «Đất mệt» and «Bón phân trăng», full words, no abbreviations.
// The numbers mirror HPVN functions/games/garden-soil-core.js; HPVN test garden-soil-guide.test.js keeps them equal.
import {el,closeOnBackdrop} from './ui-utils.mjs?v=26.18';
import {iconButton} from './pixel-icons.mjs?v=26.18';

export const SOIL_GUIDE = Object.freeze({level: 160, cellsPerRun: 9, tiredFrom: 3, step: 25, floor: 50});

const rows = (head, list) => el('div', {class: 'soil-guide-table', role: 'table'}, [
 el('div', {class: 'soil-guide-row is-head', role: 'row'}, head.map(text => el('span', {role: 'columnheader', text}))),
 ...list.map(cells => el('div', {class: 'soil-guide-row', role: 'row'}, cells.map((text, i) => el('span', {role: 'cell', 'data-label': head[i], text})))),
]);

export function openSoilGuide() {
 const g = SOIL_GUIDE;
 const dialog = el('dialog', {class: 'owl-letter soil-guide', 'aria-labelledby': 'soilGuideTitle'}, [
  el('div', {class: 'popover-heading'}, [el('h2', {id: 'soilGuideTitle', text: 'Hướng dẫn: Đất mệt'}), iconButton('close', 'Đóng', () => dialog.close(), {class: 'gp-close'})]),
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
  el('p', {text: 'Cây khác loài nhưng cùng họ vẫn tính chung một chuỗi. Khi Bác Hagrid trông vườn giúp, đất không mệt. Nút «Bón phân trăng» chỉ hiện ở thửa đang mệt.'}),
 ]);
 (document.getElementById('gameShell') || document.body).append(dialog);
 closeOnBackdrop(dialog);
 dialog.addEventListener('close', () => dialog.remove());
 dialog.showModal();
}
