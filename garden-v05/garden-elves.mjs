// Gia tinh in the garden (25.0 S2): each elf walks a loop of stops and does a chore at each one.
// Pure data + clock → scene objects; the renderer draws them like any pivoted asset.

const POSES = ['idle', 'walk-1', 'walk-2', 'sweep', 'water', 'carry'];
const FRAME = {width: 64, height: 64, pivotX: 32, pivotY: 58, bounds: {x: 4, y: 12, w: 56, h: 47}};
const CELL_MS = 900; // walking speed: one tile per 0.9 s
const STEP_MS = 220; // walk-1 ↔ walk-2

// Stops are [col, row, pose, stay ms]; every stop sits inside stage 1 (cols ≤ 20.5, rows ≤ 9.5), between the plot rows.
export const ELVES = Object.freeze({
  dobby: Object.freeze({
    name: 'Dobby',
    stops: [[1.5, 7.5, 'idle', 2600], [5.6, 4.5, 'water', 3200], [7.5, 7.5, 'sweep', 3600], [12.5, 8, 'carry', 0], [6, 8.5, 'idle', 2000]],
  }),
});

export const elfFile = (id, pose) => `environment/elves/${id}/${pose}.png`;
export const elfFiles = () => Object.keys(ELVES).flatMap((id) => POSES.map((pose) => elfFile(id, pose)));

// Where an elf is at `clock` ms: [col, row, pose, facingRight]. clock 0 (reduced motion) = standing at the first stop.
export function elfPose(id, clock) {
  const stops = ELVES[id].stops;
  const legs = stops.map((stop, index) => {
    const next = stops[(index + 1) % stops.length];
    return {stop, next, walk: Math.hypot(next[0] - stop[0], next[1] - stop[1]) * CELL_MS};
  });
  const loop = legs.reduce((sum, leg) => sum + leg.stop[3] + leg.walk, 0);
  let t = clock > 0 ? clock % loop : 0;
  for (const {stop, next, walk} of legs) {
    if (t < stop[3]) return [stop[0], stop[1], stop[2], false];
    t -= stop[3];
    if (t < walk) {
      const k = t / walk;
      // Carry keeps the basket up while walking; otherwise alternate the two walk frames.
      const pose = stop[2] === 'carry' ? 'carry' : Math.floor(t / STEP_MS) % 2 ? 'walk-2' : 'walk-1';
      const col = stop[0] + (next[0] - stop[0]) * k, row = stop[1] + (next[1] - stop[1]) * k;
      // Screen x grows with col − row; the art faces left, so moving right flips it.
      return [col, row, pose, next[0] - stop[0] - (next[1] - stop[1]) > 0];
    }
    t -= walk;
  }
  return [stops[0][0], stops[0][1], stops[0][2], false];
}

export function elfObjects(iso, clock) {
  return Object.keys(ELVES).map((id) => {
    const [col, row, pose, flip] = elfPose(id, clock);
    const [x, y] = iso(col, row);
    return {kind: 'elf', id, xy: [Math.round(x), Math.round(y)], flip, asset: {...FRAME, file: elfFile(id, pose)}};
  });
}
