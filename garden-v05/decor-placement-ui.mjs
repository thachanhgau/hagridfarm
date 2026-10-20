import {GARDEN_STAGES,stageContains} from './garden-growth.mjs?v=24.9.55';
import {el,button} from './ui-utils.mjs?v=24.9.55';
import {decorFacingFor,decorFootprintRect,decorLabelFor,decorSpot,rectsOverlap} from './decor-runtime.mjs?v=24.9.55';
import {STORE_CATALOG} from './garden-store-catalog.mjs?v=24.9.55';
import {GARDEN_PATHS} from './garden-landscape.mjs?v=24.9.55';
import {DECORATION_LAYOUT,plotPhysicalBounds,worldToCell} from './scene-renderer.mjs?v=24.9.55';
import {WIZARD_LAYOUT,wizardTargets} from './wizard-scenery.mjs?v=24.9.55';

// Ground that is never free: the hut, trees and pond (scene `objects`), Hagrid, the greenhouse and the owl post.
const OBJECT_REACH=Object.freeze({hut:2.5,pond:2.5,oak:1,pine:1});
const snap=v=>Math.round(v*2)/2;
const FOOTPRINTS=new Map(STORE_CATALOG.filter(i=>i.kind==='decoration').map(i=>[i.id,i.footprint??[1,1]]));
export const decorFootprint=id=>FOOTPRINTS.get(id)??[1,1];
// Art bible §2: a large piece keeps 0.9 tile off the fence so its body never sits on the rails.
const FENCE_CLEARANCE=0.9;
const PATH_CLEARANCE=0.35;
// A sprite may overlap a plot or pen in front of which it stands by this many screen pixels at most.
const COVER_SLACK=12;
// Share of a sprite that may sit behind another sprite (building, tree, decoration) before it counts as hidden.
const HIDDEN_SHARE=0.4;
const SCENE_NAMES=Object.freeze({hut:'lều Hagrid',oak:'cây sồi',pine:'cây thông',pond:'ao',gardener:'bác Hagrid',greenhouse:'nhà kính',owl:'bưu cục Cú'});

function spriteRect(asset,facing,x,y){
 const b=facing==='right'&&asset.rightBounds?asset.rightBounds:asset.bounds??{x:0,y:0,w:asset.width,h:asset.height};
 const left=x-asset.pivotX+b.x,top=y-asset.pivotY+b.y;
 return {left,top,right:left+b.w,bottom:top+b.h,depth:y};
}
const area=r=>Math.max(0,r.right-r.left)*Math.max(0,r.bottom-r.top);
const overlapArea=(a,b)=>Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));

function segmentRectDistance([a,b],[c,d],r){
 let best=Infinity;
 for(let i=0;i<=24;i++){const t=i/24,x=a+(c-a)*t,y=b+(d-b)*t;best=Math.min(best,Math.hypot(Math.max(r.c0-x,0,x-r.c1),Math.max(r.r0-y,0,y-r.r1)));}
 return best;
}

/**
 * Why a decoration cannot stand with its front tile at (col, row), or '' when it can. Its whole footprint
 * (decorFootprintRect, turned with the facing) must lie on opened ground — large pieces 0.9 tile off the
 * fence — and clear plot and pen bases (built or not, so a later build never lands on it), earned
 * decorations, the keepsake aisle, scene objects, buildings and every other placed decoration's
 * footprint (the server checks that last rule too). Pieces larger than one tile also keep off the garden
 * paths, and with `asset` + `iso` the sprite may not stand in front of a plot or pen and hide it.
 */
