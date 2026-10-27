// The wallet is an intercepted, in-memory fixture in an opaque iframe. No real services.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const game=path.resolve(process.argv[2]||path.join(root,'garden-v05'));
const output=path.resolve(process.argv[3]||path.join(root,'qa-v19/placement-qa.json'));
const require=createRequire(import.meta.url),deps='/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/';
const {chromium,webkit}=require(deps+'playwright'),sharp=require(deps+'sharp');
const origin='http://127.0.0.1:3026',reports=[];

for(const [name,type] of [['Chrome',chromium],['WebKit',webkit]]) {
 const browser=await type.launch(name==='Chrome'?{channel:'chrome',headless:true}:{headless:true});
 try {
  for(const viewport of [{width:1280,height:800},{width:375,height:812},{width:320,height:568},{width:812,height:375}].filter(v=>!process.env.PLACEMENT_QA_WIDTH||v.width===Number(process.env.PLACEMENT_QA_WIDTH))) {
   const scenario='empty',level=100,touch=viewport.width<1000,errors=[],external=[];
   const context=await browser.newContext({viewport,hasTouch:touch,isMobile:touch,deviceScaleFactor:Number(process.env.PLACEMENT_QA_DPR||1)});
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

   await press(frame.locator('#buildTool'));await press(frame.locator('#decorSectionButton'));
   await press(frame.locator('[data-decor-id="decor_pumpkin_lantern"]'));await press(frame.locator('#decorDockStash'));
   await frame.waitForFunction(()=>!window.__HAGRID_GARDEN_QA__.getSnapshot().state.decorations.placements.includes('decor_pumpkin_lantern'));
   const before=await snapshot();
   await press(frame.locator('#decorDockPlace'));await frame.locator('.decor-bar').waitFor();
   const at=()=>frame.locator('.decor-bar').evaluate(e=>[Number(e.dataset.col),Number(e.dataset.row)]);
   const initial=await at();assert.ok(initial.every(Number.isInteger));
   await frame.waitForFunction(()=>document.querySelector('.decor-bar-thumb')?.complete);
   await page.waitForTimeout(150);
   if(name==='Chrome'&&[1280,375].includes(viewport.width))await sharp(await page.screenshot()).resize({width:Math.round(viewport.width*Number(process.env.PLACEMENT_QA_DPR||1)*.5)}).png().toFile(output.replace(/\.json$/,viewport.width===375?'-phone.png':'-desktop.png'));
   await press(frame.getByRole('button',{name:'Dịch lên trái',exact:true}));
   assert.deepEqual(await at(),[initial[0]-1,initial[1]]);
   await press(frame.getByRole('button',{name:'Dịch xuống phải',exact:true}));assert.deepEqual(await at(),initial);
   await press(frame.locator('.placement-step'));assert.equal(await frame.locator('.placement-step').innerText(),'½ ô');
   await press(frame.getByRole('button',{name:'Dịch lên trái',exact:true}));assert.deepEqual(await at(),[initial[0]-.5,initial[1]]);
   await press(frame.getByRole('button',{name:'Dịch xuống phải',exact:true}));
   await frame.locator('#cameraViewport').focus();await page.keyboard.press('ArrowRight');assert.deepEqual(await at(),[initial[0]+.5,initial[1]-.5]);
   await page.keyboard.press('ArrowLeft');assert.deepEqual(await at(),initial);
   const facing=await frame.locator('.decor-bar').getAttribute('data-facing');
   await page.keyboard.press('r');assert.notEqual(await frame.locator('.decor-bar').getAttribute('data-facing'),facing);await page.keyboard.press('r');
   const screen=await frame.evaluate(pos=>{const canvas=document.getElementById('world'),r=canvas.getBoundingClientRect(),m=window.FARM_SCENE,s=r.width/canvas.width;return {x:r.left+(m.origin.x+(pos[0]-pos[1])*m.tileWidth/2)*s,y:r.top+(m.origin.y+(pos[0]+pos[1])*m.tileHeight/2-16)*s,dx:32*s};},initial);
   const camera=await frame.locator('#cameraViewport').getAttribute('data-camera');
   if(name==='Chrome'&&touch){
    const cdp=await context.newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:screen.x,y:screen.y}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:screen.x+screen.dx,y:screen.y}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();
   }else{
    await page.mouse.move(screen.x,screen.y);await page.mouse.down();await page.mouse.move(screen.x+screen.dx,screen.y,{steps:8});await page.mouse.up();
   }
   assert.notDeepEqual(await at(),initial,'grabbing the preview moves the item');
   assert.equal(await frame.locator('#cameraViewport').getAttribute('data-camera'),camera,'dragging the item does not pan the camera');
   assert.deepEqual(await snapshot(),before,'nudge, rotate and drag are previews only');
   await frame.locator('#cameraViewport').focus();for(let i=0;i<65;i++)await page.keyboard.press('ArrowRight');
   assert.equal(await frame.locator('.decor-bar').getAttribute('data-blocked'),'true');assert.equal(await frame.locator('.decor-bar-apply').isDisabled(),true);
   await page.keyboard.press('Enter');assert.deepEqual(await snapshot(),before,'blocked position cannot be committed by Enter');
   await page.keyboard.press('Escape');await frame.locator('.decor-bar').waitFor({state:'detached'});assert.deepEqual(await snapshot(),before);
   assert.equal(await frame.locator('#decorDockPlace').evaluate(e=>e===document.activeElement),true);
   assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
   reports.push({browser:name,viewport,touchDrag:name==='Chrome'&&touch,mouseDrag:name!=='Chrome'||!touch,wholeAndHalfCellNudge:true,keyboard:true,dragKeepsCamera:true,blockedCommitRejected:true,previewAndCancelNeverSave:true,errors,network:'strict intercepted fixture'});
   await context.close();
  }
 }finally{await browser.close();}
}
await fs.writeFile(output,JSON.stringify(reports,null,2)+'\n');console.log(`${reports.length} placement interaction cases passed`);
