// Garden expansion phase 3 (docs/garden-expansion-plan.md §11): the orchard dock helpers, Hagrid's three requests
// text and the sapling store wiring, from the server's snapshot.orchard / snapshot.edge.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DB} from './balance-data.mjs';
import {edgeStepText, treeTiles, ripeCount, saplingChoices, harvestText, SAPLINGS} from './garden-orchard-ui.mjs';
import {itemDisplayName} from './ui-utils.mjs';

const NOW = 1_000_000;
const orchard = {trees: [null, {kind: 'apple', readyAt: NOW + 5000, ripe: false}, {kind: 'pear', readyAt: NOW - 1, ripe: false}, {kind: 'plum', readyAt: NOW + 9, ripe: true}, null, null],
 saplings: {apple: 0, pear: 2, plum: 0}};

test('the three edge steps read «Việc bác Hagrid nhờ» step N/3 at 0 Galleons', () => {
 const edge = DB.expansions.filter(e => e.kind === 'edge');
 assert.equal(edge.length, 3);
 assert.deepEqual(edge.map((e, i) => edgeStepText(i + 1, edge.length, e.galleons)),
  ['Việc bác Hagrid nhờ · bước 1/3 · 0 Galleons', 'Việc bác Hagrid nhờ · bước 2/3 · 0 Galleons', 'Việc bác Hagrid nhờ · bước 3/3 · 0 Galleons']);
});

test('pits are empty, growing or ripe by readyAt or the server ripe flag', () => {
 assert.deepEqual(treeTiles(orchard, NOW).map(t => t.state), ['empty', 'growing', 'ripe', 'ripe', 'empty', 'empty']);
 assert.equal(ripeCount(orchard, NOW), 2);
 assert.deepEqual(treeTiles(null, NOW), []);
 assert.equal(ripeCount(null, NOW), 0);
});

test('the sapling picker falls to a kind in stock and labels read Táo / Lê / Mận', () => {
 assert.equal(saplingChoices(orchard, 'apple').selected, 'pear');
 assert.equal(saplingChoices(orchard, 'pear').selected, 'pear');
 assert.deepEqual(saplingChoices(orchard, 'apple').choices.map(c => [c.label, c.count]), [['Táo', 0], ['Lê', 2], ['Mận', 0]]);
 assert.equal(saplingChoices({saplings: {}}, 'plum').selected, 'plum');
 assert.deepEqual(Object.values(SAPLINGS).map(s => s.label), ['Táo', 'Lê', 'Mận']);
 assert.equal(harvestText({apple: 4, plum: 4, pear: 0}), 'Táo ×4 · Mận ×4');
 assert.equal(itemDisplayName('sapling_pear'), 'Cây lê non');
});

test('the store has the «Cây non» tab and the edge icon fallback exists', () => {
 const store = fs.readFileSync(new URL('./garden-store-ui.mjs', import.meta.url), 'utf8');
 assert.match(store, /\["sapling","Cây non"\]/);
 assert.match(store, /item\.kind==="sapling"/);
 assert.match(fs.readFileSync(new URL('./ui-utils.mjs', import.meta.url), 'utf8'), /\^edge_\(\\d\+\)\$/);
});
