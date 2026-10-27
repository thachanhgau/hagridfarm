import {drawPlacementGrid} from './placement-grid.mjs?v=24.9.87';
import {isDefaultDecorHidden,decorationPlacements,defaultDecorSpot,DECORATION_LAYOUT} from './default-decor.mjs?v=24.9.87';
import {gardenObjectMetrics} from './garden-object-metrics.mjs?v=24.9.87';
import {FARM_LAYOUT,ISO_TILE,nativePixelScale,worldToGrid,tileWidth,tileHeight,iso,worldToCell,plotBounds,plotCellScale,plotCellPosition,plotPhysicalBounds} from './garden-grid.mjs?v=24.9.87';
export {FARM_LAYOUT,ISO_TILE,iso,worldToCell,plotCellScale,plotCellPosition,plotPhysicalBounds} from './garden-grid.mjs?v=24.9.87';
import {creatureView,creatureViewFrames} from './creature-view.mjs?v=24.9.87';
import {COMPLETE_SCENERY,KEEPSAKE_ART,completeObjectFiles} from './complete-object-art.mjs?v=24.9.87';
import {forestRectOutsideBoundary} from './forest-clearance.mjs?v=24.9.87';
import {runtimeImageUrl} from './runtime-image-url.mjs?v=24.9.87';
import {habitatResidents,drawHabitatProps,drawHabitatMotion} from './garden-creature-habitats.mjs?v=24.9.87';
import {drawGardenPathDetails} from './garden-path-details.mjs?v=24.9.87';
import {drawPenHabitat,penFencePieces,drawPenFence} from './garden-pen-details.mjs?v=24.9.87';
import {drawRaisedPlotBorder,drawCottageGround} from './garden-cottage-details.mjs?v=24.9.87';
import {FESTIVAL_FILES,festivalObjects,weatherizeCanvas,drawSeasonalFence,drawRoofWeather,drawHeroMotion} from './garden-seasonal-world.mjs?v=24.9.87';
import {drawV24Ground} from './garden-v24-scenery.mjs?v=24.9.87';
import {FARM_SIGN_ART,canopyClusters,forestExitTrail,backdropExitTrail,overlapsTrail,drawExitTrail} from './forest-composition.mjs?v=24.9.87';
import {drawScenicTerrain,drawScenicBackdrop} from './scenic-terrain.mjs?v=24.9.87';
import {decorObjects} from './decor-runtime.mjs?v=24.9.87';
import {wizardObjects,wizardTargets} from './wizard-scenery.mjs?v=24.9.87';
import {atmosphereConfig,weatherConfig,drawAtmosphereOverlay,hagridSpeechFor,drawHagridSpeechBubble,drawCreatureBubble} from './garden-atmosphere.mjs?v=24.9.87';
import {drawEventOverlay} from './garden-events.mjs?v=24.9.87';
import {drawNaturalMeadow} from './meadow-ground.mjs?v=24.9.87';
import {insideFarm, createBoundaryFence, drawBoundaryFence, drawMeadowDetails} from './garden-landscape.mjs?v=24.9.87';
import {GARDEN_STAGES,gardenStage,stageBoundary,stageContains,stageWorldBounds,futureGroves,keepsakeAnchorRow} from './garden-growth.mjs?v=24.9.87';
import {earnedDecorArt,earnedDecorFiles,drawEarnedDecorSprite} from './earned-decor-sprites.mjs?v=24.9.87';
import {KEEPSAKE_DISPLAY_LAYOUT,KEEPSAKE_LEGACY_LAYOUT,keepsakeAnchor,keepsakeDisplayPlacements} from './decor-placement-geometry.mjs?v=24.9.87';
import {CREATURE, DB, growth, nowFor} from './progression-engine.mjs?v=24.9.87';
import {
  animationFrameAt,
  idleFrameAt,
  createAnimationRuntime,
  creatureMotion,
  cropBreeze,
  decorFrameAt,
  eventHop,
  harvestPop,
  selectAnimation,
  stableHash,
} from './scene-animation.mjs?v=24.9.87';
import {
  FOREST_ASSETS,
  FOREST_ASSET_FILES,
  createForestSurround,
} from './forest-surround.mjs?v=24.9.87';

const root = typeof window === 'undefined' ? globalThis : window;
const map = root.FARM_SCENE;
const motion = root.FARM_MOTION;
const layoutSnapshots = new WeakMap();



/** Map a pointer coordinate through the canvas' transformed client rectangle. */
export function clientToWorld(clientX, clientY, rect, canvasWidth, canvasHeight) {
  const width = Number(rect?.width) || Number(canvasWidth) || 1;
  const height = Number(rect?.height) || Number(canvasHeight) || 1;
  return {
    x: (clientX - (Number(rect?.left) || 0)) * (Number(canvasWidth) || width) / width,
    y: (clientY - (Number(rect?.top) || 0)) * (Number(canvasHeight) || height) / height,
  };
}

function clipToStage(context, stage, scene, draw) {
  context.save?.();
  const points = stageBoundary(stage).map(([col, row]) => iso(col, row, scene));
  context.beginPath();
  context.moveTo(points[0][0], points[0][1]);
  for (const [x, y] of points.slice(1)) context.lineTo(x, y);
  context.closePath();
  context.clip?.();
  try {
    draw();
  } finally {
    context.restore?.();
  }
}

/** Plot cells are centered on integer coordinates, including their soil tiles. */
export function plotCorners(plot, scene = map) {
  const bounds = plotPhysicalBounds(plot, scene);
  const col = bounds.col, row = bounds.row;
  return [
    iso(col, row, scene),
    iso(col + bounds.width, row, scene),
    iso(col + bounds.width, row + bounds.height, scene),
    iso(col, row + bounds.height, scene),
  ];
}

function clonePositions(positions) {
  if (!positions || typeof positions !== 'object' || Array.isArray(positions)) return positions;
  return Object.fromEntries(Object.entries(positions).map(([key, value]) => (
    [key, Array.isArray(value) ? value.slice() : value]
  )));
}

function clonePlotSlot(plot) {
  return {
    ...plot,
    positions: clonePositions(plot?.positions),
  };
}

function clonePenSlot(pen) {
  return {
    ...pen,
    spots: Array.isArray(pen?.spots) ? pen.spots.map((spot) => (Array.isArray(spot) ? spot.slice() : spot)) : pen?.spots,
  };
}

function snapshotLayoutScene(scene) {
  return {
    plots: asArray(scene?.plots).map(clonePlotSlot),
    pens: asArray(scene?.pens).map(clonePenSlot),
    creatureSpots: asArray(scene?.creatureSpots).map((spot) => (Array.isArray(spot) ? spot.slice() : spot)),
  };
}

function authoredLayoutScene(scene) {
  if (!layoutSnapshots.has(scene)) layoutSnapshots.set(scene, snapshotLayoutScene(scene));
  return layoutSnapshots.get(scene);
}

function validPermutation(raw, length) {
  if (!Array.isArray(raw) || raw.length !== length) return Array.from({length}, (_, index) => index);
  const seen = new Set();
  for (const value of raw) {
    if (!Number.isInteger(value) || value < 0 || value >= length || seen.has(value)) {
      return Array.from({length}, (_, index) => index);
    }
    seen.add(value);
  }
  return raw.slice();
}

/**
 * Project logical plots, pens, and creature spots onto their authored slots.
 * The input scene is never mutated; callers can safely use the result for a
 * per-render assignment to the shared FARM_SCENE arrays.
 */
export function mapLayoutToScene(scene = map, layout = {}) {
  const sourcePlots = asArray(scene?.plots);
  const sourcePens = asArray(scene?.pens);
  const plotSlots = validPermutation(layout?.plots, sourcePlots.length);
  const penSlots = validPermutation(layout?.pens, sourcePens.length);
  const sourceCreatureSpots = asArray(scene?.creatureSpots);

  const plots = sourcePlots.map((logicalPlot, logicalIndex) => {
    const targetSlot = plotSlots[logicalIndex];
    const slot = sourcePlots[targetSlot] ?? logicalPlot;
    const mapped = {
      ...logicalPlot,
      col: slot.col,
      row: slot.row,
      width: slot.width,
      height: slot.height,
      positions: clonePositions(slot.positions ?? logicalPlot.positions),
    };
    return mapped;
  });

  const pens = sourcePens.map((logicalPen, logicalIndex) => {
    const targetSlot = penSlots[logicalIndex];
    const slot = sourcePens[targetSlot] ?? logicalPen;
    const fallbackSpots = sourceCreatureSpots.slice(targetSlot * 2, targetSlot * 2 + 2);
    const spots = Array.isArray(slot.spots) && slot.spots.length
      ? slot.spots
      : fallbackSpots;
    return {
      ...logicalPen,
      col: slot.col,
      row: slot.row,
      width: slot.width,
      height: slot.height,
      spots: spots.map((spot) => (Array.isArray(spot) ? spot.slice() : spot)),
    };
  });

  const creatureSpots = pens.flatMap((pen) => asArray(pen.spots).map((spot) => (
    Array.isArray(spot) ? spot.slice() : spot
  )));
  return {plots, pens, creatureSpots};
}

export function plotContainsCell(plot, col, row, scene = map) {
  const bounds = plotPhysicalBounds(plot,scene);
  return col >= bounds.col && col < bounds.col + bounds.width && row >= bounds.row && row < bounds.row + bounds.height;
}

/** Pure picker used by the DOM-facing pick method and by layout tests. */
export function pickFromWorld(x, y, builtPlotCount, scene = map) {
  const [col,row]=worldToGrid(x,y,scene);
  if(!insideFarm(col,row))return null;
  const plots=Array.isArray(scene?.plots)?scene.plots:[];
  const built=Math.max(0,Math.min(plots.length,Number(builtPlotCount)||0)),scale=plotCellScale(scene);
  for(let index=0;index<built;index++) {
    const plot=plots[index],b=plotBounds(plot);
    const [firstCol,firstRow]=plotCellPosition(plot,0,scene);
    const localCol=Math.round((col-firstCol)/scale),localRow=Math.round((row-firstRow)/scale);
    if(localCol<0||localCol>=b.width||localRow<0||localRow>=b.height)continue;
    const slot=localRow*b.width+localCol,[cx,cy]=iso(...plotCellPosition(plot,slot,scene),scene);
    if(Math.abs(x-cx)/(tileWidth(scene)*scale/2)+Math.abs(y-cy)/(tileHeight(scene)*scale/2)<=1.04)
      return {plot:plot.id??index,index:slot||0};
  }
  return null;
}

function assertMap() {
  if (!map || !Array.isArray(map.plots) || !Array.isArray(map.pens)) {
    throw new Error('Không có FARM_SCENE: nạp scene-data.js trước scene-renderer.mjs.');
  }
  if (!motion || !Array.isArray(motion.items)) {
    throw new Error('Không có FARM_MOTION: nạp motion-data.js trước scene-renderer.mjs.');
  }
}

function frameFile(frame) {
  return typeof frame === 'string' ? frame : frame?.file;
}

function collectFiles() {
  const files = [];
  files.push(...FOREST_ASSET_FILES);
  for (const tile of map.tiles ?? []) if (tile?.file) files.push(tile.file);
  for (const prop of map.props ?? []) if (prop?.file) files.push(prop.file);
  for (const item of motion.items ?? []) {
    for (const frame of creatureViewFrames(item)) if (frameFile(frame)) files.push(frameFile(frame));
  }
  return [...new Set(files)];
}

function makeCanvas(sourceCanvas, width, height) {
  const document = sourceCanvas?.ownerDocument;
  if (document?.createElement) {
    const result = document.createElement('canvas');
    result.width = width;
    result.height = height;
    return result;
  }
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(width, height);
  throw new Error('Không tạo được canvas đệm cho bản đồ Hagrid.');
}

function finite(value, fallback) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function constructionList(state) {
  return asArray(state?.construction);
}

