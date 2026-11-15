import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import {PALETTE} from './palette.mjs';
import {createBoundaryFence,drawBoundaryFence} from './garden-landscape.mjs';
import {drawSeasonalFence} from './garden-seasonal-world.mjs';
import {penFencePieces,drawPenFence,drawPenHabitat} from './garden-pen-details.mjs';
import {drawRaisedPlotBorder} from './garden-cottage-details.mjs';
import {forestExitTrail,backdropExitTrail,drawExitTrail} from './forest-composition.mjs';
import {drawV24Ground} from './garden-v24-scenery.mjs';
import {GARDEN_STAGES,stageBoundary,fenceOpenings} from './garden-growth.mjs';

// Code-drawn garden surfaces: at density 1 every call is the pre-HD one (hashes recorded 15/11/2026 before the HD pass);
// above it they step per device pixel, stay deterministic and keep to the palette.
const scene=JSON.parse(fs.readFileSync(new URL('scene-data.json',import.meta.url),'utf8'));
const iso=(col,row)=>[scene.origin.x+(col-row)*scene.tileWidth/2,scene.origin.y+(col+row)*scene.tileHeight/2];
const stage=GARDEN_STAGES.at(-1),weathers=['clear','rain','autumn','snow'];
const corners=(o)=>[iso(o.col,o.row),iso(o.col+o.width,o.row),iso(o.col+o.width,o.row+o.height),iso(o.col,o.row+o.height)];
const SURFACES={
 boundaryFence:c=>{for(const piece of createBoundaryFence(scene,stageBoundary(stage,{fence:true}),fenceOpenings(stage)))drawBoundaryFence(c,piece);},
 seasonalFence:c=>{for(const piece of createBoundaryFence(scene,stageBoundary(stage,{fence:true}),fenceOpenings(stage)))for(const event of ['none','event_yule','event_herbology_fair'])drawSeasonalFence(c,piece,'snow',event,1000);},
 penFence:c=>{for(const pen of scene.pens)for(const piece of penFencePieces(pen,iso))for(const w of weathers)drawPenFence(c,piece,w);},
 penHabitat:c=>{for(const pen of scene.pens)for(const w of weathers)for(const personalized of [false,true])drawPenHabitat(c,{corners:corners(pen),pen,iso,weatherMode:w,personalized});},
 plotBorder:c=>{scene.plots.forEach((plot,index)=>{for(const w of weathers)drawRaisedPlotBorder(c,corners(plot),{weatherMode:w,index});});},
 exitTrail:c=>{drawExitTrail(c,forestExitTrail(scene));drawExitTrail(c,backdropExitTrail(scene),{taperEnd:true});},
 weatherGround:c=>{for(const w of weathers)drawV24Ground(c,{weatherMode:w,clock:1000,iso,stage,map:scene});},
};
const PINNED={
 boundaryFence:'2d23401c97b643d1a04d3943e03df0ef5695fa17a350c5bac7f2db60c37f1862',
 seasonalFence:'61d8ac6508d0ffd097fbab9ab26f292602fb70601baf9dea0a0bb454752e4866',
 penFence:'84c09b6fd0b1801fdf9d24946236f523c323ca39cc466a4f22ad18ccd5f551f4',
 penHabitat:'80b5614e960374b880618a63c98d0dc3c5e7cd7a7fe802d17da64f6fe0e46e4c',
 plotBorder:'d2b8b0d904c4a6f86233dd7eab9a76821bcc3c73f11c19e30c4c66190fdf4d7a',
 exitTrail:'2088805969fd835593c6e249d8edda546970690bcc000137f958d41a3a6b650c',
 // Re-pinned 15/11/2026 on purpose: snow banks whose footprint meets a path are skipped (owner: a bank lay across a path).
 weatherGround:'2c05057b23d5b37915f561c63f9f19dff6c185f8c64a1f0a83c49aad08ac42b2',
};
function record(draw,d){
 const calls=[],state={};
 const ctx=new Proxy({},{get:(_,k)=>k==='getTransform'?()=>({a:d,b:0,c:0,d,e:0,f:0}):k in state?state[k]:k==='canvas'?undefined:(...a)=>{calls.push([k,state.fillStyle,...a.map(v=>typeof v==='object'?'obj':v)]);},set:(_,k,v)=>{state[k]=v;return true;}});
 draw(ctx);return calls;
}
const hash=calls=>createHash('sha256').update(calls.map(c=>c.join()).join('\n')).digest('hex');
const palette=new Set(PALETTE.map(c=>c.toLowerCase()));
for(const [name,draw] of Object.entries(SURFACES))test(`${name}: 1× calls unchanged; HD steps per device pixel`,()=>{
 const one=record(draw,1);assert.ok(one.length>0);
 if(process.env.PRINT_HASHES)console.log(name,one.length,hash(one));else assert.equal(hash(one),PINNED[name]);
 for(const d of [2,1.5]){
  const hd=record(draw,d);assert.deepEqual(record(draw,d),hd,'deterministic');
  const rects=hd.filter(c=>c[0]==='fillRect');assert.ok(rects.every(([,,...v])=>v.every(n=>Math.abs(n*d-Math.round(n*d))<1e-6)),'on device pixels');
  assert.ok(rects.some(([,,...v])=>v.some(n=>!Number.isInteger(n))),'finer than 1×');
  assert.ok(hd.every(([k,c])=>k!=='fillRect'||typeof c!=='string'||!c.startsWith('#')||palette.has(c.toLowerCase())),'palette colours');
 }
});
