import {densityOf, deviceLine, fillAt} from './device-pixels.mjs?v=26.10';
// «Cây nước» (owner 15/11/2026 «biến cái vườn thành nước»): the three water crops (server BED_CROPS, garden-pond-core.js)
// grow straight out of water: a plot holding one draws a water bed, and Tảo bạc's authored tray is cut from its art.
export const WATER_CROPS = Object.freeze(['silverkelp', 'gillyweed', 'fluxweed']);
// Whole plot, not per cell: per-cell water diamonds would read as trays again; one bed is «cái vườn thành nước».
export const isWaterPlot = (slots) => (Array.isArray(slots) ? slots : []).some((slot) => WATER_CROPS.includes(slot?.species));
// Where a grown stem meets the water, above the crop's foot: Tảo bạc's stems met its tray water 9 px up.
export const WATERLINE_LIFT = Object.freeze({silverkelp: 9, gillyweed: 1, fluxweed: 1});
// Only Tảo bạc was authored standing in a tray; Cỏ mang cá and Rong nước xiết have bare roots.
export const TRAY_ART = /^native-(levels|crop-complete)\/silverkelp\/frame-\d+\.png$/;

const isGold = (r, g, b) => r > g && g > b && r - b > 40;
const isWater = (r, g, b) => (b > r + 30 && g > r + 20) || (g > r && g > b);

// Cut the tray from one RGBA frame in place (any density: the tray is found from its own gold rim, so 1× and 2× agree).
// Inside the rim's span only the plant stays: a run of pixels hanging unbroken from above the back rim, down to
// min(waterline, the front rim's top); gold rim, tray water and sides go. The waterline is 3 logical px above the rim's front corner, where the stems meet the tray water.
// Idempotent: a cut frame has no gold left, so a second pass changes nothing.
export function cutTray(data, width, height, density = 1) {
  const gold = [];
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = (y * width + x) * 4;
    if (data[i + 3] && isGold(data[i], data[i + 1], data[i + 2])) gold.push([x, y]);
  }
  if (gold.length < 8 * density * density) return 0;
  // The tray is a 2:1 rim diamond on 6 px sides: no taller than half its width + 6; a warm pixel higher up is the plant's.
  const bottom = Math.max(...gold.map(p => p[1]));
  for (const reach of [24 * density, null]) {
    const xs = gold.map(p => p[0]), floor = bottom - (reach ?? (Math.max(...xs) - Math.min(...xs)) / 2 + 6 * density);
    gold.splice(0, gold.length, ...gold.filter(p => p[1] >= floor));
  }
  // The span reaches two logical pixels past the rim: the tray's dark outline.
  const x0 = Math.max(0, Math.min(...gold.map(p => p[0])) - 2 * density), x1 = Math.min(width - 1, Math.max(...gold.map(p => p[0])) + 2 * density);
  // Upper hull of the gold pixels: the back rim line L→T→R, the tray's top edge.
  const hull = [];
  for (const p of [...gold].sort((a, b) => a[0] - b[0] || a[1] - b[1])) {
    while (hull.length > 1) {
      const [a, b] = hull.slice(-2);
      if ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]) <= 0) hull.pop(); else break;
    }
    if (!hull.length || hull.at(-1)[0] !== p[0]) hull.push(p);
  }
  const top = x => { for (let k = 1; k < hull.length; k++) { const [a, b] = [hull[k - 1], hull[k]]; if (x <= b[0]) return a[1] + (b[1] - a[1]) * (x - a[0]) / Math.max(1, b[0] - a[0]); } return hull.at(-1)[1]; };
  // Front rim: the top of the lowest gold run in each column.
  const front = new Map();
  for (let x = x0; x <= x1; x++) {
    let y = height - 1;
    while (y >= 0 && !(data[(y * width + x) * 4 + 3] && isGold(...data.subarray((y * width + x) * 4, (y * width + x) * 4 + 3)))) y--;
    if (y < 0) continue;
    while (y > 0 && data[((y - 1) * width + x) * 4 + 3] && isGold(...data.subarray(((y - 1) * width + x) * 4, ((y - 1) * width + x) * 4 + 3))) y--;
    front.set(x, y);
  }
  // A gap in the corner post must not drop the waterline: each column takes the highest of its neighbours.
  const rim = new Map([...front].map(([x, y]) => [x, Math.min(y, front.get(x - 1) ?? y, front.get(x + 1) ?? y)]));
  const waterline = Math.max(...rim.values()) - 3 * density;
  let cut = 0;
  for (let x = x0; x <= x1; x++) {
    const near = rim.get(x) ?? rim.get(x + density) ?? rim.get(x - density) ?? rim.get(x + 1) ?? rim.get(x - 1);
    const below = Math.min(waterline, near ?? waterline), above = top(Math.min(Math.max(x, hull[0][0]), hull.at(-1)[0]));
    // Inside the rim only what hangs down from the plant stays: a run of plant pixels unbroken from above the rim.
    const start = Math.max(1, Math.floor(above) - 2 * density);
    let hanging = data[((start - 1) * width + x) * 4 + 3] > 0;
    for (let y = start; y < height; y++) {
      const i = (y * width + x) * 4;
      if (!data[i + 3]) { hanging = false; continue; }
      const [r, g, b] = data.subarray(i, i + 3);
      if (hanging && y < below && !isGold(r, g, b) && !(y > above + 2 * density && isWater(r, g, b))) continue;
      hanging = false; data.fill(0, i, i + 4); cut++;
    }
  }
  // A leaf's outline running on down a tray post leaves a one-pixel sliver: drop rows of plant no wider than that.
  const alpha = (x, y) => x >= 0 && x < width && data[(y * width + x) * 4 + 3] > 0;
  for (let y = Math.floor(top(hull[0][0])); y < waterline; y++) for (let x = x0; x <= x1; x++) {
    if (!alpha(x, y) || alpha(x - 1, y)) continue;
    let run = 1; while (alpha(x + run, y)) run++;
    if (run <= density) { data.fill(0, (y * width + x) * 4, (y * width + x + run) * 4); cut += run; }
  }
  return cut;
}

