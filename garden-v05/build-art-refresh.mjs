import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
const root=process.argv[2]||path.resolve(new URL('..',import.meta.url).pathname),game=path.join(root,'garden-v05');
const require=createRequire(import.meta.url),sharp=require('/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const {authoredCells}=await import(path.join(game,'authored-atlas.mjs'));
const {rasterize}=await import(path.join(game,'build-creature-motion.mjs'));
const {packNativeAtlas}=await import(path.join(game,'native-atlas.mjs'));
const inputs=JSON.parse(await fs.readFile(path.join(game,'creature-motion-assets/masters/refresh-20261108/provenance.json'),'utf8')).records.map(r=>({...r,file:path.join(game,r.master)}));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const records=[];
const pondFile=path.join(game,'creature-motion-assets/pond-creatures.json');
const pond=JSON.parse(await fs.readFile(pondFile,'utf8'));
for(const input of inputs){
 const master=input.master;
 await fs.mkdir(path.dirname(path.join(game,master)),{recursive:true});
 if(path.resolve(input.file)!==path.join(game,master))await fs.copyFile(input.file,path.join(game,master));
 const raw=await sharp(input.file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 records.push({id:input.id,master,sha256:hash(await fs.readFile(input.file)),prompt:input.prompt,tool:'built-in image_gen',leftView:'offline horizontal mirror of authored right poses'});
 if(input.id==='pond-bed'){
  // Same palette and binary alpha as garden sprites; a 64×44 logical grid keeps the pond's pixel scale coarse.
  const [pose]=authoredCells(raw,[1]);
  const scale=Math.min(60/pose.mainBounds.w,38/pose.mainBounds.h);
  const r=rasterize(pose,{width:64,height:44,pivotX:32,pivotY:40},{w:62,h:40},scale,new Map());
  if(r.clippedPixels)throw Error('Pond artwork clipped');
  await sharp(r.output,{raw:{width:64,height:44,channels:4}}).resize(128,88,{kernel:'nearest'}).png().toFile(path.join(game,'environment/pond/pond-bed.png'));
  continue;
 }
 const item=pond.items.find(x=>x.id===input.id),poses=authoredCells(raw,[4,4,4,4,4]);
 const adult=poses.slice(4),median=a=>a.sort((x,y)=>x-y)[Math.floor(a.length/2)];
 const bigger=['knarl','salamander','porlock'].includes(input.id);
 item.canvas=bigger?{width:128,height:128,pivotX:64,pivotY:108}:item.canvas;
 const target={w:bigger?86:66,h:input.id==='knarl'?68:bigger?83:64};
 const scale=Math.min((target.w-2)/median(adult.map(p=>p.mainBounds.w)),(target.h-2)/median(adult.map(p=>p.mainBounds.h)));
 const growthScale=Math.min((target.w-2)/poses[3].mainBounds.w,(target.h-2)/poses[3].mainBounds.h);
 const frames={right:[],left:[]};
 for(const [index,pose]of poses.entries()){
  const rendered=rasterize(pose,item.canvas,target,index<4?growthScale:scale,new Map());
  if(rendered.clippedPixels)throw Error(`${input.id} frame ${index} clips`);
  const clip=['growth','idle','action','eat','care'][Math.floor(index/4)];
  const right=await sharp(rendered.output,{raw:{width:item.canvas.width,height:item.canvas.height,channels:4}}).png().toBuffer();
  for(const direction of ['right','left']){
   const bytes=direction==='right'?right:await sharp(right).flop().png().toBuffer();
   const file=`native/${input.id}/${direction}-${clip}-${String(index%4+1).padStart(2,'0')}.png`;
   await fs.writeFile(path.join(game,'creature-motion-assets',file),bytes);
   const b=rendered.bounds,bounds=direction==='right'?b:{...b,x:item.canvas.width-b.x-b.w};
   frames[direction].push({file,...item.canvas,bounds,sha256:hash(bytes),clip,sourceRect:pose.sourceRect,scale:rendered.scale});
  }
 }
 item.frames=frames;item.targetBounds=target;
 item.refresh=records.at(-1);item.runtimeAtlases={};
 for(const direction of ['right','left'])item.runtimeAtlases[direction]=await packNativeAtlas(game,`creature-motion-assets/native/${input.id}/${direction}-atlas.png`,frames[direction].map(f=>({...f,file:'creature-motion-assets/'+f.file})));
 console.log(input.id,JSON.stringify(item.runtimeAtlases.right.frames[4].bounds));
}
pond.generatedBy='build-art-refresh.mjs';
await fs.writeFile(pondFile,JSON.stringify(pond,null,2)+'\n');
// Keep unchanged creatures and their authored left poses byte-for-byte in the generated script.
const scriptFile=path.join(game,'creature-motion-data.js');let script=await fs.readFile(scriptFile,'utf8');
const arrays=script.match(/const right=(.*?),left=(.*?),pond=(.*?),byId=/);
if(!arrays)throw Error('Unknown creature motion script format');
const right=JSON.parse(arrays[1]),base=JSON.parse(arrays[3]);
for(const item of pond.items){
 const r=right.find(x=>x.id===item.id),l=base.find(x=>x.id===item.id);
 r.frames=item.runtimeAtlases.right.frames;l.frames=item.runtimeAtlases.left.frames;
}
script=script.replace(arrays[0],`const right=${JSON.stringify(right)},left=${arrays[2]},pond=${JSON.stringify(base)},byId=`);
await fs.writeFile(scriptFile,script);
await fs.writeFile(path.join(game,'creature-motion-assets/masters/refresh-20261108/provenance.json'),JSON.stringify({date:'2026-11-08',records},null,2)+'\n');
// Replace the procedural tray surface with authored art, retaining crop coordinates and depth objects.
const sceneFile=path.join(game,'scene-renderer.mjs');let scene=await fs.readFile(sceneFile,'utf8');
const start=scene.indexOf('    const c0 = Math.min(...rects.map',scene.indexOf('  function pondBeds('));
const end=scene.indexOf('    return [...paddies, ...beds.map',start);
if(start<0){if(!scene.includes("id: 'pond-paddy:' + i"))throw Error('Unknown pond renderer');process.exit(0);}
scene=scene.slice(0,start)+`    const paddies = rects.map((r, i) => {
      const xy = iso((r.c0 + r.c1) / 2, (r.r0 + r.r1) / 2);
      return {kind: 'pond-paddy', type: 'pond-bed', id: 'pond-paddy:' + i, xy, draw: (ctx) => {
        const image = imageFor('environment/pond/pond-bed.png');
        if (!image) return;
        ctx.save(); ctx.imageSmoothingEnabled = false;
        ctx.drawImage(image, Math.round(xy[0] - 64), Math.round(xy[1] - 52), 128, 88);
        ctx.restore();
      }};
    });
`+scene.slice(end);
scene=scene.replace('// «Ruộng nước» (owner 08/11 «tạo hình mới và cân đối»): the trays of a row (default-decor pondBedRects) are one\n  // flooded paddy with the thửa\'s raised timber-and-stone rim, dark pond water, low earth bunds between the trays.\n  // The paddy is a ground object drawn from its back corner; bed b (cells[j] = row j) draws only its shoots.','// Authored moss-stone aquatic beds share the existing planting rectangles; crops keep their depth and positions.');
await fs.writeFile(sceneFile,scene);
