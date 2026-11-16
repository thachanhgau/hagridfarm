import test from 'node:test';
import assert from 'node:assert/strict';

import * as E from './progression-engine.mjs';
import {
  buildChoice,
  buildCommand,
  craftChoice,
  craftCommand,
  feedPlan,
  fillPlotPlan,
  inputNeeds,
  restockPlan,
  setupWorkTrays,
} from './work-trays.mjs';

const NOW = 1_800_000_000_000;

const snapshot = value => JSON.stringify(value);

class FakeText {
  constructor(text) {
    this.textContent = String(text);
    this.parentNode = null;
  }
}

class FakeElement {
  constructor(tagName) {
    this.tagName = tagName;
    this.children = [];
    this.parentNode = null;
    this.attributes = {};
    this.listeners = {};
    this.style = {};
    this.disabled = false;
    this.hidden = false;
    this.value = '';
    this._classes = new Set();
    this.classList = {
      add: (...names) => names.forEach(name => this._classes.add(name)),
      toggle: (name, enabled) => {
        if (enabled) this._classes.add(name);
        else this._classes.delete(name);
      },
    };
  }

  set className(value) {
    this._classes = new Set(String(value).split(/\s+/).filter(Boolean));
  }

  get className() {
    return [...this._classes].join(' ');
  }

  set textContent(value) {
    this._text = String(value ?? '');
    this.children = [];
  }

  get textContent() {
    return this._text || this.children.map(child => child.textContent).join('');
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
    if (name === 'id') fakeDocument.nodes.set(String(value), this);
    if (name === 'value') this.value = String(value);
  }

  append(...nodes) {
    for (const node of nodes) {
      if (node.parentNode) node.parentNode.children = node.parentNode.children.filter(child => child !== node);
      node.parentNode = this;
      this.children.push(node);
    }
    this._text = '';
  }

  replaceChildren(...nodes) {
    for (const child of this.children) child.parentNode = null;
    this.children = [];
    this.append(...nodes);
  }

  addEventListener(type, listener) {
    this.listeners[type] = listener;
  }

  click() {
    if (!this.disabled) this.listeners.click?.({ currentTarget: this, target: this });
  }

  remove() {
    if (this.parentNode) this.parentNode.children = this.parentNode.children.filter(child => child !== this);
    this.parentNode = null;
  }
}

const fakeDocument = {
  nodes: new Map(),
  createElement: tagName => new FakeElement(tagName),
  createTextNode: text => new FakeText(text),
  getElementById: id => fakeDocument.nodes.get(id) ?? null,
};

test('craft choices expose exact input needs and do not mutate state', () => {
  const state = E.testProfile(17, NOW);
  const recipe = E.DB.recipes.find(item => item.id === 'insects');
  const before = snapshot(state);

  assert.deepEqual(inputNeeds(recipe, 1), recipe.inputs);
  const timed = craftChoice(recipe, state, 1);
  assert.equal(timed.timed, true);
  assert.equal(timed.batches, 1);
  assert.equal(timed.canCraft, true);

  const wrongBatch = craftChoice(recipe, state, 3);
  assert.equal(wrongBatch.timedBatchValid, false);
  assert.equal(wrongBatch.canCraft, false);

  assert.equal(snapshot(state), before);
});

test('craft choices mirror lock, shortage, and station-busy guards', () => {
  const recipe = E.DB.recipes.find(item => item.id === 'insects');
  let state = E.testProfile(17, NOW);

  state.inventory[Object.keys(recipe.inputs)[0]] = 0;
  const missing = craftChoice(recipe, state, 1);
  assert.equal(missing.missing, true);
  assert.ok(missing.shortages.length > 0);
  assert.equal(missing.canCraft, false);

  const busyState = E.testProfile(17, NOW);
  busyState.jobs.push({ station: recipe.station, readyAt: NOW + 1000 });
  const busy = craftChoice(recipe, busyState, 1);
  assert.equal(busy.busy, true);
  assert.equal(busy.canCraft, false);

  const locked = craftChoice(recipe, E.testProfile(1, NOW), 1);
  assert.equal(locked.unlocked, false);
  assert.equal(locked.canCraft, false);
});

