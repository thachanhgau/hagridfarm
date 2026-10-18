import {$,el,button,icon,duration,visualItemIcon} from './ui-utils.mjs?v=24.9.33';
import {pixelIcon,setAction} from './pixel-icons.mjs?v=24.9.33';
import {
 loadOwlQuests,
 saveOwlQuests,
 syncQuestsWithGardenState,
 recordOwlQuestAction,
 claimOwlQuest,
 claimDailyGrandChest,
 allDailyTasks,
 dailyCompletionSummary,
 hasClaimableOwlQuest,
 DAILY_GRAND_CHEST_REWARD,
} from './garden-quests.mjs?v=24.9.33';

// Presentation only: every crop mutation still uses the existing engine/command.
export function cropContext(state, selection, E, now) {
 const plot=state.plots[selection.selectedPlot];
 const occupied=selection.cells.filter(i=>plot?.slots[i]);
 const ready=occupied.filter(i=>E.growth(plot.slots[i],now).mature);
 const first=plot?.slots[occupied[0]];
 const remaining=occupied.map(i=>plot.slots[i].plantedAt+plot.slots[i].growMs-now).filter(n=>n>0);
 return {occupied,ready,first,remaining:remaining.length?Math.min(...remaining):0};
}


const COMPACT_OWL_TITLES=Object.freeze({
 quest_hagrid_harvest:'Gieo hoặc gặt',
 quest_sprout_craft:'Chế biến',
 quest_hemxeo_creature:'Chăm sinh vật',
 quest_neighbor_tour:'Thăm vườn',
 quest_festival_spirit:'Hưởng ứng lễ hội',
});
const COMPACT_OWL_ROUTES=Object.freeze({plant:'Ra thửa',craft:'Mở vạc',creature:'Thăm chuồng',tour:'Tham quan',events:'Mở lễ hội'});
const OWL_REWARD_NAMES=Object.freeze({water:'Nước',boost:'Nước phép',pumpkin:'Bí ngô',oats:'Yến mạch',insects:'Côn trùng',moonherb:'Cỏ trăng'});
function compactOwlReward(reward={}){
 const parts=[];
 if(Number(reward.amount)>0)parts.push(`+${reward.amount} ${OWL_REWARD_NAMES[reward.kind]||reward.kind||'quà'}`);
 if(Number(reward.bonusQty)>0)parts.push(`+${reward.bonusQty} ${OWL_REWARD_NAMES[reward.itemId]||(/_feed$/.test(reward.itemId||'')?'Khẩu phần':reward.itemId)||'vật phẩm'}`);
 if(Number(reward.waterBonus)>0)parts.push(`+${reward.waterBonus} Nước`);
 if(Number(reward.eventPoints)>0)parts.push(`+${reward.eventPoints} Điểm`);
 return parts.join(' · ')||'Quà';
}

