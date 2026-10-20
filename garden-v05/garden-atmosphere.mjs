import { stableHash } from './scene-animation.mjs?v=24.9.61';

export const ATMOSPHERE_MODES = Object.freeze([
  Object.freeze({
    id: 'day',
    label: 'Ban ngày',
    shortLabel: '☀ Ngày',
    icon: '☀',
    tint: null,
    glowIntensity: 0,
    fireflyCount: 0,
  }),
  Object.freeze({
    id: 'dusk',
    label: 'Hoàng hôn Rừng Cấm',
    shortLabel: '🌅 Hoàng hôn',
    icon: '🌅',
    tint: 'rgba(56, 30, 48, 0.24)',
    glowIntensity: 0.68,
    fireflyCount: 14,
  }),
  Object.freeze({
    id: 'night',
    label: 'Đêm trăng Rừng Cấm',
    shortLabel: '🌙 Đêm trăng',
    icon: '🌙',
    tint: 'rgba(10, 18, 34, 0.44)',
    glowIntensity: 1.0,
    fireflyCount: 28,
  }),
]);

export const WEATHER_MODES = Object.freeze([
  Object.freeze({
    id: 'clear',
    label: 'Trời quang gió nhẹ',
    shortLabel: '🍃 Quang đãng',
    icon: '🍃',
    particleCount: 0,
  }),
  Object.freeze({
    id: 'rain',
    tint: 'rgba(20, 48, 58, 0.10)',
    label: 'Mưa phùn Thảo dược',
    shortLabel: '🌧 Mưa phùn',
    icon: '🌧',
    particleCount: 42,
  }),
  Object.freeze({
    id: 'autumn',
    label: 'Lá thu vàng Rừng Cấm',
    shortLabel: '🍂 Lá thu',
    icon: '🍂',
    particleCount: 24,
  }),
  Object.freeze({
    id: 'snow',
    tint: 'rgba(214, 232, 238, 0.07)',
    label: 'Tuyết rơi Giáng sinh Hogwarts',
    shortLabel: '❄ Tuyết rơi',
    icon: '❄',
    particleCount: 36,
  }),
]);

const MODE_MAP = new Map(ATMOSPHERE_MODES.map((m) => [m.id, m]));
const WEATHER_MAP = new Map(WEATHER_MODES.map((w) => [w.id, w]));

export function normalizeAtmosphereMode(value) {
  const key = String(value ?? '').trim().toLowerCase();
  return MODE_MAP.has(key) ? key : 'day';
}

export function atmosphereConfig(mode) {
  return MODE_MAP.get(normalizeAtmosphereMode(mode)) ?? ATMOSPHERE_MODES[0];
}

export function nextAtmosphereMode(current) {
  const norm = normalizeAtmosphereMode(current);
  const idx = ATMOSPHERE_MODES.findIndex((m) => m.id === norm);
  return ATMOSPHERE_MODES[(idx + 1) % ATMOSPHERE_MODES.length].id;
}

export function normalizeWeatherMode(value) {
  const key = String(value ?? '').trim().toLowerCase();
  return WEATHER_MAP.has(key) ? key : 'clear';
}

export function weatherConfig(mode) {
  return WEATHER_MAP.get(normalizeWeatherMode(mode)) ?? WEATHER_MODES[0];
}

export function nextWeatherMode(current) {
  const norm = normalizeWeatherMode(current);
  const idx = WEATHER_MODES.findIndex((w) => w.id === norm);
  return WEATHER_MODES[(idx + 1) % WEATHER_MODES.length].id;
}

const STORE_DECOR_LIGHTS = Object.freeze({
  decor_pumpkin_lantern: { radius: 66, offsetY: -28, color: [255, 178, 78] },
  decor_floating_candles: { radius: 74, offsetY: -44, color: [255, 224, 140] },
  decor_cauldron: { radius: 52, offsetY: -26, color: [168, 228, 210] },
  decor_vine_arch: { radius: 48, offsetY: -36, color: [210, 232, 142] },
  decor_mandrake_planter: { radius: 38, offsetY: -22, color: [190, 218, 128] },
});

