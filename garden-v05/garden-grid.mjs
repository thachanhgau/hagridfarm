// One logical square projects to a 64×32 diamond. Art stays at native 1:1;
// sprite height is elevation, never a reason to stretch its ground footprint.
export const ISO_TILE = Object.freeze({width: 64, height: 32});
export const nativePixelScale = scale => Math.max(1, Math.round(Number(scale) || 1));
export const GRID_STEP = 0.5; // Saved member positions and server command precision.
const currentScene = () => globalThis.FARM_SCENE;
export const sceneOrigin = (scene = currentScene()) => scene?.origin ?? {x: 0, y: 0};
export const tileWidth = (scene = currentScene()) => Number(scene?.tileWidth) || ISO_TILE.width;
export const tileHeight = (scene = currentScene()) => Number(scene?.tileHeight) || ISO_TILE.height;

export function iso(col, row, scene = currentScene()) {
  const origin = sceneOrigin(scene);
  return [origin.x + (col - row) * tileWidth(scene) / 2, origin.y + (col + row) * tileHeight(scene) / 2];
}

export function worldToGrid(x, y, scene = currentScene()) {
  const origin = sceneOrigin(scene), dx = (x - origin.x) / (tileWidth(scene) / 2), dy = (y - origin.y) / (tileHeight(scene) / 2);
  return [(dx + dy) / 2, (dy - dx) / 2];
}

export const snapGridPoint = ([col, row]) => [col, row].map(value => Math.round(value / GRID_STEP) * GRID_STEP);

export function worldToCell(x, y, scene = currentScene()) {
  const [col, row] = worldToGrid(x, y, scene).map(Math.round);
  const [cx, cy] = iso(col, row, scene);
  return Math.abs(x - cx) / (tileWidth(scene) / 2) + Math.abs(y - cy) / (tileHeight(scene) / 2) <= 1.04 ? {col, row} : null;
}

export function plotBounds(plot) {
  return {col: Number(plot?.col) || 0, row: Number(plot?.row) || 0, width: Number(plot?.width) || 3, height: Number(plot?.height) || 3};
}

// Kept as an API for soil, picking and old consumers. A crop now occupies one
// common cell, exactly like a 1×1 decoration; no independent plot enlargement.
export const plotCellScale = () => 1;
export function plotCellPosition(plot, index) {
  const b = plotBounds(plot);
  return [b.col + index % b.width, b.row + Math.floor(index / b.width)];
}
export function plotPhysicalBounds(plot) {
  const b = plotBounds(plot);
  return {...b, col: b.col - 0.5, row: b.row - 0.5};
}

export function footprintPixels([cols, rows], scene = currentScene()) {
  if (![cols, rows].every(n => Number.isInteger(n) && n >= 1)) throw new RangeError('Footprint phải là số ô nguyên từ 1×1.');
  return {width: (cols + rows) * tileWidth(scene) / 2, height: (cols + rows) * tileHeight(scene) / 2};
}

export function spriteGridMetrics(asset, footprint = [1, 1], facing = 'default') {
  const oriented = facing === 'right' ? [...footprint] : [...footprint].reverse();
  const width = Number(asset?.width), height = Number(asset?.height);
  if (!(width > 0 && height > 0)) throw new RangeError('Sprite phải có kích thước pixel gốc.');
  return {
    footprint: oriented,
    ground: footprintPixels(oriented),
    sprite: {width, height, pivotX: Number(asset.pivotX ?? width / 2), pivotY: Number(asset.pivotY ?? height)},
    pixelScale: 1,
  };
}

/** Outline each occupied 1×1 square, including internal seams on large pieces. */
export function drawFootprintGrid(context, rect, project, fits) {
  const {c0, c1, r0, r1} = rect;
  context.save();
  context.beginPath();
  [[c0, r0], [c1, r0], [c1, r1], [c0, r1]].forEach(([c, r], i) => {const [x, y] = project(c, r); if (i) context.lineTo(x, y); else context.moveTo(x, y);});
  context.closePath();
  context.fillStyle = fits ? 'rgba(245,214,154,.38)' : 'rgba(199,91,75,.34)';
  context.strokeStyle = fits ? '#f5d69a' : '#c75b4b';
  context.lineWidth = 2;
  context.fill();
  context.stroke();
  context.beginPath();
  for (let c = c0 + 1; c < c1; c++) {context.moveTo(...project(c, r0)); context.lineTo(...project(c, r1));}
  for (let r = r0 + 1; r < r1; r++) {context.moveTo(...project(c0, r)); context.lineTo(...project(c1, r));}
  context.lineWidth = 1;
  context.stroke();
  context.restore();
}

export const FARM_LAYOUT = Object.freeze({
  plotWidth: 3,
  plotHeight: 3,
  plotCount: 18,
  penCount: 6,
  creatureSpotCount: 18, // garden expansion phase 2: 6 pens × 2 + three «Chuồng mở rộng» × 2
});

// Garden expansion phase 2 (docs/garden-expansion-plan.md §2.2, §9): «Chuồng mở rộng» pen_ext_1..3, 5×3 like the six pens
// and drawn with the same pen art, on the free ground south-east of thửa 12 beside chuồng 6, one cell apart like the pen column (22 → 21.5 on 08/11). They never move (the
// layout keeps six pen sockets); land creatures 13–18 take their spots, two each, in this order.
export const EXTENSION_PENS = Object.freeze([
  {id: 'pen_ext_1', col: 27.5, row: 24.5, requiredLevel: 140, spots: [[28.4, 26.4], [31.85, 25.85]]},
  {id: 'pen_ext_2', col: 21.5, row: 20.5, requiredLevel: 220, spots: [[22.4, 22.4], [25.85, 21.85]]},
  {id: 'pen_ext_3', col: 21.5, row: 24.5, requiredLevel: 340, spots: [[22.4, 26.4], [25.85, 25.85]]},
].map(pen => Object.freeze({...pen, width: 5, height: 3})));
