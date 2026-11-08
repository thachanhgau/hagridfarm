// «Đàn thú: tâm trạng và tương tác» (25.0 S4, server garden-mood-core): one creature's mood and this cycle's
// interactions (action tendCreature), its tricks and its rare-coat grooming. The server keeps every number; this
// panel only shows snapshot.mood. mobile-game imports it on the first «Chăm bé» tap or a tap on Norbert.
import {$,el,icon,duration} from './ui-utils.mjs?v=25.0.2';
import {iconButton,pixelIcon} from './pixel-icons.mjs?v=25.0.2';
import {COAT_STEPS} from './garden-winter.mjs?v=25.0.2';

export const NORBERT='norbert';
// Play toys (roadmap §4: Đào mỏ – đồ lấp lánh, Kneazle – cuộn len, Chó ba đầu – thổi sáo cho ngủ, HP1).
const TOYS=Object.freeze({puffskein:'Bóng bông',bowtruckle:'Que gỗ',niffler:'Đồ lấp lánh',mooncalf:'Đèn trăng',kneazle:'Cuộn len',diricawl:'Hạt dẻ',fwooper:'Chuông nhỏ',hippogriff:'Vòng gỗ',thestral:'Dây thừng',unicorn:'Vòng hoa','three-headed-dog':'Thổi sáo',dragon:'Khúc củi',grindylow:'Vỏ ốc',crup:'Ném gậy',knarl:'Quả thông',salamander:'Que củi',[NORBERT]:'Cuộn len đỏ'}); // grindylow: garden expansion §2.1
// Three tricks a species, three lessons each, one lesson a day (server LESSONS_PER_TRICK).
export const TRICKS=Object.freeze({
 puffskein:['Lăn tròn','Thè lưỡi','Kêu rừ rừ'],bowtruckle:['Chỉ đường','Đứng im như cành','Vẫy lá'],niffler:['Đánh hơi vàng','Lộn túi','Giấu cúc áo'],
 mooncalf:['Múa dưới trăng','Nhảy lò cò','Ngước nhìn trăng'],kneazle:['Bắt tay','Rình chuột','Uốn đuôi chào'],diricawl:['Biến mất','Hiện ra','Vỗ cánh'],
 fwooper:['Hót','Đổi giọng','Hót đôi'],hippogriff:['Cúi chào','Xòe cánh','Bay vòng'],thestral:['Vẫy cánh','Gật đầu','Bay thấp'],
 unicorn:['Gật đầu','Gõ vó','Phi nước kiệu'],'three-headed-dog':['Ba đầu cùng ngồi','Bắt tay','Ngủ theo tiếng sáo'],dragon:['Phì khói','Xòe cánh','Cuộn đuôi'],
 grindylow:['Vẫy ngón dài','Lặn sâu','Thổi bong bóng'],
 crup:['Vẫy đuôi nĩa','Nhặt gậy','Đi theo bác Hagrid'],knarl:['Cuộn tròn','Xù gai','Lục lá khô'],salamander:['Bò trên củi','Phun tia lửa','Nằm trong than'], // phase 2
 [NORBERT]:['Phì khói','Lăn tròn','Vồ cuộn len'],
});
const LESSONS=3;
const RIDERS=['hippogriff','thestral'];
const groomLabel=sp=>sp==='dragon'||sp===NORBERT?'Chải vảy':sp==='fwooper'||sp==='diricawl'?'Tắm':sp==='grindylow'?'Gỡ rêu':sp==='knarl'?'Gỡ gai':sp==='salamander'?'Thêm củi':'Chải lông';
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

export function createMoodCare({getSnapshot,tend,items,notify,labelOf,bondOf,onTended}){
 const body=el('div',{class:'mood-care-body'});
 const title=el('h2',{id:'creatureMoodTitle',text:'Chăm bé'});
 const dialog=el('dialog',{id:'creatureMood',class:'owl-letter mood-care','aria-labelledby':'creatureMoodTitle'},[
  el('div',{class:'popover-heading'},[title,iconButton('close','Đóng',()=>dialog.close(),{class:'gp-close'})]),
  body,
 ]);
 ($('gameShell')||document.body).append(dialog);
 dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
 let species=null,timer=0;

 function render(){
  const view=getSnapshot()?.mood,entry=view?.creatures?.[species];
  if(!entry){body.replaceChildren(el('p',{class:'meta',text:view?'Chưa có bé này trong vườn.':'Cần kết nối tài khoản.'}));return;}
  const now=Date.now(),name=labelOf(species);
  title.textContent=name;
  const learned=trickNames(species,entry.lessons);
  const steps=COAT_STEPS.map(([label,points])=>el('span',{class:'mood-chip'+(entry.coat>=points?' is-on':''),text:`${label} ${Math.min(entry.coat,points)}/${points}`}));
  body.replaceChildren(
   el('div',{class:'gp-hero mood-hero'},[
    species===NORBERT?el('span',{class:'mood-portrait'},[el('img',{src:'environment/elves/norbert/idle.png',width:40,height:40,alt:'',style:'image-rendering:pixelated'})]):icon(items,species,3,40),
    el('div',{class:'gp-hero-copy'},[
     el('strong',{text:`Tâm trạng ${entry.mood}`}),
     el('div',{class:'gp-meter mood-meter'+(entry.mood>=view.happy?' is-happy':entry.mood<40?' is-low':''),role:'progressbar','aria-valuemin':'0','aria-valuemax':'100','aria-valuenow':String(entry.mood),'aria-label':'Tâm trạng'},[el('span',{style:`width:${entry.mood}%`})]),
     el('small',{text:`Lượt mới ${clockText(view.nextCycleAt)}${entry.mood>=view.happy&&species!==NORBERT?' · vui: +1 sản phẩm':''}`}),
    ]),
   ]),
   el('div',{class:'mood-tiles'},moodTiles({species,entry,view,bondLevel:bondOf(species),now}).map(t=>{
    const b=el('button',{type:'button',class:'mood-tile','data-kind':t.kind,disabled:!t.enabled,'aria-label':t.label+(t.state?' · '+t.state:'')},[pixelIcon(t.art,2),el('b',{text:t.label}),t.state?el('small',{text:t.state}):null]);
    b.onclick=async()=>{const res=await tend(species,t.kind);if(res?.ok){const r=res.receipt?.tend;if(r)notify(tendText(r,labelOf));onTended?.(r);render();}};
    return b;
   })),
   el('div',{class:'mood-row'},[el('small',{text:`Trò · ${entry.lessons}/9 bài`}),...(TRICKS[species]||[]).map((n,i)=>el('span',{class:'mood-chip'+(learned.length>i?' is-on':''),text:n}))]),
   species===NORBERT?null:el('div',{class:'mood-row'},[el('small',{text:'Bộ lông'}),...steps]),
  );
  clearTimeout(timer);
  if(dialog.open&&entry.roamUntil&&entry.roamUntil>now)timer=setTimeout(render,Math.min(60000,entry.roamUntil-now+500));
 }
 return {
  open(id){species=id;render();dialog.showModal();},
  // After each server reply: refresh an open panel.
  sync(){if(dialog.open)render();},
 };
}
