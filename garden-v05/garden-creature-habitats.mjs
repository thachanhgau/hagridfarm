// Authored habitat sprites; placement and ambient effects remain presentation-only.
import {HABITAT_ART} from './complete-object-art.mjs?v=24.9.91';
// Each sprite stays inside a 38 x 30 ground pocket between the two actors.
const palette={d:'#4a3c2c',w:'#735044',h:'#b49a66',s:'#687486',l:'#a6b1ae',g:'#3f6a45',v:'#71934b',a:'#e7ae73',b:'#70a8b6',p:'#a57554',r:'#a57554',c:'#d6d8bf'};
export const HABITAT_SPECIES=Object.freeze(Object.keys(HABITAT_ART));
export function habitatAnchors(pen,iso){
 return [iso(pen.col+pen.width*.39,pen.row+pen.height*.18),iso(pen.col+pen.width*.60,pen.row+pen.height*.74)];
}
export function habitatPhase(species,clock=0,reducedMotion=false){
 if(reducedMotion||!Number.isFinite(clock)||clock<=0)return 0;
 const offset=Math.max(0,HABITAT_SPECIES.indexOf(species))*137;
 return Math.floor((clock+offset)/600)%4;
}
function pixel(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);}
function colors(weather){
 if(weather==='snow')return {...palette,g:'#a6b1ae',v:'#d6d8bf',h:'#d6d8bf',s:'#a6b1ae',l:'#d6d8bf'};
 if(weather==='rain')return {...palette,w:'#735044',h:'#a57554',g:'#3f6a45',v:'#71934b',s:'#687486'};
 if(weather==='autumn')return {...palette,g:'#777044',v:'#b49a66',h:'#b49a66'};
 return palette;
}
// Returns positions rather than inferring species from the pen number: adoption
// order, tours and translated layouts all keep their occupant's identity.
export function habitatResidents(pen,creatures,spots,iso){
 const anchors=habitatAnchors(pen,iso),residents=[];
 for(let i=0;i<Math.min(creatures.length,spots.length);i++){
  const entry=creatures[i],spot=spots[i];
  if(!entry||!HABITAT_ART[entry.species]||!Array.isArray(spot))continue;
  if(spot[0]<pen.col||spot[0]>=pen.col+pen.width||spot[1]<pen.row||spot[1]>=pen.row+pen.height)continue;
  const slot=spot[0]<pen.col+pen.width/2?0:1;
  residents.push({species:entry.species,xy:anchors[slot],slot});
 }
 return residents;
}
export function drawHabitatProps(c,residents,{weatherMode='clear',imageFor=()=>null}={}){
 for(const {species,xy:[x,y]} of residents){
  const asset=HABITAT_ART[species],image=asset&&imageFor(asset.file);if(!image)continue;
  c.drawImage(image,Math.round(x-asset.pivotX),Math.round(y-asset.pivotY));
  if(weatherMode==='snow')pixel(c,x-5,y-asset.bounds.h,10,2,palette.c);
 }
}

function glint(c,x,y,color,phase){
 if(phase!==1&&phase!==2)return;
 pixel(c,x,y,2,2,color);
 if(phase===2){pixel(c,x-2,y,6,1,color);pixel(c,x,y-2,1,6,color);}
}
export function drawHabitatMotion(c,residents,{clock=0,reducedMotion=false,weatherMode='clear'}={}){
 const p=colors(weatherMode);
 for(const {species,xy:[x,y]} of residents){
  const phase=habitatPhase(species,clock,reducedMotion),sway=[0,1,0,-1][phase];
  switch(species){
   case 'puffskein': // Small soft tassel on the basket, not a second creature.
    pixel(c,x+10+sway,y-12,4,4,p.p);pixel(c,x+11+sway,y-13,2,2,p.c);break;
   case 'bowtruckle':
    pixel(c,x-4+sway,y-23,6,2,p.v);pixel(c,x+sway,y-25,2,4,p.g);break;
   case 'niffler':glint(c,x+10,y-5,p.a,phase);break;
   case 'mooncalf':glint(c,x-2,y-13,p.b,phase);break;
   case 'kneazle':pixel(c,x+11+sway,y-5,2,2,p.c);break;
   case 'diricawl': // Two quiet ripples, no travel across the pen.
    pixel(c,x-5+sway*2,y-12,4,1,p.l);pixel(c,x+3-sway,y-8,3,1,p.b);break;
   case 'fwooper':pixel(c,x+3+sway,y-22,2,5,p.p);pixel(c,x+4+sway,y-23,2,2,p.a);break;
   case 'hippogriff':pixel(c,x+11+sway,y-8,2,5,p.c);break;
   case 'thestral':pixel(c,x-4,y-14,4,4,phase===1||phase===2?p.l:p.b);break;
   case 'unicorn':glint(c,x,y-13,p.c,phase);break;
   case 'three-headed-dog': // A fly above a bone; stays well below any head.
    pixel(c,x-4+sway*2,y-20-(phase===2?1:0),2,1,p.a);break;
   case 'dragon':pixel(c,x-2,y-12,4,2,phase===1||phase===2?p.a:p.r);if(phase===2)pixel(c,x+4,y-17,1,2,p.a);break;
  }
 }
}
