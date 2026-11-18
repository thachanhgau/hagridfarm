// Season 2 «Tài năng sinh vật» (26.0): the skill rows inside «Chăm bé» and the receipt line. garden-mood-ui imports it,
// so it loads on the first «Chăm bé» tap; the startup part (marks, passive lines) is garden-skills-ui.
import {el,button} from './ui-utils.mjs?v=26.20';
import {pixelIcon} from './pixel-icons.mjs?v=26.20';
import * as E from './progression-engine.mjs?v=26.20';
import {skillOf,isReady,skillTargets,kneazleMarks} from './garden-skills-ui.mjs?v=26.20';

// Atlas order = Codex brief docs/codex-briefs/skills-s2.md (balance order): 6 × 3 cells of 64 px.
export const SKILL_ORDER=Object.freeze(['puffskein','bowtruckle','niffler','mooncalf','kneazle','diricawl','fwooper','hippogriff','thestral','unicorn','three-headed-dog','dragon','grindylow','crup','knarl','salamander','kappa','porlock']);
// What the skill does, at bậc 1 and (when it changes) bậc 2+, in the player's words. Numbers mirror garden-skill-core;
// the uses left sit in the block's header, so the sentences never repeat counts (owner 17/11/2026: «dò lại chữ nghĩa»).
const WHAT=Object.freeze({
 puffskein:['Gặt 1 thửa đã chín và trả lại 1 hạt của cây vừa gặt (hạt giá đến 25 G).'],
 bowtruckle:['Cây trong 1 thửa đang lớn chín sớm 10% thời gian còn lại (ít nhất 15 phút).'],
 niffler:['Đào 1 thửa được 3–8 Nước. Đôi khi thêm 1 hạt, hiếm hơn 1 lọ Nước phép (tối đa 1 lọ mỗi tuần).'],
 mooncalf:['Từ 18:00 đến 06:00: cây trong 1 thửa đang lớn chín sớm 20% thời gian còn lại (ít nhất 30 phút).'],
 kneazle:['Bản đồ đánh dấu thửa chín, bé ăn xong, cây sắp héo, bé sắp ốm.','Bản đồ đánh dấu thửa chín, bé ăn xong, cây sắp héo, bé sắp ốm, kèm danh sách việc cần làm.'],
 diricawl:['Lúc con vắng nhà, bé tự gặt thửa đã chín quá 2 giờ để cây không héo (không gieo lại).'],
 fwooper:['Hát cho mọi bé trong chuồng thêm 8 tâm trạng, bé dưới 50 thêm 16.','Hát cho mọi bé trong chuồng thêm 12 tâm trạng, bé dưới 50 thêm 24.'],
 hippogriff:['Chở về 1 Nước cho mỗi ô đất của vườn (ít nhất 10).'],
 thestral:['Bé lạc vào Rừng Cấm chỉ cần 1 bữa dụ là về ngay.'],
 unicorn:['Chữa khỏi 1 bé đang ốm, không tốn thuốc. Vườn dưới cấp 130: cho 1 bé thêm 15 tâm trạng.','Chữa khỏi 1 bé đang ốm, không tốn thuốc, bé đó thêm 15 tâm trạng. Vườn dưới cấp 130: cho 1 bé thêm 15 tâm trạng.'],
 'three-headed-dog':['Từ 22:00 đến 06:00, ma lùm không ăn được cây.','Từ 22:00 đến 06:00, ma lùm không ăn được cây. Mỗi ngày đuổi thêm 1 ma lùm.'],
 dragon:['Thiêu sạch 1 thửa có cây chết khô hoặc bị ma lùm phá để gieo lại ngay. Khi đói, bé chờ thêm 12 giờ mới gây cháy.'],
 grindylow:['Hồ không bao giờ đục. Cá chín tự vào kho, kể cả lúc con vắng nhà.','Hồ không bao giờ đục. Cá chín tự vào kho, kể cả lúc con vắng nhà. Câu cá dễ trúng gấp đôi; mỗi ngày tự thả 1 cá chép con vào ô trống.'],
 crup:['Ma lùm vừa định cắn cây là bé đớp ngay.'],
 knarl:['Xới 1 thửa bạc màu (trồng mãi một loại, bị −25% thu hoạch) để thu hoạch đủ trở lại.'],
 salamander:['Vườn cháy: bé giữ an toàn vài thửa. Tuần sương giá: cây 8 giờ trong các thửa đó không chậm lớn.'],
 kappa:['Tuần hạn hán: cây 3 giờ chỉ tốn 1 Nước mỗi ô.','Tuần hạn hán: gieo cây 3 giờ không tốn Nước.'],
 porlock:['Bằng-Mã, Vong mã, Kỳ lân không bao giờ dưới 50 tâm trạng.','Bằng-Mã, Vong mã, Kỳ lân không bao giờ dưới 60 tâm trạng.'],
});
// A passive skill's daily allowance, by what it counts (cap 0 = always on).
const UNIT=Object.freeze({diricawl:'thửa',thestral:'bé','three-headed-dog':'ma lùm',grindylow:'cá con',crup:'ma lùm'});
export const WHY=Object.freeze({'skills-off':'Kỹ năng đang tạm tắt','fled':'Bé đang lạc trong Rừng Cấm, dụ về mới giúp được','locked':'Mở khi bé trưởng thành và gắn bó cấp 3','sick':'Bé đang ốm, khỏi bệnh mới giúp được','roaming':'Bé đang đi rông, về mới giúp được','sad':'Bé đang buồn, tâm trạng từ 50 mới giúp được'});
const RANK=['Chưa mở','Bậc 1','Bậc 2','Bậc 3 · Tinh thông'];
const NEXT=['Mở khi bé trưởng thành và gắn bó cấp 3','Lên bậc 2 khi gắn bó cấp 5 và thuộc đủ 3 trò','Lên bậc 3 khi vườn đạt cấp 1.000',''];
const NONE=Object.freeze({puffskein:'Chưa có thửa chín',bowtruckle:'Chưa có thửa đang lớn',mooncalf:'Chưa có thửa đang lớn',dragon:'Không có thửa cần dọn',knarl:'Không có thửa bạc màu',unicorn:'Không có bé ốm'});
const DUTY_ONLY=Object.freeze(['diricawl','thestral','three-headed-dog','dragon']);
const vnHour=t=>new Date(t+7*3600000).getUTCHours();
const label=sp=>E.CREATURE[sp]?.label||sp;

