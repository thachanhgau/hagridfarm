import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {POND_SPECIES} from './progression-engine.mjs';
import {SPRITE_PALETTE} from './palette.mjs';
import {SUBMERGED_CREATURE_ART,submergedCreatureFrame} from './pond-creature-art.mjs';
const require=createRequire(import.meta.url),sharp=require(process.env.SHARP_MODULE||'/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const read=p=>fs.readFile(new URL(p,import.meta.url)),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
test('every water species has all submerged growth ages and a stationary idle in both views',()=>{
 assert.deepEqual(Object.keys(SUBMERGED_CREATURE_ART).sort(),[...POND_SPECIES].sort());
 for(const id of POND_SPECIES)for(const facing of ['default','right']){
  const frames=SUBMERGED_CREATURE_ART[id][facing==='right'?'right':'left'];assert.equal(frames.length,8);
  for(const stage of [0,1,2])for(const clock of [0,800,9000])assert.equal(submergedCreatureFrame(id,stage,clock,facing),frames[stage]);
  assert.equal(submergedCreatureFrame(id,3,0,facing),frames[3]);
  assert.equal(new Set([100,700,900,1100].map(t=>submergedCreatureFrame(id,3,t,facing))).size,4);
  for(const f of frames)assert.deepEqual([f.width,f.height,f.pivotX,f.pivotY],[128,96,64,64]);
 }
});
test('submerged master provenance, palette, alpha and atlas rectangles preserve the authored poses',async()=>{
 const provenance=JSON.parse(await read('creature-motion-assets/masters/submerged-20261108/provenance.json'));
 const palette=new Set(SPRITE_PALETTE.map(h=>parseInt(h.slice(1),16)));
 for(const spec of provenance.species){
  assert.equal(hash(await read(spec.master)),spec.masterSha256);
  for(const direction of ['left','right']){
   const bytes=await read(spec.atlases[direction].file);assert.equal(hash(bytes),spec.atlases[direction].sha256);
   for(const [i,frame]of SUBMERGED_CREATURE_ART[spec.id][direction].entries()){
    const r=frame.atlasRect,raw=await sharp(bytes).extract({left:r.x,top:r.y,width:r.w,height:r.h}).ensureAlpha().raw().toBuffer();
    const original=await read(spec.frames[direction][i].file);assert.equal(hash(original),spec.frames[direction][i].sha256);
    assert.ok(raw.equals(await sharp(original).ensureAlpha().raw().toBuffer()),'packed pixels differ');
    assert.ok(!frame.bounds.edge&&frame.bounds.count>40);
    for(let p=0;p<raw.length;p+=4){assert.ok(raw[p+3]===0||raw[p+3]===255);if(raw[p+3])assert.ok(palette.has((raw[p]<<16)|(raw[p+1]<<8)|raw[p+2]));}
   }
  }
 }
});
