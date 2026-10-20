import {GARDEN_STAGES,stageContains} from './garden-growth.mjs?v=24.9.53';
import {el,button} from './ui-utils.mjs?v=24.9.53';
import {DECOR_SLOTS,decorFacingFor,decorLabelFor,normalizeDecorFacing} from './decor-runtime.mjs?v=24.9.53';

/**
 * Đặt trang trí: a small bar over the dock, the garden stays in view. ◀ ▶ step through the free
 * spots (the camera follows), a tap on the garden picks the nearest free spot, ↻ turns the item,
 * «Đặt» saves. Free spots show as numbered marks on the map (`slots` in the preview).
 */
export function showDecorationPlacement({item,getStage,getDecorations,onPlace,preview,camera,iso,onClose,setTapHandler,toWorld}){
 for(const old of document.querySelectorAll('.decor-placement,.decor-bar')){try{old.close?.();}catch{}old.remove();}
 const itemLabel=decorLabelFor(item);
 const initialDecor=getDecorations()??{};
 const currentSlot=initialDecor.placements?.indexOf(item.id)??-1;
 let selectedFacing=decorFacingFor(initialDecor,item.id);
 let pending=false;

 function spots(){
  const decor=getDecorations()??{},stage=getStage?.();
  return DECOR_SLOTS.map(slot=>{
   const occupant=decor.placements?.[slot.id];
   const locked=!!stage&&!stageContains(stage,slot.col,slot.row);
   const taken=!!occupant&&occupant!==item.id;
   return {slot,mine:occupant===item.id,taken,locked,usable:!taken&&!locked,required:GARDEN_STAGES.find(s=>stageContains(s,slot.col,slot.row))?.level};
  });
 }
 let selected=currentSlot>=0?currentSlot:spots().find(s=>s.usable)?.slot.id??null;

 const bar=el('div',{class:'decor-bar',role:'dialog','aria-labelledby':'decorPlaceTitle'});
 const thumb=el('img',{class:'decor-bar-thumb',alt:''});
 const title=el('strong',{id:'decorPlaceTitle',text:itemLabel});
 const where=el('span',{class:'decor-bar-where'});
 const prev=button('◀',()=>step(-1),{'aria-label':'Vị trí trước'});
 const next=button('▶',()=>step(1),{'aria-label':'Vị trí sau'});
 const turn=button('↻ Xoay',()=>{selectedFacing=selectedFacing==='right'?'default':'right';sync(false);},{class:'decor-bar-turn','aria-label':'Xoay vật phẩm'});
 const apply=button('Đặt',commit,{class:'primary decor-bar-apply'});
 const stash=button('Cất vào kho',()=>save(null),{class:'decor-bar-stash'});
 const hint=el('p',{class:'decor-bar-hint',role:'status'});
 bar.append(
  el('div',{class:'decor-bar-head'},[thumb,el('div',{class:'decor-bar-text'},[title,where]),button('×',close,{class:'decor-bar-close','aria-label':'Đóng'})]),
  el('div',{class:'decor-bar-row'},[prev,next,turn,apply]),
  el('div',{class:'decor-bar-foot'},[hint,stash]),
 );

 function step(delta){
  const usable=spots().filter(s=>s.usable).map(s=>s.slot.id);
  if(!usable.length)return;
  const at=usable.indexOf(selected);
  selected=usable[(at<0?0:at+delta+usable.length)%usable.length];
  sync(true);
 }

 function sync(centerCamera){
  const list=spots();
  if(selected!==null&&centerCamera&&camera&&iso){const slot=DECOR_SLOTS[selected];const xy=iso(slot.col,slot.row);camera.centerAt(xy[0],xy[1]-50,Math.max(1.2,camera.scale?.()||1.2));}
  preview({itemId:selected===null?null:item.id,slot:selected,facing:selectedFacing,
   slots:list.filter(s=>!s.locked).map(s=>({id:s.slot.id,col:s.slot.col,row:s.slot.row,state:s.slot.id===selected?'selected':s.usable?'free':'taken'}))});
  render(list);
 }

 function render(list=spots()){
  const decor=getDecorations()??{};
  const placed=decor.placements?.indexOf(item.id)??-1;
  const savedFacing=decorFacingFor(decor,item.id);
  const right=selectedFacing==='right';
  thumb.src=right?(item.rightFile||item.file):item.file;
  thumb.classList.toggle('is-flipped',right&&!item.rightFile);
  const spot=selected===null?null:list[selected];
  const usableIds=list.filter(s=>s.usable).map(s=>s.slot.id),free=usableIds.length;
  where.textContent=spot?`Vị trí ${selected+1} · ${spot.slot.label}${spot.mine?' · đang đặt ở đây':''}`:free?'Chọn một vị trí':'Chưa còn chỗ trống';
  const unchanged=selected===placed&&selectedFacing===savedFacing;
  prev.disabled=next.disabled=pending||!free||free===1&&usableIds[0]===selected;
  turn.disabled=pending;
  apply.disabled=pending||selected===null||unchanged;
  apply.textContent=pending?'Đang lưu…':unchanged?'Đang ở đây':selected===placed?'Lưu góc':'Đặt';
  stash.hidden=placed<0;stash.disabled=pending;
  if(!hint.dataset.error)hint.textContent=free?`Chạm dấu ◆ trên vườn hoặc ◀ ▶ để chọn chỗ · ${free} chỗ đặt được`:'Cất bớt đồ khác vào kho để có chỗ.';
 }

 // A tap on the garden picks the nearest free spot; any tap is kept so plots stay untouched.
 function onTap(clientX,clientY){
  const point=toWorld?.(clientX,clientY);
  if(!point||!iso)return true;
  let best=null;
  for(const s of spots()){if(!s.usable)continue;const [x,y]=iso(s.slot.col,s.slot.row);const d=Math.hypot(x-point.x,y-point.y);if(!best||d<best.d)best={d,id:s.slot.id};}
  if(best&&best.d<180){selected=best.id;sync(false);}
  return true;
 }

 async function save(slot){
  if(pending)return;
  pending=true;delete hint.dataset.error;render();
  try{await onPlace(item.id,slot,selectedFacing);pending=false;close();}
  catch(e){pending=false;hint.dataset.error='1';hint.textContent=e.message;render();}
 }
 function commit(){if(selected!==null)save(selected);}

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
 sync(selected!==null);
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

