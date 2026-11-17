// Gia tinh in the garden (25.0 S2): each elf walks a loop of stops and does a chore at each one, sleeps in the aisle at
// night and cheers when tapped. Pure data + clock → scene objects; the renderer draws them like any pivoted asset.
import {CREATURE} from './progression-engine.mjs?v=26.11';

const FRAME = {width: 80, height: 80, pivotX: 40, pivotY: 76, bounds: {x: 11, y: 14, w: 53, h: 63}};
const CELL_MS = 900; // walking speed: one tile per 0.9 s
const STEP_MS = 220; // walk-1 ↔ walk-2
export const CHEER_MS = 1600;

// Stops are [col, row, pose, stay ms, faces right?], all inside stage 1 (cols ≤ 20.5, rows ≤ 9.5). Elves keep to the
// aisles that no plot, earned-decor slot or festival spot uses: row 7 between the plot rows, cols 5, 12 and 18 beside
// the plots and row 1 behind them; zero-stay stops are corners. They stand only where nothing drawn after them covers
// them and they cover no plot frame: row 8 in the gaps between the decorations (cols 7.5–12, 15–17.5), row 7 there,
// row 1 (garden-elves.test.mjs, character-cover.test.mjs). Owner 05/11/2026: the old row-8.9 aisle ran half a tile
// behind Thửa 5–8, so ripe crops covered the elves' legs, and in front of the decoration row.
// A decoration the player puts in an aisle (owner 15/11/2026: pieces may still stand on the paths) turns the route
// back at its footprint (clearStops, docs/garden/no-overlap-rule.md §4).
// `sleep` is the night spot; `lines` are what a tap shows, in turn (Dobby talks of himself by name, HP2).
export const ELVES = Object.freeze({
  dobby: Object.freeze({
    name: 'Dobby',
    poses: ['idle', 'walk-1', 'walk-2', 'sweep', 'water', 'carry', 'sleep', 'cheer', 'harvest', 'feed'],
    stops: [[8, 8, 'idle', 2600], [8, 7, 'walk-1', 0], [5, 7, 'walk-1', 0], [5, 1, 'walk-1', 0], [2, 1, 'water', 3200], [5, 1, 'walk-1', 0], [5, 7, 'walk-1', 0], [7.5, 7, 'sweep', 3600], [9, 7, 'carry', 0]],
    sleep: [8, 8],
    lines: ['Dobby quét tuyết cho vườn bác Hagrid đây ạ!', 'Dobby thích tất len lắm, thưa ngài!', 'Dobby là gia tinh tự do!'],
  }),
  winky: Object.freeze({
    name: 'Winky',
    poses: ['idle', 'walk-1', 'walk-2', 'water', 'carry', 'sleep'],
    stops: [[10, 8, 'idle', 2400], [10, 7, 'walk-1', 0], [12, 7, 'walk-1', 0], [11.5, 8, 'water', 3200, true], [10.5, 8, 'carry', 0]],
    sleep: [10, 8],
    lines: ['Winky tưới rau cho bác Hagrid!', 'Winky nhặt trứng xong rồi ạ!'],
  }),
  'kitchen-a': Object.freeze({
    name: 'Gia tinh bếp Hogwarts',
    poses: ['idle', 'walk-1', 'walk-2', 'sweep', 'carry', 'sleep'],
    stops: [[15, 8, 'sweep', 3600], [15, 7, 'walk-1', 0], [5, 7, 'walk-1', 0], [5, 2, 'idle', 2200], [5, 2, 'carry', 0], [5, 7, 'carry', 0], [15, 7, 'walk-1', 0]],
    sleep: [15, 8],
    lines: ['Bếp Hogwarts gửi bánh nóng cho bác Hagrid!', 'Lối đi sạch tuyết rồi ạ!'],
  }),
  'kitchen-b': Object.freeze({
    name: 'Gia tinh bếp Hogwarts',
    poses: ['idle', 'walk-1', 'walk-2', 'sweep', 'water', 'sleep'],
    stops: [[17, 8, 'idle', 2400], [18, 8, 'walk-1', 0], [18, 1, 'walk-1', 0], [17.5, 1, 'water', 3000], [18, 1, 'walk-1', 0], [18, 8, 'walk-1', 0], [16.5, 8, 'sweep', 3200]],
    sleep: [17, 8],
    lines: ['Nồi súp bí ngô sắp chín rồi ạ!', 'Gia tinh bếp không bao giờ nghỉ!'],
  }),
});

