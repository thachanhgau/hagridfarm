import test from 'node:test';
import assert from 'node:assert/strict';
import {CREATURE} from './progression-engine.mjs';
import {HABITAT_SPECIES,habitatAnchors,habitatResidents,habitatPhase,drawHabitatProps,drawHabitatMotion} from './garden-creature-habitats.mjs';
const iso=(col,row)=>[1120+(col-row)*32,300+(col+row)*16];
const pen={id:'pen_1',col:27,row:0,width:5,height:3};
const spots=[[27.35,1.35],[31.35,1.35]],creatures=[{species:'niffler'},{species:'unicorn'}];
const record=(fn)=>{const calls=[];const ctx={fillRect(...args){assert(args.every(Number.isInteger));calls.push([this.fillStyle,...args]);}};fn(ctx);return calls;};
test('every adoptable species has distinct habitat artwork',()=>{
 assert.deepEqual([...HABITAT_SPECIES].sort(),Object.keys(CREATURE).sort());
 const art=HABITAT_SPECIES.map(species=>JSON.stringify(record(c=>drawHabitatProps(c,[{species,xy:[100,100]}]))));
 assert.equal(new Set(art).size,HABITAT_SPECIES.length);
});
test('habitats follow actual occupants, adoption order and moved pens without mutating state',()=>{
 const before=JSON.stringify({pen,creatures,spots});
 const residents=habitatResidents(pen,creatures,spots,iso);assert.deepEqual(residents.map(r=>r.species),['niffler','unicorn']);
 assert.deepEqual(habitatResidents(pen,[...creatures].reverse(),spots,iso).map(r=>r.species),['unicorn','niffler']);
 const moved={...pen,col:10,row:8},movedSpots=spots.map(([c,r])=>[c-17,r+8]);
 const shifted=habitatResidents(moved,creatures,movedSpots,iso);const a=iso(0,0),b=iso(-17,8);
 shifted.forEach((r,i)=>assert.deepEqual(r.xy,residents[i].xy.map((n,k)=>n+b[k]-a[k])));
 assert.deepEqual(habitatResidents(pen,creatures,[[0,0],[0,1]],iso),[]);
 assert.equal(JSON.stringify({pen,creatures,spots}),before);
});
test('all weather props and every motion phase stay inside the empty pockets, clear of creature ground anchors',()=>{
 const anchors=habitatAnchors(pen,iso);
 for(const anchor of anchors)for(const spot of spots){const [x,y]=iso(...spot);assert(Math.hypot(anchor[0]-x,anchor[1]-y)>60);}
 for(const species of HABITAT_SPECIES)for(const weatherMode of ['clear','rain','autumn','snow'])for(const clock of [0,600,1200,1800]){
  const residents=[{species,xy:[100,100]}];
  const calls=record(c=>{drawHabitatProps(c,residents,{weatherMode});drawHabitatMotion(c,residents,{clock,weatherMode});});
  for(const [,x,y,w,h] of calls){assert(x>=81&&x+w<=119,`${species} x`);assert(y>=72&&y+h<=106,`${species} y`);}
 }
});
test('ambient motion is clock-driven, slow, deterministic and frozen by reduced motion',()=>{
 for(const species of HABITAT_SPECIES){
  const residents=[{species,xy:[100,100]}];const render=(clock,reducedMotion=false)=>record(c=>drawHabitatMotion(c,residents,{clock,reducedMotion}));
  assert.deepEqual(render(0),render(99999,true));assert.deepEqual(render(1200),render(1200));
  assert.equal(habitatPhase(species,0),0);assert.equal(habitatPhase(species,NaN),0);
  assert.equal(habitatPhase(species,99999,true),0);
  assert(new Set([0,600,1200,1800].map(t=>JSON.stringify(render(t)))).size>1,species);
 }
});
