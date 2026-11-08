import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {SPRITE_PALETTE} from './palette.mjs';
import {EDGE_SCENERY} from './edge-art.mjs';
import {WINTER_ART} from './garden-winter.mjs';
const sharp=createRequire(import.meta.url)(process.env.SHARP_MODULE||'/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const read=p=>fs.readFile(new URL(p,import.meta.url));
test('authored orchard preserves tree anchors, crisp pixels and all seasonal growth states',async()=>{
 const manifest=JSON.parse(await read('environment/edge/masters/orchard-refresh-20261108/provenance.json'));
 assert.equal(manifest.assets.length,6);
 const palette=new Set([...SPRITE_PALETTE,'#E8F0ED'].map(c=>parseInt(c.slice(1),16)));
 for(const item of manifest.assets){
  assert.equal(crypto.createHash('sha256').update(await read(item.master)).digest('hex'),item.masterSha256);
  assert.equal(item.outputs.length,3);
  const hashes=[];
  for(const file of item.outputs){
   const bytes=await read(file);hashes.push(crypto.createHash('sha256').update(bytes).digest('hex'));
   const {data,info}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
   assert.deepEqual([info.width,info.height],[128,144]);
   let bottom=0;
   for(let y=0;y<144;y++)for(let x=0;x<128;x++){
    const i=(y*128+x)*4,origin=((y-y%2)*128+x-x%2)*4;
    assert.ok(data[i+3]===0||data[i+3]===255);
    assert.ok(data.subarray(i,i+4).equals(data.subarray(origin,origin+4)),'2px logical grid');
    if(data[i+3]){bottom=Math.max(bottom,y+1);assert.ok(palette.has((data[i]<<16)|(data[i+1]<<8)|data[i+2]));}
   }
   assert.equal(bottom,110,'roots meet the shared orchard ground');
   if(!item.id.endsWith('-snow')){
    assert.ok(WINTER_ART[file]);
    const id=file.split('/').at(-1).replace('.png',''),art=EDGE_SCENERY[id];
    assert.deepEqual([art.pivotX,art.pivotY],[64,126]);
   }
  }
  assert.equal(new Set(hashes).size,3,'growth and ripe fruit remain distinct');
 }
});
