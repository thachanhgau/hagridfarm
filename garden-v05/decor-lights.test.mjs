import test from 'node:test';
import assert from 'node:assert/strict';
import manifest from './decor-assets-manifest.json' with {type:'json'};
import {DECOR_LIGHTS} from './decor-lights-spec.mjs';
import {nightDecorFrame,drawDecorIllumination} from './decor-lights.mjs';
import {decorFrameAt} from './scene-animation.mjs';
test('all catalog lamps/candles and decorated Christmas trees have explicit night lighting',()=>{
 for(const asset of manifest.items.filter(a=>/lantern|lamp|candle|light/.test(a.id)||['sp_xmas_weasley_tree','ev_champion_tree','nx_dobby_sock_tree','nx_chocolate_frog_tree','nx_hagrid_boot_planter','nx_bowtruckle_fir_perch'].includes(a.id)))assert.ok(DECOR_LIGHTS[asset.id],asset.id);
 assert.ok(!DECOR_LIGHTS.pine&&!DECOR_LIGHTS.hw_dead_bat_tree);
});
test('lighting follows the exact authored animation cell and facing with no kit dependency',()=>{
 for(const asset of manifest.items.filter(a=>DECOR_LIGHTS[a.id]))for(const facing of ['default','right'])for(const clock of [0,400,950,1400]){
  const obj={id:asset.id,kind:'store-decor',asset,facing,slot:2,xy:[400,500]},light=nightDecorFrame(obj,clock),frame=decorFrameAt(asset,clock,{facing,seed:`${asset.id}:2`,reducedMotion:clock===0});
  assert.equal(light.asset.file,frame.file);assert.deepEqual(light.asset.atlasRect,frame.atlasRect);assert.equal(light.asset.pivotX,asset.pivotX);
  assert.ok(light.points.length>0&&light.points.length<=DECOR_LIGHTS[asset.id].maxPoints);
  assert.equal(nightDecorFrame({...obj,preview:true},clock),null);
 }
});
test('day and placement previews emit nothing; reduced motion is deterministic and canvas state restored',()=>{
 const asset=manifest.items.find(a=>a.id==='sp_xmas_weasley_tree'),obj={id:asset.id,kind:'store-decor',asset,xy:[400,500]};
 const render=(mode,preview=false)=>{const ops=[],ctx=new Proxy({},{get:(o,k)=>k==='createRadialGradient'?()=>({addColorStop(){}}):k in o?o[k]:(...args)=>ops.push([k,...args]),set:(o,k,v)=>(o[k]=v,true)});drawDecorIllumination(ctx,{...obj,preview},{mode,clock:0,drawAsset:(...args)=>ops.push(['sprite',...args])});return ops;};
 assert.deepEqual(render('day'),[]);assert.deepEqual(render('night',true),[]);assert.deepEqual(render('night'),render('night'));const ops=render('night');assert.equal(ops[0][0],'save');assert.equal(ops.at(-1)[0],'restore');assert.equal(ops.filter(a=>a[0]==='sprite').length,1);
});

test('fire creatures retain the exact current pose, coat and facing; sleep dims embers',async()=>{
 const {drawCreatureEmber}=await import('./decor-lights.mjs'),calls=[],ctx=new Proxy({},{get:(o,k)=>k==='createRadialGradient'?()=>({addColorStop(){}}):k in o?o[k]:()=>{},set:(o,k,v)=>(o[k]=v,true)}),asset={file:'current-pose.webp',coat:'gold',pivotX:32,pivotY:48,bounds:{x:5,y:8,w:54,h:40}};
 for(const species of ['dragon','salamander']){const o={species,asset,xy:[100,200],sleeping:true,facing:'right',authoredFacing:false};assert.ok(drawCreatureEmber(ctx,o,{mode:'night',drawAsset:(...a)=>calls.push(a)}));assert.equal(calls.at(-1)[0],asset);assert.equal(calls.at(-1)[5],true);}
 assert.equal(drawCreatureEmber(ctx,{species:'unicorn',asset,xy:[0,0]},{mode:'night'}),false);
});
