// Recover complete authored silhouettes from uneven atlas gutters. Connected
// components are assigned to their original pose; no artwork is synthesized.
export function authoredComponents(raw){
 const {data,info:{width,height}}=raw,labels=new Int32Array(width*height),queue=new Uint32Array(width*height),components=[];
 for(let start=0;start<labels.length;start++){
  if(labels[start]||data[start*4+3]<192)continue;
  const id=components.length+1;let head=0,tail=0,x0=width,y0=height,x1=-1,y1=-1;queue[tail++]=start;labels[start]=id;
  while(head<tail){const pos=queue[head++],x=pos%width,y=Math.floor(pos/width);x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=width||yy>=height)continue;const next=yy*width+xx;if(!labels[next]&&data[next*4+3]>=192){labels[next]=id;queue[tail++]=next;}}
  }
  components.push({id,x:x0,y:y0,w:x1-x0+1,h:y1-y0+1,count:tail});
 }
 return {labels,components:components.sort((a,b)=>b.count-a.count),width,height};
}
export function authoredCells(raw,rowCounts){
 const analysis=authoredComponents(raw),total=rowCounts.reduce((n,c)=>n+c,0),mains=analysis.components.slice(0,total);
 if(mains.length!==total)throw Error(`Expected${total} authored bodies, found${mains.length}`);
 const median=mains.map(c=>c.count).sort((a,b)=>a-b)[Math.floor(total/2)];
 if(mains.at(-1).count<median*.12)throw Error('An atlas pose is absent or disconnected; refusing to replace it with a small prop');
 const byY=mains.sort((a,b)=>(a.y+a.h/2)-(b.y+b.h/2)),ordered=[];let next=0;
 for(const count of rowCounts)ordered.push(...byY.slice(next,next+=count).sort((a,b)=>(a.x+a.w/2)-(b.x+b.w/2)));
 const owners=new Map(ordered.map((c,i)=>[c.id,i]));
 const distance=(a,b)=>Math.max(0,b.x-a.x-a.w,a.x-b.x-b.w)**2+Math.max(0,b.y-a.y-a.h,a.y-b.y-b.h)**2;
 for(const comp of analysis.components){if(owners.has(comp.id)||comp.count<6)continue;let best=0,score=Infinity;ordered.forEach((main,i)=>{const d=distance(comp,main);if(d<score){best=i;score=d;}});owners.set(comp.id,best);}
 const boxes=ordered.map(main=>({...main}));
 for(const comp of analysis.components){const owner=owners.get(comp.id);if(owner===undefined)continue;const b=boxes[owner],right=Math.max(b.x+b.w,comp.x+comp.w),bottom=Math.max(b.y+b.h,comp.y+comp.h);b.x=Math.min(b.x,comp.x);b.y=Math.min(b.y,comp.y);b.w=right-b.x;b.h=bottom-b.y;}
 return boxes.map((box,index)=>{const data=Buffer.alloc(box.w*box.h*4);for(let y=box.y;y<box.y+box.h;y++)for(let x=box.x;x<box.x+box.w;x++){const pos=y*analysis.width+x;if(owners.get(analysis.labels[pos])===index)raw.data.copy(data,((y-box.y)*box.w+x-box.x)*4,pos*4,pos*4+4);}const main=ordered[index];return {data,width:box.w,height:box.h,bounds:{x:0,y:0,w:box.w,h:box.h,count:box.count},mainBounds:{...main,x:main.x-box.x,y:main.y-box.y},sourceRect:{x:box.x,y:box.y,w:box.w,h:box.h},rect:{x:box.x,y:box.y,w:box.w,h:box.h}};});
}