export function collectLightSources(objects = []) {
  const lights = [];
  for (const obj of objects) {
    if (!obj || !Array.isArray(obj.xy)) continue;
    const [x, y] = obj.xy;
    if (obj.kind === 'wizard-scenery') {
      if (obj.id === 'gardener') {
        lights.push({ id: 'gardener', x: x + 18, y: y - 42, radius: 74, color: [255, 198, 105] });
      } else if (obj.id === 'owl') {
        lights.push({ id: 'owl', x: x + 6, y: y - 48, radius: 52, color: [245, 214, 154] });
      } else if (obj.id === 'greenhouse') {
        lights.push({ id: 'greenhouse', x, y: y - 50, radius: 94, color: [183, 222, 224] });
      }
    } else if (obj.kind === 'asset' && obj.type === 'prop' && obj.id === 'hut') {
      lights.push({ id: 'hut', x: x - 8, y: y - 54, radius: 92, color: [255, 194, 102] });
    } else if (obj.kind === 'festival') {
      const spec = obj.hero ? (obj.id === 'hero-yule' ? {radius:110,offsetY:-82,color:[255,207,126]} : obj.id === 'hero-halloween' ? {radius:95,offsetY:-35,color:[255,167,84]} : null) : STORE_DECOR_LIGHTS[obj.asset?.id];
      if (spec) lights.push({id:obj.id,x,y:y+spec.offsetY,radius:spec.radius,color:spec.color});
    } else if (obj.kind === 'store-decor') {
      const spec = STORE_DECOR_LIGHTS[obj.id];
      if (spec) {
        const dirOffset = obj.facing === 'right' ? 6 : -6;
        lights.push({
          id: `${obj.id}:${obj.slot}`,
          x: x + dirOffset,
          y: y + spec.offsetY,
          radius: spec.radius,
          color: spec.color,
        });
      }
    } else if (obj.kind === 'decoration') {
      const shape = String(obj.shape || '');
      if (shape.includes('lantern') || shape.includes('moon') || shape.includes('pedestal') || shape.includes('arbor') || shape.includes('observatory')) {
        lights.push({
          id: obj.id,
          x,
          y: y - 24,
          radius: 50,
          color: shape.includes('mist') ? [183, 222, 224] : [245, 214, 154],
        });
      }
    }
  }
  return lights;
}

export function computeFireflies(clock = 0, bounds = { left: 200, top: 150, right: 2200, bottom: 1350 }, count = 20) {
  const safeCount = Math.max(0, Math.min(48, Math.floor(Number(count) || 0)));
  if (safeCount === 0) return [];
  const t = Number.isFinite(Number(clock)) && Number(clock) > 0 ? Number(clock) : 0;
  const spanX = Math.max(240, (bounds?.right ?? 2200) - (bounds?.left ?? 200));
  const spanY = Math.max(180, (bounds?.bottom ?? 1350) - (bounds?.top ?? 150));
  const left = bounds?.left ?? 200;
  const top = bounds?.top ?? 150;
  const flies = [];
  for (let i = 0; i < safeCount; i += 1) {
    const h = stableHash(`firefly:${i}`);
    const baseX = left + ((h & 0xffff) / 0xffff) * spanX;
    const baseY = top + (((h >>> 16) & 0xffff) / 0xffff) * spanY;
    const phase = (h % 628) / 100;
    const driftX = t > 0 ? Math.sin(t / 1400 + phase) * 18 : 0;
    const driftY = t > 0 ? Math.cos(t / 1100 + phase * 1.3) * 12 : 0;
    const pulse = t > 0 ? 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t / 480 + phase * 2)) : 0.75;
    flies.push({
      x: Math.round(baseX + driftX),
      y: Math.round(baseY + driftY),
      radius: (i % 3 === 0) ? 3 : 2,
      alpha: Number(pulse.toFixed(3)),
      color: (i % 4 === 0) ? '#b7dee0' : '#f5d69a',
    });
  }
  return flies;
}

