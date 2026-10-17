/**
 * Small, deterministic pixel details for the Hagrid garden ground layer.
 *
 * The module deliberately owns no scene state and does not load art.  Both
 * functions paint with integer fillRect stamps so they can sit below the
 * existing crop/actor layers without introducing a second interaction area.
 */

export const COTTAGE_ANCHORS = Object.freeze({
  hut: Object.freeze([0, 4]),
  greenhouse: Object.freeze([2, -1]),
  gardener: Object.freeze([-2, 8]),
});

const PALETTES = Object.freeze({
  clear: Object.freeze({
    edge: '#4a3c2c',
    edgeShadow: '#24483f',
    timber: '#8b4a3f',
    timberLight: '#b49a66',
    timberDark: '#735044',
    stone: '#777044',
    stoneLight: '#b49a66',
    stoneDark: '#4a3c2c',
    moss: '#3f6a45',
    mossLight: '#71934b',
    flower: '#d6d8bf',
    flowerWarm: '#f5d69a',
    snow: '#e8f0ed',
    snowShadow: '#b7dee0',
  }),
  rain: Object.freeze({
    edge: '#24483f',
    edgeShadow: '#142620',
    timber: '#5d6046',
    timberLight: '#a6b1ae',
    timberDark: '#4a3c2c',
    stone: '#687486',
    stoneLight: '#a6b1ae',
    stoneDark: '#41465c',
    moss: '#687486',
    mossLight: '#70a8b6',
    flower: '#b7dee0',
    flowerWarm: '#d6d8bf',
    snow: '#e8f0ed',
    snowShadow: '#a6b1ae',
  }),
  autumn: Object.freeze({
    edge: '#4a3c2c',
    edgeShadow: '#4a3c2c',
    timber: '#a57554',
    timberLight: '#ed8a45',
    timberDark: '#735044',
    stone: '#777044',
    stoneLight: '#b49a66',
    stoneDark: '#4a3c2c',
    moss: '#5d6046',
    mossLight: '#a57554',
    flower: '#e7ae73',
    flowerWarm: '#ed8a45',
    snow: '#e8f0ed',
    snowShadow: '#d6d8bf',
  }),
  snow: Object.freeze({
    edge: '#41465c',
    edgeShadow: '#24483f',
    timber: '#777044',
    timberLight: '#a6b1ae',
    timberDark: '#4a3c2c',
    stone: '#687486',
    stoneLight: '#a6b1ae',
    stoneDark: '#5d6046',
    moss: '#777044',
    mossLight: '#70a8b6',
    flower: '#e8f0ed',
    flowerWarm: '#d6d8bf',
    snow: '#e8f0ed',
    snowShadow: '#b7dee0',
  }),
});

const WALK_CELLS = Object.freeze([
  Object.freeze([0.35, 5.02]),
  Object.freeze([0.52, 4.55]),
  Object.freeze([0.69, 4.02]),
  Object.freeze([0.80, 3.45]),
  Object.freeze([0.82, 2.86]),
  Object.freeze([0.74, 2.28]),
  Object.freeze([0.68, 1.92]),
]);

const WALK_SIZES = Object.freeze([18, 20, 18, 17, 16, 15, 14]);

function weatherName(value) {
  return Object.prototype.hasOwnProperty.call(PALETTES, value) ? value : 'clear';
}

function finite(value) {
  return Number.isFinite(Number(value));
}

function rounded(value) {
  return Math.round(Number(value) || 0);
}

function usableContext(ctx) {
  return Boolean(ctx && typeof ctx.fillRect === 'function');
}

function setFill(ctx, color) {
  ctx.fillStyle = color;
}

function fill(ctx, x, y, width, height, color) {
  setFill(ctx, color);
  ctx.fillRect(rounded(x), rounded(y), Math.max(1, rounded(width)), Math.max(1, rounded(height)));
}

function line(ctx, a, b, color, width = 1) {
  const distance = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]));
  const steps = Math.max(1, Math.ceil(distance));
  const half = Math.floor(width / 2);
  setFill(ctx, color);
  for (let index = 0; index <= steps; index += 1) {
    const amount = index / steps;
    const x = rounded(a[0] + (b[0] - a[0]) * amount);
    const y = rounded(a[1] + (b[1] - a[1]) * amount);
    ctx.fillRect(x - half, y - half, Math.max(1, width), Math.max(1, width));
  }
}