test('build choices mirror built, queued, ready, predecessor, and material guards', () => {
  const expansion = E.DB.expansions.find(item => item.id === 'plot_5');
  const readyAt = NOW - 1;
  const base = {
    level: 30,
    built: ['plot_4'],
    construction: [],
    inventory: { ...expansion.cropCost },
  };
  const before = snapshot(base);

  const available = buildChoice(expansion, base, NOW, E.DB.expansions);
  assert.equal(available.unlocked, true);
  assert.equal(available.previousBuilt, true);
  assert.equal(available.canBuild, true);

  const built = buildChoice(expansion, { ...base, built: ['plot_4', 'plot_5'] }, NOW, E.DB.expansions);
  assert.equal(built.built, true);
  assert.equal(built.canBuild, false);

  const queued = buildChoice(expansion, {
    ...base,
    construction: [{ id: 'plot_5', kind: 'plot', readyAt: NOW + 1000 }],
  }, NOW, E.DB.expansions);
  assert.equal(queued.queued, true);
  assert.equal(queued.ready, false);
  assert.equal(queued.canBuild, false);

  const ready = buildChoice(expansion, {
    ...base,
    construction: [{ id: 'plot_5', kind: 'plot', readyAt }],
  }, NOW, E.DB.expansions);
  assert.equal(ready.ready, true);
  assert.equal(ready.canBuild, false);

  const noPrevious = buildChoice(expansion, { ...base, built: [] }, NOW, E.DB.expansions);
  assert.equal(noPrevious.previousBuilt, false);
  assert.equal(noPrevious.canBuild, false);

  const noMaterials = buildChoice(expansion, {
    ...base,
    inventory: { ...expansion.cropCost, dittany: expansion.cropCost.dittany - 1 },
  }, NOW, E.DB.expansions);
  assert.equal(noMaterials.missing, true);
  assert.equal(noMaterials.canBuild, false);
  assert.deepEqual(noMaterials.costs.find(c => c.id === 'dittany'), { id: 'dittany', need: 12, have: 11 });

  // plot_6 also costs Galleons: a short wallet blocks it, local play (Infinity) never does.
  const paid = E.DB.expansions.find(item => item.id === 'plot_6');
  const paidState = { level: 36, built: ['plot_4', 'plot_5'], construction: [], inventory: { ...paid.cropCost } };
  assert.equal(buildChoice(paid, paidState, NOW, E.DB.expansions).canBuild, true);
  const poor = buildChoice(paid, paidState, NOW, E.DB.expansions, paid.galleons - 1);
  assert.deepEqual([poor.galleonNeed, poor.galleonShort, poor.missing, poor.canBuild], [100, true, true, false]);
  assert.equal(buildChoice(paid, paidState, NOW, E.DB.expansions, paid.galleons).canBuild, true);

  const locked = buildChoice(expansion, { ...base, level: expansion.level - 1 }, NOW, E.DB.expansions);
  assert.equal(locked.unlocked, false);
  assert.equal(locked.canBuild, false);

  assert.equal(snapshot(base), before);
});

test('action payload helpers match the panel command shape', () => {
  assert.deepEqual(craftCommand('insects', 1), {
    action: 'craft',
    recipeId: 'insects',
    batches: 1,
  });
  assert.deepEqual(buildCommand('plot_5'), {
    action: 'build',
    expansionId: 'plot_5',
  });
});

test('choice guards keep a stale selected item from becoming another action', () => {
  const timed = E.DB.recipes.find(item => item.id === 'insects');
  const lockedState = E.testProfile(1, NOW);
  assert.equal(craftChoice(timed, lockedState, 1).canCraft, false);

  const busyState = E.testProfile(17, NOW);
  busyState.jobs.push({ station: timed.station, readyAt: NOW + 1000 });
  assert.equal(craftChoice(timed, busyState, 1).canCraft, false);

  const target = E.DB.expansions.find(item => item.id === 'plot_5');
  const queuedPredecessor = {
    level: 30,
    built: [],
    construction: [{ id: 'plot_4', kind: 'plot', readyAt: NOW + 1000 }],
    inventory: { ...target.cropCost },
  };
  const blocked = buildChoice(target, queuedPredecessor, NOW, E.DB.expansions);
  assert.equal(blocked.canBuild, false);

  const available = buildChoice(target, {
    level: 30,
    built: ['plot_4'],
    construction: [],
    inventory: { ...target.cropCost },
  }, NOW, E.DB.expansions);
  assert.equal(available.canBuild, true);
});

test('derived commands execute through the immutable progression engine', () => {
  const craftState = E.testProfile(17, NOW);
  const recipe = E.DB.recipes.find(item => item.id === 'puff_feed');
  const craftChoiceResult = craftChoice(recipe, craftState, 3);
  assert.equal(craftChoiceResult.canCraft, true);
  const craft = craftCommand(recipe.id, craftChoiceResult.batches);
  const crafted = E.craft(craftState, craft.recipeId, craft.batches, NOW);
  assert.equal(crafted.inventory.puff_feed, craftState.inventory.puff_feed + recipe.count * 3);
  assert.equal(craftState.inventory.puff_feed, 1000);

  const expansion = E.DB.expansions.find(item => item.id === 'plot_4');
  const buildState = E.testProfile(12, NOW);
  buildState.built = buildState.built.filter(id => id !== expansion.id);
  buildState.plots = buildState.plots.slice(0, 3);
  Object.assign(buildState.inventory, expansion.cropCost);
  const buildChoiceResult = buildChoice(expansion, buildState, NOW, E.DB.expansions);
  assert.equal(buildChoiceResult.canBuild, true);
  const build = buildCommand(expansion.id);
  const building = E.build(buildState, build.expansionId, NOW);
  assert.equal(building.construction[0].id, expansion.id);
  assert.equal(buildState.inventory.pumpkin, expansion.cropCost.pumpkin);
  assert.equal(building.inventory.pumpkin, 0);
});

