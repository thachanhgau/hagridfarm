// Extend the right-facing authored poses with real growth ages and complete
// left-facing actions. Masters and the original growth PNGs remain intact.
import fs from 'node:fs/promises';import path from 'node:path';import crypto from 'node:crypto';import {fileURLToPath} from 'node:url';import {createRequire} from 'node:module';
import {packNativeAtlas} from './native-atlas.mjs';
import {authoredCells} from './authored-atlas.mjs';import {rasterize} from './build-creature-motion.mjs';
const require=createRequire(import.meta.url),sharp=require(process.env.SHARP_MODULE||'/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=path.dirname(fileURLToPath(import.meta.url)),assetRoot='creature-motion-assets/',hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const read=file=>fs.readFile(path.join(root,file));const readJson=async file=>JSON.parse(await read(file));
const clipSpec={action:{durations:[160,200,260,340],loop:false},eat:{durations:[300,420,340,820],loop:false},care:{durations:[260,620,260,820],loop:false},growth:{durations:[900,900,900,900],loop:false}};
const median=values=>values.sort((a,b)=>a-b)[Math.floor(values.length/2)];
async function main(){
 const motion=await readJson('motion-data.json'),levels=await readJson('level-assets.json'),lookup=new Map([...motion.items,...levels.items].map(item=>[item.id,item]));
 const manifest=await readJson(assetRoot+'manifest.json'),recovered=(await readJson('creature-completion-extra-sources.json')).items;
 const extras=[];for(const file of (await fs.readdir(path.join(root,assetRoot,'generation-extra'))).filter(file=>file.endsWith('.json')))extras.push(await readJson(assetRoot+'generation-extra/'+file));
 const selected=new Map();for(const source of [...recovered,...extras]){const id=source.species||source.id.replace(/-right-growth$/,''),key=id+(source.master?.includes('-right-growth-')?':growth':':left'),old=selected.get(key);if(!old||(source.revision||1)>=(old.revision||1))selected.set(key,source);}const sources=[...selected.values()];
 if(sources.length!==23)throw Error('Expected12 growth and11 left-action sheets; found '+sources.length);
 for(const source of sources){
  const id=source.species||source.id.replace(/-right-growth$/,''),item=manifest.items.find(item=>item.id===id),base=lookup.get(id);
  if(!item||!base)throw Error('Unknown creature '+id);if(!source.masterSha256)throw Error(id+' master generation incomplete');
  const bytes=await read(source.master);if(hash(bytes)!==source.masterSha256)throw Error(id+' master provenance');
  const growth=source.master.includes('-right-growth-'),names=growth?['growth']:(source.clipNames||['eat','care']);
  const raw=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true}),poses=authoredCells(raw,names.map(()=>4)),frames=[];
  const commonScale=Math.min((item.targetBounds.w-2)/median(poses.map(p=>p.mainBounds.w)),(item.targetBounds.h-2)/median(poses.map(p=>p.mainBounds.h)));
  for(const [index,pose]of poses.entries()){
   const reference=growth?base.frames[index]:{...item.canvas,bounds:item.targetBounds},canvas={width:reference.width,height:reference.height,pivotX:reference.pivotX,pivotY:reference.pivotY};
   const scale=growth?Math.min((reference.bounds.w-1)/pose.mainBounds.w,(reference.bounds.h-1)/pose.mainBounds.h):commonScale;
   const rendered=rasterize(pose,canvas,reference.bounds,scale,new Map()),clip=names[Math.floor(index/4)];
   const file=`native/${id}/${growth?'right':'left'}-${clip}-${String(index%4+1).padStart(2,'0')}.png`;
   const png=await sharp(rendered.output,{raw:{width:canvas.width,height:canvas.height,channels:4}}).png().toBuffer();
   await fs.mkdir(path.dirname(path.join(root,assetRoot,file)),{recursive:true});await fs.writeFile(path.join(root,assetRoot,file),png);
   frames.push({file,...canvas,bounds:rendered.bounds,sha256:hash(png),clip,sourceRect:pose.sourceRect,scale:rendered.scale,clippedPixels:rendered.clippedPixels});
  }
  item[growth?'rightGrowth':'leftActions']={...source,id,direction:growth?'right-authored':'left-authored',frames,clips:Object.fromEntries(names.map((name,row)=>[name,{...clipSpec[name],frames:[0,1,2,3].map(i=>row*4+i)}]))};
 }
 if(manifest.items.some(item=>!item.rightGrowth))throw Error('Missing right growth');
 manifest.completion={rightGrowthSpecies:12,leftActionSpecies:11,originalDogLeftActionsRetained:true,allSourceSilhouettesRecoveredWithConnectedComponents:true};
 await fs.writeFile(path.join(root,assetRoot,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 const frameRecord=frame=>({file:assetRoot+frame.file,width:frame.width,height:frame.height,pivotX:frame.pivotX,pivotY:frame.pivotY,bounds:frame.bounds});
 const atlases=new Map();
 for(const item of manifest.items){const rightFrames=[...item.rightGrowth.frames,...item.frames].map(frameRecord),rightAtlas=await packNativeAtlas(root,assetRoot+`native/${item.id}/right-atlas.png`,rightFrames);let leftAtlas=null;if(item.leftActions)leftAtlas=await packNativeAtlas(root,assetRoot+`native/${item.id}/left-atlas.png`,item.leftActions.frames.map(frameRecord));item.runtimeAtlases={right:rightAtlas,...(leftAtlas?{left:leftAtlas}:{})};atlases.set(item.id,item.runtimeAtlases);}
 await fs.writeFile(path.join(root,assetRoot,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 const right=manifest.items.map(item=>({id:item.id,kind:'creature',label:item.label,direction:'right-authored',frames:atlases.get(item.id).right.frames,clips:{growth:clipSpec.growth&&{...clipSpec.growth,frames:[0,1,2,3]},...Object.fromEntries(Object.entries(item.clips).map(([name,clip])=>[name,{frames:clip.frameIndices.map(i=>i+4),durations:clip.durations,loop:clip.loop}]))}}));
 const left=manifest.items.filter(item=>item.leftActions).map(item=>({id:item.id,frames:atlases.get(item.id).left.frames,clips:item.leftActions.clips}));
 const script=`// Generated by build-creature-complete.mjs; after base/level/care motion.\n(()=>{const right=${JSON.stringify(right)},left=${JSON.stringify(left)},byId=new Map(right.map(i=>[i.id,i])),leftById=new Map(left.map(i=>[i.id,i]));const apply=()=>{const present=new Set();for(const items of [window.FARM_MOTION?.items,window.FARM_LEVEL_ASSETS?.items])for(const item of items||[]){const view=byId.get(item.id);if(!view)continue;item.rightCreatureMotion=view;const extra=leftById.get(item.id);if(extra&&!item.__leftMotionComplete){const offset=item.frames.length;item.frames.push(...extra.frames);for(const [name,clip]of Object.entries(extra.clips))item.clips[name]={...clip,frames:clip.frames.map(index=>offset+index)};item.__leftMotionComplete=true;}present.add(item.id);}const missing=right.filter(i=>!present.has(i.id)).map(i=>i.id);return window.FARM_CREATURE_MOTION_STATUS={applied:[...present],missing,complete:!missing.length};};window.FARM_CREATURE_MOTION={version:2,items:right};window.FARM_CREATURE_MOTION_APPLY=apply;apply();})();\n`;
 await fs.writeFile(path.join(root,'creature-motion-data.js'),script);
 console.log(JSON.stringify({species:12,rightFrames:right.reduce((n,i)=>n+i.frames.length,0),leftActionFrames:left.reduce((n,i)=>n+i.frames.length,0),runtimeBytes:Buffer.byteLength(script)}));
}
if(process.argv[1]===fileURLToPath(import.meta.url))main().catch(e=>{console.error(e.stack);process.exitCode=1;});
