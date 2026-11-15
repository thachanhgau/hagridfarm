import test from 'node:test';import assert from 'node:assert/strict';
import {pixelAxisError} from './audit-noel-native-axes.mjs';
test('native staircase edges stay within the 1px rule on both exact garden axes',()=>{
 for(const slope of [.5,-.5]){const points=Array.from({length:55},(_,x)=>[x,Math.round(30+slope*x)]);assert.ok(pixelAxisError(points,slope).maxPixelError<=.5);}
});
test('a skewed 0.4 slope and wrong-axis edge are rejected despite fitting inside a footprint',()=>{
 const points=Array.from({length:55},(_,x)=>[x,Math.round(30+.4*x)]);
 assert.ok(pixelAxisError(points,.5).maxPixelError>2);
 assert.ok(pixelAxisError(points,-.5).maxPixelError>20);
});
test('the raster tolerance remains 1px per measured point rather than accumulated fitted-slope drift',()=>{
 const points=Array.from({length:55},(_,x)=>[x,20+.5*x+(x<28?-1:1)]);
 assert.equal(pixelAxisError(points,.5).maxPixelError,1);
 points[54][1]+=1;assert.ok(pixelAxisError(points,.5).maxPixelError>1);
});
