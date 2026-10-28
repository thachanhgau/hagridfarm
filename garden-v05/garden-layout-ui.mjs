import {showVisualLayoutModal} from './decor-placement-ui.mjs?v=24.9.89';

export function openGardenLayout(ctx){
 const {panels,E,layoutSlots,camera,iso,run,draw,getState,getStage,preview}=ctx;
 panels?.close();
 showVisualLayoutModal({
  getState,
  getStage,
  layoutSlots,
  E,
  camera,
  iso,
  preview,
  onMove:async(kind,index,targetSlot)=>{
   const name=(kind==='plot'?'Thửa ':'Chuồng ')+(index+1);
   await run(x=>E.moveBuilding(x,kind,index,targetSlot),`Đã chuyển ${name} sang Nền ${targetSlot+1}.`,{action:'moveBuilding',kind,index,targetSlot});
  },
  onClose:()=>draw(),
 });
}
