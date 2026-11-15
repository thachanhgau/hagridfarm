// Usage: node qa-v19/hd-draw-census.mjs garden-v05 out.json — every image drawn on any canvas (ART_SOURCE tags included), all 18 creatures and all crops at 4 growth points, 4 season/time contexts.
// Record every image actually drawn on any canvas while rendering the real garden in many states.
import fs from 'node:fs/promises';import path from 'node:path';import {createRequire} from 'node:module';
const game=path.resolve(process.argv[2]),out=process.argv[3];
const require=createRequire(import.meta.url),deps='/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/';
const {chromium}=require(deps+'playwright');const origin='http://127.0.0.1:3026';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const context=await browser.newContext({viewport:{width:1280,height:800},deviceScaleFactor:1}),requested=new Set(),errors=[];
 await context.route('**/*',async route=>{
  const url=new URL(route.request().url());if(url.origin!==origin)return route.abort();
  try{let body,contentType;
   if(url.pathname==='/scene'){const index=await fs.readFile(path.join(game,'index.html'),'utf8');const scripts=[...index.matchAll(/<script src="([^"]+)"[^>]*><\/script>/g)].map(m=>`<script src="${m[1]}"></script>`).join('');
    body=`<!doctype html><base href="/garden-v05/"><body><script>{const seen=window.__drawn=new Map();const orig=CanvasRenderingContext2D.prototype.drawImage;CanvasRenderingContext2D.prototype.drawImage=function(img,...a){const tag=window.__ART&&img&&img[window.__ART];const k=tag?'tag:'+tag.file:(img&&img.src?new URL(img.src).pathname:null);if(k)seen.set(k,(seen.get(k)||0)+1);return orig.call(this,img,...a);};}</script><canvas id="world"></canvas>${scripts}</body>`;contentType='text/html';}
   else{const file=path.resolve(game,decodeURIComponent(url.pathname).replace(/^\/garden-v05\//,''));body=await fs.readFile(file);contentType={'.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.webp':'image/webp','.png':'image/png'}[path.extname(file)];requested.add(url.pathname);}
   await route.fulfill({body,contentType,headers:{'Access-Control-Allow-Origin':'*'}});
  }catch(e){errors.push(url.pathname);await route.fulfill({status:404,body:''});}
 });
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(origin+'/scene');
 const states=await page.evaluate(async()=>{
  const E=await import('/garden-v05/progression-engine.mjs'),{createGarden}=await import('/garden-v05/scene-renderer.mjs'),winterKit=await import('/garden-v05/garden-winter.mjs');
  const manifest=await fetch('/garden-v05/decor-assets-manifest.json').then(r=>r.json());
  const garden=await createGarden(document.querySelector('canvas'),{decorAssets:manifest.items,hd:false});
  const log=[];const wait=()=>new Promise(r=>setTimeout(r,120));
  window.__ART=(await import('/garden-v05/render-resolution.mjs?v=26.1')).ART_SOURCE;
  const now0=Date.parse('2026-07-01T09:00:00+07:00');
  const species=Object.keys(E.CREATURE),crops=Object.keys(E.CROP);
  for(const [month,weather] of [['2026-07-01T09:00:00+07:00','clear'],['2026-07-01T21:30:00+07:00','clear'],['2026-12-24T12:00:00+07:00','snow'],['2026-10-31T20:00:00+07:00','clear']]){
   const now=Date.parse(month);
   for(const growth of [0,.34,.67,1]){
    const state=E.testProfile(500,now);state.built=[...new Set([...state.built,...E.DB.expansions.map(e=>e.id)])];
    state.creatures=species.map((sp,i)=>{const a=E.CREATURE[sp];return {id:'c-'+sp,type:'creature',species:sp,level:a.level,adoptedAt:now-48*3600000,mealsCompleted:Math.round(a.mealsToAdult*growth),meal:null,cyclesClaimed:0,preview:false};});
    let n=0;for(const plot of state.plots)for(let k=0;k<plot.slots.length;k++){const sp=crops[n++%crops.length],c=E.CROP[sp];plot.slots[k]={type:'crop',species:sp,plantedAt:now-Math.floor(c.growMs*Math.min(growth+((n%4)*.25),1)),growMs:c.growMs};}
    const opts={now,decorations:null,weatherMode:weather,winterKit,winter:{...winterKit.winterSeason(now),active:weather==='snow',depth:.9},propsVisible:true};
    for(let c=0;c<40000;c+=333){try{garden.render(state,{...opts,clock:c,animationClock:c});}catch(e){log.push(String(e).slice(0,160));}}
    await wait();
   }
  }
  return log.slice(0,5);
 });
 await page.waitForTimeout(500);
 const drawn=await page.evaluate(()=>[...window.__drawn.entries()]);
 await fs.writeFile(out,JSON.stringify({drawn,requested:[...requested],errors:errors.slice(0,20),renderErrors:states},null,1));
 console.log('drawn',drawn.length,'requested',requested.size,'errors',errors.length,states);
}finally{await browser.close();}
