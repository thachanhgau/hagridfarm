// «Nhiệm vụ bác Hagrid» (owner decision 19/10/2026): the server's mission chain
// (snapshot.missions, action claimMission). One mission at a time; from level 20
// a chapter of three steps. Only with a wallet: the server checks every step.
import {$,el} from './ui-utils.mjs?v=24.9.91';
import {pixelIcon,iconButton} from './pixel-icons.mjs?v=24.9.91';
import {showHagridLetter} from './hagrid-letter-ui.mjs?v=24.9.91';

const meter=(done,target)=>el('div',{class:'gp-meter',role:'progressbar','aria-valuemin':'0','aria-valuemax':String(target),'aria-valuenow':String(done)},[el('span',{style:`width:${Math.min(100,Math.round(done/target*100))}%`})]);

// Event channel (snapshot.dayEvent, action claimDayEvent); now «Mừng HPVN 3 tháng — Hội Gia Tinh» (owner 31/10/2026).
// Tasks in order, the ones after the current one read «???»; the gift (two statues + a letter) arrives in the claim reply.
const endText=ms=>{const d=new Date(ms+7*3600000);const p=n=>String(n).padStart(2,'0');return `Đến ${p(d.getUTCHours())}:${p(d.getUTCMinutes())} ${p(d.getUTCDate())}/${p(d.getUTCMonth()+1)}`;};
const readLetter=letter=>showHagridLetter({greeting:letter.greeting,mode:'gift',letter});
function eventSection(ev,claimEvent,notify,rerender){
 const gift=ev.finale;
 const card=gift.claimed
  ? el('div',{class:'gp-hero day-event-gift is-open'},[
    el('div',{class:'day-event-statues','aria-hidden':'true'},gift.decor.map(id=>el('img',{src:`./decor-assets/native/${id}.png`,alt:'',width:64,height:88,draggable:'false'}))),
    el('div',{class:'gp-hero-copy'},[el('strong',{text:'Quà của Hội Gia Tinh'}),el('small',{text:`${gift.decor.length} tượng · +${gift.boost} Nước phép`})]),
    iconButton('letter','Đọc thư của Hội Gia Tinh',()=>readLetter(gift.letter),{text:'Thư'}),
   ])
  : el('div',{class:`gp-hero owl-chest day-event-gift${gift.ready?' is-ready':' is-locked'}`},[
    el('div',{class:'gp-tile-art'},[pixelIcon('chest',3)]),
    el('div',{class:'gp-hero-copy'},[el('strong',{text:'Quà của Hội Gia Tinh'}),el('small',{text:gift.ready?'Mở quà nào!':`Xong ${ev.tasks.length} nhiệm vụ để mở`})]),
    gift.ready
     ? iconButton('chest','Mở quà của Hội Gia Tinh',async()=>{const res=await claimEvent('finale');if(res?.ok){notify(`🧦 Hội Gia Tinh tặng con ${res.reward.label}!`);rerender();readLetter(res.reward.letter);}},{text:'Mở',class:'primary','data-claim-day-event':'finale'})
     : iconButton('lock','Chưa mở',null,{disabled:true}),
   ]);
 return el('section',{class:'day-event'},[
  el('p',{class:'sheet-label day-event-title',text:`${ev.icon} ${ev.title} · ${endText(ev.endsAt)}`}),
  ...ev.tasks.map((t,i)=>el('div',{class:'day-event-task'+(t.claimed?' is-done':t.open?'':' is-locked')},[
   el('div',{class:'gp-hero-copy'},[
    el('small',{text:`${i+1}. ${t.claimed?'✓ ':''}${t.label} · ${t.reward.label}`}),
    t.open?el('div',{class:'owl-chest-meter'},[meter(t.current,t.target),el('b',{text:`${t.current}/${t.target}`})]):null,
   ]),
   t.claimable?iconButton('chest',`${t.deliver?'Nộp và nhận':'Nhận'} ${t.reward.label}`,async()=>{const res=await claimEvent(t.id);if(res?.ok){notify(`🧦 Hội Gia Tinh: ${res.reward.label}!`);rerender();}},{text:t.deliver?'Nộp':'Nhận',class:'primary','data-claim-day-event':t.id}):null,
  ])),
  card,
 ]);
}

