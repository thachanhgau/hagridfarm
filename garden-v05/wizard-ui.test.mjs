import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from './progression-engine.mjs';
import {cropContext} from './wizard-ui.mjs';
const start=1800000000000;
test('context harvest targets only mature crops in selected row; other rows remain intact',()=>{
 let s=E.testProfile(10,start);s=E.plant(s,0,[0,1,2],'pumpkin',start);s=E.plant(s,0,[3,4,5],'pumpkin',start+60000);
 const now=start+E.CROP.pumpkin.growMs;
 const c=cropContext(s,{selectedPlot:0,cells:[0,3,6]},E,now);
 assert.deepEqual(c.occupied,[0,3]);assert.deepEqual(c.ready,[0]);assert.equal(c.remaining,60000);
 const after=E.harvest(s,0,c.ready,now);
 assert.equal(after.plots[0].slots[0],null);assert.ok(after.plots[0].slots[1]);assert.ok(after.plots[0].slots[3]);
 assert.equal(after.inventory.pumpkin,s.inventory.pumpkin+1);
});
test('empty soil and growing row expose different contextual states without mutation',()=>{
 let s=E.testProfile(10,start);const before=JSON.stringify(s);
 assert.deepEqual(cropContext(s,{selectedPlot:0,cells:[0,1,2]},E,start).occupied,[]);assert.equal(JSON.stringify(s),before);
 s=E.plant(s,0,[0,1,2],'pumpkin',start);const planted=JSON.stringify(s),c=cropContext(s,{selectedPlot:0,cells:[0,1,2]},E,start);
 assert.equal(c.first.species,'pumpkin');assert.equal(c.ready.length,0);assert.equal(c.remaining,E.CROP.pumpkin.growMs);assert.equal(JSON.stringify(s),planted);
});
