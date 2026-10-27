import {nativePixelScale} from './garden-grid.mjs?v=24.9.85';
const DEFAULT_TILE_WIDTH = 64;
const DEFAULT_TILE_HEIGHT = 32;

/**
 * Local-only environment artwork. These files are intentionally kept out of
 * FARM_SCENE so the gameplay map and its save/layout contract remain stable.
 * The dimensions are fallbacks for the missing-asset preview; the renderer
 * replaces them with the loaded image dimensions when an asset is available.
 */
export const FOREST_ASSETS = Object.freeze([
  Object.freeze({id: 'oak', file: 'environment/forest-v06/oak.png', width: 190, height: 176, pivotX: 95, pivotY: 174}),
  Object.freeze({id: 'pine', file: 'environment/forest-v06/pine.png', width: 104, height: 196, pivotX: 52, pivotY: 194}),
  Object.freeze({id: 'grove', file: 'environment/forest-v06/grove.png', width: 190, height: 136, pivotX: 95, pivotY: 134}),
  Object.freeze({id: 'log', file: 'environment/forest-v06/log.png', width: 144, height: 88, pivotX: 72, pivotY: 86}),
]);

export const FOREST_ASSET_FILES = Object.freeze(FOREST_ASSETS.map((asset) => asset.file));

const ASSET_BY_ID = new Map(FOREST_ASSETS.map((asset) => [asset.id, asset]));
const FLOOR_COLORS = Object.freeze([
  '#142620',
  '#142620',
  '#142620',
  '#24483f',
  '#24483f',
]);

function finite(value, fallback) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

function sceneWidth(scene) {
  return finite(scene?.width, 2400);
}

function sceneHeight(scene) {
  return finite(scene?.height, 1280);
}

function tileWidth(scene) {
  return finite(scene?.tileWidth, DEFAULT_TILE_WIDTH);
}

function tileHeight(scene) {
  return finite(scene?.tileHeight, DEFAULT_TILE_HEIGHT);
}

function sceneOrigin(scene) {
  return {
    x: finite(scene?.origin?.x, 0),
    y: finite(scene?.origin?.y, 0),
  };
}

function columns(scene) {
  return Math.max(1, Math.floor(finite(scene?.columns, 32)));
}

function rows(scene) {
  return Math.max(1, Math.floor(finite(scene?.rows, 26)));
}

function iso(col, row, scene) {
  const origin = sceneOrigin(scene);
  return [
    origin.x + (col - row) * (tileWidth(scene) / 2),
    origin.y + (col + row) * (tileHeight(scene) / 2),
  ];
}

function cellAt(x, y, scene) {
  const origin = sceneOrigin(scene);
  const halfWidth = tileWidth(scene) / 2;
  const halfHeight = tileHeight(scene) / 2;
  const dx = x - origin.x;
  const dy = y - origin.y;
  return {
    col: (dx / halfWidth + dy / halfHeight) / 2,
    row: (dy / halfHeight - dx / halfWidth) / 2,
  };
}

/** Screen-space corners of the authored playable isometric diamond. */
export function playableDiamond(scene = {}) {
  const corners = [
    iso(0, 0, scene),
    iso(columns(scene), 0, scene),
    iso(columns(scene), rows(scene), scene),
    iso(0, rows(scene), scene),
  ];
  return Object.freeze({
    corners,
    left: Math.min(...corners.map(([x]) => x)),
    right: Math.max(...corners.map(([x]) => x)),
    top: Math.min(...corners.map(([, y]) => y)),
    bottom: Math.max(...corners.map(([, y]) => y)),
  });
}

function rectCellBounds(rect, scene) {
  const corners = [
    [rect.left, rect.top],
    [rect.right, rect.top],
    [rect.right, rect.bottom],
    [rect.left, rect.bottom],
  ].map(([x, y]) => cellAt(x, y, scene));
  return {
    minCol: Math.min(...corners.map((point) => point.col)),
    maxCol: Math.max(...corners.map((point) => point.col)),
    minRow: Math.min(...corners.map((point) => point.row)),
    maxRow: Math.max(...corners.map((point) => point.row)),
  };
}

/**
 * A forest sprite is safe when its complete screen rectangle lives on one
 * side of the playable diamond. This is stronger than checking only the
 * ground anchor and keeps canopies clear after any future plot/pen remap.
 */
export function forestRectOutsidePlayable(rect, scene = {}, clearance = 0) {
  if (!rect || ![rect.left, rect.top, rect.right, rect.bottom].every(Number.isFinite)) return false;
  const bounds = rectCellBounds(rect, scene);
  const margin = finite(clearance, 0);
  const outsideFarm = bounds.maxCol < -margin
    || bounds.minCol > columns(scene) + margin
    || bounds.maxRow < -margin
    || bounds.minRow > rows(scene) + margin;
  return outsideFarm && (scene.terrainExtensions ?? []).every((area) => (
    bounds.maxCol < area.col - 0.5 - margin
    || bounds.minCol > area.col + area.width - 0.5 + margin
    || bounds.maxRow < area.row - 0.5 - margin
    || bounds.minRow > area.row + area.height - 0.5 + margin
  ));
}

