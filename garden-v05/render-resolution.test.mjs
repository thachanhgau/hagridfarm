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
test('the ground layer follows the surface density and swaps its art for HD off screen too, rebuilding once',async()=>{
 const loaded=[],calls=[];class FakeImage{width=200;height=200;set src(value){loaded.push(value);queueMicrotask(()=>this.onload());}}
 const ctx={drawImage(){},setTransform(){},getTransform:()=>({a:1,b:0,c:0,d:1,e:0,f:0})};
 const view={innerWidth:1280,innerHeight:800,devicePixelRatio:2,Image:FakeImage};
 const surface=createResolution({width:0,height:0,style:{},dataset:{},getContext:()=>ctx,getBoundingClientRect:()=>({left:0,top:0,width:2560,height:1440}),ownerDocument:{defaultView:view}},{width:2560,height:1440},
  {art:{'sign.png':{file:'hd/sign.webp',density:2,width:100,height:100},'tree.png':{file:'hd/tree.webp',density:2,width:100,height:100}},imageUrl:file=>file});
 assert.equal(surface.layer(),2,'a 2× full world has its own allowance');
 const layer={drawImage:(...args)=>calls.push(args)};let rebuilt=0;surface.adopt(layer,()=>rebuilt++);
 const sign=tagArt({width:100,height:100},'sign.png'),tree=tagArt({width:100,height:100},'tree.png');
 layer.drawImage(sign,99999,99999);layer.drawImage(tree,-5000,0);
 assert.deepEqual(loaded,['hd/sign.webp','hd/tree.webp'],'no visibility test on the ground');
 for(let i=0;i<5&&!rebuilt;i++)await new Promise(resolve=>setTimeout(resolve,0));
 assert.equal(rebuilt,1,'one rebuild once both settled');
 layer.drawImage(sign,0,0);assert.ok(calls.at(-1)[0] instanceof FakeImage);
 surface.setEnabled(false);assert.equal(surface.layer(),1);
});
test('a tinted copy (forest trees) gets the same tint painted over its HD image',async()=>{
 class FakeImage{width=200;height=200;set src(value){queueMicrotask(()=>this.onload());}}
 const fills=[],copy={width:0,height:0,getContext:()=>({drawImage(){},fillRect:(...r)=>fills.push([copy.fillStyle,copy.mode,...r]),set fillStyle(v){copy.fillStyle=v;},set globalCompositeOperation(v){copy.mode??=v;}})};
 const ctx={drawImage(){},setTransform(){},getTransform:()=>({a:1,b:0,c:0,d:1,e:0,f:0})};
 const surface=createResolution({width:0,height:0,style:{},dataset:{},getContext:()=>ctx,getBoundingClientRect:()=>({left:0,top:0,width:500,height:400}),ownerDocument:{defaultView:{innerWidth:1280,innerHeight:800,devicePixelRatio:2,Image:FakeImage},createElement:()=>copy}},{width:500,height:400},
  {art:{'oak.png':{file:'hd/oak.webp',density:2,width:100,height:100}},imageUrl:file=>file});
 const layer={drawImage(){}};surface.adopt(layer);layer.drawImage(tagArt({width:100,height:100},'oak.png',{tint:'rgba(9,29,31,.24)'}),0,0);
 for(let i=0;i<5&&!fills.length;i++)await new Promise(resolve=>setTimeout(resolve,0));
 assert.deepEqual(fills,[['rgba(9,29,31,.24)','source-atop',0,0,200,200]]);
});
test('per-frame atlas records (atlasRects / rightAtlasRects, e.g. the Halloween and event runtime decor) get HD with their base sprite',async()=>{
 const {HD_ART}=await import('./hd-art.mjs'),{items}=JSON.parse(await (await import('node:fs/promises')).readFile(new URL('decor-assets-manifest.json',import.meta.url),'utf8'));
 const atlased=items.filter(i=>i.atlasRects&&HD_ART[i.file]);assert.ok(atlased.some(i=>i.id==='hw_ghost_well'));assert.ok(atlased.length>=100);
 for(const i of atlased)for(const f of [...i.frames,...(i.rightFrames||[])])assert.ok(HD_ART[f],`${i.id}: ${f} has no HD`);
});
test('shop, dock and bag <img> get a 2× srcset from HD_ART through el(); no HD, no srcset; placement thumb clears a stale one',async()=>{
 const {hdSrcset,artKey}=await import('./render-resolution.mjs');
 const {HD_ART}=await import('./hd-art.mjs?v=26.6');
 const {runtimeImageUrl}=await import('./runtime-image-url.mjs?v=26.6');
 const file=Object.keys(HD_ART).find(k=>k.startsWith('decor-assets/native/')),record=HD_ART[file];
 for(const src of [file,'./'+file+'?v=24.0',runtimeImageUrl(file)])assert.equal(artKey(src),file);
 assert.equal(hdSrcset('./'+file,HD_ART,runtimeImageUrl),`${runtimeImageUrl('./'+file)} 1x, ${record.file} 2x`);
 assert.equal(hdSrcset('decor-assets/native/__none__.png',HD_ART,runtimeImageUrl),'');
 const made=[];globalThis.document={createElement:tag=>{const e={tag,attrs:{},style:{},setAttribute(k,v){this.attrs[k]=v;},append(){}};made.push(e);return e;},createTextNode:t=>t};
 try{
  const {el}=await import('./ui-utils.mjs?v=26.6');
  const hd=el('img',{src:file,alt:'',width:40,height:40}),plain=el('img',{src:'decor-assets/native/__none__.png'});
  assert.equal(hd.attrs.src,runtimeImageUrl(file));assert.equal(hd.attrs.srcset,hdSrcset(file,HD_ART,runtimeImageUrl));
  assert.equal(hd.attrs.width,'40');assert.equal(plain.attrs.srcset,undefined);
 }finally{delete globalThis.document;}
 const source=(await import('node:fs')).readFileSync(new URL('./decor-placement-ui.mjs',import.meta.url),'utf8');
 assert.match(source,/thumb\.srcset=hdSrcset\(thumbFile,HD_ART,runtimeImageUrl\);thumb\.src=runtimeImageUrl\(thumbFile\)/);
});

