import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {createRequire}from 'node:module';
import {CATALOG_ART}from './catalog-art.mjs';
import {SPRITE_PALETTE}from './palette.mjs';
const sharp=createRequire(import.meta.url)(process.env.SHARP_MODULE||'/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const read=p=>fs.readFile(new URL(p,import.meta.url)),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
test('catalog additions have distinct authored pixels, binary alpha and retained masters',async()=>{
 const p=JSON.parse(await read('masters-items/catalog-completion-20261108/provenance.json')),colors=new Set(SPRITE_PALETTE.map(c=>parseInt(c.slice(1),16))),hashes=[];
 assert.equal(Object.keys(CATALOG_ART).length,14);
 for(const asset of p.assets){assert.equal(hash(await read(asset.master)),asset.sha256);
  for(const out of asset.outputs){const bytes=await read(out.file);assert.equal(hash(bytes),out.sha256);
   const {data,info}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
   for(let i=0;i<data.length;i+=4){assert.ok(data[i+3]===0||data[i+3]===255);if(data[i+3])assert.ok(colors.has((data[i]<<16)|(data[i+1]<<8)|data[i+2]));}
   if(asset.id!=='pasture-floor'){assert.deepEqual([info.width,info.height],[64,64]);hashes.push(hash(bytes));}
  }
 }
 assert.equal(new Set(hashes).size,14);
});
