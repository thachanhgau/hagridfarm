// Draws the Quidditch festival card v24-art/event-quidditch.webp in code:
// 320×180 pixel art, palette.mjs colours only, light from top-left, upscaled 2× nearest-neighbour.
// Usage: node garden-v05/build-quidditch-art.mjs [preview.png]
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {PALETTE} from './palette.mjs';

const require = createRequire(import.meta.url);
const sharp = require(process.env.SHARP_MODULE || '/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root = path.dirname(fileURLToPath(import.meta.url));

const W = 320, H = 180, INK = '#231F2E';

// ---- raster helpers -------------------------------------------------------
const layer = () => new Array(W * H).fill(null);
const px = (l, x, y, c) => {
  x = Math.round(x); y = Math.round(y);
  if (x >= 0 && y >= 0 && x < W && y < H) l[y * W + x] = c;
};
const get = (l, x, y) => (x >= 0 && y >= 0 && x < W && y < H ? l[y * W + x] : null);
const rect = (l, x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(l, x + i, y + j, c); };
const line = (l, x0, y0, x1, y1, c) => {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let e = dx + dy;
  for (;;) {
    px(l, x0, y0, c);
    if (x0 === x1 && y0 === y1) return;
    const e2 = 2 * e;
    if (e2 >= dy) { e += dy; x0 += sx; }
    if (e2 <= dx) { e += dx; y0 += sy; }
  }
};
const poly = (l, pts, c) => {
  const ys = pts.map(p => p[1]);
  for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) {
    const cy = y + 0.5, xs = [];
    for (let i = 0; i < pts.length; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
      if ((ay <= cy) !== (by <= cy)) xs.push(ax + (cy - ay) * (bx - ax) / (by - ay));
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2)
      for (let x = Math.ceil(xs[k] - 0.5); x + 0.5 <= xs[k + 1]; x++) px(l, x, y, c);
  }
};
const blit = (dst, src) => { for (let i = 0; i < src.length; i++) if (src[i]) dst[i] = src[i]; };
const outline = (l, c = INK) => {
  const o = l.slice();
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++)
    if (!l[y * W + x] && (get(l, x - 1, y) || get(l, x + 1, y) || get(l, x, y - 1) || get(l, x, y + 1))) o[y * W + x] = c;
  return o;
};
const sprite = (draw, ink = INK) => { const l = layer(); draw(l); blit(scene, ink ? outline(l, ink) : l); };
const rnd = (x, y) => { const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453; return s - Math.floor(s); };
const checker = (x, y) => ((x + y) & 1) === 0;
// Pixel map: each char is a key of `keys`; '.' is transparent.
const stamp = (l, x, y, rows, keys, flip = false) => rows.forEach((row, j) => [...row].forEach((ch, i) => {
  if (keys[ch]) px(l, x + (flip ? row.length - 1 - i : i), y + j, keys[ch]);
}));

// ---- ground plane: 2:1 isometric, u runs up-right (pitch length), v runs down-right
const C = {x: 150, y: 118};
const S = (u, v, z = 0) => [C.x + u + v, C.y + (v - u) / 2 - z];
const UV = (x, y) => { const dx = x + 0.5 - C.x, dy = y + 0.5 - C.y; return [(dx - 2 * dy) / 2, (dx + 2 * dy) / 2]; };
const A = 92, B = 34; // pitch half-length / half-width
const DARKER = {
  '#B0BD67': '#71934B', '#71934B': '#3F6A45', '#3F6A45': '#24483F', '#24483F': '#142620',
  '#B49A66': '#777044', '#E8F0ED': '#A6B1AE', '#8B4A3F': '#4A3042', '#735044': '#4A3042',
};

const scene = layer();

