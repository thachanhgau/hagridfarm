import test from 'node:test';
import assert from 'node:assert/strict';
import {createGardenClient} from './garden-emulator-client.mjs?v=24.9.90';

test('the client sends the catalog hash it holds and keeps its catalog when the server leaves it out', async () => {
  const sent = [];
  const garden = {progression: {revision: 1}};
  const replies = [
    {garden, catalog: [{id: 'pumpkin'}], catalogHash: 'h1'},
    {garden, catalogHash: 'h1'},
    {garden, catalog: [{id: 'pumpkin'}, {id: 'carrot'}], catalogHash: 'h2'},
  ];
  const client = createGardenClient(async (name, data) => { sent.push(data); return replies.shift(); });
  await client.read();
  assert.equal(sent[0].catalogHash, undefined);
  await client.free('care');
  assert.equal(sent[1].catalogHash, 'h1');
  assert.deepEqual(client.snapshot.catalog, [{id: 'pumpkin'}]);
  await client.free('care');
  assert.deepEqual(client.snapshot.catalog.map(i => i.id), ['pumpkin', 'carrot']);
});
