// Browser check for phase-2 creature art (plan §9): item icons resolve through flow-item-ui/ui-utils (WebP runtime URLs,
// no placeholder), crup/knarl/salamander have every clip in both views with loadable atlases, habitats/keepsakes load,
// and the new 16×16 pixel icons exist. Adapted from creatures-art-2/browser-check.mjs.
// Every request is served from garden-v05 via context.route (no local server, no ports).
// Usage (repo root): node docs/codex-briefs/creatures-art-2/browser-check.mjs
import fs from 'node:fs/promises';import path from 'node:path';import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve('garden-v05'),origin='http://creatures.local/';
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.png':'image/png','.webp':'image/webp','.css':'text/css'};
const ids=['produce_crup','produce_knarl','produce_salamander','crup_feed','knarl_feed','salamander_feed','goldfish'],species=['crup','knarl','salamander'];
const page$=`<!doctype html><meta charset=utf-8><body>
<script src="motion-data.js"></script><script src="level-assets.js"></script><script src="motion-care-data.js"></script><script src="motion-idle-data.js"></script><script src="crop-complete-data.js"></script><script src="flow-crop-data.js"></script><script src="creature-motion-data.js"></script>
<script type="module">
import {visualItemIcon,itemArtKey} from './ui-utils.mjs?v=25.0.2';import {ICONS} from './pixel-icons.mjs?v=25.0.2';import {HABITAT_ART,KEEPSAKE_ART} from './complete-object-art.mjs?v=25.0.2';import {creatureView} from './creature-view.mjs';import {runtimeImageUrl} from './runtime-image-url.mjs?v=25.0.2';
const out={icons:{}},img=src=>new Promise(ok=>{const i=new Image();i.onload=()=>ok(i.naturalWidth+'x'+i.naturalHeight);i.onerror=()=>ok('ERROR '+src);i.src=runtimeImageUrl(src);});
for(const id of ${JSON.stringify(ids)}){const node=visualItemIcon(new Map(),id,{size:52});document.body.append(node);const im=node.querySelector('img');out.icons[id]={key:itemArtKey(id),placeholder:!!node.querySelector('.item-art-placeholder'),src:im?.getAttribute('src')??null};}
await Promise.all([...document.images].map(i=>i.complete?0:new Promise(ok=>{i.onload=i.onerror=ok;})));
for(const im of document.images)out.icons[Object.keys(out.icons).find(k=>out.icons[k].src===im.getAttribute('src'))].loaded=im.naturalWidth+'x'+im.naturalHeight;
out.creatures={};for(const id of ${JSON.stringify(species)}){const g=window.FARM_MOTION.items.find(i=>i.id===id);if(!g){out.creatures[id]=null;continue;}const views={};
 for(const facing of ['default','right']){const v=creatureView(g,facing),clips={};for(const name of ['growth','idle','action','eat','care'])clips[name]=(v.clips[name]?.frames||[]).filter(i=>v.frames[i]).length;views[facing]={direction:v.direction||'left',frames:v.frames.length,clips,atlas:await img(v.frames[0].file)};}
 out.creatures[id]={...views,habitat:await img(HABITAT_ART[id]?.file),keepsake:await img(KEEPSAKE_ART[id]?.file)};}
out.status=window.FARM_CREATURE_MOTION_STATUS;out.pixelIcons=['paw','hand_feed','campfire'].map(k=>ICONS[k]?.length===16&&ICONS[k].every(r=>r.length===16));
window.RESULT=out;
</script>`;
const browser=await chromium.launch({channel:'chrome'}),context=await browser.newContext(),failed=[],requests=[];
await context.route('**/*',async route=>{
 const url=new URL(route.request().url());if(url.origin+'/'!==origin)return route.abort();
 const rel=decodeURIComponent(url.pathname.slice(1))||'index.html';
 if(rel==='check.html')return route.fulfill({status:200,contentType:'text/html',body:page$});
 try{route.fulfill({status:200,contentType:types[path.extname(rel)]||'application/octet-stream',body:await fs.readFile(path.join(root,rel))});}catch{failed.push(rel);route.fulfill({status:404,body:''});}
});
const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>m.type()==='error'&&errors.push(m.text()));page.on('request',r=>requests.push(new URL(r.url()).pathname));
await page.goto(origin+'check.html');await page.waitForFunction(()=>window.RESULT,null,{timeout:20000});
const result=await page.evaluate(()=>window.RESULT);await browser.close();
const pngImages=requests.filter(p=>/\.png$/.test(p));
console.log(JSON.stringify({...result,missing:failed,errors,pngRequests:pngImages},null,1));
const views=Object.values(result.creatures).flatMap(c=>c?[c.default,c.right]:[null]);
const bad=failed.length||errors.length||pngImages.length||Object.values(result.icons).some(i=>i.placeholder||!i.loaded||!i.key)||views.some(v=>!v||v.frames!==20||Object.values(v.clips).some(n=>n!==4)||v.atlas.startsWith('ERROR'))||Object.values(result.creatures).some(c=>c.right.direction!=='right-authored'||c.habitat.startsWith('ERROR')||c.keepsake.startsWith('ERROR'))||!result.pixelIcons.every(Boolean);
if(bad){console.error('browser check FAILED');process.exitCode=1;}else console.log('browser check OK');
