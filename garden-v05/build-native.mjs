// Technical export of approved/corrected masters: nearest sample, fixed grid,
// binary alpha, exact shared palette. No source PNG is overwritten.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const sharp=require(process.env.SHARP_MODULE || '/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=path.dirname(new URL(import.meta.url).pathname);
const source=JSON.parse(await fs.readFile(path.join(root,'source-data.json'),'utf8'));
const ONLY_ID='three-headed-dog';
function parseOnly(argv){
  let only=null;
  for(let i=0;i<argv.length;i++){
    const arg=argv[i];
    if(arg==='--help'){
      console.log('Usage: node build-native.mjs [--only=three-headed-dog]');
      process.exit(0);
    }
    let value;
    if(arg==='--only') value=argv[++i];
    else if(arg.startsWith('--only=')) value=arg.slice('--only='.length);
    else throw new Error(`Unknown argument: ${arg}`);
    if(!value) throw new Error('--only requires an item id: three-headed-dog');
    if(only!==null) throw new Error('--only may be specified once');
    if(value!==ONLY_ID) throw new Error(`Unsupported --only item: ${value}; expected ${ONLY_ID}`);
    only=value;
  }
  return only;
}
const only=parseOnly(process.argv.slice(2));
const sourceItems=only ? source.items.filter(item=>item.id===only) : source.items;
if(only && sourceItems.length!==1) throw new Error(`No source-data item found for --only=${only}`);
if(only && sourceItems[0].frames.length!==16){
  throw new Error(`Scoped ${ONLY_ID} export requires 16 analyzed frames; run analyze-sources.py --only=${ONLY_ID} first.`);
}
const hex=['231F2E','4A3042','735044','A57554','41465C','687486','A6B1AE','D6D8BF','24483F','3F6A45','71934B','B0BD67','8B4A3F','C97952','E7AE73','F5D69A','874056','C75B4B','ED8A45','FFC36B','3E3B70','6961A6','70A8B6','B7DEE0'];
const palette=hex.map(h=>[0,2,4].map(n=>parseInt(h.slice(n,n+2),16)));
const cache=new Map();
function closest(r,g,b){const key=(r<<16)|(g<<8)|b;if(cache.has(key))return cache.get(key);let best=0,d=Infinity;palette.forEach((p,i)=>{const t=(r-p[0])**2*2+(g-p[1])**2*3+(b-p[2])**2;if(t<d){d=t;best=i;}});cache.set(key,best);return best;}
const sizes={puffskein:[64,64,32,48,26,26],bowtruckle:[64,64,32,48,44,46],niffler:[64,64,32,48,40,36],hippogriff:[192,192,96,160,138,124],dragon:[256,256,128,192,180,152],'three-headed-dog':[160,160,80,128,128,112]};
const mkdir=async p=>fs.mkdir(path.join(root,p),{recursive:true});
await mkdir('native');
let data;
let report;
let scopedDogIndex=-1;
let scopedReportIndex=-1;
if(only){
  data=JSON.parse(await fs.readFile(path.join(root,'motion-data.json'),'utf8'));
  report=JSON.parse(await fs.readFile(path.join(root,'native-build-report.json'),'utf8'));
  if(!Array.isArray(data.items)) throw new Error('Scoped export requires motion-data.json items.');
  if(!Array.isArray(report)) throw new Error('Scoped export requires native-build-report.json rows.');
  scopedDogIndex=data.items.findIndex(item=>item.id===only);
  scopedReportIndex=report.findIndex(row=>row.id===only);
  data.items=data.items.filter(item=>item.id!==only);
  report=report.filter(row=>row.id!==only);
}else{
  data={version:3,status:'local prototype, single authored view',palette:hex.map(h=>'#'+h),pixelScale:1,alphaThreshold:192,items:[]};
  report=[];
}
function bounds(buf,w,h){let x0=w,y0=h,x1=-1,y1=-1,count=0;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(buf[(y*w+x)*4+3]){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);count++;}return {x:x0,y:y0,w:x1-x0+1,h:y1-y0+1,count,edge:x0===0||y0===0||x1===w-1||y1===h-1};}
for(const item of sourceItems){
 const raw=await sharp(path.join(root,item.file)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const [cw,ch,px,py,mw,mh]=sizes[item.id]||[64,96,32,80,54,66];
 const adults=item.frames.slice(3);
 const factor=Math.min(mw/Math.max(...adults.map(f=>f.w)),mh/Math.max(...adults.map(f=>f.h)),
  (px-4)/Math.max(...adults.map(f=>f.pivotX)),(cw-px-4)/Math.max(...adults.map(f=>f.w-f.pivotX)),
  (py-4)/Math.max(...adults.map(f=>f.pivotY)));
 const out={id:item.id,label:item.label,kind:item.kind,growth:item.growth,actionLabel:item.actionLabel,
  source:item.file,originalSource:item.originalFile,sourceSha256:item.sourceSha256,
  sourceRows:item.sourceRows||((item.frames.length===16)?4:3),sourceColumns:item.sourceColumns||4,
  footprintTiles:item.id==='dragon'?[3,3]:['hippogriff','three-headed-dog'].includes(item.id)?[2,2]:[1,1],
  direction:item.id==='dragon'?'sw':item.id==='hippogriff'?'se':'single-master-view',
  unlock:item.id==='dragon'||item.id==='three-headed-dog'?{lateProgression:true,level:null}:null,
  frames:[],clips:{},notes:['Bản xuất thử 1×, alpha 0/255, palette 24 màu.','Lớn lên là bốn trạng thái mỹ thuật; không mô phỏng thời gian nuôi thật.']};
 await mkdir('native/'+item.id);
 const buffers=[];
 const frameCount=item.frames.length;
 for(let n=0;n<frameCount;n++){
  const f=item.frames[n];let W=cw,H=ch,PX=px,PY=py,sc=factor;
  // The source's adult growth pose is often drawn larger than the idle row.
  // Match standing height when entering adulthood; action pose heights remain authored.
  if(n===3){const hs=item.frames.slice(4,8).map(x=>x.h).sort((a,b)=>a-b);sc*=((hs[1]+hs[2])/2)/f.h;}
  // Large-creature ages have independent canvases, never mixed-size sheet cells.
  if(n<3 && item.id==='dragon'){[W,H,PX,PY]=n<2?[64,64,32,48]:[128,128,64,100];sc=Math.min(factor,(W-12)/f.w,(PY-8)/f.h);}
  if(n<3 && ['hippogriff','three-headed-dog'].includes(item.id)){[W,H,PX,PY]=n===0?[64,64,32,48]:[128,128,64,100];sc=Math.min(factor,(W-12)/f.w,(PY-8)/f.h);}
  sc=Math.min(sc,(PX-4)/f.pivotX,(W-PX-4)/(f.w-f.pivotX),(PY-4)/f.pivotY);
  const buf=Buffer.alloc(W*H*4);
  const ox=Math.round(PX-f.pivotX*sc),oy=Math.round(PY-f.pivotY*sc);
  const dw=Math.round(f.w*sc),dh=Math.round(f.h*sc);
  let clipped=0;
  for(let y=0;y<dh;y++)for(let x=0;x<dw;x++){
   const sx=f.x+Math.min(f.w-1,Math.floor((x+.5)/sc)),sy=f.y+Math.min(f.h-1,Math.floor((y+.5)/sc));
   const si=(sy*raw.info.width+sx)*4;if(raw.data[si+3]<192)continue;
   const dx=ox+x,dy=oy+y;if(dx<0||dx>=W||dy<0||dy>=H){clipped++;continue;}
   const c=palette[closest(raw.data[si],raw.data[si+1],raw.data[si+2])],di=(dy*W+dx)*4;
   buf[di]=c[0];buf[di+1]=c[1];buf[di+2]=c[2];buf[di+3]=255;
  }
  const file=`native/${item.id}/frame-${String(n+1).padStart(2,'0')}.png`;
  await sharp(buf,{raw:{width:W,height:H,channels:4}}).png().toFile(path.join(root,file));
  const b=bounds(buf,W,H);if(clipped||b.edge||!b.count)throw Error(`${item.id} ${n}: clipped=${clipped} edge=${b.edge}`);
  out.frames.push({file,width:W,height:H,pivotX:PX,pivotY:PY,sourceFrame:n,sourceRect:f,bounds:b});
  buffers.push({buf,W,H});
 }
 out.clips.growth={frames:[0,1,2,3],durations:[900,900,900,900],loop:false};
 out.clips.idle={frames:item.id==='pumpkin'?[4,5,6,5]:[4,5,6,7],durations:[600,240,180,240],loop:true};
 out.clips.action={frames:item.id==='bowtruckle'?[8,9,11,9,8]:[8,9,10,11,10,9],durations:[320,180,240,220,240,180],loop:true};
 if(item.id===ONLY_ID && frameCount===16){
  out.clips.eat={frames:[8,9,10,11],durations:[300,420,340,820],loop:false};
  out.clips.care={frames:[12,13,14,15],durations:[260,620,260,820],loop:false};
 }
 if(item.id==='bowtruckle'){out.clips.action.durations=[320,220,260,220,180];out.notes.push('Frame nguồn 11 đổi bên tay: giữ trong nguồn, loại khỏi clip vẫy.');}
 // Export one sheet per action. Growth for large creatures remains separate age files.
 const sheetStarts=item.id===ONLY_ID && frameCount===16
  ?{growth:0,idle:4,action:8,eat:8,care:12}
  :{growth:0,idle:4,action:8};
 for(const [clip,start] of Object.entries(sheetStarts)){
  const frames=buffers.slice(start,start+4);
  if(frames.some(b=>b.W!==frames[0].W||b.H!==frames[0].H))continue;
  const {W,H}=frames[0];const sheet=Buffer.alloc(W*4*H*4);
  frames.forEach((b,i)=>{for(let y=0;y<H;y++)b.buf.copy(sheet,(y*W*4+i*W)*4,y*W*4,(y+1)*W*4);});
  const file=`native/${item.id}/${clip}.png`;
  await sharp(sheet,{raw:{width:W*4,height:H,channels:4}}).png().toFile(path.join(root,file));
  out.clips[clip].sheet={file,frameWidth:W,frameHeight:H,columns:4,rows:1,sourceFrames:[start,start+1,start+2,start+3]};
 }
 const row={id:item.id,frames:frameCount,partialAlpha:0,outsidePalette:0,clipped:0,edgeContact:0};
 if(only){
  const itemIndex=scopedDogIndex>=0?Math.min(scopedDogIndex,data.items.length):data.items.length;
  const reportIndex=scopedReportIndex>=0?Math.min(scopedReportIndex,report.length):report.length;
  data.items.splice(itemIndex,0,out);
  report.splice(reportIndex,0,row);
 }else{
  data.items.push(out);report.push(row);
 }
}
// Environment is an existing concept background, sampled onto a 768x512 grid.
// Its baked camera/layout is kept; this does not certify it as a 64x32 tilemap.
if(!only){
 const env=await sharp(path.join(root,'environment/garden-background.png')).resize(768,512,{kernel:'nearest'}).ensureAlpha().raw().toBuffer();
 for(let i=0;i<env.length;i+=4){const p=palette[closest(env[i],env[i+1],env[i+2])];env[i]=p[0];env[i+1]=p[1];env[i+2]=p[2];env[i+3]=255;}
 await sharp(env,{raw:{width:768,height:512,channels:4}}).png().toFile(path.join(root,'environment/garden-native.png'));
}
await fs.writeFile(path.join(root,'motion-data.json'),JSON.stringify(data,null,2));
await fs.writeFile(path.join(root,'motion-data.js'),'window.FARM_MOTION='+JSON.stringify(data)+';');
await fs.writeFile(path.join(root,'native-build-report.json'),JSON.stringify(report,null,2));
const frameTotal=data.items.reduce((sum,item)=>sum+(item.frames?.length||0),0);
const clipTotal=data.items.reduce((sum,item)=>sum+Object.keys(item.clips||{}).length,0);
console.log(JSON.stringify({species:data.items.length,frames:frameTotal,clips:clipTotal,palette:palette.length,export:'native/',only:only||null}));
