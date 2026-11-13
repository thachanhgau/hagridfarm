import {applyDefaultDecorationVisibility} from '../garden-v05/default-decor.mjs?v=24.9.81';
import * as E from "../garden-v05/progression-engine.mjs?v=25.1.6";
import {unlockedCatalog,CATALOG_VERSION,STORE_CATALOG} from "../garden-v05/garden-store-catalog.mjs?v=25.1.6";
import {decorFootprintRect,rectsOverlap} from "../garden-v05/decor-runtime.mjs?v=24.9.40";
import {createGardenClient} from "../garden-v05/garden-emulator-client.mjs?v=24.9.40";
import {pickDailyQuests,questAmounts} from "../garden-v05/garden-quests.mjs?v=24.9.40";
import {vnDayKey,festivalStatus,festivalMilestone,CREATURE_AFFINITY_LEVELS,affinityLevelForXp,HOGWARTS_EVENTS,FESTIVAL_ACTION_POINTS,FESTIVAL_FARM_POINTS_PER_DAY,FESTIVAL_FREE_POINTS_PER_DAY} from "../garden-v05/garden-events.mjs?v=24.9.40";
import {applyGardenReward} from "../garden-v05/garden-storage.mjs?v=24.9.63";
import {ATMOSPHERE_MODES,WEATHER_MODES} from "../garden-v05/garden-atmosphere.mjs?v=25.1.6";
import {KEEPER_ACHIEVEMENTS} from "../garden-v05/garden-achievements.mjs?v=24.9.40";
import {growthScale,packTotal} from "../garden-v05/ui-utils.mjs?v=24.9.40";
const PREMIUM_CAPS=Object.freeze({rain:1,felix:1,primeMeal:30,feast:3,skeleGro:3});

// In-memory stand-in for performHagridGardenAction (HPVNN functions/games/garden-action-handlers.js,
// garden-daily-core.js, garden-festival-core.js, garden-keeper-core.js): same commands, error reasons and response shapes.
// Day keys are Asia/Ho_Chi_Minh; a requestId replays its first receipt; builds check crops, then Galleons.
// scenario=new is a brand-new account (revision 0, starter supplies, tutorial not used): see HANDOFF-V24.9.md.
export const STARTER_SUPPLIES=Object.freeze({seeds:Object.freeze({pumpkin:3}),water:3,boost:0});
const FREE_CAPS=Object.freeze({rotate:3,pet:3,postcard:1,shareFloo:1,startTour:1,care:3,moveBuilding:1});
// Level-500 roadmap §9: Chăm cây, Vuốt ve and Nước phép each take a quarter off; both ends of a timer move together.
const SPEED_SHARE=0.25,LINES=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
const shift=(t,cut)=>{t.startedAt-=cut;t.readyAt-=cut;};
// «care» is its own action now (server garden-action-core applyCare), not a bare tap.
const FREE_TAPS=new Set(["pet","rotate","postcard","shareFloo","startTour"]);
const DAILY=new Set(["claimQuest","claimChest","claimFestival","freeAction","claimBondGift","claimAchievement","deliverOrder","challenge"]);
const BOND_POINTS=Object.freeze({adopt:15,feed:20,claimAnimals:25,pet:12}),BOND_PETS_PER_DAY=3;
const CHEST_REWARD=Object.freeze({kind:"boost",amount:1,waterBonus:12,itemId:"boost",eventPoints:20,label:"Rương Cú Vàng: +1 Nước phép, +12 Nước, +20 điểm lễ hội"});
// Server BONUS_QUEST_POOL / BONUS_CHEST_REWARD (garden-daily-core.js): «Việc thêm» and Rương Bác Hagrid.
const BONUS_CHEST_REWARD=Object.freeze({kind:"boost",amount:1,waterBonus:24,itemId:"boost",eventPoints:30,label:"Rương Bác Hagrid: +1 Nước phép, +24 Nước, +30 điểm lễ hội"});
const bonusQuest=(id,title,target,triggers,route,amount)=>({id,sender:"Bác Hagrid",title,target,triggers,reward:{kind:"water",amount,itemId:"pumpkin",label:`+${amount} Nước`},route,progress:0,claimed:false});
const bonusQuests=({level,hasCreature})=>[
 hasCreature&&bonusQuest("q_pet","Vuốt ve sinh vật 3 lần",3,["pet"],"creature",4),
 level>=10&&bonusQuest("q_help","Chăm giúp 1 vườn bạn",1,["help"],"visit",6),
 bonusQuest("q_share","Khoe vườn",1,["postcard","shareFloo"],"postcard",4),
].filter(Boolean);
const clone=v=>structuredClone(v);
const fail=(reason,message,details={})=>{const e=Error(message);e.definitive=true;e.reason=reason;e.details={reason,...details};throw e;};
const stable=v=>JSON.stringify(v,Object.keys(v).sort());

