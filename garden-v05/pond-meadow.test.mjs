import test from 'node:test';
import assert from 'node:assert/strict';
import {pondMeadowOutline, pondMeadowTrees, pondMeadowMap} from './pond-meadow.mjs';
import {EDGE_STAGE,stageBoundary,POND_LAND} from './garden-growth.mjs';
const stage={...EDGE_STAGE,pond:true};
test('scenic shoreline is deterministic and irregular without moving fenced land',()=>{
 const outline=pondMeadowOutline(stage);
 assert.deepEqual(outline,pondMeadowOutline(stage));
 assert.deepEqual(pondMeadowOutline(EDGE_STAGE),stageBoundary(EDGE_STAGE));
 for(const point of stageBoundary(stage).filter(([,r])=>r>=-.5))assert.ok(outline.some(p=>p[0]===point[0]&&p[1]===point[1]));
 const north=outline.filter(([,r])=>r<POND_LAND.rowTop);
 assert.ok(north.length>15);
 assert.ok(new Set(north.map(([,r])=>r.toFixed(2))).size>10);
 assert.ok(outline.every(([c,r])=>c>=-5.5&&c<=45.5&&r>=-16&&r<=33.5));
});
test('pond ground texture reaches the whole scenic skirt instead of stopping at the old rectangular extension',()=>{
 const map={terrainExtensions:[{col:-3,row:-3,width:39,height:40}]};
 const result=pondMeadowMap(map,stage),region=result.terrainExtensions.at(-1);
 assert.equal(map.terrainExtensions.length,1);
 for(const [c,r] of pondMeadowOutline(stage).filter(([c,r])=>c>=POND_LAND.col-2&&r<-.5)){
  assert.ok(c>=region.col-.5&&c<=region.col-.5+region.width&&r>=region.row-.5&&r<=region.row-.5+region.height);
 }
 assert.equal(pondMeadowMap(map,EDGE_STAGE),map);
});
test('lake trees retain distinct uniform scales and staggered roots in stable clusters',()=>{
 const trees=pondMeadowTrees();
 assert.deepEqual(trees,pondMeadowTrees());
 assert.ok(trees.length>=30&&trees.length<65);
 assert.ok(Math.max(...trees.map(t=>t.scale))/Math.min(...trees.map(t=>t.scale))>2);
 for(const id of ['oak','grove','pine'])assert.ok(new Set(trees.filter(t=>t.id===id).map(t=>t.scale)).size>=3,id);
 assert.ok(trees.every(t=>t.col<POND_LAND.col||t.col>POND_LAND.right||t.row<POND_LAND.rowTop));
 const north=trees.filter(t=>t.row<POND_LAND.rowTop);
 assert.ok(new Set(north.map(t=>t.row.toFixed(2))).size>10);
});
