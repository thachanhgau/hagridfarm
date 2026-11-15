import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {SPRITE_PALETTE} from './palette.mjs';
import {FESTIVAL_PRODUCTS} from './special-products.mjs';
const require=createRequire(import.meta.url),sharp=require('/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const read=file=>fs.readFile(new URL(file,import.meta.url));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
test('40 house Noël identities have distinct authored masters and native two-view palette sprites',async()=>{
 const {items}=JSON.parse(await read('./house-noel-assets/manifest.json'));
 assert.equal(items.length,40);
 assert.equal(new Set(items.map(item=>item.id)).size,40);
 assert.equal(new Set(items.map(item=>item.masterSha256)).size,40);
 for(const house of ['gryffindor','slytherin','hufflepuff','ravenclaw'])assert.equal(items.filter(i=>i.house===house).length,10);
 const colors=new Set(SPRITE_PALETTE.map(hex=>parseInt(hex.slice(1),16)));
 for(const item of items){
  assert.equal(sha(await read('./'+item.master)),item.masterSha256,item.id);
  const sprite=item.runtime,sale=FESTIVAL_PRODUCTS.find(other=>other.id===item.id);
  assert.deepEqual(sprite.footprintTiles,sale.footprint);
  assert.equal(sprite.house,sale.house);assert.equal(sale.house,item.house);
  assert.equal(sprite.width,(sale.footprint[0]+sale.footprint[1])*32);
  assert.equal(sprite.pivotX,sprite.width/2);
  assert.equal(sprite.pivotY,sprite.height-16);
  assert.equal(sprite.frames.length,4);assert.equal(sprite.rightFrames.length,4);
  assert.notEqual(item.frames[0].sha256,item.frames[2].sha256,'two authored views: '+item.id);
  for(const frame of item.frames){
   const bytes=await read('./'+frame.file);assert.equal(sha(bytes),frame.sha256);
   const {data,info}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
   assert.equal(info.width,sprite.width);assert.equal(info.height,sprite.height);
   for(let p=0;p<data.length;p+=4){assert.ok(data[p+3]===0||data[p+3]===255);if(data[p+3])assert.ok(colors.has((data[p]<<16)|(data[p+1]<<8)|data[p+2]),item.id);}
   assert.ok(frame.bounds.x>=4);assert.ok(frame.bounds.x+frame.bounds.w<=sprite.width-4);
   assert.ok(frame.bounds.h<=Math.min(sprite.width*2,224));
   assert.ok(Math.abs(frame.bounds.y+frame.bounds.h-sprite.pivotY)<=3,item.id+' foot stays within the grid guideline tolerance');
  }
 }
});

test('house pack actual measured straight base edges pass the fixed native tolerance',async()=>{
 const report=JSON.parse(await read('../docs/house-noel-native-axis-audit.json'));
 assert.equal(report.toleranceNativePixels,1);assert.ok(report.rows.length>=80);
 assert.deepEqual(report.rows.filter(row=>!row.passed).map(row=>[row.id,row.frame]),[]);
});