/** Kneazle rank 2: the to-do lines. */
export function todoLines(snap,now=Date.now()){
 const k=kneazleMarks(snap,now);if(k.rank<2)return [];
 return [...[...k.plots].map(i=>`Thửa ${i+1} sắp héo`),...[...k.meals].map(sp=>`${label(sp)} xong bữa`),...[...k.sick].map(sp=>`${label(sp)} sắp ốm`)];
}

/** A block of «Chăm bé»: small-caps name with an optional figure on the right, then its content. */
export const section=(name,meta,...kids)=>el('section',{class:'mood-sec'},[
 el('header',{},[el('h3',{text:name}),meta?el('b',{text:meta}):null]),...kids.flat().filter(Boolean)]);
const note=(text,cls='')=>el('p',{class:('mood-note '+cls).trim(),text});
/** Header line under the creature's name: skill name · rank. */
export const skillTitle=s=>s?[s.name,RANK[Math.min(s.rank,3)]].filter(Boolean).join(' · '):'';
const picked={}; // species → the target last chosen, kept across re-renders

/** The «Kỹ năng» block inside «Chăm bé»: uses left, what it gives, what blocks or comes next, then one row with the
 *  target stepper (‹ Thửa 18 ›, any number of targets) and the gold action. `use(species,target)` sends action `skill`. */
