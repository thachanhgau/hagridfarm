import {createPlacementInput} from './placement-input.mjs?v=24.9.90';
import {isDefaultDecorHidden,decorationPlacements,defaultDecorFootprint,defaultDecorSpot} from './default-decor.mjs?v=24.9.90';
import {GRID_STEP,spriteGridMetrics,worldToGrid} from './garden-grid.mjs?v=24.9.90';
import {decorFootprint,sceneryGroundRect} from './garden-object-metrics.mjs?v=24.9.90';
export {decorFootprint} from './garden-object-metrics.mjs?v=24.9.90';
import {runtimeImageUrl} from './runtime-image-url.mjs?v=24.9.90';
import {GARDEN_STAGES,stageContains,keepsakeAnchorRow} from './garden-growth.mjs?v=24.9.90';
import {el,button} from './ui-utils.mjs?v=24.9.90';
import {decorFacingFor,decorFootprintRect,decorLabelFor,decorSpot,rectsOverlap,snapDecorSpot} from './decor-runtime.mjs?v=24.9.90';
import {GARDEN_PATHS} from './garden-landscape.mjs?v=24.9.90';
import {plotPhysicalBounds} from './scene-renderer.mjs?v=24.9.90';
import {KEEPSAKE_ART} from './complete-object-art.mjs?v=24.9.90';
import {earnedDecorArt} from './earned-decor-sprites.mjs?v=24.9.90';
import {WIZARD_LAYOUT} from './wizard-scenery.mjs?v=24.9.90';
import {keepsakeDisplayPlacements,keepsakeObstacles,placementSuggestions,rectIntersects} from './decor-placement-geometry.mjs?v=24.9.90';

// Ground that is never free: the hut, trees and pond (scene `objects`), Hagrid, the greenhouse and the owl post.
// Art bible §2: a large piece keeps 0.9 tile off the fence so its body never sits on the rails.
const FENCE_CLEARANCE=0.9;
// Owner 25/10/2026: smaller pieces keep 0.4 tile off it so no sprite stands on the rails.
const SMALL_FENCE_CLEARANCE=0.4;
// Paths are one cell wide (centre ± half a cell): a large piece may touch one, never cover it.
const PATH_CLEARANCE=0.5;
// Owner 27/10/2026: only the ground decides. A piece may stand in front of or behind another sprite (the
// renderer sorts by depth); the 25/10 screen-overlap rule left a full garden ~5× fewer free cells.
// The cottage corner is art without a scene object; its ground sits under iso(-2, 5.5).
const COTTAGE_GROUND=Object.freeze({c0:-3.5,c1:-1.5,r0:3.5,r1:5.5});

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
 * paths. Sprites may overlap on screen; only the ground decides.
 */
