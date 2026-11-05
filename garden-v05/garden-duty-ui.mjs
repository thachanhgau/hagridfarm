// «Bậc trách nhiệm» (25.0 S5, server garden-duty-core): from level 130 a neglected garden pays for it. The server
// keeps every clock; this panel shows snapshot.duty: what happened, the time to each next consequence and the way
// out of each (action duty: clear, gnome, treat, lure, leave). mobile-game imports it on the first chip tap.
import {$,el} from './ui-utils.mjs?v=25.0.0';
import {iconButton,pixelIcon} from './pixel-icons.mjs?v=25.0.0';

const HOUR=3600000;
export const left=(at,now=Date.now())=>{const ms=Math.max(0,at-now),h=Math.floor(ms/HOUR),m=Math.floor(ms%HOUR/60000);return h>=48?`${Math.floor(h/24)} ngày`:h?`${h} giờ${m?' '+m+' phút':''}`:`${m} phút`;};
const clockText=ms=>{const d=new Date(ms+7*HOUR);return `${String(d.getUTCHours()).padStart(2,'0')}:${String(d.getUTCMinutes()).padStart(2,'0')}`;};

/** The clock rows: [icon, label, at] for every consequence still ahead, soonest first. */
export function dutyClocks(duty,labelOf=s=>s){
 const c=duty?.clocks||{},rows=[];
 if(c.wilt)rows.push(['harvest','Cây chín héo',c.wilt]);
 if(c.dies)rows.push(['harvest','Cây héo chết khô',c.dies]);
 if(c.gnome)rows.push(['map','Ma lùm vào vườn',c.gnome]);
 if(c.sick)rows.push(['heart',`${labelOf(c.sick.species)} ốm`,c.sick.at]);
 if(c.forest)rows.push(['map',`${labelOf(c.forest.species)} vào Rừng Cấm`,c.forest.at]);
 if(c.fire)rows.push(['festival','Rồng đói phun lửa',c.fire]);
 return rows.filter(r=>r[2]>Date.now()).sort((a,b)=>a[2]-b[2]);
}

/** What needs the member now: [key, text] (the chip turns red). */
export function dutyAlerts(duty,labelOf=s=>s){
 if(!duty?.on||duty.leave)return [];
 return [
  ...(duty.dead||[]).length?[['dead',`${duty.dead.length} cây chết khô`]]:[],
  ...(duty.gnomes||[]).map(g=>['gnome',`Ma lùm ở thửa ${g.plot+1}`]),
  ...(duty.sick||[]).map(s=>['sick',`${labelOf(s.species)} ốm`]),
  ...(duty.fled||[]).map(f=>['fled',`${labelOf(f.species)} ở Rừng Cấm`]),
  ...(duty.wilted||[]).length?[['wilt',`${duty.wilted.length} cây héo`]]:[],
 ];
}

/** Hagrid's letter on reaching level 130 (core-design §1 amended 04/11/2026). */
export const DUTY_LETTER=Object.freeze({
 greeting:'Gửi con,',
 paragraphs:[
  'Con lên cấp 130 rồi, bác mừng lắm. Từ giờ khu vườn là của con thật sự: cây chín để quá một ngày sẽ héo, quá hai ngày thì chết khô; vắng vườn một ngày là ma lùm mò vào ăn trộm.',
  'Thú buồn lâu thì ít sản phẩm, rồi ốm, có khi bỏ vào Rừng Cấm. Con rồng mà đói thì nó phun lửa đó. Nhưng đừng sợ: không con nào chết, đồ con mua không mất, và việc gì cũng cứu được.',
  'Gia tinh trông giúp con mỗi ngày vài việc. Đi xa thì nhắn bác, bác trông vườn cho, mỗi tháng tối đa 7 ngày.',
 ],
 postscript:'Đồng hồ nằm ở nút «Trách nhiệm» trên vườn.',
 signature:'bác Hagrid',
});

