import {$,el,duration} from './ui-utils.mjs?v=24.9.77';
import {pixelIcon,setAction,rewardChips,iconButton,lockBadge} from './pixel-icons.mjs?v=24.9.77';
import {
 loadOwlQuests,
 saveOwlQuests,
 syncQuestsWithGardenState,
 recordOwlQuestAction,
 claimOwlQuest,
 claimDailyGrandChest,
 dailyCompletionSummary,
 hasClaimableOwlQuest,
 DAILY_GRAND_CHEST_REWARD,
} from './garden-quests.mjs?v=24.9.77';

// Presentation only: every crop mutation still uses the existing engine/command.
export function cropContext(state, selection, E, now) {
 const plot=state.plots[selection.selectedPlot];
 const occupied=selection.cells.filter(i=>plot?.slots[i]);
 const ready=occupied.filter(i=>E.growth(plot.slots[i],now).mature);
 const first=plot?.slots[occupied[0]];
 const remaining=occupied.map(i=>plot.slots[i].plantedAt+plot.slots[i].growMs-now).filter(n=>n>0);
 return {occupied,ready,first,remaining:remaining.length?Math.min(...remaining):0};
}


// Thư cú tiles: what the quest asks for as the big icon; the route button names where to go.
const OWL_QUEST_ICONS=Object.freeze({q_plant:'sow',q_harvest:'harvest',q_harvest_runs:'harvest',q_craft:'craft',q_feed:'feed',q_claim:'chest',q_pet:'heart',q_help:'care',q_share:'envelope'});
const OWL_ROUTE_LABELS=Object.freeze({plant:'Ra thửa',craft:'Mở vạc',creature:'Thăm chuồng',tour:'Tham quan',events:'Mở lễ hội',visit:'Thăm vườn',postcard:'Bưu thiếp'});
const OWL_REWARD_NAMES=Object.freeze({water:'Nước',boost:'Nước phép',pumpkin:'Bí ngô',oats:'Yến mạch',insects:'Côn trùng',moonherb:'Cỏ trăng'});
function compactOwlReward(reward={}){
 const parts=[];
 if(Number(reward.amount)>0)parts.push(`+${reward.amount} ${OWL_REWARD_NAMES[reward.kind]||reward.kind||'quà'}`);
 if(Number(reward.bonusQty)>0)parts.push(`+${reward.bonusQty} ${OWL_REWARD_NAMES[reward.itemId]||(/_feed$/.test(reward.itemId||'')?'Khẩu phần':reward.itemId)||'vật phẩm'}`);
 if(Number(reward.waterBonus)>0)parts.push(`+${reward.waterBonus} Nước`);
 if(Number(reward.eventPoints)>0)parts.push(`+${reward.eventPoints} Điểm`);
 return parts.join(' · ')||'Quà';
}