export function computeWeatherParticles(
  weatherMode = 'clear',
  clock = 0,
  bounds = { left: 160, top: 100, right: 2240, bottom: 1380 },
  countOverride = null,
) {
  const cfg = weatherConfig(weatherMode);
  const count = countOverride != null
    ? Math.max(0, Math.min(64, Math.floor(Number(countOverride) || 0)))
    : cfg.particleCount;
  if (cfg.id === 'clear' || count === 0) return [];

  const t = Number.isFinite(Number(clock)) && Number(clock) > 0 ? Number(clock) : 0;
  const left = bounds?.left ?? 160;
  const top = bounds?.top ?? 100;
  const spanX = Math.max(240, (bounds?.right ?? 2240) - left);
  const spanY = Math.max(180, (bounds?.bottom ?? 1380) - top);
  const particles = [];
  const autumnPalette = ['#ed8a45', '#ffc36b', '#c75b4b', '#b0bd67'];
  const snowPalette = ['#e8f0ed', '#d6d8bf', '#b7dee0'];

  for (let i = 0; i < count; i += 1) {
    const h = stableHash(`weather:${cfg.id}:${i}`);
    const u = (h & 0xffff) / 0xffff;
    const v = ((h >>> 16) & 0xffff) / 0xffff;
    const speedY = cfg.id === 'rain' ? 0.34 : cfg.id === 'autumn' ? 0.055 : 0.045;
    const speedX = cfg.id === 'rain' ? -0.09 : cfg.id === 'autumn' ? 0.035 : 0.015;
    const sway = t > 0 && cfg.id !== 'rain' ? Math.sin(t / 700 + i) * 14 : 0;
    const x = left + (((u * spanX + t * speedX + sway) % spanX) + spanX) % spanX;
    const y = top + (((v * spanY + t * speedY) % spanY) + spanY) % spanY;
    const color = cfg.id === 'rain'
      ? (i % 2 === 0 ? '#b7dee0' : '#70a8b6')
      : cfg.id === 'autumn'
        ? autumnPalette[i % autumnPalette.length]
        : snowPalette[i % snowPalette.length];
    particles.push({
      kind: cfg.id,
      x: Math.round(x),
      y: Math.round(y),
      size: (i % 3 === 0) ? 4 : 3,
      phase: t > 0 ? Math.floor((t + i * 190) / 360) % 4 : i % 4,
      color,
    });
  }
  return particles;
}

export function drawWeatherOverlay(ctx, width, height, { weatherMode = 'clear', clock = 0, stageBounds = null } = {}) {
  const cfg = weatherConfig(weatherMode);
  if (!ctx || cfg.id === 'clear') return { weatherMode: 'clear', particles: 0 };

  const bounds = stageBounds || { left: 160, top: 100, right: width - 160, bottom: height - 120 };
  const list = computeWeatherParticles(cfg.id, clock, bounds);
  ctx.save?.();

  if (cfg.id === 'rain') {
    ctx.fillStyle = cfg.tint;
    ctx.fillRect?.(0, 0, width, height);
    for (const p of list) {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2;
      ctx.beginPath?.();
      ctx.moveTo?.(p.x, p.y);
      ctx.lineTo?.(p.x - 4, p.y + 11);
      ctx.stroke?.();
      if (p.phase === 1) {
        ctx.fillStyle = 'rgba(183, 222, 224, 0.65)';
        ctx.fillRect?.(p.x - 5, p.y + 12, 4, 2);
      }
    }
  } else if (cfg.id === 'autumn') {
    for (const p of list) {
      ctx.fillStyle = '#231f2e';
      ctx.fillRect?.(p.x - 1, p.y - 1, p.size + 2, p.size + 1);
      ctx.fillStyle = p.color;
      ctx.fillRect?.(p.x, p.y, p.size, p.size - 1);
      if (p.phase % 2 === 0) {
        ctx.fillRect?.(p.x + 1, p.y - 1, Math.max(2, p.size - 1), 2);
      }
    }
  } else if (cfg.id === 'snow') {
    ctx.fillStyle = cfg.tint;
    ctx.fillRect?.(0, 0, width, height);
    for (const p of list) {
      ctx.fillStyle = p.color;
      ctx.fillRect?.(p.x, p.y, p.size, p.size);
      if (p.size >= 4 && p.phase % 2 === 0) {
        ctx.fillRect?.(p.x - 1, p.y + 1, p.size + 2, 2);
        ctx.fillRect?.(p.x + 1, p.y - 1, 2, p.size + 2);
      }
    }
  }

  ctx.restore?.();
  return { weatherMode: cfg.id, particles: list.length };
}