export function createDutyPanel({getSnapshot,act,notify,labelOf}){
 const body=el('div',{class:'duty-body'});
 const dialog=el('dialog',{id:'dutyPanel',class:'owl-letter mood-care duty-panel','aria-labelledby':'dutyTitle'},[
  el('div',{class:'popover-heading'},[el('h2',{id:'dutyTitle',text:'Bậc trách nhiệm'}),iconButton('close','Đóng',()=>dialog.close(),{class:'gp-close'})]),
  body,
 ]);
 ($('gameShell')||document.body).append(dialog);
 dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
 const run=async(command,text)=>{const res=await act({action:'duty',...command});if(res?.ok){notify(text(res.receipt?.duty||{},res));render();}};
 const tile=(art,label,state,onClick)=>{const b=el('button',{type:'button',class:'mood-tile duty-tile',disabled:!onClick,'aria-label':label+(state?' · '+state:'')},[pixelIcon(art,2),el('b',{text:label}),state?el('small',{text:state}):null]);if(onClick)b.onclick=onClick;return b;};

 function render(){
  const duty=getSnapshot()?.duty,now=Date.now();
  if(!duty?.on){body.replaceChildren(el('p',{class:'meta',text:`Từ cấp ${duty?.level||130}.`}));return;}
  const tiles=[];
  const dead=[...new Set((duty.dead||[]).map(d=>d.plot))];
  for(const plot of dead)tiles.push(tile('harvest',`Dọn thửa ${plot+1}`,`${duty.dead.filter(d=>d.plot===plot).length} cây khô`,()=>run({kind:'clear',plotIndex:plot},r=>`🧹 Đã dọn ${r.cleared} gốc khô ở thửa ${plot+1}.`)));
  for(const g of duty.gnomes||[])tiles.push(tile('map',`Tóm ma lùm · thửa ${g.plot+1}`,g.ate?`đã ăn ${g.ate} cây`:'chưa kịp ăn',()=>run({kind:'gnome',plotIndex:g.plot},r=>`💨 Quăng ma lùm qua rào${r.ate?` · nó đã ăn ${r.ate} cây`:''}.`)));
  for(const s of duty.sick||[]){
   const name=labelOf(s.species),bottles=getSnapshot()?.garden?.supplies?.skeleGro||0;
   tiles.push(tile('heart',`${name} · Thuốc Mọc Xương`,bottles?`còn ${bottles} chai`:'hết thuốc',bottles?()=>run({kind:'treat',species:s.species,pay:'skeleGro'},r=>`💊 ${name} khỏe lại · tâm trạng ${r.mood}.`):null));
   tiles.push(tile('chest',`${name} · ${duty.curePrice} G`,'khám bệnh',()=>run({kind:'treat',species:s.species,pay:'galleons'},r=>`💊 ${name} khỏe lại · tâm trạng ${r.mood}.`)));
  }
  for(const f of duty.fled||[]){
   const name=labelOf(f.species);
   tiles.push(f.lureAt?tile('map',`${name} đang về`,`lúc ${clockText(f.backAt)}`,null)
    :tile('map',`Dụ ${name} về`,`${duty.lureMeals} bữa ăn · 1 ngày`,()=>run({kind:'lure',species:f.species},r=>`🍖 Đã đặt mồi · ${name} về lúc ${clockText(r.backAt)}.`)));
  }
  const leave=duty.leave
   ?[tile('book','Về vườn',`bác trông tới ${clockText(duty.leave.until)}`,()=>run({kind:'leave',days:0},r=>`🏡 Con về rồi · còn ${left(Date.now()+r.leftMs)} nhờ bác.`))]
   :[1,3,7].filter(d=>d*24*HOUR<=duty.leaveLeftMs).map(d=>tile('book',`Nhờ bác ${d} ngày`,'vườn dừng lại',()=>run({kind:'leave',days:d},r=>`🧔 Bác Hagrid trông vườn tới ${clockText(r.until)}.`)));
  const clocks=dutyClocks(duty,labelOf);
  body.replaceChildren(...[
   el('div',{class:'duty-clocks'},clocks.length?clocks.map(([art,label,at])=>el('div',{class:'duty-clock'+(at-now<6*HOUR?' is-soon':'')},[pixelIcon(art,1),el('span',{text:label}),el('b',{text:left(at,now)})])):[el('p',{class:'meta',text:duty.leave?'Vườn đang dừng.':'Không có gì sắp tới.'})]),
   tiles.length?el('div',{class:'mood-tiles duty-tiles'},tiles):null,
   el('div',{class:'mood-row'},[el('small',{text:`Nhờ bác Hagrid · còn ${duty.leaveLeftMs?left(now+duty.leaveLeftMs,now):'0 phút'} / ${duty.leaveDays} ngày trong 30 ngày`})]),
   el('div',{class:'mood-tiles duty-tiles'},leave),
  ].filter(Boolean));
 }
 return {open(){render();dialog.showModal();},sync(){if(dialog.open)render();}};
}
