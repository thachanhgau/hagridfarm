// Measures every ground-standing sprite against its grid footprint (docs/grid-fit-guideline.md).
//   node garden-v05/audit-grid-fit.mjs   → docs/grid-fit-audit.json + docs/grid-fit-misfits.md
// Read-only on art. Rules and tolerances live in the guideline; change them there first.
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {footprintPixels} from './garden-grid.mjs';

const require = createRequire(import.meta.url);
const sharp = require(process.env.SHARP_MODULE || '/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const read = file => fs.readFileSync(new URL(file, import.meta.url), 'utf8');
const box = {window: {}};
vm.createContext(box);
for (const [, file] of read('./index.html').matchAll(/<script src="([^"?]+\.js)(?:\?[^" ]*)?"/g)) vm.runInContext(read('./' + file), box, {filename: file});
globalThis.FARM_SCENE = box.window.FARM_SCENE;
globalThis.FARM_MOTION = box.window.FARM_MOTION;
const scene = globalThis.FARM_SCENE, motion = globalThis.FARM_MOTION;
const {decorFootprint, SCENERY_FOOTPRINTS} = await import('./garden-object-metrics.mjs');
const {footLift, orientedFootprint} = await import('./decor-runtime.mjs');
const {DECORATION_LAYOUT, defaultDecorFootprint} = await import('./default-decor.mjs');
const {COMPLETE_SCENERY, KEEPSAKE_ART} = await import('./complete-object-art.mjs');
const {ITEM_ART} = await import('./item-art.mjs');
const {FESTIVAL_HEROES} = await import('./garden-seasonal-world.mjs');
const {STORE_CATALOG} = await import('./garden-store-catalog.mjs');
const {DB} = await import('./balance-data.mjs');
const manifest = JSON.parse(read('./decor-assets-manifest.json')).items;

// Guideline table (docs/grid-fit-guideline.md §3). World pixels at zoom 1.
const FIT = Object.freeze({baseOff: 0.3, side: 4, footAbove: 4, footBelow: 2, minFill: 0.55, margin: 8, maxHeight: 224, upscaled: 0.9});
const heightCap = W => Math.min(2 * W, FIT.maxHeight);
const FOOTPRINTS = [[1, 1], [2, 1], [2, 2], [3, 1], [3, 2], [3, 3]];

async function ink(file) {
  const {data, info} = await sharp(new URL(file, import.meta.url).pathname).ensureAlpha().raw().toBuffer({resolveWithObject: true});
  const {width: w, height: h} = info;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (data[(y * w + x) * 4 + 3]) {x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);}
  // Share of 2×2 blocks that are one flat colour: ~1 means the art was upscaled, not drawn at 1:1.
  let best = 0;
  for (const [ox, oy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
    let blocks = 0, flat = 0;
    for (let y = oy; y + 1 < h; y += 2) for (let x = ox; x + 1 < w; x += 2) {
      const at = [[x, y], [x + 1, y], [x, y + 1], [x + 1, y + 1]].map(([px, py]) => data.readUInt32LE((py * w + px) * 4));
      if (!at.some(v => v >>> 24)) continue;
      blocks++; if (at.every(v => v === at[0])) flat++;
    }
    best = Math.max(best, blocks ? flat / blocks : 0);
  }
  return {canvas: [w, h], x0, x1, y0, y1, w: x1 - x0 + 1, h: y1 - y0 + 1, flat2x2: +best.toFixed(3), alpha: (x, y) => data[(y * w + x) * 4 + 3]};
}

// anchor 'foot': pivot is the front foot, footprint lifted (decorFootprintRect). 'center': pivot is the ground centre.
const subjects = [];
const add = (group, id, label, facing, asset, footprint, anchor) => asset?.file && subjects.push({group, id, label, facing, asset, footprint, anchor});
const storeLabel = new Map(STORE_CATALOG.filter(i => i.kind === 'decoration').map(i => [i.id, i.label]));
for (const a of manifest.filter(a => storeLabel.has(a.id))) {
  add('store-decoration', a.id, storeLabel.get(a.id), 'default', a, decorFootprint(a.id), 'foot');
  if (a.rightFile) add('store-decoration', a.id, storeLabel.get(a.id), 'right', {...a, file: a.rightFile}, decorFootprint(a.id), 'foot');
}
const decorLabel = new Map(DB.decorations.map(d => [d.id, d.label]));
for (const id of Object.keys(DECORATION_LAYOUT)) for (const facing of ['default', 'right']) {
  add('earned-decoration', id, decorLabel.get(id), facing, ITEM_ART[facing === 'right' ? id + '_right' : id], defaultDecorFootprint(id), 'foot');
}
const props = new Map(scene.props.map(p => [p.id, p]));
const sceneryLabel = {pond: 'Ao trang trí', hut: 'Lều Hagrid', gardener_friend: 'Bác Hagrid', herbology_greenhouse: 'Nhà kính Thảo dược', owl_post: 'Trạm cú'};
add('scenery', 'pond', sceneryLabel.pond, 'default', props.get('pond'), [3, 2], 'foot');
add('scenery', 'hut', sceneryLabel.hut, 'default', props.get('hut'), SCENERY_FOOTPRINTS.hut, 'center');
for (const a of COMPLETE_SCENERY) add('scenery', a.id, sceneryLabel[a.id], 'default', a, SCENERY_FOOTPRINTS[a.id], 'center');
const animalLabel = new Map(DB.animals.map(a => [a.id, a.label]));
for (const a of Object.values(KEEPSAKE_ART)) add('keepsake', a.id, 'Tượng ' + (animalLabel.get(a.id.replace('keepsake_', '')) ?? a.id), 'default', a, [1, 1], 'center');
const heroLabel = {'hero-yule': 'Cổng lễ hội Giáng sinh', 'hero-halloween': 'Cổng bí ngô Halloween', 'hero-herbology': 'Cổng Hội chợ Thảo dược'};
for (const a of Object.values(FESTIVAL_HEROES)) add('festival', a.id, heroLabel[a.id], 'default', a, [2, 2], 'center');
for (const item of motion.items.filter(i => i.kind === 'crop')) {
  const frames = item.frames.filter(f => typeof f === 'object');
  add('crop', item.id, item.label, 'mature', frames[Math.min(3, frames.length - 1)], [1, 1], 'center');
}

const rows = [];
for (const s of subjects) {
  const a = s.asset, m = await ink(a.file);
  const size = orientedFootprint(s.footprint, s.facing === 'right' ? 'right' : 'default');
  const ground = footprintPixels(size, scene), W = ground.width, half = {x: W / 2, y: ground.height / 2};
  const px = Number(a.pivotX ?? m.canvas[0] / 2), py = Number(a.pivotY ?? m.canvas[1]);
  const cy = s.anchor === 'foot' ? py - footLift(size) * 32 : py;
  const left = px - half.x, right = px + half.x, front = cy + half.y, foot = m.y1 + 1;
  const issues = [];
  const over = Math.max(left - m.x0, m.x1 + 1 - right);
  if (over > FIT.side) issues.push({rule: 'tràn-ngang', px: over, left: Math.max(0, left - m.x0), right: Math.max(0, m.x1 + 1 - right)});
  if (m.w < W * FIT.minFill) issues.push({rule: 'nhỏ-so-với-nền', fill: +(m.w / W).toFixed(2)});
  if (foot < cy - FIT.footAbove) issues.push({rule: 'chân-lơ-lửng', px: Math.round(cy - foot)});
  if (foot > front + FIT.footBelow) issues.push({rule: 'chân-lấn-ô-trước', px: Math.round(foot - front)});
  if (s.anchor === 'foot' && Math.abs(foot - py) > 3) issues.push({rule: 'pivot-không-ở-chân', px: foot - py});
  // Base: ink in the lowest H/2 rows must stand on the real footprint (a slanted strip for 1×3), not just inside the column.
  let base = 0, off = 0;
  for (let y = Math.max(m.y0, foot - half.y); y < foot; y++) for (let x = m.x0; x <= m.x1; x++) if (m.alpha(x, y)) {
    const dx = (x + 0.5 - px) / 32, dy = (y + 0.5 - cy) / 16, dc = (dx + dy) / 2, dr = (dy - dx) / 2;
    base++; if (Math.abs(dc) > size[0] / 2 + 0.125 || Math.abs(dr) > size[1] / 2 + 0.125) off++;
  }
  if (s.anchor === 'foot' && base && off / base > FIT.baseOff) issues.push({rule: 'chân-đế-lệch-nền', off: +(off / base).toFixed(2)});
  if (m.h > heightCap(W)) issues.push({rule: 'quá-cao', px: m.h - heightCap(W)});
  if (m.flat2x2 >= FIT.upscaled) issues.push({rule: 'mật-độ-pixel-x2', flat2x2: m.flat2x2});
  if (m.x0 === 0 || m.y0 === 0 || m.x1 === m.canvas[0] - 1 || m.y1 === m.canvas[1] - 1) issues.push({rule: 'chạm-mép-canvas'});
  // Remake target: same footprint, redrawn or re-exported (never resampled) inside W − margin.
  const fitW = W - FIT.margin, wide = m.w > W + FIT.side, tall = m.h > heightCap(W), small = m.w < W * FIT.minFill;
  const scale = wide ? fitW / m.w : small ? Math.ceil(W * 0.6) / m.w : tall ? heightCap(W) / m.h : 1;
  const inkW = Math.round(m.w * scale), inkH = Math.min(heightCap(W), Math.round(m.h * scale));
  const below = s.anchor === 'foot' ? 16 : half.y, canvasH = Math.ceil((inkH + 4 + below) / 16) * 16;
  const target = {canvas: [W, canvasH], pivot: [W / 2, canvasH - below], ink: [inkW, inkH], scale: +scale.toFixed(2)};
  const fix = wide ? 'vẽ nhỏ lại' : over > FIT.side ? 'căn lại tâm' : issues.some(i => i.rule === 'chân-đế-lệch-nền') ? 'vẽ lại chân đế' : tall ? 'hạ chiều cao' : small ? 'vẽ to hơn (tuỳ chọn)' : issues.length ? 'nới canvas' : '';
  const [lo, hi] = [...s.footprint].sort((a, b) => a - b);
  const roomy = wide ? FOOTPRINTS.find(([c, r]) => Math.min(c, r) >= lo && Math.max(c, r) >= hi && (c + r) * 32 >= m.w - FIT.side) : null;
  const severity = !issues.length ? 'ok' : over > 12 || (tall && m.h - heightCap(W) > 16) || issues.some(i => i.rule === 'chân-lơ-lửng' || i.rule === 'chân-lấn-ô-trước' || i.rule === 'mật-độ-pixel-x2' || i.off > 0.5) ? 'nặng' : over > FIT.side || tall || issues.some(i => i.rule === 'chân-đế-lệch-nền') ? 'vừa' : 'nhẹ';
  rows.push({group: s.group, id: s.id, label: s.label, facing: s.facing, file: a.file, anchor: s.anchor,
    footprint: size, ground, canvas: m.canvas, pivot: [px, py], ink: {x: m.x0, y: m.y0, w: m.w, h: m.h, foot},
    allowed: {left, right, centreY: cy, frontY: front}, flat2x2: m.flat2x2, issues, severity, fix, target,
    roomierFootprint: roomy ?? null});
}
fs.writeFileSync(new URL('../docs/grid-fit-audit.json', import.meta.url), JSON.stringify({fit: FIT, rows}, null, 1) + '\n');

// One line per item (both views merged, the worse view's numbers).
const rank = {'nặng': 3, 'vừa': 2, 'nhẹ': 1, ok: 0};
const items = new Map();
for (const r of rows) {
  const key = r.group + ':' + r.id, prev = items.get(key);
  if (!prev) items.set(key, {...r, views: [r]}); else {prev.views.push(r); if (rank[r.severity] > rank[prev.severity] || rank[r.severity] === rank[prev.severity] && r.ink.w > prev.ink.w) items.set(key, {...r, views: prev.views});}
}
const fmtIssue = i => i.rule === 'tràn-ngang' ? `tràn ${i.left ? 'trái ' + i.left : ''}${i.left && i.right ? ', ' : ''}${i.right ? 'phải ' + i.right : ''} px`
  : i.rule === 'nhỏ-so-với-nền' ? `chỉ phủ ${Math.round(i.fill * 100)}% bề ngang nền` : i.rule === 'quá-cao' ? `cao hơn trần ${i.px} px`
  : i.rule === 'chân-đế-lệch-nền' ? `${Math.round(i.off * 100)}% chân đế nằm ngoài nền` : i.rule === 'chạm-mép-canvas' ? 'mực chạm mép canvas' : `${i.rule} ${i.px ?? i.flat2x2 ?? ''}`;
const groupTitle = {'store-decoration': 'Đồ trang trí cửa hàng (mua)', 'earned-decoration': 'Đồ trang trí mặc định (mở theo cấp)', scenery: 'Công trình và cảnh cố định', keepsake: 'Tượng kỷ vật', festival: 'Cổng lễ hội', crop: 'Cây trồng (giai đoạn chín)'};
const bad = [...items.values()].filter(r => r.severity !== 'ok');
const count = s => bad.filter(r => r.severity === s).length;
let md = `# Hagrid — danh sách hình lệch lưới (${new Date().toISOString().slice(0, 10)})\n\n`;
md += `Tạo bởi \`node garden-v05/audit-grid-fit.mjs\` theo [guideline khớp ô](grid-fit-guideline.md). Số đo là pixel thế giới ở zoom 1, đo từ phần có màu (alpha > 0) của file đang chạy trong game. Không sửa tay file này.\n\n`;
md += `Đã đo ${items.size} món (${rows.length} hình, tính cả hai hướng xoay). Lệch: **${bad.length} món** — nặng ${count('nặng')}, vừa ${count('vừa')}, nhẹ ${count('nhẹ')}. Đạt: ${items.size - bad.length}.\n\n`;
md += `Cột «Tạo lại»: canvas rộng × cao, pivot (x, y) = điểm chân, khung mực tối đa rộng × cao. Vẽ lại hoặc xuất lại từ master ở kích thước đó; không thu nhỏ ảnh đã xuất. «Hoặc nền» là nền nhỏ nhất vừa hình hiện tại, chỉ dùng khi chủ dự án muốn giữ nguyên hình (đổi catalog + server, không áp cho save cũ).\n`;
for (const [group, title] of Object.entries(groupTitle)) {
  const list = bad.filter(r => r.group === group).sort((a, b) => rank[b.severity] - rank[a.severity] || b.ink.w / b.ground.width - a.ink.w / a.ground.width);
  if (!list.length) {md += `\n## ${title}\n\nTất cả đạt.\n`; continue;}
  md += `\n## ${title} — ${list.length} món\n\n| Mức | Món | Nền (ô · px) | Hình hiện tại (mực · canvas · pivot) | Lỗi | Cách sửa | Tạo lại: canvas · pivot · khung mực | Hoặc nền |\n|---|---|---|---|---|---|---|---|\n`;
  for (const r of list) {
    const issues = r.issues.map(fmtIssue).join('; ') + (r.views.length > 1 ? ` (hướng ${r.facing === 'right' ? 'phải' : 'trái'})` : '');
    md += `| ${r.severity} | ${r.label ?? r.id} \`${r.id}\` | ${r.footprint.join('×')} · ${r.ground.width}×${r.ground.height} | ${r.ink.w}×${r.ink.h} · ${r.canvas.join('×')} · (${r.pivot.join(',')}) | ${issues} | ${r.fix} | ${r.target.canvas.join('×')} · (${r.target.pivot.join(',')}) · ${r.fix === 'căn lại tâm' || r.fix === 'nới canvas' ? 'giữ' : r.fix.startsWith('vẽ to') ? '≥' : '≤'} ${r.target.ink.join('×')} | ${r.roomierFootprint ? r.roomierFootprint.join('×') : '—'} |\n`;
  }
}
fs.writeFileSync(new URL('../docs/grid-fit-misfits.md', import.meta.url), md);
console.log(`${items.size} items (${rows.length} sprites): ${bad.length} misfit — nặng ${count('nặng')}, vừa ${count('vừa')}, nhẹ ${count('nhẹ')}`);
