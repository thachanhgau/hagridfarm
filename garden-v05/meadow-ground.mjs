const DEFAULT_TILE_WIDTH = 64;
const DEFAULT_TILE_HEIGHT = 32;
const DEFAULT_MAP_COLUMNS = 32;
const DEFAULT_MAP_ROWS = 26;

/**
 * The natural ground uses the same muted grass colors as tile-grass.png, but
 * paints broad clipped shapes instead of repeating isometric tile edges.
 */
export const NATURAL_MEADOW_PALETTE = Object.freeze({
  base: '#71934b',
  patchDark: '#777044',
  patchMid: '#71934b',
  patchLight: '#71934b',
  tuft: '#3f6a45',
  tuftLight: '#b0bd67',
  flower: '#d6d8bf',
  grid: 'rgba(36,72,63,.42)',
});

function finite(value, fallback) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

function positive(value, fallback) {
  const result = finite(value, fallback);
  return result > 0 ? result : fallback;
}

function tileWidth(map) {
  return positive(map?.tileWidth, DEFAULT_TILE_WIDTH);
}

function tileHeight(map) {
  return positive(map?.tileHeight, DEFAULT_TILE_HEIGHT);
}

function columns(map) {
  return Math.max(1, Math.floor(finite(map?.columns, DEFAULT_MAP_COLUMNS)));
}

function rows(map) {
  return Math.max(1, Math.floor(finite(map?.rows, DEFAULT_MAP_ROWS)));
}

function origin(map) {
  return {
    x: finite(map?.origin?.x, 0),
    y: finite(map?.origin?.y, 0),
  };
}

function iso(map, col, row) {
  const point = origin(map);
  return [
    point.x + (col - row) * tileWidth(map) / 2,
    point.y + (col + row) * tileHeight(map) / 2,
  ];
}

function regionsFor(map) {
  const regions = [{col: -0.5, row: -0.5, width: columns(map), height: rows(map)}];
  for (const raw of Array.isArray(map?.terrainExtensions) ? map.terrainExtensions : []) {
    const region = {
      col: finite(raw?.col, 0) - 0.5,
      row: finite(raw?.row, 0) - 0.5,
      width: positive(raw?.width, 0),
      height: positive(raw?.height, 0),
    };
    if (region.width > 0 && region.height > 0) regions.push(region);
  }
  return regions;
}

function pathRegion(ctx, map, region) {
  const corners = [
    iso(map, region.col, region.row),
    iso(map, region.col + region.width, region.row),
    iso(map, region.col + region.width, region.row + region.height),
    iso(map, region.col, region.row + region.height),
  ];
  ctx.moveTo(corners[0][0], corners[0][1]);
  for (const [x, y] of corners.slice(1)) ctx.lineTo(x, y);
  ctx.closePath();
}

function seedFor(map) {
  const values = [
    columns(map),
    rows(map),
    finite(map?.origin?.x, 0),
    finite(map?.origin?.y, 0),
    tileWidth(map),
    tileHeight(map),
  ];
  let seed = 0x4d454144;
  for (const value of values) {
    seed ^= Math.round(value * 31);
    seed = Math.imul(seed, 0x45d9f3b) >>> 0;
  }
  return seed || 1;
}

function randomSource(seed) {
  let value = seed >>> 0;
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 0x100000000;
  };
}

function randomRegion(regions, random) {
  const total = regions.reduce((sum, area) => sum + area.width * area.height, 0);
  let choice = random() * total;
  const region = regions.find(area => (choice -= area.width * area.height) <= 0) ?? regions.at(-1);
  return {
    col: region.col + random() * region.width,
    row: region.row + random() * region.height,
  };
}