export function skillCard({species,snap,use,now=Date.now()}){
 const s=skillOf(snap,species);if(!s)return null;
 const what=WHAT[species]||[''],r=Math.min(s.rank,3),unit=UNIT[species];
 const count=!r?'':s.passive?(!s.cap?'Luôn bật':species==='salamander'?`Giữ ${s.cap} thửa`:`Còn ${s.left}/${s.cap} ${unit||''} hôm nay`.replace('  ',' ')):`Còn ${s.left}/${s.cap} lượt hôm nay`;
 const kids=[el('p',{class:'mood-text',text:(r>=2&&what[1])||what[0]})];
 // Wilting, ma lùm, Rừng Cấm and fire start at garden level 130 (garden-duty-core DUTY_LEVEL): before it these do nothing.
 if(r&&DUTY_ONLY.includes(species)&&(snap?.garden?.progression?.level??0)<130)kids.push(note('Có tác dụng từ vườn cấp 130','is-warn'));
 if(s.blocked&&s.blocked!=='locked')kids.push(note(WHY[s.blocked]||s.blocked,'is-warn'));
 else{const next=s.blocked?NEXT[0]:NEXT[r];if(next)kids.push(note(next,s.blocked?'is-warn':''));}
 const todo=species==='kneazle'?todoLines(snap,now):[];
 if(todo.length)kids.push(note(todo.join(' · ')));
 if(isReady(s)){
  const targets=skillTargets(species,snap,now),night=vnHour(now)>=18||vnHour(now)<6;
  const go=(text,fn)=>{const b=button('',fn,{class:'mood-cta'+(fn?' primary':''),disabled:!fn});b.append(skillIcon(species),el('span',{text}));return b;};
  if(species==='mooncalf'&&!night)kids.push(go('Chỉ giúp từ 18:00 đến 06:00'));
  else if(targets===null)kids.push(go('Nhờ bé',()=>use(species)));
  else if(!targets.length)kids.push(go(NONE[species]||'Chưa có chỗ cần giúp'));
  else{
   const name=x=>typeof x==='number'?`Thửa ${x+1}`:label(x);
   let i=Math.max(0,targets.indexOf(picked[species]));
   if(targets.length<2)kids.push(go(`Nhờ bé · ${name(targets[0])}`,()=>use(species,targets[0])));
   else{
    const shown=el('span',{class:'mood-step-v','aria-live':'polite'});
    const show=()=>{picked[species]=targets[i];shown.replaceChildren(el('b',{text:name(targets[i])}),el('small',{text:`${i+1}/${targets.length}`}));};
    const arrow=(d,cls,text)=>{const b=button('',()=>{i=(i+d+targets.length)%targets.length;show();},{class:cls,'aria-label':text});b.append(pixelIcon('chevron',2));return b;};
    show();
    kids.push(el('div',{class:'mood-skill-go'},[
     el('div',{class:'mood-step',role:'group','aria-label':'Chọn chỗ cho bé giúp'},[arrow(-1,'is-prev','Chỗ trước'),shown,arrow(1,'is-next','Chỗ sau')]),
     go('Nhờ bé',()=>use(species,targets[i])),
    ]));
   }
  }
 }
 return section('Kỹ năng',count,kids);
}
export function skillIcon(species){
 const i=SKILL_ORDER.indexOf(species);
 return el('span',{class:'skill-icon',style:`background-position:${-(i%6)*32}px ${-Math.floor(i/6)*32}px`,'aria-hidden':'true'});
}

const span=ms=>{const m=Math.round(ms/60000);return m<60?`${m} phút`:`${Math.floor(m/60)} giờ${m%60?` ${m%60} phút`:''}`;};
/** The line after a `skill` receipt (receipt.skill, fields per garden-skill-core EFFECTS). */
export function skillText(r){
 if(!r)return '';
 const who=label(r.species),plot=Number.isInteger(r.plotIndex)?`thửa ${r.plotIndex+1}`:'',crop=id=>E.CROP[id]?.label||id;
 const text={
  puffskein:()=>`${who} gặt ${plot} (${r.crops} cây)${r.seed?`, nhả lại 1 hạt ${crop(r.seed)}`:''}`,
  bowtruckle:()=>`${who} giúp ${plot}: ${r.crops} cây chín sớm tới ${span(r.cutMs)}`,
  niffler:()=>`${who} đào ${plot}: +${r.water} Nước${r.seed?`, 1 hạt ${crop(r.seed)}`:''}${r.boost?', 1 lọ Nước phép':''}`,
  fwooper:()=>{const up=r.cheered.length-(r.capped?.length||0);return `${who} hát: ${up} bé thêm ${r.gain} tâm trạng${r.lifted?.length?` (${r.lifted.length} bé buồn thêm ${r.gain*2})`:''}${r.capped?.length?`, ${r.capped.length} bé không lên (chưa ăn món thích hoặc đã đầy)`:''}`;},
  hippogriff:()=>`${who} chở về +${r.water} Nước`,
  unicorn:()=>r.cured?`${who} chữa khỏi ${label(r.target)}${r.gain?`, thêm ${r.gain} tâm trạng`:''}`:`${label(r.target)} thêm ${r.gain} tâm trạng`,
  dragon:()=>`${who} dọn ${plot}${r.gnome?': ma lùm chạy mất':`: thiêu ${r.cleared} ô cây khô`}`,
  knarl:()=>`${who} xới ${plot}: đất hết bạc màu`,
 }[r.species==='mooncalf'?'bowtruckle':r.species];
 return text?text()+` · còn ${r.left} lượt hôm nay.`:'';
}