function hash(seed) {
  let value = (Number(seed) >>> 0) || 1;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  return (value >>> 0) / 4294967296;
}

function nextRandom(state) {
  state.value = (1664525 * state.value + 1013904223) >>> 0;
  return state.value / 4294967296;
}

function sizeFor(assetId, sizes) {
  const fallback = ASSET_BY_ID.get(assetId) ?? FOREST_ASSETS[0];
  const supplied = sizes?.[assetId] ?? sizes?.[fallback.file];
  return {
    width: Math.max(1, finite(supplied?.width, fallback.width)),
    height: Math.max(1, finite(supplied?.height, fallback.height)),
  };
}

function scaleFor(assetId, random) {
  if (assetId === 'oak' || assetId === 'pine') {
    const sizeBand = random();
    if (sizeBand < 0.045) return 1.8 + random() * 0.4;
    if (sizeBand < 0.16) return 0.6 + random() * 0.2;
    return 0.8 + random() * 0.55;
  }
  return 0.65 + random() * 0.55;
}

function rectFor(x, y, size, scale = 1) {
  const width = size.width * scale;
  const height = size.height * scale;
  return {
    left: x - width / 2,
    top: y - height,
    right: x + width / 2,
    bottom: y,
  };
}

function outsideGap(rect, scene) {
  const bounds = rectCellBounds(rect, scene);
  const gaps = [
    -bounds.maxCol,
    bounds.minCol - columns(scene),
    -bounds.maxRow,
    bounds.minRow - rows(scene),
  ].filter((gap) => gap > 0);
  return gaps.length ? Math.min(...gaps) : 0;
}

function isSouthwestEntranceGap(x, y, scene) {
  // Leave a small clearing around the authored gate approach. The gate itself
  // remains in FARM_SCENE; this only suppresses forest roots in its exterior
  // arrival wedge.
  const width = sceneWidth(scene);
  const height = sceneHeight(scene);
  return x > width * 0.24 && x < width * 0.42 && y > height * 0.79;
}

function forestBand(x, y, scene) {
  const width = sceneWidth(scene);
  const height = sceneHeight(scene);
  if (y < height * 0.24) return 'north';
  if (y > height * 0.78) return 'south';
  if (x < width * 0.24) return 'west';
  if (x > width * 0.76) return 'east';
  return 'outer';
}

// A coarse field makes neighboring candidates share clearings while the
// smaller wave and anchor jitter keep each clearing irregular. It is seeded
// independently from the candidate traversal so changing the grid step does
// not reshuffle the authored world in surprising ways.
function clusterField(x, y, seed) {
  const cellX = Math.floor((x + 120) / 240);
  const cellY = Math.floor((y + 120) / 240);
  const coarseSeed = (seed ^ Math.imul(cellX, 0x9e3779b9) ^ Math.imul(cellY, 0x85ebca6b)) >>> 0;
  const coarse = hash(coarseSeed);
  const broad = 0.5 + 0.5 * Math.sin(cellX * 0.73 + cellY * 1.17 + seed * 0.000001);
  const fine = 0.5 + 0.5 * Math.sin(x * 0.0047 - y * 0.0031 + seed * 0.000002);
  return coarse * 0.58 + broad * 0.24 + fine * 0.18;
}

function chooseAsset(random, band) {
  // Ancient canopy is mostly oak and pine; low grove/log silhouettes remain
  // sparse accents instead of determining the forest silhouette.
  if (random < 0.06) return 'log';
  if (random < 0.14) return 'grove';
  if (random < 0.57) return 'pine';
  return 'oak';
}

function candidateFor(x, y, sequence, state, scene) {
  const band = forestBand(x, y, scene);
  const choice = chooseAsset(nextRandom(state), band);
  const rawScale = scaleFor(choice, () => nextRandom(state));
  const scale = nativePixelScale(rawScale);
  const size = sizeFor(choice, state.sizes);
  const anchorX = Math.round(x);
  const anchorY = Math.round(y);
  const rect = rectFor(anchorX, anchorY, size, scale);
  const gap = outsideGap(rect, scene);
  const edgeDistance = Math.min(x, y, sceneWidth(scene) - x, sceneHeight(scene) - y);
  const edgeLight = Math.min(1, Math.max(0, edgeDistance / 240));
  const clearing = Math.min(1, gap / 9);
  const opacity = 0.55 + edgeLight * 0.13 + clearing * 0.2 + nextRandom(state) * 0.08;
  return {
    id: `forest-${sequence}`,
    assetId: choice,
    scale: Math.round(scale * 1000) / 1000,
    x: anchorX,
    y: anchorY,
    xy: [anchorX, anchorY],
    rect,
    opacity: Math.round(Math.min(0.96, opacity) * 100) / 100,
    band,
  };
}

/**
 * Build the fixed forest perimeter once per renderer. The seed and candidate
 * order are stable, so animation frames never reshuffle the environment.
 */
