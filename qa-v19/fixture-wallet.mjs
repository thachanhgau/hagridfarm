import * as E from "../garden-v05/progression-engine.mjs";
import {unlockedCatalog,CATALOG_VERSION} from "../garden-v05/garden-store-catalog.mjs?v=24.9.38";
import {createGardenClient} from "../garden-v05/garden-emulator-client.mjs?v=24.9.38";
import {pickDailyQuests,questAmounts} from "../garden-v05/garden-quests.mjs?v=24.9.38";
import {vnDayKey,festivalStatus,festivalMilestone,CREATURE_AFFINITY_LEVELS,affinityLevelForXp,HOGWARTS_EVENTS,FESTIVAL_ACTION_POINTS,FESTIVAL_FARM_POINTS_PER_DAY,FESTIVAL_FREE_POINTS_PER_DAY} from "../garden-v05/garden-events.mjs?v=24.9.38";
import {applyGardenReward} from "../garden-v05/garden-storage.mjs";
import {KEEPER_ACHIEVEMENTS} from "../garden-v05/garden-achievements.mjs?v=24.9.38";

// In-memory stand-in for performHagridGardenAction (HPVNN functions/games/garden-action-handlers.js,
// garden-daily-core.js, garden-festival-core.js, garden-keeper-core.js): same commands, error reasons and response shapes.
// Day keys are Asia/Ho_Chi_Minh; a requestId replays its first receipt; builds check crops, then Galleons.
// scenario=new is a brand-new account (revision 0, starter supplies, tutorial not used): see HANDOFF-V24.9.md.
export const STARTER_SUPPLIES=Object.freeze({seeds:Object.freeze({pumpkin:3}),water:3,boost:0});
const FREE_CAPS=Object.freeze({rotate:3,pet:3,postcard:1,shareFloo:1,startTour:1,care:3,moveBuilding:1});
const FREE_TAPS=new Set(["care","pet","rotate","postcard","shareFloo","startTour"]);
const DAILY=new Set(["claimQuest","claimChest","claimFestival","freeAction","claimBondGift","claimAchievement"]);
const BOND_POINTS=Object.freeze({adopt:15,feed:20,claimAnimals:25,pet:12}),BOND_PETS_PER_DAY=3;
const CHEST_REWARD=Object.freeze({kind:"boost",amount:1,waterBonus:12,itemId:"boost",eventPoints:20,label:"Rương Cú Vàng: +1 Nước phép, +12 Nước, +20 điểm lễ hội"});
const clone=v=>structuredClone(v);
const fail=(reason,message,details={})=>{const e=Error(message);e.definitive=true;e.reason=reason;e.details={reason,...details};throw e;};
const stable=v=>JSON.stringify(v,Object.keys(v).sort());