function constructionMatches(candidate, aliases, kind) {
  if (!candidate || !aliases.includes(String(candidate.id))) return false;
  if (!kind || candidate.kind == null) return true;
  const actual = String(candidate.kind).toLowerCase();
  const expected = String(kind).toLowerCase();
  if (expected === 'thửa') return actual === 'thửa' || actual === 'plot';
  if (expected === 'chuồng') return actual === 'chuồng' || actual === 'pen';
  return actual === expected;
}

function constructionFor(state, aliases, kind) {
  return constructionList(state).find((candidate) => constructionMatches(candidate, aliases, kind)) ?? null;
}

function constructionProgress(construction, logicalNow) {
  if (!construction) return {ready: true, progress: 1};
  const readyAt = Number(construction.readyAt);
  if (!Number.isFinite(readyAt) || logicalNow >= readyAt) return {ready: true, progress: 1};
  const startedAt = Number(construction.startedAt ?? construction.startAt ?? construction.createdAt);
  const progress = Number.isFinite(startedAt) && readyAt > startedAt
    ? clamp((logicalNow - startedAt) / (readyAt - startedAt), 0, 1)
    : 0;
  return {ready: false, progress};
}

export function plotAliases(plot, index) {
  // The engine numbers plots from one (`plot_1` … `plot_12`) while the map
  // array is zero based. Keep the canonical id unambiguous so a build for
  // plot_4 cannot also be treated as the build for plot_3. A string id from a
  // future map is retained as an explicit alias; numeric scene ids are layout
  // indices, not construction ids.
  const canonical = `plot_${index + 1}`;
  const aliases = [canonical];
  if (typeof plot?.id === 'string' && plot.id !== canonical) aliases.push(plot.id);
  return aliases;
}

function penAliases(pen) {
  return [String(pen.id)];
}

export {DECORATION_LAYOUT, DECORATION_IDS, decorationPlacements} from './default-decor.mjs?v=24.9.87';

/** Keepsakes are displayed as small labelled tokens in the final south plaza. */
export function keepsakePlacements(scene = map) {
  return KEEPSAKE_DISPLAY_LAYOUT.map((spec) => {
    const [x, y] = iso(...keepsakeAnchor(spec), scene);
    return {...spec, xy: [x, y]};
  });
}

function resolvedPlotPosition(plot, key = 'center') {
  const position = plot?.positions?.[key] ?? plot?.positions?.center;
  if (Array.isArray(position) && position.length >= 2) return [Number(position[0]), Number(position[1])];
  const bounds = plotBounds(plot);
  return [bounds.col + bounds.width / 2, bounds.row + bounds.height / 2];
}

