// Visual land chapters only. Building prices, unlocks, saves and slots stay engine-owned.
export const GARDEN_STAGES=Object.freeze([
 {id:1,level:1,name:'Sân nhỏ bên lều',right:20.5,bottom:9,description:'Lều Hagrid và ba thửa khởi đầu, nép trong rừng.'},
 {id:2,level:10,name:'Khoảng sân sinh vật',right:33,bottom:9,description:'Mở lối sang khu nuôi đầu tiên và khoảng đất phía đông.'},
 {id:3,level:24,name:'Vườn thảo dược',right:33,bottom:15.5,description:'Nới hàng rào về phía nam, thêm một dải đất trồng và góc nghỉ.'},
 {id:4,level:48,name:'Trang trại bìa rừng',right:33,bottom:21,description:'Đường vườn đi sâu hơn, dành chỗ cho các thửa và chuồng tiếp theo.'},
 {id:5,level:72,name:'Miền sinh vật kỳ thú',right:33,bottom:25,description:'Mở gần trọn khu đất, đón các sinh vật lớn và những mùa vụ cuối.'},
 {id:6,level:100,name:'Đại khu vườn Hagrid',right:33,bottom:28,description:'Mở cánh đất cuối cho thửa thứ mười hai và hoàn thiện sân kỷ vật.'},
].map(Object.freeze));
export function stageContains(stage,col,row){
 const inside=Number.isFinite(col)&&Number.isFinite(row)&&col>=-5&&col<=stage.right&&row>=-1&&row<=stage.bottom&&(col>=-1||row<=9);
 if(!inside)return false;
 if(stage.id===4&&row>15.5&&col<26)return false;
 if(stage.id===5&&(row>21&&col<26||row>15.5&&col>20.5&&col<26))return false;
 return true;
}
export function stageBoundary(stage){
 if(stage.id===4)return [[-5,-1],[33,-1],[33,21],[26,21],[26,15.5],[-1,15.5],[-1,9],[-5,9]];
 if(stage.id===5)return [[-5,-1],[33,-1],[33,25],[26,25],[26,15.5],[20.5,15.5],[20.5,21],[-1,21],[-1,9],[-5,9]];
 return stage.bottom===9?[[-5,-1],[stage.right,-1],[stage.right,9],[-5,9]]:
 [[-5,-1],[stage.right,-1],[stage.right,stage.bottom],[-1,stage.bottom],[-1,9],[-5,9]];
}
export function gardenStage(state={},scene={},occupiedPoints=[]){
 const level=Number(state.level)||1;
 let index=GARDEN_STAGES.findLastIndex(s=>s.level<=level);index=Math.max(0,index);
 // A saved layout can move an already-built plot to a later authored socket.
 // Retain visibility of those assets instead of changing or hiding the save.
 const built=new Set(state.built??[]),queued=new Set((state.construction??[]).map(j=>j.id));
 const areas=[...(scene.plots??[]).filter((p,i)=>i<(state.plots?.length??3)||p.requiredLevel<=level||queued.has('plot_'+(i+1))),...(scene.pens??[]).filter(p=>built.has(p.id)||p.requiredLevel<=level||queued.has(p.id))];
 const points=[...occupiedPoints];
 for(const p of areas)points.push([p.col-.5,p.row-.5],[p.col+p.width,p.row+p.height]);
 while(index<GARDEN_STAGES.length-1&&points.some(p=>!stageContains(GARDEN_STAGES[index],...p)))index++;
 return GARDEN_STAGES[index];
}
export function stageWorldBounds(scene,stage){
 const points=stageBoundary(stage).map(([c,r])=>[scene.origin.x+(c-r)*scene.tileWidth/2,scene.origin.y+(c+r)*scene.tileHeight/2]);
 return {left:Math.min(...points.map(p=>p[0]))-45,right:Math.max(...points.map(p=>p[0]))+45,top:Math.min(...points.map(p=>p[1]))-150,bottom:Math.max(...points.map(p=>p[1]))+45};
}
export function futureGroves(scene,stage){
 const trees=[];
 for(let r=0;r<27;r+=2.5)for(let c=0;c<33;c+=2.5){
  const col=c+Math.sin(c*3+r)*.3,row=r+Math.cos(r*2+c)*.3;
  // Clear margin prevents the forest fringe from sitting on active plots.
  if([[-2,-2],[-2,2],[2,-2],[2,2],[0,0]].some(([x,y])=>stageContains(stage,col+x,row+y)))continue;
  if(!stageContains(GARDEN_STAGES.at(-1),col,row))continue;
  trees.push({col,row,assetId:(Math.round(c+r)%3===0?'oak':'pine')});
 }
 return trees.sort((a,b)=>(a.col+a.row)-(b.col+b.row));
}

export function keepsakeAnchorRow(stage,col){
 for(let row=Math.min(26,stage.bottom-1);row>=0;row-=.5)if(stageContains(stage,col-.5,row)&&stageContains(stage,col+.5,row))return row;
 return 8;
}
