import {GARDEN_STAGES,stageContains} from './garden-growth.mjs?v=24.9.6';
import {el,button} from './ui-utils.mjs?v=24.9.6';
import {DECOR_SLOTS,decorFacingFor,decorLabelFor,normalizeDecorFacing} from './decor-runtime.mjs?v=24.9.6';

export function showDecorationPlacement({item,getStage,getDecorations,onPlace,preview,camera,iso,onClose}){
 for(const old of document.querySelectorAll('dialog.decor-placement')){try{old.close();}catch{}old.remove();}
 const itemLabel=decorLabelFor(item);
 const initialDecor=getDecorations()??{};
 const currentSlot=initialDecor.placements?.indexOf(item.id)??-1;
 const initialFacing=decorFacingFor(initialDecor,item.id);
 let selected=currentSlot>=0?currentSlot:null;
 let selectedFacing=initialFacing;
 let pending=false;

 const dialog=el('dialog',{class:'decor-placement','aria-labelledby':'decorPlaceTitle'});
 const heading=el('div',{class:'sheet-heading'});
 const angleSection=el('div',{class:'decor-angle-section','aria-label':'Chọn góc xoay vật phẩm'});
 const grid=el('div',{class:'decor-slot-grid'});
 const notice=el('p',{class:'meta',role:'status'});
 const apply=button('Chọn một vị trí',commit,{class:'primary',disabled:true});

 function close(){
  if(pending)return;
  preview(null);
  dialog.close();
  dialog.remove();
  onClose?.();
 }

 heading.append(
  el('h2',{id:'decorPlaceTitle',text:'Đặt & Xoay · '+itemLabel}),
  button('×',close,{'aria-label':'Đóng bảng trang trí'})
 );

 function syncPreview(centerCamera=false){
  if(selected===null){
   preview(null);
   return;
  }
  const slot=DECOR_SLOTS[selected];
  if(slot&&centerCamera&&camera&&iso){
   const xy=iso(slot.col,slot.row);
   camera.centerAt(xy[0],xy[1]-50,1.5);
  }
  preview({itemId:item.id,slot:selected,facing:selectedFacing});
 }

 function setFacing(nextFacing){
  selectedFacing=normalizeDecorFacing(nextFacing);
  if(selected===null){
   const decor=getDecorations()??{};
   const stage=getStage?.();
   const freeSlot=DECOR_SLOTS.find(s=>{
    const occ=decor.placements?.[s.id];
    const locked=!!stage&&!stageContains(stage,s.col,s.row);
    return (!occ||occ===item.id)&&!locked;
   });
   if(freeSlot)selected=freeSlot.id;
  }
  syncPreview(false);
  render();
 }

 function render(){
  const decor=getDecorations()??{};
  const placed=decor.placements?.indexOf(item.id)??-1;
  const savedFacing=decorFacingFor(decor,item.id);

  angleSection.replaceChildren();
  const previewCard=el('div',{class:'decor-angle-preview'});
  const imgSrc=selectedFacing==='right'?(item.rightFile||item.file):item.file;
  if(imgSrc){
   const img=el('img',{
    class:'decor-angle-thumb'+((selectedFacing==='right'&&!item.rightFile)?' is-flipped':''),
    src:imgSrc,
    alt:`${itemLabel} (${selectedFacing==='right'?'Góc nhìn qua phải':'Góc hiện tại'})`,
   });
   previewCard.append(img);
  }
  const angleControls=el('div',{class:'decor-angle-controls'});
  angleControls.append(
   el('span',{class:'decor-angle-label',text:'Góc đặt vật phẩm (2 góc nhìn):'}),
   el('div',{class:'decor-angle-buttons'},[
    button('↖ Góc hiện tại',()=>setFacing('default'),{
     class:'decor-angle-btn'+(selectedFacing==='default'?' is-active':''),
     'data-decor-angle':'default',
     'aria-pressed':selectedFacing==='default',
     disabled:pending,
    }),
    button('↗ Góc nhìn qua phải',()=>setFacing('right'),{
     class:'decor-angle-btn'+(selectedFacing==='right'?' is-active':''),
     'data-decor-angle':'right',
     'aria-pressed':selectedFacing==='right',
     disabled:pending,
    }),
    button('↻ Đổi góc',()=>setFacing(selectedFacing==='default'?'right':'default'),{
     class:'decor-angle-rotate',
     'data-decor-flip':'1',
     title:'Xoay nhanh giữa 2 góc nhìn',
     disabled:pending,
    }),
   ])
  );
  angleSection.append(previewCard,angleControls);

  grid.replaceChildren();
  for(const slot of DECOR_SLOTS){
   const occupant=decor.placements?.[slot.id];
   const blocked=!!occupant&&occupant!==item.id;
   const stage=getStage?.();
   const locked=!!stage&&!stageContains(stage,slot.col,slot.row);
   const required=GARDEN_STAGES.find(s=>stageContains(s,slot.col,slot.row))?.level;
   const b=button('',()=>{
    selected=slot.id;
    syncPreview(true);
    render();
   },{
    'aria-pressed':selected===slot.id,
    disabled:pending||blocked||locked,
    'aria-label':slot.label+(locked?' · mở khu ở cấp '+required:blocked?' · đã có đồ':''),
   });
   const statusText=locked
    ?'Mở khu · cấp '+required
    :blocked
     ?'Đã có đồ'
     :occupant===item.id
      ?`Đang đặt (${savedFacing==='right'?'Góc phải ↗':'Góc hiện tại ↖'})`
      :'Còn trống';
   b.append(
    el('b',{text:String(slot.id+1)}),
    el('span',{text:slot.label}),
    el('small',{text:statusText})
   );
   grid.append(b);
  }

  const unchanged=selected===placed&&selectedFacing===savedFacing;
  const angleTag=selectedFacing==='right'?'Góc phải ↗':'Góc hiện tại ↖';
  apply.disabled=pending||selected===null||unchanged;
  apply.textContent=pending
   ?'Đang lưu…'
   :selected===null
    ?'Chọn một vị trí'
    :unchanged
     ?`Đang ở vị trí ${selected+1} (${angleTag})`
     :selected===placed
      ?`Lưu góc xoay (${angleTag})`
      :`Đặt tại vị trí ${selected+1} (${angleTag})`;
  stash.hidden=placed<0;
  stash.disabled=pending;
 }

 async function commit(){
  if(pending||selected===null)return;
  pending=true;
  render();
  try{
   await onPlace(item.id,selected,selectedFacing);
   pending=false;
   close();
  }catch(e){
   notice.textContent=e.message;
   pending=false;
   render();
  }
 }

 const stash=button('Cất vào kho trang trí',async()=>{
  if(pending)return;
  pending=true;
  render();
  try{
   await onPlace(item.id,null,selectedFacing);
   pending=false;
   close();
  }catch(e){
   notice.textContent=e.message;
   pending=false;
   render();
  }
 },{class:'stash-decor'});

 dialog.append(
  heading,
  el('p',{text:'Chọn góc xoay (Góc hiện tại hoặc Góc nhìn qua phải) và vị trí trong vườn để xem trước.'}),
  angleSection,
  grid,
  notice,
  apply,
  stash
 );
 document.getElementById('gameShell').append(dialog);
 dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
 if(selected!==null)syncPreview(false);
 render();
 dialog.showModal();
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

