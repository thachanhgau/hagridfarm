import test from 'node:test';
import assert from 'node:assert/strict';
import {plantingAction} from './ui-utils.mjs?v=24.9.52';
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

test('times shown are the real ones: scaled below level 20 when the server owns the garden', async () => {
 const {hours, realHours, setServerGrowth} = await import('./ui-utils.mjs');
 const pumpkin = {hours: 2, level: 1}, mandrake = {hours: 14, level: 24};
 assert.equal(hours(realHours(pumpkin, 3)), '2 giờ'); // local prototype engine: unscaled
 setServerGrowth(true);
 assert.equal(hours(realHours(pumpkin, 3)), '12 phút');
 assert.equal(hours(realHours({hours: 6, level: 6}, 12)), '1 giờ 48 phút');
 assert.equal(hours(realHours(pumpkin, 20)), '2 giờ');
 assert.equal(hours(realHours(mandrake, 10)), '14 giờ'); // opens at 24: no newbie speed-up then
 assert.equal(hours(realHours({hours: 24}, 30)), '1 ngày');
 assert.equal(hours(0), 'Tức thì');
 setServerGrowth(false);
});
