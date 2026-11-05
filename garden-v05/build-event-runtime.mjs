// Import the event-assets pack («Mừng HPVN 3 tháng» statues, 25.0 elf pieces) like build-halloween-runtime.mjs: collection 'event'.
// Góc bếp and the S7 Noel set (special-products.mjs, season 'xmas') are sold; the rest are gifts.
const SOLD=new Set(['ev_kitchen_corner','sp_xmas_firebolt','sp_xmas_butterbeer','sp_xmas_honeydukes','sp_xmas_invisibility_cloak','sp_xmas_weasley_tree','sp_xmas_yule_roses']);
import fs from 'node:fs/promises';import path from 'node:path';import crypto from 'node:crypto';import {fileURLToPath} from 'node:url';import {packNativeAtlas} from './native-atlas.mjs';
const root=path.dirname(fileURLToPath(import.meta.url)),read=async f=>JSON.parse(await fs.readFile(path.join(root,f))),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const pack=await read('event-assets/manifest.json'),runtime=await read('decor-assets-manifest.json'),qaManifest=await read('event-assets/qa/validation.json'),generated=[];
for(const item of pack.items){
 for(const file of [item.defaultFile,item.rightFile,...item.defaultFrames,...item.rightFrames])if(sha(await fs.readFile(path.join(root,'event-assets',file)))!==item.pngSha256[file])throw Error('Source hash '+file);
 const qa=qaManifest.items.find(i=>i.id===item.id),left=qa.views.default.base.bounds,right=qa.views.alternate.base.bounds,bounds=b=>({x:b.x,y:b.y,w:b.w,h:b.h});
 for(const file of [item.defaultFile,item.rightFile])await fs.copyFile(path.join(root,'event-assets',file),path.join(root,'decor-assets',file));
 const records=[...item.defaultFrames,...item.rightFrames].map((file,i)=>({file:'event-assets/'+file,width:item.width,height:item.height,pivotX:item.pivot.x,pivotY:item.pivot.y,bounds:bounds(i<4?left:right)}));
 const atlas=await packNativeAtlas(root,'decor-assets/native/'+item.id+'_atlas.png',records);
 generated.push({id:item.id,kind:'decor',collection:'event',storeItem:SOLD.has(item.id),rotatable:true,label:item.label,group:item.group,file:'decor-assets/'+item.defaultFile,rightFile:'decor-assets/'+item.rightFile,frames:Array(4).fill(atlas.file),rightFrames:Array(4).fill(atlas.file),atlasRects:atlas.frames.slice(0,4).map(f=>f.atlasRect),rightAtlasRects:atlas.frames.slice(4).map(f=>f.atlasRect),durations:item.durationsMs,angles:['default','right'],width:item.width,height:item.height,pivotX:item.pivot.x,pivotY:item.pivot.y,bounds:bounds(left),rightBounds:bounds(right),footprintTiles:item.footprintTiles,motion:item.motion,framesIdentical:item.framesIdentical,nativeSha256:item.pngSha256[item.defaultFile]});
}
runtime.items=[...runtime.items.filter(i=>i.collection!=='event'),...generated];await fs.writeFile(path.join(root,'decor-assets-manifest.json'),JSON.stringify(runtime,null,2)+'\n');console.log(JSON.stringify({event:generated.map(i=>i.id)}));
