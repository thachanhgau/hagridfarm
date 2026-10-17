import test from 'node:test';
import assert from 'node:assert/strict';
import {readdirSync, readFileSync} from 'node:fs';
import {PALETTE} from './palette.mjs';

test('runtime modules draw only with palette colours', () => {
  const allowed = new Set(PALETTE.map((c) => c.toLowerCase()));
  const dir = new URL('./', import.meta.url);
  const offenders = [];
  for (const name of readdirSync(dir)) {
    if (!name.endsWith('.mjs') || name.endsWith('.test.mjs') || /^(build|generate)-/.test(name)) continue;
    for (const hex of readFileSync(new URL(name, dir), 'utf8').match(/#[0-9a-fA-F]{6}\b/g) || []) {
      if (!allowed.has(hex.toLowerCase())) offenders.push(`${name} ${hex}`);
    }
  }
  assert.deepEqual([...new Set(offenders)], []);
});
