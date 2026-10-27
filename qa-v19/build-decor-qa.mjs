// The wallet is an intercepted, in-memory fixture in an opaque iframe. No real services.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const game=path.resolve(process.argv[2]||path.join(root,'garden-v05'));
const output=path.resolve(process.argv[3]||path.join(root,'qa-v19/build-decor-qa.json'));
const require=createRequire(import.meta.url),deps='/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/';
const {chromium,webkit}=require(deps+'playwright'),sharp=require(deps+'sharp');
const origin='http://127.0.0.1:3026',reports=[];

for(const [name,type] of [['Chrome',chromium],['WebKit',webkit]]) {
 const browser=await type.launch(name==='Chrome'?{channel:'chrome',headless:true}:{headless:true});
 try {
  for(const viewport of [{width:1280,height:800},{width:375,height:812},{width:320,height:568},{width:812,height:375}].filter(v=>!process.env.DECOR_QA_WIDTH||v.width===Number(process.env.DECOR_QA_WIDTH))) {
   const scenario='empty',level=100,touch=viewport.width<1000,errors=[],external=[];
   const context=await browser.newContext({viewport,hasTouch:touch,isMobile:touch,deviceScaleFactor:1});
   await context.route('**/*',async route=>{
    const url=new URL(route.request().url());
    if(['data:','blob:'].includes(url.protocol))return route.continue();
    if(url.origin!==origin){external.push(url.href);return route.abort();}
    try {
     let body,contentType;
     if(url.pathname==='/host'){
      body=`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0"><iframe title="Pet fixture" sandbox="allow-scripts" style="display:block;border:0;width:100vw;height:100vh" src="/qa-v19/ui-fixture.html?wallet=emulator&amp;qa=1&amp;level=${level}&amp;scenario=${scenario}&amp;simulate=1&amp;view=overview"></iframe>`;contentType='text/html';
     }else if(url.pathname==='/qa-v19/ui-fixture.html'){
      body=(await fs.readFile(path.join(game,'index.html'),'utf8')).replace('<html lang="vi">','<html lang="vi" data-wallet="fixture">').replace('<head>','<head><base href="/garden-v05/">');contentType='text/html';
     }else{
      const pathname=decodeURIComponent(url.pathname);
      const file=pathname.startsWith('/garden-v05/')?path.resolve(game,pathname.slice(12)):path.resolve(root,pathname.slice(1));
      if(!file.startsWith(game+path.sep)&&!file.startsWith(path.join(root,'qa-v19')+path.sep))throw Error('Unsafe fixture path');
      body=await fs.readFile(file);
      if(scenario==='owned'&&pathname==='/qa-v19/fixture-wallet.mjs')body=body.toString().replace('const result=server.handle(name,data);', 'if(name==="performHagridGardenAction")await new Promise(resolve=>setTimeout(resolve,400));const result=server.handle(name,data);');
      contentType={'.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp','.woff2':'font/woff2'}[path.extname(file)];
     }
     await route.fulfill({body,contentType,headers:{'Access-Control-Allow-Origin':'*'}});
    }catch(error){errors.push(url.pathname+': '+error.message);await route.fulfill({status:404,body:'missing'});}
   });
   const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
   await page.goto(origin+'/host');
   const frame=page.frames().find(f=>f!==page.mainFrame());
   await frame.waitForFunction(()=>window.__HAGRID_GARDEN_QA__?.getSnapshot().loaded&&window.__HAGRID_GARDEN_QA__?.getSnapshot().walletReady);
   assert.equal(await frame.evaluate(()=>window.origin),'null');
   const press=locator=>touch?locator.tap():locator.click();
   const snapshot=()=>frame.evaluate(()=>window.__HAGRID_GARDEN_QA__.getSnapshot().state);

   await press(frame.locator('#buildTool'));
   assert.equal(await frame.locator('#buildWorkPane').isVisible(),true);
   const buildAction=await frame.locator('#buildAction').elementHandle();
   const before=await snapshot(),money=await frame.locator('#walletValue').textContent();
   await press(frame.locator('#decorSectionButton'));
   assert.equal(await frame.locator('#buildWorkPane').isVisible(),false);
   assert.equal(await frame.locator('#decorWorkPane').isVisible(),true);
   assert.equal(await frame.locator('.decor-dock-choice').count(),before.decorations.owned.length);
   assert.deepEqual(await snapshot(),before,'opening decor never mutates a save');
   await press(frame.locator('[data-decor-id="decor_pumpkin_lantern"]'));
   await press(frame.locator('#decorDockStash'));
   await frame.waitForFunction(()=>!window.__HAGRID_GARDEN_QA__.getSnapshot().state.decorations.placements.includes('decor_pumpkin_lantern'));
   assert.equal(await frame.locator('#decorDockStash').isVisible(),false);
   assert.equal(await frame.locator('#decorDockPlace').innerText(),'Đặt');
   assert.equal(await frame.locator('#decorDockPlace').evaluate(e=>e===document.activeElement),true);
   const stashed=await snapshot();
   await press(frame.locator('#decorDockPlace'));
   await frame.locator('.decor-bar').waitFor();
   assert.deepEqual(await snapshot(),stashed,'placement preview does not auto-save');
   assert.equal(await frame.locator('.decor-bar-apply').isEnabled(),true);
   await press(frame.locator('.decor-bar-apply'));
   await frame.locator('.decor-bar').waitFor({state:'detached'});
   await frame.waitForFunction(()=>!!window.__HAGRID_GARDEN_QA__.getSnapshot().state.decorations.positions?.decor_pumpkin_lantern);
   const placed=await snapshot();
   assert.equal(await frame.locator('#decorDockPlace').innerText(),'Di chuyển');
   await press(frame.locator('#decorDockPlace'));
   await frame.locator('.decor-bar').waitFor();
   await press(frame.locator('.decor-bar-close'));
   await frame.locator('.decor-bar').waitFor({state:'detached'});
   assert.deepEqual(await snapshot(),placed,'cancel keeps the confirmed placement');
   assert.equal(await frame.locator('#decorDockPlace').evaluate(e=>e===document.activeElement),true);
   await press(frame.locator('#buildSectionButton'));
   assert.equal(await frame.locator('#buildWorkPane').isVisible(),true);
   assert.equal(await buildAction.evaluate(e=>e.isConnected),true,'construction controls are preserved across tabs');
   await press(frame.locator('#decorSectionButton'));
   await frame.locator('[data-decor-id="decor_pumpkin_lantern"]').focus();
   const selected=await frame.locator('[data-decor-id="decor_pumpkin_lantern"]').elementHandle();
   await page.waitForTimeout(1100);
   assert.equal(await selected.evaluate(e=>e===document.activeElement),true);
   assert.deepEqual((await snapshot()).inventory,before.inventory);
   assert.deepEqual((await snapshot()).decorations.owned,before.decorations.owned);
   assert.equal(await frame.locator('#walletValue').textContent(),money);
   if(name==='Chrome'&&[1280,375].includes(viewport.width))await sharp(await page.screenshot()).resize({width:Math.round(viewport.width*.5)}).png().toFile(output.replace(/\.json$/,viewport.width===375?'-phone.png':'-desktop.png'));
   await press(frame.locator('#decorDockShop'));
   await frame.locator('.store-popover').waitFor();
   assert.equal(await frame.locator('.store-tabs [data-kind=decoration]').getAttribute('aria-pressed'),'true');
   await press(frame.getByRole('button',{name:'Đóng cửa hàng',exact:true}));
   await frame.locator('.store-popover').waitFor({state:'detached'});
   assert.equal(await frame.locator('#decorDockShop').evaluate(e=>e===document.activeElement),true);
   await press(frame.locator('#decorDockCollection'));
   await frame.locator('[data-default-decor-toggle="scene:pond"]').waitFor();
   await press(frame.locator('#closePanel'));
   await frame.locator('#panel').waitFor({state:'hidden'});
   await frame.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   const layout=await frame.locator('#buildDock').evaluate(d=>{const r=d.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,height:r.height,overflow:d.scrollWidth>d.clientWidth+1,pageOverflow:document.documentElement.scrollWidth>innerWidth,small:[...d.querySelectorAll('button')].filter(b=>b.getClientRects().length&&b.getBoundingClientRect().height<44).map(b=>b.id)};});
   if(layout.y<48||layout.overflow){console.log(await frame.locator('#buildDock').evaluate(d=>[...d.querySelectorAll('.build-decor-tabs,.decor-work-pane,.owned-decor-tray,.decor-dock-choice,.decor-dock-detail,.decor-dock-footer')].slice(0,9).map(e=>({cls:e.className,height:e.getBoundingClientRect().height,css:getComputedStyle(e).minHeight}))));await sharp(await page.screenshot()).resize({width:Math.round(viewport.width*.5)}).png().toFile(output.replace(/\.json$/,'-failure.png'));}
   assert.ok(layout.x>=0&&layout.right<=viewport.width+1,JSON.stringify(layout));
   assert.ok(layout.y>=48&&layout.bottom<=viewport.height+1,JSON.stringify(layout));
   assert.equal(layout.overflow,false);assert.equal(layout.pageOverflow,false);assert.deepEqual(layout.small,[]);
   assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
   reports.push({browser:name,viewport,touch,owned:before.decorations.owned.length,stashPlaceCancel:true,noAutoPurchaseOrSave:true,constructionAndFocusPreserved:true,inventoryAndMoneyUnchanged:true,layout,errors,network:'strictly intercepted in-memory fixture'});
   await context.close();
  }
 }finally{await browser.close();}
}
await fs.writeFile(output,JSON.stringify(reports,null,2)+'\n');
console.log(`${reports.length} build/decor UI cases passed`);
