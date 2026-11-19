import {$,el,button,visualItemIcon} from './ui-utils.mjs?v=26.27';
import {pixelIcon,setAction} from './pixel-icons.mjs?v=26.27';
import {decorLabelFor,decorSpot,decorFacingFor,decorPlaceFields} from './decor-runtime.mjs?v=26.27';
import {defaultDecorChoices,isDefaultDecorHidden} from './default-decor.mjs?v=26.27';
import {runtimeImageUrl} from './runtime-image-url.mjs?v=26.27';

export function ownedDecorChoices(decorations,assets) {
 return [...new Set(decorations?.owned||[])].filter(id=>assets.has(id)).map(id=>({
  ...assets.get(id),id,label:decorLabelFor(assets.get(id)),
  placed:!!decorSpot(decorations,id),facing:decorFacingFor(decorations,id),
 }));
}

// Garden defaults (pond, earned path decor, keepsake statues) move like bought pieces; a stashed one is placed anew.
export function defaultDecorRows(progression,decorations,rotations={}) {
 return defaultDecorChoices(progression).map(d=>({...d,isDefault:true,placed:!isDefaultDecorHidden(decorations,d.id),facing:rotations[d.id]==='right'?'right':'default'}));
}

// Owner 18/11/2026 «hình rất nhỏ»: the picture fills the 64 px choice.
function rowIcon(items,row,assets) {
 if(row.id==='scene:pond')return el('img',{src:runtimeImageUrl('environment/layers/pond.png'),alt:'',width:56,height:36,class:'decor-choice-pond'});
 if(row.id.startsWith('keepsake:'))return visualItemIcon(items,'keepsake_'+row.id.slice(9),{size:52,kind:'keepsake'});
 return visualItemIcon(items,row.id,{size:52,kind:'decoration',decorAssets:row.isDefault?null:assets,facing:row.facing});
}

