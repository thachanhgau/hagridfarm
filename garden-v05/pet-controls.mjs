import {$,el,button,icon,duration,num,visualItemIcon} from './ui-utils.mjs?v=25.1.1';
import {setAction,pixelIcon,ICONS} from './pixel-icons.mjs?v=25.1.1';

// A species whose sprite has not shipped yet (phase 2 before the creatures-art-2 merge) shows the paw icon.
const petIcon=(items,id,size)=>{const w=icon(items,id,3,size);if(w.classList?.contains('is-art-missing'))w.append(pixelIcon(ICONS.paw?'paw':'pen',Math.max(1,Math.floor(size/16))));return w;};

export const petFoodText=view=>`Thức ăn: có ${num(view.have)} phần${view.need>0&&!['eating','ready'].includes(view.phase)?` · cần ${num(view.need)} phần`:''}`;

// Read the same costs and timestamps as the engine; deriving a control never edits a save.
export function petControlState({E,state,species,now,ready=true}) {
 const config=E.CREATURE[species], animal=state.creatures.find(a=>a.species===species);
 const have=state.inventory[config.feed]||0, mealsDone=animal?.mealsCompleted||0;
 const adult=mealsDone>=config.mealsToAdult;
 const need=animal?config.mealPortions:species==='puffskein'?0:config.mealPortions*3;
 // Pond species (garden expansion §2.1) live in the pond's own spots, apart from the pens.
 const pond=Boolean(E.POND_SPECIES?.has(species)), housed=state.creatures.filter(a=>Boolean(E.POND_SPECIES?.has(a.species))===pond).length;
 const shortage=Math.max(0,need-have), capacity=pond?E.pondCapacity(state.built):E.housingCapacity(state);
 let phase, hint, help=null, command=null;
 if(animal?.meal) {
  phase=animal.meal.readyAt<=now?'ready':'eating';
  hint=phase==='ready'?(adult?'Quà đã sẵn sàng. Nhận rồi cho ăn bữa tiếp theo.':'Bữa ăn đã xong. Hoàn tất để bé lớn thêm.'):'Bé đang ăn. Con có thể chăm pet khác trong lúc chờ.';
  if(phase==='ready')command={action:'claimAnimals',species};
 } else if(!animal&&config.level>state.level) {
  phase='locked';hint=`Mở ở cấp ${config.level}.`;help='roadmap';
 } else if(!animal&&housed>=capacity) {
  phase='no-space';hint=pond?'Cần đào ao trước khi đón bé.':'Cần thêm chỗ nuôi. Xây chuồng trước khi đón bé.';help=pond?'pond':'build';
 } else if(shortage) {
  phase='no-food';hint=`Thiếu ${shortage} phần ăn${animal?' cho bữa này':' để đón bé'}.`;help='food';
 } else {
  phase=animal?'hungry':'adopt';
  hint=animal?(adult?'Cho ăn để bắt đầu bữa mới và nhận quà.':'Bé đang đói. Cho ăn để tiếp tục lớn và nhận quà.'):species==='puffskein'?`Đón miễn phí · tặng ${E.DB.limits.starterFeed} phần ăn.`:`Đón về dùng ${need} phần ăn. Sau đó cho bé ăn bữa đầu.`;
  command={action:animal?'feed':'adopt',species};
 }
 const remaining=animal?.meal?Math.max(0,animal.meal.readyAt-now):0;
 const badge=phase==='ready'?(adult?'Có quà':'Xong bữa'):phase==='eating'?'Đang ăn':animal?'Đói':phase==='locked'?`Cấp ${config.level}`:'Chưa đón';
 return {phase,hint,help,command,canAct:ready&&!!command,animal,config,have,need,shortage,capacity,housed,mealsDone,adult,remaining,badge};
}

// Choose only when the player opens the dock. Timer refreshes must preserve their selection.
export function openingPetSpecies({E,state,species,now}) {
 const pets=state.creatures;
 return pets.find(a=>a.meal&&a.meal.readyAt<=now)?.species
  ||pets.find(a=>!a.meal&&(state.inventory[E.CREATURE[a.species].feed]||0)>=E.CREATURE[a.species].mealPortions)?.species
  ||pets.find(a=>a.species===species)?.species||pets[0]?.species||species;
}

// Level 160+ «Khẩu vị sinh vật» (server garden-mood-core): today's món thích as a crop icon; the heart is lit once it ate one today.
export function petFavourite(E,items,entry){
 if(!entry?.favourite)return null;
 const name=E.CROP?.[entry.favourite]?.label||entry.favourite,heart=pixelIcon('heart',1);
 heart.classList.add('pet-favourite-heart');
 return el('span',{class:'pet-favourite'+(entry.favMeal?' is-fed':''),role:'img','aria-label':`Món thích: ${name}${entry.favMeal?' · đã ăn hôm nay':''}`,title:`Món thích: ${name}`,'data-favourite':entry.favourite},
  [visualItemIcon(items,entry.favourite,{size:24,kind:'harvest'}),heart]);
}

