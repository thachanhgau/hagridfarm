import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),sharp=require(process.env.SHARP_MODULE||'/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=new URL('./',import.meta.url),read=p=>fs.readFile(new URL(p,root));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
test('aquatic bed shares the garden palette, binary alpha and a coarse two-pixel grid',async()=>{
 const {SPRITE_PALETTE}=await import('./palette.mjs');
 const colors=new Set(SPRITE_PALETTE.map(h=>parseInt(h.slice(1),16)));
 const {data,info}=await sharp(await read('environment/pond/pond-bed.png')).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 assert.equal(info.width,128);assert.equal(info.height,88);
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){
  const p=(y*info.width+x)*4,a=data[p+3];assert.ok(a===0||a===255,'soft alpha edge');
  if(a)assert.ok(colors.has((data[p]<<16)|(data[p+1]<<8)|data[p+2]),'painted color outside sprite palette');
  const origin=((y-y%2)*info.width+x-x%2)*4;
  assert.ok(data.subarray(p,p+4).equals(data.subarray(origin,origin+4)),'pixel grid finer than surrounding art');
 }
});
test('refreshed creature sprites retain all five clips, transparent margins, provenance and exact atlas pixels',async()=>{
 const provenance=JSON.parse(await read('creature-motion-assets/masters/refresh-20261108/provenance.json'));
 const {items}=JSON.parse(await read('creature-motion-assets/pond-creatures.json'));
 assert.equal(items.length,6);
 for(const record of provenance.records)assert.equal(hash(await read(record.master)),record.sha256,record.id);
 for(const item of items)for(const view of ['left','right']){
  const atlas=await read(item.runtimeAtlases[view].file);
  assert.equal(item.frames[view].length,20,item.id);
  for(const [name,clip]of Object.entries(item.clips)){
   assert.equal(clip.frames.length,4);
   assert.equal(new Set(clip.frames.map(i=>item.frames[view][i].sha256)).size,4,`${item.id}/${view}/${name} must animate`);
  }
  for(const [i,frame]of item.frames[view].entries()){
   const bytes=await read('creature-motion-assets/'+frame.file);
   assert.equal(hash(bytes),frame.sha256);
   assert.ok(!frame.bounds.edge&&frame.bounds.count>40,`${item.id}/${view}/${i} clipped or absent`);
   const a=await sharp(atlas).extract(item.runtimeAtlases[view].frames[i].atlasRect&&{
    left:item.runtimeAtlases[view].frames[i].atlasRect.x,top:item.runtimeAtlases[view].frames[i].atlasRect.y,width:frame.width,height:frame.height
   }).ensureAlpha().raw().toBuffer();
   assert.ok(a.equals(await sharp(bytes).ensureAlpha().raw().toBuffer()),'atlas differs from pose');
  }
 }
});
