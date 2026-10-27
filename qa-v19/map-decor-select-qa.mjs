// The wallet is an intercepted, in-memory fixture in an opaque iframe. No real services.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const game=path.resolve(process.argv[2]||path.join(root,'garden-v05'));
const output=path.resolve(process.argv[3]||path.join(root,'qa-v19/map-decor-select-qa.json'));
const require=createRequire(import.meta.url),deps='/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/';
const {chromium,webkit}=require(deps+'playwright'),sharp=require(deps+'sharp');
const origin='http://127.0.0.1:3026',reports=[];

for(const [name,type] of [['Chrome',chromium],['WebKit',webkit]]) {
 const browser=await type.launch(name==='Chrome'?{channel:'chrome',headless:true}:{headless:true});
 try {
  for(const viewport of [{width:1280,height:800},{width:375,height:812},{width:320,height:568},{width:812,height:375}].filter(v=>!process.env.SELECT_QA_WIDTH||v.width===Number(process.env.SELECT_QA_WIDTH))) {
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

   // Tap a world point (garden tile coordinates) through the canvas, like a player would.
   const tapWorld=async([c,r],lift)=>{
    const p=await frame.evaluate(([c,r,lift])=>{const canvas=document.getElementById('world'),b=canvas.getBoundingClientRect(),m=window.FARM_SCENE,s=b.width/canvas.width;const x=b.left+(m.origin.x+(c-r)*m.tileWidth/2)*s,y=b.top+(m.origin.y+(c+r)*m.tileHeight/2-lift)*s;return {x,y,open:document.elementFromPoint(x,y)===canvas};},[c,r,lift]);
    // Skip a target the dock/HUD covers at this viewport; the tray path is checked separately.
    const inside=p.open&&p.x>2&&p.y>2&&p.x<viewport.width-2&&p.y<viewport.height-2;
    if(inside)await page.mouse.click(p.x,p.y);
    return inside;
   };
   const selected=()=>frame.locator('.decor-dock-choice[aria-pressed="true"]').getAttribute('data-decor-id');
   const before=await snapshot();
   const pond=await frame.evaluate(()=>window.FARM_SCENE.objects.find(o=>o.id==='pond'));
   const checks=[];
   if(await tapWorld([pond.col,pond.row],30)){
    await frame.locator('#decorWorkPane').waitFor();
    assert.equal(await selected(),'scene:pond');checks.push('pond');
    assert.equal(await frame.locator('#decorDockPlace').isHidden(),true,'the pond has no move/turn action');
    await press(frame.locator('#decorDockStash'));
    await frame.waitForFunction(()=>window.__HAGRID_GARDEN_QA__.getSnapshot().state.decorations.hiddenDefaults?.includes('scene:pond'));
    assert.equal(await frame.locator('#decorDockPlace').innerText(),'Đặt lại');
    await press(frame.locator('#decorDockPlace'));
    await frame.waitForFunction(()=>!window.__HAGRID_GARDEN_QA__.getSnapshot().state.decorations.hiddenDefaults?.includes('scene:pond'));
    await press(frame.locator('#buildSectionButton'));
   }
   const lantern=await frame.evaluate(async()=>{const m=await import('/garden-v05/decor-runtime.mjs?v=24.9.86');return m.decorSpot(window.__HAGRID_GARDEN_QA__.getSnapshot().state.decorations,'decor_pumpkin_lantern');});
   if(lantern&&await tapWorld(lantern,18)){
    await frame.locator('#decorWorkPane').waitFor({timeout:3000}).catch(async e=>{await page.screenshot({path:output.replace(/\.json$/,'-fail.png')});throw Error(JSON.stringify({lantern,mode:await frame.evaluate(()=>[...document.querySelectorAll('[aria-pressed=true]')].map(b=>b.id||b.dataset.decorId)),toast:await frame.evaluate(()=>document.querySelector('.toast')?.textContent)}));});
    assert.equal(await selected(),'decor_pumpkin_lantern');checks.push('bought');
    assert.equal(await frame.locator('#decorDockPlace').innerText(),'Di chuyển');
    assert.equal(await frame.locator('#decorDockStash').isVisible(),true);
   }
   const tile=frame.locator('.decor-dock-choice[data-decor-id^="decoration-"]').first();
   await press(frame.locator('#buildTool'));
   if(!await frame.locator('#decorWorkPane').isVisible())await press(frame.locator('#decorSectionButton'));
   if(await tile.count()){
    const id=await tile.getAttribute('data-decor-id');
    await press(tile);
    assert.equal(await frame.locator('#decorDockPlace').innerText(),'Xoay');
    const facing=await frame.evaluate(id=>window.__HAGRID_GARDEN_QA__.getSnapshot().state.decorationRotations?.[id]||'default',id);
    await press(frame.locator('#decorDockPlace'));
    assert.notEqual(await frame.evaluate(id=>window.__HAGRID_GARDEN_QA__.getSnapshot().state.decorationRotations?.[id]||'default',id),facing);
    assert.equal(await tile.isVisible(),true,'turning keeps the same tray tile');checks.push('earned-turn');
   }
   const keep=frame.locator('.decor-dock-choice[data-decor-id^="keepsake:"]').first();
   if(await keep.count()){await press(keep);assert.equal(await frame.locator('#decorDockStash').isVisible(),true);checks.push('keepsake');}
   const after=await snapshot();
   assert.deepEqual(after.inventory,before.inventory);assert.deepEqual(after.decorations.owned,before.decorations.owned);
   const layout=await frame.locator('#buildDock').evaluate(d=>({overflow:d.scrollWidth>d.clientWidth+1,pageOverflow:document.documentElement.scrollWidth>innerWidth}));
   assert.equal(layout.overflow,false);assert.equal(layout.pageOverflow,false);
   if(name==='Chrome'&&viewport.width===1280)await sharp(await page.screenshot()).png().toFile(output.replace(/\.json$/,'-desktop.png'));
   assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
   assert.ok(checks.includes('earned-turn')||checks.includes('pond'),'at least one default was exercised: '+checks);
   reports.push({browser:name,viewport,checks,errors});
   await context.close();
  }
 }finally{await browser.close();}
}
await fs.writeFile(output,JSON.stringify(reports,null,2)+'\n');console.log(`${reports.length} map selection cases passed`,JSON.stringify(reports.map(r=>[r.browser,r.viewport.width,r.checks])));
