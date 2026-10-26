import {DECOR_SLOTS,decorFacingFor} from "./decor-runtime.mjs?v=24.9.81";
import {$,el,button,num,visualItemIcon,packTotal} from "./ui-utils.mjs?v=24.9.81";
import {STORE_CATALOG,storeLock,storeVisible} from "./garden-store-catalog.mjs?v=24.9.81";
import {pixelIcon,iconButton} from "./pixel-icons.mjs?v=24.9.81";
import {SPECIAL_COLLECTION,BOOK_TITLES,SEASON_LABELS} from "./special-products.mjs?v=24.9.81";
import {BUNDLE_SIZES,bundlePercent,saleLeft} from "./premium-products.mjs?v=24.9.81";

const DECOR_COPY = Object.freeze({
 decor_pumpkin_lantern: "Ánh bí ngô ấm bên lối đi (hỗ trợ 2 góc đặt).",
 decor_broom_rack: "Một góc gọn gàng cho những chuyến bay (hỗ trợ 2 góc đặt).",
 decor_cauldron: "Vạc thuốc tím sôi lục bục trong góc vườn (hỗ trợ 2 góc đặt).",
 decor_mandrake_planter: "Một Nhân sâm nhỏ nhúc nhích trong chậu đất (hỗ trợ 2 góc đặt).",
 decor_floating_candles: "Những ngọn nến bay lung linh trên đế đồng (hỗ trợ 2 góc đặt).",
 decor_vine_arch: "Dây leo và hoa đung đưa ôm lấy cổng vòm (hỗ trợ 2 góc đặt).",
});

const KIND_LABELS = Object.freeze({
 seed: "Gói hạt giống",
 water: "Nước suối rừng",
 food: "Khẩu phần sinh vật",
 boost: "Nước phép",
 decoration: "Trang trí · 2 góc xoay",
});
const KIND_ICONS = Object.freeze({all: "more", seed: "seed", water: "water", food: "feed", boost: "boost", premium: "chest", decoration: "scenery", special: "trophy", festival: "festival"});
// Level-500 P4: a premium item's unit, and what is in stock against its cap.
const unitOf = item => item.kind === "nest" ? "ổ" : item.supply === "primeMeal" ? "phần" : item.kind === "boost" || item.kind === "spring" || item.kind === "premium" ? "chai" : "gói";
const stockOf = (item, snap) => item.supply ? Number(snap?.garden?.supplies?.[item.supply] ?? 0) : 0;
const coinChip = (n, extra = "") => el("span", {class: "gp-price"}, [pixelIcon("coin", 1), el("b", {text: num(n)}), extra ? el("small", {text: extra}) : null]);

