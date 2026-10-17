import test from 'node:test';
import assert from 'node:assert/strict';
import {loadVisualPrefs,saveVisualPrefs,VISUAL_PREFS_STORAGE_KEY} from './hpvn-bridge.mjs';
function storage(){const values=new Map();return {getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};}
test('visual controls round-trip without losing existing scene and rotation preferences',()=>{
 const s=storage();const next=saveVisualPrefs({motionEnabled:false,propsVisible:false,grid:true,soundEnabled:false,weatherMode:'snow',atmosphereMode:'night',creatureFacings:{bowtruckle:'right'}},s);
 assert.deepEqual(loadVisualPrefs(s),next);assert.equal(next.motionEnabled,false);assert.equal(next.propsVisible,false);assert.equal(next.grid,true);assert.equal(next.creatureFacings.bowtruckle,'right');
});
test('legacy visual saves keep movement and scenery enabled with grid off',()=>{
 const s=storage();s.setItem(VISUAL_PREFS_STORAGE_KEY,JSON.stringify({soundEnabled:false}));const p=loadVisualPrefs(s);
 assert.equal(p.motionEnabled,true);assert.equal(p.propsVisible,true);assert.equal(p.grid,false);
 const normalized=saveVisualPrefs({grid:'false',motionEnabled:null,propsVisible:0},s);assert.equal(normalized.grid,false);assert.equal(normalized.motionEnabled,true);assert.equal(normalized.propsVisible,true);
});
