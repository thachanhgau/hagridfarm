import {GARDEN_PATHS} from './garden-landscape.mjs?v=26.0';

// Neutral ground colours: the terrain cache is weatherized after this layer.
const COLORS = Object.freeze({
  edge: '#4a3c2c',
  earth: '#777044',
  earthLight: '#a57554',
  stone: '#b49a66',
  stoneDark: '#5d6046',
  moss: '#3f6a45',
  mossLight: '#71934b',
});
// A 64×32 stamp is one cell: sliding it along a cell-centre route paints exactly that row of cells.
const MAX_RADIUS = 32;
const DEFAULT_TILE_WIDTH = 64;
const DEFAULT_TILE_HEIGHT = 32;

function numberOr(value, fallback) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

function point(map, col, row) {
  const origin = map?.origin ?? {};
  const width = numberOr(map?.tileWidth, DEFAULT_TILE_WIDTH);
  const height = numberOr(map?.tileHeight, DEFAULT_TILE_HEIGHT);
  return [
    numberOr(origin.x, 0) + (col - row) * width / 2,
    numberOr(origin.y, 0) + (col + row) * height / 2,
  ];
}

// The ground layer renders at the surface density (ctx transform); edges, stair rows and paver corners snap to its
// device pixels (1/density logical). At density 1 every rectangle is the same as the 1× painter's.
function densityOf(ctx) {
  const a = Math.abs(Number(ctx.getTransform?.()?.a));
  return Number.isFinite(a) && a > 0 ? a : 1;
}

function fillAt(ctx, x, y, width, height, color, d = 1) {
  const snap = (v) => Math.round(v * d) / d;
  ctx.fillStyle = color;
  ctx.fillRect(snap(x), snap(y), Math.max(1 / d, snap(width)), Math.max(1 / d, snap(height)));
}

// A shallow, stair-stepped stamp keeps the route one cell wide while
// reading as hand-laid pixel art rather than a smooth vector stroke. A fine stamp steps every device pixel (the HD
// outline, a clean 2:1 edge); the bed keeps the 1× 2 px rows (its plank stripes) and, above density 1, each row
// takes the narrowest outline row it spans so the bed never pokes past the fine outline.
function pathStamp(ctx, x, y, radius, color, d = 1, fine = false) {
  const px = Math.round(x);
  const py = Math.round(y);
  const halfRows = Math.floor(radius / 2);
  const step = fine ? 1 / d : 2, inner = d > 1 ? 2 - 1 / d : 0;
  for (let k = 0, dy = -halfRows; dy <= halfRows + 2 - step; k += 1, dy = -halfRows + k * step) {
    const half = Math.max(2, Math.round((radius - Math.max(Math.abs(dy), fine ? 0 : Math.abs(dy + inner)) * 2) * d) / d);
    fillAt(ctx, px - half, py + dy, half * 2, step, color, d);
  }
}

function routeList(map) {
  const routes = GARDEN_PATHS.slice();
  // Bờ hồ meadow: from the row-7 path through the north fence's openings, straight to the middle of the pond's bank
  // (col 20.5) and of the paddies' bank (col 7.5); both banks are on row −5.5 (default-decor pondHome, pondBedRects).
  if (map?.pondPath) routes.push([[20.5, 7], [20.5, -5.5]], [[7.5, 7], [7.5, -5.5]]);
  if(map?.edgePath)routes.push([[26,16],[44.5,16]]);
  const pens = Array.isArray(map?.pens) ? map.pens : [];
  const rightPens = pens.filter((pen) => (
    Number.isFinite(Number(pen?.col)) && Number(pen.col) >= 26
    && Number.isFinite(Number(pen?.row))
    && Number.isFinite(Number(pen?.height))
  ));
  if (!rightPens.length) return routes;

  // The west-side spine gives the first two pens a continuous approach while
  // the original garden routes remain the authored crop paths.
  routes.push([[26, 2], [26, 22]]);
  for (const pen of rightPens) {
    const entryRow = Number(pen.row) + Number(pen.height) / 2;
    routes.push([[26, entryRow], [Number(pen.col), entryRow]]);
  }
  return routes;
}

/** Return logical path segments used by the painter, useful for geometry QA. */
export function pathSegments(map) {
  return routeList(map).flatMap((route) => route.slice(1).map((end, index) => [route[index], end]));
}

function paintSample(ctx, x, y, normal, sampleIndex, detail, d) {
  if (detail === 'outline') return pathStamp(ctx, x, y, MAX_RADIUS, COLORS.edge, d, true);
  if (!detail) {
    pathStamp(ctx, x, y, MAX_RADIUS, COLORS.edge, d);
    pathStamp(ctx, x, y, 28, COLORS.earth, d);
    return;
  }
  const fill = (...args) => fillAt(...args, d);

  // Flat paver marks stay in the middle third, leaving a readable walking line.
  if (sampleIndex % 3 === 0) {
    const offset = (sampleIndex % 2 ? -2 : 2);
    fill(ctx, x + normal[0] * offset - 3, y + normal[1] * offset - 2, 6, 4, COLORS.stone);
    fill(ctx, x - normal[0] * offset + 1, y - normal[1] * offset - 1, 3, 2, COLORS.earthLight);
  } else if (sampleIndex % 3 === 1) {
    fill(ctx, x - 3, y - 1, 6, 3, COLORS.earthLight);
    fill(ctx, x + 2, y - 1, 2, 2, COLORS.stoneDark);
  }

  // Broken moss/stone pixels sit on the low edge, never in the centre.
  if (sampleIndex % 5 === 0) {
    const side = sampleIndex % 2 ? 1 : -1;
    const distance = 11 + (sampleIndex % 3);
    const edgeX = x + normal[0] * side * distance;
    const edgeY = y + normal[1] * side * distance;
    fill(ctx, edgeX - 2, edgeY - 1, 4, 2, COLORS.moss);
    if (sampleIndex % 10 === 0) fill(ctx, edgeX + side * 3, edgeY + 1, 3, 2, COLORS.mossLight);
  }
  if (sampleIndex % 7 === 2) {
    const edgeX = x - normal[0] * 12;
    const edgeY = y - normal[1] * 12;
    fill(ctx, edgeX - 2, edgeY, 4, 2, COLORS.stoneDark);
  }
}

function paintSegment(ctx, map, start, end, routeIndex, segmentIndex, detail, d) {
  const a = point(map, ...start);
  const b = point(map, ...end);
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const distance = Math.max(1, Math.hypot(dx, dy));
  const normal = [-dy / distance, dx / distance];
  const steps = Math.max(1, Math.ceil(distance / 3));
  for (let index = 0; index <= steps; index += 1) {
    const amount = index / steps;
    const x = a[0] + dx * amount;
    const y = a[1] + dy * amount;
    paintSample(ctx, x, y, normal, routeIndex * 17 + segmentIndex * 7 + index, detail, d);
  }
}

export function drawGardenPathDetails(ctx, map) {
  if (!ctx || typeof ctx.fillRect !== 'function' || !map) return {segments: 0, radius: MAX_RADIUS};
  const segments = pathSegments(map);
  // Finish the continuous bed before placing sparse pavers; later stamps must not erase details.
  const d = densityOf(ctx);
  // At density > 1 the outline is laid first at device resolution; the 1×-row bed and pavers then fill inside it.
  for (const detail of d > 1 ? ['outline', false, true] : [false, true]) segments.forEach(([start, end], index) => paintSegment(ctx, map, start, end, index, 0, detail, d));
  return {segments: segments.length, radius: MAX_RADIUS};
}

export default Object.freeze({drawGardenPathDetails, pathSegments});