export function showStore({state,items,wallet,connected,onPurchase,onDecorate,decorAssets=new Map(),onClose,initialFilter="all"}){
 document.querySelector(".store-overlay")?.remove();
 let filter=initialFilter,purchasing=false,clock=null;const quantities=new Map(),previewFacing=new Map();
 const overlay=el("div",{class:"store-overlay"}),shade=el("div",{class:"popover-shade"});
 const box=el("section",{class:"popover store-popover",role:"dialog","aria-modal":"true","aria-labelledby":"storeTitle"});
 const heading=el("div",{class:"popover-heading"}),status=el("div",{class:"wallet-status store-vault-banner"}),tabs=el("div",{class:"panel-toolbar store-tabs",role:"group","aria-label":"Nhóm vật tư"}),notice=el("p",{class:"meta store-notice",role:"status","aria-live":"polite"}),cards=el("div",{class:"cards store-cards-grid"});
 const close=()=>{if(purchasing)return;clearInterval(clock);overlay.remove();onClose?.();$("shopButton")?.focus();};
 heading.append(
  el("div",{class:"store-heading-copy"},[
   el("h2",{id:"storeTitle",text:"Cửa hàng"}),
  ]),
  iconButton("close","Đóng cửa hàng",close,{class:"gp-close"})
 );
 shade.onclick=close;

 // Nước suối thần shares the Nước phép tab; «Sản phẩm đặc biệt» are decorations with their own tab.
 // Festival pieces (`season`) have their own shop tab, «Lễ hội».
 const tabOf=i=>i.season?"festival":i.collection===SPECIAL_COLLECTION?"special":i.kind==="spring"||i.kind==="nest"?"premium":i.kind;
 const categories=[
  ["all","Tất cả"],
  ["seed","Hạt giống"],
  ["water","Nước tưới"],
  ["food","Thức ăn"],
  ["boost","Nước phép"],
  ["premium","Cao cấp"],
  ["decoration","Trang trí"],
  ["special","Sản phẩm đặc biệt"],
  ["festival","Lễ hội"],
 ];

 const catalog=()=>{
  const remote=wallet?.snapshot?.catalog;
  // Every item shows; one the wallet does not sell yet (level, festival) is a locked card with the reason.
  const sold=new Map(((connected&&Array.isArray(remote)&&remote.length>0)?remote:STORE_CATALOG.filter(i=>!storeLock(i,state.level))).map(i=>[i.id,i]));
  const owned=new Set(wallet?.snapshot?.garden?.decorations?.owned??[]);
  return [...STORE_CATALOG.filter(i=>storeVisible(i,state.level)).map(i=>sold.get(i.id)||(owned.has(i.id)?i:{...i,locked:storeLock(i,state.level)||"Chưa mở bán"})),...[...sold.values()].filter(i=>!STORE_CATALOG.some(c=>c.id===i.id))];
 };

 function ownedStockText(item,snap){
  const sup=snap?.garden?.supplies;
  if(item.kind==="seed"){
   const cId=item.cropId||item.id.replace(/^seed_/,"");
   const count=sup?.seeds?.[cId]??0;
   return `Kho ${num(count)}`;
  }
  if(item.kind==="water")return `Kho ${num(sup?.water??0)}`;
  if(item.kind==="boost")return `Kho ${num(sup?.boost??0)}`;
  if(item.stockCap)return `Kho ${num(stockOf(item,snap))}/${num(item.stockCap)}`;
  if(item.kind==="spring")return `Kho ${num(sup?.spring??0)}`;
  if(item.kind==="nest")return item.owned?"Đã lót ổ":`Chuồng ${item.pen} · mua 1 lần`;
  if(item.kind==="food"){
   const invId=item.inventoryId||item.id;
   const count=snap?.garden?.progression?.inventory?.[invId]??state?.inventory?.[invId]??0;
   return `Kho ${num(count)}`;
  }
  if(item.kind==="decoration"){
   const owned=Boolean(snap?.garden?.decorations?.owned?.includes(item.id));
   return owned?"Đã có":"Mua 1 lần";
  }
  return "";
 }

 function render(){
  const snap=wallet?.snapshot;
  const allItems=catalog();
  const spendable=Number(snap?.wallet?.spendable??0);
  const walletBal=Number(snap?.wallet?.balance??spendable);
  const bankBal=Number(snap?.wallet?.bankBalance??0);
  const sup=snap?.garden?.supplies;

  status.replaceChildren(...[
   el("div",{class:"gp-wallet",title:snap?`Ví ${num(walletBal)} G · Ngân hàng ${num(bankBal)} G`:"Giá theo cấp hiện tại. Nối ví Gringotts để mua."},[
    pixelIcon("coin",2),
    snap?el("strong",{class:"store-galleons-total",text:num(spendable)}):el("span",{class:"lock-badge is-wide"},[pixelIcon("lock",1),el("b",{text:"Nối ví"})]),
    el("small",{text:snap?(wallet?.isPreview?"Ví xem thử":"Galleons"):"Xem trước"}),
   ]),
   sup?el("div",{class:"store-supply-pills gp-chips"},[
    el("span",{class:"reward-chip",title:"Nước"},[pixelIcon("water",1),el("b",{text:num(sup.water||0)})]),
    el("span",{class:"reward-chip",title:"Nước phép"},[pixelIcon("boost",1),el("b",{text:num(sup.boost||0)})]),
    el("span",{class:"reward-chip",title:"Giống đã mở"},[pixelIcon("seed",1),el("b",{text:`${allItems.filter(i=>i.kind==="seed"&&!i.locked).length}/24`})]),
   ]):null,
  ].filter(Boolean));

  cards.replaceChildren();
  tabs.replaceChildren();
  for(const[id,name]of categories){
   const count=id==="all"?allItems.length:allItems.filter(i=>tabOf(i)===id).length;
   if(id!=="all"&&count===0)continue;
   const tab=button("",()=>{filter=id;render();tabs.querySelector("[aria-pressed=\"true\"]")?.focus();},{"data-kind":id,"aria-pressed":String(id===filter),"aria-label":`${name} (${count})`,title:name,class:"store-tab-btn gp-tab"});
   tab.append(pixelIcon(KIND_ICONS[id],2),el("span",{text:name}),el("b",{class:"gp-tab-count",text:String(count)}));
   tabs.append(tab);
  }

  for(const item of allItems.filter(i=>filter==="all"||tabOf(i)===filter)){
   const isDecor=item.kind==="decoration";
   const decorState=snap?.garden?.decorations;
   const owned=isDecor&&Boolean(decorState?.owned?.includes(item.id));
   const slot=owned?(decorState.placements?.indexOf(item.id)??-1):-1;
   const facing=owned?decorFacingFor(decorState,item.id):"default";
   const location=slot>=0?(decorState.positions?.[item.id]?"Đang bày trong vườn":DECOR_SLOTS.find(s=>s.id===slot)?.label):null;

   const card=el("article",{class:`card store-card gp-tile kind-${item.kind}${isDecor?" decor-card":""}${item.locked?" is-locked":""}`,"data-store-item":item.id});
   const packBadge=isDecor?"2 góc":`×${item.quantity}`;
   // Decorations preview either angle in the card (both are drawn views, never a mirror).
   const shownFacing=previewFacing.get(item.id)||facing;
   const artId=item.kind==="food"?item.id:item.icon||item.id;
   const artVisual=visualItemIcon(items,artId,{size:56,kind:item.kind,decorAssets,badge:packBadge,facing:shownFacing});

   const head=el("div",{class:"gp-tile-art"},[artVisual]);
   const angleBtn=isDecor?iconButton("replay",`Xem góc ${shownFacing==="right"?"trái ↖":"phải ↗"} của ${item.label}`,()=>{previewFacing.set(item.id,shownFacing==="right"?"default":"right");render();},{class:"gp-step store-angle-btn","data-store-angle":item.id}):null;
   // The HPVN server lists «Sản phẩm đặc biệt» before the owner approves their prices, without selling them.
   const pendingPrice=item.forSale===false;
   const remaining=item.dailyRemaining??item.dailyLimit;
   const tiered=Boolean(item.overflowMultiplier);
   // Premium items: no purchase cap, the stock cap bounds a bundle (×30 at most).
   const room=item.stockCap?Math.max(0,item.stockCap-stockOf(item,snap)):null;
   const max=item.bundles?Math.max(1,Math.min(30,room??30)):tiered?24:Math.max(1,Math.min(remaining||1,24));
   let count=Math.min(max,quantities.get(item.id)||1);
   const totalCost=()=>packTotal(item,count);
   const unit=unitOf(item);
   const canBuy=()=>snap&&!pendingPrice&&!purchasing&&!item.owned&&room!==0&&(tiered||item.bundles||remaining!==0)&&spendable>=totalCost();
   const buyLabel=()=>owned?"Đặt "+item.label:`Mua ${count} ${unit} ${item.label} · ${num(totalCost())} Galleons`;

   const buy=button("",async()=>{
     if(purchasing)return;
     if(owned){close();onDecorate?.(item);return;}
     purchasing=true;notice.textContent="Đang xác nhận giao dịch…";
     const n=count;render();
     try{
      await onPurchase(item.id,n);
      notice.textContent=isDecor?"Đã có "+item.label+". Bấm Đặt để trang trí vườn.":"Đã mua "+n+" "+unit+" "+item.label+".";
     }catch(e){
      notice.textContent=e.message;
     }finally{
      purchasing=false;render();
     }
    },{class:owned?"primary store-owned-action":"primary store-buy-btn"});
   const paintBuy=()=>{
    buy.replaceChildren(...(owned?[pixelIcon("scenery",2),el("span",{text:"Đặt"})]:[pixelIcon("coin",1),el("span",{text:num(totalCost())})]));
    buy.setAttribute("aria-label",buyLabel());buy.title=buyLabel();
    buy.disabled=owned?false:!canBuy();
   };

   const qtyValue=el("output",{class:"gp-qty-value","aria-live":"polite"});
   const paintQty=()=>{qtyValue.replaceChildren(el("b",{text:String(count)}),el("small",{text:`×${item.quantity}`}));qtyValue.title=`${count} ${unit} · ${count*item.quantity} phần`;minus.disabled=!snap||purchasing||count<=1;plus.disabled=!snap||purchasing||count>=max;};
   const step=d=>{count=Math.min(max,Math.max(1,count+d));quantities.set(item.id,count);paintQty();paintBuy();paintBundles();};
   // Gói ×5/×10/×30 (−10/20/30%), only those the stock cap still allows.
   const bundleRow=item.bundles&&snap&&!item.locked?el("div",{class:"store-bundles gp-chips",role:"group","aria-label":"Gói mua nhiều "+item.label}):null;
   const paintBundles=()=>bundleRow?.replaceChildren(...BUNDLE_SIZES.filter(n=>n>1&&n<=max).map(n=>button(`×${n} −${bundlePercent(n)}%`,()=>{count=n;quantities.set(item.id,n);paintQty();paintBuy();paintBundles();},{class:"store-bundle-chip gp-chip","aria-pressed":String(count===n),"aria-label":`Gói ${n} ${unit}, giảm ${bundlePercent(n)}%`})));
   const minus=iconButton("minus","Bớt 1 "+unit+" "+item.label,()=>step(-1),{class:"gp-step"});
   const plus=iconButton("plus","Thêm 1 "+unit+" "+item.label,()=>step(1),{class:"gp-step"});
   paintQty();paintBuy();paintBundles();

   const angleTag=facing==="right"?"Góc nhìn qua phải ↗":"Góc hiện tại ↖";
   const quota=item.stockCap?`Dùng ${item.usesPerDay}/ngày`:item.kind==="nest"?"Vĩnh viễn":isDecor?(owned?(location?`${location} · ${angleTag}`:"Đang cất"):""):tiered?(snap&&remaining===0?`Quá ${num(item.dailyLimit)} ${unit} · giá ×${item.overflowMultiplier}`:`Còn ${num(snap?remaining:item.dailyLimit)}/${num(item.dailyLimit)} giá thường`):(snap?`Còn ${remaining}/${item.dailyLimit} hôm nay`:`${item.dailyLimit} ${unit}/ngày`);
   const descText=isDecor?(DECOR_COPY[item.id]||item.description):item.description;
   const special=item.collection===SPECIAL_COLLECTION;
   card.title=descText;
   const unitPrice=item.sale?packTotal(item,1):item.price;
   const price=isDecor?(owned?null:coinChip(unitPrice,pendingPrice?"đề xuất":"")):coinChip(unitPrice,"/"+unit);
   if(item.sale&&price)price.prepend(el("s",{class:"gp-price-was",text:num(item.price)}));
   // A real sale with its real end (roadmap §10.3); the store clock below keeps the minutes true.
   const saleBadge=item.sale?el("span",{class:"store-sale-badge","data-ends":String(item.sale.endsAt),title:item.sale.title,text:`−${item.sale.percent}% ${item.sale.title} · ${saleLeft(item.sale)}`}):null;
   let action;
   if(item.locked)action=el("span",{class:"lock-badge is-wide",role:"img","aria-label":item.locked,title:item.locked},[pixelIcon("lock",1),el("b",{text:item.locked})]);
   else if(!snap)action=el("span",{class:"lock-badge is-wide",role:"img","aria-label":"Cần nối ví Gringotts để mua",title:"Cần nối ví Gringotts để mua"},[pixelIcon("lock",1),el("b",{text:"Nối ví"})]);
   else if(!owned&&pendingPrice)action=el("span",{class:"lock-badge is-wide",role:"img","aria-label":"Giá đang chờ duyệt, chưa bán",title:"Giá đang chờ duyệt, chưa bán"},[pixelIcon("lock",1),el("b",{text:"Chờ duyệt giá"})]);
   else if(item.kind==="nest"&&item.owned)action=el("span",{class:"gp-state",text:"Đã có"});
   else if(room===0)action=el("span",{class:"gp-state",text:"Kho đầy"});
   else if(!owned&&!tiered&&!item.bundles&&remaining===0)action=el("span",{class:"gp-state",text:"Hết hôm nay"});
   else action=buy;
   card.append(head,...(angleBtn?[angleBtn]:[]),...(saleBadge?[saleBadge]:[]),
    el("strong",{class:"gp-tile-name",text:item.label}),
    el("small",{class:"gp-tile-sub store-stock-note",text:(special||item.season)&&!owned?(item.season?`Chỉ bán trong ${SEASON_LABELS[item.season]||"mùa lễ hội"}`:`${BOOK_TITLES[item.book]||""} · ch. ${item.chapter}`):ownedStockText(item,snap)}),
    el("div",{class:"store-meta-row"},[price,el("small",{class:owned?"meta decor-owned":"meta",text:quota})]),
    ...(bundleRow?[bundleRow]:[]),
    el("div",{class:"store-action-row gp-tile-actions"},isDecor||item.kind==="nest"||!snap||item.locked?[action]:[el("div",{class:"gp-stepper",role:"group","aria-label":"Số "+unit+" "+item.label},[minus,qtyValue,plus]),action]));
   cards.append(card);
  }
  if(!cards.childElementCount){
   cards.append(el("p",{class:"empty",text:"Chưa có vật tư thuộc nhóm này ở cấp hiện tại."}));
  }
 }
 cards.setAttribute("aria-label","Danh mục cửa hàng");
 box.append(heading,status,tabs,notice,cards);
 overlay.append(shade,box);
 $("gameShell").append(overlay);
 render();
 clock=setInterval(()=>{for(const badge of box.querySelectorAll("[data-ends]")){const ends=Number(badge.dataset.ends);if(ends<=Date.now()){badge.textContent="Đợt sale đã hết";badge.classList.add("is-over");}else badge.textContent=badge.textContent.replace(/ · .*$/,` · ${saleLeft({endsAt:ends})}`);}},30000);
 heading.querySelector("button").focus();
 overlay.addEventListener("keydown",e=>{
  if(e.key==="Escape"){e.preventDefault();e.stopPropagation();close();}
  if(e.key==="Tab"){
   const f=[...box.querySelectorAll("button:not(:disabled)")],first=f[0],last=f.at(-1);
   if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
   else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  }
 });
}
