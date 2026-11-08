// Pack authored water channels and orchard basins on the existing logical grid.
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {SPRITE_PALETTE} from './palette.mjs';
import {authoredComponents} from './authored-atlas.mjs';
const sharp=createRequire(import.meta.url)(process.env.SHARP_MODULE||'/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=new URL('./',import.meta.url),manifest=new URL('environment/pond/masters/beds-orchard-20261108/provenance.json',root);
const provenance=JSON.parse(await fs.readFile(manifest,'utf8')),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const rgb=c=>[1,3,5].map(i=>parseInt(c.slice(i,i+2),16));
const palette=[...SPRITE_PALETTE,'#E8F0ED'].map(rgb);
function snap(data,snow){
 for(let i=0;i<data.length;i+=4){if(data[i+3]<192){data.fill(0,i,i+4);continue;}
  const distance=c=>2*(data[i]-c[0])**2+3*(data[i+1]-c[1])**2+(data[i+2]-c[2])**2;
  data.set(palette.slice(0,snow?25:24).reduce((a,b)=>distance(a)<distance(b)?a:b),i);data[i+3]=255;
 }return data;
}
let edge=await fs.readFile(new URL('edge-art.mjs',root),'utf8'),pond=await fs.readFile(new URL('pond-art.mjs',root),'utf8');
for(const item of provenance.assets){
 const bytes=await fs.readFile(new URL(item.master,root));
 if(item.masterSha256&&hash(bytes)!==item.masterSha256)throw Error('Changed master '+item.id);item.masterSha256=hash(bytes);
 const raw=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true}),{data,info}=raw;
 let x0=info.width,y0=info.height,x1=0,y1=0;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>=192){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
 const orchard=item.id==='orchard',W=orchard?288:64,H=orchard?157:44;
 const w=orchard?286:62,h=orchard?143:32,left=1,top=orchard?13:11;
 const ink=snap(await sharp(data,{raw:info}).extract({left:x0,top:y0,width:x1-x0+1,height:y1-y0+1}).resize(w,h,{kernel:'nearest',fit:'fill'}).raw().toBuffer(),item.id.endsWith('snow'));
 const out=Buffer.alloc(W*H*4);for(let y=0;y<h;y++)ink.copy(out,((top+y)*W+left)*4,y*w*4,(y+1)*w*4);
 if(orchard){
  // Extract only authored earth basins; align their centres to the six existing planting slots.
  const earth=new Set([1,2,3,12,13].map(i=>parseInt(SPRITE_PALETTE[i].slice(1),16))),mask=Buffer.from(out);
  for(let i=0;i<mask.length;i+=4)if(!earth.has((mask[i]<<16)|(mask[i+1]<<8)|mask[i+2]))mask.fill(0,i,i+4);
  const a=authoredComponents({data:mask,info:{width:W,height:H}}),basins=a.components.filter(c=>c.count>150).sort((a,b)=>Math.round((a.y+a.h/2)/16)-Math.round((b.y+b.h/2)/16)||a.x-b.x);
  if(basins.length!==6)throw Error('Expected six authored basins, found '+basins.length);
  const targets=[[128,44],[80,68],[176,68],[128,92],[224,92],[176,116]];
  const soil=basins.map(c=>{const pixels=Buffer.alloc(c.w*c.h*4);
   for(let y=0;y<c.h;y++){
    const row=Array.from({length:c.w},(_,x)=>x).filter(x=>a.labels[(c.y+y)*W+c.x+x]===c.id);
    if(!row.length)continue;
    for(let x=row[0];x<=row.at(-1);x++){
     const pos=(c.y+y)*W+c.x+x,p=(y*c.w+x)*4,color=(out[pos*4]<<16)|(out[pos*4+1]<<8)|out[pos*4+2];
     if(earth.has(color)||color===0x231f2e)out.copy(pixels,p,pos*4,pos*4+4);else pixels.set([74,48,66,255],p);
     out.set([113,147,75,255],pos*4);
    }
   }return {c,pixels};});
  // Remove the old basin perimeter as well as its fill before re-centring the authored soil.
  for(const c of basins)for(let y=Math.max(0,c.y-3);y<Math.min(H,c.y+c.h+3);y++)for(let x=Math.max(0,c.x-3);x<Math.min(W,c.x+c.w+3);x++)out.set([113,147,75,255],(y*W+x)*4);
  soil.forEach(({c,pixels},i)=>{const x0=targets[i][0]-Math.floor(c.w/2),y0=targets[i][1]-Math.floor(c.h/2);for(let y=0;y<c.h;y++)for(let x=0;x<c.w;x++){const p=(y*c.w+x)*4;if(pixels[p+3])pixels.copy(out,((y0+y)*W+x0+x)*4,p,p+4);}});
  item.pitCentres=targets.map(([x,y])=>[x*2,y*2]);
  // Exact 10×8 logical footprint: one continuous 2:1 stair-step edge, no stray outline pixels.
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
   const col=((x+.5-128)/16+(y+.5-12)/8)/2,row=((y+.5-12)/8-(x+.5-128)/16)/2,i=(y*W+x)*4;
   if(col<0||col>=10||row<0||row>=8){out.fill(0,i,i+4);continue;}
   if(!out[i+3]||Math.min(col,10-col,row,8-row)<.15)out.set([113,147,75,255],i);
  }
 }
 item.file=orchard?'environment/edge/orchard.png':`environment/${item.id.endsWith('snow')?'winter':'pond'}/${item.id}.png`;
 const png=await sharp(out,{raw:{width:W,height:H,channels:4}}).resize(W*2,H*2,{kernel:'nearest'}).png().toBuffer();await fs.writeFile(new URL(item.file,root),png);item.sha256=hash(png);
 let bx=W,by=H,br=0,bb=0;for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(out[(y*W+x)*4+3]){bx=Math.min(bx,x);by=Math.min(by,y);br=Math.max(br,x);bb=Math.max(bb,y);}
 item.bounds={x:bx*2,y:by*2,w:(br-bx+1)*2,h:(bb-by+1)*2};
 const update=(text,id)=>text.replace(new RegExp(`( "${id}": )(\\{[^\\n]+\\})(,)`),(_,prefix,json,suffix)=>prefix+JSON.stringify({...JSON.parse(json),bounds:item.bounds})+suffix);
 if(orchard)edge=update(edge,'orchard');else if(item.id==='pond-bed')pond=update(pond,'pond-bed');
}
await fs.writeFile(new URL('edge-art.mjs',root),edge);await fs.writeFile(new URL('pond-art.mjs',root),pond);
await fs.writeFile(manifest,JSON.stringify(provenance,null,2)+'\n');
// Keep the previous winter inventory pointed at the replacement authored master.
const winterUrl=new URL('environment/winter/masters/expansion-20261108/provenance.json',root),winter=JSON.parse(await fs.readFile(winterUrl,'utf8'));
Object.assign(winter.assets.find(a=>a.id==='pond-bed-snow'),provenance.assets.find(a=>a.id==='pond-bed-snow'));
await fs.writeFile(winterUrl,JSON.stringify(winter,null,2)+'\n');