// ---- sky, clouds, hills, castle, forest edge ---------------------------------
for (let y = 0; y < 60; y++) for (let x = 0; x < W; x++) {
  let c = '#B7DEE0';
  if (y < 9 || (y < 13 && checker(x, y) && y < 11) || (y === 11 && x % 4 === 0)) c = '#70A8B6';
  if (y > 40 || (y > 37 && checker(x, y))) c = '#E8F0ED';
  px(scene, x, y, c);
}
const cloud = (cx, cy, w) => sprite(l => {
  for (let i = 0; i < w; i += 6) {
    const r = 4 + Math.round(rnd(cx + i, cy) * 3);
    for (let y = -r; y <= 0; y++) for (let x = -r - 1; x <= r + 1; x++)
      if ((x * x) / ((r + 1) * (r + 1)) + (y * y) / (r * r) <= 1) px(l, cx + i + x, cy + y, '#E8F0ED');
  }
  rect(l, cx - 4, cy, w + 6, 2, '#D6D8BF');
}, null);
cloud(196, 14, 26); cloud(282, 24, 20); cloud(18, 9, 18); cloud(118, 30, 14);

// distant hills: hazy, lit on left-facing slopes
const ridge = x => Math.round(42 - 5 * Math.sin(x / 23) - 3 * Math.sin(x / 9 + 1) - 4 * Math.sin(x / 51 + 2));
for (let x = 0; x < W; x++) for (let y = ridge(x); y < 60; y++)
  px(scene, x, y, ridge(x + 1) < ridge(x) && y < ridge(x) + 4 ? '#D6D8BF' : '#A6B1AE');

// Hogwarts on the far hill, top-left
sprite(l => {
  const towerAt = (x, top, w, roofH) => {
    rect(l, x, top, w, 46 - top, '#A6B1AE');
    rect(l, x + Math.ceil(w / 2), top, Math.floor(w / 2), 46 - top, '#687486');
    for (let j = 0; j < roofH; j++) {
      const half = Math.round((w / 2 + 1) * (j + 1) / roofH);
      const mid = x + w / 2;
      for (let i = -half; i < half; i++) px(l, mid + i, top - roofH + j, i < 0 ? '#6961A6' : '#3E3B70');
    }
    for (let y = top + 3; y < 42; y += 5) px(l, x + 1, y, '#41465C');
  };
  rect(l, 14, 34, 50, 12, '#A6B1AE'); rect(l, 40, 34, 24, 12, '#687486');
  for (let x = 14; x < 64; x += 3) px(l, x, 33, '#A6B1AE');
  towerAt(16, 24, 5, 7); towerAt(26, 16, 6, 10); towerAt(36, 26, 8, 6); towerAt(48, 20, 5, 9); towerAt(57, 28, 4, 6);
  for (let x = 18; x < 62; x += 4) px(l, x, 38, '#41465C');
}, '#687486');

// forest edge behind the pitch
for (let y = 52; y < H; y++) for (let x = 0; x < W; x++) px(scene, x, y, '#3F6A45');
for (let x = -6; x < W + 6; x += 5) {
  const h = 9 + Math.round(rnd(x, 3) * 9), base = 58 + Math.round(rnd(x, 7) * 3);
  for (let j = 0; j < h; j++) {
    const half = Math.round((j + 1) * 3.4 / h * (1 + (j % 3 === 2 ? 0.25 : 0)));
    for (let i = -half; i <= half; i++) px(scene, x + i, base - h + j, i < 0 && j > 1 ? '#3F6A45' : '#24483F');
  }
}
for (let x = 0; x < W; x++) px(scene, x, 61 + (x % 3 === 0 ? 1 : 0), '#24483F');

