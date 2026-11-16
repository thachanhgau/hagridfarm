import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {HD_ART} from '../garden-v05/hd-art.mjs';
import {SPRITE_PALETTE} from '../garden-v05/palette.mjs';
import {CREATURE_SLEEP_ART} from '../garden-v05/creature-sleep-art.mjs';
import {CREATURE} from '../garden-v05/progression-engine.mjs';
import {DECOR_LIGHT_POINTS} from '../garden-v05/decor-light-points.mjs';
const sharp=createRequire(import.meta.url)('/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp'),root='garden-v05/',manifest=JSON.parse(await fs.readFile(root+'creature-sleep-art.json')),hash=b=>createHash('sha256').update(b).digest('hex'),palette=new Set(SPRITE_PALETTE.map(h=>parseInt(h.slice(1),16))),records=[];
assert.deepEqual(Object.keys(CREATURE_SLEEP_ART).sort(),Object.keys(CREATURE).sort());
for(const item of manifest.items){assert.equal(hash(await fs.readFile(root+item.master)),item.masterSha256);for(const frame of item.frameRecords){
 const bytes=await fs.readFile(root+frame.file);assert.equal(hash(bytes),frame.sha256);const a=CREATURE_SLEEP_ART[item.id][frame.age],hd=HD_ART[frame.file];assert.ok(hd,'selected genuine HD '+frame.file);
 for(const [file,d]of [[frame.file,1],[hd.file,2]]){const {data,info}=await sharp(root+file).ensureAlpha().raw().toBuffer({resolveWithObject:true});assert.deepEqual([info.width,info.height],[frame.width*d,frame.height*d]);let last=-1;for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){const i=(y*info.width+x)*4;assert.ok(data[i+3]===0||data[i+3]===255);if(data[i+3]){assert.ok(palette.has(data.readUIntBE(i,3)));assert.ok(x>0&&x<info.width-1&&y>0&&y<info.height-1);last=y;}}assert.ok(Math.abs(last+1-frame.pivotY*d)<=1,'body grounded at original native pivot');}
 assert.equal(a.bounds.y+a.bounds.h,a.pivotY);records.push({species:item.id,age:frame.age,native:frame.file,hd:hd.file,pivot:[a.pivotX,a.pivotY],bounds:a.bounds});
}}
const previousText=execFileSync('git',['show','7c88275:garden-v05/hd-art.mjs'],{encoding:'utf8'}),previous=JSON.parse(previousText.slice(previousText.indexOf('{'),previousText.lastIndexOf('}')+1));for(const [key,value]of Object.entries(previous))assert.deepEqual(HD_ART[key],value,'existing HD selection preserved '+key);
const result={species:manifest.items.length,ageVariants:records.length,lightingFamilies:Object.keys(DECOR_LIGHT_POINTS).length,lightingCells:Object.values(DECOR_LIGHT_POINTS).reduce((n,a)=>n+a.default.length+a.right.length,0),previousHDSelectionsPreserved:Object.keys(previous).length,records,camera:'Frozen64x32 logical grid, unchanged growth-age canvases and pivots, uniform source crop, no affine skew. Organic sleeping anatomy visually reviewed; no fabricated straight-edge certification.',errors:[]};await fs.mkdir('docs/nightlife-20261116',{recursive:true});await fs.writeFile('docs/nightlife-20261116/art-proof.json',JSON.stringify(result,null,2)+'\n');console.log({species:result.species,ageVariants:records.length,lightingFamilies:result.lightingFamilies,oldHD:result.previousHDSelectionsPreserved});
