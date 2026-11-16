// Season 2 «Tài năng sinh vật» (26.0): the skill row inside «Chăm bé» and the receipt line. garden-mood-ui imports it,
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
const RANK=['Chưa có','Bậc 1','Bậc 2','Bậc 3 · Tinh thông'];
const NEXT=['Bậc 1: trưởng thành và gắn bó cấp 3','Bậc 2: gắn bó cấp 5 và thuộc cả 3 trò','Bậc 3: vườn cấp 1.000',''];
const vnHour=t=>new Date(t+7*3600000).getUTCHours();
const label=sp=>E.CREATURE[sp]?.label||sp;

/** Kneazle rank 2: the to-do lines. */
export function todoLines(snap,now=Date.now()){
 const k=kneazleMarks(snap,now);if(k.rank<2)return [];
 return [...[...k.plots].map(i=>`Thửa ${i+1} sắp héo`),...[...k.meals].map(sp=>`${label(sp)} xong bữa`),...[...k.sick].map(sp=>`${label(sp)} sắp ốm`)];
}

/** The card inside «Chăm bé». `use(species,target)` sends action `skill`. */
export function skillCard({species,snap,use,now=Date.now()}){
 const s=skillOf(snap,species);if(!s)return null;
 const what=WHAT[species]||['',''],r=Math.min(s.rank,3);
 const count=s.passive?(s.cap?`${s.left}/${s.cap} hôm nay`:'Luôn bật'):`Còn ${s.left}/${s.cap} lượt`;
 const lines=[el('small',{text:`${RANK[r]}${r?' · '+count:''}`}),el('span',{text:what[0]+(r>=2?' · '+what[1]:'')})];
 if(s.blocked)lines.push(el('small',{class:'skill-why',text:s.blocked==='locked'?NEXT[0]:WHY[s.blocked]||s.blocked}));
 else if(NEXT[r])lines.push(el('small',{class:'meta',text:NEXT[r]}));
 let act=null;
 if(isReady(s)){
  const targets=skillTargets(species,snap,now),night=vnHour(now)>=18||vnHour(now)<6;
  if(species==='mooncalf'&&!night)act=el('small',{class:'skill-why',text:'Chỉ ra vườn 18:00–06:00'});
  else if(targets===null)act=button('Nhờ bé',()=>use(species),{class:'primary skill-go'});
  else if(!targets.length)act=el('small',{class:'skill-why',text:species==='unicorn'?'Không có bé ốm':'Chưa có thửa hợp'});
  else act=el('div',{class:'gp-chips skill-targets',role:'group','aria-label':'Chọn chỗ cho bé giúp'},targets.slice(0,12).map(x=>button(typeof x==='number'?`Thửa ${x+1}`:label(x),()=>use(species,x),{class:'gp-chip'})));
 }
 const todo=species==='kneazle'?todoLines(snap,now):[];
 return el('section',{class:'skill-card'+(isReady(s)?' is-ready':''),'aria-label':'Kỹ năng '+s.name},[
  skillIcon(species),
  el('div',{class:'skill-copy'},[el('b',{text:s.name||'Kỹ năng'}),...lines,todo.length?el('small',{text:todo.join(' · ')}):null,act]),
 ]);
}
export function skillIcon(species){
 const i=SKILL_ORDER.indexOf(species);
 return el('span',{class:'skill-icon',style:`background-position:${-(i%6)*40}px ${-Math.floor(i/6)*40}px`,'aria-hidden':'true'});
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
