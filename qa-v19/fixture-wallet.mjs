import * as E from "../garden-v05/progression-engine.mjs";
import {unlockedCatalog} from "../garden-v05/garden-store-catalog.mjs?v=24.9.29";

export function createEmulatorClient(){
 const query=new URLSearchParams(location.search),level=Number(query.get("level")||100),scenario=query.get("scenario")||"empty",simulate=query.get("simulate")==="1",past=scenario.endsWith("ready"),now=Date.now(),origin=past?now-26*3600000:now;
 let state=E.testProfile(level,origin),actions=0;
 if(["owned","feeding","animal-ready"].includes(scenario)){
  state=E.adopt(state,"puffskein",origin);
  if(scenario!=="owned")state=E.feed(state,"puffskein",origin);
 }
 if(["craft-busy","craft-ready"].includes(scenario))state=E.craft(state,"insects",1,origin);
 if(["build-busy","build-ready"].includes(scenario))state=E.build(state,"plot_12",origin);
 if(scenario==="missing")for(const id of Object.keys(state.inventory))state.inventory[id]=0;
 if(scenario==="prerequisite"){const base=E.newGame(origin);state.built=base.built;state.plots=base.plots;}

 // Populate a lively showcase for the default preview so crops, creatures (both adult & baby),
 // and decorations are immediately visible and animated on the map.
 if(["empty","habitats"].includes(scenario)&&level>=10){
  const showcaseCrops=[
   [0,[0,1,2],"pumpkin",origin-8*3600000],
   [0,[3,4,5],"daisy",origin-8*3600000],
   [0,[6,7,8],"mushroom",origin-30*60000],
   [1,[0,1,2],"clover",origin-8*3600000],
   [1,[3,4,5],"ginger",origin-45*60000],
   [2,[0,1,2],"bluebell",origin-12*3600000],
  ];
  for(const [plotIdx,cells,cropId,plantedAt] of showcaseCrops){
   const spec=E.CROP[cropId];
   if(!spec||spec.level>level||!state.plots[plotIdx])continue;
   for(const cell of cells){
    state.plots[plotIdx].slots[cell]={
     id:`crop-p${plotIdx}-s${cell}-1`,
     type:"crop",
     species:cropId,
     plantedAt,
     growMs:spec.growMs,
    };
   }
  }
  const showcaseCreatures=scenario==="habitats"?Object.keys(E.CREATURE).map(species=>({species,adult:true})):[
   {species:"puffskein",adult:true},
   {species:"bowtruckle",adult:true},
   {species:"niffler",adult:true},
   {species:"kneazle",adult:false},
   {species:"hippogriff",adult:true},
   {species:"unicorn",adult:true},
  ];
  const maxSpots=E.housingCapacity(state);
  for(const item of showcaseCreatures){
   const spec=E.CREATURE[item.species];
   if(!spec||spec.level>level||state.creatures.length>=maxSpots)continue;
   state.creatures.push({
    id:`creature-${item.species}`,
    type:"creature",
    species:item.species,
    level:spec.level,
    adoptedAt:origin-48*3600000,
    mealsCompleted:item.adult?spec.mealsToAdult:Math.max(1,Math.floor(spec.mealsToAdult/2)),
    meal:null,
    cyclesClaimed:item.adult?1:0,
    preview:false,
   });
  }
  for(const dec of E.DB.decorations){
   if(dec.level<=Math.min(level,40)&&state.decorations.length<6&&!state.decorations.includes(dec.id)){
    state.decorations.push(dec.id);
   }
  }
  state.decorationRotations={"decoration-7":"right","decoration-23":"right"};
  state.creatureFacings={puffskein:"default",bowtruckle:"right",niffler:"default",kneazle:"right",hippogriff:"default",unicorn:"right"};
  if(level>=20){
   state.keepsakes={...state.keepsakes,puffskein:2,bowtruckle:1,niffler:3,...(level>=90?{kneazle:1,hippogriff:2,unicorn:1,dragon:1}:{})};
  }
 }

 const catalogItems=unlockedCatalog(level).map(item=>({...item,dailyRemaining:item.dailyLimit}));
 const unlockedStoreDecors=catalogItems.filter(i=>i.kind==="decoration").map(i=>i.id);
 const defaultOwnedDecors=scenario==="empty"&&level>=30
  ?unlockedStoreDecors
  :["decor_pumpkin_lantern"];
 const defaultPlacements=scenario==="empty"&&level>=30
  ?[
   unlockedStoreDecors[0]||"decor_pumpkin_lantern",
   unlockedStoreDecors[1]||null,
   unlockedStoreDecors[2]||null,
   unlockedStoreDecors[3]||null,
   unlockedStoreDecors[4]||null,
   unlockedStoreDecors[5]||null,
  ]
  :["decor_pumpkin_lantern",null,null,null,null,null];
 const defaultRotations=scenario==="empty"&&level>=30
  ?{
   decor_pumpkin_lantern:"default",
   decor_broom_rack:"right",
   decor_cauldron:"default",
   decor_mandrake_planter:"right",
   decor_floating_candles:"default",
   decor_vine_arch:"right",
  }
  :{decor_pumpkin_lantern:"default"};

 const snapshot={
  profile:{username:"Xem thử · không lưu"},
  wallet:{spendable:2500,balance:1500,bankBalance:1000},
  catalog:catalogItems,
  garden:{
   progression:state,
   supplies:{seeds:Object.fromEntries(E.DB.crops.map(c=>[c.id,c.level<=level?36:0])),water:213,boost:2},
   decorations:{
    owned:defaultOwnedDecors,
    placements:defaultPlacements,
    rotations:defaultRotations,
   },
   boostedCropIds:[],
  },
 };
 const blocked=async()=>{throw Error("Bản xem UI chỉ đọc · không ghi tài khoản.");};
 const act=async command=>{
  if(!simulate&&command.action!=="placeDecoration"&&command.action!=="moveBuilding")return blocked();
  const current=snapshot.garden.progression,time=Date.now();let next=current;
  switch(command.action){
   case "adopt":next=E.adopt(current,command.species,time);break;
   case "feed":next=E.feed(current,command.species,time);break;
   case "claimAnimals":next=E.claimAnimals(current,command.species??null,time);break;
   case "craft":next=E.craft(current,command.recipeId,command.batches,time);break;
   case "claimCraft":next=E.claimCraft(current,time);break;
   case "build":next=E.build(current,command.expansionId,time);break;
   case "claimBuildings":next=E.claimBuildings(current,time);break;
   case "moveBuilding":next=E.moveBuilding(current,command.kind,command.index,command.targetSlot);break;
   case "placeDecoration":{
    const pls=[...(snapshot.garden.decorations.placements||[null,null,null,null,null,null])];
    for(let i=0;i<pls.length;i++)if(pls[i]===command.itemId)pls[i]=null;
    if(command.slot!==null&&command.slot>=0)pls[command.slot]=command.itemId;
    snapshot.garden.decorations.placements=pls;
    const rots={...(snapshot.garden.decorations.rotations||{})};
    if(command.facing==="right"||command.facing==="default"){
     rots[command.itemId]=command.facing;
    }
    snapshot.garden.decorations.rotations=rots;
    return snapshot;
   }
   default:throw Error("Thao tác ngoài phạm vi mô phỏng UI.");
  }
  snapshot.garden.progression=next;actions++;
  const badge=document.querySelector(".emulator-badge");if(badge){badge.textContent="MÔ PHỎNG · "+actions+" thao tác, không lưu";badge.dataset.command=JSON.stringify(command);badge.dataset.actions=actions;}
  return snapshot;
 };
 const buy=async(itemId,count=1)=>{
  const entry=snapshot.catalog.find(i=>i.id===itemId);
  if(!entry)throw Error("Không tìm thấy mặt hàng.");
  const qty=Math.max(1,Number(count)||1);
  const cost=entry.price*qty;
  if(snapshot.wallet.spendable<cost)throw Error("Chưa đủ Galleons trong ví thử nghiệm.");
  if((entry.dailyRemaining??entry.dailyLimit)<qty)throw Error("Đã hết hạn mức mua trong ngày.");
  snapshot.wallet.spendable-=cost;
  snapshot.wallet.balance=Math.max(0,snapshot.wallet.balance-cost);
  entry.dailyRemaining=(entry.dailyRemaining??entry.dailyLimit)-qty;
  if(entry.kind==="seed"){
   const cId=entry.cropId||entry.id.replace(/^seed_/,"");
   snapshot.garden.supplies.seeds[cId]=(snapshot.garden.supplies.seeds[cId]||0)+entry.quantity*qty;
  }else if(entry.kind==="water"){
   snapshot.garden.supplies.water=(snapshot.garden.supplies.water||0)+entry.quantity*qty;
  }else if(entry.kind==="boost"){
   snapshot.garden.supplies.boost=(snapshot.garden.supplies.boost||0)+entry.quantity*qty;
  }else if(entry.kind==="food"){
   const invId=entry.inventoryId||entry.id;
   snapshot.garden.progression.inventory[invId]=(snapshot.garden.progression.inventory[invId]||0)+entry.quantity*qty;
  }else if(entry.kind==="decoration"){
   if(!snapshot.garden.decorations.owned.includes(entry.id))snapshot.garden.decorations.owned.push(entry.id);
  }
  return snapshot;
 };
 return {isPreview:true,get snapshot(){return snapshot;},read:async()=>snapshot,act,buy};
}
