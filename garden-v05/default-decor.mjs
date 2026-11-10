import {DB} from './balance-data.mjs?v=25.1.4';
import {iso} from './garden-grid.mjs?v=25.1.4';
import {snapDecorSpot,footLift,orientedFootprint,decorFootprintRect} from './decor-runtime.mjs?v=25.1.4';
export const DEFAULT_DECOR_IDS = Object.freeze(['scene:pond', ...DB.decorations.map(d => d.id), ...DB.animals.map(a => 'keepsake:' + a.id)]);
export const isDefaultDecorHidden = (decorations, id) => Array.isArray(decorations?.hiddenDefaults) && decorations.hiddenDefaults.includes(id);
export function defaultDecorChoices(state) {
  return [
    {id: 'scene:pond', label: 'Ao trang trí'},
    ...DB.decorations.filter(d => state?.decorations?.includes(d.id)).map(d => ({id: d.id, label: d.label})),
    ...DB.animals.filter(a => Number(state?.keepsakes?.[a.id]) > 0).map(a => ({id: 'keepsake:' + a.id, label: 'Đài kỷ vật ' + a.label})),
  ];
}

// All decoration unlocks have a deterministic logical footprint in the walkable aisles, outside every
// plot and pen cell. `col`/`row` is the north-west ground corner on a cell line (cells are centred on whole
// numbers); the sprite's foot stands just behind the ground's front corner (decorFootprintRect).
// Shape names remain only for layout data compatibility; the authored raster views live in ITEM_ART.
export const DECORATION_LAYOUT = Object.freeze({
  'decoration-3': {col: -0.5, row: 3.5, width: 2, height: 1, shape: 'stone-border'},
  'decoration-7': {col: 5.5, row: 3.5, width: 2, height: 1, shape: 'pumpkin-garden'},
  'decoration-11': {col: 12.5, row: 3.5, width: 2, height: 1, shape: 'puffskein-nest'},
  'decoration-15': {col: 18.5, row: 3.5, width: 2, height: 1, shape: 'low-fence'},
  'decoration-19': {col: -0.5, row: 5.5, width: 2, height: 1, shape: 'branch-trellis'},
  'decoration-23': {col: 5.5, row: 5.5, width: 2, height: 1, shape: 'wood-bridge'},
  'decoration-27': {col: 12.5, row: 5.5, width: 2, height: 1, shape: 'niffler-cabinet'},
  'decoration-30': {col: 18.5, row: 5.5, width: 2, height: 1, shape: 'wildflower-border'},
  'decoration-31': {col: 2.5, row: 7.5, width: 2, height: 1, shape: 'moon-court'}, // home [4, 8.5]; it stood on the owl post (05/11/2026)
  'decoration-35': {col: 5.5, row: 7.5, width: 1, height: 1, shape: 'moon-lantern'},
  'decoration-39': {col: 12.5, row: 7.5, width: 2, height: 1, shape: 'straw-shed'},
  'decoration-43': {col: 18.5, row: 7.5, width: 2, height: 1, shape: 'kneazle-post'},
  'decoration-46': {col: -0.5, row: 9.5, width: 2, height: 1, shape: 'linen-pillows'},
  'decoration-47': {col: 5.5, row: 9.5, width: 2, height: 1, shape: 'pond-vines'},
  'decoration-51': {col: 12.5, row: 9.5, width: 2, height: 1, shape: 'bird-bath'},
  'decoration-55': {col: 18.5, row: 9.5, width: 2, height: 1, shape: 'four-color-fence'},
  'decoration-59': {col: -0.5, row: 12.5, width: 2, height: 1, shape: 'feather-perch'},
  'decoration-63': {col: 5.5, row: 12.5, width: 2, height: 1, shape: 'hippogriff-court'},
  'decoration-67': {col: 12.5, row: 12.5, width: 2, height: 1, shape: 'large-perch'},
  'decoration-71': {col: 18.5, row: 12.5, width: 2, height: 1, shape: 'mist-lantern'},
  'decoration-75': {col: -0.5, row: 14.5, width: 2, height: 1, shape: 'moon-bridge'},
  'decoration-80': {col: 5.5, row: 14.5, width: 2, height: 1, shape: 'silver-border'},
  'decoration-81': {col: 12.5, row: 14.5, width: 2, height: 1, shape: 'unicorn-arbor'},
  'decoration-83': {col: 18.5, row: 14.5, width: 2, height: 1, shape: 'silver-mane-gazebo'},
  'decoration-87': {col: -0.5, row: 15.5, width: 2, height: 1, shape: 'large-fence'},
  'decoration-91': {col: 5.5, row: 15.5, width: 2, height: 1, shape: 'triple-gate'},
  'decoration-95': {col: 12.5, row: 15.5, width: 2, height: 1, shape: 'dragon-scale-pedestal'},
  'decoration-98': {col: 18.5, row: 15.5, width: 2, height: 1, shape: 'dragon-observatory'},
  'decoration-99': {col: 25.5, row: 15.5, width: 2, height: 1, shape: 'garden-plan'},
});
export const DECORATION_IDS = Object.freeze(DB.decorations.map((entry) => entry.id));
const DECORATION_LABELS = Object.freeze(Object.fromEntries(DB.decorations.map((entry) => [entry.id, entry.label])));
for (const id of DECORATION_IDS) {
  if (!DECORATION_LAYOUT[id]) throw new Error(`Thiếu layout trang trí ${id}.`);
}

