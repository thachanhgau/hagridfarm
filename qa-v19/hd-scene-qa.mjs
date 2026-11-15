// Actual scene renderer, routed filesystem fixtures only; no server and no live wallet.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),game=path.resolve(process.argv[2]||path.join(root,'garden-v05'));
const output=path.resolve(process.argv[3]||path.join(root,'docs/hd-scene-qa.json'));
const require=createRequire(import.meta.url),deps='/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/';
const {chromium,webkit}=require(deps+'playwright'),sharp=require(deps+'sharp');
const origin='http://127.0.0.1:3026',reports=[];
const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const context=await browser.newContext({viewport:{width:1280,height:800},deviceScaleFactor:2}),errors=[],external=[],requested=[];
 await context.route('**/*',async route=>{
  const url=new URL(route.request().url());if(url.protocol==='data:')return route.continue();
  if(url.origin!==origin){external.push(url.href);return route.abort();}
  try{
   let body,contentType;
   if(url.pathname==='/scene'){
    const index=await fs.readFile(path.join(game,'index.html'),'utf8');
    const scripts=[...index.matchAll(/<script src="([^"]+)"[^>]*><\/script>/g)].map(m=>`<script src="${m[1]}"></script>`).join('');
    body=`<!doctype html><base href="/garden-v05/"><meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0;background:#24483F"><canvas id="world" style="display:block;width:100%;image-rendering:pixelated"></canvas>${scripts}</body>`;
    contentType='text/html';
   }else{
    const file=path.resolve(game,decodeURIComponent(url.pathname).replace(/^\/garden-v05\//,''));
    if(!file.startsWith(game+path.sep))throw Error('unsafe fixture path');
    body=await fs.readFile(file);contentType={'.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.webp':'image/webp','.png':'image/png'}[path.extname(file)];
    requested.push(url.pathname);
   }
   await route.fulfill({body,contentType,headers:{'Access-Control-Allow-Origin':'*'}});
  }catch(error){errors.push(url.pathname+': '+error.message);await route.fulfill({status:404,body:'missing'});}
 });
 const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));await page.goto(origin+'/scene');

 const result=await page.evaluate(async()=>{
  const E=await import('/garden-v05/progression-engine.mjs'),{createGarden,iso}=await import('/garden-v05/scene-renderer.mjs'),winterKit=await import('/garden-v05/garden-winter.mjs');
  const manifest=await fetch('/garden-v05/decor-assets-manifest.json').then(r=>r.json()),canvas=document.querySelector('canvas'),garden=await createGarden(canvas,{decorAssets:manifest.items,pixelRatio:2});
  const now=Date.parse('2026-12-24T12:00:00+07:00'),state=E.testProfile(500,now);state.built=[...new Set([...state.built,...E.DB.expansions.map(e=>e.id)])];
  const ids=['nh_ravenclaw_winter_observatory','nh_ravenclaw_eagle_music_harp','nh_ravenclaw_celestial_globe'],positions=Object.fromEntries(ids.map((id,i)=>[id,[7+i*4,25]]));
  const decorations={owned:ids,placements:ids,positions,rotations:{}},options={now,clock:0,animationClock:0,decorations,weatherMode:'snow',winterKit,winter:{...winterKit.winterSeason(now),active:true,depth:.9},propsVisible:true};
  const [cx,cy]=iso(11,25),zoom=2;canvas.style.width=garden.map.width*zoom+'px';canvas.style.position='absolute';canvas.style.left=(640-cx*zoom)+'px';canvas.style.top=(400-(cy-75)*zoom)+'px';
  window.hdQA={canvas,garden,state,options,ids,positions};
  garden.setQuality(false);garden.render(state,options);
  // Let the lazy native decoration files complete before either comparison.
  await Promise.all(ids.map(id=>new Promise((resolve,reject)=>{const image=new Image();image.onload=resolve;image.onerror=reject;image.src='/garden-v05/'+manifest.items.find(i=>i.id===id).frames[0].replace('.png','.webp').replace('decor-assets/','runtime-webp/decor-assets/');})));
  await new Promise(resolve=>setTimeout(resolve,50));garden.render(state,options);
  return {ids,positions};
 });
 const variants=[];
 for(const hd of[false,true]){
  await page.evaluate(hd=>{const q=window.hdQA;q.garden.setQuality(hd);q.garden.render(q.state,q.options);},hd);
  if(hd)await page.waitForFunction(()=>{const q=window.hdQA;q.garden.render(q.state,q.options);const s=q.garden.resolution();return s.requests>=3&&s.pending===0;},{},{timeout:30000});
  const data=await page.evaluate(()=>{const q=window.hdQA,times=[];for(let i=0;i<12;i++){const t=performance.now();q.garden.render(q.state,q.options);times.push(performance.now()-t);}times.sort((a,b)=>a-b);const r=q.canvas.getBoundingClientRect(),asset=window.FARM_DECOR_MANIFEST?.items?.find(i=>i.id===q.ids[1]);return {resolution:q.garden.resolution(),medianFrame:times[6],p95Frame:times[11],missing:q.garden.missing,display:[r.width,r.height]};});
  const file=output.replace('.json',hd?'-hd.webp':'-native.webp');await sharp(await page.screenshot()).extract({left:640,top:400,width:1280,height:800}).webp({lossless:true}).toFile(file);variants.push({hd,...data,screenshot:path.basename(file)});
 }
 assert.deepEqual(variants[1].missing,[]);assert.ok(variants[1].resolution.hits>0);assert.ok(variants[1].resolution.peakBytes<=variants[1].resolution.budget);assert.equal(variants[0].display[0],variants[1].display[0]);assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 await fs.writeFile(output,JSON.stringify({browser:'Chrome',viewport:[1280,800],dpr:2,...result,variants,errors,external},null,2)+'\n');console.log(JSON.stringify(variants));
 await context.close();
}finally{await browser.close();}
