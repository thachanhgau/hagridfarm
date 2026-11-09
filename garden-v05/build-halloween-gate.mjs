// Pack the dimetric normal/snow gateway pair without altering its authored angle.
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {authoredCells} from './authored-atlas.mjs';
import {quantize} from './build-pond-art.mjs';
const sharp=createRequire(import.meta.url)('/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=new URL('./',import.meta.url),master='environment/masters/halloween-gate-20261109/atlas.png';
const bytes=await fs.readFile(new URL(master,root)),cells=authoredCells(await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true}),[2]),outputs=[];
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
for(const [i,c]of cells.entries()){
 const width=160,height=160,k=Math.min(156/c.width,156/c.height),w=Math.round(c.width*k),h=Math.round(c.height*k);
 const ink=quantize(await sharp(c.data,{raw:{width:c.width,height:c.height,channels:4}}).resize(w,h,{kernel:'nearest'}).raw().toBuffer()),data=Buffer.alloc(width*height*4),x=Math.floor((width-w)/2),y=158-h;
 for(let row=0;row<h;row++)ink.copy(data,((y+row)*width+x)*4,row*w*4,(row+1)*w*4);
 const file=i?'environment/winter/hero-halloween-snow.png':'world-v241/hero-halloween.png',png=await sharp(data,{raw:{width,height,channels:4}}).png().toBuffer();
 await fs.writeFile(new URL(file,root),png);outputs.push({file,width,height,pivotX:80,pivotY:154,sha256:hash(png)});
}
await fs.writeFile(new URL('environment/masters/halloween-gate-20261109/provenance.json',root),JSON.stringify({tool:'built-in image_gen',master,sha256:hash(bytes),prompt:'Redesign frontal Halloween prop into a 2:1 dimetric open gateway. Left farther root-pillar foot higher, right nearer foot lower, baseline descends right. Twisted oak arch with ivy and hanging pumpkin lanterns; pumpkin cluster and cauldron outside right pillar, small pumpkin outside left, transparent central passage. Matching normal and snow versions. Chunky muted native pixel art, no ground tile, road, fence, text or characters.',outputs},null,2)+'\n');
