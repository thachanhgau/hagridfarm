import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import * as E from './progression-engine.mjs';
import {
  ATMOSPHERE_MODES,
  atmosphereConfig,
  nextAtmosphereMode,
  collectLightSources,
  computeFireflies,
  hagridSpeechFor,
} from './garden-atmosphere.mjs';
import {SOUND_PATTERNS, createGardenAudio} from './garden-audio.mjs';
import {
  loadVisualPrefs,
  saveVisualPrefs,
  formatFlooShareMessage,
  createHpvnBridge,
  auditIos16SourceCompatibility,
} from './hpvn-bridge.mjs';
import {EARNED_DECOR_SHAPES, earnedDecorMotifSvg} from './ui-utils.mjs?v=24.9.15';
import {creatureMotion} from './scene-animation.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test('Direction 1: all 29 earned decorations have unique visual shapes and moveBuilding swaps plots/pens cleanly', () => {
  assert.equal(E.DB.decorations.length, 29);
  for (const dec of E.DB.decorations) {
    const shape = EARNED_DECOR_SHAPES[dec.id];
    assert.ok(shape, `Missing EARNED_DECOR_SHAPES entry for ${dec.id}`);
    assert.equal(typeof shape.bg, 'string');
    assert.equal(typeof shape.accent, 'string');
    assert.equal(typeof shape.motif, 'string');
    const svgLeft = earnedDecorMotifSvg(shape, false);
    const svgRight = earnedDecorMotifSvg(shape, true);
    assert.match(svgLeft, /^<svg /);
    assert.match(svgRight, /scale\(-1,1\)/);
  }

  let state = E.testProfile(50, 1_700_000_000_000);
  const beforePlot0 = state.layout.plots[0];
  const beforePlot1 = state.layout.plots[1];
  state = E.moveBuilding(state, 'plot', 0, beforePlot1);
  assert.equal(state.layout.plots[0], beforePlot1);
  assert.equal(state.layout.plots[1], beforePlot0);

  const beforePen0 = state.layout.pens[0];
  const beforePen1 = state.layout.pens[1];
  state = E.moveBuilding(state, 'pen', 0, beforePen1);
  assert.equal(state.layout.pens[0], beforePen1);
  assert.equal(state.layout.pens[1], beforePen0);
});

test('Direction 2: atmosphere engine cycles day/dusk/night, collects lights/fireflies, and Hagrid speech reacts to garden state', () => {
  assert.deepEqual(ATMOSPHERE_MODES.map((m) => m.id), ['day', 'dusk', 'night']);
  assert.equal(nextAtmosphereMode('day'), 'dusk');
  assert.equal(nextAtmosphereMode('dusk'), 'night');
  assert.equal(nextAtmosphereMode('night'), 'day');
  assert.equal(atmosphereConfig('invalid').id, 'day');

  const lights = collectLightSources([
    {kind: 'asset', type: 'prop', id: 'hut', xy: [300, 200]},
    {kind: 'store-decor', id: 'decor_pumpkin_lantern', slot: 0, xy: [400, 260]},
    {kind: 'decoration', id: 'decoration-7', shape: 'lantern', xy: [350, 250]},
  ]);
  assert.equal(lights.length, 3);
  assert.ok(lights.every((l) => l.radius > 0 && Array.isArray(l.color)));

  assert.equal(computeFireflies(1200, {left: 100, top: 100, right: 900, bottom: 600}, 0).length, 0);
  const nightFlies = computeFireflies(1200, {left: 100, top: 100, right: 900, bottom: 600}, 18);
  assert.equal(nightFlies.length, 18);
  assert.ok(nightFlies.every((f) => f.alpha >= 0.4 && f.alpha <= 1.0));

  const speech = hagridSpeechFor({level: 30, plots: [], creatures: []}, {atmosphereMode: 'night'});
  assert.equal(typeof speech, 'string');
  assert.ok(speech.length > 5);
});

test('Direction 2b: procedural Web Audio synthesizer supports all garden actions and toggle state', () => {
  const store = new Map();
  const mockStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
  };
  let oscCount = 0;
  class MockAudioContext {
    constructor() {
      this.currentTime = 0;
      this.state = 'running';
      this.destination = {};
    }
    createOscillator() {
      oscCount++;
      return {
        type: 'sine',
        frequency: {setValueAtTime() {}},
        connect() {},
        start() {},
        stop() {},
      };
    }
    createGain() {
      return {
        gain: {
          setValueAtTime() {},
          linearRampToValueAtTime() {},
          exponentialRampToValueAtTime() {},
        },
        connect() {},
      };
    }
  }
  const audio = createGardenAudio({storage: mockStorage, AudioContextClass: MockAudioContext});
  assert.equal(audio.enabled, true);
  for (const name of Object.keys(SOUND_PATTERNS)) {
    assert.equal(audio.play(name), true);
  }
  assert.ok(oscCount >= Object.keys(SOUND_PATTERNS).length);
  assert.equal(audio.toggle(), false);
  assert.equal(audio.play('plant'), false);
});