test('work action waits for getReady and then dispatches the selected engine action', () => {
  const previousDocument = globalThis.document;
  globalThis.document = fakeDocument;
  fakeDocument.nodes.clear();
  const craftDock = new FakeElement('section');
  craftDock.setAttribute('id', 'craftDock');
  const buildDock = new FakeElement('section');
  buildDock.setAttribute('id', 'buildDock');
  let state = E.testProfile(17, NOW);
  let ready = false;
  const calls = [];
  try {
    const trays = setupWorkTrays({
      E,
      items: new Map(),
      labels: Object.fromEntries(E.DB.crops.map(item => [item.id, item.label])),
      getState: () => state,
      getReady: () => ready,
      run: (action, text, command) => calls.push({ action, text, command }),
      showPanel: () => {},
    });
    const action = fakeDocument.getElementById('craftAction');
    assert.equal(action.disabled, true);
    action.click();
    assert.equal(calls.length, 0);

    ready = true;
    trays.refresh('craft');
    assert.equal(action.disabled, false);
    action.click();
    assert.equal(calls.length, 1);
    const after = calls[0].action(state);
    assert.equal(calls[0].command.action, 'craft');
    assert.equal(after.inventory.puff_feed, state.inventory.puff_feed + 6);

    state.level = 1;
    action.click();
    assert.equal(calls.length, 1);

    const started = Date.now() - 24 * 3600000;
    state = E.testProfile(12, started);
    state.built = state.built.filter(id => id !== 'plot_4');
    state.plots = state.plots.slice(0, 3);
    state = E.build(state, 'plot_4', started);
    trays.refresh('build');
    const find = node => node.attributes?.['data-id'] === 'plot_4' ? node : node.children?.map(find).find(Boolean);
    find(buildDock).click();
    const build = fakeDocument.getElementById('buildAction');
    assert.equal(build.disabled, false);
    assert.match(build.textContent, /Xong · Nhận/);
    build.click();
    assert.equal(calls.at(-1).command.action, 'claimBuildings');
    assert.ok(calls.at(-1).action(state).built.includes('plot_4'));
  } finally {
    globalThis.document = previousDocument;
  }
});

test('«Trồng/Tạo» plans crafts and line plants the engine accepts, within seeds, water and free cells', () => {
  const recipe = E.DB.recipes.find(item => item.id === 'niffler_feed'); // carrot ×3 + insects ×3 (crafted)
  const state = E.testProfile(40, NOW);
  for (const id of Object.keys(state.inventory)) state.inventory[id] = 0;
  state.inventory.oats = 3; state.inventory.lettuce = 3; // enough for one «Nuôi côn trùng» jar
  state.plots.forEach(plot => { plot.slots.fill(null); plot.cooldowns.fill(0); plot.patterns = []; });
  const before = snapshot(state);
  const plan = restockPlan({ recipe, state, batches: 2, now: E.nowFor(state, NOW) });
  assert.equal(snapshot(state), before);
  assert.deepEqual(plan.steps[0], { action: 'craft', recipeId: 'insects', batches: 1 });
  const plants = plan.steps.filter(step => step.action === 'plant');
  assert.equal(plants.reduce((n, step) => n + step.cells.length, 0), 6); // carrot 0/6
  assert.ok(plants.every(step => step.species === 'carrot' && step.cells.length <= 3));
  // Every step runs through the engine in order, as the server would.
  let next = state;
  for (const step of plan.steps) next = step.action === 'craft' ? E.craft(next, step.recipeId, step.batches, NOW) : E.plant(next, step.plotIndex, step.cells, step.species, NOW);
  assert.equal(next.plots.flatMap(plot => plot.slots).filter(slot => slot?.species === 'carrot').length, 6);

  // Planted carrots count; a running jar counts; nothing is planned twice.
  const again = restockPlan({ recipe, state: next, batches: 2, now: E.nowFor(next, NOW) });
  assert.deepEqual(again.steps, []);
  assert.deepEqual(again.growing.sort(), ['carrot', 'insects']);

  // Seeds and water cap the cells; the rest is reported to buy.
  const short = restockPlan({ recipe, state, batches: 2, supplies: { water: 10, seeds: { carrot: 4 } }, now: E.nowFor(state, NOW) });
  assert.equal(short.steps.filter(step => step.action === 'plant').reduce((n, step) => n + step.cells.length, 0), 4);
  assert.deepEqual(short.seeds, { carrot: 2 });
  const dry = restockPlan({ recipe, state, batches: 2, supplies: { water: 1, seeds: { carrot: 9 } }, now: E.nowFor(state, NOW) });
  assert.equal(dry.water, 5);

  // No free cell left: plant what fits, the rest «trồng thêm sau».
  const full = structuredClone(state);
  full.plots.forEach((plot, p) => plot.slots.forEach((_, i) => { if (p || i > 1) plot.slots[i] = { species: 'pumpkin' }; }));
  const tight = restockPlan({ recipe, state: full, batches: 2, now: E.nowFor(full, NOW) });
  assert.deepEqual(tight.steps.filter(step => step.action === 'plant').map(step => step.cells), [[0, 1]]);
  assert.deepEqual(tight.later, { carrot: 4 });
});

