// Recover detail from current authored masters; never upscale native sprites and call that new detail.
import fs from 'node:fs/promises';import path from 'node:path';import {createHash} from 'node:crypto';import {createRequire} from 'node:module';import {fileURLToPath} from 'node:url';
import {quantize,inkBox} from './build-pond-art.mjs';import {authoredCells} from './authored-atlas.mjs';import {renderElf,ELF_SOURCES,FRIEND_SOURCES} from './build-elf-art.mjs';import {renderSign,SIGN_SOURCE} from './build-sign-art.mjs';
import {TRAY_ART,cutTray} from './water-crop-art.mjs';import {packAsset,provenance as waterGarden} from './build-water-garden-refresh.mjs';import {POND_SPECS,sceneryPixels as pondScenery} from './build-pond-art.mjs';import {EDGE_SPECS,sceneryPixels as edgeScenery} from './build-edge-art.mjs';
const root=path.dirname(fileURLToPath(import.meta.url)),sharp=createRequire(import.meta.url)('/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const read=async f=>JSON.parse(await fs.readFile(path.join(root,f),'utf8')),sha=b=>createHash('sha256').update(b).digest('hex'),density=2;
const runtime=await read('runtime-webp-manifest.json'),inventory=new Map(runtime.images.map(i=>[i.source,i])),pixels=new Map(),recovered=new Map(),atlasSpecs=new Map(),provenance=[],skipped=[];
await fs.mkdir(path.join(root,'decor-assets/hd'),{recursive:true});
async function rgba(file){if(!pixels.has(file))pixels.set(file,await sharp(path.join(root,file)).ensureAlpha().raw().toBuffer({resolveWithObject:true}));return pixels.get(file);}
const atlasCell=(file,rect)=>{const list=atlasSpecs.get(file)||new Map();list.set(JSON.stringify(rect),rect);atlasSpecs.set(file,list);};
// Single-cell records carry `atlasRect`; runtime decor (build-halloween-runtime / build-event-runtime) lists one rectangle per frame in `atlasRects`/`rightAtlasRects`.
function walk(value){if(!value||typeof value!=='object')return;if(value.file&&value.atlasRect)atlasCell(value.file,value.atlasRect);for(const [files,rects]of [['frames','atlasRects'],['rightFrames','rightAtlasRects']])if(Array.isArray(value[rects]))value[rects].forEach((r,i)=>atlasCell(value[files][i],r));for(const v of Object.values(value))if(v&&typeof v==='object')walk(v);}
// HD reduced 2:1 (a native pixel is opaque when ≥2 of its 4 HD pixels are) must overlap the native silhouette; thin stems and leaves sit near 0.66–0.9 (checked by eye 15/11), a wrong pose or source falls far lower.
function silhouette(native,raw,width){let both=0,any=0;const w=native.info.width;for(let y=0;y<native.info.height;y++)for(let x=0;x<w;x++){const n=native.data[(y*w+x)*4+3]>0;let c=0;for(let v=0;v<density;v++)for(let u=0;u<density;u++)if(raw[((y*density+v)*width+x*density+u)*4+3])c++;const h=c*2>=density*density;if(n&&h)both++;if(n||h)any++;}return any?both/any:1;}
async function save(native,raw,width,height,source){
 const nativePixels=await rgba(native),key=sha(nativePixels.data);
 if(!recovered.has(key)){const iou=silhouette(nativePixels,raw,width);if(iou<Number(process.env.HD_MIN_IOU??0.6)){skipped.push({native,reason:'silhouette',iou:+iou.toFixed(3)});return null;}source={...source,silhouetteIoU:+iou.toFixed(3)};const bytes=await sharp(raw,{raw:{width,height,channels:4}}).webp({lossless:true,exact:true}).toBuffer(),file=`decor-assets/hd/${sha(bytes).slice(0,24)}.webp`;await fs.writeFile(path.join(root,file),bytes);recovered.set(key,{file,density,width:width/density,height:height/density,bytes:bytes.length,sha256:sha(bytes)});provenance.push({native,file,...source});}
 return recovered.get(key);
}
// Pack items (special/Halloween/event) were exported with their own 12-colour subset (item-palettes.json → manifest `palette.colors`),
// snapped with the pack builder's weighted distance (2,3,1); their HD snaps to that same subset so hues match the 1× art.
function snapTo(colors){const pal=colors.map(h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16))),cache=new Map();
 return buf=>{for(let i=0;i<buf.length;i+=4){if(buf[i+3]<192){buf.fill(0,i,i+4);continue;}const k=buf.readUIntBE(i,3);if(!cache.has(k))cache.set(k,pal.reduce((a,p)=>{const d=2*(buf[i]-p[0])**2+3*(buf[i+1]-p[1])**2+(buf[i+2]-p[2])**2;return d<a[1]?[p,d]:a;},[pal[0],Infinity])[0]);buf.set(cache.get(k),i);buf[i+3]=255;}return buf;};}
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
 const w=b.w*density,h=b.h*density,ink=(frame.preserveColors?buf=>buf:frame.palette?snapTo(frame.palette):quantize)(await sharp(original.data,{raw:original.info}).extract({left:x0,top:y0,width:x1-x0+1,height:y1-y0+1}).resize(w,h,{kernel:'nearest',fit:'fill'}).flop(!!frame.flop).raw().toBuffer()),out=Buffer.alloc(width*height*4);
 // Old opaque-sheet sources retain the already-reviewed native alpha mask; transparent masters keep their fine contour.
 const legacyMask=opaque===original.info.width*original.info.height;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const dx=b.x*density+x,dy=b.y*density+y;if(dx<0||dy<0||dx>=width||dy>=height)throw Error('HD clipping '+native);const si=(y*w+x)*4,ni=(Math.floor(dy/density)*nativePixels.info.width+Math.floor(dx/density))*4;if(!legacyMask||nativePixels.data[ni+3])ink.copy(out,(dy*width+dx)*4,si,si+4);}
 // Water crops (water-crop-art.mjs): the same tray cut at density 2, found from the HD rim itself.
 const trayCut=TRAY_ART.test(native)&&cutTray(out,width,height,density)>0;
 await save(native,out,width,height,{...trayCut&&{trayCut},master,masterSha256:sha(await fs.readFile(path.join(root,master))),sourceRect:crop,logicalBounds:b,legacyAlphaMask:legacyMask,...frame.palette&&{palette:frame.palette}});
}
// Reviewed replacements win before legacy records: a similar silhouette is not proof of the right master.
const replacements=await read('isometric-hd-manifest.json');
replacements.items.push(...(await read('pond-coordinate-art.json')).items);
for(const item of replacements.items){
 if(sha(await fs.readFile(path.join(root,item.master)))!==item.masterSha256)throw Error('Replacement master changed '+item.id);
 for(const f of item.frameRecords.filter(f=>!f.effectBaseFile)){if(f.hdFile){const bytes=await fs.readFile(path.join(root,f.hdFile));if(sha(bytes)!==f.hdSha256)throw Error('Replacement HD changed '+f.file);const raw=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});await save(f.file,raw.data,raw.info.width,raw.info.height,{master:item.master,masterSha256:item.masterSha256,sourceRect:f.sourceRect,method:'same uniform master export at density 2',hdFile:f.hdFile,hdSha256:f.hdSha256,palette:item.paletteColors});}else await recover(item.master,{...f,palette:item.paletteColors});}
 for(const baseFile of new Set(item.frameRecords.map(f=>f.effectBaseFile).filter(Boolean)))await effectFrames(baseFile,item.frameRecords.filter(f=>f.effectBaseFile===baseFile).map(f=>f.file),{master:item.master,masterSha256:item.masterSha256});
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
// Pond creatures were redrawn on 08/11 from refresh masters; left poses are mirrors of the right ones.
const pondCreatures=await read('creature-motion-assets/pond-creatures.json');walk(pondCreatures);
for(const item of pondCreatures.items){const master=item.refresh?.master;if(!master)continue;if(sha(await fs.readFile(path.join(root,master)))!==item.refresh.sha256)throw Error('Master changed '+master);
 for(const direction of ['right','left'])for(const frame of item.frames?.[direction]||[])await recover(master,{...frame,file:'creature-motion-assets/'+frame.file,flop:direction==='left'});}