function pointAlong(a, b, amount) {
  return [a[0] + (b[0] - a[0]) * amount, a[1] + (b[1] - a[1]) * amount];
}

function offset(point, direction, distance) {
  return [point[0] + direction[0] * distance, point[1] + direction[1] * distance];
}

function edgeOutward(a, b, center) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const length = Math.max(1, Math.hypot(dx, dy));
  let normal = [dy / length, -dx / length];
  const middle = pointAlong(a, b, 0.5);
  const towardOutside = (middle[0] - center[0]) * normal[0] + (middle[1] - center[1]) * normal[1];
  if (towardOutside < 0) normal = [-normal[0], -normal[1]];
  return normal;
}

function validPoint(point) {
  return Array.isArray(point) && point.length >= 2 && finite(point[0]) && finite(point[1]);
}

function drawTimberEdge(ctx, a, b, outward, palette, index, edge) {
  line(ctx, offset(a, outward, 3), offset(b, outward, 3), palette.edgeShadow, 6);
  line(ctx, offset(a, outward, 1), offset(b, outward, 1), palette.edge, 5);
  line(ctx, offset(a, outward, 0), offset(b, outward, 0), palette.timber, 3);

  // A few short knots keep the rail hand-built without raising its silhouette.
  const tangent = (() => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const length = Math.max(1, Math.hypot(dx, dy));
    return [dx / length, dy / length];
  })();
  for (const amount of [0.2, 0.52, 0.82]) {
    if ((index + edge + Math.round(amount * 10)) % 3 !== 0) continue;
    const knot = offset(pointAlong(a, b, amount), outward, 2);
    line(
      ctx,
      offset(knot, tangent, -2),
      offset(knot, tangent, 2),
      palette.timberDark,
      2,
    );
  }
  line(ctx, offset(a, outward, -1), offset(b, outward, -1), palette.timberLight, 1);
}

function drawStoneEdge(ctx, a, b, outward, palette, index, edge) {
  line(ctx, offset(a, outward, 3), offset(b, outward, 3), palette.edgeShadow, 6);
  line(ctx, offset(a, outward, 1), offset(b, outward, 1), palette.edge, 5);
  line(ctx, offset(a, outward, 0), offset(b, outward, 0), palette.stone, 4);

  const distance = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const blockCount = Math.max(3, Math.round(distance / 20));
  for (let block = 1; block < blockCount; block += 1) {
    const amount = block / blockCount;
    const seam = offset(pointAlong(a, b, amount), outward, 1);
    line(ctx, offset(seam, outward, -1), offset(seam, outward, 4), palette.stoneDark, 2);
    if ((block + edge + index) % 2 === 0) {
      fill(ctx, seam[0] + 1, seam[1] - 2, 3, 1, palette.stoneLight);
    }
  }
  line(ctx, offset(a, outward, -1), offset(b, outward, -1), palette.stoneLight, 1);
}

function drawCornerMoss(ctx, corner, outward, tangent, palette, weather) {
  const base = offset(corner, outward, 8);
  fill(ctx, base[0] + tangent[0] * 2, base[1] + tangent[1] * 2, 4, 2, palette.moss);
  fill(ctx, base[0] - tangent[0] * 2, base[1] - tangent[1] * 2 - 2, 3, 2, palette.mossLight);
  if (weather === 'rain') fill(ctx, base[0] + outward[0] * 2, base[1] + outward[1] * 2, 2, 2, palette.flower);
  if (weather === 'snow') fill(ctx, base[0] + outward[0] * 2, base[1] + outward[1] * 2, 4, 2, palette.snow);
}

function drawCornerFlower(ctx, corner, outward, tangent, palette, weather, index) {
  const stemStart = offset(corner, outward, 6);
  const stemEnd = offset(corner, outward, 11);
  line(ctx, stemStart, stemEnd, palette.moss, 2);
  const head = offset(corner, outward, 12);
  const sway = ((index % 2) * 2 - 1) * 1.5;
  fill(ctx, head[0] + tangent[0] * (3 + sway), head[1] + tangent[1] * (3 + sway), 3, 2, palette.flower);
  fill(ctx, head[0] - tangent[0] * (3 - sway), head[1] - tangent[1] * (3 - sway) - 2, 3, 2, palette.flowerWarm);
  if (weather === 'snow') fill(ctx, head[0] + outward[0] * 2, head[1] + outward[1] * 2, 4, 2, palette.snow);
}