test('creature «Trồng nhanh» crafts the ration when it can, else plans its recipe; no open recipe → null', () => {
  const state = E.testProfile(40, NOW);
  for (const id of Object.keys(state.inventory)) state.inventory[id] = 0;
  state.plots.forEach(plot => { plot.slots.fill(null); plot.cooldowns.fill(0); plot.patterns = []; });
  const now = E.nowFor(state, NOW);
  const planted = feedPlan({ feed: 'niffler_feed', portions: 2, state, now });
  assert.ok(planted.steps.some(step => step.action === 'plant' && step.species === 'carrot'));
  state.inventory.carrot = 3; state.inventory.insects = 3;
  assert.deepEqual(feedPlan({ feed: 'niffler_feed', portions: 2, state, now }).steps, [{ action: 'craft', recipeId: 'niffler_feed', batches: 1 }]);
  assert.equal(feedPlan({ feed: 'dragon_feed', portions: 2, state, now }), null); // Rồng's recipes open at level 93
  assert.equal(feedPlan({ feed: 'niffler_feed', portions: 0, state, now }), null);
});

test('«Gieo cả thửa» fills only the free cells of one plot, line by line, within seeds and water', () => {
  const state = E.testProfile(140, NOW);
  state.plots.forEach(plot => { plot.slots.fill(null); plot.cooldowns.fill(0); plot.patterns = []; });
  const now = E.nowFor(state, NOW);
  const empty = fillPlotPlan({ state, plotIndex: 1, species: 'pumpkin', now });
  assert.equal(empty.free, 9);
  assert.deepEqual(empty.steps.map(step => [step.plotIndex, step.cells]), [[1, [0, 1, 2]], [1, [3, 4, 5]], [1, [6, 7, 8]]]);
  let next = state;
  for (const step of empty.steps) next = E.plant(next, step.plotIndex, step.cells, step.species, NOW);
  assert.equal(next.plots[1].slots.filter(Boolean).length, 9);

  const part = E.plant(E.plant(state, 1, [0], 'daisy', NOW), 1, [4], 'daisy', NOW);
  const rest = fillPlotPlan({ state: part, plotIndex: 1, species: 'pumpkin', now });
  assert.equal(rest.free, 7);
  const cells = rest.steps.flatMap(step => step.cells).sort();
  assert.deepEqual(cells, [1, 2, 3, 5, 6, 7, 8]);
  next = part;
  for (const step of rest.steps) next = E.plant(next, step.plotIndex, step.cells, step.species, NOW);
  assert.equal(next.plots[1].slots.filter(Boolean).length, 9);

  const short = fillPlotPlan({ state, plotIndex: 1, species: 'pumpkin', supplies: { water: 50, seeds: { pumpkin: 4 } }, now });
  assert.equal(short.steps.reduce((n, step) => n + step.cells.length, 0), 4);
  assert.deepEqual(short.seeds, { pumpkin: 5 });
  assert.equal(fillPlotPlan({ state, plotIndex: 1, species: 'pumpkin', supplies: { water: 2, seeds: { pumpkin: 9 } }, now }).water, 7);
  // Water crops sow without «Nước tưới» (owner 16/11/2026): a dry barrel still fills the plot.
  const kelp = fillPlotPlan({ state, plotIndex: 1, species: 'silverkelp', supplies: { water: 0, seeds: { silverkelp: 9 } }, now });
  assert.equal(kelp.water, 0);
  assert.equal(kelp.steps.reduce((n, step) => n + step.cells.length, 0), 9);
});