// ---- grounds: grass, sandy track, mowed pitch ----------------------------------
const shadow = layer();
for (let y = 60; y < H; y++) for (let x = 0; x < W; x++) {
  const [u, v] = UV(x, y);
  const r = (u / A) ** 2 + (v / B) ** 2;
  const n = rnd(x, y);
  let c = n > 0.9 ? '#71934B' : '#3F6A45';
  if (n > 0.988) c = ['#E07A9E', '#FFC36B', '#E8F0ED'][Math.floor(rnd(y, x) * 3)];
  if (y < 64 && rnd(x, y) > 0.5) c = '#24483F';
  if (r <= 1.2) c = '#B49A66';
  if (r <= 1.2 && r > 1.12 && rnd(x, y) > 0.7) c = '#E7AE73';
  if (r <= 1) c = Math.floor((u + 400) / 10) % 2 ? '#B0BD67' : '#71934B';
  // chalk: boundary, centre circle, keeper areas
  if (r <= 1 && r > 0.955) c = '#E8F0ED';
  const cc = Math.hypot(u, v);
  if (cc > 9 && cc <= 10.6) c = '#E8F0ED';
  const kc = Math.hypot(u - (A - 18), v);
  if (r <= 1 && kc > 22 && kc <= 23.5) c = '#E8F0ED';
  if (r <= 1 && Math.abs(u - (A - 40)) < 0.8) c = '#E8F0ED';
  px(scene, x, y, c);
}

