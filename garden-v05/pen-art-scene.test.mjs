import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {penFencePieces,drawPenFence} from './garden-pen-details.mjs';
const iso=(col,row)=>[1120+(col-row)*32,300+(col+row)*16];
const pen={id:'pen_5',col:27,row:0,width:5,height:3};
test('enclosure closes all four edges with a west gate and low front rails',()=>{
 const pieces=penFencePieces(pen,iso);
 assert.deepEqual([...new Set(pieces.map(p=>p.edge))],[0,1,2,3]);
 assert.equal(pieces.filter(p=>p.gate).length,1);
 assert.equal(pieces.find(p=>p.gate).edge,3);
 assert.equal(pieces.filter(p=>p.front).length,8);
 for(const piece of pieces){
  const calls=[],ctx={fillRect:(x,y,w,h)=>calls.push({x,y,w,h})};
  drawPenFence(ctx,piece);
  assert.ok(calls.length>0);
  assert.ok(Math.min(...calls.map(c=>c.y))>=Math.min(piece.a[1],piece.b[1])-(piece.front?21:27));
 }
 const moved=penFencePieces({...pen,col:10,row:8},iso),delta=iso(10,8).map((v,i)=>v-iso(27,0)[i]);
 assert.deepEqual(moved.map(p=>[p.a,p.b]),pieces.map(p=>[p.a,p.b].map(a=>a.map((v,i)=>v+delta[i]))));
});
test('built pens use floor and perimeter fences without loading or drawing roofed shelters',()=>{
 const renderer=fs.readFileSync(new URL('./scene-renderer.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(renderer,/penShelter|drawPenShelter|penFiles|penArt\(/);
 assert.match(renderer,/for\(const piece of penFencePieces\(pen,iso\)\)drawPenFence\(brush,piece,activeWeather\)/);
 assert.doesNotMatch(renderer,/objects\.push\(\.\.\.penFencePieces/,'no rail may cover a small resident');
});
