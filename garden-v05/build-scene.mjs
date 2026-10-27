import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),sharp=require(process.env.SHARP_MODULE||'/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=path.dirname(new URL(import.meta.url).pathname);
const motion=JSON.parse(await fs.readFile(path.join(root,'motion-data.json'))),palette=motion.palette.map(h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)));
const cache=new Map();function color(r,g,b){const key=(r<<16)|(g<<8)|b;if(cache.has(key))return cache.get(key);let d=Infinity,c;for(const p of palette){const n=2*(r-p[0])**2+3*(g-p[1])**2+(b-p[2])**2;if(n<d){d=n;c=p;}}cache.set(key,c);return c;}
await fs.mkdir(path.join(root,'environment/layers'),{recursive:true});
async function exportProp(id,file,rect,maxW,maxH,pad=0){ // pad: transparent side columns (and pad/2 top rows) so the ink never touches the canvas edge
 let im=sharp(path.join(root,file));if(rect)im=im.extract({left:rect[0],top:rect[1],width:rect[2]-rect[0],height:rect[3]-rect[1]});
 const raw=await im.ensureAlpha().raw().toBuffer({resolveWithObject:true});let x0=raw.info.width,y0=raw.info.height,x1=0,y1=0;
 for(let y=0;y<raw.info.height;y++)for(let x=0;x<raw.info.width;x++)if(raw.data[(y*raw.info.width+x)*4+3]>=192){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
 const w=x1-x0+1,h=y1-y0+1,scale=Math.min(maxW/w,maxH/h),W=Math.round(w*scale),H=Math.round(h*scale);
 const b=await sharp(raw.data,{raw:raw.info}).extract({left:x0,top:y0,width:w,height:h}).resize(W,H,{kernel:'nearest'}).raw().toBuffer();
 for(let i=0;i<b.length;i+=4){if(b[i+3]<192){b.fill(0,i,i+4);continue;}const c=color(b[i],b[i+1],b[i+2]);b[i]=c[0];b[i+1]=c[1];b[i+2]=c[2];b[i+3]=255;}
 const output=`environment/layers/${id}.png`,top=pad/2,bottom=pad?1:0,CW=W+2*pad,CH=H+top+bottom;
 await sharp({create:{width:CW,height:CH,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:await sharp(b,{raw:{width:W,height:H,channels:4}}).png().toBuffer(),left:pad,top}]).png().toFile(path.join(root,output));
 return {id,file:output,width:CW,height:CH,pivotX:Math.floor(CW/2),pivotY:CH-bottom,source:file,sourceRect:rect??null};
}
const props=[];
for(const [id,rect,W,H,pad] of [['oak',[0,0,550,600],170,180],['pine',[550,0,880,600],92,170],['pond',[880,0,1536,600],152,112,4],['fenceNE',[0,600,520,1024],112,80],['fenceNW',[520,600,940,1024],112,80],['gate',[940,600,1536,1024],144,92]])props.push(await exportProp(id,'environment/props-v03.png',rect,W,H,pad));
props.push(await exportProp('hut','environment/hut.png',null,176,184));
// Reuse texture bytes from the approved terrain. Exact diamond geometry belongs to tile data.
const tiles=[];
for(const id of ['grass','soil']){
 const file=`environment/terrain-${id}.png`,raw=await sharp(path.join(root,file)).ensureAlpha().raw().toBuffer({resolveWithObject:true});let x0=raw.info.width,y0=raw.info.height,x1=0,y1=0;
 for(let y=0;y<raw.info.height;y++)for(let x=0;x<raw.info.width;x++)if(raw.data[(y*raw.info.width+x)*4+3]>=192){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
 const b=await sharp(raw.data,{raw:raw.info}).extract({left:x0,top:y0,width:x1-x0+1,height:y1-y0+1}).resize(64,32,{kernel:'nearest'}).raw().toBuffer();
 const fallback=id==='grass'?[113,147,75]:[115,80,68];
 for(let y=0;y<32;y++)for(let x=0;x<64;x++){const i=(y*64+x)*4,inside=Math.abs((x+.5)-32)/32+Math.abs((y+.5)-16)/16<=1;if(!inside){b.fill(0,i,i+4);continue;}const c=b[i+3]<192?fallback:color(b[i],b[i+1],b[i+2]);b[i]=c[0];b[i+1]=c[1];b[i+2]=c[2];b[i+3]=255;}
 const output=`environment/layers/tile-${id}.png`;await sharp(b,{raw:{width:64,height:32,channels:4}}).png().toFile(path.join(root,output));tiles.push({id,file:output,width:64,height:32});
}
// 18x16 diamond grid; each gameplay plot owns exactly9 explicit tile coordinates.
const plots=[{id:0,col:4,row:5},{id:1,col:8,row:5},{id:2,col:8,row:9}];
const objects=[{id:'hut',col:2,row:3},{id:'pond',col:12,row:2},{id:'oak',col:0,row:4},{id:'pine',col:3,row:0},{id:'oak',col:9,row:0},{id:'pine',col:15,row:3},{id:'oak',col:17,row:13},{id:'pine',col:1,row:12},{id:'gate',col:12,row:13},{id:'fenceNE',col:8,row:14},{id:'fenceNW',col:15,row:12}];
const map={version:3,tileWidth:64,tileHeight:32,columns:18,rows:16,origin:{x:528,y:104},width:1152,height:720,plots,objects,props,tiles,creatureSpots:[[11,4],[16,4],[16,7]],layers:['terrain','ground-props','y-sorted-objects-and-actors','selection']};
await fs.writeFile(path.join(root,'scene-data.json'),JSON.stringify(map,null,2));await fs.writeFile(path.join(root,'scene-data.js'),'window.FARM_SCENE='+JSON.stringify(map)+';');console.log(JSON.stringify({props:props.map(p=>[p.id,p.width,p.height]),tiles:tiles.length,plots:plots.length,slots:plots.length*9}));
