import {GARDEN_PATHS} from './garden-landscape.mjs?v=24.9.72';

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
const MAX_RADIUS = 17;
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

function fill(ctx, x, y, width, height, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(width)), Math.max(1, Math.round(height)));
}

// A shallow, stair-stepped stamp keeps the existing 17px route radius while
// reading as hand-laid pixel art rather than a smooth vector stroke.
function pathStamp(ctx, x, y, radius, color) {
  const px = Math.round(x);
  const py = Math.round(y);
  const halfRows = Math.floor(radius / 2);
  for (let dy = -halfRows; dy <= halfRows; dy += 2) {
    const half = Math.max(2, Math.round(radius - Math.abs(dy) * 2));
    fill(ctx, px - half, py + dy, half * 2, 2, color);
  }
}

function routeList(map) {
  const routes = GARDEN_PATHS.slice();
  const pens = Array.isArray(map?.pens) ? map.pens : [];
  const rightPens = pens.filter((pen) => (
    Number.isFinite(Number(pen?.col)) && Number(pen.col) >= 26
    && Number.isFinite(Number(pen?.row))
    && Number.isFinite(Number(pen?.height))
  ));
  if (!rightPens.length) return routes;

  // The west-side spine gives the first two pens a continuous approach while
  // the original garden routes remain the authored crop paths.
  routes.push([[26, 1.5], [26, 21.5]]);
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

function paintSample(ctx, x, y, normal, sampleIndex, detail) {
  if (!detail) {
  pathStamp(ctx, x, y, MAX_RADIUS, COLORS.edge);
  pathStamp(ctx, x, y, 13, COLORS.earth);
    return;
  }

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

function paintSegment(ctx, map, start, end, routeIndex, segmentIndex, detail) {
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
    paintSample(ctx, x, y, normal, routeIndex * 17 + segmentIndex * 7 + index, detail);
  }
}

export function drawGardenPathDetails(ctx, map) {
  if (!ctx || typeof ctx.fillRect !== 'function' || !map) return {segments: 0, radius: MAX_RADIUS};
  const segments = pathSegments(map);
  // Finish the continuous bed before placing sparse pavers; later stamps must not erase details.
  for (const detail of [false, true]) segments.forEach(([start, end], index) => paintSegment(ctx, map, start, end, index, 0, detail));
  return {segments: segments.length, radius: MAX_RADIUS};
}

export default Object.freeze({drawGardenPathDetails, pathSegments});
