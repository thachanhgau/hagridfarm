import {setupGardenControls} from './garden-controls-ui.mjs?v=24.9.35';
import {configureGardenStorage,applyGardenReward} from './garden-storage.mjs';
import {setupWorkTrays} from './work-trays.mjs?v=24.9.35';
import {showDecorationPlacement,showVisualLayoutModal} from './decor-placement-ui.mjs?v=24.9.35';
import {setupWizardUI} from './wizard-ui.mjs?v=24.9.35';
import {showStore} from './garden-store-ui.mjs?v=24.9.35';
import {setupProfile} from './profile-ui.mjs?v=24.9.35';
import * as E from './progression-engine.mjs';
import {createGarden,iso,plotCorners,plotCellPosition} from './scene-renderer.mjs?v=24.9.35';
import {setupCamera} from './camera.mjs?v=24.9.35';
import {createPanels} from './progression-panels.mjs?v=24.9.35';
import {$,el,icon,button,num,duration,hours,plantingAction,serverRefusal} from './ui-utils.mjs?v=24.9.35';
import {atmosphereConfig,nextAtmosphereMode,weatherConfig,nextWeatherMode} from './garden-atmosphere.mjs?v=24.9.35';
import {createGardenAudio,comboStep} from './garden-audio.mjs?v=24.9.35';
import {createJuice,rewardDeltas} from './garden-juice.mjs?v=24.9.35';
import {createPlaytestLog,deviceContext} from './garden-playtest.mjs?v=24.9.35';
import {TUTORIAL_LINES,TUTORIAL_GUEST,TUTORIAL_PLOT,REPLAY_STEPS,REPLAY_STEP_MS,tutorialEligible,tutorialStart,letterGreeting,loadTutorial,saveTutorial,advanceTutorial} from './garden-tutorial.mjs?v=24.9.35';
import {showHagridLetter} from './hagrid-letter-ui.mjs?v=24.9.35';
import {loadVisualPrefs,saveVisualPrefs,createHpvnBridge} from './hpvn-bridge.mjs?v=24.9.35';
import {HONOR_GARDENS,buildHonorGardenSnapshot,loadTourProgress,helpHonorGarden} from './garden-tour.mjs?v=24.9.35';
import {evaluateAchievements,selectKeeperTitle,claimAchievementReward,useServerAchievements} from './garden-achievements.mjs?v=24.9.35';
import {eventConfig,loadEventState,saveEventState,recordFestivalAction,claimEventMilestone,hasClaimableEventMilestone,useServerFestival,useServerBonding,festivalMilestone,evaluateCreatureAffinity,recordCreatureAffinity,claimAffinityGift} from './garden-events.mjs?v=24.9.35';
import {pixelIcon,lineIconUrl,setAction} from './pixel-icons.mjs?v=24.9.35';
import {nextGoal} from './next-goal.mjs?v=24.9.35';
import {loadOwlQuests,saveOwlQuests,setOwlQuestContext,syncQuestsWithGardenState,recordOwlQuestAction,claimOwlQuest,claimDailyGrandChest,hasClaimableQuest,useServerDaily,questAmounts as questAmountsFor} from './garden-quests.mjs?v=24.9.35';
// One entry for every page: ui-fixture.html sets <html data-wallet="fixture"> to use the
// in-memory sample wallet; any other page with ?wallet=emulator talks to the local emulator.
document.querySelectorAll('[data-px]').forEach(n=>n.replaceWith(pixelIcon(n.dataset.px,Number(n.dataset.scale)||2)));
const fixtureWallet=document.documentElement.dataset.wallet==='fixture';
const {createEmulatorClient}=await import(fixtureWallet?'../qa-v19/fixture-wallet.mjs?v=24.9.35':'./garden-emulator-client.mjs?v=24.9.35');
const WALLET_TEXT=fixtureWallet
 ?{title:'Dữ liệu mẫu trong bộ nhớ · không lưu',badge:'V24 · Xem thử, không lưu',ready:'V24 · Chạm để khám phá.'}
 :{title:'Đã lưu trên emulator · Galleons mô phỏng',badge:'EMULATOR · Ví Gringotts thử nghiệm',ready:'Đã nối ví Gringotts thử nghiệm. Mua hạt và nước để gieo.'};
const {DB,CROP,CREATURE}=E,map=window.FARM_SCENE,items=new Map(window.FARM_MOTION.items.map(i=>[i.id,i]));
const layoutSlots={plots:[...map.plots],pens:[...map.pens]};
const connected=new URLSearchParams(location.search).get('wallet')==='emulator',wallet=connected?createEmulatorClient({decorQA:new URLSearchParams(location.search).get('qa')==='1'&&new URLSearchParams(location.search).get('decorQA')==='1'}):null;let walletReady=false;
// Phase 4 switch: what the server owns once a wallet is connected. Owl quests, chest, streak,
// free-action caps and festivals come from each response's `daily`/`festival`, bonding from
// `bonding`, achievements from `achievements`. The worn title stays a device preference;
// honour-garden help (frozen) has no server claim, so receiveReward refuses it with a wallet.
const SERVER_OWNS=Object.freeze({daily:connected,bonding:connected,achievements:connected});
const query=new URLSearchParams(location.search),qa=query.get('qa')==='1',prefix=qa?'hagrid-garden-v05-qa':'hagrid-garden-v05';
let session=query.get('lab')==='1'?'lab':'play',key=prefix+'-'+session,state,saveAvailable=true,saveProblem='',selectedPlot=0,seed='pumpkin',species='puffskein',direction='horizontal',line=0,mode='plant',renderer,loaded=false,propsVisible=true,grid=false,busy=false,toastTimer,panels,camera,wizard,workTrays,dockControls;
let gardenStorage;
function selectStorage(){gardenStorage=configureGardenStorage({scope:key,persistent:!connected,legacyKeys:[key,...(!qa&&session==='play'?['hpvn-garden-v23-events','hpvn-garden-v23-affinity','hpvn-garden-v21-owl-quests','hpvn-garden-v22-tour','hpvn-garden-v22-achievements','hpvn-garden-v20-visual-prefs','hpvn-garden-v18-decor-layout']:[])]});}
selectStorage();
// Galleons the wallet can spend; local play has no wallet, so builds are never blocked by Galleons there.
function getGalleons(){return connected?(walletReady?Number(wallet.snapshot?.wallet?.spendable)||0:0):Infinity;}
function currentSupplies(){return wallet?.snapshot?.garden?.supplies||JSON.parse(gardenStorage.getItem('supplies')||'{"water":0,"boost":0,"seeds":{}}');}
async function receiveReward(claim){
 if(connected){message('Quà này chưa nối máy chủ.',{reason:'server-reward-unavailable',px:'chest'});return {ok:false,reason:'SERVER_REWARD_UNAVAILABLE'};}
 if(!connected&&!saveAvailable){message('Chưa lưu được vườn; hãy xuất bản lưu trước khi nhận quà.');return {ok:false,reason:'SAVE_FAILED'};}
 const actionKey=key;
 const perform=()=>{
  if(actionKey!==key)return {ok:false,reason:'SESSION_CHANGED'};
  let before=JSON.stringify(state),supplyBefore,result;
  try{
   supplyBefore=JSON.stringify(currentSupplies());
   result=gardenStorage.transaction(()=>{
    if(!connected){const raw=gardenStorage.getItem(key);if(raw!==null)state=E.restoreChecked(raw,Date.now());}
    before=JSON.stringify(state);
    const result=claim();
    if(result.ok&&!connected)gardenStorage.setItem(key,JSON.stringify(state));
    if(result.ok)playtest.track('claim');
    return result;
   });
  }catch{
   state=JSON.parse(before);
   if(connected&&supplyBefore){wallet.snapshot.garden.progression=state;wallet.snapshot.garden.supplies=JSON.parse(supplyBefore);}
   message('Không lưu được phần thưởng. Quà chưa bị đánh dấu đã nhận; hãy thử lại.');
   return {ok:false,reason:'SAVE_FAILED'};
  }
  try{if(result.ok)audio.play('levelUp');refresh();panels?.refresh();}
  catch(error){console.error(error);message('Phần thưởng đã lưu. Hãy tải lại trang để cập nhật giao diện.');}
  return result;
 };
 try{return await (navigator.locks?.request?navigator.locks.request('lock-'+actionKey,perform):perform());}
 catch{message('Không khóa được bản lưu; hãy thử nhận quà lại.');return {ok:false,reason:'SAVE_FAILED'};}
}
function touchGardenDay(){
 const touch=()=>saveOwlQuests(loadOwlQuests());
 if(navigator.locks?.request)navigator.locks.request('lock-'+key,touch).catch(()=>{});
 else touch();
}

