import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {SPRITE_PALETTE} from './palette.mjs';
import {WINTER_ART} from './garden-winter.mjs';
const require=createRequire(import.meta.url),sharp=require(process.env.SHARP_MODULE||'/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const read=p=>fs.readFile(new URL(p,import.meta.url)),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
test('expansion winter artwork retains matching canvases, native pixel scale, palette and provenance',async()=>{
 const p=JSON.parse(await read('environment/winter/masters/expansion-20261108/provenance.json'));
 const palette=new Set([...SPRITE_PALETTE,'#E8F0ED'].map(h=>parseInt(h.slice(1),16)));
 assert.equal(p.assets.length,6);
 for(const asset of p.assets){
  assert.equal(hash(await read(asset.master)),asset.masterSha256);
  const bytes=await read(asset.file);assert.equal(hash(bytes),asset.sha256);
  const {data,info}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  assert.deepEqual([info.width,info.height],[asset.width,asset.height]);
  for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){
   const i=(y*info.width+x)*4,a=data[i+3];assert.ok(a===0||a===255,'soft alpha');
   if(a)assert.ok(palette.has((data[i]<<16)|(data[i+1]<<8)|data[i+2]),'off-palette');
   const j=((y-y%2)*info.width+x-x%2)*4;assert.ok(data.subarray(i,i+4).equals(data.subarray(j,j+4)),'inconsistent pixel scale');
  }
 }
 for(const [base,winter]of Object.entries(WINTER_ART)){
  const [a,b]=await Promise.all([sharp(await read(base)).metadata(),sharp(await read(winter)).metadata()]);
  assert.deepEqual([a.width,a.height],[b.width,b.height],winter+' changes scene geometry');
 }
});
