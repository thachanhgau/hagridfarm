// 25.0 S3 «Mùa đông thật» (loaded with import() after the first frame: 25.0 speed budget): a real winter from 01/12 to the end of February (VN time). Snow lies on the ground
// even under a clear sky and deepens with each snowy day; fog, breath and fence lanterns come and go with it.
// Rare coats (đông, bạc, Noel) only recolour a creature inside the 32-colour palette: looks, never economy (#39).
import {stableHash} from './scene-animation.mjs?v=25.0.2';
import {SPRITE_PALETTE} from './palette.mjs?v=25.0.2';
import {WINTER_NIGHT_TINT} from './garden-atmosphere.mjs?v=25.0.2';

const VN_OFFSET_MS = 7 * 3600000, DAY_MS = 86400000;
const vnDate = (ms) => new Date(ms + VN_OFFSET_MS);
const dayKey = (date) => date.toISOString().slice(0, 10);
// Two snowy days in three; the first day of winter always snows. Same answer on every device.
export const snowFalls = (key) => key.endsWith('-12-01') || stableHash('snow:' + key) % 3 !== 0;

export function winterSeason(nowMs = Date.now()) {
  const today = vnDate(Number.isFinite(nowMs) ? nowMs : Date.now()), month = today.getUTCMonth() + 1;
  if (month !== 12 && month > 2) return {active: false, day: 0, snowDays: 0, depth: 0, christmas: false};
  const start = Date.UTC(month === 12 ? today.getUTCFullYear() : today.getUTCFullYear() - 1, 11, 1);
  const days = Math.floor((today.getTime() - start) / DAY_MS) + 1;
  let snowDays = 0;
  for (let i = 0; i < days; i++) if (snowFalls(dayKey(new Date(start + i * DAY_MS)))) snowDays++;
  // A dusting on 01/12, the whole meadow white after about two weeks of snowfall.
  return {active: true, day: days, snowDays, depth: Math.min(1, 0.2 + snowDays * 0.08), christmas: month === 12};
}

// QA: ?winterDate=2026-12-15 shows that day's winter on any date.
export function winterFor(nowMs, override) {
  const forced = /^\d{4}-\d{2}-\d{2}$/.test(override || '') ? Date.parse(override + 'T12:00:00+07:00') : NaN;
  return winterSeason(Number.isFinite(forced) ? forced : nowMs);
}

// Codex winter scenery (deferred: only requested while winter is on). Same canvas and pivot as the original.
export const WINTER_ART = Object.freeze({
  'environment/layers/hut.png': 'environment/winter/hut-snow.png',
  'environment/layers/pond.png': 'environment/winter/pond-ice.png',
  'environment/forest-v06/oak.png': 'environment/winter/oak.png',
  'environment/forest-v06/pine.png': 'environment/winter/pine.png',
  'environment/forest-v06/grove.png': 'environment/winter/grove.png',
  'environment/forest-v06/log.png': 'environment/winter/log.png',
});
export const WINTER_FILES = Object.freeze(Object.values(WINTER_ART));

// Smooth value noise in 0..1 with a fine ragged edge, so snow patches grow outward as depth rises.
function smooth(x, y, cell, salt) {
  const gx = Math.floor(x / cell), gy = Math.floor(y / cell), fx = x / cell - gx, fy = y / cell - gy;
  const v = (i, j) => { // integer hash: this runs for every ground pixel of a 2560×1440 cache
    let n = Math.imul(gx + i, 374761393) + Math.imul(gy + j, 668265263) + salt | 0;
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) & 1023) / 1023;
  };
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  return (v(0, 0) * (1 - sx) + v(1, 0) * sx) * (1 - sy) + (v(0, 1) * (1 - sx) + v(1, 1) * sx) * sy;
}
export function snowCovered(x, y, depth) {
  if (depth >= 1) return true;
  if (depth <= 0) return false;
  // 2 px blocks keep the edge pixel-art; the 2:1 stretch follows the isometric ground.
  const bx = x >> 1, by = y >> 1;
  const n = smooth(bx, by * 2, 40, 17) * 0.75 + smooth(bx, by, 7, 91) * 0.25;
  return n < depth;
}

