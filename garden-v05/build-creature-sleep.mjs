import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {quantize,inkBox} from './build-pond-art.mjs';
const sharp=createRequire(import.meta.url)('/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp'),root=path.dirname(fileURLToPath(import.meta.url)),sha=b=>createHash('sha256').update(b).digest('hex');
const window={FARM_MOTION:JSON.parse(await fs.readFile(path.join(root,'motion-data.json'),'utf8'))};
for(const f of ['level-assets.js','motion-care-data.js','motion-idle-data.js','creature-motion-data.js'])vm.runInNewContext(await fs.readFile(path.join(root,f),'utf8'),{window});
const art={},items=[];
for(const item of window.FARM_MOTION.items.filter(a=>a.kind==='creature')){
 const master=`environment/creature-sleep/masters/${item.id}.png`,bytes=await fs.readFile(path.join(root,master)),raw=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true}),box=inkBox(raw.data,raw.info.width,raw.info.height),frameRecords=[];
 art[item.id]=[];
 for(let age=0;age<4;age++){
  const base=item.frames[age],b=base.bounds,{width:W,height:H,pivotX,pivotY}=base;
  // One uniform fit; no affine skew or independent width/height stretching. Native geometry is inherited verbatim.
  const scale=Math.min((Math.min(W-4,b.w*1.15))/box.w,Math.min(pivotY-2,b.h*.86)/box.h),w=Math.max(3,Math.round(box.w*scale)),h=Math.max(3,Math.round(box.h*scale)),left=Math.max(2,Math.min(W-2-w,Math.round(pivotX-w/2))),top=pivotY-h;
  const file=`environment/creature-sleep/${item.id}-${age}.png`,hdFile=`environment/creature-sleep/${item.id}-${age}-hd.webp`;
  const render=async d=>{
   const ink=quantize(await sharp(bytes).extract({left:box.x,top:box.y,width:box.w,height:box.h}).resize(w*d,h*d,{kernel:'nearest'}).ensureAlpha().raw().toBuffer()),out=Buffer.alloc(W*H*d*d*4);
   for(let y=0;y<h*d;y++)ink.copy(out,((top*d+y)*W*d+left*d)*4,y*w*d*4,(y+1)*w*d*4);
   return out;
  };
  const native=await sharp(await render(1),{raw:{width:W,height:H,channels:4}}).png().toBuffer(),hd=await sharp(await render(2),{raw:{width:W*2,height:H*2,channels:4}}).webp({lossless:true,exact:true}).toBuffer();
  await fs.writeFile(path.join(root,file),native);await fs.writeFile(path.join(root,hdFile),hd);
  const bounds=inkBox(await render(1),W,H);art[item.id].push({file,width:W,height:H,pivotX,pivotY,bounds});
  frameRecords.push({file,sha256:sha(native),width:W,height:H,pivotX,pivotY,sourceRect:box,hdFile,hdSha256:sha(hd),age,uniformScale:scale});
 }
 items.push({id:item.id,master,masterSha256:sha(bytes),frameRecords});
}
await fs.writeFile(path.join(root,'creature-sleep-art.mjs'),'// Generated sleeping poses, same native canvas/pivot as each growth age; one authored view mirrored at render.\nexport const CREATURE_SLEEP_ART='+JSON.stringify(art)+';\n');
await fs.writeFile(path.join(root,'creature-sleep-art.json'),JSON.stringify({version:1,camera:'64x32 dimetric, azimuth45 elevation30; fixed existing pivots, uniform master fit; organic contours visually reviewed',generator:'built-in image_gen; build-creature-sleep.mjs',items},null,2)+'\n');
console.log({species:items.length,ages:items.length*4});
