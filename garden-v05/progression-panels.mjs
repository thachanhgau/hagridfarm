import {renderGardenMenu} from './garden-menu-ui.mjs?v=24.9.5';
import {renderGardenSettings} from './garden-settings-ui.mjs?v=24.9.5';
import {GARDEN_STAGES,gardenStage,stageContains} from "./garden-growth.mjs?v=24.9.5";
import {DECOR_SLOTS,decorFacingFor,decorLabelFor} from "./decor-runtime.mjs?v=24.9.5";
import {$,el,button,icon,num,duration,hours,timer,visualItemIcon,stageVisualIcon,levelUnlockVisual,FEED_CREATURE_MAP} from "./ui-utils.mjs?v=24.9.5";
import {renderAlmanacSection} from "./garden-postcard.mjs?v=24.9.5";
import {renderTourSection} from "./garden-tour.mjs?v=24.9.5";
import {renderAchievementsSection} from "./garden-achievements.mjs?v=24.9.5";
import {renderEventsAndTasksSection,renderAffinitySection,renderGuestbookSection} from "./garden-events.mjs?v=24.9.5";
import {renderSceneryPicker,navIcon} from "./v24-visuals.mjs?v=24.9.5";

export function createPanels(ctx){
 const {E,items,labels,getState,run,notify,selectCrop,selectCreature,focusPlot,getSelection,getSession,switchSession,exportSave,tickTimers}=ctx,{DB}=E;
 const panel=$("panel"),body=$("panelBody"),shade=$("popoverShade");
 let active=null,previousFocus=null,recipeFilter="all",batches=1,roadStart=1,roadFilter="all",invFilter="all",confirmUproot=false;
 const names={roadmap:"Lộ trình",profile:"Hồ sơ",almanac:"Sổ tay",achievements:"Thành tựu",tour:"Thăm vườn",events:"Lễ hội",guestbook:"Lưu bút",affinity:"Gắn kết",scenery:"Khung cảnh",settings:"Cài đặt",plots:"Thửa đất",crops:"Hạt giống",creatures:"Sinh vật",craft:"Chế biến",build:"Xây dựng",inventory:"Kho",layout:"Bố trí",collection:"Trang trí",menu:"Khu vườn"};
 const label=id=>labels[id]||id,now=()=>E.nowFor(getState(),Date.now()),paragraph=(text,cls="")=>el("p",{text,class:cls}),actions=(...children)=>el("div",{class:"actions"},children),toolbar=(...children)=>el("div",{class:"panel-toolbar"},children),grid=()=>el("div",{class:"cards"});
 const detail=text=>el("details",{class:"v24-detail"},[el("summary",{text:"Chi tiết"}),paragraph(text)]);
 const navButton=(name,text,fn,attrs={})=>{const b=button(text,fn,attrs);b.prepend(navIcon(name));return b;};
 function card(title,subtitle,id,opts={}){const c=el("article",{class:"card"}),h=el("div",{class:"card-head"});if(id)h.append(visualItemIcon(items,id,{size:52,...opts}));h.append(el("div",{class:"card-head-copy"},[el("strong",{text:title}),el("small",{text:subtitle})]));c.append(h);return c;}
 function readyButton(text,at,fn){return button(text,fn,{"data-ready-button":at,disabled:at>now(),class:"primary"});}
 function show(name){
  for(const d of document.querySelectorAll("dialog.decor-placement,dialog.store-overlay")){try{d.close();}catch{}d.remove();}
  if(!active)previousFocus=document.activeElement;
  active=name;panel.dataset.view=name;confirmUproot=false;
  if(name==="roadmap"){const lv=getState().level||1;roadStart=Math.floor((lv-1)/20)*20+1;}
  panel.hidden=false;shade.hidden=false;$("panelTitle").textContent=names[name];render();panel.scrollTop=0;$("closePanel").focus();
 }
 function close(){panel.hidden=true;shade.hidden=true;active=null;previousFocus?.focus();}
 function refresh(){if(!active)return;const scroll=panel.scrollTop;render();panel.scrollTop=scroll;}
 function render(){body.replaceChildren();views[active]?.();tickTimers();}
 $("closePanel").onclick=close;shade.onclick=close;document.addEventListener("keydown",e=>{if(!active)return;if(e.key==="Escape"){e.preventDefault();close();}else if(e.key==="Tab"){const focus=[...panel.querySelectorAll("button:not(:disabled),select,input,a[href],summary")].filter(e=>!e.hidden&&e.getClientRects().length&&![...panel.querySelectorAll("details:not([open])")].some(d=>d.contains(e)&&e!==d.querySelector("summary")));if(!focus.length)return;const first=focus[0],last=focus.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});

 function spatialStagesVisual(s){
  const current=ctx.getGardenStage?.()??gardenStage(s);
  const section=el("section",{class:"journey-stages-section"});
  section.append(
   el("div",{class:"journey-section-head"},[
    el("div",{},[
     el("small",{class:"journey-kicker",text:"BẢN ĐỒ MỞ RỘNG 6 CHƯƠNG"}),
     el("h3",{text:current.name}),
    ]),
    el("span",{class:"journey-stage-pill",text:`Cấp ${s.level}/100`}),
   ]),
   detail("Lên cấp để mở rộng vườn. Cây và sinh vật được giữ nguyên.")
  );
  const stageGrid=el("div",{class:"journey-stages-grid"});
  for(const stage of GARDEN_STAGES){
   const unlocked=s.level>=stage.level;
   const isCurrent=stage.id===current.id;
   const stCard=el("article",{class:`journey-stage-card${isCurrent?" is-current":unlocked?" is-unlocked":" is-locked"}`},[
    stageVisualIcon(stage.id,items,46),
    el("div",{class:"journey-stage-copy"},[
     el("div",{class:"journey-stage-top"},[
      el("span",{class:"journey-stage-badge",text:`Chương ${stage.id} · Cấp ${stage.level}`}),
      el("span",{class:"journey-stage-state",text:isCurrent?"✦ Đang ở đây":unlocked?"✓ Đã mở":"🔒 Chưa mở"}),
     ]),
     el("strong",{text:stage.name}),
     detail(stage.description),
    ]),
   ]);
   stageGrid.append(stCard);
  }
  section.append(stageGrid);
  return section;
 }

 const views={
  roadmap(){
   const s=getState(),info=E.levelInfo(s),current=ctx.getGardenStage?.()??gardenStage(s);
   const unlockedCrops=DB.crops.filter(c=>c.level<=s.level).length;
   const unlockedAnimals=DB.animals.filter(a=>a.level<=s.level).length;
   const pct=s.level>=100?100:Math.min(100,Math.round((info.xpInLevel/Math.max(1,info.xpToNext))*100));

   const hero=el("section",{class:"journey-hero-card"},[
    el("div",{class:"journey-hero-main"},[
     el("div",{class:"journey-medal-seal"},[
      el("small",{text:"CẤP ĐỘ"}),
      el("b",{text:String(s.level)}),
     ]),
     el("div",{class:"journey-hero-copy"},[
      el("small",{class:"journey-kicker",text:`CHƯƠNG ${current.id}/6`}),
      el("h3",{text:s.level>=100?"Đại khu vườn":current.name}),
      el("p",{text:s.level>=100?`${num(s.xp)} XP · Hoàn tất`:`${num(info.xpInLevel)} / ${num(info.xpToNext)} XP`}),
      el("div",{class:"journey-xp-bar"},[el("span",{style:`width:${pct}%`})]),
     ]),
    ]),
    el("div",{class:"journey-hero-stats"},[
     el("div",{class:"journey-stat-pill"},[el("b",{text:`${s.plots.length}/12`}),el("small",{text:"Thửa đất"})]),
     el("div",{class:"journey-stat-pill"},[el("b",{text:`${unlockedCrops}/24`}),el("small",{text:"Giống cây"})]),
     el("div",{class:"journey-stat-pill"},[el("b",{text:`${unlockedAnimals}/12`}),el("small",{text:"Sinh vật"})]),
     el("div",{class:"journey-stat-pill"},[el("b",{text:`${s.level}/100`}),el("small",{text:"Mốc cấp"})]),
    ]),
    el("div",{class:"actions"},[button("Bộ sưu tập",()=>show("collection"))]),
   ]);
   body.append(hero,spatialStagesVisual(s));

   const filterWrap=el("div",{class:"journey-controls-bar"});
   const rangeBar=el("div",{class:"journey-range-tabs",role:"group","aria-label":"Chặng cấp độ"});
   for(let start=1;start<=100;start+=20){
    const end=start+19;
    const hasCurrent=s.level>=start&&s.level<=end;
    rangeBar.append(button(`Cấp ${start}–${end}${hasCurrent?" ✦":""}`,()=>{roadStart=start;refresh();},{"aria-pressed":String(roadStart===start),class:"journey-tab-btn"}));
   }
   const catBar=el("div",{class:"journey-cat-tabs",role:"group","aria-label":"Lọc loại mở khóa"});
   for(const [id,name] of [["all","Tất cả"],["cat-crop","🌱 Cây trồng"],["cat-creature","🐾 Sinh vật"],["cat-build","🏡 Công trình"],["cat-craft","⚗ Chế biến"],["cat-decor","✨ Cảnh quan"]]){
    catBar.append(button(name,()=>{roadFilter=id;refresh();},{"aria-pressed":String(roadFilter===id),class:"journey-cat-btn"}));
   }
   filterWrap.append(rangeBar,catBar);
   body.append(filterWrap);

   const slice=roadFilter==="all"?DB.levels.slice(roadStart-1,roadStart+19):DB.levels;
   const list=el("ol",{class:"roadmap journey-milestone-grid"});
   for(const l of slice){
    const infoVis=levelUnlockVisual(l,DB,items,48);
    if(roadFilter!=="all"&&infoVis.categoryClass!==roadFilter)continue;
    const isCurrent=l.level===s.level,isDone=l.level<s.level;
    const stateClass=isCurrent?"current is-current":isDone?"is-unlocked":"is-locked";
    const li=el("li",{class:`journey-card ${stateClass} ${infoVis.categoryClass}`},[
     el("div",{class:"journey-card-art"},[
      infoVis.visual,
      el("span",{class:"badge journey-level-badge",text:isDone?`✓ ${l.level}`:isCurrent?`✦ ${l.level}`:`Cấp ${l.level}`}),
     ]),
     el("div",{class:"journey-card-body"},[
      el("div",{class:"journey-card-tags"},[
       el("span",{class:`journey-cat-pill ${infoVis.categoryClass}`,text:infoVis.category}),
       el("small",{class:"journey-xp-tag",text:`${num(l.totalXP)} XP tổng`}),
      ]),
      el("strong",{class:"journey-unlock-title",text:l.unlock}),
      el("small",{class:"journey-unlock-meta",text:infoVis.meta}),
     ]),
    ]);
    list.append(li);
   }
   body.append(list);
  },

  crops(){
   const s=getState(),g=grid();
   body.append(paragraph("3 ô/hàng · tối đa 3 loại/thửa"+(getSession().connected?" · 1 hạt + 1 nước/ô":" · gieo miễn phí")));
   for(const c of DB.crops.filter(c=>c.level<=s.level)){
    const locked=c.level>s.level,k=card(c.label,"Cấp "+c.level+" · "+c.rarity+" · "+hours(c.hours),c.id);
    k.classList.toggle("locked",locked);
    k.append(detail(c.use),paragraph("Gieo "+c.plantXP+" + gặt "+c.harvestXP+" XP/ô · Kho "+(s.inventory[c.id]||0)),button(locked?"Mở ở cấp "+c.level:"Chọn",()=>{selectCrop(c.id);close();},{disabled:locked,class:"primary"}));
    g.append(k);
   }
   body.append(g);
  },

  plots(){
   const s=getState(),sel=getSelection();
   body.append(toolbar(button("Mở thêm thửa",()=>show("build")),button("Bố trí",()=>show("layout")),button("Gặt tất cả",()=>run(x=>E.harvest(x,null,null,Date.now()),"Đã gặt cây chín.",{action:"harvest"}))));
   const g=grid();
   s.plots.forEach((p,i)=>{
    const n=p.slots.filter(Boolean).length,ready=p.slots.filter(e=>e&&E.growth(e,now()).mature).length;
    const k=card("Thửa "+(i+1),n+"/9 ô · "+new Set(p.slots.filter(Boolean).map(e=>e.species)).size+"/3 loại · "+ready+" cây chín","plot_"+(i+1));
    k.append(actions(button("Đến thửa",()=>{focusPlot(i);close();}),button("Gieo lại",()=>run(x=>E.replant(x,i,Date.now()),"Đã gieo lại hàng còn trống.",{action:"replant",plotIndex:i}),{disabled:!p.patterns.length})));
    g.append(k);
   });
   body.append(g);
   const selected=s.plots[sel.selectedPlot],filled=sel.cells.some(i=>selected.slots[i]);
   body.append(el("h3",{text:"Dọn hàng đang chọn · Thửa "+(sel.selectedPlot+1)}),paragraph("Nhổ bỏ không hoàn hạt hoặc nhận XP. Ô đất giữ thời điểm chín cũ làm thời gian chờ trước khi gieo lại."));
   body.append(button(confirmUproot?"Xác nhận nhổ "+sel.cells.length+" ô đã chọn":"Nhổ hàng đang chọn",()=>{if(!confirmUproot){confirmUproot=true;refresh();return;}run(x=>E.uproot(x,sel.selectedPlot,sel.cells,Date.now()),"Đã nhổ hàng. Đất chờ tới thời điểm chín cũ.",{action:"uproot",plotIndex:sel.selectedPlot,cells:sel.cells});confirmUproot=false;},{disabled:!filled,class:"danger"}));
  },

  creatures(){
   const s=getState(),g=grid(),facings=ctx.getCreatureFacings?.()??{},affMap=ctx.getAffinityMap?.()??new Map();
   body.append(paragraph(s.creatures.length+"/"+E.housingCapacity(s)+" chỗ · 1 con/loài · 6 giờ/bữa"),toolbar(button("Nhận bữa",()=>run(x=>E.claimAnimals(x,null,Date.now()),"Đã nhận các bữa hoàn tất.",{action:"claimAnimals"})),button("Cho ăn",()=>run(x=>E.feed(x,null,Date.now()),"Đã cho các con đủ khẩu phần ăn.",{action:"feed"})),button("Chế biến",()=>{recipeFilter="feed";show("craft");}),button("Gắn kết",()=>show("affinity"))));
   for(const a of DB.animals.filter(a=>a.level<=s.level)){
    const owned=s.creatures.find(e=>e.species===a.id),locked=s.level<a.level,facing=facings[a.id]==="right"?"right":"default",angleTag=facing==="right"?"↗ Nhìn phải":"↖ Góc chuẩn";
    const aff=affMap.get(a.id);
    const affTag=owned&&aff?` · ${aff.hearts}`:"";
    const k=card(a.label,"Cấp "+a.level+" · "+a.rarity+" · "+a.mealPortions+" phần/bữa · "+angleTag+affTag,a.id,{facing});
    k.classList.toggle("locked",locked);
    k.append(paragraph("Kho: "+(s.inventory[a.feed]||0)+" khẩu phần · "+a.cycleXP+" XP/chu kỳ trưởng thành"));
    if(owned){
     const mature=owned.mealsCompleted>=a.mealsToAdult;
     k.append(paragraph(mature?"Trưởng thành · Sản phẩm: "+a.produce:owned.mealsCompleted+"/"+a.mealsToAdult+" bữa để trưởng thành · Các mốc "+a.stageMeals.join(" / ")),el("div",{class:"progress"},[el("span",{style:"width:"+Math.min(100,owned.mealsCompleted/a.mealsToAdult*100)+"%"})]));
     if(owned.meal)k.append(timer(owned.meal.readyAt),actions(readyButton("Nhận",owned.meal.readyAt,()=>run(x=>E.claimAnimals(x,a.id,Date.now()),"Đã nhận kết quả "+a.label+".",{action:"claimAnimals",species:a.id}))));
     else k.append(paragraph("Đang chờ cho ăn."),actions(button("Cho ăn",()=>run(x=>E.feed(x,a.id,Date.now()),"Đã cho "+a.label+" ăn.",{action:"feed",species:a.id}),{disabled:s.inventory[a.feed]<a.mealPortions,class:"primary"})));
     const rowBtns=[button("Đến chuồng",()=>{selectCreature(a.id);close();}),button("Thức ăn",()=>{recipeFilter=a.feed;show("craft");})];
     if(ctx.onPetCreature)rowBtns.push(button("Vuốt ve",()=>{ctx.onPetCreature(a.id);refresh();},{"data-pet-creature":a.id}));
     if(ctx.rotateCreatureFacing)rowBtns.push(button("Xoay",()=>{ctx.rotateCreatureFacing(a.id);refresh();},{"data-rotate-creature":a.id}));
     rowBtns.push(button("Gắn kết",()=>{selectCreature(a.id);show("affinity");}));
     k.append(actions(...rowBtns));
    }else{
     k.append(button("Chọn",()=>{selectCreature(a.id);close();}),paragraph(locked?"Mở ở cấp "+a.level:a.id==="puffskein"?"Đón miễn phí, nhận 3 khẩu phần đầu tiên.":"Cần chuẩn bị "+(a.mealPortions*3)+" khẩu phần; nhận nuôi chưa bắt đầu bữa ăn."),actions(button("Đón về",()=>run(x=>E.adopt(x,a.id,Date.now()),a.label+" đã về vườn.",{action:"adopt",species:a.id}),{disabled:locked||s.creatures.length>=E.housingCapacity(s)||(a.id!=="puffskein"&&s.inventory[a.feed]<a.mealPortions*3),class:"primary"}),button("Thức ăn",()=>{recipeFilter=a.feed;show("craft");},{disabled:locked})));
    }
    g.append(k);
   }
   body.append(g);
  },

  craft(){
   const s=getState(),select=el("select",{"aria-label":"Lọc công thức",onchange:e=>{recipeFilter=e.target.value;refresh();}});
   for(const[id,name]of [["all","Tất cả công thức"],["open","Đã mở"],["feed","Khẩu phần"],["kit","Vật liệu"],["insects","Côn trùng"],["fish","Cá nhỏ"],...DB.animals.filter(a=>a.level<=s.level).map(a=>[a.feed,a.label])])select.append(el("option",{value:id,text:name}));
   select.value=recipeFilter;
   const qty=el("select",{"aria-label":"Số mẻ tức thì",onchange:e=>{batches=Number(e.target.value);refresh();}});
   for(const n of[1,3,10])qty.append(el("option",{value:n,text:n+" mẻ tức thì"}));
   qty.value=batches;
   body.append(detail("Chế biến và xây dựng không cho XP. Côn trùng / cá: 1 mẻ mỗi 6 giờ; nhận xong mới làm tiếp."),toolbar(select,qty,button("Nhận tất cả",()=>run(x=>E.claimCraft(x,Date.now()),"Đã nhận thành phẩm.",{action:"claimCraft"}))));
   if(s.jobs.length){
    const jobs=grid();
    for(const j of s.jobs){
     const r=DB.recipes.find(r=>r.id===j.recipeId),k=card(r.label,j.count+" "+label(j.output),j.output);
     k.append(timer(j.readyAt),readyButton("Nhận",j.readyAt,()=>run(x=>E.claimCraft(x,Date.now()),"Đã nhận thành phẩm.",{action:"claimCraft"})));
     jobs.append(k);
    }
    body.append(jobs);
   }
   const g=grid();
   for(const r of DB.recipes.filter(r=>r.level<=s.level).filter(r=>recipeFilter==="all"||recipeFilter==="open"&&r.level<=s.level||recipeFilter==="feed"&&DB.animals.some(a=>a.feed===r.output)||r.output===recipeFilter)){
    const n=r.hours?1:batches,locked=r.level>s.level,missing=Object.entries(r.inputs).some(([id,q])=>s.inventory[id]<q*n),busy=r.hours&&s.jobs.some(j=>j.station===r.station),k=card(r.label,"Cấp "+r.level+" · "+hours(r.hours)+" · "+r.station,r.output);
    k.classList.toggle("locked",locked);
    for(const[id,q]of Object.entries(r.inputs))k.append(paragraph(label(id)+": "+num(s.inventory[id]||0)+" / "+num(q*n),s.inventory[id]<q*n?"missing":"meta"));
    k.append(paragraph("Nhận "+(r.count*n)+" "+label(r.output)),button(locked?"Cấp "+r.level:busy?"Đang làm":"Làm",()=>run(x=>E.craft(x,r.id,n,Date.now()),r.hours?"Đã bắt đầu mẻ.":"Đã chế biến thành phẩm.",{action:"craft",recipeId:r.id,batches:n}),{disabled:locked||missing||busy,class:"primary"}));
    g.append(k);
   }
   body.append(g);
  },

  build(){
   const s=getState(),g=grid();
   body.append(el("details",{class:"v24-detail"},[el("summary",{text:"Mở rộng vườn"}),spatialStagesVisual(s)]));
   body.append(paragraph(s.plots.length+"/12 thửa · "+E.housingCapacity(s)+"/12 chỗ nuôi · "+num(s.inventory.kit||0)+" bộ vật liệu."),toolbar(button("Bố trí",()=>show("layout")),button("Bộ sưu tập",()=>show("collection")),button("Làm vật liệu",()=>{recipeFilter="kit";show("craft");}),button("Nhận công trình",()=>run(x=>E.claimBuildings(x,Date.now()),"Công trình đã mở sử dụng.",{action:"claimBuildings"}))));
   for(const e of DB.expansions.filter(e=>e.level<=s.level)){
    const number=Number(e.id.split("_")[1]),title=(e.kind==="plot"?"Thửa ":"Chuồng ")+number,done=s.built.includes(e.id),job=s.construction.find(j=>j.id===e.id),prev=number===1||s.built.includes(e.kind+"_"+(number-1)),locked=s.level<e.level,k=card(title,"Cấp "+e.level+" · "+e.kitCost+" bộ vật liệu · "+hours(e.hours),e.id);
    k.classList.toggle("locked",locked);
    k.append(paragraph(e.kind==="plot"?"Thêm 9 ô trồng":"Tổng "+e.capacityAfter+" chỗ nuôi"));
    if(done)k.append(paragraph("✓ Đã xây","ready-text"));
    else if(job)k.append(timer(job.readyAt),readyButton("Nhận",job.readyAt,()=>run(x=>E.claimBuildings(x,Date.now()),"Công trình đã hoàn tất.",{action:"claimBuildings"})));
    else k.append(paragraph(locked?"Chờ cấp "+e.level:!prev?"Hoàn thành công trình trước cùng loại.":""),button("Xây",()=>run(x=>E.build(x,e.id,Date.now()),"Đã khởi công "+title+".",{action:"build",expansionId:e.id}),{disabled:locked||!prev||s.inventory.kit<e.kitCost,class:"primary"}));
    g.append(k);
   }
   body.append(g);
  },

  inventory(){
   const s=getState(),supplies=ctx.getSupplies?.();
   const cropIds=new Set(DB.crops.map(c=>c.id));
   const seedEntries=supplies?Object.entries(supplies.seeds||{}).filter(([,n])=>n>0):[];
   const cropEntries=Object.entries(s.inventory||{}).filter(([id,q])=>q>0&&cropIds.has(id));
   const craftedEntries=Object.entries(s.inventory||{}).filter(([id,q])=>q>0&&!cropIds.has(id)&&!id.startsWith("produce_"));
   const produceEntries=[
    ...Object.entries(s.inventory||{}).filter(([id,q])=>q>0&&id.startsWith("produce_")),
    ...Object.entries(s.keepsakes||{}).filter(([,q])=>q>0).map(([id,q])=>["keepsake_"+id,q]),
   ];

   const totalSeeds=seedEntries.reduce((acc,[,n])=>acc+Number(n||0),0);
   const totalCrops=cropEntries.reduce((acc,[,n])=>acc+Number(n||0),0);
   const totalCrafted=craftedEntries.reduce((acc,[,n])=>acc+Number(n||0),0);

   const summary=el("section",{class:"inv-summary-strip"},[
    el("div",{class:"inv-stat-card"},[
     visualItemIcon(items,"water",{size:44,kind:"water"}),
     el("div",{class:"inv-stat-copy"},[
      el("small",{text:"NƯỚC TƯỚI"}),
      el("strong",{text:supplies?`${num(supplies.water)} phần`:"Miễn phí"}),
      el("span",{text:getSession().connected?"Dùng 1 phần / ô gieo":"Gieo miễn phí"}),
     ]),
    ]),
    el("div",{class:"inv-stat-card"},[
     visualItemIcon(items,"boost",{size:44,kind:"boost"}),
     el("div",{class:"inv-stat-copy"},[
      el("small",{text:"PHÂN BÓN"}),
      el("strong",{text:`${num(supplies?.boost||0)} gói`}),
      el("span",{text:getSession().connected?"Giảm 10% thời gian lớn":"Quà đã lưu trên thiết bị"}),
     ]),
    ]),
    el("div",{class:"inv-stat-card"},[
     visualItemIcon(items,"kit",{size:44}),
     el("div",{class:"inv-stat-copy"},[
      el("small",{text:"VẬT LIỆU"}),
      el("strong",{text:`${num(s.inventory.kit||0)} bộ`}),
      el("span",{text:"Mở thửa & chuồng nuôi"}),
     ]),
    ]),
    el("div",{class:"inv-stat-card"},[
     visualItemIcon(items,"pumpkin",{size:44,kind:"seed"}),
     el("div",{class:"inv-stat-copy"},[
      el("small",{text:"TỔNG DỰ TRỮ KHO"}),
      el("strong",{text:`${num(totalSeeds+totalCrops+totalCrafted)} món`}),
      el("span",{text:`${seedEntries.length} loại hạt · ${cropEntries.length} nông sản`}),
     ]),
    ]),
   ]);
   body.append(summary);

   const filterBar=el("div",{class:"inv-filter-bar"});
   const tabs=el("div",{class:"inv-tabs",role:"group","aria-label":"Nhóm vật phẩm trong kho"});
   const tabDefs=[
    ["all",`Tất cả (${seedEntries.length+cropEntries.length+craftedEntries.length+produceEntries.length})`],
    ["seeds",`🌱 Hạt giống (${seedEntries.length})`],
    ["crops",`🌾 Nông sản (${cropEntries.length})`],
    ["crafted",`⚗ Thức ăn & Vật liệu (${craftedEntries.length})`],
    ["produce",`✦ Sản vật & Kỷ vật (${produceEntries.length})`],
   ];
   for(const [id,text] of tabDefs){
    tabs.append(button(text,()=>{invFilter=id;refresh();},{"aria-pressed":String(invFilter===id),class:"inv-tab-btn"}));
   }
   const quickActions=el("div",{class:"inv-quick-actions"},[
    button("⚗ Chế biến",()=>show("craft")),
    button("✦ Trang trí & Kỷ vật",()=>show("collection")),
    ...(ctx.openStore?[button("◉ Tiệm vật tư",()=>{close();ctx.openStore();},{class:"primary"})]:[]),
   ]);
   filterBar.append(tabs,quickActions);
   body.append(filterBar);

   function makeInvCard({id,visualId,kind="",title,subtitle,qty,actionText="",onAction=null}){
    const c=el("article",{class:"inv-card inventory-item","data-item-id":id},[
     el("div",{class:"inv-card-top"},[
      el("span",{class:"inv-kind-tag",text:subtitle}),
      el("strong",{class:"inv-qty-pill",text:`×${num(qty)}`}),
     ]),
     el("div",{class:"inv-art-wrap"},[
      visualItemIcon(items,visualId||id,{size:54,kind}),
     ]),
     el("strong",{class:"inv-item-title",text:title}),
    ]);
    if(actionText&&onAction){
     c.append(button(actionText,onAction,{class:"inv-card-action"}));
    }
    return c;
   }

   function appendSection(headingText,kickerText,cardsList){
    if(!cardsList.length)return;
    const sec=el("section",{class:"inv-section"});
    sec.append(
     el("div",{class:"inv-section-head"},[
      el("div",{},[el("small",{class:"journey-kicker",text:kickerText}),el("h3",{text:headingText})]),
      el("span",{class:"inv-section-count",text:`${cardsList.length} mục`}),
     ])
    );
    const g=el("div",{class:"inventory-grid inv-visual-grid"});
    for(const item of cardsList)g.append(item);
    sec.append(g);
    body.append(sec);
   }

   const seedCards=[];
   if(supplies){
    if(supplies.water>0){
     seedCards.push(makeInvCard({id:"water",visualId:"water",kind:"water",title:"Nước tưới suối rừng",subtitle:"Vật tư chăm vườn",qty:supplies.water,actionText:ctx.openStore?"Mua thêm":"",onAction:ctx.openStore?()=>{close();ctx.openStore("water");}:null}));
    }
    if((supplies.boost||0)>0){
     seedCards.push(makeInvCard({id:"boost",visualId:"boost",kind:"boost",title:"Phân bón tăng trưởng",subtitle:"Vật tư chăm vườn",qty:supplies.boost}));
    }
    for(const [id,n] of seedEntries){
     const crop=DB.crops.find(c=>c.id===id);
     seedCards.push(makeInvCard({
      id:"seed_"+id,
      visualId:id,
      kind:"seed",
      title:"Hạt "+label(id),
      subtitle:crop?`Hạt giống · Cấp ${crop.level}`:"Hạt giống",
      qty:n,
      actionText:"Chọn gieo",
      onAction:()=>{selectCrop(id);close();},
     }));
    }
   }

   const cropCards=cropEntries.map(([id,q])=>{
    const crop=DB.crops.find(c=>c.id===id);
    return makeInvCard({
     id,
     visualId:id,
     title:label(id),
     subtitle:crop?`Nông sản · ${hours(crop.hours)}`:"Nông sản thu hoạch",
     qty:q,
     actionText:"Gieo thêm",
     onAction:()=>{selectCrop(id);close();},
    });
   });

   const craftedCards=craftedEntries.map(([id,q])=>{
    const creatureId=FEED_CREATURE_MAP[id];
    const creature=creatureId?DB.animals.find(a=>a.id===creatureId):null;
    const sub=id==="kit"?"Vật liệu xây dựng":id==="insects"||id==="fish"?"Nguyên liệu đạm":creature?`Khẩu phần · ${creature.label}`:"Chế phẩm";
    return makeInvCard({
     id,
     visualId:id,
     kind:creatureId?"food":"",
     title:label(id),
     subtitle:sub,
     qty:q,
     actionText:creature?"Đến chuồng":"Chế biến",
     onAction:creature?()=>{selectCreature(creature.id);close();}:()=>show("craft"),
    });
   });

   const produceCards=produceEntries.map(([id,q])=>{
    const isKeep=id.startsWith("keepsake_");
    const cId=id.replace(/^(produce_|keepsake_)/,"");
    const creature=DB.animals.find(a=>a.id===cId);
    return makeInvCard({
     id,
     visualId:id,
     kind:isKeep?"keepsake":"produce",
     title:isKeep?`Kỷ vật ${creature?.label||cId}`:label(id),
     subtitle:isKeep?"Kỷ vật trân quý":`Sản vật · ${creature?.label||""}`,
     qty:q,
     actionText:"Bộ sưu tập",
     onAction:()=>show("collection"),
    });
   });

   if(invFilter==="all"||invFilter==="seeds")appendSection("Túi hạt giống & Vật tư chăm vườn","VẬT TƯ GIEO TRỒNG",seedCards);
   if(invFilter==="all"||invFilter==="crops")appendSection("Nông sản đã thu hoạch","THÀNH QUẢ MÙA VỤ",cropCards);
   if(invFilter==="all"||invFilter==="crafted")appendSection("Khẩu phần & Nguyên liệu chế biến","BÀN THỨC ĂN & XƯỞNG NGHỀ",craftedCards);
   if(invFilter==="all"||invFilter==="produce")appendSection("Sản vật sinh vật & Kỷ vật","BỘ SƯU TẬP QUÝ HIẾM",produceCards);

   if(!seedCards.length&&!cropCards.length&&!craftedCards.length&&!produceCards.length){
    body.append(paragraph("Kho đang trống. Gieo hạt rồi gặt cây chín hoặc ghé Tiệm của người giữ vườn để bắt đầu.","empty"));
   }
  },

  collection(){
   const s=getState(),session=getSession();
   body.append(paragraph("Kỷ vật và vật phẩm trang trí không cho XP. Mọi vật phẩm trang trí đều hỗ trợ xoay 2 góc (↖ Góc hiện tại & ↗ Góc nhìn qua phải) để bày biện theo ý thích."));

   const storeDecors=[...(ctx.decorAssets?.values?.()??[])].filter(a=>a.rotatable||a.id?.startsWith("decor_"));
   if(storeDecors.length){
    body.append(el("h3",{text:"Vật phẩm trang trí Tiệm (Đặt & Xoay 2 góc)"}));
    const sg=grid();
    const decorState=ctx.getDecorations?.()??session?.decorations??{};
    for(const item of storeDecors){
     const owned=Boolean(decorState?.owned?.includes(item.id));
     const slotIdx=owned?(decorState.placements?.indexOf(item.id)??-1):-1;
     const slotLabel=slotIdx>=0?DECOR_SLOTS.find(sl=>sl.id===slotIdx)?.label:null;
     const facing=decorFacingFor(decorState,item.id);
     const angleText=facing==="right"?"Góc nhìn qua phải ↗":"Góc hiện tại ↖";
     const sub=owned?(slotLabel?`Đang đặt: ${slotLabel} · ${angleText}`:`Đã sở hữu · Đang cất (${angleText})`):"Mở tại Tiệm của người giữ vườn";
     const k=card(decorLabelFor(item),sub,item.id,{kind:"decoration",decorAssets:ctx.decorAssets,badge:"2 góc",facing});
     if(owned&&ctx.openDecorate){
      k.append(actions(
       button("Đặt & Xoay góc",()=>{close();ctx.openDecorate(item);},{class:"primary"}),
       button(facing==="right"?"Đổi về ↖ Góc hiện tại":"Xoay sang ↗ Góc phải",async()=>{
        const nextFacing=facing==="right"?"default":"right";
        const targetSlot=slotIdx>=0?slotIdx:0;
        await ctx.quickRotateDecor?.(item.id,targetSlot,nextFacing);
        refresh();
       })
      ));
     }else if(ctx.openStore){
      k.append(button("Mở Tiệm trang trí",()=>{close();ctx.openStore("decoration");}));
     }
     sg.append(k);
    }
    body.append(sg);
   }

   const g=grid();
   body.append(el("h3",{text:"Kỷ vật sinh vật"}));
   for(const a of DB.animals.filter(a=>a.level<=s.level)){
    const q=s.inventory["produce_"+a.id]||0,k=card(a.label,(s.keepsakes[a.id]||0)+" kỷ vật · "+q+" "+a.produce,"produce_"+a.id,{kind:"produce"});
    k.append(button("Đổi kỷ vật "+a.label,()=>run(x=>E.exchangeKeepsake(x,a.id),"Đã đổi kỷ vật "+a.label+".",{action:"exchangeKeepsake",species:a.id}),{disabled:q<5}));
    g.append(k);
   }
   body.append(g,el("h3",{text:"Mẫu trang trí lối đi (Xoay 2 góc)"}));
   const dec=grid();
   const earnedRot=ctx.getEarnedDecorRotations?.()??s.decorationRotations??{};
   for(const d of DB.decorations.filter(d=>d.level<=s.level)){
    const owned=s.decorations.includes(d.id);
    const facing=earnedRot[d.id]==="right"?"right":"default";
    const angleTag=facing==="right"?"Góc nhìn qua phải ↗":"Góc hiện tại ↖";
    const k=card(d.label,"Cấp "+d.level+" · "+(d.cost?d.cost+" bộ vật liệu":"Miễn phí")+(owned?` · ${angleTag}`:""),d.id,{kind:"decoration",facing,badge:"2 góc"});
    const btnRow=[
     button(owned?"✓ Đã có":"Nhận "+d.label,()=>run(x=>E.buyDecoration(x,d.level),"Đã thêm "+d.label+" vào vườn.",{action:"buyDecoration",level:d.level}),{disabled:owned||s.level<d.level||s.inventory.kit<d.cost}),
    ];
    if(owned&&ctx.rotateEarnedDecoration){
     btnRow.push(button(`↻ Xoay (${facing==="right"?"↗ Phải":"↖ Hiện tại"})`,()=>{ctx.rotateEarnedDecoration(d.id);refresh();},{"data-rotate-earned-decor":d.id}));
    }
    k.append(actions(...btnRow));
    dec.append(k);
   }
   body.append(dec);
  },

  layout(){
   const s=getState();
   const barBtns=[button("Xem toàn vườn",()=>{ctx.camera.overview();close();})];
   if(ctx.openVisualLayout)barBtns.unshift(button("Sắp xếp",()=>{close();ctx.openVisualLayout();},{class:"primary","data-open-visual-layout":"true"}));
   body.append(detail("Đổi nền cùng loại miễn phí. Cây, bữa ăn và tiến độ đi cùng công trình; không nhận XP."),toolbar(...barBtns));
   const g=grid();
   for(const kind of ["plot","pen"]){
    const total=kind==="plot"?12:6,count=kind==="plot"?s.plots.length:E.housingCapacity(s)/2,positions=s.layout?.[kind==="plot"?"plots":"pens"]||Array.from({length:total},(_,i)=>i);
    for(let i=0;i<count;i++){
     const name=(kind==="plot"?"Thửa ":"Chuồng ")+(i+1),k=card(name,"Đang ở nền "+(positions[i]+1),kind+"_"+(i+1)),sel=el("select",{"aria-label":"Vị trí "+name,class:"quantity",style:"width:auto"});
     for(let j=0;j<total;j++){
      const slot=ctx.layoutSlots?.[kind==="plot"?"plots":"pens"]?.[j],current=ctx.getGardenStage?.()??gardenStage(s),fits=stage=>!slot||stageContains(stage,slot.col-.5,slot.row-.5)&&stageContains(stage,slot.col+slot.width,slot.row+slot.height),available=fits(current),required=GARDEN_STAGES.find(fits)?.level;
      sel.append(el("option",{value:j,disabled:!available,text:"Nền "+(j+1)+(available?"":" · mở khu cấp "+required)}));
     }
     sel.value=positions[i];
     k.append(actions(sel,button("Chuyển",()=>run(x=>E.moveBuilding(x,kind,i,Number(sel.value)),"Đã chuyển "+name+".",{action:"moveBuilding",kind,index:i,targetSlot:Number(sel.value)}))));
     g.append(k);
    }
   }
   body.append(g);
  },

  almanac(){
   const s=getState();
   const almanac=renderAlmanacSection({
     DB,
     items,
     state:s,
     onSelectCrop:id=>{selectCrop(id);close();},
     onSelectCreature:id=>{selectCreature(id);close();},
     onOpenCraft:feedId=>{recipeFilter=feedId;show("craft");},
     onOpenPostcard:ctx.openPostcard?()=>{close();ctx.openPostcard();}:null,
    });
   body.append(almanac,toolbar(button("Lưu bút",()=>show("guestbook"),{"data-open-guestbook":"true"})));
  },

  achievements(){
   const s=getState();
   body.append(
    renderAchievementsSection({
     state:s,
     extra:ctx.getAchievementExtra?.()??{},
     onSelectTitle:achId=>{ctx.onSelectTitle?.(achId);refresh();},
     onClaimReward:achId=>{ctx.onClaimAchievement?.(achId);refresh();},
     onOpenPostcard:ctx.openPostcard?()=>{close();ctx.openPostcard();}:null,
    })
   );
  },

  tour(){
   body.append(
    renderTourSection({
     activeTourId:ctx.getActiveTourId?.()??null,
     onStartTour:tourId=>{close();ctx.startTour?.(tourId);},
     onStopTour:()=>{close();ctx.stopTour?.();},
     onHelpTour:tourId=>{ctx.helpTour?.(tourId);refresh();},
    })
   );
  },

  events(){
   const s=getState();
   const ev=ctx.getEvent?.()??{id:"event_halloween"};
   body.append(
    renderEventsAndTasksSection({
     E,
     items,
     state:s,
     extra:ctx.getAchievementExtra?.()??{},
     eventMode:ev.id,
     onSelectEvent:eventId=>{ctx.onSelectEvent?.(eventId);refresh();},
     onApplyEventTheme:cfg=>{ctx.onApplyEventTheme?.(cfg);refresh();},
     onClaimEventMilestone:mId=>{ctx.onClaimEventMilestone?.(mId);refresh();},
     onClaimDailyQuest:qId=>{ctx.onClaimDailyQuest?.(qId);refresh();},
     onClaimGrandChest:()=>{ctx.onClaimGrandChest?.();refresh();},
     onRouteQuest:route=>{
      if(route==="craft")show("craft");
      else if(route==="creature")show("creatures");
      else if(route==="tour")show("tour");
      else if(route==="events")refresh();
      else{close();ctx.focusPlot?.(0);}
     },
     onPetCreature:speciesId=>{ctx.onPetCreature?.(speciesId);refresh();},
     onClaimAffinityGift:giftId=>{ctx.onClaimAffinityGift?.(giftId);refresh();},
    })
   );
  },

  profile(){
   const s=getState(),session=getSession();
   body.append(
    el("section",{class:"v24-profile-view"},[
     el("small",{class:"journey-kicker",text:"HỒ SƠ"}),
     el("h3",{text:$("playerName")?.textContent||"Người làm vườn"}),
     paragraph(`Cấp ${s.level}/100 · ${num(s.xp)} XP`),
     toolbar(
      ...(ctx.openProfile?[button("Chỉnh sửa",()=>{close();ctx.openProfile();})]:[]),
      button("Lộ trình",()=>show("roadmap")),
      button("Thành tựu",()=>show("achievements")),
      button("Gắn kết",()=>show("affinity")),
      button("Lưu bút",()=>show("guestbook")),
     ),
    ]),
   );
  },

  affinity(){
   const s=getState(),selected=getSelection()?.species;
   const speciesId=selected&&s.creatures.some((creature)=>creature.species===selected)?selected:null;
   body.append(renderAffinitySection({
    E,
    items,
    creatureFacings:ctx.getCreatureFacings?.()??{},
    state:s,
    speciesId,
    onPetCreature:species=>{ctx.onPetCreature?.(species);refresh();},
    onClaimAffinityGift:giftId=>{ctx.onClaimAffinityGift?.(giftId);refresh();},
   }));
  },

  guestbook(){
   const eventCfg=ctx.getEvent?.()??{id:"event_halloween"};
   body.append(renderGuestbookSection({state:getState(),eventMode:eventCfg.id,extra:ctx.getAchievementExtra?.()??{}}));
  },

  scenery(){
   body.append(renderSceneryPicker(ctx));
  },

  settings(){
   const session=getSession();
   body.append(renderGardenSettings(ctx,{onScenery:()=>show("scenery"),exportSave}));
   if(session.qa&&!session.connected){
    const select=el("select",{"aria-label":"Cấp thử nghiệm"});
    for(const n of[1,10,12,18,22,24,30,48,50,66,72,90,94,100])select.append(el("option",{value:n,text:"Cấp "+n}));
    body.append(el("details",{class:"v24-qa-tools"},[
     el("summary",{text:"QA"}),
     paragraph("Tạo phiên thử với mốc cấp và vật tư mở sẵn."),
     toolbar(select,button("Tạo phiên thử",()=>switchSession("lab",Number(select.value)),{class:"primary"}),button("Về vườn thường",()=>switchSession("play"),{disabled:session.session==="play"})),
     el("h3",{text:"Đồng hồ"}),
     session.session==="lab"
      ? el("div",{},[paragraph("Đã tua "+duration(getState().offsetMs||0)+"."),toolbar(...[2,6,24].map(h=>button("Tua "+h+" giờ",()=>run(x=>E.advanceTime(x,h*3600000),"Đã tua "+h+" giờ."))))])
      : paragraph("Mở phiên thử để tua thời gian."),
    ]));
   }
  },

  menu(){
   body.append(renderGardenMenu(ctx,{
    tour:()=>show("tour"),postcard:()=>{close();ctx.openPostcard?.();},
    almanac:()=>show("almanac"),guestbook:()=>show("guestbook"),
    events:()=>show("events"),settings:()=>show("settings"),
   }));
  }
 };
 return {show,refresh,close};
}
