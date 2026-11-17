import {decorFrameAt} from './scene-animation.mjs?v=26.12';
import {DECOR_LIGHTS} from './decor-lights-spec.mjs?v=26.12';
import {DECOR_LIGHT_POINTS} from './decor-light-points.mjs?v=26.12';

export function nightDecorFrame(object,clock=0,{hd=false}={}){
 if(!object?.asset||!object.xy||object.preview)return null;
 const id=object.kind==='festival'?object.asset.id:object.id,spec=DECOR_LIGHTS[id];
 if(!spec)return null;
 const frame=decorFrameAt(object.asset,clock,{facing:object.facing,seed:object.kind==='festival'?object.id:`${object.id}:${object.slot}`,reducedMotion:clock===0});
 const records=DECOR_LIGHT_POINTS[id]?.[frame.facing],record=records?.[frame.index]??records?.[0];
 if(!record)return null;
 return {id,...spec,asset:{...object.asset,...frame},points:record[hd?'hd':'native']};
}
// Night lag (owner 16/11/2026): a new radial gradient per bulb every draw cost ~4.5× a stamped sprite. Each colour and
// strength is drawn once at 256 px, then scaled; with no canvas (tests) the gradient path below stays.
const HALO=128,haloSprites=new Map();
function haloSprite(rgb,alpha){
 const key=rgb+'|'+alpha;if(haloSprites.has(key))return haloSprites.get(key);
 const c=typeof OffscreenCanvas==='function'?new OffscreenCanvas(HALO*2,HALO*2):globalThis.document?.createElement?.('canvas'),g=c?.getContext?.('2d');
 let sprite=null;
 if(g){c.width=c.height=HALO*2;const s=g.createRadialGradient(HALO,HALO,0,HALO,HALO,HALO);s.addColorStop(0,`rgba(${rgb},${alpha})`);s.addColorStop(.3,`rgba(${rgb},${alpha*.45})`);s.addColorStop(1,`rgba(${rgb},0)`);g.fillStyle=s;g.fillRect(0,0,HALO*2,HALO*2);sprite=c;}
 haloSprites.set(key,sprite);return sprite;
}
function halo(ctx,x,y,r,rgb,alpha){
 const sprite=haloSprite(rgb,alpha);if(sprite){ctx.drawImage(sprite,x-r,y-r,r*2,r*2);return;}
 const gradient=ctx.createRadialGradient?.(x,y,0,x,y,r);if(!gradient?.addColorStop)return;
 gradient.addColorStop(0,`rgba(${rgb},${alpha})`);gradient.addColorStop(.3,`rgba(${rgb},${alpha*.45})`);gradient.addColorStop(1,`rgba(${rgb},0)`);ctx.fillStyle=gradient;ctx.fillRect(x-r,y-r,r*2,r*2);
}
export function drawDecorIllumination(ctx,object,{clock=0,mode='night',hd=false,drawAsset}={}){
 if(mode==='day')return false;
 const light=nightDecorFrame(object,clock,{hd});if(!light)return false;
 const a=light.asset,[x,y]=object.xy,pulse=clock>0?1+Math.sin(clock/1700+(object.slot??0))*.055:1,strength=mode==='dusk'?.6:1;
 ctx.save();
 // Light is additive only. Replaying an opaque body after the tint would cover foreground rails/actors.
 // Authored sprites, their coats and native/HD atlas cells stay in the depth-sorted scene pass.
 ctx.globalAlpha=1;ctx.globalCompositeOperation='lighter';
 ctx.save();ctx.translate(x,y-2);ctx.scale(1,.5);halo(ctx,0,0,light.kind==='tree'?72:44,'255,207,116',.22*strength);ctx.restore();
 for(const [sx,sy,color]of light.points){
  const px=x-a.pivotX+sx,py=y-a.pivotY+sy;
  halo(ctx,px,py,(light.kind==='tree'?18:25)*pulse,color,.46*strength);
  ctx.globalAlpha=.9*strength;ctx.fillStyle=`rgb(${color})`;ctx.fillRect(Math.round(px)-1,Math.round(py)-1,3,3);
  ctx.fillStyle='#F5D69A';ctx.fillRect(Math.round(px),Math.round(py),1,1);
 }
 // One soft starburst on the tree's highest real bulb, fixed when reduced motion uses clock zero.
 if(light.kind==='tree'&&light.points.length){const p=light.points.reduce((a,b)=>a[1]<b[1]?a:b),px=Math.round(x-a.pivotX+p[0]),py=Math.round(y-a.pivotY+p[1]);ctx.globalAlpha=.8*strength;ctx.fillStyle='#F5D69A';ctx.fillRect(px-5,py,11,1);ctx.fillRect(px,py-5,1,11);}
 ctx.restore();return true;
}

// Fire-bearing residents keep a quiet ember even while resting; coats and authored poses stay intact.
export const FIRE_CREATURES=Object.freeze(['dragon','salamander']);
export function drawCreatureEmber(ctx,object,{clock=0,mode='night',drawAsset}={}){
 if(mode==='day'||!FIRE_CREATURES.includes(object?.species)||!object.asset||!object.xy)return false;
 const a=object.asset,b=a.bounds||{x:0,y:0,w:a.width,h:a.height},[x,y]=object.xy,rest=object.sleeping?.55:1,strength=(mode==='dusk'?.6:1)*rest;
 ctx.save();
 ctx.globalCompositeOperation='lighter';ctx.globalAlpha=1;
 const center=x-a.pivotX+b.x+b.w/2,px=(object.facing==='right'&&!object.authoredFacing?2*x-center:center)+(object.drift||0)+(object.motion?.swayX||0),py=y-a.pivotY+b.y+b.h*.55+(object.hop||0)+(object.motion?.bobY||0);
 halo(ctx,px,py,Math.max(28,b.w*.65),'255,128,45',.38*strength);
 ctx.save();ctx.translate(x,y);ctx.scale(1,.5);halo(ctx,0,0,Math.max(38,b.w*.6),'255,171,72',.24*strength);ctx.restore();ctx.restore();return true;
}
