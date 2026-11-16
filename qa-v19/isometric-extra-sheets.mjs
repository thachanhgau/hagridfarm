import fs from 'node:fs/promises';import path from 'node:path';import vm from 'node:vm';import{createRequire}from'node:module';import{createHash}from'node:crypto';
const game='garden-v05',out='docs/isometric-hd-audit-20261115',sharp=createRequire(import.meta.url)('/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const box={window:{}};vm.createContext(box);const html=await fs.readFile(game+'/index.html','utf8');for(const[,file]of html.matchAll(/<script src="([^"?]+\.js)(?:\?[^" ]*)?"/g))vm.runInContext(await fs.readFile(game+'/'+file,'utf8'),box,{filename:file});globalThis.window=box.window;
const {HD_ART}=await import('../garden-v05/hd-art.mjs'),{COMPLETE_SCENERY,HABITAT_ART,KEEPSAKE_ART}=await import('../garden-v05/complete-object-art.mjs'),{ITEM_ART}=await import('../garden-v05/item-art.mjs'),{DECORATION_LAYOUT}=await import('../garden-v05/default-decor.mjs'),{PLOT_SCENERY_ART}=await import('../garden-v05/plot-scenery-art.mjs'),{FOREST_ASSETS}=await import('../garden-v05/forest-surround.mjs'),{FESTIVAL_HEROES}=await import('../garden-v05/garden-seasonal-world.mjs'),{EDGE_SCENERY}=await import('../garden-v05/edge-art.mjs'),{POND_SCENERY}=await import('../garden-v05/garden-pond-ui.mjs'),{WINTER_ART}=await import('../garden-v05/garden-winter.mjs');
const records=[],add=(id,kind,views)=>records.push({id,kind,views:views.filter(v=>v?.file).map(v=>({...v})),camera:'pending'}),scene=new Map([...(box.window.FARM_SCENE.props||[]),...COMPLETE_SCENERY].map(i=>[i.id,i]));
for(const a of scene.values())add(a.id,'scenery',[a,...(WINTER_ART[a.file]?[{...a,file:WINTER_ART[a.file]}]:[])]);
for(const[id]of Object.entries(DECORATION_LAYOUT))add(id,'earned-decoration',[ITEM_ART[id],ITEM_ART[id+'_right']]);
for(const[kind,items]of [['plot-prop',PLOT_SCENERY_ART],['habitat',HABITAT_ART],['keepsake',KEEPSAKE_ART],['festival-hero',FESTIVAL_HEROES],['edge-scenery',EDGE_SCENERY],['pond-scenery',POND_SCENERY]])for(const[id,a]of Object.entries(items))add(id,kind,[a,...(WINTER_ART[a.file]?[{...a,file:WINTER_ART[a.file]}]:[])]);
for(const a of FOREST_ASSETS)add(a.id,'forest',[a,...(WINTER_ART[a.file]?[{...a,file:WINTER_ART[a.file]}]:[])]);
for(const a of box.window.FARM_MOTION.items){if(!['creature','crop'].includes(a.kind))continue;add(a.id,a.kind,[a.frames?.[3],...(a.rightCreatureMotion?[a.rightCreatureMotion.frames?.[3]]:[])]);}
const valid=records.filter(r=>r.views.length);let done=0;
for(let page=0;page<Math.ceil(valid.length/10);page++){
 const layers=[];for(let slot=0;slot<10;slot++){
  const row=valid[page*10+slot];if(!row)continue;const views=row.views.length>1?row.views.slice(0,2):[row.views[0],row.views[0]];
  for(const[v,asset]of views.entries()){
   const file=asset.file.replace(/[?#].*$/,'').replace(/^\.\//,''),hd=HD_ART[file],source=hd?.file||'runtime-webp/'+file.replace(/\.png$/,'.webp');let image=sharp(await fs.readFile(path.join(game,source)));
   if(asset.atlasRect){const r=asset.atlasRect,d=hd?.density||1;image=image.extract({left:r.x*d,top:r.y*d,width:r.w*d,height:r.h*d});}
   const bytes=await image.resize({width:205,height:205,fit:'inside',kernel:'nearest'}).png().toBuffer(),m=await sharp(bytes).metadata();layers.push({input:bytes,left:slot%5*240+Math.floor((240-m.width)/2),top:Math.floor(slot/5)*460+v*210+205-m.height});asset.hd=!!hd;asset.auditSource=source;
  }
  const label=String(page*10+slot+1)+'. '+row.kind+':'+row.id;layers.push({input:Buffer.from(`<svg width="240" height="32"><text x="120" y="22" font-family="sans-serif" font-size="11" text-anchor="middle" fill="#F5D69A">${label.replaceAll('&','&amp;')}</text></svg>`),left:slot%5*240,top:Math.floor(slot/5)*460+420});done++;
 }
 await sharp({create:{width:1200,height:920,channels:4,background:'#24483F'}}).composite(layers).webp({lossless:true}).toFile(`${out}/extra-${String(page+1).padStart(2,'0')}.webp`);
}
await fs.writeFile(out+'/extra-audit.json',JSON.stringify({records:valid},null,2)+'\n');console.log({models:valid.length,kinds:valid.reduce((n,r)=>(n[r.kind]=(n[r.kind]||0)+1,n),{}),missingHD:valid.filter(r=>r.views.some(v=>!v.hd)).map(r=>[r.kind,r.id])});