// The plot's water, in the «Ruộng nước» paddy's colours: dark pond water, the rim's shadow along the two back edges,
// short glints; in snow the big pond's pale ice fringe (the paddies stay open water too). `corners` = plotCorners
// (back, right, front, left); `stems` = [x, y] waterline points that get a ring. Device pixels above density 1.
export function drawWaterBed(ctx, corners, {weatherMode = 'clear', index = 0, stems = []} = {}) {
  const d = densityOf(ctx), p = 1 / d, [back, right, front, left] = corners;
  const span = (y) => {
    const xs = [[back, right], [right, front], [front, left], [left, back]].flatMap(([a, b]) => {
      if ((y < Math.min(a[1], b[1])) || (y > Math.max(a[1], b[1])) || a[1] === b[1]) return [];
      return [a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1])];
    });
    return xs.length ? [Math.min(...xs), Math.max(...xs)] : null;
  };
  for (let y = back[1]; y < front[1]; y += p) {
    const s = span(y + p / 2);
    if (s && s[1] - s[0] > p) fillAt(ctx, s[0], y, s[1] - s[0], p, '#24483f', d);
  }
  // The raised rim's shadow on the water: a 10 px band under the two back edges (the rim covers about half), filled row by row.
  const sl = (left[1] - back[1]) / (back[0] - left[0]), sr = (right[1] - back[1]) / (right[0] - back[0]);
  for (let y = back[1]; y < Math.max(left[1], right[1]) + 10; y += p) {
    const s = span(y + p / 2), dy = y + p / 2 - back[1];
    if (!s) continue;
    const a = Math.max(s[0], back[0] - dy / sl), b = Math.min(back[0] - Math.max(0, dy - 10) / sl, back[0]);
    const c = Math.max(back[0] + Math.max(0, dy - 10) / sr, back[0]), e = Math.min(s[1], back[0] + dy / sr);
    if (b > a) fillAt(ctx, a, y, b - a, p, '#142620', d);
    if (e > c) fillAt(ctx, c, y, e - c, p, '#142620', d);
  }
  if (weatherMode === 'snow') {
    // Ice along the bank: a pale band with brighter breaks, inside all four edges.
    const inset = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
    const mid = [(back[0] + front[0]) / 2, (back[1] + front[1]) / 2];
    [[back, right], [right, front], [front, left], [left, back]].forEach(([a, b], edge) => {
      const a1 = inset(a, mid, 0.07), b1 = inset(b, mid, 0.07);
      deviceLine(ctx, a1, b1, '#a6b1ae', 2, d, 0);
      for (let t = 0.1 + (index + edge) % 3 * 0.1; t < 0.9; t += 0.27) {
        const u = inset(a1, b1, t), v = inset(a1, b1, t + 0.08);
        deviceLine(ctx, u, v, '#e8f0ed', 1, d, 0);
      }
    });
  }
  // Glints between the cells (stems stand on cell centres), nudged per plot: a cyan dash with a pale catch-light.
  const at = (u, v) => [back[0] + (right[0] - back[0]) * u + (left[0] - back[0]) * v, back[1] + (right[1] - back[1]) * u + (left[1] - back[1]) * v];
  [[1 / 3, 0.2], [1 / 3, 0.52], [1 / 3, 0.84], [2 / 3, 0.18], [2 / 3, 0.5], [2 / 3, 0.82], [0.2, 2 / 3], [0.84, 1 / 3]].forEach(([u, v], j) => {
    const [x, y] = at(u + ((index * 7 + j * 3) % 5 - 2) / 40, v + ((index * 3 + j * 5) % 5 - 2) / 40), w = 6 + (index + j) % 3;
    fillAt(ctx, x - w / 2, y, w, p, '#70a8b6', d);
    fillAt(ctx, x - w / 2 + 1, y - p, 3, p, '#a6b1ae', d);
  });
  // A ring where each stem leaves the water (drawn under the plant, so it shows each side of the stem).
  for (const [x, y] of stems) {
    fillAt(ctx, x - 7, y, 3, p, '#70a8b6', d); fillAt(ctx, x + 4, y, 3, p, '#70a8b6', d);
    fillAt(ctx, x - 5, y + 1, 10, p, '#41465c', d);
    fillAt(ctx, x - 4, y - 1, 2, p, '#a6b1ae', d); fillAt(ctx, x + 2, y - 1, 2, p, '#a6b1ae', d);
  }
}