/** `day` (YYYY-MM-DD) moves only the Vietnam calendar day, for festival QA; crop timers keep real time. */
export function createFixtureServer({level=100,scenario="empty",simulate=false,day=null,quests=null,points=0,galleons=null,previewHalloween=false,fireMode=null,helpers=false,missions=false,weather=null,duty=false,murky=false,now=()=>Date.now()}={}){
 // «Thăm vườn» / «Đốt vườn» QA (01/11/2026): ?fire=visual|real burns this garden, ?helpers=1 has three helpers today.
 let fire=fireMode?{mode:fireMode,since:now(),until:now()+2*3600000+5*60000,burned:fireMode==='real'?27:0}:null;
 const helperRows=helpers?[['u1','tara'],['u2','Linh'],['u3','Mai Phương']].map(([uid,name],i)=>({uid,name,at:now()-(3-i)*60000})):[];
 const visitRows=[['m1','tara',42,6],['m2','Linh',18,0],['m3','Hermione Granger',120,9],['m4','Mai Phương',11,3],['m5','Draco',64,0]].map(([uid,username,lv,growing])=>({uid,username,level:lv,growing,helped:false,...(uid==='m3'?{fire:'real'}:{}),...(uid==='m1'?{scene:{weather:'snow',atmosphere:'night',event:'event_yule'}}:{})}));
 let helpsLeft=3;
 const dayOffset=day?Date.parse(day+"T12:00:00+07:00")-now():0,dayKey=()=>vnDayKey(now()+dayOffset);
 const past=scenario.endsWith("ready"),origin=past?now()-26*3600000:now();
 const fresh=scenario==="new";
 let state=fresh?E.newGame(origin):E.testProfile(level,origin);
 if(scenario==="halloween"){state.decorations=[];state.creatures=[];}
 if(["owned","feeding","animal-ready","pet-no-food"].includes(scenario)){
  state=E.adopt(state,"puffskein",origin);
  if(["feeding","animal-ready"].includes(scenario))state=E.feed(state,"puffskein",origin);
  if(scenario==="pet-no-food")state.inventory[E.CREATURE.puffskein.feed]=0;
 }
 if(scenario==="pet-mixed-ready"){state=E.adopt(state,"puffskein",origin);state=E.adopt(state,"bowtruckle",origin);state=E.feed(state,"bowtruckle",origin);}
 if(["craft-busy","craft-ready"].includes(scenario))state=E.craft(state,"insects",1,origin);
 if(["build-busy","build-ready"].includes(scenario))state=E.build(state,"plot_12",origin);
 if(scenario==="pet-no-space")state.built=state.built.filter(id=>!id.startsWith("pen_"));
 if(scenario==="pen-ext")state.built=state.built.filter(id=>!id.startsWith("pen_ext_")); // phase 2: «Chuồng mở rộng» waiting in Xây
 if(scenario==="missing")for(const id of Object.keys(state.inventory))state.inventory[id]=0;
 if(scenario==="prerequisite"){const base=E.newGame(origin);state.built=base.built;state.plots=base.plots;}
 // A lively showcase for the default preview: crops, adult and baby creatures, decorations.
 if(["empty","habitats","all-decor"].includes(scenario)&&level>=10){
  const showcaseCrops=[[0,[0,1,2],"pumpkin",origin-8*3600000],[0,[3,4,5],"daisy",origin-8*3600000],[0,[6,7,8],"mushroom",origin-30*60000],[1,[0,1,2],"clover",origin-8*3600000],[1,[3,4,5],"ginger",origin-45*60000],[2,[0,1,2],"bluebell",origin-12*3600000]];
  for(const [plotIdx,cells,cropId,plantedAt] of showcaseCrops){
   const spec=E.CROP[cropId];
   if(!spec||spec.level>level||!state.plots[plotIdx])continue;
   for(const cell of cells)state.plots[plotIdx].slots[cell]={id:`crop-p${plotIdx}-s${cell}-1`,type:"crop",species:cropId,plantedAt,growMs:spec.growMs};
  }
  const showcaseCreatures=scenario==="habitats"?Object.keys(E.CREATURE).map(species=>({species,adult:true})):[{species:"puffskein",adult:true},{species:"bowtruckle",adult:true},{species:"niffler",adult:true},{species:"kneazle",adult:false},{species:"hippogriff",adult:true},{species:"unicorn",adult:true}];
  const maxSpots=E.housingCapacity(state);
  for(const item of showcaseCreatures){
   const spec=E.CREATURE[item.species];
   if(!spec||spec.level>level||state.creatures.length>=maxSpots)continue;
   state.creatures.push({id:`creature-${item.species}`,type:"creature",species:item.species,level:spec.level,adoptedAt:origin-48*3600000,mealsCompleted:item.adult?spec.mealsToAdult:Math.max(1,Math.floor(spec.mealsToAdult/2)),meal:null,cyclesClaimed:item.adult?1:0,preview:false});
  }
  for(const dec of E.DB.decorations)if(dec.level<=Math.min(level,40)&&state.decorations.length<6&&!state.decorations.includes(dec.id))state.decorations.push(dec.id);
  state.decorationRotations={"decoration-7":"right","decoration-23":"right"};
  state.creatureFacings={puffskein:"default",bowtruckle:"right",niffler:"default",kneazle:"right",hippogriff:"default",unicorn:"right"};
  if(level>=150&&state.built.includes('pond_1')&&!state.creatures.some(c=>c.species==='grindylow'))state.creatures.push({id:'creature-grindylow',type:'creature',species:'grindylow',level:150,adoptedAt:origin-48*3600000,mealsCompleted:6,meal:null,cyclesClaimed:0,preview:false});
  // Garden expansion phase 2: the new land species from their level, while the pens (and «Chuồng mở rộng») have room.
  for(const species of ['crup','knarl','salamander','porlock'])if(level>=E.CREATURE[species].level&&state.creatures.filter(c=>!E.POND_SPECIES.has(c.species)).length<E.housingCapacity(state))state.creatures.push({id:`creature-${species}`,type:'creature',species,level:E.CREATURE[species].level,adoptedAt:origin-48*3600000,mealsCompleted:species==='crup'?E.CREATURE.crup.mealsToAdult:4,meal:null,cyclesClaimed:0,preview:false});
  if(level>=E.CREATURE.kappa.level&&!state.creatures.some(c=>c.species==='kappa'))state.creatures.push({id:'creature-kappa',type:'creature',species:'kappa',level:E.CREATURE.kappa.level,adoptedAt:origin-48*3600000,mealsCompleted:6,meal:null,cyclesClaimed:0,preview:false});
  if(level>=20)state.keepsakes={...state.keepsakes,puffskein:2,bowtruckle:1,niffler:3,...(level>=90?{kneazle:1,hippogriff:2,unicorn:1,dragon:1}:{}),...(level>=160?{grindylow:1,crup:1}:{})};
 }
 // Asset-overlap QA (05/11/2026): every earned decoration at home and a ripe crop on every cell of every plot.
 if(scenario==="all-decor"){
  state.decorations=E.DB.decorations.filter(d=>d.level<=level).map(d=>d.id);
  const tall=E.DB.crops.filter(c=>c.level<=level).map(c=>c.id);
  state.plots.forEach((plot,i)=>{for(let cell=0;cell<9;cell++){const species=tall[(i*3+Math.floor(cell/3))%tall.length];plot.slots[cell]={id:`crop-p${i}-s${cell}-2`,type:"crop",species,plantedAt:origin-48*3600000,growMs:E.CROP[species].growMs};}});
 }
 const catalog=unlockedCatalog(state.level,dayKey()).map(item=>({...item,dailyRemaining:item.dailyLimit,...(previewHalloween&&item.collection==='festival'?{forSale:undefined}:{})}));
 const storeDecors=catalog.filter(i=>i.kind==="decoration").map(i=>i.id),full=scenario==="empty"&&level>=30;
 const spendable=galleons??2500,bankBalance=Math.min(1000,spendable);
 const garden={
  progression:state,
  supplies:fresh?{seeds:Object.fromEntries(E.DB.crops.map(c=>[c.id,STARTER_SUPPLIES.seeds[c.id]||0])),water:STARTER_SUPPLIES.water,boost:STARTER_SUPPLIES.boost,spring:0,rain:0,felix:0,primeMeal:0,feast:0,skeleGro:0}
   :{seeds:Object.fromEntries(E.DB.crops.map(c=>[c.id,c.level<=level?36:0])),water:213,boost:2,spring:0,rain:2,felix:2,primeMeal:5,feast:2,skeleGro:3},
  decorations:fresh?{owned:[],placements:[null,null,null,null,null,null],rotations:{}}:{owned:full?storeDecors:["decor_pumpkin_lantern"],placements:full?[...storeDecors,null,null,null,null,null,null].slice(0,6):["decor_pumpkin_lantern",null,null,null,null,null],
   rotations:full?{decor_pumpkin_lantern:"default",decor_broom_rack:"right",decor_cauldron:"default",decor_mandrake_planter:"right",decor_floating_candles:"default",decor_vine_arch:"right"}:{decor_pumpkin_lantern:"default"}},
  boostedCropIds:[],
  festival:{joinDay:dayKey(),pointsBySeason:{},claimedMilestones:[]},
  bonding:{bySpecies:{},claimedGifts:[]},
  achievements:{claimedIds:[]},
  tutorial:{grownAt:null,guide:[]},
  premium:{felix:null,nests:[]},
  mastery:fresh?{}:{pumpkin:120,daisy:460,strawberry:1350,oats:95,carrot:200,lettuce:91},cup:{weekKey:'',points:0},
 };
 // Garden expansion phase 1 «Hồ nuôi» (HPVNN garden pond core, simplified): from level 130 four carp and two goldfish
 // fry; a built pond starts with one ripe lot, one growing, and a bed with a ripe and a growing cell. ?murky=1: «đục rêu».
 if(!fresh&&level>=130)Object.assign(garden.supplies,{fryCarp:4,fryGoldfish:2});
 // Garden expansion phase 2: from level 220 a Góc bếp (bếp gạch) in the last socket is the Kỳ nhông lửa's fire spot.
 if(!fresh&&level>=220){garden.decorations.owned.push('ev_kitchen_corner');garden.decorations.placements[5]='ev_kitchen_corner';}
 garden.pond={lots:[],beds:[],murkySince:murky?now()-50*3600000:null,castDay:null,token:null};
 syncPondSize(garden);
 if(garden.pond.lots.length){garden.pond.lots[0]={fry:'carp',readyAt:now()-60000};garden.pond.lots[1]={fry:'goldfish',readyAt:now()+3*3600000};garden.pond.beds[0]=[{species:'silverkelp',readyAt:now()-60000},{species:'silverkelp',readyAt:now()+2*3600000},null];}
 if(scenario==="removable-decor"){garden.progression.decorations=["decoration-7"];garden.progression.keepsakes.puffskein=1;garden.decorations.placements=[null,null,null,null,null,null];}
 const wallet={spendable,balance:spendable-bankBalance,bankBalance};
 const dailies=new Map(),ops=new Map(),ledger=[];
 const season=festivalStatus(dayKey(),garden.festival.joinDay).active;
 if(season&&points)garden.festival.pointsBySeason[season.seasonKey]=points;

 function daily(){
  const key=dayKey();
  if(!dailies.has(key)){
   const yesterday=dailies.get(vnDayKey(Date.parse(key+"T12:00:00+07:00")-86400000));
   const p=garden.progression,context={level:p.level,hasCreature:p.creatures.length>0,feedItem:E.CREATURE[p.creatures[0]?.species]?.feed||null};
   const list=pickDailyQuests(key,context);
   const bonus=bonusQuests(context);
   if(quests==="done")for(const q of [...list,...bonus])q.progress=q.target;
   dailies.set(key,{dayKey:key,streakDays:yesterday?yesterday.streakDays+1:1,quests:list,chestClaimed:false,bonusQuests:bonus,bonusChestClaimed:false,free:{},farm:0,freeToday:0});
  }
  return dailies.get(key);
 }
 function addPoints(d,f,type,{counted=true,amount=null}={}){
  const active=festivalStatus(d.dayKey,f.joinDay).active;
  if(!active||!counted)return 0;
  let delta=amount??FESTIVAL_ACTION_POINTS[type]??5;
  if(type in FREE_CAPS){delta=Math.max(0,Math.min(delta,FESTIVAL_FREE_POINTS_PER_DAY-d.freeToday));d.freeToday+=delta;}
  else if(type!=="questClaim"&&type!=="dailyChest"){delta=Math.max(0,Math.min(delta,FESTIVAL_FARM_POINTS_PER_DAY-d.farm));d.farm+=delta;}
  if(delta>0)f.pointsBySeason[active.seasonKey]=(f.pointsBySeason[active.seasonKey]||0)+delta;
  return delta;
 }
 function countFree(d,kind){const used=d.free[kind]||0,counted=used<FREE_CAPS[kind];if(counted)d.free[kind]=used+1;return {kind,counted,used:d.free[kind]||0,cap:FREE_CAPS[kind]};}
 function milestoneViews(event,year){
  const points=garden.festival.pointsBySeason[`${event.id}@${year}`]||0;
  return event.milestones.map(m=>{const key=`${m.id}@${year}`,claimed=garden.festival.claimedMilestones.includes(key);return {key,title:m.title,points:m.points,reward:clone(m.reward),claimed,claimable:!claimed&&points>=m.points};});
 }
 // Bonding (garden-keeper-core): a creature with no entry starts from 15 × its completed meals.
 const creatureOf=(p,sp)=>p.creatures.find(c=>c.species===sp)||null;
 const savedOrBaseline=(g,sp,cr)=>g.bonding.bySpecies[sp]||{xp:(cr?.mealsCompleted||0)*15,pets:0,petDay:"",petsToday:0};
 function addBond(g,before,sp,action,day){
  const prev=savedOrBaseline(g,sp,creatureOf(before,sp)),beforeLevel=affinityLevelForXp(prev.xp).level,isPet=action==="pet";
  const petsToday=prev.petDay===day?prev.petsToday:0,capped=isPet&&petsToday>=BOND_PETS_PER_DAY,gain=capped?0:BOND_POINTS[action];
  const entry={xp:prev.xp+gain,pets:prev.pets+(isPet&&!capped?1:0),petDay:isPet?day:prev.petDay,petsToday:isPet?petsToday+(capped?0:1):(prev.petDay===day?petsToday:0)};
  if(!capped)g.bonding.bySpecies[sp]=entry;
  const info=affinityLevelForXp(entry.xp);
  return {species:sp,action,gain,capped,petsLeftToday:Math.max(0,BOND_PETS_PER_DAY-entry.petsToday),level:info.level,leveledUp:info.level>beforeLevel};
 }
 function bondTriggers(action,before,after){
  const was=sp=>creatureOf(before,sp);
  if(action==="adopt")return after.creatures.filter(c=>!was(c.species)).map(c=>c.species);
  if(action==="feed")return after.creatures.filter(c=>c.meal&&!was(c.species)?.meal).map(c=>c.species);
  if(action==="claimAnimals")return after.creatures.filter(c=>{const p=was(c.species);return p&&(c.mealsCompleted>p.mealsCompleted||c.cyclesClaimed>p.cyclesClaimed);}).map(c=>c.species);
  return [];
 }
 function bondingView(day){
  const creatures=garden.progression.creatures.map(cr=>{
   const entry=savedOrBaseline(garden,cr.species,cr),info=affinityLevelForXp(entry.xp);
   const gifts=CREATURE_AFFINITY_LEVELS.filter(l=>l.reward).map(l=>{const giftId=`${cr.species}:lv${l.level}`,claimed=garden.bonding.claimedGifts.includes(giftId);return {giftId,level:l.level,title:l.title,reward:clone(l.reward),claimed,claimable:!claimed&&info.level>=l.level};});
   return {species:cr.species,...info,pets:entry.pets,petsLeftToday:Math.max(0,BOND_PETS_PER_DAY-(entry.petDay===day?entry.petsToday:0)),gifts};
  });
  return {points:{...BOND_POINTS},petsPerDay:BOND_PETS_PER_DAY,creatures,totalLevels:creatures.reduce((n,c)=>n+c.level,0),claimableCount:creatures.reduce((n,c)=>n+c.gifts.filter(g=>g.claimable).length,0)};
 }
 // Achievements: judged from the garden; honour-garden help is always 0 (tours are frozen).
 const achStatus=(g,a)=>a.check(g.progression,{decorations:g.decorations,helpedGardensCount:0});
 function achievementsView(){
  const items=KEEPER_ACHIEVEMENTS.map(({check,...a})=>{const st=achStatus(garden,{check});return {...clone(a),...st,unlocked:Boolean(st.unlocked),claimed:garden.achievements.claimedIds.includes(a.id)};});
  return {items,unlockedCount:items.filter(i=>i.unlocked).length,totalCount:items.length,claimableCount:items.filter(i=>i.unlocked&&!i.claimed).length};
 }
 function response(receipt=null){
  const d=daily(),status=festivalStatus(d.dayKey,garden.festival.joinDay);
  const view=s=>({id:s.id,label:s.event.label,shortLabel:s.event.shortLabel,icon:s.event.icon,year:s.year,seasonKey:s.seasonKey,start:s.start,end:s.end});
  const active=status.active?{...view(status.active),daysLeft:status.active.daysLeft,points:garden.festival.pointsBySeason[status.active.seasonKey]||0,milestones:milestoneViews(status.active.event,status.active.year)}:null;
  const pending=[];
  for(const seasonKey of Object.keys(garden.festival.pointsBySeason)){
   if(seasonKey===active?.seasonKey)continue;
   const [id,year]=seasonKey.split("@"),event=HOGWARTS_EVENTS.find(e=>e.id===id);
   if(event?.milestones)pending.push(...milestoneViews(event,year).filter(m=>m.claimable).map(m=>({...m,festivalLabel:event.label})));
  }
  const done=d.quests.filter(q=>q.progress>=q.target).length,allDone=[...d.quests,...d.bonusQuests].every(q=>q.progress>=q.target);
  return clone({
   uid:"garden-fixture-member",
   garden,wallet,catalog,catalogVersion:CATALOG_VERSION,dayKey:d.dayKey,
   daily:{dayKey:d.dayKey,streakDays:d.streakDays,quests:d.quests,chest:{claimed:d.chestClaimed,ready:!d.chestClaimed&&done>=3,reward:CHEST_REWARD},
    bonusQuests:d.bonusQuests,bonusChest:{claimed:d.bonusChestClaimed,ready:!d.bonusChestClaimed&&allDone,reward:BONUS_CHEST_REWARD},
    freeActions:Object.fromEntries(Object.entries(FREE_CAPS).map(([kind,cap])=>[kind,{used:d.free[kind]||0,cap}])),
    premiumUses:Object.fromEntries(Object.entries(PREMIUM_CAPS).map(([k,cap])=>[k,{used:k==='skeleGro'?{...(d.premium?.skeleGro||{})}:d.premium?.[k]||0,cap:k==='rain'&&garden.progression.level>100?2:cap}]))},
   festival:{active,next:{...view(status.next),daysUntil:status.next.daysUntil},today:{farm:d.farm,farmCap:FESTIVAL_FARM_POINTS_PER_DAY,free:d.freeToday,freeCap:FESTIVAL_FREE_POINTS_PER_DAY},pending},
   bonding:bondingView(d.dayKey),achievements:achievementsView(),
   // Server garden-retention-core views (QA approximation: fixed board, orders drawn per day from the unlocked crops).
   ...retentionViews(d),...(missions?missionViews():{}),flooFrames:{frames:frameViews(),worn:wornFrame},saleAdmin:true,
   serverNow:now(),profile:{username:"Xem thử · không lưu"},fire:fire&&fire.until>now()?fire:null,helpers:helperRows,
   ...soilViews(),...(duty&&garden.progression.level>=130?{duty:dutyQaView()}:{}),pond:pondView(),edge:edgeView(),orchard:orchardView(),
   ...(receipt?{receipt}:{}),
  });
 }
 // Crops are paid by the engine first (missing-crops); Galleons only after, bank first, one debit per requestId.
 function charge(cost,requestId){
  if(wallet.spendable<cost)fail("insufficient-galleons","Chưa đủ Galleons cho công trình này.",{required:cost,spendable:wallet.spendable,shortBy:cost-wallet.spendable});
  const fromBank=Math.min(wallet.bankBalance,cost);wallet.bankBalance-=fromBank;wallet.balance-=cost-fromBank;wallet.spendable-=cost;
  ledger.push({requestId,type:"debit",amount:cost,reasonCode:"garden_build"});
 }
 function model(c,p,time){
  try{
   switch(c.action){
    case "plant":return E.plant(p,c.plotIndex,c.cells,c.species,time);
    case "replant":return E.replant(p,c.plotIndex,time);
    case "harvest":return E.harvest(p,c.plotIndex??null,c.cells??null,time);
    case "uproot":return E.uproot(p,c.plotIndex,c.cells,time);
    case "adopt":return E.adopt(p,c.species,time);
    case "feed":return E.feed(p,c.species??null,time,c.hand===true);
    case "claimAnimals":return E.claimAnimals(p,c.species??null,time);
    case "craft":return E.craft(p,c.recipeId,c.batches,time);
    case "claimCraft":return E.claimCraft(p,time);
    case "build":return E.build(p,c.expansionId,time);
    case "claimBuildings":return E.claimBuildings(p,time);
    case "moveBuilding":return E.moveBuilding(p,c.kind,c.index,c.targetSlot);
    case "exchangeKeepsake":return E.exchangeKeepsake(p,c.species);
    case "buyDecoration":return E.buyDecoration(p,c.level);
   }
  }catch(e){
   if(e?.code==="MISSING_RESOURCE"&&(c.action==="build"||c.action==="buyDecoration")){
    const entry=c.action==="build"?E.DB.expansions.find(x=>x.id===c.expansionId):E.DB.decorations.find(x=>x.level===c.level);
    const missing=Object.entries(entry?.cropCost||{}).map(([resource,required])=>({resource,required,have:p.inventory[resource]||0})).filter(m=>m.have<m.required);
    fail("missing-crops","Chưa đủ nông sản cho công trình này.",{modelCode:e.code,detail:e.message,missing});
   }
   fail("model-rejected",e?.message||"Mô hình từ chối lệnh khu vườn.",{modelCode:e?.code||null});
  }
  fail("unknown-action","Lệnh khu vườn không được hỗ trợ.",{action:c.action});
 }
 function plantSupplies(before,after,supplies){
  const seeds={};let cells=0;
  after.plots.forEach((plot,p)=>plot.slots.forEach((s,i)=>{if(s?.type==="crop"&&!before.plots[p]?.slots[i]){cells++;seeds[s.species]=(seeds[s.species]||0)+1;}}));
  if(supplies.water<cells)fail("missing-supply","Không đủ nước cho số ô gieo mới.",{resource:"water",required:cells});
  for(const [id,n] of Object.entries(seeds))if((supplies.seeds[id]||0)<n)fail("missing-supply","Không đủ hạt giống cho số ô gieo mới.",{resource:`seeds.${id}`,required:n});
  supplies.water-=cells;for(const [id,n] of Object.entries(seeds))supplies.seeds[id]-=n;
 }
 // Server applyBoost (level-500 roadmap §9): a quarter off a row of crops, the meal of `species` or the timed craft `jobId`, once each.
 function boost(c,next){
  if(c.species!==undefined||c.jobId!==undefined){
   const find=p=>c.species!==undefined?p.creatures.find(x=>x.species===c.species)?.meal:p.jobs.find(j=>j.id===c.jobId);
   const timer=find(next.progression),at=E.nowFor(next.progression,now());
   if(!timer)fail("invalid-boost-target",c.species!==undefined?"Sinh vật này không có bữa đang ăn.":"Không có mẻ chế biến này.");
   if(timer.readyAt<=at)fail("timer-ready","Đã xong rồi, không cần nước phép.");
   if(next.boostedCropIds.includes(timer.id))fail("already-boosted","Bữa ăn hoặc mẻ này đã được tưới nước phép.");
   if(next.supplies.boost<1)fail("missing-supply","Không còn nước phép.",{resource:"boost",required:1});
   shift(timer,Math.floor((timer.readyAt-timer.startedAt)*SPEED_SHARE));next.boostedCropIds.push(timer.id);
   next.supplies.boost-=1;next.progression.revision+=1;return;
  }
  const plot=next.progression.plots[c.plotIndex],at=E.nowFor(next.progression,now());
  const entries=(c.cells||[]).map(i=>plot?.slots[i]);
  if(entries.length!==3||entries.some(s=>s?.type!=="crop"))fail("invalid-boost-target","Mỗi ô trong hàng phải có cây đang lớn.");
  if(entries.some(s=>next.boostedCropIds.includes(s.id)))fail("already-boosted","Một cây trong hàng đã được tưới nước phép.");
  if(entries.some(s=>E.growth(s,at).mature))fail("mature-crop","Cây đã chín thì không cần nước phép.");
  if(next.supplies.boost<1)fail("missing-supply","Không còn nước phép.",{resource:"boost",required:1});
  for(const s of entries){s.plantedAt-=Math.floor((E.CROP[s.species]?.growMs||s.growMs)*SPEED_SHARE);next.boostedCropIds.push(s.id);}
  next.supplies.boost-=1;next.progression.revision+=1;
 }
 // Server applyCare: each growing crop in the row ripens a quarter of its grow time sooner, never past ripe.
 function care(c,next){
  const plot=next.progression.plots[c.plotIndex],at=E.nowFor(next.progression,now());
  if(!plot)fail("invalid-action-input","Thửa đất không tồn tại.");
  const growing=(c.cells||[]).filter(i=>plot.slots[i]?.type==="crop"&&!E.growth(plot.slots[i],at).mature);
  if(!growing.length)fail("invalid-care-target","Hàng đang chọn không có cây đang lớn để chăm.");
  for(const i of growing)plot.slots[i].plantedAt=Math.max(plot.slots[i].plantedAt-Math.floor(plot.slots[i].growMs*SPEED_SHARE),at-plot.slots[i].growMs);
  next.progression.revision+=1;
 }
 // Hagrid's tutorial "nước phép": once per account, level 1, first plot only; the named growing
 // crops become ripe at server time. No supply, festival point or quest progress.
 function tutorialGrow(c,next){
  if(next.tutorial.grownAt!==null)fail("already-claimed","Nước phép hướng dẫn đã dùng rồi.");
  if(next.progression.level!==1)fail("tutorial-closed","Nước phép hướng dẫn chỉ dành cho vườn mới.");
  const cells=Array.isArray(c.cells)?c.cells:[];
  if(c.plotIndex!==0||!cells.length||cells.length>9||new Set(cells).size!==cells.length||cells.some(i=>!Number.isInteger(i)||i<0||i>8))fail("invalid-action-input","Nước phép hướng dẫn chỉ tưới thửa đầu tiên.");
  const at=E.nowFor(next.progression,now()),slots=next.progression.plots[0].slots;
  if(cells.some(i=>slots[i]?.type!=="crop"))fail("invalid-boost-target","Mỗi ô phải có cây đang lớn.");
  if(cells.some(i=>E.growth(slots[i],at).mature))fail("mature-crop","Cây đã chín thì không cần nước phép.");
  for(const i of cells)slots[i].plantedAt=at-(E.CROP[slots[i].species]?.growMs||slots[i].growMs);
  next.tutorial.grownAt=now();next.progression.revision+=1;
 }
 // garden-action-core applyDecorationPlacement: `facing` is stored in decorations.rotations; the same slot
 // with a new facing is a turn (counted as rotate), the same slot and facing is action-noop.
 function place(c,next){
  const dec=next.decorations,from=dec.placements.indexOf(c.itemId);
  if(c.facing!==undefined&&c.facing!=="default"&&c.facing!=="right")fail("invalid-action-input","facing không hợp lệ.");
  if(!dec.owned.includes(c.itemId))fail("decoration-not-owned","Đồ trang trí chưa được sở hữu.");
  const turned=c.facing!==undefined&&c.facing!==(dec.rotations[c.itemId]||"default");
  if(c.facing!==undefined)dec.rotations[c.itemId]=c.facing;
  // Server garden-action-core: `at` stands it on free ground; footprints (turned with the facing) never overlap,
  // and the placed list grows past the six legacy sockets up to every decoration in the catalog.
  if(c.at){
   const footprint=id=>STORE_CATALOG.find(i=>i.id===id)?.footprint??[1,1],facingOf=id=>(id===c.itemId&&c.facing)||dec.rotations[id]||"default";
   const spot=id=>dec.positions?.[id]||[[3,7.15],[9.5,7.15],[16,7.15],[22.5,7.15],[3,13.5],[9.5,13.5]][dec.placements.indexOf(id)];
   if(from>=0&&spot(c.itemId)[0]===c.at[0]&&spot(c.itemId)[1]===c.at[1]&&!turned)fail("action-noop","Đồ trang trí đã ở vị trí và hướng này.");
   const mine=decorFootprintRect(c.at[0],c.at[1],footprint(c.itemId),facingOf(c.itemId));
   if(dec.placements.some(o=>o&&o!==c.itemId&&rectsOverlap(mine,decorFootprintRect(...spot(o),footprint(o),facingOf(o)))))fail("slot-occupied","Chồng lên món trang trí khác.");
   let i=from>=0?from:dec.placements.indexOf(null);
   if(i<0&&dec.placements.length<STORE_CATALOG.filter(x=>x.kind==="decoration").length){dec.placements.push(null);i=dec.placements.length-1;}
   if(i<0)fail("slot-occupied","Vườn đã bày đủ đồ trang trí; cất bớt một món trước.");
   dec.placements[i]=c.itemId;dec.positions={...dec.positions,[c.itemId]:[...c.at]};
  }
  else if(c.slot===null){if(from<0)fail("action-noop","Đồ trang trí đã được cất.");dec.placements[from]=null;if(dec.positions)delete dec.positions[c.itemId];}
  else if(from===c.slot){if(!turned)fail("action-noop","Đồ trang trí đã ở vị trí và hướng này.");}
  else{
   if(dec.placements[c.slot]!==null)fail("slot-occupied","Vị trí đồ trang trí đã có món khác.");
   dec.placements[c.slot]=c.itemId;if(from>=0)dec.placements[from]=null;
  }
  next.progression.revision+=1;
 }
 function claim(c,next,d,extra){
  let reward;
  if(c.action==="claimQuest"){
   const q=[...d.quests,...d.bonusQuests].find(x=>x.id===c.questId);
   if(!q)fail("quest-not-found","Không có nhiệm vụ này hôm nay.");
   if(q.claimed)fail("already-claimed","Nhiệm vụ này đã nhận thưởng.");
   if(q.progress<q.target)fail("quest-incomplete","Nhiệm vụ chưa hoàn thành.");
   q.claimed=true;reward=q.reward;extra.questId=q.id;
  }else if(c.action==="claimChest"&&c.chest==="bonus"){
   if(d.bonusChestClaimed)fail("already-claimed","Rương Bác Hagrid hôm nay đã mở.");
   if(![...d.quests,...d.bonusQuests].every(q=>q.progress>=q.target))fail("quest-incomplete","Cần hoàn thành cả nhiệm vụ cú lẫn việc thêm.");
   d.bonusChestClaimed=true;reward=BONUS_CHEST_REWARD;extra.chest="bonus";
  }else if(c.action==="claimChest"){
   if(d.chestClaimed)fail("already-claimed","Rương Cú Vàng hôm nay đã mở.");
   if(d.quests.filter(q=>q.progress>=q.target).length<3)fail("quest-incomplete","Cần hoàn thành cả 3 nhiệm vụ cú.");
   d.chestClaimed=true;reward=CHEST_REWARD;extra.chest=true;
  }else if(c.action==="claimBondGift"){
   const match=/^([a-z-]{1,32}):lv([2-5])$/.exec(String(c.giftId??"")),cr=match?creatureOf(next.progression,match[1]):null;
   if(!cr)fail("bond-not-found","Không có quà gắn kết này.");
   if(next.bonding.claimedGifts.includes(c.giftId))fail("already-claimed","Quà gắn kết này đã nhận.");
   const entry=savedOrBaseline(next,match[1],cr),lv=CREATURE_AFFINITY_LEVELS[Number(match[2])-1];
   if(entry.xp<lv.minXp)fail("bond-incomplete","Sinh vật chưa đủ điểm gắn kết cho quà này.");
   next.bonding.claimedGifts.push(c.giftId);next.bonding.bySpecies[match[1]]={...entry};reward=lv.reward;extra.giftId=c.giftId;
  }else if(c.action==="claimAchievement"){
   const a=KEEPER_ACHIEVEMENTS.find(x=>x.id===c.achievementId);
   if(!a)fail("achievement-not-found","Không có thành tựu này.");
   if(next.achievements.claimedIds.includes(a.id))fail("already-claimed","Thành tựu này đã nhận thưởng.");
   if(!achStatus(next,a).unlocked)fail("achievement-locked","Thành tựu này chưa mở khóa.");
   next.achievements.claimedIds.push(a.id);reward=a.reward;extra.achievementId=a.id;
  }else{
   const m=String(c.milestoneKey).includes("@")?festivalMilestone(c.milestoneKey):null;
   if(!m)fail("festival-not-found","Không có mốc lễ hội này.");
   if(next.festival.claimedMilestones.includes(m.key))fail("already-claimed","Mốc lễ hội này đã nhận.");
   if((next.festival.pointsBySeason[m.seasonKey]||0)<m.points)fail("festival-incomplete","Chưa đủ điểm lễ hội cho mốc này.");
   next.festival.claimedMilestones.push(m.key);reward=m.reward;extra.milestoneKey=m.key;
  }
  applyGardenReward(next.progression.inventory,next.supplies,reward);
  next.progression.revision+=1;extra.reward=clone(reward);
 }
 // Server garden-premium-use (QA approximation: rain, Phúc Lạc Dược, meals; Thuốc Mọc Xương without stage XP).
 const TIERS=[90,450,1350];
 function ordersFor(d){
  const p=garden.progression;if(p.level<15)return [];
  d.orders??=[0,1,2].map(i=>{const band=E.DB.crops.filter(c=>c.level<=p.level).slice(-8),a=band[(i*3)%band.length],b=band[(i*5+1)%band.length],items={[a.id]:6+3*i,[b.id]:9};
   const xp=Math.floor(Object.entries(items).reduce((t,[id,n])=>t+n*E.CROP[id].harvestXP/(E.CROP[id].yieldPerCell||1),0));return {id:`order-${d.dayKey}-${i+1}`,items,xp,boost:1,cup:10,delivered:false};});
  return d.orders;
 }
 // Server garden-floo-frame / garden-sale-admin (QA approximation: frames from mastery, cup wins Ravenclaw ×1).
 let wornFrame=null,salesConfig={revision:0,programs:{'golden-hour':true,'creature-weekend':true,flash:true,'festival-end':true},sales:[],items:{},market:{prices:{}}};
 function frameViews(){
  const m=garden.mastery||{},have=t=>Object.values(m).filter(n=>n>=TIERS[t-1]).length;
  return [[1,'Tập sự',1,5],[2,'Thạo nghề',2,10],[3,'Bậc thầy',3,16],[4,'Đại sư',3,E.DB.crops.length]].map(([n,label,t,need])=>({key:`hagrid-mastery-${n}`,label:`Khung ${label} vườn Hagrid`,kind:'mastery',unlocked:have(t)>=need,progress:Math.min(have(t),need),need,rule:`${need} loại cây đạt bậc ${t} (${TIERS[t-1]} ô)`}))
   .concat(['gryffindor','hufflepuff','ravenclaw','slytherin'].map(h=>({key:`hagrid-cup-${h}`,label:`Khung Cúp Nhà ${h[0].toUpperCase()+h.slice(1)}`,kind:'cup',house:h,unlocked:h==='ravenclaw',progress:h==='ravenclaw'?1:0,need:1,rule:'Nhà thắng Cúp Nhà một tuần, con góp từ 20 điểm'})))
   .concat(garden.progression.level>=160?[{key:'hagrid-cup-tan-suc',label:'Khung Cúp Tận Sức',kind:'cup',unlocked:false,progress:0,need:1,rule:'Nhà con thắng Hạng Tận Sức một tuần, con góp từ 20 điểm'}]:[])
   .concat(garden.progression.level>=160?[{key:'hagrid-tan-suc',label:'Khung Thợ vườn Tận Sức',kind:'challenge',unlocked:challengeOf(garden).marks>=30,progress:Math.min(challengeOf(garden).marks,30),need:30,rule:'30 dấu thử thách từ đơn khó',stars:challengeOf(garden).won.length}]:[]);
 }
 function setFrame(c){const f=frameViews().find(x=>x.key===c.frameKey);if(c.frameKey!==null&&!f?.unlocked)fail('frame-locked','Con chưa đạt khung này.');wornFrame=c.frameKey;return clone({ok:true,worn:wornFrame,frames:frameViews()});}
 function sales(c){
  const view=()=>clone({config:salesConfig,store:catalog,market:{defaults:{level:25,dailyCap:30000,perCropDaily:100},prices:Object.fromEntries(E.DB.crops.map(c=>[c.id,10])),crops:E.DB.crops},percentMax:40,scopes:['all','crop','creature','festival','items'],items:catalog.filter(i=>i.kind==='premium'||i.kind==='spring'||i.kind==='nest').map(i=>({id:i.id,label:i.label,price:i.price})),
   programs:[['golden-hour','Giờ vàng 20:00–22:00 · −20% vật phẩm cây'],['creature-weekend','Cuối tuần sinh vật · −25% vật phẩm sinh vật và Ổ ấm'],['flash','Flash 30 phút · 1–2 lần/tuần · −30% Mưa suối thần, Tiệc chuồng'],['festival-end','Ba ngày cuối lễ hội · −25% đồ lễ hội']].map(([id,label])=>({id,label,on:salesConfig.programs[id]})),
   flash:[{startsAt:Date.parse('2026-10-24T19:30:00+07:00'),endsAt:Date.parse('2026-10-24T20:00:00+07:00')}],serverNow:now()});
  if(c.mode==='get')return view();
  if(c.mode==='fire'&&visitRows.some(v=>v.username===c.username)){const row=visitRows.find(v=>v.username===c.username);row.fire=c.fire==='off'?null:c.fire;row.fireUntil=c.fire==='off'?null:now()+c.minutes*60000;if(c.fire==='real')row.growing=0;return {ok:true,fire:{fire:c.fire,minutes:c.minutes||0,burned:c.fire==='real'?6:0,to:row.uid,toUsername:row.username,until:row.fireUntil}};}
  if(c.mode==='fire'){fire=c.fire==='off'?null:{mode:c.fire,since:now(),until:now()+c.minutes*60000,burned:0};return {ok:true,fire:{fire:c.fire,minutes:c.minutes||0,burned:0,to:'garden-fixture-member',toUsername:c.username,until:fire?.until??null}};}
  if(c.mode==='gift'){const item=catalog.find(i=>i.id===c.itemId);if(!item)fail('item-missing','Chưa chọn món.');return {ok:true,gift:{quantity:c.quantity,label:item.label,toUsername:c.username}};}
  if(c.expectedRevision!==salesConfig.revision)fail('sales-revision','Cấu hình sale vừa đổi ở nơi khác; hãy tải lại.');
  if(c.sales.some(x=>!(x.percent>=1&&x.percent<=40)))fail('invalid-sales','Mức giảm 1–40%.');
  salesConfig={revision:salesConfig.revision+1,programs:{...c.programs},sales:clone(c.sales),items:clone(c.items||{}),market:clone(c.market||{prices:{}})};return {ok:true,...view()};
 }
 // ?missions=1 (audit S4, 01/11/2026): static copies of the server's missionsView and dayEventView
 // (HPVNN garden-mission-core / garden-day-event-core) so the «Nhiệm vụ» letter can be measured.
 function missionViews(){
  const task=(id,label,n,boost,state)=>({id,label:state==="hidden"?"???":label,target:n,current:state==="claimed"?n:state==="open"?Math.ceil(n/2):0,claimed:state==="claimed",open:state==="open",claimable:false,reward:{boost,label:`+${boost} Nước phép`}});
  return {
   missions:{current:{id:"c-mandrake",level:23,title:"Nhân sâm",chapter:true,open:true,claimable:false,reward:{boost:4,spring:2,label:"+2 Nước suối thần, +4 Nước phép"},
     steps:[{label:"Mở Thửa 5",current:1,target:1,done:true},{label:"Gieo 9 ô Nhân sâm",current:4,target:9,done:false},{label:"Giao 20 Bạch tiễn",current:12,target:20,done:false}]},
    upcoming:[{id:"c-niffler",level:26,title:"Đào mỏ tinh nghịch",chapter:true,reward:{label:"+2 Nước suối thần, +5 Nước phép, Vòm dây leo"}},{id:"c-clover",level:28,title:"Đồng cỏ ba lá",chapter:true,reward:{label:"+3 Nước suối thần, +5 Nước phép, +30 Nước"}}],
    claimedCount:33,totalCount:60,backlog:null},
   dayEvent:{id:"hpvn_2m_2026",title:"Mừng HPVN 3 tháng — Hội Vận động cho Quyền lợi Gia tinh",icon:"🧦",endsAt:Date.parse("2026-11-02T12:00:00+07:00"),
    tasks:[task("g1","Gieo 12 ô",12,2,"claimed"),task("g2","Gặt 9 Bí ngô",9,2,"claimed"),task("g3","Ca đêm gia tinh: gặt 12 cây từ 19:00 tới 06:00",12,3,"open"),task("g4","",2,2,"hidden"),task("g5","",22,3,"hidden"),task("g6","",1,3,"hidden"),task("g7","",22,5,"hidden")],
    finale:{ready:false,claimed:false}},
  };
 }
 // Level-160 challenges E+F (HPVNN garden-soil-core soilView / weatherView). QA: from 160 plot 1 is tired (75%) after
 // three vụ of thảo dược (server CROP_FAMILY 'thao'); ?weather=frost|rain|drought runs that week from 200
 // (frost-soon etc.: announced, starting in 26 hours).
 const THAO=["dittany","moonherb","valerian","mint","knotgrass"];
 const weatherStart=weather?now()+(weather.endsWith("-soon")?26*3600000:-30*3600000):0;
 function soilViews(){
  const p=garden.progression;
  return {
   soil:p.level>=160?p.plots.map((_,i)=>i===0?{tired:0.75,seeds:Object.fromEntries(THAO.filter(id=>E.CROP[id].level<=p.level).map(id=>[id,0.75]))}:{tired:1,seeds:{}}):null,
   weather:weather&&p.level>=200?{type:weather.replace("-soon",""),start:weatherStart,end:weatherStart+7*86400000,announced:weatherStart-2*86400000}:null,
  };
 }
 // ?duty=1: a calm duty view (server dutyView) so the duty chip shows next to the weather chip; the owl note already seen.
 function dutyQaView(){
  return {level:130,on:true,since:now()-86400000,leave:null,leaveLeftMs:7*86400000,leaveDays:7,wilted:[],dead:[],gnomes:[],sick:[],fled:[],
   clocks:{wilt:now()+5*3600000,dies:null,gnome:now()+20*3600000,sick:null,forest:null,fire:null},curePrice:garden.progression.level*10,lureMeals:2,owlDay:vnDayKey(now())};
 }
 // Pond tiers come from the built pond_1..3; lots = the tier's capacityAfter, beds 2 at tier 1 and 4 from tier 2.
 function pondTierOf(p){return E.POND_EXPANSIONS.filter(e=>p.built.includes(e.id)).length;}
 function syncPondSize(g){
  const tier=pondTierOf(g.progression),lots=tier?E.POND_EXPANSIONS[tier-1].capacityAfter:0,beds=[0,4,7,10][Math.min(tier,3)];
  while(g.pond.lots.length<lots)g.pond.lots.push(null);
  while(g.pond.beds.length<beds)g.pond.beds.push([null,null,null]);
 }
 // Phase 3 (simplified): edge {step, unlockLevel}; orchard null before edge_3, else six pits (empty / growing / ripe mix).
 function edgeView(){const p=garden.progression;return p.level<260?null:{step:['edge_1','edge_2','edge_3'].filter(id=>p.built.includes(id)).length,unlockLevel:260};}
 function orchardView(){
  if(!garden.progression.built.includes('edge_3'))return null;
  const t=now(),H=3600000,rows=[['apple',-60000],['pear',30*H],null,['plum',-60000],['apple',70*H],null];
  return {trees:rows.map(r=>r&&{kind:r[0],readyAt:t+r[1],ripe:r[1]<=0})};
 }
 function pondView(){
  const p=garden.progression;if(p.level<130)return null;
  syncPondSize(garden);
  const tier=pondTierOf(p),pd=garden.pond,t=now(),ripe=x=>x?{...x,ripe:x.readyAt<=t}:null;
  return {unlockLevel:130,tier,footprint:E.POND_EXPANSIONS[Math.max(0,tier-1)].footprint,lots:pd.lots.map(ripe),beds:pd.beds.map(b=>b.map(ripe)),
   bedCrops:["silverkelp","gillyweed","fluxweed"],murky:Boolean(pd.murkySince),murkySince:pd.murkySince,
   fry:{carp:garden.supplies.fryCarp||0,goldfish:garden.supplies.fryGoldfish||0},
   cast:{today:pd.castDay===dayKey(),token:pd.token&&pd.token.expiresAt>t?pd.token:null},creatureSpots:tier?2:0};
 }
 // Server pond actions (stock, net, plant, harvest, clean, castStart, cast); receipt.pond. Fish grow at half speed while murky.
 const BED_CROPS=["silverkelp","gillyweed","fluxweed"];
 function pondAct(c,next,extra){
  const p=next.progression,pd=next.pond,s=next.supplies,t=now(),scale=growthScale(p.level),out={kind:c.kind};
  if(p.level<130||!pondTierOf(p))fail("pond-not-built","Chưa đào ao.");
  syncPondSize(next);
  const add=(items,id,n)=>{items[id]=(items[id]||0)+n;p.inventory[id]=(p.inventory[id]||0)+n;};
  switch(c.kind){
   case "stock":{
    const key={carp:"fryCarp",goldfish:"fryGoldfish"}[c.fry];
    if(!key||!Number.isInteger(c.lot)||c.lot<0||c.lot>=pd.lots.length)fail("invalid-action-input","Ô ao hoặc cá giống không hợp lệ.");
    if(pd.lots[c.lot])fail("lot-busy","Ô ao này đang có cá.");
    if(!(s[key]>0))fail("missing-supply","Hết cá giống.",{resource:key,required:1});
    s[key]-=1;pd.lots[c.lot]={fry:c.fry,readyAt:t+Math.round((c.fry==="carp"?4:8)*3600000*scale*(pd.murkySince?2:1))};break;}
   case "net":{const items={};pd.lots=pd.lots.map(l=>{if(!l||l.readyAt>t)return l;add(items,l.fry==="carp"?"fish":"goldfish",l.fry==="carp"?3:1);return null;});
    if(!Object.keys(items).length)fail("action-noop","Chưa có ô ao nào chín.");out.items=items;break;}
   case "plant":{
    const bed=pd.beds[c.bed],crop=E.CROP[c.species],cells=[...new Set(c.cells||[])];
    if(!bed||!BED_CROPS.includes(c.species)||crop.level>p.level)fail("invalid-action-input","Luống hoặc cây không hợp lệ.");
    if(!cells.length||cells.some(i=>!Number.isInteger(i)||i<0||i>2||bed[i]))fail("invalid-action-input","Ô luống không trống.");
    if((s.seeds[c.species]||0)<cells.length||s.water<cells.length)fail("missing-supply","Thiếu hạt hoặc nước.",{resource:`seeds.${c.species}`,required:cells.length});
    s.seeds[c.species]-=cells.length;s.water-=cells.length;for(const i of cells)bed[i]={species:c.species,readyAt:t+Math.round(crop.growMs*scale)};break;}
   case "harvest":{const items={};for(const bed of pd.beds)bed.forEach((x,i)=>{if(x&&x.readyAt<=t){add(items,x.species,E.CROP[x.species].yieldPerCell);bed[i]=null;}});
    if(!Object.keys(items).length)fail("action-noop","Chưa có ô luống nào chín.");out.items=items;break;}
   case "clean":if(!pd.murkySince)fail("action-noop","Nước hồ đang trong.");pd.murkySince=null;break;
   case "castStart":
    if(pd.castDay===dayKey())fail("cast-done","Hôm nay đã câu cá.");
    if(pd.token&&pd.token.expiresAt>t)fail("cast-running","Cần câu đang thả.",{token:pd.token});
    pd.token={at:t,periodMs:1600,zone:[0.3,0.7],sweet:[0.45,0.55],expiresAt:t+60000};out.token=pd.token;break;
   case "cast":{
    const tok=pd.token,tap=Number(c.tapMs);
    if(!tok)fail("no-cast","Chưa thả cần.");
    if(!Number.isFinite(tap)||tap<0)fail("invalid-action-input","tapMs không hợp lệ.");
    const phase=(tap%tok.periodMs)/tok.periodMs,pos=phase<0.5?2*phase:2-2*phase,inside=([a,b])=>pos>=a&&pos<=b;
    const result=tap>60000?"miss":inside(tok.sweet)?"goldfish":inside(tok.zone)?"fish":"miss",items={};
    add(items,result==="goldfish"?"goldfish":"fish",result==="fish"?3:1);
    pd.token=null;pd.castDay=dayKey();Object.assign(out,{result,items,pos});break;}
   default:fail("invalid-action-input","Lệnh hồ không hợp lệ.",{kind:c.kind});
  }
  p.revision+=1;extra.pond=out;
 }
 function retentionViews(d){
  const p=garden.progression,m=garden.mastery||{},tier=n=>TIERS.filter(t=>n>=t).length,house=p.level>=20?"hufflepuff":null;
  return {
   mastery:{tiers:TIERS,titles:["Tập sự","Thạo nghề","Bậc thầy"],rewards:[1,2,3],crops:E.DB.crops.filter(c=>c.level<=p.level).map(c=>({cropId:c.id,cells:m[c.id]||0,tier:tier(m[c.id]||0)})),mastered:Object.values(m).filter(n=>n>=1350).length,total:E.DB.crops.length},
   orders:{unlockLevel:15,orders:clone(ordersFor(d)),...challengeViews(d)},
   houseCup:{unlockLevel:20,weekKey:"2026-10-19",house,houseLabel:house?"Hufflepuff":null,points:garden.cup.points,today:d.cup||0,dailyCap:60,rewardMin:20,rules:{harvest:1,quest:3,order:10},endsAt:Date.parse("2026-10-26T00:00:00+07:00"),
    board:[{house:"gryffindor",label:"Gryffindor",points:412},{house:"hufflepuff",label:"Hufflepuff",points:388+garden.cup.points},{house:"ravenclaw",label:"Ravenclaw",points:301},{house:"slytherin",label:"Slytherin",points:276}],
    lastWeek:[{house:"ravenclaw",label:"Ravenclaw",points:1204},{house:"gryffindor",label:"Gryffindor",points:1150},{house:"slytherin",label:"Slytherin",points:990},{house:"hufflepuff",label:"Hufflepuff",points:870}],
    // Level 160+ «Hạng Tận Sức» (server cupView tanSuc): the same points of members from 160, its own board.
    ...(p.level>=160?{tanSuc:{unlockLevel:160,points:garden.cup.tanSuc||0,wins:0,
     board:[{house:"hufflepuff",label:"Hufflepuff",points:96+(garden.cup.tanSuc||0)},{house:"slytherin",label:"Slytherin",points:74},{house:"gryffindor",label:"Gryffindor",points:40},{house:"ravenclaw",label:"Ravenclaw",points:0}],
     lastWeek:[{house:"slytherin",label:"Slytherin",points:210},{house:"hufflepuff",label:"Hufflepuff",points:185},{house:"gryffindor",label:"Gryffindor",points:60},{house:"ravenclaw",label:"Ravenclaw",points:12}]}}:{})},
   // Server garden-mood-core moodView (QA approximation: fixed moods; from 160 a món thích per species and day).
   mood:moodViews(d),
  };
 }
 function moodViews(d){
  const p=garden.progression,hash=t=>[...t].reduce((h,c)=>(h*31+c.charCodeAt(0))>>>0,7);
  const favourite=sp=>{const crops=[...new Set(E.DB.recipes.filter(r=>r.output===E.CREATURE[sp].feed&&r.level<=p.level).flatMap(r=>Object.keys(r.inputs)).filter(id=>E.CROP[id]&&E.CROP[id].level<=p.level))];return crops.length?crops[hash(d.dayKey+sp)%crops.length]:null;};
  return {creatures:Object.fromEntries(p.creatures.map((c,i)=>[c.species,{mood:p.level>=160?(i?79:92):85,done:[],lessons:0,lessonToday:false,coat:0,roamUntil:null,
    ...(p.level>=160?{favourite:favourite(c.species),favMeal:i===0}:{})}])),
   nextCycleAt:now()+3600000,roamsLeft:2,norbert:null,happy:80,winter:false,...(p.level>=160?{favouriteGain:10}:{}),crupCheered:false};
 }
 // Server garden-challenge-core (level 160+, QA approximation: a fixed hard order per day, ×stars; milestone from 200).
 const MILESTONES=[200,250,300,350,400,450],GOALS=['duty','mood','marks'],GOAL_TARGET={duty:7,mood:3,marks:10},goalOf=l=>GOALS[MILESTONES.indexOf(l)%3];
 const challengeOf=g=>(g.challenge??={marks:g.progression.level>=160?12:0,day:null,hard:null,run:null,won:[],lost:null});
 function hardBase(){
  const p=garden.progression,band=E.DB.crops.filter(c=>c.level<=p.level).slice(-8),recipe=E.DB.recipes.filter(r=>r.level<=p.level).at(-1),adult=p.creatures.find(x=>x.mealsCompleted>=E.CREATURE[x.species].mealsToAdult);
  return {[band.at(-1).id]:12,[band.at(-3).id]:9,...(recipe?{[recipe.output]:6}:{}),...(adult?{[`produce_${adult.species}`]:2}:{})};
 }
 const hardTerms=(base,stars)=>{const items=Object.fromEntries(Object.entries(base).map(([id,n])=>[id,n*stars]));return {stars,items,xp:Math.floor(Object.entries(items).reduce((t,[id,n])=>t+n*(E.CROP[id]?E.CROP[id].harvestXP/(E.CROP[id].yieldPerCell||1):60),0)),cup:[20,30,40][stars-1],marks:stars};};
 function challengeViews(d){
  const p=garden.progression;if(p.level<160)return {};
  const ch=challengeOf(garden),t=now();
  if(ch.hard&&ch.hard.deadline<=t)ch.hard=null;
  const hard={unlockLevel:160,marks:ch.marks,frameMarks:30,hours:48,open:ch.hard?{...clone(ch.hard),marks:ch.hard.stars}:null,offer:!ch.hard&&ch.day!==d.dayKey?{id:`hard-${d.dayKey}`,tiers:[1,2,3].map(s=>hardTerms(hardBase(),s))}:null};
  if(p.level<200)return {hard};
  const next=MILESTONES.find(m=>m<=p.level&&!ch.won.includes(m));
  const milestone=ch.run?{state:'running',level:ch.run.level,goal:ch.run.goal,startedAt:ch.run.startedAt,progress:ch.run.goal==='marks'?Math.min(10,ch.marks-ch.run.marksAt):Math.min(GOAL_TARGET[ch.run.goal],Math.floor((t-ch.run.startedAt)/86400000)),target:GOAL_TARGET[ch.run.goal],endsAt:ch.run.startedAt+7*86400000,daysLeft:Math.ceil((ch.run.startedAt+7*86400000-t)/86400000),onLeave:false,won:[...ch.won]}
   :next?{state:'ready',level:next,goal:goalOf(next),target:GOAL_TARGET[goalOf(next)],days:7,retryAt:null,won:[...ch.won]}:{state:'wait',level:MILESTONES.find(m=>m>p.level)??null,goal:null,won:[...ch.won]};
  return {hard,milestone};
 }
 function challenge(c,next,d,extra){
  const p=next.progression;if(p.level<160)fail('challenge-locked','Từ cấp 160 bác Hagrid mới giao thử thách.');
  const ch=challengeOf(next),t=now();
  if(c.kind==='accept'){
   if(![1,2,3].includes(c.stars))fail('invalid-action-input','Chọn từ 1 đến 3 sao.');
   if(ch.hard)fail('hard-open','Con đang nhận một đơn khó rồi.');if(ch.day===d.dayKey)fail('hard-taken','Hôm nay con đã nhận đơn khó rồi.');
   const terms=hardTerms(hardBase(),c.stars);ch.hard={id:`hard-${d.dayKey}`,stars:c.stars,items:terms.items,xp:terms.xp,cup:terms.cup,acceptedAt:t,deadline:t+48*3600000};ch.day=d.dayKey;extra.challenge={kind:'accept',stars:c.stars};
  }else if(c.kind==='deliver'){
   const h=ch.hard;if(!h)fail('unknown-order','Không có đơn khó nào đang mở.');
   const inv=p.inventory;if(Object.entries(h.items).some(([id,n])=>(inv[id]||0)<n))fail('missing-crops','Kho chưa đủ hàng cho đơn này.');
   for(const[id,n]of Object.entries(h.items))inv[id]-=n;
   p.xp+=h.xp;p.level=E.DB.levels.filter(r=>r.totalXP<=p.xp).at(-1).level;ch.marks+=h.stars;ch.hard=null;
   const add=Math.min(h.cup,60-(d.cup||0));d.cup=(d.cup||0)+add;next.cup.points+=add;if(p.level>=160)next.cup.tanSuc=(next.cup.tanSuc||0)+add;extra.challenge={kind:'deliver',xp:h.xp,cup:h.cup,marks:h.stars};extra.cupPoints=add;
  }else if(c.kind==='start'){
   const level=MILESTONES.find(m=>m<=p.level&&!ch.won.includes(m));if(ch.run)fail('challenge-running','Thử thách mốc đang chạy.');if(!level)fail('challenge-locked','Chưa tới mốc.');
   ch.run={level,goal:goalOf(level),startedAt:t,marksAt:ch.marks,streakDay:null,streak:0};extra.challenge={kind:'start',level};
  }else fail('invalid-action-input','Lệnh thử thách không hợp lệ.');
  p.revision+=1;
 }
 function deliver(c,next,d){
  const order=ordersFor(d).find(o=>o.id===c.orderId);if(!order)fail("unknown-order","Không tìm thấy đơn hàng này hôm nay.");if(order.delivered)fail("already-claimed","Đơn hàng này đã giao rồi.");
  const inv=next.progression.inventory;if(Object.entries(order.items).some(([id,n])=>(inv[id]||0)<n))fail("missing-crops","Kho chưa đủ hàng cho đơn này.");
  for(const[id,n]of Object.entries(order.items))inv[id]-=n;
  const p=next.progression;p.xp+=order.xp;p.level=E.DB.levels.filter(r=>r.totalXP<=p.xp).at(-1).level;next.supplies.boost+=1;order.delivered=true;p.revision+=1;
  if(p.level>=20){const add=Math.min(10,60-(d.cup||0));d.cup=(d.cup||0)+add;next.cup.points+=add;if(p.level>=160)next.cup.tanSuc=(next.cup.tanSuc||0)+add;}
 }
 function usePremium(c,next,d){
  const entry=STORE_CATALOG.find(i=>i.id===c.itemId&&i.kind==="premium");if(!entry)fail("invalid-action-input","Vật phẩm này không dùng được.");
  const k=entry.supply,s=next.supplies,p=next.progression,t=now();d.premium??={rain:0,felix:0,primeMeal:0,feast:0,skeleGro:{}};
  if(!(s[k]>0))fail("missing-supply",`Không còn ${entry.label}.`);
  const cap=k==="rain"&&p.level>100?2:PREMIUM_CAPS[k],used=k==="skeleGro"?d.premium.skeleGro[c.species]||0:d.premium[k];
  if(used>=cap)fail("premium-limit",`Hôm nay đã dùng đủ ${cap} ${entry.label}; mai dùng tiếp nhé.`);
  const finish=m=>m&&m.readyAt>t?(shift(m,m.readyAt-t),true):false;
  if(k==="rain"){let q=p,n=0;p.plots.forEach((plot,i)=>{const cells=plot.slots.map((x,j)=>x?.type==="crop"?j:-1).filter(j=>j>=0);if(!cells.length)return;q=clone(q);for(const j of cells)q.plots[i].slots[j].plantedAt=Math.min(q.plots[i].slots[j].plantedAt,t-q.plots[i].slots[j].growMs);q=E.harvest(q,i,cells,Date.now());n++;});if(!n)fail("invalid-boost-target","Vườn chưa có cây nào.");next.progression=q;}
  else if(k==="felix"){if(next.premium.felix?.until>Date.now())fail("felix-active","Phúc Lạc Dược đang có hiệu lực.");next.premium.felix={until:Date.now()+7200000,bonusLeft:Math.floor((E.DB.levels[p.level-1]?.xpToNext||0)/2)};}
  else if(k==="primeMeal"){if(!finish(p.creatures.find(x=>x.species===c.species)?.meal))fail("invalid-boost-target","Sinh vật này không có bữa đang ăn.");}
  else if(k==="feast"){if(!p.creatures.map(x=>finish(x.meal)).some(Boolean))fail("invalid-boost-target","Không có sinh vật nào đang ăn.");}
  else{const x=p.creatures.find(y=>y.species===c.species),cfg=E.CREATURE[c.species];if(!x||x.mealsCompleted>=cfg.mealsToAdult)fail("invalid-boost-target","Sinh vật này đã trưởng thành.");x.mealsCompleted=Math.min(cfg.mealsToAdult,x.mealsCompleted+3);}
  s[k]-=1;next.progression.revision=garden.progression.revision+1;
  if(k==="skeleGro")d.premium.skeleGro[c.species]=used+1;else d.premium[k]=used+1;
 }
 function act(c){
  if(typeof c.requestId!=="string"||!c.requestId||c.requestId.length>128)fail("invalid-request-id","Mã thao tác không hợp lệ.");
  const {requestId,...payload}=c,hash=stable(payload),seen=ops.get(requestId);
  if(seen){if(seen.hash!==hash)fail("request-id-conflict","Mã thao tác đã được dùng cho dữ liệu khác.");return response(seen.receipt);}
  // The read-only preview still claims, taps and arranges; farm work needs ?simulate=1.
  if(!simulate&&!DAILY.has(c.action)&&!["placeDecoration","moveBuilding","guideDone","setScene"].includes(c.action))fail("preview-read-only","Bản xem UI chỉ đọc · không ghi tài khoản.");
  const before=garden.progression;
  if(!["freeAction","guideDone","setScene"].includes(c.action)&&c.expectedRevision!==before.revision)fail("revision-conflict","Khu vườn đã thay đổi; hãy tải lại trước khi thao tác.",{expectedRevision:c.expectedRevision,actualRevision:before.revision});
  // Work on copies; nothing is kept unless every check passed (like the server transaction).
  const d=clone(daily()),next=clone(garden),extra={};
  if(["claimQuest","claimChest","claimFestival","claimBondGift","claimAchievement"].includes(c.action)){
   claim(c,next,d,extra);
   if(c.action==="claimQuest"||c.action==="claimChest")extra.festivalPoints=addPoints(d,next.festival,c.action==="claimQuest"?"questClaim":"dailyChest",{amount:c.action==="claimChest"?extra.reward.eventPoints:null});
  }else if(c.action==="freeAction"){
   if(!FREE_TAPS.has(c.kind))fail("invalid-action-input","Thao tác miễn phí không hợp lệ.",{kind:c.kind});
   if(c.kind==="pet"&&(!before.creatures.length||(c.species&&!creatureOf(before,c.species))))fail("no-creature","Chưa có sinh vật để vuốt ve.");
   extra.freeAction=countFree(d,c.kind);
   if(extra.freeAction.counted)for(const q of d.bonusQuests)if(!q.claimed&&q.triggers.includes(c.kind))q.progress=Math.min(q.target,q.progress+1);
   extra.festivalPoints=addPoints(d,next.festival,c.kind,{counted:extra.freeAction.counted});
   // Bonding has its own cap (3 pets per creature a day), apart from the free-tap cap.
   if(c.kind==="pet"&&c.species)extra.bonding=[addBond(next,before,c.species,"pet",d.dayKey)];
   // Server petMeal: a counted pet takes a quarter off the meal that creature is eating.
   const meal=c.kind==="pet"&&c.species&&extra.freeAction.counted?next.progression.creatures.find(x=>x.species===c.species)?.meal:null;
   if(meal&&meal.readyAt>now()){shift(meal,Math.floor((meal.readyAt-meal.startedAt)*SPEED_SHARE));next.progression.revision+=1;extra.mealSped=c.species;}
  }else if(c.action==="boost")boost(c,next);
  else if(c.action==="usePremium")usePremium(c,next,d);
  else if(c.action==="deliverOrder")deliver(c,next,d);
  else if(c.action==="challenge")challenge(c,next,d,extra);
  else if(c.action==="tutorialGrow")tutorialGrow(c,next);
  // Server applyGuideDone: a finished «Sổ tay» lesson, no revision, reward or points.
  else if(c.action==="guideDone"){
   if(typeof c.lessonId!=="string"||!/^[a-z0-9-]{1,32}$/.test(c.lessonId))fail("invalid-action-input","lessonId không hợp lệ.");
   next.tutorial.guide??=[];
   if(next.tutorial.guide.includes(c.lessonId))fail("action-noop","Bài hướng dẫn này đã xong.");
   next.tutorial.guide.push(c.lessonId);
  }
  // Server setScene (garden-scene.js): the owner's «Khung cảnh» in decorations.scene, no revision or points.
  else if(c.action==="setScene"){
   const s=c.scene,ok=(ids,v)=>ids.some(x=>x.id===v);
   if(!s||Object.keys(s).length!==3||!ok(WEATHER_MODES,s.weather)||!ok(ATMOSPHERE_MODES,s.atmosphere)||!ok(HOGWARTS_EVENTS,s.event))fail("invalid-action-input","Khung cảnh không hợp lệ.");
   next.decorations.scene={weather:s.weather,atmosphere:s.atmosphere,event:s.event};
  }
  else if(c.action==="care"){if(!LINES.some(r=>c.cells?.length===3&&r.every(i=>c.cells.includes(i))))fail("invalid-action-input","Chăm cây cho một hàng, cột hoặc đường chéo đủ ba ô.");if((d.free.care||0)>=FREE_CAPS.care)fail("care-limit",`Hôm nay đã chăm đủ ${FREE_CAPS.care} lượt; mai bác Hagrid lại nhờ nhé.`);care(c,next);}
  else if(c.action==="placeDecoration")place(c,next);
  else if(c.action==="pond")pondAct(c,next,extra);
  else if(c.action==="setDefaultDecorationVisibility"){const visible=applyDefaultDecorationVisibility(next,c);next.decorations=visible.decorations;next.progression=visible.progression;}
  else{
   next.progression=model(c,before,Date.now());
   if(next.progression.revision!==before.revision+1)fail("action-noop","Lệnh khu vườn không tạo thay đổi mới.");
   if(c.action==="plant"||c.action==="replant"){
    plantSupplies(before,next.progression,next.supplies);
    // Server growthScale: faster below level 15, half time from 15 on.
    const scale=growthScale(before.level);
    next.progression.plots.forEach((plot,p)=>plot.slots.forEach((s,i)=>{if(s?.type==="crop"&&!before.plots[p]?.slots[i])s.plantedAt-=Math.round(s.growMs*(1-scale));}));
   }
   // Server speedNewTimers: meals, timed crafts and buildings started below level 20 finish sooner.
   const sc=growthScale(before.level);
   if(sc<1){
    const shift=t=>{const cut=Math.round((t.readyAt-t.startedAt)*(1-sc));t.startedAt-=cut;t.readyAt-=cut;};
    const meals=new Set(before.creatures.map(x=>x.meal?.id).filter(Boolean)),jobs=new Set(before.jobs.map(j=>j.id)),builds=new Set(before.construction.map(j=>j.id));
    for(const x of next.progression.creatures)if(x.meal&&!meals.has(x.meal.id))shift(x.meal);
    for(const j of next.progression.jobs)if(!jobs.has(j.id))shift(j);
    for(const j of next.progression.construction)if(!builds.has(j.id))shift(j);
   }
   // Server gift: +1 nước phép per level reached up to 19.
   next.supplies.boost+=Math.max(0,Math.min(next.progression.level,19)-before.level);
   for(const [type,amount] of questAmounts(c.action,before,next.progression,c))for(const q of d.quests)if(!q.claimed&&q.triggers.includes(type))q.progress=Math.min(q.target,q.progress+amount);
   const bonded=bondTriggers(c.action,before,next.progression);
   if(bonded.length)extra.bonding=bonded.map(sp=>addBond(next,before,sp,c.action,d.dayKey));
  }
  if(!DAILY.has(c.action)){
   // Moving a plot/pen and placing a decoration are free taps (placing counts as rotate); the rest is farm work.
   const free={moveBuilding:"moveBuilding",placeDecoration:"rotate",care:"care"}[c.action];
   if(free){extra.freeAction=countFree(d,free);extra.festivalPoints=addPoints(d,next.festival,free,{counted:extra.freeAction.counted});}
   else if(!["tutorialGrow","guideDone","setScene","pond"].includes(c.action))extra.festivalPoints=addPoints(d,next.festival,c.action);
  }
  // Galleons last, so a short wallet leaves garden, daily record and wallet untouched.
  const cost=c.action==="build"?E.DB.expansions.find(e=>e.id===c.expansionId)?.galleons||0:c.action==="buyDecoration"?E.DB.decorations.find(e=>e.level===c.level)?.galleons||0:0;
  if(cost){charge(cost,requestId);Object.assign(extra,{galleons:cost,balance:wallet.spendable});}
  Object.assign(garden,next);dailies.set(d.dayKey,d);
  const receipt={...extra,action:c.action,requestId,expectedRevision:before.revision,revision:garden.progression.revision,committedAt:now()};
  ops.set(requestId,{hash,receipt});
  return response(receipt);
 }
 function buy(c){
  const seen=ops.get(c.requestId);
  if(seen)return response(seen.receipt);
  const entry=catalog.find(i=>i.id===c.itemId);
  if(!entry)fail("unknown-item","Không tìm thấy mặt hàng.");
  if(entry.forSale===false)fail("not-for-sale","Món này đang chờ duyệt giá.");
  const qty=Math.max(1,Number(c.quantity)||1),cost=packTotal(entry,qty);
  if(c.expectedTotal!==cost)fail("price-changed","Giá đã thay đổi.");
  if(wallet.spendable<cost)fail("insufficient-balance","Chưa đủ Galleons trong ví thử nghiệm.",{required:cost});
  if(!entry.overflowMultiplier&&(entry.dailyRemaining??entry.dailyLimit)<qty)fail("daily-cap","Đã hết hạn mức mua trong ngày.");
  wallet.spendable-=cost;wallet.balance=Math.max(0,wallet.balance-cost);entry.dailyRemaining=Math.max(0,(entry.dailyRemaining??entry.dailyLimit)-qty);
  const s=garden.supplies,inv=garden.progression.inventory;
  if(entry.kind==="seed"){const id=entry.cropId||entry.id.replace(/^seed_/,"");s.seeds[id]=(s.seeds[id]||0)+entry.quantity*qty;}
  else if(entry.kind==="water")s.water+=entry.quantity*qty;
  else if(entry.kind==="boost")s.boost+=entry.quantity*qty;
  else if(entry.supply){if((s[entry.supply]||0)+qty>entry.stockCap)fail("stock-cap",`Kho chỉ chứa tối đa ${entry.stockCap} ${entry.label}.`);s[entry.supply]=(s[entry.supply]||0)+entry.quantity*qty;}
  else if(entry.kind==="nest"){garden.premium.nests.push(entry.pen);entry.owned=true;}
  else if(entry.kind==="food"){const id=entry.inventoryId||entry.id;inv[id]=(inv[id]||0)+entry.quantity*qty;}
  else if(entry.kind==="decoration"&&!garden.decorations.owned.includes(entry.id))garden.decorations.owned.push(entry.id);
  const receipt={itemId:entry.id,quantity:qty,total:cost,requestId:c.requestId};
  ops.set(c.requestId,{receipt});
  return response(receipt);
 }
 return {
  handle(name,data){
   if(name==="getHagridGarden")return response();
   if(name==="performHagridGardenAction")return act(clone(data));
   if(name==="buyHagridGardenSupplies")return buy(clone(data));
   if(name==="setHagridFlooFrame")return setFrame(clone(data));
   if(name==="manageHagridGardenSales")return sales(clone(data));
   if(name==="extinguishHagridGarden"){
    const row=data?.hostUid?visitRows.find(v=>v.uid===data.hostUid):null,until=row?(row.fireUntil??=now()+26*3600000):fire?.until;
    if(!until||until<=now()||(row&&!row.fire))fail("no-fire","Khu vườn này không còn cháy.");
    const price=Math.min(500,Math.max(1,Math.ceil((until-now())/3600000))*10);
    if(price>data.expectedPrice)fail("price-changed",`Giá chữa cháy giờ là ${price} G.`);
    if(wallet.spendable<price)fail("insufficient-balance","Số dư Galleons không đủ.");
    wallet.spendable-=price;wallet.balance=Math.max(0,wallet.balance-price);
    if(row)row.fire=null;else fire=null;
    return clone({ok:true,price,hostUid:data.hostUid||"garden-fixture-member",balance:wallet.spendable});
   }
   if(name==="visitHagridGarden"){
    if(!data?.hostUid)return clone({helpsLeft,visitLevel:10,visits:visitRows});
    const row=visitRows.find(v=>v.uid===data.hostUid);if(!row)fail("visit-not-found","Thành viên này chưa có khu vườn.");
    if(data.help){if(row.helped)fail("already-helped","Hôm nay bạn đã chăm giúp vườn này rồi.");if(!row.growing)fail("nothing-to-help","Vườn này chưa có cây đang lớn để chăm giúp.");row.helped=true;helpsLeft-=1;garden.supplies.water+=6;}
    const visit={uid:row.uid,username:row.username,level:row.level,progression:clone(garden.progression),decorations:{...clone(garden.decorations),scene:row.scene},helped:row.helped,hostHelpsLeft:10,fire:row.fire?{mode:row.fire,since:now(),until:(row.fireUntil??=now()+26*3600000),burned:row.fire==='real'?9:0}:null};
    return clone({...(data.help?{ok:true,reward:{water:6,label:'+6 Nước'}}:{}),helpsLeft,visitLevel:10,visit});
   }
   fail("unknown-callable","Không có lệnh này.");
  },
  ledger,
 };
}

