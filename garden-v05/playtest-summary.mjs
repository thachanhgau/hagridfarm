// node playtest-summary.mjs nguoi-1.json nguoi-2.json ...
// Prints one row per session plus the Phase 2 gate (docs/playtest-plan.md).
import {readFileSync} from 'node:fs';
import {summarizePlaytest} from './garden-playtest.mjs';

const sec = (ms) => (ms == null ? '—' : `${Math.round(ms / 1000)}s`);
const files = process.argv.slice(2);
if (!files.length) {
  console.error('Cách dùng: node playtest-summary.mjs <file nhật ký>.json ...');
  process.exit(1);
}
const events = files.flatMap((file) => JSON.parse(readFileSync(file, 'utf8')).events || []);
const rows = summarizePlaytest(events);
console.log('| Phiên | Màn hình | Thời lượng | Gieo đầu | Gặt đầu | Bước cuối | Xong HD | Bỏ qua | Chặn | Lỗi | Lặng lâu nhất | Cấp |');
console.log('|---|---|---|---|---|---|---|---|---|---|---|---|');
for (const r of rows) {
  const idle = r.longestIdle ? `${sec(r.longestIdle.ms)} ở ${r.longestIdle.step || '—'} → ${r.longestIdle.before}` : '—';
  console.log(`| ${r.session.slice(0, 6)} | ${r.screen}${r.touch ? '·cảm ứng' : ''} | ${sec(r.durationMs)} | ${sec(r.firstPlantMs)} | ${sec(r.firstHarvestMs)} | ${r.lastTutorialStep || '—'} | ${r.tutorialDone ? 'có' : 'không'} | ${r.tutorialSkipped ? 'có' : 'không'} | ${r.blocked} | ${r.errors} | ${idle} | ${r.levelReached} |`);
}
const fresh = rows.filter((r) => r.newGarden);
const done = fresh.filter((r) => r.tutorialDone && !r.tutorialSkipped).length;
console.log(`\nCổng dữ liệu: ${done}/${fresh.length} phiên vườn mới tự hoàn thành ba phút đầu (cần ≥ 4/5, kèm câu trả lời "muốn chơi tiếp" trong phỏng vấn).`);
