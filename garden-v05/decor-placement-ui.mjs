import {isDefaultDecorHidden} from './default-decor.mjs?v=24.9.84';
import {GRID_STEP,spriteGridMetrics,worldToGrid,snapGridPoint} from './garden-grid.mjs?v=24.9.84';
import {decorFootprint,sceneryGroundRect} from './garden-object-metrics.mjs?v=24.9.84';
export {decorFootprint} from './garden-object-metrics.mjs?v=24.9.84';
import {runtimeImageUrl} from './runtime-image-url.mjs?v=24.9.84';
import {GARDEN_STAGES,stageContains,keepsakeAnchorRow} from './garden-growth.mjs?v=24.9.84';
import {el,button} from './ui-utils.mjs?v=24.9.84';
import {decorFacingFor,decorFootprintRect,decorLabelFor,decorSpot,rectsOverlap} from './decor-runtime.mjs?v=24.9.84';
import {GARDEN_PATHS} from './garden-landscape.mjs?v=24.9.84';
import {DECORATION_LAYOUT,decorationPlacements,plotPhysicalBounds} from './scene-renderer.mjs?v=24.9.84';
import {earnedDecorArt} from './earned-decor-sprites.mjs?v=24.9.84';
import {WIZARD_LAYOUT,wizardTargets} from './wizard-scenery.mjs?v=24.9.84';
import {keepsakeObstacles,placementSuggestions,rectIntersects} from './decor-placement-geometry.mjs?v=24.9.84';

// Ground that is never free: the hut, trees and pond (scene `objects`), Hagrid, the greenhouse and the owl post.
// Art bible §2: a large piece keeps 0.9 tile off the fence so its body never sits on the rails.
const FENCE_CLEARANCE=0.9;
// Owner 25/10/2026: smaller pieces keep 0.4 tile off it so no sprite stands on the rails.
const SMALL_FENCE_CLEARANCE=0.4;
const PATH_CLEARANCE=0.35;
// Owner 25/10/2026: a piece may share at most this sliver of a plot, a pen or another sprite on screen, in front or behind.
const OVERLAP_SHARE=0.1;
// Screen height above the ground the crops (plots) and the fence with its creatures (pens) reach.
const PLOT_HEIGHT=48,PEN_HEIGHT=72;
const SCENE_NAMES=Object.freeze({hut:'lều Hagrid',oak:'cây sồi',pine:'cây thông',pond:'ao',gardener:'bác Hagrid',greenhouse:'nhà kính',owl:'bưu cục Cú'});

function spriteRect(asset,facing,x,y){
 const b=facing==='right'&&asset.rightBounds?asset.rightBounds:asset.bounds??{x:0,y:0,w:asset.width,h:asset.height};
 const left=x-asset.pivotX+b.x,top=y-asset.pivotY+b.y;
 return {left,top,right:left+b.w,bottom:top+b.h};
}
const area=r=>Math.max(0,r.right-r.left)*Math.max(0,r.bottom-r.top);
const overlapArea=(a,b)=>Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
const polygonArea=p=>Math.abs(p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a[0]*b[1]-b[0]*a[1];},0))/2;
/** Area of a convex polygon inside a screen rect (Sutherland–Hodgman clip, then shoelace). */
function rectPolygonOverlap(r,poly){
 let p=poly;
 for(const [axis,limit,keep] of [[0,r.left,1],[0,r.right,-1],[1,r.top,1],[1,r.bottom,-1]]){
  const out=[];
  for(let i=0;i<p.length;i++){
   const a=p[i],b=p[(i+1)%p.length],inA=(a[axis]-limit)*keep>=0,inB=(b[axis]-limit)*keep>=0;
   if(inA)out.push(a);
   if(inA!==inB){const t=(limit-a[axis])/(b[axis]-a[axis]);out.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);}
  }
  if(!(p=out).length)return 0;
 }
 return polygonArea(p);
}
/** A plot or pen base on screen: its ground diamond swept up by what stands on it. */
function groundSilhouette(g,height,iso){
 const [top,right,bottom,left]=[[g.c0,g.r0],[g.c1,g.r0],[g.c1,g.r1],[g.c0,g.r1]].map(([c,r])=>iso(c,r));
 return [[top[0],top[1]-height],[right[0],right[1]-height],right,bottom,left,[left[0],left[1]-height]];
}

