// Read-only master checks; does not import game modules or write native art.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {NEW_ICONS} from './pixel-icons-new.mjs';
const sharp=createRequire(import.meta.url)('/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=path.resolve(import.meta.dirname,'../../..');
const jobs=JSON.parse(await fs.readFile(path.join(import.meta.dirname,'scenery-placement.json'),'utf8'));
const out=[];
function bbox(data,width,rect) {
 let x0=Infinity,y0=Infinity,x1=-1,y1=-1;
 for(let y=rect[1];y<rect[3];y++) for(let x=rect[0];x<rect[2];x++) if(data[(y*width+x)*4+3]>=128) {x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
 return [x0,y0,x1+1,y1+1];
}
for(const j of jobs) {
 const {data,info}=await sharp(path.join(root,j.master)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const expected=j.kind==='tree'?[1024,1152]:j.size;
 if(info.width!==expected[0]||info.height!==expected[1]) throw Error('Wrong size '+j.id);
 let zero=0,partial=0;
 for(let i=3;i<data.length;i+=4) {if(data[i]===0)zero++;else if(data[i]<255)partial++;}
 if(!zero) throw Error('No transparent pixels '+j.id);
 const check={id:j.id,size:[info.width,info.height],transparentPixels:zero,partialAlphaPixels:partial,bounds128:bbox(data,info.width,[0,0,info.width,info.height])};
 if(j.kind==='items') {
  check.cells=[];
  for(let r=0;r<j.rows;r++)for(let c=0;c<j.cols;c++) {
   const b=bbox(data,info.width,[c*512,r*512,(c+1)*512,(r+1)*512]).map((v,i)=>v-(i%2===0?c:r)*512);
   if(b[0]<48||b[1]<48||b[2]>464||b[3]>464)throw Error('Cell margin '+j.id);
   if(b[3]!==440)throw Error('Cell base '+j.id);
   check.cells.push(b);
  }
 }
 out.push(check);
}
for(const [id,rows]of Object.entries(NEW_ICONS))if(rows.length!==16||rows.some(r=>r.length!==16||/[^.kpbwsglcGmnyrotuPROYivaqWMK]/.test(r)))throw Error('Bad grid '+id);
const prompts=JSON.parse(await fs.readFile(path.join(import.meta.dirname,'prompts-scenery.json'),'utf8'));
for(const p of prompts.items) {
 if(!p.id||!p.master||!p.prompt||!p.generatedFile||!Array.isArray(p.referenceFiles))throw Error('Missing provenance '+p.id);
 for(const f of [p.master,p.generatedFile,...p.referenceFiles])await fs.access(path.resolve(root,f));
}
console.log(JSON.stringify({masters:out,grids:Object.keys(NEW_ICONS),prompts:prompts.items.length},null,2));
