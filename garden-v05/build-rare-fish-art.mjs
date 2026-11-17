// ImageGen masters -> painted Lanczos HD -> native, as rebuild-winter-native.mjs.
// Only the six rarefish_* records and ev_fish_tank belong to this importer.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const root=path.dirname(fileURLToPath(import.meta.url));
const sharp=createRequire(import.meta.url)(process.env.SHARP_MODULE||'/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const read=f=>fs.readFile(path.join(root,f)),write=(f,b)=>fs.writeFile(path.join(root,f),b);
const hash=b=>createHash('sha256').update(b).digest('hex');
const source=JSON.parse(await read('masters-items/rare-fish/provenance.json'));
const hdText=(await read('hd-art.mjs')).toString(),hd=JSON.parse(hdText.match(/export const HD_ART=(\{.*\});/)[1]);
const bounds=(data,w,h)=>{let l=w,t=h,r=-1,b=-1;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(data[(y*w+x)*4+3]){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}if(r<0)throw Error('Empty art');return {x:l,y:t,w:r-l+1,h:b-t+1};};
const receipt=[];
async function exportFrame(record,w,h){
 const master=await read(record.master);if(hash(master)!==record.sha256)throw Error('Stale master '+record.id);
 let painted;
 if(record.id.startsWith('rarefish_')){
  // Inventory convention: head left, matching goldfish; orient before HD/native export.
  const fish=await sharp(master).trim().flop().resize(80,60,{fit:'inside',kernel:'lanczos3'}).toBuffer();
  const m=await sharp(fish).metadata();
  painted=await sharp({create:{width:128,height:128,channels:4,background:'#00000000'}}).composite([{input:fish,left:Math.floor((128-m.width)/2),top:112-m.height}]).png().toBuffer();
 }else painted=await sharp(master).resize(w*2,h*2,{fit:'fill',kernel:'lanczos3'}).png().toBuffer();
 const hdBytes=await sharp(painted).webp({quality:90,alphaQuality:100,effort:6}).toBuffer();
 const hdFile=`decor-assets/hd/${hash(hdBytes).slice(0,24)}.webp`;
 await write(hdFile,hdBytes);
 // Rebuild from the actual HD, retaining painted colours and binary native alpha.
 const data=await sharp(hdBytes).ensureAlpha().resize(w,h,{kernel:'lanczos3'}).raw().toBuffer();
 for(let p=3;p<data.length;p+=4){if(data[p]<128)data.fill(0,p-3,p+1);else data[p]=255;}
 const native=await sharp(data,{raw:{width:w,height:h,channels:4}}).png().toBuffer();
 const file=record.id.startsWith('rarefish_')?`native-items/${record.id}.png`:`decor-assets/native/${record.id}.png`;
 await write(file,native);hd[file]={file:hdFile,density:2,width:w,height:h};
 const result={id:record.id,file,width:w,height:h,pivotX:w/2,pivotY:h- (w===64?8:16),bounds:bounds(data,w,h)};
 receipt.push({...result,sha256:hash(native),hd:hdFile,hdSha256:hash(hdBytes)});return result;
}
const fish=[];for(const record of source.records.filter(r=>r.id.startsWith('rarefish_')))fish.push(await exportFrame(record,64,64));
const pond=(await read('pond-art.mjs')).toString();
const added=fish.map(({id,...spec})=>` ${JSON.stringify(id)}: ${JSON.stringify(spec)},`).join('\n');
// Re-running updates this slice without touching existing pond entries/scenery.
const clean=pond.split('\n').filter(line=>!/^ "rarefish_/.test(line)).join('\n');
await write('pond-art.mjs',clean.replace('export const POND_ART = Object.freeze({','export const POND_ART = Object.freeze({\n'+added));
const a=await exportFrame(source.records.find(r=>r.id==='ev_fish_tank'),128,160);
const b=await exportFrame(source.records.find(r=>r.id==='ev_fish_tank_right'),128,160);
const atlas='decor-assets/native/ev_fish_tank_atlas.png';
await write(atlas,await sharp({create:{width:256,height:160,channels:4,background:'#00000000'}}).composite([{input:await read(a.file),left:0,top:0},{input:await read(b.file),left:128,top:0}]).png().toBuffer());
const hdAtlas=await sharp({create:{width:512,height:320,channels:4,background:'#00000000'}}).composite([{input:await read(hd[a.file].file),left:0,top:0},{input:await read(hd[b.file].file),left:256,top:0}]).webp({quality:90,alphaQuality:100,effort:6}).toBuffer();
const atlasHd=`decor-assets/hd/${hash(hdAtlas).slice(0,24)}-atlas.webp`;await write(atlasHd,hdAtlas);hd[atlas]={file:atlasHd,density:2,width:256,height:160};
const mf='decor-assets-manifest.json',manifest=JSON.parse(await read(mf));
const tank={...a,kind:'decor',collection:'event',label:'Bể cá sáu loài',group:'Sổ cá',storeItem:false,rotatable:true,rightFile:b.file,rightBounds:b.bounds,footprintTiles:[2,2],angles:['default','right'],frames:Array(4).fill(atlas),rightFrames:Array(4).fill(atlas),atlasRects:Array(4).fill({x:0,y:0,w:128,h:160}),rightAtlasRects:Array(4).fill({x:128,y:0,w:128,h:160}),durations:[1000,1000,1000,1000],framesIdentical:true,artRevision:'authored-rare-fish-20261117',master:'masters-items/rare-fish/ev_fish_tank.png'};
const index=manifest.items.findIndex(i=>i.id===tank.id);if(index<0)manifest.items.push(tank);else manifest.items[index]=tank;
await write(mf,JSON.stringify(manifest,null,2)+'\n');
await write('hd-art.mjs',hdText.replace(/export const HD_ART=\{.*\};/,()=>`export const HD_ART=${JSON.stringify(hd)};`));
await write('masters-items/rare-fish/export-receipt.json',JSON.stringify({pipeline:'ImageGen -> head-left inventory orientation -> Lanczos HD (own colours) -> native Lanczos, alpha >= 128',frames:receipt},null,2)+'\n');
console.log(`Exported ${fish.length} fish icons and two aquarium facings.`);
