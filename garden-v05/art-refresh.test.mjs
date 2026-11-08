import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),sharp=require(process.env.SHARP_MODULE||'/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=new URL('./',import.meta.url),read=p=>fs.readFile(new URL(p,root));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
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
    left:item.runtimeAtlases[view].frames[i].atlasRect.x,top:item.runtimeAtlases[view].frames[i].atlasRect.y,width:96,height:96
   }).ensureAlpha().raw().toBuffer();
   assert.ok(a.equals(await sharp(bytes).ensureAlpha().raw().toBuffer()),'atlas differs from pose');
  }
 }
});
