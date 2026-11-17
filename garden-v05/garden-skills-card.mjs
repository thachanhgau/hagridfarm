// Season 2 «Tài năng sinh vật» (26.0): the skill rows inside «Chăm bé» and the receipt line. garden-mood-ui imports it,
// so it loads on the first «Chăm bé» tap; the startup part (marks, passive lines) is garden-skills-ui.
import {el,button} from './ui-utils.mjs?v=26.5';
import * as E from './progression-engine.mjs?v=26.5';
import {skillOf,isReady,skillTargets,kneazleMarks} from './garden-skills-ui.mjs?v=26.5';

// Atlas order = Codex brief docs/codex-briefs/skills-s2.md (balance order): 6 × 3 cells of 64 px.
export const SKILL_ORDER=Object.freeze(['puffskein','bowtruckle','niffler','mooncalf','kneazle','diricawl','fwooper','hippogriff','thestral','unicorn','three-headed-dog','dragon','grindylow','crup','knarl','salamander','kappa','porlock']);
// One line a skill, rank 1 / rank 2 (roadmap §3). Numbers mirror garden-skill-core.
const WHAT=Object.freeze({
 puffskein:['Gặt 1 thửa chín, nhả lại 1 hạt rẻ','2 thửa mỗi ngày'],bowtruckle:['1 thửa đang lớn bớt 15 phút','2 thửa mỗi ngày'],
 niffler:['Đào thửa trống: 3–8 Nước, đôi khi hạt','2 lần mỗi ngày'],mooncalf:['18:00–06:00: 1 thửa bớt 30 phút','2 thửa mỗi ngày'],
 kneazle:['Đánh dấu cây sắp héo, bữa xong, bé sắp ốm','Thêm danh sách việc cần làm'],diricawl:['Tự gặt thửa chín 2 giờ khi con vắng','2 thửa mỗi ngày'],
 fwooper:['Cả chuồng +8 tâm trạng','Cả chuồng +12 tâm trạng'],hippogriff:['+10 Nước','2 lần mỗi ngày'],
 thestral:['Bé ở Rừng Cấm về sau 1 bữa dụ','Mọi bé'],unicorn:['Chữa 1 bé ốm (trước cấp 130: +15 tâm trạng)','Chữa xong thêm +15 tâm trạng'],
 'three-headed-dog':['22:00–06:00 ma lùm không ăn cây','Thêm đuổi 1 ma lùm mỗi ngày'],dragon:['Dọn thửa khô hoặc thửa ma lùm phá','4 thửa mỗi ngày'],
 grindylow:['Hồ không đục, tự kéo lưới cá chín','Câu trúng rộng gấp đôi, thêm 1 cá con mỗi ngày'],crup:['Ăn 1 ma lùm mỗi ngày','3 ma lùm mỗi ngày'],
 knarl:['1 thửa hết đất mỏi','2 thửa mỗi ngày'],salamander:['Giữ 2 thửa khi cháy và tuần sương giá','4 thửa'],
 kappa:['Hạn hán: cây 3 giờ tốn 1 Nước mỗi ô','Hạn hán: cây 3 giờ gieo không tốn Nước'],porlock:['Bằng-Mã, Vong mã, Kỳ lân không dưới 50 tâm trạng','Không dưới 60'],
});
export const WHY=Object.freeze({'skills-off':'Kỹ năng đang tạm tắt','fled':'Bé đang ở Rừng Cấm','locked':'Bậc 1: trưởng thành và gắn bó cấp 3','sick':'Bé đang ốm','roaming':'Bé đang đi rông','sad':'Bé buồn: cần tâm trạng từ 50'});
const RANK=['Chưa có','1','2','3 · Tinh thông'];
const NEXT=['Bậc 1: trưởng thành và gắn bó cấp 3','Bậc 2: gắn bó cấp 5 và thuộc cả 3 trò','Bậc 3: vườn cấp 1.000',''];
const vnHour=t=>new Date(t+7*3600000).getUTCHours();
const label=sp=>E.CREATURE[sp]?.label||sp;

/** Kneazle rank 2: the to-do lines. */
export function todoLines(snap,now=Date.now()){
 const k=kneazleMarks(snap,now);if(k.rank<2)return [];
 return [...[...k.plots].map(i=>`Thửa ${i+1} sắp héo`),...[...k.meals].map(sp=>`${label(sp)} xong bữa`),...[...k.sick].map(sp=>`${label(sp)} sắp ốm`)];
}

/** One row of the «Chăm bé» grid (label · text or meter · number); without a number the text spans to the right edge. */
export const line=(label,mid,value='',cls='')=>el('div',{class:('mood-line '+cls).trim()},[
 el('span',{class:'mood-k',text:label}),
 mid&&typeof mid==='object'?mid:el('span',{class:'mood-v'+(value?'':' is-wide'),text:mid||''}),
 value?el('b',{class:'mood-n',text:value}):null,
]);
const picked={}; // species → the target last chosen, kept across re-renders

