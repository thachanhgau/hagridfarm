import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import vm from 'node:vm';import crypto from 'node:crypto';import {createRequire} from 'node:module';import {creatureView} from './creature-view.mjs';
const require=createRequire(import.meta.url),sharp=require(process.env.SHARP_MODULE||'/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const read=file=>fs.readFile(new URL(file,import.meta.url)),hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const crop=JSON.parse(await read('crop-complete-manifest.json')),creature=JSON.parse(await read('creature-motion-assets/manifest.json'));
const box={window:{}};vm.createContext(box);for(const file of ['motion-data.js','level-assets.js','motion-care-data.js','motion-idle-data.js','crop-complete-data.js','creature-motion-data.js'])vm.runInContext((await read(file)).toString(),box,{filename:file});
test('all32 crops have distinct authored idle/action and all12 creatures have full clips in both views',async()=>{
 assert.equal(crop.items.length,26);assert.equal(crop.items.reduce((n,i)=>n+i.frames.length,0),258);
 assert.equal(box.window.FARM_CREATURE_MOTION_STATUS.complete,true);
 const plants=box.window.FARM_MOTION.items.filter(i=>i.kind==='crop'),animals=box.window.FARM_MOTION.items.filter(i=>i.kind==='creature');assert.equal(plants.length,32);assert.equal(animals.length,12);
 for(const item of plants){assert(new Set(item.clips.idle.frames).size>=2,item.id+' idle');assert(new Set(item.clips.action.frames).size>=4,item.id+' action');}
 for(const base of animals)for(const facing of ['default','right']){const item=creatureView(base,facing);if(facing==='right'){assert.notEqual(item,base);assert.equal(item.direction,'right-authored');assert.equal(item.clips.growth.frames.length,4);}for(const name of ['idle','action','eat','care']){const clip=item.clips[name];assert(clip&&new Set(clip.frames).size>=(name==='idle'?2:4),`${base.id}/${facing}/${name}`);assert(clip.frames.every(index=>item.frames[index]),'clip points at missing frame');}}
 const before=animals.map(i=>i.frames.length);box.window.FARM_CREATURE_MOTION_APPLY();assert.deepEqual(animals.map(i=>i.frames.length),before,'apply must be idempotent');
});
test('crop masters/poses have provenance and true geometry changes beyond translation',async()=>{
 for(const item of crop.items){assert.equal(hash(await read(item.master)),item.masterSha256);assert.equal(hash(await read(item.baseFrame)),item.baseFrameSha256);assert(item.prompt.length>100);for(const list of [item.frames.slice(0,item.idleCount),item.frames.slice(item.idleCount)]){const shapes=new Set();for(const frame of list){const png=await read(frame.file);assert.equal(hash(png),frame.sha256);assert.equal(frame.bounds.y+frame.bounds.h,80);const raw=await sharp(png).extract({left:frame.bounds.x,top:frame.bounds.y,width:frame.bounds.w,height:frame.bounds.h}).ensureAlpha().raw().toBuffer();shapes.add(hash(raw));}assert.equal(shapes.size,list.length,item.id+' repeats a translated frame');}}
});
test('motion atlases retain the exact native RGBA of every crop and creature frame',async()=>{
 const groups=crop.items.map(item=>({atlas:item.atlas,source:item.frames}));
 for(const item of creature.items){groups.push({atlas:item.runtimeAtlases.right,source:[...item.rightGrowth.frames,...item.frames].map(f=>({...f,file:'creature-motion-assets/'+f.file}))});if(item.leftActions)groups.push({atlas:item.runtimeAtlases.left,source:item.leftActions.frames.map(f=>({...f,file:'creature-motion-assets/'+f.file}))});}
 for(const group of groups){const atlas=await read(group.atlas.file);assert.equal(hash(atlas),group.atlas.sha256);for(const [i,frame]of group.source.entries()){const r=group.atlas.frames[i].atlasRect,a=await sharp(atlas).extract({left:r.x,top:r.y,width:r.w,height:r.h}).ensureAlpha().raw().toBuffer(),b=await sharp(await read(frame.file)).ensureAlpha().raw().toBuffer();assert(a.equals(b),frame.file+' atlas alters source pixels');}}
});
test('all newly authored creature growth/actions retain source provenance and grounded binary-alpha frames',async()=>{
 for(const item of creature.items)for(const extra of [item.rightGrowth,item.leftActions].filter(Boolean)){assert.equal(hash(await read(extra.master)),extra.masterSha256);assert(extra.prompt.length>100);for(const frame of extra.frames){const png=await read('creature-motion-assets/'+frame.file);assert.equal(hash(png),frame.sha256);assert.equal(frame.clippedPixels,0);assert.equal(frame.bounds.y+frame.bounds.h,frame.pivotY);const {data}=await sharp(png).ensureAlpha().raw().toBuffer({resolveWithObject:true});for(let i=3;i<data.length;i+=4)assert(data[i]===0||data[i]===255);}}
});