export function setupWizardUI({E,items,getState,getSelection,getRenderer,getReady,run,message,panels,camera,setMode,focusPlot,onGrantOwlReward,onClaimDailyQuest,onClaimGrandChest,onCare}) {
 let lastIcon='',letterRoute=null,letterOpenedOnce=false;
 const letter=$('owlLetter');

 function currentQuestState(){
  const q=loadOwlQuests();
  syncQuestsWithGardenState(q,getState());
  return q;
 }

 function syncMailBadge(){
  const q=currentQuestState();
  const claimable=hasClaimableOwlQuest(q);
  $('owlMailButton').classList.toggle('mail-read',letterOpenedOnce&&!claimable);
 }

 function routeQuest(route){
  letter.close();
  if(route==='craft')panels.show('craft');
  else if(route==='creature')panels.show('creatures');
  else if(route==='tour')panels.show('tour');
  else if(route==='events')panels.show('events');
  else{setMode('plant');camera.focusPlot();}
 }

 function renderOwlQuestsSection(){
  const qState=currentQuestState();
  const summary=dailyCompletionSummary(qState);
  const sec=el('section',{class:'owl-quests-section','aria-label':'Thư Cú Hằng Ngày'});
  const chestReward=compactOwlReward(DAILY_GRAND_CHEST_REWARD);
  sec.append(
   el('div',{class:'owl-quests-head'},[
    el('strong',{text:`Chuỗi ${summary.streakDays} ngày`}),
   ]),
   el('div',{class:'owl-grand-chest-bar'},[
    el('div',{class:'v24-owl-chest-copy'},[
     el('strong',{text:'Rương Cú Vàng'}),
     el('small',{text:chestReward}),
    ]),
    button(
     summary.grandClaimed
      ? 'Đã mở'
      : summary.grandReady
       ? 'Mở rương'
       : `${summary.completedCount}/${summary.targetForGrand}`,
     async ()=>{
      const res=await onClaimGrandChest();
      if(res.ok){
       message(`Đã mở Rương Cú Vàng: ${compactOwlReward(res.reward)}.`);
       syncMailBadge();
       openLetter('owl');
      }
     },
     {class:summary.grandReady?'primary owl-quest-btn':'owl-quest-btn',disabled:!summary.grandReady||summary.grandClaimed,'data-letter-grand-chest':'true'}
    ),
   ])
  );
  const list=el('div',{class:'owl-quests-list'});
  for(const q of allDailyTasks(qState)){
   const done=q.progress>=q.target;
   const rewardText=compactOwlReward(q.reward),title=COMPACT_OWL_TITLES[q.id]||q.title,routeLabel=COMPACT_OWL_ROUTES[q.route]||q.routeLabel;
   const card=el('article',{class:`owl-quest-card v24-owl-row${q.claimed?' is-claimed':done?' is-ready':''}`,'data-quest-id':q.id,'aria-label':`${title} · ${q.progress}/${q.target} · ${rewardText}`},[
    el('span',{class:'v24-owl-row-art','aria-hidden':'true'},[visualItemIcon(items,q.reward.itemId,{size:30})]),
    el('div',{class:'v24-owl-row-copy'},[
     el('strong',{class:'owl-quest-title v24-owl-row-title',text:title}),
     el('span',{class:'v24-owl-row-progress',text:q.claimed?'Đã nhận':`${q.progress}/${q.target}`}),
    ]),
    el('span',{class:'v24-owl-row-reward',text:rewardText}),
    q.claimed
     ? el('span',{class:'owl-quest-done-pill v24-owl-row-action',text:'Xong'})
     : done
      ? button('Nhận',async ()=>{
         const res=await onClaimDailyQuest(q.id);
         if(res.ok){
          message(`Đã nhận quà: ${compactOwlReward(res.reward)}.`);
          syncMailBadge();
          openLetter('owl');
         }
        },{class:'primary owl-quest-btn v24-owl-row-action','data-claim-owl-quest':q.id})
      : button(routeLabel,()=>routeQuest(q.route),{class:'owl-quest-btn v24-owl-row-action','data-route-daily-quest':q.route}),
   ]);
   list.append(card);
  }
  sec.append(list);
  return sec;
 }

 function openLetter(kind='owl'){
  panels.close();$('seedOptions').close();
  const isGreenhouse=kind==='greenhouse',isGardener=kind==='gardener';
  $('letterTitle').textContent=isGreenhouse?'Nhà kính':isGardener?'Lời nhắn':'Thư cú';
  // The daily letter closes with ×; only the short notes keep a route button.
  $('letterAction').hidden=!isGreenhouse&&!isGardener;
  if(isGreenhouse){
   $('letterBody').replaceChildren(el('p',{text:'Chọn hạt giống, rồi mang hạt ra luống trống để gieo.'}));
   $('letterAction').textContent='Hạt giống';
   letterRoute=()=>panels.show('crops');
  }else if(isGardener){
   $('letterBody').replaceChildren(el('p',{text:'Hagrid: Ghé vườn nhé, những người bạn nhỏ đang chờ.'}));
   $('letterAction').textContent='Về vườn';
   letterRoute=()=>{setMode('plant');camera.focusPlot();};
  }else{
   $('letterBody').replaceChildren(renderOwlQuestsSection());
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
 $('contextOptions').onclick=()=>$('seedOptions').showModal();
 $('contextAction').onclick=()=>{
  const state=getState(),selection=getSelection(),context=cropContext(state,selection,E,E.nowFor(state,Date.now()));
  if(!getReady())return;
  if(context.ready.length){const cells=[...context.ready],plotIndex=selection.selectedPlot;return run(s=>E.harvest(s,plotIndex,cells,Date.now()),'Đã gặt cây chín trên hàng.',{action:'harvest',plotIndex,cells});}
  recordOwlQuestAction('care',1);onCare?.();syncMailBadge();
  getRenderer()?.animate('care',{plot:selection.selectedPlot,cells:context.occupied});message('Lá rung khẽ dưới bàn tay chăm sóc · thời gian lớn giữ nguyên.');
 };
 function refresh(){
  syncMailBadge();
  const state=getState(),selection=getSelection(),now=E.nowFor(state,Date.now()),context=cropContext(state,selection,E,now);
  const showing=selection.mode==='plant'&&context.occupied.length>0;
  $('cropContext').hidden=!showing;
  if(selection.mode==='plant')$('plantDock').hidden=showing;
  document.body.classList.toggle('context-active',showing);
  if(!showing)return;
  const species=[...new Set(context.occupied.map(i=>state.plots[selection.selectedPlot].slots[i].species))];
  $('contextEyebrow').textContent='THỬA '+(selection.selectedPlot+1);
  $('contextTitle').textContent=species.map(id=>E.CROP[id].label).join(' · ');
  const detail=context.ready.length?context.ready.length+' cây chín':'Đang lớn · còn '+duration(context.remaining);
  $('contextDetail').replaceChildren(el('span',{class:'stat',title:detail,'aria-label':detail},[pixelIcon(context.ready.length?'harvest':'clock',1),context.ready.length?String(context.ready.length):duration(context.remaining)]));
  setAction($('contextAction'),context.ready.length?{icon:'harvest',label:'Gặt',count:'×'+context.ready.length,text:'Gặt ×'+context.ready.length+' cây chín'}:{icon:'care',label:'Chăm',text:'Chăm cây'});
  $('contextAction').disabled=!getReady();
  if(lastIcon!==context.first.species){lastIcon=context.first.species;$('contextIcon').replaceChildren(icon(items,lastIcon,3,52));}
 }
 return {
  refresh,
  openLetter,
  recordQuestAction:(actionType,amount=1)=>{recordOwlQuestAction(actionType,amount);syncMailBadge();},
  visit(id){if(id==='gardener'){getRenderer()?.greet?.();openLetter('gardener');}else openLetter(id);},
 };
}
