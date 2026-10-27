import test from 'node:test';
import assert from 'node:assert/strict';
import {previewHit} from './placement-input.mjs';
import {snapDecorSpot} from './decor-runtime.mjs';
import {rasterLine,footprintPoints,drawPlacementGrid} from './placement-grid.mjs';
const project=(c,r)=>[(c-r)*32,(c+r)*16];
test('moves land on whole cells by shape and stay on the server half-tile precision',()=>{
 assert.deepEqual(snapDecorSpot([4.24,6.24],[1,1]),[4,6]);
 assert.deepEqual(snapDecorSpot([4.26,6.26],[2,1]),[4,6.5]);
 assert.deepEqual(snapDecorSpot([12.5,8],[2,1],'right'),[12.5,8]);
});
test('the grabbed sprite uses native bounds above its ground anchor',()=>{
 const item={width:64,height:80,pivotX:32,pivotY:72,bounds:{x:8,y:8,w:48,h:64}};
 const [x,y]=project(10,8);
 assert.equal(previewHit({x,y:y-35},[10,8],item,'default',project),true);
 assert.equal(previewHit({x:x+60,y},[10,8],item,'default',project),false);
});
test('placement edges are integer pixel steps and each common cell is64×32',()=>{
 const points=footprintPoints({c0:-.5,c1:.5,r0:-.5,r1:.5},project);
 assert.equal(Math.max(...points.map(p=>p[0]))-Math.min(...points.map(p=>p[0])),64);
 assert.equal(Math.max(...points.map(p=>p[1]))-Math.min(...points.map(p=>p[1])),32);
 const line=rasterLine([0,0],[32,16]);assert.deepEqual(line[0],[0,0]);assert.deepEqual(line.at(-1),[32,16]);
 assert.ok(line.every(p=>p.every(Number.isInteger)));
 assert.ok(line.slice(1).every((p,i)=>Math.abs(p[0]-line[i][0])<=1&&Math.abs(p[1]-line[i][1])<=1));
});
test('an unchanged preview reuses its raster layer while the camera redraws',()=>{
 let created=0,drawn=0;
 const brush={save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},fill(){},fillRect(){},translate(){}};
 const doc={createElement(){created++;return {getContext:()=>brush};}};
 const ctx={canvas:{ownerDocument:doc},save(){},restore(){},drawImage(){drawn++;}};
 const preview={rect:{c0:-.5,c1:.5,r0:-.5,r1:.5},suggestions:[{at:[1,0],ok:true}],blocked:false};
 drawPlacementGrid(ctx,preview,project);drawPlacementGrid(ctx,preview,project);
 assert.equal(created,1);assert.equal(drawn,2);
});
