// «Đốt vườn» (owner 01/11/2026): KTV Gia Tinh sets a member's garden on fire for a while (server garden.fire).
// The scene renderer calls drawGardenFire after everything else: a burnt glow over the stage, a charred tile
// under every flame, flames from Codex's sheets (environment/fire) on the stage tiles, smoke and rising embers.
// Pure drawing; the sheets load once, and until they do only the glow and embers show.
import {runtimeImageUrl} from './runtime-image-url.mjs?v=25.1.2';
import {stageContains} from './garden-growth.mjs?v=25.1.2';

export const FIRE_SHEETS = Object.freeze({
  large: {file: 'environment/fire/flame-large.png', w: 64, h: 96, frames: 8},
  small: {file: 'environment/fire/flame-small.png', w: 32, h: 48, frames: 8},
  smoke: {file: 'environment/fire/smoke.png', w: 48, h: 48, frames: 6},
  scorch: {file: 'environment/fire/scorch.png', w: 64, h: 32, frames: 1},
});
export const FIRE_BANNER = 'environment/fire/fire-banner.png';

const images = {};
function sheet(id) {
  if (typeof Image === 'undefined') return null;
  if (!images[id]) {images[id] = new Image(); images[id].src = runtimeImageUrl(FIRE_SHEETS[id].file);}
  return images[id].complete && images[id].naturalWidth ? images[id] : null;
}

// Stable 0..1 noise for a tile, so flames do not jump between frames.
const noise = (a, b, k = 0) => {const s = Math.sin(a * 127.1 + b * 311.7 + k * 74.7) * 43758.5453; return s - Math.floor(s);};

/** Flame spots for a stage: one per tile inside it, a big flame on about half of them. Cached by the caller. */
export function fireSpots(stage, iso, cols = 34, rows = 34) {
  const spots = [];
  for (let row = 0; row < rows; row += 1) for (let col = 0; col < cols; col += 1) {
    if (!stageContains(stage, col + 0.5, row + 0.5)) continue;
    const jitter = [noise(col, row, 1) - 0.5, noise(col, row, 2) - 0.5];
    const [x, y] = iso(col + 0.5 + jitter[0] * 0.6, row + 0.5 + jitter[1] * 0.6);
    spots.push({x: Math.round(x), y: Math.round(y), big: noise(col, row, 3) < 0.5, phase: Math.floor(noise(col, row, 4) * 8), smoke: noise(col, row, 5) < 0.12});
  }
  return spots.sort((a, b) => a.y - b.y);
}

/** Draws the fire over the scene. `clock` 0 (reduced motion) freezes the flames on one frame and stops embers. */
export function drawGardenFire(ctx, {spots = [], clock = 0, width, height}) {
  if (!ctx) return 0;
  const tick = Math.floor(clock / 90);
  ctx.save();
  // The burnt light over the whole view is CSS (body.garden-burning in garden-visit-fire.css): a canvas tint showed the canvas edge.
  const scorch = sheet('scorch'), large = sheet('large'), small = sheet('small'), smoke = sheet('smoke');
  ctx.imageSmoothingEnabled = false;
  if (scorch) {ctx.globalAlpha = 0.9; for (const s of spots) ctx.drawImage(scorch, s.x - 32, s.y - 16); ctx.globalAlpha = 1;}
  // Additive halo under each big flame makes the sea of fire glow.
  ctx.globalCompositeOperation = 'lighter';
  for (const s of spots) if (s.big) {
    const r = 46 + 6 * Math.sin((clock / 140) + s.phase);
    const halo = ctx.createRadialGradient(s.x, s.y - 20, 4, s.x, s.y - 20, r);
    halo.addColorStop(0, 'rgba(255,195,107,.30)');
    halo.addColorStop(1, 'rgba(199,91,75,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(s.x - r, s.y - 20 - r, r * 2, r * 2);
  }
  ctx.globalCompositeOperation = 'source-over';
  let drawn = 0;
  for (const s of spots) {
    const img = s.big ? large : small, def = FIRE_SHEETS[s.big ? 'large' : 'small'];
    if (!img) continue;
    const frame = (tick + s.phase) % def.frames;
    ctx.drawImage(img, frame * def.w, 0, def.w, def.h, s.x - def.w / 2, s.y - def.h + 6, def.w, def.h);
    drawn += 1;
  }
  if (smoke) for (const s of spots) if (s.smoke) {
    const def = FIRE_SHEETS.smoke, step = (tick + s.phase * 3) % (def.frames * 3), frame = Math.floor(step / 3);
    ctx.drawImage(smoke, frame * def.w, 0, def.w, def.h, s.x - def.w / 2, s.y - 110 - step * 6, def.w, def.h);
  }
  // Embers: square sparks rising and drifting, two warm colours.
  const count = Math.min(220, spots.length * 2);
  for (let i = 0; i < count && clock; i += 1) {
    const s = spots[(i * 7) % spots.length], life = 2600 + noise(i, 9) * 2200;
    const t = ((clock + noise(i, 7) * life) % life) / life;
    const x = s.x + Math.sin(t * 6 + i) * 14 + (noise(i, 8) - 0.5) * 30, y = s.y - 30 - t * 170;
    ctx.globalAlpha = 1 - t;
    ctx.fillStyle = i % 3 ? '#ffc36b' : '#ed8a45';
    ctx.fillRect(Math.round(x), Math.round(y), i % 4 ? 2 : 3, i % 4 ? 2 : 3);
  }
  ctx.restore();
  return drawn;
}

/** Time left as "1 ngày 2 giờ", "3 giờ 05 phút", "12 phút". */
export function fireTimeLeft(until, now = Date.now()) {
  const minutes = Math.max(1, Math.ceil((until - now) / 60000));
  const d = Math.floor(minutes / 1440), h = Math.floor((minutes % 1440) / 60), m = minutes % 60;
  if (d) return `${d} ngày${h ? ` ${h} giờ` : ''}`;
  if (h) return `${h} giờ${m ? ` ${String(m).padStart(2, '0')} phút` : ''}`;
  return `${m} phút`;
}