test('a working set over budget settles to native fallbacks instead of re-fetching evicted HD every frame',async()=>{
 const loaded=[];let left=0;class FakeImage{width=2048;height=2048;set src(v){loaded.push(v);queueMicrotask(()=>this.onload());}}
 const ctx={drawImage(){},setTransform(){},getTransform:()=>({a:1,b:0,c:0,d:1,e:0,f:0})},canvas={style:{},dataset:{},getContext:()=>ctx,getBoundingClientRect:()=>({left,top:0,width:500,height:400}),ownerDocument:{defaultView:{innerWidth:390,innerHeight:844,devicePixelRatio:3,Image:FakeImage}}};
 const art=Object.fromEntries(['a','b','c'].map(id=>[id+'.png',{file:id+'.webp',density:2,width:1024,height:1024}])),surface=createResolution(canvas,{width:500,height:400},{art,imageUrl:f=>f}),images=['a','b','c'].map(id=>tagArt({width:1024,height:1024},id+'.png'));
 const frames=async()=>{for(let i=0;i<12;i++){surface.begin('snow');for(const im of images)ctx.drawImage(im,10,10);await new Promise(r=>setTimeout(r,0));}};
 await frames();assert.equal(loaded.length,3,'each visible HD variant admitted at most once per view');assert.equal(surface.stats().pending,0);assert.ok(surface.stats().peakBytes<=surface.stats().budget);
 left=-100;await frames();assert.ok(loaded.length>3,'panning permits a fresh HD selection');assert.ok(loaded.length<=6,'new view also settles');
});
test('a side canvas (night statue copy) swaps for HD off screen, says when it waits, and never rebuilds the ground',async()=>{
 const calls=[];class FakeImage{width=200;height=200;set src(value){queueMicrotask(()=>this.onload());}}
 const ctx={drawImage(){},setTransform(){},getTransform:()=>({a:1,b:0,c:0,d:1,e:0,f:0})};
 const surface=createResolution({width:0,height:0,style:{},dataset:{},getContext:()=>ctx,getBoundingClientRect:()=>({left:0,top:0,width:2560,height:1440}),ownerDocument:{defaultView:{innerWidth:1280,innerHeight:800,devicePixelRatio:2,Image:FakeImage}}},{width:2560,height:1440},
  {art:{'statue.png':{file:'hd/statue.webp',density:2,width:100,height:100}},imageUrl:file=>file});
 let rebuilt=0;surface.adopt({drawImage(){}},()=>rebuilt++);
 const side={drawImage:(...args)=>calls.push(args)},waiting=surface.side(side),statue=tagArt({width:100,height:100},'statue.png');
 side.drawImage(statue,99999,99999);assert.equal(calls.at(-1)[0],statue);assert.equal(waiting(),true);
 for(let i=0;i<5&&waiting();i++)await new Promise(resolve=>setTimeout(resolve,0));
 assert.equal(waiting(),false);side.drawImage(statue,0,0);assert.ok(calls.at(-1)[0] instanceof FakeImage);
 assert.equal(rebuilt,0);
});