// Existing special/Halloween/event masters have two authored views and localized native motion effects.
function inkBounds(raw){let x=raw.info.width,y=raw.info.height,r=-1,b=-1;for(let v=0;v<raw.info.height;v++)for(let u=0;u<raw.info.width;u++)if(raw.data[(v*raw.info.width+u)*4+3]){x=Math.min(x,u);y=Math.min(y,v);r=Math.max(r,u);b=Math.max(b,v);}return {x,y,w:r-x+1,h:b-y+1};}
// Animated variants = the recovered base plus the native frame's own effect pixels, after any rigid vertical bob
// (floating candles rise 1–2 px), so moving art keeps its HD body instead of becoming 2× blocks.
async function effectFrames(baseFile,files,source){
 const base=await rgba(baseFile),hit=recovered.get(sha(base.data));if(!hit)return;
 const {width:W,height:H}=base.info,hd=await sharp(path.join(root,hit.file)).ensureAlpha().raw().toBuffer(),at=(x,y)=>y<0||y>=H?0:base.data.readUInt32LE((y*W+x)*4);
 for(const file of files){
  const variant=await rgba(file);if(variant.data.equals(base.data))continue;
  const diff=dy=>{let n=0;for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(variant.data.readUInt32LE((y*W+x)*4)!==at(x,y-dy))n++;return n;};
  let shift=0,changed=diff(0);for(const dy of [-1,-2,-3,1,2,3]){const n=diff(dy);if(n<changed){changed=n;shift=dy;}}
  const out=Buffer.alloc(hd.length);
  for(let y=0;y<H*density;y++){const from=y-shift*density;if(from>=0&&from<H*density)hd.copy(out,y*W*density*4,from*W*density*4,(from+1)*W*density*4);}
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
   const i=(y*W+x)*4;if(variant.data.readUInt32LE(i)===at(x,y-shift))continue;
   for(let yy=0;yy<density;yy++)for(let xx=0;xx<density;xx++)variant.data.copy(out,((y*density+yy)*W*density+x*density+xx)*4,i,i+4);
  }
  await save(file,out,W*density,H*density,{...source,nativeEffectPixels:changed,rigidShift:shift,baseFile});
 }
}
for(const pack of ['special-products-assets','halloween-assets','event-assets']){
 const data=await read(pack+'/manifest.json');
 for(const item of data.items){
  const master=pack+'/'+item.source,masterBytes=await fs.readFile(path.join(root,master));if(sha(masterBytes)!==item.sourceSha256)throw Error('Master changed '+master);
  const poses=authoredCells(await sharp(masterBytes).ensureAlpha().raw().toBuffer({resolveWithObject:true}),[2]);
  for(const [view,baseName]of [item.defaultFile,item.rightFile].entries()){
   const baseFile=pack+'/'+baseName,base=await rgba(baseFile);await recover(master,{file:baseFile,bounds:inkBounds(base),sourceRect:poses[view].sourceRect,sha256:item.pngSha256[baseName],palette:item.palette.colors});
   await effectFrames(baseFile,(view?item.rightFrames:item.defaultFrames).map(r=>pack+'/'+r),{master,sourceRect:poses[view].sourceRect});
  }
 }
}
// The cottage has a normal/winter pair, both authored in the retained master.
const homestead=await read('environment/homestead-20261108/provenance.json'),homesteadRaw=await sharp(path.join(root,homestead.master)).ensureAlpha().raw().toBuffer({resolveWithObject:true}),poses=authoredCells(homesteadRaw,[2]);
for(const [i,frame]of homestead.outputs.entries()){
 const native=await rgba(frame.file);let x0=native.info.width,y0=native.info.height,x1=-1,y1=-1;for(let y=0;y<native.info.height;y++)for(let x=0;x<native.info.width;x++)if(native.data[(y*native.info.width+x)*4+3]){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
 await recover(homestead.master,{...frame,bounds:{x:x0,y:y0,w:x1-x0+1,h:y1-y0+1},sourceRect:poses[i].sourceRect});
}
// Whole-master recovery: the master's ink box fits the native ink rectangle the builder placed it in.
const whole=async(master,frame)=>{const m=await sharp(path.join(root,master)).metadata();await recover(master,{...frame,sourceRect:{x:0,y:0,w:m.width,h:m.height}});};
// Festival routes and Halloween plot pockets are explicitly included; the ordinary scene census does not visit every event.
{const festival=await read('world-v241/masters/isometric-hd-audit-20261115/provenance.json');for(const a of festival.assets){if(sha(await fs.readFile(path.join(root,a.master)))!==a.sha256)throw Error('Festival master changed');await whole(a.master,{file:a.native,bounds:inkBounds(await rgba(a.native)),preserveColors:a.preserveColors});}}
{const gate=await read('environment/masters/halloween-gate-20261109/provenance.json');if(sha(await fs.readFile(path.join(root,gate.master)))!==gate.sha256)throw Error('Halloween gateway master changed');const cells=authoredCells(await sharp(path.join(root,gate.master)).ensureAlpha().raw().toBuffer({resolveWithObject:true}),[2]);for(const [i,f]of gate.outputs.entries())await recover(gate.master,{...f,sourceRect:cells[i].sourceRect,bounds:inkBounds(await rgba(f.file))});}
{const plots=await read('environment/masters/plot-variety-20261109/provenance.json');for(const group of plots.assets){if(sha(await fs.readFile(path.join(root,group.master)))!==group.sha256)throw Error('Plot-pocket master changed');const columns=group.master.endsWith('/workshop.png')?4:3,cells=authoredCells(await sharp(path.join(root,group.master)).ensureAlpha().raw().toBuffer({resolveWithObject:true}),Array(4).fill(columns));for(const [i,f]of group.outputs.entries())await recover(group.master,{...f,sourceRect:cells[i].sourceRect});}}
// Legacy sheets (build-native.mjs): motion-data.json records each frame's master cell and native ink bounds.
const motion=await read('motion-data.json');
for(const item of motion.items){if(sha(await fs.readFile(path.join(root,item.source)))!==item.sourceSha256)throw Error('Master changed '+item.source);for(const frame of item.frames)await recover(item.source,frame);}
// Growth frames (build-level-assets.mjs, masters-levels/*) and creature care frames (build-care-assets.mjs, masters-care/*):
// each frame records its master cell and native ink bounds; both builders re-run reproduce all 152 shipped frames pixel-exactly (15/11).
for(const [name,master]of [['level-assets.json',i=>[i.source,i.sourceSha256]],['care-assets-manifest.json',i=>[i.atlas.file,i.atlas.sourceSha256]]])for(const item of (await read(name)).items){
 const [file,expected]=master(item);if(sha(await fs.readFile(path.join(root,file)))!==expected)throw Error('Master changed '+file);for(const frame of item.frames)await recover(file,frame);}
// Six base decorations (generate-decor-assets.mjs): one authored pose per master and view, plus four animated variants each.
for(const id of ['pumpkin_lantern','broom_rack','cauldron','mandrake_planter','floating_candles','vine_arch'])for(const view of ['','_right']){
 const name=`decor_${id}${view}`,baseFile=`decor-assets/native/${name}.png`,master=`decor-assets/masters/${name}.png`;
 await whole(master,{file:baseFile,bounds:inkBounds(await rgba(baseFile))});
 await effectFrames(baseFile,[0,1,2,3].map(i=>`decor-assets/native/${name}_f${i}.png`),{master});
}
// Water garden (build-water-garden-refresh.mjs): orchard ground with re-centred basins, shore beds; its own packing at 4× its half-logical grid.
for(const item of waterGarden.assets){const bytes=await fs.readFile(path.join(root,item.master));if(sha(bytes)!==item.masterSha256)throw Error('Master changed '+item.master);
 if(sha(await fs.readFile(path.join(root,item.file)))!==item.sha256){skipped.push({native:item.file,reason:'stale frame record'});continue;}
 const {out,W,H}=await packAsset(item,bytes,2*density);await save(item.file,out,W,H,{master:item.master,masterSha256:item.masterSha256,method:'build-water-garden-refresh packAsset at 4× the half-logical grid'});}
// Pond tiers and the trail (build-pond-art / build-edge-art): the builder's placement on a 2× canvas, only where it still reproduces the shipped PNG.
for(const [specs,pixels]of [[POND_SPECS,s=>pondScenery(s)],[EDGE_SPECS,async s=>(await edgeScenery(s)).pixels]])for(const spec of specs){
 const now=await rgba(spec.file);if(!now.data.equals(await pixels(spec))){skipped.push({native:spec.file,reason:'replaced by a later builder'});continue;}
 const hd=specs===POND_SPECS?await pondScenery(spec,density):(await edgeScenery(spec,density)).pixels;await save(spec.file,hd,spec.width*density,spec.height*density,{master:spec.master,method:'scenery placement at density 2'});}
// Woodland quartet (build-pond-woodland.mjs): pond nook and shore thicket, normal and snow, fitted to the builder's fixed rectangles.
{const wood=await read('environment/pond/masters/woodland-20261108/provenance.json');if(sha(await fs.readFile(path.join(root,wood.master)))!==wood.sha256)throw Error('Master changed '+wood.master);
 const cells=authoredCells(await sharp(path.join(root,wood.master)).ensureAlpha().raw().toBuffer({resolveWithObject:true}),[2,2]);
 for(const [i,out]of wood.outputs.entries()){const nook=i%2===0,h=nook?236:132;await recover(wood.master,{file:out.file,sha256:out.sha256,sourceRect:cells[i].sourceRect,bounds:{x:2,y:out.height-2-h,w:out.width-4,h}});}}
// Fence-free pasture (build-catalog-completion.mjs) and the winter expansion (build-winter-expansion-art.mjs, incl. the Black Lake): recorded native bounds.
{const catalog=await read('masters-items/catalog-completion-20261108/provenance.json'),floor=catalog.assets.find(a=>a.id==='pasture-floor');if(sha(await fs.readFile(path.join(root,floor.master)))!==floor.sha256)throw Error('Master changed '+floor.master);
 const [pose]=authoredCells(await sharp(path.join(root,floor.master)).ensureAlpha().raw().toBuffer({resolveWithObject:true}),[1]);for(const out of floor.outputs)await recover(floor.master,{...out,sourceRect:pose.sourceRect});}
{const winter=await read('environment/winter/masters/expansion-20261108/provenance.json');for(const item of winter.assets){if(sha(await fs.readFile(path.join(root,item.master)))!==item.masterSha256)throw Error('Master changed '+item.master);await whole(item.master,item);}}
// Orchard trees (build-orchard-refresh.mjs): three growth cells per sheet on a 64×72 half-logical canvas, doubled.
{const orchard=await read('environment/edge/masters/orchard-refresh-20261108/provenance.json');
 for(const item of orchard.assets){const bytes=await fs.readFile(path.join(root,item.master));if(sha(bytes)!==item.masterSha256)throw Error('Master changed '+item.master);
  const cells=authoredCells(await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true}),[3]);
  for(const [stage,file]of item.outputs.entries()){const cell=cells[stage],scale=Math.min((stage?48:38)/cell.width,(stage?53:42)/cell.height),w=Math.round(cell.width*scale),h=Math.round(cell.height*scale);
   await recover(item.master,{file,sourceRect:cell.sourceRect,bounds:{x:Math.floor((64-w)/2)*2,y:(55-h)*2,w:w*2,h:h*2}});}}}
