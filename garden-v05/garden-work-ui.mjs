// Level-500 roadmap P5 (§11): «Việc của bác Hagrid» — Đơn hàng (snapshot.orders, action deliverOrder),
// Thông thạo cây (snapshot.mastery) and Cúp Nhà (snapshot.houseCup). Only with a wallet: the server
// draws the orders, counts the mastery and the cup; this panel shows them.
import {$,el,num,cropVisualKind,visualItemIcon,FEED_CREATURE_MAP} from './ui-utils.mjs?v=25.0.2';
import {pixelIcon,iconButton} from './pixel-icons.mjs?v=25.0.2';
import {CROP,CREATURE} from './balance-data.mjs?v=25.0.2';

const HOUSE_COLORS = Object.freeze({gryffindor:'#C75B4B',hufflepuff:'#FFC36B',ravenclaw:'#3E3B70',slytherin:'#3F6A45'}); // palette.mjs only
const CRAFTED = Object.freeze({insects:'Côn trùng',fish:'Cá nhỏ',elf_hat:'Nón len gia tinh',elf_sock:'Vớ len gia tinh'}); // = mobile-game labels
const labelOf = id => CROP[id]?.label || (id.startsWith('produce_') ? CREATURE[id.slice(8)]?.produce : null) || CRAFTED[id]
 || (FEED_CREATURE_MAP[id] ? `Khẩu phần ${CREATURE[FEED_CREATURE_MAP[id]]?.label}` : null) || id;
const meter = (done,target) => el('div',{class:'gp-meter',role:'progressbar','aria-valuemin':'0','aria-valuemax':String(target),'aria-valuenow':String(done)},[el('span',{style:`width:${Math.min(100,Math.round(done/Math.max(1,target)*100))}%`})]);
// Level 160+ (docs/level-160-challenges.md §2A–B): Đơn khó and the milestone challenge, from snapshot.orders.
const GOALS = Object.freeze({duty:['harvest','7 ngày không cây héo'],mood:['heart','Sinh vật vui 3 ngày liền'],marks:['star','10 dấu đơn khó']});
const hm = ms => {const m=Math.max(0,Math.ceil(ms/60000));return `${Math.floor(m/60)}:${String(m%60).padStart(2,'0')}`;};
const dm = at => {const d=new Date(at+7*3600000);return `${d.getUTCDate()}/${d.getUTCMonth()+1}`;};
const stars = tier => el('span',{class:'work-stars',role:'img','aria-label':`Bậc ${tier}/3`},[0,1,2].map(i=>pixelIcon(i<tier?'star':'star_empty',1)));

