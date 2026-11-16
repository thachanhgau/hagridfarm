// Export the coordinate-locked pond from its original authored canvas at native or HD density.
import fs from 'node:fs/promises';import path from 'node:path';import{fileURLToPath}from'node:url';import{createRequire}from'node:module';import{createHash}from'node:crypto';import{SPRITE_PALETTE}from'./palette.mjs';
const root=path.dirname(fileURLToPath(import.meta.url)),dir='environment/pond/masters/coordinate-locked-20261116',sharp=createRequire(import.meta.url)('/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp'),sha=b=>createHash('sha256').update(b).digest('hex');
const colors=[...SPRITE_PALETTE,'#E8F0ED'].map(h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16))),cache=new Map();
export async function coordinatePondPixels(snow=false,density=1){
 const config=JSON.parse(await fs.readFile(path.join(root,dir,'export.json'))),frame=config.frames[snow?1:0],bytes=await fs.readFile(path.join(root,frame.master));if(sha(bytes)!==frame.masterSha256)throw Error('Changed pond master');
 const {left,top,width,height}=config.crop,W=config.placement.width*density,H=config.placement.height*density;
 const raw=await sharp(bytes).extract({left,top,width,height}).resize(W,H,{kernel:'nearest'}).ensureAlpha().raw().toBuffer();
 for(let i=0;i<raw.length;i+=4){if(raw[i+3]<192){raw.fill(0,i,i+4);continue;}const k=raw.readUIntBE(i,3);if(!cache.has(k)){let best=Infinity,hit;for(const c of colors){const distance=2*(raw[i]-c[0])**2+3*(raw[i+1]-c[1])**2+(raw[i+2]-c[2])**2;if(distance<best){best=distance;hit=c;}}cache.set(k,hit);}raw.set(cache.get(k),i);raw[i+3]=255;}
 const out=Buffer.alloc(config.width*config.height*density*density*4);for(let y=0;y<H;y++)raw.copy(out,(((config.placement.top*density+y)*config.width*density)+config.placement.left*density)*4,y*W*4,(y+1)*W*4);return out;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const config=JSON.parse(await fs.readFile(path.join(root,dir,'export.json'))),frames=[];let normalBounds;
 for(const [index,frame]of config.frames.entries()){
  const raw=await coordinatePondPixels(index%2===1),hd=await coordinatePondPixels(index%2===1,2),png=await sharp(raw,{raw:{width:config.width,height:config.height,channels:4}}).png().toBuffer(),hdFile=`${dir}/published-${index}.png`,hdBytes=await sharp(hd,{raw:{width:config.width*2,height:config.height*2,channels:4}}).png().toBuffer();
  let x0=config.width,y0=config.height,x1=-1,y1=-1;for(let y=0;y<config.height;y++)for(let x=0;x<config.width;x++)if(raw[(y*config.width+x)*4+3]){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
  const bounds={x:x0,y:y0,w:x1-x0+1,h:y1-y0+1};if(x0<1||y0<1||x1>config.width-2||y1>config.height-2)throw Error('Pond touches native canvas border '+JSON.stringify(bounds));
  await fs.writeFile(path.join(root,frame.file),png);await fs.writeFile(path.join(root,hdFile),hdBytes);frames.push({...frame,width:config.width,height:config.height,pivotX:config.pivotX,pivotY:config.pivotY,bounds,sha256:sha(png),hdFile,hdSha256:sha(hdBytes)});if(!index)normalBounds=bounds;
 }
 const item={id:'forbidden-lake-20261116',targetKind:'pond',master:config.frames[0].master,masterSha256:config.frames[0].masterSha256,frameRecords:frames};await fs.writeFile(path.join(root,'pond-coordinate-art.json'),JSON.stringify({version:1,items:[item]},null,2)+'\n');
 const p=path.join(root,'pond-art.mjs');let text=await fs.readFile(p,'utf8');let changed=0;text=text.replace(/ "pond-[123]": \{[^\n]+\},/g,line=>{changed++;const k=line.indexOf('{');return line.slice(0,k)+JSON.stringify({...JSON.parse(line.slice(k,-1)),footprint:config.footprint,width:config.width,height:config.height,pivotX:config.pivotX,pivotY:config.pivotY,groundCentre:config.groundCentre,footLift:4.5,bounds:normalBounds})+',';});if(changed!==3)throw Error('Expected three pond tier records');await fs.writeFile(p,text);console.log({frames:frames.map(f=>({file:f.file,bounds:f.bounds})),HD:'1216x972 from original masters'});
}
