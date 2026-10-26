// Source/imported fixture QA. Every request stays in memory; no Next server or real wallet.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const game=path.resolve(process.argv[2]||path.join(root,'garden-v05'));
const output=path.resolve(process.argv[3]||path.join(root,'qa-v19/art-flow-qa.json'));
const screenshot=process.argv[4]||null;
const opaque=process.argv.includes('--opaque');
const require=createRequire(import.meta.url),deps='/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/';
const {chromium,webkit}=require(deps+'playwright'),sharp=require(deps+'sharp');
const origin='http://127.0.0.1:3026',reports=[];
for(const [browserName,type]of [['Chrome',chromium],['WebKit',webkit]]){
 const browser=await type.launch(browserName==='Chrome'?{channel:'chrome',headless:true}:{headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1280,height:800},deviceScaleFactor:1});
  const errors=[],external=[],requests=[];
  await context.route('**/*',async route=>{
   const url=new URL(route.request().url());if(['data:','blob:'].includes(url.protocol))return route.continue();
   if(url.origin!==origin){external.push(url.href);return route.abort();}
   const pathname=decodeURIComponent(url.pathname);let file;
   try{
    let body,contentType;
    if(pathname==='/qa-v19/iframe-host.html'){
     body=Buffer.from('<!doctype html><html><body style="margin:0"><iframe title="Garden fixture" sandbox="allow-scripts" style="display:block;border:0;width:100vw;height:100vh" src="/qa-v19/ui-fixture.html?wallet=emulator&amp;qa=1&amp;level=500&amp;scenario=habitats&amp;view=overview&amp;simulate=1"></iframe></body></html>');contentType='text/html';
    }else if(pathname==='/qa-v19/ui-fixture.html'){
     body=Buffer.from((await fs.readFile(path.join(game,'index.html'),'utf8')).replace('<html lang="vi">','<html lang="vi" data-wallet="fixture">').replace('<head>','<head><base href="/garden-v05/">'));
     contentType='text/html';
    }else{
     file=pathname.startsWith('/garden-v05/')?path.resolve(game,pathname.slice(12)):path.resolve(root,pathname.slice(1));
     if(!file.startsWith(game+path.sep)&&!file.startsWith(path.join(root,'qa-v19')+path.sep))throw Error('unsafe fixture path');
     body=await fs.readFile(file);contentType={'.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp','.woff2':'font/woff2'}[path.extname(file)];
    }
    requests.push({path:pathname,bytes:body.length});
    await route.fulfill({body,contentType,headers:{'Access-Control-Allow-Origin':'*'}});
   }catch(error){errors.push(pathname+': '+error.message);await route.fulfill({status:404,body:'missing'});}
  });
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
  await page.goto(origin+(opaque?'/qa-v19/iframe-host.html':'/qa-v19/ui-fixture.html?wallet=emulator&qa=1&level=500&scenario=habitats&view=overview&simulate=1'));
  let gamePage=opaque?page.frames().find(f=>f!==page.mainFrame()):page;
  if(opaque)assert.equal(await gamePage.evaluate(()=>window.origin),'null');
  await gamePage.waitForFunction(()=>window.__HAGRID_GARDEN_QA__?.getSnapshot().loaded&&window.__HAGRID_GARDEN_QA__?.getSnapshot().walletReady);
  const coverage=await gamePage.evaluate(async()=>{
   const E=await import('/garden-v05/progression-engine.mjs');
   const {visualItemIcon,itemArtKey}=await import('/garden-v05/ui-utils.mjs');
   const {makeRecipeIcon}=await import('/garden-v05/recipe-art-ui.mjs');
   const {FLOW_ITEM_ART}=await import('/garden-v05/flow-item-art.mjs');
   const {createGarden}=await import('/garden-v05/scene-renderer.mjs');
   const {decorSpotProblem}=await import('/garden-v05/decor-placement-ui.mjs');
   const {GARDEN_STAGES}=await import('/garden-v05/garden-growth.mjs');
   const {iso}=await import('/garden-v05/scene-renderer.mjs');
   const {runtimeImageUrl}=await import('/garden-v05/runtime-image-url.mjs');
   const items=new Map(window.FARM_MOTION.items.map(i=>[i.id,i]));
   const gallery=document.createElement('section');gallery.id='qaArtGallery';gallery.style.cssText='position:fixed;inset:0;z-index:99999;overflow:auto;background:#18352d;padding:16px;display:grid;grid-template-columns:repeat(auto-fill,minmax(90px,1fr));gap:8px';
   let visuals=0;
   for(const size of [26,40,52]){
    for(const crop of E.DB.crops){const icon=visualItemIcon(items,crop.id,{kind:'harvest',size});if(icon.classList.contains('is-art-missing')||!FLOW_ITEM_ART['harvest_'+crop.id])throw Error('Missing harvest '+crop.id);gallery.append(icon);visuals++;}
    for(const id of [...new Set(E.DB.recipes.map(r=>r.output))]){if(itemArtKey(id)!=='recipe_'+id)throw Error('Wrong output '+id);gallery.append(visualItemIcon(items,id,{kind:'output',size}));visuals++;}
    for(const creature of E.DB.animals){const key='keepsake_'+creature.id,icon=visualItemIcon(items,key,{kind:'keepsake',size});if(!icon.querySelector('[data-presentation="keepsake-statue"]')||icon.querySelector('.keepsake-pedestal-badge'))throw Error('Wrong keepsake '+key);gallery.append(icon);visuals++;}
    for(const id of ['produce_thestral','produce_three-headed-dog']){gallery.append(visualItemIcon(items,id,{kind:'produce',size}));visuals++;}
   }
   for(const recipe of E.DB.recipes){const icon=makeRecipeIcon(recipe,items,40);if(icon.getAttribute('aria-label')?.includes(recipe.output))throw Error('Raw ID in recipe label '+recipe.id);gallery.append(icon);visuals++;}
   document.body.append(gallery);
   await Promise.all([...gallery.querySelectorAll('img')].map(img=>img.decode()));
   const failed=[...gallery.querySelectorAll('img')].filter(img=>!img.complete||!img.naturalWidth).length;
   const overflow=[...gallery.querySelectorAll('.visual-slot')].some(icon=>icon.getBoundingClientRect().width>53);
   gallery.hidden=true;gallery.style.display='none';
   const canvas=document.createElement('canvas');canvas.id='qaSceneCanvas';
   const manifest=window.FARM_DECOR_MANIFEST||await fetch('/garden-v05/decor-assets-manifest.json').then(r=>r.json());
   const garden=await createGarden(canvas,{decorAssets:manifest.items});
   if(garden.missing.length)throw Error('Missing scene art '+garden.missing);
   const gridMetrics=garden.gridMetrics();
   if(window.FARM_SCENE.plotCellScale!==1||gridMetrics.some(m=>m.footprint.some(n=>!Number.isInteger(n)||n<1)))throw Error('Non-uniform garden grid');
   if(gridMetrics.filter(m=>m.kind==='plot').some(m=>m.ground.width!==192||m.ground.height!==96))throw Error('Wrong 3×3 plot pixels');
   if(gridMetrics.filter(m=>m.kind==='pen').some(m=>m.ground.width!==256||m.ground.height!==128))throw Error('Wrong 5×3 pen pixels');
   const now=Date.now(),state=E.testProfile(500,now);
   state.level=500;state.xp=E.DB.levels.at(-1).totalXP;state.built=[...new Set([...state.built,...E.DB.expansions.map(e=>e.id)])];
   state.plots=Array.from({length:18},()=>({slots:Array(9).fill(null),cooldowns:Array(9).fill(0),patterns:[]}));
   state.decorations=E.DB.decorations.map(d=>d.id);state.keepsakes=Object.fromEntries(E.DB.animals.map(a=>[a.id,1]));
   state.creatures=E.DB.animals.map(a=>({id:'qa-'+a.id,type:'creature',species:a.id,level:a.level,mealsCompleted:a.mealsToAdult,meal:null,cyclesClaimed:0,preview:false,adoptedAt:now-3*86400000}));
   for(let i=0;i<18*9;i++){const c=E.DB.crops[Math.floor(i/3)%E.DB.crops.length];state.plots[Math.floor(i/9)].slots[i%9]={id:'qa-'+i,type:'crop',species:c.id,plantedAt:now-3*86400000,growMs:c.growMs};}
   E.restoreChecked(state,now);
   const decorations={owned:['sp_whomping_anglia','hw_violet_mist_pond','hw_lantern_ancient_tree'],placements:['sp_whomping_anglia','hw_violet_mist_pond','hw_lantern_ancient_tree'],positions:{hw_violet_mist_pond:[2.5,26],sp_whomping_anglia:[22,25.5],hw_lantern_ancient_tree:[27.5,25.5]},rotations:{}};
   const assetOf=id=>manifest.items.find(i=>i.id===id);
   for(const id of decorations.owned){const [col,row]=decorations.positions[id];const reason=decorSpotProblem(col,row,{map:window.FARM_SCENE,stage:GARDEN_STAGES.at(-1),state,decorations,itemId:id,asset:assetOf(id),iso,assetOf});if(reason)throw Error(id+': '+reason);}
   const original=CanvasRenderingContext2D.prototype.drawImage,draws=[];
   CanvasRenderingContext2D.prototype.drawImage=function(image,...args){if(String(image.src).includes('/flow-')||String(image.src).includes('/decor-flow-'))draws.push({file:image.src,args});return original.call(this,image,...args)};
   let combinations=0;
   try{
    for(const facing of ['default','right'])for(const weatherMode of ['clear','rain','snow','autumn'])for(const atmosphereMode of ['day','dusk','night']){
     garden.render(state,{now,clock:2000,animationClock:2000,decorations:{...decorations,rotations:{hw_violet_mist_pond:facing}},weatherMode,atmosphereMode});combinations++;
    }
    for(const id of ['bubotuber','mimbulus','flitterbloom']){
     const index=E.DB.crops.findIndex(c=>c.id===id)*3;garden.animate('care',{plot:Math.floor(index/9),cells:[index%9]});
    }
    garden.render(state,{now,clock:2350,animationClock:2350,decorations,weatherMode:'clear',atmosphereMode:'day'});
   }finally{CanvasRenderingContext2D.prototype.drawImage=original;}
   for(const id of ['bubotuber','mimbulus','flitterbloom'])if(!draws.some(d=>d.file.includes('/flow-'+id+'/atlas.webp')))throw Error('Authored crop motion not drawn '+id);
   for(const draw of draws){if(draw.args.length===8&&(draw.args[2]!==draw.args[6]||draw.args[3]!==draw.args[7]))throw Error('Native atlas rescaled');}
   const material=E.DB.animals.find(a=>a.id==='three-headed-dog').produce;
   if(material!=='Sợi lông trắng Chó ba đầu')throw Error('Wrong dog fur name');
   const png=canvas.toDataURL('image/png');
   return {gridMetricEntries:gridMetrics.length,commonTilePixels:[64,32],plotGroundPixels:[192,96],penGroundPixels:[256,128],visuals,failedImages:failed,iconOverflow:overflow,harvestArt:Object.keys(FLOW_ITEM_ART).filter(k=>k.startsWith('harvest_')).length,canonicalOutputs:new Set(E.DB.recipes.map(r=>r.output)).size,keepsakes:E.DB.animals.length,worldCombinations:combinations,heroTriple:true,newCropMotionDraws:draws.length,nativeAtlasSize:true,scenePng:png};
  });
  assert.equal(coverage.failedImages,0);assert.equal(coverage.iconOverflow,false);
  assert.equal(coverage.harvestArt,32);assert.equal(coverage.canonicalOutputs,14);
  if(browserName==='Chrome')await sharp(Buffer.from(coverage.scenePng.split(',')[1],'base64')).resize({width:800}).png().toFile(output.replace(/\.json$/,'-scene.png'));
  delete coverage.scenePng;
  const viewportChecks=[];
  for(const viewport of [{width:1280,height:800},{width:375,height:812},{width:812,height:375}]){
   await page.setViewportSize(viewport);
   // Create the opaque child at the target viewport. Reusing its old OOP frame
   // after resize produced successful driver clicks without any DOM click event.
   if(opaque){
    await page.goto('about:blank');await page.goto(origin+'/qa-v19/iframe-host.html');
    gamePage=page.frames().find(f=>f!==page.mainFrame());
    await gamePage.waitForFunction(()=>window.__HAGRID_GARDEN_QA__?.getSnapshot().loaded&&window.__HAGRID_GARDEN_QA__?.getSnapshot().walletReady);
    assert.equal(await gamePage.evaluate(()=>window.origin),'null');
   }
   await gamePage.waitForFunction(({width,height})=>innerWidth===width&&innerHeight===height,viewport);
   // The inherited showcase uses an old off-grid socket. Stash through the UI
   // before testing a new placement; opening preview must not relocate it.
   await gamePage.evaluate(()=>window.__HAGRID_GARDEN_QA__.openDecorPlacement('decor_pumpkin_lantern'));
   await gamePage.locator('.decor-bar-stash').click();await gamePage.locator('.decor-bar').waitFor({state:'detached',timeout:5000}).catch(async error=>{throw Error(JSON.stringify({phase:'stash',browser:browserName,hint:await gamePage.locator('.decor-bar-hint').innerText(),viewport,errors,external}),{cause:error});});
   const before=await gamePage.evaluate(()=>JSON.stringify(window.__HAGRID_GARDEN_QA__.getSnapshot().state.decorations));
   await gamePage.evaluate(()=>window.__HAGRID_GARDEN_QA__.openDecorPlacement('decor_pumpkin_lantern'));
   await gamePage.locator('.decor-bar-turn').click();
   const after=await gamePage.evaluate(()=>JSON.stringify(window.__HAGRID_GARDEN_QA__.getSnapshot().state.decorations));
   assert.equal(after,before,'preview rotation did not mutate saved decoration state');
   assert.match(await gamePage.locator('.decor-bar-size').innerText(),/1×1 ô · nền 64×32 px/);
   const check=await gamePage.evaluate(()=>({viewport:{width:innerWidth,height:innerHeight},overflow:document.documentElement.scrollWidth>innerWidth,bar:(()=>{const r=document.querySelector('.decor-bar').getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom}})(),hint:document.querySelector('.decor-bar-hint').innerText}));
   assert.equal(check.overflow,false);assert.ok(check.bar.left>=0&&check.bar.right<=viewport.width+1);assert.ok(check.bar.bottom<=viewport.height+1);
   if(screenshot&&browserName==='Chrome'&&viewport.width===375)await sharp(await page.screenshot()).resize({width:188}).png().toFile(screenshot);
   assert.equal(await gamePage.locator('.decor-bar-apply').isEnabled(),true,'valid preview can be confirmed');
   await gamePage.locator('.decor-bar-apply').click();
   await gamePage.locator('.decor-bar').waitFor({state:'detached'});
   const confirmed=await gamePage.evaluate(()=>JSON.stringify(window.__HAGRID_GARDEN_QA__.getSnapshot().state.decorations));
   assert.notEqual(confirmed,before,'confirm saves the preview');
   const beforeFacing=JSON.parse(before).rotations?.decor_pumpkin_lantern||'default';
   assert.equal(JSON.parse(confirmed).rotations.decor_pumpkin_lantern,beforeFacing==='right'?'default':'right');
   await gamePage.evaluate(()=>window.__HAGRID_GARDEN_QA__.openDecorPlacement('decor_pumpkin_lantern'));
   await gamePage.locator('.decor-bar-turn').click();await gamePage.locator('.decor-bar-close').click();
   assert.equal(await gamePage.evaluate(()=>JSON.stringify(window.__HAGRID_GARDEN_QA__.getSnapshot().state.decorations)),confirmed,'cancel leaves the confirmed save unchanged');
   viewportChecks.push({...check,previewRotationSaveUnchanged:true,explicitConfirmSaved:true,cancelPreservedSave:true});
  }
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  assert.equal(requests.some(r=>/\.(png|jpe?g|gif)$/.test(r.path)),false,'internal raster requests are WebP');
  reports.push({browser:browserName,game,opaqueSandbox:opaque,network:'all intercepted, no service or real wallet',...coverage,viewportChecks,requests:requests.length,bytes:requests.reduce((n,r)=>n+r.bytes,0),errors});
 }finally{await browser.close();}
}
await fs.writeFile(output,JSON.stringify(reports,null,2)+'\n');console.log(JSON.stringify(reports,null,2));
