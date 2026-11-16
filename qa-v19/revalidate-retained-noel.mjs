import fs from'node:fs/promises';import {createHash}from'node:crypto';import{createRequire}from'node:module';import{HD_ART}from'../garden-v05/hd-art.mjs';import{axisLineEvidence}from'../garden-v05/isometric-art-validation.mjs';
const sharp=createRequire(import.meta.url)('/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp'),root='garden-v05/',sha=b=>createHash('sha256').update(b).digest('hex'),read=async p=>JSON.parse(await fs.readFile(p,'utf8')),rows=[],cache=new Map();
const image=async f=>{if(!cache.has(f))cache.set(f,await sharp(root+f).ensureAlpha().raw().toBuffer({resolveWithObject:true}));return cache.get(f);};
for(const [pack,auditFile]of [['noel-50-assets','docs/noel-native-axis-audit.json'],['house-noel-assets','docs/house-noel-native-axis-audit.json']]){
 const manifest=await read(root+pack+'/manifest.json'),audit=await read(auditFile);
 for(const r of audit.rows){const item=manifest.items.find(i=>i.id===r.id),frame=item.frames[r.frame],atlas=item.atlas.frames[r.frame],hd=HD_ART[atlas.file];if(!hd)throw Error('Missing retained HD '+r.id);
  if(sha(await fs.readFile(root+item.master))!==item.masterSha256||sha(await fs.readFile(root+frame.file))!==frame.sha256)throw Error('Retained source changed '+r.id);
  const native=await image(frame.file),full=await image(hd.file),ar=atlas.atlasRect,d=hd.density,edgeReports=[];
  for(const e of r.edges){const axis=e.expectedSlope>0?'column':'row',points=e.actualPixels;if(points.some(([x,y])=>!native.data[(y*native.info.width+x)*4+3]))throw Error('Stale observed pixels '+r.id);
   const x0=Math.min(...points.map(p=>p[0]))*d,x1=(Math.max(...points.map(p=>p[0]))+1)*d-1,observed=[];
   for(let x=x0;x<=x1;x++){let y=ar.h*d-1;for(;y>=0;y--){const i=(((ar.y*d+y)*full.info.width)+(ar.x*d+x))*4;if(full.data[i+3])break;}if(y>=0)observed.push([x,y]);}
   const fit=axisLineEvidence(observed,axis,d);edgeReports.push({axis,nativePoints:points,hdPoints:observed,...fit,passed:fit.maxDistance<=1});
  }
  rows.push({id:r.id,frame:r.frame,facing:r.facing,file:frame.file,masterSha256:item.masterSha256,hd:hd.file,edges:edgeReports,passed:edgeReports.every(e=>e.passed)});
 }
}
const report={method:'Re-read original observed native pixels and the actual selected HD atlas bottom contours over the same edge spans; exact garden axes, one native pixel maximum, existing four-pixel corner exclusions retained.',frames:rows.length,subjects:new Set(rows.map(r=>r.id)).size,failures:rows.filter(r=>!r.passed).map(r=>({id:r.id,frame:r.frame,errors:r.edges.map(e=>e.maxDistance)})),rows};
await fs.writeFile('docs/isometric-hd-audit-20261115/retained-noel-hd-revalidation.json',JSON.stringify(report,null,2)+'\n');console.log({frames:report.frames,subjects:report.subjects,failures:report.failures});if(report.failures.length)process.exitCode=1;
