// Audit actual Canvas draw destinations on disposable fixtures; no real account.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {forestRectOutsideBoundary} from '../garden-v05/forest-clearance.mjs';
import {exitSignFrame,forestExitTrail} from '../garden-v05/forest-composition.mjs';
import {createBoundaryFence} from '../garden-v05/garden-landscape.mjs';
import {stageBoundary} from '../garden-v05/garden-growth.mjs';
const require=createRequire(import.meta.url),deps='/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/';
const {chromium,webkit}=require(deps+'playwright'),sharp=require(deps+'sharp');
const browser=await(process.env.HAGRID_QA_WEBKIT?webkit.launch():chromium.launch({channel:'chrome',headless:true}));
const report={browser:process.env.HAGRID_QA_WEBKIT?'WebKit':'Chrome',stages:[],errors:[]};
const page=await browser.newPage({viewport:{width:1280,height:800},reducedMotion:'reduce'});
page.on('pageerror',e=>report.errors.push(e.message));
page.on('response',r=>{if(r.status()>=400)report.errors.push(r.status()+' '+r.url());});
await page.addInitScript(()=>{
 const trees=new WeakMap(),draw=CanvasRenderingContext2D.prototype.drawImage,text=CanvasRenderingContext2D.prototype.fillText;
 window.__forestDraws=[];window.__farmSigns=[];
 CanvasRenderingContext2D.prototype.drawImage=function(image,...args){
  const id=image?.src?.match(/(?:forest-v06|layers)\/(oak|pine|grove|log)\.webp/)?.[1]||trees.get(image);
  if(id){
   if(this.canvas.width<512&&this.canvas.height<512)trees.set(this.canvas,id);
   else if(this.canvas.width===2560&&this.canvas.height===1440){
    const [x,y,w,h]=args.length===8?args.slice(4):args.length===4?args:[...args,image.naturalWidth||image.width,image.naturalHeight||image.height];
    const m=this.getTransform(),pts=[[x,y],[x+w,y],[x+w,y+h],[x,y+h]].map(([a,b])=>[m.a*a+m.c*b+m.e,m.b*a+m.d*b+m.f]);
    window.__forestDraws.push({id,left:Math.min(...pts.map(p=>p[0])),right:Math.max(...pts.map(p=>p[0])),top:Math.min(...pts.map(p=>p[1])),bottom:Math.max(...pts.map(p=>p[1]))});
   }
  }
  return draw.call(this,image,...args);
 };
 CanvasRenderingContext2D.prototype.fillText=function(value,...args){
  if(value==='Trang trại của Hagrid'||value==='Người giữ khoá trường Hogwarts')window.__farmSigns.push({value,width:args[2]?Math.min(args[2],this.measureText(value).width):this.measureText(value).width});
  return text.call(this,value,...args);
 };
});
try{
 for(const level of [1,10,24,48,72,100,110]){
  await page.goto(`http://127.0.0.1:62795/qa-v19/ui-fixture.html?wallet=emulator&qa=1&level=${level}&scenario=bare&view=overview`);
  await page.waitForFunction(()=>window.__HAGRID_GARDEN_QA__?.getSnapshot().loaded&&window.__HAGRID_GARDEN_QA__?.getSnapshot().walletReady);
  const data=await page.evaluate(()=>({stage:window.__HAGRID_GARDEN_QA__.getWorldSnapshot().stage,map:window.FARM_SCENE,trees:window.__forestDraws,sign:window.__farmSigns}));
  assert.ok(data.trees.length>0);
  const gate=createBoundaryFence(data.map,stageBoundary(data.stage)).find(p=>p.gate);
  assert.ok(forestRectOutsideBoundary(exitSignFrame(forestExitTrail(data.map,gate.cellA[1])),data.map,stageBoundary(data.stage),0),'sign must remain outside the fence');
  const crossing=data.trees.filter(rect=>!forestRectOutsideBoundary(rect,data.map,stageBoundary(data.stage),9));
  assert.deepEqual(crossing,[],`level ${level} actual tree draws cross the boundary`);
  assert.deepEqual([...new Set(data.sign.map(s=>s.value))],['Trang trại của Hagrid','Người giữ khoá trường Hogwarts']);
  assert.ok(data.sign.every(s=>s.width<=176),'sign text fits between corner studs');
  report.stages.push({level,stage:data.stage.id,actualTreeDraws:data.trees.length,crossing:crossing.length,signLines:2});
  if(level===110){
   const png=await page.locator('#world').evaluate(c=>c.toDataURL('image/png').split(',')[1]);
   await sharp(Buffer.from(png,'base64')).extract({left:160,top:960,width:720,height:480}).png().toFile(new URL('exit-gate-20261023.png',import.meta.url).pathname);
  }
 }
 assert.equal(new Set(report.stages.map(s=>s.stage)).size,7,'cover every land chapter');
 assert.deepEqual(report.errors,[]);
 await fs.writeFile(new URL(`forest-ui-${report.browser.toLowerCase()}-20261023.json`,import.meta.url),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
