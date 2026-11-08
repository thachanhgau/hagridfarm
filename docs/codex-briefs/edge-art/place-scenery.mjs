// Place generated artwork only. No painting, palette reduction, or native export.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
const sharp = createRequire(import.meta.url)('/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root = path.resolve(import.meta.dirname, '../../..');
const records = JSON.parse(await fs.readFile(path.join(import.meta.dirname, 'scenery-placement.json'), 'utf8'));
function bounds(data, info, rect = [0, 0, info.width, info.height]) {
 let x0=info.width,y0=info.height,x1=-1,y1=-1;
 for(let y=rect[1];y<rect[1]+rect[3];y++) for(let x=rect[0];x<rect[0]+rect[2];x++) {
  if(data[(y*info.width+x)*4+3]<128) continue;
  x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);
 }
 if(x1<0) throw Error('Empty art');
 return {left:x0,top:y0,width:x1-x0+1,height:y1-y0+1};
}
for(const job of records.filter(j=>process.argv.length<3 || process.argv.slice(2).includes(j.id))) {
 const dest=path.join(root,job.master);
 try {await fs.access(dest);throw Error('Refusing existing master '+dest);} catch(e) {if(e.code!=='ENOENT') throw e;}
 const source=sharp(job.generatedFile).ensureAlpha();
 const {data,info}=await source.clone().raw().toBuffer({resolveWithObject:true});
 let output;
 if(job.kind==='items') {
  const pieces=[];
  for(let r=0;r<job.rows;r++) for(let c=0;c<job.cols;c++) {
   const rect=[Math.round(c*info.width/job.cols),Math.round(r*info.height/job.rows),Math.round((c+1)*info.width/job.cols)-Math.round(c*info.width/job.cols),Math.round((r+1)*info.height/job.rows)-Math.round(r*info.height/job.rows)];
   const b=bounds(data,info,rect);const s=Math.min(400/b.width,376/b.height);
   const w=Math.round(b.width*s),h=Math.round(b.height*s);
   pieces.push({input:await source.clone().extract(b).resize(w,h,{kernel:'nearest'}).png().toBuffer(),left:c*512+Math.floor((512-w)/2),top:r*512+440-h});
  }
  output=sharp({create:{width:job.cols*512,height:job.rows*512,channels:4,background:'#00000000'}}).composite(pieces);
 } else if(job.kind==='tree') {
  const b=bounds(data,info);const s=Math.min(880/b.width,job.height/b.height);
  const w=Math.round(b.width*s),h=Math.round(b.height*s);
  output=sharp({create:{width:1024,height:1152,channels:4,background:'#00000000'}}).composite([{input:await source.clone().extract(b).resize(w,h,{kernel:'nearest'}).png().toBuffer(),left:512-Math.floor(w/2),top:880-h+1}]);
 } else if(job.groundBox) {
  const b=bounds(data,info),[left,top,width,height]=job.groundBox;
  output=sharp({create:{width:job.size[0],height:job.size[1],channels:4,background:'#00000000'}}).composite([{input:await source.clone().extract(b).resize(width,height,{kernel:'nearest',fit:'fill'}).png().toBuffer(),left,top}]);
 } else {
  output=source.resize(job.size[0],job.size[1],{kernel:'nearest',fit:'fill'});
 }
 await fs.mkdir(path.dirname(dest),{recursive:true});await output.png().toFile(dest);
 console.log(job.id, dest);
}