// A save from an older schema (before the 18/10/2026 resource merge) starts a new garden: open beta starts fresh.
const oldSchema=raw=>{try{return JSON.parse(raw)?.schemaVersion!==DB.schemaVersion;}catch{return false;}};
function loadSession(){saveAvailable=true;saveProblem='';try{const raw=gardenStorage.getItem(key);if(raw!==null&&oldSchema(raw)){state=E.newGame(Date.now());gardenStorage.setItem(key,JSON.stringify(state));}else state=raw===null?E.newGame(Date.now()):E.restoreChecked(raw,Date.now());}catch{state=E.newGame(Date.now());saveAvailable=false;saveProblem='Không đọc được bản lưu. Bản cũ được giữ nguyên; phiên này chỉ chơi tạm.';}}
const persistentLocks=Boolean(navigator.locks?.request);
function checkSaveSupport(){if(!persistentLocks){saveAvailable=false;saveProblem='Trình duyệt chưa hỗ trợ khóa bản lưu. Phiên này chỉ lưu tạm; hãy xuất bản lưu trước khi đóng.';}}
if(connected){state=E.newGame(Date.now());session='emulator';}else{loadSession();checkSaveSupport();}
// Owl quests are picked from what this garden can do today.
function syncQuestContext(){setOwlQuestContext({level:state.level,hasCreature:state.creatures.length>0,feedItem:CREATURE[state.creatures[0]?.species]?.feed});}
syncQuestContext();
// Anonymous playtest log: only with ?playtest=1 on a local garden, and always visible to the player.
const playtest=createPlaytestLog({enabled:query.get('playtest')==='1'&&!connected,context:{...deviceContext(),newGarden:tutorialEligible(state),session}});
if(playtest.enabled){document.body.append(el('div',{class:'playtest-badge',role:'status',text:'● Đang ghi thử nghiệm ẩn danh'}));document.addEventListener('visibilitychange',()=>playtest.track(document.hidden?'hidden':'visible'));addEventListener('pagehide',()=>playtest.track('session_end'));}
function exportPlaytest(){const blob=new Blob([playtest.exportJson()],{type:'application/json'}),url=URL.createObjectURL(blob),a=el('a',{href:url,download:'hagrid-playtest-'+playtest.session.id+'.json'});a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
const savedPrefs=loadVisualPrefs();
const audio=createGardenAudio({initialEnabled:savedPrefs.soundEnabled});
const motionMedia=matchMedia('(prefers-reduced-motion: reduce)');
let motionEnabled=savedPrefs.motionEnabled;propsVisible=savedPrefs.propsVisible;grid=savedPrefs.grid;
function syncMotionPreference(){document.body.classList.toggle('motion-paused',!motionEnabled||motionMedia.matches);}
syncMotionPreference();
motionMedia.addEventListener('change',()=>{syncMotionPreference();draw();panels?.refresh();});
let decorAssets=new Map(),previewDecoration=null,previewLayout=null,lastGardenStage=null,activeTourSnapshot=null;
let localDecorRotations={...savedPrefs.storeRotations},earnedDecorRotations={...savedPrefs.earnedRotations},creatureFacings={...savedPrefs.creatureFacings};
let atmosphereMode=query.get('atmo')||savedPrefs.atmosphereMode||'day';
let weatherMode=query.get('weather')||savedPrefs.weatherMode||'clear';
let eventMode=query.get('event')||savedPrefs.eventMode||loadEventState().activeEventId||'event_halloween';
function persistPrefs(){saveVisualPrefs({storeRotations:localDecorRotations,earnedRotations:earnedDecorRotations,creatureFacings,atmosphereMode,weatherMode,eventMode,soundEnabled:audio.enabled,motionEnabled,propsVisible,grid});}
function currentDecorations(){if(activeTourSnapshot)return activeTourSnapshot.decorations;const base=wallet?.snapshot?.garden?.decorations;if(!base)return undefined;// With a wallet the server stores each item's facing (placeDecoration `facing`); it wins over the device copy.
 return {...base,rotations:{...localDecorRotations,...(base.rotations||{})}};}
function currentCreatureFacings(){if(activeTourSnapshot)return activeTourSnapshot.creatureFacings;return {...(state?.creatureFacings||{}),...creatureFacings};}
function currentAffinitySummary(){return evaluateCreatureAffinity(activeTourSnapshot?activeTourSnapshot.state:state);}
function currentCreatureAffinities(){const s=currentAffinitySummary();return Object.fromEntries(s.entries.map(e=>[e.species,{level:e.level,title:e.title,badge:e.badge,hearts:e.hearts,xp:e.xp}]));}
function getAchievementExtra(){const prog=loadTourProgress();const evState=loadEventState();return {decorations:wallet?.snapshot?.garden?.decorations,helpedGardensCount:prog.helpedIds.length,eventPoints:evState.points};}
function currentKeeperTitle(){const summary=evaluateAchievements(state,getAchievementExtra());return summary.activeTitle;}
function rotateEarnedDecoration(id){if(activeTourSnapshot)return;const cur=(earnedDecorRotations[id]||state?.decorationRotations?.[id])==='right'?'right':'default';const next=cur==='right'?'default':'right';earnedDecorRotations={...(state?.decorationRotations||{}),...earnedDecorRotations,[id]:next};if(state)state.decorationRotations=earnedDecorRotations;persistPrefs();audio.play('rotate');recordFestivalAction('rotate');freeTap('rotate');wizard?.recordQuestAction?.('rotate');syncHudV20Buttons();draw();const entry=DB.decorations.find(d=>d.id===id);message(`Đã xoay ${entry?.label||id} sang ${next==='right'?'Góc nhìn qua phải ↗':'Góc hiện tại ↖'}.`);}
function rotateCreatureFacing(speciesId=species){if(activeTourSnapshot)return;const cur=currentCreatureFacings()[speciesId]==='right'?'right':'default';const next=cur==='right'?'default':'right';creatureFacings={...currentCreatureFacings(),[speciesId]:next};if(state)state.creatureFacings=creatureFacings;persistPrefs();audio.play('rotate');recordFestivalAction('rotate');freeTap('rotate');wizard?.recordQuestAction?.('rotate');syncHudV20Buttons();draw();const entry=CREATURE[speciesId];message(`Đã đổi hướng ${entry?.label||speciesId} sang ${next==='right'?'Góc nhìn qua phải ↗':'Góc chuẩn ↖'}.`);}
function setAtmosphere(mode){atmosphereMode=atmosphereConfig(mode).id;persistPrefs();audio.play('owl');syncHudV20Buttons();draw();return atmosphereMode;}
function setWeather(mode){const next=weatherConfig(mode).id;if(next!==weatherMode){weatherMode=next;persistPrefs();audio.play('owl');recordOwlQuestAction('weatherChange',1);syncHudV20Buttons();draw();}return weatherMode;}
function cycleAtmosphere(){return setAtmosphere(nextAtmosphereMode(atmosphereMode));}
function cycleWeather(){return setWeather(nextWeatherMode(weatherMode));}
// One festival at a time, picked by the calendar (core-design.md): the theme below only dresses the scene,
// so it earns no festival points and sends no freeAction, with or without a wallet.
function setEventScene(mode){eventMode=eventConfig(mode).id;const evState=loadEventState();evState.activeEventId=eventMode;saveEventState(evState);persistPrefs();syncHudV20Buttons();draw();return eventMode;}
function applyEventTheme(cfg){const target=eventConfig(cfg?.id||eventMode);eventMode=target.id;atmosphereMode=target.recommendedAtmosphere||'night';weatherMode=target.recommendedWeather||'autumn';const evState=loadEventState();evState.activeEventId=target.id;saveEventState(evState);persistPrefs();audio.play('owl');syncHudV20Buttons();draw();message('Đã đổi cảnh lễ hội.');return {eventMode,atmosphereMode,weatherMode};}
function toggleAudio(){const on=audio.toggle();persistPrefs();syncHudV20Buttons();if(on)audio.play('care');message(on?'🔊 Đã bật âm thanh khu vườn.':'🔇 Đã tắt âm thanh khu vườn.');return on;}
const logical=()=>E.nowFor(state,Date.now()),chosen=()=>E.lineCells(direction,line),owned=id=>state.creatures.find(e=>e.species===id);
const labels=Object.fromEntries(DB.crops.map(c=>[c.id,c.label]));Object.assign(labels,{insects:'Côn trùng',fish:'Cá nhỏ'});DB.animals.forEach(a=>{labels[a.feed]='Khẩu phần '+a.label;labels['produce_'+a.id]=a.produce;});
function message(text,refusal=null){playtest.track('toast',{text:String(text||'')});const t=$('toast');t.replaceChildren(...(refusal?[refusalIcon(refusal)]:[]),String(text??''));if(refusal)t.dataset.reason=refusal.reason;else delete t.dataset.reason;t.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),5000);}
const hpvnBridge=createHpvnBridge({getState:()=>state,getStage:()=>renderer?.growthStage?.(),getAtmosphere:()=>atmosphereConfig(atmosphereMode),getWeather:()=>weatherConfig(weatherMode),getEvent:()=>eventConfig(eventMode),getKeeperTitle:()=>currentKeeperTitle().badge,onSetAtmosphere:m=>{atmosphereMode=atmosphereConfig(m).id;persistPrefs();syncHudV20Buttons();draw();},onSetWeather:m=>{weatherMode=weatherConfig(m).id;persistPrefs();syncHudV20Buttons();draw();},onSetEvent:m=>{setEventScene(m);},onStartTour:id=>startTour(id),onStopTour:()=>stopTour(),notify:message});
function shareToFloo(){audio.play('owl');recordFestivalAction('shareFloo');freeTap('shareFloo');recordOwlQuestAction('shareFloo',1);syncHudV20Buttons();return hpvnBridge.shareGardenToFloo({state,stage:renderer?.growthStage?.(),atmosphere:atmosphereConfig(atmosphereMode),weather:weatherConfig(weatherMode),event:eventConfig(eventMode),keeperTitle:currentKeeperTitle().badge,totalAffinity:currentAffinitySummary().totalAffinityLevels});}
function openPostcard(){return panels?.show('postcard');}
// Called when the Bưu thiếp tab of Hồ sơ opens; null until the scene is drawn.
function postcardOptions(){if(!loaded)return null;audio.play('owl');recordFestivalAction('postcard');freeTap('postcard');recordOwlQuestAction('postcard',1);syncHudV20Buttons();draw();return {canvas:$('world'),state:{...(activeTourSnapshot?.state||state),decorations:currentDecorations()||state.decorations},stage:renderer?.growthStage?.(),atmosphere:atmosphereConfig(activeTourSnapshot?.atmosphereMode||atmosphereMode),weather:weatherConfig(activeTourSnapshot?.weatherMode||weatherMode),event:eventConfig(eventMode),playerName:activeTourSnapshot?activeTourSnapshot.tour.ownerName:($('playerName')?.textContent||'Người làm vườn'),keeperTitle:activeTourSnapshot?activeTourSnapshot.tour.keeperTitle:currentKeeperTitle().badge,totalAffinity:currentAffinitySummary().totalAffinityLevels,onShareFloo:shareToFloo,notify:message};}
function refusalIcon(r){const n=r.item?icon(items,r.item,3,20):pixelIcon(r.px||'more',1);n.classList.add('toast-icon');return n;}
// Server refusals, icon first: which crop is missing, how many Galleons short (ui-utils serverRefusal).
function showRefusal(e){const r=serverRefusal(e,{labels,modelText:code=>errorMessages[code]});message(r.text,r);}
function syncDaily(){const s=wallet?.snapshot;if(!s)return;if(SERVER_OWNS.daily&&s.daily){useServerDaily(s.daily);useServerFestival(s);}if(SERVER_OWNS.bonding&&s.bonding)useServerBonding(s);if(SERVER_OWNS.achievements&&s.achievements)useServerAchievements(s.achievements);}
// Free taps count on the server (caps, festival points); local play counts them in recordFestivalAction.
function freeTap(kind,extra={}){if(!SERVER_OWNS.daily||!walletReady)return Promise.resolve(null);return wallet.free(kind,extra).then(snap=>{syncDaily();syncHudV20Buttons();wizard?.refresh?.();return snap;}).catch(e=>{if(extra.species)showRefusal(e);return null;});}
// Owl quest, chest and festival claims: one server command each; `busy` drops a double tap and the
// client keeps the requestId of a lost response, so neither can claim twice.
async function serverClaim(command){
 if(!walletReady||busy)return {ok:false,reason:'BUSY'};
 busy=true;
 try{const before=state;const snap=await wallet.act(command);acceptWallet(before,'');audio.play('levelUp');return {ok:true,reward:snap.receipt?.reward||{},receipt:snap.receipt};}
 catch(e){if(e.definitive){try{await wallet.read();acceptWallet(state,'',false);}catch{}}showRefusal(e);return {ok:false,reason:e.reason||'SERVER_ERROR'};}
 finally{busy=false;}
}
function grantOwlReward(reward){
 const supplies=currentSupplies();
 applyGardenReward(state.inventory,supplies,reward);
 if(!connected)gardenStorage.setItem('supplies',JSON.stringify(supplies));
 if(reward.eventPoints)recordFestivalAction('dailyChest',reward.eventPoints);
}

