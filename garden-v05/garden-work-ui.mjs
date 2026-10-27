// Level-500 roadmap P5 (§11): «Việc của bác Hagrid» — Đơn hàng (snapshot.orders, action deliverOrder),
// Thông thạo cây (snapshot.mastery) and Cúp Nhà (snapshot.houseCup). Only with a wallet: the server
// draws the orders, counts the mastery and the cup; this panel shows them.
import {$,el,num,cropVisualKind,visualItemIcon} from './ui-utils.mjs?v=24.9.84';
import {pixelIcon,iconButton} from './pixel-icons.mjs?v=24.9.84';
import {CROP,CREATURE} from './balance-data.mjs?v=24.9.84';

const HOUSE_COLORS = Object.freeze({gryffindor:'#C75B4B',hufflepuff:'#FFC36B',ravenclaw:'#3E3B70',slytherin:'#3F6A45'}); // palette.mjs only
const labelOf = id => CROP[id]?.label || (id.startsWith('produce_') ? CREATURE[id.slice(8)]?.produce : null) || id;
const meter = (done,target) => el('div',{class:'gp-meter',role:'progressbar','aria-valuemin':'0','aria-valuemax':String(target),'aria-valuenow':String(done)},[el('span',{style:`width:${Math.min(100,Math.round(done/Math.max(1,target)*100))}%`})]);
const stars = tier => el('span',{class:'work-stars','aria-label':`Bậc ${tier}/3`,text:'★'.repeat(tier)+'☆'.repeat(3-tier)});