export function createMissions({getSnapshot,claim,claimBacklog,claimEvent,notify}){
 const button=$('missionButton');
 const body=el('div',{class:'mission-body'});
 const dialog=el('dialog',{id:'missionLetter',class:'owl-letter mission-letter','aria-labelledby':'missionTitle'},[
  el('div',{class:'popover-heading'},[el('h2',{id:'missionTitle',text:'Nhiệm vụ'}),iconButton('close','Đóng',()=>dialog.close(),{class:'gp-close'})]),
  body,
 ]);
 ($('gameShell')||document.body).append(dialog);
 dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});

 function render(){
  const ev=getSnapshot()?.dayEvent;
  renderChain();
  if(ev)body.prepend(eventSection(ev,claimEvent,notify,render));
 }
 function renderChain(){
  const view=getSnapshot()?.missions;
  const m=view?.current;
  if(!m){body.replaceChildren(el('p',{class:'meta',text:view?'Con đã làm xong mọi nhiệm vụ của bác. Giỏi lắm!':'Nhiệm vụ cần kết nối tài khoản.'}));return;}
  const action=m.claimable
   ? iconButton('chest',`Nhận quà: ${m.reward.label}`,async()=>{const res=await claim(m.id);if(res?.ok){notify(`🎁 Xong nhiệm vụ «${m.title}»: ${res.reward.label}!`);render();}},{text:'Nhận',class:'primary','data-claim-mission':m.id})
   : iconButton('lock',m.open?'Chưa xong':`Mở ở cấp ${m.level}`,null,{disabled:true});
  body.replaceChildren(
   el('div',{class:`gp-hero owl-chest${m.claimable?' is-ready':m.open?'':' is-locked'}`},[
    el('div',{class:'gp-tile-art'},[pixelIcon(m.chapter?'book':'quill',3)]),
    el('div',{class:'gp-hero-copy'},[
     el('small',{text:`${m.chapter?'Chương':'Nhiệm vụ'} · Cấp ${m.level} · ${view.claimedCount}/${view.totalCount}`}),
     el('strong',{text:m.title}),
     ...m.steps.flatMap(s=>[m.chapter?el('small',{class:'mission-step'+(s.done?' is-done':''),text:(s.done?'✓ ':'')+s.label}):null,el('div',{class:'owl-chest-meter'},[meter(s.current,s.target),el('b',{text:`${s.current}/${s.target}`})])]),
     el('small',{class:'mission-reward',text:'Quà: '+m.reward.label}),
    ]),
    action,
   ]),
   ...(view.upcoming.length?[el('p',{class:'sheet-label',text:'Sắp tới'}),...view.upcoming.map(u=>el('p',{class:'meta',text:`Cấp ${u.level} · ${u.title} — ${u.reward.label}`}))]:[]),
  );
 }

 let eventToldAt='';
 function sync(){
  const m=getSnapshot()?.missions?.current;
  const ev=getSnapshot()?.dayEvent;
  const evReady=Boolean(ev&&(ev.tasks.some(t=>t.claimable)||ev.finale.ready));
  button.hidden=!getSnapshot();
  button.classList.toggle('has-claimable',Boolean(m?.claimable)||evReady);
  // Once per session the event letter opens by itself for every player while the event is unfinished,
  // as soon as no other dialog is open and the first-day tutorial is over (checked every 3 s).
  if(ev&&!ev.finale.claimed&&eventToldAt!==ev.id){eventToldAt=ev.id;showEventSoon();}
  button.title=m?.claimable?'Nhiệm vụ · Có quà':'Nhiệm vụ';
  if(dialog.open)render();
 }
 button.onclick=()=>{render();dialog.showModal();};
 function showEventSoon(){
  setTimeout(()=>{
   const tutorial=document.body.dataset.tutorial;
   if(document.querySelector('dialog[open]')||(tutorial&&tutorial!=='done'))return showEventSoon();
   if(getSnapshot()?.dayEvent&&!dialog.open){render();dialog.showModal();}
  },3000);
 }
 // Owner 19/10/2026: a garden that joined the chain above level 1 gets every passed mission's gift once, by owl.
 // `reopen` null only asks whether there is one (mail badge).
 function letterGift(reopen){
  const b=getSnapshot()?.missions?.backlog;
  if(!b||!reopen)return Boolean(b);
  return el('div',{class:'gp-hero owl-chest is-ready mission-backlog'},[
   el('div',{class:'gp-tile-art'},[pixelIcon('chest',3)]),
   el('div',{class:'gp-hero-copy'},[
    el('small',{text:`Quà của ${b.count} nhiệm vụ con đã vượt qua`}),
    el('strong',{text:'Quà bù của bác Hagrid'}),
    el('small',{class:'mission-reward',text:b.reward.label}),
   ]),
   iconButton('chest',`Nhận quà bù: ${b.reward.label}`,async()=>{const res=await claimBacklog();if(res?.ok){notify(`🦉 Đã nhận quà bù nhiệm vụ: ${res.reward.label}!`);reopen();}},{text:'Nhận',class:'primary','data-claim-backlog':'true'}),
  ]);
 }
 return {sync,letterGift};
}