export function decorSpotProblem(col,row,{map,stage,state,decorations,itemId,facing='default',footprint=decorFootprint(itemId)}){
 // Art bible §2: 2×2 and up keep off the fence; owner 20/10/2026: they alone keep off the paths, 2×1 and 3×1 may stand on them.
 const big=footprint.every(n=>n>1);
 const rect=decorFootprintRect(col,row,footprint,facing);
 const inset=0.05,margin=big?FENCE_CLEARANCE:SMALL_FENCE_CLEARANCE;
 if(stage)for(const c of [rect.c0-margin+inset,(rect.c0+rect.c1)/2,rect.c1+margin-inset])for(const r of [rect.r0-margin+inset,(rect.r0+rect.r1)/2,rect.r1+margin-inset]){
  if(!stageContains(stage,c,r))return big?'Món lớn cần cách rào và đất chưa mở ít nhất 1 ô.':'Khu đất này chưa mở hoặc quá sát rào.';
 }
 // Owner 20/10/2026: unbuilt bases are free ground; building there asks to move the piece first (decorOnGround).
 const queued=new Set((state?.construction??[]).map(j=>j.id)),built=new Set(state?.built??[]);
 const plotRects=(map?.plots??[]).filter((_,i)=>i<(state?.plots?.length??3)||queued.has('plot_'+(i+1))).map(plot=>groundRect('plot',plot,map));
 const penRects=(map?.pens??[]).filter(pen=>built.has(pen.id)||queued.has(pen.id)).map(pen=>groundRect('pen',pen,map));
 if(plotRects.some(b=>rectsOverlap(rect,b)))return 'Chỗ này là nền thửa đất.';
 if(penRects.some(b=>rectsOverlap(rect,b)))return 'Chỗ này là nền chuồng.';
 // Garden defaults stand where the member moved them; the piece being moved never blocks itself.
 const earned=decorationPlacements(map,decorations,state?.decorationRotations).filter(d=>d.id!==itemId&&state?.decorations?.includes(d.id)&&!isDefaultDecorHidden(decorations,d.id));
 for(const d of earned)if(rectsOverlap(rect,decorFootprintRect(...d.at,d.footprint,d.facing)))return 'Đã có đồ trang trí của vườn ở đây.';
 // Saves contain all species keys, including zero counts. Reserve only the
 // occupied statue bases and the narrow museum access route; the rest of the
 // south field remains usable.
 const keepsakes=keepsakeObstacles(state,stage??GARDEN_STAGES.at(-1),null,keepsakeAnchorRow,decorations,itemId);
 if(keepsakes.ground.some(occupied=>rectIntersects(rect,occupied)))return 'Chân đài kỷ vật đang ở đây.';
 if(keepsakes.access.some(access=>rectIntersects(rect,access)))return 'Chừa lối tham quan kỷ vật.';
 const scenery=(map?.objects??[]).filter(o=>'scene:'+o.id!==itemId&&!isDefaultDecorHidden(decorations,'scene:'+o.id)).map(o=>({...o,at:defaultDecorSpot(decorations,'scene:'+o.id)??[o.col,o.row]}));
 // The pond is a garden default: its ground follows the decoration rule, like when it is moved.
 for(const o of scenery)if(rectsOverlap(rect,o.id==='pond'?decorFootprintRect(...o.at,defaultDecorFootprint('scene:pond')):sceneryGroundRect(o.id,...o.at)))return 'Chỗ này vướng cảnh vật.';
 if(rectsOverlap(rect,COTTAGE_GROUND))return 'Chỗ này vướng lều Hagrid.';
 for(const w of Object.values(WIZARD_LAYOUT)){const id={gardener:'gardener_friend',greenhouse:'herbology_greenhouse',owl:'owl_post'}[w.id];if(rectsOverlap(rect,sceneryGroundRect(id,w.col,w.row)))return 'Chỗ này vướng công trình.';}
 if(big)for(const path of GARDEN_PATHS)for(let i=1;i<path.length;i++)if(segmentRectDistance(path[i-1],path[i],rect)<PATH_CLEARANCE)return 'Món lớn không được chắn lối đi.';
 for(const raw of decorations?.placements??[]){
  const other=typeof raw==='object'&&raw!==null?(raw.itemId??raw.id):raw;
  if(!other||other===itemId)continue;
  const at=decorSpot(decorations,other);
  if(at&&rectsOverlap(rect,decorFootprintRect(at[0],at[1],decorFootprint(other),decorFacingFor(decorations,other))))return 'Chồng lên món trang trí khác.';
 }
 return '';
}

/** Every foot spot on opened ground whose footprint fills whole cells (`snap`), and whether the item may stand there. */
export function decorSpotGrid(stage,problemAt,snap=at=>at){
 const list=[];
 if(!stage)return list;
 for(let row=-1;row<=stage.bottom;row+=GRID_STEP)for(let col=-5;col<=stage.right;col+=GRID_STEP){
  const [c,r]=snap([col,row]);
  if(c===col&&r===row&&stageContains(stage,col,row))list.push({at:[col,row],ok:!problemAt([col,row])});
 }
 return list;
}

/** Authored spot of a garden default before any move (a turned earned piece stepped onto whole cells). */
export function defaultDecorHome(id,map,stage,rotations={}){
 if(id==='scene:pond'){const o=map?.objects?.find(o=>o.id==='pond');return o?[o.col,o.row]:null;}
 if(id.startsWith('keepsake:'))return keepsakeDisplayPlacements(stage??GARDEN_STAGES.at(-1),keepsakeAnchorRow).find(p=>p.species===id.slice(9))?.anchor??null;
 return decorationPlacements(map,null,rotations).find(d=>d.id===id)?.at??null;
}

