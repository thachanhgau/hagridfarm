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
// Phase 3 «Bìa Rừng Cấm»: not a chapter (never in GARDEN_STAGES); gardenStage returns it once edge_1 is built. Level-110 land plus a
// strip east of col 33.5 (rows 5.5–25.5). Player decorations are kept out of the strip (EDGE_STRIP, decor-placement-geometry).
export const EDGE_STAGE=Object.freeze({id:8,level:260,name:'Bìa Rừng Cấm',right:33.5,edgeRight:45.5,bottom:33.5,description:'Dải Bìa Rừng: bãi chăn thả và vườn cây lâu năm.'});
export const EDGE_STRIP=Object.freeze({col:33.5,rowTop:5.5,rowBottom:25.5});
export const inEdgeStrip=(col,row)=>col>EDGE_STRIP.col&&row>=EDGE_STRIP.rowTop&&row<=EDGE_STRIP.rowBottom;
// «Bờ hồ» (owner 08/11/2026): the built pond (pond_1+) gets its own land behind the north fence, behind thửa 3–4:
// cols 15.5–28.5 × rows −11.5…−3.5, joined to the field by a fenced lane (cols 19.5–21.5) with a path. Its beds have
// their own land west of it, «Ruộng nước» (owner «tách nó ra riêng … to bằng cái hồ»): a 9×7 bed ground in cols
// 3.5–14.5 × rows −13.5…−4.5, lane cols 6.5–8.5 between thửa 1 and 2. gardenStage marks the stage {pond: true};
// player decorations stay out of both lands and lanes.
export const POND_LAND=Object.freeze({col:15.5,right:28.5,rowTop:-11.5,rowBottom:-3.5,laneLeft:19.5,laneRight:21.5});
export const BED_LAND=Object.freeze({col:3.5,right:14.5,rowTop:-13.5,rowBottom:-4.5,laneLeft:6.5,laneRight:8.5});
const inLand=(L,col,row)=>col>=L.col&&col<=L.right&&row>=L.rowTop&&row<=L.rowBottom||col>=L.laneLeft&&col<=L.laneRight&&row>L.rowBottom&&row<-.5;
export const inPondLand=(col,row)=>inLand(POND_LAND,col,row)||inLand(BED_LAND,col,row);
// The north fence (row −0.5, running east) steps out round each lane and land.
const landNotch=L=>[[L.laneLeft,-.5],[L.laneLeft,L.rowBottom],[L.col,L.rowBottom],[L.col,L.rowTop],[L.right,L.rowTop],[L.right,L.rowBottom],[L.laneRight,L.rowBottom],[L.laneRight,-.5]];
const POND_NOTCH=Object.freeze([...landNotch(BED_LAND),...landNotch(POND_LAND)]);
export function stageContains(stage,col,row){
 if(stage.pond&&inPondLand(col,row))return true;
 const edge=stage.edgeRight&&inEdgeStrip(col,row);
 const inside=Number.isFinite(col)&&Number.isFinite(row)&&col>=-5.5&&col<=(edge?stage.edgeRight:stage.right)&&row>=-.5&&row<=stage.bottom&&(col>=-.5||row<=9.5);
 if(!inside)return false;
 if(stage.id===4&&row>15.5&&col<25.5)return false;
 if(stage.id===5&&(row>21.5&&col<25.5||row>15.5&&col>20.5&&col<25.5))return false;
 return true;
}
// The north fence steps back behind the greenhouse. It is part of the land, so
// meadow, forest floor and tree clearance all follow the same line as the rail.
export const GREENHOUSE_BAY=Object.freeze([[-.5,-.5],[-.5,-3.5],[5.5,-3.5],[5.5,-.5]]);
export function stageBoundary(stage){const [nw,...rest]=stageOutline(stage);return [nw,...GREENHOUSE_BAY,...(stage.pond?POND_NOTCH:[]),...rest];}
function stageOutline(stage){
 // Every corner lies on a cell line (cells are centred on whole numbers).
 if(stage.id===8)return [[-5.5,-.5],[33.5,-.5],[33.5,5.5],[45.5,5.5],[45.5,25.5],[33.5,25.5],[33.5,33.5],[-.5,33.5],[-.5,9.5],[-5.5,9.5]];
 if(stage.id===4)return [[-5.5,-.5],[33.5,-.5],[33.5,21.5],[25.5,21.5],[25.5,15.5],[-.5,15.5],[-.5,9.5],[-5.5,9.5]];
 if(stage.id===5)return [[-5.5,-.5],[33.5,-.5],[33.5,25.5],[25.5,25.5],[25.5,15.5],[20.5,15.5],[20.5,21.5],[-.5,21.5],[-.5,9.5],[-5.5,9.5]];
 return stage.bottom===9.5?[[-5.5,-.5],[stage.right,-.5],[stage.right,9.5],[-5.5,9.5]]:
 [[-5.5,-.5],[stage.right,-.5],[stage.right,stage.bottom],[-.5,stage.bottom],[-.5,9.5],[-5.5,9.5]];
}
export function gardenStage(state={},scene={},occupiedPoints=[]){
 const level=Number(state.level)||1;
 const builtIds=(state.built??[]).map(b=>typeof b==='object'?b?.id:b);
 const stage=builtIds.includes('edge_1')?EDGE_STAGE:baseStage(state,scene,occupiedPoints,level);
 return builtIds.includes('pond_1')?Object.freeze({...stage,pond:true}):stage;
}
function baseStage(state,scene,occupiedPoints,level){
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
// Camera frame for the overview fit: phones/narrow screens keep the pre-strip frame (minimum zoom unchanged); wide screens and
// dragging use the full frame.
export function fitBounds(scene,stage,narrow){return stageWorldBounds(scene,narrow&&(stage.edgeRight||stage.pond)?GARDEN_STAGES.at(-1):stage);}
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

// Phase 3 strip layout (plan §11.2/§11.4). Ground rects are centred on these map points; ground art is drawn at iso(centre) − groundCentre.
export const EDGE_LAYOUT=Object.freeze({
 pasture:Object.freeze({file:'pasture',centre:Object.freeze([39.5,9.5])}),
 orchard:Object.freeze({file:'orchard',centre:Object.freeze([39.5,21.5])}),
 trail:Object.freeze({file:'trail',centre:Object.freeze([33.5,15])}),
 pits:Object.freeze([[36,19],[39,19],[42,19],[36,22],[39,22],[42,22]].map(p=>Object.freeze([p[0]+.5,p[1]+.5]))),
});
export const PASTURE_ROAMERS=Object.freeze(['hippogriff','thestral','unicorn','porlock']);
const PASTURE_BOX=Object.freeze({c0:35,c1:44,r0:6,r1:13});
// Roaming spot in the pasture (still inside 35–44 × 6–13): a slow Lissajous loop per animal; face right while moving to higher columns.
export function pastureSpot(seed,clock){
 const t=clock/2600+seed*2.1,cx=(PASTURE_BOX.c0+PASTURE_BOX.c1)/2,cy=(PASTURE_BOX.r0+PASTURE_BOX.r1)/2;
 return {col:cx+Math.sin(t)*3.8,row:cy+Math.sin(t*.73+seed)*2.8,facing:Math.cos(t)>0?'right':'default'};
}
// Tree art stage from the snapshot: ripe → 2 (fruit); more than 48 h to the first fruit → 0 (sapling); otherwise 1 (grown, regrowing).
export function treeStage(tree,now){
 if(!tree)return -1;
 const left=Number(tree.readyAt)-now;
 return tree.ripe||left<=0?2:left>48*3600000?0:1;
}
