// Native frames of the 100 authored winter pieces, rebuilt from their HD atlas (owner 17/11/2026: «rất nhiều hình bị
// vỡ pixel»). The imported natives were palette-snapped with an alpha<192 cut: colours collapsed to one tone and soft
// edges (hair, scarves, leaves) turned to holes. Area downscale of the HD (master colours), binary alpha at 50%.
//   node garden-v05/rebuild-winter-native.mjs && node garden-v05/build-runtime-webp.mjs
import fs from 'node:fs/promises';import path from 'node:path';import {fileURLToPath} from 'node:url';import {createRequire} from 'node:module';
const root=path.dirname(fileURLToPath(import.meta.url));
const sharp=createRequire(import.meta.url)(process.env.SHARP_MODULE||'/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const manifestFile=path.join(root,'decor-assets-manifest.json'),manifest=JSON.parse(await fs.readFile(manifestFile,'utf8'));
const hdArt=JSON.parse((await fs.readFile(path.join(root,'hd-art.mjs'),'utf8')).match(/export const HD_ART=(\{.*\});/)[1]);
const bounds=(data,width,height,x0)=>{let l=width,t=height,r=-1,b=-1;for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(data[(y*width*2+x0+x)*4+3]){l=Math.min(l,x);t=Math.min(t,y);r=Math.max(r,x);b=Math.max(b,y);}return r<0?null:{x:l,y:t,w:r-l+1,h:b-t+1};};
let count=0;
for(const item of manifest.items.filter(i=>i.artRevision?.startsWith('authored-winter-20261117'))){
 const atlas=item.frames[0],hd=hdArt[atlas];if(!hd)throw Error('No HD atlas for '+item.id);
 const W=item.width,H=item.height,{data}=await sharp(path.join(root,hd.file)).ensureAlpha().resize(W*2,H,{fit:'fill',kernel:'lanczos3'}).raw().toBuffer({resolveWithObject:true});
 for(let p=3;p<data.length;p+=4){if(data[p]<128)data.fill(0,p-3,p+1);else data[p]=255;}
 const raw={raw:{width:W*2,height:H,channels:4}};
 await fs.writeFile(path.join(root,atlas),await sharp(data,raw).png().toBuffer());
 for(const [i,file]of [item.file,item.rightFile].entries())await fs.writeFile(path.join(root,file),await sharp(data,raw).extract({left:i*W,top:0,width:W,height:H}).png().toBuffer());
 const b0=bounds(data,W,H,0),b1=bounds(data,W,H,W);if(!b0||!b1)throw Error('Empty frame '+item.id);
 item.bounds=b0;item.rightBounds=b1;item.artRevision='authored-winter-20261117-native2';count++;
}
await fs.writeFile(manifestFile,JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({rebuilt:count}));
