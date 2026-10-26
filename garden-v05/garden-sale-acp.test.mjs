import test from 'node:test';
import assert from 'node:assert/strict';
import {toLocal,fromLocal} from './garden-sale-acp-ui.mjs?v=24.9.81';

// ACP sale times are typed in Vietnam time as DD/MM/YYYY HH:mm (24 h), whatever the device locale.
test('ACP sale time reads and writes DD/MM/YYYY HH:mm in Vietnam time', () => {
  const ms = Date.parse('2026-10-24T19:30:00+07:00');
  assert.equal(toLocal(ms), '24/10/2026 19:30');
  assert.equal(fromLocal('24/10/2026 19:30'), ms);
  assert.equal(fromLocal(' 4/1/2027 7:05 '), Date.parse('2027-01-04T07:05:00+07:00'));
  for (const bad of ['31/02/2026 10:00', '24/10/2026 25:00', '2026-10-24T19:30', '']) assert.ok(Number.isNaN(fromLocal(bad)), bad);
  assert.equal(toLocal(NaN), '');
});
