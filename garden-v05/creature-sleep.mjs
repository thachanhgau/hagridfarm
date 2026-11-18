import {CREATURE_SLEEP_ART} from './creature-sleep-art.mjs?v=26.22';
export const CREATURE_SLEEP_FILES=Object.freeze(Object.values(CREATURE_SLEEP_ART).flat().map(a=>a.file));
// Presentation state only. Meals, cooldowns, saves and rewards continue on their normal clock.
export function creatureRest({species,stage=3,night=false,event=null,guest=false}={}){
 if(!night||event||guest)return null;
 const asset=CREATURE_SLEEP_ART[species]?.[Math.max(0,Math.min(3,Math.round(stage)))];
 return asset?{asset,sleeping:true,motion:null,authoredFacing:false,hop:0,drift:0}:null;
}
export function drawSleepSigns(ctx,object,clock=0){
 if(!object.sleeping||!object.asset)return;
 const a=object.asset,b=a.bounds,[x,y]=object.xy,t=clock>0?clock:0,drift=t?Math.sin(t/1800)*2:0;
 ctx.save();ctx.fillStyle='#B7DEE0';ctx.font='bold 9px sans-serif';ctx.textAlign='center';
 ctx.globalAlpha=.8;ctx.fillText('z',Math.round(x-a.pivotX+b.x+b.w*.75),Math.round(y-a.pivotY+b.y-3+drift));
 ctx.globalAlpha=.5;ctx.fillText('z',Math.round(x-a.pivotX+b.x+b.w*.75+8),Math.round(y-a.pivotY+b.y-11+drift));ctx.restore();
}