function drawSnowCaps(ctx, a, b, outward, palette, index, edge, weather) {
  // Snow sits only on the two upper-facing edges of the diamond.  Short caps
  // leave the timber/stone texture visible and never blanket the crop soil.
  if (weather !== 'snow' || (edge !== 0 && edge !== 3)) return 0;
  const tangentX = b[0] - a[0];
  const tangentY = b[1] - a[1];
  const length = Math.max(1, Math.hypot(tangentX, tangentY));
  const tangent = [tangentX / length, tangentY / length];
  let caps = 0;
  for (let block = 0; block < 7; block += 1) {
    if ((block + index + edge) % 3 !== 0) continue;
    const start = 0.08 + block * 0.13;
    const end = Math.min(0.96, start + 0.065 + ((index + block) % 2) * 0.02);
    const left = offset(pointAlong(a, b, start), outward, 2);
    const right = offset(pointAlong(a, b, end), outward, 2);
    line(ctx, left, right, palette.snow, 2);
    line(ctx, offset(left, tangent, 1), offset(right, tangent, 1), palette.snowShadow, 1);
    caps += 1;
  }
  return caps;
}

/**
 * Paint a low raised timber/stone edge around one exact plot diamond.
 * `corners` must use the renderer order returned by `plotCorners`.
 */
export function drawRaisedPlotBorder(ctx, corners, {weatherMode = 'clear', index = 0} = {}) {
  const mode = weatherName(weatherMode);
  const palette = PALETTES[mode];
  if (!usableContext(ctx) || !Array.isArray(corners) || corners.length < 4) {
    return Object.freeze({edges: 0, accents: 0, snowCaps: 0, weatherMode: mode});
  }
  const points = corners.slice(0, 4).map((point) => (
    validPoint(point) ? [Number(point[0]), Number(point[1])] : [NaN, NaN]
  ));
  if (points.some((point) => !validPoint(point))) {
    return Object.freeze({edges: 0, accents: 0, snowCaps: 0, weatherMode: mode});
  }
  const numericIndex = Number.isFinite(Number(index)) ? Math.max(0, Math.round(Number(index))) : 0;
  const center = points.reduce((sum, point) => [sum[0] + point[0] / 4, sum[1] + point[1] / 4], [0, 0]);
  let snowCaps = 0;
  ctx.save?.();
  ctx.imageSmoothingEnabled = false;
  for (let edge = 0; edge < 4; edge += 1) {
    const a = points[edge];
    const b = points[(edge + 1) % 4];
    const outward = edgeOutward(a, b, center);
    if ((numericIndex + edge) % 2 === 0) drawTimberEdge(ctx, a, b, outward, palette, numericIndex, edge);
    else drawStoneEdge(ctx, a, b, outward, palette, numericIndex, edge);
    snowCaps += drawSnowCaps(ctx, a, b, outward, palette, numericIndex, edge, mode);
  }

  const mossCorner = (numericIndex + 2) % 4;
  const flowerCorner = (numericIndex * 3 + 1) % 4;
  const accents = [mossCorner, flowerCorner];
  for (const cornerIndex of accents) {
    const corner = points[cornerIndex];
    const next = points[(cornerIndex + 1) % 4];
    const previous = points[(cornerIndex + 3) % 4];
    const tangentX = next[0] - previous[0];
    const tangentY = next[1] - previous[1];
    const tangentLength = Math.max(1, Math.hypot(tangentX, tangentY));
    const tangent = [tangentX / tangentLength, tangentY / tangentLength];
    const outward = [corner[0] - center[0], corner[1] - center[1]];
    const outwardLength = Math.max(1, Math.hypot(outward[0], outward[1]));
    const normalizedOutward = [outward[0] / outwardLength, outward[1] / outwardLength];
    if (cornerIndex === flowerCorner && mode !== 'snow') {
      drawCornerFlower(ctx, corner, normalizedOutward, tangent, palette, mode, numericIndex + cornerIndex);
    } else {
      drawCornerMoss(ctx, corner, normalizedOutward, tangent, palette, mode);
    }
  }
  ctx.restore?.();
  return Object.freeze({edges: 4, accents: accents.length, snowCaps, weatherMode: mode});
}

