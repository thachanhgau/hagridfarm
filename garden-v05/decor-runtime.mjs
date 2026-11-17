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
  {id: 'default', label: 'Góc hiện tại', shortLabel: 'Góc hiện tại'},
  {id: 'right', label: 'Góc nhìn qua phải', shortLabel: 'Nhìn qua phải'},
]);

export const DECOR_LABELS = Object.freeze({
  decor_pumpkin_lantern: 'Đèn bí ngô',
  decor_broom_rack: 'Giá chổi',
  decor_cauldron: 'Vạc đồng',
  decor_mandrake_planter: 'Chậu Nhân sâm',
  decor_floating_candles: 'Nến lơ lửng',
  decor_vine_arch: 'Vòm dây leo',
  gardener_friend: 'Bác Hagrid',
  fang: 'Fang',
  owl_post: 'Bưu cục Cú',
  herbology_greenhouse: 'Nhà kính Thảo dược',
});

// Contest gardens (garden-contest.mjs) hold copies `<baseId>~<n>` of a piece; art, footprint and lights are the base's.
export const baseDecorId = id => typeof id === 'string' ? id.replace(/~\d+$/, '') : id;

export function decorLabelFor(itemOrId) {
  if (!itemOrId) return 'Vật phẩm trang trí';
  if (typeof itemOrId === 'string') return DECOR_LABELS[itemOrId] || itemOrId;
  return itemOrId.label || itemOrId.title || DECOR_LABELS[itemOrId.id] || itemOrId.id || 'Vật phẩm trang trí';
}

const copyNumber = id => Number(/~(\d+)$/.exec(id)?.[1]);
/** Contest only: `assets` (Map by id) also answers for copies, the base piece labelled « · bản n». Changes and returns it. */
export function withDecorCopies(assets) {
  if (assets.copies) return assets;
  const get = assets.get.bind(assets), has = assets.has.bind(assets), made = new Map();
  assets.get = id => {
    const base = baseDecorId(id);
    if (base === id) return get(id);
    const asset = get(base);
    if (!asset) return undefined;
    if (made.get(id)?.of !== asset) made.set(id, {of: asset, copy: {...asset, label: `${decorLabelFor(asset)} · bản ${copyNumber(id)}`}});
    return made.get(id).copy;
  };
  assets.has = id => has(baseDecorId(id));
  assets.copies = true;
  return assets;
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

/**
 * Draw order of two scene objects: by foot y, then x. A decoration's foot stands near its front corner, so a gia tinh in
 * front of its west half sorted behind it (owner 05/11/2026: Dobby under «Mẫu sân tròn dưới trăng»). When both carry a
 * `ground` rect (a footprint, or a zero-size rect at a character's feet) and one lies wholly west or north of the
 * other, that one is drawn first.
 */
export function depthCompare(a, b) {
  return groundOrder(a.ground, b.ground) || footOrder(a, b);
}
// −1 when ground A lies wholly west or north of B and not the reverse, 1 the other way, 0 when neither binds.
function groundOrder(A, B) {
  if (!A || !B) return 0;
  const ab = A.c1 <= B.c0 || A.r1 <= B.r0, ba = B.c1 <= A.c0 || B.r1 <= A.r0;
  return ab === ba ? 0 : ab ? -1 : 1;
}
const footOrder = (a, b) => (a.xy?.[1] ?? 0) - (b.xy?.[1] ?? 0) || (a.xy?.[0] ?? 0) - (b.xy?.[0] ?? 0);

/**
 * Scene draw order (docs/garden/no-overlap-rule.md §3): depthCompare's ground rule as a topological sort (Kahn), the
 * ready object with the smallest foot y, then x, going next. Array.sort cannot take depthCompare: it is not transitive
 * and drew 22 pairs backwards in 3,000 random scenes (15/11/2026). A cycle, which non-overlapping footprints do not
 * make, is cut at the earliest foot.
 * ponytail: O(n²) pairs per frame; sweep by screen x if a scene outgrows ~1,000 objects.
 */
export function depthSort(objects) {
  const n = objects.length, after = Array.from({length: n}, () => []), blockers = new Int32Array(n), done = new Uint8Array(n);
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const order = groundOrder(objects[i].ground, objects[j].ground);
    if (order) {after[order < 0 ? i : j].push(order < 0 ? j : i); blockers[order < 0 ? j : i]++;}
  }
  const byFoot = [...objects.keys()].sort((i, j) => footOrder(objects[i], objects[j]) || i - j), out = [];
  for (let start = 0; out.length < n;) {
    while (done[byFoot[start]]) start++;
    let k = start;
    while (k < n && (done[byFoot[k]] || blockers[byFoot[k]])) k++;
    const next = byFoot[k < n ? k : start];
    done[next] = 1; out.push(objects[next]);
    for (const q of after[next]) blockers[q]--;
  }
  return out;
}

/**
 * A pen's rails sort by one corner, so a piece standing outside the pen near a rail could be drawn under it (owner
 * 09/11/2026: a pot beside the east rail, then a pumpkin cottage at the pen's south-west corner). Owner rule: a rail
 * never covers an item. After the depth sort, every piece within RAIL_NEAR tiles outside the pen on the rails' side
 * (south or east for the front rails, north or west for the back ones, corners included) moves to just after them.
 * Whatever must stand in front of a moved piece (ground order) moves with it, else the piece jumped over a creature in
 * the next pen (owner 17/11/2026: tượng Dobby at Chuồng mở rộng 2's corner covered the Vong mã in Chuồng mở rộng 3).
 * A piece whose follower lives behind a front rail still to come stays where the sort put it.
 */
const RAIL_NEAR = 2;
const inRect = (q, g) => g.c1 > q.c0 && g.c0 < q.c1 && g.r1 > q.r0 && g.r0 < q.r1;
export function railNeighbours(objects) {
  const fences = objects.filter(o => o.kind === 'pen-fence' && o.penRect), inPen = g => fences.some(({penRect: q}) => inRect(q, g));
  for (const fence of fences) {
    const p = fence.penRect, gap = g => Math.max(p.c0 - g.c1, g.c0 - p.c1, p.r0 - g.r1, g.r0 - p.r1, 0);
    const side = g => fence.front ? (g.c0 >= p.c1 || g.r0 >= p.r1) : (g.c1 <= p.c0 || g.r1 <= p.r0);
    const at = objects.indexOf(fence), carry = new Set();
    // Residents keep their own pen's rails.
    for (const piece of objects.slice(0, at)) {
      if (piece.kind === 'pen-fence' || !piece.ground || !side(piece.ground) || gap(piece.ground) >= RAIL_NEAR || inPen(piece.ground)) continue;
      const follow = [piece];
      for (let i = objects.indexOf(piece) + 1; i < at; i++) {
        const o = objects[i];
        if (o.kind !== 'pen-fence' && o.ground && follow.some(f => groundOrder(f.ground, o.ground) < 0)) follow.push(o);
      }
      const stuck = follow.some(o => fences.some(f => f.front && inRect(f.penRect, o.ground) && objects.indexOf(f) > objects.indexOf(o) && objects.indexOf(f) <= at));
      if (!stuck) for (const o of follow) carry.add(o);
    }
    if (!carry.size) continue;
    const moving = objects.filter(o => carry.has(o));
    for (const o of moving) objects.splice(objects.indexOf(o), 1);
    objects.splice(objects.indexOf(fence) + 1, 0, ...moving);
  }
}

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
