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
test('edge approach joins the main spine through the actual one-cell gap between pens',async()=>{
 const scene=JSON.parse(await (await import('node:fs/promises')).readFile(new URL('scene-data.json',import.meta.url),'utf8'));
 const paths=pathSegments({...scene,edgePath:true});
 assert.ok(paths.some(([a,b])=>a[0]===26&&a[1]===16&&b[0]===44.5&&b[1]===16));
 for(const p of scene.pens)assert.ok(16.5<=p.row||15.5>=p.row+p.height,'approach must not cross a pen floor');
});
test('at density 1 the painter is the pre-HD one byte for byte; at density 2 it snaps to device pixels with the same footprint',async()=>{
 const {createHash}=await import('node:crypto'),full={...map,pondPath:true,edgePath:true};
 const record=a=>{const calls=[],ctx={fillRect(...r){calls.push([ctx.fillStyle,...r]);},getTransform:()=>({a})};drawGardenPathDetails(ctx,full);return calls;};
 const one=record(1);assert.equal(one.length,88124);
 assert.equal(createHash('sha256').update(one.map(c=>c.join()).join('\n')).digest('hex'),'e18d5eef7578b3ab344714d5ff66fd80a3fe7dc63145490a65385af74f93ade7','1× calls recorded from the painter before 15/11');
 const two=record(2),box=c=>c.reduce((b,[,x,y,w,h])=>[Math.min(b[0],x),Math.min(b[1],y),Math.max(b[2],x+w),Math.max(b[3],y+h)],[Infinity,Infinity,-Infinity,-Infinity]);
 assert.ok(two.every(([,...v])=>v.every(n=>Number.isInteger(n*2))),'every edge on a device pixel');assert.ok(two.some(([,...v])=>v.some(n=>!Number.isInteger(n))),'finer than 1×');
 assert.deepEqual(new Set(two.map(c=>c[0])),new Set(one.map(c=>c[0])));box(two).forEach((v,i)=>assert.ok(Math.abs(v-box(one)[i])<=1));
});