/** The skill rows inside «Chăm bé»: rank and uses, what it gives, what blocks or comes next, then its target
 *  picker and one gold action. `use(species,target)` sends action `skill`. */
export function skillCard({species,snap,use,now=Date.now()}){
 const s=skillOf(snap,species);if(!s)return null;
 const what=WHAT[species]||['',''],r=Math.min(s.rank,3);
 const count=s.passive?(s.cap?`${s.left}/${s.cap} hôm nay`:'Luôn bật'):`Còn ${s.left}/${s.cap} lượt`;
 const rows=[line('Bậc',RANK[r],r?count:'','mood-gap'),line('Tác dụng',what[0]+(r>=2?' · '+what[1]:''))];
 if(s.blocked&&s.blocked!=='locked')rows.push(line('Lúc này',WHY[s.blocked]||s.blocked,'','is-warn'));
 else{const next=(s.blocked?NEXT[0]:NEXT[r]).split(': ');if(next[1])rows.push(line(next[0],next[1],'',s.blocked?'is-warn':'is-muted'));}
 const todo=species==='kneazle'?todoLines(snap,now):[];
 if(todo.length)rows.push(line('Việc cần',todo.join(' · ')));
 if(isReady(s)){
  const targets=skillTargets(species,snap,now),night=vnHour(now)>=18||vnHour(now)<6;
  const go=(text,fn)=>{const b=button('',fn,{class:'mood-act mood-cta'+(fn?' primary':''),disabled:!fn});b.append(skillIcon(species),el('b',{text}));return b;};
  let act;
  if(species==='mooncalf'&&!night)act=[go('Chỉ ra vườn 18:00–06:00')];
  else if(targets===null)act=[go('Nhờ bé',()=>use(species))];
  else if(!targets.length)act=[go(species==='unicorn'?'Không có bé ốm':'Chưa có thửa hợp')];
  else{
   const list=targets.slice(0,12),name=x=>typeof x==='number'?`Thửa ${x+1}`:label(x);
   let pick=list.includes(picked[species])?picked[species]:list[0];
   const cta=go('',()=>use(species,pick)),say=()=>{cta.querySelector('b').textContent=`Nhờ bé · ${name(pick)}`;};
   const chips=list.length<2?null:el('div',{class:'mood-pick',role:'group','aria-label':'Chọn chỗ cho bé giúp'},list.map(x=>button(name(x),e=>{
    pick=picked[species]=x;for(const c of chips.children)c.setAttribute('aria-pressed',String(c===e.currentTarget));say();
   },{'aria-pressed':String(x===pick)})));
   say();act=[chips,cta];
  }
  rows.push(el('div',{class:'mood-wide'},act));
 }
 return rows;
}
export function skillIcon(species){
 const i=SKILL_ORDER.indexOf(species);
 return el('span',{class:'skill-icon',style:`background-position:${-(i%6)*32}px ${-Math.floor(i/6)*32}px`,'aria-hidden':'true'});
}

/** The line after a `skill` receipt (receipt.skill, fields per garden-skill-core EFFECTS). */
export function skillText(r){
 if(!r)return '';
 const who=label(r.species),plot=Number.isInteger(r.plotIndex)?`thửa ${r.plotIndex+1}`:'',crop=id=>E.CROP[id]?.label||id;
 const text={
  puffskein:()=>`${who} gặt ${plot} (${r.crops} cây)${r.seed?`, nhả lại 1 hạt ${crop(r.seed)}`:''}`,
  bowtruckle:()=>`${who} tỉa ${plot}: ${r.crops} cây bớt ${Math.round(r.cutMs/60000)} phút`,
  niffler:()=>`${who} đào ${plot}: +${r.water} Nước${r.seed?`, 1 hạt ${crop(r.seed)}`:''}${r.boost?', 1 Nước phép':''}`,
  fwooper:()=>`${who} hát ru: ${r.cheered.length} bé +${r.gain} tâm trạng`,
  hippogriff:()=>`${who} chở về +${r.water} Nước`,
  unicorn:()=>r.cured?`${who} chữa lành ${label(r.target)}${r.gain?` · +${r.gain} tâm trạng`:''}`:`${label(r.target)} +${r.gain} tâm trạng`,
  dragon:()=>`${who} thiêu cỏ ${plot}${r.gnome?': ma lùm chạy mất':`: dọn ${r.cleared} ô khô`}`,
  knarl:()=>`${who} xới ${plot}: đất hết mỏi`,
 }[r.species==='mooncalf'?'bowtruckle':r.species];
 return text?text()+` · còn ${r.left} lượt.`:'';
}