// Snow lying on the flat top edges of a sprite: inside the silhouette, never past it, never on steep sides.
// Rows from the top: bright snow, body, cool shadow (big sprites get one more body row).
const SNOW_ROWS = {small: [[214, 216, 191], [214, 216, 191], [183, 222, 224]], big: [[232, 240, 237], [214, 216, 191], [214, 216, 191], [183, 222, 224]]};
export function snowCapImageData(image) {
  const {width: w, height: h, data: d} = image;
  const alpha = (x, y) => x >= 0 && y >= 0 && x < w && y < h ? d[(y * w + x) * 4 + 3] : 0;
  const rows = h >= 48 ? SNOW_ROWS.big : SNOW_ROWS.small;
  // Surface row of column nx near row y (within 2 rows), or null.
  const surface = (nx, y) => { for (let k = -2; k <= 2; k++) if (alpha(nx, y + k) && !alpha(nx, y + k - 1)) return y + k; return null; };
  const caps = [];
  for (let x = 0; x < w; x++) for (let y = 0; y < h; y++) {
    if (!alpha(x, y) || alpha(x, y - 1)) continue;
    const l = surface(x - 1, y), r = surface(x + 1, y);
    if (l == null || r == null || Math.abs(l - r) > 2) continue; // steep side: snow slides off
    const i = (y * w + x) * 4;
    caps.push([x, d[i] + d[i + 1] + d[i + 2] < 150 ? y + 1 : y]); // keep a dark top outline above the snow
  }
  for (const [x, y0] of caps) for (let k = 0; k < rows.length; k++) {
    if (!alpha(x, y0 + k)) break;
    const i = ((y0 + k) * w + x) * 4;
    [d[i], d[i + 1], d[i + 2]] = rows[k];
  }
  return image;
}