// ---- spectator towers along the back side ----------------------------------------
const HOUSES = {
  gryffindor: {lit: '#C75B4B', dark: '#874056', trim: '#FFC36B', trimDark: '#E7AE73'},
  ravenclaw: {lit: '#6961A6', dark: '#3E3B70', trim: '#C97952', trimDark: '#A57554'},
  hufflepuff: {lit: '#FFC36B', dark: '#E7AE73', trim: '#231F2E', trimDark: '#231F2E'},
  slytherin: {lit: '#3F6A45', dark: '#24483F', trim: '#D6D8BF', trimDark: '#A6B1AE'},
};
const D = 9, LEG = 26, STAND = 8, POST = 6, ROOF = 12;
const eaves = [];
function tower(u0, v0, house) {
  const h = HOUSES[house];
  const u1 = u0 + D, v1 = v0 + D;
  // shadow falls to the lower right
  poly(shadow, [S(u0, v1), S(u1, v1), S(u1 + 5, v1 + 15), S(u0 + 5, v1 + 15)], 1);
  poly(shadow, [S(u0, v0), S(u0, v1), S(u0 + 5, v1 + 15), S(u0 + 5, v0 + 15)], 1);
  // scaffold legs and bracing (no outline: reads lighter)
  const legs = layer();
  const post = (u, v, lit) => {
    const [x, y] = S(u, v);
    line(legs, x, y, x, y - LEG, lit ? '#A57554' : '#735044');
    line(legs, x + 1, y, x + 1, y - LEG, lit ? '#735044' : '#4A3042');
  };
  post(u1, v0, false);
  const brace = (a, b, c) => { line(legs, ...S(...a), ...S(...b), c); };
  brace([u0, v0, 0], [u0, v1, LEG / 2], '#735044'); brace([u0, v1, 0], [u0, v0, LEG / 2], '#735044');
  brace([u0, v0, LEG / 2], [u0, v1, LEG], '#735044'); brace([u0, v1, LEG / 2], [u0, v0, LEG], '#735044');
  brace([u0, v1, 0], [u1, v1, LEG / 2], '#4A3042'); brace([u1, v1, 0], [u0, v1, LEG / 2], '#4A3042');
  brace([u0, v1, LEG / 2], [u1, v1, LEG], '#4A3042'); brace([u1, v1, LEG / 2], [u0, v1, LEG], '#4A3042');
  post(u0, v0, true); post(u0, v1, true); post(u1, v1, false);
  blit(scene, outline(legs, '#4A3042'));

  sprite(l => {
    const z0 = LEG, z1 = LEG + STAND, z2 = z1 + POST, z3 = z2 + ROOF;
    // stand floor + spectators
    poly(l, [S(u0, v0, z1), S(u1, v0, z1), S(u1, v1, z1), S(u0, v1, z1)], '#735044');
    const crowd = ['#C75B4B', '#FFC36B', '#3F6A45', '#6961A6', '#E7AE73', '#F5D69A'];
    for (let t = 1; t < D; t += 2) {
      const [x, y] = S(u0 + t, v0 + 1, z1);
      px(l, x, y - 1, '#E7AE73'); px(l, x, y, crowd[(((t + u0) % 6) + 6) % 6]);
      const [x2, y2] = S(u0 + 1, v0 + t, z1);
      px(l, x2, y2 - 1, '#F5D69A'); px(l, x2, y2, crowd[(((t * 3 + v0) % 6) + 6) % 6]);
    }
    // draped stand walls with house stripes
    const face = (pts, fill, stripeColour, axis) => {
      poly(l, pts, fill);
      for (let t = 1.5; t < D; t += 3) {
        const a = axis === 'v' ? S(u0, v0 + t, z0) : S(u0 + t, v1, z0);
        const b = axis === 'v' ? S(u0, v0 + t, z1) : S(u0 + t, v1, z1);
        line(l, ...a, ...b, stripeColour);
      }
    };
    face([S(u0, v0, z0), S(u0, v1, z0), S(u0, v1, z1), S(u0, v0, z1)], h.lit, h.trim, 'v');
    face([S(u0, v1, z0), S(u1, v1, z0), S(u1, v1, z1), S(u0, v1, z1)], h.dark, h.trimDark, 'u');
    line(l, ...S(u0, v0, z1), ...S(u0, v1, z1), h.trim); line(l, ...S(u0, v1, z1), ...S(u1, v1, z1), h.trimDark);
    // long banners hanging below the stand
    const banner = (onLeft, fill, stripe) => {
      const at = (t, z) => (onLeft ? S(u0, v0 + t, z) : S(u0 + t, v1, z));
      const bz = z0 - 15;
      poly(l, [at(2, z0), at(D - 2, z0), at(D - 2, bz), at(D / 2, bz + 3), at(2, bz)], fill);
      line(l, ...at(D / 2, z0), ...at(D / 2, bz + 3), stripe);
    };
    banner(true, h.lit, h.trim); banner(false, h.dark, h.trimDark);
    // canopy posts
    for (const [u, v, c] of [[u0, v0, '#A57554'], [u0, v1, '#A57554'], [u1, v1, '#735044']]) line(l, ...S(u, v, z1), ...S(u, v, z2), c);
    // pyramid roof
    const o = 1.5, apex = S(u0 + D / 2, v0 + D / 2, z3);
    const bl = S(u0 - o, v0 - o, z2), fl = S(u0 - o, v1 + o, z2), fr = S(u1 + o, v1 + o, z2), br = S(u1 + o, v0 - o, z2);
    poly(l, [bl, fl, fr, br], h.dark);
    poly(l, [bl, fl, apex], h.lit);
    poly(l, [fl, fr, apex], h.dark);
    line(l, ...bl, ...fl, h.trim); line(l, ...fl, ...fr, h.trimDark);
    line(l, ...fl, ...apex, h.trim);
    // flag on the apex
    line(l, apex[0], apex[1], apex[0], apex[1] - 6, '#4A3042');
    poly(l, [[apex[0] + 1, apex[1] - 7], [apex[0] + 6, apex[1] - 5.5], [apex[0] + 1, apex[1] - 3]], h.trim === INK ? h.lit : h.trim);
    eaves.push([fl, br]);
  });
}

