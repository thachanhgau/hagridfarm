// Repack the six authored orchard sheets; preserve the shared tree canvas and root anchor.
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
import {SPRITE_PALETTE} from './palette.mjs';
import {authoredCells} from './authored-atlas.mjs';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const sharp=createRequire(import.meta.url)(process.env.SHARP_MODULE||'/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=new URL('./',import.meta.url),manifest=new URL('environment/edge/masters/orchard-refresh-20261108/provenance.json',root);
const provenance=JSON.parse(await fs.readFile(manifest,'utf8'));
let edge=await fs.readFile(new URL('edge-art.mjs',root),'utf8');
for(const item of provenance.assets){
 const bytes=await fs.readFile(new URL(item.master,root));
 const checksum=crypto.createHash('sha256').update(bytes).digest('hex');
 if(item.masterSha256&&item.masterSha256!==checksum)throw Error('Changed master '+item.id);
 item.masterSha256=checksum;
 const cells=authoredCells(await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true}),[3]);
 const snow=item.id.endsWith('-snow'),species=item.id.replace('-snow','');
 const palette=[...SPRITE_PALETTE,...(snow?['#E8F0ED']:[])].map(c=>[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)));
 item.outputs=[];
 for(let stage=0;stage<3;stage++){
  const cell=cells[stage],scale=Math.min((stage?48:16)/cell.width,(stage?53:22)/cell.height),w=Math.round(cell.width*scale),h=Math.round(cell.height*scale);
  const ink=await sharp(cell.data,{raw:{width:cell.width,height:cell.height,channels:4}}).resize(w,h,{kernel:'nearest'}).raw().toBuffer();
  for(let i=0;i<ink.length;i+=4){
   if(ink[i+3]<192){ink.fill(0,i,i+4);continue;}
   const dist=p=>2*(ink[i]-p[0])**2+3*(ink[i+1]-p[1])**2+(ink[i+2]-p[2])**2;
   ink.set(palette.reduce((a,b)=>dist(a)<dist(b)?a:b),i);ink[i+3]=255;
  }
  const out=Buffer.alloc(64*72*4),x=Math.floor((64-w)/2),y=55-h;
  for(let row=0;row<h;row++)ink.copy(out,((y+row)*64+x)*4,row*w*4,(row+1)*w*4);
  const file=`environment/${snow?'winter':'edge'}/tree-${species}-${stage}${snow?'-snow':''}.png`;
  await sharp(out,{raw:{width:64,height:72,channels:4}}).resize(128,144,{kernel:'nearest'}).png().toFile(fileURLToPath(new URL(file,root)));
  item.outputs.push(file);
  if(!snow){const id=`tree-${species}-${stage}`,pattern=new RegExp(`( "${id}": )(\\{[^\\n]+\\})(,)`);edge=edge.replace(pattern,(_,prefix,json,suffix)=>prefix+JSON.stringify({...JSON.parse(json),bounds:{x:x*2,y:y*2,w:w*2,h:h*2}})+suffix);}
 }
}
await fs.writeFile(new URL('edge-art.mjs',root),edge);
await fs.writeFile(manifest,JSON.stringify(provenance,null,2)+'\n');
