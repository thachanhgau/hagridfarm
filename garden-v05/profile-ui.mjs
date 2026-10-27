import {$,el,button} from './ui-utils.mjs?v=24.9.88';
const avatars=['✿','☘','☾','✦','♧','♜'];
export function setupProfile(notify,onClose){
 const key='hagrid-garden-v05'+(new URLSearchParams(location.search).get('qa')==='1'?'-qa':'')+'-profile';let profile={name:'Người làm vườn',avatar:'✿'};
 try{const saved=JSON.parse(localStorage.getItem(key));if(saved&&typeof saved.name==='string'&&avatars.includes(saved.avatar))profile={name:saved.name.slice(0,28)||profile.name,avatar:saved.avatar};}catch{}
 const paint=()=>{$('playerName').textContent=profile.name;$('avatarGlyph').textContent=profile.avatar;};paint();
 return {show(){
  const overlay=el('div',{class:'level-celebration',role:'dialog','aria-modal':'true','aria-labelledby':'profileTitle'}),box=el('section'),input=el('input',{class:'profile-name-input',value:profile.name,maxlength:28,'aria-label':'Tên người làm vườn'}),choices=el('div',{class:'profile-avatar-options'});let avatar=profile.avatar;
  box.append(el('h2',{id:'profileTitle',text:'Sửa hồ sơ'}),el('p',{text:'Tên và biểu tượng lưu trên thiết bị này. Hồ sơ HPVN sẽ hiển thị khi kết nối tài khoản.'}),input,el('p',{text:'Chọn biểu tượng'}),choices);
  for(const glyph of avatars)choices.append(button(glyph,()=>{avatar=glyph;for(const b of choices.children)b.setAttribute('aria-pressed',String(b.textContent===avatar));},{'aria-label':'Biểu tượng '+glyph,'aria-pressed':glyph===avatar}));
  const close=()=>{overlay.remove();if(onClose)onClose();else $('avatarButton').focus();};box.append(el('p'),button('Lưu hồ sơ',()=>{profile={name:input.value.trim().slice(0,28)||'Người làm vườn',avatar};try{localStorage.setItem(key,JSON.stringify(profile));paint();close();}catch{notify('Không lưu được hồ sơ trên trình duyệt này.');}},{class:'primary'}),button('Đóng',close));
  overlay.append(box);$('gameShell').append(overlay);input.focus();overlay.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();}if(e.key==='Tab'){const f=[...box.querySelectorAll('input,button')],first=f[0],last=f.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
 }};
}
