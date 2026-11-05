// Turn an Antigravity friend sheet (JPEG, white background, 3 × 2 poses placed loosely) into a master that
// build-elf-art.mjs reads: 1536 × 1024 PNG, transparent background, each pose centred on x = 256 with its lowest ink on
// y = 470 of its 512 px cell, one scale for the whole sheet. Usage: node garden-v05/prep-friend-master.mjs <in> <out.png>
import fs from 'node:fs/promises';
import {sharp} from './build-elf-art.mjs';

const CELL = 512, FOOT = 470, WHITE = 236; // near-white connected to the border is background (JPEG noise included)

export async function prepFriendMaster(input, output) {
  const {data, info} = await sharp(input).removeAlpha().raw().toBuffer({resolveWithObject: true});
  const {width: W, height: H} = info, px = (x, y) => (y * W + x) * 3;
  const bg = new Uint8Array(W * H), stack = [];
  const white = (i) => data[i] >= WHITE && data[i + 1] >= WHITE && data[i + 2] >= WHITE;
  for (let x = 0; x < W; x++) stack.push([x, 0], [x, H - 1]);
  for (let y = 0; y < H; y++) stack.push([0, y], [W - 1, y]);
  while (stack.length) {
    const [x, y] = stack.pop();
    if (x < 0 || y < 0 || x >= W || y >= H || bg[y * W + x] || !white(px(x, y))) continue;
    bg[y * W + x] = 1;
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  // Poses are split at the empty gaps nearest the thirds (a broom may reach past the even third).
  const gap = (from, to, inkAt) => {
    let best = null;
    for (let i = from; i < to; i++) if (!inkAt(i)) { let j = i; while (j < to && !inkAt(j)) j++; if (!best || j - i > best[1] - best[0]) best = [i, j]; i = j; }
    if (!best) throw Error('no empty gap between poses');
    return Math.round((best[0] + best[1]) / 2);
  };
  const rowInk = (y, xa = 0, xb = W) => { for (let x = xa; x < xb; x++) if (!bg[y * W + x]) return true; return false; };
  const mid = gap(Math.round(H * 0.4), Math.round(H * 0.6), (y) => rowInk(y));
  const boxes = [];
  for (const [y0, y1] of [[0, mid], [mid, H]]) {
    const colInk = (x) => { for (let y = y0; y < y1; y++) if (!bg[y * W + x]) return true; return false; };
    const cuts = [0, gap(Math.round(W * 0.22), Math.round(W * 0.45), colInk), gap(Math.round(W * 0.55), Math.round(W * 0.78), colInk), W];
    for (let c = 0; c < 3; c++) boxes.push(box(cuts[c], y0, cuts[c + 1], y1));
  }
  function box(x0, y0, x1, y1) {
      let l = x1, r = -1, t = y1, b = -1;
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (!bg[y * W + x]) { l = Math.min(l, x); r = Math.max(r, x); t = Math.min(t, y); b = Math.max(b, y); }
    return {l, r, t, b};
  }
  // One scale: the tallest pose fills 420 px and the widest fits 464 px.
  const scale = Math.min(420 / Math.max(...boxes.map((k) => k.b - k.t + 1)), 464 / Math.max(...boxes.map((k) => k.r - k.l + 1)));
  const rgba = Buffer.alloc(W * H * 4);
  for (let i = 0; i < W * H; i++) rgba.set([data[i * 3], data[i * 3 + 1], data[i * 3 + 2], bg[i] ? 0 : 255], i * 4);
  const composites = [];
  for (const [c, k] of boxes.entries()) {
    const w = k.r - k.l + 1, h = k.b - k.t + 1, sw = Math.round(w * scale), sh = Math.round(h * scale);
    const pose = await sharp(rgba, {raw: {width: W, height: H, channels: 4}}).extract({left: k.l, top: k.t, width: w, height: h}).resize(sw, sh, {kernel: 'lanczos3'}).png().toBuffer();
    composites.push({input: pose, left: (c % 3) * CELL + 256 - Math.round(sw / 2), top: Math.floor(c / 3) * CELL + FOOT - sh});
  }
  await sharp({create: {width: 3 * CELL, height: 2 * CELL, channels: 4, background: {r: 0, g: 0, b: 0, alpha: 0}}}).composite(composites).png().toFile(output);
  return {scale: Number(scale.toFixed(4)), boxes};
}

if (process.argv[1] === new URL(import.meta.url).pathname) console.log(JSON.stringify(await prepFriendMaster(process.argv[2], process.argv[3])));
