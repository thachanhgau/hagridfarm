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
  decor_mandrake_planter: 'Chậu Mandrake',
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

export function decorObjects(decorations, assets, iso, preview = null) {
  const owned = new Set(decorations?.owned ?? []);
  const placements = decorations?.placements ?? [];
  const objects = [];
  for (const slot of DECOR_SLOTS) {
    const raw = placements[slot.id];
    const id = typeof raw === 'object' && raw !== null ? (raw.itemId ?? raw.id) : raw;
    const asset = assets.get(id);
    if (!id || !asset || !owned.has(id) || preview?.itemId === id) continue;
    const facing = decorFacingFor(decorations, id, raw);
    objects.push({
      kind: 'store-decor',
      type: 'store-decor',
      id,
      asset,
      slot: slot.id,
      facing,
      xy: iso(slot.col, slot.row),
    });
  }
  if (preview) {
    const slot = DECOR_SLOTS[preview.slot];
    const asset = assets.get(preview.itemId);
    if (slot && asset) {
      const facing = preview.facing !== undefined || preview.angle !== undefined
        ? normalizeDecorFacing(preview.facing ?? preview.angle)
        : decorFacingFor(decorations, preview.itemId);
      objects.push({
        kind: 'store-decor',
        type: 'store-decor',
        id: preview.itemId,
        asset,
        slot: slot.id,
        facing,
        preview: true,
        xy: iso(slot.col, slot.row),
      });
    }
  }
  return objects;
}
