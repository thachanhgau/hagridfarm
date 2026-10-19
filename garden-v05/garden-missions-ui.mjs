// «Nhiệm vụ bác Hagrid» (owner decision 19/10/2026): the server's mission chain
// (snapshot.missions, action claimMission). One mission at a time; from level 20
// a chapter of three steps. Only with a wallet: the server checks every step.
import {$,el} from './ui-utils.mjs?v=24.9.43';
import {pixelIcon,iconButton} from './pixel-icons.mjs?v=24.9.43';

const meter=(done,target)=>el('div',{class:'gp-meter',role:'progressbar','aria-valuemin':'0','aria-valuemax':String(target),'aria-valuenow':String(done)},[el('span',{style:`width:${Math.min(100,Math.round(done/target*100))}%`})]);

export function createMissions({getSnapshot,claim,notify}){
 const button=$('missionButton');
 const body=el('div',{class:'mission-body'});
 const dialog=el('dialog',{class:'owl-letter mission-letter','aria-labelledby':'missionTitle'},[
  el('div',{class:'popover-heading'},[el('h2',{id:'missionTitle',text:'Nhiệm vụ bác Hagrid'}),iconButton('close','Đóng',()=>dialog.close(),{class:'gp-close'})]),
  body,
 ]);
 document.body.append(dialog);
 dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});

 function render(){
  const view=getSnapshot()?.missions;
  const m=view?.current;
  if(!m){body.replaceChildren(el('p',{class:'meta',text:view?'Con đã làm xong mọi nhiệm vụ của bác. Giỏi lắm!':'Nhiệm vụ cần kết nối tài khoản.'})});return;}
  const action=m.claimable
   ? iconButton('chest',`Nhận quà: ${m.reward.label}`,async()=>{const res=await claim(m.id);if(res?.ok){notify(`🎁 Xong nhiệm vụ «${m.title}»: ${res.reward.label}!`);render();}},{text:'Nhận',class:'primary','data-claim-mission':m.id})
   : iconButton('lock',m.open?'Chưa xong':`Mở ở cấp ${m.level}`,null,{disabled:true});
  body.replaceChildren(
   el('div',{class:`gp-hero${m.claimable?' is-ready':m.open?'':' is-locked'}`},[
    el('div',{class:'gp-tile-art'},[pixelIcon(m.chapter?'book':'quill',3)]),
    el('div',{class:'gp-hero-copy'},[
     el('small',{text:`${m.chapter?'Chương':'Nhiệm vụ'} · Cấp ${m.level} · ${view.claimedCount}/${view.totalCount}`}),
     el('strong',{text:m.title}),
     ...m.steps.map(s=>el('div',{class:'mission-step'+(s.done?' is-done':'')},[el('span',{text:(s.done?'✓ ':'')+s.label}),meter(s.current,s.target),el('b',{text:`${s.current}/${s.target}`})])),
     el('p',{class:'mission-reward',text:'Quà: '+m.reward.label}),
    ]),
    action,
   ]),
   ...(view.upcoming.length?[el('p',{class:'sheet-label',text:'Sắp tới'}),...view.upcoming.map(u=>el('p',{class:'meta',text:`Cấp ${u.level} · ${u.title} — ${u.reward.label}`}))]:[]),
  );
 }

 function sync(){
  const m=getSnapshot()?.missions?.current;
  button.hidden=!getSnapshot();
  button.classList.toggle('has-claimable',Boolean(m?.claimable));
  button.title=m?.claimable?'Nhiệm vụ · Có quà':'Nhiệm vụ';
  if(dialog.open)render();
 }
 button.onclick=()=>{render();dialog.showModal();};
 return {sync};
}
