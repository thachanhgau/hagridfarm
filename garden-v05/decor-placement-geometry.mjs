import {isDefaultDecorHidden,defaultDecorSpot} from './default-decor.mjs?v=24.9.88';
import {KEEPSAKE_ART} from './complete-object-art.mjs?v=24.9.88';
import {stageContains} from './garden-growth.mjs?v=24.9.88';

// The scene opens one half-tile beyond the old server adapter. Keep this small
// contract in one client module so placement, rendering and tests do not each
// invent a different final edge.
export const DECORATION_SPACE = Object.freeze({
  minCol: -5,
  maxCol: 33,
  minRow: -1,
  maxRow: 33.5,
});

// From chapter 6 («hoàn thiện sân kỷ vật», level 100) keepsakes form a compact two-row plaza west of the
// south path; the old one-row frontier left no room for a 3×2 piece in a full level-100 garden.
// `col`/`row` are the south-west ground corner, matching decoration footprints;
// species order is the authored CREATURE/KEEPSAKE_ART order and is never used
// as a save key or an inventory count.
export const KEEPSAKE_DISPLAY_LAYOUT = Object.freeze([
  {species: 'puffskein', col: 4.5, row: 24, width: 1, height: 1},
  {species: 'bowtruckle', col: 6.5, row: 24, width: 1, height: 1},
  {species: 'niffler', col: 8.5, row: 24, width: 1, height: 1},
  {species: 'mooncalf', col: 10.5, row: 24, width: 1, height: 1},
  {species: 'kneazle', col: 12.5, row: 24, width: 1, height: 1},
  {species: 'diricawl', col: 17.5, row: 24, width: 1, height: 1},
  {species: 'fwooper', col: 4.5, row: 26, width: 1, height: 1},
  {species: 'hippogriff', col: 6.5, row: 26, width: 1, height: 1},
  {species: 'thestral', col: 8.5, row: 26, width: 1, height: 1},
  {species: 'unicorn', col: 10.5, row: 26, width: 1, height: 1},
  {species: 'three-headed-dog', col: 12.5, row: 26, width: 1, height: 1},
  {species: 'dragon', col: 17.5, row: 26, width: 1, height: 1},
].map(Object.freeze));

// Before chapter 6 opened the south field, the twelve keepsakes used one stepped
// frontier row. Keep those authored columns stable while the final chapter
// uses the compact two-row plaza above. The species order is the same as the
// final layout, so a save never needs to be rewritten when the view changes.
export const KEEPSAKE_LEGACY_LAYOUT = Object.freeze([
  {species: 'puffskein', col: 1.5, row: 25, width: 1, height: 1},
  {species: 'bowtruckle', col: 3.5, row: 25, width: 1, height: 1},
  {species: 'niffler', col: 5.5, row: 25, width: 1, height: 1},
  {species: 'mooncalf', col: 7.5, row: 25, width: 1, height: 1},
  {species: 'kneazle', col: 9.5, row: 25, width: 1, height: 1},
  {species: 'diricawl', col: 11.5, row: 25, width: 1, height: 1},
  {species: 'fwooper', col: 13.5, row: 25, width: 1, height: 1},
  {species: 'hippogriff', col: 15.5, row: 25, width: 1, height: 1},
  {species: 'thestral', col: 17.5, row: 25, width: 1, height: 1},
  {species: 'unicorn', col: 19.5, row: 25, width: 1, height: 1},
  {species: 'three-headed-dog', col: 21.5, row: 25, width: 1, height: 1},
  {species: 'dragon', col: 23.5, row: 25, width: 1, height: 1},
].map(Object.freeze));

// This is deliberately narrower than a garden tile so a person can walk from
// the existing horizontal path down the east side of the plaza. It is a real
// reservation, not a full-width keepsake strip. A quarter-tile gap remains
// between the route and the east-hand pedestals.
export const KEEPSAKE_ACCESS_PATHS = Object.freeze([
  Object.freeze({c0: 15.5, c1: 16.5, r0: 22.5, r1: 28.5}),
]);

const FINAL_BOTTOM = DECORATION_SPACE.maxRow;
const FINAL_STAGE_LEVEL = 100;
const LEGACY_BY_SPECIES = new Map(KEEPSAKE_LEGACY_LAYOUT.map((placement) => [placement.species, placement]));

export function decorationSpaceContains(col, row) {
  return Number.isFinite(col) && Number.isFinite(row)
    && col >= DECORATION_SPACE.minCol && col <= DECORATION_SPACE.maxCol
    && row >= DECORATION_SPACE.minRow && row <= DECORATION_SPACE.maxRow;
}

function isFinalKeepsakeStage(stage) {
  if (!stage) return true;
  const level = Number(stage.level);
  if (Number.isFinite(level)) return level >= FINAL_STAGE_LEVEL;
  return Number(stage.bottom) >= FINAL_BOTTOM;
}

