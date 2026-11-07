// Throwaway preview pipeline; intentionally does not import/run the production exporter.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {SPRITE_PALETTE} from '../../../garden-v05/palette.mjs';
const require=createRequire(import.meta.url);
const sharp=require('/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const dir='docs/codex-briefs/ui-audit', masters='garden-v05/masters-items/ui-audit';
const {sources}=JSON.parse(await fs.readFile(`${dir}/sources.json`));
const palette=SPRITE_PALETTE.map(h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)));
const cache=new Map();
// Same RGB squared-distance snap and alpha threshold (192) as build-item-art.mjs.
function snap(r,g,b){const key=(r<<16)|(g<<8)|b;if(!cache.has(key))cache.set(key,palette.reduce((best,p)=>{const distance=(p[0]-r)**2+(p[1]-g)**2+(p[2]-b)**2;return distance<best.distance?{p,distance}:best;},{p:palette[0],distance:Infinity}).p);return cache.get(key);}
function bounds(data,w,h){let x0=w,y0=h,x1=-1,y1=-1;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(data[(y*w+x)*4+3]>=192){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}assert(x1>=0);return {x:x0,y:y0,w:x1-x0+1,h:y1-y0+1};}
async function raw(p){return sharp(p).ensureAlpha().raw().toBuffer({resolveWithObject:true});}
const records=[];
async function emit(id,source,cell,canvas=[64,64],max=[52,48],original=null){
 let {data,info}=await raw(source);if(cell!==null){const cw=info.width/3,ch=info.height/2;const cut=await sharp(data,{raw:info}).extract({left:Math.round(cell%3*cw),top:Math.round(Math.floor(cell/3)*ch),width:Math.round(cw),height:Math.round(ch)}).raw().toBuffer({resolveWithObject:true});data=cut.data;info=cut.info;}
 const b=bounds(data,info.width,info.height);const [W,H]=canvas;let box;
 if(original){const r=await raw(original);box=bounds(r.data,r.info.width,r.info.height);}else{const scale=Math.min(max[0]/b.w,max[1]/b.h);const w=Math.max(1,Math.round(b.w*scale)),h=Math.max(1,Math.round(b.h*scale));box={x:Math.floor((W-w)/2),y:W===64?56-h:Math.floor((H-h)/2),w,h};}
 const factor=8;let resized=await sharp(data,{raw:info}).extract({left:b.x,top:b.y,width:b.w,height:b.h}).resize(box.w*factor,box.h*factor,{kernel:'nearest',fit:'fill'}).png().toBuffer();
 const master=`${masters}/${id}.png`;
 await sharp({create:{width:W*factor,height:H*factor,channels:4,background:'#00000000'}}).composite([{input:resized,left:box.x*factor,top:box.y*factor}]).png().toFile(master);
 const small=await sharp(master).resize(W,H,{kernel:'nearest'}).ensureAlpha().raw().toBuffer();
 for(let i=0;i<small.length;i+=4){if(small[i+3]<192)small.fill(0,i,i+4);else{small.set(snap(small[i],small[i+1],small[i+2]),i);small[i+3]=255;}}
 const native=`${dir}/native/${id}.png`;await sharp(small,{raw:{width:W,height:H,channels:4}}).png().toFile(native);
 const ink=bounds(small,W,H);assert(ink.w<=max[0]&&ink.h<=max[1],id+' ink');assert([...small].filter((_,i)=>i%4===3).every(a=>a===0||a===255));
 const colors=new Set();for(let i=0;i<small.length;i+=4)if(small[i+3]){const key='#'+[...small.subarray(i,i+3)].map(n=>n.toString(16).padStart(2,'0')).join('');assert(SPRITE_PALETTE.map(c=>c.toLowerCase()).includes(key));colors.add(key);}
 if(original)assert.equal(ink.y+ink.h,box.y+box.h,'foot row '+id);
 records.push({id,master,native,canvas,ink,colors:colors.size,originalBox:original?box:null,verdict:'good'});
}
const groups=[['sheet1',['tan_suc','chapter_1','chapter_2','chapter_3','chapter_4','chapter_5']],['sheet2',['chapter_6','chapter_7','seed_packet','bubble_meal_ready','bubble_hungry','bubble_heart_small']],['sheet3',['ach_sprout_apprentice','ach_creature_friend','ach_herbology_artisan','ach_master_brewer','ach_forest_architect','ach_landscape_artist']],['sheet4',['ach_keepsake_curator','ach_hippogriff_rider','ach_unicorn_guardian','ach_dragon_tamer','ach_forest_envoy','ach_grand_keeper']]];
for(const [key,ids] of groups)for(let i=0;i<ids.length;i++){const id=ids[i];if(id==='seed_packet'||id==='bubble_meal_ready'||id==='bubble_hungry')continue;await emit(id,sources[key],i,id==='bubble_heart_small'?[9,8]:id.startsWith('bubble_')?[28,36]:[64,64],id==='bubble_heart_small'?[9,8]:id.startsWith('bubble_')?[26,32]:id==='seed_packet'?[48,56]:id.startsWith('ach_')?[40,40]:[52,48]);}
await emit('seed_packet',dir+'/packet-source.png',null,[64,64],[40,48]);
await emit('bubble_meal_ready',dir+'/bubble-source-0.png',null,[28,36],[26,32]);
await emit('bubble_hungry',dir+'/bubble-source-1.png',null,[28,36],[26,32]);
for(const [key,id,W,H,path] of [['yule','hero_yule',128,183,'world-v241/hero-yule.png'],['halloween','hero_halloween',128,80,'world-v241/hero-halloween.png'],['herbology','hero_herbology',136,158,'world-v241/hero-herbology.png'],['cottage','cottage_corner',150,75,'world-v242/cottage-corner.png']])await emit(id,sources[key],null,[W,H],[W,H],'garden-v05/'+path);
// Painterly card is deliberately not snapped. Keep a 4x master and nearest preview.
await sharp(sources.quidditch).resize(2560,1440,{fit:'fill',kernel:'nearest'}).png().toFile(`${masters}/event_quidditch.png`);
await sharp(`${masters}/event_quidditch.png`).resize(640,360,{kernel:'nearest'}).png().toFile(`${dir}/native/event_quidditch.png`);
records.push({id:'event_quidditch',master:`${masters}/event_quidditch.png`,native:`${dir}/native/event_quidditch.png`,canvas:[640,360],ink:{x:0,y:0,w:640,h:360},verdict:'good',note:'Painterly exception; generated source 1672x941, nearest enlarged 4x-canvas master.'});
await fs.writeFile(`${dir}/metrics.json`,JSON.stringify(records,null,2)+'\n');
console.log('Raster previews verified:',records.length);
