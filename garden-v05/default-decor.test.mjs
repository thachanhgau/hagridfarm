import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import scene from './scene-data.json' with {type: 'json'};
import motion from './motion-data.json' with {type: 'json'};
globalThis.FARM_SCENE = scene;
globalThis.FARM_MOTION = motion;
const {decorSpotProblem} = await import('./decor-placement-ui.mjs');
const {GARDEN_STAGES} = await import('./garden-growth.mjs');
const stage = GARDEN_STAGES.at(-1);
const state = {plots: [], built: [], decorations: ['decoration-7'], keepsakes: {puffskein: 1}};
const problem = (at, hiddenDefaults = []) => decorSpotProblem(...at, {map: scene, stage, state, decorations: {hiddenDefaults}, itemId: 'decor_cauldron'});

test('cất removes both earned ground and fixed pond/keepsake reservations', () => {
  for (const [id, at] of [['decoration-7', [6, 3.5]], ['scene:pond', [13, 22]], ['keepsake:puffskein', [4.5, 24.5]]]) {
    assert.notEqual(problem(at), '', id);
    assert.equal(problem(at, [id]), '', id);
    assert.notEqual(problem(at), '', 'putting it back reserves the original base');
  }
});

test('removable IDs match the server and preserve functional buildings', async () => {
  const {DEFAULT_DECOR_IDS, defaultDecorChoices} = await import('./default-decor.mjs');
  const choices = defaultDecorChoices(state);
  assert.ok(choices.some(c => c.id === 'decoration-7'));
  assert.ok(choices.some(c => c.id === 'scene:pond'));
  assert.ok(choices.some(c => c.id === 'keepsake:puffskein'));
  assert.ok(!choices.some(c => c.id === 'decoration-99'));
  assert.ok(!DEFAULT_DECOR_IDS.includes('hut'));
  if (process.env.GARDEN_HPVNN_ROOT) assert.deepEqual(DEFAULT_DECOR_IDS, JSON.parse(fs.readFileSync(process.env.GARDEN_HPVNN_ROOT + '/functions/games/garden-default-decor-ids.json')));
});

test('putting back a default cannot cover the bought decoration that replaced it', async () => {
  const {changeDefaultDecorationVisibility} = await import('./default-decor-actions.mjs');
  const decorations = {owned: ['decor_cauldron'], placements: ['decor_cauldron'], positions: {decor_cauldron: [6, 3.5]}, hiddenDefaults: ['decoration-7']};
  const commands = [], messages = [];
  const ctx = {map: scene, getState: () => state, getStage: () => stage, getDecorations: () => decorations, assetOf: () => null, run: (...args) => commands.push(args), notify: message => messages.push(message)};
  const result = await changeDefaultDecorationVisibility(ctx, 'decoration-7', true);
  assert.equal(result.ok, false);
  assert.equal(commands.length, 0);
  assert.match(messages[0], /món đã mua|trang trí đang bày/);
  await changeDefaultDecorationVisibility(ctx, 'scene:pond', false);
  assert.equal(commands[0][2].action, 'setDefaultDecorationVisibility');
  assert.equal(commands[0][2].visible, false);
});
