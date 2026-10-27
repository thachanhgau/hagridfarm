import {$,el,button,visualItemIcon} from './ui-utils.mjs?v=24.9.85';
import {pixelIcon,setAction} from './pixel-icons.mjs?v=24.9.85';
import {decorLabelFor,decorSpot,decorFacingFor,decorPlaceFields} from './decor-runtime.mjs?v=24.9.85';

export function ownedDecorChoices(decorations,assets) {
 return [...new Set(decorations?.owned||[])].filter(id=>assets.has(id)).map(id=>({
  ...assets.get(id),id,label:decorLabelFor(assets.get(id)),
  placed:!!decorSpot(decorations,id),facing:decorFacingFor(decorations,id),
 }));
}

// Construction keeps its existing grid and handlers inside buildPane; decor shares only the shell.
export function setupBuildDecorDock({items,getDecorations,getAssets,getReady,openDecorate,openStore,run,showPanel}) {
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
 const tray=el('div',{id:'ownedDecorTray',class:'item-tray owned-decor-tray',role:'group','aria-label':'Trang trí đã sở hữu · cuộn ngang'});
 const empty=el('p',{class:'decor-dock-empty',text:'Chưa có món đã mua. Xem đồ của vườn hoặc ghé cửa hàng để chọn thêm.'});
 const title=el('strong',{id:'decorDockName'}),status=el('span',{id:'decorDockStatus'});
 const place=button('',()=>{
  const row=currentRows().find(r=>r.id===selected);
  if(row&&getReady())openDecorate(row,place);
 },{id:'decorDockPlace',class:'primary'});
 const stash=button('',async()=>{
  const decor=getDecorations(),row=currentRows().find(r=>r.id===selected);
  if(!row?.placed||!getReady())return;
  stash.disabled=true;place.disabled=true;
  try{await run(null,'Đã cất '+row.label+'.',{action:'placeDecoration',...decorPlaceFields(decor,row.id,null,row.facing)});}
  finally{refresh();place.focus({preventScroll:true});}
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
 function currentRows(){return ownedDecorChoices(getDecorations(),getAssets());}
 function refresh(){
  const rows=currentRows(),ids=new Set(rows.map(r=>r.id));
  buildPane.hidden=section!=='build';pane.hidden=section!=='decor';
  buildTab.setAttribute('aria-pressed',section==='build');decorTab.setAttribute('aria-pressed',section==='decor');
  decorTab.setAttribute('aria-label',`Trang trí · ${rows.length} món đã sở hữu`);
  for(const [id,entry] of entries)if(!ids.has(id)){entry.control.remove();entries.delete(id);}
  if(!ids.has(selected))selected=(rows.find(r=>!r.placed)||rows[0])?.id||null;
  for(const row of rows){
   if(!entries.has(row.id)){
    const state=el('span',{class:'decor-choice-state'});
    const control=button('',()=>{selected=row.id;refresh();},{'data-decor-id':row.id,class:'decor-dock-choice'});
    control.append(visualItemIcon(items,row.id,{size:32,kind:'decoration',decorAssets:getAssets(),facing:row.facing}),el('span',{class:'decor-choice-name',text:row.label}),state);
    tray.append(control);entries.set(row.id,{control,state});
   }
   const entry=entries.get(row.id);entry.control.setAttribute('aria-pressed',row.id===selected);
   entry.control.setAttribute('aria-label',`${row.label} · ${row.placed?'Đang bày':'Đang cất'}`);
   entry.state.textContent=row.placed?'Đang bày':'Đang cất';
  }
  const row=rows.find(r=>r.id===selected);
  tray.hidden=!rows.length;empty.hidden=!!rows.length;detail.hidden=!row;
  if(!row)return;
  title.textContent=row.label;status.textContent=row.placed?'Đang bày trong vườn':'Đang cất · sẵn sàng đặt';
  place.disabled=!getReady();stash.hidden=!row.placed;stash.disabled=!getReady();
  setAction(place,{icon:'scenery',label:row.placed?'Di chuyển':'Đặt',text:(row.placed?'Di chuyển ':'Đặt ')+row.label});
 }
 refresh();
 return {buildPane,refresh};
}
