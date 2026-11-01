// Owner 01/11/2026: «Thăm liên tục» order, ‹ › walking, «ai đã chăm giúp» toast, fire time left.
import test from 'node:test';
import assert from 'node:assert/strict';
import {visitOrder, nextVisit, newHelpers, helperNames} from './garden-visits-ui.mjs';
import {fireTimeLeft} from './garden-fire.mjs';

test('helpable gardens come first, most growing first; ‹ › skip to the next helpable one', () => {
  const rows = [{uid: 'a', growing: 0}, {uid: 'b', growing: 2}, {uid: 'c', growing: 5, helped: true}, {uid: 'd', growing: 6}, {uid: 'e', growing: 0}];
  const q = visitOrder(rows);
  assert.deepEqual(q.map(v => v.uid), ['d', 'b', 'a', 'c', 'e']);
  assert.equal(nextVisit(q, 'd', 1).uid, 'b');
  assert.equal(nextVisit(q, 'b', 1).uid, 'd', 'wraps to the helpable one');
  q[0].helped = true; q[1].helped = true;
  assert.equal(nextVisit(q, 'd', 1).uid, 'b', 'nothing helpable: the neighbour');
  assert.equal(nextVisit(q, 'd', -1).uid, 'e');
  assert.equal(nextVisit([{uid: 'x'}], 'x', 1), null);
});

test('the host hears each helper once, by name', () => {
  const helpers = [{uid: '1', name: 'tara', at: 10}, {uid: '2', name: 'Linh', at: 20}, {uid: '3', name: 'Mai', at: 30}];
  assert.equal(newHelpers(helpers, 30), null);
  assert.deepEqual(newHelpers(helpers, 10), {text: '🤝 Linh và Mai đã chăm giúp vườn con · cây chín sớm 30 phút', seenAt: 30});
  assert.equal(helperNames(helpers), 'tara, Linh và 1 người khác');
});

test('fire time left reads in days, hours or minutes', () => {
  assert.equal(fireTimeLeft(26 * 3600000, 0), '1 ngày 2 giờ');
  assert.equal(fireTimeLeft(3 * 3600000 + 5 * 60000, 0), '3 giờ 05 phút');
  assert.equal(fireTimeLeft(12 * 60000 - 1, 0), '12 phút');
});
