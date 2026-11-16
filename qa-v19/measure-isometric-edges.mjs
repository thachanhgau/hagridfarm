// Observed alpha-outline segments, never guide coordinates. Human review must identify the world plane.
import fs from 'node:fs/promises';import {createRequire}from'node:module';
import {axisLineEvidence}from'../garden-v05/isometric-art-validation.mjs';
const sharp=createRequire(import.meta.url)('/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp'),pack=process.argv[2]||'isometric-hd-assets',root='garden-v05/',data=JSON.parse(await fs.readFile(root+pack+'/candidates.json','utf8')),results=[];
function edges(raw,w,h,{density=1,contrast=false,yMin=1,yMax=h-1}={}){
 const light=i=>raw[i]*.3+raw[i+1]*.59+raw[i+2]*.11;
 const boundary=[];for(let y=Math.max(1,yMin);y<Math.min(h-1,yMax);y++)for(let x=1;x<w-1;x++){const i=(y*w+x)*4;if(raw[i+3]&&[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>{const j=((y+dy)*w+x+dx)*4;return !raw[j+3]||contrast&&Math.abs(light(i)-light(j))>65;}))boundary.push([x,y]);}
 const segments=[];
 for(const sign of [-1,1])for(let k=10;k<=90;k++){
  const a=sign*k/100,buckets=new Map();for(const p of boundary){const center=Math.round((p[1]-a*p[0])*2)/2;for(const delta of[-.5,0,.5]){const b=center+delta,list=buckets.get(b)||[];list.push(p);buckets.set(b,list);}}
  for(const [b,points]of buckets){if(points.length<8)continue;points.sort((p,q)=>p[0]-q[0]);let run=[];
   const finish=()=>{if(run.length<8)return;const first=run[0],last=run.at(-1),dx=last[0]-first[0];if(dx<8||run.length/dx<.7)return;const n=run.length,sx=run.reduce((s,p)=>s+p[0],0),sy=run.reduce((s,p)=>s+p[1],0),sxx=run.reduce((s,p)=>s+p[0]**2,0),sxy=run.reduce((s,p)=>s+p[0]*p[1],0),slope=(n*sxy-sx*sy)/(n*sxx-sx*sx),intercept=(sy-slope*sx)/n,from=[first[0],slope*first[0]+intercept],to=[last[0],slope*last[0]+intercept],residual=Math.abs((slope-sign*.5)*dx);segments.push({from,to,slope,axis:sign>0?'column':'row',nativeResidual:residual,span:dx,samples:run.length,observedPoints:run});};
   for(const p of points){if(run.length&&p[0]-run.at(-1)[0]>2){finish();run=[];}run.push(p);}finish();
  }
 }
 const chosen=[];for(const e of segments.sort((a,b)=>b.span-a.span||b.samples-a.samples)){if(chosen.filter(c=>c.axis===e.axis).length>=8||chosen.some(c=>c.axis===e.axis&&Math.abs(c.from[0]-e.from[0])<5&&Math.abs(c.from[1]-e.from[1])<4&&Math.abs(c.to[0]-e.to[0])<5&&Math.abs(c.to[1]-e.to[1])<4))continue;const cap=contrast?Math.max(density,Math.min(2*density,Math.floor(e.span*.1))):4,interior=e.observedPoints.filter(p=>p[0]>=e.from[0]+cap&&p[0]<=e.to[0]-cap);chosen.push({...e,cornerCapPixels:cap,axisFit:interior.length>=8?axisLineEvidence(interior,e.axis,density):null,interiorPoints:interior});if(chosen.length===16)break;}
 return chosen;
}
const original=process.argv.includes('--original'),hd=process.argv.includes('--hd');
for(const item of data.items){const views=[];for(const index of [0,4]){let f=hd?item.previewHD[index?1:0]:item.frames[index];if(original){const a=item.previousViews?.[index?1:0]||item.previousRuntime;f={...a,file:index&&a.rightFile?a.rightFile:a.file};}let image=sharp(root+f.file);if(f.atlasRect){const r=f.atlasRect;image=image.extract({left:r.x,top:r.y,width:r.w,height:r.h});}const raw=await image.ensureAlpha().raw().toBuffer({resolveWithObject:true}),b=f.bounds||{y:0,h:raw.info.height},lower=['plinth','box','cabinet','bus','roof','bed','hexgazebo','marketstall'].includes(item.guideKind)?.55:['table','bench','diary','cart','roundhut'].includes(item.guideKind)?.35:0,roi={density:hd?2:1,contrast:hd,yMin:hd?Math.floor(b.y+b.h*lower):1,yMax:raw.info.height-1};views.push({frame:index,file:f.file,density:roi.density,region:roi,edges:edges(raw.data,raw.info.width,raw.info.height,roi)});}results.push({id:item.id,views});}
await fs.writeFile(root+pack+(original?'/original-edges.json':hd?'/observed-hd-edges.json':'/observed-edges.json'),JSON.stringify({method:'unconstrained observed contour/contrast edges in the stated body region; not guide coordinates, not automatic acceptance; one-native-pixel tolerance unchanged',items:results},null,2)+'\n');console.log({measured:results.length,original,hd});