// Rare coats: the creature's dominant colour ramp maps onto the coat's ramp; outline, eyes and accents stay.
// 25.0 S4: each also needs grooming points (server garden-mood-core `coat`, 2 a grooming when happy, 1 otherwise).
export const RARE_COATS = Object.freeze([
  Object.freeze({id: 'winter', label: 'Lông đông', minAffinity: 2, coat: 3, ramp: ['#687486', '#A6B1AE', '#D6D8BF', '#E8F0ED'], when: (w) => w.active}),
  Object.freeze({id: 'noel', label: 'Lông Noel', minAffinity: 3, coat: 6, ramp: ['#4A3042', '#874056', '#C75B4B', '#E8F0ED'], when: (w) => w.christmas}),
  Object.freeze({id: 'silver', label: 'Lông bạc', minAffinity: 5, coat: 12, ramp: ['#41465C', '#687486', '#A6B1AE', '#B7DEE0'], when: () => true}),
]);
export const COAT_STEPS = Object.freeze(RARE_COATS.map((c) => [c.label, c.coat]));
const COAT_BY_ID = new Map(RARE_COATS.map((c) => [c.id, c]));
export function unlockedCoats(affinityLevel = 1, winter = {}, coat = 0) {
  return RARE_COATS.filter((c) => (Number(affinityLevel) || 1) >= c.minAffinity && (Number(coat) || 0) >= c.coat && c.when(winter)).map((c) => c.id);
}
// The worn coat, or none when it is no longer unlocked (Noel after December, đông after winter).
export function wornCoat(choice, affinityLevel, winter, coat) {
  return choice && unlockedCoats(affinityLevel, winter, coat).includes(choice) ? choice : null;
}
export function nextCoat(choice, affinityLevel, winter, coat) {
  const list = [null, ...unlockedCoats(affinityLevel, winter, coat)], at = list.indexOf(wornCoat(choice, affinityLevel, winter, coat));
  return list[(at + 1) % list.length];
}
export function wornCoats(coats = {}, affinities = {}, winter = {}) {
  return Object.fromEntries(Object.entries(coats).map(([sp, c]) => [sp, wornCoat(c, affinities[sp]?.level, winter, affinities[sp]?.coat)]).filter(([, c]) => c));
}
// The coat button: next unlocked coat (or back to the normal one), with the toast text.
export function cycleCoat(coats, species, affinityLevel, winter, coat) {
  if (!unlockedCoats(affinityLevel, winter, coat).length) return {coats, text: 'Bộ lông hiếm · chưa mở · Chăm bé → Chải lông'};
  const next = nextCoat(coats[species], affinityLevel, winter, coat), out = {...coats, [species]: next};
  if (!next) delete out[species];
  return {coats: out, text: coatLabel(next) + ' · chỉ để ngắm.'};
}
export function coatLabel(id) { return COAT_BY_ID.get(id)?.label || 'Lông thường'; }

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const SPRITE_RGB = SPRITE_PALETTE.map(rgb);
function rampOf(r, g, b) {
  let best = 0, dist = Infinity;
  SPRITE_RGB.forEach(([pr, pg, pb], i) => { const e = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2; if (e < dist) { dist = e; best = i; } });
  return best === 0 ? null : [best >> 2, best & 3]; // #231F2E is the outline: never recoloured
}
export function recolorCoatImageData(image, coatId) {
  const coat = COAT_BY_ID.get(coatId);
  if (!coat) return image;
  const d = image.data, counts = [0, 0, 0, 0, 0, 0];
  for (let i = 0; i < d.length; i += 4) if (d[i + 3]) { const r = rampOf(d[i], d[i + 1], d[i + 2]); if (r) counts[r[0]]++; }
  const main = counts.indexOf(Math.max(...counts)), ramp = coat.ramp.map(rgb);
  for (let i = 0; i < d.length; i += 4) {
    if (!d[i + 3]) continue;
    const r = rampOf(d[i], d[i + 1], d[i + 2]);
    if (!r || r[0] !== main) continue;
    [d[i], d[i + 1], d[i + 2]] = ramp[r[1]];
  }
  return image;
}

// Low fog drifting across the garden: stepped 4 px strips, thicker at dawn and night.
export function drawWinterFog(ctx, width, height, {clock = 0, mode = 'day'} = {}) {
  const alpha = mode === 'day' ? 0.07 : 0.11, drift = clock > 0 ? clock / 90 : 0;
  ctx.save?.();
  for (let band = 0; band < 6; band++) {
    const h = stableHash('fog:' + band), y0 = Math.round(height * (0.18 + band * 0.13 + ((h & 255) / 255) * 0.05));
    const span = width * (0.45 + ((h >>> 8) & 255) / 255 * 0.4), x0 = ((h >>> 16) % width + drift * (band % 2 ? 1 : -0.7)) % (width + span) - span;
    for (let row = 0; row < 5; row++) {
      const inset = Math.abs(row - 2) * span * 0.12, a = alpha * (1 - Math.abs(row - 2) * 0.28);
      ctx.fillStyle = `rgba(214,216,191,${a.toFixed(3)})`;
      ctx.fillRect?.(Math.round(x0 + inset), y0 + row * 4, Math.round(span - inset * 2), 4);
    }
  }
  ctx.restore?.();
}

// A small breath cloud in front of a face every few seconds (3 frames rising and thinning).
export function drawBreath(ctx, x, y, {clock = 0, seed = '', left = true} = {}) {
  if (!(clock > 0)) return;
  const period = 2600, t = (clock + (stableHash('breath:' + seed) % period)) % period;
  if (t >= 900) return;
  const step = Math.floor(t / 300), dir = left ? -1 : 1;
  const puffs = [[3, 2, 0.9], [4, 3, 0.7], [6, 3, 0.45]][step];
  ctx.fillStyle = `rgba(183,222,224,${puffs[2]})`; // cool mist: still visible against snow
  ctx.fillRect?.(Math.round(x + dir * (3 + step * 3) - (left ? puffs[0] : 0)), Math.round(y - step * 2), puffs[0], puffs[1]);
}

