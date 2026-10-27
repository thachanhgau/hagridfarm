// Six cosmetic sockets sit between cultivation rows; they never alter farm cells.
export const DECOR_SLOTS = Object.freeze([
  {id: 0, label: 'Lối đi thửa 1', col: 3, row: 7.15},
  {id: 1, label: 'Lối đi thửa 2', col: 9.5, row: 7.15},
  {id: 2, label: 'Lối đi thửa 3', col: 16, row: 7.15},
  {id: 3, label: 'Lối đi thửa 4', col: 22.5, row: 7.15},
  {id: 4, label: 'Góc hoa phía tây', col: 3, row: 13.5},
  {id: 5, label: 'Góc nghỉ giữa vườn', col: 9.5, row: 13.5},
]);

export const DECOR_ANGLES = Object.freeze([
  {id: 'default', label: 'Góc hiện tại', shortLabel: '↖ Góc hiện tại'},
  {id: 'right', label: 'Góc nhìn qua phải', shortLabel: '↗ Nhìn qua phải'},
]);

export const DECOR_LABELS = Object.freeze({
  decor_pumpkin_lantern: 'Đèn bí ngô',
  decor_broom_rack: 'Giá chổi',
  decor_cauldron: 'Vạc đồng',
  decor_mandrake_planter: 'Chậu Nhân sâm',
  decor_floating_candles: 'Nến lơ lửng',
  decor_vine_arch: 'Vòm dây leo',
  gardener_friend: 'Bác Hagrid',
  owl_post: 'Bưu cục Cú',
  herbology_greenhouse: 'Nhà kính Thảo dược',
});

export function decorLabelFor(itemOrId) {
  if (!itemOrId) return 'Vật phẩm trang trí';
  if (typeof itemOrId === 'string') return DECOR_LABELS[itemOrId] || itemOrId;
  return itemOrId.label || itemOrId.title || DECOR_LABELS[itemOrId.id] || itemOrId.id || 'Vật phẩm trang trí';
}

export function normalizeDecorFacing(value) {
  if (value === 'right' || value === 1 || value === '1') return 'right';
  return 'default';
}

export function decorFacingFor(decorations, itemId, rawPlacement = null) {
  if (rawPlacement && typeof rawPlacement === 'object') {
    const entryFacing = rawPlacement.facing ?? rawPlacement.angle;
    if (entryFacing !== undefined) return normalizeDecorFacing(entryFacing);
  }
  const mapFacing = decorations?.rotations?.[itemId] ?? decorations?.facing?.[itemId];
  return normalizeDecorFacing(mapFacing);
}

export const orientedFootprint = (footprint = [1, 1], facing = 'default') => facing === 'right' ? [footprint[0], footprint[1]] : [footprint[1], footprint[0]];
// The art's ground ends at the sprite's foot, so the footprint is lifted up the screen until its front corner
// sits just below the foot. Whole half tiles only: then every footprint edge lies on a cell line (cells are
// centred on whole numbers). Bought pieces and garden defaults share the rule.
export const footLift = ([cols, rows]) => Math.ceil((cols + rows) / 2 - 1) / 2;

/**
 * Ground a decoration covers, in tiles. The sprite's foot (pivot) stands at (col, row) and the footprint
 * is centred under it on screen. `footprint` [long, short] runs its long side along the rows in the
 * default (left) view — the way the art is drawn — and along the columns in the right view.
 */
export function decorFootprintRect(col, row, footprint = [1, 1], facing = 'default') {
  const size = orientedFootprint(footprint, facing), [cols, rows] = size, lift = footLift(size);
  return {c0: col - lift - cols / 2, c1: col - lift + cols / 2, r0: row - lift - rows / 2, r1: row - lift + rows / 2};
}