// ---- golden hoops at the far end ---------------------------------------------------
function hoop(u, v, poleH, R) {
  const [gx, gy] = S(u, v);
  poly(shadow, [[gx, gy - 1], [gx + 3, gy - 1], [gx + 14, gy + 5], [gx + 11, gy + 5]], 1);
  sprite(l => {
    rect(l, gx - 2, gy - 1, 6, 2, '#A57554'); rect(l, gx - 1, gy - 2, 4, 1, '#735044');
    line(l, gx, gy - 2, gx, gy - poleH, '#FFC36B');
    line(l, gx + 1, gy - 2, gx + 1, gy - poleH, '#C97952');
    const cy = gy - poleH - R;
    for (let y = -R - 6; y <= R + 6; y++) for (let x = -R - 2; x <= R + 2; x++) {
      const rho = Math.hypot(x, 0.5 * x - y);
      if (rho > R || rho <= R - 2.2) continue;
      const lightness = -x - (0.5 * x - y) * 0.6;
      px(l, gx + x, cy + y, lightness > R * 0.35 ? '#FFC36B' : lightness > -R * 0.5 ? '#E7AE73' : '#C97952');
    }
    // highlight glint
    px(l, gx - R + 2, cy - 2, '#E8F0ED');
  });
}

// ---- broom riders (pixel maps, facing right) ---------------------------------------
const RIDER = [
  '............hhh.........',
  '...........hhhhh........',
  '...........hhsss........',
  '............sss.........',
  '.....cc...RRRR..........',
  '...ccccRRRRRRRRss.......',
  '.ccccRRRRRRRRR..ss......',
  'cc...rRRRRRR.....ss.....',
  'bbBBB..rRR........ww....',
  'bbbBBwwwwwwwwwwwwwwwwwWW',
  'bbBBB...rRR.............',
  '.........rk.............',
  '.........kk.............',
];
function rider(x, y, robe, robeDark, hair, flip = false) {
  sprite(l => stamp(l, x, y, RIDER, {
    h: hair, s: '#E7AE73', R: robe, r: robeDark, c: robeDark,
    w: '#A57554', W: '#735044', b: '#B49A66', B: '#E7AE73', k: '#4A3042',
  }, flip));
}

