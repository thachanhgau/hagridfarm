// Technical packing only. Every extracted atlas rectangle must retain the
// decoded pixels and pivot of its authored native input.
import fs from 'node:fs/promises';import path from 'node:path';import crypto from 'node:crypto';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),sharp=require(process.env.SHARP_MODULE||'/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
export async function packNativeAtlas(root,file,frames,columns=4){
 const width=Math.max(...frames.map(f=>f.width)),height=Math.max(...frames.map(f=>f.height)),rows=Math.ceil(frames.length/columns);
 const layers=frames.map((frame,index)=>({input:path.join(root,frame.file),left:(index%columns)*width,top:Math.floor(index/columns)*height}));
 const png=await sharp({create:{width:width*columns,height:height*rows,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(layers).png().toBuffer();
 await fs.mkdir(path.dirname(path.join(root,file)),{recursive:true});await fs.writeFile(path.join(root,file),png);
 const runtime=[];
 for(const [index,frame]of frames.entries()){
  const atlasRect={x:(index%columns)*width,y:Math.floor(index/columns)*height,w:frame.width,h:frame.height};
  const before=await sharp(path.join(root,frame.file)).ensureAlpha().raw().toBuffer(),after=await sharp(png).extract({left:atlasRect.x,top:atlasRect.y,width:atlasRect.w,height:atlasRect.h}).ensureAlpha().raw().toBuffer();
  if(!before.equals(after))throw Error(file+': atlas alters '+frame.file);
  runtime.push({file,width:frame.width,height:frame.height,pivotX:frame.pivotX,pivotY:frame.pivotY,bounds:frame.bounds,atlasRect});
 }
 return {file,sha256:crypto.createHash('sha256').update(png).digest('hex'),width:width*columns,height:height*rows,frames:runtime};
}
