// «Gia tinh trông vườn» (25.0 S2 part 2, server garden-elf-core): the wage box the member fills with knits from
// Giỏ đan của Hermione (action fillElfWages) and today's jobs (snapshot.elves). Opened by tapping a gia tinh;
// mobile-game imports it on that first tap (25.0 speed budget).
import {$,el,num,visualItemIcon} from './ui-utils.mjs?v=25.1.1';
import {iconButton} from './pixel-icons.mjs?v=25.1.1';
import {elfJobText,elfShiftText} from './garden-elves.mjs?v=25.1.1';

const WAGES=Object.freeze([['elf_sock','Vớ len'],['elf_hat','Nón len']]);
const wageName=id=>WAGES.find(([key])=>key===id)?.[1]||id;
const pad=n=>String(n).padStart(2,'0');
const clockText=ms=>{const d=new Date(ms+7*3600000);return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;};
const dayClockText=ms=>{const d=new Date(ms+7*3600000);return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth()+1)} ${clockText(ms)}`;};

export function createElfCare({getSnapshot,fill,items,notify}){
 const body=el('div',{class:'elf-care-body'});
 const dialog=el('dialog',{id:'elfCare',class:'owl-letter elf-care','aria-labelledby':'elfCareTitle'},[
  el('div',{class:'popover-heading'},[el('h2',{id:'elfCareTitle',text:'Gia tinh trông vườn'}),iconButton('close','Đóng',()=>dialog.close(),{class:'gp-close'})]),
  body,
 ]);
 ($('gameShell')||document.body).append(dialog);
 dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});

 function render(){
  const snap=getSnapshot(),view=snap?.elves,stock=snap?.garden?.progression?.inventory||{};
  if(!view){body.replaceChildren(el('p',{class:'meta',text:'Cần kết nối tài khoản.'}));return;}
  const done=view.cap-view.left;
  body.replaceChildren(
   el('div',{class:'elf-wages'},WAGES.map(([id,label])=>{
    const have=stock[id]||0;
    return el('div',{class:'gp-hero elf-wage'},[
     visualItemIcon(items,`recipe_${id}`,{size:40}),
     el('div',{class:'gp-hero-copy'},[el('strong',{text:label}),el('small',{text:`Hộp ${num(view.box[id])} · Kho ${num(have)}`})]),
     iconButton('chest',`Bỏ ${num(have)} ${label} vào hộp công`,async()=>{const res=await fill(id,have);if(res?.ok){notify([`🧦 Đã bỏ ${num(have)} ${label} vào hộp công gia tinh.`,elfShiftText(res.receipt?.elfJobs)].filter(Boolean).join(' · '));render();}},{text:'Trả công',class:'primary',disabled:have<1,'data-elf-wage':id}),
    ]);
   })),
   el('div',{class:'owl-chest-meter'},[
    el('small',{text:'Hôm nay'}),
    el('div',{class:'gp-meter',role:'progressbar','aria-valuemin':'0','aria-valuemax':String(view.cap),'aria-valuenow':String(done)},[el('span',{style:`width:${Math.round(done/view.cap*100)}%`})]),
    el('b',{text:`${done}/${view.cap}`}),
   ]),
   ...view.jobs.map(job=>el('p',{class:'meta elf-job',text:`${clockText(job.at)} · ${elfJobText(job)} · ${wageName(job.wage)}`})),
   // S5: work done while the member was away, on a day that is over.
   ...(view.past||[]).map(job=>el('p',{class:'meta elf-job',text:`${dayClockText(job.at)} · ${elfJobText(job)} · ${wageName(job.wage)}`})),
  );
 }
 return {
  open(){render();dialog.showModal();},
  // After each server reply: refresh an open panel.
  sync(){if(dialog.open)render();},
 };
}