// Elves and visiting friends: build-elf-art's own area-average reduction (reproduces every shipped frame exactly at 1×) run at twice the scale.
for(const id of [...Object.keys(ELF_SOURCES),...Object.keys(FRIEND_SOURCES)])for(const sheet of await renderElf(id,density))for(const f of sheet.frames)await save(f.file,f.raw,f.width,f.height,{master:sheet.master,masterSha256:sheet.masterSha256,cell:f.cell,method:'build-elf-art renderElf at density 2'});
// The «Hagrid Farm» sign: build-sign-art's sheared point sampling (exact at 1×) at twice the scale.
{const sign=renderSign(density);await save('environment/layers/hagrid-farm-sign.png',sign.output,sign.width,sign.height,{...SIGN_SOURCE,method:'build-sign-art renderSign at density 2'});}
// Forest ring (build-forest-assets.mjs): each prop's authored panel of the hash-checked atlas, fitted to the native ink box.
{const forest=await read('forest-assets.json');if(sha(await fs.readFile(path.join(root,forest.source)))!==forest.sourceSha256)throw Error('Master changed '+forest.source);
 for(const a of forest.assets){const [x,y,w,h]=a.rect;await recover(forest.source,{file:a.file,sha256:a.sha256,sourceRect:{x,y,w,h},bounds:inkBounds(await rgba(a.file))});}}
