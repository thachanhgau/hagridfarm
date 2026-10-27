import {$,el,button,visualItemIcon} from './ui-utils.mjs?v=24.9.87';
import {pixelIcon,setAction} from './pixel-icons.mjs?v=24.9.87';
import {decorLabelFor,decorSpot,decorFacingFor,decorPlaceFields} from './decor-runtime.mjs?v=24.9.87';
import {defaultDecorChoices,isDefaultDecorHidden} from './default-decor.mjs?v=24.9.87';
import {runtimeImageUrl} from './runtime-image-url.mjs?v=24.9.87';

export function ownedDecorChoices(decorations,assets) {
 return [...new Set(decorations?.owned||[])].filter(id=>assets.has(id)).map(id=>({
  ...assets.get(id),id,label:decorLabelFor(assets.get(id)),
  placed:!!decorSpot(decorations,id),facing:decorFacingFor(decorations,id),
 }));
}

// Garden defaults (pond, earned path decor, keepsake statues) move like bought pieces; «Đặt lại» restores a stashed one.
export function defaultDecorRows(progression,decorations,rotations={}) {
 return defaultDecorChoices(progression).map(d=>({...d,isDefault:true,placed:!isDefaultDecorHidden(decorations,d.id),facing:rotations[d.id]==='right'?'right':'default'}));
}

function rowIcon(items,row,assets) {
 if(row.id==='scene:pond')return el('img',{src:runtimeImageUrl('environment/layers/pond.png'),alt:'',width:44,height:28,class:'decor-choice-pond'});
 if(row.id.startsWith('keepsake:'))return visualItemIcon(items,'keepsake_'+row.id.slice(9),{size:32,kind:'keepsake'});
 return visualItemIcon(items,row.id,{size:32,kind:'decoration',decorAssets:row.isDefault?null:assets,facing:row.facing});
}

// Construction keeps its existing grid and handlers inside buildPane; decor shares only the shell.
export function setupBuildDecorDock({items,getDecorations,getAssets,getReady,openDecorate,openDefault,openStore,run,showPanel,getState,getRotations=()=>({}),setDefaultVisible}) {
 const root=$('buildDock'),buildPane=el('div',{id:'buildWorkPane',class:'work-dock'});
 const pane=el('div',{id:'decorWorkPane',class:'decor-work-pane',hidden:true});
 const tabs=el('div',{class:'build-decor-tabs',role:'group','aria-label':'Xây dựng và trang trí'});
 let section='build',selected=null;
 const entries=new Map();
 function show(next){section=next;refresh();if(next==='decor')entries.get(selected)?.control.scrollIntoView({block:'nearest',inline:'nearest'});}
 const buildTab=button('',()=>show('build'),{id:'buildSectionButton','aria-pressed':'true','aria-controls':'buildWorkPane'});
 const decorTab=button('',()=>show('decor'),{id:'decorSectionButton','aria-pressed':'false','aria-controls':'decorWorkPane'});
 buildTab.append(pixelIcon('build',1),el('span',{text:'Công trình'}));
 decorTab.append(pixelIcon('scenery',1),el('span',{text:'Trang trí'}));
 tabs.append(buildTab,decorTab);
 const tray=el('div',{id:'ownedDecorTray',class:'item-tray owned-decor-tray',role:'group','aria-label':'Trang trí của bạn · cuộn ngang'});
 const empty=el('p',{class:'decor-dock-empty',text:'Chưa có món trang trí. Ghé cửa hàng để chọn thêm.'});
 const title=el('strong',{id:'decorDockName'}),status=el('span',{id:'decorDockStatus'});
 const current=()=>currentRows().find(r=>r.id===selected);
 async function act(fn){
  place.disabled=stash.disabled=true;
  try{await fn();}finally{refresh();(place.hidden?stash:place).focus({preventScroll:true});}
 }
 const place=button('',()=>{
  const row=current();
  if(!row||!getReady())return;
  if(!row.isDefault)openDecorate(row,place);
  else if(!row.placed)act(()=>setDefaultVisible(row.id,true));
  else openDefault(row,place);
 },{id:'decorDockPlace',class:'primary'});
 const stash=button('',()=>{
  const row=current();
  if(!row?.placed||!getReady())return;
  act(()=>row.isDefault?setDefaultVisible(row.id,false):run(null,'Đã cất '+row.label+'.',{action:'placeDecoration',...decorPlaceFields(getDecorations(),row.id,null,row.facing)}));
 },{id:'decorDockStash','aria-label':'Cất món đang chọn'});
 stash.append(pixelIcon('chest',1),el('span',{text:'Cất'}));
 const detail=el('div',{class:'decor-dock-detail'},[el('div',{class:'decor-dock-copy'},[title,status]),place,stash]);
 const collection=button('',()=>{collection.focus();showPanel('collection');},{id:'decorDockCollection','aria-label':'Mở trang trí của vườn và kỷ vật'});
 collection.append(pixelIcon('scenery',1),el('span',{text:'Vườn & kỷ vật'}));
 const shop=button('',()=>openStore('decoration',shop),{id:'decorDockShop','aria-label':'Mua thêm trang trí'});
 shop.append(pixelIcon('shop',1),el('span',{text:'Mua thêm'}));
 const footer=el('div',{class:'decor-dock-footer'},[collection,shop]);
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
    const control=button('',()=>{selected=row.id;refresh();},{'data-decor-id':row.id,class:'decor-dock-choice'});
    control.append(rowIcon(items,row,getAssets()),el('span',{class:'decor-choice-name',text:row.label}),state);
    tray.append(control);entries.set(row.id,{control,state,facing:row.facing});
   }
   const entry=entries.get(row.id);
   // Earned decor turns in place; swap only the icon so focus/scroll stay put.
   if(entry.facing!==row.facing){entry.control.firstElementChild.replaceWith(rowIcon(items,row,getAssets()));entry.facing=row.facing;}
   entry.control.setAttribute('aria-pressed',row.id===selected);
   entry.control.setAttribute('aria-label',`${row.label} · ${row.placed?'Đang bày':'Đang cất'}`);
   entry.state.textContent=row.placed?'Đang bày':'Đang cất';
  }
  const row=rows.find(r=>r.id===selected);
  tray.hidden=!rows.length;empty.hidden=!!rows.length;detail.hidden=!row;
  if(!row)return;
  const ready=getReady();
  title.textContent=row.label;
  status.textContent=row.isDefault?(row.placed?'Đồ của vườn · dời sang ô khác hoặc cất':'Đang cất · đặt lại về chỗ cũ'):(row.placed?'Đang bày trong vườn':'Đang cất · sẵn sàng đặt');
  stash.hidden=!row.placed;stash.disabled=!ready;
  const label=row.placed?'Di chuyển':row.isDefault?'Đặt lại':'Đặt';
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
 return {buildPane,refresh,select};
}
