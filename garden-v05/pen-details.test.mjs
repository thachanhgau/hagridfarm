import test from 'node:test';
import assert from 'node:assert/strict';
import {drawPenHabitat,penDetailAnchors} from './garden-pen-details.mjs';
const record=()=>({calls:[],save(){},restore(){},fillRect(x,y,w,h){this.calls.push([x,y,w,h,this.fillStyle]);}});
const iso=(c,r)=>[1120+(c-r)*32,300+(c+r)*16];
const corners=p=>[[p.col,p.row],[p.col+p.width,p.row],[p.col+p.width,p.row+p.height],[p.col,p.row+p.height]].map(v=>iso(...v));
test('pen cosmetics remain deterministic, bounded and follow moved pen footprints',()=>{
 for(const weatherMode of ['clear','rain','autumn','snow']){
  const pen={id:'pen_1',col:27,row:0,width:5,height:3},before=JSON.stringify(pen),a=record(),b=record();
  drawPenHabitat(a,{corners:corners(pen),pen,iso,weatherMode});drawPenHabitat(b,{corners:corners(pen),pen,iso,weatherMode});
  assert.equal(JSON.stringify(pen),before);assert.deepEqual(a.calls,b.calls);assert.ok(a.calls.length>0);
  const points=corners(pen),xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
  for(const [x,y,w,h] of a.calls){assert.ok([x,y,w,h].every(Number.isInteger));assert.ok(x>=Math.min(...xs)-6&&x+w<=Math.max(...xs)+6);assert.ok(y>=Math.min(...ys)-13&&y+h<=Math.max(...ys)+7);}
  const moved={...pen,col:10,row:8},c=record();drawPenHabitat(c,{corners:corners(moved),pen:moved,iso,weatherMode});
  const offset=iso(10,8).map((v,i)=>v-iso(27,0)[i]);assert.deepEqual(c.calls,a.calls.map(([x,y,w,h,color])=>[x+offset[0],y+offset[1],w,h,color]));
 }
});
test('trough and straw avoid the two creature ground anchors; entry faces west path',()=>{
 const pen={col:27,row:0,width:5,height:3},a=penDetailAnchors(pen,iso);
 assert.deepEqual(a.gate,iso(27,1.5));
 for(const spot of [[27.35,1.35],[31.35,1.35]])for(const prop of [a.water,a.straw]){const p=iso(...spot);assert.ok(Math.hypot(prop[0]-p[0],prop[1]-p[1])>40);}
});