// Decorative pond (build-scene.mjs exportProp: rect [880,0,1536,600] of props-v03, 4 px side pad).
await recover('environment/props-v03.png',{file:'environment/layers/pond.png',sourceRect:{x:880,y:0,w:656,h:600},bounds:inkBounds(await rgba('environment/layers/pond.png'))});
// Grass/soil tiles (build-scene.mjs): the terrain master's ink box resized onto the exact diamond; only used when it reproduces the shipped tile at 1×.
async function tile(id,d){const master=`environment/terrain-${id}.png`,raw=await rgba(master),box=inkBox(raw.data,raw.info.width,raw.info.height),W=64*d,H=32*d,fallback=id==='grass'?[113,147,75]:[115,80,68];
 const b=await sharp(raw.data,{raw:raw.info}).extract({left:box.x,top:box.y,width:box.w,height:box.h}).resize(W,H,{kernel:'nearest'}).raw().toBuffer(); // build-scene's default 'cover' crop
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=(y*W+x)*4;if(Math.abs(x+.5-W/2)/(W/2)+Math.abs(y+.5-H/2)/(H/2)>1)b.fill(0,i,i+4);else{if(b[i+3]<192)b.set(fallback,i);b[i+3]=255;}}
 return {master,pixels:quantize(b)};}