export const elfFile = (id, pose) => `environment/elves/${id}/${pose}.png`;
export const elfFiles = () => Object.entries(ELVES).flatMap(([id, elf]) => elf.poses.map((pose) => elfFile(id, pose)));
// Poses drawn only after a gia tinh job today (WORK_POSES): the renderer loads them when first drawn.
export const elfWorkFiles = () => Object.entries(ELVES).flatMap(([id, elf]) => elf.poses.filter((pose) => Object.values(WORK_POSES).includes(pose)).map((pose) => elfFile(id, pose)));

// Where an elf is at `clock` ms: [col, row, pose, facingRight]. clock 0 (reduced motion) = standing at the first stop.
export function elfPose(id, clock, stops = ELVES[id].stops) {
  const legs = stops.map((stop, index) => {
    const next = stops[(index + 1) % stops.length];
    return {stop, next, walk: Math.hypot(next[0] - stop[0], next[1] - stop[1]) * CELL_MS};
  });
  const loop = legs.reduce((sum, leg) => sum + leg.stop[3] + leg.walk, 0);
  let t = clock > 0 ? clock % loop : 0;
  for (const {stop, next, walk} of legs) {
    if (t < stop[3]) return [stop[0], stop[1], stop[2], stop[4] === true];
    t -= stop[3];
    if (t < walk) {
      const k = t / walk;
      // Carry keeps the load up while walking; otherwise alternate the two walk frames.
      const pose = stop[2] === 'carry' ? 'carry' : Math.floor(t / STEP_MS) % 2 ? 'walk-2' : 'walk-1';
      const col = stop[0] + (next[0] - stop[0]) * k, row = stop[1] + (next[1] - stop[1]) * k;
      // Screen x grows with col − row; the art faces left, so moving right flips it.
      return [col, row, pose, next[0] - stop[0] - (next[1] - stop[1]) > 0];
    }
    t -= walk;
  }
  return [stops[0][0], stops[0][1], stops[0][2], false];
}

const MARGIN = 0.25; // tiles kept between a walker's feet and a footprint
const WAIT_MS = 1600; // the look at the blocking piece before turning back
const inside = ([c, r], R) => c > R.c0 - MARGIN && c < R.c1 + MARGIN && r > R.r0 - MARGIN && r < R.r1 + MARGIN;
// Where segment a→b first enters ground rect R grown by MARGIN (0..1), or null (Liang–Barsky; grazing an edge is free).
function entry(a, b, R) {
  let lo = 0, hi = 1;
  for (const [k, min, max] of [[0, R.c0 - MARGIN, R.c1 + MARGIN], [1, R.r0 - MARGIN, R.r1 + MARGIN]]) {
    const d = b[k] - a[k];
    if (!d) {if (a[k] <= min || a[k] >= max) return null; continue;}
    const t0 = (min - a[k]) / d, t1 = (max - a[k]) / d;
    lo = Math.max(lo, Math.min(t0, t1)); hi = Math.min(hi, Math.max(t0, t1));
  }
  return lo < hi ? lo : null;
}

/**
 * A walker's loop with the decorations' ground rects `blocked` taken out (no-overlap rule §4): it starts at its first
 * stop clear of them, walks until a leg meets one, waits there and walks back the way it came. null when every stop is
 * covered (the walker is not drawn). Unchanged stops when nothing is in the way.
 */
export function clearStops(stops, blocked = []) {
  if (!blocked.length) return stops;
  const home = stops.findIndex((stop) => !blocked.some((R) => inside(stop, R)));
  if (home < 0) return null;
  const loop = [...stops.slice(home), ...stops.slice(0, home)];
  for (let i = 0; i < loop.length; i++) {
    const a = loop[i], b = loop[(i + 1) % loop.length];
    const t = Math.min(...blocked.map((R) => entry(a, b, R) ?? 1));
    if (t >= 1) continue;
    const stop = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, 'idle', WAIT_MS];
    const back = loop.slice(1, i + 1).reverse().map(([col, row, pose]) => [col, row, pose === 'carry' ? 'carry' : 'walk-1', 0]);
    return [...loop.slice(0, i + 1), stop, ...back];
  }
  return loop;
}