// ---- foreground: Hagrid's garden corner -----------------------------------------
function pumpkin(x, y, big) {
  sprite(l => {
    const rx = big ? 5 : 4, ry = big ? 3.5 : 3;
    for (let j = -Math.ceil(ry); j <= Math.ceil(ry); j++) for (let i = -rx; i <= rx; i++) {
      if ((i * i) / (rx * rx) + (j * j) / (ry * ry) > 1) continue;
      let c = '#ED8A45';
      if (i > rx * 0.35 || j > ry * 0.5) c = '#C75B4B';
      if (i === 0 || Math.abs(i) === Math.round(rx * 0.55)) c = c === '#ED8A45' ? '#C97952' : '#874056';
      if (i < -1 && i > -rx + 1 && j < -0.5) c = '#FFC36B';
      px(l, x + i, y + j, c);
    }
    rect(l, x, y - Math.ceil(ry) - 2, 1, 2, '#3F6A45');
    px(l, x + 1, y - Math.ceil(ry) - 2, '#71934B');
  });
}
function leafy(x, y) {
  sprite(l => {
    for (let j = -3; j <= 2; j++) for (let i = -4; i <= 4; i++)
      if (i * i / 16 + j * j / 9 <= 1) px(l, x + i, y + j, i + j < -2 ? '#B0BD67' : i + j < 2 ? '#71934B' : '#3F6A45');
    px(l, x - 1, y - 1, '#3F6A45'); px(l, x + 1, y, '#3F6A45');
  }, '#24483F');
}
function sunflower(x, y, h) {
  sprite(l => {
    line(l, x, y, x, y - h, '#3F6A45');
    px(l, x - 1, y - Math.round(h * 0.45), '#71934B'); px(l, x - 2, y - Math.round(h * 0.45) - 1, '#71934B');
    px(l, x + 1, y - Math.round(h * 0.65), '#3F6A45'); px(l, x + 2, y - Math.round(h * 0.65) - 1, '#3F6A45');
    const cy = y - h - 2;
    for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) {
      const d = Math.hypot(i, j);
      if (d > 3.3) continue;
      px(l, x + i, cy + j, d < 1.6 ? (i + j < 0 ? '#A57554' : '#735044') : i + j < 0 ? '#FFC36B' : '#E7AE73');
    }
  });
}
function pine(x, base, h, ink = '#142620') {
  sprite(l => {
    rect(l, x - 1, base - 4, 3, 5, '#4A3042'); px(l, x - 1, base - 4, '#735044');
    const tiers = 4;
    for (let t = 0; t < tiers; t++) {
      const top = base - h + t * h * 0.2, bottom = base - 3 - (tiers - 1 - t) * h * 0.17;
      const half = (h * 0.16) + t * h * 0.07;
      for (let y = Math.round(top); y <= Math.round(bottom); y++) {
        const w = Math.round(half * (y - top) / (bottom - top + 0.01));
        for (let i = -w; i <= w; i++) px(l, x + i, y, i < -w * 0.35 ? '#3F6A45' : i < w * 0.4 ? '#24483F' : '#142620');
        if (w > 1) px(l, x - w, y, '#71934B');
      }
    }
  }, ink);
}
function bunting(a, b, sag, flags) {
  const n = Math.max(2, Math.round(Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1])));
  let prev = a;
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    const p = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t + sag * 4 * t * (1 - t)];
    line(scene, ...prev, ...p, '#4A3042');
    prev = p;
  }
  const count = Math.floor(n / 5);
  for (let k = 1; k < count; k++) {
    const t = k / count;
    const x = Math.round(a[0] + (b[0] - a[0]) * t), y = Math.round(a[1] + (b[1] - a[1]) * t + sag * 4 * t * (1 - t));
    const c = flags[k % flags.length];
    px(scene, x - 1, y + 1, c); px(scene, x, y + 1, c); px(scene, x + 1, y + 1, c);
    px(scene, x - 1, y + 2, c); px(scene, x, y + 2, c);
    px(scene, x, y + 3, c);
    px(scene, x + 1, y + 2, INK);
  }
}
const FLAGS = ['#C75B4B', '#FFC36B', '#3F6A45', '#6961A6', '#E8F0ED'];

