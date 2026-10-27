import {el,button} from './ui-utils.mjs?v=24.9.88';
export const V24_ART = Object.freeze({
 event_halloween:'./v24-art/event-halloween.webp',event_yule:'./v24-art/event-yule.webp',event_herbology_fair:'./v24-art/event-herbology.webp',
 clear:'./v24-art/weather-clear.webp',rain:'./v24-art/weather-rain.webp',autumn:'./v24-art/weather-autumn.webp',snow:'./v24-art/weather-snow.webp',
});
export const WEATHER_CHOICES=Object.freeze([{id:'clear',label:'Trời quang'},{id:'rain',label:'Mưa'},{id:'autumn',label:'Lá thu'},{id:'snow',label:'Tuyết'}]);
export function renderSceneryPicker(ctx){
 const root=el('section',{class:'v24-scenery'});
 function paint(){
  const weather=ctx.getWeather?.()?.id||'clear',atmosphere=ctx.getAtmosphere?.()?.id||'day',visiting=!!ctx.getActiveTourId?.();
  const choices=el('div',{class:'v24-weather-grid',role:'group','aria-label':'Thời tiết'});
  for(const c of WEATHER_CHOICES){const b=button('',()=>{ctx.onSetWeather?.(c.id);paint();root.querySelector(`[data-weather="${c.id}"]`)?.focus();},{class:'v24-art-choice','aria-label':c.label,'aria-pressed':String(c.id===weather),'data-weather':c.id,disabled:visiting});b.append(el('img',{src:V24_ART[c.id],alt:'',width:640,height:360,decoding:'async'}),el('span',{text:c.label}),el('i',{text:c.id===weather?'✓':'','aria-hidden':'true'}));choices.append(b);}
  const times=el('div',{class:'v24-time-grid',role:'group','aria-label':'Thời gian'});
  for(const [id,label] of [['day','Ngày'],['dusk','Chiều'],['night','Đêm']]){const b=button('',()=>{ctx.onSetAtmosphere?.(id);paint();root.querySelector(`[data-atmosphere="${id}"]`)?.focus();},{class:'v24-art-choice v24-time-'+id,'aria-label':label,'aria-pressed':String(id===atmosphere),'data-atmosphere':id,disabled:visiting});b.append(el('img',{src:V24_ART.clear,alt:'',width:640,height:360,decoding:'async'}),el('span',{text:label}),el('i',{text:id===atmosphere?'✓':'','aria-hidden':'true'}));times.append(b);}
  root.replaceChildren(choices,el('h3',{text:'Ánh sáng'}),times);
  if(visiting)root.prepend(el('p',{text:'Về vườn để đổi cảnh.'}),button('Về vườn',()=>{ctx.stopTour?.();paint();},{class:'primary'}));
 }
 paint();return root;
}
const NAV_PATHS={profile:'M8 7a4 4 0 1 0 8 0 4 4 0 1 0-8 0M4 21c0-5 4-7 8-7s8 2 8 7Z',guide:'M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h11M9 8h6',events:'M4 8h16v13H4zM3 5h18v4H3zM12 5v16M12 5C5 5 5 0 9 2l3 3Zm0 0c7 0 7-5 3-3l-3 3Z',tour:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm4 5-2 6-6 2 2-6 6-2Z',audio:'M3 9h4l5-5v16l-5-5H3V9Zm13-2c4 3 4 7 0 10M15 10c1 1 1 3 0 4',settings:'M4 6h16M4 12h16M4 18h16M8 3v6M16 9v6M10 15v6',work:'M3 10h18l-2 10H5zM7 10l3-6M17 10l-3-6M9 14v3M15 14v3'};
export function navIcon(name){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');svg.setAttribute('class','v24-nav-icon');const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',NAV_PATHS[name]||NAV_PATHS.settings);path.setAttribute('fill','none');path.setAttribute('stroke','currentColor');path.setAttribute('stroke-width','1.5');path.setAttribute('stroke-linejoin','round');svg.append(path);return svg;}
