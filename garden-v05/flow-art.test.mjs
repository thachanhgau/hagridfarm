import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {SPRITE_PALETTE} from './palette.mjs';
import {DB} from './balance-data.mjs';
import {FLOW_ITEM_ART} from './flow-item-art.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
const sharp=createRequire(import.meta.url)('/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const read=file=>fs.readFileSync(path.join(root,file));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const palette=new Set(SPRITE_PALETTE.map(h=>h.slice(1).match(/../g).map(v=>parseInt(v,16)).join(',')));

test('harvest representation covers every crop and preserves material identities',()=>{
 assert.equal(Object.keys(FLOW_ITEM_ART).filter(k=>k.startsWith('harvest_')).length,32);
 for(const crop of DB.crops)assert.ok(FLOW_ITEM_ART['harvest_'+crop.id]?.file,crop.id);
 assert.ok(FLOW_ITEM_ART.produce_thestral?.file);
 assert.ok(FLOW_ITEM_ART['produce_three-headed-dog']?.file);
 assert.equal(DB.animals.find(a=>a.id==='three-headed-dog').produce,'Sợi lông trắng Chó ba đầu');
});

test('authored native flow outputs preserve palette, alpha, provenance and atlas pixels',async()=>{
 const manifest=JSON.parse(read('flow-art-manifest.json'));
 const outputs=[];
 for(const item of manifest.items){
  assert.equal(hash(read(item.master)),item.masterSha256,item.id+' master');
  outputs.push(...(item.kind==='crop'?item.frames:[item]));
  if(item.kind!=='crop')continue;
  assert.equal(item.frames.length,item.id==='flitterbloom'?13:14,item.id);
  const atlas=await sharp(read(item.atlas.file)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  for(let i=4;i<item.frames.length;i++){
   const frame=item.atlas.frames[i-4],rect=frame.atlasRect;
   const extracted=await sharp(read(item.atlas.file)).extract({left:rect.x,top:rect.y,width:rect.w,height:rect.h}).ensureAlpha().raw().toBuffer();
   assert.ok(extracted.equals(await sharp(read(item.frames[i].file)).ensureAlpha().raw().toBuffer()),item.id+' atlas '+i);
   assert.ok(atlas.info.width>=rect.x+rect.w&&atlas.info.height>=rect.y+rect.h);
  }
 }
 const hashes=new Map();
 for(const output of outputs){
  const bytes=read(output.file);assert.equal(hash(bytes),output.sha256,output.file);
  const {data,info}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  assert.equal(info.width,64);assert.ok([64,96].includes(info.height));
  for(let i=0;i<data.length;i+=4){const a=data[i+3];assert.ok(a===0||a===255);if(!a)continue;assert.ok(palette.has(`${data[i]},${data[i+1]},${data[i+2]}`),output.file);const x=i/4%info.width,y=Math.floor(i/4/info.width);assert.ok(x>0&&y>0&&x<info.width-1&&y<info.height-1,output.file);}
  if(output.file.includes('harvest_')){assert.ok(output.bounds.w<=40&&output.bounds.h<=40);assert.equal(hashes.has(hash(bytes)),false,'different harvested ingredients must have distinct pixels');hashes.set(hash(bytes),output.file);}
 }
});

test('effective crop bootstrap uses all authored growth, idle and action frames',()=>{
 const box={window:{}};vm.createContext(box);
 for(const file of ['motion-data.js','level-assets.js','motion-care-data.js','motion-idle-data.js','crop-complete-data.js','flow-crop-data.js'])vm.runInContext(read(file).toString(),box);
 for(const id of ['bubotuber','mimbulus','flitterbloom']){
  const crop=box.window.FARM_MOTION.items.find(i=>i.id===id);
  assert.equal(crop.__authoredFlowArt,true,id);assert.equal(crop.frames.length,id==='flitterbloom'?13:14);
  for(const clip of ['growth','idle','action'])for(const frame of crop.clips[clip].frames)assert.ok(crop.frames[frame]?.file,id+'/'+clip);
  assert.equal(crop.frames[3].atlasRect,undefined,'seed/crop UI keeps a standalone growth sprite');
 }
});
