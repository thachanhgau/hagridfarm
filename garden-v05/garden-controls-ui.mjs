import {$,button,el,icon,visualItemIcon} from './ui-utils.mjs?v=24.9';
import {navIcon,V24_ART} from './v24-visuals.mjs?v=24.9';

export function setupGardenControls({items,onSettings,getWeather}){
 const labels={sowTool:'Gieo hạt',harvestTool:'Gặt tất cả cây chín',creatureTool:'Nuôi sinh vật',craftTool:'Chế biến',buildTool:'Xây dựng'};
 for(const [id,label] of Object.entries(labels)){
  const control=$(id);control.title=label;control.setAttribute('aria-label',label);
  control.querySelector('.tool-glyph')?.setAttribute('aria-hidden','true');
 }
 for(const [id,species,stage] of [['sowTool','pumpkin',1],['creatureTool','puffskein',3]]){
  $(id).querySelector('.tool-glyph').replaceChildren(icon(items,species,stage,28));
 }
 const settings=button('',onSettings,{id:'settingsButton','aria-label':'Cài đặt',title:'Cài đặt',class:'camera-settings'});
 settings.append(navIcon('settings'));
 document.querySelector('.camera-tools').append(settings);

 const portraits=['plant','creature','craft','build'].map(kind=>{
  const dock=$(`${kind}Dock`);
  if(!dock)return null;
  const portrait=el('div',{class:'dock-portrait','aria-hidden':'true',hidden:true});
  dock.prepend(portrait);
  return {kind,dock,portrait,lastId:null};
 }).filter(Boolean);

 let lastWeather='';
 function refresh(){
  const weather=getWeather?.()||'clear';
  if(weather!==lastWeather){$('playDock').style.setProperty('--dock-scene',`url("${V24_ART[weather]||V24_ART.clear}")`);lastWeather=weather;}
  for(const entry of portraits){
   const selected=entry.dock.querySelector('.item-tray [aria-pressed="true"]');
   const id=selected?.getAttribute('data-id')||null;
   if(!selected||!id){
    if(entry.lastId!==null||entry.portrait.childNodes.length)entry.portrait.replaceChildren();
    entry.lastId=null;
    entry.portrait.hidden=true;
    entry.portrait.removeAttribute('data-kind');
    continue;
   }
   if(id===entry.lastId){
    entry.portrait.hidden=!entry.portrait.childNodes.length;
    continue;
   }
   const source=selected.querySelector('.sprite-icon, .tray-glyph');
   const isLargeSprite=entry.kind==='plant'||entry.kind==='creature';
   const preview=isLargeSprite?icon(items,id,3,64):entry.kind==='build'?visualItemIcon(items,id,{size:56}):source?.cloneNode(true);
   if(!preview){
    entry.lastId=id;
    entry.portrait.replaceChildren();
    entry.portrait.hidden=true;
    entry.portrait.removeAttribute('data-kind');
    continue;
   }
   const previewKind=preview.classList.contains('tray-glyph')?'glyph':'sprite';
   entry.portrait.replaceChildren(preview);
   entry.portrait.dataset.kind=previewKind;
   entry.portrait.hidden=false;
   entry.lastId=id;
  }
 }

 return {refresh};
}