// ---- compose -----------------------------------------------------------------
const TOWERS = [[-78, 'gryffindor'], [-38, 'ravenclaw'], [2, 'hufflepuff'], [42, 'slytherin']];
// striped feast marquee for the end-of-year party
function tent(u0, v0, d, lit, dark, cream) {
  const u1 = u0 + d, v1 = v0 + d, zw = 8, zr = 20;
  poly(shadow, [S(u1, v0), S(u1, v1), S(u1 + 8, v1 + 16), S(u1 + 8, v0 + 16)], 1);
  sprite(l => {
    for (let t = 0; t < d; t += 2) {
      const stripe = (t / 2) % 2 === 0;
      poly(l, [S(u0, v0 + t, 0), S(u0, v0 + t + 2, 0), S(u0, v0 + t + 2, zw), S(u0, v0 + t, zw)], stripe ? lit : cream);
      poly(l, [S(u0 + t, v1, 0), S(u0 + t + 2, v1, 0), S(u0 + t + 2, v1, zw), S(u0 + t, v1, zw)], stripe ? dark : '#D6D8BF');
    }
    poly(l, [S(u0 + d / 2 - 2, v1, 0), S(u0 + d / 2 + 2, v1, 0), S(u0 + d / 2, v1, zw - 2)], '#4A3042'); // doorway
    const o = 1.5, apex = S(u0 + d / 2, v0 + d / 2, zr);
    const bl = S(u0 - o, v0 - o, zw), fl = S(u0 - o, v1 + o, zw), fr = S(u1 + o, v1 + o, zw), br = S(u1 + o, v0 - o, zw);
    poly(l, [bl, fl, fr, br, apex], dark);
    const fan = (a, b, colours) => {
      for (let k = 0; k < 6; k++) {
        const p = [a[0] + (b[0] - a[0]) * k / 6, a[1] + (b[1] - a[1]) * k / 6];
        const q = [a[0] + (b[0] - a[0]) * (k + 1) / 6, a[1] + (b[1] - a[1]) * (k + 1) / 6];
        poly(l, [p, q, apex], colours[k % 2]);
      }
    };
    fan(bl, fl, [lit, cream]); fan(fl, fr, [dark, '#D6D8BF']);
    for (const [a, b] of [[bl, fl], [fl, fr]]) for (let k = 0; k <= 12; k++)
      px(l, a[0] + (b[0] - a[0]) * k / 12, a[1] + (b[1] - a[1]) * k / 12 + (k % 2), k % 2 ? dark : lit);
    line(l, apex[0], apex[1], apex[0], apex[1] - 6, '#4A3042');
    poly(l, [[apex[0] + 1, apex[1] - 7], [apex[0] + 6, apex[1] - 5.5], [apex[0] + 1, apex[1] - 3]], '#FFC36B');
  });
}
// shadows are collected while towers and hoops are drawn, then darken only ground still showing
const groundSnapshot = scene.slice();
const towerV = -B - 16;
for (const [u, house] of TOWERS) tower(u, towerV, house);
tent(-58, B + 9, 14, '#C75B4B', '#874056', '#F5D69A');
tent(-26, B + 13, 12, '#6961A6', '#3E3B70', '#F5D69A');
const HOOPS = [[A - 4, -18, 27], [A - 4, 0, 34], [A - 4, 18, 22]];
for (const [u, v, h] of HOOPS) hoop(u, v, h, 8);
poly(shadow, [[172, 104], [186, 104], [184, 107], [174, 107]], 1); // Gryffindor chaser
// apply shadows only where the ground still shows
for (let i = 0; i < scene.length; i++)
  if (shadow[i] && scene[i] === groundSnapshot[i] && DARKER[scene[i]] && Math.floor(i / W) > 62) scene[i] = DARKER[scene[i]];
for (let i = 0; i + 1 < eaves.length; i++) bunting(eaves[i][0], eaves[i + 1][0], 7, FLAGS.slice(i % 2));

// riders and the Snitch
rider(166, 64, '#C75B4B', '#874056', '#4A3042');
rider(184, 34, '#3F6A45', '#24483F', '#F5D69A', true);
rider(276, 44, '#FFC36B', '#E7AE73', '#4A3042', true);
// the Snitch, just ahead of the Slytherin seeker
const [sx, sy] = [174, 30];
sprite(l => {
  rect(l, sx, sy, 3, 3, '#FFC36B'); px(l, sx + 2, sy + 2, '#E7AE73'); px(l, sx, sy, '#E8F0ED');
  for (const [x, y] of [[-3, -2], [-2, -1], [-1, -1], [-3, -1], [5, -2], [4, -1], [3, -1], [5, -1]]) px(l, sx + x, sy + y, '#E8F0ED');
}, '#8B4A3F');
for (const [x, y] of [[1, -5], [1, -4], [1, 6], [1, 7], [-6, 1], [-5, 1], [7, 1], [8, 1]]) px(scene, sx + x, sy + y, '#FFC36B');

