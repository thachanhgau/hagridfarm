import {stageContains} from './garden-growth.mjs?v=26.11';
import {clearOfBuildings,worldPhase} from './garden-seasonal-world.mjs?v=26.11';
import {densityOf,fillAt} from './device-pixels.mjs?v=26.11';
import {pathSegments} from './garden-path-details.mjs?v=26.11';
// A bank (|dx| + 2|dy| ≤ 26 px) covers ±26/64 cell around its centre; a path is one cell wide along its centre line
// (GARDEN_PATHS plus the map's pond, edge and pen routes). Owner 15/11/2026: no snow bank lying across a path.
const BANK_HALF=26/64;
export const bankOnPath=(col,row,map)=>pathSegments(map).some(([a,b])=>
 col+BANK_HALF>Math.min(a[0],b[0])-.5&&col-BANK_HALF<Math.max(a[0],b[0])+.5&&row+BANK_HALF>Math.min(a[1],b[1])-.5&&row-BANK_HALF<Math.max(a[1],b[1])+.5);
export function sceneryLighting(atmosphere='day',weather='clear'){
 return {sun:weather==='clear'&&atmosphere!=='night',warm:atmosphere==='dusk',wet:weather==='rain',snow:weather==='snow'};
}
// Density > 1: the same accents, footprints and colours, stepped per device pixel instead of 2 px rows.
function hdBank(c,x,y,seed,d){
 const p=1/d;
 for(let k=0,t=-8;t<8-p/2;k++,t=-8+k*p){
  // A lumpy rim (deterministic per bank) breaks the clean diamond into a drift.
  const lump=t<-4||t>5?((seed+k*k*3)%4)*p:0,w=26-Math.abs(t)*2-lump;
  fillAt(c,x-w,y+t,w*2,p,t>=4?'#b7dee0':t>=4-p*1.5?'#a6b1ae':'#e8f0ed',d);
 }
}
function hdRain(c,x,y,w,phase,d){
 const p=1/d;
 for(let k=0,t=-7;t<9-p/2;k++,t=-7+k*p){const h=w-Math.max(2,Math.abs(t-1)*2);fillAt(c,x-h,y+t,h*2,p,'#24483f',d);}
 fillAt(c,x-w+8,y-3,w+3,p*2,'#70a8b6',d);fillAt(c,x-w+8+p,y-3+p*2,w+3-p*2,p,'#24483f',d);
 const r=5+phase*4;fillAt(c,x-r,y-2,r*2,p,'#a6b1ae',d);fillAt(c,x-r+3,y+3,r*2-6,p,'#a6b1ae',d);
}
function hdLeaves(c,x,y,seed,d){
 const p=1/d,colors=['#a57554','#ed8a45','#8b4a3f','#e7ae73'],veins=['#735044','#c97952','#4a3042','#c97952'];
 for(let j=0;j<24;j++){
  const dx=(j*17+seed)%67-33,dy=(j*11+seed)%23-11,w=5+j%3,lx=x+dx,ly=y+dy;
  fillAt(c,lx+p,ly,w-2*p,2,colors[j%4],d);fillAt(c,lx,ly+p,w,2-2*p,colors[j%4],d);
  fillAt(c,lx+2+p,ly-1,3-2*p,4,colors[j%4],d);fillAt(c,lx+2,ly-1+p,3,4-2*p,colors[j%4],d);
  fillAt(c,lx+p,ly+1,w-2*p,p,veins[j%4],d);
 }
}
export function drawV24Ground(c,{weatherMode='clear',clock=0,iso,stage,map}){
 if(!c||!iso||weatherMode==='clear')return;c.save();const d=densityOf(c);
 for(let row=1.1;row<28;row+=3.15)for(let col=1;col<31;col+=3.2){
  if(stage&&!stageContains(stage,col,row)||map&&!clearOfBuildings(col,row,map))continue;
  const [x,y]=iso(col,row),seed=Math.floor(col*17+row*31),phase=worldPhase(clock+ (clock>0?seed*11:0),1440);
  if(weatherMode==='rain'){
   const w=22+seed%19;c.fillStyle='#24483f';
   if(d>1){hdRain(c,x,y,w,phase,d);continue;}
   for(let dy=-7;dy<=7;dy+=2)c.fillRect(Math.round(x-w+Math.abs(dy)*2),Math.round(y+dy),w*2-Math.abs(dy)*4,2);
   c.fillStyle='#70a8b6';c.fillRect(Math.round(x-w+8),Math.round(y-3),w+3,2);c.fillStyle='#a6b1ae';
   const r=5+phase*4;c.fillRect(Math.round(x-r),Math.round(y-2),r*2,1);c.fillRect(Math.round(x-r+3),Math.round(y+3),r*2-6,1);
  }else if(weatherMode==='autumn'){
   if(d>1){hdLeaves(c,x,y,seed,d);continue;}
   for(let j=0;j<24;j++){const dx=(j*17+seed)%67-33,dy=(j*11+seed)%23-11;c.fillStyle=['#a57554','#ed8a45','#8b4a3f','#e7ae73'][j%4];c.fillRect(Math.round(x+dx),Math.round(y+dy),5+j%3,2);c.fillRect(Math.round(x+dx+2),Math.round(y+dy-1),3,4);}
  }else if(weatherMode==='snow'){
   // Irregular banks on path margins leave the centre readable.
   if(bankOnPath(col,row,map))continue;
   if(d>1){hdBank(c,x,y,seed,d);continue;}
   for(let dy=-8;dy<7;dy+=2){const w=26-Math.abs(dy)*2;c.fillStyle=dy>3?'#b7dee0':'#e8f0ed';c.fillRect(Math.round(x-w),Math.round(y+dy),w*2,2);}
  }
 }
 c.restore();
}
