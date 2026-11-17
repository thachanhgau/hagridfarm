import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {POND_ART} from './pond-art.mjs';
import {HD_ART} from './hd-art.mjs';
import {itemArtSpec} from './flow-item-ui.mjs';
import {EVENT_PRODUCTS} from './special-products.mjs';
import {axisLineEvidence} from './isometric-art-validation.mjs';
const sharp=createRequire(import.meta.url)(process.env.SHARP_MODULE||'/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const read=f=>fs.readFile(new URL(f,import.meta.url));
const hash=b=>createHash('sha256').update(b).digest('hex');
test('rare fish masters, HD, native and inventory lookup agree; aquarium stays a two-facing event gift',async()=>{
 const source=JSON.parse(await read('masters-items/rare-fish/provenance.json'));
 const receipt=JSON.parse(await read('masters-items/rare-fish/export-receipt.json'));
 assert.equal(source.records.length,8);assert.equal(receipt.frames.length,8);
 const unique=new Set();
 for(const record of source.records)assert.equal(hash(await read(record.master)),record.sha256);
 for(const frame of receipt.frames){
  const png=await read(frame.file),hd=HD_ART[frame.file];
  assert.equal(hash(png),frame.sha256);unique.add(frame.sha256);
  assert.equal(hd.density,2);assert.equal(hd.file,frame.hd);
  const meta=await sharp(await read(hd.file)).metadata();assert.equal(meta.width,frame.width*2);assert.equal(meta.height,frame.height*2);
  const raw=await sharp(png).ensureAlpha().raw().toBuffer();
  for(let p=3;p<raw.length;p+=4)assert.ok(raw[p]===0||raw[p]===255);
  const expected=await sharp(await read(hd.file)).ensureAlpha().resize(frame.width,frame.height,{kernel:'lanczos3'}).raw().toBuffer();
  for(let p=3;p<expected.length;p+=4){if(expected[p]<128)expected.fill(0,p-3,p+1);else expected[p]=255;}
  assert.ok(raw.equals(expected),'native must be rebuilt from HD: '+frame.id);
  if(frame.id.startsWith('rarefish_')){
   assert.equal(itemArtSpec(frame.id).file,frame.file);assert.equal(POND_ART[frame.id].pivotY,56);
   assert.ok(frame.bounds.w<=40&&frame.bounds.h<=30);assert.equal(frame.width,64);assert.equal(frame.height,64);
  }
 }
 assert.equal(unique.size,8);
 const gift=EVENT_PRODUCTS.find(i=>i.id==='ev_fish_tank');assert.ok(gift.reward);assert.equal(gift.forSale,false);assert.deepEqual(gift.footprint,[2,2]);
 const {items}=JSON.parse(await read('decor-assets-manifest.json')),tank=items.find(i=>i.id===gift.id);
 assert.equal(tank.collection,'event');assert.equal(tank.storeItem,false);assert.deepEqual(tank.angles,['default','right']);
 for(const [file,rects]of [[tank.file,tank.atlasRects],[tank.rightFile,tank.rightAtlasRects]]){
  const rect=rects[0];assert.ok(HD_ART[tank.frames[0]]);
  const crop=await sharp(await read(tank.frames[0])).extract({left:rect.x,top:rect.y,width:rect.w,height:rect.h}).raw().toBuffer();
  assert.ok(crop.equals(await sharp(await read(file)).raw().toBuffer()));
 }
});
test('both aquarium facings retain 2:1 beams and base edges within one native pixel',async()=>{
 for(const facing of ['','_right']){
  const data=await sharp(await read(`decor-assets/native/ev_fish_tank${facing}.png`)).raw().toBuffer();
  for(const [start,end,axis,bottom]of [[18,52,'row',false],[76,110,'column',false],[18,52,'column',true],[76,110,'row',true]]){
   const observed=[];
   for(let x=start;x<=end;x++){
    let y=bottom?159:0;while(y>=0&&y<160&&!data[(y*128+x)*4+3])y+=bottom?-1:1;
    observed.push([x,y]);
   }
   assert.ok(axisLineEvidence(observed,axis).maxDistance<=1,`${facing}/${axis}/${bottom?'base':'beam'} exceeds raster tolerance`);
  }
 }
});
