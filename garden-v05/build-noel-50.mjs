// Technical export of authored masters. Reuses the garden's palette/native atlas pipeline.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {authoredCells} from './authored-atlas.mjs';
import {exportSprite} from './build-complete-objects.mjs';
import {packNativeAtlas} from './native-atlas.mjs';
const root=path.dirname(fileURLToPath(import.meta.url)),require=createRequire(import.meta.url);
const sharp=require(process.env.SHARP_MODULE||'/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const read=async file=>JSON.parse(await fs.readFile(path.join(root,file),'utf8'));
const specs=await read('noel-50-assets/specs.json');
const runtime=await read('decor-assets-manifest.json');
const records=[];
for(const item of specs){
 const master=item.master??`noel-50-assets/masters/${item.id}.png`,bytes=await fs.readFile(path.join(root,master));
 const raw=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const poses=authoredCells(raw,[2,2]);
 const width=(item.footprint[0]+item.footprint[1])*32,maxHeight=Math.min(width*2,224);
 const height=Math.ceil((maxHeight+20)/16)*16;
 const spec={width,height,pivotX:width/2,pivotY:height-16};
 // Common scale for both authored directions and idle poses, with 4px side margins.
 const scale=Math.min((item.maxInkWidth??width-8)/Math.max(...poses.map(p=>p.bounds.w)),maxHeight/Math.max(...poses.map(p=>p.bounds.h)));
 const frames=[];
 for(const [index,pose]of poses.entries())frames.push(await exportSprite({id:item.id,outputFolder:'noel-50-assets/native'},pose,index,spec,scale));
 const file=`decor-assets/native/${item.id}.png`,rightFile=`decor-assets/native/${item.id}_right.png`;
 await fs.copyFile(path.join(root,frames[0].file),path.join(root,file));
 await fs.copyFile(path.join(root,frames[2].file),path.join(root,rightFile));
 const atlas=await packNativeAtlas(root,`decor-assets/native/${item.id}_atlas.png`,frames,2);
 const union=list=>{const x=Math.min(...list.map(f=>f.bounds.x)),y=Math.min(...list.map(f=>f.bounds.y));return {x,y,w:Math.max(...list.map(f=>f.bounds.x+f.bounds.w))-x,h:Math.max(...list.map(f=>f.bounds.y+f.bounds.h))-y};};
 const sprite={id:item.id,kind:'decor',collection:'festival',group:'Giáng sinh',label:item.label,storeItem:true,rotatable:true,
  ...spec,file,rightFile,footprintTiles:item.footprint,angles:['default','right'],
  ...(item.master?.includes('-solid.png')?{artRevision:'coordinate-v3'}:{}),
  frames:Array(4).fill(atlas.file),rightFrames:Array(4).fill(atlas.file),
  atlasRects:[0,1,0,1].map(i=>atlas.frames[i].atlasRect),rightAtlasRects:[2,3,2,3].map(i=>atlas.frames[i].atlasRect),
  durations:[1100,260,900,260],bounds:union(frames.slice(0,2)),rightBounds:union(frames.slice(2)),
  framesIdentical:frames[0].sha256===frames[1].sha256&&frames[2].sha256===frames[3].sha256};
 records.push({...item,master,masterSha256:sha(bytes),scale,frames,atlas,runtime:sprite});
 console.log(item.id);
}
runtime.items=[...runtime.items.filter(item=>!item.id.startsWith('nx_')),...records.map(item=>item.runtime)];
await fs.writeFile(path.join(root,'decor-assets-manifest.json'),JSON.stringify(runtime,null,2)+'\n');
await fs.writeFile(path.join(root,'noel-50-assets/manifest.json'),JSON.stringify({version:1,method:'authored 2×2 poses, common native scale, palette24, binary alpha, two authored directions, union bounds, lossless atlas',items:records},null,2)+'\n');
// QA only: same native RGBA, nearest-neighbour 2×, no smoothing.
const cellW=320,cellH=360,columns=5,rows=Math.ceil(records.length/columns),layers=[];
for(const [i,item]of records.entries()){
 const sprite=item.runtime,buffer=await sharp(path.join(root,sprite.file)).resize(sprite.width*2,sprite.height*2,{kernel:'nearest'}).png().toBuffer();
 // Fit tall sprites into the QA cell without changing the native output.
 const preview=await sharp(buffer).resize({width:300,height:300,fit:'inside',kernel:'nearest',withoutEnlargement:true}).png().toBuffer();
 const meta=await sharp(preview).metadata(),left=i%columns*cellW,top=Math.floor(i/columns)*cellH;
 layers.push({input:preview,left:left+Math.floor((cellW-meta.width)/2),top:top+310-meta.height});
 const escaped=item.label.replaceAll('&','&amp;').replaceAll('<','&lt;');
 layers.push({input:Buffer.from(`<svg width="320" height="40"><text x="160" y="25" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#D6D8BF">${i+1}. ${escaped}</text></svg>`),left,top:top+315});
}
await fs.mkdir(path.join(root,'noel-50-assets/qa'),{recursive:true});
await sharp({create:{width:columns*cellW,height:rows*cellH,channels:4,background:'#24483F'}}).composite(layers).webp({lossless:true}).toFile(path.join(root,'noel-50-assets/qa/contact-sheet.webp'));
