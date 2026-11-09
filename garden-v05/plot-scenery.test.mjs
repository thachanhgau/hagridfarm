import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {PLOT_SCENERY_ART} from './plot-scenery-art.mjs';
import {WINTER_ART} from './garden-winter.mjs';
import {SPRITE_PALETTE} from './palette.mjs';
const sharp=createRequire(import.meta.url)('/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
test('fourteen distinct pocket props retain authored normal/snow artwork and safe native pixels',async()=>{
 const read=p=>fs.readFile(new URL(p,import.meta.url)),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
 const p=JSON.parse(await read('environment/masters/plot-variety-20261109/provenance.json')),seen=new Set(),palette=new Set(SPRITE_PALETTE.map(h=>parseInt(h.slice(1),16)));
 assert.equal(Object.keys(PLOT_SCENERY_ART).length,14);
 for(const sheet of p.assets){assert.equal(hash(await read(sheet.master)),sheet.sha256);
  for(const o of sheet.outputs){
   const png=await read(o.file);assert.equal(hash(png),o.sha256);assert.ok(!seen.has(o.sha256));seen.add(o.sha256);
   const {data,info}=await sharp(png).ensureAlpha().raw().toBuffer({resolveWithObject:true});assert.deepEqual([info.width,info.height],[64,80]);
   let bottom=0;for(let n=0;n<data.length;n+=4){assert.ok(data[n+3]===0||data[n+3]===255);if(data[n+3]){assert.ok(palette.has((data[n]<<16)|(data[n+1]<<8)|data[n+2]));bottom=Math.max(bottom,Math.floor(n/4/64)+1);}}
   assert.equal(bottom,74);if(o.snow)assert.equal(WINTER_ART[PLOT_SCENERY_ART['scene_'+o.id].file],o.file);
  }
 }
 assert.equal(seen.size,28);
});
