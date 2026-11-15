import test from 'node:test';import assert from 'node:assert/strict';
import {surfaceDensity,drawArguments,visibleDraw} from './render-resolution.mjs';
test('Retina surface is bounded by pixel area and mobile memory, logical coordinates stay independent',()=>{
 assert.equal(surfaceDensity(2560,1440,2,false),2);
 assert.equal(surfaceDensity(2560,1440,3,true),1.5);
 assert.ok(10000*10000*surfaceDensity(10000,10000,4,false)**2<=16_000_000);
});
test('HD source rectangles scale while destination and world anchors remain unchanged',()=>{
 const native={width:192,height:512};
 assert.deepEqual(drawArguments([10,20],native,2),[10,20,192,512]);
 assert.deepEqual(drawArguments([10,20,96,256],native,2),[10,20,96,256]);
 assert.deepEqual(drawArguments([96,256,96,256,10,20,96,256],native,2),[192,512,192,512,10,20,96,256]);
});
test('offscreen draws do not request HD images',()=>{
 const canvas={width:5120,height:2880,getBoundingClientRect:()=>({left:-1000,top:-500,width:2560,height:1440})};
 const ctx={getTransform:()=>({a:2,b:0,c:0,d:2,e:0,f:0})};
 assert.equal(visibleDraw(ctx,canvas,[0,0,100,100],{width:100,height:100},{width:800,height:600}),false);
 assert.equal(visibleDraw(ctx,canvas,[1100,550,100,100],{width:100,height:100},{width:800,height:600}),true);
});

import {createResolution,tagArt} from './render-resolution.mjs';
test('only a visible draw requests HD; query-stamped native files keep the same geometry and fallback',async()=>{
 const calls=[],loaded=[];let transform={a:1,b:0,c:0,d:1,e:0,f:0};
 class FakeImage{width=200;height=200;set src(value){loaded.push(value);queueMicrotask(()=>this.onload());}}
 const ctx={drawImage:(...args)=>calls.push(args),setTransform:(a,b,c,d,e,f)=>{transform={a,b,c,d,e,f};},getTransform:()=>transform};
 const canvas={width:500,height:400,style:{},dataset:{},getContext:()=>ctx,getBoundingClientRect:()=>({left:0,top:0,width:500,height:400}),ownerDocument:{defaultView:{innerWidth:1000,innerHeight:800,devicePixelRatio:2,Image:FakeImage}}};
 const surface=createResolution(canvas,{width:500,height:400},{art:{'sprite.png':{file:'hd/sprite.webp',density:2,width:100,height:100}},imageUrl:file=>file});
 const native=tagArt({width:100,height:100},'./sprite.png?v=old');assert.equal(loaded.length,0);
 ctx.drawImage(native,10000,10000);assert.equal(loaded.length,0);
 ctx.drawImage(native,10,20);await new Promise(resolve=>setTimeout(resolve,0));
 assert.deepEqual(loaded,['hd/sprite.webp']);ctx.drawImage(native,10,20);
 assert.ok(calls.at(-1)[0] instanceof FakeImage);assert.deepEqual(calls.at(-1).slice(1),[10,20,100,100]);
 assert.equal(surface.stats().hits,1);assert.ok(surface.stats().peakBytes<=surface.stats().budget);
 surface.setEnabled(false);ctx.drawImage(native,10,20);assert.equal(calls.at(-1)[0],native);assert.deepEqual([canvas.width,canvas.height],[500,400]);
});
test('the ground layer follows the render density only when its extra bytes fit half the HD budget, and reserves them',async()=>{
 const make=(world,dpr)=>{const ctx={drawImage(){},setTransform(){},getTransform:()=>({a:1,b:0,c:0,d:1,e:0,f:0})};
  return createResolution({width:0,height:0,style:{},dataset:{},getContext:()=>ctx,getBoundingClientRect:()=>({left:0,top:0,width:world.width,height:world.height}),ownerDocument:{defaultView:{innerWidth:1280,innerHeight:800,devicePixelRatio:dpr}}},world);};
 const small=make({width:1000,height:600},2);
 assert.equal(small.layer(1000,600),2);assert.equal(small.stats().reserved,1000*600*4*3);
 const full=make({width:2560,height:1440},2),stats=full.stats();
 assert.equal(full.layer(2560,1440),1,'a 2× full world (44 MB extra) does not fit 24 MB');assert.equal(full.stats().reserved,0);assert.equal(stats.density,2);
 small.setEnabled(false);assert.equal(small.layer(1000,600),1);assert.equal(small.stats().reserved,0);
});