for(const id of ['grass','soil']){const file=`environment/layers/tile-${id}.png`;if(!(await tile(id,1)).pixels.equals((await rgba(file)).data)){skipped.push({native:file,reason:'replaced by a later builder'});continue;}
 const {master,pixels:hd}=await tile(id,density);await save(file,hd,64*density,32*density,{master,masterSha256:sha(await fs.readFile(path.join(root,master))),method:'build-scene tile export at density 2'});}
// The live candy barrel and black cat keep their global-palette export of the pack master (build-overhang-refit.mjs), not the pack's item-palette one.
for(const id of ['hw_monster_candy_barrel','hw_wooden_black_cat']){const master=`halloween-assets/masters/${id}.png`,poses=authoredCells(await sharp(path.join(root,master)).ensureAlpha().raw().toBuffer({resolveWithObject:true}),[2]);
 for(const [view,suffix]of ['','_right'].entries()){const baseFile=`decor-assets/native/${id}${suffix}.png`;await recover(master,{file:baseFile,bounds:inkBounds(await rgba(baseFile)),sourceRect:poses[view].sourceRect});
  await effectFrames(baseFile,[0,1,2,3].map(i=>`decor-assets/native/${id}${suffix}_f${i}.png`),{master,sourceRect:poses[view].sourceRect});}}
