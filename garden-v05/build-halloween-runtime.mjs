// Import the 25 finished source artworks, retaining the five live assets byte-for-byte.
import fs from 'node:fs/promises';import path from 'node:path';import crypto from 'node:crypto';import {fileURLToPath} from 'node:url';import {packNativeAtlas} from './native-atlas.mjs';
const root=path.dirname(fileURLToPath(import.meta.url)),read=async f=>JSON.parse(await fs.readFile(path.join(root,f))),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const pack=await read('halloween-assets/manifest.json'),runtime=await read('decor-assets-manifest.json'),originalIds=['hw_halloween_sign','hw_wooden_black_cat','hw_cloth_ghost_lantern','hw_pumpkin_stack','hw_monster_candy_barrel'];
const originals=runtime.items.filter(i=>originalIds.includes(i.id));if(originals.length!==5)throw Error('Missing original Halloween assets');const generated=[],qaManifest=await read('halloween-assets/qa/validation.json');
for(const item of pack.items.filter(i=>!originalIds.includes(i.id))){
 for(const file of [item.defaultFile,item.rightFile,...item.defaultFrames,...item.rightFrames])if(sha(await fs.readFile(path.join(root,'halloween-assets',file)))!==item.pngSha256[file])throw Error('Source hash '+file);
 const qa=qaManifest.items.find(i=>i.id===item.id),left=qa.views.default.base.bounds,right=qa.views.alternate.base.bounds;
 const bounds=b=>({x:b.x,y:b.y,w:b.w,h:b.h});
 for(const file of [item.defaultFile,item.rightFile])await fs.copyFile(path.join(root,'halloween-assets',file),path.join(root,'decor-assets',file));
 const records=[...item.defaultFrames,...item.rightFrames].map((file,i)=>({file:'halloween-assets/'+file,width:item.width,height:item.height,pivotX:item.pivot.x,pivotY:item.pivot.y,bounds:bounds(i<4?left:right)}));
 const atlas=await packNativeAtlas(root,'decor-assets/native/'+item.id+'_atlas.png',records);
 const entry={id:item.id,kind:'decor',collection:'festival',storeItem:true,rotatable:true,label:item.label,group:item.group,file:'decor-assets/'+item.defaultFile,rightFile:'decor-assets/'+item.rightFile,frames:Array(4).fill(atlas.file),rightFrames:Array(4).fill(atlas.file),atlasRects:atlas.frames.slice(0,4).map(f=>f.atlasRect),rightAtlasRects:atlas.frames.slice(4).map(f=>f.atlasRect),durations:item.durationsMs,angles:['default','right'],width:item.width,height:item.height,pivotX:item.pivot.x,pivotY:item.pivot.y,bounds:bounds(left),rightBounds:bounds(right),footprintTiles:item.footprintTiles,motion:item.motion,framesIdentical:item.framesIdentical,nativeSha256:item.pngSha256[item.defaultFile]};generated.push(entry);
}
runtime.items=[...runtime.items.filter(i=>i.collection!=='festival'),...originals,...generated];await fs.writeFile(path.join(root,'decor-assets-manifest.json'),JSON.stringify(runtime,null,2)+'\n');console.log(JSON.stringify({festival:30,added:generated.length,preserved:originals.map(i=>i.id),atlases:generated.length}));
