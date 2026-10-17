/**
 * Procedural Web Audio synthesizer for Hagrid's Garden (V20).
 * Zero external audio files required; respects reduced-motion and user mute state.
 */

export const SOUND_PATTERNS = Object.freeze({
  plant: [
    { freq: 330, duration: 0.07, type: 'triangle', gain: 0.08 },
    { freq: 440, duration: 0.09, type: 'triangle', gain: 0.09, delay: 0.05 },
  ],
  harvest: [
    { freq: 523.25, duration: 0.08, type: 'sine', gain: 0.09 },
    { freq: 659.25, duration: 0.08, type: 'sine', gain: 0.09, delay: 0.06 },
    { freq: 783.99, duration: 0.14, type: 'triangle', gain: 0.1, delay: 0.12 },
  ],
  care: [
    { freq: 392.0, duration: 0.1, type: 'sine', gain: 0.07 },
    { freq: 587.33, duration: 0.14, type: 'sine', gain: 0.08, delay: 0.07 },
  ],
  owl: [
    { freq: 466.16, duration: 0.14, type: 'sine', gain: 0.08 },
    { freq: 392.0, duration: 0.2, type: 'sine', gain: 0.07, delay: 0.16 },
  ],
  rotate: [
    { freq: 293.66, duration: 0.05, type: 'triangle', gain: 0.07 },
    { freq: 369.99, duration: 0.06, type: 'triangle', gain: 0.07, delay: 0.04 },
  ],
  buy: [
    { freq: 880, duration: 0.06, type: 'sine', gain: 0.08 },
    { freq: 1174.66, duration: 0.12, type: 'sine', gain: 0.09, delay: 0.05 },
  ],
  levelUp: [
    { freq: 523.25, duration: 0.09, type: 'triangle', gain: 0.1 },
    { freq: 659.25, duration: 0.09, type: 'triangle', gain: 0.1, delay: 0.08 },
    { freq: 783.99, duration: 0.09, type: 'triangle', gain: 0.1, delay: 0.16 },
    { freq: 1046.5, duration: 0.22, type: 'sine', gain: 0.12, delay: 0.24 },
  ],
});

// Repeating the same farm action within the window climbs a whole tone per step,
// up to a fifth-plus; any pause or a different action starts over.
export const COMBO_WINDOW_MS = 2500;
export const COMBO_MAX_STEP = 4;
export function comboStep(previous, kind, now) {
  const step = previous && previous.kind === kind && now - previous.at <= COMBO_WINDOW_MS
    ? Math.min(COMBO_MAX_STEP, previous.step + 1)
    : 0;
  return {kind, at: now, step, pitch: 2 ** ((step * 2) / 12)};
}

export function soundPatternFor(kind) {
  return SOUND_PATTERNS[kind] || SOUND_PATTERNS.rotate;
}

export function createGardenAudio({
  initialEnabled = true,
  storageKey = 'hpvn-garden-v20-audio',
  storage = globalThis.localStorage,
  AudioContextClass = null,
} = {}) {
  let enabled = Boolean(initialEnabled);
  try {
    const saved = storage?.getItem?.(storageKey);
    if (saved === '0' || saved === 'false') enabled = false;
    else if (saved === '1' || saved === 'true') enabled = true;
  } catch {}

  let audioCtx = null;

  function persist() {
    try {
      storage?.setItem?.(storageKey, enabled ? '1' : '0');
    } catch {}
  }

  function ensureContext() {
    if (audioCtx) return audioCtx;
    const Ctor = AudioContextClass || globalThis.AudioContext || globalThis.webkitAudioContext;
    if (typeof Ctor !== 'function') return null;
    try {
      audioCtx = new Ctor();
      return audioCtx;
    } catch {
      return null;
    }
  }

  function play(kind = 'rotate', {pitch = 1} = {}) {
    if (!enabled) return false;
    const notes = soundPatternFor(kind);
    const ctx = ensureContext();
    if (!ctx) return false;
    try {
      if (ctx.state === 'suspended' && typeof ctx.resume === 'function') {
        ctx.resume().catch(() => {});
      }
      const startBase = ctx.currentTime || 0;
      for (const note of notes) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = note.type || 'sine';
        osc.frequency.setValueAtTime(note.freq * pitch, startBase + (note.delay || 0));
        const peak = note.gain || 0.08;
        const startAt = startBase + (note.delay || 0);
        const endAt = startAt + (note.duration || 0.08);
        gain.gain.setValueAtTime(0.0001, startAt);
        gain.gain.exponentialRampToValueAtTime(peak, startAt + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, endAt);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startAt);
        osc.stop(endAt + 0.01);
      }
      return true;
    } catch {
      return false;
    }
  }

  function toggle(nextValue) {
    enabled = typeof nextValue === 'boolean' ? nextValue : !enabled;
    persist();
    if (enabled) play('rotate');
    return enabled;
  }

  return {
    get enabled() {
      return enabled;
    },
    play,
    toggle,
  };
}
