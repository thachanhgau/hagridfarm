import test from 'node:test';
import assert from 'node:assert/strict';
import {pathSegments,drawGardenPathDetails} from './garden-path-details.mjs';
import {GARDEN_PATHS} from './garden-landscape.mjs';
const pens=Array.from({length:6},(_,i)=>({col:27,row:i*4,height:3}));
const map={origin:{x:1120,y:300},tileWidth:64,tileHeight:32,pens};
test('pen approaches preserve crop routes and terminate at open gates',()=>{
 const original=GARDEN_PATHS.flatMap(r=>r.slice(1).map((end,i)=>[r[i],end]));
 const paths=pathSegments(map);assert.deepEqual(paths.slice(0,original.length),original);
 assert.deepEqual(paths.slice(-6),pens.map(p=>[[26,p.row+1.5],[27,p.row+1.5]]));
 assert.deepEqual(pathSegments({...map,pens:[{col:10,row:8,height:3}]}),original);
});
test('path pixels are deterministic, integral and do not mutate layout',()=>{
 const record=()=>{const calls=[];drawGardenPathDetails({fillRect(...v){assert(v.every(Number.isInteger));calls.push(v)}},map);return calls;};
 const before=JSON.stringify(map),a=record();assert(a.length>0);assert.deepEqual(record(),a);assert.equal(JSON.stringify(map),before);
});
