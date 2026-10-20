import {stageContains} from './garden-growth.mjs?v=24.9.55';
import {clearOfBuildings,worldPhase} from './garden-seasonal-world.mjs?v=24.9.55';
export function sceneryLighting(atmosphere='day',weather='clear'){
 return {sun:weather==='clear'&&atmosphere!=='night',warm:atmosphere==='dusk',wet:weather==='rain',snow:weather==='snow'};
}
export function drawV24Ground(c,{weatherMode='clear',clock=0,iso,stage,map}){
 if(!c||!iso||weatherMode==='clear')return;c.save();
 for(let row=1.1;row<28;row+=3.15)for(let col=1;col<31;col+=3.2){
  if(stage&&!stageContains(stage,col,row)||map&&!clearOfBuildings(col,row,map))continue;
  const [x,y]=iso(col,row),seed=Math.floor(col*17+row*31),phase=worldPhase(clock+ (clock>0?seed*11:0),1440);
  if(weatherMode==='rain'){
   const w=22+seed%19;c.fillStyle='#24483f';
   for(let dy=-7;dy<=7;dy+=2)c.fillRect(Math.round(x-w+Math.abs(dy)*2),Math.round(y+dy),w*2-Math.abs(dy)*4,2);
   c.fillStyle='#70a8b6';c.fillRect(Math.round(x-w+8),Math.round(y-3),w+3,2);c.fillStyle='#a6b1ae';
   const r=5+phase*4;c.fillRect(Math.round(x-r),Math.round(y-2),r*2,1);c.fillRect(Math.round(x-r+3),Math.round(y+3),r*2-6,1);
  }else if(weatherMode==='autumn'){
   for(let j=0;j<24;j++){const dx=(j*17+seed)%67-33,dy=(j*11+seed)%23-11;c.fillStyle=['#a57554','#ed8a45','#8b4a3f','#e7ae73'][j%4];c.fillRect(Math.round(x+dx),Math.round(y+dy),5+j%3,2);c.fillRect(Math.round(x+dx+2),Math.round(y+dy-1),3,4);}
  }else if(weatherMode==='snow'){
   // Irregular banks on path margins leave the centre readable.
   for(let dy=-8;dy<7;dy+=2){const w=26-Math.abs(dy)*2;c.fillStyle=dy>3?'#b7dee0':'#e8f0ed';c.fillRect(Math.round(x-w),Math.round(y+dy),w*2,2);}
  }
 }
 c.restore();
}
export function drawV24Scenery(c,{clock=0,weatherMode='clear',atmosphereMode='day',stageBounds}){
 const light=sceneryLighting(atmosphereMode,weatherMode);if(!light.sun)return;
 const bounds=stageBounds||{left:500,top:300,bottom:1100};c.save();
 for(let i=0;i<4;i++){const x=bounds.left+80+i*170+(clock>0?Math.round(Math.sin(clock/6500)*5):0);c.fillStyle=light.warm?'rgba(255,181,91,.055)':'rgba(255,236,167,.04)';c.beginPath();c.moveTo(x,bounds.top-190);c.lineTo(x+28,bounds.top-190);c.lineTo(x+310,bounds.bottom);c.lineTo(x+200,bounds.bottom);c.closePath();c.fill();}
 c.restore();
}
