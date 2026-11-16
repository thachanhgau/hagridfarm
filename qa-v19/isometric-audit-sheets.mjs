import fs from 'node:fs/promises';import path from 'node:path';import {createRequire}from'node:module';import {createHash}from'node:crypto';import {HD_ART}from'../garden-v05/hd-art.mjs';
const sharp=createRequire(import.meta.url)('/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp'),game='garden-v05',out='docs/isometric-hd-audit-20261115';await fs.mkdir(out,{recursive:true});
const items=JSON.parse(await fs.readFile(game+'/decor-assets-manifest.json')).items,records=[];
for(let page=0;page<Math.ceil(items.length/10);page++){
 const layers=[];
 for(let slot=0;slot<10;slot++){
  const item=items[page*10+slot];if(!item)continue;const views=[];
  for(const [v,file]of[item.file,item.rightFile||item.file].entries()){
   const hd=HD_ART[file],source=hd?.file||'runtime-webp/'+file.replace(/\.png$/,'.webp'),bytes=await fs.readFile(path.join(game,source));
   const image=await sharp(bytes).resize({width:205,height:205,fit:'inside',kernel:'nearest'}).png().toBuffer(),meta=await sharp(image).metadata();
   layers.push({input:image,left:(slot%5)*240+Math.floor((240-meta.width)/2),top:Math.floor(slot/5)*460+v*210+205-meta.height});views.push({file,hd:!!hd,source,sha256:createHash('sha256').update(bytes).digest('hex')});
  }
  const label=(page*10+slot+1)+'. '+item.id,svg=`<svg width="240" height="32"><text x="120" y="22" font-family="sans-serif" font-size="12" text-anchor="middle" fill="#F5D69A">${label}</text></svg>`;
  layers.push({input:Buffer.from(svg),left:slot%5*240,top:Math.floor(slot/5)*460+420});records.push({index:page*10+slot+1,id:item.id,label:item.label,footprint:item.footprintTiles,views,camera:'pending-current-HD-review'});
 }
 await sharp({create:{width:1200,height:920,channels:4,background:'#24483F'}}).composite(layers).webp({lossless:true}).toFile(`${out}/decor-${String(page+1).padStart(2,'0')}.webp`);
}
await fs.writeFile(out+'/decor-audit.json',JSON.stringify({sourceCommit:(await import('node:child_process')).execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),basis:{column:[32,16],row:[-32,16],vertical:[0,-1]},records},null,2)+'\n');console.log({decorations:items.length,views:records.reduce((n,r)=>n+r.views.length,0),missingHD:records.filter(r=>r.views.some(v=>!v.hd)).map(r=>r.id)});