export function decorSpotProblem(col,row,{map,stage,state,decorations,itemId,facing='default',asset=null,iso=null,assetOf=null}){
 const big=decorFootprint(itemId).some(n=>n>1);
 const rect=decorFootprintRect(col,row,decorFootprint(itemId),facing);
 const inset=0.05,margin=big?FENCE_CLEARANCE:0;
 if(stage)for(const c of [rect.c0-margin+inset,(rect.c0+rect.c1)/2,rect.c1+margin-inset])for(const r of [rect.r0-margin+inset,(rect.r0+rect.r1)/2,rect.r1+margin-inset]){
  if(!stageContains(stage,c,r))return big?'Món lớn cần cách rào và đất chưa mở ít nhất 1 ô.':'Khu đất này chưa mở.';
 }
 const hits=(c,r,w,h)=>rectsOverlap(rect,{c0:c,c1:c+w,r0:r,r1:r+h});
 const plotRects=(map?.plots??[]).map(plot=>{const b=plotPhysicalBounds(plot,map);return {c0:b.col,c1:b.col+b.width,r0:b.row,r1:b.row+b.height};});
 const penRects=(map?.pens??[]).map(pen=>({c0:pen.col-0.5,c1:pen.col-0.5+pen.width,r0:pen.row-0.5,r1:pen.row-0.5+pen.height}));
 if(plotRects.some(b=>rectsOverlap(rect,b)))return 'Chỗ này là nền thửa đất.';
 if(penRects.some(b=>rectsOverlap(rect,b)))return 'Chỗ này là nền chuồng.';
 for(const id of state?.decorations??[]){const d=DECORATION_LAYOUT[id];if(d&&hits(d.col-0.25,d.row-0.25,d.width,d.height+0.5))return 'Đã có đồ trang trí của vườn ở đây.';}
 if(Object.keys(state?.keepsakes??{}).length&&rect.r1>24.25)return 'Lối này dành cho đài kỷ vật.';
 const near=(c,r,reach)=>Math.hypot(Math.max(rect.c0-c,0,c-rect.c1),Math.max(rect.r0-r,0,r-rect.r1))<reach-0.5;
 for(const o of map?.objects??[])if(near(o.col,o.row,OBJECT_REACH[o.id]??1))return 'Chỗ này vướng cảnh vật.';
 for(const w of Object.values(WIZARD_LAYOUT))if(near(w.col,w.row,1.5))return 'Chỗ này vướng công trình.';
 if(big)for(const path of GARDEN_PATHS)for(let i=1;i<path.length;i++)if(segmentRectDistance(path[i-1],path[i],rect)<PATH_CLEARANCE)return 'Món lớn không được chắn lối đi.';
 for(const raw of decorations?.placements??[]){
  const other=typeof raw==='object'&&raw!==null?(raw.itemId??raw.id):raw;
  if(!other||other===itemId)continue;
  const at=decorSpot(decorations,other);
  if(at&&rectsOverlap(rect,decorFootprintRect(at[0],at[1],decorFootprint(other),decorFacingFor(decorations,other))))return 'Chồng lên món trang trí khác.';
 }
 // Occlusion: the sprite drawn in front of a plot or pen must not hide it.
 if(asset&&iso){
  const b=facing==='right'&&asset.rightBounds?asset.rightBounds:asset.bounds??{x:0,y:0,w:asset.width,h:asset.height};
  const [x,y]=iso(col,row),left=x-asset.pivotX+b.x,top=y-asset.pivotY+b.y,right=left+b.w,bottom=top+b.h;
  for(const g of [...plotRects,...penRects]){
   const pts=[[g.c0,g.r0],[g.c1,g.r0],[g.c1,g.r1],[g.c0,g.r1]].map(([c,r])=>iso(c,r));
   const gl=Math.min(...pts.map(p=>p[0])),gr=Math.max(...pts.map(p=>p[0])),gt=Math.min(...pts.map(p=>p[1])),gb=Math.max(...pts.map(p=>p[1]));
   const ox=Math.min(right,gr)-Math.max(left,gl),oy=Math.min(bottom,gb)-Math.max(top,gt);
   // Only ground behind the foot is hidden; a plot in front of the item draws over it instead.
   if(ox>COVER_SLACK&&oy>COVER_SLACK&&gt<y)return 'Món này sẽ che mất thửa đất hoặc chuồng phía sau.';
  }
  // Sprites drawn in depth order: whichever of two stands behind must stay mostly in view.
  const mine=spriteRect(asset,facing,x,y);
  const others=[];
  for(const o of map?.objects??[]){const prop=map.props?.find(p=>p.id===o.id);if(prop){const [ox2,oy2]=iso(o.col,o.row);others.push([SCENE_NAMES[o.id]||'cảnh vật',spriteRect(prop,'default',ox2,oy2)]);}}
  for(const w of wizardTargets(iso))others.push([SCENE_NAMES[w.id]||'công trình',{...w.bounds,depth:w.xy[1]}]);
  for(const raw of decorations?.placements??[]){
   const other=typeof raw==='object'&&raw!==null?(raw.itemId??raw.id):raw,otherAsset=other&&other!==itemId&&assetOf?.(other),spot=otherAsset&&decorSpot(decorations,other);
   if(spot){const [ox2,oy2]=iso(spot[0],spot[1]);others.push([decorLabelFor(otherAsset),spriteRect(otherAsset,decorFacingFor(decorations,other),ox2,oy2)]);}
  }
  for(const [name,rect] of others){
   const shared=overlapArea(mine,rect);
   if(!shared)continue;
   if(mine.depth<=rect.depth&&shared>HIDDEN_SHARE*area(mine))return `Chỗ này bị ${name} che mất.`;
   if(mine.depth>rect.depth&&shared>HIDDEN_SHARE*area(rect))return `Món này sẽ che mất ${name}.`;
  }
 }
 return '';
}