// «Gia tinh trông vườn» (S2 part 2): once the elves harvested or fed today, Dobby's watering stop shows him harvesting
// and his sweeping stop feeding (the pose is named like the job kind).
const WORK_POSES = Object.freeze({water: 'harvest', sweep: 'feed'});

// night: every elf sleeps at its spot. cheering: {id: true} for elves just tapped (cheer pose, else idle).
// work: the kinds of today's gia tinh jobs ('harvest', 'feed').
// blocked: ground rects of the placed decorations (clearStops).
export function elfObjects(iso, clock, {night = false, cheering = {}, work = [], blocked = []} = {}) {
  return Object.entries(ELVES).flatMap(([id, elf]) => {
    const stops = clearStops(elf.stops, blocked);
    if (!stops) return [];
    const bed = blocked.some((R) => inside(elf.sleep, R)) ? stops[0] : elf.sleep;
    let [col, row, pose, flip] = night ? [bed[0], bed[1], 'sleep', false] : elfPose(id, clock, stops);
    const workPose = WORK_POSES[pose];
    if (!night && work.includes(workPose) && elf.poses.includes(workPose)) pose = workPose;
    if (!night && cheering[id]) pose = elf.poses.includes('cheer') ? 'cheer' : 'idle';
    const [x, y] = iso(col, row);
    return {kind: 'elf', id, feet: [col, row], xy: [Math.round(x), Math.round(y)], flip, asset: {...FRAME, file: elfFile(id, pose)}};
  });
}

// Norbert (25.0 S4), Hagrid's baby Hắc long Na Uy: a companion that waddles about by Hagrid and the owl post, plays
// and sneezes smoke; asleep by the hut at night (05/11/2026: kept off the decoration row and the plots).
// Drawn only once S7's egg hatched (snapshot.mood.norbert), so his
// frames load the first time he is drawn. He gives nothing: no produce, no Vảy Rồng.
export const NORBERT = Object.freeze({
  poses: ['idle', 'walk-1', 'walk-2', 'sleep', 'play', 'puff'],
  stops: [[2, 7, 'idle', 2400], [-0.5, 7, 'walk-1', 0], [-0.5, 8, 'play', 3000], [-1, 7.5, 'puff', 1800], [-0.5, 7, 'walk-1', 0]],
  sleep: [1.5, 7],
});
export const norbertFiles = () => NORBERT.poses.map((pose) => elfFile('norbert', pose));
export function norbertObject(iso, clock, {night = false, cheering = false, blocked = []} = {}) {
  const stops = clearStops(NORBERT.stops, blocked);
  if (!stops) return null;
  const bed = blocked.some((R) => inside(NORBERT.sleep, R)) ? stops[0] : NORBERT.sleep;
  let [col, row, pose, flip] = night ? [bed[0], bed[1], 'sleep', false] : elfPose('norbert', clock, stops);
  if (!night && cheering) pose = 'puff';
  const [x, y] = iso(col, row);
  return {kind: 'elf', id: 'norbert', feet: [col, row], xy: [Math.round(x), Math.round(y)], flip, asset: {...FRAME, file: elfFile('norbert', pose)}};
}

// The line a tap shows: the n-th tap on that elf picks the n-th line, looping.
export const elfLine = (id, taps) => {
  const lines = ELVES[id].lines;
  return lines[taps % lines.length];
};

// A «Gia tinh trông vườn» job (server garden-elf-core) as one line, and the toast after an action the elves worked in.
export const elfJobText = (job) => (job.kind === 'harvest'
  ? `Gặt thửa ${job.plotIndex + 1} · ${job.crops} cây`
  : `Cho ${CREATURE[job.species]?.label || job.species} ăn`);
export const elfShiftText = (jobs) => (jobs?.length ? `🧦 Gia tinh: ${jobs.map(elfJobText).join('; ')}` : '');
