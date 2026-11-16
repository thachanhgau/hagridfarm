// Publish reviewed candidates only. Geometry approval is independent of footprint fitting.
import fs from 'node:fs/promises';import path from 'node:path';import {fileURLToPath}from'node:url';import {createHash}from'node:crypto';
import {packNativeAtlas}from'./native-atlas.mjs';
import {axisLineEvidence,circularFrontEvidence}from'./isometric-art-validation.mjs';
import {ITEM_ART}from'./item-art.mjs';import {COMPLETE_SCENERY,HABITAT_ART,KEEPSAKE_ART}from'./complete-object-art.mjs';import {PLOT_SCENERY_ART}from'./plot-scenery-art.mjs';
const root=path.dirname(fileURLToPath(import.meta.url)),read=async f=>JSON.parse(await fs.readFile(path.join(root,f),'utf8')),write=async(f,v)=>fs.writeFile(path.join(root,f),JSON.stringify(v,null,2)+'\n'),sha=b=>createHash('sha256').update(b).digest('hex');
const approval=await read('isometric-hd-acceptance.json'),protectedArt=await read('isometric-hd-preserve.json'),packs=await Promise.all(['isometric-hd-assets','isometric-extra-assets'].map(p=>read(p+'/candidates.json'))),all=packs.flatMap(p=>p.items),decor=await read('decor-assets-manifest.json'),complete=await read('complete-objects-manifest.json'),items=await read('item-art-manifest.json');
const earned=structuredClone(ITEM_ART),scenes=structuredClone(COMPLETE_SCENERY),habitats=structuredClone(HABITAT_ART),keepsakes=structuredClone(KEEPSAKE_ART),plots=structuredClone(PLOT_SCENERY_ART),published=[];
let winter=await fs.readFile(path.join(root,'garden-winter.mjs'),'utf8');
const winterMap=Object.fromEntries([...winter.matchAll(/'([^']+)': '([^']+)'/g)].map(m=>[m[1],m[2]]));
const winterFile=(normal,fallback)=>{if(winterMap[normal])return winterMap[normal];winter=winter.replace('export const WINTER_ART = Object.freeze({',`export const WINTER_ART = Object.freeze({\n  '${normal}': '${fallback}',`);winterMap[normal]=fallback;return fallback;};
async function copy(frame,target){const bytes=await fs.readFile(path.join(root,frame.file));if(sha(bytes)!==frame.sha256)throw Error('Stale candidate '+frame.file);await fs.mkdir(path.dirname(path.join(root,target)),{recursive:true});await fs.writeFile(path.join(root,target),bytes);return {...frame,file:target};}
const unionBounds=frames=>{const x=Math.min(...frames.map(f=>f.bounds.x)),y=Math.min(...frames.map(f=>f.bounds.y));return {x,y,w:Math.max(...frames.map(f=>f.bounds.x+f.bounds.w))-x,h:Math.max(...frames.map(f=>f.bounds.y+f.bounds.h))-y};};
async function validate(candidate,a){
 if(candidate.retainOriginal||candidate.preserveOriginal)throw Error('Retained original artwork '+candidate.id);
 if(!a.identityReviewed||!a.allFramesReviewed||a.masterSha256!==candidate.masterSha256)throw Error('Unreviewed or stale artwork '+candidate.id);
 const views=candidate.fixedCamera?['default',candidate.winter?'winter':'idle']:['default','right'];
 for(const view of views){const evidence=a.views?.[view];if(!evidence)throw Error('Missing view '+candidate.id+' '+view);
  if(evidence.file){const bytes=await fs.readFile(path.join(root,evidence.file));if(sha(bytes)!==evidence.sha256)throw Error('Stale evidence '+candidate.id+' '+view);}
  if(evidence.method==='circular-front'){const m=circularFrontEvidence(evidence.points,evidence.diameter,evidence.density||1);if(m.maxDistance>1||!evidence.plane)throw Error('Circular contour mismatch '+candidate.id);continue;}
  if(evidence.method==='axis-anchors'){const [p,q]=evidence.points,s=evidence.axis==='column'?.5:-.5;if(evidence.points.length!==2||Math.abs(p[0]-q[0])/(evidence.density||1)<8||Math.abs((q[1]-p[1])-s*(q[0]-p[0]))/(evidence.density||1)>1||!evidence.plane)throw Error('Ground contact mismatch '+candidate.id);continue;}
  if(evidence.method==='organic'){if(!evidence.reason)throw Error('Missing organic rationale');continue;}
  if(evidence.method!=='measured'||!evidence.edges?.length)throw Error('Missing actual image edges '+candidate.id);
  for(const edge of evidence.edges){const measured=axisLineEvidence(edge.points,edge.axis,edge.density||1);if(measured.maxDistance>1)throw Error('Camera residual '+candidate.id+' '+measured.maxDistance);if(measured.span<6||!edge.plane)throw Error('Unidentified/short world edge '+candidate.id);}
 }
}
// Validate the complete batch before changing any public image.
for(const a of approval.items){const c=all.find(c=>c.id===a.id);if(!c||protectedArt.items.some(i=>i.id===a.id))throw Error('Missing/protected artwork '+a.id);await validate(c,a);if(sha(await fs.readFile(path.join(root,c.master)))!==c.masterSha256)throw Error('Changed master '+c.id);}
for(const a of approval.items){if(protectedArt.items.some(i=>i.id===a.id))throw Error('Owner requested original artwork: '+a.id);const c=all.find(c=>c.id===a.id);if(!c)throw Error('Missing candidate '+a.id);await validate(c,a);if(sha(await fs.readFile(path.join(root,c.master)))!==c.masterSha256)throw Error('Changed master '+c.id);
 const outputs=[],targetKind=c.targetKind||'store-decoration';
 if(targetKind==='store-decoration'){
  const target=decor.items.find(i=>i.id===c.id);if(!target)throw Error('Missing runtime decor '+c.id);
  const frames=[];for(let i=0;i<8;i++)frames.push(await copy(c.frames[i],`isometric-hd-assets/published-native/${c.id}/frame-${i}.png`));
  const atlas=await packNativeAtlas(root,`decor-assets/native/${c.id}_atlas.png`,frames,4);
  outputs.push(...frames,await copy(c.frames[0],target.file),await copy(c.frames[4],target.rightFile));
  if(c.id.startsWith('decor_'))for(let i=0;i<8;i++)outputs.push(await copy(c.frames[i],`decor-assets/native/${c.id}${i>=4?'_right':''}_f${i%4}.png`));
  Object.assign(target,{frames:Array(4).fill(atlas.file),rightFrames:Array(4).fill(atlas.file),atlasRects:atlas.frames.slice(0,4).map(f=>f.atlasRect),rightAtlasRects:atlas.frames.slice(4).map(f=>f.atlasRect),bounds:unionBounds(frames.slice(0,4)),rightBounds:unionBounds(frames.slice(4)),master:c.master,sourceSha256:c.masterSha256,nativeSha256:frames[0].sha256,artRevision:'isometric-hd-20261115',framesIdentical:frames.slice(0,4).every(f=>f.sha256===frames[0].sha256)&&frames.slice(4).every(f=>f.sha256===frames[4].sha256)});
 }else if(targetKind==='earned-decoration'){
  for(const [index,key]of [[0,c.originalId],[4,c.originalId+'_right']]){const f=await copy(c.frames[index],earned[key].file);earned[key]={...earned[key],bounds:f.bounds};Object.assign(items.items[key]||{},f,{source:c.master,sourceSha256:c.masterSha256});outputs.push(f);}
 }else if(['keepsake','habitat','scenery'].includes(targetKind)&&c.originalId!=='hut'){
  const records=targetKind==='scenery'?scenes:targetKind==='habitat'?habitats:keepsakes,target=Array.isArray(records)?records.find(r=>r.id===c.originalId):records[c.originalId],entry=complete.items.find(i=>i.id===target.id),count=targetKind==='scenery'?4:1;
  for(let i=0;i<count;i++)outputs.push(await copy(c.frames[i],target.frames[i]));
  Object.assign(target,{bounds:outputs[0].bounds});Object.assign(entry,outputs[0],{frames:outputs.map(f=>f.file),frameRecords:[...outputs],master:c.master,masterSha256:c.masterSha256,prompt:c.subject+' Camera locked to the garden 64x32 axes; the frozen guide and generation record identify the authored input.',artRevision:'isometric-hd-20261115'});
  if(c.winter){for(let i=0;i<count;i++){const normal=outputs[i].file,file=winterFile(normal,`environment/winter/iso-${target.id}-${i}.png`);outputs.push(await copy(c.frames[4+i],file));}}
 }else if(targetKind==='plot-prop'){
  const target=plots[c.originalId],f=await copy(c.frames[0],target.file);outputs.push(f);target.bounds=f.bounds;outputs.push(await copy(c.frames[4],winterFile(target.file,`environment/winter/iso-${c.originalId}.png`)));
 }else if(c.originalId==='hut'){
  const normal=c.previousViews[0].file;outputs.push(await copy(c.frames[0],normal),await copy(c.frames[4],winterFile(normal,c.previousViews[1].file)));
 }else if(targetKind==='festival-hero')outputs.push(await copy(c.frames[0],c.previousRuntime.file));
 else throw Error('Unsupported replacement '+c.id);
 for(const f of outputs)if(f.effectBaseFile){const index=c.frames.findIndex(v=>v.file===f.effectBaseFile);f.effectBaseFile=outputs[index]?.file;}
 published.push({id:c.id,originalId:c.originalId||c.id,targetKind,master:c.master,masterSha256:c.masterSha256,paletteColors:c.paletteColors,frameRecords:outputs,acceptance:a});
}
await write('decor-assets-manifest.json',decor);await write('complete-objects-manifest.json',complete);await write('item-art-manifest.json',items);
await fs.writeFile(path.join(root,'item-art.mjs'),'// Generated by build-item-art.mjs, then apply-isometric-replacements.mjs.\nexport const ITEM_ART=Object.freeze('+JSON.stringify(earned)+');\n');
await fs.writeFile(path.join(root,'complete-object-art.mjs'),'// Generated by build-complete-objects.mjs, then apply-isometric-replacements.mjs.\nexport const COMPLETE_SCENERY='+JSON.stringify(scenes)+';\nexport const HABITAT_ART='+JSON.stringify(habitats)+';\nexport const KEEPSAKE_ART='+JSON.stringify(keepsakes)+';\nexport const completeObjectFiles=()=>[...COMPLETE_SCENERY,...Object.values(HABITAT_ART),...Object.values(KEEPSAKE_ART)].flatMap(item=>item.frames);\n');
await fs.writeFile(path.join(root,'plot-scenery-art.mjs'),'// Generated by build-plot-variety.mjs, then apply-isometric-replacements.mjs.\nexport const PLOT_SCENERY_ART=Object.freeze('+JSON.stringify(plots)+');\n');
await fs.writeFile(path.join(root,'garden-winter.mjs'),winter);await write('isometric-hd-manifest.json',{version:1,items:published});console.log({published:published.length});