export function createHagridWork({getSnapshot,deliver,challenge,setFrame,items,notify}){
 let tab='orders',lastBoard=null,lastWeek=null,pick=1;
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
  return view.orders.map(order=>{
   const ready=Object.entries(order.items).every(([id,n])=>(inv[id]||0)>=n);
   const action=order.delivered?el('span',{class:'gp-state',text:'Đã giao'})
    :iconButton(ready?'check':'lock',ready?`Giao đơn: +${num(order.xp)} XP`:'Kho chưa đủ hàng',ready?async()=>{const res=await deliver(order.id);if(res?.ok){notify(`📦 Đã giao đơn cho bác Hagrid: +${num(order.xp)} XP, +${order.boost} Nước phép.`);render();}}:null,{text:ready?'Giao':'Thiếu',class:ready?'primary':'',disabled:!ready,'data-deliver-order':order.id});
   return el('div',{class:`work-order${order.delivered?' is-done':ready?' is-ready':''}`},[
    el('div',{class:'work-order-items'},Object.entries(order.items).map(([id,n])=>el('span',{class:'work-order-item',title:labelOf(id)},[
     visualItemIcon(items,id,{size:36,kind:cropVisualKind(id)}),el('b',{text:`${num(Math.min(inv[id]||0,n))}/${n}`}),el('small',{text:labelOf(id)}),
    ]))),
    el('small',{class:'work-order-reward',text:`+${num(order.xp)} XP · +${order.boost} Nước phép${level>=(snap.houseCup?.unlockLevel||20)?` · +${order.cup} điểm Cúp Nhà`:''}`}),
    action,
   ]);
  });
 }

 const goods=(itemsMap,inv)=>el('div',{class:'work-order-items'},Object.entries(itemsMap).map(([id,n])=>el('span',{class:'work-order-item',title:labelOf(id)},[
  visualItemIcon(items,id,{size:36,kind:cropVisualKind(id)}),el('b',{text:`${num(Math.min(inv[id]||0,n))}/${n}`}),el('small',{text:labelOf(id)}),
 ])));
 const run=async(fields,done)=>{const res=await challenge?.(fields);if(res?.ok){notify(done);render();}};
 // Đơn khó: today's offer with the 1–3 star picker, or the open order with its 48 h clock.
 function hard(snap){
  const view=snap.orders.hard;if(!view)return [];
  const inv=snap.garden?.progression?.inventory||{},open=view.open,label=el('p',{class:'sheet-label',text:`Đơn khó · ${num(view.marks)}/${num(view.frameMarks)} dấu`});
  if(!open&&!view.offer)return [label];
  const terms=open||view.offer.tiers[pick-1],ready=Boolean(open)&&Object.entries(open.items).every(([id,n])=>(inv[id]||0)>=n);
  const control=open?el('span',{class:'work-hard-clock',role:'timer','aria-label':'Hạn giao'},[pixelIcon('clock',1),el('b',{text:hm(open.deadline-Date.now())})])
   :el('div',{class:'work-hard-stars',role:'group','aria-label':'Chọn số sao'},[1,2,3].map(n=>el('button',{type:'button',class:'work-hard-star','aria-pressed':String(pick===n),'aria-label':`${n} sao`,'data-hard-stars':String(n),onclick:()=>{pick=n;render();}},[0,1,2].map(i=>pixelIcon(i<n?'star':'star_empty',1)))));
  const action=open?iconButton(ready?'check':'lock',ready?`Giao đơn khó: +${num(open.xp)} XP`:'Kho chưa đủ hàng',ready?()=>run({kind:'deliver'},`Đã giao đơn khó: +${num(open.xp)} XP, +${open.marks} dấu thử thách.`):null,{text:ready?'Giao':'Thiếu',class:ready?'primary':'',disabled:!ready,'data-hard-deliver':''})
   :iconButton('tansuc',`Nhận đơn khó ${pick} sao`,()=>run({kind:'accept',stars:pick},`Đã nhận đơn khó ${pick} sao.`),{text:'Nhận',class:'primary','data-hard-accept':''});
  return [label,el('div',{class:`work-order work-hard${ready?' is-ready':''}`,'data-hard-order':open?'open':'offer'},[
   goods(terms.items,inv),
   el('div',{class:'work-order-reward'},[control,el('small',{text:`+${num(terms.xp)} XP · +${terms.cup} điểm Cúp Nhà · +${terms.marks} dấu`})]),
   action,
  ])];
 }
 // Thử thách mốc 50 cấp: one row on the same grid (goal, meter, days left or the start button).
 function milestone(snap){
  const m=snap.orders.milestone;if(!m)return [];
  const [icon,name]=GOALS[m.goal]||['lock',`Cấp ${m.level??500}`];
  const label=el('p',{class:'sheet-label work-milestone-label'},[el('span',{text:'Thử thách mốc'}),...m.won.map(level=>el('span',{class:'work-badge',title:`Mốc ${level}`},[pixelIcon('trophy',1)]))]);
  const target=m.target||1,progress=m.progress||0;
  const action=m.state==='ready'?iconButton('tansuc',`Bắt đầu thử thách mốc ${m.level}`,()=>run({kind:'start'},`Bắt đầu thử thách mốc ${m.level}: 7 ngày.`),{text:'Bắt đầu',class:'primary','data-milestone-start':''})
   :el('span',{class:'gp-state',text:m.state==='running'?(m.onLeave?'Tạm dừng':`${m.daysLeft} ngày`):m.state==='retry'?`Thử lại ${dm(m.retryAt)}`:`Cấp ${m.level??'—'}`});
  return [label,el('div',{class:`work-order work-milestone is-${m.state}`,'data-milestone':m.state},[
   el('div',{class:'work-goal'},[pixelIcon(icon,2),el('div',{class:'gp-hero-copy'},[el('strong',{text:m.level?`Mốc ${m.level}`:'Đủ mốc'}),el('small',{text:m.goal?name:'Hết thử thách'})])]),
   el('div',{class:'work-order-reward'},m.goal?[meter(m.state==='running'?progress:0,target),el('small',{text:m.state==='running'?`${progress}/${target}`:`0/${target} · ${m.days||7} ngày`})]:[]),
   action,
  ])];
 }

 // Khung Floo earned here (owner 23/10/2026): worn on Mạng Floo through the Hẻm Xéo frame slot.
 function frames(snap,kind){
  const view=snap.flooFrames;if(!view)return [];
  const list=view.frames.filter(f=>[].concat(kind).includes(f.kind));if(kind==='xmas'&&!list.length)return []; // Giáng sinh frames only once earned or begun
  return [el('p',{class:'sheet-label',text:'Khung Floo'}),
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
   el('p',{class:'meta',text:`${view.mastered}/${view.total} loại · ${view.tiers.map(num).join(' / ')} ô · ${view.rewards.join(' / ')} Nước phép`}),
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
   el('p',{class:'meta',text:`Tuần ${view.weekKey.slice(8)}/${view.weekKey.slice(5,7)} · 0:00 ${ends.getUTCDate()}/${ends.getUTCMonth()+1} · ${num(view.dailyCap)} điểm/ngày`}),
   level<view.unlockLevel?el('p',{class:'meta',text:`Góp điểm cho Nhà từ cấp ${view.unlockLevel}.`})
    :view.house?el('div',{class:'gp-hero work-cup-me',style:`--house:${HOUSE_COLORS[view.house]}`},[pixelIcon('trophy',3),el('div',{class:'gp-hero-copy'},[el('strong',{text:`${view.houseLabel}: con góp ${num(view.points)} điểm tuần này`}),el('div',{class:'owl-chest-meter'},[meter(view.today,view.dailyCap),el('b',{text:`Hôm nay ${view.today}/${view.dailyCap}`})])])])
    :el('p',{class:'meta',text:'Chọn Nhà trong hồ sơ Mạng Floo để góp điểm Cúp Nhà.'}),
   lastBoard?el('ol',{class:'work-cup-board'},lastBoard.map(row=>el('li',{style:`--house:${HOUSE_COLORS[row.house]}`},[el('strong',{text:row.label}),meter(row.points,top),el('b',{text:num(row.points)})])))
    :el('p',{class:'meta',text:'Mở lại vườn để xem bảng điểm các Nhà.'}),
   champion?el('p',{class:'meta work-cup-champion',text:`Tuần trước: ${champion.label} dẫn đầu với ${num(champion.points)} điểm.`}):null,
   view.lastResult?el('p',{class:'meta',text:view.lastResult.won?`🎖 Tuần ${view.lastResult.weekKey.slice(8)}/${view.lastResult.weekKey.slice(5,7)} con góp ${num(view.lastResult.points)} điểm cho Nhà vô địch: đã mở khung Cúp Nhà.`:`Tuần ${view.lastResult.weekKey.slice(8)}/${view.lastResult.weekKey.slice(5,7)}: Nhà con hạng ${view.lastResult.rank}, con góp ${num(view.lastResult.points)} điểm.`}):null,
   view.rewardMin==null?null:el('p',{class:'meta',text:`Khung Cúp Nhà · Nhà vô địch · từ ${num(view.rewardMin)} điểm`}),
   ...frames(snap,'cup'),
  ].filter(Boolean);
 }

 function render(){
  const snap=getSnapshot();
  tabs.replaceChildren(...[['orders','Đơn hàng','letter'],['mastery','Thông thạo cây','harvest'],['cup','Cúp Nhà','trophy']].map(([id,name,glyph])=>{
   const b=el('button',{type:'button',class:'gp-tab','aria-pressed':String(tab===id),onclick:()=>{tab=id;render();}});b.append(pixelIcon(glyph,2),el('span',{text:name}));return b;
  }));
  if(!snap?.orders){body.replaceChildren(el('p',{class:'meta',text:'Việc của bác Hagrid cần kết nối tài khoản.'}));return;}
  body.replaceChildren(...(tab==='orders'?[...orders(snap),...hard(snap),...milestone(snap),...frames(snap,['challenge','level'])]:tab==='mastery'?mastery(snap):[...cup(snap),...frames(snap,'xmas')])); // 25.0 S5: level frames under the orders; S7: Giáng sinh frames under the cup
 }
 return {
  open(){render();dialog.showModal();},
  sync(){const snap=getSnapshot();if(snap?.houseCup?.board)lastBoard=snap.houseCup.board;if(snap?.houseCup?.lastWeek)lastWeek=snap.houseCup.lastWeek;if(dialog.open)render();},
  hasWork(){const snap=getSnapshot(),inv=snap?.garden?.progression?.inventory||{};const can=o=>Object.entries(o.items).every(([id,n])=>(inv[id]||0)>=n);return Boolean(snap?.orders?.orders?.some(o=>!o.delivered&&can(o))||(snap?.orders?.hard?.open&&can(snap.orders.hard.open))||snap?.orders?.milestone?.state==='ready');},
 };
}
