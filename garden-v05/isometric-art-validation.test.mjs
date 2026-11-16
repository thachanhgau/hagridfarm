import test from 'node:test';import assert from 'node:assert/strict';import {axisLineEvidence}from'./isometric-art-validation.mjs';
const points=(slope,offset=0)=>Array.from({length:41},(_,x)=>[x,Math.round(slope*x+offset)]);
test('rasterized garden axes pass without prescribing their elevation',()=>{for(const [axis,slope]of [['column',.5],['row',-.5]]){const a=axisLineEvidence(points(slope,23),axis),b=axisLineEvidence(points(slope,-70),axis);assert.ok(a.maxDistance<=1);assert.equal(a.maxDistance,b.maxDistance);}});
test('a broad frontal plane cannot pass the one-native-pixel camera tolerance',()=>{assert.ok(axisLineEvidence(points(.3),'column').maxDistance>1);assert.ok(axisLineEvidence(points(-.3),'row').maxDistance>1);});
test('HD and native coordinates express the same physical tolerance',()=>{const p=points(.55,12),a=axisLineEvidence(p,'column'),b=axisLineEvidence(p.map(p=>p.map(v=>v*2)),'column',2);assert.equal(a.maxDistance,b.maxDistance);assert.equal(a.span,b.span);});
test('too few observed samples are rejected',()=>assert.throws(()=>axisLineEvidence([[0,0],[10,5]],'column')));