// Each builder below is re-run at density d; d=1 must reproduce the shipped PNG (counted mismatches are recorded), then d=2 is kept.
const mismatch=async(file,raw)=>{const now=(await rgba(file)).data;let n=0;for(let i=0;i<raw.length;i+=4)if(raw.readUInt32LE(i)!==now.readUInt32LE(i))n++;return n;};
// Habitat snow (build-habitat-refresh.mjs): uniform nearest resize of the authored cell, palette snap, centred and grounded at 50.
{const hab=await read('environment/masters/habitat-refresh-20261109/provenance.json');
 for(const g of hab.assets){const bytes=await fs.readFile(path.join(root,g.master));if(sha(bytes)!==g.masterSha256)throw Error('Master changed '+g.master);const cells=authoredCells(await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true}),[4,4]);
  for(const o of g.outputs.filter(o=>o.snow)){const c=cells.find(c=>c.rect.x===o.sourceRect.x&&c.rect.y===o.sourceRect.y),render=async d=>{const k=Math.min(50/c.width,42/c.height)*d,w=Math.max(1,Math.round(c.width*k)),h=Math.max(1,Math.round(c.height*k)),S=56*d;
    const ink=quantize(await sharp(c.data,{raw:{width:c.width,height:c.height,channels:4}}).resize(w,h,{kernel:'nearest'}).raw().toBuffer()),b=inkBox(ink,w,h),x=Math.floor((S-b.w)/2),y=50*d-b.h,out=Buffer.alloc(S*S*4);
    for(let v=0;v<b.h;v++)ink.copy(out,((y+v)*S+x)*4,((b.y+v)*w+b.x)*4,((b.y+v)*w+b.x+b.w)*4);return out;};
   const off=await mismatch(o.file,await render(1));if(off){skipped.push({native:o.file,reason:'builder no longer reproduces',pixels:off});continue;}
   await save(o.file,await render(density),56*density,56*density,{master:g.master,masterSha256:g.masterSha256,sourceRect:o.sourceRect,method:'build-habitat-refresh resize at density 2'});}}}
