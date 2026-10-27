// The wallet is an intercepted, in-memory fixture in an opaque iframe. No real services.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const game=path.resolve(process.argv[2]||path.join(root,'garden-v05'));
const output=path.resolve(process.argv[3]||path.join(root,'qa-v19/pet-controls-qa.json'));
const require=createRequire(import.meta.url),deps='/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/';
const {chromium,webkit}=require(deps+'playwright'),sharp=require(deps+'sharp');
const origin='http://127.0.0.1:3026',reports=[];
const viewports=[{width:1280,height:800},{width:820,height:760},{width:375,height:812},{width:320,height:568},{width:812,height:375}];
for(const [name,type] of [['Chrome',chromium],['WebKit',webkit]]) {
 const browser=await type.launch(name==='Chrome'?{channel:'chrome',headless:true}:{headless:true});
 try {
  const cases=viewports.map(viewport=>({viewport,scenario:'habitats',level:100}));
  for(const scenario of ['pet-adopt','owned','feeding','animal-ready','pet-no-food','pet-no-space','pet-mixed-ready'])cases.push({viewport:{width:375,height:812},scenario,level:22});
  for(const {viewport,scenario,level} of cases.filter(c=>(!process.env.PET_QA_CASE||c.scenario===process.env.PET_QA_CASE)&&(!process.env.PET_QA_WIDTH||c.viewport.width===Number(process.env.PET_QA_WIDTH)))) {
   const touch=viewport.width<1000,errors=[],external=[];
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
   await press(frame.locator('#creatureTool'));
   assert.equal(await frame.locator('#petCareTools #petButton').count(),1,'care actions live in the main pet dock');
   assert.equal(await frame.locator('#creatureOptions').count(),0,'care has no separate modal');
   if(await frame.locator('#petCareTools').isVisible())assert.equal(await frame.locator('#petButton img').count()>0,true,'pet care uses a game icon, not a text-only control');
   if(await frame.locator('#petCareTools').isVisible())await frame.waitForFunction(()=>[...document.querySelectorAll('#petCareTools button')].filter(b=>!b.hidden).every(b=>b.querySelector('img')&&[...b.querySelectorAll('img')].every(i=>i.complete&&i.naturalWidth>0)));
   const before=await snapshot();
   const detail=frame.locator('#petDetail');
   if(scenario==='habitats'){
    await press(frame.locator('.pet-card[data-id="dragon"]'));
    const fit=await frame.locator('#petPortrait').evaluate(box=>{const a=box.getBoundingClientRect(),b=box.querySelector('.sprite-icon').getBoundingClientRect();return b.x>=a.x+2&&b.y>=a.y+2&&b.right<=a.right-2&&b.bottom<=a.bottom-2;});
    assert.equal(fit,true,'the full dragon thumbnail fits inside its portrait');
    await press(frame.locator('.pet-card[data-id="bowtruckle"]'));
    assert.equal(await frame.locator('#creatureName').innerText(),'Que Xạo');
    await frame.locator('.pet-card[data-id="bowtruckle"]').focus();
    await frame.waitForFunction(()=>document.activeElement?.dataset.id==='bowtruckle');
    // The normal timer tick must not replace focused controls or reset selection/scroll.
    const beforeNode=await frame.locator('.pet-card[data-id="bowtruckle"]').elementHandle();
    await page.waitForTimeout(1200);
    assert.equal(await beforeNode.evaluate(n=>n===document.activeElement),true);
    assert.equal(await frame.locator('.pet-card[aria-pressed="true"]').getAttribute('data-id'),'bowtruckle');
    assert.deepEqual(await snapshot(),before,'passive UI refresh never changes progression');
    if(viewport.width===1280){
     for(const id of await frame.locator('.pet-card').evaluateAll(nodes=>nodes.map(n=>n.dataset.id))){
      const card=frame.locator(`.pet-card[data-id="${id}"]`);
      if(!await card.count())continue;
      await press(card);
      const fits=await frame.locator('#petPortrait').evaluate(box=>{const a=box.getBoundingClientRect(),b=box.querySelector('.sprite-icon').getBoundingClientRect();return b.x>=a.x+2&&b.y>=a.y+2&&b.right<=a.right-2&&b.bottom<=a.bottom-2;});
      assert.equal(fits,true,id+' stays inside the portrait');
     }
     await press(frame.locator('#petButton'));
     await frame.waitForFunction(()=>document.querySelector('.toast')?.textContent.includes('Đã vuốt ve'));
     await press(frame.locator('#rotateCreatureButton'));
     await press(frame.locator('#affinityButton'));
     await frame.locator('#panel:not([hidden])').waitFor();
     await press(frame.locator('#closePanel'));
     await frame.locator('#panel').waitFor({state:'hidden'});
    }
   }else if(scenario==='pet-adopt'){
    assert.equal(await frame.locator('#petAdoptTab').getAttribute('aria-pressed'),'true');
    assert.match(await frame.locator('#creatureStatus').innerText(),/miễn phí/);
    await press(frame.locator('#adoptButton'));
    await frame.waitForFunction(()=>window.__HAGRID_GARDEN_QA__.getSnapshot().state.creatures.length===1);
    assert.equal(await frame.locator('#petOwnedTab').getAttribute('aria-pressed'),'true');
    assert.equal(await frame.locator('#feedButton').isEnabled(),true);
    await press(frame.locator('#feedButton'));
    await frame.waitForFunction(()=>!!window.__HAGRID_GARDEN_QA__.getSnapshot().state.creatures[0].meal);
    assert.equal(await frame.locator('#claimAnimalButton').isDisabled(),true);
    assert.match(await frame.locator('#petTimer').innerText(),/Còn/);
    await press(frame.locator('#petAdoptTab'));
    await press(frame.locator('.pet-card[data-id="dragon"]'));
    assert.equal(await frame.locator('#adoptButton').isDisabled(),true);
    assert.equal(await frame.locator('#petHelp').innerText(),'Xem cấp mở');
    await press(frame.locator('.pet-card[data-id="bowtruckle"]'));
    const prep=await frame.evaluate(async()=>{const E=await import('/garden-v05/progression-engine.mjs');return E.CREATURE.bowtruckle;});
    const startFood=(await snapshot()).inventory[prep.feed];
    await press(frame.locator('#adoptButton'));
    await frame.waitForFunction(()=>window.__HAGRID_GARDEN_QA__.getSnapshot().state.creatures.length===2);
    assert.equal((await snapshot()).inventory[prep.feed],startFood-prep.mealPortions*3);
    assert.equal(await frame.locator('#creatureName').innerText(),'Que Xạo');
   }else if(scenario==='pet-mixed-ready'){
    assert.equal(await frame.locator('.pet-card[aria-pressed="true"]').getAttribute('data-id'),'bowtruckle');
    await press(frame.locator('.pet-card[data-id="puffskein"]'));
    await page.waitForTimeout(1200);
    assert.equal(await frame.locator('.pet-card[aria-pressed="true"]').getAttribute('data-id'),'puffskein');
   }else if(scenario==='owned'){
    await press(frame.locator('#feedButton'));
    assert.equal(await frame.locator('#feedButton').isDisabled(),true,'in-flight request disables the current action immediately');
    await frame.waitForFunction(()=>!!window.__HAGRID_GARDEN_QA__.getSnapshot().state.creatures[0].meal);
    const after=await snapshot();
    assert.equal(after.creatures[0].mealsCompleted,before.creatures[0].mealsCompleted);
    assert.equal(await frame.locator('#claimAnimalButton').isDisabled(),true);
   }else if(scenario==='feeding'){
    const icon=await frame.locator('#premium-prime_meal .pet-care-glyph').elementHandle();
    assert.equal(await frame.locator('#claimAnimalButton').isDisabled(),true);
    assert.match(await frame.locator('#petTimer').innerText(),/Còn/);
    await press(frame.locator('#mealBoostButton'));
    await frame.waitForFunction(at=>window.__HAGRID_GARDEN_QA__.getSnapshot().state.creatures[0].meal.readyAt<at,before.creatures[0].meal.readyAt);
    await press(frame.locator('#premium-prime_meal'));
    await frame.waitForFunction(()=>!document.querySelector('#claimAnimalButton').disabled);
    assert.equal(await frame.locator('#claimAnimalButton').isVisible(),true);
    assert.equal(await frame.locator('#premium-prime_meal .pet-care-count').innerText(),'×4');
    assert.equal(await icon.evaluate(n=>n.isConnected),true,'stock refresh preserves the original icon node');
   }else if(scenario==='animal-ready'){
    assert.equal(await frame.locator('#claimAnimalButton').isEnabled(),true);
    await press(frame.locator('#claimAnimalButton'));
    await frame.waitForFunction(()=>!window.__HAGRID_GARDEN_QA__.getSnapshot().state.creatures[0].meal);
    assert.equal((await snapshot()).creatures[0].mealsCompleted,before.creatures[0].mealsCompleted+1);
    assert.equal(await frame.locator('#feedButton').isEnabled(),true);
   }else if(scenario==='pet-no-food'){
    assert.equal(await frame.locator('#feedButton').isDisabled(),true);
    assert.equal(await frame.locator('#petHelp').innerText(),'Mua thức ăn');
    await press(frame.locator('#petHelp'));
    await frame.locator('.store-popover[role=dialog]').waitFor();
    assert.equal(await frame.locator('.store-tabs [data-kind=food]').getAttribute('aria-pressed'),'true');
    assert.match(await frame.locator('.store-cards-grid').innerText(),/Thức ăn Puffskein/);
    await press(frame.getByRole('button',{name:'Đóng cửa hàng',exact:true}));
    assert.equal(await frame.locator('#petHelp').evaluate(e=>e===document.activeElement),true);
    assert.deepEqual(await snapshot(),before,'opening the shop never buys or spends');
   }else if(scenario==='pet-no-space'){
    assert.equal(await frame.locator('#adoptButton').isDisabled(),true);
    assert.equal(await frame.locator('#petHelp').innerText(),'Xây chuồng');
    await press(frame.locator('#petHelp'));
    assert.equal(await frame.locator('#buildDock').isVisible(),true);
    await press(frame.locator('#creatureTool'));
   }
   const layout=await frame.evaluate(()=>{
    const dock=document.querySelector('#creatureDock'),r=dock.getBoundingClientRect();
    return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height,overflow:dock.scrollWidth>dock.clientWidth+1,pageOverflow:document.documentElement.scrollWidth>innerWidth,smallTargets:[...dock.querySelectorAll('button')].filter(b=>b.getClientRects().length&&!b.hidden&&b.getBoundingClientRect().height<44).map(b=>b.id)};
   });
   if(layout.overflow||scenario==='habitats'&&layout.height>300){console.log(await frame.locator('#creatureDock').evaluate(d=>[...d.children].map(e=>({id:e.id,class:e.className,w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height,scroll:e.scrollWidth,client:e.clientWidth,css:getComputedStyle(e).gridTemplateColumns}))));await sharp(await page.screenshot()).resize({width:Math.round(viewport.width*.5)}).png().toFile(output.replace(/\.json$/,'-failure.png'));}
   assert.ok(layout.x>=0&&layout.right<=viewport.width+1,JSON.stringify(layout));
   assert.ok(layout.y>=48&&layout.bottom<=viewport.height+1,JSON.stringify(layout));
   if(scenario==='habitats')assert.ok(layout.height<=300,JSON.stringify(layout));
   assert.equal(layout.overflow,false,JSON.stringify(layout));assert.equal(layout.pageOverflow,false);assert.deepEqual(layout.smallTargets,[]);
   if(name==='Chrome'&&scenario==='habitats'&&[375,1280].includes(viewport.width))await sharp(await page.screenshot()).resize({width:Math.round(viewport.width*.5)}).png().toFile(output.replace(/\.json$/,viewport.width===375?'-phone.png':'-desktop.png'));
   assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
   reports.push({browser:name,viewport,scenario,touch,opaque:true,layout,network:'strict interception; in-memory wallet',errors});
   await context.close();
  }
 }finally{await browser.close();}
}
await fs.writeFile(output,JSON.stringify(reports,null,2)+'\n');
console.log(`${reports.length} pet UI cases passed; source=${game}`);
