import {el,button} from './ui-utils.mjs?v=24.9.64';
import {V24_ART,navIcon} from './v24-visuals.mjs?v=24.9.64';

// Four destinations; the garden illustration stays decorative so every target is explicit.
export function renderGardenMenu(ctx,actions){
 const weather=ctx.getWeather?.()?.id||'clear';
 const root=el('nav',{class:'garden-menu','aria-label':'Menu khu vườn'});
 const art=el('div',{class:'garden-menu-art','aria-hidden':'true'},[
  el('img',{src:V24_ART[weather]||V24_ART.clear,alt:'',decoding:'async'}),
  el('span',{class:'garden-menu-seal',text:'✦'}),
 ]);
 root.append(art);
 for(const [id,label,glyph] of [
  ['guide','Sổ tay','guide'],['tour','Thăm vườn','tour'],['profile','Hồ sơ','profile'],
  ['events','Lễ hội','events'],['settings','Cài đặt','settings'],
 ]){
  const medal=el('span',{class:'garden-menu-medal','aria-hidden':'true'});
  medal.append(navIcon(glyph));
  const b=button('',actions[id],{class:'garden-menu-node','data-menu':id,
   'aria-label':label});
  b.append(medal,el('span',{class:'garden-menu-label',text:label}));root.append(b);
 }
 return root;
}
