import {el,button} from './ui-utils.mjs?v=24.9.79';
import {V24_ART} from './v24-visuals.mjs?v=24.9.79';

const SVG_ATTR='fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="miter"';
const svg=body=>`<svg viewBox="0 0 24 24" ${SVG_ATTR} aria-hidden="true">${body}</svg>`;
const ICONS=Object.freeze({
 sound:svg('<path d="M4 10h4l5-4v12l-5-4H4z"/><path d="M16 9c2 2 2 4 0 6M18.5 6.5c4 3 4 8 0 11"/>'),
 motion:svg('<path d="M4 15c3-6 5-6 8 0s5 6 8 0"/><path d="M4 9c3-6 5-6 8 0s5 6 8 0"/>'),
 props:svg('<path d="m12 3 2.4 5.1L20 9l-4 3.9.9 5.6-4.9-2.6-4.9 2.6.9-5.6L4 9l5.6-.9z"/><path d="M12 16v5M9 21h6"/>'),
 grid:svg('<path d="M4 4h16v16H4zM4 10h16M4 16h16M10 4v16M16 4v16"/>'),
 fullscreen:svg('<path d="M8 4H4v4M16 4h4v4M20 16v4h-4M4 16v4h4"/>'),
 save:svg('<path d="M5 3h11l3 3v15H5zM8 3v6h8V3M8 21v-7h8v7"/>'),
});

const bool=value=>value===true;
function readPrefs(ctx){return ctx.getViewPreferences?.()||{};}
function readWeather(ctx){
 const weather=ctx.getWeather?.();
 return weather?.id||'clear';
}
function settingState(ctx){
 const prefs=readPrefs(ctx),systemReducedMotion=bool(prefs.systemReducedMotion);
 return {
  sound:bool(ctx.getSoundEnabled?.()??true),
  motion:bool(prefs.motionEnabled??true)&&!systemReducedMotion,
  systemReducedMotion,
  props:bool(prefs.propsVisible??true),
  grid:bool(prefs.grid??false),
 };
}
function sessionStatus(ctx){
 const session=ctx.getSession?.()||{};
 if(session.saveProblem)return session.saveProblem;
 if(session.isPreview)return 'Xem thử · lưu trong bộ nhớ';
 if(session.connected)return 'Đã kết nối';
 if(session.saveAvailable)return 'Lưu trên thiết bị';
 return 'Chỉ lưu trong phiên này';
}

export function renderGardenSettings(ctx={},options={}){
 const {onScenery,exportSave,exportPlaytest}=options,root=el('section',{class:'garden-settings'});
 const repaint=(focusKey='')=>{
  const state=settingState(ctx);
  const motionNoteId='garden-settings-motion-note';
  const cards=[
   {key:'sound',label:'Âm thanh',value:state.sound,action:()=>ctx.toggleAudio?.()},
   {key:'motion',label:'Chuyển động',value:state.motion,
    action:()=>ctx.toggleMotion?.(),disabled:state.systemReducedMotion,
    title:state.systemReducedMotion?'Theo cài đặt giảm chuyển động của hệ điều hành':'Chuyển động'},
   {key:'props',label:'Cảnh vật',value:state.props,action:()=>ctx.toggleProps?.()},
   {key:'grid',label:'Lưới',value:state.grid,action:()=>ctx.toggleGrid?.()},
  ];
  const grid=el('div',{class:'settings-grid','aria-label':'Thiết lập hiển thị'});
  for(const item of cards){
   const switchAttrs={class:'setting-card',role:'switch','aria-checked':String(item.value), 'aria-label':item.label,
    title:item.title||item.label,'data-setting':item.key,disabled:item.disabled};
   if(item.key==='motion'&&state.systemReducedMotion)switchAttrs['aria-describedby']=motionNoteId;
   const control=button('',()=>{
    if(item.disabled)return;
    try{
     const result=item.action?.();
     if(result?.then)result.then(()=>repaint(item.key)).catch(error=>{
      ctx.notify?.(error?.message||'Không thể đổi thiết lập.');repaint(item.key);
     });
     else repaint(item.key);
    }catch(error){ctx.notify?.(error?.message||'Không thể đổi thiết lập.');repaint(item.key);}
   },switchAttrs);
   control.append(
    el('span',{class:'setting-icon',html:ICONS[item.key]}),
    el('div',{class:'setting-copy'},[el('strong',{text:item.label})]),
    el('span',{class:'setting-switch','aria-hidden':'true'}),
   );
   grid.append(control);
  }

  const fullscreen=button('',async()=>{
   try{await ctx.camera?.fullscreen?.();}
   catch(error){ctx.notify?.(error?.message||'Không thể mở toàn màn hình.');}
  },{class:'settings-action','data-setting-action':'fullscreen','aria-label':'Toàn màn hình'});
  fullscreen.append(el('span',{class:'settings-action-icon',html:ICONS.fullscreen,'aria-hidden':'true'}),el('span',{text:'Toàn màn hình'}));
  const save=button('',()=>{
   try{exportSave?.();}
   catch(error){ctx.notify?.(error?.message||'Không thể xuất bản lưu.');}
  },{class:'settings-action','data-setting-action':'export','aria-label':'Xuất bản lưu'});
  save.append(el('span',{class:'settings-action-icon',html:ICONS.save,'aria-hidden':'true'}),el('span',{text:'Xuất bản lưu'}));

  const session=ctx.getSession?.()||{},saveProblem=session.saveProblem;
  const status=el('p',{class:'settings-status',text:sessionStatus(ctx)});
  const more=el('details',{class:'settings-more'},[
   el('summary',{text:'Khác'}),
   el('div',{class:'settings-more-content'},[
    el('div',{class:'settings-actions'},[fullscreen,save,...(exportPlaytest?[button('Xuất nhật ký thử',()=>{try{exportPlaytest();}catch(error){ctx.notify?.(error?.message||'Không thể xuất nhật ký.');}},{class:'settings-action','data-setting-action':'playtest','aria-label':'Xuất nhật ký thử nghiệm ẩn danh'})]:[])]),
    ...(saveProblem?[]:[status]),
   ]),
  ]);
  const motionNote=state.systemReducedMotion
   ? el('span',{class:'settings-a11y-note',id:motionNoteId,text:'Chuyển động bị khóa theo cài đặt giảm chuyển động của hệ điều hành.'})
   : null;
  const weather=readWeather(ctx),scene=button('',()=>onScenery?.(),{class:'settings-scene','aria-label':'Khung cảnh',title:'Khung cảnh'});
  scene.append(el('img',{src:V24_ART[weather]||V24_ART.clear,alt:'',decoding:'async'}),el('strong',{text:'Khung cảnh'}));
  root.replaceChildren(
   scene,
   grid,
   more,
   ...(motionNote?[motionNote]:[]),
   ...(saveProblem?[el('p',{class:'settings-status settings-status-error',role:'alert',text:sessionStatus(ctx)})]:[]),
  );
  if(focusKey)root.querySelector(`[data-setting="${focusKey}"]`)?.focus();
 };
 repaint();
 return root;
}