// Winter forest and frozen pond (environment/winter/provenance.json, Codex S3): the cell's ink box centre-sampled onto the original ink box,
// snapped to sprite24 + snow white. Exact at 1× except 58 of the oak's 33,440 pixels.
{const winter=await read('environment/winter/provenance.json'),bytes=await fs.readFile(path.join(root,'environment/winter',winter.master));if(sha(bytes)!==winter.masterSha256)throw Error('Master changed '+winter.master);
 const M=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true}),pal=winter.colors.map(h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16))),snow=new Map(),snap=(r,g,b)=>{const k=(r<<16)|(g<<8)|b;if(!snow.has(k))snow.set(k,pal.reduce((a,p)=>{const d=(p[0]-r)**2+(p[1]-g)**2+(p[2]-b)**2;return d<a[1]?[p,d]:a;},[null,Infinity])[0]);return snow.get(k);};
 for(const a of winter.assets){const file='environment/winter/'+a.file;if(sha(await fs.readFile(path.join(root,file)))!==a.sha256)continue; // hut-snow: replaced by the homestead master above
  const [cx,cy]=a.sourceCell,[sx0,sy0,sx1,sy1]=a.sourceInkBox,[ox0,oy0,ox1,oy1]=a.originalInkBox;
  const render=d=>{const W=a.width*d,dw=(ox1-ox0)*d,dh=(oy1-oy0)*d,out=Buffer.alloc(W*a.height*d*4);for(let y=0;y<dh;y++)for(let x=0;x<dw;x++){const i=((cy+sy0+Math.floor((y+.5)*(sy1-sy0)/dh))*M.info.width+cx+sx0+Math.floor((x+.5)*(sx1-sx0)/dw))*4;if(M.data[i+3]<192)continue;const o=((oy0*d+y)*W+ox0*d+x)*4;out.set(snap(M.data[i],M.data[i+1],M.data[i+2]),o);out[o+3]=255;}return out;};
  const off=await mismatch(file,render(1));if(off>a.width*a.height*0.002){skipped.push({native:file,reason:'builder no longer reproduces',pixels:off});continue;}
  await save(file,render(density),a.width*density,a.height*density,{master:'environment/winter/'+winter.master,masterSha256:winter.masterSha256,sourceInkBox:a.sourceInkBox,nativeMismatchPixels:off,method:'S3 centre-sampled export at density 2'});}}
// Status bubbles (docs/codex-briefs/ui-audit/build-previews.mjs): the 8× master reduced by nearest, plain RGB snap to sprite24.
{const pal=(await import('./palette.mjs')).SPRITE_PALETTE.map(h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16))),snap=(r,g,b)=>pal.reduce((a,p)=>{const d=(p[0]-r)**2+(p[1]-g)**2+(p[2]-b)**2;return d<a[1]?[p,d]:a;},[null,Infinity])[0];
 for(const [id,file]of [['bubble_hungry','hungry'],['bubble_meal_ready','meal-ready'],['bubble_heart_small','heart-small']]){const master=`masters-items/ui-audit/${id}.png`,native=`environment/bubbles/${file}.png`,{width,height}=(await rgba(native)).info;
  const render=async d=>{const b=await sharp(path.join(root,master)).resize(width*d,height*d,{kernel:'nearest'}).ensureAlpha().raw().toBuffer();for(let i=0;i<b.length;i+=4){if(b[i+3]<192)b.fill(0,i,i+4);else{b.set(snap(b[i],b[i+1],b[i+2]),i);b[i+3]=255;}}return b;};
  const off=await mismatch(native,await render(1));if(off){skipped.push({native,reason:'builder no longer reproduces',pixels:off});continue;}
  await save(native,await render(density),width*density,height*density,{master,masterSha256:sha(await fs.readFile(path.join(root,master))),method:'build-previews nearest reduction at density 2'});}}