function drawStone(ctx, x, baseline, width, height, palette, variant, weather) {
  const stoneWidth = Math.max(10, rounded(width));
  const stoneHeight = Math.max(6, rounded(height));
  const top = rounded(baseline) - stoneHeight;
  const left = rounded(x) - Math.floor(stoneWidth / 2);
  fill(ctx, left - 2, rounded(baseline) - 2, stoneWidth + 4, 3, palette.stoneDark);
  fill(ctx, left + 3, top, stoneWidth - 6, 2, palette.stoneLight);
  fill(ctx, left, top + 2, stoneWidth, 2, palette.stone);
  fill(ctx, left - 1, top + 4, stoneWidth + 2, Math.max(1, stoneHeight - 6), palette.stone);
  fill(ctx, left + 3, rounded(baseline) - 2, stoneWidth - 7, 2, palette.stoneDark);
  const glintX = left + 4 + ((variant * 7) % Math.max(3, stoneWidth - 10));
  fill(ctx, glintX, top + 2, Math.min(6, stoneWidth - 6), 1, palette.stoneLight);
  if (weather === 'snow') {
    const capWidth = Math.min(9, stoneWidth - 4);
    fill(ctx, left + 2 + ((variant % 3) * 2), top - 1, capWidth, 2, palette.snow);
  } else if (weather === 'rain') {
    fill(ctx, left + stoneWidth - 5, top + 3, 2, 3, palette.mossLight);
  } else if (weather === 'autumn') {
    fill(ctx, left + ((variant * 5) % Math.max(4, stoneWidth - 4)), top - 2, 3, 2, palette.flowerWarm);
  }
}

function anchor(iso, cell) {
  const point = iso(cell[0], cell[1]);
  if (!validPoint(point)) throw new TypeError('garden-cottage-details cần iso(col, row) trả về [x, y].');
  return [rounded(point[0]), rounded(point[1])];
}

/**
 * Paint the small stone landing below the hut and a northward curved walk.
 * The final steps stop left/below the greenhouse footprint; the walk also
 * stays well clear of Hagrid's gardener anchor and the cottage detail sprite.
 */
export function drawCottageGround(ctx, {iso, weatherMode = 'clear'} = {}) {
  const mode = weatherName(weatherMode);
  const palette = PALETTES[mode];
  if (!usableContext(ctx)) return Object.freeze({landing: 0, stones: 0, weatherMode: mode});
  if (typeof iso !== 'function') throw new TypeError('garden-cottage-details cần iso(col, row).');

  const hut = anchor(iso, COTTAGE_ANCHORS.hut);
  const greenhouse = anchor(iso, COTTAGE_ANCHORS.greenhouse);
  const gardener = anchor(iso, COTTAGE_ANCHORS.gardener);
  ctx.save?.();
  ctx.imageSmoothingEnabled = false;

  // Hut door/steps: the landing remains above the first plot's north edge.
  drawStone(ctx, hut[0] - 8, hut[1] + 20, 29, 8, palette, 1, mode);
  drawStone(ctx, hut[0] - 12, hut[1] + 28, 36, 9, palette, 2, mode);

  let stones = 2;
  for (let index = 0; index < WALK_CELLS.length; index += 1) {
    const point = anchor(iso, WALK_CELLS[index]);
    drawStone(ctx, point[0], point[1] + 3, WALK_SIZES[index], 7, palette, index + 3, mode);
    stones += 1;
  }

  // These anchors are returned as evidence for integration/QA; they are also
  // intentionally resolved here so a changed iso origin cannot drift the path.
  ctx.restore?.();
  return Object.freeze({
    landing: 1,
    stones,
    weatherMode: mode,
    anchors: Object.freeze({hut, greenhouse, gardener}),
  });
}

export default Object.freeze({drawRaisedPlotBorder, drawCottageGround});
