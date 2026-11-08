import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {SHORE_THICKETS,pondWoodlandObjects} from './pond-woodland.mjs';
import {pondBedRects} from './default-decor.mjs';
import {SPRITE_PALETTE} from './palette.mjs';
const sharp=createRequire(import.meta.url)('/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
test('woodland roots keep the lake, all ten paddies and south approach clear',()=>{
 const protectedRects=[{c0:16,c1:25,r0:-11.5,r1:-5.5},...pondBedRects(null,[],10),{c0:19.5,c1:21.5,r0:-5.5,r1:0}];
 for(const [col,row]of SHORE_THICKETS)for(const r of protectedRects)assert.ok(col+1<=r.c0||col-1>=r.c1||row+1<=r.r0||row-1>=r.r1);
 const objects=pondWoodlandObjects((c,r)=>[c*32-r*32,c*16+r*16]);
 assert.equal(objects.length,6);assert.equal(new Set(objects.map(o=>o.id)).size,6);
 assert.ok(objects.every(o=>o.asset.noSnowCap&&o.asset.width===160));
});
test('retained woodland art has matching seasonal canvases, native palette and binary alpha',async()=>{
 const p=JSON.parse(await fs.readFile(new URL('environment/pond/masters/woodland-20261108/provenance.json',import.meta.url),'utf8'));
 const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),palette=new Set(SPRITE_PALETTE.map(h=>parseInt(h.slice(1),16)));
 assert.equal(hash(await fs.readFile(new URL(p.master,import.meta.url))),p.sha256);
 for(const [i,o]of p.outputs.entries()){
  const bytes=await fs.readFile(new URL(o.file,import.meta.url));assert.equal(hash(bytes),o.sha256);
  const {data,info}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  assert.deepEqual([info.width,info.height],[o.width,o.height]);
  for(let n=0;n<data.length;n+=4){assert.ok(data[n+3]===0||data[n+3]===255);if(data[n+3])assert.ok(palette.has((data[n]<<16)|(data[n+1]<<8)|data[n+2]));}
  if(i>=2)assert.deepEqual([o.width,o.height,o.pivotX,o.pivotY],['width','height','pivotX','pivotY'].map(k=>p.outputs[i-2][k]));
 }
});