// The page side: the real garden client over the in-memory server above.
export function createEmulatorClient(){
 const query=new URLSearchParams(globalThis.location?.search||"");
 const server=createFixtureServer({level:Number(query.get("level")||100),scenario:query.get("scenario")||"empty",simulate:query.get("simulate")==="1",day:query.get("day"),quests:query.get("quests"),points:Number(query.get("points"))||0,galleons:query.has("galleons")?Number(query.get("galleons")):null,previewHalloween:query.get("halloweenPreview")==="1",fireMode:["visual","real"].includes(query.get("fire"))?query.get("fire"):null,helpers:query.get("helpers")==="1",missions:query.get("missions")==="1",
  weather:/^(frost|rain|drought)(-soon)?$/.test(query.get("weather")||"")?query.get("weather"):null,duty:query.get("duty")==="1",murky:query.get("murky")==="1"});
 let actions=0;
 const client=createGardenClient(async(name,data)=>{
  const result=server.handle(name,data);
  const badge=globalThis.document?.querySelector(".emulator-badge");
  if(name==="performHagridGardenAction"&&badge){actions++;badge.textContent="MÔ PHỎNG · "+actions+" thao tác, không lưu";badge.dataset.command=JSON.stringify(data);badge.dataset.actions=actions;}
  return result;
 });
 client.isPreview=true;
 return client;
}
