import test from 'node:test';
import assert from 'node:assert/strict';
import {findCuts} from './build-level-assets.mjs';
test('atlas separators retain transparent padding on both adjacent cells',()=>{
 const values=[9,9,9,9,9,9,0,0,0,0,9,9];
 const warnings=[];const [,cut]=findCuts(values,2,'row',warnings);
 assert.equal(values[cut-1],0,'previous cell needs an empty edge');
 assert.equal(values[cut],0,'next cell needs an empty edge');
 assert.deepEqual(warnings,[]);
});
