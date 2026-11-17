// «Đàn thú: tâm trạng và tương tác» (25.0 S4, server garden-mood-core): one creature's mood and this cycle's
// interactions (action tendCreature), its tricks and its rare-coat grooming. The server keeps every number; this
// panel only shows snapshot.mood. mobile-game imports it on the first «Chăm bé» tap or a tap on Norbert.
import {$,el,icon,duration,closeOnBackdrop} from './ui-utils.mjs?v=26.12';
import {iconButton,pixelIcon} from './pixel-icons.mjs?v=26.12';
import {COAT_STEPS,groomLabel} from './garden-winter.mjs?v=26.12';
import {skillCard,skillText,skillTitle,section} from './garden-skills-card.mjs?v=26.12';
import {skillOf} from './garden-skills-ui.mjs?v=26.12';

export const NORBERT='norbert';
// Play toys (roadmap §4: Đào mỏ – đồ lấp lánh, Kneazle – cuộn len, Chó ba đầu – thổi sáo cho ngủ, HP1).
const TOYS=Object.freeze({puffskein:'Bóng bông',bowtruckle:'Que gỗ',niffler:'Đồ lấp lánh',mooncalf:'Đèn trăng',kneazle:'Cuộn len',diricawl:'Hạt dẻ',fwooper:'Chuông nhỏ',hippogriff:'Vòng gỗ',thestral:'Dây thừng',unicorn:'Vòng hoa','three-headed-dog':'Thổi sáo',dragon:'Khúc củi',grindylow:'Vỏ ốc',crup:'Ném gậy',knarl:'Quả thông',salamander:'Que củi',kappa:'Quả dưa chuột',porlock:'Bó cỏ khô',[NORBERT]:'Cuộn len đỏ'}); // grindylow: garden expansion §2.1
// Three tricks a species, three lessons each, one lesson a day (server LESSONS_PER_TRICK).
export const TRICKS=Object.freeze({
 puffskein:['Lăn tròn','Thè lưỡi','Kêu rừ rừ'],bowtruckle:['Chỉ đường','Đứng im như cành','Vẫy lá'],niffler:['Đánh hơi vàng','Lộn túi','Giấu cúc áo'],
 mooncalf:['Múa dưới trăng','Nhảy lò cò','Ngước nhìn trăng'],kneazle:['Bắt tay','Rình chuột','Uốn đuôi chào'],diricawl:['Biến mất','Hiện ra','Vỗ cánh'],
 fwooper:['Hót','Đổi giọng','Hót đôi'],hippogriff:['Cúi chào','Xòe cánh','Bay vòng'],thestral:['Vẫy cánh','Gật đầu','Bay thấp'],
 unicorn:['Gật đầu','Gõ vó','Phi nước kiệu'],'three-headed-dog':['Ba đầu cùng ngồi','Bắt tay','Ngủ theo tiếng sáo'],dragon:['Phì khói','Xòe cánh','Cuộn đuôi'],
 grindylow:['Vẫy ngón dài','Lặn sâu','Thổi bong bóng'],
 crup:['Vẫy đuôi nĩa','Nhặt gậy','Đi theo bác Hagrid'],knarl:['Cuộn tròn','Xù gai','Lục lá khô'],salamander:['Bò trên củi','Phun tia lửa','Nằm trong than'], // phase 2
 kappa:['Cúi chào đổ nước','Bơi ngửa','Bắt cá bằng tay'],porlock:['Đứng hai chân','Gõ móng','Canh cổng bãi chăn'], // phase 3
 [NORBERT]:['Phì khói','Lăn tròn','Vồ cuộn len'],
});
const LESSONS=3;
const RIDERS=['hippogriff','thestral'];
export const trickNames=(species,lessons)=>(TRICKS[species]||[]).slice(0,Math.floor((lessons||0)/LESSONS));
// What a visited garden's creatures perform (snapshot visit.tricks = {species: whole tricks}).
export function visitShow(tricks={},labelOf=sp=>sp){
 return Object.entries(tricks).map(([sp,n])=>`${labelOf(sp)} ${(TRICKS[sp]||[])[Math.max(0,n-1)]?.toLowerCase()||''}`.trim()).join(' · ');
}

const clockText=ms=>{const d=new Date(ms+7*3600000);return `${String(d.getUTCHours()).padStart(2,'0')}:${String(d.getUTCMinutes()).padStart(2,'0')}`;};