/** Ground size [long, short] of a garden default, same as functions/games/garden-default-footprints.json. */
export function defaultDecorFootprint(id) {
  if (id === 'scene:pond') return [3, 2];
  const d = DECORATION_LAYOUT[id];
  return d ? [d.height, d.width] : [1, 1];
}

/** The built pond's ground [long, short] by tier (balance pond_1..3: [5, 4], [7, 5], [9, 6]), null before «Ao cá». */
export const pondFootprint = (built = []) => DB.expansions.filter(e => e.kind === 'pond' && built?.includes?.(e.id)).at(-1)?.footprint ?? null;

/** «Bờ hồ» (owner 08/11/2026): the built pond is fixed and faces right (long side along the columns, mirrored art)
 *  on the open meadow behind the north fence (garden-growth POND_LAND), centred on the col-20.5 path (owner «lối … ra
 *  thẳng trung tâm của hồ»): ground cols 16–25, back row −11.5, bank on row −5.5. Null without a pond. */
export const POND_FACING = 'right';
export function pondHome(scene, built = []) {
  const size = pondFootprint(built);
  if (!size) return null;
  const [cols, rows] = orientedFootprint(size, POND_FACING), lift = footLift([cols, rows]);
  return [20.5 + lift, -11.5 + lift + rows / 2];
}

/** «Ruộng nước»: `count` 1×3 trays touching into one paddy, centred on the col-7.5 path with its bank on row −5.5
 *  like the pond's (owner 08/11 «tạo hình mới và cân đối»): one row up to 7 (4 → 4×3, 7 → 7×3), else two rows touching
 *  (10 → 5×6). Scene drawing and decoration placement share it, so nothing is placed on a bed. */
export function pondBedRects(at, built = [], count = 0) {
  const back = count > 7 ? Math.floor(count / 2) : 0;
  return Array.from({length: count}, (_, b) => {
    const front = b >= back, n = front ? count - back : back, c0 = 7.5 - n / 2 + (front ? b - back : b), r0 = front ? -8.5 : -11.5;
    return {c0, c1: c0 + 1, r0, r1: r0 + 3};
  });
}
/** «Góc nghỉ» (owner «khu vực giữa … tạo tiểu cảnh»): the 3×3 vignette's foot, between the paddies and the pond. */
export const POND_NOOK = Object.freeze({at: [15, -3], footprint: [3, 3]}); // ground cols 12.5–15.5 × rows −5.5…−2.5
/** Pond beds by tier (server garden-pond-core): 4 at «Ao cá», 7 at «Hồ rong», 10 at «Hồ sâu». */
export const pondBedCount = built => (built?.includes?.('pond_3') ? 10 : built?.includes?.('pond_2') ? 7 : built?.includes?.('pond_1') ? 4 : 0);

/** Where a moved default stands (the placement preview first), or null on its authored spot. */
export function defaultDecorSpot(decorations, id, preview = null) {
  if (preview?.itemId === id && preview.at) return preview.at;
  const at = decorations?.defaultPositions?.[id];
  return Array.isArray(at) && at.length === 2 ? at : null;
}

/**
 * Pure decoration placement data used by rendering, placement and layout tests. A moved piece stands on
 * its saved spot; a turned one steps half a cell when needed so it still covers whole cells.
 */
export function decorationPlacements(scene = globalThis.FARM_SCENE, decorations = null, rotations = {}, preview = null) {
  return DECORATION_IDS.map((id) => {
    const spec = DECORATION_LAYOUT[id], footprint = defaultDecorFootprint(id);
    const facing = preview?.itemId === id && preview.facing ? preview.facing : rotations?.[id] === 'right' ? 'right' : 'default';
    const lift = footLift(orientedFootprint(footprint));
    const at = snapDecorSpot(defaultDecorSpot(decorations, id, preview) ?? [spec.col + spec.width / 2 + lift, spec.row + spec.height / 2 + lift], footprint, facing);
    return {id, label: DECORATION_LABELS[id], ...spec, footprint, facing, at, xy: iso(...at, scene)};
  });
}

// In-memory preview uses the same cosmetic transition as the account server.
export function applyDefaultDecorationVisibility(garden, {itemId, visible}) {
  const fail = (reason, message) => {throw Object.assign(new Error(message), {reason});};
  if (!DEFAULT_DECOR_IDS.includes(itemId) || typeof visible !== 'boolean') fail('invalid-action-input', 'Trang trí hoặc trạng thái không hợp lệ.');
  if (!defaultDecorChoices(garden.progression).some(entry => entry.id === itemId)) fail('decoration-not-owned', 'Con chưa có món trang trí này.');
  const hidden = garden.decorations.hiddenDefaults ?? [];
  if (hidden.includes(itemId) === !visible) fail('action-noop', 'Trang trí đã ở trạng thái này.');
  if (!Number.isSafeInteger(garden.progression.revision) || garden.progression.revision >= Number.MAX_SAFE_INTEGER) fail('invalid-garden-state', 'revision không hợp lệ.');
  const next = structuredClone(garden);
  const nextHidden = visible ? hidden.filter(id => id !== itemId) : [...hidden, itemId];
  if (nextHidden.length) next.decorations.hiddenDefaults = nextHidden;
  else delete next.decorations.hiddenDefaults;
  next.progression.revision++;
  return next;
}
