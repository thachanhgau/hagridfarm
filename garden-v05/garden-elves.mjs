// Gia tinh in the garden (25.0 S2): each elf walks a loop of stops and does a chore at each one, sleeps by the hut at
// night and cheers when tapped. Pure data + clock → scene objects; the renderer draws them like any pivoted asset.
import {CREATURE} from './progression-engine.mjs?v=24.9.96';

const FRAME = {width: 80, height: 80, pivotX: 40, pivotY: 76, bounds: {x: 11, y: 14, w: 53, h: 63}};
const CELL_MS = 900; // walking speed: one tile per 0.9 s
const STEP_MS = 220; // walk-1 ↔ walk-2
export const CHEER_MS = 1600;

// Stops are [col, row, pose, stay ms], all inside stage 1 (cols ≤ 20.5, rows ≤ 9.5) between the plot rows.
// `sleep` is the night spot beside the hut; `lines` are what a tap shows, in turn (Dobby talks of himself by name, HP2).
export const ELVES = Object.freeze({
  dobby: Object.freeze({
    name: 'Dobby',
    poses: ['idle', 'walk-1', 'walk-2', 'sweep', 'water', 'carry', 'sleep', 'cheer', 'harvest', 'feed'],
    stops: [[1.5, 7.5, 'idle', 2600], [6.1, 4.5, 'water', 3200], [7.5, 7.5, 'sweep', 3600], [12.5, 8, 'carry', 0], [6, 8.5, 'idle', 2000]],
    sleep: [2.4, 7.1],
    lines: ['Dobby quét tuyết cho vườn bác Hagrid đây ạ!', 'Dobby thích tất len lắm, thưa ngài!', 'Dobby là gia tinh tự do!'],
  }),
  winky: Object.freeze({
    name: 'Winky',
    poses: ['idle', 'walk-1', 'walk-2', 'water', 'carry', 'sleep'],
    stops: [[8.5, 7, 'idle', 2400], [12.6, 4.5, 'water', 3200], [13.5, 7.5, 'carry', 0], [9, 8.2, 'idle', 2000]],
    sleep: [3.6, 7],
    lines: ['Winky tưới rau cho bác Hagrid!', 'Winky nhặt trứng xong rồi ạ!'],
  }),
  'kitchen-a': Object.freeze({
    name: 'Gia tinh bếp Hogwarts',
    poses: ['idle', 'walk-1', 'walk-2', 'sweep', 'carry', 'sleep'],
    stops: [[3, 8.6, 'sweep', 3600], [10.5, 8.8, 'sweep', 3000], [16, 7.5, 'carry', 0], [4.5, 8.4, 'idle', 2200]],
    sleep: [1.3, 7.3],
    lines: ['Bếp Hogwarts gửi bánh nóng cho bác Hagrid!', 'Lối đi sạch tuyết rồi ạ!'],
  }),
  'kitchen-b': Object.freeze({
    name: 'Gia tinh bếp Hogwarts',
    poses: ['idle', 'walk-1', 'walk-2', 'sweep', 'water', 'sleep'],
    stops: [[14.5, 8, 'idle', 2400], [18.6, 4.5, 'water', 3000], [19, 8, 'sweep', 3200], [15, 9, 'idle', 1800]],
    sleep: [4.8, 6.9],
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
    if (t < stop[3]) return [stop[0], stop[1], stop[2], false];
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

// «Gia tinh trông vườn» (S2 part 2): once the elves harvested or fed today, Dobby's watering stop shows him harvesting
// and his sweeping stop feeding (the pose is named like the job kind).
const WORK_POSES = Object.freeze({water: 'harvest', sweep: 'feed'});

// night: every elf sleeps at its spot. cheering: {id: true} for elves just tapped (cheer pose, else idle).
// work: the kinds of today's gia tinh jobs ('harvest', 'feed').
export function elfObjects(iso, clock, {night = false, cheering = {}, work = []} = {}) {
  return Object.entries(ELVES).map(([id, elf]) => {
    let [col, row, pose, flip] = night ? [...elf.sleep, 'sleep', false] : elfPose(id, clock);
    const workPose = WORK_POSES[pose];
    if (!night && work.includes(workPose) && elf.poses.includes(workPose)) pose = workPose;
    if (!night && cheering[id]) pose = elf.poses.includes('cheer') ? 'cheer' : 'idle';
    const [x, y] = iso(col, row);
    return {kind: 'elf', id, xy: [Math.round(x), Math.round(y)], flip, asset: {...FRAME, file: elfFile(id, pose)}};
  });
}

// Norbert (25.0 S4), Hagrid's baby Hắc long Na Uy: a companion that waddles between Hagrid's hut and the pens, plays
// and sneezes smoke; asleep by the hut at night. Drawn only once S7's egg hatched (snapshot.mood.norbert), so his
// frames load the first time he is drawn. He gives nothing: no produce, no Vảy Rồng.
export const NORBERT = Object.freeze({
  poses: ['idle', 'walk-1', 'walk-2', 'sleep', 'play', 'puff'],
  stops: [[2.6, 8.2, 'idle', 2400], [5.5, 9.2, 'play', 3000], [9.5, 9.4, 'puff', 1800], [4, 9, 'idle', 1600]],
  sleep: [2.9, 7.6],
});
export const norbertFiles = () => NORBERT.poses.map((pose) => elfFile('norbert', pose));
export function norbertObject(iso, clock, {night = false, cheering = false} = {}) {
  let [col, row, pose, flip] = night ? [...NORBERT.sleep, 'sleep', false] : elfPose('norbert', clock, NORBERT.stops);
  if (!night && cheering) pose = 'puff';
  const [x, y] = iso(col, row);
  return {kind: 'elf', id: 'norbert', xy: [Math.round(x), Math.round(y)], flip, asset: {...FRAME, file: elfFile('norbert', pose)}};
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
