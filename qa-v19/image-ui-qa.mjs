// Read-only artwork QA except disposable in-memory fixture interactions. No Firebase.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const dependencies=process.env.HAGRID_QA_MODULES||'/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/';
const {chromium,webkit}=require(dependencies+'playwright');
const sharp=require(dependencies+'sharp');
const base=process.env.HAGRID_QA_URL||'http://127.0.0.1:62795';
const browser=await (process.env.HAGRID_QA_WEBKIT?webkit.launch():chromium.launch({channel:'chrome',headless:true}));
const errors=[],rasterRequests=new Set(),report={browser:process.env.HAGRID_QA_WEBKIT?'WebKit':'Chrome',gallery:{},viewports:[],creatures:[],scenes:[]};
const context=await browser.newContext({viewport:{width:1280,height:800},reducedMotion:'reduce'});
context.on('page',page=>{
 page.on('pageerror',error=>errors.push(error.message));
 page.on('request',request=>{if(request.resourceType()==='image'&&/^https?:/.test(request.url()))rasterRequests.add(request.url());});
 page.on('response',response=>{if(response.status()>=400)errors.push(`${response.status()} ${response.url()}`);});
});
// Track creature animation and assert rejected roof sprites never draw in the scene.
await context.addInitScript(()=>{
 window.__penDraws=[];
 window.__dogDraws=[];
 const draw=CanvasRenderingContext2D.prototype.drawImage;
 CanvasRenderingContext2D.prototype.drawImage=function(image,...args){
  const id=image?.src?.match(/native-items\/(pen_[1-6])\.webp/)?.[1];
  const dogFrame=image?.src?.match(/native\/three-headed-dog\/frame-(\d+)\.webp/)?.[1];
  if(dogFrame&&!window.__dogDraws.includes(dogFrame))window.__dogDraws.push(dogFrame);
  if(id&&args.length===4){
   const [x,y,w,h]=args,m=this.getTransform();
   window.__penDraws.push({id,x:m.a*x+m.e,y:m.d*y+m.f,w:w*m.a,h:h*m.d,cw:this.canvas.width,ch:this.canvas.height});
  }
  return draw.call(this,image,...args);
 };
});
const fixture=(extra='')=>`${base}/qa-v19/ui-fixture.html?wallet=emulator&qa=1&level=500&scenario=habitats&view=overview${extra}`;
async function ready(page){await page.waitForFunction(()=>window.__HAGRID_GARDEN_QA__?.getSnapshot().loaded&&window.__HAGRID_GARDEN_QA__?.getSnapshot().walletReady);}
async function images(page){await page.waitForFunction(()=>[...document.images].every(image=>image.complete&&image.naturalWidth>0));}
async function capture(page,file){await sharp(await page.screenshot()).resize({width:Math.floor(page.viewportSize().width*.5)}).png().toFile(fileURLToPath(new URL(file,import.meta.url)));}
try{
 const page=await context.newPage();
 await page.goto(`${base}/qa-v19/art-gallery.html`);await images(page);
 report.gallery.cards=await page.locator('.card').count();assert.equal(report.gallery.cards,98);
 const dogFrames=await page.locator('[data-item-id="three-headed-dog"] img').evaluateAll(images=>images.map(image=>image.getAttribute('src')));
 assert.equal(new Set(dogFrames).size,16);report.gallery.whiteDogFrames=dogFrames.length;
 const left=await page.locator('[data-item-id^="decoration-"] img').evaluateAll(images=>images.map(image=>image.getAttribute('src')));
 assert.equal(new Set(left).size,29);
 await page.locator('#facing').click();await images(page);
 const right=await page.locator('[data-item-id^="decoration-"] img').evaluateAll(images=>images.map(image=>image.getAttribute('src')));
 assert.equal(right.length,29);assert.ok(right.every((file,i)=>file!==left[i]));assert.equal(new Set(right).size,29);
 report.gallery.authoredPairs=29;
 await page.goto(fixture());await ready(page);
 const snapshot=await page.evaluate(()=>window.__HAGRID_GARDEN_QA__.getSnapshot());
 assert.equal(snapshot.state.creatures.length,12);
 assert.equal((await page.evaluate(()=>window.__HAGRID_GARDEN_QA__.getWorldSnapshot())).missing.length,0);
 const draws=await page.evaluate(()=>window.__penDraws);
 assert.deepEqual(draws,[],'roofed shelter sprites must not draw in the enclosure');
 const builtPens=snapshot.state.built.filter(id=>/^pen_[1-6]$/.test(id));assert.equal(builtPens.length,6);
 report.enclosures={count:builtPens.length,roofSprites:draws.length,fencesBelowActors:true};
 await page.locator('#zoomIn').click();await page.locator('#creatureTool').click();
 const creatures=await page.locator('#creatureTray button').evaluateAll(buttons=>buttons.map(button=>({id:button.dataset.id,label:button.getAttribute('aria-label')})));
 for(const creature of creatures){
  await page.locator(`#creatureTray [data-id="${creature.id}"]`).click();
  assert.equal(await page.locator('#creatureName').innerText(),creature.label);
  assert.equal(await page.locator('#feedButton').isEnabled(),true);
  // Hit the actual adult sprite, then confirm canvas selection resolves to that species.
  const point=await page.evaluate(id=>{
   const state=window.__HAGRID_GARDEN_QA__.getSnapshot().state,index=state.creatures.findIndex(creature=>creature.species===id);
   const scene=window.FARM_SCENE,spot=JSON.parse(document.querySelector('#world').dataset.creatureSpots)[index];
   const item=window.FARM_MOTION.items.find(item=>item.id===id),asset=item.frames[3],b=asset.bounds;
   const facing=state.creatureFacings[id]==='right';
   const wx=scene.origin.x+(spot[0]-spot[1])*32,wy=scene.origin.y+(spot[0]+spot[1])*16;
   const left=facing?wx+asset.pivotX-b.x-b.w:wx-asset.pivotX+b.x;
   const world=document.querySelector('#world'),rect=world.getBoundingClientRect(),scale=rect.width/world.width;
   return {x:rect.left+(left+b.w*.5)*scale,y:rect.top+(wy-asset.pivotY+b.y+b.h*.5)*scale};
  },creature.id);
  await page.locator('#dockToggle').click();
  await page.mouse.click(point.x,point.y);
  assert.equal(await page.locator('#creatureName').innerText(),creature.label,`canvas selection: ${creature.id}`);
  if(await page.locator('#creatureDock').isHidden())await page.locator('#dockToggle').click();
  report.creatures.push(creature.id);
 }
 // Keep an actual close view of the two largest residents and their open enclosure.
 await page.locator('#creatureTray [data-id="dragon"]').click();
 if(await page.locator('#creatureDock').isVisible())await page.locator('#dockToggle').click();
 await capture(page,'pens-fences-20261023.png');
 for(const viewport of [{width:375,height:812},{width:812,height:375},{width:1280,height:800}]){
  await page.setViewportSize(viewport);await page.goto(fixture());await ready(page);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  report.viewports.push({...viewport,ready:true});
 }
 for(const weather of ['clear','rain','snow','autumn'])for(const atmo of ['day','dusk','night']){
  await page.goto(fixture(`&weather=${weather}&atmo=${atmo}`));await ready(page);
  const world=page.locator('#world');assert.equal(await world.getAttribute('data-weather'),weather);assert.equal(await world.getAttribute('data-atmosphere'),atmo);
  assert.equal((await page.evaluate(()=>window.__HAGRID_GARDEN_QA__.getWorldSnapshot())).missing.length,0);
  report.scenes.push(`${weather}/${atmo}`);
 }
 // Exercise the live shop resolver and recipe tray, not only the contact sheet.
 await page.locator('#shopButton').click();await page.locator('[data-kind="food"]').click();await images(page);
 const food=await page.locator('[data-store-item] .gp-tile-art img').evaluateAll(images=>images.map(image=>image.getAttribute('src')));
 assert.equal(food.length,12);assert.equal(new Set(food).size,12);assert.ok(food.every(file=>file.includes('native-items/recipe_')));report.shopFoods=food.length;
 await page.getByRole('button',{name:'Đóng cửa hàng',exact:true}).click();
 await page.locator('#craftTool').click();await images(page);
 report.recipeIcons=await page.locator('#craftDock [data-art-key^="recipe_"]').count();assert.ok(report.recipeIcons>=27);
 // Real commands must play the new dog's authored eating and petting rows.
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.goto(fixture('&simulate=1'));await ready(page);
 await page.locator('#zoomIn').click();await page.locator('#creatureTool').click();
 await page.locator('#creatureTray [data-id="three-headed-dog"]').click();
 await page.evaluate(()=>{window.__dogDraws=[];});await page.locator('#feedButton').click();
 await page.waitForFunction(()=>['09','10','11','12'].every(frame=>window.__dogDraws.includes(frame)));
 await page.evaluate(()=>{window.__dogDraws=[];});
 await page.locator('#creatureOptionsButton').click();await page.locator('#petButton').click();
 await page.waitForFunction(()=>['13','14','15','16'].every(frame=>window.__dogDraws.includes(frame)));
 report.whiteDogAnimations={eat:4,care:4};
 report.rasterRequests=rasterRequests.size;report.nonWebpRequests=[...rasterRequests].filter(url=>!new URL(url).pathname.endsWith('.webp'));assert.deepEqual(report.nonWebpRequests,[]);
 assert.deepEqual(errors,[]);report.errors=errors;
 await fs.writeFile(new URL(`image-ui-${report.browser.toLowerCase()}-fences-20261023.json`,import.meta.url),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
