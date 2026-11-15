// Recover detail from current authored masters; never upscale native sprites and call that new detail.
import fs from 'node:fs/promises';import path from 'node:path';import {createHash} from 'node:crypto';import {createRequire} from 'node:module';import {fileURLToPath} from 'node:url';
import {quantize} from './build-pond-art.mjs';import {authoredCells} from './authored-atlas.mjs';
const root=path.dirname(fileURLToPath(import.meta.url)),sharp=createRequire(import.meta.url)('/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const read=async f=>JSON.parse(await fs.readFile(path.join(root,f),'utf8')),sha=b=>createHash('sha256').update(b).digest('hex'),density=2;
const runtime=await read('runtime-webp-manifest.json'),inventory=new Map(runtime.images.map(i=>[i.source,i])),pixels=new Map(),recovered=new Map(),atlasSpecs=new Map(),provenance=[],skipped=[];
await fs.mkdir(path.join(root,'decor-assets/hd'),{recursive:true});
async function rgba(file){if(!pixels.has(file))pixels.set(file,await sharp(path.join(root,file)).ensureAlpha().raw().toBuffer({resolveWithObject:true}));return pixels.get(file);}
function walk(value){if(!value||typeof value!=='object')return;if(value.file&&value.atlasRect){const list=atlasSpecs.get(value.file)||new Map();list.set(JSON.stringify(value.atlasRect),value.atlasRect);atlasSpecs.set(value.file,list);}for(const v of Object.values(value))if(v&&typeof v==='object')walk(v);}
async function save(native,raw,width,height,source){
 const nativePixels=await rgba(native),key=sha(nativePixels.data);
 if(!recovered.has(key)){const bytes=await sharp(raw,{raw:{width,height,channels:4}}).webp({lossless:true,exact:true}).toBuffer(),file=`decor-assets/hd/${sha(bytes).slice(0,24)}.webp`;await fs.writeFile(path.join(root,file),bytes);recovered.set(key,{file,density,width:width/density,height:height/density,bytes:bytes.length,sha256:sha(bytes)});provenance.push({native,file,...source});}
 return recovered.get(key);
}
async function recover(master,frame){
 let native=frame.file;try{await fs.access(path.join(root,native));}catch{if(master.startsWith('creature-motion-assets/'))native='creature-motion-assets/'+native;else return;try{await fs.access(path.join(root,native));}catch{return;}}
 const input=await fs.readFile(path.join(root,native));if(frame.sha256&&sha(input)!==frame.sha256){skipped.push({native,reason:'stale frame record'});return;}
 const rect=frame.sourceRect,b=frame.bounds;if(!rect||!b)return;
 const crop={left:rect.x??rect.left,top:rect.y??rect.top,width:rect.w??rect.width,height:rect.h??rect.height};
 const original=await sharp(path.join(root,master)).extract(crop).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let x0=original.info.width,y0=original.info.height,x1=-1,y1=-1,opaque=0;
 for(let y=0;y<original.info.height;y++)for(let x=0;x<original.info.width;x++){const i=(y*original.info.width+x)*4;if(original.data[i+3]<192){original.data[i+3]=0;continue;}original.data[i+3]=255;opaque++;x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
 if(x1<0)throw Error('Empty source '+master);
 const nativePixels=await rgba(native),width=nativePixels.info.width*density,height=nativePixels.info.height*density;
 const w=b.w*density,h=b.h*density,ink=quantize(await sharp(original.data,{raw:original.info}).extract({left:x0,top:y0,width:x1-x0+1,height:y1-y0+1}).resize(w,h,{kernel:'nearest'}).raw().toBuffer()),out=Buffer.alloc(width*height*4);
 // Old opaque-sheet sources retain the already-reviewed native alpha mask; transparent masters keep their fine contour.
 const legacyMask=opaque===original.info.width*original.info.height;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const dx=b.x*density+x,dy=b.y*density+y;if(dx<0||dy<0||dx>=width||dy>=height)throw Error('HD clipping '+native);const si=(y*w+x)*4,ni=(Math.floor(dy/density)*nativePixels.info.width+Math.floor(dx/density))*4;if(!legacyMask||nativePixels.data[ni+3])ink.copy(out,(dy*width+dx)*4,si,si+4);}
 await save(native,out,width,height,{master,masterSha256:sha(await fs.readFile(path.join(root,master))),sourceRect:crop,logicalBounds:b,legacyAlphaMask:legacyMask});
}
const manifests=['noel-50-assets/manifest.json','house-noel-assets/manifest.json','complete-objects-manifest.json','crop-complete-manifest.json','flow-art-manifest.json','decor-flow-manifest.json','item-art-manifest.json'];
for(const name of manifests){const data=await read(name);walk(data);const items=Array.isArray(data.items)?data.items:Object.values(data.items||{});
 for(const item of items){const master=item.master||item.source;if(!master||!/[.](png|webp)$/i.test(master))continue;const expected=item.masterSha256||item.sourceSha256;if(expected&&sha(await fs.readFile(path.join(root,master)))!==expected)throw Error('Master changed '+master);const frames=item.frameRecords||item.frames||[item];for(const frame of frames)if(typeof frame==='object')await recover(master,frame);}
 console.log('Recovered '+name);
}
// Creature sheets preserve authored directional frames and growth records; reject outdated refresh records.
const creatures=await read('creature-motion-assets/manifest.json');walk(creatures);
for(const item of creatures.items){
 for(const frame of item.frames||[])await recover('creature-motion-assets/'+item.generation.masterFile,{...frame,file:'creature-motion-assets/'+frame.file});
 for(const key of ['rightGrowth','leftActions']){const record=item[key];if(record?.master)for(const frame of record.frames||[])if(typeof frame==='object')await recover(record.master,frame);}
}
// Existing special/Halloween/event masters have two authored views and localized native motion effects.
function inkBounds(raw){let x=raw.info.width,y=raw.info.height,r=-1,b=-1;for(let v=0;v<raw.info.height;v++)for(let u=0;u<raw.info.width;u++)if(raw.data[(v*raw.info.width+u)*4+3]){x=Math.min(x,u);y=Math.min(y,v);r=Math.max(r,u);b=Math.max(b,v);}return {x,y,w:r-x+1,h:b-y+1};}
for(const pack of ['special-products-assets','halloween-assets','event-assets']){
 const data=await read(pack+'/manifest.json');
 for(const item of data.items){
  const master=pack+'/'+item.source,masterBytes=await fs.readFile(path.join(root,master));if(sha(masterBytes)!==item.sourceSha256)throw Error('Master changed '+master);
  const poses=authoredCells(await sharp(masterBytes).ensureAlpha().raw().toBuffer({resolveWithObject:true}),[2]);
  for(const [view,baseName]of [item.defaultFile,item.rightFile].entries()){
   const baseFile=pack+'/'+baseName,base=await rgba(baseFile);await recover(master,{file:baseFile,bounds:inkBounds(base),sourceRect:poses[view].sourceRect,sha256:item.pngSha256[baseName]});
   const recoveredBase=recovered.get(sha(base.data));if(!recoveredBase)continue;
   const hd=await sharp(path.join(root,recoveredBase.file)).ensureAlpha().raw().toBuffer();
   for(const relative of (view?item.rightFrames:item.defaultFrames)){
    const file=pack+'/'+relative,variant=await rgba(file);if(variant.data.equals(base.data))continue;
    const out=Buffer.from(hd);let changed=0;
    for(let y=0;y<base.info.height;y++)for(let x=0;x<base.info.width;x++){
     const at=(y*base.info.width+x)*4;if(variant.data.readUInt32LE(at)===base.data.readUInt32LE(at))continue;changed++;
     for(let yy=0;yy<density;yy++)for(let xx=0;xx<density;xx++)variant.data.copy(out,((y*density+yy)*base.info.width*density+x*density+xx)*4,at,at+4);
    }
    await save(file,out,base.info.width*density,base.info.height*density,{master,sourceRect:poses[view].sourceRect,nativeEffectPixels:changed,baseFile});
   }
  }
 }
}
// The cottage has a normal/winter pair, both authored in the retained master.
const homestead=await read('environment/homestead-20261108/provenance.json'),homesteadRaw=await sharp(path.join(root,homestead.master)).ensureAlpha().raw().toBuffer({resolveWithObject:true}),poses=authoredCells(homesteadRaw,[2]);
for(const [i,frame]of homestead.outputs.entries()){
 const native=await rgba(frame.file);let x0=native.info.width,y0=native.info.height,x1=-1,y1=-1;for(let y=0;y<native.info.height;y++)for(let x=0;x<native.info.width;x++)if(native.data[(y*native.info.width+x)*4+3]){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
 await recover(homestead.master,{...frame,bounds:{x:x0,y:y0,w:x1-x0+1,h:y1-y0+1},sourceRect:poses[i].sourceRect});
}
walk(await read('decor-assets-manifest.json'));
// Atlas metadata shares the original logical rectangles; each recovered cell is copied at doubled density.
const registry={};
for(const [file]of inventory){const raw=await rgba(file),hit=recovered.get(sha(raw.data));if(hit)registry[file]=hit;}
for(const [file,rectangles]of atlasSpecs){if(!inventory.has(file))continue;const raw=await rgba(file),layers=[];
 for(const r of rectangles.values()){
  const cell=await sharp(raw.data,{raw:raw.info}).extract({left:r.x,top:r.y,width:r.w,height:r.h}).raw().toBuffer(),hit=recovered.get(sha(cell));if(hit)layers.push({input:path.join(root,hit.file),left:r.x*density,top:r.y*density});
 }
 if(!layers.length)continue;
 const base=await sharp(raw.data,{raw:raw.info}).resize(raw.info.width*density,raw.info.height*density,{kernel:'nearest'}).png().toBuffer();
 const bytes=await sharp(base).composite(layers).webp({lossless:true,exact:true}).toBuffer(),output=`decor-assets/hd/${sha(bytes).slice(0,24)}-atlas.webp`;await fs.writeFile(path.join(root,output),bytes);
 registry[file]={file:output,density,width:raw.info.width,height:raw.info.height,bytes:bytes.length,sha256:sha(bytes),recoveredFrames:layers.length,totalFrames:rectangles.size};
}
const published=new Set(Object.values(registry).map(r=>r.file));for(const file of await fs.readdir(path.join(root,'decor-assets/hd')))if(/^[a-f0-9]{24}(?:-atlas)?\.webp$/.test(file)&&!published.has('decor-assets/hd/'+file))await fs.unlink(path.join(root,'decor-assets/hd',file));
await fs.writeFile(path.join(root,'hd-art.mjs'),'// Generated from current hash-verified authored frame records. Logical geometry stays native.\nexport const HD_ART='+JSON.stringify(Object.fromEntries(Object.entries(registry).map(([key,{file,density,width,height}])=>[key,{file,density,width,height} ])))+';\n');
const report={density,files:Object.keys(registry).length,uniqueMasterFrames:recovered.size,runtime:registry,runtimeBytes:Object.values(registry).reduce((n,r)=>n+r.bytes,0),provenance,skipped};await fs.writeFile(path.join(root,'hd-art-provenance.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({files:report.files,uniqueMasterFrames:report.uniqueMasterFrames,runtimeBytes:report.runtimeBytes,skipped:skipped.length}));