function startTour(tourId='tour_sprout'){
 activeTourSnapshot=buildHonorGardenSnapshot(tourId,E,Date.now());
 audio.play('owl');
 recordFestivalAction('startTour');
 freeTap('startTour');
 recordOwlQuestAction('startTour',1);
 syncTourBanner();
 syncHudV20Buttons();
 camera?.overview();
 draw();
 message(`🧭 Đang tham quan: ${activeTourSnapshot.tour.title} của ${activeTourSnapshot.tour.ownerName}!`);
 return activeTourSnapshot.tour.id;
}
function stopTour(){
 if(!activeTourSnapshot)return;
 activeTourSnapshot=null;
 audio.play('care');
 syncTourBanner();
 camera?.overview();
 refresh();
 message('🏡 Đã trở về khu vườn của bạn.');
}
async function helpTour(tourId=activeTourSnapshot?.tour?.id||'tour_sprout'){
 const res=await receiveReward(()=>{const result=helpHonorGarden(tourId,{onReward:grantOwlReward});if(result.ok){recordFestivalAction('helpTour');recordOwlQuestAction('helpTour',1);}return result;});
 if(res.ok){
  renderer?.animate?.('care',{plot:0,cells:[0,1,2]});
  syncTourBanner();
  syncKeeperTitleBadge();
  syncHudV20Buttons();
  message(`🤝 Đã phụ chăm sóc vườn của ${res.tour.ownerName}! Nhận ${res.reward.label}.`);
 }else if(res.alreadyHelped){
  message(`Bạn đã phụ chăm sóc vườn của ${res.tour.ownerName} hôm nay rồi.`);
 }
 return res;
}
function handleSelectTitle(achId){
 const res=selectKeeperTitle(achId,{state,extra:getAchievementExtra()});
 if(res.ok){audio.play('levelUp');syncKeeperTitleBadge();message(`🎖 Đã đeo danh hiệu [${res.title.badge}]!`);}
 return res;
}
async function handleClaimAchievement(achId){
 if(SERVER_OWNS.achievements){const ach=evaluateAchievements(state).items.find(i=>i.id===achId);const res=await serverClaim({action:'claimAchievement',achievementId:achId});if(res.ok){syncKeeperTitleBadge();message(`🎁 Đã nhận thưởng thành tựu [${ach?.badge||achId}]: ${res.reward.label}!`);}return {...res,achievement:ach};}
 const res=await receiveReward(()=>claimAchievementReward(achId,{state,extra:getAchievementExtra(),onReward:grantOwlReward}));
 if(res.ok){syncKeeperTitleBadge();message(`🎁 Đã nhận thưởng thành tựu [${res.achievement.badge}]: ${res.reward.label}!`);}
 return res;
}
async function handleClaimEventMilestone(mId){
 if(SERVER_OWNS.daily){const res=await serverClaim({action:'claimFestival',milestoneKey:mId});if(res.ok){syncHudV20Buttons();message(`🎃 Đã nhận mốc lễ hội [${festivalMilestone(mId)?.title||mId}]: ${res.reward.label}!`);}return res;}
 const res=await receiveReward(()=>claimEventMilestone(mId,{onGrantReward:grantOwlReward}));
 if(res.ok){syncHudV20Buttons();message(`🎃 Đã nhận mốc lễ hội [${res.milestone.title}]: ${res.reward.label}!`);}
 return res;
}
async function handleClaimDailyQuest(qId){
 if(SERVER_OWNS.daily){const quest=loadOwlQuests().quests.find(q=>q.id===qId);const res=await serverClaim({action:'claimQuest',questId:qId});if(res.ok){syncHudV20Buttons();wizard?.refresh?.();message(`🦉 Đã nhận thưởng nhiệm vụ [${quest?.title||qId}]: ${res.reward.label}!`);}return {...res,quest};}
 const res=await receiveReward(()=>{const result=claimOwlQuest(qId,{onGrantReward:grantOwlReward});if(result.ok)recordFestivalAction('questClaim');return result;});
 if(res.ok){syncHudV20Buttons();wizard?.refresh?.();message(`🦉 Đã nhận thưởng nhiệm vụ [${res.quest.title}]: ${res.reward.label}!`);}
 return res;
}
async function handleClaimGrandChest(){
 if(SERVER_OWNS.daily){const res=await serverClaim({action:'claimChest'});if(res.ok){syncHudV20Buttons();wizard?.refresh?.();message(`🎁 Đã mở Rương Cú Vàng Hàng Ngày: ${res.reward.label}!`);}return res;}
 const res=await receiveReward(()=>claimDailyGrandChest({onGrantReward:grantOwlReward}));
 if(res.ok){syncHudV20Buttons();wizard?.refresh?.();message(`🎁 Đã mở Rương Cú Vàng Hàng Ngày: ${res.reward.label}!`);}
 return res;
}
function handlePetCreature(speciesId=species){
 if(activeTourSnapshot||!state.creatures.some(cr=>cr.species===speciesId))return {ok:false,reason:'NOT_ADOPTED'};
 audio.play('care');
 // With a wallet the pet names its creature, so the server counts bonding (3 per creature a day) and the free tap together.
 if(SERVER_OWNS.bonding){renderer?.animate('care',{species:speciesId});return freeTap('pet',{species:speciesId}).then(snap=>{const b=snap?.receipt?.bonding?.[0];if(!b)return null;const card=snap.bonding?.creatures?.find(c=>c.species===speciesId),name=CREATURE[speciesId]?.label||speciesId;if(b.capped)message(`🤚 ${name} đã đủ vuốt ve hôm nay.`);else if(b.leveledUp){audio.play('levelUp');message(`💖 ${name} đã lên cấp gắn kết ${card?.badge||'Cấp '+b.level} (${card?.title||''})! Mở Gắn kết để nhận quà.`);}else message(`🤚 Đã vuốt ve ${name} · Điểm gắn kết +${b.gain} (${card?.badge||'Cấp '+b.level}).`);draw();panels?.refresh();return b;});}
 const affRes=recordCreatureAffinity(speciesId,'pet',gardenStorage,state);
 recordFestivalAction('pet');
 freeTap('pet');
 wizard?.recordQuestAction?.('pet');
 renderer?.animate('care',{species:speciesId});
 syncHudV20Buttons();
 draw();
 const labelName=CREATURE[speciesId]?.label||speciesId;
 if(affRes?.capped){
  message(`🤚 ${labelName} đã đủ vuốt ve hôm nay.`);
 }else if(affRes?.leveledUp){
  audio.play('levelUp');
  message(`💖 ${labelName} đã lên cấp gắn kết ${affRes.info.badge} (${affRes.info.title})! Mở Gắn kết để nhận quà.`);
 }else{
  message(`🤚 Đã vuốt ve ${labelName} · Điểm gắn kết +${affRes?.gain||12} (${affRes?.info?.badge||'🌱 Cấp 1'}).`);
 }
 return affRes;
}
async function handleClaimAffinityGift(giftId){
 if(SERVER_OWNS.bonding){const [sp,lv]=String(giftId).split(':lv');const res=await serverClaim({action:'claimBondGift',giftId});if(res.ok){syncHudV20Buttons();draw();message(`💝 Đã nhận quà gắn kết Cấp ${lv} từ ${CREATURE[sp]?.label||sp}: ${res.reward.label}!`);}return {...res,gift:{giftId,species:sp,level:Number(lv)}};}
 const res=await receiveReward(()=>claimAffinityGift(giftId,{gameState:state,onGrantReward:grantOwlReward}));
 if(res.ok){syncHudV20Buttons();draw();const spName=CREATURE[res.gift.species]?.label||res.gift.species;message(`💝 Đã nhận quà gắn kết Cấp ${res.gift.level} từ ${spName}: ${res.reward.label}!`);}
 return res;
}
const tourBanner=el('section',{id:'tourBanner',class:'tour-banner',hidden:true});
$('gameShell')?.append(tourBanner);
function syncTourBanner(){
 if(!activeTourSnapshot){tourBanner.hidden=true;return;}
 const t=activeTourSnapshot.tour,prog=loadTourProgress(),helped=prog.helpedIds.includes(t.id);
 const nextIdx=(HONOR_GARDENS.findIndex(g=>g.id===t.id)+1)%HONOR_GARDENS.length;
 const nextTour=HONOR_GARDENS[nextIdx];
 tourBanner.hidden=false;
 tourBanner.replaceChildren(
  el('div',{class:'tour-banner-copy'},[
   el('strong',{text:t.ownerName}),
   el('small',{text:`Cấp ${t.level}`}),
  ]),
  el('div',{class:'tour-banner-actions'},[
   button(helped?'Đã giúp':'Chăm giúp',()=>helpTour(t.id),{class:'primary',disabled:helped,'data-banner-help-tour':t.id}),
   button('Vườn tiếp',()=>startTour(nextTour.id),{'data-banner-next-tour':nextTour.id}),
   button('Về vườn',stopTour,{'data-banner-stop-tour':'true'}),
  ])
 );
}
const keeperTitleBtn=button('',()=>panels?.show('achievements'),{id:'keeperTitleButton',class:'hud-keeper-title',title:'Hồ sơ'});
$('levelButton')?.after(keeperTitleBtn);
function syncKeeperTitleBadge(){const t=currentKeeperTitle();keeperTitleBtn.textContent=t.badge;keeperTitleBtn.dataset.titleId=t.id;}
syncKeeperTitleBadge();
const eventBtn=$('eventButton'),sceneryBtn=$('sceneryButton');eventBtn.onclick=()=>panels?.show('events');sceneryBtn.onclick=()=>panels?.show('scenery');
// Only the explicit embedded host owns these shortcuts; standalone keeps them.
eventBtn.hidden=sceneryBtn.hidden=window.self!==window.top&&query.get('sceneControls')==='host';
document.body.classList.toggle('host-scene-controls',eventBtn.hidden);
function syncHudV20Buttons(){
 const hasClaim=hasClaimableEventMilestone();
 eventBtn.classList.toggle('has-claimable',hasClaim);
 eventBtn.title=hasClaim?'Lễ hội · Có quà':'Lễ hội';$('hudToggle').classList.toggle('has-news',hasClaim);
 eventBtn.dataset.event=eventMode;
 sceneryBtn.dataset.weather=weatherMode;
 sceneryBtn.title=weatherConfig(weatherMode).shortLabel+' · '+atmosphereConfig(atmosphereMode).shortLabel;
}