function drawPatch(ctx, x, y, width, height, random, color) {
  const points = 8;
  ctx.beginPath();
  for (let index = 0; index < points; index += 1) {
    const angle = (Math.PI * 2 * index) / points;
    const wobble = 0.76 + random() * 0.42;
    const px = x + Math.cos(angle) * width * wobble;
    const py = y + Math.sin(angle) * height * (0.78 + random() * 0.38);
    if (index === 0) ctx.moveTo(Math.round(px), Math.round(py));
    else ctx.lineTo(Math.round(px), Math.round(py));
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function drawTuft(ctx, x, y, variant = 0) {
  const originX = Math.round(x);
  const originY = Math.round(y);
  ctx.fillStyle = NATURAL_MEADOW_PALETTE.tuft;
  ctx.fillRect(originX - 5, originY - 1, 11, 3);
  ctx.fillRect(originX - 3, originY - 5, 2, 4);
  ctx.fillRect(originX + (variant % 2 ? 2 : 3), originY - 7, 2, 6);
  if (variant % 3 === 0) {
    ctx.fillStyle = NATURAL_MEADOW_PALETTE.tuftLight;
    ctx.fillRect(originX - 1, originY - 5, 2, 2);
  }
}

function drawGrid(ctx, map, regions) {
  ctx.save?.();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = NATURAL_MEADOW_PALETTE.grid;
  ctx.lineWidth = 1;
  const drawn = new Set();
  for (const region of regions) {
    for (let row = region.row; row < region.row + region.height; row += 1) {
      for (let col = region.col; col < region.col + region.width; col += 1) {
        const key = `${col},${row}`;
        if (drawn.has(key)) continue;
        drawn.add(key);
        const [northX, northY] = iso(map, col, row);
        const [eastX, eastY] = iso(map, col + 1, row);
        const [southX, southY] = iso(map, col + 1, row + 1);
        const [westX, westY] = iso(map, col, row + 1);
        ctx.beginPath();
        ctx.moveTo(northX, northY);
        ctx.lineTo(eastX, eastY);
        ctx.lineTo(southX, southY);
        ctx.lineTo(westX, westY);
        ctx.closePath();
        ctx.stroke();
      }
    }
  }
  ctx.restore?.();
}

/**
 * Paint the map and all scenic terrain extensions as one organic grass field.
 * The returned counts are diagnostic only; callers can ignore the value.
 */
export function drawNaturalMeadow(ctx, map, {grid = false, grassImage = null} = {}) {
  if (!ctx || !map || typeof ctx.beginPath !== 'function' || typeof ctx.fill !== 'function') {
    return Object.freeze({regions: 0, patches: 0, tufts: 0});
  }

  const regions = regionsFor(map);
  const random = randomSource(seedFor(map));
  ctx.save?.();
  ctx.imageSmoothingEnabled = false;
  ctx.beginPath();
  for (const region of regions) pathRegion(ctx, map, region);
  ctx.fillStyle = NATURAL_MEADOW_PALETTE.base;
  ctx.fill();

  // Clip every patch and tuft to the union. This keeps the meadow painter
  // scenery-only even when terrainExtensions reach outside the authored map.
  ctx.save?.();
  ctx.beginPath();
  for (const region of regions) pathRegion(ctx, map, region);
  if (typeof ctx.clip === 'function') ctx.clip();

  // Reuse the approved grass pixels, sampling only the tile interior so its
  // shaded diamond edges do not form a repeated grid. The source is unchanged.
  if (grassImage) {
    const width = Math.ceil(Number(map.width) || 2560);
    const height = Math.ceil(Number(map.height) || 1440);
    ctx.globalAlpha = 1;
    for (let y = 0; y < height; y += 8) {
      let x = 0;
      while (x < width) {
        const span = [8, 12, 16][Math.floor(random() * 3)];
        const sx = 16 + Math.floor(random() * (33 - span));
        const sy = 10 + Math.floor(random() * 5);
        ctx.drawImage(grassImage, sx, sy, span, 8, x, y, span, 8);
        x += span;
      }
    }
  }

  let patches = 0;
  const patchColors = [
    NATURAL_MEADOW_PALETTE.patchDark,
    NATURAL_MEADOW_PALETTE.patchMid,
    NATURAL_MEADOW_PALETTE.patchLight,
  ];
  const patchCount = Math.min(42, Math.max(18, Math.ceil((columns(map) * rows(map)) / 24)));
  ctx.globalAlpha = grassImage ? 0.1 : 0.24;
  for (let index = 0; index < patchCount; index += 1) {
    const center = randomRegion(regions, random);
    const [x, y] = iso(map, center.col, center.row);
    const width = 38 + random() * 88;
    const height = 12 + random() * 28;
    drawPatch(ctx, x, y, width, height, random, patchColors[index % patchColors.length]);
    patches += 1;
  }

  let tufts = 0;
  const tuftCount = Math.min(86, Math.max(34, Math.ceil((columns(map) * rows(map)) / 10)));
  ctx.globalAlpha = grassImage ? 0.4 : 0.7;
  for (let index = 0; index < tuftCount; index += 1) {
    const center = randomRegion(regions, random);
    const [x, y] = iso(map, center.col, center.row);
    drawTuft(ctx, x + (random() - 0.5) * 13, y + (random() - 0.5) * 7, index);
    tufts += 1;
  }
  ctx.restore?.();

  if (grid) drawGrid(ctx, map, regions);
  ctx.restore?.();
  return Object.freeze({regions: regions.length, patches, tufts});
}

