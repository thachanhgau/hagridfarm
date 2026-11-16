// Stage candidates first; only explicitly accepted records may replace runtime art.
import fs from 'node:fs/promises';import path from 'node:path';import {fileURLToPath}from'node:url';import{createRequire}from'node:module';import{createHash}from'node:crypto';
import{authoredCells}from'./authored-atlas.mjs';import{exportSprite,bounds}from'./build-complete-objects.mjs';import{packNativeAtlas}from'./native-atlas.mjs';
const root=path.dirname(fileURLToPath(import.meta.url)),sharp=createRequire(import.meta.url)('/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp'),read=async f=>JSON.parse(await fs.readFile(path.join(root,f),'utf8')),sha=b=>createHash('sha256').update(b).digest('hex');
process.env.SHARP_MODULE||='/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp';
const {motionPlan,frameFor}=await import('./special-products-assets/build-assets.mjs');
const {buildAnimatedFrames}=await import('./generate-decor-assets.mjs');
const {SPRITE_PALETTE}=await import('./palette.mjs');
const pack=process.argv[2]||'isometric-hd-assets',specs=await read(pack+'/specs.json'),records=[],failures=[];
for(const item of specs){
 if(item.preserveOriginal||item.retainOriginal)continue;
 try{
 const master=item.selectedMaster||item.master;let bytes;try{bytes=await fs.readFile(path.join(root,master));}catch{continue;}
 const raw=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true}),poses=authoredCells(raw,item.poseLayout||[4,4]),old=item.previousRuntime,spec={width:old.width,height:old.height,pivotX:old.pivotX,pivotY:old.pivotY,...item.drawBottomY&&{drawBottomY:item.drawBottomY}};
 for(const p of poses){const r=p.sourceRect;if(r.x<2||r.y<2||r.x+r.w>raw.info.width-2||r.y+r.h>raw.info.height-2)throw Error(item.id+': master silhouette touches image boundary');}
 const colors=item.paletteColors||SPRITE_PALETTE;
 const scale=Math.min(item.maxInkWidth/Math.max(...poses.map(p=>p.bounds.w)),Math.min(item.maxInkHeight??224,(spec.drawBottomY??old.pivotY)-4,224)/Math.max(...poses.map(p=>p.bounds.h))),frames=[];
 for(const [i,index]of (item.selectedPoseIndices||(poses.length===2?[0,0,0,0,1,1,1,1]:[0,1,2,3,4,5,6,7])).entries()){const pose=poses[index];frames.push(await exportSprite({id:item.id,outputFolder:pack+'/candidates',paletteColors:colors},pose,i,spec,scale));}
 const authoredHD=[];
 for(const i of [0,1,2,3,4,5,6,7]){const indices=item.selectedPoseIndices||(poses.length===2?[0,0,0,0,1,1,1,1]:[0,1,2,3,4,5,6,7]),pose=poses[indices[i]],hdSpec=Object.fromEntries(Object.entries(spec).map(([k,v])=>[k,v*2]));authoredHD.push(await exportSprite({id:item.id,outputFolder:pack+'/hd-preview',paletteColors:colors},pose,i,hdSpec,scale*2));}
 const previewHD=[authoredHD[0],authoredHD[4]];for(let i=0;i<8;i++){frames[i].hdFile=authoredHD[i].file;frames[i].hdSha256=authoredHD[i].sha256;}
 const plans=[];
 if(poses.length===2)for(const start of[0,4]){
  const base=await sharp(path.join(root,frames[start].file)).ensureAlpha().raw().toBuffer(),classic=item.id.startsWith('decor_'),plan=classic?{requested:'existing-native-animation',rendered:'existing-native-animation',fallback:null}:motionPlan(base,{w:old.width,h:old.height,motion:item.motion},colors),animated=classic?buildAnimatedFrames(base,{id:item.id,width:old.width,height:old.height},start===4):null;plans.push({requested:plan.requested,rendered:plan.rendered,fallback:plan.fallback});
  for(let j=0;j<4;j++){const raw=classic?animated[j]:frameFor(base,{w:old.width,h:old.height},plan,j),png=await sharp(raw,{raw:{width:old.width,height:old.height,channels:4}}).png().toBuffer();await fs.writeFile(path.join(root,frames[start+j].file),png);frames[start+j].sha256=sha(png);const b=bounds(raw,old.width,old.height);frames[start+j].bounds={x:b.x,y:b.y,w:b.w,h:b.h};if(j)frames[start+j].effectBaseFile=frames[start].file;}
 }
 const atlas=await packNativeAtlas(root,pack+'/candidates/'+item.id+'/atlas.png',frames,4);
 records.push({...item,master,masterSha256:sha(bytes),scale,frames,atlas,previewHD,paletteColors:colors,motionPlans:plans});console.log(item.id);
 }catch(error){failures.push({id:item.id,error:error.message});console.error(item.id+': '+error.message);}
}
await fs.writeFile(path.join(root,pack+'/candidates.json'),JSON.stringify({version:1,accepted:false,items:records,failures},null,2)+'\n');
if(failures.length)process.exitCode=1;