export function setupWizardUI({E,items,getState,getSelection,getRenderer,getReady,run,message,panels,camera,setMode,focusPlot,onGrantOwlReward,onClaimDailyQuest,onClaimGrandChest,onClaimBonusChest,onCare,getLetterGift}) {
 let letterRoute=null,letterOpenedOnce=false;
 const letter=$('owlLetter');

 function currentQuestState(){
  const q=loadOwlQuests();
  syncQuestsWithGardenState(q,getState());
  return q;
 }

 function syncMailBadge(){
  const q=currentQuestState();
  const claimable=hasClaimableOwlQuest(q);
  $('owlMailButton').classList.toggle('mail-read',letterOpenedOnce&&!claimable&&!getLetterGift?.(null));
 }

 function routeQuest(route){
  letter.close();
  if(route==='craft')panels.show('craft');
  else if(route==='creature')panels.show('creatures');
  else if(route==='tour'||route==='visit')panels.show('tour');
  else if(route==='postcard')panels.show('postcard');
  else if(route==='events')panels.show('events');
  else{setMode('plant');camera.focusPlot();}
 }

 const meter=(done,target,label)=>el('div',{class:'gp-meter',role:'progressbar','aria-label':label,'aria-valuemin':'0','aria-valuemax':String(target),'aria-valuenow':String(Math.min(done,target))},[el('span',{style:`width:${Math.min(100,Math.round(done/target*100))}%`})]);

 // The daily letter as game tiles: Rương Cú Vàng on top (locked until every quest is done), then one tile per quest.
 function renderOwlQuestsSection(){
  const qState=currentQuestState();
  const summary=dailyCompletionSummary(qState);
  const {completedCount:n,targetForGrand:goal,grandReady,grandClaimed}=summary;
  const sec=el('section',{class:'owl-quests-section','aria-label':'Thư Cú Hằng Ngày'});
  const chestLabel=`Rương Cú Vàng · ${compactOwlReward(DAILY_GRAND_CHEST_REWARD)}`;
  const chestBtn=grandReady
   ? iconButton('chest',`Mở ${chestLabel}`,null,{text:'Mở',class:'primary'})
   : iconButton(grandClaimed?'check':'lock',grandClaimed?'Đã mở rương hôm nay':`Xong ${goal} thư để mở rương`,null,{disabled:true});
  chestBtn.dataset.letterGrandChest='true';
  chestBtn.onclick=async ()=>{
   const res=await onClaimGrandChest();
   if(res.ok){
    message(`Đã mở Rương Cú Vàng: ${compactOwlReward(res.reward)}.`);
    syncMailBadge();
    openLetter('owl');
   }
  };
  sec.append(el('div',{class:`gp-hero owl-chest${grandReady?' is-ready':grandClaimed?' is-claimed':' is-locked'}`},[
   el('div',{class:'gp-tile-art'},[pixelIcon('chest',3),grandClaimed?el('span',{class:'gp-corner is-done'},[pixelIcon('check',1)]):grandReady?null:lockBadge()]),
   el('div',{class:'gp-hero-copy'},[
    el('small',{text:`Chuỗi ${summary.streakDays} ngày`}),
    el('strong',{text:'Rương Cú Vàng'}),
    el('div',{class:'owl-chest-meter'},[meter(n,goal,`${n}/${goal} thư`),el('b',{text:`${n}/${goal}`})]),
    rewardChips(items,{...DAILY_GRAND_CHEST_REWARD,label:chestLabel}),
   ]),
   chestBtn,
  ]));
  sec.append(questTiles(qState.quests||[]));
  // «Việc thêm»: a second chest once the owl quests and every bonus quest are done.
  const bonus=qState.bonusQuests||[],bonusChest=qState.bonusChest;
  if(bonus.length&&bonusChest){
   const all=[...(qState.quests||[]),...bonus],done=all.filter(q=>q.progress>=q.target).length;
   const bonusLabel=`Rương Bác Hagrid · ${compactOwlReward(bonusChest.reward)}`;
   const bonusBtn=bonusChest.ready
    ? iconButton('chest',`Mở ${bonusLabel}`,null,{text:'Mở',class:'primary'})
    : iconButton(bonusChest.claimed?'check':'lock',bonusChest.claimed?'Đã mở rương hôm nay':`Xong ${all.length} việc để mở rương`,null,{disabled:true});
   bonusBtn.dataset.letterBonusChest='true';
   bonusBtn.onclick=async ()=>{
    const res=await onClaimBonusChest();
    if(res.ok){
     message(`Đã mở Rương Bác Hagrid: ${compactOwlReward(res.reward)}.`);
     syncMailBadge();
     openLetter('owl');
    }
   };
   sec.append(el('div',{class:`gp-hero owl-chest${bonusChest.ready?' is-ready':bonusChest.claimed?' is-claimed':' is-locked'}`},[
    el('div',{class:'gp-tile-art'},[pixelIcon('chest',3),bonusChest.claimed?el('span',{class:'gp-corner is-done'},[pixelIcon('check',1)]):bonusChest.ready?null:lockBadge()]),
    el('div',{class:'gp-hero-copy'},[
     el('small',{text:'Việc thêm'}),
     el('strong',{text:'Rương Bác Hagrid'}),
     el('div',{class:'owl-chest-meter'},[meter(done,all.length,`${done}/${all.length} việc`),el('b',{text:`${done}/${all.length}`})]),
     rewardChips(items,{...bonusChest.reward,label:bonusLabel}),
    ]),
    bonusBtn,
   ]),questTiles(bonus));
  }
  return sec;
 }

 function questTiles(quests){
  const list=el('div',{class:'owl-quests-list gp-tiles'});
  for(const q of quests){
   const done=q.progress>=q.target;
   const rewardText=compactOwlReward(q.reward),routeLabel=OWL_ROUTE_LABELS[q.route]||q.routeLabel||'Đi tới';
   const action=q.claimed
    ? null
    : done
     ? iconButton('chest',`Nhận quà ${q.title}: ${rewardText}`,async ()=>{
        const res=await onClaimDailyQuest(q.id);
        if(res.ok){
         message(`Đã nhận quà: ${compactOwlReward(res.reward)}.`);
         syncMailBadge();
         openLetter('owl');
        }
       },{text:'Nhận',class:'primary','data-claim-owl-quest':q.id})
     : iconButton('arrow',routeLabel,()=>routeQuest(q.route),{'data-route-daily-quest':q.route});
   list.append(el('article',{class:`owl-quest-card gp-tile${q.claimed?' is-claimed':done?' is-ready':''}`,'data-quest-id':q.id,'aria-label':`${q.title} · ${q.claimed?'Đã nhận':`${q.progress}/${q.target}`} · ${rewardText}`},[
    el('div',{class:'gp-tile-art','aria-hidden':'true'},[pixelIcon(OWL_QUEST_ICONS[q.id]||'owl',3),q.claimed?el('span',{class:'gp-corner is-done'},[pixelIcon('check',1)]):null]),
    el('strong',{class:'gp-tile-name owl-quest-title',text:q.title}),
    meter(q.progress,q.target,`${q.progress}/${q.target}`),
    el('b',{class:'owl-quest-count',text:`${Math.min(q.progress,q.target)}/${q.target}`}),
    rewardChips(items,{...q.reward,label:rewardText}),
    el('div',{class:'gp-tile-actions'},action?[action]:[]),
   ]));
  }
  return list;
 }

 function openLetter(kind='owl'){
  panels.close();$('seedOptions').close();
  const isGreenhouse=kind==='greenhouse',isGardener=kind==='gardener',isTanSuc=kind==='tanSuc';
  $('letterTitle').textContent=isGreenhouse?'Nhà kính':isGardener?'Lời nhắn':isTanSuc?'Thư bác Hagrid':'Thư cú';
  // The daily letter closes with ×; only the short notes keep a route button.
  $('letterAction').hidden=!isGreenhouse&&!isGardener&&!isTanSuc;
  if(isTanSuc){
   // Sent once, when the garden reaches level 100 (roadmap §12).
   $('letterBody').replaceChildren(...[
    'Con giỏi quá! Cấp 100 rồi, mảnh vườn nhỏ giờ thành Đại khu vườn thật rồi đó.',
    'Bác ghi tên con vào bậc Tận Sức: còn bốn trăm bậc nữa, mỗi bậc thêm một ngôi sao ★. Tới cấp 500, bác có huy hiệu riêng cho con.',
    'Cứ gieo, gặt, nuôi như thường nghen. Không cần vội đâu. — Hagrid',
   ].map(text=>el('p',{text})));
   $('letterAction').textContent='Xem bậc Tận Sức';
   letterRoute=()=>panels.show('roadmap');
  }else if(isGreenhouse){
   $('letterBody').replaceChildren(el('p',{text:'Chọn hạt giống, rồi mang hạt ra luống trống để gieo.'}));
   $('letterAction').textContent='Hạt giống';
   letterRoute=()=>panels.show('crops');
  }else if(isGardener){
   $('letterBody').replaceChildren(el('p',{text:'Hagrid: Ghé vườn nhé, những người bạn nhỏ đang chờ.'}));
   $('letterAction').textContent='Về vườn';
   letterRoute=()=>{setMode('plant');camera.focusPlot();};
  }else{
   // A one-time gift (mission back-pay) sits above the daily quests until it is taken.
   $('letterBody').replaceChildren(...[getLetterGift?.(()=>openLetter('owl')),renderOwlQuestsSection()].filter(Boolean));
   $('letterAction').textContent='Về vườn';
   letterRoute=()=>{};
  }
  letterOpenedOnce=true;
  syncMailBadge();
  if(!letter.open)letter.showModal();
 }
 $('owlMailButton').onclick=()=>openLetter();$('closeLetter').onclick=()=>letter.close();
 $('letterAction').onclick=()=>{letter.close();letterRoute?.();};
 letter.addEventListener('click',e=>{if(e.target!==letter)return;const r=letter.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)letter.close();});
 $('contextAction').onclick=()=>{
  const state=getState(),selection=getSelection(),context=cropContext(state,selection,E,E.nowFor(state,Date.now()));
  if(!getReady())return;
  if(context.ready.length){const cells=[...context.ready],plotIndex=selection.selectedPlot;return run(s=>E.harvest(s,plotIndex,cells,Date.now()),'Đã gặt cây chín trên hàng.',{action:'harvest',plotIndex,cells});}
  // mobile-game careCells: the server «care» (records the owl-quest care action too).
  return onCare?.(context.occupied);
 };
 function refresh(){
  syncMailBadge();
  const state=getState(),selection=getSelection(),now=E.nowFor(state,Date.now()),context=cropContext(state,selection,E,now);
  const showing=selection.mode==='plant'&&context.occupied.length>0;
  // One plant dock: a planted row swaps only the caption and the main button, so the seed tray never jumps.
  $('plantButton').hidden=showing;$('contextAction').hidden=!showing;
  if(!showing){delete $('plantDock').dataset.crop;return;}
  const species=[...new Set(context.occupied.map(i=>state.plots[selection.selectedPlot].slots[i].species))];
  $('plantDock').dataset.crop=context.first.species;
  $('seedName').textContent=species.map(id=>E.CROP[id].label).join(' · ');
  const detail=context.ready.length?context.ready.length+' cây chín':'Đang lớn · còn '+duration(context.remaining);
  $('seedTime').replaceChildren(el('span',{class:'stat',title:detail,'aria-label':detail},[pixelIcon(context.ready.length?'harvest':'clock',1),context.ready.length?String(context.ready.length):duration(context.remaining)]));
  setAction($('contextAction'),context.ready.length?{icon:'harvest',label:'Gặt',count:'×'+context.ready.length,text:'Gặt ×'+context.ready.length+' cây chín'}:{icon:'care',label:'Chăm',text:'Chăm cây'});
  $('contextAction').disabled=!getReady();
 }
 return {
  refresh,
  openLetter,
  recordQuestAction:(actionType,amount=1)=>{recordOwlQuestAction(actionType,amount);syncMailBadge();},
  visit(id){if(id==='gardener'){getRenderer()?.greet?.();openLetter('gardener');}else openLetter(id);},
 };
}
