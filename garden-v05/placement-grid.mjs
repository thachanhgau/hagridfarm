// Native world pixels: 2:1 stepped edges, cached once per placement change.
export const footprintPoints=(r,project)=>[[r.c0,r.r0],[r.c1,r.r0],[r.c1,r.r1],[r.c0,r.r1]].map(p=>project(...p));
export function rasterLine(from,to){
 let [x,y]=from.map(Math.round);const [endX,endY]=to.map(Math.round),points=[];
 const dx=Math.abs(endX-x),dy=-Math.abs(endY-y),sx=x<endX?1:-1,sy=y<endY?1:-1;
 let error=dx+dy;
 while(true){points.push([x,y]);if(x===endX&&y===endY)break;const twice=error*2;if(twice>=dy){error+=dy;x+=sx;}if(twice<=dx){error+=dx;y+=sy;}}
 return points;
}
function edge(ctx,from,to,color,shadow=false){
 const points=rasterLine(from,to);
 if(shadow){ctx.fillStyle='#142620';for(const [x,y]of points)ctx.fillRect(x,y+1,1,1);}
 ctx.fillStyle=color;for(const [x,y]of points)ctx.fillRect(x,y,1,1);
}
function polygon(ctx,points,color){
 ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=color;ctx.fill();
}
function footprint(ctx,rect,project,fits){
 const corners=footprintPoints(rect,project);
 polygon(ctx,corners,fits?'rgba(176,189,103,.14)':'rgba(199,91,75,.18)');
 for(let c=rect.c0+1;c<rect.c1;c++)edge(ctx,project(c,rect.r0),project(c,rect.r1),fits?'#71934B':'#8B4A3F');
 for(let r=rect.r0+1;r<rect.r1;r++)edge(ctx,project(rect.c0,r),project(rect.c1,r),fits?'#71934B':'#8B4A3F');
 for(let i=0;i<4;i++)edge(ctx,corners[i],corners[(i+1)%4],fits?'#D6D8BF':'#C75B4B',true);
 for(const [x,y]of corners){ctx.fillStyle='#142620';ctx.fillRect(Math.round(x)-2,Math.round(y)-2,5,5);ctx.fillStyle=fits?'#D6D8BF':'#C75B4B';ctx.fillRect(Math.round(x)-1,Math.round(y)-1,3,3);}
 // A small pixel check/cross adds a shape cue, independently of the colour.
 const mark=fits?['......x','.....xx','x...xx.','xx.xx..','.xxx...','..x....']:['xx...xx','.xx.xx.','..xxx..','...x...','..xxx..','.xx.xx.','xx...xx'];
 const [cx,cy]=project(rect.c1,rect.r1);ctx.fillStyle=fits?'#D6D8BF':'#C75B4B';
 mark.forEach((row,y)=>[...row].forEach((p,x)=>{if(p==='x')ctx.fillRect(Math.round(cx)+x-3,Math.round(cy)+y+5,1,1);}));
}
let cached=null;
export function drawPlacementGrid(context,preview,project){
 if(!preview?.rect)return;
 if(cached?.preview!==preview||cached.project!==project||cached.owner!==context.canvas){
  const r=preview.rect;
  // Main cell centres stay at integer garden coordinates, even in fine mode.
  const board={c0:Math.floor(r.c0)-1.5,c1:Math.ceil(r.c1)+1.5,r0:Math.floor(r.r0)-1.5,r1:Math.ceil(r.r1)+1.5};
  const points=footprintPoints(board,project);
  const left=Math.floor(Math.min(...points.map(p=>p[0])))-3,top=Math.floor(Math.min(...points.map(p=>p[1])))-3;
  const layer=context.canvas.ownerDocument.createElement('canvas');
  layer.width=Math.ceil(Math.max(...points.map(p=>p[0])))-left+5;
  layer.height=Math.ceil(Math.max(...points.map(p=>p[1])))-top+15;
  const ctx=layer.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.translate(-left,-top);
  ctx.globalAlpha=.55;
  for(let c=board.c0;c<=board.c1;c++)edge(ctx,project(c,board.r0),project(c,board.r1),'#777044');
  for(let row=board.r0;row<=board.r1;row++)edge(ctx,project(board.c0,row),project(board.c1,row),'#777044');
  ctx.globalAlpha=.65;ctx.fillStyle='#B0BD67';
  for(const g of preview.suggestions||[]){if(!g.ok)continue;const [x,y]=project(...g.at);ctx.fillRect(Math.round(x)-1,Math.round(y)-1,3,2);}
  ctx.globalAlpha=1;footprint(ctx,r,project,!preview.blocked);
  cached={preview,project,owner:context.canvas,layer,left,top};
 }
 context.save();context.imageSmoothingEnabled=false;context.drawImage(cached.layer,cached.left,cached.top);context.restore();
}
