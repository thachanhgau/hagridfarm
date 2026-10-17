import test from 'node:test';
import assert from 'node:assert/strict';
import {eventHop, harvestPop} from './scene-animation.mjs';
import {comboStep} from './garden-audio.mjs';
import {rewardDeltas} from './garden-juice.mjs';

test('juice offsets are whole pixels and vanish under reduced motion', () => {
  for (const kind of ['plant', 'eat', 'claim']) {
    assert.equal(eventHop({kind, progress: 0}), 0); // reduced motion reports progress 0
    assert.equal(eventHop({kind, progress: 1}), 0);
    for (let p = 0.05; p < 1; p += 0.05) assert.ok(Number.isInteger(eventHop({kind, progress: p})));
  }
  assert.equal(eventHop({kind: 'care', progress: 0.5}), 0);
  assert.equal(harvestPop({kind: 'harvest', progress: 0}), null);
  const mid = harvestPop({kind: 'harvest', progress: 0.5});
  assert.ok(Number.isInteger(mid.dy) && mid.dy < 0 && mid.alpha > 0 && mid.alpha < 1);
});

test('combo climbs while the same action repeats quickly, then resets', () => {
  let c = comboStep(null, 'harvest', 0);
  assert.equal(c.step, 0);
  c = comboStep(c, 'harvest', 1000); assert.equal(c.step, 1);
  c = comboStep(c, 'harvest', 2000); assert.ok(c.pitch > 1);
  for (let t = 3000; t < 9000; t += 1000) c = comboStep(c, 'harvest', t);
  assert.equal(c.step, 4); // capped
  assert.equal(comboStep(c, 'plant', 9100).step, 0);
  assert.equal(comboStep(c, 'harvest', 20000).step, 0);
});

test('reward chips list only items that increased', () => {
  assert.deepEqual(rewardDeltas({inventory: {pumpkin: 2, kit: 5}}, {inventory: {pumpkin: 5, kit: 4, daisy: 1}}), [
    {id: 'pumpkin', amount: 3}, {id: 'daisy', amount: 1},
  ]);
});