/**
 * Đặt trang trí: a small bar over the dock, the garden stays in view. A tap anywhere on free ground
 * moves the item there (gold mark; red with the reason where it cannot stand), ↻ turns it — saved at
 * once when it already stands there — and «Đặt» saves a new spot.
 */
export function showDecorationPlacement({item,map,assetOf,getState,getStage,getDecorations,onPlace,preview,camera,iso,onClose,setTapHandler,toWorld}){
 for(const old of document.querySelectorAll('.decor-placement,.decor-bar')){try{old.close?.();}catch{}old.remove();}
 const itemLabel=decorLabelFor(item);
 let selectedFacing=decorFacingFor(getDecorations()??{},item.id);
 let at=decorSpot(getDecorations()??{},item.id);
 let pending=false;
 const problemAt=spot=>spot?decorSpotProblem(spot[0],spot[1],{map,stage:getStage?.(),state:getState?.(),decorations:getDecorations()??{},itemId:item.id,facing:selectedFacing,asset:item,iso,assetOf}):'';
 // A new item starts on the first free spot near the middle of the opened garden.
 if(!at){
  const stage=getStage?.(),right=Math.min(stage?.right??20,30),bottom=Math.min(stage?.bottom??9,24);
  outer:for(let row=bottom/2;row<=bottom;row+=0.5)for(let col=0;col<=right;col+=0.5)if(!problemAt([col,row])){at=[col,row];break outer;}
 }

 const bar=el('div',{class:'decor-bar',role:'dialog','aria-labelledby':'decorPlaceTitle'});
 const thumb=el('img',{class:'decor-bar-thumb',alt:''});
 const title=el('strong',{id:'decorPlaceTitle',text:itemLabel});
 const where=el('span',{class:'decor-bar-where'});
 const turn=button('↻ Xoay',rotate,{class:'decor-bar-turn','aria-label':'Xoay vật phẩm'});
 const apply=button('Đặt',commit,{class:'primary decor-bar-apply'});
 const stash=button('Cất vào kho',()=>save(null),{class:'decor-bar-stash'});
 const hint=el('p',{class:'decor-bar-hint',role:'status'});
 bar.append(
  el('div',{class:'decor-bar-head'},[thumb,el('div',{class:'decor-bar-text'},[title,where]),button('×',close,{class:'decor-bar-close','aria-label':'Đóng'})]),
  el('div',{class:'decor-bar-row'},[turn,apply]),
  el('div',{class:'decor-bar-foot'},[hint,stash]),
 );

 const savedSpot=()=>decorSpot(getDecorations()??{},item.id);
 const sameSpot=(a,b)=>!!a&&!!b&&a[0]===b[0]&&a[1]===b[1];

 function sync(centerCamera){
  if(at&&centerCamera&&camera&&iso){const xy=iso(at[0],at[1]);camera.centerAt(xy[0],xy[1]-50,Math.max(1.2,camera.scale?.()||1.2));}
  const problem=problemAt(at);
  preview({itemId:at?item.id:null,at,facing:selectedFacing,blocked:!!problem,rect:at?decorFootprintRect(at[0],at[1],decorFootprint(item.id),selectedFacing):null});
  render(problem);
 }

 function render(problem=problemAt(at)){
  const saved=savedSpot(),savedFacing=decorFacingFor(getDecorations()??{},item.id);
  const right=selectedFacing==='right';
  thumb.src=right?(item.rightFile||item.file):item.file;
  thumb.classList.toggle('is-flipped',right&&!item.rightFile);
  const here=sameSpot(at,saved);
  where.textContent=!at?'Chạm chỗ trống trên vườn':here?'Đang đặt ở đây':problem||'Chỗ mới · nhấn «Đặt»';
  turn.disabled=pending;
  apply.disabled=pending||!at||!!problem||here&&selectedFacing===savedFacing;
  apply.textContent=pending?'Đang lưu…':here&&selectedFacing===savedFacing?'Đang ở đây':'Đặt';
  stash.hidden=!saved;stash.disabled=pending;
  if(!hint.dataset.error)hint.textContent='Chạm chỗ trống bất kỳ trên vườn để dời tới · ↻ để xoay';
 }

 // Standing where it is saved, a turn is saved at once; elsewhere it turns the preview until «Đặt».
 function rotate(){
  selectedFacing=selectedFacing==='right'?'default':'right';
  // A large piece turned in place may no longer fit; then it waits for a new spot like any move.
  if(sameSpot(at,savedSpot())&&!problemAt(at))save(at,true);else sync(false);
 }

 // Any tap is kept so plots stay untouched while placing.
 function onTap(clientX,clientY){
  const point=toWorld?.(clientX,clientY);
  const cell=point?worldToCell(point.x,point.y,map):null;
  if(!point||!cell||!iso)return true;
  // worldToCell rounds to whole tiles; refine to the nearest half-tile around it.
  let best=null;
  for(const dc of [-0.5,0,0.5])for(const dr of [-0.5,0,0.5]){const c=cell.col+dc,r=cell.row+dr,[x,y]=iso(c,r),d=Math.hypot(x-point.x,y-point.y);if(!best||d<best.d)best={d,spot:[snap(c),snap(r)]};}
  at=best.spot;delete hint.dataset.error;sync(false);
  return true;
 }

 async function save(spot,stay=false){
  if(pending)return;
  pending=true;delete hint.dataset.error;render();
  try{await onPlace(item.id,spot,selectedFacing);pending=false;if(stay)sync(false);else close();}
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
  const total=kind==='plot'?12:6;
  const builtCount=kind==='plot'?(s?.plots?.length||3):Math.floor((E?.housingCapacity?.(s)||0)/2);
  if(selectedBuilding>=Math.max(1,builtCount))selectedBuilding=0;
  const positions=s?.layout?.[key]||Array.from({length:total},(_,i)=>i);
  const currentSlot=positions[selectedBuilding]??selectedBuilding;
  if(selectedSlot===null)selectedSlot=currentSlot;

  kindBar.replaceChildren(
   button(`▦ Thửa trồng (${s?.plots?.length||3}/12)`,()=>{kind='plot';selectedBuilding=0;selectedSlot=null;render();syncPreview(true);},{
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

