import test from 'node:test';
import assert from 'node:assert/strict';

import * as E from './progression-engine.mjs';
import {
  buildChoice,
  buildCommand,
  craftChoice,
  craftCommand,
  inputNeeds,
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
    inventory: { kit: expansion.kitCost },
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
    inventory: { kit: expansion.kitCost - 1 },
  }, NOW, E.DB.expansions);
  assert.equal(noMaterials.missing, true);
  assert.equal(noMaterials.canBuild, false);

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
    inventory: { kit: target.kitCost },
  };
  const blocked = buildChoice(target, queuedPredecessor, NOW, E.DB.expansions);
  assert.equal(blocked.canBuild, false);

  const available = buildChoice(target, {
    level: 30,
    built: ['plot_4'],
    construction: [],
    inventory: { kit: target.kitCost },
  }, NOW, E.DB.expansions);
  assert.equal(available.canBuild, true);
});

test('derived commands execute through the immutable progression engine', () => {
  const craftState = E.testProfile(17, NOW);
  const recipe = E.DB.recipes.find(item => item.id === 'kits');
  const craftChoiceResult = craftChoice(recipe, craftState, 3);
  assert.equal(craftChoiceResult.canCraft, true);
  const craft = craftCommand(recipe.id, craftChoiceResult.batches);
  const crafted = E.craft(craftState, craft.recipeId, craft.batches, NOW);
  assert.equal(crafted.inventory.kit, craftState.inventory.kit + recipe.count * 3);
  assert.equal(craftState.inventory.kit, 1000);

  const expansion = E.DB.expansions.find(item => item.id === 'plot_4');
  const buildState = E.testProfile(12, NOW);
  buildState.built = buildState.built.filter(id => id !== expansion.id);
  buildState.plots = buildState.plots.slice(0, 3);
  buildState.inventory.kit = expansion.kitCost;
  const buildChoiceResult = buildChoice(expansion, buildState, NOW, E.DB.expansions);
  assert.equal(buildChoiceResult.canBuild, true);
  const build = buildCommand(expansion.id);
  const building = E.build(buildState, build.expansionId, NOW);
  assert.equal(building.construction[0].id, expansion.id);
  assert.equal(buildState.inventory.kit, expansion.kitCost);
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
    assert.equal(after.inventory.kit, state.inventory.kit + 3);

    state.level = 1;
    action.click();
    assert.equal(calls.length, 1);
  } finally {
    globalThis.document = previousDocument;
  }
});
