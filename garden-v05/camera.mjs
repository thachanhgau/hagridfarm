import {wizardTargets} from "./wizard-scenery.mjs?v=24.9.66";
export function setupCamera({viewport,canvas,map,iso,plotCorners,getRenderer,onPick,onTap,getSelectedPlot,notify}) {
 const camera={x:0,y:0,scale:1},pointers=new Map();let gesture=null,previousSize=null,frameFirstPlot=false,frameOverview=false;
 const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
 let fitScale=.05;
 function overviewFrame(){
  const b=getRenderer()?.growthBounds?.()??{left:0,top:0,right:map.width,bottom:map.height};
  const vr=viewport.getBoundingClientRect();
  const visible=selector=>[...document.querySelectorAll(selector)].filter(e=>!e.hidden&&e.getClientRects().length).map(e=>e.getBoundingClientRect());
  const top=Math.max(48,...visible(".hud button").map(r=>r.bottom-vr.top));
  const docks=visible("#playDock, #selectionHint").filter(r=>r.top-vr.top>top);
  const bottom=Math.max(top+60,Math.min(vr.height-8,...docks.map(r=>r.top-vr.top)));
  const left=0,right=vr.width;
  const fullDesktop=vr.width>=900&&visible("#owlMailButton").length>0;
  const bounds=fullDesktop?{left:b.left+20,right:b.right-20,top:b.top+18,bottom:b.bottom-28}:{left:b.left,right:b.right,top:b.top,bottom:b.bottom};
  const rawFit=Math.min(1.5,(right-left)/(bounds.right-bounds.left),(bottom-top)/(bounds.bottom-bounds.top));
  fitScale=fullDesktop?Math.min(1.5,Math.max(rawFit,vr.width/map.width)):rawFit;
  return {bounds,left,right,top,bottom};
 }
 function apply(){
  const w=viewport.clientWidth,h=viewport.clientHeight;
  const {bounds:ob,left,right,top,bottom}=overviewFrame();
  camera.scale=clamp(camera.scale,fitScale,2.4);
  const b=getRenderer()?.growthBounds?.()??{left:0,top:0,right:map.width,bottom:map.height};
  if(frameOverview||camera.scale<=fitScale+1e-4){
   camera.scale=fitScale;
   camera.x=(left+right)/2-(ob.left+ob.right)/2*camera.scale;
   camera.y=(top+bottom)/2-(ob.top+ob.bottom)/2*camera.scale;
  }else{
   const cx=(left+right)/2-(b.left+b.right)/2*camera.scale;
   const cy=(top+bottom)/2-(b.top+b.bottom)/2*camera.scale;
   const minX=Math.min(cx,w-b.right*camera.scale-24),maxX=Math.max(cx,24-b.left*camera.scale);
   const minY=Math.min(cy,bottom-b.bottom*camera.scale-12),maxY=Math.max(cy,top-b.top*camera.scale+12);
   camera.x=clamp(camera.x,minX,maxX);
   camera.y=clamp(camera.y,minY,maxY);
  }
  if(map.width*camera.scale>=w-1)camera.x=clamp(camera.x,w-map.width*camera.scale,0);
  if(map.height*camera.scale>=h-1)camera.y=clamp(camera.y,h-map.height*camera.scale,0);
  canvas.style.transform=`translate(${camera.x}px,${camera.y}px) scale(${camera.scale})`;
  viewport.style.setProperty("--forest-scale",camera.scale);
  viewport.style.setProperty("--forest-x",camera.x+"px");
  viewport.style.setProperty("--forest-y",camera.y+"px");
  const zoomOutBtn=document.getElementById("zoomOut");
  if(zoomOutBtn?.toggleAttribute)zoomOutBtn.toggleAttribute("disabled",camera.scale<=fitScale+1e-4);
  viewport.dataset.camera=JSON.stringify(camera);
 }
 function centerAt(x,y,scale){frameFirstPlot=false;frameOverview=false;camera.scale=clamp(scale,fitScale,2.4);camera.x=viewport.clientWidth*(viewport.clientHeight>viewport.clientWidth?.5:.46)-x*camera.scale;camera.y=viewport.clientHeight*(viewport.clientHeight>viewport.clientWidth?.40:.43)-y*camera.scale;apply();}
 function focusPlot(index=getSelectedPlot()){
  if(frameOverview){overview();return;}
  frameOverview=false;
  const p=map.plots[index];if(!p)return;
  const maxScale=viewport.clientWidth<430?1.15:viewport.clientHeight<450?1.2:1.5;
  const hut=map.objects.find(o=>o.id==="hut"),asset=map.props.find(o=>o.id==="hut");
  if(index!==0||!hut||!asset){centerAt(...iso(p.col+1,p.row+1),maxScale);return;}
  const [hx,hy]=iso(hut.col,hut.row),points=plotCorners(p,map);
  for(const target of wizardTargets(iso)){const b=target.bounds;points.push([b.left,b.top],[b.right,b.bottom]);}
  const left=Math.min(hx-asset.pivotX,...points.map(q=>q[0]));
  const right=Math.max(hx-asset.pivotX+asset.width,...points.map(q=>q[0]));
  const top=Math.min(hy-asset.pivotY,...points.map(q=>q[1]));
  const bottom=Math.max(hy-asset.pivotY+asset.height,...points.map(q=>q[1]+24));
  const {safeTop,safeBottom,safeLeft,safeRight}=safeArea({toolsInLandscape:false});
  camera.scale=Math.min(maxScale,(safeRight-safeLeft)/(right-left),(safeBottom-safeTop)/(bottom-top));
  camera.x=(safeLeft+safeRight)/2-(left+right)/2*camera.scale;
  camera.y=(safeTop+safeBottom)/2-(top+bottom)/2*camera.scale;
  frameFirstPlot=true;apply();
 }
 // The part of the viewport not covered by the HUD, the dock/hint and the camera tool column.
 function safeArea({toolsInLandscape=true}={}){
  const vr=viewport.getBoundingClientRect(),portrait=vr.height>vr.width;
  const visibleRect=selector=>{const e=document.querySelector(selector);return e&&!e.hidden&&e.getClientRects().length?e.getBoundingClientRect():null;};
  const hudBottom=Math.max(0,...[...document.querySelectorAll(".hud button")].map(e=>e.getBoundingClientRect().bottom-vr.top));
  const safeTop=Math.max(hudBottom+12,portrait?145:112);
  const dock=visibleRect("#playDock"),hint=visibleRect("#selectionHint");
  const safeBottom=Math.min(vr.height-12,...[dock,hint].filter(r=>r&&r.top>vr.top+safeTop).map(r=>r.top-vr.top-12));
  const side=portrait||toolsInLandscape?visibleRect(".camera-tools"):null;
  const safeLeft=12,safeRight=side?Math.min(vr.width-12,side.left-vr.left-12):vr.width-12;
  return {safeTop,safeBottom:Math.max(safeTop+40,safeBottom),safeLeft,safeRight:Math.max(safeLeft+40,safeRight)};
 }
 /** Fit a world-space box inside the uncovered part of the screen (tutorial framing). */
 function frameWorld({left,right,top,bottom},maxScale=1.5){
  const {safeTop,safeBottom,safeLeft,safeRight}=safeArea();
  camera.scale=clamp(Math.min(maxScale,(safeRight-safeLeft)/(right-left),(safeBottom-safeTop)/(bottom-top)),fitScale,2.4);
  camera.x=(safeLeft+safeRight)/2-(left+right)/2*camera.scale;
  camera.y=(safeTop+safeBottom)/2-(top+bottom)/2*camera.scale;
  frameFirstPlot=false;frameOverview=false;apply();
 }
 function focusCreature(index){if(frameOverview){overview();return;}const p=map.creatureSpots[index];if(p){const [x,y]=iso(...p);centerAt(x,y-45,viewport.clientHeight<450?1.1:1.35);}}
 function overview(){
  const {bounds:b,left,right,top,bottom}=overviewFrame();
  camera.scale=fitScale;
  camera.x=(left+right)/2-(b.left+b.right)/2*camera.scale;
  camera.y=(top+bottom)/2-(b.top+b.bottom)/2*camera.scale;
  frameFirstPlot=false;frameOverview=true;apply();
 }
 function zoom(factor,x=viewport.clientWidth*.46,y=viewport.clientHeight*.43){overviewFrame();if(camera.scale*factor<=fitScale){overview();return;}frameFirstPlot=false;frameOverview=false;const scale=clamp(camera.scale*factor,fitScale,2.4),r=scale/camera.scale;camera.x=x-(x-camera.x)*r;camera.y=y-(y-camera.y)*r;camera.scale=scale;apply();}
 function local(e){const r=viewport.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};}
 function start(){const ps=[...pointers.values()];if(ps.length>=2){const[a,b]=ps;gesture={kind:"pinch",distance:Math.hypot(a.x-b.x,a.y-b.y),mid:{x:(a.x+b.x)/2,y:(a.y+b.y)/2},...camera,moved:true};}else if(ps.length)gesture={kind:"pan",start:{...ps[0]},...camera,moved:false};else gesture=null;}
 viewport.onpointerdown=e=>{if(e.button!==0)return;frameFirstPlot=false;if(camera.scale>fitScale+1e-4)frameOverview=false;viewport.setPointerCapture(e.pointerId);pointers.set(e.pointerId,local(e));start();viewport.classList.add("dragging");};
 viewport.onpointermove=e=>{if(!pointers.has(e.pointerId)||!gesture)return;const p=local(e);pointers.set(e.pointerId,p);const ps=[...pointers.values()];if(ps.length>=2&&gesture.kind==="pinch"){frameOverview=false;const[a,b]=ps,mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2},scale=clamp(gesture.scale*Math.hypot(a.x-b.x,a.y-b.y)/Math.max(1,gesture.distance),fitScale,2.4),r=scale/gesture.scale;camera.scale=scale;camera.x=mid.x-(gesture.mid.x-gesture.x)*r;camera.y=mid.y-(gesture.mid.y-gesture.y)*r;if(camera.scale<=fitScale+1e-4)frameOverview=true;}else if(gesture.kind==="pan"){const dx=p.x-gesture.start.x,dy=p.y-gesture.start.y;gesture.moved ||=Math.hypot(dx,dy)>6;if(camera.scale>fitScale+1e-4){camera.x=gesture.x+dx;camera.y=gesture.y+dy;}}apply();};
 function end(e){if(!pointers.has(e.pointerId))return;const tap=e.type==="pointerup"&&gesture?.kind==="pan"&&!gesture.moved&&pointers.size===1;if(tap&&!onTap?.(e.clientX,e.clientY)){const hit=getRenderer()?.pick(e.clientX,e.clientY);if(hit)onPick(hit);}pointers.delete(e.pointerId);const wasPinch=gesture?.kind==="pinch";start();if(wasPinch&&gesture)gesture.moved=true;if(!pointers.size)viewport.classList.remove("dragging");}
 viewport.onpointerup=end;viewport.onpointercancel=end;viewport.onlostpointercapture=e=>{if(!pointers.delete(e.pointerId))return;start();if(gesture)gesture.moved=true;else viewport.classList.remove("dragging");};
 viewport.addEventListener("wheel",e=>{e.preventDefault();const p=local(e);zoom(e.deltaY<0?1.1:1/1.1,p.x,p.y);},{passive:false});
 viewport.onkeydown=e=>{const moves={ArrowLeft:[35,0],ArrowRight:[-35,0],ArrowUp:[0,35],ArrowDown:[0,-35]};if(moves[e.key]){e.preventDefault();if(camera.scale>fitScale+1e-4){frameFirstPlot=false;frameOverview=false;camera.x+=moves[e.key][0];camera.y+=moves[e.key][1];apply();}}if(["+","=","-"].includes(e.key)){e.preventDefault();zoom(e.key==="-"?.8:1.25);}};
 document.getElementById("zoomOut").onclick=()=>zoom(.8);document.getElementById("zoomIn").onclick=()=>zoom(1.25);document.getElementById("homeCamera").onclick=overview;
 async function fullscreen(){try{if(document.fullscreenElement){await document.exitFullscreen();return;}const shell=document.getElementById("gameShell");if(!shell.requestFullscreen)throw Error("unavailable");await shell.requestFullscreen();}catch{const msg="Trình duyệt này chưa hỗ trợ toàn màn hình. Bệ hạ vẫn có thể chơi dọc hoặc ngang.";notify(msg);document.getElementById("rotateNote").textContent=msg;}}
 document.getElementById("fullscreenButton").onclick=fullscreen;document.getElementById("rotateFullscreen").onclick=fullscreen;
 document.addEventListener("fullscreenchange",()=>{document.getElementById("fullscreenButton").setAttribute("aria-label",document.fullscreenElement?"Thoát toàn màn hình":"Bật toàn màn hình");apply();});
 new ResizeObserver(()=>{const next=[viewport.clientWidth,viewport.clientHeight];if(previousSize){if(frameOverview)overview();else if(frameFirstPlot)focusPlot(0);else{overviewFrame();camera.x+=(next[0]-previousSize[0])*.46;camera.y+=(next[1]-previousSize[1])*.43;apply();}}previousSize=next;}).observe(viewport);
 const dock=document.getElementById("playDock");if(dock)new ResizeObserver(()=>{if(frameOverview)overview();}).observe(dock);
 // Run a framing move (focusPlot, overview…) as an eased glide instead of a jump.
 // Reduced motion, or any user drag meanwhile, just lands on the final frame.
 function glide(move,ms=1500){
  const from={x:camera.x,y:camera.y,scale:camera.scale};move();const to={x:camera.x,y:camera.y,scale:camera.scale};
  if(ms<=0||document.body.classList.contains("motion-paused")||matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  const t0=performance.now();
  const step=t=>{if(pointers.size)return;const k=Math.min(1,(t-t0)/ms),e=k<.5?2*k*k:1-(-2*k+2)**2/2;camera.x=from.x+(to.x-from.x)*e;camera.y=from.y+(to.y-from.y)*e;camera.scale=from.scale+(to.scale-from.scale)*e;apply();if(k<1)requestAnimationFrame(step);};
  camera.x=from.x;camera.y=from.y;camera.scale=from.scale;apply();requestAnimationFrame(step);
 }
 return {focusPlot,focusCreature,overview,centerAt,zoom,fullscreen,glide,frameWorld,scale:()=>camera.scale};
}
