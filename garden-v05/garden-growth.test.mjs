import test from 'node:test';
import assert from 'node:assert/strict';
import scene from './scene-data.json' with {type:'json'};
import {newGame,testProfile} from './progression-engine.mjs';
import {createBoundaryFence} from './garden-landscape.mjs';
import {GARDEN_STAGES,gardenStage,stageContains,stageBoundary,stageWorldBounds,futureGroves,keepsakeAnchorRow} from './garden-growth.mjs?v=24.9.61';
const area=stage=>{const p=stageBoundary(stage);return Math.abs(p.reduce((sum,a,i)=>{const b=p[(i+1)%p.length];return sum+a[0]*b[1]-b[0]*a[1]},0))/2;};
test('six monotone spatial chapters grow from a quarter-sized starter yard',()=>{
 assert.deepEqual(GARDEN_STAGES.map(s=>s.level),[1,10,24,48,72,100]);
 assert.ok(area(GARDEN_STAGES[0])<area(GARDEN_STAGES.at(-1))*.3);
 for(let i=1;i<GARDEN_STAGES.length;i++){
  assert.ok(area(GARDEN_STAGES[i])>area(GARDEN_STAGES[i-1]));
  for(const p of stageBoundary(GARDEN_STAGES[i-1]))assert.ok(stageContains(GARDEN_STAGES[i],...p));
 }
});
test('every level transition includes all buildable plots and pens without editing state',()=>{
 for(let level=1;level<=100;level++){
  const s=testProfile(level,1000),before=JSON.stringify(s),stage=gardenStage(s,scene);
  assert.equal(stage.id,GARDEN_STAGES.filter(x=>x.level<=level).at(-1).id);
  for(const p of [...scene.plots,...scene.pens].filter(p=>p.requiredLevel<=level)){
   assert.ok(stageContains(stage,p.col-.5,p.row-.5),`level ${level}, ${p.id}`);
   assert.ok(stageContains(stage,p.col+p.width,p.row+p.height),`level ${level}, ${p.id}`);
  }
  assert.equal(JSON.stringify(s),before);
 }
});
test('starter view excludes future soil, and legacy moved plots stay reachable',()=>{
 const s=newGame(1000);assert.equal(gardenStage(s,scene).id,1);
 assert.equal(stageContains(gardenStage(s,scene),22.5,4),false);
 const moved=structuredClone(scene);moved.plots[0]={...moved.plots[0],col:21.5,row:16};
 assert.ok(gardenStage(s,moved).id>1);
 assert.ok(stageContains(gardenStage(s,moved),24.5,19));
 assert.ok(stageContains(gardenStage(s,scene,[[9.5,13.5]]),9.5,13.5));
});
test('future forest retreats deterministically without covering the active yard',()=>{
 let last=Infinity;
 for(const stage of GARDEN_STAGES){
  const trees=futureGroves(scene,stage);assert.deepEqual(trees,futureGroves(scene,stage));
  assert.ok(trees.length<=last);last=trees.length;
  for(const p of trees)assert.equal(stageContains(stage,p.col,p.row),false);
  const b=stageWorldBounds(scene,stage);assert.ok(b.right>b.left&&b.bottom>b.top);
 }
 assert.equal(last,0);
});

test('final chapter opens the last plot, and keepsakes stay inside stepped frontiers',()=>{
 const last=scene.plots.at(-1);
 assert.equal(stageContains(GARDEN_STAGES[4],last.col+1,last.row+1),false);
 assert.equal(stageContains(GARDEN_STAGES[5],last.col+1,last.row+1),true);
 for(const stage of GARDEN_STAGES.slice(1))for(let i=0;i<12;i++){const col=2.5+i*2;assert.ok(stageContains(stage,col,keepsakeAnchorRow(stage,col)));}
 assert.equal(keepsakeAnchorRow(GARDEN_STAGES.at(-1),2.5),26);
});

test('stepped fences stay joined and keep one gate on the main path',()=>{
 for(const stage of GARDEN_STAGES){const panels=createBoundaryFence(scene,stageBoundary(stage));assert.equal(panels.filter(p=>p.gate).length,1);for(let i=0;i<panels.length;i++)assert.deepEqual(panels[i].cellB,panels[(i+1)%panels.length].cellA);}
});