function legacyAnchorCol(placement, authoredCol) {
  const legacy = LEGACY_BY_SPECIES.get(placement?.species);
  return legacy ? Number(legacy.col) + Number(placement?.width ?? 1) / 2 : authoredCol;
}

function isStageAnchorVisible(stage, [col, row]) {
  // A few callers use `{bottom: 33.5}` as a final-stage rendering hint. It
  // has no polygon to test, so keep the authored final layout intact.
  return !stage || !Number.isFinite(Number(stage.right)) || stageContains(stage, col, row);
}

export function keepsakeAnchor(placement, stage = null, anchorRow = null) {
  const authoredCol = Number(placement?.col) + Number(placement?.width ?? 1) / 2;
  const col = isFinalKeepsakeStage(stage) ? authoredCol : legacyAnchorCol(placement, authoredCol);
  const authoredRow = Number(placement?.row) + Number(placement?.height ?? 1);
  const row = stage && !isFinalKeepsakeStage(stage) && typeof anchorRow === 'function'
    ? anchorRow(stage, col)
    : authoredRow;
  return [col, row];
}

export function keepsakeGroundRect(placement, stage = null, anchorRow = null) {
  const [col, row] = keepsakeAnchor(placement, stage, anchorRow);
  const width = Number(placement?.width) || 1;
  const height = Number(placement?.height) || 1;
  return {
    c0: col - width / 2,
    c1: col + width / 2,
    r0: row - height / 2,
    r1: row + height / 2,
  };
}

export function keepsakeDisplayPlacements(stage = null, anchorRow = null) {
  const layout = isFinalKeepsakeStage(stage) ? KEEPSAKE_DISPLAY_LAYOUT : KEEPSAKE_LEGACY_LAYOUT;
  return layout.map((placement) => ({
    ...placement,
    anchor: keepsakeAnchor(placement, stage, anchorRow),
  })).filter((placement) => isStageAnchorVisible(stage, placement.anchor));
}

export function keepsakeSpriteRect(placement, iso, stage = null, anchorRow = null) {
  const art = KEEPSAKE_ART[placement?.species];
  const [x, y] = iso(...(placement?.moved ?? keepsakeAnchor(placement, stage, anchorRow)));
  const bounds = art?.bounds ?? {x: 0, y: 0, w: art?.width ?? 0, h: art?.height ?? 0};
  const left = x - (art?.pivotX ?? 0) + bounds.x;
  const top = y - (art?.pivotY ?? 0) + bounds.y;
  return {left, top, right: left + bounds.w, bottom: top + bounds.h};
}

/** Occupied statue bases (moved ones on their saved spot); `skip` is the piece being moved. */
export function keepsakeObstacles(state, stage, iso, anchorRow = null, decorations = null, skip = null) {
  const source = state?.keepsakes;
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    return {placements: [], ground: [], screen: [], access: isFinalKeepsakeStage(stage) ? KEEPSAKE_ACCESS_PATHS : []};
  }
  const placements = keepsakeDisplayPlacements(stage, anchorRow)
    .filter((placement) => Number(source[placement.species]) > 0 && 'keepsake:' + placement.species !== skip && !isDefaultDecorHidden(decorations, 'keepsake:' + placement.species))
    .map((placement) => {const moved = defaultDecorSpot(decorations, 'keepsake:' + placement.species); return moved ? {...placement, anchor: moved, moved} : placement;});
  return {
    placements,
    ground: placements.map((placement) => placement.moved ? {c0: placement.moved[0] - 0.5, c1: placement.moved[0] + 0.5, r0: placement.moved[1] - 0.5, r1: placement.moved[1] + 0.5} : keepsakeGroundRect(placement, stage, anchorRow)),
    screen: iso ? placements.map((placement) => keepsakeSpriteRect(placement, iso, stage, anchorRow)) : [],
    access: isFinalKeepsakeStage(stage) ? KEEPSAKE_ACCESS_PATHS : [],
  };
}

export function rectIntersects(left, right) {
  return left.c0 < right.c1 && left.c1 > right.c0 && left.r0 < right.r1 && left.r1 > right.r0;
}

export function placementSuggestions(grid, anchor, limit = 18) {
  const source = Array.isArray(grid) ? grid : [];
  const [col, row] = Array.isArray(anchor) ? anchor : [0, 0];
  return source
    .filter((spot) => spot?.ok === true && Array.isArray(spot.at))
    .map((spot) => ({...spot, distance: Math.hypot(spot.at[0] - col, spot.at[1] - row)}))
    .sort((left, right) => left.distance - right.distance || left.at[1] - right.at[1] || left.at[0] - right.at[0])
    .slice(0, Math.max(1, Number(limit) || 18))
    .map(({distance, ...spot}) => spot);
}
