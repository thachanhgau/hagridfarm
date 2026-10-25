import {getGardenStorage} from './garden-storage.mjs?v=24.9.77';
import {levelLabel} from './progression-engine.mjs?v=24.9.77';
import { normalizeDecorFacing } from './decor-runtime.mjs?v=24.9.77';
import {
  normalizeAtmosphereMode,
  atmosphereConfig,
  normalizeWeatherMode,
  weatherConfig,
} from './garden-atmosphere.mjs?v=24.9.77';
import {
  normalizeEventMode,
  eventConfig,
} from './garden-events.mjs?v=24.9.77';

export const VISUAL_PREFS_STORAGE_KEY = 'hpvn-garden-v20-visual-prefs';
export const LEGACY_DECOR_STORAGE_KEY = 'hpvn-garden-v18-decor-layout';

function normalizeFacingMap(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const result = {};
  for (const [key, val] of Object.entries(raw)) {
    if (typeof key === 'string' && key.length > 0) {
      result[key] = normalizeDecorFacing(val);
    }
  }
  return result;
}

export function loadVisualPrefs(storage = getGardenStorage()) {
  const defaults = {
    storeRotations: {},
    earnedRotations: {},
    creatureFacings: {},
    atmosphereMode: 'day',
    weatherMode: 'clear',
    eventMode: 'event_halloween',
    soundEnabled: true,
    motionEnabled: true,
    propsVisible: true,
    grid: false,
  };
  if (!storage || typeof storage.getItem !== 'function') return defaults;
  try {
    const legacyRaw = storage.getItem(LEGACY_DECOR_STORAGE_KEY);
    if (legacyRaw) {
      const legacyParsed = JSON.parse(legacyRaw);
      if (legacyParsed && typeof legacyParsed === 'object') {
        Object.assign(defaults.storeRotations, normalizeFacingMap(legacyParsed.rotations || legacyParsed));
      }
    }
  } catch {}
  try {
    const raw = storage.getItem(VISUAL_PREFS_STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return defaults;
    return {
      storeRotations: { ...defaults.storeRotations, ...normalizeFacingMap(parsed.storeRotations) },
      earnedRotations: normalizeFacingMap(parsed.earnedRotations),
      creatureFacings: normalizeFacingMap(parsed.creatureFacings),
      atmosphereMode: normalizeAtmosphereMode(parsed.atmosphereMode),
      weatherMode: normalizeWeatherMode(parsed.weatherMode),
      eventMode: normalizeEventMode(parsed.eventMode),
      soundEnabled: parsed.soundEnabled !== false,
      motionEnabled: parsed.motionEnabled !== false,
      propsVisible: parsed.propsVisible !== false,
      grid: parsed.grid === true,
    };
  } catch {
    return defaults;
  }
}

export function saveVisualPrefs(prefs = {}, storage = getGardenStorage()) {
  const normalized = {
    storeRotations: normalizeFacingMap(prefs.storeRotations),
    earnedRotations: normalizeFacingMap(prefs.earnedRotations),
    creatureFacings: normalizeFacingMap(prefs.creatureFacings),
    atmosphereMode: normalizeAtmosphereMode(prefs.atmosphereMode),
    weatherMode: normalizeWeatherMode(prefs.weatherMode),
    eventMode: normalizeEventMode(prefs.eventMode),
    soundEnabled: prefs.soundEnabled !== false,
    motionEnabled: prefs.motionEnabled !== false,
    propsVisible: prefs.propsVisible !== false,
    grid: prefs.grid === true,
  };
  if (!storage || typeof storage.setItem !== 'function') return normalized;
  try {
    storage.setItem(VISUAL_PREFS_STORAGE_KEY, JSON.stringify(normalized));
    storage.setItem(LEGACY_DECOR_STORAGE_KEY, JSON.stringify({ rotations: normalized.storeRotations }));
  } catch {}
  return normalized;
}

export function formatFlooShareMessage({
  state = {},
  stage = null,
  stageName = '',
  decorations = {},
  atmosphere = null,
  atmosphereMode = 'day',
  weather = null,
  weatherMode = 'clear',
  event = null,
  eventMode = 'none',
  totalAffinity = 0,
  keeperTitle = '',
} = {}) {
  const level = Number(state?.level) || 1;
  const plots = Array.isArray(state?.plots) ? state.plots.length : 3;
  const creatures = Array.isArray(state?.creatures) ? state.creatures.length : 0;
  const keepsakeTotal = state?.keepsakes && typeof state.keepsakes === 'object'
    ? Object.values(state.keepsakes).reduce((a, b) => a + (Number(b) || 0), 0)
    : 0;
  const placedStoreCount = Array.isArray(decorations?.placements)
    ? decorations.placements.filter(Boolean).length
    : 0;
  const earnedCount = Array.isArray(state?.decorations) ? state.decorations.length : 0;
  const resolvedStageName = stage?.name || stageName || 'Sân nhỏ bên lều';
  const atmo = atmosphere?.shortLabel ? atmosphere : atmosphereConfig(atmosphere?.id || atmosphereMode);
  const wCfg = weather?.shortLabel ? weather : weatherConfig(weather?.id || weatherMode);
  const eCfg = event?.shortLabel ? event : (eventMode && eventMode !== 'none' ? eventConfig(eventMode) : null);
  const weatherPart = wCfg.id && wCfg.id !== 'clear' ? ` · ${wCfg.icon} ${wCfg.shortLabel}` : '';
  const eventPart = eCfg && eCfg.id !== 'none' ? ` · ${eCfg.shortLabel}` : '';
  const titlePart = keeperTitle ? ` · Danh hiệu [${keeperTitle}]` : '';
  const affinityPart = Number(totalAffinity) > 0 ? ` · ♥ Gắn kết ${totalAffinity}` : '';
  return `🌿 [Khu Vườn Hagrid · ${levelLabel(level)}${titlePart}] ${resolvedStageName} (${atmo.shortLabel || atmo.label}${weatherPart}${eventPart}) — ${plots}/12 thửa đất, ${creatures}/12 sinh vật huyền bí, ${placedStoreCount + earnedCount} vật phẩm trang trí & ${keepsakeTotal} kỷ vật${affinityPart}!`;
}

export function createHpvnBridge({
  onAtmosphereChange,
  onSetAtmosphere,
  onWeatherChange,
  onSetWeather,
  onEventChange,
  onSetEvent,
  onStartTour,
  onStopTour,
  onMuteChange,
  getSnapshot,
  getState,
  getStage,
  getAtmosphere,
  getWeather,
  getEvent,
  getKeeperTitle,
  notify,
  win = globalThis,
  nav = globalThis.navigator,
} = {}) {
  const history = [];
  const handleAtmo = onAtmosphereChange || onSetAtmosphere;
  const handleWeather = onWeatherChange || onSetWeather;
  const handleEvent = onEventChange || onSetEvent;

  function postToHost(type, payload = {}) {
    const envelope = {
      source: 'hpvn-hagrid-garden',
      version: '23.0',
      type,
      payload,
      sentAt: Date.now(),
    };
    history.push(envelope);
    if (history.length > 24) history.shift();
    try {
      if (win?.parent && win.parent !== win && typeof win.parent.postMessage === 'function') {
        win.parent.postMessage(envelope, '*');
      }
    } catch {}
    return envelope;
  }

  function handleMessage(event) {
    const data = event?.data;
    if (!data || typeof data !== 'object') return;
    if (data.type === 'hpvn:host:set-atmosphere' && typeof handleAtmo === 'function') {
      handleAtmo(normalizeAtmosphereMode(data.payload?.mode ?? data.mode));
    } else if (data.type === 'hpvn:host:set-weather' && typeof handleWeather === 'function') {
      handleWeather(normalizeWeatherMode(data.payload?.mode ?? data.mode));
    } else if (data.type === 'hpvn:host:set-event' && typeof handleEvent === 'function') {
      handleEvent(normalizeEventMode(data.payload?.mode ?? data.mode));
    } else if (data.type === 'hpvn:host:tour-garden') {
      const tourId = data.payload?.tourId ?? data.tourId ?? null;
      if (tourId && typeof onStartTour === 'function') onStartTour(String(tourId));
      else if (!tourId && typeof onStopTour === 'function') onStopTour();
    } else if (data.type === 'hpvn:host:mute' && typeof onMuteChange === 'function') {
      onMuteChange(Boolean(data.payload?.muted ?? data.muted));
    } else if (data.type === 'hpvn:host:request-snapshot') {
      const snap = typeof getSnapshot === 'function'
        ? getSnapshot()
        : {
            state: getState?.(),
            stage: getStage?.(),
            atmosphere: getAtmosphere?.(),
            weather: getWeather?.(),
            event: getEvent?.(),
            keeperTitle: getKeeperTitle?.(),
          };
      postToHost('hpvn:garden:snapshot', snap);
    }
  }

  if (typeof win?.addEventListener === 'function') {
    win.addEventListener('message', handleMessage);
  }

  async function shareToFloo(context = {}) {
    const resolvedState = context.state || getState?.() || {};
    const resolvedStage = context.stage || getStage?.() || null;
    const resolvedAtmo = context.atmosphere || getAtmosphere?.() || null;
    const resolvedWeather = context.weather || getWeather?.() || null;
    const resolvedEvent = context.event || getEvent?.() || null;
    const resolvedTitle = context.keeperTitle || getKeeperTitle?.() || '';
    const text = formatFlooShareMessage({
      ...context,
      state: resolvedState,
      stage: resolvedStage,
      atmosphere: resolvedAtmo,
      weather: resolvedWeather,
      event: resolvedEvent,
      keeperTitle: resolvedTitle,
    });
    const envelope = postToHost('hpvn:garden:share-floo', {
      text,
      level: Number(resolvedState?.level) || 1,
      stageName: resolvedStage?.name || context.stageName || 'Sân nhỏ bên lều',
      atmosphereMode: normalizeAtmosphereMode(resolvedAtmo?.id || context.atmosphereMode),
      weatherMode: normalizeWeatherMode(resolvedWeather?.id || context.weatherMode),
      eventMode: normalizeEventMode(resolvedEvent?.id || context.eventMode),
      keeperTitle: resolvedTitle,
    });
    // In HPVN the shell puts the line into Floo's composer (the member still presses send).
    if (typeof context.sendToFloo === 'function' && await context.sendToFloo(text) === true) {
      if (typeof notify === 'function') notify('✨ Lời khoe vườn đã nằm sẵn trong Mạng Floo · xem lại rồi bấm gửi nhé.');
      return { ok: true, text, copied: false, floo: true, envelope };
    }
    let copied = false;
    try {
      if (nav?.clipboard?.writeText) {
        await nav.clipboard.writeText(text);
        copied = true;
      }
    } catch {}
    if (typeof notify === 'function') {
      notify(copied ? `✨ Đã chép thông điệp khoe vườn lên Mạng Floo: "${text}"` : `✨ Đã gửi thông điệp khoe vườn: "${text}"`);
    }
    return { ok: true, text, copied, envelope };
  }

  return {
    notifyReady: (info = {}) => postToHost('hpvn:garden:ready', info),
    syncState: (summary = {}) => postToHost('hpvn:garden:state', summary),
    shareToFloo,
    shareGardenToFloo: shareToFloo,
    history: () => [...history],
    destroy: () => {
      if (typeof win?.removeEventListener === 'function') {
        win.removeEventListener('message', handleMessage);
      }
    },
  };
}

/**
 * V22.0 / V23.0 Direction 4: Host-side adapter for `/phongsinhoatchung` (or embed simulator)
 * to control and receive events from the Hagrid Garden iframe without coupling internals.
 */
export function createHpvnHostBridge({
  iframe = null,
  targetWindow = null,
  onReady,
  onStateSync,
  onShareFloo,
  onSnapshot,
  win = globalThis,
} = {}) {
  const received = [];

  function resolveTarget() {
    if (targetWindow && typeof targetWindow.postMessage === 'function') return targetWindow;
    if (iframe?.contentWindow && typeof iframe.contentWindow.postMessage === 'function') {
      return iframe.contentWindow;
    }
    return null;
  }

  function sendToGarden(type, payload = {}) {
    const command = {
      source: 'hpvn-host-shell',
      version: '23.0',
      type,
      payload,
      sentAt: Date.now(),
    };
    const target = resolveTarget();
    try {
      if (target) target.postMessage(command, '*');
    } catch {}
    return command;
  }

  function handleGardenMessage(event) {
    const data = event?.data;
    if (!data || typeof data !== 'object' || data.source !== 'hpvn-hagrid-garden') return;
    received.push(data);
    if (received.length > 32) received.shift();
    if (data.type === 'hpvn:garden:ready') onReady?.(data.payload, data);
    else if (data.type === 'hpvn:garden:state') onStateSync?.(data.payload, data);
    else if (data.type === 'hpvn:garden:share-floo') onShareFloo?.(data.payload, data);
    else if (data.type === 'hpvn:garden:snapshot') onSnapshot?.(data.payload, data);
  }

  if (typeof win?.addEventListener === 'function') {
    win.addEventListener('message', handleGardenMessage);
  }

  return {
    setAtmosphere: (mode) => sendToGarden('hpvn:host:set-atmosphere', { mode: normalizeAtmosphereMode(mode) }),
    setWeather: (mode) => sendToGarden('hpvn:host:set-weather', { mode: normalizeWeatherMode(mode) }),
    setEvent: (mode) => sendToGarden('hpvn:host:set-event', { mode: normalizeEventMode(mode) }),
    tourGarden: (tourId) => sendToGarden('hpvn:host:tour-garden', { tourId: tourId || null }),
    setMuted: (muted) => sendToGarden('hpvn:host:mute', { muted: Boolean(muted) }),
    requestSnapshot: () => sendToGarden('hpvn:host:request-snapshot', {}),
    received: () => [...received],
    destroy: () => {
      if (typeof win?.removeEventListener === 'function') {
        win.removeEventListener('message', handleGardenMessage);
      }
    },
  };
}

/**
 * Verify source code is safe for iOS Safari 16.0+ (no regex lookbehind, no v flag,
 * no unguarded ES2024+ intrinsics that crash Safari 16.0).
 */
export function auditIos16SourceCompatibility(sourceText = '') {
  const issues = [];
  const text = String(sourceText);
  const lbPos = '(' + '?<=';
  const lbNeg = '(' + '?<!';
  if (text.includes(lbPos) || text.includes(lbNeg)) {
    issues.push('Contains regex lookbehind unsupported on iOS Safari 16.0-16.3');
  }
  if (new RegExp('\\b' + 'Object\\.groupBy\\b').test(text) || new RegExp('\\b' + 'Map\\.groupBy\\b').test(text)) {
    issues.push('Contains unguarded groupBy (Safari 17.4+)');
  }
  if (new RegExp('\\b' + 'Promise\\.withResolvers\\b').test(text)) {
    issues.push('Contains unguarded withResolvers (Safari 17.4+)');
  }
  if (new RegExp('\\b' + 'Array\\.fromAsync\\b').test(text)) {
    issues.push('Contains unguarded fromAsync (Safari 16.4+)');
  }
  return { compatible: issues.length === 0, issues };
}