function segmentRectDistance([a,b],[c,d],r){
 let best=Infinity;
 for(let i=0;i<=24;i++){const t=i/24,x=a+(c-a)*t,y=b+(d-b)*t;best=Math.min(best,Math.hypot(Math.max(r.c0-x,0,x-r.c1),Math.max(r.r0-y,0,y-r.r1)));}
 return best;
}

/** Ground a plot or pen base covers, in tiles. */
export function groundRect(kind,g,map){
 if(kind==='plot'){const b=plotPhysicalBounds(g,map);return {c0:b.col,c1:b.col+b.width,r0:b.row,r1:b.row+b.height};}
 return {c0:g.col,c1:g.col+g.width,r0:g.row,r1:g.row+g.height};
}

/** The placed store decoration standing on this ground, or null: a plot or pen may not be built over it. */
export function decorOnGround(rect,decorations){
 for(const raw of decorations?.placements??[]){
  const id=typeof raw==='object'&&raw!==null?(raw.itemId??raw.id):raw,at=id&&decorSpot(decorations,id);
  if(at&&rectsOverlap(rect,decorFootprintRect(at[0],at[1],decorFootprint(id),decorFacingFor(decorations,id))))return id;
 }
 return null;
}

/**
 * Why a decoration cannot stand with its front tile at (col, row), or '' when it can. Its whole footprint
 * (decorFootprintRect, turned with the facing) must lie on opened ground — 2×2 and larger 0.9 tile off
 * the fence — and clear built or queued plot and pen bases, earned
 * decorations, the keepsake aisle, scene objects, buildings and every other placed decoration's
 * footprint (the server checks that last rule too). Pieces larger than one tile also keep off the garden
 * paths, and with `asset` + `iso` the sprite may not stand in front of a plot or pen and hide it.
 */
