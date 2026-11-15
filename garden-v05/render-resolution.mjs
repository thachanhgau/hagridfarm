// Higher-density pixels never change world geometry or hit-test coordinates.
export const ART_SOURCE=Symbol('garden art source');
export function surfaceDensity(width,height,dpr=1,mobile=false){
 const wanted=Math.min(mobile?1.5:2,Math.max(1,Number(dpr)||1));
 return Math.floor(Math.min(wanted,Math.sqrt(16_000_000/(width*height)),8192/Math.max(width,height))*4096)/4096;
}
export function drawArguments(args,native,density){
 if(args.length===2)return [...args,native.width,native.height];
 if(args.length===8)return args.map((v,i)=>i<4?v*density:v);
 return args;
}
function destination(args,native){return args.length===8?args.slice(4):args.length===4?args:[...args,native.width,native.height];}
export function visibleDraw(ctx,canvas,args,native,viewport){
 if(!canvas.getBoundingClientRect||!ctx.getTransform)return false;
 const r=canvas.getBoundingClientRect(),t=ctx.getTransform(),[x,y,w,h]=destination(args,native);
 const points=[[x,y],[x+w,y],[x,y+h],[x+w,y+h]].map(([a,b])=>[r.left+(t.a*a+t.c*b+t.e)*r.width/canvas.width,r.top+(t.b*a+t.d*b+t.f)*r.height/canvas.height]);
 return Math.max(...points.map(p=>p[0]))>=0&&Math.min(...points.map(p=>p[0]))<=viewport.width&&Math.max(...points.map(p=>p[1]))>=0&&Math.min(...points.map(p=>p[1]))<=viewport.height;
}
export function tagArt(image,file,effects={}){if(image)image[ART_SOURCE]={file:String(file).replace(/[?#].*$/,'').replace(/^\.\//,''),...effects};return image;}
export function createResolution(canvas,world,{art={},enabled=true,pixelRatio,effects={},imageUrl,onReady=()=>{}}={}){
 const view=canvas.ownerDocument?.defaultView||globalThis,mobile=(view.innerWidth||1280)<=820;
 const context=canvas.getContext('2d');
 let density=enabled&&context.setTransform?surfaceDensity(world.width,world.height,pixelRatio??view.devicePixelRatio??1,mobile):1;
 canvas.width=Math.round(world.width*density);canvas.height=Math.round(world.height*density);
 if(canvas.style&&!canvas.style.width)canvas.style.width=world.width+'px';
 if(canvas.dataset){canvas.dataset.logicalWidth=world.width;canvas.dataset.logicalHeight=world.height;canvas.dataset.pixelDensity=density;}
 const original=context.drawImage.bind(context),cache=new Map(),pending=new Set(),failed=new Map(),budget=(mobile?24:48)*1024*1024;let bytes=0,peakBytes=0,requests=0,active=0,hits=0;
 const queue=[];
 function pump(){while(active<2&&queue.length){const job=queue.shift();active++;job().finally(()=>{active--;pump();});}}
 function request(key,source,record){
  if(queue.length>=64||pending.has(key)||(failed.has(key)&&Date.now()-failed.get(key)<5000)||record.width*record.height*record.density**2*4>budget)return;
  pending.add(key);queue.push(async()=>{
   try{
    const image=new view.Image();image.crossOrigin='anonymous';await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src=imageUrl(record.file);});requests++;if(image.width!==record.width*record.density||image.height!==record.height*record.density)throw Error('HD dimensions mismatch');
    let output=image;
    if(source.wither||source.coat||source.season){
     const copy=canvas.ownerDocument.createElement('canvas');copy.width=image.width;copy.height=image.height;copy.getContext('2d').drawImage(image,0,0);output=copy;
     if(source.wither)output=effects.wither(output,source.wither);
     if(source.coat)output=effects.coat(output,source.coat);
     if(source.season)effects.weather(output,source.season,record.density);
    }
    const weight=output.width*output.height*4;
    while(cache.size&&bytes+weight>budget){const oldest=cache.keys().next().value;bytes-=cache.get(oldest).weight;cache.delete(oldest);}
    if(weight<=budget){cache.set(key,{image:output,weight});bytes+=weight;peakBytes=Math.max(peakBytes,bytes);onReady();}
   }catch{failed.set(key,Date.now());}finally{pending.delete(key);}
  });pump();
 }
 context.drawImage=function(image,...args){
  const source=image?.[ART_SOURCE],record=source&&art[source.file];
  if(enabled&&density>1&&record&&visibleDraw(context,canvas,args,{width:record.width,height:record.height},{width:view.innerWidth||1280,height:view.innerHeight||800})){
   const key=JSON.stringify(source),entry=cache.get(key);
   if(entry){cache.delete(key);cache.set(key,entry);hits++;return original(entry.image,...drawArguments(args,record,record.density));}
   request(key,source,record);
  }
  return original(image,...args);
 };
 function begin(){context.setTransform?.(density,0,0,density,0,0);context.imageSmoothingEnabled=false;}
 begin();
 function setEnabled(value){enabled=value;density=enabled&&context.setTransform?surfaceDensity(world.width,world.height,pixelRatio??view.devicePixelRatio??1,mobile):1;canvas.width=Math.round(world.width*density);canvas.height=Math.round(world.height*density);if(canvas.dataset)canvas.dataset.pixelDensity=density;begin();}
 return {context,begin,setEnabled,stats:()=>({density,logical:[world.width,world.height],backing:[canvas.width,canvas.height],budget,bytes,peakBytes,requests,hits,pending:pending.size,active,queued:queue.length,failed:failed.size})};
}

/** Pointer coordinates always resolve into the logical world, independently of backing density. */
export function clientToWorld(clientX,clientY,rect,canvasWidth,canvasHeight){
 const width=Number(rect?.width)||Number(canvasWidth)||1,height=Number(rect?.height)||Number(canvasHeight)||1;
 return {x:(clientX-(Number(rect?.left)||0))*(Number(canvasWidth)||width)/width,y:(clientY-(Number(rect?.top)||0))*(Number(canvasHeight)||height)/height};
}
