// «Bậc trách nhiệm» (25.0 S5, server garden-duty-core) drawn by code on the scene: wilted and dried-out crops are
// the crop's own sprite snapped to a palette ramp by brightness; a ma lùm (HP2: small, leathery, a bald knobbly
// head like a potato) sits in weeds on its plot and chews. Colours from palette.mjs only.
const WILT=['#4A3C2C','#5D6046','#777044','#B49A66','#D6D8BF'];
const DEAD=['#231F2E','#4A3042','#735044','#A57554'];
const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
const RAMPS={wilt:WILT.map(rgb),dead:DEAD.map(rgb)};

/** Recolours a canvas copy of a crop sprite in place: 'wilt' (olive, straw) or 'dead' (dry browns). */
export function witherCanvas(canvas,mode){
 const ramp=RAMPS[mode],brush=canvas.getContext('2d',{willReadFrequently:true});
 const data=brush.getImageData(0,0,canvas.width,canvas.height),px=data.data;
 for(let i=0;i<px.length;i+=4){
  if(px[i+3]===0)continue;
  const lum=(px[i]*0.3+px[i+1]*0.59+px[i+2]*0.11)/255;
  const [r,g,b]=ramp[Math.min(ramp.length-1,Math.floor(lum*ramp.length*(mode==='dead'?0.9:1.1)))];
  px[i]=r;px[i+1]=g;px[i+2]=b;
 }
 brush.putImageData(data,0,0);
 return canvas;
}

const box=(ctx,x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h);};
// A few weed blades around (x, y), fixed by the plot's seed.
export function drawWeeds(ctx,x,y,seed=0){
 for(let k=0;k<7;k+=1){
  const a=(seed*37+k*53)%100/100,dx=Math.round((a-0.5)*34),dy=Math.round(((seed+k*29)%10-5)*1.2),h=4+(k+seed)%4;
  box(ctx,x+dx,y+dy-h,1,h,k%2?'#5D6046':'#777044');
  box(ctx,x+dx-1,y+dy-h+2,1,2,'#3F6A45');
  box(ctx,x+dx+1,y+dy-h+1,1,2,'#B0BD67');
 }
}

/** One ma lùm, feet at (x, y); it bobs and chews a leaf (clock 0 = still). */
export function drawGnome(ctx,x,y,clock=0){
 const chew=clock?Math.floor(clock/260)%2:0,bob=clock?Math.floor(clock/520)%2:0,top=y-14-bob;
 box(ctx,x-4,y-1,8,1,'#231F2E'); // shadow
 box(ctx,x-3,top+7,6,6,'#735044'); box(ctx,x-2,top+12,2,2,'#4A3042'); box(ctx,x+1,top+12,2,2,'#4A3042'); // body, feet
 box(ctx,x-5,top,10,8,'#231F2E'); box(ctx,x-4,top+1,8,6,'#A57554'); box(ctx,x-3,top+1,3,2,'#C97952'); // knobbly head
 box(ctx,x-6,top+3,2,2,'#A57554'); box(ctx,x+4,top+3,2,2,'#A57554'); // ears
 box(ctx,x-2,top+3,1,1,'#231F2E'); box(ctx,x+1,top+3,1,1,'#231F2E'); // eyes
 box(ctx,x-1,top+5+chew,3,1,'#4A3042'); // mouth
 box(ctx,x+2,top+5,4,2,'#71934B'); box(ctx,x+5,top+4+chew,2,1,'#B0BD67'); // the leaf it steals
}