// The interaction tiles for one creature: [kind, icon, label, state text, enabled].
export function moodTiles({species,entry,view,bondLevel=1,now=Date.now()}){
 const done=new Set(entry.done||[]),norbert=species===NORBERT,tiles=[];
 const tile=(kind,art,label,blocked)=>tiles.push({kind,art,label,state:blocked||'',enabled:!blocked});
 tile('play','star',TOYS[species]||'Chơi',done.has('play')&&'Đã xong');
 // Phase 2: the day's first play with Chó đuôi nĩa also cheers the other pen creatures (server garden-mood-core crupCheer).
 if(species==='crup'&&!done.has('play')&&view.crupCheered===false)tiles.at(-1).state='Cả chuồng vui thêm 5';
 tile('groom','paw',groomLabel(species),done.has('groom')&&'Đã xong');
 tile('train','book','Dạy trò',entry.lessons>=LESSONS*3?'Đã thuộc 3 trò':entry.lessonToday?'Mai học tiếp':done.has('train')&&'Đã xong');
 if(!norbert){
  const roaming=entry.roamUntil&&entry.roamUntil>now;
  tile('roam','map',entry.roamUntil&&!roaming?'Đón về':'Thả rông 1 giờ',roaming?'Còn '+duration(entry.roamUntil-now):!entry.roamUntil&&(done.has('roam')?'Đã xong':view.roamsLeft<1&&'Hết lượt hôm nay'));
  if(RIDERS.includes(species))tile('ride','floo','Cưỡi bay',bondLevel<5?'Cần gắn bó cấp 5':done.has('ride')&&'Đã xong');
  if(species==='niffler'&&view.winter)tile('reclaim','chest','Đòi lại đồ trang trí',done.has('reclaim')&&'Đã xong');
 }
 return tiles;
}

export function tendText(tend,labelOf){
 const name=labelOf(tend.species);
 if(tend.kind==='roam')return tend.back?`${name} đi rông về${Object.values(tend.found||{})[0]?`, mang theo ${Object.values(tend.found)[0]} phần ăn`:''} · tâm trạng ${tend.mood}.`:`${name} đi rông tới ${clockText(tend.roamUntil)}.`;
 if(tend.cheered?.length)return `${name} chơi vui · tâm trạng ${tend.mood} · ${tend.cheered.length} bạn trong chuồng vui thêm +${tend.cheer}.`;
 const verb={play:'chơi vui',groom:'sạch sẽ, mượt mà',train:'học thêm một bài',ride:'chở con bay một vòng vườn',reclaim:'trả lại món đồ trang trí'}[tend.kind]||'vui';
 return `${name} ${verb} · tâm trạng ${tend.mood}.`;
}

