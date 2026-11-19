import {iso} from './garden-grid.mjs?v=26.27';
import {POND_LAND,stageBoundary} from './garden-growth.mjs?v=26.27';

// Scenic ground only: logical land, fences, placement and collision keep their authored grid.
export function pondMeadowOutline(stage) {
 const boundary=stageBoundary(stage);
 if(!stage.pond)return boundary;
 const {col,right,rowTop}=POND_LAND,edge=[];
 const reach=t=>.7+.48*Math.sin(t*.83)**2+.42*Math.sin(t*1.71+.6)**2;
 for(let r=-3.5;r>rowTop;r-=.55)edge.push([col-reach(r),r]);
 // Round the north corners into the two scalloped sides.
 for(let a=Math.PI;a<Math.PI*1.5;a+=Math.PI/12)edge.push([col+.8+Math.cos(a)*2.1,rowTop+.8+Math.sin(a)*2.1]);
 for(let c=col+.8;c<right-.8;c+=.55)edge.push([c,rowTop-reach(c)]);
 for(let a=-Math.PI/2;a<0;a+=Math.PI/12)edge.push([right-.8+Math.cos(a)*2.1,rowTop+.8+Math.sin(a)*2.1]);
 for(let r=rowTop+.8;r<-.5;r+=.55)edge.push([right+reach(r+5),r]);
 const start=boundary.findIndex(([c,r])=>c===col&&r===-3.5);
 return [...boundary.slice(0,start),...edge,[right,-.5],...boundary.slice(start+4)];
}

export function pondMeadowMap(map,stage) {
 if(!stage.pond)return map;
 const {col,right,rowTop}=POND_LAND;
 return {...map,terrainExtensions:[...(map.terrainExtensions??[]),{col:col-2,row:rowTop-2,width:right-col+5,height:-rowTop+3}]};
}

export function pondMeadowTrees() {
 let seed=190319;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 const trees=[],{col,right,rowTop}=POND_LAND;
 const add=(c,r,side,t)=>{
  const cluster=.5+.5*Math.sin(t*.67+side*1.9),offset=.35+cluster*.85+random()*.45;
  const id=['grove','pine','oak'][Math.floor(random()*3)];
  // Deliberately retain fractional scenic scales: nativePixelScale would collapse these to 1.
  const scale=Math.round((.58+random()*.78+cluster*.18)*20)/20;
  trees.push({id,col:c+(side===0?-offset:side===2?offset:0),row:r+(side===1?-offset:0),scale,flip:random()<.45});
 };
 for(let r=rowTop+.9;r< -4;r+=1.15+random()*.8)add(col,r,0,r);
 for(let c=col-.2;c<=right+.2;c+=.95+random()*.8)add(c,rowTop,1,c);
 for(let r=rowTop+.9;r< -1.5;r+=1.15+random()*.8)add(right,r,2,r);
 return trees;
}

export function clipToScenicStage(context, stage, scene, draw) {
  context.save?.();
  const points = pondMeadowOutline(stage).map(([col, row]) => iso(col, row, scene));
  context.beginPath();
  context.moveTo(points[0][0], points[0][1]);
  for (const [x, y] of points.slice(1)) context.lineTo(x, y);
  context.closePath();
  context.clip?.();
  try {
    draw();
  } finally {
    context.restore?.();
  }
}
