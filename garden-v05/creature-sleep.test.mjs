import test from 'node:test';
import assert from 'node:assert/strict';
import {CREATURE} from './progression-engine.mjs';
import {creatureRest,drawSleepSigns} from './creature-sleep.mjs';
import {CREATURE_SLEEP_ART} from './creature-sleep-art.mjs';
test('all 18 creatures have visible sleeping poses for all four growth ages',()=>{
 assert.deepEqual(Object.keys(CREATURE_SLEEP_ART).sort(),Object.keys(CREATURE).sort());
 for(const species of Object.keys(CREATURE))for(let stage=0;stage<4;stage++){
  const a=creatureRest({species,stage,night:true});assert.ok(a.asset.file.includes('creature-sleep/'));assert.equal(a.sleeping,true);assert.equal(a.motion,null);assert.equal(a.authoredFacing,false);
  assert.equal(a.asset.bounds.y+a.asset.bounds.h,a.asset.pivotY);
 }
});
test('daytime, active interactions and tutorial guests stay awake without changing game state',()=>{
 for(const species of Object.keys(CREATURE)){
  assert.equal(creatureRest({species,stage:3,night:false}),null);
  assert.equal(creatureRest({species,stage:3,night:true,event:{kind:'eat'}}),null);
  assert.equal(creatureRest({species,stage:3,night:true,event:{kind:'care'}}),null);
  assert.equal(creatureRest({species,stage:3,night:true,guest:true}),null);
 }
});
test('rest signs are deterministic for reduced motion and restore canvas state',()=>{
 const render=()=>{const ops=[],ctx=new Proxy({},{get:(o,k)=>k in o?o[k]:(...a)=>ops.push([k,...a]),set:(o,k,v)=>(o[k]=v,true)});drawSleepSigns(ctx,{sleeping:true,asset:CREATURE_SLEEP_ART.dragon[3],xy:[100,200]},0);return ops;};assert.deepEqual(render(),render());assert.equal(render()[0][0],'save');assert.equal(render().at(-1)[0],'restore');
});
