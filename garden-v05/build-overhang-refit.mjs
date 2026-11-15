// P4 15/11/2026, no-overlap rule §2: two sold Halloween pieces overhung their footprint prism by 3 px a side.
// Their halloween-assets/specs.json entries carry `fitWidth` (pivot, footprint and height unchanged). This swaps only
// their runtime art: build-halloween-runtime.mjs re-imports all 30 and would undo records later builders own (decor-flow).
// Run after `node halloween-assets/build-assets.mjs`.
import fs from 'node:fs/promises';import os from 'node:os';import path from 'node:path';import {execFileSync} from 'node:child_process';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';import {packNativeAtlas} from './native-atlas.mjs';
const root=path.dirname(fileURLToPath(import.meta.url)),read=async f=>JSON.parse(await fs.readFile(path.isAbsolute(f)?f:path.join(root,f)));
const runtime=await read('decor-assets-manifest.json'),specs=await read('halloween-assets/specs.json'),box=b=>({x:b.x,y:b.y,w:b.w,h:b.h}),record=id=>runtime.items.find(i=>i.id===id);
const views=async dir=>{const q=await read(path.join(dir,'qa/validation.json'));return id=>{const v=q.items.find(i=>i.id===id).views;return [box(v.default.base.bounds),box(v.alternate.base.bounds)];};};
// Ghost well: the import build-halloween-runtime.mjs does, for this one item (its atlas rectangles stay the same).
{const pack=await read('halloween-assets/manifest.json'),item=pack.items.find(i=>i.id==='hw_ghost_well'),[left,right]=(await views(path.join(root,'halloween-assets')))(item.id);
 for(const file of [item.defaultFile,item.rightFile])await fs.copyFile(path.join(root,'halloween-assets',file),path.join(root,'decor-assets',file));
 await packNativeAtlas(root,`decor-assets/native/${item.id}_atlas.png`,[...item.defaultFrames,...item.rightFrames].map((file,i)=>({file:'halloween-assets/'+file,width:item.width,height:item.height,pivotX:item.pivot.x,pivotY:item.pivot.y,bounds:i<4?left:right})));
 Object.assign(record(item.id),{bounds:left,rightBounds:right,nativeSha256:item.pngSha256[item.defaultFile]});}
// Candy barrel: the live sprite is the 20/10 export of this master by the same builder with the global 24-colour palette
// (no item-palettes.json), which reproduces all 10 shipped frames byte for byte (checked 15/11); re-export it that way.
{const id='hw_monster_candy_barrel',dir=await fs.mkdtemp(path.join(os.tmpdir(),'barrel-'));
 await fs.mkdir(path.join(dir,'masters'));await fs.copyFile(path.join(root,'halloween-assets/masters',id+'.png'),path.join(dir,'masters',id+'.png'));
 await fs.writeFile(path.join(dir,'specs.json'),JSON.stringify({...specs,items:specs.items.filter(i=>i.id===id)}));
 execFileSync(process.execPath,[path.join(root,'halloween-assets/build-assets.mjs'),'--partial'],{env:{SHARP_MODULE:'/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp',...process.env,DECOR_PACK_DIR:dir},stdio:'ignore'});
 const item=(await read(path.join(dir,'manifest.json'))).items[0],[left,right]=(await views(dir))(id);
 for(const file of [item.defaultFile,item.rightFile,...item.defaultFrames,...item.rightFrames])await fs.copyFile(path.join(dir,file),path.join(root,'decor-assets',file));
 Object.assign(record(id),{bounds:left,rightBounds:right,nativeSha256:item.pngSha256[item.defaultFile]});await fs.rm(dir,{recursive:true});}
await fs.writeFile(path.join(root,'decor-assets-manifest.json'),JSON.stringify(runtime,null,2)+'\n');
// decor-flow.test.mjs pins every record it does not own; these two changed on purpose.
const flow=await read('decor-flow-manifest.json');for(const id of ['hw_ghost_well','hw_monster_candy_barrel'])flow.unchangedEntryHashes[id]=createHash('sha256').update(JSON.stringify(record(id))).digest('hex');
await fs.writeFile(path.join(root,'decor-flow-manifest.json'),JSON.stringify(flow,null,2)+'\n');
for(const id of ['hw_ghost_well','hw_monster_candy_barrel'])console.log(id,JSON.stringify(record(id).bounds),JSON.stringify(record(id).rightBounds));