// Submerged pond creatures (build-submerged-creatures.mjs): its rasterize at twice the canvas and scale; left = mirror of right.
{const sub=await read('creature-motion-assets/masters/submerged-20261108/provenance.json'),{rasterize}=await import('./build-creature-motion.mjs'),{SUBMERGED_CREATURE_ART}=await import('./pond-creature-art.mjs');walk(SUBMERGED_CREATURE_ART);
 for(const spec of sub.species){const bytes=await fs.readFile(path.join(root,spec.master));if(sha(bytes)!==spec.masterSha256)throw Error('Master changed '+spec.master);
  const poses=authoredCells(await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true}),[4,4]),median=a=>a.sort((a,b)=>a-b)[Math.floor(a.length/2)],adult=poses.slice(4);
  const scale=Math.min(76/median(adult.map(p=>p.mainBounds.w)),52/median(adult.map(p=>p.mainBounds.h))),growthScale=Math.min(76/poses[3].mainBounds.w,52/poses[3].mainBounds.h);
  for(const [index,pose]of poses.entries()){const render=d=>rasterize(pose,{width:128*d,height:96*d,pivotX:64*d,pivotY:64*d},{w:80*d,h:56*d},(index<4?growthScale:scale)*d,new Map()).output;
   const right=`creature-motion-assets/submerged-native/${spec.id}/right-${index}.png`,off=await mismatch(right,render(1));if(off){skipped.push({native:right,reason:'builder no longer reproduces',pixels:off});continue;}
   const hd=render(density),source={master:spec.master,masterSha256:spec.masterSha256,pose:index,method:'build-submerged-creatures rasterize at density 2'};
   await save(right,hd,128*density,96*density,source);await save(`creature-motion-assets/submerged-native/${spec.id}/left-${index}.png`,await sharp(hd,{raw:{width:128*density,height:96*density,channels:4}}).flop().raw().toBuffer(),128*density,96*density,{...source,flop:true});}}}
walk(await read('decor-assets-manifest.json'));
// Atlas metadata shares the original logical rectangles; each recovered cell is copied at doubled density.
const registry={},replacementAtlases=new Set(replacements.items.filter(i=>i.targetKind==='store-decoration').map(i=>`decor-assets/native/${i.id}_atlas.png`));
for(const [file]of inventory){const raw=await rgba(file),hit=recovered.get(sha(raw.data));if(hit)registry[file]=hit;}
for(const [file,rectangles]of atlasSpecs){if(!inventory.has(file))continue;const raw=await rgba(file),layers=[];
 for(const r of rectangles.values()){
  const cell=await sharp(raw.data,{raw:raw.info}).extract({left:r.x,top:r.y,width:r.w,height:r.h}).raw().toBuffer(),hit=recovered.get(sha(cell));if(hit)layers.push({input:path.join(root,hit.file),left:r.x*density,top:r.y*density});
 }
 if(!layers.length)continue;
 if(replacementAtlases.has(file)&&layers.length!==rectangles.size)throw Error('Incomplete reviewed HD atlas '+file);
 const base=replacementAtlases.has(file)?await sharp({create:{width:raw.info.width*density,height:raw.info.height*density,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).png().toBuffer():await sharp(raw.data,{raw:raw.info}).resize(raw.info.width*density,raw.info.height*density,{kernel:'nearest'}).png().toBuffer();
 const bytes=await sharp(base).composite(layers).webp({lossless:true,exact:true}).toBuffer(),output=`decor-assets/hd/${sha(bytes).slice(0,24)}-atlas.webp`;await fs.writeFile(path.join(root,output),bytes);
 registry[file]={file:output,density,width:raw.info.width,height:raw.info.height,bytes:bytes.length,sha256:sha(bytes),recoveredFrames:layers.length,totalFrames:rectangles.size};
}
const published=new Set(Object.values(registry).map(r=>r.file));for(const file of await fs.readdir(path.join(root,'decor-assets/hd')))if(/^[a-f0-9]{24}(?:-atlas)?\.webp$/.test(file)&&!published.has('decor-assets/hd/'+file))await fs.unlink(path.join(root,'decor-assets/hd',file));
await fs.writeFile(path.join(root,'hd-art.mjs'),'// Generated from current hash-verified authored frame records. Logical geometry stays native.\nexport const HD_ART='+JSON.stringify(Object.fromEntries(Object.entries(registry).map(([key,{file,density,width,height}])=>[key,{file,density,width,height} ])))+';\n');
const report={density,files:Object.keys(registry).length,uniqueMasterFrames:recovered.size,runtime:registry,runtimeBytes:Object.values(registry).reduce((n,r)=>n+r.bytes,0),provenance,skipped};await fs.writeFile(path.join(root,'hd-art-provenance.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({files:report.files,uniqueMasterFrames:report.uniqueMasterFrames,runtimeBytes:report.runtimeBytes,skipped:skipped.length}));
