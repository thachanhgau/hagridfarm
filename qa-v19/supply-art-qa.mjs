// Static, intercepted browser fixture: no server, Firebase or real wallet traffic.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';

const root=path.resolve(fileURLToPath(new URL('../',import.meta.url)));
const require=createRequire(import.meta.url);
const dependencies=process.env.HAGRID_QA_MODULES||'/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/';
const {chromium,webkit}=require(dependencies+'playwright'),sharp=require(dependencies+'sharp');
const evidence=process.env.HAGRID_ART_EVIDENCE||path.join(root,'output/playwright');
const packaged=process.argv[2]?path.resolve(process.argv[2]):null;
const origin='http://127.0.0.1:3026';
const expected=['supply_water','supply_boost','supply_spring_water','premium_spring_rain','premium_felix_felicis','premium_prime_meal','premium_pen_feast','premium_skele_gro','premium_warm_nest'];
await fs.mkdir(evidence,{recursive:true});
const reports=[];
for(const [name,type] of [['Chrome',chromium],['WebKit',webkit]]){
 const browser=await type.launch(name==='Chrome'?{channel:'chrome',headless:true}:{headless:true});
 const report={browser:name,packaged:Boolean(packaged),network:'all requests intercepted; in-memory fixture',errors:[],viewports:[]};
 try{
  const context=await browser.newContext({viewport:{width:1280,height:800},reducedMotion:'reduce'});
  await context.route('**/*',async route=>{
   const url=new URL(route.request().url());
   if(url.protocol==='blob:'||url.protocol==='data:')return route.continue();
   if(url.origin!==origin){report.errors.push('blocked external request '+url.origin);return route.abort();}
   const relative=decodeURIComponent(url.pathname).replace(/^\//,'');
   let file=path.resolve(root,relative);
   if(packaged&&relative.startsWith('garden-v05/'))file=path.resolve(packaged,relative.slice('garden-v05/'.length));
   if(!file.startsWith(root+path.sep)&&!(packaged&&file.startsWith(packaged+path.sep)))throw Error('Unsafe fixture path');
   const contentType={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2'}[path.extname(file)]||'application/octet-stream';
   try{await route.fulfill({body:await fs.readFile(file),contentType,headers:{'Access-Control-Allow-Origin':'*'}});}
   catch{report.errors.push('missing '+relative);await route.fulfill({status:404,body:'missing'});}
  });
  const page=await context.newPage();page.on('pageerror',error=>report.errors.push(error.message));
  const images=()=>page.waitForFunction(()=>[...document.images].every(image=>image.complete&&image.naturalWidth>0));
  await page.goto(origin+'/qa-v19/art-gallery.html');await images();
  report.galleryCards=await page.locator('.card').count();assert.equal(report.galleryCards,125);
  assert.equal(await page.locator('.visual-slot svg').count(),0);
  report.galleryKeys=await page.locator('section').filter({has:page.locator('[data-item-id="water"]')}).locator('.visual-slot').evaluateAll(slots=>slots.map(slot=>slot.dataset.artKey));
  assert.deepEqual(report.galleryKeys,expected);
  const sample=await page.locator('[data-item-id="keepsake_puffskein"] [data-art-key="reward_trophy"] img').getAttribute('src');
  assert.match(sample,/runtime-webp\/native-items\/reward_trophy\.webp/);
  for(const viewport of [{width:320,height:568},{width:375,height:812},{width:812,height:375},{width:1280,height:800}]){
   await page.setViewportSize(viewport);
   await page.goto(origin+'/qa-v19/ui-fixture.html?wallet=emulator&qa=1&level=500&scenario=habitats&view=overview&simulate=1');
   await page.waitForFunction(()=>window.__HAGRID_GARDEN_QA__?.getSnapshot().loaded&&window.__HAGRID_GARDEN_QA__?.getSnapshot().walletReady);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   assert.deepEqual(await page.evaluate(()=>window.__HAGRID_GARDEN_QA__.getWorldSnapshot().missing),[]);
   await page.locator('#suppliesButton').click();await page.locator('[data-kind="premium"]').click();await images();
   const art=await page.locator('[data-store-item] .gp-tile-art').evaluateAll(tiles=>tiles.map(tile=>({key:tile.querySelector('[data-art-key]')?.dataset.artKey,svg:tile.querySelectorAll('svg').length,missing:tile.querySelectorAll('.is-art-missing').length,src:tile.querySelector('img')?.getAttribute('src')})));
   assert.equal(art.length,12);assert.equal(new Set(art.map(item=>item.key)).size,7);
   assert.ok(art.every(item=>!item.svg&&!item.missing&&item.src?.includes('runtime-webp/native-items/')));
   report.viewports.push({...viewport,premiumCards:art.length,nativeDesigns:7,missing:0});
   if(viewport.width===1280&&name==='Chrome')await sharp(await page.screenshot()).resize({width:640}).png().toFile(path.join(evidence,'hagrid-premium-shop.png'));
  }
  assert.deepEqual(report.errors,[]);reports.push(report);
 }finally{await browser.close();}
}
await fs.writeFile(path.join(root,'qa-v19/supply-art-qa-20261023.json'),JSON.stringify(reports,null,2)+'\n');
console.log(JSON.stringify(reports,null,2));