export function createHagridWork({getSnapshot,deliver,setFrame,items,notify}){
 let tab='orders',lastBoard=null,lastWeek=null;
 const body=el('div',{class:'work-body'}),tabs=el('div',{class:'panel-toolbar work-tabs',role:'group','aria-label':'Việc của bác Hagrid'});
 const dialog=el('dialog',{id:'hagridWork',class:'owl-letter work-letter','aria-labelledby':'workTitle'},[
  el('div',{class:'popover-heading'},[el('h2',{id:'workTitle',text:'Việc của bác Hagrid'}),iconButton('close','Đóng',()=>dialog.close(),{class:'gp-close'})]),
  tabs,body,
 ]);
 ($('gameShell')||document.body).append(dialog);
 dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});

 function orders(snap){
  const view=snap.orders,inv=snap.garden?.progression?.inventory||{},level=snap.garden?.progression?.level||1;
  if(!view.orders.length)return [el('p',{class:'meta',text:`Bác Hagrid nhận đơn từ cấp ${view.unlockLevel}.`})];
  return [el('p',{class:'meta',text:'Mỗi ngày ba đơn. XP bằng đúng XP gặt của số hàng giao, thêm 1 Nước phép mỗi đơn.'}),...view.orders.map(order=>{
   const ready=Object.entries(order.items).every(([id,n])=>(inv[id]||0)>=n);
   const action=order.delivered?el('span',{class:'gp-state',text:'Đã giao'})
    :iconButton(ready?'check':'lock',ready?`Giao đơn: +${num(order.xp)} XP`:'Kho chưa đủ hàng',ready?async()=>{const res=await deliver(order.id);if(res?.ok){notify(`📦 Đã giao đơn cho bác Hagrid: +${num(order.xp)} XP, +${order.boost} Nước phép.`);render();}}:null,{text:ready?'Giao':'Thiếu',class:ready?'primary':'',disabled:!ready,'data-deliver-order':order.id});
   return el('div',{class:`gp-hero work-order${order.delivered?' is-done':ready?' is-ready':''}`},[
    el('div',{class:'work-order-items'},Object.entries(order.items).map(([id,n])=>el('span',{class:'work-order-item',title:labelOf(id)},[
     visualItemIcon(items,id,{size:36,kind:cropVisualKind(id)}),el('b',{text:`${num(Math.min(inv[id]||0,n))}/${n}`}),el('small',{text:labelOf(id)}),
    ]))),
    el('div',{class:'gp-hero-copy'},[el('small',{text:`+${num(order.xp)} XP · +${order.boost} Nước phép${level>=(snap.houseCup?.unlockLevel||20)?` · +${order.cup} điểm Cúp Nhà`:''}`})]),
    action,
   ]);
  })];
 }

 // Khung Floo earned here (owner 23/10/2026): worn on Mạng Floo through the Hẻm Xéo frame slot.
 function frames(snap,kind){
  const view=snap.flooFrames;if(!view)return [];
  const list=view.frames.filter(f=>f.kind===kind);
  return [el('p',{class:'sheet-label',text:'Khung Floo'}),el('p',{class:'meta',text:'Đeo khung để hiện quanh tin nhắn trên Mạng Floo. Khung Hẻm Xéo đang hiện sẽ tạm dừng và giữ thời gian còn lại (bật lại trong Hẻm Xéo trong 7 ngày).'}),
   el('div',{class:'work-frames'},list.map(f=>{
    const worn=view.worn===f.key;
    const action=!f.unlocked?el('span',{class:'gp-state',text:`${f.progress}/${f.need}`})
     :iconButton(worn?'close':'check',worn?`Tháo ${f.label}`:`Đeo ${f.label}`,async()=>{const res=await setFrame(worn?null:f.key);if(res?.ok){notify(worn?'Đã tháo khung Floo.':`Đã đeo ${f.label} trên Mạng Floo.`);render();}},{text:worn?'Tháo':'Đeo',class:worn?'':'primary','data-garden-frame':f.key});
    return el('div',{class:`work-frame${f.unlocked?'':' is-locked'}${worn?' is-worn':''}`},[
     el('span',{class:'work-frame-swatch','data-frame':f.key,'aria-hidden':'true'}),
     el('div',{class:'gp-hero-copy'},[el('strong',{text:f.label}),el('small',{text:f.rule})]),action,
    ]);
   }))];
 }
 function mastery(snap){
  const view=snap.mastery;
  return [
   el('p',{class:'meta',text:`Gặt đủ ${view.tiers.map(num).join(' / ')} ô một loại cây để lên bậc ${view.titles.join(' · ')} (thưởng ${view.rewards.join(' / ')} Nước phép). Đã thạo ${view.mastered}/${view.total} loại.`}),
   ...frames(snap,'mastery'),
   el('p',{class:'sheet-label',text:'Từng loại cây'}),
   el('div',{class:'work-mastery-grid'},view.crops.map(row=>{
    const next=view.tiers[row.tier];
    return el('div',{class:`work-mastery-cell tier-${row.tier}`,title:`${labelOf(row.cropId)} · ${num(row.cells)} ô${row.tier?` · ${view.titles[row.tier-1]}`:''}`},[
     visualItemIcon(items,row.cropId,{size:36,kind:'harvest'}),el('small',{text:labelOf(row.cropId)}),stars(row.tier),
     next?meter(row.cells,next):el('b',{class:'work-mastered',text:view.titles[2]}),
     el('small',{class:'meta',text:next?`${num(row.cells)}/${num(next)}`:`${num(row.cells)} ô`}),
    ]);
   })),
  ];
 }

 function cup(snap){
  const view=snap.houseCup,level=snap.garden?.progression?.level||1;
  if(view.board)lastBoard=view.board;
  if(view.lastWeek)lastWeek=view.lastWeek;
  const top=lastBoard?.[0]?.points||0,champion=lastWeek?.[0]?.points?lastWeek[0]:null;
  const ends=new Date(view.endsAt+7*3600000);
  return [
   el('p',{class:'meta',text:`Tuần ${view.weekKey.slice(8)}/${view.weekKey.slice(5,7)} · kết thúc 0:00 ngày ${ends.getUTCDate()}/${ends.getUTCMonth()+1}. Gặt +${view.rules.harvest}, nhiệm vụ cú +${view.rules.quest}, đơn hàng +${view.rules.order}; tối đa ${view.dailyCap} điểm mỗi ngày. Thưởng là danh tiếng, không tăng XP.`}),
   level<view.unlockLevel?el('p',{class:'meta',text:`Góp điểm cho Nhà từ cấp ${view.unlockLevel}.`})
    :view.house?el('div',{class:'gp-hero work-cup-me',style:`--house:${HOUSE_COLORS[view.house]}`},[pixelIcon('trophy',3),el('div',{class:'gp-hero-copy'},[el('strong',{text:`${view.houseLabel}: con góp ${num(view.points)} điểm tuần này`}),el('div',{class:'owl-chest-meter'},[meter(view.today,view.dailyCap),el('b',{text:`Hôm nay ${view.today}/${view.dailyCap}`})])])])
    :el('p',{class:'meta',text:'Chọn Nhà trong hồ sơ Mạng Floo để góp điểm Cúp Nhà.'}),
   lastBoard?el('ol',{class:'work-cup-board'},lastBoard.map(row=>el('li',{style:`--house:${HOUSE_COLORS[row.house]}`},[el('strong',{text:row.label}),meter(row.points,top),el('b',{text:num(row.points)})])))
    :el('p',{class:'meta',text:'Mở lại vườn để xem bảng điểm các Nhà.'}),
   champion?el('p',{class:'meta work-cup-champion',text:`🏆 Tuần trước: ${champion.label} dẫn đầu với ${num(champion.points)} điểm.`}):null,
   view.lastResult?el('p',{class:'meta',text:view.lastResult.won?`🎖 Tuần ${view.lastResult.weekKey.slice(8)}/${view.lastResult.weekKey.slice(5,7)} con góp ${num(view.lastResult.points)} điểm cho Nhà vô địch: đã mở khung Cúp Nhà.`:`Tuần ${view.lastResult.weekKey.slice(8)}/${view.lastResult.weekKey.slice(5,7)}: Nhà con hạng ${view.lastResult.rank}, con góp ${num(view.lastResult.points)} điểm.`}):null,
   el('p',{class:'meta',text:`Thưởng: Nhà đứng đầu tuần mở khung Floo Cúp Nhà vĩnh viễn cho mọi thành viên góp từ ${view.rewardMin} điểm (trao khi mở vườn tuần sau).`}),
   ...frames(snap,'cup'),
  ].filter(Boolean);
 }

 function render(){
  const snap=getSnapshot();
  tabs.replaceChildren(...[['orders','Đơn hàng','letter'],['mastery','Thông thạo cây','harvest'],['cup','Cúp Nhà','trophy']].map(([id,name,glyph])=>{
   const b=el('button',{type:'button',class:'gp-tab','aria-pressed':String(tab===id),onclick:()=>{tab=id;render();}});b.append(pixelIcon(glyph,2),el('span',{text:name}));return b;
  }));
  if(!snap?.orders){body.replaceChildren(el('p',{class:'meta',text:'Việc của bác Hagrid cần kết nối tài khoản.'}));return;}
  body.replaceChildren(...(tab==='orders'?orders(snap):tab==='mastery'?mastery(snap):cup(snap)));
 }
 return {
  open(){render();dialog.showModal();},
  sync(){const snap=getSnapshot();if(snap?.houseCup?.board)lastBoard=snap.houseCup.board;if(snap?.houseCup?.lastWeek)lastWeek=snap.houseCup.lastWeek;if(dialog.open)render();},
  hasWork(){const snap=getSnapshot(),inv=snap?.garden?.progression?.inventory||{};return Boolean(snap?.orders?.orders?.some(o=>!o.delivered&&Object.entries(o.items).every(([id,n])=>(inv[id]||0)>=n)));},
 };
}
