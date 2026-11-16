import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveCreatureHomes,spotPoint,swapHome,homeChoices,homeExpansion} from './creature-homes.mjs';

const land=ids=>ids.map(species=>({species}));
const pens=n=>new Set(Array.from({length:n},(_,i)=>`pen_${i+1}`));
const L=land(['puffskein','bowtruckle','niffler','hippogriff','dragon']);

test('no saved homes: land order, roamers in the pasture once edge_2 is built (the old placement)',()=>{
 assert.deepEqual(resolveCreatureHomes(L,undefined,{built:pens(6)}),[0,1,2,3,4]);
 assert.deepEqual(resolveCreatureHomes(L,{},{built:new Set([...pens(6),'edge_2'])}),[0,1,2,18,22]);
 // Nothing built (tests, previews): the land index, as before.
 assert.deepEqual(resolveCreatureHomes(L,undefined),[0,1,2,3,4]);
});
test('saved homes win when unlocked and untaken; the rest fall back without overlapping',()=>{
 const built=new Set([...pens(6),'edge_2']);
 assert.deepEqual(resolveCreatureHomes(L,{puffskein:10,dragon:0,niffler:13,bowtruckle:10},{built}),[10,1,2,18,0]);
 // niffler's home (pen_ext_1) is locked → its land index 2; bowtruckle's taken → land index 1.
 const spots=resolveCreatureHomes(L,{puffskein:2,niffler:13},{built:pens(6)});
 assert.deepEqual(spots,[2,1,0,3,4]);
 assert.equal(new Set(spots).size,spots.length);
});
test('swap keeps a full map; choices list built pens and the open pasture with occupants',()=>{
 const built=new Set([...pens(2),'edge_2']),spots=resolveCreatureHomes(L,{},{built});
 assert.deepEqual(spots,[0,1,2,18,22]);
 assert.deepEqual(swapHome(L,spots,'dragon',0),{puffskein:22,bowtruckle:1,niffler:2,hippogriff:18,dragon:0});
 assert.deepEqual(swapHome(L,spots,'puffskein',3),{puffskein:3,bowtruckle:1,niffler:2,hippogriff:18,dragon:22});
 const groups=homeChoices(L,spots,{built});
 assert.deepEqual(groups.map(g=>g.name),['Chuồng 1','Chuồng 2','Bãi chăn']);
 assert.deepEqual(groups[1].cells,[{spot:2,species:'niffler'},{spot:3,species:null}]);
 assert.equal(groups[2].cells.length,5);
 assert.deepEqual([0,11,12,17,18,22].map(homeExpansion),['pen_1','pen_6','pen_ext_1','pen_ext_3','edge_2','edge_2']);
 assert.deepEqual(spotPoint({creatureSpots:[[1,2]]},0),[1,2]);
 assert.equal(spotPoint({creatureSpots:[]},18).length,2);
});
