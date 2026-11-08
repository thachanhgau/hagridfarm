// Authored expansion/winter masters; keep pivots and canvases, snap to the garden's palette and 2px grid.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {SPRITE_PALETTE} from './palette.mjs';
const root=path.dirname(fileURLToPath(import.meta.url)),require=createRequire(import.meta.url);
const sharp=require(process.env.SHARP_MODULE||'/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const manifest='environment/winter/masters/expansion-20261108/provenance.json';
const provenance=JSON.parse(await fs.readFile(path.join(root,manifest),'utf8'));
const palette=[...SPRITE_PALETTE,'#E8F0ED'].map(h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),cache=new Map();
for(const item of provenance.assets){
 const bytes=await fs.readFile(path.join(root,item.master));
 if(hash(bytes)!==item.masterSha256)throw Error('Master checksum: '+item.id);
 const {data,info}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let x0=info.width,y0=info.height,x1=-1,y1=-1;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>=192){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
 if(x1<0)throw Error('Empty master: '+item.id);
 const W=item.width/2,H=item.height/2,scale=Math.min((W-2)/(x1-x0+1),(H-2)/(y1-y0+1));
 const w=Math.max(1,Math.round((x1-x0+1)*scale)),h=Math.max(1,Math.round((y1-y0+1)*scale));
 const ink=await sharp(data,{raw:info}).extract({left:x0,top:y0,width:x1-x0+1,height:y1-y0+1}).resize(w,h,{kernel:'nearest'}).raw().toBuffer();
 for(let i=0;i<ink.length;i+=4){
  if(ink[i+3]<192){ink.fill(0,i,i+4);continue;}
  const key=(ink[i]<<16)|(ink[i+1]<<8)|ink[i+2];
  if(!cache.has(key))cache.set(key,palette.reduce((best,p)=>{
   const distance=c=>2*(ink[i]-c[0])**2+3*(ink[i+1]-c[1])**2+(ink[i+2]-c[2])**2;
   return distance(p)<distance(best)?p:best;
  }));
  ink.set(cache.get(key),i);ink[i+3]=255;
 }
 const out=Buffer.alloc(W*H*4),left=Math.floor((W-w)/2),top=H-1-h;
 for(let y=0;y<h;y++)ink.copy(out,((top+y)*W+left)*4,y*w*4,(y+1)*w*4);
 let bx=W,by=H,br=-1,bb=-1;
 for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(out[(y*W+x)*4+3]){bx=Math.min(bx,x);by=Math.min(by,y);br=Math.max(br,x);bb=Math.max(bb,y);}
 item.bounds={x:bx*2,y:by*2,w:(br-bx+1)*2,h:(bb-by+1)*2};
 const png=await sharp(out,{raw:{width:W,height:H,channels:4}}).resize(item.width,item.height,{kernel:'nearest'}).png().toBuffer();
 await fs.writeFile(path.join(root,item.file),png);item.sha256=hash(png);
 console.log(item.file,item.width+'×'+item.height,png.length);
}
const deep=provenance.assets.find(a=>a.id==='pond-3');
const artFile=path.join(root,'pond-art.mjs'),art=await fs.readFile(artFile,'utf8'),line=art.match(/ "pond-3": (\{[^\n]+\}),/);
if(!line)throw Error('Missing deep-pond metadata');
await fs.writeFile(artFile,art.replace(line[1],JSON.stringify({...JSON.parse(line[1]),bounds:deep.bounds})));
await fs.writeFile(path.join(root,manifest),JSON.stringify(provenance,null,2)+'\n');
