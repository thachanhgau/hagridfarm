import test from 'node:test';
import assert from 'node:assert/strict';
import scene from './scene-data.json' with {type:'json'};
import motion from './motion-data.json' with {type:'json'};
import {FARM_BOUNDARY,GARDEN_PATHS,insideFarm,createBoundaryFence,drawBoundaryFence} from './garden-landscape.mjs';
globalThis.FARM_SCENE=structuredClone(scene);globalThis.FARM_MOTION=motion;
const {iso,pickFromWorld,decorationPlacements,keepsakePlacements,plotPhysicalBounds,plotCellPosition}=await import('./scene-renderer.mjs');

test('fence encloses every fixed build footprint, decoration, keepsake and hut',()=>{
  for(const r of [...scene.plots,...scene.pens,...decorationPlacements(scene),...keepsakePlacements(scene)]) {
    for(const c of [r.col-.5,r.col+r.width])for(const row of [r.row-.5,r.row+r.height]) assert.ok(insideFarm(c,row),`${r.id??r.species}: ${c},${row}`);
  }
  assert.ok(insideFarm(0,4));
  assert.ok(FARM_BOUNDARY.every(p=>insideFarm(...p)));
});
test('expanded scenic meadow cannot select or build a crop cell even with all slots unlocked',()=>{
  let rejected=0;
  for(let c=-7;c<36;c++)for(let r=-3;r<37;r++)if(!insideFarm(c,r)){
    assert.equal(pickFromWorld(...iso(c,r,scene),scene.plots.length,scene),null);rejected++;
  }
  assert.ok(rejected>300);
  for(const plot of scene.plots)for(let j=0;j<9;j++)assert.deepEqual(pickFromWorld(...iso(...plotCellPosition(plot,j,scene),scene),scene.plots.length,scene),{plot:plot.id,index:j});
  const invalid={...scene,plots:[{id:0,col:-6,row:0,width:3,height:3}]};
  assert.equal(pickFromWorld(...iso(-6,0,scene),1,invalid),null);
});
test('every fence panel joins its neighbour and stays within canvas bounds',()=>{
  const fence=createBoundaryFence(scene);
  for(let i=0;i<fence.length;i++){
    assert.deepEqual(fence[i].cellB,fence[(i+1)%fence.length].cellA);
    for(const [x,y] of [fence[i].a,fence[i].b])assert.ok(x>=6&&x<=scene.width-6&&y>=51&&y<=scene.height-7);
  }
  assert.equal(fence.filter(p=>p.gate).length,1);
});
test('footpath stays inside fence and leaves all crop and pen cells clear',()=>{
  for(const path of GARDEN_PATHS)for(let i=1;i<path.length;i++){
    const a=path[i-1],b=path[i];
    for(let n=0;n<=100;n++){
      const c=a[0]+(b[0]-a[0])*n/100,r=a[1]+(b[1]-a[1])*n/100;
      assert.ok(insideFarm(c,r));
      for(const area of [...scene.plots.map(plot=>plotPhysicalBounds(plot,scene)),...scene.pens.map(p=>({...p,col:p.col-.5,row:p.row-.5}))]){
        const overlap=c+.27>area.col&&c-.27<area.col+area.width&&r+.27>area.row&&r-.27<area.row+area.height;
        assert.equal(overlap,false,`Path crosses ${area.id} at ${c},${r}`);
      }
    }
  }
});

test('exit gate is centered on the trail and leaves its middle passage clear',()=>{
 const gate=createBoundaryFence(scene).find(p=>p.gate),calls=[];
 assert.equal((gate.cellA[0]+gate.cellB[0])/2,16);
 assert.equal(Math.abs(gate.cellA[0]-gate.cellB[0]),2.5);
 drawBoundaryFence({fillRect(x,y,w,h){calls.push({x,y,w,h});}},gate);
 const x=(gate.a[0]+gate.b[0])/2,y=(gate.a[1]+gate.b[1])/2;
 assert.equal(calls.some(r=>r.x<x+10&&r.x+r.w>x-10&&r.y<y+5&&r.y+r.h>y-24),false,'no closed rail or post across the passage');
});
