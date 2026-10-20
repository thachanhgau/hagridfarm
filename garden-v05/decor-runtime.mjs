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

/**
 * Ground a decoration covers, in tiles. The sprite's foot (pivot) stands at (col, row); the footprint's
 * front corner lies half a tile in front of it, like a 1×1 piece on its tile, and the footprint is centred
 * under the pivot on screen. `footprintTiles` [long, short] runs its long side along the rows in the
 * default (left) view — the way the art is drawn — and along the columns in the right view.
 */
export function decorFootprintRect(col, row, footprint = [1, 1], facing = 'default') {
  const [cols, rows] = facing === 'right' ? [footprint[0], footprint[1]] : [footprint[1], footprint[0]];
  const shift = (cols - rows) / 4, c1 = col + 0.5 + shift, r1 = row + 0.5 - shift;
  return {c0: c1 - cols, c1, r0: r1 - rows, r1};
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
