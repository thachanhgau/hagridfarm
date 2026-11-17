import {PLOT_SCENERY_ART} from './plot-scenery-art.mjs?v=26.16';
import {stageContains} from './garden-growth.mjs?v=26.16';
import {densityOf,deviceLine,snapRects} from './device-pixels.mjs?v=26.16';
function insidePolygon(x,y,points){
 let inside=false;
 for(let i=0,j=points.length-1;i<points.length;j=i++){
  const [ax,ay]=points[i],[bx,by]=points[j];
  if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax)inside=!inside;
 }
 return inside;
}
function edgeDistance(x,y,a,b){
 const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));
 return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy);
}
// Masks follow native roof planes, not a horizontal cut across walls and glass.
export function roofSnowCoverage(kind,x,y,width,height){
 if(kind==='greenhouse-roof'){
  x=x*156/width;y=y*152/height;
  if(!insidePolygon(x,y,[[43,40],[116,5],[144,52],[69,89]]))return false;
  return edgeDistance(x,y,[43,40],[116,5])<3||edgeDistance(x,y,[69,89],[144,52])<2.5;
 }
 x=x*164/width;y=y*184/height;
 if(x>=8&&x<=39&&y<61)return y>=12&&y<=16;
 return insidePolygon(x,y,[[81,2],[162,72],[162,83],[94,111],[50,80],[16,100],[2,85],[2,74]]);
}
const SNOW_LIP=[166,177,174],SNOW_RIM=[232,240,237],SNOW_SHADES=[[135,168,180],[177,202,211],[216,231,234],[242,246,235]];
// All variants derive from immutable native pixels, once per weather change.
export function seasonPixel(r,g,b,x,y,width,height,kind,weather,covered=null){
 const green=g>r*.97&&g>b*1.08,lum=(r+g+b)/3;
 const patch=((Math.floor(x/5)*13+Math.floor(y/3)*7)%17)/17;
 if(weather==='snow'){
  if(kind==='roof'||kind==='greenhouse-roof'){
   const covered=roofSnowCoverage(kind,x,y,width,height);
   if(covered&&lum>53&&(kind==='greenhouse-roof'||b>r*.88&&Math.abs(r-g)<40)){
    // Preserve shingle joints, highlights and roof volume beneath the snow.
    return [Math.min(241,Math.round(lum*.8+102)),Math.min(247,Math.round(lum*.8+117)),Math.min(246,Math.round(lum*.75+126))];
   }
   return [r,g,b];
  }
  if(kind==='water'&&b>r*1.1&&lum>30)return [175+Math.min(50,Math.round(lum/4)),211,224];
  // 25.0 S3: thin winter snow lies in patches (covered, from garden-winter.mjs) with a shaded lip and lit rim.
  if(green&&kind==='ground'&&covered){
   if(!covered(x,y))return [Math.round(r*.7),Math.round(g*.78),Math.round(b*.95+12)];
   if(!covered(x,y+2))return [...SNOW_LIP];
   if(!covered(x,y-2))return [...SNOW_RIM];
  }
  if(green&&(kind==='ground'||kind==='tree'&&lum>35&&patch>.15)){
   const shade=Math.min(3,Math.floor(lum/45));
   return [...SNOW_SHADES[shade]];
  }
  if(green)return [Math.round(r*.7),Math.round(g*.78),Math.round(b*.95+12)];
 }
 if(weather==='autumn'&&green){
  if(kind==='tree')return [[105,68,39],[164,87,39],[195,123,48],[225,168,69]][Math.min(3,Math.floor(lum/42)+Number(patch>.75))];
  if(kind==='ground')return [Math.round(r*.8+34),Math.round(g*.82+7),Math.round(b*.82)];
 }
 if(weather==='rain')return [Math.round(r*.71),Math.round(g*.78),Math.round(b*.85+5)];
 return [r,g,b];
}
// Snow patches per logical pixel, built once per size and depth: the ground cache is rebuilt as HD and winter art
// arrive, and asking the noise for every device pixel (up to 3 lookups each) froze the garden for seconds on entry.
const snowMasks=new WeakMap();
export function snowMask(kit,w,h,depth){
 const masks=snowMasks.get(kit)??new Map(),key=`${w}x${h}:${depth}`,W=w+2;let m=masks.get(key);
 if(!m){
  m=new Uint8Array(W*(h+6));
  for(let y=-2;y<h+4;y++)for(let x=0;x<W;x++)m[(y+2)*W+x]=kit.snowCovered(x,y,depth)?1:0;
  if(masks.size>=4)masks.clear(); // ponytail: a few masks per session (one per canvas size), not an LRU
  masks.set(key,m);snowMasks.set(kit,masks);
 }
 const covered=(x,y)=>x>=0&&x<W&&y>=-2&&y<h+4?m[(y+2)*W+x]===1:kit.snowCovered(x,y,depth);
 covered.mask={data:m,width:W,height:h+6};return covered;
}
// The ground snow pass on the GPU (owner 16/11/2026 «tuyết đẹp mà nhẹ»): the same pixels as the loop below, which read
// back and walked ~15M device pixels (~1 s on entry). False (no WebGL, too big) means the loop runs instead.
const SNOW_SHADER=`precision highp float;
uniform sampler2D img,mask,tint,green;uniform vec2 size,maskSize;uniform float k;uniform bool useMask;
float cov(float x,float y){return texture2D(mask,vec2((x+.5)/maskSize.x,(y+2.5)/maskSize.y)).r>0.?1.:0.;}
void main(){
 vec4 t=texture2D(img,gl_FragCoord.xy/size);vec3 c=floor(t.rgb*255.+.5);gl_FragColor=t;
 if(t.a==0.||texture2D(green,(c.rg+.5)/256.).r==0.||texture2D(green,(c.bg+.5)/256.).a==0.)return;
 float x=floor(floor(gl_FragCoord.x)/k+1e-4),y=floor((size.y-1.-floor(gl_FragCoord.y))/k+1e-4);vec3 o;
 if(useMask&&cov(x,y)<.5)o=floor(vec3(texture2D(tint,vec2((c.r+.5)/256.,.5)).r,texture2D(tint,vec2((c.g+.5)/256.,.5)).g,texture2D(tint,vec2((c.b+.5)/256.,.5)).b)*255.+.5);
 else if(useMask&&cov(x,y+2.)<.5)o=vec3(166,177,174);else if(useMask&&cov(x,y-2.)<.5)o=vec3(232,240,237);
 else{float s=min(3.,floor((c.r+c.g+c.b)/135.+1e-4));o=s<.5?vec3(135,168,180):s<1.5?vec3(177,202,211):s<2.5?vec3(216,231,234):vec3(242,246,235);}
 gl_FragColor=vec4(o/255.,t.a);}`;
