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
 const {PALETTE}=await import('./palette.mjs'),palette=new Set(PALETTE.map(c=>c.toLowerCase()));assert.ok(two.every(([c])=>palette.has(c)),'palette colours only');box(two).forEach((v,i)=>assert.ok(Math.abs(v-box(one)[i])<=1));
});
test('HD path (density 2 and 1.5): deterministic sett bed, seamless tile, and no gaps along the path edge',async()=>{
 const {bedTile}=await import('./garden-path-details.mjs'),scene=JSON.parse(await (await import('node:fs/promises')).readFile(new URL('scene-data.json',import.meta.url),'utf8'));
 for(const dir of ['col','row']){const t=bedTile(dir);assert.deepEqual(bedTile(dir),t);
  // The tile repeats along the path's 2:1 diagonal: the pixel two to the side and one down is the same course.
  const at=(x,y)=>t.data.slice(((y%t.height)*t.width+(x%t.width))*4,((y%t.height)*t.width+(x%t.width))*4+3).join();
  const s=dir==='col'?2:-2;let same=0,all=0;for(let y=0;y<t.height;y++)for(let x=0;x<t.width;x++){all++;if(at(x,y)===at((x+s*4+t.width*4)%t.width,y+4))same++;}assert.ok(same/all>.7,'courses follow the path diagonal');}
 for(const d of [2,1.5]){
  const record=()=>{const grid=new Map(),calls=[];let style;
   const ctx={set fillStyle(v){style=v;},get fillStyle(){return style;},getTransform:()=>({a:d}),createPattern:()=>({setTransform(){},tile:true}),
    fillRect(x,y,w,h){calls.push([style?.tile?'tile':style,x,y,w,h]);for(let Y=Math.round(y*d);Y<Math.round((y+h)*d);Y++)for(let X=Math.round(x*d);X<Math.round((x+w)*d);X++)grid.set(X+','+Y,style?.tile?'tile':style);}};
   globalThis.OffscreenCanvas=class{getContext(){return {putImageData(){}};}};globalThis.ImageData=class{};globalThis.DOMMatrix=class{};
   try{drawGardenPathDetails(ctx,scene);}finally{delete globalThis.OffscreenCanvas;delete globalThis.ImageData;delete globalThis.DOMMatrix;}
   return {grid,calls};};
  const a=record(),b=record();assert.deepEqual(a.calls,b.calls);assert.ok(a.calls.some(c=>c[0]==='tile'),'the bed is the sett tile');
  // Row 7 path, cols 4–8 (a straight run): every device row across it is one painted run, edge-coloured at both ends.
  const [x0,y0]=[scene.origin.x+(4-7)*32,scene.origin.y+(4+7)*16],[x1,y1]=[scene.origin.x+(8-7)*32,scene.origin.y+(8+7)*16];
  for(let Y=Math.round(y0*d);Y<=Math.round(y1*d);Y++){
   const cx=(x0+(Y/d-y0)*2)*d,run=[];for(let X=Math.round(cx-40*d);X<=Math.round(cx+40*d);X++)if(a.grid.has(X+','+Y))run.push(X);
   assert.ok(run.length>40*d,'path present at row '+Y);assert.equal(run.at(-1)-run[0]+1,run.length,'no gap at device row '+Y);
   assert.equal(a.grid.get(run[0]+','+Y),'#4a3c2c');assert.equal(a.grid.get(run.at(-1)+','+Y),'#4a3c2c');
  }
 }
});