function roundedTime(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return 'sẵn sàng';
  const seconds = Math.ceil(ms / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remain = seconds % 60;
  if (hours > 0) return `${hours}g${String(minutes).padStart(2, '0')}`;
  return `${String(minutes).padStart(2, '0')}:${String(remain).padStart(2, '0')}`;
}

function growthRemaining(result) {
  if (Number.isFinite(Number(result?.remainingMs))) return Math.max(0, Number(result.remainingMs));
  if (Number.isFinite(Number(result?.growMs)) && Number.isFinite(Number(result?.elapsedMs))) {
    return Math.max(0, Number(result.growMs) - Number(result.elapsedMs));
  }
  if (Number.isFinite(Number(result?.durationMs)) && Number.isFinite(Number(result?.elapsedMs))) {
    return Math.max(0, Number(result.durationMs) - Number(result.elapsedMs));
  }
  return null;
}


function frameAt(item, index, allowMissing = false) {
  const frames = asArray(item?.frames);
  const frame = frames[index] ?? frames[0];
  if (!frame) {
    if (allowMissing) return null;
    throw new Error(`Motion asset ${item?.id ?? 'unknown'} chưa có frame.`);
  }
  return typeof frame === 'string' ? {file: frame, pivotX: 32, pivotY: 48, width: 64, height: 64} : frame;
}

function drawDiamond(context, x, y, fill, stroke, scene = map, scale = 1) {
  const width = tileWidth(scene) * scale / 2;
  const height = tileHeight(scene) * scale / 2;
  context.beginPath();
  context.moveTo(x, y - height);
  context.lineTo(x + width, y);
  context.lineTo(x, y + height);
  context.lineTo(x - width, y);
  context.closePath();
  if (fill) {
    context.fillStyle = fill;
    context.fill();
  }
  if (stroke) {
    context.strokeStyle = stroke;
    context.stroke();
  }
}

function polygon(context, points, fill, stroke, lineWidth = 1, dashed = false) {
  context.beginPath();
  context.moveTo(points[0][0], points[0][1]);
  for (const point of points.slice(1)) context.lineTo(point[0], point[1]);
  context.closePath();
  context.setLineDash?.(dashed ? [8, 6] : []);
  context.lineWidth = lineWidth;
  if (fill) {
    context.fillStyle = fill;
    context.fill();
  }
  if (stroke) {
    context.strokeStyle = stroke;
    context.stroke();
  }
  context.setLineDash?.([]);
}

function line(context, from, to, color, width = 2, dashed = false) {
  context.beginPath();
  context.moveTo(from[0], from[1]);
  context.lineTo(to[0], to[1]);
  context.setLineDash?.(dashed ? [8, 6] : []);
  context.lineWidth = width;
  context.strokeStyle = color;
  context.stroke();
  context.setLineDash?.([]);
}

function penCorners(pen) {
  return [
    iso(pen.col, pen.row),
    iso(pen.col + pen.width, pen.row),
    iso(pen.col + pen.width, pen.row + pen.height),
    iso(pen.col, pen.row + pen.height),
  ];
}

function drawPenGround(context, pen, scaffold = false) {
  const corners = penCorners(pen);
  polygon(context, corners, scaffold ? 'rgba(159,124,75,.08)' : 'rgba(92,69,49,.22)', scaffold ? '#b49a66' : '#777044', 2, scaffold);
  const [north, east, south, west] = corners;
  line(context, north, east, scaffold ? '#b49a66' : '#777044', 3, scaffold);
  line(context, north, west, scaffold ? '#b49a66' : '#777044', 3, scaffold);
  if (!scaffold) {
    for (const point of [north, east, west]) {
      context.beginPath();
      context.fillStyle = '#b49a66';
      context.arc(point[0], point[1], 4, 0, Math.PI * 2);
      context.fill();
    }
  }
}

function drawPenFront(context, pen, scaffold = false) {
  const [, east, south, west] = penCorners(pen);
  line(context, east, south, scaffold ? '#b49a66' : '#777044', scaffold ? 3 : 4, scaffold);
  line(context, west, south, scaffold ? '#b49a66' : '#777044', scaffold ? 3 : 4, scaffold);
  if (!scaffold) {
    for (const point of [east, south, west]) {
      context.beginPath();
      context.fillStyle = '#b49a66';
      context.arc(point[0], point[1], 4, 0, Math.PI * 2);
      context.fill();
    }
  }
}

// 2g05 · 12p · 45s: the plot label's countdown, short enough for the map.
function shortTime(ms) {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  if (seconds >= 3600) { const h = Math.floor(seconds / 3600), m = Math.floor(seconds % 3600 / 60); return h >= 24 ? `${Math.floor(h / 24)}n${h % 24}g` : `${h}g${String(m).padStart(2, '0')}`; }
  return seconds >= 60 ? `${Math.ceil(seconds / 60)}p` : `${seconds}s`;
}

function label(context, text, x, y, color = '#d6d8bf', font = 'bold 13px sans-serif', background = 'rgba(24,45,43,.82)') {
  context.font = font;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  const width = context.measureText(text).width + 10, height = (Number(font.match(/(\d+)px/)?.[1]) || 13) + 6;
  context.fillStyle = background;
  context.fillRect(Math.round(x - width / 2), Math.round(y - height / 2), Math.ceil(width), height);
  context.fillStyle = color;
  context.fillText(text, Math.round(x), Math.round(y));
}

function drawProgress(context, x, y, progress) {
  const width = 56;
  context.fillStyle = 'rgba(24,45,43,.84)';
  context.fillRect(x - width / 2, y - 3, width, 6);
  context.fillStyle = '#f5d69a';
  context.fillRect(x - width / 2 + 1, y - 2, Math.max(2, (width - 2) * clamp(progress, 0, 1)), 4);
}

function drawBubble(context, x, y, text, color = '#f5d69a') {
  context.beginPath();
  context.fillStyle = 'rgba(24,45,43,.92)';
  context.strokeStyle = color;
  context.lineWidth = 2;
  context.arc(x, y, 14, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.beginPath();
  context.moveTo(x - 5, y + 11);
  context.lineTo(x - 10, y + 19);
  context.lineTo(x + 1, y + 13);
  context.fillStyle = 'rgba(24,45,43,.92)';
  context.fill();
  context.fillStyle = color;
  context.font = 'bold 10px sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, x, y);
}

function ellipse(context, x, y, radiusX, radiusY, fill, stroke = null, lineWidth = 1) {
  context.beginPath();
  if (typeof context.ellipse === 'function') context.ellipse(x, y, radiusX, radiusY, 0, 0, Math.PI * 2);
  else context.arc(x, y, Math.max(radiusX, radiusY), 0, Math.PI * 2);
  if (fill) {
    context.fillStyle = fill;
    context.fill();
  }
  if (stroke) {
    context.strokeStyle = stroke;
    context.lineWidth = lineWidth;
    context.stroke();
  }
}

function rectangle(context, x, y, width, height, fill, stroke = null, lineWidth = 1) {
  if (fill) {
    context.fillStyle = fill;
    context.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
  }
  if (stroke) {
    context.strokeStyle = stroke;
    context.lineWidth = lineWidth;
    context.strokeRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
  }
}

function animationAccent(species) {
  let hash = 0;
  for (const character of String(species ?? '')) hash = (hash * 31 + character.codePointAt(0)) >>> 0;
  return ['#b0bd67', '#71934b', '#d6d8bf', '#70a8b6'][hash % 4];
}

function drawPixelHeart(context, x, y, color = '#ed8a45') {
  const originX = Math.round(x);
  const originY = Math.round(y);
  context.fillStyle = color;
  for (const [dx, dy, width] of [[-4, 0, 3], [1, 0, 3], [-6, 3, 12], [-3, 6, 6]]) {
    context.fillRect(originX + dx, originY + dy, width, 3);
  }
}

// Tutorial pointer: a pulsing gold outline plus a pixel arrow bobbing over the plot.
// Reduced motion (clock 0) keeps both still and fully visible.
function drawTutorialFocus(context, corners, clock = 0) {
  const pulse = clock > 0 ? 0.55 + 0.45 * Math.abs(Math.sin(clock / 260)) : 0.9;
  context.save?.();
  context.globalAlpha = pulse;
  context.strokeStyle = '#ffc36b';
  context.lineWidth = 3;
  context.beginPath?.();
  corners.forEach(([x, y], index) => (index ? context.lineTo?.(x, y) : context.moveTo?.(x, y)));
  context.closePath?.();
  context.stroke?.();
  context.globalAlpha = 1;
  const top = corners.reduce((a, b) => (b[1] < a[1] ? b : a));
  const bob = clock > 0 ? [0, -2, -4, -2][Math.floor(clock / 140) % 4] : 0;
  const ax = Math.round(top[0]), ay = Math.round(top[1] - 30 + bob);
  context.fillStyle = '#231f2e';
  context.fillRect?.(ax - 9, ay - 3, 18, 10);
  context.fillRect?.(ax - 5, ay + 7, 10, 4);
  context.fillRect?.(ax - 2, ay + 11, 4, 3);
  context.fillStyle = '#ffc36b';
  context.fillRect?.(ax - 7, ay - 1, 14, 6);
  context.fillRect?.(ax - 4, ay + 5, 8, 4);
  context.fillRect?.(ax - 1, ay + 9, 2, 3);
  context.restore?.();
}

function drawPixelSparkle(context, x, y, color = '#f5d69a', scale = 1) {
  const originX = Math.round(x);
  const originY = Math.round(y);
  const size = Math.max(2, Math.round(scale * 2));
  context.fillStyle = color;
  context.fillRect(originX - size / 2, originY - size * 2, size, size * 2);
  context.fillRect(originX - size * 2, originY - size / 2, size * 2, size);
  context.fillRect(originX + size, originY - size / 2, size * 2, size);
  context.fillRect(originX - size / 2, originY + size, size, size * 2);
}

function drawPixelDrop(context, x, y, color = '#70a8b6') {
  const originX = Math.round(x);
  const originY = Math.round(y);
  context.fillStyle = color;
  context.fillRect(originX, originY, 3, 5);
  context.fillRect(originX - 2, originY + 4, 7, 3);
}

function drawCropBreeze(context, object) {
  const breeze = object.breeze;
  if (!breeze || breeze.intensity <= 0) return;
  const x = Math.round(object.xy[0] + breeze.x * 2);
  const y = Math.round(object.xy[1] - 22 + breeze.y * 2);
  const color = animationAccent(object.species);
  context.fillStyle = color;
  context.fillRect(x + (breeze.phase % 2 ? 7 : -7), y, 2, 2);
  context.fillRect(x + (breeze.phase % 2 ? 11 : -11), y - 5, 2, 2);
}

function drawEatEffect(context, x, y, progress) {
  const step = Math.min(4, Math.floor(progress * 5));
  const bowlX = Math.round(x - 24);
  const bowlY = Math.round(y - 10);
  ellipse(context, bowlX, bowlY, 10, 4, '#a57554', '#4a3042', 1);
  rectangle(context, bowlX - 7, bowlY, 14, 5, '#c97952', '#4a3042', 1);
  context.fillStyle = '#f5d69a';
  for (const [dx, dy] of [[-7, -17], [0, -20], [7, -16]]) {
    const lift = step === 0 ? 0 : step === 1 ? 1 : step === 2 ? 2 : step === 3 ? 1 : 0;
    context.fillRect(bowlX + dx, bowlY + dy - lift, 3, 3);
  }
  if (step % 2 === 1) context.fillRect(bowlX + 11, bowlY - 7, 3, 3);
}

function drawCareEffect(context, x, y, progress, kind = 'care') {
  const step = Math.min(4, Math.floor(progress * 5));
  const lift = [0, 2, 5, 7, 9][step];
  if (kind === 'water') {
    drawPixelDrop(context, x + 11, y - 30 - lift, '#70a8b6');
    drawPixelDrop(context, x - 9, y - 23 - Math.max(0, lift - 2), '#b7dee0');
  } else {
    drawPixelHeart(context, x + 13, y - 38 - lift, '#ed8a45');
    drawPixelHeart(context, x - 14, y - 28 - Math.max(0, lift - 2), '#e07a9e');
    drawPixelSparkle(context, x - 6, y - 42 - Math.max(0, lift - 3), '#f5d69a', 1);
  }
}

function drawClaimEffect(context, x, y, progress) {
  const step = Math.min(3, Math.floor(progress * 4));
  drawPixelSparkle(context, x + 15, y - 40 - step * 2, '#f5d69a', 1 + (step % 2));
  drawPixelSparkle(context, x - 10, y - 30 - step, '#b0bd67', 1);
}

function groundShadow(context, x, y, width = 22) {
  ellipse(context, x, y - 2, width, 5, 'rgba(24,45,43,.36)');
}


export function drawDecoration(context, object, _clock = 0, options = {}) {
  const spec = DECORATION_LAYOUT[object.id];
  if (!spec) throw new Error(`Không có hình trang trí ${String(object.id)}.`);
  const asset = options.asset ?? object.asset ?? earnedDecorArt(object.id, object.facing);
  if (!asset) throw new Error(`Không có asset trang trí ${String(object.id)}.`);
  const image = options.image ?? object.image ?? null;
  const x = object.xy[0];
  const y = object.xy[1];
  if (!image) return false;
  return drawEarnedDecorSprite(context, image, asset, x, y);
}

export function drawKeepsake(context, object, clock = 0, options = {}) {
  const asset=options.asset??KEEPSAKE_ART[object.species],image=options.image;
  if(!asset||!image)return false;
  const x=Math.round(object.xy[0]),y=Math.round(object.xy[1]);
  context.drawImage(image,x-asset.pivotX,y-asset.pivotY);
  if(object.count>1)label(context,`×${object.count}`,x+16,y-32,'#f5d69a','bold 8px monospace');
  return true;
}

function drawHutMotion(context, x, y, clock) {
  if (!(clock > 0)) return;
  const step = Math.floor(clock / 420) % 4;
  const puffs = [
    [-58, -170 - step * 2, 6, 4, '#d6d8bf'],
    [-54 + (step % 2) * 2, -178 - step * 3, 8, 5, '#a6b1ae'],
    [-50 - (step % 2) * 2, -187 - step * 3, 6, 4, 'rgba(214,216,191,.72)'],
  ];
  for (const [dx, dy, w, h, color] of puffs) {
    rectangle(context, x + dx, y + dy, w, h, color);
  }
}

/**
 * Build the local Canvas2D renderer. The map is deliberately data-only so the
 * controller can pan/zoom it without changing any gameplay state.
 */
export async function createGarden(canvas, options = {}) {
  assertMap();
  if (!canvas || typeof canvas.getContext !== 'function') throw new Error('Cần canvas để vẽ Khu vườn Hagrid.');
  const allowMissingAssets = options.allowMissingAssets === true || root.FARM_DEV_KNOWN_NEW_ASSETS_NOT_READY === true;
  const decorAssets = new Map([...(options.decorAssets ?? []),...COMPLETE_SCENERY].map(a=>[a.id,a]));
  const assetFiles = [...new Set([
    ...collectFiles(),
    ...completeObjectFiles(),
    ...earnedDecorFiles(),
    FARM_SIGN_ART.file,
    ...FESTIVAL_FILES,
    'world-v242/cottage-corner.png',
    ...[...decorAssets.values()].flatMap((a) => [
      a.file,
      ...(a.frames ?? []),
      ...(a.rightFile ? [a.rightFile] : []),
      ...(a.rightFrames ?? []),
    ]).filter(Boolean),
  ])];
  const authoredSlots = authoredLayoutScene(map);
  canvas.width = map.width;
  canvas.height = map.height;
  if (canvas.dataset) canvas.dataset.creatureSpots = JSON.stringify(map.creatureSpots);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas2D không khả dụng cho Khu vườn Hagrid.');
  context.imageSmoothingEnabled = false;
  context.imageSmoothingQuality = 'low';
  const images = new Map();
  const missing = new Set();
  const ImageCtor = canvas.ownerDocument?.defaultView?.Image ?? root.Image;
  if (typeof ImageCtor !== 'function') throw new Error('Không có Image loader cho asset Khu vườn Hagrid.');

  await Promise.all(assetFiles.map((file) => new Promise((resolve, reject) => {
    const image = new ImageCtor();
    // In HPVN's opaque sandbox every asset is cross-origin; CORS keeps the canvas readable (toBlob).
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      images.set(file, image);
      resolve();
    };
    image.onerror = () => {
      missing.add(file);
      if (allowMissingAssets) resolve();
      else reject(new Error(`Không tải được asset Khu vườn Hagrid: ${file}`));
    };
    image.src = runtimeImageUrl(file);
  })));

  const items = new Map(motion.items.map((item) => [item.id, item]));
  const props = new Map((map.props ?? []).map((item) => [item.id, item]));
  const tiles = new Map((map.tiles ?? []).map((item) => [item.id, item]));
  const grassTile = tiles.get('grass');
  const soilTile = tiles.get('soil');
  const terrainCaches = new Map();
  const plotBorderLayers = new Map();
  const penHabitatLayers = new Map();
  let activeWeather='clear',activeEvent='none';
  const seasonalImages=new Map();
  function seasonalImage(file,kind){
    const source=imageFor(file);if(activeWeather==='clear'||!source)return source;
    const key=kind+':'+file;if(seasonalImages.has(key))return seasonalImages.get(key);
    const result=makeCanvas(canvas,source.naturalWidth||source.width,source.naturalHeight||source.height),brush=result.getContext('2d',{willReadFrequently:true});
    brush.imageSmoothingEnabled=false;brush.drawImage(source,0,0);weatherizeCanvas(result,kind,activeWeather);seasonalImages.set(key,result);return result;
  }
  let terrainStageId = null;
  let terrainLayoutKey = '';
  let boundaryStageId = null;
  let boundaryFence = [];
  let currentStage = gardenStage({}, map);

  function layoutCacheKey() {
    return JSON.stringify([
      ...(map.plots ?? []).map((plot) => [plot.col, plot.row, plot.width, plot.height]),
      ...(map.pens ?? []).map((pen) => [pen.col, pen.row, pen.width, pen.height]),
    ]);
  }

  function rebuildBoundaryFence(stage) {
    boundaryFence = createBoundaryFence(map, stageBoundary(stage)).map((piece) => {
      const left = Math.floor(Math.min(piece.a[0], piece.b[0]) - (piece.gate?10:6));
      const top = Math.floor(Math.min(piece.a[1], piece.b[1]) - (piece.gate?80:51));
      const layer = makeCanvas(canvas, Math.ceil(Math.abs(piece.a[0] - piece.b[0])) + (piece.gate?36:14), Math.ceil(Math.abs(piece.a[1] - piece.b[1])) + (piece.gate?108:58));
      const brush = layer.getContext('2d');
      brush.imageSmoothingEnabled = false;
      drawBoundaryFence(brush, {
        ...piece,
        a: [piece.a[0] - left, piece.a[1] - top],
        b: [piece.b[0] - left, piece.b[1] - top],
      });
      return {...piece, layer, left, top};
    });
  }

  function prepareStage(stage) {
    const nextLayoutKey = layoutCacheKey();
    if (terrainStageId !== stage.id || terrainLayoutKey !== nextLayoutKey) {
      // Keep only the current stage's full-size canvases alive. A level-up can
      // happen repeatedly in one session, so retaining every prior layer
      // would grow memory with each transition.
      terrainCaches.clear();
      terrainStageId = stage.id;
      terrainLayoutKey = nextLayoutKey;
    }
    if (boundaryStageId !== stage.id) {
      rebuildBoundaryFence(stage);
      boundaryStageId = stage.id;
    }
  }
  const animation = createAnimationRuntime();

  function imageFor(file) {
    if (images.has(file)) return images.get(file);
    if (missing.has(file) && allowMissingAssets) return null;
    throw new Error(`Thiếu asset đã nạp: ${file}`);
  }

  // Reuse the exact scenic ground beyond the canvas so pan/zoom never reveals
  // an empty edge. Trees remain separate depth-ordered objects, never a tile
  // clipped through the playable boundary.
  const scenicBackdrop=makeCanvas(canvas,map.width,map.height),backdropBrush=scenicBackdrop.getContext('2d');
  backdropBrush.imageSmoothingEnabled=false;
  drawScenicBackdrop(backdropBrush,map.width,map.height,{grassImage:imageFor(grassTile.file)});

  function loadedSize(asset) {
    const image = imageFor(asset.file);
    return {
      width: finite(image?.naturalWidth || image?.width, asset.width),
      height: finite(image?.naturalHeight || image?.height, asset.height),
    };
  }

  const forestAssetSizes = Object.fromEntries(FOREST_ASSETS.map((asset) => [asset.id, loadedSize(asset)]));
  // Trees may overlap the scenic meadow, but never the fenced usable area.
  const forestScene={...map, terrainExtensions:[
    {col:-1,row:-1,width:35,height:30}, {col:-5,row:-1,width:5,height:11},
  ]};
  const forest = createForestSurround(forestScene, {assetSizes: forestAssetSizes});
  const forestAssets = new Map(FOREST_ASSETS.map((asset) => {
    const size = forestAssetSizes[asset.id];
    const image = imageFor(asset.file);
    const width = finite(image?.naturalWidth || image?.width, size.width);
    const height = finite(image?.naturalHeight || image?.height, size.height);
    return [asset.id, {
      ...asset,
      width,
      height,
      pivotX: finite(asset.pivotX, width / 2),
      pivotY: finite(asset.pivotY, height),
    }];
  }));
  const forestDrawOrder = forest.placements.slice().sort((left,right)=>left.y-right.y||left.x-right.x);

  // Reuse the approved tree pixels with a cool forest tint; sprites stay immutable.
  const forestImages=new Map(FOREST_ASSETS.map(asset=>{
    const source=imageFor(asset.file),size=forestAssetSizes[asset.id];
    const copy=makeCanvas(canvas,size.width,size.height),ctx=copy.getContext('2d');
    ctx.imageSmoothingEnabled=false;if(source)ctx.drawImage(source,0,0);
    ctx.globalCompositeOperation='source-atop';ctx.fillStyle='rgba(9,29,31,.24)';ctx.fillRect(0,0,size.width,size.height);ctx.globalCompositeOperation='source-over';
    return [asset.id,copy];
  }));
  // Portrait screens can see beyond the world canvas. Extend the forest there,
  // wrapping trees across the tile edges so the backdrop has no cut canopies.
  const forestBackdrop=makeCanvas(canvas,map.width,map.height),back=forestBackdrop.getContext('2d',{willReadFrequently:true});
  const westBackdrop=makeCanvas(canvas,map.width,map.height),westBack=westBackdrop.getContext('2d');
  back.imageSmoothingEnabled=false;back.drawImage(scenicBackdrop,0,0);
  westBack.imageSmoothingEnabled=false;westBack.drawImage(scenicBackdrop,0,0);
  const backdropBoundary=stageBoundary(GARDEN_STAGES.at(-1));
  const backgroundTrail=backdropExitTrail(map),seamY=map.height*.82;
  drawExitTrail(westBack,[[map.width+32,seamY],...backgroundTrail],{taperEnd:true});
  const wallpaper=[];
  for(const tree of canopyClusters(map,forestAssetSizes)){
    const {id,w,h,flip}=tree,img=forestImages.get(id),px=tree.x-w/2,py=tree.y-h;
    for(const dx of [-map.width,0,map.width])for(const dy of [-map.height,0,map.height]){
      if(px+dx+w<0||px+dx>map.width||py+dy+h<0||py+dy>map.height)continue;
      const rect={left:Math.round(px+dx),top:Math.round(py+dy),right:Math.round(px+dx+w),bottom:Math.round(py+dy+h)};
      wallpaper.push({id,img,rect,w,h,flip});
    }
  }
  wallpaper.sort((a,b)=>a.rect.bottom-b.rect.bottom);
  const westClearTrail=[[map.width+32,seamY],...backgroundTrail.slice(0,Math.ceil(backgroundTrail.length*.82))];
  for(const tree of wallpaper)if(forestRectOutsideBoundary(tree.rect,map,backdropBoundary)){
    drawCanopy(back,tree);
    if(!overlapsTrail(tree.rect,westClearTrail)&&!overlapsTrail({left:tree.rect.left-map.width,top:tree.rect.top,right:tree.rect.right-map.width,bottom:tree.rect.bottom},[[0,seamY],[80,seamY]]))drawCanopy(westBack,tree);
  }
  function drawCanopy(target,{img,rect,w,h,flip}){
    target.save();target.translate(rect.left+(flip?w:0),rect.top);if(flip)target.scale(-1,1);
    target.drawImage(img,0,0,w,h);target.restore();
  }
  let backdropRevision=0,backdropUrls=[],backdropLightKey='';
  function syncBackdropLighting(atmosphere,weather){
    const surface=canvas.parentElement,key=atmosphere+':'+weather;if(!surface?.style||key===backdropLightKey)return;
    backdropLightKey=key;
    const tint=atmosphereConfig(atmosphere).tint||'transparent',wet=weatherConfig(weather).tint||'transparent';
    // Same compositing order as Canvas: weather over time-of-day over scenery.
    surface.style.backgroundImage=`linear-gradient(${wet},${wet}),linear-gradient(${tint},${tint}),var(--scenic-ground,none)`;
  }
  function publishBackdrop(){
    const surface=canvas.parentElement;if(!surface?.style)return;
    const revision=++backdropRevision;
    surface.style.backgroundColor=activeWeather==='snow'?'#a6b1ae':activeWeather==='autumn'?'#735044':'#142620';
    surface.style.backgroundRepeat='no-repeat, no-repeat, no-repeat, repeat';
    const size='calc(2560px * var(--forest-scale,1)) calc(1440px * var(--forest-scale,1))';
    surface.style.backgroundSize='100% 100%,100% 100%,'+size+','+size;
    surface.style.backgroundPosition='0 0,0 0,calc(var(--forest-x,0px) - 2560px * var(--forest-scale,1)) var(--forest-y,0px), var(--forest-x,0px) var(--forest-y,0px)';
    if(typeof forestBackdrop.toBlob!=='function')return;
    const toUrl=source=>new Promise(resolve=>source.toBlob(blob=>resolve(blob?URL.createObjectURL(blob):null),'image/webp',.9));
    Promise.all([toUrl(westBackdrop),toUrl(forestBackdrop)]).then(urls=>{
      if(revision!==backdropRevision){urls.filter(Boolean).forEach(url=>URL.revokeObjectURL(url));return;}
      if(urls.every(Boolean)){
        surface.style.setProperty('--scenic-ground',urls.map(url=>`url("${url}")`).join(', '));
        backdropUrls.forEach(url=>URL.revokeObjectURL(url));backdropUrls=urls;
      }else urls.filter(Boolean).forEach(url=>URL.revokeObjectURL(url));
    });
  }
  publishBackdrop();
  function prepareWeather(weather){
    if(weather===activeWeather)return;
    activeWeather=weather;seasonalImages.clear();terrainCaches.clear();
    // Bound memory to the current season. Never retain four world-size caches.
    for(const asset of FOREST_ASSETS){
      const source=seasonalImage(asset.file,'tree'),copy=forestImages.get(asset.id),brush=copy.getContext('2d');
      brush.clearRect(0,0,copy.width,copy.height);brush.drawImage(source,0,0);
      if(weather==='clear'){brush.globalCompositeOperation='source-atop';brush.fillStyle='rgba(9,29,31,.24)';brush.fillRect(0,0,copy.width,copy.height);brush.globalCompositeOperation='source-over';}
    }
    for(const tree of wallpaper)tree.img=forestImages.get(tree.id);
    back.clearRect(0,0,map.width,map.height);back.drawImage(scenicBackdrop,0,0);
    weatherizeCanvas(forestBackdrop,'ground',weather);
    westBack.clearRect(0,0,map.width,map.height);westBack.drawImage(forestBackdrop,0,0);
    drawExitTrail(westBack,[[map.width+32,seamY],...backgroundTrail],{taperEnd:true});
    for(const tree of wallpaper)if(forestRectOutsideBoundary(tree.rect,map,backdropBoundary)){
      drawCanopy(back,tree);
      if(!overlapsTrail(tree.rect,westClearTrail)&&!overlapsTrail({left:tree.rect.left-map.width,top:tree.rect.top,right:tree.rect.right-map.width,bottom:tree.rect.bottom},[[0,seamY],[80,seamY]]))drawCanopy(westBack,tree);
    }
    publishBackdrop();
  }

  function drawTile(target, tile, col, row, scale = 1) {
    if (!tile) return;
    const [x, y] = iso(col, row);
    const image = imageFor(tile.file);
    if (image) target.drawImage(image, Math.round(x-tileWidth()*scale/2),Math.round(y-tileHeight()*scale/2),Math.round(tileWidth()*scale),Math.round(tileHeight()*scale));
    else drawDiamond(target,x,y,'#24483f','#b49a66',map,scale);
  }

  function drawAssetTo(target, asset, x, y, breeze = null, actorMotion = null, flipX = false) {
    if (!asset) return;
    const file = frameFile(asset);
    const image = asset.seasonalKind ? seasonalImage(file,asset.seasonalKind) : imageFor(file);
    if (image) {
      const left = Math.round(x - finite(asset.pivotX, 0));
      const top = Math.round(y - finite(asset.pivotY, 0));
      const height = image.naturalHeight || image.height || finite(asset.height, 64);
      const width = image.naturalWidth || image.width || finite(asset.width, 64);
      const offsetX = actorMotion?.swayX || 0;
      const offsetY = actorMotion?.bobY || 0;
      if(asset.atlasRect){const r=asset.atlasRect;target.drawImage(image,r.x,r.y,r.w,r.h,left+offsetX,top+offsetY,r.w,r.h);return;}
      if (breeze?.intensity) {
        // Move foliage only; the lower stem/root stays on its authored anchor.
        const bounds = asset.bounds ?? {y: 0, h: height};
        const split = Math.max(1, Math.min(height - 1, Math.round(bounds.y + bounds.h * 0.65)));
        target.drawImage(image, 0, 0, width, split, left + (breeze.x || 0), top, width, split);
        target.drawImage(image, 0, split, width, height - split, left, top + split, width, height - split);
        return;
      }
      if (flipX && target.save && target.translate && target.scale) {
        target.save();
        target.translate(Math.round(x * 2), 0);
        target.scale(-1, 1);
        target.drawImage(image, left - offsetX, top + offsetY);
        target.restore();
        return;
      }
      target.drawImage(image, left + offsetX, top + offsetY);
      return;
    }
    // Explicit development diagnostic. It is never reached in a normal load.
    target.save?.();
    target.strokeStyle = '#e07a9e';
    target.setLineDash?.([4, 3]);
    target.strokeRect(x - 24, y - 48, 48, 48);
    target.setLineDash?.([]);
    target.fillStyle = '#e07a9e';
    target.font = 'bold 9px monospace';
    target.textAlign = 'center';
    target.fillText('ASSET?', x, y - 26);
    target.restore?.();
  }

  function outsideActiveStage(rect,stage){
    return forestRectOutsideBoundary(rect,map,stageBoundary(stage));
  }

  function drawForestLayer(target,trail,stage) {
    const westEdgeTrail=westClearTrail.map(([x,y])=>[x-map.width,y]);
    for(const tree of wallpaper)if(outsideActiveStage(tree.rect,stage)&&!overlapsTrail(tree.rect,trail)&&!overlapsTrail(tree.rect,westEdgeTrail)){
      drawCanopy(target,tree);
    }
    for (const placement of forestDrawOrder) {
      if(!outsideActiveStage(placement.rect,stage)||overlapsTrail(placement.rect,trail))continue;
      const asset = forestAssets.get(placement.assetId);
      if (!asset) continue;
      target.save?.();
      target.globalAlpha = finite(placement.opacity, 1);
      const scale=placement.scale??1,image=forestImages.get(placement.assetId);
      if(image)target.drawImage(image,Math.round(placement.rect.left),Math.round(placement.rect.top),Math.round(asset.width*scale),Math.round(asset.height*scale));
      target.restore?.();
    }
  }

  function drawFutureGrovesLayer(target, stage,trail) {
    const placements=futureGroves(map, stage).map((placement,index)=>{
      const h=((index+1)*2654435761)>>>0,u=(h&1023)/1023,v=((h>>>10)&1023)/1023;
      const dc=(u-.5)*1.1,dr=(v-.5)*1.1;
      const col=stageContains(stage,placement.col+dc,placement.row+dr)?placement.col:placement.col+dc;
      const row=stageContains(stage,placement.col+dc,placement.row+dr)?placement.row:placement.row+dr;
      const [x,y]=iso(col,row),scale=nativePixelScale(.78+((h>>>20)&255)/255*.64),flip=((h>>>8)&1)===1;
      return {...placement,x,y,scale,flip};
    }).sort((a,b)=>a.y-b.y||a.x-b.x);
    for (const placement of placements) {
      const asset = forestAssets.get(placement.assetId);
      if (!asset) continue;
      const w=Math.round(asset.width*placement.scale),h=Math.round(asset.height*placement.scale);
      const rect={left:Math.round(placement.x-w/2),top:Math.round(placement.y-h),right:Math.round(placement.x+w/2),bottom:Math.round(placement.y)};
      if(!outsideActiveStage(rect,stage)||overlapsTrail(rect,trail))continue;
      const img=forestImages.get(placement.assetId);
      if(img)drawCanopy(target,{img,rect,w,h,flip:placement.flip});
      else drawAssetTo(target, asset, placement.x, placement.y);
    }
  }

  function buildTerrainCache(withGrid, withForest, stage) {
    const cachedCanvas = makeCanvas(canvas, map.width, map.height);
    const cachedContext = cachedCanvas.getContext('2d');
    cachedContext.imageSmoothingEnabled = false;
    if (withForest) {
      drawScenicTerrain(cachedContext, {...map, farmBoundary: stageBoundary(stage)}, {grassImage: imageFor(grassTile.file),backdrop:scenicBackdrop});
    } else {
      cachedContext.fillStyle = '#142620';
      cachedContext.fillRect(0, 0, map.width, map.height);
    }
    clipToStage(cachedContext, stage, map, () => {
      drawNaturalMeadow(cachedContext, map, {grid: withGrid, grassImage: imageFor(grassTile.file)});
      cachedContext.save();cachedContext.fillStyle='rgba(15,40,38,.14)';cachedContext.fillRect(0,0,map.width,map.height);cachedContext.restore();
      drawGardenPathDetails(cachedContext, map);
      if (withForest) drawMeadowDetails(cachedContext, map, [...map.plots.map(p=>plotPhysicalBounds(p)), ...decorationPlacements(map), ...keepsakePlacements(map)], (x,y,index) => {
        const frame=items.get(index%2?'clover':'daisy')?.frames?.[3] ?? items.get('daisy')?.frames?.[3];
        const image=frame && imageFor(frame.file);
        if (!image) return;
        for(const [dx,dy] of [[-10,0],[12,4]]) {
          const scale=.55;
          cachedContext.drawImage(image, Math.round(x+dx-frame.pivotX*scale),Math.round(y+dy-frame.pivotY*scale),Math.round(frame.width*scale),Math.round(frame.height*scale));
        }
      });
    });
    weatherizeCanvas(cachedCanvas,'ground',activeWeather);
    if(withForest)drawCottageGround(cachedContext,{iso,weatherMode:activeWeather});
    if (withForest) {
      // Existing perimeter placements and the stage's unopened grove both
      // live on the forest floor, outside the clipped active meadow.
      const fence=createBoundaryFence(map,stageBoundary(stage)),gate=fence.find(piece=>piece.gate);
      const trail=forestExitTrail(map,gate?.cellA[1]??stage.bottom);
      drawExitTrail(cachedContext,[...trail,[-32,seamY]],{sign:true,signImage:imageFor(FARM_SIGN_ART.file)});
      drawForestLayer(cachedContext,trail,stage);
      drawFutureGrovesLayer(cachedContext,stage,trail);
    }
    return cachedCanvas;
  }

  function terrainCache(withGrid, withForest) {
    const key = `${currentStage.id}:${activeWeather}:${withGrid ? 'grid' : 'plain'}:${withForest ? 'forest' : 'bare'}`;
    if (!terrainCaches.has(key)) terrainCaches.set(key, buildTerrainCache(withGrid, withForest, currentStage));
    return terrainCaches.get(key);
  }

  function drawAsset(asset, x, y, breeze = null, actorMotion = null, flipX = false) {
    drawAssetTo(context, asset, x, y, breeze, actorMotion, flipX);
  }

  function itemFor(species) {
    const item = items.get(species);
    if (!item) {
      if (allowMissingAssets) return null;
      throw new Error(`Không có motion asset cho loài ${String(species)}.`);
    }
    return item;
  }

  function growthFor(entry, logicalNow) {
    try {
      const result = growth(entry, logicalNow);
      if (!result || !Number.isFinite(Number(result.stage))) throw new Error('growth() không trả stage hợp lệ');
      return result;
    } catch (error) {
      throw new Error(`Không tính được tiến độ ${String(entry?.species ?? 'unknown')}: ${error.message}`);
    }
  }

  let activeAnimations = [];
  let guestActor = null; // tutorial visitor; never part of state.creatures
  let speechScale = 1; // tutorial text stays readable when zoomed out
  let labelScale = 1; // plot labels keep ~12 screen px when the camera zooms out
  let authoredEffectEventIds = new Set();

  function actorObject(entry, col, row, logicalNow, clock, target = {}) {
    const baseItem=itemFor(entry?.species),facing=target.facing==='right'?'right':'default';
    const item=creatureView(baseItem,facing);
    if (!item || !asArray(item.frames).length) {
      return {kind: 'missing-actor', type: entry?.type ?? item?.kind ?? 'actor', id: entry?.species, xy: iso(col, row), entry};
    }
    const progress = growthFor(entry, logicalNow);
    const stage = clamp(Math.round(Number(progress.stage)), 0, 3);
    const event = selectAnimation(activeAnimations, {
      species: entry?.species,
      ...target,
    });
    const eventClip = event && progress.mature
      ? item.kind === 'crop'
        ? ['care','water'].includes(event.kind)&&item.clips?.action?.frames?.length?'action':null
        : event.kind === 'eat'
        ? item.clips?.eat?.frames?.length ? 'eat' : item.clips?.action?.frames?.length ? 'action' : null
        : event.kind === 'care' || event.kind === 'water'
          ? item.clips?.care?.frames?.length ? 'care' : item.clips?.action?.frames?.length ? 'action' : null
          : event.kind==='claim'&&item.clips?.action?.frames?.length?'action':null
      : null;
    const action = eventClip
      ? animationFrameAt(item, eventClip, event.elapsed, {loop: false, reducedMotion: clock === 0})
      : null;
    // New adult creatures own their care gesture in motion-care-data.js. Keep
    // the procedural heart/water overlay for crops and immature creatures,
    // while avoiding a second care effect over an authored adult clip.
    if (action && eventClip === 'care') authoredEffectEventIds.add(event.id);
    const seedKey = target.creatureIndex != null ? `c:${target.creatureIndex}` : `p:${target.plot ?? 0}:${target.cell ?? 0}`;
    const index = action ? action.frame : progress.mature ? idleFrameAt(item, clock, seedKey) : stage;
    const asset = frameAt(item, index, allowMissingAssets);
    if (!asset) return {kind: 'missing-actor', type: entry?.type ?? item.kind ?? 'actor', id: entry?.species, xy: iso(col, row), entry};
    return {
      kind: 'asset',
      type: entry?.type ?? item.kind ?? 'actor',
      id: entry?.species,
      species: entry?.species,
      entry,
      item,
      progress,
      stage,
      asset,
      xy: iso(col, row),
      facing,
      authoredFacing:item!==baseItem,
      animation: event,
      // Sprout pop on planting, a happy hop when a creature eats or is collected from.
      hop: event && ((item.kind === 'crop' && event.kind === 'plant') || (item.kind === 'creature' && (event.kind === 'eat' || event.kind === 'claim'))) ? eventHop(event) : 0,
      breeze: item.kind === 'crop' && (!progress.mature || new Set(item.clips?.idle?.frames).size <= 1) ? cropBreeze(entry?.species, clock, {reducedMotion: clock === 0, seed: seedKey}) : null,
      motion: item.kind === 'creature' && !action && (!progress.mature || new Set(item.clips?.idle?.frames).size <= 1) ? creatureMotion(entry?.species, clock, {reducedMotion: clock === 0, index: target.creatureIndex ?? 0, mature: progress.mature, facing}) : null,
      ...target,
    };
  }

  function decorationObjects(state, options = {}) {
    const seen = new Set();
    const rotMap = options.decorationRotations ?? state?.decorationRotations ?? state?.decorRotations ?? {};
    const decorationMap = new Map(decorationPlacements(map, options.decorations, rotMap, options.previewDecoration).map((placement) => [placement.id, placement]));
    return asArray(state?.decorations).filter(id => !isDefaultDecorHidden(options.decorations, id) || options.previewDecoration?.itemId === id).map((id) => {
      const key = String(id);
      const placement = decorationMap.get(key);
      if (!placement) throw new Error(`Không có hình trang trí ${key}.`);
      if (seen.has(key)) throw new Error(`Trang trí bị lặp ${key}.`);
      seen.add(key);
      return {kind: 'decoration', type: 'decoration', ...placement};
    });
  }

  function keepsakeObjects(state, stage = currentStage, decorations = null, preview = null) {
    const source = state?.keepsakes;
    if (!source || typeof source !== 'object' || Array.isArray(source)) return [];
    const objects = [];
    // From chapter 6 (level 100) keepsakes use the compact authored plaza. Before it,
    // keep the old stepped frontier so a keepsake never renders beyond the
    // member's opened land. This is generated display geometry; saved species
    // counts and store-decoration positions are untouched.
    const display = keepsakeDisplayPlacements(stage, keepsakeAnchorRow);
    for (const placement of display) {
      const count = Number(source[placement.species]);
      if (!Number.isFinite(count) || count <= 0 || isDefaultDecorHidden(decorations, 'keepsake:' + placement.species) && preview?.itemId !== 'keepsake:' + placement.species) continue;
      const xy = iso(...(defaultDecorSpot(decorations, 'keepsake:' + placement.species, preview) ?? placement.anchor));
      objects.push({kind: 'keepsake', type: 'keepsake', id: `keepsake:${placement.species}`, species: placement.species, count, xy});
    }
    return objects;
  }

  function constructionOverlay(state, logicalNow, idAliases, kind) {
    return constructionProgress(constructionFor(state, idAliases, kind), logicalNow);
  }

  function plotIsBuilt(state, index, logicalNow) {
    const plot = map.plots[index];
    if (!plot || !Array.isArray(state?.plots) || index >= state.plots.length) return false;
    return constructionOverlay(state, logicalNow, plotAliases(plot, index), 'Thửa').ready;
  }

  function plotConstruction(state, index) {
    return constructionFor(state, plotAliases(map.plots[index], index), 'Thửa');
  }

  function plotIsVisible(state, index, logicalNow) {
    const plot = map.plots[index];
    if (!plot) return false;
    if (plotIsBuilt(state, index, logicalNow) || plotConstruction(state, index)) return true;
    return (Number(state?.level) || 1) >= Number(plot.requiredLevel || 1);
  }

  function drawPlotSoil(state, logicalNow, showGrid = false) {
    for (let index = 0; index < map.plots.length; index += 1) {
      if (!plotIsBuilt(state, index, logicalNow)) continue;
      const plot = plotBounds(map.plots[index]);
      for (let row = 0; row < plot.height; row += 1) {
        for (let col = 0; col < plot.width; col += 1) {
          const [logicalCol,logicalRow] = plotCellPosition(map.plots[index],row*plot.width+col);
          drawTile(context,soilTile,logicalCol,logicalRow,plotCellScale());
          if (showGrid) {
            const [x, y] = iso(logicalCol, logicalRow);
            drawDiamond(context,x,y,null,'rgba(36,72,63,.54)',map,plotCellScale());
          }
        }
      }
    }
  }

  function plotFrame(plot, color, fill = null) {
    polygon(context, plotCorners(plot), fill, color, 2);
  }

  function drawBuiltPen(pen,state,clock){
    const residents=habitatResidents(pen,asArray(state.creatures),map.creatureSpots,iso);
    const sharedEast=Math.abs(currentStage.right-(pen.col+pen.width))<0.001;
    const enclosure=pen;
    const corners=penCorners(enclosure),key=activeWeather+':'+JSON.stringify([corners,residents]);
    let cached=penHabitatLayers.get(pen.id);
    if(cached?.key!==key){
      const left=Math.floor(Math.min(...corners.map(p=>p[0])))-20;
      const top=Math.floor(Math.min(...corners.map(p=>p[1])))-32;
      const right=Math.ceil(Math.max(...corners.map(p=>p[0])))+20;
      const bottom=Math.ceil(Math.max(...corners.map(p=>p[1])))+20;
      const layer=makeCanvas(canvas,right-left,bottom-top),brush=layer.getContext('2d');brush.translate(-left,-top);
      drawPenHabitat(brush,{corners,pen:enclosure,iso,weatherMode:activeWeather,personalized:residents.length>0});
      for(const piece of penFencePieces(enclosure,iso,{sharedEast}))drawPenFence(brush,piece,activeWeather);
      drawHabitatProps(brush,residents,{weatherMode:activeWeather,imageFor});
      cached={key,layer,left,top};penHabitatLayers.set(pen.id,cached);
    }
    context.drawImage(cached.layer,cached.left,cached.top);
    drawHabitatMotion(context,residents,{clock,reducedMotion:clock===0,weatherMode:activeWeather});
  }

  function drawBuiltPlotBorder(plot,index){
    const corners=plotCorners(plot),key=activeWeather+':'+JSON.stringify(corners);
    let cached=plotBorderLayers.get(index);
    if(cached?.key!==key){
      const left=Math.floor(Math.min(...corners.map(p=>p[0])))-20,top=Math.floor(Math.min(...corners.map(p=>p[1])))-20;
      const width=Math.ceil(Math.max(...corners.map(p=>p[0])))-left+20,height=Math.ceil(Math.max(...corners.map(p=>p[1])))-top+20;
      const layer=makeCanvas(canvas,width,height),brush=layer.getContext('2d');brush.translate(-left,-top);
      drawRaisedPlotBorder(brush,corners,{weatherMode:activeWeather,index});
      cached={key,layer,left,top};plotBorderLayers.set(index,cached);
    }
    context.drawImage(cached.layer,cached.left,cached.top);
  }

  function drawPlotFrames(state, logicalNow, selectedPlot) {
    for (let index = 0; index < map.plots.length; index += 1) {
      const plot = map.plots[index];
      const built = plotIsBuilt(state, index, logicalNow);
      const constructionJob = plotConstruction(state, index);
      const construction = constructionProgress(constructionJob, logicalNow);
      if (!plotIsVisible(state, index, logicalNow)) continue;
      if (construction && !construction.ready) {
        plotFrame(plot, '#b49a66', 'rgba(177,139,92,.06)');
        const [cx, cy] = iso(...resolvedPlotPosition(plot));
        drawProgress(context, cx, cy - 30, construction.progress);
        label(context, `${Math.round(construction.progress * 100)}%`, cx, cy - 46, '#f5d69a', 'bold 10px sans-serif');
      } else if (built || constructionJob) {
        drawBuiltPlotBorder(plot,index);
        plotFrame(plot, index === selectedPlot ? '#f5d69a' : 'rgba(245,214,154,.28)', null);
      } else {
        plotFrame(plot, 'rgba(113,130,122,.62)', 'rgba(113,130,122,.035)');
      }
    }
  }

  function drawLayoutSwapPreview(previewLayout) {
    if (!previewLayout || typeof previewLayout !== 'object') return;
    const {kind, sourceSlot, targetSlot} = previewLayout;
    const slots = kind === 'pen' ? authoredSlots.pens : authoredSlots.plots;
    const src = slots?.[sourceSlot];
    const dst = slots?.[targetSlot];
    if (src) {
      const corners = kind === 'pen' ? penCorners(src) : plotCorners(src);
      polygon(context, corners, 'rgba(183,222,224,0.16)', '#b7dee0', 3, true);
      const [sx, sy] = iso(src.col + src.width / 2, src.row + src.height / 2);
      label(context, `NỀN HIỆN TẠI #${sourceSlot + 1}`, sx, sy - 18, '#b7dee0', 'bold 11px sans-serif');
    }
    if (dst && targetSlot !== sourceSlot) {
      const corners = kind === 'pen' ? penCorners(dst) : plotCorners(dst);
      polygon(context, corners, 'rgba(245,214,154,0.24)', '#f5d69a', 3, false);
      const [tx, ty] = iso(dst.col + dst.width / 2, dst.row + dst.height / 2);
      label(context, `⇄ CHUYỂN TỚI NỀN #${targetSlot + 1}`, tx, ty - 18, '#f5d69a', 'bold 12px sans-serif');
    }
  }

  function drawSelection(state, selectedPlot, lineCells) {
    const index = Number(selectedPlot);
    if (!Number.isInteger(index) || index < 0 || index >= map.plots.length || !Array.isArray(state?.plots) || index >= state.plots.length) return;
    const plot = plotBounds(map.plots[index]);
    context.lineWidth = 2;
    for (const slot of asArray(lineCells)) {
      const slotIndex = Number(slot);
      if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= plot.width * plot.height) continue;
      const [col,row] = plotCellPosition(map.plots[index],slotIndex);
      const [x, y] = iso(col, row);
      drawDiamond(context,x,y,'rgba(245,214,154,.24)','#f5d69a',map,plotCellScale());
    }
  }

  function drawPenLabels(state, logicalNow) {
    const built = new Set(asArray(state?.built).map((id) => String(typeof id === 'object' ? id.id : id)));
    for (let index = 0; index < map.pens.length; index += 1) {
      const pen = map.pens[index];
      const isBuilt = built.has(String(pen.id));
      const constructionJob = constructionFor(state, penAliases(pen), 'Chuồng');
      const construction = constructionProgress(constructionJob, logicalNow);
      const queued = Boolean(constructionJob);
      if (!isBuilt && !queued && (Number(state?.level) || 1) < Number(pen.requiredLevel || 1)) continue;
      // Put labels beyond the outer rail, never across the shared pen/perimeter edge.
      const [x, groundY] = iso(currentStage.right + .8, pen.row + pen.height - .3);
      const y = groundY + 14;
      if (construction && !construction.ready) {
        label(context, `C${index + 1} ${Math.round(construction.progress * 100)}%`, x, y, '#f5d69a', 'bold 10px sans-serif');
      } else if (isBuilt || queued) {
        label(context, `CHUỒNG ${index + 1}`, x, y, '#f5d69a', 'bold 10px sans-serif');
      } else {
        label(context, `Lv ${pen.requiredLevel}`, x, y, '#a6b1ae', 'bold 10px sans-serif');
      }
    }
  }

  function drawActorOverlay(object, logicalNow) {
    if (!object.item || !object.progress) return;
    const {entry, item, progress, asset, xy} = object;
    if(item.kind==='crop'){
      if(progress.mature){context.fillStyle='#f5d69a';context.fillRect(xy[0]-2,xy[1]-48,4,4);}
      return; // Timing belongs to the contextual shelf, not nine overlapping labels.
    }
    const remaining = growthRemaining(progress);
    if (!progress.mature && remaining != null && (item.kind !== 'creature' || entry?.meal)) {
      const offset = Math.max(46, finite(asset?.height, 64) * 0.8);
      label(context, roundedTime(remaining), xy[0], xy[1] - offset, '#d6d8bf', 'bold 10px monospace');
    }
    if (entry?.type === 'creature' || item.kind === 'creature') {
      const meal = entry?.meal;
      const readyAt = Number(meal?.readyAt);
      if (Number.isFinite(readyAt)) {
        if (logicalNow >= readyAt) drawBubble(context, xy[0] + 20, xy[1] - 44, '🍽', '#f5d69a');
        else label(context, roundedTime(readyAt - logicalNow), xy[0], xy[1] - Math.max(54, finite(asset?.height, 64) * 0.72), '#b7dee0', 'bold 10px monospace');
      } else if (entry?.hungry === true || entry?.needsMeal === true || (meal === null && !progress.mature)) {
        drawBubble(context, xy[0] + 20, xy[1] - 44, '!', '#ed8a45');
      }
      if (Number(object.affinityLevel) >= 2) {
        label(context, `♥${object.affinityLevel}`, xy[0] - 20, xy[1] - 44, '#ffc36b', 'bold 9px monospace');
      }
    }
  }

  function drawObject(object, logicalNow, clock = 0) {
    if(object.kind==='cottage-corner'){
      const img=imageFor('world-v242/cottage-corner.png');
      if(img){context.imageSmoothingEnabled=false;context.drawImage(img,Math.round(object.xy[0]-75),Math.round(object.xy[1]-67),150,75);}
      return;
    }
    if(object.kind==='festival'){
      const frame=decorFrameAt(object.asset,clock,{seed:object.id,reducedMotion:clock===0});
      drawAsset(frame.file?{...object.asset,file:frame.file,...(frame.atlasRect?{atlasRect:frame.atlasRect}:{})}:object.asset,object.xy[0],object.xy[1]);
      drawHeroMotion(context,object,activeEvent,clock);return;
    }
    if (object.kind === 'store-decor') {
      context.save();
      if (object.preview) context.globalAlpha = 0.65;
      const frameInfo = decorFrameAt(object.asset, clock, {
        facing: object.facing,
        seed: `${object.id}:${object.slot}`,
        reducedMotion: clock === 0,
      });
      const activeAsset = frameInfo.file
        ? {...object.asset, file: frameInfo.file, bounds: frameInfo.bounds ?? object.asset.bounds,...(frameInfo.atlasRect?{atlasRect:frameInfo.atlasRect}:{})}
        : object.asset;
      const needsFallbackFlip = frameInfo.facing === 'right' && !object.asset?.rightFile && !(object.asset?.rightFrames?.length);
      drawAsset(activeAsset, object.xy[0], object.xy[1], null, null, needsFallbackFlip);
      context.restore();
      return;
    }
    if (object.kind === 'wizard-scenery') {
      const assetId = object.id === 'gardener'
        ? 'gardener_friend'
        : object.id === 'owl'
          ? 'owl_post'
          : object.id === 'greenhouse'
            ? 'herbology_greenhouse'
            : null;
      const asset = assetId && decorAssets.get(assetId);
      if (asset) {
        const greeting = object.id === 'gardener' && reactionUntil > performance.now();
        const activeFrames=object.id==='gardener'?asset.frames.slice(greeting?2:0,greeting?4:2):asset.frames;
        const frameInfo = decorFrameAt({...asset,frames:activeFrames}, clock, {
          facing: 'default',
          seed: object.id,
          greet: false,
          reducedMotion: clock === 0,
        });
        const activeAsset = {...asset,...(frameInfo.file?{file:frameInfo.file}:{}),...(frameInfo.atlasRect?{atlasRect:frameInfo.atlasRect}:{}),...(object.id==='greenhouse'?{seasonalKind:'greenhouse-roof'}:{})};
        drawAsset(activeAsset, object.xy[0], object.xy[1]);
        if (greeting) label(context, '♥', object.xy[0], object.xy[1] - 85, '#f5d69a', 'bold 16px sans-serif');
        if (object.id === 'gardener' && object.speechText) {
          drawHagridSpeechBubble(context, object.xy[0], object.xy[1], object.speechText, {emphasized: greeting, scale: object.speechScale || 1, align: object.speechScale ? 'right' : 'center'});
        }
      } else {
        object.draw(context);
      }
      return;
    }
    if (object.kind === 'boundary-fence') { context.drawImage(object.layer, object.left, object.top);drawSeasonalFence(context,object,activeWeather,activeEvent,clock); return; }
    if (object.kind === 'decoration') {
      const asset = earnedDecorArt(object.id, object.facing);
      const image = asset?.file ? imageFor(asset.file) : null;
      drawDecoration(context, object, clock, {asset, image});
      return;
    }
    if (object.kind === 'keepsake') {
      const asset=KEEPSAKE_ART[object.species],image=asset&&imageFor(asset.file);
      drawKeepsake(context,object,clock,{asset,image});
      return;
    }
    if (object.kind === 'asset') {
      drawAsset(object.asset, object.xy[0], object.xy[1] + (object.hop || 0), object.stage > 0 ? object.breeze : null, object.motion, object.facing === 'right'&&!object.authoredFacing);
      if (object.type === 'prop' && object.id === 'hut') {drawHutMotion(context, object.xy[0], object.xy[1], clock);drawRoofWeather(context,object,activeWeather,clock);}
      if (object.item?.kind === 'crop') drawCropBreeze(context, object);
      if (object.item?.kind === 'creature' && object.motion?.sparkle) {
        drawPixelSparkle(context, object.xy[0] + (object.motion.swayX || 0) * 8, object.xy[1] - 42 + (object.motion.bobY || 0), '#f5d69a', 1);
      }
      drawActorOverlay(object, logicalNow);
      if (object.guest && object.hungry) drawCreatureBubble(context, object.xy[0], object.xy[1] + (object.hop || 0) - finite(object.asset?.pivotY, 0) + finite((object.asset?.bounds ?? {}).y, 0), 'Đói…', {scale: speechScale, avoid: sceneryVisible ? {xy: wizardTargets(iso).find((t) => t.id === 'owl')?.xy, asset: decorAssets.get('owl_post')} : null});
      return;
    }
    if (object.kind === 'pen-front') {
      drawPenFront(context, object.pen, object.scaffold);
      return;
    }
    if (object.kind === 'missing-actor') {
      context.save();
      context.strokeStyle = '#e07a9e';
      context.setLineDash?.([5, 4]);
      context.strokeRect(object.xy[0] - 28, object.xy[1] - 48, 56, 48);
      context.setLineDash?.([]);
      context.fillStyle = '#e07a9e';
      context.font = 'bold 9px monospace';
      context.textAlign = 'center';
      context.fillText('MOTION?', object.xy[0], object.xy[1] - 26);
      context.restore();
    }
  }

  function animationAnchors(event, state) {
    if (guestActor && event.species === guestActor.species && event.plot === undefined
      && !asArray(state?.creatures).some((entry) => entry?.species === event.species)) return [iso(guestActor.col, guestActor.row)];
    if (event.species && event.creatureIndex !== undefined) {
      const spot = map.creatureSpots[event.creatureIndex];
      return Array.isArray(spot) ? [iso(spot[0], spot[1])] : [];
    }
    if (event.species && event.plot === undefined) {
      const index = asArray(state?.creatures).findIndex((entry) => entry?.species === event.species);
      const spot = map.creatureSpots[index];
      return Array.isArray(spot) ? [iso(spot[0], spot[1])] : [];
    }
    if (event.plot === undefined || !map.plots[event.plot]) return [];
    const bounds = plotBounds(map.plots[event.plot]);
    const cells = event.cells?.length ? event.cells : [Math.floor((bounds.width * bounds.height) / 2)];
    return cells.map((cell) => iso(...plotCellPosition(map.plots[event.plot],cell)));
  }

  function drawAnimationEffects(state, events) {
    for (const event of events) {
      const anchors = animationAnchors(event, state);
      for (const [x, y] of anchors) {
        if (event.kind === 'eat') drawEatEffect(context, x, y, event.progress);
        else if (event.kind === 'claim') drawClaimEffect(context, x, y, event.progress);
        else if ((event.kind === 'care' || event.kind === 'water') && !authoredEffectEventIds.has(event.id)) {
          drawCareEffect(context, x, y, event.progress, event.kind);
        }
        else if (event.kind === 'plant' || event.kind === 'harvest') {
          const pop = harvestPop(event);
          const item=event.species&&items.get(event.species);
          const duration=item?.clips?.action?.durations?.reduce((sum,ms)=>sum+ms,0)||0;
          const action=duration?animationFrameAt(item,'action',event.progress*duration,{loop:false}):null;
          const ripe = pop && item ? frameAt(item,action?.frame??3,true) : null;
          if (ripe) {
            context.save();
            context.globalAlpha = pop.alpha;
            drawAsset(ripe, x, y + pop.dy);
            context.restore();
          }
          drawPixelSparkle(context, x, y - 8 + (pop?.dy || 0), event.kind === 'plant' ? '#b0bd67' : '#f5d69a', 1);
        }
      }
    }
  }

  let lastOrder = [];
  let interactiveDecor = [], interactiveEarnedDecor = [], interactiveKeepsakes = [], interactivePond = [], interactiveActors = [], sceneryVisible=true, reactionUntil=0;
  let lastBuiltPlotCount = 0;
  let lastPlotReady = [];

  function applyLayout(layout) {
    const projected = mapLayoutToScene(authoredSlots, layout);
    map.plots = projected.plots;
    map.pens = projected.pens;
    map.creatureSpots = projected.creatureSpots;
    if (canvas.dataset) canvas.dataset.creatureSpots = JSON.stringify(map.creatureSpots);
  }

  function render(state = {}, options = {}) {
    const now = finite(options.now, Date.now());
    const clock = finite(options.clock, 0);
    const animationClock = finite(options.animationClock, clock);
    const selectedPlot = Number.isInteger(Number(options.selectedPlot)) ? Number(options.selectedPlot) : 0;
    const lineCells = asArray(options.line);
    const propsVisible = options.propsVisible !== false;
    const grid = options.grid === true;
    const qaActor = options.qaActor ?? null;
    const hagridLine = options.hagridLine || null;
    const tutorialFocus = options.tutorialFocus || null;
    speechScale = Math.max(1, finite(options.speechScale, 1));
    labelScale = Math.min(2.6, Math.max(1, finite(options.labelScale, 1)));
    if (canvas.dataset) canvas.dataset.speechScale = String(speechScale);
    guestActor = options.guestActor || null;
    const atmosphereMode = options.atmosphereMode || 'day';
    const weatherMode = options.weatherMode || 'clear';
    const eventMode = options.eventMode || 'none';
    prepareWeather(weatherMode);syncBackdropLighting(atmosphereMode,weatherMode);activeEvent=eventMode;
    const creatureFacings = options.creatureFacings ?? state?.creatureFacings ?? {};
    const creatureAffinities = options.creatureAffinities ?? {};
    applyLayout(state?.layout);
    const storeDecorationObjects = decorObjects(options.decorations, decorAssets, iso, options.previewDecoration);
    const earnedDecorationObjects = decorationObjects(state, options);
    const occupiedPoints = [];
    // Only a legacy socket may widen the garden: a free spot is checked against the opened ground, and the
    // piece being placed must never open land the level has not reached (owner 20/10/2026).
    for (const object of storeDecorationObjects) {
      if (object.preview || options.decorations?.positions?.[object.id]) continue;
      occupiedPoints.push([object.col - 1, object.row - 0.5], [object.col + 1, object.row + 0.5]);
    }
    for (const object of earnedDecorationObjects) {
      occupiedPoints.push(
        [object.col - 0.5, object.row - 0.5],
        [object.col + object.width, object.row + object.height],
      );
    }
    // Keepsakes are cosmetic, but a legacy save can contain one from the
    // south aisle before that aisle was unlocked. Keep its horizontal cell in
    // the stage calculation without using authored row 25 to force expansion.
    const keepsakeSource = state?.keepsakes;
    if (keepsakeSource && typeof keepsakeSource === 'object' && !Array.isArray(keepsakeSource)) {
      for (const placement of KEEPSAKE_LEGACY_LAYOUT) {
        const count = Number(keepsakeSource[placement.species]);
        if (Number.isFinite(count) && count > 0) occupiedPoints.push([placement.col + 0.5, 8]);
      }
    }
    currentStage = gardenStage(state, map, occupiedPoints);
    prepareStage(currentStage);
    if (canvas.dataset) {
      canvas.dataset.gardenStage = String(currentStage.id);
      canvas.dataset.stageName = currentStage.name;
      canvas.dataset.atmosphere = String(atmosphereMode);
      canvas.dataset.weather = String(weatherMode);
      canvas.dataset.event = String(eventMode);
      canvas.dataset.worldVersion="24.4";
    }
    animation.setClock(animationClock);
    activeAnimations = animation.active(animationClock, {reducedMotion: clock === 0});
    authoredEffectEventIds = new Set();
    const logicalNow = finite(nowFor(state, now), now);
    const builtPlotCount = Math.min(map.plots.length, asArray(state.plots).length);
    lastBuiltPlotCount = builtPlotCount;
    lastPlotReady = map.plots.map((_, index) => plotIsBuilt(state, index, logicalNow));

    context.imageSmoothingEnabled = false;
    context.clearRect(0, 0, map.width, map.height);
    context.fillStyle = '#142620';
    context.fillRect(0, 0, map.width, map.height);
    const terrain = terrainCache(grid, propsVisible);
    context.drawImage(terrain, 0, 0);
    drawPlotSoil(state, logicalNow, grid);
    drawV24Ground(context,{weatherMode,clock,iso,stage:currentStage,map});
    drawSelection(state, selectedPlot, lineCells);
    drawPlotFrames(state, logicalNow, selectedPlot);
    if (options.previewLayout) drawLayoutSwapPreview(options.previewLayout);
    drawPlacementGrid(context,options.previewDecoration,iso);

    sceneryVisible=propsVisible;
    let matureCropCount = 0;
    for (const plot of asArray(state.plots)) {
      for (const slot of asArray(plot?.slots)) {
        if (slot && growthFor(slot, logicalNow).mature) matureCropCount += 1;
      }
    }
    let readyMealCount = 0;
    let hungryCreatureCount = 0;
    for (const cr of asArray(state.creatures)) {
      if (cr?.meal && Number(cr.meal.readyAt) <= logicalNow) readyMealCount += 1;
      else if (!cr?.meal) hungryCreatureCount += 1;
    }
    const greetingActive = reactionUntil > performance.now();
    // muteHagridSpeech: the tutorial shows Hagrid's line as a screen-space bubble instead.
    const showPeriodicSpeech = !options.muteHagridSpeech && (Boolean(hagridLine) || greetingActive || options.showHagridSpeech === true || (clock > 0 && Math.floor(clock / 4800) % 3 === 0));
    const wizList = propsVisible
      ? wizardObjects(iso, clock, {reactionUntil}).map((w) => (
        w.id === 'gardener' && showPeriodicSpeech
          ? {
            ...w,
            speechScale: hagridLine ? speechScale : 1,
            speechText: hagridLine || hagridSpeechFor(state, {
              matureCropCount,
              readyMealCount,
              hungryCreatureCount,
              atmosphereMode,
              weatherMode,
              eventMode,
              greeted: greetingActive,
            }),
          }
          : w
      ))
      : [];
    const objects = [...boundaryFence, ...wizList, ...storeDecorationObjects];
    if (propsVisible) {
      for (const prop of map.objects ?? []) {
        // Legacy edge-tree anchors straddled the fence; the bounded forest layers own trees now.
        if (prop.id === 'oak' || prop.id === 'pine' || isDefaultDecorHidden(options.decorations, 'scene:' + prop.id) && options.previewDecoration?.itemId !== 'scene:' + prop.id) continue;
        if (prop.id !== 'hut' && !stageContains(currentStage, Number(prop.col), Number(prop.row))) continue;
        const asset = props.get(prop.id);
        if (!asset) throw new Error(`Không có prop asset ${prop.id}.`);
        const xy = iso(...(defaultDecorSpot(options.decorations, 'scene:' + prop.id, options.previewDecoration) ?? [prop.col, prop.row]));
        objects.push({kind: 'asset', type: 'prop', id: prop.id, species: prop.id, asset:{...asset,seasonalKind:prop.id==='hut'?'roof':['oak','pine'].includes(prop.id)?'tree':'water'}, xy});
      }
    }

    const builtPenIds = new Set(asArray(state.built).map((id) => String(typeof id === 'object' ? id.id : id)));
    for (const pen of map.pens ?? []) {
      const construction = constructionOverlay(state, logicalNow, penAliases(pen), 'Chuồng');
      const isBuilt = builtPenIds.has(String(pen.id));
      if (construction && !construction.ready) {
        drawPenGround(context, pen, true);
        objects.push({kind: 'pen-front', type: 'scaffold', id: `${pen.id}:scaffold`, pen, scaffold: true, xy: iso(pen.col + pen.width, pen.row + pen.height)});
      } else if (isBuilt) {
        drawBuiltPen(pen,state,clock);
      }
    }

    objects.push(...earnedDecorationObjects, ...keepsakeObjects(state, currentStage, options.decorations, options.previewDecoration));

    for (let plotIndex = 0; plotIndex < builtPlotCount; plotIndex += 1) {
      if (!lastPlotReady[plotIndex]) continue;
      const entryList = asArray(state.plots[plotIndex]?.slots);
      const bounds = plotBounds(map.plots[plotIndex]);
      for (let slot = 0; slot < entryList.length && slot < bounds.width * bounds.height; slot += 1) {
        const entry = entryList[slot];
        if (!entry) continue;
        const [col,row] = plotCellPosition(map.plots[plotIndex],slot);
        const crop = actorObject(entry, col, row, logicalNow, clock, {plot: plotIndex, cell: slot});
        // Ripe crops in the selected (or tutorial) plot give a short authored tug now and
        // then, saying "ready"; the tutorial repeats it faster. Crops without an action
        // clip fall back to a whole-pixel wiggle in the tutorial only.
        const tutorialPlot = tutorialFocus?.mode === 'harvest' && tutorialFocus.plot === plotIndex;
        if (crop.kind === 'asset' && crop.progress?.mature && clock > 0 && !crop.animation && (tutorialPlot || plotIndex === selectedPlot)) {
          const clip = crop.item?.clips?.action;
          if (clip && new Set(clip.frames).size > 1) {
            const period = tutorialPlot ? 1500 : 3400;
            const shot = animationFrameAt(crop.item, 'action', (clock + stableHash(entry.id ?? slot) % period) % period, {loop: false});
            const tug = shot && !shot.done ? frameAt(crop.item, shot.frame, allowMissingAssets) : null;
            if (tug) crop.asset = tug;
          } else if (tutorialPlot && !crop.hop) {
            crop.hop = [0, -1, -2, -1][Math.floor(clock / 110) % 4];
          }
        }
        objects.push(crop);
      }
    }

    for (let index = 0; index < asArray(state.creatures).length && index < map.creatureSpots.length; index += 1) {
      const entry = state.creatures[index];
      const spot = map.creatureSpots[index];
      if (!Array.isArray(spot) || spot.length < 2 || !entry) continue;
      const facing = creatureFacings[entry.species] === 'right' ? 'right' : 'default';
      const actor = actorObject(entry, spot[0], spot[1], logicalNow, clock, {creatureIndex: index, facing});
      actor.affinityLevel = Number(creatureAffinities[entry.species]) || 1;
      objects.push(actor);
    }

    if (guestActor && itemFor(guestActor.species)) {
      const config = CREATURE[guestActor.species];
      const guest = actorObject({type: 'creature', species: guestActor.species, mealsCompleted: config?.mealsToAdult ?? 6, meal: null},
        guestActor.col, guestActor.row, logicalNow, clock, {guest: true});
      guest.hungry = guestActor.hungry === true;
      objects.push(guest);
    }

    if (qaActor) {
      const item = itemFor(qaActor.species);
      const [col, row] = qaActor.col != null && qaActor.row != null
        ? [qaActor.col, qaActor.row]
        : qaActor.position === 'behind' ? [20, 8.5]
          : qaActor.position === 'front' ? [21, 14.5]
            : [20, 11];
      if (item) {
        const asset = frameAt(item, qaActor.frame ?? 4, allowMissingAssets);
        if (asset) objects.push({kind: 'asset', type: 'qa', id: qaActor.species, species: qaActor.species, asset, xy: iso(col, row)});
      }
    }

    if(propsVisible)objects.push({kind:'cottage-corner',type:'scenery',id:'cottage-corner',xy:iso(-2,5.5)});
    if(propsVisible)objects.push(...festivalObjects({eventMode,stage:currentStage,map,iso,decorAssets,occupied:[...storeDecorationObjects,...earnedDecorationObjects]}));
    objects.sort((a, b) => (a.xy?.[1] ?? 0) - (b.xy?.[1] ?? 0) || (a.xy?.[0] ?? 0) - (b.xy?.[0] ?? 0));
    interactiveDecor=objects.filter(o=>o.kind==='store-decor'&&!o.preview);
    interactiveEarnedDecor=objects.filter(o=>o.kind==='decoration');
    interactiveKeepsakes=objects.filter(o=>o.kind==='keepsake');
    interactivePond=objects.filter(o=>o.type==='prop'&&o.id==='pond');
    interactiveActors=objects.filter(o=>o.item?.kind==='creature').map(o=>({species:o.species,xy:o.xy,asset:o.asset,facing:o.facing,authoredFacing:o.authoredFacing,affinityLevel:o.affinityLevel,guest:o.guest===true}));
    lastOrder = objects.map((object) => ({id: object.id ?? object.species, y: object.xy?.[1] ?? 0, type: object.type}));
    for (const object of objects) drawObject(object, logicalNow, clock);
    drawAnimationEffects(state, activeAnimations);
    if (tutorialFocus && map.plots[tutorialFocus.plot]) drawTutorialFocus(context, plotCorners(map.plots[tutorialFocus.plot], map), clock);
    const sBounds = stageWorldBounds(map, currentStage);
    // Owner 27/10/2026: the four slanted sun shafts read as stray stripes over the garden; removed.
    if (atmosphereMode !== 'day' || (weatherMode && weatherMode !== 'clear')) {
      drawAtmosphereOverlay(context, map.width, map.height, {
        mode: atmosphereMode,
        weatherMode,
        clock,
        objects,
        stageBounds: sBounds,
      });
    }
    if (eventMode && eventMode !== 'none') {
      drawEventOverlay(context, map.width, map.height, {
        eventMode,
        clock,
        stageBounds: sBounds,
      });
    }

    for (let index = 0; index < map.plots.length; index += 1) {
      const plot = map.plots[index];
      if (!plotIsVisible(state, index, logicalNow)) continue;
      const [x, y] = iso(...resolvedPlotPosition(plot, 'label'));
      const built = plotIsBuilt(state, index, logicalNow);
      const queued = Boolean(plotConstruction(state, index));
      if (!built) {
        label(context, queued ? `THỬA ${index + 1}` : `T${index + 1} · Lv ${plot.requiredLevel}`, x, y, queued ? '#d6d8bf' : '#a6b1ae', 'bold 11px sans-serif');
        continue;
      }
      // Each built plot says how it is doing: ripe count, or the time until its first crop ripens.
      const slots = (state.plots?.[index]?.slots ?? []).filter(Boolean);
      const ripe = slots.filter(entry => growthFor(entry, logicalNow).mature).length;
      const left = slots.length && !ripe ? Math.min(...slots.map(entry => entry.plantedAt + (entry.growMs ?? growthFor(entry, logicalNow).growMs) - logicalNow)) : 0;
      const tag = ripe ? ` · CHÍN ${ripe}` : slots.length ? ` · ${shortTime(left)}` : '';
      label(context, `THỬA ${index + 1}${tag}`, x, y, ripe ? '#231f2e' : index === selectedPlot ? '#f5d69a' : '#e8f0ed', `bold ${Math.round(12 * labelScale)}px sans-serif`, ripe ? 'rgba(244,206,98,.94)' : 'rgba(18,38,33,.88)');
    }
    drawPenLabels(state, logicalNow);

  }

  function pick(clientX, clientY) {
    const rect = typeof canvas.getBoundingClientRect === 'function' ? canvas.getBoundingClientRect() : null;
    const world = clientToWorld(clientX, clientY, rect, canvas.width, canvas.height);
    const hit = pickFromWorld(world.x, world.y, lastBuiltPlotCount, map);
    const plotHit = hit && lastPlotReady[map.plots.findIndex((plot) => (plot.id ?? map.plots.indexOf(plot)) === hit.plot)] ? hit : null;
    // Placement lets a piece share a sliver of a plot on screen; a tap on a crop cell under its padded box
    // still belongs to the crop.
    if (!plotHit) for (const actor of [...interactiveDecor].reverse()) {
      const {xy, asset, facing} = actor;
      const b = (facing === 'right' && asset.rightBounds)
        ? asset.rightBounds
        : (asset.bounds ?? {x: 0, y: 0, w: asset.width, h: asset.height});
      const left = xy[0] - asset.pivotX + b.x;
      const top = xy[1] - asset.pivotY + b.y;
      if (world.x >= left - 5 && world.x <= left + b.w + 5 && world.y >= top - 5 && world.y <= top + b.h + 5) {
        return {kind: 'decoration', itemId: actor.id, slot: actor.slot, facing: actor.facing};
      }
    }
    // The tutorial guest is tiny on phones: accept taps within ~44 CSS px of it.
    const cssScale=rect&&canvas.width?rect.width/canvas.width:1;
    for(const actor of interactiveActors){
      if(!actor.guest)continue;
      const r=Math.max(30,26/cssScale);
      if(Math.abs(world.x-actor.xy[0])<=r&&world.y>=actor.xy[1]-r*1.6&&world.y<=actor.xy[1]+r*.5)return {kind:'creature',species:actor.species,guest:true};
    }
    for(const actor of [...interactiveActors].reverse()){
      const {xy,asset}=actor;
      const bounds=asset.bounds??{x:0,y:0,w:asset.width,h:asset.height};
      const left=actor.facing==='right'&&!actor.authoredFacing?xy[0]+asset.pivotX-bounds.x-bounds.w:xy[0]-asset.pivotX+bounds.x,top=xy[1]-asset.pivotY+bounds.y;
      if(world.x>=left-5&&world.x<=left+bounds.w+5&&world.y>=top-5&&world.y<=top+bounds.h+5)return {kind:'creature',species:actor.species,...(actor.guest?{guest:true}:{})};
    }
    if(sceneryVisible)for(const target of wizardTargets(iso).sort((a,b)=>b.xy[1]-a.xy[1])){
      const b=target.hitbox;if(world.x>=b.left&&world.x<=b.right&&world.y>=b.top&&world.y<=b.bottom)return {kind:'wizard',id:target.id};
    }
    if (plotHit) return plotHit;
    for (const kp of [...interactiveKeepsakes].reverse()) {
      const [kx, ky] = kp.xy;
      if (world.x >= kx - 18 && world.x <= kx + 18 && world.y >= ky - 38 && world.y <= ky + 6) {
        return {kind: 'keepsake', species: kp.species, count: kp.count};
      }
    }
    for (const decor of [...interactiveEarnedDecor].reverse()) {
      const [dx, dy] = decor.xy;
      const asset = earnedDecorArt(decor.id, decor.facing);
      const bounds = asset?.bounds ?? {x: 0, y: 0, w: asset?.width ?? 96, h: asset?.height ?? 112};
      const pivotX = Number.isFinite(Number(asset?.pivotX)) ? Number(asset.pivotX) : 48;
      const pivotY = Number.isFinite(Number(asset?.pivotY)) ? Number(asset.pivotY) : 96;
      const left = dx - pivotX + bounds.x;
      const top = dy - pivotY + bounds.y;
      if (world.x >= left - 5 && world.x <= left + bounds.w + 5 && world.y >= top - 5 && world.y <= top + bounds.h + 5) {
        return {kind: 'earned-decoration', itemId: decor.id, label: decor.label, facing: decor.facing};
      }
    }
    for (const {xy, asset: a} of interactivePond) {
      const b = a.bounds ?? {x: 0, y: 0, w: a.width, h: a.height}, left = xy[0] - a.pivotX + b.x, top = xy[1] - a.pivotY + b.y;
      if (world.x >= left && world.x <= left + b.w && world.y >= top && world.y <= top + b.h) return {kind: 'pond', itemId: 'scene:pond'};
    }
    return null;
  }

  return {
    render,
    pick,
    greet:()=>{reactionUntil=performance.now()+2600;},
    animate: (kind, target = {}) => animation.animate(kind, target),
    react: (before, after, options = {}) => animation.react(before, after, options),
    animations: () => animation.events(),
    order: () => lastOrder,
    gridMetrics: () => gardenObjectMetrics(map,motion,[...decorAssets.values()],DECORATION_LAYOUT),
    growthBounds: () => stageWorldBounds(map, currentStage),
    growthStage: () => currentStage,
    images,
    loaded: assetFiles.length - missing.size,
    missing: [...missing],
    map,
  };
}