export function drawAtmosphereOverlay(ctx, width, height, { mode = 'day', weatherMode = 'clear', clock = 0, objects = [], stageBounds = null } = {}) {
  const cfg = atmosphereConfig(mode);
  const wCfg = weatherConfig(weatherMode);
  let lightCount = 0;
  let fireflyCount = 0;

  if (ctx && cfg.id !== 'day') {
    ctx.save?.();
    if (cfg.tint) {
      ctx.fillStyle = cfg.tint;
      ctx.fillRect(0, 0, width, height);
    }

    const lights = collectLightSources(objects);
    lightCount = lights.length;
    const pulse = clock > 0 ? 0.94 + 0.06 * Math.sin(clock / 520) : 1;
    // Pixel glows: stepped 2:1 iso diamonds on a 2 px grid (fillRect only), ~40% of the
    // light's nominal radius so the sprites underneath stay readable.
    for (const light of lights) {
      const r = light.radius * cfg.glowIntensity * pulse * 0.4;
      const [cr, cg, cb] = light.color;
      const cx = Math.round(light.x / 2) * 2;
      const cy = Math.round(light.y / 2) * 2;
      for (const [scale, alpha] of [[1.0, 0.08], [0.64, 0.12], [0.34, 0.16]]) {
        const rx = Math.max(8, Math.round(r * scale / 4) * 4);
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${Number((alpha * cfg.glowIntensity).toFixed(3))})`;
        for (let dy = 2 - rx / 2; dy < rx / 2 - 2; dy += 2) {
          const half = rx - 2 * (dy < 0 ? -dy : dy + 2); // 2:1 iso edge, symmetric about cy
          ctx.fillRect?.(cx - half, cy + dy, half * 2, 2);
        }
      }
      ctx.fillStyle = `rgba(${cr},${cg},${cb},${Number((0.22 * cfg.glowIntensity).toFixed(3))})`;
      ctx.fillRect?.(cx - 2, cy - 2, 4, 4);
    }

    const fireflies = computeFireflies(clock, stageBounds || { left: 180, top: 140, right: width - 180, bottom: height - 140 }, cfg.fireflyCount);
    fireflyCount = fireflies.length;
    for (const fly of fireflies) {
      ctx.fillStyle = fly.color === '#b7dee0'
        ? `rgba(183,222,224,${(fly.alpha * 0.35).toFixed(2)})`
        : `rgba(245,214,154,${(fly.alpha * 0.35).toFixed(2)})`;
      ctx.fillRect?.(fly.x - fly.radius * 2, fly.y - fly.radius * 2, fly.radius * 4, fly.radius * 4);
      ctx.fillStyle = fly.color;
      ctx.fillRect?.(fly.x - 1, fly.y - 1, fly.radius, fly.radius);
    }
    ctx.restore?.();
  }

  let weatherParticles = 0;
  if (ctx && wCfg.id !== 'clear') {
    const wRes = drawWeatherOverlay(ctx, width, height, { weatherMode: wCfg.id, clock, stageBounds });
    weatherParticles = wRes.particles;
  }

  return { mode: cfg.id, weatherMode: wCfg.id, lights: lightCount, fireflies: fireflyCount, weatherParticles };
}

export function hagridSpeechFor(state = {}, { matureCropCount = 0, readyMealCount = 0, hungryCreatureCount = 0, atmosphereMode = 'day', weatherMode = 'clear', eventMode = 'none', greeted = false } = {}) {
  if (greeted) {
    if (matureCropCount > 0) return `Chào con! Có ${matureCropCount} cây chín vàng đang chờ thu hoạch kìa!`;
    if (readyMealCount > 0) return `Mấy đứa nhỏ ăn xong rồi, ghé chuồng nhận thành quả nhé!`;
    if (eventMode === 'event_halloween') return `Lễ Hội Ma ở Rừng Cấm rực rỡ quá! Nhớ thu hoạch Bí ngô nhé!`;
    if (eventMode === 'event_yule') return `Dạ vũ Noel ấm áp bên lều gỗ! Vào uống tách trà nóng nhé!`;
    if (eventMode === 'event_herbology_fair') return `Hội chợ Thảo dược đang mở hội! Giáo sư Sprout khen vườn con lắm!`;
    if (eventMode === 'event_quidditch_cup') return `Sắp tới tiệc cuối năm học rồi! Mùa Cúp Quidditch náo nhiệt quá!`;
    if (weatherMode === 'rain') return `Mưa phùn Thảo dược mát lành thật, cây cối thích lắm đấy!`;
    if (weatherMode === 'snow') return `Tuyết Giáng sinh rơi rồi! Ghé lều uống tách trà nóng nhé!`;
    if (weatherMode === 'autumn') return `Gió thu Rừng Cấm thổi lá vàng bay khắp lối đi kìa!`;
    if (atmosphereMode === 'night') return `Đêm Rừng Cấm lung linh thật, nhớ thắp đèn bí ngô nhé!`;
    return `Chào mừng con ghé thăm! Cứ thong thả chăm vườn cùng bác nhé.`;
  }
  if (matureCropCount > 0) return `Có ${matureCropCount} cây đến mùa gặt rồi đấy!`;
  if (readyMealCount > 0) return `${readyMealCount} sinh vật đã ăn xong bữa!`;
  if (hungryCreatureCount > 0) return `Chuồng nuôi có bạn nhỏ đang chờ bữa ăn.`;
  if (eventMode === 'event_halloween') return `Đèn lồng Bí ngô đêm Hội Ma đang tỏa sáng khắp vườn!`;
  if (eventMode === 'event_yule') return `Ánh sao Dạ vũ Noel lấp lánh bên mái lều.`;
  if (eventMode === 'event_herbology_fair') return `Bào tử Hội chợ Thảo dược bay nhẹ quanh nhà kính.`;
  if (eventMode === 'event_quidditch_cup') return `Cờ bốn nhà bay phấp phới quanh lều gỗ.`;
  if (weatherMode === 'rain') return `Mưa xuân lất phất · đất đai tươi tốt.`;
  if (weatherMode === 'snow') return `Tuyết trắng phủ nhẹ bên hiên lều.`;
  if (weatherMode === 'autumn') return `Lá thu vàng rơi nhẹ qua hàng rào gỗ.`;
  if (atmosphereMode === 'night') return `Trăng lên rồi · đèn lồng ấm cả góc sân.`;
  if (atmosphereMode === 'dusk') return `Hoàng hôn buông nhẹ bên bìa Rừng Cấm.`;
  const lv = Number(state?.level) || 1;
  return lv >= 100 ? `Đại khu vườn cấp 100 thật rực rỡ!` : `Vườn cấp ${lv} đang lớn rất êm đềm.`;
}

// `scale` enlarges the bubble in world space so its text stays readable when the
// camera is zoomed out (the tutorial passes it); the bubble's bottom edge stays put.
export function drawHagridSpeechBubble(ctx, x, y, text, { emphasized = false, scale = 1, align = 'center' } = {}) {
  if (!ctx || !text) return;
  const copy = String(text).slice(0, 68);
  ctx.save?.();
  const k = Math.max(1, Number(scale) || 1);
  ctx.font = `bold ${Math.round((emphasized ? 12 : 11) * k)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const measured = typeof ctx.measureText === 'function' ? (ctx.measureText(copy)?.width || copy.length * 6.5) : copy.length * 6.5;
  const padX = Math.round(12 * k);
  const boxW = Math.max(Math.round(96 * k), Math.ceil(measured + padX * 2));
  const boxH = Math.round(24 * k);
  // 'right' grows the bubble from Hagrid's head towards the garden, away from the forest edge.
  const bx = Math.round(align === 'right' ? x - 24 * k : x - boxW / 2);
  const by = Math.round(y - 94 - boxH);

  ctx.fillStyle = emphasized ? 'rgba(19, 39, 32, 0.95)' : 'rgba(20, 38, 34, 0.88)';
  ctx.fillRect?.(bx, by, boxW, boxH);
  ctx.strokeStyle = emphasized ? '#f5d69a' : 'rgba(226, 196, 120, 0.75)';
  ctx.lineWidth = emphasized ? 2 : 1.5;
  ctx.strokeRect?.(bx, by, boxW, boxH);

  // Small pixel pointer tail towards Hagrid's hat/head
  ctx.fillStyle = '#f5d69a';
  ctx.fillRect?.(Math.round(x - 2 * k), by + boxH, Math.round(4 * k), Math.round(4 * k));

  ctx.fillStyle = emphasized ? '#e8f0ed' : '#d6d8bf';
  // Centre the text in the box, not on Hagrid: a 'right' bubble starts at his head.
  ctx.fillText?.(copy, Math.round(bx + boxW / 2), Math.round(by + boxH / 2));
  ctx.restore?.();
}

// Small opaque pixel bubble for a creature: its tail tip sits 2*k px above `top`
// (the sprite's top edge) at `x`. `avoid` is a box ({left,top,right,bottom}) or a
// sprite ({xy, asset}) the bubble must not cover, e.g. the owl perch; it slides sideways off it.
export function drawCreatureBubble(ctx, x, top, text, { scale = 1, avoid = null } = {}) {
  if (!ctx || !text) return null;
  const copy = String(text).slice(0, 16);
  const k = Math.max(1, Math.round(Number(scale) || 1));
  ctx.save?.();
  ctx.font = `bold ${8 * k}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const measured = ctx.measureText?.(copy)?.width || copy.length * 5 * k;
  const w = Math.ceil(measured / k / 2) * 2 * k + 6 * k;
  const h = 12 * k;
  const tipY = Math.round(top) - 2 * k;
  const by = tipY - 2 * k - h;
  const cx = Math.round(x);
  let bx = cx - Math.round(w / 2 / k) * k;
  const b = avoid?.asset?.bounds;
  if (b && avoid.xy) {
    const left = avoid.xy[0] - (avoid.asset.pivotX || 0) + b.x;
    const boxTop = avoid.xy[1] - (avoid.asset.pivotY || 0) + b.y;
    avoid = { left, top: boxTop, right: left + b.w, bottom: boxTop + b.h };
  } else if (avoid?.asset) avoid = null;
  if (avoid && bx < avoid.right && bx + w > avoid.left && by < avoid.bottom && tipY > avoid.top) {
    bx = cx >= (avoid.left + avoid.right) / 2 ? Math.ceil(avoid.right) + 2 * k : Math.floor(avoid.left) - 2 * k - w;
  }
  // Tail stays inside the box, as close to the creature as the box allows.
  const tx = Math.min(bx + w - 4 * k, Math.max(bx + 4 * k, cx));
  const ink = '#231F2E';
  const paper = '#F5D69A';
  ctx.fillStyle = ink; // stepped-corner outline, k px thick
  ctx.fillRect?.(bx + k, by, w - 2 * k, h);
  ctx.fillRect?.(bx, by + k, w, h - 2 * k);
  ctx.fillRect?.(tx - 2 * k, by + h, 4 * k, k);
  ctx.fillRect?.(tx - k, by + h + k, 2 * k, k);
  ctx.fillStyle = paper;
  ctx.fillRect?.(bx + 2 * k, by + k, w - 4 * k, h - 2 * k);
  ctx.fillRect?.(bx + k, by + 2 * k, w - 2 * k, h - 4 * k);
  ctx.fillRect?.(tx - k, by + h - k, 2 * k, 2 * k);
  ctx.fillStyle = ink;
  ctx.fillText?.(copy, bx + w / 2, by + Math.round(h / 2));
  ctx.restore?.();
  return { left: bx, top: by, right: bx + w, bottom: tipY };
}
