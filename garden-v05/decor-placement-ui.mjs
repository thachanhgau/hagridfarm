import {GARDEN_STAGES,stageContains} from './garden-growth.mjs?v=24.9.54';
import {el,button} from './ui-utils.mjs?v=24.9.54';
import {decorFacingFor,decorLabelFor,decorSpot} from './decor-runtime.mjs?v=24.9.54';
import {DECORATION_LAYOUT,plotPhysicalBounds,worldToCell} from './scene-renderer.mjs?v=24.9.54';
import {WIZARD_LAYOUT} from './wizard-scenery.mjs?v=24.9.54';

// Ground that is never free: the hut, trees and pond (scene `objects`), Hagrid, the greenhouse and the owl post.
const OBJECT_REACH=Object.freeze({hut:2.5,pond:2.5,oak:1,pine:1});
const snap=v=>Math.round(v*2)/2;

/**
 * Why a decoration cannot stand at (col, row), or '' when it can: outside the opened garden, on a plot
 * or pen base (built or not, so a later build never lands on it), on an earned decoration, the keepsake
 * aisle, a scene object or building, or closer than one tile to another placed decoration (the server
 * checks that last rule too).
 */
export function decorSpotProblem(col,row,{map,stage,state,decorations,itemId}){
 if(stage&&!stageContains(stage,col,row))return 'Khu đất này chưa mở.';
 const inRect=(c,r,w,h)=>col>=c-0.25&&col<=c+w-0.25&&row>=r-0.25&&row<=r+h-0.25;
 for(const plot of map?.plots??[]){const b=plotPhysicalBounds(plot,map);if(inRect(b.col,b.row,b.width,b.height))return 'Chỗ này là nền thửa đất.';}
 for(const pen of map?.pens??[])if(inRect(pen.col-0.5,pen.row-0.5,pen.width,pen.height))return 'Chỗ này là nền chuồng.';
 for(const id of state?.decorations??[]){const d=DECORATION_LAYOUT[id];if(d&&inRect(d.col,d.row,d.width,d.height+0.5))return 'Đã có đồ trang trí của vườn ở đây.';}
 if(Object.keys(state?.keepsakes??{}).length&&row>=24.25)return 'Lối này dành cho đài kỷ vật.';
 for(const o of map?.objects??[])if(Math.hypot(o.col-col,o.row-row)<(OBJECT_REACH[o.id]??1))return 'Chỗ này vướng cảnh vật.';
 for(const w of Object.values(WIZARD_LAYOUT))if(Math.hypot(w.col-col,w.row-row)<1.5)return 'Chỗ này vướng công trình.';
 for(const raw of decorations?.placements??[]){
  const other=typeof raw==='object'&&raw!==null?(raw.itemId??raw.id):raw;
  if(!other||other===itemId)continue;
  const at=decorSpot(decorations,other);
  if(at&&Math.hypot(at[0]-col,at[1]-row)<1)return 'Sát món trang trí khác quá.';
 }
 return '';
}

/**
 * Đặt trang trí: a small bar over the dock, the garden stays in view. A tap anywhere on free ground
 * moves the item there (gold mark; red with the reason where it cannot stand), ↻ turns it — saved at
 * once when it already stands there — and «Đặt» saves a new spot.
 */
export function showDecorationPlacement({item,map,getState,getStage,getDecorations,onPlace,preview,camera,iso,onClose,setTapHandler,toWorld}){
 for(const old of document.querySelectorAll('.decor-placement,.decor-bar')){try{old.close?.();}catch{}old.remove();}
 const itemLabel=decorLabelFor(item);
 let selectedFacing=decorFacingFor(getDecorations()??{},item.id);
 let at=decorSpot(getDecorations()??{},item.id);
 let pending=false;
 const problemAt=spot=>spot?decorSpotProblem(spot[0],spot[1],{map,stage:getStage?.(),state:getState?.(),decorations:getDecorations()??{},itemId:item.id}):'';
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
  preview({itemId:at?item.id:null,at,facing:selectedFacing,blocked:!!problem});
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
  if(sameSpot(at,savedSpot()))save(at,true);else sync(false);
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

