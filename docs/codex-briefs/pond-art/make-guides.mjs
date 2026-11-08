// Footprint guides for Codex: the exact ground parallelogram of each pond piece at master scale, tile seams drawn.
// Usage (repo root): node docs/codex-briefs/pond-art/make-guides.mjs
import {createRequire} from 'node:module';
import {POND_SPECS} from '../../../garden-v05/build-pond-art.mjs';
const sharp = createRequire(import.meta.url)('/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
for (const s of POND_SPECS) {
  const k = s.masterScale, [b, a] = s.footprint, {x: cx, y: cy} = s.groundCentre;
  const pt = (c, r) => [(cx + (c - r) * 32) * k, (cy + (c + r) * 16) * k]; // c in [-a/2, a/2], r in [-b/2, b/2]
  const poly = [pt(-a / 2, -b / 2), pt(a / 2, -b / 2), pt(a / 2, b / 2), pt(-a / 2, b / 2)].map(p => p.join(',')).join(' ');
  let seams = '';
  for (let c = -a / 2 + 1; c < a / 2; c++) seams += `<line x1="${pt(c, -b / 2)[0]}" y1="${pt(c, -b / 2)[1]}" x2="${pt(c, b / 2)[0]}" y2="${pt(c, b / 2)[1]}"/>`;
  for (let r = -b / 2 + 1; r < b / 2; r++) seams += `<line x1="${pt(-a / 2, r)[0]}" y1="${pt(-a / 2, r)[1]}" x2="${pt(a / 2, r)[0]}" y2="${pt(a / 2, r)[1]}"/>`;
  const W = s.width * k, H = s.height * k, top = (cy - (a + b) * 8) * k;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#ffffff"/>
<line x1="0" y1="${top}" x2="${W}" y2="${top}" stroke="#C75B4B" stroke-width="2" stroke-dasharray="12 8"/>
<polygon points="${poly}" fill="#B7DEE0" stroke="#231F2E" stroke-width="${k}"/><g stroke="#70A8B6" stroke-width="2">${seams}</g>
<circle cx="${s.pivotX * k}" cy="${s.pivotY * k}" r="${k * 1.5}" fill="#C75B4B"/></svg>`;
  await sharp(Buffer.from(svg)).png().toFile(`docs/codex-briefs/pond-art/guide-${s.id}.png`);
  console.log(s.id, W + '×' + H, 'native', s.width + '×' + s.height, '×' + k);
}
