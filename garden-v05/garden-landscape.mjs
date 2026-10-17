// Presentation boundary is separate from scenic grass and fixed gameplay slots.
export const FARM_BOUNDARY = Object.freeze([[-5,-1],[33,-1],[33,28],[-1,28],[-1,9],[-5,9]]);
export function insideFarm(col,row) {
  return Number.isFinite(col) && Number.isFinite(row) && col >= -5 && col <= 33 && row >= -1 && row <= 28 && (col >= -1 || row <= 9);
}
export const GARDEN_PATHS = Object.freeze([
  [[-.5,4.5],[-.5,7.5],[26,7.5],[26,22.5],[16,22.5],[16,28]],
  [[-.5,7.5],[-.5,22.5],[16,22.5]],
  [[-.5,13.75],[26,13.75]],
  ...[3,9.5,16,22.5].flatMap(col=>[
    [[col,6.4],[col,7.5]],[[col,12.9],[col,13.75]],[[col,19.4],[col,22.5]],
  ]),
]);

const point=(map,col,row)=>[map.origin.x+(col-row)*map.tileWidth/2,map.origin.y+(col+row)*map.tileHeight/2];
function pixelLine(ctx,a,b,color,width=2){
  const steps=Math.max(Math.abs(b[0]-a[0]),Math.abs(b[1]-a[1]));
  ctx.fillStyle=color;
  for(let i=0;i<=steps;i++) {const t=steps?i/steps:0;ctx.fillRect(Math.round(a[0]+(b[0]-a[0])*t-width/2),Math.round(a[1]+(b[1]-a[1])*t-width/2),width,width);}
}
function pathStamp(ctx,x,y,r,color){
  ctx.fillStyle=color;
  for(let dy=-r/2;dy<=r/2;dy+=2){const half=Math.max(1,r-Math.abs(dy)*2);ctx.fillRect(Math.round(x-half),Math.round(y+dy),Math.round(half*2),2);}
}
export function drawGardenPaths(ctx,map){
  for(const path of GARDEN_PATHS) for(let i=1;i<path.length;i++){
    const a=point(map,...path[i-1]),b=point(map,...path[i]);
    const steps=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/3);
    for(let j=0;j<=steps;j++){
      const t=j/steps,x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t;
      pathStamp(ctx,x,y,17,'#4a3c2c');pathStamp(ctx,x,y,13+(j%5===0?1:0),'#777044');
      if(j%3===0){ctx.fillStyle=j%2?'#b49a66':'#5d6046';ctx.fillRect(Math.round(x+(j%7)-3),Math.round(y),3,2);}
    }
  }
}
export function createBoundaryFence(map,boundary=FARM_BOUNDARY){
  const source=Array.isArray(boundary)&&boundary.length>=3?boundary:FARM_BOUNDARY;
  // Route the north fence behind the greenhouse, leaving its glazed door clear.
  const perimeter=source.flatMap((a,index)=>{
    const b=source[(index+1)%source.length];
    return a[1]===-1&&b[1]===-1&&a[0]<=-1&&b[0]>=5
      ? [a,[-1,-1],[-1,-3],[5,-3],[5,-1]] : [a];
  });
  const southernEdge=perimeter.findIndex((a,index)=>{
    const b=perimeter[(index+1)%perimeter.length];
    return a[1]===b[1]&&a[1]>0&&Math.min(a[0],b[0])<=16&&16<Math.max(a[0],b[0]);
  });
  const pieces=[];
  perimeter.forEach((a,index)=>{
    const b=perimeter[(index+1)%perimeter.length],length=Math.abs(b[0]-a[0])+Math.abs(b[1]-a[1]),count=Math.ceil(length/1.8);
    for(let i=0;i<count;i++){
      const cellA=[a[0]+(b[0]-a[0])*i/count,a[1]+(b[1]-a[1])*i/count],cellB=[a[0]+(b[0]-a[0])*(i+1)/count,a[1]+(b[1]-a[1])*(i+1)/count];
      const pa=point(map,...cellA),pb=point(map,...cellB);
      pieces.push({kind:'boundary-fence',id:`boundary:${index}:${i}`,a:pa,b:pb,cellA,cellB,xy:[(pa[0]+pb[0])/2,Math.max(pa[1],pb[1])],lantern:i%6===0,gate:index===southernEdge&&Math.min(cellA[0],cellB[0])<=16&&16<Math.max(cellA[0],cellB[0])});
    }
  });
  return pieces;
}
export function drawBoundaryFence(ctx,piece){
  const {a,b}=piece;
  pixelLine(ctx,[a[0],a[1]+2],[b[0],b[1]+2],'#24483f',7);
  for(const h of [12,25]){
    pixelLine(ctx,[a[0],a[1]-h],[b[0],b[1]-h],'#4a3c2c',6);
    pixelLine(ctx,[a[0],a[1]-h-1],[b[0],b[1]-h-1],'#a57554',3);
    pixelLine(ctx,[a[0],a[1]-h-2],[b[0],b[1]-h-2],'#b49a66',1);
  }
  if(piece.gate){pixelLine(ctx,[a[0],a[1]-25],[b[0],b[1]-12],'#b49a66',3);pixelLine(ctx,[a[0],a[1]-12],[b[0],b[1]-25],'#a57554',3);}
  for(const [x,y] of [a,b]){
    ctx.fillStyle='#4a3c2c';ctx.fillRect(Math.round(x-4),Math.round(y-34),8,35);
    ctx.fillStyle='#a57554';ctx.fillRect(Math.round(x-2),Math.round(y-32),4,31);
    ctx.fillStyle='#b49a66';ctx.fillRect(Math.round(x-4),Math.round(y-35),8,3);
    ctx.fillStyle='#5d6046';ctx.fillRect(Math.round(x-5),Math.round(y-2),10,4);
  }
  if(piece.lantern){const [x,y]=a;ctx.fillStyle='#4a3c2c';ctx.fillRect(Math.round(x-5),Math.round(y-49),10,13);ctx.fillStyle='#e7ae73';ctx.fillRect(Math.round(x-2),Math.round(y-46),4,7);}
}
export function drawMeadowDetails(ctx,map,reserved=[],drawCluster=null){
  if(!ctx||!map)return {clumps:0,flowers:0,bushes:0};
  let seed=7301;
  const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
  const areas=[...(map.plots??[]),...(map.pens??[]),...reserved].filter(area=>Number.isFinite(area?.col)&&Number.isFinite(area?.row));
  const props=map.objects??[];
  const grassAreas=[
    {col:0,row:0,width:Number(map.columns)||0,height:Number(map.rows)||0},
    ...(map.terrainExtensions??[]),
  ].filter(area=>Number.isFinite(area?.col)&&Number.isFinite(area?.row)&&Number(area.width)>0&&Number(area.height)>0);
  const inGrass=(col,row)=>grassAreas.some(area=>col>area.col-.5&&col<area.col+area.width+.5&&row>area.row-.5&&row<area.row+area.height+.5);
  const onPath=(col,row)=>GARDEN_PATHS.some(path=>path.slice(1).some((b,index)=>{
    const a=path[index];
    return col>=Math.min(a[0],b[0])-.95&&col<=Math.max(a[0],b[0])+.95
      &&row>=Math.min(a[1],b[1])-.95&&row<=Math.max(a[1],b[1])+.95;
  }));
  const safe=(col,row)=>{
    if(onPath(col,row))return false;
    if(!insideFarm(col,row))return true;
    const occupied=areas.some(area=>col>area.col-1.1&&col<area.col+area.width+1.1&&row>area.row-1.1&&row<area.row+area.height+1.1);
    const nearProp=props.some(prop=>Math.hypot(col-prop.col,row-prop.row)<2.8);
    return !occupied&&!nearProp&&!onPath(col,row);
  };
  const tuft=(x,y,variant)=>{
    const px=Math.round(x),py=Math.round(y);
    ctx.fillStyle='#24483f';ctx.fillRect(px-6,py-2,13,3);
    ctx.fillStyle=variant%2?'#3f6a45':'#3f6a45';
    ctx.fillRect(px-4,py-6,3,5);ctx.fillRect(px+2,py-8,2,7);
    if(variant%3===0){ctx.fillStyle='#71934b';ctx.fillRect(px-1,py-6,2,2);}
  };
  const flower=(x,y,variant)=>{
    const px=Math.round(x),py=Math.round(y);
    ctx.fillStyle='#3f6a45';ctx.fillRect(px,py-7,2,7);
    ctx.fillStyle=variant%2?'#d6d8bf':'#b0bd67';ctx.fillRect(px-2,py-10,5,3);ctx.fillRect(px-1,py-12,3,2);
  };
  const bush=(x,y,variant)=>{
    const px=Math.round(x),py=Math.round(y);
    ctx.fillStyle=variant%2?'#3f6a45':'#3f6a45';
    ctx.fillRect(px-9,py-5,18,5);ctx.fillRect(px-6,py-9,9,5);ctx.fillRect(px+1,py-11,6,5);
    ctx.fillStyle='#71934b';ctx.fillRect(px-5,py-8,4,3);ctx.fillRect(px+2,py-10,3,3);
  };
  let clumps=0,flowers=0,bushes=0;
  const maxClumps=64,maxFlowers=10,maxBushes=18;
  for(let i=0;i<320&&clumps<maxClumps;i++){
    const col=-6+rand()*41,row=-3+rand()*34;
    if(!inGrass(col,row)||!safe(col,row))continue;
    const inside=insideFarm(col,row);
    if(rand()>(inside?.22:.36))continue;
    const [x,y]=point(map,col,row),kind=rand();
    const flowerDue=flowers<maxFlowers&&(kind<.14||clumps%9===4);
    const bushDue=bushes<maxBushes&&(kind<.36||clumps%7===2);
    if(flowerDue){flower(x,y,flowers++);}
    else if(bushDue){bush(x,y,bushes++);}
    else {
      const count=1+Math.floor(rand()*3);
      for(let n=0;n<count;n++)tuft(x+(rand()-.5)*16,y+(rand()-.5)*8,n+i);
    }
    clumps++;
  }
  // A handful of composed clusters in open lawn, also checked against every
  // future build footprint. All leaves/petals retain a generous clear margin.
  const clusters=[[-3.3,5.5],[-3,1.2],[3.2,.4],[6.5,22.8],[20.5,23.8],[30,25]];
  for(const [col,row] of clusters){
    if(!inGrass(col,row)||!safe(col,row))continue;
    const clusterClear=areas.every(area=>col<=area.col-1.8||col>=area.col+area.width+1.8||row<=area.row-1.8||row>=area.row+area.height+1.8);
    if(!clusterClear)continue;
    const [x,y]=point(map,col,row);
    if(drawCluster){drawCluster(x,y,clumps);flowers+=3;clumps++;continue;}
    bush(x-8,y+1,bushes++);bush(x+5,y+4,bushes++);
    for(const [dx,dy] of [[-15,3],[3,-3],[14,7]])flower(x+dx,y+dy,flowers++);
    clumps++;
  }
  return {clumps,flowers,bushes};
}