// Keep the button nodes and their icons stable when stock/timers refresh.
export function renderPetCareButtons(items,supplies={}) {
 const actions=[
  ['petButton','Vuốt ve','Vuốt ve sinh vật','heart',null,'rose'],
  ['rotateCreatureButton','Xoay','Đổi hướng nhìn của sinh vật','replay',null,'sky'],
  ['moodButton','Chăm bé','Chơi, chải lông, dạy trò','care',null,'rose'],
  ['coatButton','Bộ lông','Đổi bộ lông hiếm (chỉ để ngắm)','festival',null,'violet'],
  ['affinityButton','Gắn kết','Quà gắn kết','chest',null,'gold'],
  ['mealBoostButton','Nước phép','Nước phép','boost','boost','sky'],
  ['premium-prime_meal','Thượng hạng','Bữa thượng hạng','prime_meal','primeMeal','amber'],
  ['premium-skele_gro','Mọc Xương','Mọc Xương','skele_gro','skeleGro','violet'],
  ['premium-pen_feast','Tiệc chuồng','Tiệc chuồng','pen_feast','feast','leaf'],
 ];
 for(const [id,label,name,art,supply,tone] of actions) {
  const control=$(id);if(!control)continue;
  if(!control.dataset.careIcon){
   const glyph=el('span',{class:'pet-care-glyph','aria-hidden':'true'},
    supply?visualItemIcon(items,art,{size:28}):pixelIcon(art,2));
   if(id==='affinityButton'){
    const heart=pixelIcon('heart',1);heart.classList.add('pet-care-mini');glyph.append(heart);
   }
   control.replaceChildren(glyph,el('span',{class:'pet-care-label',text:label}));
   control.dataset.careIcon=art;control.dataset.careTone=tone;
   if(supply)control.append(el('b',{class:'pet-care-count','aria-hidden':'true'}));
   else control.title=name;
  }
  const count=supply?Number(supplies[supply]||0):null;
  if(supply){
   const badge=control.querySelector('.pet-care-count');
   if(badge.textContent!=='×'+count)badge.textContent='×'+count;
  }
  control.setAttribute('aria-label',name+(supply?' · còn '+count:''));
 }
}