syncHudV20Buttons();
function save(){if(connected||!saveAvailable)return;try{gardenStorage.setItem(key,JSON.stringify(state));}catch{saveAvailable=false;saveProblem='Không lưu được. Hãy xuất bản lưu trong menu trước khi đóng trang.';message(saveProblem);}}
const errorMessages={OCCUPIED_SLOT:'Cần đủ 3 ô trống trên hàng này.',COOLDOWN:'Ô vừa nhổ còn khóa tới thời điểm cây cũ chín.',TYPE_CAP:'Mỗi thửa chỉ có tối đa 3 loại cây.',IMMATURE:'Cây còn đang lớn.',EMPTY_SLOT:'Trong phần chọn có ô trống.',NO_MATURE_CROPS:'Chưa có cây chín để gặt.',LOCKED_CROP:'Cây này chưa mở ở cấp hiện tại.',LOCKED_CREATURE:'Loài này chưa mở ở cấp hiện tại.',HOUSING_FULL:'Hãy xây hoặc nhận chuồng mới để có chỗ nuôi.',ALREADY_ADOPTED:'Loài này đã có trong vườn.',MEAL_IN_PROGRESS:'Hãy đợi bữa ăn xong và nhận kết quả trước.',NOT_ADOPTED:'Loài này chưa có trong vườn.',NOT_READY:'Chưa có kết quả hoàn tất để nhận.',LOCKED_RECIPE:'Công thức này chưa mở.',STATION_BUSY:'Cơ sở này đang bận. Nhận mẻ hoặc công trình cũ trước.',TIMED_BATCH_LIMIT:'Côn trùng và cá chỉ chạy một mẻ mỗi lần.',LOCKED_EXPANSION:'Chưa đủ cấp để mở công trình này.',ALREADY_BUILT:'Công trình đã được xây.',ALREADY_QUEUED:'Công trình này đang xây.',PREREQUISITE:'Cần hoàn thành công trình trước đó cùng loại.',ALREADY_OWNED:'Mẫu trang trí này đã có.',LOCKED_DECORATION:'Chưa mở mẫu trang trí này.',INVALID_BATCHES:'Số mẻ chưa hợp lệ.'};
function describeError(e){if(e.code==='MISSING_RESOURCE'){const id=Object.keys(labels).find(id=>e.message.includes(id));return 'Chưa đủ '+(labels[id]||'nguyên liệu')+'. Xem số lượng trong Kho và Chế biến.';}return errorMessages[e.code]||'Thao tác chưa thực hiện được: '+e.message;}
let combo=null;
function comboPlay(kind){combo=comboStep(combo,kind,performance.now());audio.play(kind,{pitch:combo.pitch});}
const juiceLayer=el('div',{id:'juiceLayer','aria-hidden':'true'});document.body.append(juiceLayer);
const juice=createJuice({layer:juiceLayer,items,reducedMotion:()=>document.body.classList.contains('motion-paused')});
function worldToClient([x,y]){const c=$('world'),r=c.getBoundingClientRect();return [r.left+x*r.width/c.width,r.top+y*r.height/c.height];}
function eventPoint(ev){const scene=renderer?.map||map;if(!ev)return null;let p=null;if(ev.plot!==undefined&&scene.plots[ev.plot]){const cells=ev.cells?.length?ev.cells:[4];p=iso(...plotCellPosition(scene.plots[ev.plot],cells[Math.floor(cells.length/2)]));}else if(ev.creatureIndex!==undefined&&scene.creatureSpots[ev.creatureIndex])p=iso(...scene.creatureSpots[ev.creatureIndex]);if(!p)return null;const [x,y]=worldToClient(p);return [x,y-40];}
// Rewards fly from where they happened: items to Kho, XP to the level badge.
function showRewards(before,after,events=[]){
 if(!before||!after)return;
 const source=eventPoint(events.find(e=>e.kind==='harvest'||e.kind==='claim'))||eventPoint(events[0]);
 const size=1+(combo&&performance.now()-combo.at<COMBO_SHOW_MS?combo.step:0)*0.08;
 rewardDeltas(before,after).slice(0,3).forEach((r,i)=>juice.chip({amount:r.amount,id:r.id,from:source,target:$('inventoryButton'),delay:i*120,size}));
 const xp=after.xp-before.xp;if(xp>0)juice.chip({amount:xp,label:'XP',from:source,target:$('levelButton'),delay:200,size});
}
const COMBO_SHOW_MS=600;
function playCommandSound(command,beforeState=state){const act=command?.action;if(act)playtest.track('action',{action:act});if(act==='plant'||act==='replant')comboPlay('plant');else if(act==='harvest')comboPlay('harvest');else if(act==='feed'||act==='claimAnimals')comboPlay('care');else if(act==='moveBuilding'||act==='placeDecoration')audio.play('rotate');else audio.play('care');if(act){recordFestivalAction(act);if(act==='adopt'||act==='feed'||act==='claimAnimals')recordCreatureAffinity(command.species||species,act,gardenStorage,beforeState);for(const [type,amount] of questAmounts(act,command,beforeState))wizard?.recordQuestAction?.(type,amount);syncHudV20Buttons();}}
// Quests count real work (garden-quests.mjs questAmounts): cells, harvests, batches, meals.
function questAmounts(act,command,before){return questAmountsFor(act,before,connected?wallet?.snapshot?.garden?.progression||state:state,command);}
async function run(action,text='Đã hoàn tất.',command=null){
 if(connected){if(!walletReady||busy)return;if(!command){message('Thao tác này chỉ dành cho phiên thử trên thiết bị.');return;}busy=true;try{const before=state;await wallet.act(command);playCommandSound(command,before);acceptWallet(before,tutorial?'':text);}catch(e){if(e.definitive){try{await wallet.read();acceptWallet(state,'',false);}catch{}}showRefusal(e);}finally{busy=false;workTrays?.refresh(mode);wizard?.refresh?.();}return;}
 if(busy)return;busy=true;
 const actionKey=key;
 const perform=()=>{if(actionKey!==key)return;try{if(saveAvailable){const raw=gardenStorage.getItem(key);if(raw!==null)state=E.restoreChecked(raw,Date.now());}
 const before=state,after=action(state);if(!after||after.revision===before.revision){playtest.track('action_blocked');message('Không có mục nào đủ điều kiện. Các mục đang bận hoặc thiếu nguyên liệu được giữ nguyên.');return;}
 state=after;playCommandSound(command,before);const juiceEvents=renderer?.react?.(before,after)||[];save();refresh();showRewards(before,after,juiceEvents);if(state.level>before.level)celebrate(before.level,state.level);if(after.creatures.length>before.creatures.length)camera.focusCreature(after.creatures.length-1);panels?.refresh();const xp=state.xp-before.xp;if(!tutorial)message(text+(xp>0?' +'+num(xp)+' XP.':''));}
 catch(e){playtest.track('action_error',{code:e?.code||'ERR'});message(describeError(e));}};
 try{if(navigator.locks?.request)await navigator.locks.request('lock-'+actionKey,perform);else perform();}finally{busy=false;workTrays?.refresh(mode);wizard?.refresh?.();}
}
function switchSession(next,level){if(connected)return;session=next;key=prefix+'-'+session;selectStorage();if(next==='lab'&&level!==undefined){state=E.testProfile(level,Date.now());saveAvailable=true;saveProblem='';checkSaveSupport();save();}else{loadSession();checkSaveSupport();}const url=new URL(location.href);if(next==='lab')url.searchParams.set('lab','1');else url.searchParams.delete('lab');history.replaceState(null,'',url);location.reload();}
function exportSave(){const blob=new Blob([JSON.stringify(connected?{kind:'garden-emulator-recovery',capturedAt:new Date().toISOString(),snapshot:wallet.snapshot}:state,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=el('a',{href:url,download:'hagrid-v05-'+session+'-level-'+state.level+'.json'});a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function selectCrop(id){seed=id;setMode('plant');$('seedTray').querySelector('[aria-pressed=true]')?.scrollIntoView({block:'nearest',inline:'nearest'});}
function selectCreature(id){species=id;setMode('creature');const i=state.creatures.findIndex(e=>e.species===id);if(i>=0)camera.focusCreature(i);$('creatureTray').querySelector('[aria-pressed=true]')?.scrollIntoView({block:'nearest',inline:'nearest'});}
function focusPlot(index){selectedPlot=index;setMode('plant');camera.focusPlot(index);}
function setMode(next){
 mode=next;
 for(const [id,value] of Object.entries({plantDock:'plant',creatureDock:'creature',craftDock:'craft',buildDock:'build'}))$(id).hidden=next!==value;
 for(const [id,value] of Object.entries({sowTool:'plant',creatureTool:'creature',craftTool:'craft',buildTool:'build'}))$(id).setAttribute('aria-pressed',next===value);
 document.body.classList.remove('dock-collapsed');$('dockToggle').setAttribute('aria-expanded','true');$('dockToggle').setAttribute('aria-label','Thu gọn khay thao tác');refresh();
 const trayId={plant:'seedTray',creature:'creatureTray',craft:'craftTray',build:'buildTray'}[next];$(trayId)?.querySelector('[aria-pressed=true]')?.scrollIntoView({block:'nearest',inline:'nearest'});
}
function makeTray(container,collection,select){for(const c of collection){const b=button('',()=>select(c.id),{'data-id':c.id,'aria-label':c.label});b.title=c.label;b.append(icon(items,c.id,3,40),el('span',{class:'lock',text:'Cấp '+c.level}),el('span',{class:'owned',text:'✓',hidden:true}));if(container.id==='seedTray')b.append(el('span',{class:'seed-count',hidden:!connected,'aria-hidden':'true'}),el('span',{class:'chip-time','aria-hidden':'true'},[pixelIcon('clock',1),shortHours(c.hours)]));container.append(b);}}
makeTray($('seedTray'),DB.crops,selectCrop);makeTray($('creatureTray'),DB.animals,selectCreature);

function makeLines(){$('lineButtons').replaceChildren();for(let i=0;i<(direction==='diagonal'?2:3);i++)$('lineButtons').append(button(direction==='diagonal'?(i?'↙':'↘'):String(i+1),()=>{line=i;refresh();},{'aria-label':(direction==='diagonal'?'Đường chéo ':'Hàng ')+(i+1)}));}
for(const b of $('directionButtons').children)b.onclick=()=>{direction=b.dataset.direction;line=Math.min(line,direction==='diagonal'?1:2);makeLines();refresh();};makeLines();
// First three minutes (garden-tutorial.mjs). Only a brand-new garden plays it (with a wallet:
// the server's revision 0); local progress is saved per step and never repeats. A replay
// (Hồ sơ) walks the same lines on a timer, saves nothing and runs no game action.
let tutorial=null,guestFed=false,tutorialTimer=0,replay=false,tutorialChecked=false;
const tutorialSkip=button('Bỏ qua',()=>{if(!replay)playtest.track('tutorial_skip',{step:tutorial});finishTutorial(true);},{class:'tutorial-skip',hidden:true,'aria-label':'Bỏ qua hướng dẫn'});
(document.querySelector('.camera-tools')||$('gameShell'))?.append(tutorialSkip);
// Runs once the scene is drawn and, with a wallet, once the server's garden has arrived.
function setupTutorial(){
 if(tutorialChecked||session==='lab'||!loaded||(connected&&!walletReady))return false;
 tutorialChecked=true;
 const step=tutorialStart(state,{saved:qa&&query.get('tutorial')==='1'?null:loadTutorial(gardenStorage),connected});
 if(step==='done'){saveTutorial(gardenStorage,'done');return false;}
 enterTutorial(step);return true;
}
function letterName(){return connected?wallet?.snapshot?.profile?.username:$('playerName')?.textContent;}
function openHagridLetter(mode='keepsake'){panels?.close();return showHagridLetter({greeting:letterGreeting(letterName()),mode,onDone:mode==='welcome'?()=>{if(tutorial==='letter')enterTutorial('intro');}:null});}
function replayTutorial(){if(tutorial&&!replay)return;finishTutorial(true);replay=true;enterTutorial('letter');}
function tutorialFacts(){const slots=state.plots[TUTORIAL_PLOT]?.slots||[],now=logical(),planted=slots.some(Boolean);return {planted,mature:slots.some(e=>e&&E.growth(e,now).mature),harvested:!planted&&(state.inventory?.pumpkin||0)>0};}
// Glow the first of the given buttons that is actually on screen (the crop card swaps Gieo for Gặt).
function pulse(...ids){document.querySelectorAll('.tutorial-pulse').forEach(n=>n.classList.remove('tutorial-pulse'));const n=ids.map(id=>$(id)).find(b=>b&&b.getClientRects().length&&!b.closest('[hidden]'));n?.classList.add('tutorial-pulse');}
function enterTutorial(step){
 clearTimeout(tutorialTimer);tutorial=replay?step:saveTutorial(gardenStorage,step);document.body.dataset.tutorial=step;if(!replay)playtest.track('tutorial_step',{step});tutorialSkip.hidden=false;pulse(null);
 // Short landscape screens: the preselected pumpkin needs no seed row, and the feed step needs the scene itself.
 const short=matchMedia('(max-height:450px) and (orientation:landscape)').matches;document.body.classList.toggle('tutorial-compact',short);
 if(step==='letter')openHagridLetter('welcome');
 else if(step==='intro'){camera?.overview();camera?.glide?.(frameHagridAndPlot,1600);renderer?.greet?.();tutorialTimer=setTimeout(()=>enterTutorial('plant'),replay?REPLAY_STEP_MS:2600);}
 else if(step==='plant'){selectedPlot=TUTORIAL_PLOT;seed='pumpkin';line=0;setMode('plant');requestAnimationFrame(()=>{pulse('plantButton','contextAction');if(short)camera?.glide?.(frameHagridAndPlot,500);});}
 else if(step==='grow'){if(replay)waterTutorialPlot();else tutorialTimer=setTimeout(rushTutorialCrops,900);}
 else if(step==='harvest'){selectedPlot=TUTORIAL_PLOT;line=0;setMode('plant');requestAnimationFrame(()=>{pulse('contextAction','plantButton');if(short)camera?.glide?.(frameHagridAndPlot,500);});}
 else if(step==='feed'){guestFed=false;if(short&&!document.body.classList.contains('dock-collapsed'))$('dockToggle')?.onclick?.();camera?.glide?.(()=>{const [x,y]=iso(TUTORIAL_GUEST.col,TUTORIAL_GUEST.row);frameHagridWith([[x-40,y-60],[x+40,y+20]]);},1100);}
 else if(step==='owl'){tutorialTimer=setTimeout(()=>{wizard?.openLetter?.('owl');finishTutorial();},1500);}
 // A replay moves on by itself; the real tutorial waits for the player's own plant, harvest and feed.
 const next=replay&&step!=='intro'&&REPLAY_STEPS[REPLAY_STEPS.indexOf(step)+1];
 if(next)tutorialTimer=setTimeout(()=>enterTutorial(next),REPLAY_STEP_MS);
 draw();
}
// Keep Hagrid, his speech bubble and the first plot in view on any screen size.
function frameHagridAndPlot(){const scene=renderer?.map||map;frameHagridWith(plotCorners(scene.plots[TUTORIAL_PLOT],scene));}
function frameHagridWith(pts){const [hx,hy]=iso(-2,8),xs=[hx-60,hx+60,...pts.map(q=>q[0])],ys=[hy-130,...pts.map(q=>q[1]),hy+12];camera.frameWorld({left:Math.min(...xs),right:Math.max(...xs),top:Math.min(...ys),bottom:Math.max(...ys)+20});}
// Hagrid's tutorial line lives in screen space (fixed 13 px text) and follows his head.
const tutorialBubble=el('div',{class:'tutorial-bubble',role:'status','aria-live':'polite',hidden:true});document.body.append(tutorialBubble);
// Panels stay open to the player mid-tutorial; Hagrid's line and the skip chip step aside
// while one covers the garden (they sit above the popover layer) and come back when it closes.
const tutorialCovered=()=>!$('panel')?.hidden||Boolean(document.querySelector('.store-overlay,.level-celebration:not([hidden]),dialog[open]'));
function placeTutorialBubble(){const covered=Boolean(tutorial)&&tutorialCovered();document.body.classList.toggle('tutorial-covered',covered);const line=tutorial&&!activeTourSnapshot&&!covered?TUTORIAL_LINES[tutorial]:null;if(!line){tutorialBubble.hidden=true;return;}if(tutorialBubble.textContent!==line)tutorialBubble.textContent=line;tutorialBubble.hidden=false;const [x,y]=worldToClient(iso(-2,8)),c=$('world'),k=c.getBoundingClientRect().width/c.width,b=tutorialBubble.getBoundingClientRect(),hud=Math.max(0,...[...document.querySelectorAll('.hud button')].map(e=>e.getBoundingClientRect().bottom));const left=Math.min(Math.max(8,x-22),innerWidth-b.width-8),top=Math.max(hud+6,y-118*k-b.height);tutorialBubble.style.transform=`translate(${Math.round(left)}px,${Math.round(top)}px)`;tutorialBubble.style.setProperty('--tail',Math.round(Math.min(Math.max(10,x-left-4),b.width-16))+'px');}
function checkTutorial(){if(!tutorial||replay||tutorial==='letter')return;const next=advanceTutorial(tutorial,tutorialFacts());if(next!==tutorial)enterTutorial(next);}
function waterTutorialPlot(){const filled=state.plots[TUTORIAL_PLOT].slots.map((e,i)=>e?i:-1).filter(i=>i>=0),cells=filled.length?filled:[0,1,2];renderer?.animate?.('water',{plot:TUTORIAL_PLOT,cells});audio.play('care');return filled;}
// Hagrid's one-time "nước phép", exactly as long as the crops still need: local play skips the
// engine clock; with a wallet the server owns time, so it grows them once per account (tutorialGrow).
function rushTutorialCrops(){if(tutorial!=='grow'||replay)return;const now=logical(),slots=state.plots[TUTORIAL_PLOT].slots.filter(Boolean),left=Math.max(0,...slots.map(e=>e.plantedAt+e.growMs-now));const cells=waterTutorialPlot();if(left<=0)checkTutorial();else if(connected)run(null,'Nước phép!',{action:'tutorialGrow',plotIndex:TUTORIAL_PLOT,cells});else run(s=>E.advanceTime(s,Math.ceil(left)),'Nước phép!');}
function feedTutorialGuest(){if(tutorial!=='feed'||guestFed)return;guestFed=true;clearTimeout(tutorialTimer);comboPlay('care');renderer?.animate?.('eat',{species:TUTORIAL_GUEST.species});tutorialTimer=setTimeout(()=>enterTutorial('owl'),1900);draw();}
function finishTutorial(skipped=false){if(!skipped&&!replay)playtest.track('tutorial_step',{step:'done'});clearTimeout(tutorialTimer);document.body.classList.remove('tutorial-compact');document.body.dataset.tutorial='done';tutorial=null;guestFed=false;if(!replay)saveTutorial(gardenStorage,'done');replay=false;tutorialSkip.hidden=true;pulse(null);draw();}
function tutorialRenderOptions(){if(!tutorial)return {};return {speechScale:1.6,muteHagridSpeech:true,tutorialFocus:tutorial==='plant'?{plot:TUTORIAL_PLOT,mode:'plant'}:tutorial==='harvest'?{plot:TUTORIAL_PLOT,mode:'harvest'}:null,guestActor:tutorial==='feed'||tutorial==='owl'?{...TUTORIAL_GUEST,hungry:tutorial==='feed'&&!guestFed}:null};}
function refresh(){
 syncQuestContext();
 if(tutorial)queueMicrotask(checkTutorial);
 selectedPlot=Math.min(selectedPlot,state.plots.length-1);const now=logical(),slots=state.plots[selectedPlot].slots,c=CROP[seed],cr=CREATURE[species],n=slots.filter(Boolean).length,types=new Set(slots.filter(Boolean).map(e=>e.species)),info=E.levelInfo(state),animal=owned(species);
 $('shopButton').disabled=connected&&!walletReady;
 $('levelValue').textContent=state.level;$('xpText').textContent=state.level===100?'Đã đạt cấp 100':num(info.xpInLevel)+' / '+num(info.xpToNext)+' XP';$('levelButton').style.setProperty('--xp',(state.level===100?100:Math.min(100,info.xpInLevel/info.xpToNext*100)).toFixed(1));$('levelButton').setAttribute('aria-label','Hồ sơ · Cấp '+state.level+' · '+$('xpText').textContent);
 syncSupplies();syncGoal();
 $('levelButton').dataset.level=state.level;$('levelButton').dataset.xp=state.xp;$('levelButton').title=connected?(walletReady?WALLET_TEXT.title:'Đang nối emulator'):(session==='lab'?'Phiên thử · ':'')+(saveAvailable?'Đã lưu trên thiết bị':'Chưa lưu được');
 $('plotLabel').textContent=(selectedPlot+1)+'/'+state.plots.length;$('plotCount').textContent=n+'/9';$('plotsButton').setAttribute('aria-label','Thửa '+(selectedPlot+1)+' / '+state.plots.length+' · '+n+'/9 ô');
 for(const b of $('seedTray').children){const locked=CROP[b.dataset.id].level>state.level;b.hidden=locked;b.classList.toggle('locked',locked);b.querySelector('.lock').hidden=!locked;b.setAttribute('aria-pressed',b.dataset.id===seed);const count=wallet?.snapshot?.garden.supplies.seeds[b.dataset.id]||0;b.querySelector('.seed-count').textContent=count;b.setAttribute('aria-label',CROP[b.dataset.id].label+(connected?' · '+count+' hạt':''));}
 for(const b of $('creatureTray').children){const locked=CREATURE[b.dataset.id].level>state.level;b.hidden=locked;b.classList.toggle('locked',locked);b.querySelector('.lock').hidden=!locked;b.querySelector('.owned').hidden=!owned(b.dataset.id);b.setAttribute('aria-pressed',b.dataset.id===species);}
 [...$('directionButtons').children].forEach(b=>b.setAttribute('aria-pressed',b.dataset.direction===direction));[...$('lineButtons').children].forEach((b,i)=>b.setAttribute('aria-pressed',i===line));
 const lineUrl=lineIconUrl(chosen());if($('directionSummary').getAttribute('src')!==lineUrl){$('directionSummary').src=lineUrl;$('contextLine').src=lineUrl;}
 $('seedOptionsButton').title=({horizontal:'Ngang',vertical:'Dọc',diagonal:'Chéo'})[direction]+' · Hàng '+(line+1);$('seedOptionsButton').setAttribute('aria-label','Tùy chọn gieo · '+$('seedOptionsButton').title);
 $('plantDock').classList.toggle('single-choice',DB.crops.filter(crop=>crop.level<=state.level).length===1);
 $('seedName').textContent=c.label;
 if(connected)stats($('seedTime'),[['seed',wallet.snapshot?.garden.supplies.seeds[seed]||0,'Hạt '+c.label],['water',wallet.snapshot?.garden.supplies.water||0,'Nước']]);
 else if(c.level>state.level)$('seedTime').textContent='Mở cấp '+c.level;
 else stats($('seedTime'),[['clock',shortHours(c.hours),'Chín sau '+hours(c.hours)],['xp',c.totalXP,c.totalXP+' XP mỗi ô']]);
 const occupied=chosen().some(i=>slots[i]),cooling=chosen().some(i=>state.plots[selectedPlot].cooldowns[i]>now);
 const typeCap=types.size>=3&&!types.has(seed),seedsLeft=wallet?.snapshot?.garden.supplies.seeds[seed]||0,waterLeft=wallet?.snapshot?.garden.supplies.water||0;
 const plantAction=plantingAction({loaded,connected,walletReady,unlocked:c.level<=state.level,occupied,cooling,typeCap,seedsLeft,waterLeft});
 $('plantButton').dataset.restock=plantAction.restock;$('plantButton').disabled=plantAction.disabled;
 setAction($('plantButton'),{icon:plantAction.restock||'sow',label:plantAction.disabled?plantAction.text:plantAction.restock?'Mua':'Gieo',count:plantAction.disabled||plantAction.restock?'':'×3',text:plantAction.title});
 $('cropCareButton').disabled=!loaded||!chosen().some(i=>slots[i]);
 $('replantButton').disabled=!loaded||!state.plots[selectedPlot].patterns.length;
 const allReady=state.plots.reduce((sum,p)=>sum+p.slots.filter(e=>e&&E.growth(e,now).mature).length,0);$('readyCount').textContent=allReady;$('readyCount').hidden=!allReady;$('harvestTool').disabled=!loaded||!allReady;
 const remaining=slots.filter(Boolean).filter(e=>!E.growth(e,now).mature).map(e=>e.plantedAt+e.growMs-now);
 $('selectionHint').textContent=(session==='lab'?'THỬ · ':'')+(mode==='creature'?'':'Thửa '+(selectedPlot+1)+' · '+n+'/9 ô · '+types.size+'/3 loại'+(remaining.length?' · chín sau '+duration(Math.min(...remaining)):cooling?' · Đất vừa nhổ đang chờ':n?' · Có cây chín':' · Chọn hàng rồi gieo'));
 if(connected&&mode==='plant')$('selectionHint').textContent='Hạt '+(wallet.snapshot?.garden.supplies.seeds[seed]||0)+' · Nước '+(wallet.snapshot?.garden.supplies.water||0)+' · '+$('selectionHint').textContent;
 $('selectionDetail').textContent=$('selectionHint').textContent;
 $('selectionHint').textContent=mode==='plant'&&cooling?'Đất đang hồi phục':'';
 const crFacing=currentCreatureFacings()[species]==='right'?'↗ Nhìn phải':'↖ Góc chuẩn';
 $('creatureName').textContent=cr.label;if(cr.level>state.level)$('creatureTime').textContent='Mở cấp '+cr.level;else stats($('creatureTime'),[['clock',shortHours(cr.hours),'Mỗi bữa '+hours(cr.hours)],['feed',cr.mealPortions,cr.mealPortions+' phần ăn mỗi bữa']]);
 $('housing').textContent=state.creatures.length+'/'+E.housingCapacity(state)+' chỗ · '+(state.inventory[cr.feed]||0)+' phần '+cr.label;
 $('petButton').hidden=!animal;
 if($('rotateCreatureButton'))$('rotateCreatureButton').hidden=!animal;
 $('adoptButton').hidden=!!animal;$('feedButton').hidden=!animal||Boolean(animal.meal);$('claimAnimalButton').hidden=!animal?.meal;
 $('adoptButton').disabled=!loaded||cr.level>state.level||state.creatures.length>=E.housingCapacity(state)||(species!=='puffskein'&&state.inventory[cr.feed]<cr.mealPortions*3);
 setAction($('adoptButton'),{icon:'pen',label:cr.level>state.level?'Cấp '+cr.level:'Đón về',text:cr.level>state.level?'Mở ở cấp '+cr.level:'Đón '+cr.label+' về vườn'});setAction($('feedButton'),{icon:'feed',label:'Cho ăn',count:'×'+cr.mealPortions,text:'Cho '+cr.label+' ăn '+cr.mealPortions+' phần'});setAction($('claimAnimalButton'),{icon:'chest',label:'Nhận',text:'Nhận quà của '+cr.label});
 $('feedButton').disabled=!animal||!!animal.meal||state.inventory[cr.feed]<cr.mealPortions;
 $('claimAnimalButton').disabled=!animal?.meal||animal.meal.readyAt>now;
 if(animal){const adult=animal.mealsCompleted>=cr.mealsToAdult;$('creatureStatus').textContent=(adult?'Trưởng thành':animal.mealsCompleted+'/'+cr.mealsToAdult+' bữa')+' · '+(animal.meal?(animal.meal.readyAt<=now?'Có quà':'◷ '+duration(animal.meal.readyAt-now)):'Đói');}
 else $('creatureStatus').textContent=cr.level>state.level?'Cần cấp '+cr.level+' để nhận nuôi':species==='puffskein'?'Miễn phí · tặng 3 phần ăn':'Chuẩn bị '+cr.mealPortions*3+' phần ăn để đón về';
 $('creatureTool').hidden=state.level<DB.animals[0].level;
 const inventoryCount=khoCount();$('harvestCount').textContent=inventoryCount>=1000?Math.floor(inventoryCount/1000)+'k':num(inventoryCount);$('inventoryButton').setAttribute('aria-label','Mở kho · '+num(inventoryCount)+' vật phẩm');$('harvestCount').hidden=inventoryCount===0;
 const readyBuilds=state.construction.filter(j=>j.readyAt<=now).length;$('buildReady').hidden=!readyBuilds;$('buildReady').textContent=readyBuilds;
 if(connected&&$('boostButton')){$('boostButton').hidden=state.level<6;$('boostButton').disabled=!walletReady||busy||(wallet.snapshot?.garden.supplies.boost||0)<1||chosen().some(i=>!slots[i]||E.growth(slots[i],now).mature||(wallet.snapshot?.garden.boostedCropIds||[]).includes(slots[i].id));}
 syncKeeperTitleBadge();
 syncHudV20Buttons();
 $('world').dataset.summary=JSON.stringify({level:state.level,xp:state.xp,plots:state.plots.length,creatures:state.creatures.length,readyCrops:allReady,beds:E.housingCapacity(state),session,revision:state.revision,atmosphere:atmosphereMode,weather:weatherMode,event:eventMode,keeperTitle:currentKeeperTitle().badge,totalAffinity:currentAffinitySummary().totalAffinityLevels,tourId:activeTourSnapshot?.tour?.id||null});
 workTrays?.refresh(mode);wizard?.refresh();dockControls?.refresh();tickTimers();draw();
}
// Small icon + number facts (growth time, XP, portions); the sentence stays in title/aria.
function stats(node,list){node.replaceChildren(...list.map(([name,value,label])=>el('span',{class:'stat',title:label,'aria-label':label},[pixelIcon(name,1),String(value)])));}
function shortHours(h){return h===0?'0':h>=24?(h/24)+'n':h+'g';}
// Four player resources (docs/economy-audit.md §5): Galleons, Nước (+ nước phép), Kho, XP.
// Kho holds seeds, crops, rations and creature products; its count rides on the Kho button.
function khoCount(){const seeds=connected?Object.values(currentSupplies().seeds||{}).reduce((a,b)=>a+(Number(b)||0),0):0;return seeds+Object.values(state.inventory).reduce((a,b)=>a+b,0);}
// Local play (no wallet): water and seeds are free, so show ∞ instead of a misleading 0.
function syncSupplies(){const sup=currentSupplies(),water=connected?num(sup.water||0):'∞',magic=sup.boost||0;$('waterValue').textContent=water;$('magicValue').textContent=num(magic);$('magicCounter').hidden=!connected||state.level<6;$('suppliesButton').classList.toggle('res-free',!connected);$('suppliesButton').setAttribute('aria-label',(connected&&!$('galleonCounter').hidden?$('walletValue').textContent+' Galleons · ':'')+(connected?water+' nước · '+num(magic)+' nước phép':'Nước và hạt miễn phí')+' · mở cửa hàng');}
// Always-visible next goal (next-goal.mjs): [what is missing] → [what it opens].
let goal=null,goalKey='';
function goalIcon(id,scale=2){return id==='xp'?pixelIcon(id,scale):items.has(id)?icon(items,id,3,16*scale):pixelIcon(DB.crops.some(c=>c.id===id)?'seed':'feed',scale);}
function syncGoal(){
 goal=activeTourSnapshot?null:nextGoal(E,state);const chip=$('nextGoal');chip.hidden=!goal;if(!goal)return;
 const key=JSON.stringify(goal);if(key===goalKey)return;goalKey=key;
 const t=goal.target,targetIcon=t.kind==='pen'?pixelIcon('pen'):t.kind==='plot'?pixelIcon('plot'):t.kind==='level'?pixelIcon('xp'):icon(items,t.id,3,32);
 const needText=goal.need?num(goal.need.n)+' '+(goal.need.id==='xp'?'XP':labels[goal.need.id]||goal.need.id):'Sẵn sàng';
 chip.replaceChildren(...(goal.need?[goalIcon(goal.need.id),el('b',{class:'goal-count',text:num(goal.need.n)})]:[]),pixelIcon('arrow',1),targetIcon,el('span',{class:'goal-label',text:goal.label}));
 chip.classList.toggle('goal-ready',!goal.need);chip.setAttribute('aria-label','Mục tiêu gần: '+goal.label+' · cần '+needText);chip.title=goal.label+' · cần '+needText;
}
// A tap goes to the place that moves the goal: the plot, the cauldron, the build tray or the pen.
function followGoal(){
 if(!goal)return;playtest.track('goal',{route:goal.route});const id=goal.need?.id;
 if(goal.route==='craft'){setMode('craft');return;}
 if(goal.route==='build'){setMode('build');return;}
 if(goal.route==='creature'){selectCreature(goal.target.id);return;}
 if(id&&CROP[id]&&CROP[id].level<=state.level)seed=id;
 const ready=state.plots.findIndex(p=>p.slots.some(e=>e&&E.growth(e,logical()).mature)),free=state.plots.findIndex(p=>p.slots.some(e=>!e));
 focusPlot(ready>=0?ready:free>=0?free:selectedPlot);
}
function tickTimers(){const now=logical();document.querySelectorAll('[data-until]').forEach(e=>{const remaining=Number(e.dataset.until)-now;e.textContent=remaining<=0?'Sẵn sàng nhận':(e.dataset.prefix||'')+duration(remaining);e.classList.toggle('ready-text',remaining<=0);});document.querySelectorAll('[data-ready-button]').forEach(e=>e.disabled=Number(e.dataset.readyButton)>now);}
function draw(clock=performance.now()){const renderState=activeTourSnapshot?activeTourSnapshot.state:state;const renderAtmo=activeTourSnapshot?activeTourSnapshot.atmosphereMode:atmosphereMode;const renderWeather=activeTourSnapshot?activeTourSnapshot.weatherMode:weatherMode;const renderEarnedRot=activeTourSnapshot?activeTourSnapshot.decorationRotations:{...(state?.decorationRotations||{}),...earnedDecorRotations};renderer?.render(renderState,{selectedPlot,line:activeTourSnapshot?[]:mode==='plant'?chosen():[],now:Date.now(),clock:(!motionEnabled||motionMedia.matches)?0:clock,animationClock:clock,propsVisible,grid,decorations:currentDecorations(),decorationRotations:renderEarnedRot,creatureFacings:currentCreatureFacings(),creatureAffinities:currentCreatureAffinities(),previewDecoration,previewLayout,atmosphereMode:renderAtmo,weatherMode:renderWeather,eventMode,...(activeTourSnapshot?{}:tutorialRenderOptions())});placeTutorialBubble();const stage=renderer?.growthStage?.();if(stage&&(!connected||walletReady)&&stage.id!==lastGardenStage){const previous=lastGardenStage;lastGardenStage=stage.id;$('gardenStageName').textContent=stage.name;$('plotsButton').title='Giai đoạn '+stage.id+'/6 · '+stage.name;if(!activeTourSnapshot&&previous&&stage.id>previous){camera?.overview();message('Khu vườn đã mở rộng · '+stage.name+'.');}}}
camera=setupCamera({viewport:$('cameraViewport'),canvas:$('world'),map,iso,plotCorners,getRenderer:()=>renderer,getSelectedPlot:()=>selectedPlot,notify:message,onPick:cell=>{playtest.track('tap',{kind:cell.kind||'plot'});if(activeTourSnapshot){if(cell.kind==='creature'){audio.play('care');renderer?.animate('care',{species:cell.species});message(`🐾 Đang ghé thăm ${CREATURE[cell.species]?.label||cell.species} tại vườn của ${activeTourSnapshot.tour.ownerName}.`);return;}if(cell.kind==='keepsake'){audio.play('levelUp');message(`🏆 Đài kỷ vật ${CREATURE[cell.species]?.label||cell.species} (×${cell.count}) của ${activeTourSnapshot.tour.ownerName}.`);return;}message(`🧭 Đang tham quan ${activeTourSnapshot.tour.title} · Nhấn "Chăm giúp" trên thanh điều hướng để nhận quà!`);return;}if(cell.kind==='decoration'){const item=decorAssets.get(cell.itemId)||wallet?.snapshot?.catalog.find(i=>i.id===cell.itemId);if(item)openDecoration(item);return;}if(cell.kind==='earned-decoration'){rotateEarnedDecoration(cell.itemId);return;}if(cell.kind==='keepsake'){audio.play('levelUp');message(`🏆 Đài kỷ vật ${CREATURE[cell.species]?.label||cell.species} (×${cell.count}) · Minh chứng vinh danh người giữ vườn.`);return;}if(cell.kind==='wizard'){audio.play('owl');wizard?.visit(cell.id);return;}if(cell.kind==='creature'&&cell.guest){feedTutorialGuest();return;}if(cell.kind==='creature'){selectCreature(cell.species);handlePetCreature(cell.species);return;}selectedPlot=cell.plot;setMode('plant');if(direction==='horizontal')line=Math.floor(cell.index/3);else if(direction==='vertical')line=cell.index%3;else if([0,8].includes(cell.index))line=0;else if([2,6].includes(cell.index))line=1;else if(cell.index!==4)message('Ô này không nằm trên đường chéo.');refresh();}});
function openVisualLayout(){
 panels?.close();
 showVisualLayoutModal({
  getState:()=>state,
  getStage:()=>renderer?.growthStage?.(),
  layoutSlots,
  E,
  camera,
  iso,
  preview:val=>{previewLayout=val;draw();},
  onMove:async(kind,index,targetSlot)=>{
   const name=(kind==='plot'?'Thửa ':'Chuồng ')+(index+1);
   await run(x=>E.moveBuilding(x,kind,index,targetSlot),`Đã chuyển ${name} sang Nền ${targetSlot+1}.`,{action:'moveBuilding',kind,index,targetSlot});
  },
  onClose:()=>draw(),
 });
}
panels=createPanels({E,items,labels,layoutSlots,decorAssets,getDecorations:currentDecorations,openDecorate:openDecoration,quickRotateDecor:async(itemId,slot,facing)=>{localDecorRotations[itemId]=facing;persistPrefs();audio.play('rotate');recordFestivalAction('rotate');wizard?.recordQuestAction?.('rotate');if(wallet){try{const before=state;await wallet.act({action:'placeDecoration',itemId,slot,facing});acceptWallet(before,'',false);}catch(e){showRefusal(e);return;}}syncHudV20Buttons();draw();message(`Đã xoay sang ${facing==='right'?'Góc nhìn qua phải ↗':'Góc hiện tại ↖'}.`);},getEarnedDecorRotations:()=>({...state?.decorationRotations,...earnedDecorRotations}),rotateEarnedDecoration,getCreatureFacings:currentCreatureFacings,rotateCreatureFacing,getAffinityMap:()=>currentAffinitySummary().bySpeciesMap,openVisualLayout,getPostcard:postcardOptions,getAtmosphere:()=>atmosphereConfig(atmosphereMode),cycleAtmosphere,onSetAtmosphere:setAtmosphere,getWeather:()=>weatherConfig(weatherMode),cycleWeather,onSetWeather:setWeather,getEvent:()=>eventConfig(eventMode),onApplyEventTheme:applyEventTheme,onClaimEventMilestone:handleClaimEventMilestone,onClaimDailyQuest:handleClaimDailyQuest,onClaimGrandChest:handleClaimGrandChest,onPetCreature:handlePetCreature,onClaimAffinityGift:handleClaimAffinityGift,getActiveTourId:()=>activeTourSnapshot?.tour?.id||null,startTour,stopTour,helpTour,getAchievementExtra,onSelectTitle:handleSelectTitle,onClaimAchievement:handleClaimAchievement,getSoundEnabled:()=>audio.enabled,toggleAudio,shareToFloo,getState:()=>state,getGardenStage:()=>renderer?.growthStage?.(),run,notify:message,selectCrop,selectCreature,focusPlot,camera,getSelection:()=>({selectedPlot,cells:chosen(),seed,species}),getSession:()=>({session,qa,saveAvailable,saveProblem,connected,isPreview:!!wallet?.isPreview}),getSupplies:currentSupplies,getGalleons,openStore:f=>openStore(f),openProfile:connected?null:()=>{panels.close();profileUI.show();},openHagridLetter:()=>openHagridLetter('keepsake'),replayTutorial,switchSession,exportSave,getViewPreferences:()=>({motionEnabled,systemReducedMotion:motionMedia.matches,propsVisible,grid}),toggleMotion:()=>{if(motionMedia.matches)return false;motionEnabled=!motionEnabled;persistPrefs();syncMotionPreference();draw();return motionEnabled;},toggleProps:()=>{propsVisible=!propsVisible;persistPrefs();draw();return propsVisible;},toggleGrid:()=>{grid=!grid;persistPrefs();draw();return grid;},tickTimers,exportPlaytest:playtest.enabled?exportPlaytest:null});
{const showPanel=panels.show;panels.show=(name,...rest)=>{playtest.track('panel',{name:String(name)});return showPanel(name,...rest);};}
$('sowTool').onclick=()=>setMode('plant');$('creatureTool').onclick=()=>{setMode('creature');if(state.creatures.length)camera.focusCreature(Math.max(0,state.creatures.findIndex(e=>e.species===species)));};
$('plantButton').onclick=()=>{if($('plantButton').dataset.restock)return openStore($('plantButton').dataset.restock);return run(s=>E.plant(s,selectedPlot,chosen(),seed,Date.now()),'Đã gieo 3 hạt '+CROP[seed].label+'.',{action:'plant',plotIndex:selectedPlot,cells:chosen(),species:seed});};
$('replantButton').onclick=()=>{$('seedOptions').close();return run(s=>E.replant(s,selectedPlot,Date.now()),'Đã gieo lại các hàng đủ điều kiện.',{action:'replant',plotIndex:selectedPlot});};
$('harvestTool').onclick=()=>run(s=>E.harvest(s,null,null,Date.now()),'Đã gặt tất cả cây chín.',{action:'harvest'});
$('adoptButton').onclick=()=>run(s=>E.adopt(s,species,Date.now()),CREATURE[species].label+' đã về vườn. Hãy cho ăn để bắt đầu lớn.',{action:'adopt',species});
$('feedButton').onclick=()=>run(s=>E.feed(s,species,Date.now()),'Đã cho '+CREATURE[species].label+' ăn.',{action:'feed',species});
$('claimAnimalButton').onclick=()=>run(s=>E.claimAnimals(s,species,Date.now()),'Đã nhận kết quả chăm sóc '+CREATURE[species].label+'.',{action:'claimAnimals',species});
for(const [id,name]of Object.entries({levelButton:'profile',plotsButton:'plots',inventoryButton:'inventory',menuButton:'menu'}))$(id).onclick=()=>panels.show(name);
window.addEventListener('storage',e=>{if(connected)return;if(e.key!==gardenStorage.storageKey||!e.newValue||busy)return;try{const raw=gardenStorage.getItem(key);if(!raw)return;state=E.restoreChecked(raw,Date.now());refresh();panels.refresh();message('Đã cập nhật tiến độ từ tab còn lại.');}catch{message('Bản lưu ở tab khác không hợp lệ; giữ phiên đang mở.');}});
workTrays=setupWorkTrays({E,items,labels,getState:()=>state,getReady:()=>loaded&&(!connected||walletReady)&&!busy,run,showPanel:name=>panels.show(name),getGalleons});
$('craftTool').onclick=()=>setMode('craft');$('buildTool').onclick=()=>setMode('build');
// Native touch/trackpad scrolling; a mouse wheel moves only this overflowing tray.
for(const tray of document.querySelectorAll('.item-tray'))tray.addEventListener('wheel',event=>{
 const tray=event.currentTarget;if(event.ctrlKey||event.shiftKey||Math.abs(event.deltaX)>=Math.abs(event.deltaY)||tray.scrollWidth<=tray.clientWidth)return;
 event.preventDefault();tray.scrollLeft+=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?tray.clientWidth:1);
},{passive:false});
wizard=setupWizardUI({E,items,getState:()=>state,getSelection:()=>({selectedPlot,cells:chosen(),seed,species,mode}),getRenderer:()=>renderer,getReady:()=>loaded&&(!connected||walletReady)&&!busy,run,message,panels,camera,setMode,focusPlot,onGrantOwlReward:grantOwlReward,onClaimDailyQuest:handleClaimDailyQuest,onClaimGrandChest:handleClaimGrandChest,onCare:()=>freeTap('care')});
dockControls=setupGardenControls({items,onSettings:()=>panels.show('settings'),getWeather:()=>activeTourSnapshot?.weatherMode||weatherMode});
dockControls.refresh();
refresh();camera.overview();touchGardenDay();
const addV=f=>(!f?f:f.includes('?')?f:`${f}?v=24.0`);
let lastClock=0;
function applyInitialView(){
 const tourParam=query.get('tour');
 if(tourParam)startTour(tourParam);
 const view=query.get('view');if(!view)return;
 const l=$('owlLetter');if(l?.open)l.close();
 if(view==='inventory')panels.show('inventory');
 else if(view==='store')openStore();
 else if(view==='roadmap')panels.show('roadmap');
 else if(view==='collection')panels.show('collection');
 else if(view==='almanac')panels.show('almanac');
 else if(view==='achievements')panels.show('achievements');
 else if(view==='tour')panels.show('tour');
 else if(view==='events')panels.show('events');
 else if(view==='layout')openVisualLayout();
 else if(view==='postcard'&&loaded)openPostcard();
 else if(view==='owl')wizard.openLetter('owl');
 else if(view==='decor'&&loaded&&walletReady){const item=decorAssets.get('decor_broom_rack')||decorAssets.values().next().value;if(item)openDecoration(item);}
}
fetch('./decor-assets-manifest.json?v=24.0').then(r=>{if(!r.ok)throw Error('Thiếu bộ tranh trang trí.');return r.json();}).then(manifest=>{const itemsV=manifest.items.map(a=>({...a,file:addV(a.file),frames:Array.isArray(a.frames)?a.frames.map(addV):undefined,rightFile:addV(a.rightFile),rightFrames:Array.isArray(a.rightFrames)?a.rightFrames.map(addV):undefined}));decorAssets.clear();for(const a of itemsV)decorAssets.set(a.id,a);return createGarden($('world'),{decorAssets:itemsV});}).then(r=>{renderer=r;loaded=true;refresh();camera.overview();panels?.refresh();hpvnBridge.notifyReady({level:state.level,atmosphereMode,weatherMode,eventMode,keeperTitle:currentKeeperTitle().badge});if((query.get('view')==='decor'||query.get('view')==='layout'||query.get('view')==='postcard'||query.get('view')==='events'||query.get('tour'))&&walletReady)applyInitialView();if(!setupTutorial())message(saveProblem||(session==='lab'?'Phiên thử cấp '+state.level:'Chạm cây để chăm.'));let last=0;function frame(t){if(t-last>=100&&!document.hidden){lastClock=t;draw(t);last=t;}requestAnimationFrame(frame);}requestAnimationFrame(frame);setInterval(()=>{if(!document.hidden)refresh();},1000);}).catch(e=>{message('Không mở được cảnh vườn: '+e.message);console.error(e);});

let celebrationFocus=null;
function celebrate(from,to){
 playtest.track('level_up',{level:to});
 audio.play('levelUp');
 const list=$('unlockList');list.replaceChildren();
 for(const row of DB.levels.slice(from,to))list.append(el('li',{},[el('b',{text:'Cấp '+row.level}),el('span',{text:row.unlock})]));
 $('celebrationTitle').textContent='Lên cấp '+to+'!';celebrationFocus=document.activeElement;$('levelCelebration').hidden=false;$('closeCelebration').focus();
}
function closeCelebration(){$('levelCelebration').hidden=true;celebrationFocus?.focus();}
$('closeCelebration').onclick=closeCelebration;
$('levelCelebration').addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();closeCelebration();}if(e.key==='Tab'){e.preventDefault();$('closeCelebration').focus();}});
const rotateCreatureBtn=button('Xoay',()=>{$('creatureOptions').close();rotateCreatureFacing(species);},{id:'rotateCreatureButton','aria-label':'Đổi hướng nhìn của sinh vật'});
$('petButton')?.after(rotateCreatureBtn,button('Quà gắn kết',()=>{$('creatureOptions').close();panels.show('affinity');},{id:'affinityButton'}));
$('creatureOptionsButton').onclick=()=>$('creatureOptions').showModal();
$('closeCreatureOptions').onclick=()=>$('creatureOptions').close();
$('careAllButton').onclick=()=>{$('creatureOptions').close();panels.show('creatures');};
$('creatureOptions').addEventListener('click',event=>{if(event.target===$('creatureOptions')){const r=event.target.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)event.target.close();}});
$('seedOptionsButton').onclick=()=>$('seedOptions').showModal();
$('closeSeedOptions').onclick=()=>$('seedOptions').close();
$('seedOptions').addEventListener('click',event=>{if(event.target===$('seedOptions')){const r=$('seedOptions').getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)$('seedOptions').close();}});
$('dockToggle').onclick=()=>{const collapsed=document.body.classList.toggle('dock-collapsed');$('dockToggle').setAttribute('aria-expanded',String(!collapsed));$('dockToggle').setAttribute('aria-label',collapsed?'Mở khay thao tác':'Thu gọn khay thao tác');};