/** Nearest foot spot whose footprint edges all lie on cell lines (a whole or half tile, by shape). */
export function snapDecorSpot([col, row], footprint = [1, 1], facing = 'default') {
  const size = orientedFootprint(footprint, facing), lift = footLift(size);
  const snap = (value, span) => {const offset = (lift + span / 2 + 0.5) % 1; return Math.round(value - offset) + offset;};
  return [snap(col, size[0]), snap(row, size[1])];
}

export const rectsOverlap = (a, b) => a.c0 < b.c1 && b.c0 < a.c1 && a.r0 < b.r1 && b.r0 < a.r1;

const placedId = raw => (typeof raw === 'object' && raw !== null ? (raw.itemId ?? raw.id) : raw);

/** Where a placed item stands: its own `positions` spot (free placement), else its legacy socket. */
export function decorSpot(decorations, itemId) {
  const at = decorations?.positions?.[itemId];
  if (Array.isArray(at) && at.length === 2) return [at[0], at[1]];
  const index = (decorations?.placements ?? []).findIndex(raw => placedId(raw) === itemId);
  return index >= 0 && DECOR_SLOTS[index] ? [DECOR_SLOTS[index].col, DECOR_SLOTS[index].row] : null;
}

const snapHalf = n => Math.round(n * 2) / 2;
const placedIndex = (decorations, itemId) => (decorations?.placements ?? []).findIndex(raw => placedId(raw) === itemId);

/**
 * placeDecoration fields that stand `itemId` at `at` (null puts it away). A legacy socket (row 7.15) is
 * off the server's half-tile grid, so a turn where the piece already stands names the socket itself.
 */
export function decorPlaceFields(decorations, itemId, at, facing) {
  if (!at) return {itemId, slot: null, facing};
  const index = placedIndex(decorations, itemId);
  const socket = !decorations?.positions?.[itemId] && DECOR_SLOTS[index];
  if (socket && snapHalf(socket.col) === snapHalf(at[0]) && snapHalf(socket.row) === snapHalf(at[1])) return {itemId, slot: index, facing};
  return {itemId, at: [at[0], at[1]], facing};
}

/** placeDecoration fields that undo the last change to `itemId` (decorations before → after), or null. */
export function decorUndoFields(before, after, itemId) {
  const facing = decorFacingFor(before, itemId), at = before?.positions?.[itemId];
  if (Array.isArray(at) && at.length === 2) return {itemId, at: [at[0], at[1]], facing};
  const index = placedIndex(before, itemId);
  // ponytail: the server keeps a free spot once given, so a piece moved out of its legacy socket cannot
  // return to it; add a server «back to socket» command if members ask for that undo.
  if (DECOR_SLOTS[index] && after?.positions?.[itemId]) return null;
  return {itemId, slot: DECOR_SLOTS[index] ? index : null, facing};
}

export function decorObjects(decorations, assets, iso, preview = null) {
  const owned = new Set(decorations?.owned ?? []);
  const placements = decorations?.placements ?? [];
  const objects = [];
  placements.forEach((raw, index) => {
    const id = placedId(raw);
    const asset = assets.get(id);
    const spot = id ? decorSpot(decorations, id) : null;
    if (!id || !asset || !spot || !owned.has(id) || preview?.itemId === id) return;
    const facing = decorFacingFor(decorations, id, raw);
    objects.push({
      kind: 'store-decor',
      type: 'store-decor',
      id,
      asset,
      slot: index,
      col: spot[0],
      row: spot[1],
      facing,
      xy: iso(spot[0], spot[1]),
    });
  });
  if (preview?.at) {
    const [col, row] = preview.at;
    const asset = assets.get(preview.itemId);
    if (asset) {
      const facing = preview.facing !== undefined || preview.angle !== undefined
        ? normalizeDecorFacing(preview.facing ?? preview.angle)
        : decorFacingFor(decorations, preview.itemId);
      objects.push({
        kind: 'store-decor',
        type: 'store-decor',
        id: preview.itemId,
        asset,
        col,
        row,
        facing,
        preview: true,
        xy: iso(col, row),
      });
    }
  }
  return objects;
}
