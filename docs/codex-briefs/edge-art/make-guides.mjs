// Footprint guides for Codex: the exact ground parallelogram of each edge piece at master scale. Orchard also marks its 6 pits.
// Usage (repo root): node docs/codex-briefs/edge-art/make-guides.mjs
import {createRequire} from 'node:module';
import {EDGE_SPECS, ORCHARD_PITS} from '../../../garden-v05/build-edge-art.mjs';
const sharp = createRequire(import.meta.url)('/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
for (const s of EDGE_SPECS) {
  const k = s.masterScale, a = s.cols, b = s.rows, {x: cx, y: cy} = s.groundCentre;
  const pt = (c, r) => [(cx + (c - r) * 32) * k, (cy + (c + r) * 16) * k]; // c in [-a/2, a/2], r in [-b/2, b/2]
  const poly = (c0, r0, c1, r1) => [pt(c0, r0), pt(c1, r0), pt(c1, r1), pt(c0, r1)].map(p => p.join(',')).join(' ');
  let seams = '';
  for (let c = -a / 2 + 1; c < a / 2; c++) seams += `<line x1="${pt(c, -b / 2)[0]}" y1="${pt(c, -b / 2)[1]}" x2="${pt(c, b / 2)[0]}" y2="${pt(c, b / 2)[1]}"/>`;
  for (let r = -b / 2 + 1; r < b / 2; r++) seams += `<line x1="${pt(-a / 2, r)[0]}" y1="${pt(-a / 2, r)[1]}" x2="${pt(a / 2, r)[0]}" y2="${pt(a / 2, r)[1]}"/>`;
  const pits = s.id === 'orchard' ? ORCHARD_PITS.map(([c, r]) => `<polygon points="${poly(c - a / 2, r - b / 2, c + 2 - a / 2, r + 2 - b / 2)}" fill="#E7AE73" stroke="#C75B4B" stroke-width="${k * 1.5}"/>`).join('') : '';
  const W = s.width * k, H = s.height * k, top = (cy - (a + b) * 8) * k;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#ffffff"/>
<line x1="0" y1="${top}" x2="${W}" y2="${top}" stroke="#C75B4B" stroke-width="2" stroke-dasharray="12 8"/>
<polygon points="${poly(-a / 2, -b / 2, a / 2, b / 2)}" fill="#B7DEE0" stroke="#231F2E" stroke-width="${k}"/><g stroke="#70A8B6" stroke-width="2">${seams}</g>${pits}
<circle cx="${cx * k}" cy="${cy * k}" r="${k * 1.5}" fill="#C75B4B"/></svg>`;
  await sharp(Buffer.from(svg)).png().toFile(`docs/codex-briefs/edge-art/guide-${s.id}.png`);
  console.log(s.id, W + '×' + H, 'native', s.width + '×' + s.height, '×' + k);
}
