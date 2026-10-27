import {stageContains} from './garden-growth.mjs?v=24.9.87';
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
// All variants derive from immutable native pixels, once per weather change.
export function seasonPixel(r,g,b,x,y,width,height,kind,weather){
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
  if(green&&(kind==='ground'||kind==='tree'&&lum>35&&patch>.15)){
   const shade=Math.min(3,Math.floor(lum/45));
   return [[135,168,180],[177,202,211],[216,231,234],[242,246,235]][shade];
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
export function weatherizeCanvas(canvas,kind,weather){
 if(weather==='clear')return canvas;
 const c=canvas.getContext('2d'),im=c.getImageData(0,0,canvas.width,canvas.height),d=im.data;
 for(let y=0;y<im.height;y++)for(let x=0;x<im.width;x++){
  const i=(y*im.width+x)*4;if(!d[i+3])continue;
  const rgb=seasonPixel(d[i],d[i+1],d[i+2],x,y,im.width,im.height,kind,weather);
  d[i]=rgb[0];d[i+1]=rgb[1];d[i+2]=rgb[2];
 }
 c.putImageData(im,0,0);return canvas;
}
export function worldPhase(clock=0,period=1680){return clock>0?Math.floor(clock/(period/4))%4:0;}
export const FESTIVAL_HEROES=Object.freeze({
 event_yule:{id:'hero-yule',file:'world-v241/hero-yule.png',width:141,height:210,pivotX:70,pivotY:209},
 event_halloween:{id:'hero-halloween',file:'world-v241/hero-halloween.png',width:180,height:114,pivotX:90,pivotY:113},
 event_herbology_fair:{id:'hero-herbology',file:'world-v241/hero-herbology.png',width:132,height:155,pivotX:66,pivotY:154},
});
export const FESTIVAL_FILES=Object.freeze(Object.values(FESTIVAL_HEROES).map(a=>a.file));
export function clearOfBuildings(col,row,map){
 return ![...(map?.plots||[]),...(map?.pens||[])].some(p=>col>p.col-.9&&col<p.col+p.width+.4&&row>p.row-.9&&row<p.row+p.height+.4);
}
export function festivalObjects({eventMode='none',stage,map,iso,decorAssets,occupied=[]}){
 const hero=FESTIVAL_HEROES[eventMode];if(!hero)return [];
 const heroSite=[[9,.7],[-3,4.7],[-3,1]].find(([c,r])=>stageContains(stage,c,r)&&clearOfBuildings(c,r,map)&&!occupied.some(o=>Math.abs(o.xy[0]-iso(c,r)[0])<110&&Math.abs(o.xy[1]-iso(c,r)[1])<70));
 const out=heroSite?[{kind:'festival',type:'festival',id:hero.id,asset:hero,xy:iso(...heroSite),col:heroSite[0],row:heroSite[1],hero:true}]:[];
 const ids=eventMode==='event_halloween'?['decor_pumpkin_lantern','decor_cauldron']:eventMode==='event_yule'?['decor_floating_candles']:['decor_mandrake_planter','decor_vine_arch'];
 for(const row of [1,7.1,13.4,20,26.7])for(const col of [6.1,12.6,19.1]){
  if(!stageContains(stage,col,row)||!clearOfBuildings(col,row,map))continue;
  const xy=iso(col,row);
  if(out.some(o=>o.hero&&Math.abs(o.xy[0]-xy[0])<135&&Math.abs(o.xy[1]-xy[1])<70)||occupied.some(o=>Math.abs(o.xy[0]-xy[0])<70&&Math.abs(o.xy[1]-xy[1])<45))continue;
  const index=out.length,id=eventMode==='event_herbology_fair'&&row>1?'decor_mandrake_planter':ids[index%ids.length],asset=decorAssets.get(id);if(!asset)continue;
  // Tall arches only at the north end, never across plant/creature targets.
  if(asset.id==='decor_vine_arch'&&row>1)continue;
  out.push({kind:'festival',type:'festival',id:'festival:'+index,asset,xy,col,row,hero:false});
 }
 return out;
}
function pixelLine(c,a,b,color,width=2){
 c.fillStyle=color;const n=Math.max(1,Math.ceil(Math.max(Math.abs(b[0]-a[0]),Math.abs(b[1]-a[1]))/2));
 for(let i=0;i<=n;i++){const t=i/n;c.fillRect(Math.round(a[0]+(b[0]-a[0])*t),Math.round(a[1]+(b[1]-a[1])*t),width,width);}
}
export function drawSeasonalFence(c,piece,weather,event,clock){
 const {a,b}=piece;
 if(piece.gate){
  if(weather==='snow')for(const [x,y] of [a,b]){c.fillStyle='#e8f0ed';c.fillRect(Math.round(x-7),Math.round(y-57),14,3);}
  return; // A snow cap or garland must never close the open passage.
 }
 if(weather==='snow')for(const h of [35,26,14])pixelLine(c,[a[0]-3,a[1]-h],[b[0]-3,b[1]-h],'#e8f0ed',3);
 if(event==='none')return;
 const phase=worldPhase(clock),colors=event==='event_halloween'?['#ffc36b','#a6b1ae']:event==='event_yule'?['#f5d69a','#c97952','#b0bd67']:['#ffc36b','#b0bd67','#e07a9e'];
 pixelLine(c,[a[0],a[1]-31],[b[0],b[1]-31],'#5d6046',2);
 for(let j=1;j<=3;j++){
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
