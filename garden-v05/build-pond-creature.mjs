// Pond creatures (garden expansion phase 1, plan §6): a species with no level-asset atlas, authored as three Codex
// masters (left 4×4 motion, right 4×4 motion, 2×4 growth). Same cell recovery, rasterizer and atlas packer as the
// other creatures; build-creature-complete.mjs then adds the result to creature-motion-data.js.
// Usage: node build-pond-creature.mjs   (sources: creature-motion-assets/pond-creature-sources.json)
import fs from 'node:fs/promises';import path from 'node:path';import crypto from 'node:crypto';import {fileURLToPath} from 'node:url';import {createRequire} from 'node:module';
import {authoredCells} from './authored-atlas.mjs';import {rasterize} from './build-creature-motion.mjs';import {packNativeAtlas} from './native-atlas.mjs';
const require=createRequire(import.meta.url),sharp=require(process.env.SHARP_MODULE||'/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=path.dirname(fileURLToPath(import.meta.url)),assetRoot='creature-motion-assets/',hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
// Same clip timing as the authored right-facing motion (build-creature-motion.mjs) and growth (build-creature-complete.mjs).
const CLIPS={growth:{durations:[900,900,900,900],loop:false},idle:{durations:[600,240,180,240],loop:true},action:{durations:[320,180,240,220],loop:false},eat:{durations:[300,420,340,820],loop:false},care:{durations:[260,620,260,820],loop:false}};
const MOTION=['idle','action','eat','care'];
const median=values=>[...values].sort((a,b)=>a-b)[Math.floor(values.length/2)];
const fit=(target,w,h)=>Math.min((target.w-2)/w,(target.h-2)/h);

async function build(species){
 const {id,canvas,targetBounds:target}=species,palette=new Map(),views={left:[],right:[]};
 const sheet=async role=>{const source=species.masters[role],bytes=await fs.readFile(path.join(root,source.master));if(hash(bytes)!==source.masterSha256)throw Error(`${id} ${role}: master provenance`);return {source,raw:await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true})};};
 const emit=async(view,clip,index,pose,scale)=>{
  const r=rasterize(pose,canvas,target,scale,palette);if(r.clippedPixels)throw Error(`${id} ${view}-${clip}-${index}: clipped`);
  const file=`native/${id}/${view}-${clip}-${String(index+1).padStart(2,'0')}.png`,png=await sharp(r.output,{raw:{width:canvas.width,height:canvas.height,channels:4}}).png().toBuffer();
  await fs.mkdir(path.join(root,assetRoot,path.dirname(file)),{recursive:true});await fs.writeFile(path.join(root,assetRoot,file),png);
  views[view].push({file,...canvas,bounds:r.bounds,sha256:hash(png),clip,sourceRect:pose.sourceRect,scale:r.scale});
 };
 // Growth: one scale per row taken from the adult, so the ages keep their honest sizes.
 const growth=await sheet('growth'),ages=authoredCells(growth.raw,[4,4]);
 for(const [row,view]of ['left','right'].entries()){const cells=ages.slice(row*4,row*4+4),scale=fit(target,cells[3].mainBounds.w,cells[3].mainBounds.h);for(const [i,pose]of cells.entries())await emit(view,'growth',i,pose,scale);}
 // Motion: one scale per sheet from the median body, so a raised arm never shrinks the creature between frames.
 for(const view of ['left','right']){const {raw}=await sheet(view),poses=authoredCells(raw,[4,4,4,4]),scale=fit(target,median(poses.map(p=>p.mainBounds.w)),median(poses.map(p=>p.mainBounds.h)));for(const [i,pose]of poses.entries())await emit(view,MOTION[Math.floor(i/4)],i%4,pose,scale);}
 const record=f=>({file:assetRoot+f.file,width:f.width,height:f.height,pivotX:f.pivotX,pivotY:f.pivotY,bounds:f.bounds});
 const atlases={left:await packNativeAtlas(root,`${assetRoot}native/${id}/left-atlas.png`,views.left.map(record)),right:await packNativeAtlas(root,`${assetRoot}native/${id}/right-atlas.png`,views.right.map(record))};
 const clips=Object.fromEntries(['growth',...MOTION].map((name,row)=>[name,{frames:[0,1,2,3].map(i=>row*4+i),...CLIPS[name]}]));
 return {...species,frames:views,clips,runtimeAtlases:atlases};
}

async function main(){
 const sources=JSON.parse(await fs.readFile(path.join(root,assetRoot,'pond-creature-sources.json'),'utf8')),items=[];
 for(const species of sources.items)items.push(await build(species));
 await fs.writeFile(path.join(root,assetRoot,'pond-creatures.json'),JSON.stringify({version:1,generatedBy:'build-pond-creature.mjs',items},null,2)+'\n');
 console.log(JSON.stringify(items.map(i=>({id:i.id,left:i.frames.left.length,right:i.frames.right.length,adult:i.frames.left[3].bounds}))));
}
if(process.argv[1]===fileURLToPath(import.meta.url))main().catch(e=>{console.error(e.stack);process.exitCode=1;});
