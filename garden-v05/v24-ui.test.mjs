import test from 'node:test';
import assert from 'node:assert/strict';
import {sceneryLighting,drawV24Ground} from './garden-v24-scenery.mjs';
import {GARDEN_STAGES,stageContains} from './garden-growth.mjs?v=24.9.33';
test('V24 sunbeams respect weather and time instead of shining through rain or night',()=>{
 for(const atmosphere of ['day','dusk','night'])for(const weather of ['clear','rain','snow','autumn']){
 const result=sceneryLighting(atmosphere,weather);assert.equal(result.sun,weather==='clear'&&atmosphere!=='night');assert.equal(result.wet,weather==='rain');assert.equal(result.snow,weather==='snow');
 }
});
test('V24 weather ground accents stay within each unlocked garden frontier',()=>{
 const c=new Proxy({},{get:()=>()=>{},set:()=>true});
 for(const stage of GARDEN_STAGES){const points=[];for(const weatherMode of ['rain','snow','autumn'])drawV24Ground(c,{weatherMode,clock:1000,stage,iso:(col,row)=>{points.push([col,row]);return [col*64,row*32]}});assert.ok(points.length);assert.ok(points.every(([col,row])=>stageContains(stage,col,row)));}
});
