// Actual scene renderer, routed filesystem fixtures only; no server and no live wallet.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),game=path.resolve(process.argv[2]||path.join(root,'garden-v05'));
const output=path.resolve(process.argv[3]||path.join(root,'docs/noel-50-scene-qa.json'));
const require=createRequire(import.meta.url),deps='/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/';
const {chromium,webkit}=require(deps+'playwright'),sharp=require(deps+'sharp');
const origin='http://127.0.0.1:3026',reports=[];
for(const [name,type]of [['Chrome',chromium],['WebKit',webkit]].filter(([name])=>!process.argv.includes('--chrome-only')||name==='Chrome')){
 const browser=await type.launch(name==='Chrome'?{channel:'chrome',headless:true}:{headless:true});
 try{
 const context=await browser.newContext({viewport:{width:1280,height:800},deviceScaleFactor:1}),errors=[],external=[],requested=[];
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
  const E=await import('/garden-v05/progression-engine.mjs');
  const {createGarden,iso}=await import('/garden-v05/scene-renderer.mjs');
  const {decorSpotProblem}=await import('/garden-v05/decor-placement-ui.mjs');
  const {GARDEN_STAGES}=await import('/garden-v05/garden-growth.mjs');
  const {runtimeImageUrl}=await import('/garden-v05/runtime-image-url.mjs');
  const manifest=await fetch('/garden-v05/decor-assets-manifest.json').then(r=>r.json());
  const items=manifest.items.filter(item=>item.id.startsWith('nx_'));
  if(items.length!==50)throw Error('Expected all 50 items');
  const canvas=document.getElementById('world'),garden=await createGarden(canvas,{decorAssets:manifest.items});
  const now=Date.parse('2026-12-20T12:00:00+07:00'),state=E.testProfile(500,now);
  state.built=[...new Set([...state.built,...E.DB.expansions.map(e=>e.id)])];
  const assetOf=id=>manifest.items.find(item=>item.id===id),checked=[],draws=new Set(),original=CanvasRenderingContext2D.prototype.drawImage;
  CanvasRenderingContext2D.prototype.drawImage=function(image,...args){if(String(image.src).includes('/nx_'))draws.add(image.src);return original.call(this,image,...args);};
  let combinations=0;
  try{
   for(const item of items){
    for(const facing of ['default','right']){
     const decorations={owned:[item.id],placements:[item.id],rotations:{[item.id]:facing},positions:{}};
     let position;
     for(let row=21;row<=27&&!position;row+=.5)for(let col=2;col<=27&&!position;col+=.5){
      const reason=decorSpotProblem(col,row,{map:window.FARM_SCENE,stage:GARDEN_STAGES.at(-1),state,decorations,itemId:item.id,asset:item,iso,assetOf});
      if(!reason)position=[col,row];
     }
     if(!position)throw Error('No valid spot '+item.id+' '+facing);
     decorations.positions[item.id]=position;
     // Explicitly decode all lazy files before rendering; no sleep or external service.
     await Promise.all([...new Set([item.file,item.rightFile,...item.frames,...item.rightFrames])].map(file=>new Promise((resolve,reject)=>{const image=new Image();image.onload=resolve;image.onerror=reject;image.src=runtimeImageUrl(file);})));
     for(const weatherMode of ['clear','snow'])for(const reducedMotion of [false,true]){
      const options={now,clock:reducedMotion?0:1600,animationClock:reducedMotion?0:1600,decorations,weatherMode,atmosphereMode:'day',reducedMotion,propsVisible:true};
      garden.render(state,options);await new Promise(resolve=>requestAnimationFrame(resolve));garden.render(state,options);combinations++;
     }
     checked.push({id:item.id,facing,position});
    }
   }
   const ids=['nx_elf_yule_tent','nx_snitch_wreath','sp_xmas_weasley_tree'];
   const decorations={owned:ids,placements:ids,positions:{nx_elf_yule_tent:[9,24],nx_snitch_wreath:[13,24],sp_xmas_weasley_tree:[17,24]},rotations:{}};
   garden.render(state,{now,clock:1600,decorations,weatherMode:'snow',atmosphereMode:'day',propsVisible:true});
   await new Promise(resolve=>requestAnimationFrame(resolve));garden.render(state,{now,clock:1600,decorations,weatherMode:'snow',atmosphereMode:'day',propsVisible:true});
  }finally{CanvasRenderingContext2D.prototype.drawImage=original;}
  window.noelSceneCanvas=canvas;
  return {items:items.length,checked,combinations,drawnAtlases:[...draws].filter(url=>url.includes('_atlas.webp')).length,missing:garden.missing};
 });
 assert.equal(result.checked.length,100);assert.equal(result.combinations,400);assert.equal(result.drawnAtlases,50);assert.deepEqual(result.missing,[]);
 const viewports=[];
 for(const viewport of [{width:1280,height:800},{width:375,height:812}]){
  await page.setViewportSize(viewport);viewports.push(await page.evaluate(()=>({width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth})));
 }
 if(name==='Chrome'){
  const bytes=Buffer.from((await page.evaluate(()=>window.noelSceneCanvas.toDataURL('image/png'))).split(',')[1],'base64');
  await sharp(bytes).resize({width:800}).webp({lossless:true}).toFile(output.replace('.json','-scene.webp'));
 }
 assert.ok(viewports.every(v=>!v.overflow));assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 assert.ok(!requested.some(url=>/\.(png|jpe?g|gif)$/.test(url)),'runtime only WebP');
 reports.push({browser:name,...result,viewports,errors,external,runtimeOnlyWebp:true});
 await context.close();
 }finally{await browser.close();}
}
await fs.writeFile(output,JSON.stringify(reports,null,2)+'\n');console.log(JSON.stringify(reports.map(({browser,items,combinations,drawnAtlases})=>({browser,items,combinations,drawnAtlases}))));
