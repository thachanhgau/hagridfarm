// The world canvas tints itself; the surface behind it must get the same tints or the canvas edge shows as a rectangle.
import test from 'node:test';
import assert from 'node:assert/strict';
import {backdropTints, WINTER_NIGHT_TINT, atmosphereConfig, weatherConfig} from './garden-atmosphere.mjs';
import {eventConfig} from './garden-events.mjs';

test('the backdrop carries the event tint and the winter night tint, in canvas order, top first', () => {
  const halloween = eventConfig('event_halloween').tint;
  assert.deepEqual(backdropTints({atmosphere: 'day', weather: 'snow', eventTint: halloween, winter: true}),
    [halloween, 'transparent', weatherConfig('snow').tint, 'transparent']);
  assert.deepEqual(backdropTints({atmosphere: 'night', weather: 'clear', eventTint: null, winter: true}),
    ['transparent', WINTER_NIGHT_TINT, 'transparent', atmosphereConfig('night').tint]);
  assert.equal(backdropTints({atmosphere: 'night', weather: 'clear', eventTint: null, winter: false})[1], 'transparent');
});
