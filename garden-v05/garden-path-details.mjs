import {GARDEN_PATHS} from './garden-landscape.mjs?v=26.2';
import {densityOf, fillAt} from './device-pixels.mjs?v=26.2';

// Neutral ground colours: the terrain cache is weatherized after this layer.
const COLORS = Object.freeze({
  edge: '#4a3c2c',
  earth: '#777044',
  earthLight: '#a57554',
  stone: '#b49a66',
  stoneDark: '#5d6046',
  moss: '#3f6a45',
  mossLight: '#71934b',
  stoneLight: '#d6d8bf',
  earthDark: '#735044',
  rust: '#c97952',
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

// A shallow, stair-stepped stamp keeps the route one cell wide while
// reading as hand-laid pixel art rather than a smooth vector stroke. A fine stamp steps every device pixel (the HD
// outline, a clean 2:1 edge); the bed keeps the 1× 2 px rows (its plank stripes) and, above density 1, each row
// takes the narrowest outline row it spans so the bed never pokes past the fine outline.
// The ground cache stamps thousands of these (one fillRect a device row each), which froze the garden on entry. A stamp
// lands on whole logical pixels, so at a whole density under a plain scale it is the same pixels every time: draw it
// once and copy it. Other contexts (tests, a fractional density, the world-anchored bed pattern) fill directly.
const stampSprites = new Map();
function stampSprite(ctx, radius, color, d, fine) {
  const t = ctx.getTransform?.(), doc = ctx.canvas?.ownerDocument;
  if (typeof color !== 'string' || !doc || !Number.isInteger(d) || !t || t.a !== d || t.d !== d || t.b || t.c || !Number.isInteger(t.e) || !Number.isInteger(t.f)) return null;
  const key = `${radius}|${color}|${d}|${fine}`;
  if (!stampSprites.has(key)) {
    const halfRows = Math.floor(radius / 2), sprite = doc.createElement('canvas');
    sprite.width = 2 * radius * d; sprite.height = (2 * halfRows + 2) * d;
    const brush = sprite.getContext('2d'); brush.setTransform(d, 0, 0, d, 0, 0);
    stampRows(brush, radius, halfRows, radius, color, d, fine);
    stampSprites.set(key, sprite);
  }
  return stampSprites.get(key);
}
const stampShapes = new Map();
function stampShape(radius, d, fine) {
  if (typeof Path2D !== 'function' || typeof DOMMatrix !== 'function' || !Number.isInteger(d)) return null;
  const key = `${radius}|${d}|${fine}`;
  if (!stampShapes.has(key)) {
    const shape = new Path2D();
    stampRows({set fillStyle(_) {}, fillRect: (x, y, w, h) => shape.rect(x, y, w, h)}, 0, 0, radius, null, d, fine);
    stampShapes.set(key, shape);
  }
  return stampShapes.get(key);
}
function stampRows(ctx, px, py, radius, color, d, fine) {
  const halfRows = Math.floor(radius / 2);
  const step = fine ? 1 / d : 2, inner = d > 1 ? 2 - 1 / d : 0;
  for (let k = 0, dy = -halfRows; dy <= halfRows + 2 - step; k += 1, dy = -halfRows + k * step) {
    const half = Math.max(2, Math.round((radius - Math.max(Math.abs(dy), fine ? 0 : Math.abs(dy + inner)) * 2) * d) / d);
    fillAt(ctx, px - half, py + dy, half * 2, step, color, d);
  }
}
function pathStamp(ctx, x, y, radius, color, d = 1, fine = false) {
  const px = Math.round(x), py = Math.round(y), sprite = stampSprite(ctx, radius, color, d, fine);
  if (!sprite) {
    // The bed pattern is anchored to the world, so it cannot be copied: one fill of the stamp's outline instead.
    const shape = typeof color !== 'string' && stampShape(radius, d, fine);
    if (!shape || typeof ctx.fill !== 'function') return stampRows(ctx, px, py, radius, color, d, fine);
    const placed = new Path2D(); placed.addPath(shape, new DOMMatrix([1, 0, 0, 1, px, py]));
    ctx.fillStyle = color; return ctx.fill(placed);
  }
  const halfRows = Math.floor(radius / 2);
  ctx.drawImage(sprite, px - radius, py - halfRows, 2 * radius, 2 * halfRows + 2);
}

// HD bed (density > 1): the 1× look (olive dashes in rows on the dark bed) at device pixels: 2 px dashes on a 4 px
// row pitch, each row's dashes shifted along the path's 2:1 diagonal ('col' paths run down-right, 'row' paths
// down-left: the tile mirrored). The tile is global-anchored, so overlapping stamps and crossings stay seamless and no
// stripes come from stamp interference.
const DASHES = [[0, 10], [13, 20], [23, 29]], DASH_PERIOD = 32, ROW_JITTER = [0, 3, 1, 4];
export function bedTile(dir = 'col') {
  const width = DASH_PERIOD, height = 16, data = new Uint8ClampedArray(width * height * 4);
  const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const [edge, earth, dark] = [COLORS.edge, COLORS.earth, COLORS.earthDark].map(rgb);
  for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) {
    const X = dir === 'row' ? width - 1 - x : x, row = Math.floor(y / 4);
    const s = ((X - 8 * row + ROW_JITTER[row]) % DASH_PERIOD + DASH_PERIOD) % DASH_PERIOD;
    const dash = y % 4 < 2 && DASHES.find(([from, to]) => s >= from && s < to);
    // The dash's last pixel on its lower line is shaded, a hint of depth.
    const color = !dash ? edge : y % 4 === 1 && s === dash[1] - 1 ? dark : earth;
    data.set([...color, 255], (y * width + x) * 4);
  }
  return {width, height, data};
}

function bedPattern(ctx, dir, d) {
  const make = globalThis.OffscreenCanvas ? (w, h) => new OffscreenCanvas(w, h) : (w, h) => Object.assign(globalThis.document?.createElement?.('canvas') ?? {}, {width: w, height: h});
  try {
    const tile = bedTile(dir), canvas = make(tile.width, tile.height);
    canvas.getContext('2d').putImageData(new ImageData(tile.data, tile.width, tile.height), 0, 0);
    const pattern = ctx.createPattern(canvas, 'repeat');
    pattern.setTransform(new DOMMatrix([1 / d, 0, 0, 1 / d, 0, 0]));
    return pattern;
  } catch { return COLORS.earth; }
}

// A paver at device pixels: 1 px dark joint with clipped corners, lit top row, shaded bottom row.
function paver(ctx, x, y, width, height, base, light, shade, d) {
  const p = 1 / d, fill = (...args) => fillAt(ctx, ...args, d);
  fill(x + p, y, width - 2 * p, height, COLORS.edge);
  fill(x, y + p, width, height - 2 * p, COLORS.edge);
  fill(x + p, y + p, width - 2 * p, height - 2 * p, base);
  fill(x + 2 * p, y + p, width - 4 * p, p, light);
  fill(x + p, y + height - 2 * p, width - 2 * p, p, shade);
}

// A moss tuft at device pixels inside the 1× footprint: a low mound, lit specks on top.
function tuft(ctx, x, y, width, height, base, light, d) {
  const p = 1 / d, fill = (...args) => fillAt(ctx, ...args, d);
  fill(x, y + height - 2 * p, width, 2 * p, base);
  fill(x + p, y + p, width - 2 * p, height - 3 * p, base);
  fill(x + 2 * p, y, width - 4 * p, p, base);
  fill(x + 2 * p, y + p, p, p, light);
  fill(x + width - 3 * p, y + 2 * p, p, p, light);
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

function paintSample(ctx, x, y, normal, sampleIndex, detail, d, bed) {
  if (detail === 'outline') return pathStamp(ctx, x, y, MAX_RADIUS, COLORS.edge, d, true);
  if (detail === 'bed') return pathStamp(ctx, x, y, 28, bed, d, true);
  if (d > 1) return paintHdDetail(ctx, x, y, normal, sampleIndex, d);
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

// The 1× layout below at device pixels: same spots, sizes and colours, with joints and shading.
function paintHdDetail(ctx, x, y, normal, sampleIndex, d) {
  if (sampleIndex % 3 === 0) {
    const offset = (sampleIndex % 2 ? -2 : 2);
    paver(ctx, x + normal[0] * offset - 3, y + normal[1] * offset - 2, 6, 4, COLORS.stone, COLORS.stoneLight, COLORS.earthLight, d);
    paver(ctx, x - normal[0] * offset + 1, y - normal[1] * offset - 1, 3, 2, COLORS.earthLight, COLORS.rust, COLORS.earthDark, d);
  } else if (sampleIndex % 3 === 1) {
    paver(ctx, x - 3, y - 1, 6, 3, COLORS.earthLight, COLORS.rust, COLORS.earthDark, d);
    paver(ctx, x + 2, y - 1, 2, 2, COLORS.stoneDark, COLORS.stone, COLORS.edge, d);
  }
  if (sampleIndex % 5 === 0) {
    const side = sampleIndex % 2 ? 1 : -1;
    const distance = 11 + (sampleIndex % 3);
    const edgeX = x + normal[0] * side * distance;
    const edgeY = y + normal[1] * side * distance;
    tuft(ctx, edgeX - 2, edgeY - 1, 4, 2, COLORS.moss, COLORS.mossLight, d);
    if (sampleIndex % 10 === 0) tuft(ctx, edgeX + side * 3, edgeY + 1, 3, 2, COLORS.mossLight, COLORS.stoneLight, d);
  }
  if (sampleIndex % 7 === 2) paver(ctx, x - normal[0] * 12 - 2, y - normal[1] * 12, 4, 2, COLORS.stoneDark, COLORS.stone, COLORS.edge, d);
}

function paintSegment(ctx, map, start, end, routeIndex, segmentIndex, detail, d) {
  const a = point(map, ...start);
  const b = point(map, ...end);
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const distance = Math.max(1, Math.hypot(dx, dy));
  const normal = [-dy / distance, dx / distance];
  const steps = Math.max(1, Math.ceil(distance / 3));
  const bed = detail === 'bed' ? (d > 1 && typeof ctx.createPattern === 'function' ? bedPattern(ctx, dx * dy < 0 ? 'row' : 'col', d) : COLORS.earth) : null;
  for (let index = 0; index <= steps; index += 1) {
    const amount = index / steps;
    const x = a[0] + dx * amount;
    const y = a[1] + dy * amount;
    paintSample(ctx, x, y, normal, routeIndex * 17 + segmentIndex * 7 + index, detail, d, bed);
  }
}

export function drawGardenPathDetails(ctx, map) {
  if (!ctx || typeof ctx.fillRect !== 'function' || !map) return {segments: 0, radius: MAX_RADIUS};
  const segments = pathSegments(map);
  // Finish the continuous bed before placing sparse pavers; later stamps must not erase details.
  const d = densityOf(ctx);
  // At density > 1 the outline, the sett bed and the shaded pavers are all laid at device pixels.
  for (const detail of d > 1 ? ['outline', 'bed', true] : [false, true]) segments.forEach(([start, end], index) => paintSegment(ctx, map, start, end, index, 0, detail, d));
  return {segments: segments.length, radius: MAX_RADIUS};
}

export default Object.freeze({drawGardenPathDetails, pathSegments});