const profileUI=setupProfile(message,()=>{$('levelButton').focus();panels.show('profile');});$('avatarButton').onclick=()=>panels.show('profile');

function openStore(initialFilter='all'){panels.close();showStore({state,items,wallet,connected,initialFilter,decorAssets,onDecorate:openDecoration,onPurchase:async(id,count)=>{if(busy)throw Error('Đang xử lý thao tác khác.');busy=true;try{const before=state;await wallet.buy(id,count);audio.play('buy');acceptWallet(before,'Đã mua vật tư.');}finally{busy=false;}}});}
function openDecoration(item){if(!connected||!walletReady)return;const fullItem={...(decorAssets.get(item.id)||{}),...item};showDecorationPlacement({item:fullItem,getStage:()=>renderer?.growthStage?.(),getDecorations:currentDecorations,preview:value=>{previewDecoration=value;draw();},camera,iso,onPlace:async(itemId,slot,facing='default')=>{if(busy)throw Error('Đang xử lý thao tác khác.');busy=true;try{const before=state;localDecorRotations[itemId]=facing;persistPrefs();audio.play('rotate');recordFestivalAction('rotate');wizard?.recordQuestAction?.('rotate');await wallet.act({action:'placeDecoration',itemId,slot,facing});const angleLabel=facing==='right'?'Góc nhìn qua phải ↗':'Góc hiện tại ↖';acceptWallet(before,slot===null?'Đã cất đồ trang trí.':`Đã đặt đồ trang trí (${angleLabel}).`);}catch(e){if(e.definitive){try{await wallet.read();acceptWallet(state,'');}catch{}}throw e;}finally{busy=false;}},onClose:()=>draw()});}
$('shopButton').onclick=()=>openStore();$('suppliesButton').onclick=()=>openStore();$('nextGoal').onclick=followGoal;
if(qa)window.__HAGRID_GARDEN_QA__={
 getWorldSnapshot:()=>({order:renderer?.order(),loaded:renderer?.loaded,missing:renderer?.missing,stage:renderer?.growthStage(),animations:renderer?.animations()}),
 getSnapshot:()=>({clock:lastClock,loaded,walletReady,atmosphereMode,weatherMode,eventMode,keeperTitle:currentKeeperTitle().badge,totalAffinity:currentAffinitySummary().totalAffinityLevels,activeTourId:activeTourSnapshot?.tour?.id||null,soundEnabled:audio.enabled,supplies:currentSupplies(),storageKey:gardenStorage.storageKey,state:{...state,decorations:currentDecorations(),decorationRotations:{...(state?.decorationRotations||{}),...earnedDecorRotations},creatureFacings:currentCreatureFacings(),creatureAffinities:currentCreatureAffinities()}}),
 openDecorPlacement:id=>{const item=decorAssets.get(id);if(item)openDecoration(item);},
 openVisualLayout,
 openPostcard,
 openAlmanac:()=>panels.show('almanac'),
 openAchievements:()=>panels.show('achievements'),
 openTour:()=>panels.show('tour'),
 openEvents:()=>panels.show('events'),
 openOwlMail:()=>wizard.openLetter('owl'),
 openHagridLetter:()=>openHagridLetter('keepsake'),
 replayTutorial,
 openPanel:name=>panels.show(name),
 openStore,
 startTour,
 stopTour,
 helpTour,
 selectTitle:handleSelectTitle,
 claimAchievement:handleClaimAchievement,
 applyEventTheme,
 claimEventMilestone:handleClaimEventMilestone,
 claimDailyQuest:handleClaimDailyQuest,
 claimGrandChest:handleClaimGrandChest,
 petCreature:handlePetCreature,
 claimAffinityGift:handleClaimAffinityGift,
 rotateEarnedDecoration,
 rotateCreatureFacing,
 cycleAtmosphere,
 cycleWeather,
 toggleAudio,
 shareToFloo,
 // Connected QA: send one command as the dock would, to see the server's answer (e.g. a refused build).
 serverAct:command=>connected?run(null,'Đã hoàn tất.',command):null,
};

