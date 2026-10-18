import test from 'node:test';
import assert from 'node:assert/strict';
import {plantingAction} from './ui-utils.mjs?v=24.9.33';
const ready={loaded:true,connected:true,walletReady:true,unlocked:true,occupied:false,cooling:false,typeCap:false,seedsLeft:27,waterLeft:9};
test('plant button explains missing water and seeds without permitting a plant request',()=>{
 const water=plantingAction({...ready,waterLeft:0});
 assert.equal(water.text,'Mua nước');assert.equal(water.restock,'water');assert.equal(water.disabled,false);
 assert.equal(plantingAction({...ready,seedsLeft:2}).restock,'seed');
 assert.equal(plantingAction(ready).restock,'');assert.equal(plantingAction(ready).text,'Gieo ×3');
 assert.equal(plantingAction({...ready,connected:false,seedsLeft:0,waterLeft:0}).text,'Gieo ×3');
});
test('a full row, cooldown or disconnected wallet stays blocked before restock',()=>{
 for(const blocked of [{occupied:true},{cooling:true},{typeCap:true},{unlocked:false},{loaded:false},{walletReady:false}]){
  const result=plantingAction({...ready,waterLeft:0,...blocked});
  assert.equal(result.disabled,true);assert.equal(result.restock,'');assert.notEqual(result.text,'Gieo ×3');
 }
});
