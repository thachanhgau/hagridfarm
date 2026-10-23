import {FARM_SIGN_ART} from './farm-sign-art.mjs?v=24.9.70';
export {FARM_SIGN_ART};
// Scenic-only composition: deterministic groves and a walkable-looking exit.
// Never changes authored slots, collision data, or game state.
const iso=(map,c,r)=>[map.origin.x+(c-r)*map.tileWidth/2,map.origin.y+(c+r)*map.tileHeight/2];
function randomSource(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
export function canopyClusters(map,sizes){
 const random=randomSource(190319),trees=[];
 const add=(x,y,scale)=>{
  const n=random(),id=n<.43?'oak':n<.81?'pine':n<.96?'grove':'log';
  if(id==='log')scale=.65+random()*.4;
  else if(id==='grove')scale*=.8;
  const size=sizes[id],w=Math.round(size.width*scale),h=Math.round(size.height*scale);
  trees.push({id,x:Math.round((x+map.width)%map.width),y:Math.round((y+map.height)%map.height),w,h,flip:random()<.4});
 };
 for(let group=0;group<27;group++){
  const x=random()*map.width,y=random()*map.height;
  const rx=130+random()*210,ry=65+random()*100,count=16+Math.floor(random()*11);
  add(x,y,1.7+random()*.55);
  for(let n=0;n<count;n++){
   const angle=random()*Math.PI*2,distance=Math.sqrt(random());
   add(x+Math.cos(angle)*rx*distance,y+Math.sin(angle)*ry*distance,.7+random()*1.0);
  }
 }
 // Sparse saplings bridge groves without turning the clearings into rows.
 for(let n=0;n<42;n++)add(random()*map.width,random()*map.height,.5+random()*.65);
 return trees.sort((a,b)=>a.y-b.y||a.x-b.x);
}
export function forestExitTrail(map,bottom=28){
 const gate=iso(map,16,bottom),step=iso(map,16,bottom+2.4);
 const edgeY=map.height* .82;
 const controls=[gate,step,[Math.max(210,step[0]-140),Math.min(edgeY-75,step[1]+100)],[180,edgeY-35],[80,edgeY],[0,edgeY]];
 return smoothTrail(controls);
}
export function backdropExitTrail(map){
 const y=map.height*.82;
 return smoothTrail([[map.width,y],[map.width-90,y],[map.width*.88,y+26],[map.width*.77,y-18],[map.width*.66,y+34],[map.width*.56,y+18]]);
}
function smoothTrail(controls){
 const result=[];
 for(let i=0;i<controls.length-1;i++){
  const a=controls[Math.max(0,i-1)],b=controls[i],c=controls[i+1],d=controls[Math.min(controls.length-1,i+2)];
  const steps=Math.max(2,Math.ceil(Math.max(Math.hypot(b[0]-a[0],b[1]-a[1]),Math.hypot(c[0]-b[0],c[1]-b[1]),Math.hypot(d[0]-c[0],d[1]-c[1]))/4));
  for(let k=0;k<steps;k++){
   const t=k/steps,t2=t*t,t3=t2*t;
   result.push([0,1].map(j=>.5*((2*b[j])+(-a[j]+c[j])*t+(2*a[j]-5*b[j]+4*c[j]-d[j])*t2+(-a[j]+3*b[j]-3*c[j]+d[j])*t3)));
  }
 }
 result.push(controls.at(-1));return result;
}
export function exitSignFrame(trail){
 if(trail.length<=42)return null;
 const [x,y]=trail[0],left=Math.round(x-320),top=Math.round(y+20);
 return {left,top,right:left+FARM_SIGN_ART.width,bottom:top+FARM_SIGN_ART.height};
}
export function overlapsTrail(rect,trail,margin=22){
 const sign=exitSignFrame(trail);
 if(sign&&rect.right>=sign.left-8&&rect.left<=sign.right+8&&rect.bottom>=sign.top-8&&rect.top<=sign.bottom+8)return true;
 return trail.some(([x,y])=>x>=rect.left-margin&&x<=rect.right+margin&&y>=rect.top-margin&&y<=rect.bottom+margin);
}
function stamp(ctx,x,y,r,color){
 ctx.fillStyle=color;
 for(let dy=-r*.45;dy<=r*.45;dy+=2){const half=Math.sqrt(Math.max(0,1-(dy/(r*.5))**2))*r;ctx.fillRect(Math.round(x-half),Math.round(y+dy),Math.ceil(half*2),2);}
}
export function drawExitTrail(ctx,trail,{sign=false,signImage=null,taperEnd=false}={}){
 ctx.save();ctx.globalAlpha=1;
 const weight=i=>taperEnd&&i>trail.length*.6?Math.max(.32,1-(i-trail.length*.6)/(trail.length*.4)*.68):1;
 for(let i=0;i<trail.length;i++){const [x,y]=trail[i];stamp(ctx,x,y,31*weight(i),'#24483f');}
 for(let i=0;i<trail.length;i++){const [x,y]=trail[i];stamp(ctx,x,y,24*weight(i),'#5d6046');}
 for(let i=0;i<trail.length;i++){
  const [x,y]=trail[i],w=weight(i);stamp(ctx,x,y,(16+Math.sin(i*.23)*2)*w,'#777044');
  if(i%4===0){ctx.fillStyle=i%8?'#b49a66':'#5d6046';ctx.fillRect(Math.round(x+Math.sin(i*3)*12*w),Math.round(y+Math.cos(i)*5*w),4,2);}
 }
 if(sign&&trail.length>42){
  if(!signImage)throw Error('Farm sign sprite is required');
  const {left,top}=exitSignFrame(trail),art=FARM_SIGN_ART;
  ctx.drawImage(signImage,left,top,art.width,art.height);
  const t=art.text;
  ctx.save();ctx.transform(1,t.slope,0,1,left+t.x,top+t.y);
  ctx.textAlign='center';ctx.textBaseline='alphabetic';
  ctx.font='bold 12px sans-serif';ctx.fillStyle='#231f2e';
  ctx.fillText('Trang trại của Hagrid',t.maxWidth/2+1,1,t.maxWidth);
  ctx.fillStyle='#f5d69a';ctx.fillText('Trang trại của Hagrid',t.maxWidth/2,0,t.maxWidth);
  ctx.font='8px sans-serif';ctx.fillStyle='#231f2e';
  ctx.fillText('Người giữ khoá trường Hogwarts',t.maxWidth/2+1,t.lineGap+1,t.maxWidth);
  ctx.fillStyle='#d6d8bf';ctx.fillText('Người giữ khoá trường Hogwarts',t.maxWidth/2,t.lineGap,t.maxWidth);
  ctx.restore();
 }
 ctx.restore();
}