// Night lanterns on every third fence post while winter is on.
export function winterFenceLights(fence = []) {
  const out = [];
  fence.forEach((piece, i) => {
    if (piece.gate || i % 3 || !piece.a) return;
    out.push({id: 'winter-lantern:' + i, x: Math.round(piece.a[0]), y: Math.round(piece.a[1] - 40), radius: 130, color: [255, 195, 107]});
  });
  return out;
}
export function drawLantern(ctx, x, y, lit) {
  ctx.fillStyle = '#231F2E'; ctx.fillRect?.(x - 2, y - 1, 5, 7);
  ctx.fillStyle = lit ? '#FFC36B' : '#A57554'; ctx.fillRect?.(x - 1, y, 3, 5);
  if (lit) { ctx.fillStyle = '#F5D69A'; ctx.fillRect?.(x, y + 1, 1, 2); }
}

// Renderer hooks (kept here so scene-renderer.mjs stays small on the first-frame path).
export function recolorCanvas(target, coat) {
  const brush = target.getContext('2d', {willReadFrequently: true});
  if (typeof brush.getImageData === 'function') brush.putImageData(recolorCoatImageData(brush.getImageData(0, 0, target.width, target.height), coat), 0, 0);
  return target;
}
// Breath in front of the face: ink box from the frame bounds, face on the side the sprite looks to.
export function drawActorBreath(ctx, asset, xy, flipped, looksRight, seed, clock) {
  if (!asset || !(clock > 0)) return;
  const b = asset.bounds ?? {x: 0, y: 0, w: Number(asset.width) || 64, h: Number(asset.height) || 64};
  const left = flipped ? xy[0] + asset.pivotX - b.x - b.w : xy[0] - asset.pivotX + b.x, top = xy[1] - asset.pivotY + b.y;
  drawBreath(ctx, looksRight ? left + b.w : left, top + Math.round(b.h * 0.3), {clock, seed, left: !looksRight});
}
// Over the scene: moonlight on snow reads blue, lanterns drawn after the night tint stay lit, then the fog.
export function drawWinterLayer(ctx, {width, height, lanterns = [], mode = 'day', clock = 0}) {
  if (mode === 'night') { ctx.fillStyle = WINTER_NIGHT_TINT; ctx.fillRect?.(0, 0, width, height); }
  for (const light of lanterns) drawLantern(ctx, light.x, light.y, mode !== 'day');
  drawWinterFog(ctx, width, height, {clock, mode});
}

// 25.0: elf statues glow at dusk and night. Codex drew each statue whole at night (halo behind the head lighting it)
// on the day sprite's canvas and pivot, covering every day pixel; the renderer draws it over the statue after the
// night tint and loads it only once it is dark (deferred files).
const STATUE_GLOW_IDS = ['ev_dark_dobby_red', 'ev_dobby_spring_rider'];
const glowFile = (id, right, n) => `environment/statue-night/${id}${right ? '_right' : ''}-n${n}.png`;
export const STATUE_GLOW_FILES = Object.freeze(STATUE_GLOW_IDS.flatMap((id) => [0, 1, 2].flatMap((n) => [glowFile(id, false, n), glowFile(id, true, n)])));
// Slow breath n0 n1 n0 n2, each statue on its own beat; reduced motion (clock 0) holds n0.
export function statueGlow(object, clock = 0) {
  if (object?.kind !== 'store-decor' || object.preview || !STATUE_GLOW_IDS.includes(object.id)) return null;
  const n = clock > 0 ? [0, 1, 0, 2][Math.floor(clock / 600 + (object.slot ?? 0)) % 4] : 0;
  return {file: glowFile(object.id, object.facing === 'right', n), pivotX: object.asset.pivotX, pivotY: object.asset.pivotY, noSnowCap: true};
}