// Construction keeps its existing grid and handlers inside buildPane; decor shares only the shell.
// Contest garden (garden-contest.mjs): `addCopy(row)` adds «Thêm bản» for a bought piece, `submit` puts «Nộp bài dự thi»
// where «Mua thêm» was (everything is owned there).
export function setupBuildDecorDock({items,getDecorations,getAssets,getReady,openDecorate,openDefault,openStore,run,showPanel,getState,getRotations=()=>({}),setDefaultVisible,focusDecor,addCopy=null,submit=null}) {
 const root=$('buildDock'),buildPane=el('div',{id:'buildWorkPane',class:'work-dock'});
 const pane=el('div',{id:'decorWorkPane',class:'decor-work-pane',hidden:true});
 const tabs=el('div',{class:'build-decor-tabs',role:'group','aria-label':'Xây dựng và trang trí'});
 let section='build',selected=null;
 const entries=new Map();
 const artKey=row=>row.facing+(getAssets()?.get?.(row.id)?'|art':'');
 function show(next){section=next;refresh();if(next==='decor')entries.get(selected)?.control.scrollIntoView({block:'nearest',inline:'nearest'});}
 const buildTab=button('',()=>show('build'),{id:'buildSectionButton','aria-pressed':'true','aria-controls':'buildWorkPane'});
 const decorTab=button('',()=>show('decor'),{id:'decorSectionButton','aria-pressed':'false','aria-controls':'decorWorkPane'});
 buildTab.append(pixelIcon('build',1),el('span',{text:'Công trình'}));
 decorTab.append(pixelIcon('scenery',1),el('span',{text:'Trang trí'}));
 tabs.append(buildTab,decorTab);
 const tray=el('div',{id:'ownedDecorTray',class:'item-tray owned-decor-tray',role:'group','aria-label':'Trang trí của con · cuộn ngang'});
 const empty=el('p',{class:'decor-dock-empty',text:'Chưa có món trang trí. Ghé cửa hàng để chọn thêm.'});
 const title=el('strong',{id:'decorDockName'}),status=el('span',{id:'decorDockStatus'});
 const current=()=>currentRows().find(r=>r.id===selected);
 async function act(fn){
  place.disabled=stash.disabled=copy.disabled=true;
  try{await fn();}finally{refresh();(place.hidden?stash:place).focus({preventScroll:true});}
 }
 const place=button('',()=>{
  const row=current();
  if(!row||!getReady())return;
  // A stashed garden default opens the placement bar too, so it can go anywhere, not only back home (owner 06/11/2026).
  if(!row.isDefault)openDecorate(row,place);
  else openDefault(row,place);
 },{id:'decorDockPlace',class:'primary'});
 const stash=button('',()=>{
  const row=current();
  if(!row?.placed||!getReady())return;
  act(()=>row.isDefault?setDefaultVisible(row.id,false):run(null,'Đã cất '+row.label+'.',{action:'placeDecoration',...decorPlaceFields(getDecorations(),row.id,null,row.facing)}));
 },{id:'decorDockStash','aria-label':'Cất món đang chọn'});
 stash.append(pixelIcon('chest',1),el('span',{text:'Cất'}));
 // The new copy is selected, ready to place (server addCopy answers its id).
 const copy=button('',()=>{
  const row=current();
  if(!row||row.isDefault||!getReady())return;
  act(async()=>{const id=await addCopy(row);if(id){selected=id;section='decor';}});
 },{id:'decorDockCopy','aria-label':'Thêm một bản của món đang chọn',title:'Thêm bản'});
 copy.append(pixelIcon('plus',1),el('span',{text:'Thêm bản'}));copy.hidden=true;
 const detail=el('div',{class:'decor-dock-detail'},[el('div',{class:'decor-dock-copy'},[title,status]),place,stash,copy]);
 const collection=button('',()=>{collection.focus();showPanel('collection');},{id:'decorDockCollection','aria-label':'Mở trang trí của vườn và kỷ vật'});
 collection.append(pixelIcon('scenery',1),el('span',{text:'Vườn & kỷ vật'}));
 const shop=button('',()=>openStore('decoration',shop),{id:'decorDockShop','aria-label':'Mua thêm trang trí'});
 shop.append(pixelIcon('shop',1),el('span',{text:'Mua thêm'}));
 const send=submit&&button('',()=>submit(send),{id:'decorDockSubmit',class:'primary','aria-label':'Nộp bài dự thi'});
 send?.append(pixelIcon('trophy',1),el('span',{text:'Nộp bài'}));
 const footer=el('div',{class:'decor-dock-footer'},[collection,send||shop]);
 pane.append(tray,empty,detail,footer);
 root.classList.remove('work-dock');root.classList.add('build-decor-dock');
 root.setAttribute('aria-label','Xây dựng và trang trí');root.replaceChildren(tabs,buildPane,pane);
 function currentRows(){
  const decorations=getDecorations();
  return [...ownedDecorChoices(decorations,getAssets()),...(getState?defaultDecorRows(getState(),decorations,getRotations()):[])];
 }
 function refresh(){
  const rows=currentRows(),ids=new Set(rows.map(r=>r.id));
  buildPane.hidden=section!=='build';pane.hidden=section!=='decor';
  buildTab.setAttribute('aria-pressed',section==='build');decorTab.setAttribute('aria-pressed',section==='decor');
  decorTab.setAttribute('aria-label',`Trang trí · ${rows.length} món`);
  for(const [id,entry] of entries)if(!ids.has(id)){entry.control.remove();entries.delete(id);}
  if(!ids.has(selected))selected=(rows.find(r=>!r.placed&&!r.isDefault)||rows[0])?.id||null;
  for(const row of rows){
   if(!entries.has(row.id)){
    const state=el('span',{class:'decor-choice-state'});
    // Owner 13/11/2026: a piece in the garden → the camera goes to it; a stored one → placing starts at once, mid-screen.
    const control=button('',()=>{selected=row.id;refresh();const now=current();if(!now||!getReady())return;if(now.placed)focusDecor?.(now);else place.click();},{'data-decor-id':row.id,class:'decor-dock-choice'});
    control.append(rowIcon(items,row,getAssets()),el('span',{class:'decor-choice-name',text:row.label}),state);
    tray.append(control);entries.set(row.id,{control,state,art:artKey(row)});
   }
   const entry=entries.get(row.id);
   // Earned decor turns in place, and the manifest may land after the tray was drawn (owner 16/11/2026: a tall piece
   // drawn before it shrank to a dot at the frame's foot): swap only the icon so focus/scroll stay put.
   if(entry.art!==artKey(row)){entry.control.firstElementChild.replaceWith(rowIcon(items,row,getAssets()));entry.art=artKey(row);}
   entry.control.setAttribute('aria-pressed',row.id===selected);
   entry.control.setAttribute('aria-label',`${row.label} · ${row.placed?'Đang bày':'Đang cất'}`);
   entry.state.textContent=row.placed?'Đang bày':'Đang cất';
  }
  const row=rows.find(r=>r.id===selected);
  tray.hidden=!rows.length;empty.hidden=!!rows.length;detail.hidden=!row;
  if(!row)return;
  const ready=getReady();
  title.textContent=row.label;
  status.textContent=row.isDefault?(row.placed?'Đồ của vườn · dời sang ô khác hoặc cất':'Đang cất · chọn chỗ đặt'):(row.placed?'Đang bày trong vườn':'Đang cất · sẵn sàng đặt');
  stash.hidden=!row.placed;stash.disabled=!ready;
  copy.hidden=!addCopy||row.isDefault;copy.disabled=!ready;
  const label=row.placed?'Dời chỗ':'Đặt';
  place.disabled=!ready;
  setAction(place,{icon:'scenery',label,text:label+' '+row.label});
 }
 // Tapping a piece in the garden selects it here, ready to move or stash.
 function select(id){
  section='decor';
  if(currentRows().some(r=>r.id===id))selected=id;
  refresh();entries.get(selected)?.control.scrollIntoView({block:'nearest',inline:'nearest'});
 }
 refresh();
 return {buildPane,refresh,select,showBuild:()=>show('build')};
}