export function decorSpotProblem(col,row,{map,stage,state,decorations,itemId,facing='default',asset=null,iso=null,assetOf=null}){
 // Art bible §2: 2×2 and up keep off the fence; owner 20/10/2026: they alone keep off the paths, 2×1 and 3×1 may stand on them.
 const big=decorFootprint(itemId).every(n=>n>1);
 const rect=decorFootprintRect(col,row,decorFootprint(itemId),facing);
 const inset=0.05,margin=big?FENCE_CLEARANCE:SMALL_FENCE_CLEARANCE;
 if(stage)for(const c of [rect.c0-margin+inset,(rect.c0+rect.c1)/2,rect.c1+margin-inset])for(const r of [rect.r0-margin+inset,(rect.r0+rect.r1)/2,rect.r1+margin-inset]){
  if(!stageContains(stage,c,r))return big?'Món lớn cần cách rào và đất chưa mở ít nhất 1 ô.':'Khu đất này chưa mở hoặc quá sát rào.';
 }
 const hits=(c,r,w,h)=>rectsOverlap(rect,{c0:c,c1:c+w,r0:r,r1:r+h});
 // Owner 20/10/2026: unbuilt bases are free ground; building there asks to move the piece first (decorOnGround).
 const queued=new Set((state?.construction??[]).map(j=>j.id)),built=new Set(state?.built??[]);
 const plotRects=(map?.plots??[]).filter((_,i)=>i<(state?.plots?.length??3)||queued.has('plot_'+(i+1))).map(plot=>groundRect('plot',plot,map));
 const penRects=(map?.pens??[]).filter(pen=>built.has(pen.id)||queued.has(pen.id)).map(pen=>groundRect('pen',pen,map));
 if(plotRects.some(b=>rectsOverlap(rect,b)))return 'Chỗ này là nền thửa đất.';
 if(penRects.some(b=>rectsOverlap(rect,b)))return 'Chỗ này là nền chuồng.';
 for(const id of state?.decorations??[]){const d=DECORATION_LAYOUT[id];if(d&&!isDefaultDecorHidden(decorations,id)&&hits(d.col-0.25,d.row-0.25,d.width,d.height+0.5))return 'Đã có đồ trang trí của vườn ở đây.';}
 // Saves contain all species keys, including zero counts. Reserve only the
 // occupied statue bases and the narrow museum access route; the rest of the
 // south field remains usable.
 const keepsakes=keepsakeObstacles(state,stage??GARDEN_STAGES.at(-1),iso,keepsakeAnchorRow,decorations);
 if(keepsakes.ground.some(occupied=>rectIntersects(rect,occupied)))return 'Chân đài kỷ vật đang ở đây.';
 if(keepsakes.access.some(access=>rectIntersects(rect,access)))return 'Chừa lối tham quan kỷ vật.';
 for(const o of map?.objects??[])if(!isDefaultDecorHidden(decorations,'scene:'+o.id)&&rectsOverlap(rect,sceneryGroundRect(o.id,o.col,o.row)))return 'Chỗ này vướng cảnh vật.';
 for(const w of Object.values(WIZARD_LAYOUT)){const id={gardener:'gardener_friend',greenhouse:'herbology_greenhouse',owl:'owl_post'}[w.id];if(rectsOverlap(rect,sceneryGroundRect(id,w.col,w.row)))return 'Chỗ này vướng công trình.';}
 if(big)for(const path of GARDEN_PATHS)for(let i=1;i<path.length;i++)if(segmentRectDistance(path[i-1],path[i],rect)<PATH_CLEARANCE)return 'Món lớn không được chắn lối đi.';
 for(const raw of decorations?.placements??[]){
  const other=typeof raw==='object'&&raw!==null?(raw.itemId??raw.id):raw;
  if(!other||other===itemId)continue;
  const at=decorSpot(decorations,other);
  if(at&&rectsOverlap(rect,decorFootprintRect(at[0],at[1],decorFootprint(other),decorFacingFor(decorations,other))))return 'Chồng lên món trang trí khác.';
 }
 // Screen overlap, owner 25/10/2026: the sprite may neither hide nor be hidden by a plot, a pen, scenery or another piece.
 if(asset&&iso){
  const [x,y]=iso(col,row),mine=spriteRect(asset,facing,x,y),mineArea=area(mine);
  const grounds=[...plotRects.map(g=>groundSilhouette(g,PLOT_HEIGHT,iso)),...penRects.map(g=>groundSilhouette(g,PEN_HEIGHT,iso))];
  if(grounds.some(poly=>rectPolygonOverlap(mine,poly)>OVERLAP_SHARE*Math.min(mineArea,polygonArea(poly))))return 'Món này sẽ chồng lên thửa đất hoặc chuồng.';
  const others=[];
  // Like the renderer: oak and pine anchors are not drawn (the forest layers own the trees).
  for(const o of map?.objects??[]){const prop=!isDefaultDecorHidden(decorations,'scene:'+o.id)&&!['oak','pine'].includes(o.id)&&map.props?.find(p=>p.id===o.id);if(prop){const [ox2,oy2]=iso(o.col,o.row);others.push([SCENE_NAMES[o.id]||'cảnh vật',spriteRect(prop,'default',ox2,oy2)]);}}
  // The cottage corner is drawn 150×75 px at iso(-2, 5.5), see scene-renderer drawObject.
  {const [cx,cy]=iso(-2,5.5);others.push([SCENE_NAMES.hut,{left:cx-75,top:cy-67,right:cx+75,bottom:cy+8}]);}
  for(const w of wizardTargets(iso))others.push([SCENE_NAMES[w.id]||'công trình',w.bounds]);
  const rotations=state?.decorationRotations??{};
  for(const d of decorationPlacements(map))if(state?.decorations?.includes(d.id)&&!isDefaultDecorHidden(decorations,d.id)){
   const art=earnedDecorArt(d.id,rotations[d.id]==='right'?'right':'default');
   if(art)others.push(['đồ trang trí của vườn',spriteRect({pivotX:48,pivotY:96,...art},'default',d.xy[0],d.xy[1])]);
  }
  for(const raw of decorations?.placements??[]){
   const other=typeof raw==='object'&&raw!==null?(raw.itemId??raw.id):raw,otherAsset=other&&other!==itemId&&assetOf?.(other),spot=otherAsset&&decorSpot(decorations,other);
   if(spot){const [ox2,oy2]=iso(spot[0],spot[1]);others.push([decorLabelFor(otherAsset),spriteRect(otherAsset,decorFacingFor(decorations,other),ox2,oy2)]);}
  }
  for(const [index,screen] of keepsakes.screen.entries())others.push([`đài kỷ vật ${index+1}`,screen]);
  for(const [name,rect] of others)if(overlapArea(mine,rect)>OVERLAP_SHARE*Math.min(mineArea,area(rect)))return `Chỗ này chồng lên ${name}.`;
 }
 return '';
}

