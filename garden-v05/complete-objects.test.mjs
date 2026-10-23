import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {COMPLETE_SCENERY,HABITAT_ART,KEEPSAKE_ART,completeObjectFiles} from './complete-object-art.mjs';
import {CREATURE} from './progression-engine.mjs';
import {SPRITE_PALETTE} from './palette.mjs';
const require=createRequire(import.meta.url),sharp=require(process.env.SHARP_MODULE||'/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const read=file=>fs.readFile(new URL(file,import.meta.url));
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const manifest=JSON.parse(await read('complete-objects-manifest.json'));
test('authored scenery, habitat props and species statuettes cover the whole backlog',()=>{
 assert.deepEqual(COMPLETE_SCENERY.map(i=>i.id).sort(),['gardener_friend','herbology_greenhouse','owl_post']);
 assert.deepEqual(Object.keys(HABITAT_ART).sort(),Object.keys(CREATURE).sort());
 assert.deepEqual(Object.keys(KEEPSAKE_ART).sort(),Object.keys(CREATURE).sort());
 assert.equal(completeObjectFiles().length,36);assert.equal(new Set(completeObjectFiles()).size,36);
 assert(COMPLETE_SCENERY.every(i=>i.frames.length===4));
});
test('new native sprites retain master provenance, exact palette, alpha and safe grounded geometry',async()=>{
 const palette=new Set(SPRITE_PALETTE.map(hex=>parseInt(hex.slice(1),16))),identities=new Map();
 for(const item of manifest.items){
  assert.equal(hash(await read(item.master)),item.masterSha256,item.id);assert(item.prompt.length>100);
  const poses=new Set();
  for(const frame of item.frameRecords){
   const png=await read(frame.file);assert.equal(hash(png),frame.sha256,frame.file);
   const {data,info}=await sharp(png).ensureAlpha().raw().toBuffer({resolveWithObject:true});
   assert.equal(info.width,frame.width);assert.equal(info.height,frame.height);
   let bottom=0;
   for(let p=0;p<data.length;p+=4){const a=data[p+3];assert(a===0||a===255);if(!a)continue;const x=(p/4)%info.width,y=Math.floor(p/4/info.width);assert(x>0&&y>0&&x<info.width-1&&y<info.height-1,frame.file);bottom=Math.max(bottom,y+1);assert(palette.has((data[p]<<16)|(data[p+1]<<8)|data[p+2]),frame.file);}
   assert.equal(bottom,item.id==='herbology_greenhouse'?142:frame.pivotY,frame.file);
   const trimmed=await sharp(png).extract({left:frame.bounds.x,top:frame.bounds.y,width:frame.bounds.w,height:frame.bounds.h}).raw().toBuffer();poses.add(hash(trimmed));
   const old=identities.get(frame.sha256);assert(!old||old===item.id,'different identities share pixels');identities.set(frame.sha256,item.id);
  }
  assert.equal(poses.size,item.frames.length,item.id+' poses repeat beyond translation');
  if(item.kind==='habitat')assert(item.bounds.w<=36&&item.bounds.h<=28,item.id);
  if(item.kind==='keepsake')assert(item.bounds.w<=44&&item.bounds.h<=44,item.id);
 }
});
