import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';

import {DB} from './progression-engine.mjs?v=24.9.65';
import {ITEM_ART} from './item-art.mjs?v=24.9.67';
import {drawPenShelter,penArt,penFiles,penShelterFrame} from './pen-art.mjs?v=24.9.67';

const iso=(col,row)=>[1120+(col-row)*32,300+(col+row)*16];

test('all six pen art records are unique, present and sized for small or large residents',()=>{
 const pens=DB.expansions.filter(({kind})=>kind==='pen');
 assert.equal(pens.length,6);
 const records=pens.map(({id})=>penArt(id));
 assert.equal(new Set(records.map(record=>record?.file)).size,6);
 assert.equal(new Set(penFiles()).size,6);
 const hashes=[];
 for(const [index,{id}] of pens.entries()){
  const art=records[index];
  assert.equal(art,ITEM_ART[id]);
  assert.ok(art?.file,`missing authored pen art ${id}`);
  const large=index>=3;
  assert.deepEqual([art.width,art.height,art.pivotX,art.pivotY],large?[160,144,80,128]:[128,112,64,96],id);
  assert.ok(art.bounds?.w<=(large?144:112)&&art.bounds?.h<=(large?112:88),`${id} shelter bounds exceed target`);
  const fileUrl=new URL(art.file,import.meta.url);
  assert.ok(fs.existsSync(fileUrl),`${id} file missing`);
  hashes.push(createHash('sha256').update(fs.readFileSync(fileUrl)).digest('hex'));
 }
 assert.equal(new Set(hashes).size,6,'pen art files must not be exact byte duplicates');
});

test('shelter frame stays on the fixed rear anchor and expands cache bounds to alpha',()=>{
 const pen={id:'pen_1',col:27,row:0,width:5,height:3};
 const art={file:'native-items/pen_1.png',width:96,height:96,pivotX:48,pivotY:80,bounds:{x:6,y:20,w:84,h:68}};
 const frame=penShelterFrame(pen,iso,art);
 assert.deepEqual([frame.x,frame.y],iso(29.5,.39).map(Math.round));
 assert.deepEqual(frame.alphaBounds,{left:frame.x-42,top:frame.y-60,right:frame.x+42,bottom:frame.y+8});
 const corners=[[27,0],[32,0],[32,3],[27,3]].map(([col,row])=>iso(col,row));
 const base={left:Math.floor(Math.min(...corners.map(([x])=>x)))-20,top:Math.floor(Math.min(...corners.map(([,y])=>y)))-20,right:Math.ceil(Math.max(...corners.map(([x])=>x)))+20,bottom:Math.ceil(Math.max(...corners.map(([,y])=>y)))+20};
 const cacheArt={...art,bounds:{x:6,y:0,w:84,h:68}};
 const cacheFrame=penShelterFrame(pen,iso,cacheArt);
 const expanded={left:Math.floor(Math.min(base.left,cacheFrame.alphaBounds.left)),top:Math.floor(Math.min(base.top,cacheFrame.alphaBounds.top)),right:Math.ceil(Math.max(base.right,cacheFrame.alphaBounds.right)),bottom:Math.ceil(Math.max(base.bottom,cacheFrame.alphaBounds.bottom))};
 assert.equal(expanded.top,cacheFrame.alphaBounds.top);
 assert.deepEqual({left:expanded.left,top:expanded.top,right:expanded.right,bottom:expanded.bottom},{left:base.left,top:cacheFrame.alphaBounds.top,right:base.right,bottom:base.bottom});
 const calls=[];
 assert.equal(drawPenShelter({drawImage:(...args)=>calls.push(args)},{},frame),true);
 assert.deepEqual(calls,[[{},frame.x-frame.pivotX,frame.y-frame.pivotY,96,96]]);
});

test('scene preloads pen shelter files before drawing the cached habitat layer',()=>{
 const source=fs.readFileSync(new URL('./scene-renderer.mjs',import.meta.url),'utf8');
 assert.match(source,/\.\.\.penFiles\(\),/);
 assert.match(source,/brush\.translate\(-left,-top\);[\s\S]*drawPenShelter\(brush,shelterImage,shelter\);[\s\S]*drawHabitatProps\(/);
 assert.doesNotMatch(source,/drawPenShelter\(brush,shelterImage,shelter,\s*-left/,'cache coordinates are translated once');
});