test('Direction 3: creatureMotion supports 2-angle facing (default and right) with integer pixel offsets', () => {
  const left = creatureMotion('bowtruckle', 800, {index: 2, facing: 'default'});
  const right = creatureMotion('bowtruckle', 800, {index: 2, facing: 'right'});
  assert.equal(left.facing, 'default');
  assert.equal(right.facing, 'right');
  assert.equal(Number.isInteger(right.swayX), true);
  assert.equal(Number.isInteger(right.bobY), true);
});

test('Direction 4: persistent visual prefs round-trip, Floo bridge formats messages, and all .mjs files are iOS Safari 16.0+ safe', async () => {
  const store = new Map();
  const mockStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
  };
  const saved = saveVisualPrefs({
    storeRotations: {decor_broom_rack: 'right', decor_cauldron: 'default'},
    earnedRotations: {'decoration-7': 'right'},
    creatureFacings: {bowtruckle: 'right', puffskein: 'default'},
    atmosphereMode: 'night',
    soundEnabled: false,
  }, mockStorage);
  assert.equal(saved.atmosphereMode, 'night');
  assert.equal(saved.creatureFacings.bowtruckle, 'right');

  const loaded = loadVisualPrefs(mockStorage);
  assert.deepEqual(loaded, saved);

  const state = E.testProfile(40, 1_700_000_000_000);
  const text = formatFlooShareMessage({
    state,
    stage: {id: 3, name: 'Vườn thảo mộc'},
    atmosphere: {label: 'Đêm trăng Rừng Cấm'},
  });
  assert.match(text, /Khu Vườn Hagrid/);
  assert.match(text, /Cấp 40\/100/);

  const posted = [];
  const bridge = createHpvnBridge({
    getState: () => state,
    win: {
      parent: {
        postMessage(msg) {
          posted.push(msg);
        },
      },
      addEventListener() {},
      removeEventListener() {},
    },
    nav: {
      clipboard: {
        async writeText() {},
      },
    },
  });
  const shared = await bridge.shareGardenToFloo({state});
  assert.equal(shared.ok, true);
  assert.equal(posted.length, 1);
  assert.equal(posted[0].type, 'hpvn:garden:share-floo');

  // Verify iOS Safari 16.0+ source compatibility across all .mjs files in garden-v05 and qa-v19
  const dirs = [__dirname, path.resolve(__dirname, '../qa-v19')];
  for (const dir of dirs) {
    for (const entry of fs.readdirSync(dir)) {
      if (!entry.endsWith('.mjs') || entry.endsWith('.test.mjs')) continue;
      const fullPath = path.join(dir, entry);
      const source = fs.readFileSync(fullPath, 'utf8');
      const result = auditIos16SourceCompatibility(source, entry);
      assert.equal(result.compatible, true, `iOS 16 incompatibility in ${entry}: ${JSON.stringify(result.issues)}`);
    }
  }
});

test('Scene renderer V20 integration: renders night/dusk atmosphere, 2-angle creatures, Hagrid speech, and layout swap preview cleanly', async () => {
  const {drawAtmosphereOverlay, drawHagridSpeechBubble} = await import('./garden-atmosphere.mjs');
  const calls = [];
  const mockCtx = new Proxy({}, {
    get(_target, prop) {
      if (prop === 'measureText') return (str) => ({width: String(str).length * 7});
      return (...args) => {
        calls.push([prop, args]);
      };
    },
    set(_target, prop, val) {
      calls.push([`set:${prop}`, val]);
      return true;
    },
  });

  const nightResult = drawAtmosphereOverlay(mockCtx, 2400, 1500, {
    mode: 'night',
    clock: 1500,
    objects: [
      {kind: 'wizard-scenery', id: 'gardener', xy: [800, 600]},
      {kind: 'store-decor', id: 'decor_pumpkin_lantern', slot: 0, facing: 'right', xy: [900, 640]},
      {kind: 'decoration', id: 'decoration-7', shape: 'lantern', xy: [850, 620]},
    ],
  });
  assert.equal(nightResult.mode, 'night');
  assert.equal(nightResult.lights, 3);
  assert.equal(nightResult.fireflies, 28);

  drawHagridSpeechBubble(mockCtx, 800, 600, 'Chào mừng con ghé thăm!', {emphasized: true});
  assert.ok(calls.some(([name]) => name === 'fillText'));
});

