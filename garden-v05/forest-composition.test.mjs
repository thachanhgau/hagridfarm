import test from 'node:test';
import assert from 'node:assert/strict';
import {canopyClusters,forestExitTrail,backdropExitTrail,overlapsTrail} from './forest-composition.mjs';
import {createBoundaryFence} from './garden-landscape.mjs';
import {GARDEN_STAGES,stageBoundary,stageContains} from './garden-growth.mjs?v=24.9.36';
const map={width:2560,height:1440,origin:{x:1120,y:300},tileWidth:64,tileHeight:32};
const sizes={oak:{width:190,height:176},pine:{width:104,height:196},grove:{width:190,height:136},log:{width:144,height:88}};
test('groves are stable with varied sizes, silhouettes and scattered anchors',()=>{
 const a=canopyClusters(map,sizes);assert.deepEqual(a,canopyClusters(map,sizes));
 assert.ok(a.length>250&&a.length<800);assert.equal(new Set(a.map(t=>t.id)).size,4);
 assert.ok(a.some(t=>t.h>350)&&a.some(t=>t.h<100));
 assert.ok(a.some(t=>t.flip)&&a.some(t=>!t.flip));
 assert.ok(a.every(t=>t.x>=0&&t.x<=map.width&&t.y>=0&&t.y<=map.height));
});
test('exit follows the actual gate of every growth stage without entering playable land',()=>{
 for(const stage of GARDEN_STAGES){
  const gate=createBoundaryFence(map,stageBoundary(stage)).find(p=>p.gate);assert.ok(gate);
  const row=gate.cellA[1],trail=forestExitTrail(map,row),first=trail[0];
  assert.deepEqual(first,[1120+(16-row)*32,300+(16+row)*16]);
  assert.deepEqual(trail.at(-1),[0,map.height*.82]);
  for(let i=1;i<trail.length;i++){
   const [x,y]=trail[i],dx=(x-1120)/32,dy=(y-300)/16;
   assert.equal(stageContains(stage,(dx+dy)/2,(dy-dx)/2),false,`stage ${stage.id} trail must be exterior`);
   assert.ok(Math.hypot(x-trail[i-1][0],y-trail[i-1][1])<12,'continuous trail');
  }
 }
});
test('canopy clearance covers the trail and west continuation joins the canvas exit without looping across the tile',()=>{
 const path=forestExitTrail(map),p=path[Math.floor(path.length/2)];
 assert.equal(overlapsTrail({left:p[0]-10,top:p[1]-30,right:p[0]+10,bottom:p[1]+5},path),true);
 assert.equal(overlapsTrail({left:2200,top:0,right:2300,bottom:80},path),false);
 const back=backdropExitTrail(map);
 assert.deepEqual(back[0],[map.width,path.at(-1)[1]]);
 assert.ok(back.at(-1)[0]>map.width*.5&&back.at(-1)[0]<map.width*.7,'western trail fades inside the forest instead of looping at x=0');
});