/** Every half-tile foot spot on opened ground, with whether the item (in this facing) may stand there. */
export function decorSpotGrid(stage,problemAt){
 const list=[];
 if(!stage)return list;
 for(let row=-1;row<=stage.bottom;row+=GRID_STEP)for(let col=-5;col<=stage.right;col+=GRID_STEP)if(stageContains(stage,col,row))list.push({at:[col,row],ok:!problemAt([col,row])});
 return list;
}
const nearestFree=(grid,[col,row],reach)=>{
 let best=null,bd=reach;
 for(const g of grid)if(g.ok){const d=Math.hypot(g.at[0]-col,g.at[1]-row);if(d<=bd){bd=d;best=g.at;}}
 return best;
};

/**
 * Đặt trang trí: a small bar over the dock, the garden stays in view. The ground shows where the item
 * fits (green) and where it cannot stand (grey). A tap moves it there — onto the nearest green spot when
 * the tap lands just off one (red with the reason otherwise) — ↻ turns it, sliding to the nearest spot
 * the turned piece fits — and «Đặt» confirms both the position and facing.
 */
export function showDecorationPlacement({item,map,assetOf,getState,getStage,getDecorations,onPlace,preview,camera,iso,onClose,setTapHandler,toWorld}){
 for(const old of document.querySelectorAll('.decor-placement,.decor-bar')){try{old.close?.();}catch{}old.remove();}
 const itemLabel=decorLabelFor(item);
 let selectedFacing=decorFacingFor(getDecorations()??{},item.id);
 // Legacy sockets sit off the half-tile grid (row 7.15) and the server only takes half-tile spots.
 const savedSpot=()=>{const s=decorSpot(getDecorations()??{},item.id);return s&&snapGridPoint(s);};
 let at=savedSpot();
 let pending=false;
 const problemAt=spot=>spot?decorSpotProblem(spot[0],spot[1],{map,stage:getStage?.(),state:getState?.(),decorations:getDecorations()??{},itemId:item.id,facing:selectedFacing,asset:item,iso,assetOf}):'';
 let grid=[];
 const regrid=()=>{grid=decorSpotGrid(getStage?.(),problemAt);};
 regrid();
 // A new item starts on the free spot nearest the middle of the opened garden.
 if(!at){const stage=getStage?.();at=nearestFree(grid,[Math.min(stage?.right??20,30)/2,Math.min(stage?.bottom??9,24)/2],Infinity);}

 const bar=el('div',{class:'decor-bar',role:'dialog','aria-labelledby':'decorPlaceTitle'});
 const thumb=el('img',{class:'decor-bar-thumb',alt:''});
 const title=el('strong',{id:'decorPlaceTitle',text:itemLabel});
 const where=el('span',{class:'decor-bar-where'});
 const size=el('span',{class:'decor-bar-size'});
 const turn=button('↻ Xoay',rotate,{class:'decor-bar-turn','aria-label':'Xoay vật phẩm'});
 const apply=button('Đặt',commit,{class:'primary decor-bar-apply'});
 const stash=button('Cất vào kho',()=>save(null),{class:'decor-bar-stash'});
 const hint=el('p',{class:'decor-bar-hint',role:'status'});
 bar.append(
  el('div',{class:'decor-bar-head'},[thumb,el('div',{class:'decor-bar-text'},[title,where,size]),button('×',close,{class:'decor-bar-close','aria-label':'Đóng'})]),
  el('div',{class:'decor-bar-row'},[turn,apply]),
  el('div',{class:'decor-bar-foot'},[hint,stash]),
 );

 const sameSpot=(a,b)=>!!a&&!!b&&a[0]===b[0]&&a[1]===b[1];

 function sync(centerCamera){
  if(at&&centerCamera&&camera&&iso){const xy=iso(at[0],at[1]);camera.centerAt(xy[0],xy[1]-50,Math.max(1.2,camera.scale?.()||1.2));}
  const problem=problemAt(at);
  preview({itemId:at?item.id:null,at,facing:selectedFacing,blocked:!!problem,grid,suggestions:placementSuggestions(grid,at,18),rect:at?decorFootprintRect(at[0],at[1],decorFootprint(item.id),selectedFacing):null});
  render(problem);
 }

 function render(problem=problemAt(at)){
  const saved=savedSpot(),savedFacing=decorFacingFor(getDecorations()??{},item.id);
  const right=selectedFacing==='right';
  const metrics=spriteGridMetrics(item,decorFootprint(item.id),selectedFacing);
  size.textContent=`${metrics.footprint.join('×')} ô · nền ${metrics.ground.width}×${metrics.ground.height} px`;
  thumb.src=runtimeImageUrl(right?(item.rightFile||item.file):item.file);
  thumb.classList.toggle('is-flipped',right&&!item.rightFile);
  const here=sameSpot(at,saved),sameFacing=selectedFacing===savedFacing;
  // Level-1 land cannot hold a 3×2 piece, and a full garden may have no room left: say so, it stays stored.
  const noRoom=!at&&!grid.some(spot=>spot.ok);
  where.textContent=!at?(noRoom?'Vườn hiện chưa có chỗ vừa món này':'Chạm chỗ trống trên vườn'):here&&sameFacing?'Đang đặt ở đây':here?'Góc mới · nhấn «Đặt»':problem||'Chỗ mới · nhấn «Đặt»';
  turn.disabled=pending;
  apply.disabled=pending||!at||!!problem||here&&sameFacing;
  apply.textContent=pending?'Đang lưu…':here&&!sameFacing?'Đặt góc này':here?'Đang ở đây':'Đặt';
  stash.hidden=!saved;stash.disabled=pending;
  if(!hint.dataset.error)hint.textContent=noRoom?'Món vẫn ở trong kho · thử ↻ góc khác, cất bớt đồ hoặc chờ vườn mở rộng':'Gợi ý xanh là chỗ gần nhất · chạm để dời · ↻ thử góc · «Đặt» để lưu';
 }

 // Turning is always a preview action. Even when the item is standing at its
 // saved spot, the user must confirm the new facing with «Đặt».
 function rotate(){
  selectedFacing=selectedFacing==='right'?'default':'right';
  regrid();
  // New pieces have no saved anchor: keep their suggestion valid even if the
  // nearest free turned spot lies farther away in a crowded garden. Existing
  // pieces retain the small local search; confirmation alone changes a save.
  const isNew=!savedSpot();
  if(at&&problemAt(at))at=nearestFree(grid,at,isNew?Infinity:2)??at;
  sync(isNew);
 }

 // Any tap is kept so plots stay untouched while placing.
 function onTap(clientX,clientY){
  const point=toWorld?.(clientX,clientY);
  if(!point||!iso)return true;
  const best={spot:snapGridPoint(worldToGrid(point.x,point.y,map))};
  at=problemAt(best.spot)?nearestFree(grid,best.spot,1)??best.spot:best.spot;delete hint.dataset.error;sync(false);
  return true;
 }

 async function save(spot){
  if(pending)return;
  pending=true;delete hint.dataset.error;render();
  try{await onPlace(item.id,spot,selectedFacing);pending=false;regrid();close();}
  catch(e){pending=false;hint.dataset.error='1';hint.textContent=e.message;render();}
 }
 function commit(){if(at&&!problemAt(at))save(at);}

 function onKey(e){if(e.key==='Escape')close();}
 function close(){
  if(pending)return;
  preview(null);
  setTapHandler?.(null);
  document.removeEventListener('keydown',onKey);
  bar.remove();
  document.body.classList.remove('placing-decor');
  onClose?.();
 }

 document.getElementById('gameShell').append(bar);
 document.body.classList.add('placing-decor');
 document.addEventListener('keydown',onKey);
 setTapHandler?.(onTap);
 sync(!!at);
 apply.focus?.({preventScroll:true});
}