export function createMoodCare({getSnapshot,tend,useSkill,items,notify,labelOf,bondOf,onTended,onSkill}){
 // One frame: header (portrait · name over skill · rank · close), then blocks Tâm trạng · Kỹ năng · Chăm sóc · Trò · Màu hiếm.
 const body=el('div',{class:'mood-care-body'});
 // ‹ › walk through every creature in the tray's order without closing (owner 17/11/2026).
 const order=()=>{const snap=getSnapshot(),have=snap?.mood?.creatures||{},list=(snap?.garden?.progression?.creatures||[]).map(c=>c.species).filter(sp=>have[sp]);
  for(const sp of Object.keys(have))if(!list.includes(sp))list.push(sp);return list;};
 const step=d=>{const l=order(),i=l.indexOf(species);if(l.length<2)return;species=l[(i+d+l.length)%l.length];render();};
 const prev=iconButton('chevron','Bé trước',()=>step(-1),{class:'mood-nav is-prev',popover:'manual'}),next=iconButton('chevron','Bé sau',()=>step(1),{class:'mood-nav is-next',popover:'manual'});
 const showNav=on=>{for(const b of [prev,next]){if(!b.showPopover){b.hidden=!on;continue;}const open=b.matches(':popover-open');if(on&&!open)b.showPopover();else if(!on&&open)b.hidePopover();}};
 const title=el('h2',{id:'creatureMoodTitle',text:'Chăm bé'}),sub=el('small',{class:'mood-sub'}),face=el('span',{class:'mood-portrait'});
 const dialog=el('dialog',{id:'creatureMood',class:'owl-letter mood-care','aria-labelledby':'creatureMoodTitle'},[
  el('div',{class:'popover-heading mood-head'},[face,el('div',{class:'mood-head-copy'},[title,sub]),iconButton('close','Đóng',()=>dialog.close(),{class:'gp-close'})]),
  body,prev,next,
 ]);
 // The arrows sit on the frame's side edges at mid-height; as popovers (top layer, still inside the dialog so not inert)
 // Safari no longer clips them at the dialog's padding box (owner 17/11/2026: «để ở trên ko ai để ý»), fixed
 // to the viewport so they stay put while the list scrolls.
 const placeNav=()=>{if(!dialog.open)return;const r=dialog.getBoundingClientRect(),top=Math.round(r.top+r.height/2-32)+'px';
  prev.style.top=next.style.top=top;prev.style.left=Math.round(r.left-12)+'px';next.style.left=Math.round(r.right-20)+'px';};
 addEventListener('resize',placeNav);
 ($('gameShell')||document.body).append(dialog);
 closeOnBackdrop(dialog);
 dialog.addEventListener('close',()=>showNav(false));
 let species=null,timer=0;
 const meter=(value,max,cls='')=>el('div',{class:'gp-meter mood-meter'+cls},[el('span',{style:`width:${Math.round(value/max*100)}%`})]);

 function render(){
  const snap=getSnapshot(),view=snap?.mood,entry=view?.creatures?.[species];
  if(!entry){face.replaceChildren();sub.textContent='';body.replaceChildren(el('p',{class:'meta mood-wide',text:view?'Chưa có bé này trong vườn.':'Cần kết nối tài khoản.'}));return;}
  const now=Date.now(),norbert=species===NORBERT,happy=entry.mood>=view.happy;
  showNav(dialog.open&&order().length>1);
  requestAnimationFrame(placeNav);
  title.textContent=labelOf(species);
  sub.textContent=norbert?'':skillTitle(skillOf(snap,species));
  face.replaceChildren(norbert?el('img',{src:'environment/elves/norbert/idle.png',width:40,height:40,alt:'',style:'image-rendering:pixelated'}):icon(items,species,3,40));
  const mood=meter(entry.mood,100,happy?' is-happy':entry.mood<40?' is-low':'');
  Object.entries({role:'progressbar','aria-valuemin':'0','aria-valuemax':'100','aria-valuenow':String(entry.mood),'aria-label':'Tâm trạng'}).forEach(([k,v])=>mood.setAttribute(k,v));
  // name · thin bar · n/m, the same row for tricks (LESSONS lessons each, in order) and coat steps (coat points).
  const row=(name,got,max)=>el('div',{class:'mood-row'+(got>=max?' is-done':'')},[el('span',{text:name}),meter(got,max,' is-happy'),el('b',{text:`${got}/${max}`})]);
  const tricks=(TRICKS[species]||[]).map((n,i)=>row(n,Math.min(LESSONS,Math.max(0,(entry.lessons||0)-i*LESSONS)),LESSONS));
  const coats=norbert?[]:COAT_STEPS.map(([label,points])=>row(label,Math.min(entry.coat||0,points),points));
  body.replaceChildren(...[
   section('Tâm trạng',`Chăm lại lúc ${clockText(view.nextCycleAt)}`,el('div',{class:'mood-bar'},[mood,el('b',{text:String(entry.mood)})]),
    happy&&!norbert?el('p',{class:'mood-note is-good',text:'Đang vui: thêm 1 sản vật mỗi lần nhận'}):null),
   // Season 2: this creature's skill block (garden-skills-card); its gold action sends action `skill`.
   norbert?null:skillCard({species,snap,now,use:async(sp,target)=>{const res=await useSkill(sp,target);const r=res?.ok&&res.receipt?.skill;if(r){notify(skillText(r));onSkill?.(r);render();}}}),
   section('Chăm sóc','',el('div',{class:'mood-acts'},moodTiles({species,entry,view,bondLevel:bondOf(species),now}).map(t=>{
    const b=el('button',{type:'button',class:'mood-act','data-kind':t.kind,disabled:!t.enabled,'aria-label':t.label+(t.state?' · '+t.state:'')},
     [pixelIcon(t.art,2),el('span',{},[el('b',{text:t.label}),t.state?el('small',{text:t.state}):null])]);
    b.onclick=async()=>{const res=await tend(species,t.kind);if(res?.ok){const r=res.receipt?.tend;if(r)notify(tendText(r,labelOf));onTended?.(r);render();}};
    return b;
   }))),
   section('Trò',`${entry.lessons||0}/${LESSONS*3} bài`,el('div',{class:'mood-rows'},tricks)),
   coats.length?section('Màu hiếm','',el('div',{class:'mood-rows'},coats)):null,
  ].filter(Boolean));
  clearTimeout(timer);
  if(dialog.open&&entry.roamUntil&&entry.roamUntil>now)timer=setTimeout(render,Math.min(60000,entry.roamUntil-now+500));
 }
 return {
  open(id){species=id;dialog.showModal();render();placeNav();},
  // After each server reply: refresh an open panel.
  sync(){if(dialog.open)render();},
 };
}