// foreground garden: soil bed, fence, crops
const FV = B + 34, GU = 10; // garden starts beyond this fence corner
for (let y = 60; y < H; y++) for (let x = 0; x < W; x++) {
  const [u, v] = UV(x, y);
  if (v > FV + 3 && u > GU + 3) {
    const row = (v - FV - 3) % 8;
    px(scene, x, y, row < 1.5 ? '#735044' : row < 3 ? '#C97952' : '#8B4A3F');
  }
}
const fenceRun = (a, b) => {
  const [ax, ay] = S(...a), [bx, by] = S(...b);
  line(scene, ax, ay - 7, bx, by - 7, '#A57554'); line(scene, ax, ay - 6, bx, by - 6, '#735044');
  line(scene, ax, ay - 3, bx, by - 3, '#A57554'); line(scene, ax, ay - 2, bx, by - 2, '#735044');
};
const fencePost = (u, v) => sprite(l => {
  const [x, y] = S(u, v);
  rect(l, x, y - 10, 1, 11, '#A57554'); rect(l, x + 1, y - 10, 1, 11, '#735044');
}, '#4A3042');
fenceRun([GU, FV], [150, FV]);
for (let u = GU; u <= 150; u += 7) fencePost(u, FV);
const crops = [];
for (let u = GU + 8; u < 140; u += 13) crops.push([u, FV + 7, 'sun']);
for (let u = GU + 10; u < 140; u += 11) crops.push([u, FV + 15, 'pumpkin']);
for (let u = GU + 7; u < 140; u += 10) crops.push([u, FV + 23, 'leafy']);
for (let u = GU + 12; u < 140; u += 12) crops.push([u, FV + 31, 'pumpkin']);
for (let u = GU + 8; u < 140; u += 10) crops.push([u, FV + 39, 'leafy']);
crops.sort((a, b) => S(...a)[1] - S(...b)[1]);
for (const [u, v, kind] of crops) {
  const [x, y] = S(u, v);
  if (kind === 'sun') sunflower(x, y, 12 + Math.round(rnd(u, v) * 5));
  if (kind === 'pumpkin') pumpkin(x, y, rnd(u, v) > 0.45);
  if (kind === 'leafy') leafy(x, y);
}
// side fence closes the corner, drawn after crops so it sits in front
fenceRun([GU, FV], [GU, FV + 80]);
for (let v = FV; v <= FV + 80; v += 7) fencePost(GU, v);
bunting(S(GU, FV, 10), S(GU + 56, FV, 10), 4, FLAGS);
bunting(S(GU + 56, FV, 10), S(GU + 112, FV, 10), 4, FLAGS.slice(2));

// framing pines, bottom-left
pine(8, 176, 44); pine(26, 184, 34); pine(-2, 140, 30);
function roundTree(x, base, r) {
  sprite(l => {
    rect(l, x - 1, base - 6, 3, 7, '#4A3042'); px(l, x - 1, base - 6, '#735044');
    for (let j = -r; j <= r; j++) for (let i = -r - 1; i <= r + 1; i++) {
      const d = (i * i) / ((r + 1) * (r + 1)) + (j * j) / (r * r);
      if (d > 1 || (d > 0.8 && rnd(x + i, j) > 0.6)) continue;
      const lit = -i - j;
      px(l, x + i, base - 6 - r + j, lit > r * 0.6 ? '#B0BD67' : lit > -r * 0.3 ? '#71934B' : '#3F6A45');
    }
  }, '#24483F');
}
roundTree(304, 96, 9); roundTree(318, 84, 8);

// ---- export -------------------------------------------------------------------
const used = new Set(scene);
for (const c of used) if (!PALETTE.includes(c)) throw new Error(`colour outside palette: ${c}`);
const rgba = Buffer.alloc(W * H * 4);
scene.forEach((c, i) => {
  if (!c) throw new Error(`hole at ${i % W},${Math.floor(i / W)}`);
  rgba.writeUInt32BE((parseInt(c.slice(1), 16) << 8 | 0xff) >>> 0, i * 4);
});
const img = () => sharp(rgba, {raw: {width: W, height: H, channels: 4}}).resize(W * 2, H * 2, {kernel: 'nearest'});
const out = path.join(root, 'v24-art', 'event-quidditch.webp');
const info = await img().webp({lossless: true, effort: 6}).toFile(out);
if (process.argv[2]) await img().png().toFile(process.argv[2]);
console.log(`${out} ${info.width}x${info.height} ${info.size} bytes, ${used.size} colours`);