export function setupPetControls({E,items,getMood=()=>null,getFavourite=()=>null,getState,getSpecies,getNow,getReady,onSelect,onHelp}) {
 let group='owned',lastPortrait='',previousOwned=false,lastFavourite='';
 const favSlot=el('span',{class:'pet-favourite-slot',hidden:true});
 $('petPortrait')?.parentElement?.append(favSlot);
 const entries=new Map(), tray=$('creatureTray');
 for(const config of E.DB.animals) {
  const name=el('span',{class:'pet-card-name',text:config.label});
  const badge=el('span',{class:'pet-card-state'});
  const control=button('',()=>onSelect(config.id),{'data-id':config.id,class:'pet-card','aria-pressed':'false'});
  control.append(petIcon(items,config.id,30),el('span',{class:'pet-card-copy'},[name,badge]));
  tray.append(control);entries.set(config.id,{control,badge});
 }
 function chooseGroup(next) {
  group=next;
  const state=getState(),owned=new Set(state.creatures.map(a=>a.species));
  const choices=E.DB.animals.filter(c=>owned.has(c.id)===(group==='owned'));
  if(choices.length&&!choices.some(c=>c.id===getSpecies()))onSelect(choices[0].id);
  else refresh();
 }
 $('petOwnedTab').onclick=()=>chooseGroup('owned');
 $('petAdoptTab').onclick=()=>chooseGroup('adopt');
 $('petHelp').onclick=()=>{
  const view=petControlState({E,state:getState(),species:getSpecies(),now:getNow(),ready:getReady()});
  if(view.help)onHelp(view.help);
 };
 function refresh() {
  const state=getState(),species=getSpecies();
  const view=petControlState({E,state,species,now:getNow(),ready:getReady()});
  const {animal,config}=view;
  if(animal&&!previousOwned)group='owned';
  previousOwned=!!animal;
  $('petOwnedTab').textContent=`Đang nuôi (${state.creatures.length})`;
  $('petOwnedTab').setAttribute('aria-pressed',group==='owned');
  $('petAdoptTab').setAttribute('aria-pressed',group==='adopt');
  $('petHousing').textContent=`${view.housed}/${view.capacity} chỗ`;
  const owned=new Set(state.creatures.map(a=>a.species));
  let visible=0;
  for(const [id,{control,badge}] of entries) {
   const item=petControlState({E,state,species:id,now:getNow(),ready:getReady()});
   control.hidden=owned.has(id)!==(group==='owned')||(E.POND_SPECIES?.has(id)&&state.level<130); // pond species from level 130
   if(!control.hidden)visible++;
   control.setAttribute('aria-pressed',id===species);
   control.dataset.phase=item.phase;
   badge.textContent=id===species?'':item.phase==='eating'?duration(item.remaining):item.badge;
   control.setAttribute('aria-label',`${item.config.label} · ${item.badge}${item.phase==='eating'?' · còn '+duration(item.remaining):''}`);
  }
  $('petEmpty').hidden=visible>0;
  $('petEmpty').textContent=group==='owned'?'Chưa có pet. Chọn “Đón thêm” để đón bé đầu tiên.':'Con đã đón đủ các loài hiện có.';
  // An empty tab has no selected animal; leave its tabs and explanation available.
  $('petDetail').hidden=!visible;
  $('petCareTools').hidden=!visible||!animal;
  if(!visible)return;
  if(lastPortrait!==species){$('petPortrait').replaceChildren(petIcon(items,species,40));lastPortrait=species;}
  $('creatureName').textContent=config.label;
  const mood=animal?getMood(species):null,fav=animal?getFavourite(species):null,favKey=fav?.favourite?`${fav.favourite}:${fav.favMeal}`:'';
  if(favKey!==lastFavourite){lastFavourite=favKey;const badge=petFavourite(E,items,fav);favSlot.replaceChildren(...(badge?[badge]:[]));favSlot.hidden=!badge;}
  $('creatureTime').textContent=animal?(view.adult?'Trưởng thành':`Đang lớn · ${view.mealsDone}/${config.mealsToAdult} bữa`)+(mood!=null?` · ♥ ${mood}`:''):`Nhận nuôi · Cấp ${config.level}`;
  $('petProgress').hidden=!animal||view.adult;
  $('petProgress').max=config.mealsToAdult;
  $('petProgress').value=view.mealsDone;
  $('petProgress').setAttribute('aria-label',`${config.label} đã hoàn tất ${view.mealsDone}/${config.mealsToAdult} bữa`);
  $('petBadge').textContent=view.badge;
  $('petBadge').parentElement.dataset.phase=view.phase;
  $('petBadge').dataset.phase=view.phase;
  $('petTimer').hidden=view.phase!=='eating';
  $('petTimer').textContent=view.phase==='eating'?`Còn ${duration(view.remaining)}`:'';
  $('petFood').textContent=petFoodText(view);
  $('petFood').classList.toggle('is-short',!!view.shortage&&!animal?.meal);
  $('creatureStatus').textContent=view.hint;
  $('creatureStatus').hidden=!!animal&&['hungry','eating','ready'].includes(view.phase);
  $('petButton').hidden=!animal;
  $('petButton').disabled=!getReady();
  if($('rotateCreatureButton'))$('rotateCreatureButton').hidden=!animal;
  if($('coatButton'))$('coatButton').hidden=!animal;
  if($('moodButton'))$('moodButton').hidden=!animal||getMood(species)==null;
  const primary=animal?(animal.meal?'claimAnimalButton':'feedButton'):'adoptButton';
  const hand=primary==='feedButton'&&E.HAND_FEED_SPECIES?.has(species)===true; // Nhím quậy: «Cho ăn tận tay» (phase 2)
  const label=primary==='adoptButton'?'Đón về':hand?'Cho ăn tận tay':primary==='feedButton'?'Cho ăn':view.phase==='eating'?'Đang ăn':'Nhận';
  for(const id of ['adoptButton','feedButton','claimAnimalButton']){
   $(id).hidden=id!==primary;$(id).disabled=!view.canAct;
  }
  setAction($(primary),{icon:primary==='adoptButton'?'pen':hand?(ICONS.hand_feed?'hand_feed':'feed'):primary==='feedButton'?'feed':'chest',label,count:primary==='feedButton'&&!hand?'×'+config.mealPortions:'',text:`${label} · ${config.label}${hand?' · '+config.mealPortions+' phần':''}`});
  $('feedButton').classList.toggle('is-hand-feed',hand);
  $('petHelp').hidden=!view.help;
  $('petHelp').textContent={food:'Mua thức ăn',build:'Xây chuồng',pond:'Đào ao',roadmap:'Xem cấp mở'}[view.help]||'';
 }
 function select(id) {
  group=getState().creatures.some(a=>a.species===id)?'owned':'adopt';
  previousOwned=group==='owned';refresh();
 }
 function open() {
  const state=getState(),id=openingPetSpecies({E,state,species:getSpecies(),now:getNow()});
  select(id);onSelect(id);
 }
 return {refresh,select,open};
}
