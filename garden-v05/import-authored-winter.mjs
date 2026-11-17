// Imports the 100 authored winter pieces (owner approved the art 17/11/2026) into the runtime decor pack.
//   node garden-v05/import-authored-winter.mjs ~/.codex/visualizations/2026/11/17/01a1e722-aa40-7dc2-a1da-eca6debbbabe/hagrid-winter-100/authored-winter-assets
// (HD there comes from source-tools/build-authored-winter-hd.mjs: lanczos from the masters, own colours, owner 17/11/2026.)
// The pack (ImageGen masters, native + HD exports, receipts) lives with the Codex art session; only its exported
// frames are copied here. Static ornaments: one atlas row [default | right], HD at density 2 from the masters.
import fs from 'node:fs/promises';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';import {createHash} from 'node:crypto';
import {SOFT_WINTER_PRODUCTS} from './soft-winter-products.mjs';
const root=path.dirname(fileURLToPath(import.meta.url)),pack=path.resolve(process.argv[2]||'');
const sharp=createRequire(import.meta.url)(process.env.SHARP_MODULE||'/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const sha=b=>createHash('sha256').update(b).digest('hex'),read=async f=>JSON.parse(await fs.readFile(f,'utf8'));
const exported=await read(path.join(pack,'export-receipt.json')),hdReceipt=await read(path.join(pack,'hd-receipt.json'));
const fromPack=f=>path.join(pack,f.replace(/^authored-winter-assets\//,''));
// Painted art at 2×: lossy WebP keeps the look at a fraction of lossless size (exact alpha kept).
const hdWebp=input=>sharp(input).webp({quality:90,alphaQuality:100,effort:6}).toBuffer();
const manifestFile=path.join(root,'decor-assets-manifest.json'),manifest=await read(manifestFile),hd={},runtime=[];
for(const product of SOFT_WINTER_PRODUCTS){
 const item=exported.items.find(i=>i.id===product.id);if(!item)throw Error('No authored export for '+product.id);
 if(JSON.stringify(item.footprint)!==JSON.stringify(product.footprint))throw Error(product.id+': footprint differs from the catalog');
 const {width,height}=item,names=[`${item.id}.png`,`${item.id}_right.png`],natives=[],hds=[];
 for(const [i,frame]of item.frames.entries()){
  const bytes=await fs.readFile(fromPack(frame.file));if(sha(bytes)!==frame.sha256)throw Error('Stale native '+frame.file);
  const hdFrame=hdReceipt.frames.find(f=>f.nativeFile===frame.file);if(!hdFrame||hdFrame.nativeSha256!==frame.sha256)throw Error('Stale HD for '+frame.file);
  const hdBytes=await fs.readFile(fromPack(hdFrame.file));if(sha(hdBytes)!==hdFrame.sha256)throw Error('Stale HD '+hdFrame.file);
  await fs.writeFile(path.join(root,'decor-assets/native',names[i]),bytes);natives.push(bytes);hds.push(hdBytes);
 }
 const atlas=`decor-assets/native/${item.id}_atlas.png`,cells=(list,d)=>list.map((input,i)=>({input,left:i*width*d,top:0}));
 await fs.writeFile(path.join(root,atlas),await sharp({create:{width:width*2,height,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(cells(natives,1)).png().toBuffer());
 const hdAtlas=await sharp({create:{width:width*4,height:height*2,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(cells(hds,2)).png().toBuffer();
 for(const [file,input,w]of [[`decor-assets/native/${names[0]}`,hds[0],width],[`decor-assets/native/${names[1]}`,hds[1],width],[atlas,hdAtlas,width*2]]){
  const webp=await hdWebp(input),out=`decor-assets/hd/${sha(webp).slice(0,24)}${file===atlas?'-atlas':''}.webp`;
  await fs.writeFile(path.join(root,out),webp);hd[file]={file:out,density:2,width:w,height};
 }
 const rect=i=>({x:i*width,y:0,w:width,h:height});
 runtime.push({id:item.id,kind:'decor',collection:'festival',group:product.group,label:product.label,storeItem:true,rotatable:true,width,height,pivotX:item.pivotX,pivotY:item.pivotY,
  file:`decor-assets/native/${names[0]}`,rightFile:`decor-assets/native/${names[1]}`,footprintTiles:product.footprint,angles:['default','right'],artRevision:'authored-winter-20261117',
  frames:Array(4).fill(atlas),rightFrames:Array(4).fill(atlas),atlasRects:Array(4).fill(rect(0)),rightAtlasRects:Array(4).fill(rect(1)),durations:[1000,1000,1000,1000],
  bounds:item.frames[0].bounds,rightBounds:item.frames[1].bounds,framesIdentical:true});
}
const ids=new Set(runtime.map(r=>r.id));manifest.items=[...manifest.items.filter(i=>!ids.has(i.id)),...runtime];
await fs.writeFile(manifestFile,JSON.stringify(manifest,null,2)+'\n');
const hdFile=path.join(root,'hd-art.mjs'),text=await fs.readFile(hdFile,'utf8'),current=JSON.parse(text.match(/export const HD_ART=(\{.*\});/)[1]);
await fs.writeFile(hdFile,text.replace(/export const HD_ART=\{.*\};/,()=>`export const HD_ART=${JSON.stringify({...current,...hd})};`));
console.log(JSON.stringify({imported:runtime.length,hdFiles:Object.keys(hd).length}));