export function createForestSurround(scene = {}, options = {}) {
  const seed = Number(options.seed ?? 0x48414752) >>> 0;
  const state = {
    value: seed || 1,
    sizes: options.assetSizes ?? null,
  };
  const placements = [];
  const roots = [];
  const width = sceneWidth(scene);
  const height = sceneHeight(scene);
  const step = Math.max(42, finite(options.gridStep, 52));
  const rootSpacing = Math.max(55, finite(options.rootSpacing, 60));
  const density = Math.min(1, Math.max(0.2, finite(options.density, 1)));
  const maxPlacements = Math.max(180, Math.floor(finite(options.maxPlacements, 520)));
  let sequence = 0;
  const eligible = [];

  for (let y = -step; y <= height + step; y += step) {
    for (let x = -step; x <= width + step; x += step) {
      const jitterX = (nextRandom(state) - 0.5) * Math.min(26, step * 0.42);
      const jitterY = (nextRandom(state) - 0.5) * Math.min(26, step * 0.42);
      const candidateX = x + jitterX;
      const candidateY = y + jitterY;
      const clusterThreshold = 0.34 + (1 - density) * 0.28;
      if (clusterField(candidateX, candidateY, seed) < clusterThreshold) {
        sequence += 1;
        continue;
      }
      const candidate = candidateFor(candidateX, candidateY, sequence, state, scene);
      sequence += 1;
      if (!forestRectOutsidePlayable(candidate.rect, scene, 0.12)) continue;
      // Keep complete giant silhouettes inside the raster; cropped canopies
      // at the world edge make the ring look like a hard sprite boundary.
      if (candidate.rect.left < 16 || candidate.rect.top < 16 || candidate.rect.right > width - 16 || candidate.rect.bottom > height - 16) continue;
      if (isSouthwestEntranceGap(candidate.x, candidate.y, scene)) continue;
      eligible.push(candidate);
    }
  }

  // Select one perimeter band at a time after the full candidate pass. This
  // keeps the cap from consuming the north rows before west/east/south exist.
  const bandOrder = ['north', 'east', 'south', 'west', 'outer'];
  const buckets = new Map(bandOrder.map((band) => [band, []]));
  for (const candidate of eligible) (buckets.get(candidate.band) ?? buckets.get('outer')).push(candidate);
  for (const bucket of buckets.values()) bucket.sort((left, right) => (
    outsideGap(left.rect, scene) - outsideGap(right.rect, scene)
    || Number(left.id.slice(7)) - Number(right.id.slice(7))
  ));
  const ordered = [];
  for (let index = 0; ; index += 1) {
    let added = false;
    for (const band of bandOrder) {
      const candidate = buckets.get(band)?.[index];
      if (!candidate) continue;
      ordered.push(candidate);
      added = true;
    }
    if (!added) break;
  }
  for (const candidate of ordered) {
    if (roots.some(([rootX, rootY]) => Math.hypot(candidate.x - rootX, candidate.y - rootY) < rootSpacing)) continue;
    placements.push(candidate);
    roots.push([candidate.x, candidate.y]);
    if (placements.length >= maxPlacements) break;
  }

  return Object.freeze({
    seed,
    assets: FOREST_ASSETS,
    files: FOREST_ASSET_FILES,
    placements: Object.freeze(placements.map((placement) => Object.freeze(placement))),
    playable: playableDiamond(scene),
  });
}

export const forestPlacements = createForestSurround;

function floorHash(index) {
  return hash(0x9e3779b9 + index * 0x85ebca6b);
}

/** Paint the cached, non-interactive forest floor under the isometric tiles. */
export function drawForestFloor(context, width, height) {
  if (!context || typeof context.fillRect !== 'function') return;
  const canvasWidth = Math.max(1, Math.floor(finite(width, 2400)));
  const canvasHeight = Math.max(1, Math.floor(finite(height, 1280)));
  context.save?.();
  context.fillStyle = FLOOR_COLORS[0];
  context.fillRect(0, 0, canvasWidth, canvasHeight);

  // Broad, fixed bands keep the margins from reading as a single empty void.
  const bandHeight = 96;
  for (let row = 0, y = 0; y < canvasHeight; row += 1, y += bandHeight) {
    context.fillStyle = FLOOR_COLORS[1 + (row % (FLOOR_COLORS.length - 1))];
    context.globalAlpha = 0.28;
    context.fillRect(0, y, canvasWidth, bandHeight + 1);
  }

  // Small fixed floor patches add depth while remaining cheap because the
  // result is built once and reused by both the normal and grid terrain cache.
  context.globalAlpha = 0.34;
  for (let index = 0; index < 96; index += 1) {
    const randomX = floorHash(index * 3 + 1);
    const randomY = floorHash(index * 3 + 2);
    const randomSize = floorHash(index * 3 + 3);
    context.fillStyle = FLOOR_COLORS[1 + (index % (FLOOR_COLORS.length - 1))];
    context.fillRect(
      Math.floor(randomX * canvasWidth),
      Math.floor(randomY * canvasHeight),
      28 + Math.floor(randomSize * 112),
      8 + Math.floor(randomSize * 34),
    );
  }
  context.globalAlpha = 1;
  context.restore?.();
}
