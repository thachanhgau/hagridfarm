// Technical export only: retain generated masters, sample a native grid and
// quantize to the existing sprite palette. Scene poses are authored in atlases.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {SPRITE_PALETTE} from './palette.mjs';

const require=createRequire(import.meta.url);
const sharp=require(process.env.SHARP_MODULE||'/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=path.dirname(fileURLToPath(import.meta.url));
const input='masters-complete-objects';
const palette=SPRITE_PALETTE.map(hex=>[1,3,5].map(offset=>parseInt(hex.slice(offset,offset+2),16)));
const cache=new Map();
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const sceneSpecs={
 // Owner 05/11/2026 («người khổng lồ gì mà nhỏ hơn con cú»): the half-giant stands about twice a visiting
 // friend (80 px cells), Hedwig and her perch stay small beside him.
 gardener_friend:{width:112,height:140,pivotX:56,pivotY:130,maxWidth:100,maxHeight:120,durations:[900,180,320,380]},
 fang:{width:80,height:72,pivotX:40,pivotY:66,maxWidth:70,maxHeight:58,durations:[1600,160,700,500]},
 owl_post:{width:64,height:80,pivotX:32,pivotY:72,maxWidth:50,maxHeight:60,durations:[760,400,220,460]},
 herbology_greenhouse:{width:156,height:152,pivotX:78,pivotY:118,drawBottomY:142,maxWidth:136,maxHeight:138,durations:[1200,540,650,540]},
};
function closest(r,g,b){
 const key=(r<<16)|(g<<8)|b;if(cache.has(key))return cache.get(key);
 let result=0,distance=Infinity;
 palette.forEach((color,index)=>{const d=2*(r-color[0])**2+3*(g-color[1])**2+(b-color[2])**2;if(d<distance){result=index;distance=d;}});
 cache.set(key,result);return result;
}
export function bounds(data,width,height){
 let x0=width,y0=height,x1=-1,y1=-1,count=0;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(data[(y*width+x)*4+3]>=192){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);count++;}
 if(!count)throw Error('Empty authored sprite');
 return {x:x0,y:y0,w:x1-x0+1,h:y1-y0+1,count};
}
function cell(raw,column,row,columns,rows){
 const x0=Math.round(raw.info.width*column/columns),x1=Math.round(raw.info.width*(column+1)/columns);
 const y0=Math.round(raw.info.height*row/rows),y1=Math.round(raw.info.height*(row+1)/rows);
 const width=x1-x0,height=y1-y0,data=Buffer.alloc(width*height*4);
 for(let y=0;y<height;y++)raw.data.copy(data,y*width*4,((y+y0)*raw.info.width+x0)*4,((y+y0)*raw.info.width+x1)*4);
 const box=bounds(data,width,height);
 if(box.x<2||box.y<2||box.x+box.w>width-2||box.y+box.h>height-2)throw Error('Sprite touches atlas cell boundary');
 return {data,width,height,bounds:box,sourceRect:{x:x0,y:y0,w:width,h:height}};
}
// Middle of the ink in the lowest eighth of the pose.
export function footX({data,width,bounds:b}){
 let sum=0,n=0;
 for(let y=Math.round(b.y+b.h*7/8);y<b.y+b.h;y++)for(let x=b.x;x<b.x+b.w;x++)if(data[(y*width+x)*4+3]>=192){sum+=x;n++;}
 return n?sum/n:b.x+b.w/2;
}
export async function exportSprite(source,pose,index,spec,scale){
 const {width,height,pivotX,pivotY}=spec;
 const w=Math.max(1,Math.round(pose.bounds.w*scale)),h=Math.max(1,Math.round(pose.bounds.h*scale));
 const x0=Math.round(pivotX-(pose.anchorX==null?w/2:(pose.anchorX-pose.bounds.x)*scale)),y0=(spec.drawBottomY??pivotY)-h;
 if(x0<1||y0<1||x0+w>=width||y0+h>=height)throw Error(source.id+': no transparent canvas margin');
 const out=Buffer.alloc(width*height*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const sx=pose.bounds.x+Math.min(pose.bounds.w-1,Math.floor((x+.5)*pose.bounds.w/w));
  const sy=pose.bounds.y+Math.min(pose.bounds.h-1,Math.floor((y+.5)*pose.bounds.h/h));
  const si=(sy*pose.width+sx)*4;if(pose.data[si+3]<192)continue;
  const color=palette[closest(pose.data[si],pose.data[si+1],pose.data[si+2])],di=((y0+y)*width+x0+x)*4;
  out[di]=color[0];out[di+1]=color[1];out[di+2]=color[2];out[di+3]=255;
 }
 // defringe: [hex…] palette colours a white-background JPEG leaves on the outer edge; two passes peel them off
 // (05/11/2026, chibi Hagrid and Hedwig: a grey halo around the hair and the lantern).
 if(source.defringe){const drop=new Set(source.defringe.map(h=>parseInt(h.slice(1),16)));for(let pass=0;pass<2;pass++){const off=[];
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){const i=(y*width+x)*4;if(!out[i+3]||!drop.has((out[i]<<16)|(out[i+1]<<8)|out[i+2]))continue;
   if([[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>{const u=x+dx,v=y+dy;return u<0||v<0||u>=width||v>=height||!out[(v*width+u)*4+3];}))off.push(i);}
  for(const i of off)out[i+3]=0;}}
 const file=`${source.outputFolder||'native-complete-objects'}/${source.id}/frame-${String(index+1).padStart(2,'0')}.png`;
 await fs.mkdir(path.dirname(path.join(root,file)),{recursive:true});
 const png=await sharp(out,{raw:{width,height,channels:4}}).png().toBuffer();await fs.writeFile(path.join(root,file),png);
 const b=bounds(out,width,height);
 if(b.x<=0||b.y<=0||b.x+b.w>=width||b.y+b.h>=height)throw Error(file+': clipped native output');
 return {file,width,height,pivotX,pivotY,bounds:{x:b.x,y:b.y,w:b.w,h:b.h},sha256:hash(png),sourceRect:pose.sourceRect};
}
async function main(){
 const files=(await fs.readdir(path.join(root,input))).filter(file=>file.endsWith('.json')).sort();
 const items=[];
 for(const file of files){
  const source=JSON.parse(await fs.readFile(path.join(root,input,file),'utf8'));
  const master=await fs.readFile(path.join(root,source.master));
  if(hash(master)!==source.masterSha256)throw Error(source.id+': master provenance mismatch');
  const raw=await sharp(master).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const scene=source.kind==='scene';
  const spec=scene?sceneSpecs[source.id]:source.kind==='habitat'
   ?{width:40,height:36,pivotX:20,pivotY:31,maxWidth:36,maxHeight:28}
   :{width:56,height:56,pivotX:28,pivotY:50,maxWidth:44,maxHeight:44};
  if(!spec)throw Error('Unknown scene '+source.id);
  const poses=Array.from({length:scene?4:1},(_,index)=>cell(raw,scene?index%2:0,scene?Math.floor(index/2):0,scene?2:1,scene?2:1));
  // anchor 'foot': every pose stands on the middle of its lowest ink (feet, a post's base), so a raised arm or a
  // spread wing does not slide the body sideways between frames (05/11/2026, chibi Hagrid and Hedwig).
  if(source.anchor==='foot')for(const p of poses)p.anchorX=footX(p);
  const half=p=>p.anchorX==null?p.bounds.w/2:Math.max(p.anchorX-p.bounds.x,p.bounds.x+p.bounds.w-p.anchorX);
  const scale=Math.min(spec.maxWidth/(2*Math.max(...poses.map(half))),spec.maxHeight/Math.max(...poses.map(p=>p.bounds.h)));
  const frames=[];
  for(const [index,pose] of poses.entries())frames.push(await exportSprite(source,pose,index,spec,scale));
  items.push({id:source.id,kind:source.kind,...(source.species?{species:source.species}:{}),...frames[0],frames:frames.map(frame=>frame.file),frameRecords:frames,...(scene?{durations:spec.durations,rotatable:false,storeItem:false}:{}),master:source.master,masterSha256:source.masterSha256,prompt:source.prompt,generatedFile:source.generatedFile,tool:'builtin image_gen',method:'authored master cells, common native scale, palette24, binary alpha'});
 }
 const manifest={version:1,items};
 await fs.writeFile(path.join(root,'complete-objects-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 const habitat=Object.fromEntries(items.filter(i=>i.kind==='habitat').map(i=>[i.species,i]));
 const keepsakes=Object.fromEntries(items.filter(i=>i.kind==='keepsake').map(i=>[i.species,i]));
 const scenes=items.filter(i=>i.kind==='scene');
 const runtime=item=>{const {id,file,width,height,pivotX,pivotY,bounds,frames,durations}=item;return {id,file,width,height,pivotX,pivotY,bounds,frames,...(durations?{durations}:{}),authored:true};};
 await fs.writeFile(path.join(root,'complete-object-art.mjs'),`// Generated by build-complete-objects.mjs; masters remain in source.\nexport const COMPLETE_SCENERY=${JSON.stringify(scenes.map(runtime))};\nexport const HABITAT_ART=${JSON.stringify(Object.fromEntries(Object.entries(habitat).map(([id,item])=>[id,runtime(item)])))};\nexport const KEEPSAKE_ART=${JSON.stringify(Object.fromEntries(Object.entries(keepsakes).map(([id,item])=>[id,runtime(item)])))};\nexport const completeObjectFiles=()=>[...COMPLETE_SCENERY,...Object.values(HABITAT_ART),...Object.values(KEEPSAKE_ART)].flatMap(item=>item.frames);\n`);
 console.log(JSON.stringify({scenery:scenes.length,habitats:Object.keys(habitat).length,keepsakes:Object.keys(keepsakes).length,nativeFrames:items.reduce((n,item)=>n+item.frames.length,0)}));
}
if(process.argv[1]===fileURLToPath(import.meta.url))await main();