/** `day` (YYYY-MM-DD) moves only the Vietnam calendar day, for festival QA; crop timers keep real time. */
export function createFixtureServer({level=100,scenario="empty",simulate=false,day=null,quests=null,points=0,galleons=null,now=()=>Date.now()}={}){
 const dayOffset=day?Date.parse(day+"T12:00:00+07:00")-now():0,dayKey=()=>vnDayKey(now()+dayOffset);
 const past=scenario.endsWith("ready"),origin=past?now()-26*3600000:now();
 const fresh=scenario==="new";
 let state=fresh?E.newGame(origin):E.testProfile(level,origin);
 if(["owned","feeding","animal-ready"].includes(scenario)){
  state=E.adopt(state,"puffskein",origin);
  if(scenario!=="owned")state=E.feed(state,"puffskein",origin);
 }
 if(["craft-busy","craft-ready"].includes(scenario))state=E.craft(state,"insects",1,origin);
 if(["build-busy","build-ready"].includes(scenario))state=E.build(state,"plot_12",origin);
 if(scenario==="missing")for(const id of Object.keys(state.inventory))state.inventory[id]=0;
 if(scenario==="prerequisite"){const base=E.newGame(origin);state.built=base.built;state.plots=base.plots;}
 // A lively showcase for the default preview: crops, adult and baby creatures, decorations.
 if(["empty","habitats"].includes(scenario)&&level>=10){
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
  if(level>=20)state.keepsakes={...state.keepsakes,puffskein:2,bowtruckle:1,niffler:3,...(level>=90?{kneazle:1,hippogriff:2,unicorn:1,dragon:1}:{})};
 }
 const catalog=unlockedCatalog(state.level).map(item=>({...item,dailyRemaining:item.dailyLimit}));
 const storeDecors=catalog.filter(i=>i.kind==="decoration").map(i=>i.id),full=scenario==="empty"&&level>=30;
 const spendable=galleons??2500,bankBalance=Math.min(1000,spendable);
 const garden={
  progression:state,
  supplies:fresh?{seeds:Object.fromEntries(E.DB.crops.map(c=>[c.id,STARTER_SUPPLIES.seeds[c.id]||0])),water:STARTER_SUPPLIES.water,boost:STARTER_SUPPLIES.boost}
   :{seeds:Object.fromEntries(E.DB.crops.map(c=>[c.id,c.level<=level?36:0])),water:213,boost:2},
  decorations:fresh?{owned:[],placements:[null,null,null,null,null,null],rotations:{}}:{owned:full?storeDecors:["decor_pumpkin_lantern"],placements:full?[...storeDecors,null,null,null,null,null,null].slice(0,6):["decor_pumpkin_lantern",null,null,null,null,null],
   rotations:full?{decor_pumpkin_lantern:"default",decor_broom_rack:"right",decor_cauldron:"default",decor_mandrake_planter:"right",decor_floating_candles:"default",decor_vine_arch:"right"}:{decor_pumpkin_lantern:"default"}},
  boostedCropIds:[],
  festival:{joinDay:dayKey(),pointsBySeason:{},claimedMilestones:[]},
  bonding:{bySpecies:{},claimedGifts:[]},
  achievements:{claimedIds:[]},
  tutorial:{grownAt:null},
 };
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
   if(quests==="done")for(const q of list)q.progress=q.target;
   dailies.set(key,{dayKey:key,streakDays:yesterday?yesterday.streakDays+1:1,quests:list,chestClaimed:false,free:{},farm:0,freeToday:0});
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
  const done=d.quests.filter(q=>q.progress>=q.target).length;
  return clone({
   uid:"garden-fixture-member",
   garden,wallet,catalog,catalogVersion:CATALOG_VERSION,dayKey:d.dayKey,
   daily:{dayKey:d.dayKey,streakDays:d.streakDays,quests:d.quests,chest:{claimed:d.chestClaimed,ready:!d.chestClaimed&&done>=3,reward:CHEST_REWARD},
    freeActions:Object.fromEntries(Object.entries(FREE_CAPS).map(([kind,cap])=>[kind,{used:d.free[kind]||0,cap}]))},
   festival:{active,next:{...view(status.next),daysUntil:status.next.daysUntil},today:{farm:d.farm,farmCap:FESTIVAL_FARM_POINTS_PER_DAY,free:d.freeToday,freeCap:FESTIVAL_FREE_POINTS_PER_DAY},pending},
   bonding:bondingView(d.dayKey),achievements:achievementsView(),
   serverNow:now(),profile:{username:"Xem thử · không lưu"},
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
    case "feed":return E.feed(p,c.species??null,time);
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
 function boost(c,next){
  const plot=next.progression.plots[c.plotIndex],at=E.nowFor(next.progression,now());
  const entries=(c.cells||[]).map(i=>plot?.slots[i]);
  if(entries.length!==3||entries.some(s=>s?.type!=="crop"))fail("invalid-boost-target","Mỗi ô trong hàng phải có cây đang lớn.");
  if(entries.some(s=>next.boostedCropIds.includes(s.id)))fail("already-boosted","Một cây trong hàng đã được tưới nước phép.");
  if(entries.some(s=>E.growth(s,at).mature))fail("mature-crop","Cây đã chín thì không cần nước phép.");
  if(next.supplies.boost<1)fail("missing-supply","Không còn nước phép.",{resource:"boost",required:1});
  for(const s of entries){s.plantedAt-=Math.floor((E.CROP[s.species]?.growMs||s.growMs)*0.1);next.boostedCropIds.push(s.id);}
  next.supplies.boost-=1;next.progression.revision+=1;
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
  if(c.slot===null){if(from<0)fail("action-noop","Đồ trang trí đã được cất.");dec.placements[from]=null;}
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
   const q=d.quests.find(x=>x.id===c.questId);
   if(!q)fail("quest-not-found","Không có nhiệm vụ này hôm nay.");
   if(q.claimed)fail("already-claimed","Nhiệm vụ này đã nhận thưởng.");
   if(q.progress<q.target)fail("quest-incomplete","Nhiệm vụ chưa hoàn thành.");
   q.claimed=true;reward=q.reward;extra.questId=q.id;
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
 function act(c){
  if(typeof c.requestId!=="string"||!c.requestId||c.requestId.length>128)fail("invalid-request-id","Mã thao tác không hợp lệ.");
  const {requestId,...payload}=c,hash=stable(payload),seen=ops.get(requestId);
  if(seen){if(seen.hash!==hash)fail("request-id-conflict","Mã thao tác đã được dùng cho dữ liệu khác.");return response(seen.receipt);}
  // The read-only preview still claims, taps and arranges; farm work needs ?simulate=1.
  if(!simulate&&!DAILY.has(c.action)&&c.action!=="placeDecoration"&&c.action!=="moveBuilding")fail("preview-read-only","Bản xem UI chỉ đọc · không ghi tài khoản.");
  const before=garden.progression;
  if(c.action!=="freeAction"&&c.expectedRevision!==before.revision)fail("revision-conflict","Khu vườn đã thay đổi; hãy tải lại trước khi thao tác.",{expectedRevision:c.expectedRevision,actualRevision:before.revision});
  // Work on copies; nothing is kept unless every check passed (like the server transaction).
  const d=clone(daily()),next=clone(garden),extra={};
  if(["claimQuest","claimChest","claimFestival","claimBondGift","claimAchievement"].includes(c.action)){
   claim(c,next,d,extra);
   if(c.action==="claimQuest"||c.action==="claimChest")extra.festivalPoints=addPoints(d,next.festival,c.action==="claimQuest"?"questClaim":"dailyChest",{amount:c.action==="claimChest"?CHEST_REWARD.eventPoints:null});
  }else if(c.action==="freeAction"){
   if(!FREE_TAPS.has(c.kind))fail("invalid-action-input","Thao tác miễn phí không hợp lệ.",{kind:c.kind});
   if(c.kind==="pet"&&(!before.creatures.length||(c.species&&!creatureOf(before,c.species))))fail("no-creature","Chưa có sinh vật để vuốt ve.");
   extra.freeAction=countFree(d,c.kind);
   extra.festivalPoints=addPoints(d,next.festival,c.kind,{counted:extra.freeAction.counted});
   // Bonding has its own cap (3 pets per creature a day), apart from the free-tap cap.
   if(c.kind==="pet"&&c.species)extra.bonding=[addBond(next,before,c.species,"pet",d.dayKey)];
  }else if(c.action==="boost")boost(c,next);
  else if(c.action==="tutorialGrow")tutorialGrow(c,next);
  else if(c.action==="placeDecoration")place(c,next);
  else{
   next.progression=model(c,before,Date.now());
   if(next.progression.revision!==before.revision+1)fail("action-noop","Lệnh khu vườn không tạo thay đổi mới.");
   if(c.action==="plant"||c.action==="replant")plantSupplies(before,next.progression,next.supplies);
   for(const [type,amount] of questAmounts(c.action,before,next.progression,c))for(const q of d.quests)if(!q.claimed&&q.triggers.includes(type))q.progress=Math.min(q.target,q.progress+amount);
   const bonded=bondTriggers(c.action,before,next.progression);
   if(bonded.length)extra.bonding=bonded.map(sp=>addBond(next,before,sp,c.action,d.dayKey));
  }
  if(!DAILY.has(c.action)){
   // Moving a plot/pen and placing a decoration are free taps (placing counts as rotate); the rest is farm work.
   const free={moveBuilding:"moveBuilding",placeDecoration:"rotate"}[c.action];
   if(free){extra.freeAction=countFree(d,free);extra.festivalPoints=addPoints(d,next.festival,free,{counted:extra.freeAction.counted});}
   else if(c.action!=="tutorialGrow")extra.festivalPoints=addPoints(d,next.festival,c.action);
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
  const qty=Math.max(1,Number(c.quantity)||1),cost=entry.price*qty;
  if(c.expectedTotal!==cost)fail("price-changed","Giá đã thay đổi.");
  if(wallet.spendable<cost)fail("insufficient-balance","Chưa đủ Galleons trong ví thử nghiệm.",{required:cost});
  if((entry.dailyRemaining??entry.dailyLimit)<qty)fail("daily-cap","Đã hết hạn mức mua trong ngày.");
  wallet.spendable-=cost;wallet.balance=Math.max(0,wallet.balance-cost);entry.dailyRemaining=(entry.dailyRemaining??entry.dailyLimit)-qty;
  const s=garden.supplies,inv=garden.progression.inventory;
  if(entry.kind==="seed"){const id=entry.cropId||entry.id.replace(/^seed_/,"");s.seeds[id]=(s.seeds[id]||0)+entry.quantity*qty;}
  else if(entry.kind==="water")s.water+=entry.quantity*qty;
  else if(entry.kind==="boost")s.boost+=entry.quantity*qty;
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
   fail("unknown-callable","Không có lệnh này.");
  },
  ledger,
 };
}

// The page side: the real garden client over the in-memory server above.
export function createEmulatorClient(){
 const query=new URLSearchParams(globalThis.location?.search||"");
 const server=createFixtureServer({level:Number(query.get("level")||100),scenario:query.get("scenario")||"empty",simulate:query.get("simulate")==="1",day:query.get("day"),quests:query.get("quests"),points:Number(query.get("points"))||0,galleons:query.has("galleons")?Number(query.get("galleons")):null});
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
