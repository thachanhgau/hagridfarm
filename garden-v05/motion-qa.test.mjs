import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {animationFrameAt,idleFrameAt,createAnimationRuntime,decorFrameAt} from './scene-animation.mjs';
const sandbox={window:{}};vm.createContext(sandbox);
for(const file of ['motion-data.js','level-assets.js','motion-care-data.js'])vm.runInContext(fs.readFileSync(new URL(file,import.meta.url),'utf8'),sandbox);
const items=sandbox.window.FARM_MOTION.items;

test('all 36 runtime species reference complete PNG frames and valid timed clips',()=>{
 assert.equal(items.length,36);
 for(const item of items){
  for(const f of item.frames){const bytes=fs.readFileSync(new URL(f.file,import.meta.url));assert.equal(bytes.subarray(1,4).toString(),'PNG',f.file);assert.equal(bytes.readUInt32BE(16),f.width,f.file);assert.equal(bytes.readUInt32BE(20),f.height,f.file);assert.ok(f.pivotX>=0&&f.pivotX<=f.width&&f.pivotY>=0&&f.pivotY<=f.height);}
  for(const [name,clip] of Object.entries(item.clips)){assert.equal(clip.frames.length,clip.durations.length,item.id+name);for(const frame of clip.frames)assert.ok(item.frames[frame],item.id+name);assert.ok(clip.durations.every(d=>d>0&&Number.isFinite(d)));}
 }
});
test('ambient creature playback stays in idle poses for a full 20-second cycle',()=>{
 for(const item of items.filter(i=>i.kind==='creature')){const allowed=new Set(item.clips.idle.frames);for(let clock=1;clock<=20000;clock+=37)assert.ok(allowed.has(idleFrameAt(item,clock,'c:0')),item.id+': '+clock);assert.equal(idleFrameAt(item,0),item.clips.idle.frames[0]);}
});
test('care and eating reach every authored frame before their event ends',()=>{
 for(const item of items.filter(i=>i.kind==='creature'))for(const name of ['care','eat']){if(!item.clips[name])continue;const runtime=createAnimationRuntime();const event=runtime.animate(name,{species:item.id},1000);let elapsed=0;for(let n=0;n<item.clips[name].frames.length;n++){assert.ok(elapsed<event.duration);assert.equal(animationFrameAt(item,name,elapsed).frame,item.clips[name].frames[n]);elapsed+=item.clips[name].durations[n];}assert.equal(runtime.active(event.endsAt+1).length,0);}
});
test('reduced-motion action feedback is still removed by the real timeline',()=>{
 const runtime=createAnimationRuntime();runtime.setClock(1000);runtime.animate('care',{species:'mooncalf'});assert.equal(runtime.active(1500,{reducedMotion:true})[0].elapsed,0);assert.equal(runtime.active(4000,{reducedMotion:true}).length,0);assert.equal(runtime.events().length,0);
});
test('all two-angle decorations (6 store, 30 special, 5 festival) use the same animation phase and dimensions',()=>{
 const data=JSON.parse(fs.readFileSync(new URL('./decor-assets-manifest.json',import.meta.url)));let count=0;
 for(const asset of data.items.filter(a=>a.rightFrames)){count++;assert.equal(asset.frames.length,asset.rightFrames.length);for(let t=1;t<5000;t+=71){const left=decorFrameAt(asset,t,{seed:asset.id}),right=decorFrameAt(asset,t,{seed:asset.id,facing:'right'});assert.equal(left.index,right.index);assert.equal(right.file,asset.rightFrames[left.index]);}}
 assert.equal(count,41);
});
