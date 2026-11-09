// Pack the eight owner-selected habitats at a readable native size; keep the old IDs/anchors.
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {authoredCells} from './authored-atlas.mjs';
import {quantize,inkBox} from './build-pond-art.mjs';
const sharp=createRequire(import.meta.url)('/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=new URL('./',import.meta.url),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const murl=new URL('complete-objects-manifest.json',root),manifest=JSON.parse(await fs.readFile(murl,'utf8'));
const aurl=new URL('complete-object-art.mjs',root),text=await fs.readFile(aurl,'utf8'),art=JSON.parse(text.match(/export const HABITAT_ART=(\{[^\n]+\});/)[1]);
const groups=[['shelters',['porlock','salamander','crup','knarl']],['furnishings',['fwooper','hippogriff','kneazle','puffskein']]],assets=[];
for(const [group,ids]of groups){
 const master=`environment/masters/habitat-refresh-20261109/${group}.png`,bytes=await fs.readFile(new URL(master,root));
 const cells=authoredCells(await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true}),[4,4]);
 const prompt=`Production pixel game habitat atlas with four columns: ${ids.join(', ')}; normal row and matching snow row. Readable sturdy silhouettes, elevated 2:1 dimetric view, vertical supports, muted wood/straw/moss/slate palette, chunky clusters, transparent gutters, no animals, labels or background.`;
 const record={group,master,masterSha256:hash(bytes),prompt,outputs:[]};
 for(const [i,c]of cells.entries()){
  const species=ids[i%4],snow=i>=4,k=Math.min(50/c.width,42/c.height),w=Math.max(1,Math.round(c.width*k)),h=Math.max(1,Math.round(c.height*k));
  const ink=quantize(await sharp(c.data,{raw:{width:c.width,height:c.height,channels:4}}).resize(w,h,{kernel:'nearest'}).raw().toBuffer()),b=inkBox(ink,w,h),bounds={x:Math.floor((56-b.w)/2),y:50-b.h,w:b.w,h:b.h},data=Buffer.alloc(56*56*4);
  for(let y=0;y<b.h;y++)ink.copy(data,((bounds.y+y)*56+bounds.x)*4,((b.y+y)*w+b.x)*4,((b.y+y)*w+b.x+b.w)*4);
  const file=snow?`environment/winter/habitat-${species}-snow.png`:`native-complete-objects/habitat_${species}/frame-01.png`,png=await sharp(data,{raw:{width:56,height:56,channels:4}}).png().toBuffer();await fs.writeFile(new URL(file,root),png);
  const frame={file,width:56,height:56,pivotX:28,pivotY:50,bounds,sha256:hash(png),sourceRect:c.rect};record.outputs.push({species,snow,...frame});
  if(!snow){
   art[species]={...art[species],...frame,frames:[file],refreshed:true};delete art[species].sha256;delete art[species].sourceRect;
   const item=manifest.items.find(a=>a.id===`habitat_${species}`);Object.assign(item,frame,{frames:[file],frameRecords:[frame],master,masterSha256:hash(bytes),prompt,refreshed:true,method:'authored atlas pose, uniform nearest resize, palette snap, binary alpha, grounded at50'});delete item.generatedFile;
  }
 }
 assets.push(record);
}
await fs.writeFile(aurl,text.replace(/export const HABITAT_ART=\{[^\n]+\};/,'export const HABITAT_ART='+JSON.stringify(art)+';'));
await fs.writeFile(murl,JSON.stringify(manifest,null,2)+'\n');
await fs.writeFile(new URL('environment/masters/habitat-refresh-20261109/provenance.json',root),JSON.stringify({tool:'built-in image_gen',assets},null,2)+'\n');