$('cropCareButton').onclick=()=>{$('seedOptions').close();audio.play('care');recordFestivalAction('care');freeTap('care');wizard?.recordQuestAction?.('care');syncHudV20Buttons();renderer?.animate('care',{plot:selectedPlot,cells:chosen().filter(i=>state.plots[selectedPlot].slots[i])});message('Đã chăm cây · tương tác thư giãn, không cộng XP hoặc rút ngắn thời gian.');};
$('petButton').onclick=()=>{$('creatureOptions').close();handlePetCreature(species);};

function acceptWallet(before,text,showLevelChange=true){state=wallet.snapshot.garden.progression;walletReady=true;syncDaily();const juiceEvents=renderer?.react?.(before,state)||[];refresh();if(showLevelChange)showRewards(before,state,juiceEvents);panels?.refresh();if(showLevelChange&&state.level>before.level)celebrate(before.level,state.level);$('walletValue').textContent=num(wallet.snapshot.wallet.spendable);$('galleonCounter').hidden=false;syncSupplies();const p=wallet.snapshot.profile;$('playerName').textContent=p.username||'Thành viên thử nghiệm';$('avatarButton').title='Hồ sơ thành viên trên emulator';if(p.avatarUrl){$('avatarGlyph').replaceChildren(el('img',{src:p.avatarUrl,alt:'Avatar '+(p.username||'thành viên'),style:'width:28px;height:28px;border-radius:50%;object-fit:cover'}));}$('levelButton').title=WALLET_TEXT.title;if(text)message(text);if(!tutorialChecked)setupTutorial();}
if(connected){
 const badge=el('div',{class:'emulator-badge',text:WALLET_TEXT.badge});$('gameShell').append(badge);
 const boost=button('Nước phép',()=>{$('seedOptions').close();return run(null,'Đã tưới nước phép cho hàng đang chọn.',{action:'boost',plotIndex:selectedPlot,cells:chosen()});},{id:'boostButton',hidden:state.level<6,disabled:true});$('cropCareButton').after(boost);
 wallet.read().then(()=>{acceptWallet(state,WALLET_TEXT.ready,false);applyInitialView();}).catch(e=>{message(e.message);badge.textContent='Emulator chưa kết nối · nhấn để thử lại';badge.role='button';badge.tabIndex=0;const retry=()=>wallet.read().then(()=>{acceptWallet(state,'Đã nối ví thử nghiệm.',false);badge.textContent=WALLET_TEXT.badge;}).catch(e=>message(e.message));badge.onclick=retry;badge.onkeydown=e=>{if(e.key==='Enter')retry();};});
}

