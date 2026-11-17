// «Đàn thú: tâm trạng và tương tác» (25.0 S4, server garden-mood-core): one creature's mood and this cycle's
// interactions (action tendCreature), its tricks and its rare-coat grooming. The server keeps every number; this
// panel only shows snapshot.mood. mobile-game imports it on the first «Chăm bé» tap or a tap on Norbert.
import {$,el,icon,duration} from './ui-utils.mjs?v=26.6';
import {iconButton,pixelIcon} from './pixel-icons.mjs?v=26.6';
import {COAT_STEPS} from './garden-winter.mjs?v=26.6';
import {skillCard,skillText,line} from './garden-skills-card.mjs?v=26.6';
import {skillOf} from './garden-skills-ui.mjs?v=26.6';

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
const groomLabel=sp=>sp==='dragon'||sp===NORBERT?'Chải vảy':sp==='fwooper'||sp==='diricawl'?'Tắm':sp==='grindylow'?'Gỡ rêu':sp==='knarl'?'Gỡ gai':sp==='salamander'?'Thêm củi':sp==='kappa'?'Tưới đĩa nước':sp==='porlock'?'Chải bờm':'Chải lông';
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
 tile('play','festival',TOYS[species]||'Chơi',done.has('play')&&'Xong lượt');
 // Phase 2: the day's first play with Chó đuôi nĩa also cheers the other pen creatures (server garden-mood-core crupCheer).
 if(species==='crup'&&!done.has('play')&&view.crupCheered===false)tiles.at(-1).state='Cả chuồng +5';
 tile('groom','care',groomLabel(species),done.has('groom')&&'Xong lượt');
 tile('train','book','Dạy trò',entry.lessons>=LESSONS*3?'Thuộc cả 3':entry.lessonToday?'Mai học tiếp':done.has('train')&&'Xong lượt');
 if(!norbert){
  const roaming=entry.roamUntil&&entry.roamUntil>now;
  tile('roam','map',entry.roamUntil&&!roaming?'Đón về':'Thả rông 1 giờ',roaming?'Còn '+duration(entry.roamUntil-now):!entry.roamUntil&&(done.has('roam')?'Xong lượt':view.roamsLeft<1&&'Hết lượt hôm nay'));
  if(RIDERS.includes(species))tile('ride','floo','Cưỡi bay',bondLevel<5?'Gắn kết cấp 5':done.has('ride')&&'Xong lượt');
  if(species==='niffler'&&view.winter)tile('reclaim','chest','Đòi đồ trang trí',done.has('reclaim')&&'Xong lượt');
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
 // One frame: header (portrait · name over its skill · close), then a single 3-column grid of rows.
 const body=el('div',{class:'mood-care-body mood-grid'});
 const title=el('h2',{id:'creatureMoodTitle',text:'Chăm bé'}),sub=el('small',{class:'mood-sub'}),face=el('span',{class:'mood-portrait'});
 const dialog=el('dialog',{id:'creatureMood',class:'owl-letter mood-care','aria-labelledby':'creatureMoodTitle'},[
  el('div',{class:'popover-heading mood-head'},[face,el('div',{class:'mood-head-copy'},[title,sub]),iconButton('close','Đóng',()=>dialog.close(),{class:'gp-close'})]),
  body,
 ]);
 ($('gameShell')||document.body).append(dialog);
 dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
 let species=null,timer=0;
 const meter=(value,max,cls='')=>el('div',{class:'gp-meter mood-meter'+cls},[el('span',{style:`width:${Math.round(value/max*100)}%`})]);

 function render(){
  const snap=getSnapshot(),view=snap?.mood,entry=view?.creatures?.[species];
  if(!entry){face.replaceChildren();sub.textContent='';body.replaceChildren(el('p',{class:'meta mood-wide',text:view?'Chưa có bé này trong vườn.':'Cần kết nối tài khoản.'}));return;}
  const now=Date.now(),norbert=species===NORBERT,happy=entry.mood>=view.happy;
  title.textContent=labelOf(species);
  sub.textContent=norbert?'':skillOf(snap,species)?.name||'';
  face.replaceChildren(norbert?el('img',{src:'environment/elves/norbert/idle.png',width:40,height:40,alt:'',style:'image-rendering:pixelated'}):icon(items,species,3,40));
  const mood=meter(entry.mood,100,happy?' is-happy':entry.mood<40?' is-low':'');
  Object.entries({role:'progressbar','aria-valuemin':'0','aria-valuemax':'100','aria-valuenow':String(entry.mood),'aria-label':'Tâm trạng'}).forEach(([k,v])=>mood.setAttribute(k,v));
  // A trick is learned after LESSONS lessons, in order; a coat step fills from the same coat points.
  const tricks=(TRICKS[species]||[]).map((n,i)=>{const got=Math.min(LESSONS,Math.max(0,(entry.lessons||0)-i*LESSONS));return line(n,meter(got,LESSONS,' is-happy'),`${got}/${LESSONS}`,got>=LESSONS?'is-done':'');});
  const coats=norbert?[]:COAT_STEPS.map(([label,points])=>{const got=Math.min(entry.coat||0,points);return line(label,meter(got,points,' is-happy'),`${got}/${points}`,got>=points?'is-done':'');});
  body.replaceChildren(...[
   line('Tâm trạng',mood,String(entry.mood)),
   line('Lượt mới','',clockText(view.nextCycleAt)),
   happy&&!norbert?line('Đang vui','+1 sản phẩm','','is-good'):null,
   // Season 2: this creature's skill rows (garden-skills-card); its gold action sends action `skill`.
   ...(norbert?[]:skillCard({species,snap,now,use:async(sp,target)=>{const res=await useSkill(sp,target);const r=res?.ok&&res.receipt?.skill;if(r){notify(skillText(r));onSkill?.(r);render();}}})||[]),
   el('div',{class:'mood-acts'},moodTiles({species,entry,view,bondLevel:bondOf(species),now}).map(t=>{
    const b=el('button',{type:'button',class:'mood-act','data-kind':t.kind,disabled:!t.enabled,'aria-label':t.label+(t.state?' · '+t.state:'')},[pixelIcon(t.art,2),el('b',{text:t.label}),t.state?el('small',{text:t.state}):null]);
    b.onclick=async()=>{const res=await tend(species,t.kind);if(res?.ok){const r=res.receipt?.tend;if(r)notify(tendText(r,labelOf));onTended?.(r);render();}};
    return b;
   })),
   line('Trò','',`${entry.lessons||0}/${LESSONS*3} bài`,'mood-sec mood-gap'),...tricks,
   ...(coats.length?[line('Bộ lông','','','mood-sec mood-gap'),...coats]:[]),
  ].filter(Boolean));
  clearTimeout(timer);
  if(dialog.open&&entry.roamUntil&&entry.roamUntil>now)timer=setTimeout(render,Math.min(60000,entry.roamUntil-now+500));
 }
 return {
  open(id){species=id;render();dialog.showModal();},
  // After each server reply: refresh an open panel.
  sync(){if(dialog.open)render();},
 };
}
