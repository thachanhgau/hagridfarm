// Visual land chapters only. Building prices, unlocks, saves and slots stay engine-owned.
export const GARDEN_STAGES=Object.freeze([
 {id:1,level:1,name:'Sân nhỏ bên lều',right:20.5,bottom:9.5,description:'Lều Hagrid và ba thửa khởi đầu, nép trong rừng.'},
 {id:2,level:10,name:'Khoảng sân sinh vật',right:33.5,bottom:9.5,description:'Mở lối sang khu nuôi đầu tiên và khoảng đất phía đông.'},
 {id:3,level:24,name:'Vườn thảo dược',right:33.5,bottom:15.5,description:'Nới hàng rào về phía nam, thêm một dải đất trồng và góc nghỉ.'},
 {id:4,level:48,name:'Trang trại bìa rừng',right:33.5,bottom:21.5,description:'Đường vườn đi sâu hơn, dành chỗ cho các thửa và chuồng tiếp theo.'},
 {id:5,level:72,name:'Miền sinh vật kỳ thú',right:33.5,bottom:25.5,description:'Mở gần trọn khu đất, đón các sinh vật lớn và những mùa vụ cuối.'},
 {id:6,level:100,name:'Đại khu vườn Hagrid',right:33.5,bottom:28.5,description:'Mở cánh đất cuối cho thửa thứ mười hai và hoàn thiện sân kỷ vật.'},
 {id:7,level:110,name:'Cánh đồng Tận Sức',right:33.5,bottom:33.5,description:'Bậc Tận Sức: rào lùi về phía nam, thêm một hàng sáu thửa (13 đến 18).'},
].map(Object.freeze));
export function stageContains(stage,col,row){
 const inside=Number.isFinite(col)&&Number.isFinite(row)&&col>=-5.5&&col<=stage.right&&row>=-.5&&row<=stage.bottom&&(col>=-.5||row<=9.5);
 if(!inside)return false;
 if(stage.id===4&&row>15.5&&col<25.5)return false;
 if(stage.id===5&&(row>21.5&&col<25.5||row>15.5&&col>20.5&&col<25.5))return false;
 return true;
}
// The north fence steps back behind the greenhouse. It is part of the land, so
// meadow, forest floor and tree clearance all follow the same line as the rail.
export const GREENHOUSE_BAY=Object.freeze([[-.5,-.5],[-.5,-3.5],[5.5,-3.5],[5.5,-.5]]);
export function stageBoundary(stage){const [nw,...rest]=stageOutline(stage);return [nw,...GREENHOUSE_BAY,...rest];}
function stageOutline(stage){
 // Every corner lies on a cell line (cells are centred on whole numbers).
 if(stage.id===4)return [[-5.5,-.5],[33.5,-.5],[33.5,21.5],[25.5,21.5],[25.5,15.5],[-.5,15.5],[-.5,9.5],[-5.5,9.5]];
 if(stage.id===5)return [[-5.5,-.5],[33.5,-.5],[33.5,25.5],[25.5,25.5],[25.5,15.5],[20.5,15.5],[20.5,21.5],[-.5,21.5],[-.5,9.5],[-5.5,9.5]];
 return stage.bottom===9.5?[[-5.5,-.5],[stage.right,-.5],[stage.right,9.5],[-5.5,9.5]]:
 [[-5.5,-.5],[stage.right,-.5],[stage.right,stage.bottom],[-.5,stage.bottom],[-.5,9.5],[-5.5,9.5]];
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
 for(let r=0;r<34;r+=2.5)for(let c=0;c<33;c+=2.5){
  const col=c+Math.sin(c*3+r)*.3,row=r+Math.cos(r*2+c)*.3;
  // Clear margin prevents the forest fringe from sitting on active plots.
  if([[-2,-2],[-2,2],[2,-2],[2,2],[0,0]].some(([x,y])=>stageContains(stage,col+x,row+y)))continue;
  if(!stageContains(GARDEN_STAGES.at(-1),col,row))continue;
  trees.push({col,row,assetId:(Math.round(c+r)%3===0?'oak':'pine')});
 }
 return trees.sort((a,b)=>(a.col+a.row)-(b.col+b.row));
}

export function keepsakeAnchorRow(stage,col){
 // Whole rows only, so the 1×1 statue base fills one cell.
 for(let row=Math.min(26,Math.floor(stage.bottom-1));row>=0;row--)if(stageContains(stage,col-.5,row)&&stageContains(stage,col+.5,row))return row;
 return 8;
}