// Compact HUD: Cửa hàng, Lễ hội, Cảnh and the camera column fold into one button.
// Phones start folded and fold again after 12 s without a tap on those icons.
const hudPhone=matchMedia('(max-width:599px),(max-height:450px) and (orientation:landscape)');let hudFoldTimer=0;
function setHudCompact(on){document.body.classList.toggle('hud-compact',on);const t=$('hudToggle');t.setAttribute('aria-expanded',String(!on));t.setAttribute('aria-label',on?'Mở thêm biểu tượng':'Thu gọn biểu tượng');t.title=on?'Mở thêm':'Thu gọn';armHudFold();}
function armHudFold(){clearTimeout(hudFoldTimer);if(hudPhone.matches&&!document.body.classList.contains('hud-compact'))hudFoldTimer=setTimeout(()=>setHudCompact(true),12000);}
$('hudToggle').onclick=()=>{playtest.track('hud_toggle');setHudCompact(!document.body.classList.contains('hud-compact'));};
for(const n of document.querySelectorAll('.hud-actions,.camera-tools'))n.addEventListener('pointerdown',armHudFold);
hudPhone.addEventListener('change',()=>setHudCompact(hudPhone.matches));setHudCompact(hudPhone.matches);
// Collapse on entry to short landscape, including phone rotation. The tray remains reopenable.
const shortLandscape=matchMedia('(max-height:450px) and (orientation:landscape)');
function fitLandscape(){if(shortLandscape.matches&&!document.body.classList.contains('dock-collapsed'))$('dockToggle').onclick();}
shortLandscape.addEventListener('change',fitLandscape);
fitLandscape();
