// Divine night illumination in logical garden pixels; no bitmap or camera changes.
const COLORS={ev_dark_dobby_red:[255,211,128],ev_dobby_spring_rider:[183,238,255]};
export function drawStatueAura(ctx,object,clock=0){
  const color=COLORS[object?.id];if(!color||object.preview||object.kind!=='store-decor')return;
  const a=object.asset,b=(object.facing==='right'?a.rightBounds:a.bounds)||a.bounds;
  if(!b||!object.xy)return;
  const x=object.xy[0]-a.pivotX+b.x+b.w/2,y=object.xy[1]-a.pivotY+b.y+b.h*.2;
  const t=clock>0?clock:0,pulse=t?1+Math.sin(t/1250+(object.slot||0))*.08:1,rgb=color.join(',');
  ctx.save();ctx.globalCompositeOperation='lighter';
  const glow=ctx.createRadialGradient?.(x,y,4,x,y,86*pulse);
  if(glow?.addColorStop){glow.addColorStop(0,`rgba(${rgb},.7)`);glow.addColorStop(.4,`rgba(${rgb},.28)`);glow.addColorStop(1,`rgba(${rgb},0)`);ctx.fillStyle=glow;ctx.fillRect(x-90,y-90,180,180);}
  // A circular aureole belongs to the upright statue; its ground pool follows the 2:1 grid.
  ctx.strokeStyle=`rgba(${rgb},.85)`;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,y,30*pulse,0,Math.PI*2);ctx.stroke();
  ctx.strokeStyle=`rgba(${rgb},.42)`;ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y,35*pulse,0,Math.PI*2);ctx.stroke();
  for(let i=0;i<12;i++){const angle=i*Math.PI/6+(t?Math.sin(t/6000)*.03:0),near=40*pulse,far=(i%3===0?61:50)*pulse;ctx.beginPath();ctx.moveTo(x+Math.cos(angle)*near,y+Math.sin(angle)*near);ctx.lineTo(x+Math.cos(angle)*far,y+Math.sin(angle)*far);ctx.stroke();}
  ctx.save();ctx.translate(object.xy[0],object.xy[1]-3);ctx.scale(1,.5);const pool=ctx.createRadialGradient?.(0,0,1,0,0,58*pulse);if(pool?.addColorStop){pool.addColorStop(0,`rgba(${rgb},.36)`);pool.addColorStop(.5,`rgba(${rgb},.18)`);pool.addColorStop(1,`rgba(${rgb},0)`);ctx.fillStyle=pool;ctx.fillRect(-64,-64,128,128);}ctx.restore();
  ctx.globalAlpha=1;
  // A fixed small particle budget; clock zero freezes every sparkle for reduced motion.
  for(let i=0;i<9;i++){const u=((i*.381966+(t?t/6500:0))%1),sx=x+Math.sin(i*2.4)*48,sy=object.xy[1]-12-u*(b.h+28),size=i%3===0?3:2;ctx.globalAlpha=.35+Math.sin(u*Math.PI)*.6;ctx.fillStyle=i%3===0?'#F5D69A':`rgb(${rgb})`;ctx.fillRect(Math.round(sx)-size,Math.round(sy),size*2+1,1);ctx.fillRect(Math.round(sx),Math.round(sy)-size,1,size*2+1);}
  ctx.restore();
}
