import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {festivalObjects,clearOfBuildings,seasonPixel,worldPhase,weatherizeCanvas,roofSnowCoverage} from './garden-seasonal-world.mjs?v=24.9.43';
import {GARDEN_STAGES,stageContains} from './garden-growth.mjs?v=24.9.43';
const map=JSON.parse(readFileSync(new URL('./scene-data.json',import.meta.url)));
const decorAssets=new Map(['decor_pumpkin_lantern','decor_cauldron','decor_floating_candles','decor_mandrake_planter','decor_vine_arch'].map(id=>[id,{id,file:id+'.png'}]));
test('festival props stay in unlocked ground, outside buildings and preserve world state',()=>{
 const before=JSON.stringify(map);
 for(const stage of GARDEN_STAGES)for(const eventMode of ['event_yule','event_halloween','event_herbology_fair']){
  const a=festivalObjects({eventMode,stage,map,iso:(c,r)=>[c*32-r*32,c*16+r*16],decorAssets});
  assert.ok(a.length>=2);assert.ok(a.every(p=>stageContains(stage,p.col,p.row)&&clearOfBuildings(p.col,p.row,map)));assert.equal(a.filter(p=>p.hero).length,1);
  if(stage.id===6)assert.ok(a.length>6);
  assert.ok(a.every(p=>p.kind==='festival')); // Never registers as a shop item or creature target.
 }
 assert.equal(JSON.stringify(map),before);
 assert.deepEqual(festivalObjects({eventMode:'none'}),[]);
});
test('moved buildings and existing decorations displace satellite scenery',()=>{
 const stage=GARDEN_STAGES[5],iso=(c,r)=>[c*32-r*32,c*16+r*16];
 const input={eventMode:'event_halloween',stage,map,iso,decorAssets};
 const first=festivalObjects(input).find(p=>!p.hero);assert.ok(first);
 const occupied=festivalObjects({...input,occupied:[{xy:first.xy}]});assert.ok(!occupied.some(p=>p.xy[0]===first.xy[0]&&p.xy[1]===first.xy[1]));
 const moved={...map,plots:[...map.plots,{col:first.col-1,row:first.row-1,width:3,height:3}]};
 assert.ok(!festivalObjects({...input,map:moved}).some(p=>!p.hero&&p.col===first.col&&p.row===first.row));
});
test('weather transforms preserve transparent pixels and building wall colours',()=>{
 const data=new Uint8ClampedArray([99,99,99,0,70,120,45,255]);let put;
 const canvas={width:2,height:1,getContext:()=>({getImageData:()=>({data,width:2,height:1}),putImageData:im=>put=im})};
 weatherizeCanvas(canvas,'tree','snow');assert.equal(put.data[3],0);assert.equal(put.data[7],255);
 assert.deepEqual(seasonPixel(120,70,40,30,150,164,184,'roof','snow'),[120,70,40]);
 assert.notDeepEqual(seasonPixel(80,85,100,80,30,164,184,'roof','snow'),[80,85,100]);
 assert.notDeepEqual(seasonPixel(60,110,45,80,30,180,180,'tree','autumn'),[60,110,45]);
 assert.deepEqual(seasonPixel(60,110,45,80,30,180,180,'tree','clear'),[60,110,45]);
});
test('world animation is deterministic, periodic, and freezes at reduced-motion clock zero',()=>{
 assert.equal(worldPhase(0),0);assert.equal(worldPhase(1680),worldPhase(3360));
 assert.equal(worldPhase(420),1);assert.equal(worldPhase(840),2);assert.equal(worldPhase(1260),3);
});

// Lights follow the exact same depth-sorted object positions as their sprites.
test('festival light anchors use placed props and disappear with the event',async()=>{
 const {collectLightSources}=await import('./garden-atmosphere.mjs');
 const objects=[{kind:'festival',hero:true,id:'hero-yule',xy:[500,600]},{kind:'festival',id:'festival:1',asset:{id:'decor_pumpkin_lantern'},xy:[800,900]}];
 const lights=collectLightSources(objects);assert.equal(lights.length,2);assert.equal(lights[0].x,500);assert.equal(lights[0].y,518);assert.equal(lights[1].x,800);assert.deepEqual(collectLightSources([]),[]);
});

test('roof snow mask preserves lower walls, doors and greenhouse glass',()=>{
 for(const [x,y] of [[82,138],[120,120],[40,165],[21,38]]){
  assert.equal(roofSnowCoverage('roof',x,y,164,184),false);
  assert.deepEqual(seasonPixel(90,95,110,x,y,164,184,'roof','snow'),[90,95,110]);
 }
 assert.equal(roofSnowCoverage('roof',80,30,164,184),true);
 assert.equal(roofSnowCoverage('greenhouse-roof',96,42,156,152),false);
 assert.deepEqual(seasonPixel(80,135,147,96,42,156,152,'greenhouse-roof','snow'),[80,135,147]);
 assert.equal(roofSnowCoverage('greenhouse-roof',80,23,156,152),true);
});