export function showVisualLayoutModal({getState,getStage,E,layoutSlots,camera,iso,previewLayout,onMoveBuilding,onClose}){
 for(const old of document.querySelectorAll('dialog.decor-placement')){try{old.close();}catch{}old.remove();}
 let kind='plot';
 let selectedBuilding=0;
 let selectedSlot=null;
 let pending=false;

 const dialog=el('dialog',{class:'decor-placement visual-layout-modal','aria-labelledby':'layoutModalTitle'});
 const heading=el('div',{class:'sheet-heading'});
 const kindBar=el('div',{class:'decor-angle-buttons layout-kind-tabs',role:'group','aria-label':'Loại công trình cần đổi chỗ'});
 const buildingRow=el('div',{class:'decor-angle-buttons layout-building-tabs',role:'group','aria-label':'Chọn công trình'});
 const grid=el('div',{class:'decor-slot-grid layout-slot-grid'});
 const notice=el('p',{class:'meta',role:'status'});
 const apply=button('Chọn một nền đất',commit,{class:'primary',disabled:true});

 function close(){
  if(pending)return;
  previewLayout?.(null);
  dialog.close();
  dialog.remove();
  onClose?.();
 }

 heading.append(
  el('h2',{id:'layoutModalTitle',text:'Sắp xếp trực quan trên bản đồ'}),
  button('×',close,{'aria-label':'Đóng bảng sắp xếp'})
 );

 function slotFitsStage(slot,stage){
  if(!slot||!stage)return true;
  return stageContains(stage,slot.col-0.5,slot.row-0.5)&&stageContains(stage,slot.col+slot.width,slot.row+slot.height);
 }

 function syncPreview(centerCamera=false){
  const s=getState();
  const key=kind==='plot'?'plots':'pens';
  const total=kind==='plot'?12:6;
  const positions=s?.layout?.[key]||Array.from({length:total},(_,i)=>i);
  const currentSlot=positions[selectedBuilding]??selectedBuilding;
  const target=selectedSlot!==null?selectedSlot:currentSlot;
  const slotObj=layoutSlots?.[key]?.[target];
  if(slotObj&&centerCamera&&camera&&iso){
   const xy=iso(slotObj.col+slotObj.width/2,slotObj.row+slotObj.height/2);
   camera.centerAt(xy[0],xy[1]-30,1.35);
  }
  previewLayout?.({kind,index:selectedBuilding,sourceSlot:currentSlot,targetSlot:target});
 }

 function render(){
  const s=getState();
  const stage=getStage?.();
  const key=kind==='plot'?'plots':'pens';
  // Thửa 13–18 (bậc Tận Sức) show only from level 100, like every level above 100.
  const plotTotal=(s?.level||1)>=(E?.TAN_SUC_LEVEL??100)?18:12,total=kind==='plot'?plotTotal:6;
  const builtCount=kind==='plot'?(s?.plots?.length||3):Math.floor((E?.housingCapacity?.(s)||0)/2);
  if(selectedBuilding>=Math.max(1,builtCount))selectedBuilding=0;
  const positions=s?.layout?.[key]||Array.from({length:total},(_,i)=>i);
  const currentSlot=positions[selectedBuilding]??selectedBuilding;
  if(selectedSlot===null)selectedSlot=currentSlot;

  kindBar.replaceChildren(
   button(`▦ Thửa trồng (${s?.plots?.length||3}/${plotTotal})`,()=>{kind='plot';selectedBuilding=0;selectedSlot=null;render();syncPreview(true);},{
    class:'decor-angle-btn'+(kind==='plot'?' is-active':''),
    'aria-pressed':String(kind==='plot'),
    disabled:pending,
   }),
   button(`⌂ Chuồng nuôi (${Math.floor((E?.housingCapacity?.(s)||0)/2)}/6)`,()=>{kind='pen';selectedBuilding=0;selectedSlot=null;render();syncPreview(true);},{
    class:'decor-angle-btn'+(kind==='pen'?' is-active':''),
    'aria-pressed':String(kind==='pen'),
    disabled:pending||builtCount===0&&kind==='pen',
   })
  );

  buildingRow.replaceChildren();
  if(builtCount<=0){
   buildingRow.append(el('small',{class:'meta',text:'Chưa có chuồng nuôi nào được xây. Hãy mở chuồng ở mục Xây trước.'}));
  }else{
   for(let i=0;i<builtCount;i+=1){
    const name=(kind==='plot'?'Thửa ':'Chuồng ')+(i+1);
    buildingRow.append(button(`${name} (Nền ${(positions[i]??i)+1})`,()=>{
     selectedBuilding=i;
     selectedSlot=positions[i]??i;
     syncPreview(true);
     render();
    },{
     class:'decor-angle-btn'+(selectedBuilding===i?' is-active':''),
     'aria-pressed':String(selectedBuilding===i),
     disabled:pending,
    }));
   }
  }

  grid.replaceChildren();
  for(let slotIdx=0;slotIdx<total;slotIdx+=1){
   const slotObj=layoutSlots?.[key]?.[slotIdx];
   const available=slotFitsStage(slotObj,stage);
   const requiredLv=GARDEN_STAGES.find(st=>slotFitsStage(slotObj,st))?.level||1;
   const occupantIdx=positions.indexOf(slotIdx);
   const occupantBuilt=occupantIdx>=0&&occupantIdx<builtCount;
   const occupantName=occupantBuilt?((kind==='plot'?'Thửa ':'Chuồng ')+(occupantIdx+1)):'Nền trống';
   const b=button('',()=>{
    selectedSlot=slotIdx;
    syncPreview(true);
    render();
   },{
    'aria-pressed':String(selectedSlot===slotIdx),
    disabled:pending||!available||builtCount<=0,
    'data-layout-slot':String(slotIdx),
   });
   b.append(
    el('b',{text:'Nền '+(slotIdx+1)}),
    el('span',{text:available?occupantName:`Mở cấp ${requiredLv}`}),
    el('small',{text:!available?`Khu đất chương sau`:slotIdx===currentSlot?'✦ Vị trí hiện tại':occupantBuilt?`Đổi chỗ với ${occupantName}`:'Chuyển tới nền này'})
   );
   grid.append(b);
  }

  const unchanged=selectedSlot===null||selectedSlot===currentSlot||builtCount<=0;
  const activeName=(kind==='plot'?'Thửa ':'Chuồng ')+(selectedBuilding+1);
  apply.disabled=pending||unchanged;
  apply.textContent=pending
   ?'Đang chuyển…'
   :builtCount<=0
    ?'Chưa có công trình để chuyển'
    :unchanged
     ?`${activeName} đang ở Nền ${currentSlot+1}`
     :`Chuyển ${activeName} → Nền ${selectedSlot+1}`;
 }

 async function commit(){
  if(pending||selectedSlot===null)return;
  const activeName=(kind==='plot'?'Thửa ':'Chuồng ')+(selectedBuilding+1);
  pending=true;
  render();
  try{
   await onMoveBuilding(kind,selectedBuilding,selectedSlot,`${activeName} đã chuyển sang Nền ${selectedSlot+1}.`);
   pending=false;
   syncPreview(false);
   render();
  }catch(e){
   notice.textContent=e.message;
   pending=false;
   render();
  }
 }

 dialog.append(
  heading,
  el('p',{text:'Chọn Thửa đất hoặc Chuồng nuôi rồi chạm vào nền đất trên lưới để xem trước trên bản đồ và đổi vị trí.'}),
  kindBar,
  buildingRow,
  grid,
  notice,
  apply
 );
 document.getElementById('gameShell').append(dialog);
 dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
 render();
 syncPreview(false);
 dialog.showModal();
}

