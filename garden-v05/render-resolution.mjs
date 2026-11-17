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
// HD_ART key of a source: no query or './', and a runtime WebP path back to the PNG it was built from.
export function artKey(file){return String(file).replace(/[?#].*$/,'').replace(/^\.\//,'').replace(/^runtime-webp\/(.+)\.webp$/,'$1.png');}
export function tagArt(image,file,effects={}){if(image)image[ART_SOURCE]={file:artKey(file),...effects};return image;}
/** `srcset` for an HTML <img> (shop, dock, bag): the HD file as its density candidate, '' when none. CSS size is unchanged. */
export function hdSrcset(file,art,imageUrl){const record=art[artKey(file)];return record?`${imageUrl(file)} 1x, ${imageUrl(record.file)} ${record.density}x`:'';}
export function createResolution(canvas,world,{art={},enabled=true,pixelRatio,effects={},imageUrl,onReady=()=>{}}={}){
 const view=canvas.ownerDocument?.defaultView||globalThis,mobile=(view.innerWidth||1280)<=820;
 const context=canvas.getContext('2d');
 let density=enabled&&context.setTransform?surfaceDensity(world.width,world.height,pixelRatio??view.devicePixelRatio??1,mobile):1;
 canvas.width=Math.round(world.width*density);canvas.height=Math.round(world.height*density);
 if(canvas.style&&!canvas.style.width)canvas.style.width=world.width+'px';
 if(canvas.dataset){canvas.dataset.logicalWidth=world.width;canvas.dataset.logicalHeight=world.height;canvas.dataset.pixelDensity=density;}
 const original=context.drawImage.bind(context),cache=new Map(),pending=new Set(),failed=new Map(),budget=(mobile?24:48)*1024*1024;let bytes=0,peakBytes=0,requests=0,active=0,hits=0;
 const queue=[],budgetFallbacks=new Set();let viewKey='';
 function pump(){while(active<2&&queue.length){const job=queue.shift();active++;job().finally(()=>{active--;pump();});}}
 function request(key,source,record){
  if(budgetFallbacks.has(key)||queue.length>=64||pending.has(key)||(failed.has(key)&&Date.now()-failed.get(key)<5000)||record.width*record.height*record.density**2*4>budget)return;
  pending.add(key);queue.push(async()=>{
   try{
    const image=new view.Image();image.crossOrigin='anonymous';await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src=imageUrl(record.file);});requests++;if(image.width!==record.width*record.density||image.height!==record.height*record.density)throw Error('HD dimensions mismatch');
    let output=image;
    if(source.wither||source.coat||source.season||source.tint){
     // Effects read pixels back: a CPU canvas for them (a GPU one read back every HD image, ~0.4 s of snow on entry,
     // 16/11/2026), then one copy onto a GPU canvas, since a CPU canvas drawn every frame re-uploads every frame.
     const make=()=>{const c=canvas.ownerDocument.createElement('canvas');c.width=image.width;c.height=image.height;return c;};
     const copy=make();copy.getContext('2d',{willReadFrequently:true}).drawImage(image,0,0);output=copy;
     if(source.wither)output=effects.wither(output,source.wither);
     if(source.coat)output=effects.coat(output,source.coat);
     if(source.season)effects.weather(output,source.season,record.density);
     if(source.tint){const brush=output.getContext('2d');brush.globalCompositeOperation='source-atop';brush.fillStyle=source.tint;brush.fillRect(0,0,output.width,output.height);brush.globalCompositeOperation='source-over';}
     const shown=make();shown.width=output.width;shown.height=output.height;shown.getContext('2d').drawImage(output,0,0);output.width=output.height=0;output=shown;
    }
    const weight=output.width*output.height*4;
    trim(weight);
    if(weight<=budget){cache.set(key,{image:output,weight});bytes+=weight;peakBytes=Math.max(peakBytes,bytes);onReady();landed(key);}
   }catch{failed.set(key,Date.now());}finally{pending.delete(key);settled(key);}
  });pump();
 }
 // Swap a tagged draw for its HD image when cached, else ask for it. `visible` (main canvas only) skips off-screen draws.
 function draw(own,image,args,visible){
  const source=image?.[ART_SOURCE],record=source&&art[source.file];
  if(enabled&&density>1&&record&&(!visible||visible(args,record))){
   const key=JSON.stringify(source),entry=cache.get(key);
   if(entry){cache.delete(key);cache.set(key,entry);hits++;return own(entry.image,...drawArguments(args,record,record.density));}
   request(key,source,record);
   if(!visible&&pending.has(key))layerWaiting.add(key);
  }
  return own(image,...args);
 }
 const onScreen=(args,record)=>visibleDraw(context,canvas,args,{width:record.width,height:record.height},{width:view.innerWidth||1280,height:view.innerHeight||800});
 context.drawImage=function(image,...args){return draw(original,image,args,onScreen);};
 // Once evicted, use native art for this view instead of ping-pong fetching an over-budget working set.
 // A pan, zoom, quality or weather/stage change reopens admission; the memory limit is unchanged.
 function trim(weight){while(cache.size&&bytes+weight>budget){const oldest=cache.keys().next().value;bytes-=cache.get(oldest).weight;cache.delete(oldest);budgetFallbacks.add(oldest);}}
 // The pre-composited ground: a whole-world layer at the surface density. It is the size of the surface itself, which
 // surfaceDensity caps at 16 MP, so it has its own allowance next to the HD image budget (owner left the call to us
 // 15/11/2026: 44 MB extra at 2560×1440 on desktop, 18 MB on phones). adopt() gives a layer's context the same HD swap
 // with no visibility test; once every HD image it asked for has settled and one landed, onSharper() rebuilds it.
 const layerWaiting=new Set();let layerLanded=false,onSharper=()=>{};
 function landed(key){if(layerWaiting.has(key))layerLanded=true;}
 function settled(key){if(layerWaiting.delete(key)&&!layerWaiting.size&&layerLanded){layerLanded=false;onSharper();}}
 const layer=()=>density;
 function adopt(layerContext,sharper=()=>{}){
  layerWaiting.clear();layerLanded=false;onSharper=sharper;
  const own=layerContext.drawImage.bind(layerContext);
  layerContext.drawImage=function(image,...args){return draw(own,image,args,null);};
 }
 // A side canvas drawn onto the main one (night statue copies): the same HD swap, always drawn and never tied to the
 // ground layer's rebuild. The returned check is true while an HD image it drew is still on its way (owner 17/11/2026:
 // the V26.16 statue copy drew native art, so lit statues lost their HD at dusk and night).
 function side(sideContext){
  const own=sideContext.drawImage.bind(sideContext),waiting=new Set(),always=()=>true;
  sideContext.drawImage=function(image,...args){const source=image?.[ART_SOURCE];if(enabled&&density>1&&source&&art[source.file])waiting.add(JSON.stringify(source));return draw(own,image,args,always);};
  return ()=>{for(const key of waiting)if(cache.has(key)||!pending.has(key))waiting.delete(key);return waiting.size>0;};
 }
 function begin(scope=''){const rect=canvas.getBoundingClientRect?.(),key=[Math.round((rect?.left||0)/64),Math.round((rect?.top||0)/64),rect?.width,density,scope].join(':');if(key!==viewKey){budgetFallbacks.clear();viewKey=key;}context.setTransform?.(density,0,0,density,0,0);context.imageSmoothingEnabled=false;}
 begin();
 function setEnabled(value){enabled=value;density=enabled&&context.setTransform?surfaceDensity(world.width,world.height,pixelRatio??view.devicePixelRatio??1,mobile):1;canvas.width=Math.round(world.width*density);canvas.height=Math.round(world.height*density);if(canvas.dataset)canvas.dataset.pixelDensity=density;begin();}
 return {context,begin,setEnabled,layer,adopt,side,layerPending:()=>layerWaiting.size,stats:()=>({density,logical:[world.width,world.height],backing:[canvas.width,canvas.height],budget,bytes,peakBytes,requests,hits,pending:pending.size,active,queued:queue.length,failed:failed.size,budgetFallbacks:budgetFallbacks.size})};
}

/** Pointer coordinates always resolve into the logical world, independently of backing density. */
export function clientToWorld(clientX,clientY,rect,canvasWidth,canvasHeight){
 const width=Number(rect?.width)||Number(canvasWidth)||1,height=Number(rect?.height)||Number(canvasHeight)||1;
 return {x:(clientX-(Number(rect?.left)||0))*(Number(canvasWidth)||width)/width,y:(clientY-(Number(rect?.top)||0))*(Number(canvasHeight)||height)/height};
}
