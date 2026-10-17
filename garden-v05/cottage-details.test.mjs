import test from 'node:test';
import assert from 'node:assert/strict';
import {drawRaisedPlotBorder,drawCottageGround} from './garden-cottage-details.mjs';
const recorder=()=>({calls:[],save(){},restore(){},fillRect(x,y,w,h){this.calls.push([x,y,w,h,this.fillStyle]);}});
test('raised plot edges stay out of the planting centre and follow translated layouts',()=>{
 for(const weatherMode of ['clear','rain','autumn','snow'])for(const index of [0,5,11]){
  const c=recorder(),corners=[[100,100],[196,148],[100,196],[4,148]],copy=JSON.stringify(corners);
  drawRaisedPlotBorder(c,corners,{weatherMode,index});
  assert.equal(JSON.stringify(corners),copy);assert.ok(c.calls.length>0);
  for(const [x,y,w,h] of c.calls){assert.ok([x,y,w,h].every(Number.isInteger));assert.ok(w>0&&h>0);assert.ok(Math.abs(x+w/2-100)/96+Math.abs(y+h/2-148)/48>.85);}
  const translated=recorder();drawRaisedPlotBorder(translated,corners.map(([x,y])=>[x+47,y+29]),{weatherMode,index});
  assert.deepEqual(translated.calls,c.calls.map(([x,y,w,h,color])=>[x+47,y+29,w,h,color]));
 }
});
test('cottage ground rendering is deterministic and preserves its fixed scene anchors',()=>{
 const iso=(c,r)=>[1120+(c-r)*32,300+(c+r)*16];
 for(const weatherMode of ['clear','rain','autumn','snow']){
  const a=recorder(),b=recorder(),summary=drawCottageGround(a,{iso,weatherMode});drawCottageGround(b,{iso,weatherMode});
  assert.deepEqual(a.calls,b.calls);assert.deepEqual(summary.anchors.hut,[992,364]);assert.equal(summary.stones,9);
  assert.ok(a.calls.every(call=>call.slice(0,4).every(Number.isInteger)));
 }
});
