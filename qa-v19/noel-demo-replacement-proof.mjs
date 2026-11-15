// Actual local 3026 demo; every network request is restricted to this origin, no real wallet.
import fs from 'node:fs/promises';import path from 'node:path';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),deps='/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/';
const {chromium}=require(deps+'playwright'),sharp=require(deps+'sharp');
const output=path.resolve(process.argv[2]||'docs/noel-demo-replacement-proof.json'),origin='http://127.0.0.1:3026';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const context=await browser.newContext({viewport:{width:1280,height:800},deviceScaleFactor:1}),errors=[],external=[];
 await context.route('**/*',route=>{const u=new URL(route.request().url());if(u.origin!==origin&&!['data:','blob:'].includes(u.protocol)){external.push(u.href);return route.abort();}return route.continue();});
 const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
 await page.goto(origin+'/__qa/hagrid-noel-50/index.html');
 await page.waitForFunction(()=>window.__NOEL_DEMO__?.items===50);
 assert.match(await page.locator('#subtitle').innerText(),/Đã thay 50/);
 const groups=[];
 for(let group=0;group<5;group++){
  await page.locator(`[data-group="${group}"]`).click();
  await page.waitForFunction(index=>window.__NOEL_DEMO__?.group===index&&[...document.querySelectorAll('#names img')].length===10&&[...document.querySelectorAll('#names img')].every(img=>img.complete&&img.naturalWidth>0),group);
  groups.push(await page.locator('#names img').evaluateAll(imgs=>imgs.map(img=>img.currentSrc)));
 }
 await page.waitForFunction(()=>new Set(performance.getEntriesByType('resource').filter(e=>e.name.includes('/nx_')&&e.name.includes('_atlas.webp')).map(e=>e.name)).size===50);
 const atlases=await page.evaluate(()=>[...new Set(performance.getEntriesByType('resource').filter(e=>e.name.includes('/nx_')&&e.name.includes('_atlas.webp')).map(e=>e.name))]);
 assert.equal(new Set(groups.flat()).size,50);assert.equal(atlases.length,50);
 const variants=[];
 for(const right of[false,true]){
  await page.locator('#calibration').click();await page.waitForFunction(()=>window.__NOEL_DEMO__?.group===-1&&document.querySelectorAll('#names img').length===5);
  if(right)await page.locator('#turn').click();
  await page.waitForFunction(()=>[...document.querySelectorAll('#names img')].every(img=>img.complete&&img.naturalWidth>0));
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const file=output.replace('.json',right?'-right.webp':'-default.webp');
  await sharp(await page.screenshot()).resize({width:800}).webp({lossless:true}).toFile(file);
  variants.push({facing:right?'right':'default',screenshot:path.basename(file),names:await page.locator('#names button').allTextContents()});
 }
 await page.setViewportSize({width:375,height:812});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 const pngRequests=await page.evaluate(()=>performance.getEntriesByType('resource').filter(e=>/\.(png|jpe?g|gif)(?:\?|$)/.test(e.name)).map(e=>e.name));assert.deepEqual(pngRequests,[]);
 await fs.writeFile(output,JSON.stringify({origin,actualLocalDemo:true,replacedCount:50,groups,atlases,variants,mobileWidth:375,noHorizontalOverflow:true,errors,external,pngRequests},null,2)+'\n');
 console.log('Actual 3026 demo: 50 new thumbnails + 50 new atlases, both facings, 375px layout, no errors or external services.');
 await context.close();
}finally{await browser.close();}
