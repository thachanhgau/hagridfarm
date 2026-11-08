// Retain the authored normal/winter pair; pack at native scale with one shared ground anchor.
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {authoredCells} from './authored-atlas.mjs';
import {quantize} from './build-pond-art.mjs';
const sharp=createRequire(import.meta.url)('/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=new URL('./',import.meta.url),master='environment/homestead-20261108/masters/master.png';
const bytes=await fs.readFile(new URL(master,root));
const cells=authoredCells(await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true}),[2]);
const width=256,height=224,pivotX=128,pivotY=216,outputs=[];
for(const [i,cell]of cells.entries()){
 const scale=Math.min(248/cell.width,214/cell.height),w=Math.round(cell.width*scale),h=Math.round(cell.height*scale);
 const ink=quantize(await sharp(cell.data,{raw:{width:cell.width,height:cell.height,channels:4}}).resize(w,h,{kernel:'nearest'}).raw().toBuffer());
 const data=Buffer.alloc(width*height*4),left=Math.floor((width-w)/2),top=height-4-h;
 for(let y=0;y<h;y++)ink.copy(data,((top+y)*width+left)*4,y*w*4,(y+1)*w*4);
 const file=i?'environment/winter/hut-snow.png':'environment/layers/hut.png';
 const png=await sharp(data,{raw:{width,height,channels:4}}).png().toBuffer();await fs.writeFile(new URL(file,root),png);
 outputs.push({file,width,height,pivotX,pivotY,sha256:crypto.createHash('sha256').update(png).digest('hex')});
}
const url=new URL('scene-data.json',root),scene=JSON.parse(await fs.readFile(url,'utf8'));
Object.assign(scene.props.find(p=>p.id==='hut'),{width,height,pivotX,pivotY});
await fs.writeFile(url,JSON.stringify(scene,null,2)+'\n');
await fs.writeFile(new URL('environment/homestead-20261108/provenance.json',root),JSON.stringify({tool:'built-in image_gen',master,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),prompt:'Expanded rustic Hagrid stone cottage, tall layered slate roof and left chimney, oak timber porch, lit amber windows, right stone wing; integrated firewood lean-to, pumpkins, kettle, pots, barrel, broom, bench, stepping stones. Matching normal and snowy variants, transparent, muted pixel-art palette, no text, characters, fences or background.',outputs},null,2)+'\n');
