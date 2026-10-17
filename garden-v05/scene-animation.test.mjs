import test from 'node:test';
import assert from 'node:assert/strict';
import {
  animationFrameAt,
  createAnimationRuntime,
  creatureMotion,
  cropBreeze,
  decorFrameAt,
  detectStateEvents,
  EVENT_DURATIONS,
} from './scene-animation.mjs';

const actionItem = {
  clips: {
    action: {
      frames: [8, 9, 10],
      durations: [100, 200, 300],
      loop: true,
    },
  },
};

test('action frame choice is finite even when authored clip loops', () => {
  assert.deepEqual(animationFrameAt(actionItem, 'action', 0), {
    frame: 8,
    index: 0,
    duration: 600,
    elapsed: 0,
    progress: 0,
    done: false,
  });
  assert.equal(animationFrameAt(actionItem, 'action', 450).frame, 10);
  const final = animationFrameAt(actionItem, 'action', 10_000, {loop: false});
  assert.equal(final.frame, 10);
  assert.equal(final.done, true);
  assert.equal(animationFrameAt(actionItem, 'action', 10_000, {loop: false, reducedMotion: true}).frame, 8);
});

test('authored eat and care clips remain distinct finite choices', () => {
  const item = {
    clips: {
      idle: {frames: [4, 5], durations: [500, 150], loop: true},
      eat: {frames: [6], durations: [360], loop: false},
      care: {frames: [7], durations: [420], loop: false},
    },
  };
  assert.equal(animationFrameAt(item, 'eat', 180).frame, 6);
  assert.equal(animationFrameAt(item, 'eat', 999).done, true);
  assert.equal(animationFrameAt(item, 'care', 999).frame, 7);
  assert.equal(animationFrameAt(item, 'care', 999).done, true);
  assert.equal(animationFrameAt(item, 'idle', 720).frame, 4);
});

test('crop breeze is pixel aligned and static when reduced motion is requested', () => {
  const staticFrame = cropBreeze('moonherb', 0);
  assert.deepEqual(staticFrame, {x: 0, y: 0, phase: 0, intensity: 0});
  const movingFrame = cropBreeze('moonherb', 920);
  assert.ok([-1, 0, 1].includes(movingFrame.x));
  assert.ok([-1, 0, 1].includes(movingFrame.y));
  assert.equal(Number.isInteger(movingFrame.x), true);
  assert.equal(Number.isInteger(movingFrame.y), true);
  assert.deepEqual(cropBreeze('moonherb', 920, {reducedMotion: true}), staticFrame);
});

test('creatureMotion and decorFrameAt animate across frames and respect two angles', () => {
  const staticCreature = creatureMotion('puffskein', 0);
  assert.equal(staticCreature.intensity, 0);
  const liveCreature = creatureMotion('puffskein', 640, {index: 1});
  assert.equal(liveCreature.intensity, 1);
  assert.ok([-1, 0, 1].includes(liveCreature.swayX));
  assert.ok([-2, -1, 0].includes(liveCreature.bobY));

  const mockAsset = {
    id: 'decor_pumpkin_lantern',
    file: 'decor.png',
    frames: ['f0.png', 'f1.png', 'f2.png', 'f3.png'],
    rightFile: 'decor_right.png',
    rightFrames: ['rf0.png', 'rf1.png', 'rf2.png', 'rf3.png'],
    durations: [200, 200, 200, 200],
  };
  const fDefault = decorFrameAt(mockAsset, 350, {facing: 'default', seed: 'test'});
  const fRight = decorFrameAt(mockAsset, 350, {facing: 'right', seed: 'test'});
  assert.equal(fDefault.facing, 'default');
  assert.equal(fRight.facing, 'right');
  assert.ok(mockAsset.frames.includes(fDefault.file));
  assert.ok(mockAsset.rightFrames.includes(fRight.file));
  assert.equal(decorFrameAt(mockAsset, 0, {facing: 'right'}).file, 'rf0.png');
});

test('state diff detects grouped planting, finite feeding, and claim effects', () => {
  const before = {
    plots: [{slots: Array(9).fill(null)}],
    creatures: [{id: 'creature-mooncalf', species: 'mooncalf', mealsCompleted: 2, meal: null}],
  };
  const after = {
    plots: [{slots: [
      {id: 'crop-a', type: 'crop', species: 'oats'},
      {id: 'crop-b', type: 'crop', species: 'oats'},
      {id: 'crop-c', type: 'crop', species: 'oats'},
      ...Array(6).fill(null),
    ]}],
    creatures: [{
      id: 'creature-mooncalf',
      species: 'mooncalf',
      mealsCompleted: 3,
      meal: {id: 'meal-1'},
    }],
  };
  const fed = detectStateEvents(before, after);
  assert.deepEqual(fed.find((event) => event.kind === 'plant'), {
    kind: 'plant',
    plot: 0,
    cells: [0, 1, 2],
    species: 'oats',
  });
  assert.equal(fed.some((event) => event.kind === 'eat' && event.species === 'mooncalf'), true);

  const claimed = detectStateEvents(after, {
    ...after,
    creatures: [{...after.creatures[0], mealsCompleted: 4, meal: null}],
  });
  assert.equal(claimed.some((event) => event.kind === 'claim' && event.species === 'mooncalf'), true);
});

test('runtime exposes finite event durations and aliases while clock zero stays static', () => {
  const runtime = createAnimationRuntime();
  const event = runtime.animate('feed', {species: 'dragon'});
  assert.equal(event.kind, 'eat');
  assert.equal(event.duration, EVENT_DURATIONS.eat);
  assert.equal(runtime.active(0)[0].progress, 0);
  assert.equal(runtime.active(EVENT_DURATIONS.eat + 1).length, 0);
  const care = runtime.animate('care', {plot: 1, cells: [2]});
  assert.equal(care.duration, EVENT_DURATIONS.care);
});
