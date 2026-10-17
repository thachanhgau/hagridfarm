import {$,el,button,icon,duration,visualItemIcon} from './ui-utils.mjs?v=24.9.26';
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
} from './garden-quests.mjs?v=24.9.26';

// Presentation only: every crop mutation still uses the existing engine/command.
export function cropContext(state, selection, E, now) {
 const plot=state.plots[selection.selectedPlot];
 const occupied=selection.cells.filter(i=>plot?.slots[i]);
 const ready=occupied.filter(i=>E.growth(plot.slots[i],now).mature);
 const first=plot?.slots[occupied[0]];
 const remaining=occupied.map(i=>plot.slots[i].plantedAt+plot.slots[i].growMs-now).filter(n=>n>0);
 return {occupied,ready,first,remaining:remaining.length?Math.min(...remaining):0};
}

const paths={
 seed:'M6 19V9h12v10H6z M8 9V5h8v4 M9 14h6 M12 11v6',
 sickle:'M5 20l7-9 M11 4c11-4 13 7 5 10l-4-3c6-1 6-6-1-7',
 creature:'M5 10l1-6 5 4h3l4-4 1 6v7l-5 4h-4l-5-4z M9 13h1 M15 13h1 M11 17h3',
 cauldron:'M5 10h14l-2 9H7z M8 19l-1 2 M16 19l1 2 M8 7V4 M12 7V2 M16 7V4 M3 10h18',
 hut:'M3 11l9-8 9 8 M5 10v11h14V10 M10 21v-7h4v7',
 owl:'M5 7V3l5 3h4l5-3v12l-4 6H9l-4-6z M7 10h3v3H7z M14 10h3v3h-3z M11 15h2l-1 2z',
 bag:'M5 8h14v13H5z M9 8V4h6v4 M5 13h14 M10 12v3h4v-3',
 coin:'M8 3h8l5 5v8l-5 5H8l-5-5V8z M15 8h-5v8h5v-4h-3'
};
function glyph(name){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');svg.setAttribute('class','wizard-icon');const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',paths[name]);path.setAttribute('fill','none');path.setAttribute('stroke','currentColor');path.setAttribute('stroke-width','1.7');path.setAttribute('stroke-linejoin','miter');svg.append(path);return svg;}

const COMPACT_OWL_TITLES=Object.freeze({
 quest_hagrid_harvest:'Gieo hoặc gặt',
 quest_sprout_craft:'Chế biến',
 quest_hemxeo_creature:'Chăm sinh vật',
 quest_neighbor_tour:'Thăm vườn',
 quest_festival_spirit:'Hưởng ứng lễ hội',
});
const COMPACT_OWL_ROUTES=Object.freeze({plant:'Ra thửa',craft:'Mở vạc',creature:'Thăm chuồng',tour:'Tham quan',events:'Mở lễ hội'});
const OWL_REWARD_NAMES=Object.freeze({water:'Nước',kit:'Vật liệu',boost:'Phân bón',pumpkin:'Bí ngô',insects:'Côn trùng',moonherb:'Cỏ trăng'});
function compactOwlReward(reward={}){
 const parts=[];
 if(Number(reward.amount)>0)parts.push(`+${reward.amount} ${OWL_REWARD_NAMES[reward.kind]||reward.kind||'quà'}`);
 if(Number(reward.bonusQty)>0)parts.push(`+${reward.bonusQty} ${OWL_REWARD_NAMES[reward.itemId]||reward.itemId||'vật phẩm'}`);
 if(Number(reward.waterBonus)>0)parts.push(`+${reward.waterBonus} Nước`);
 if(Number(reward.eventPoints)>0)parts.push(`+${reward.eventPoints} Điểm`);
 return parts.join(' · ')||'Quà';
}

export function setupWizardUI({E,items,getState,getSelection,getRenderer,getReady,run,message,panels,camera,setMode,focusPlot,onGrantOwlReward,onClaimDailyQuest,onClaimGrandChest}) {
 let lastIcon='',letterRoute=null,letterOpenedOnce=false;
 for(const [id,name] of Object.entries({sowTool:'seed',harvestTool:'sickle',creatureTool:'creature',craftTool:'cauldron',buildTool:'hut'}))$(id).querySelector('.tool-glyph').replaceChildren(glyph(name));
 $('owlMailButton').querySelector('.owl-mail-icon').append(glyph('owl'));
 $('inventoryButton').querySelector('span').replaceChildren(glyph('bag'));
 $('shopButton').querySelector('span').replaceChildren(glyph('coin'));
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
    el('small',{class:'letter-kicker',text:'THƯ CÚ'}),
    el('strong',{text:`${summary.completedCount}/${summary.totalCount} nhiệm vụ · Chuỗi ${summary.streakDays}`}),
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
    button('Lễ hội',()=>{letter.close();panels.show('events');},{class:'owl-quest-btn','data-letter-open-events':'true'}),
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
  $('letterTitle').textContent=isGreenhouse?'Nhà kính':isGardener?'Lời nhắn':'Cú';
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
  recordOwlQuestAction('care',1);syncMailBadge();
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
  $('contextDetail').textContent=context.ready.length?context.ready.length+' cây chín': 'Đang lớn · còn '+duration(context.remaining);
  $('contextAction').textContent=context.ready.length?'Gặt ×'+context.ready.length:'Chăm cây';
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