function snowGroundGPU(canvas,k,covered){
 const W=canvas.width,H=canvas.height,gc=typeof OffscreenCanvas==='function'?new OffscreenCanvas(W,H):typeof document!=='undefined'?Object.assign(document.createElement('canvas'),{width:W,height:H}):null;
 const gl=gc?.getContext('webgl',{premultipliedAlpha:false,antialias:false,depth:false,preserveDrawingBuffer:true});
 if(!gl)return false;
 try{
  if(Math.max(W,H)>gl.getParameter(gl.MAX_TEXTURE_SIZE)||W>gl.getParameter(gl.MAX_VIEWPORT_DIMS)[0]||H>gl.getParameter(gl.MAX_VIEWPORT_DIMS)[1])return false;
  const sh=(type,src)=>{const o=gl.createShader(type);gl.shaderSource(o,src);gl.compileShader(o);return o;},prog=gl.createProgram();
  gl.attachShader(prog,sh(gl.VERTEX_SHADER,'attribute vec2 p;void main(){gl_Position=vec4(p,0,1);}'));gl.attachShader(prog,sh(gl.FRAGMENT_SHADER,SNOW_SHADER));gl.linkProgram(prog);
  if(!gl.getProgramParameter(prog,gl.LINK_STATUS))return false;
  gl.useProgram(prog);gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
  const texture=(unit,setup)=>{gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,gl.createTexture());for(const n of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,n,gl.NEAREST);for(const n of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,n,gl.CLAMP_TO_EDGE);setup();};
  gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL,gl.NONE);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);
  texture(0,()=>{gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,canvas);});
  const m=covered?.mask;
  texture(1,()=>{gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.pixelStorei(gl.UNPACK_ALIGNMENT,1);gl.texImage2D(gl.TEXTURE_2D,0,gl.LUMINANCE,m?m.width:1,m?m.height:1,0,gl.LUMINANCE,gl.UNSIGNED_BYTE,m?m.data:new Uint8Array(1));});
  // JS-rounded tables, so the GPU's float32 lands on exactly the loop's pixels.
  const tint=new Uint8Array(256*3),green=new Uint8Array(256*256*2);
  for(let i=0;i<256;i++){tint[i*3]=Math.round(i*.7);tint[i*3+1]=Math.round(i*.78);tint[i*3+2]=Math.round(i*.95+12);}
  for(let g=0;g<256;g++)for(let x=0;x<256;x++){green[(g*256+x)*2]=g>x*.97?255:0;green[(g*256+x)*2+1]=g>x*1.08?255:0;}
  texture(2,()=>gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,256,1,0,gl.RGB,gl.UNSIGNED_BYTE,tint));
  texture(3,()=>gl.texImage2D(gl.TEXTURE_2D,0,gl.LUMINANCE_ALPHA,256,256,0,gl.LUMINANCE_ALPHA,gl.UNSIGNED_BYTE,green));
  const u=n=>gl.getUniformLocation(prog,n);gl.uniform1i(u('tint'),2);gl.uniform1i(u('green'),3);
  gl.uniform1i(u('img'),0);gl.uniform1i(u('mask'),1);gl.uniform2f(u('size'),W,H);gl.uniform2f(u('maskSize'),m?m.width:1,m?m.height:1);gl.uniform1f(u('k'),k);gl.uniform1i(u('useMask'),m?1:0);
  gl.viewport(0,0,W,H);gl.drawArrays(gl.TRIANGLES,0,3);
  if(gl.getError()!==gl.NO_ERROR)return false;
  const c=canvas.getContext('2d');c.save();c.setTransform(1,0,0,1,0,0);c.globalCompositeOperation='copy';c.drawImage(gc,0,0);c.restore();
  return true;
 }catch{return false;}finally{gl.getExtension('WEBGL_lose_context')?.loseContext();}
}
export function weatherizeCanvas(canvas,kind,weather,depth=1,kit=null,pixelDensity=1,gpu=false){
 if(weather==='clear')return canvas;
 if(kind==='ground'&&weather==='snow'&&gpu&&snowGroundGPU(canvas,pixelDensity,depth<1&&kit?snowMask(kit,Math.round(canvas.width/pixelDensity),Math.round(canvas.height/pixelDensity),depth):null))return canvas;
 const c=canvas.getContext('2d'),im=c.getImageData(0,0,canvas.width,canvas.height),d=im.data;
 if(kind==='cap'){if(weather==='snow'&&kit)c.putImageData(kit.snowCapImageData(im,pixelDensity),0,0);return canvas;}
 const k=pixelDensity,lw=Math.round(im.width/k),lh=Math.round(im.height/k),covered=depth<1&&kit?snowMask(kit,lw,lh,depth):null;
 // Patterns read logical pixels, so a denser canvas gets the same snow and frost layout.
 if(kind==='ground'&&weather==='snow'){
  // seasonPixel's ground-snow branch inlined (no array a pixel): only green pixels change. Test keeps them equal.
  for(let y=0;y<im.height;y++){const ly=Math.floor(y/k);for(let x=0;x<im.width;x++){
   const i=(y*im.width+x)*4,r=d[i],g=d[i+1],b=d[i+2];if(!d[i+3]||!(g>r*.97&&g>b*1.08))continue;
   const lx=Math.floor(x/k);let s;
   if(covered&&!covered(lx,ly)){d[i]=Math.round(r*.7);d[i+1]=Math.round(g*.78);d[i+2]=Math.round(b*.95+12);continue;}
   if(covered&&!covered(lx,ly+2))s=SNOW_LIP;else if(covered&&!covered(lx,ly-2))s=SNOW_RIM;else s=SNOW_SHADES[Math.min(3,Math.floor((r+g+b)/3/45))];
   d[i]=s[0];d[i+1]=s[1];d[i+2]=s[2];
  }}
  c.putImageData(im,0,0);return canvas;
 }
 for(let y=0;y<im.height;y++)for(let x=0;x<im.width;x++){
  const i=(y*im.width+x)*4;if(!d[i+3])continue;
  const rgb=seasonPixel(d[i],d[i+1],d[i+2],Math.floor(x/k),Math.floor(y/k),lw,lh,kind,weather,covered);
  d[i]=rgb[0];d[i+1]=rgb[1];d[i+2]=rgb[2];
 }
 c.putImageData(im,0,0);return canvas;
}
export function worldPhase(clock=0,period=1680){return clock>0?Math.floor(clock/(period/4))%4:0;}
export const FESTIVAL_HEROES=Object.freeze({
 event_yule:{id:'hero-yule',file:'world-v241/hero-yule.png',width:128,height:183,pivotX:64,pivotY:180},
 event_halloween:{id:'hero-halloween',file:'world-v241/hero-halloween.png',width:160,height:160,pivotX:80,pivotY:154},
 event_herbology_fair:{id:'hero-herbology',file:'world-v241/hero-herbology.png',width:136,height:158,pivotX:68,pivotY:156},
});
export const FESTIVAL_FILES=Object.freeze([...Object.values(FESTIVAL_HEROES),...Object.values(PLOT_SCENERY_ART)].map(a=>a.file));
const POCKET_ITEMS=['scene_potion_bench','scene_herb_rack','scene_explorer_chest','scene_mandrake_pot','decor_cauldron','scene_moon_lantern','scene_owl_mailbox','scene_rune_stones','scene_broom_rack','scene_crystal_planter','scene_mushroom_stump','scene_book_stand','scene_watering_station','scene_seed_cart','scene_hourglass'];
export function clearOfBuildings(col,row,map){
 return ![...(map?.plots||[]),...(map?.pens||[])].some(p=>col>p.col-.9&&col<p.col+p.width+.4&&row>p.row-.9&&row<p.row+p.height+.4);
}
export function festivalObjects({eventMode='none',stage,map,iso,decorAssets,occupied=[]}){
 const hero=FESTIVAL_HEROES[eventMode];if(!hero)return [];
 // Whole cells, and two rows off the north fence (row -0.5) so no rail is drawn across the hero.
 const heroSite=[[9,2],[-3,5],[-3,2]].find(([c,r])=>stageContains(stage,c,r)&&clearOfBuildings(c,r,map)&&!occupied.some(o=>Math.abs(o.xy[0]-iso(c,r)[0])<110&&Math.abs(o.xy[1]-iso(c,r)[1])<70));
 const out=heroSite?[{kind:'festival',type:'festival',id:hero.id,asset:hero,xy:iso(...heroSite),col:heroSite[0],row:heroSite[1],hero:true}]:[];
 const ids=eventMode==='event_halloween'?['decor_pumpkin_lantern','decor_cauldron']:eventMode==='event_yule'?['decor_floating_candles']:['decor_mandrake_planter','decor_vine_arch'];
 let pocket=0;
 for(const sourceRow of [1,8,13,20,27])for(const col of [6,13,19]){
  const row=eventMode==='event_halloween'&&sourceRow===1&&col===6?4:sourceRow; // Clear the gateway, so the workbench remains visible.
  const pocketId=POCKET_ITEMS[pocket++];
  if(!stageContains(stage,col,row)||!clearOfBuildings(col,row,map))continue;
  const xy=iso(col,row);
  if(out.some(o=>o.hero&&Math.abs(o.xy[0]-xy[0])<135&&Math.abs(o.xy[1]-xy[1])<70)||occupied.some(o=>Math.abs(o.xy[0]-xy[0])<70&&Math.abs(o.xy[1]-xy[1])<45))continue;
  const index=out.length,id=eventMode==='event_herbology_fair'&&row>1?'decor_mandrake_planter':ids[index%ids.length],asset=eventMode==='event_halloween'?(PLOT_SCENERY_ART[pocketId]||decorAssets.get(pocketId)):decorAssets.get(id);if(!asset)continue;
  // Tall arches only at the north end, never across plant/creature targets.
  if(asset.id==='decor_vine_arch'&&row>1)continue;
  out.push({kind:'festival',type:'festival',id:`festival:${row}:${col}`,asset,xy,col,row,hero:false});
 }
 return out;
}
function pixelLine(c,a,b,color,width=2){
 const d=densityOf(c);if(d>1)return deviceLine(c,a,b,color,width,d,0);
 c.fillStyle=color;const n=Math.max(1,Math.ceil(Math.max(Math.abs(b[0]-a[0]),Math.abs(b[1]-a[1]))/2));
 for(let i=0;i<=n;i++){const t=i/n;c.fillRect(Math.round(a[0]+(b[0]-a[0])*t),Math.round(a[1]+(b[1]-a[1])*t),width,width);}
}
// part 'static' (snow, garland rope) can be baked into a cached fence layer; 'moving' is then drawn each frame.
export function drawSeasonalFence(c,piece,weather,event,clock,part='all'){
 const d=densityOf(c);if(d>1)c=snapRects(c,d);
 const {a,b}=piece,still=part!=='moving',moving=part!=='static';
 if(piece.gate){
  if(still&&weather==='snow')for(const [x,y] of [a,b]){c.fillStyle='#e8f0ed';c.fillRect(Math.round(x-7),Math.round(y-74),14,3);}
  return; // A snow cap or garland must never close the open passage.
 }
 if(still&&weather==='snow')for(const h of [35,26,14])pixelLine(c,[a[0]-3,a[1]-h],[b[0]-3,b[1]-h],'#e8f0ed',3);
 if(event==='none')return;
 const phase=worldPhase(clock),colors=event==='event_halloween'?['#ffc36b','#a6b1ae']:event==='event_yule'?['#f5d69a','#c97952','#b0bd67']:['#ffc36b','#b0bd67','#e07a9e'];
 if(still)pixelLine(c,[a[0],a[1]-31],[b[0],b[1]-31],'#5d6046',2);
 if(moving)for(let j=1;j<=3;j++){
  const t=j/4,x=Math.round(a[0]+(b[0]-a[0])*t),y=Math.round(a[1]+(b[1]-a[1])*t-28+Math.sin(t*Math.PI)*5);
  c.fillStyle=colors[j%colors.length];
  if(event==='event_herbology_fair'){for(let k=0;k<5;k++)c.fillRect(x-4+k+Math.round(k/4*[0,1,0,-1][phase]),y+k,9-k*2,2);}
  else{c.fillRect(x-2,y,5,6);c.fillStyle=(phase+j)%3===0?'#e8f0ed':'#ffc36b';c.fillRect(x,y+1,2,2);}
 }
}
export function drawRoofWeather(c,object,weather,clock){
 const a=object.asset;if(!a)return;const [x,y]=object.xy,left=x-a.pivotX,top=y-a.pivotY;
 const eaves=[[8,91],[18,99],[112,104],[140,91],[155,84]];
 if(weather==='rain'){
  const phase=worldPhase(clock,960);c.fillStyle='#b7dee0';
  for(const [dx,dy] of eaves)c.fillRect(Math.round(left+dx),Math.round(top+dy+2+phase*3),1,4);
 }else if(weather==='snow'){
  c.fillStyle='#e8f0ed';for(const [dx,dy] of eaves){c.fillRect(Math.round(left+dx),Math.round(top+dy),2,3+dx%3);}
 }
}
export function drawHeroMotion(c,object,event,clock){
 if(!object.hero)return;
 const p=worldPhase(clock),[x,y]=object.xy,a=object.asset;
 // Sparkles/lights move; the base sprite and its feet never bob or shear.
 const points=event==='event_yule'?[[0,-a.height*.8],[-a.width*.2,-a.height*.48],[a.width*.2,-a.height*.35]]:event==='event_halloween'?[[-a.width*.2,-a.height*.3],[a.width*.23,-a.height*.35]]:[];
 c.fillStyle=event==='event_halloween'?'#b378ff':'#f5d69a';
 for(let i=0;i<points.length;i++){const [dx,dy]=points[i],size=(p+i)%3===0?3:1;c.fillRect(Math.round(x+dx),Math.round(y+dy),size,size);}
}