/** Art and ground size of a garden default (pond, earned decoration, keepsake statue) for the placement bar. */
export function defaultDecorItem(id,label,map){
 const art=id==='scene:pond'?map?.props?.find(p=>p.id==='pond'):id.startsWith('keepsake:')?KEEPSAKE_ART[id.slice(9)]:earnedDecorArt(id);
 return {...art,id,label,isDefault:true,footprint:defaultDecorFootprint(id)};
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
export function showDecorationPlacement({item,map,assetOf,getState,getStage,getDecorations,onPlace,preview,camera,iso,onClose,setTapHandler,toWorld,getSpot=null,startAt=null,facing=null}){
 for(const old of document.querySelectorAll('.decor-placement,.decor-bar')){try{old.close?.();}catch{}old.remove();}
 const itemLabel=decorLabelFor(item);
 // Garden defaults carry their own ground size; bought pieces use their catalog footprint.
 const footprint=item.footprint??decorFootprint(item.id);
 let selectedFacing=facing??decorFacingFor(getDecorations()??{},item.id);
 const savedSpot=()=>getSpot?getSpot():decorSpot(getDecorations()??{},item.id);
 // Owner 27/10/2026: a piece always covers whole cells. Legacy sockets (row 7.15) and older half-tile saves
 // open on the nearest whole-cell spot; «Đặt» then saves it there.
 const snap=spot=>snapDecorSpot(spot,footprint,selectedFacing);
 let at=(savedSpot()||startAt)&&snap(savedSpot()||startAt);
 let pending=false,input;
 const problemAt=spot=>spot?decorSpotProblem(spot[0],spot[1],{map,stage:getStage?.(),state:getState?.(),decorations:getDecorations()??{},itemId:item.id,facing:selectedFacing,footprint}):'';
 let grid=[];
 const regrid=()=>{grid=decorSpotGrid(getStage?.(),problemAt,snap);};
 regrid();
 // A new item starts on the free spot nearest the middle of the opened garden.
 if(at&&problemAt(at)&&!savedSpot())at=nearestFree(grid,at,Infinity)??at;
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
  preview({itemId:at?item.id:null,at,facing:selectedFacing,blocked:!!problem,grid,suggestions:placementSuggestions(grid,at,18),rect:at?decorFootprintRect(at[0],at[1],footprint,selectedFacing):null});
  render(problem);
 }

 function render(problem=problemAt(at)){
  const saved=savedSpot(),savedFacing=decorFacingFor(getDecorations()??{},item.id);
  const right=selectedFacing==='right';
  const metrics=spriteGridMetrics(item,footprint,selectedFacing);
  size.textContent=`Chiếm ${metrics.footprint.join('×')} ô · kéo món đồ hoặc dùng nút dịch`;
  bar.dataset.col=at?.[0]??'';bar.dataset.row=at?.[1]??'';bar.dataset.facing=selectedFacing;bar.dataset.blocked=String(!!problem);input?.refresh();
  thumb.src=runtimeImageUrl(right?(item.rightFile||item.file):item.file);
  thumb.classList.toggle('is-flipped',right&&!item.rightFile);
  const here=sameSpot(at,saved),sameFacing=selectedFacing===savedFacing;
  // Level-1 land cannot hold a 3×2 piece, and a full garden may have no room left: say so, it stays stored.
  const noRoom=!at&&!grid.some(spot=>spot.ok);
  where.textContent=!at?(noRoom?'Vườn hiện chưa có chỗ vừa món này':'Chạm chỗ trống trên vườn'):here&&sameFacing?'Đang đặt ở đây':here?'Góc mới · nhấn «Đặt»':problem||'Chỗ mới · nhấn «Đặt»';
  turn.disabled=pending;turn.hidden=!!item.isDefault&&!item.rightFile;
  apply.disabled=pending||!at||!!problem||here&&sameFacing;
  apply.textContent=pending?'Đang lưu…':here&&!sameFacing?'Đặt góc này':here?'Đang ở đây':'Đặt';
  stash.hidden=!saved;stash.disabled=pending;
  if(!hint.dataset.error)hint.textContent=noRoom?'Món vẫn ở trong kho · thử ↻ góc khác, cất bớt đồ hoặc chờ vườn mở rộng':'Kéo món đồ hoặc chạm đất · mũi tên để dịch · R xoay · Enter đặt · Esc hủy';
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
  if(at)at=snap(at);
  if(at&&problemAt(at))at=nearestFree(grid,at,isNew?Infinity:2)??at;
  sync(isNew);
 }


 async function save(spot){
  if(pending)return;
  pending=true;delete hint.dataset.error;render();
  try{await onPlace(item.id,spot,selectedFacing);pending=false;regrid();close();}
  catch(e){pending=false;hint.dataset.error='1';hint.textContent=e.message;render();}
 }
 function commit(){if(at&&!problemAt(at))save(at);}

 function close(){
  if(pending)return;
  preview(null);
  setTapHandler?.(null);
  input?.dispose();
  bar.remove();
  document.body.classList.remove('placing-decor');
  onClose?.();
 }

 document.getElementById('gameShell').append(bar);
 document.body.classList.add('placing-decor');
 input=createPlacementInput({map,item,project:iso,toWorld,getAt:()=>at,getFacing:()=>selectedFacing,getPending:()=>pending,rotate,commit,close,snap,moveAt:(spot,kind)=>{
  const next=kind==='tap'&&problemAt(spot)?nearestFree(grid,spot,1)??spot:spot;
  if(at&&at[0]===next[0]&&at[1]===next[1])return;
  at=next;delete hint.dataset.error;sync(false);
 }});
 bar.querySelector('.decor-bar-row').insertBefore(input.tools,apply);
 setTapHandler?.(input.onTap);
 sync(!!at);
 (apply.disabled?input.tools.firstElementChild:apply).focus?.({preventScroll:true});
}

export function showVisualLayoutModal({getState,getStage,E,layoutSlots,camera,iso,previewLayout,onMoveBuilding,onClose}){
 for(const old of document.querySelectorAll('dialog.decor-placement')){try{old.close();}catch{}old.remove();}
 let kind='plot';
 let selectedBuilding=0;
 let selectedSlot=null;
 let pending=false,input;

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

