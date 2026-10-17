import {DECOR_SLOTS,decorFacingFor} from "./decor-runtime.mjs?v=24.9.26";
import {$,el,button,num,visualItemIcon} from "./ui-utils.mjs?v=24.9.26";
import {unlockedCatalog} from "./garden-store-catalog.mjs?v=24.9.26";

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
 boost: "Phân bón thảo dược",
 decoration: "Trang trí · 2 góc xoay",
});

export function showStore({state,items,wallet,connected,onPurchase,onDecorate,decorAssets=new Map(),onClose,initialFilter="all"}){
 document.querySelector(".store-overlay")?.remove();
 let filter=initialFilter,purchasing=false;const quantities=new Map();
 const overlay=el("div",{class:"store-overlay"}),shade=el("div",{class:"popover-shade"});
 const box=el("section",{class:"popover store-popover",role:"dialog","aria-modal":"true","aria-labelledby":"storeTitle"});
 const heading=el("div",{class:"popover-heading"}),status=el("div",{class:"wallet-status store-vault-banner"}),tabs=el("div",{class:"panel-toolbar store-tabs",role:"group","aria-label":"Nhóm vật tư"}),notice=el("p",{class:"meta store-notice",role:"status","aria-live":"polite"}),cards=el("div",{class:"cards store-cards-grid"});
 const close=()=>{if(purchasing)return;overlay.remove();onClose?.();$("shopButton")?.focus();};
 heading.append(
  el("div",{class:"store-heading-copy"},[
   el("small",{text:"VẬT TƯ & ĐỒ TRANG TRÍ · HẺM XÉO HAGRID"}),
   el("h2",{id:"storeTitle",text:"Cửa hàng"}),
  ]),
  button("×",close,{"aria-label":"Đóng cửa hàng"})
 );
 shade.onclick=close;

 const categories=[
  ["all","Tất cả"],
  ["seed","🌱 Hạt giống"],
  ["water","💧 Nước tưới"],
  ["food","♨ Thức ăn"],
  ["boost","✨ Tăng trưởng"],
  ["decoration","🏮 Trang trí"],
 ];

 const catalog=()=>{
  const remote=wallet?.snapshot?.catalog;
  return (connected&&Array.isArray(remote)&&remote.length>0)?remote:unlockedCatalog(state.level);
 };

 function ownedStockText(item,snap){
  const sup=snap?.garden?.supplies;
  if(item.kind==="seed"){
   const cId=item.cropId||item.id.replace(/^seed_/,"");
   const count=sup?.seeds?.[cId]??0;
   return `Trong kho: ${num(count)} hạt`;
  }
  if(item.kind==="water")return `Trong kho: ${num(sup?.water??0)} phần`;
  if(item.kind==="boost")return `Trong kho: ${num(sup?.boost??0)} gói`;
  if(item.kind==="food"){
   const invId=item.inventoryId||item.id;
   const count=snap?.garden?.progression?.inventory?.[invId]??state?.inventory?.[invId]??0;
   return `Trong kho: ${num(count)} phần`;
  }
  if(item.kind==="decoration"){
   const owned=Boolean(snap?.garden?.decorations?.owned?.includes(item.id));
   return owned?"Đã sở hữu · Có 2 góc xoay":"Món sưu tầm · Mua 1 lần · 2 góc xoay";
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

  status.replaceChildren(
   el("div",{class:"store-vault-left"},[
    el("div",{class:"store-vault-title-row"},[
     el("span",{class:"store-coin-emblem",text:"◉"}),
     el("div",{},[
      el("span",{class:"store-wallet-label",text:snap?(wallet?.isPreview?"VÍ XEM THỬ":"VÍ GRINGOTTS"):"XEM TRƯỚC"}),
      el("p",{class:"store-wallet-sub",text:snap?`Ví ${num(walletBal)} G · Ngân hàng ${num(bankBal)} G`:"Giá và hạn mức theo cấp độ hiện tại. Kết nối ví Gringotts để giao dịch."}),
     ]),
    ]),
    sup?el("div",{class:"store-supply-pills"},[
     el("span",{class:"store-supply-pill",text:`💧 Nước: ${num(sup.water||0)}`}),
     el("span",{class:"store-supply-pill",text:`✨ Phân bón: ${num(sup.boost||0)}`}),
     el("span",{class:"store-supply-pill",text:`🌱 Giống đã mở: ${allItems.filter(i=>i.kind==="seed").length}/24`}),
    ]):null,
   ]),
   el("div",{class:"store-vault-right"},[
    el("small",{text:"KHẢ DỤNG"}),
    el("strong",{class:"store-galleons-total",text:snap?`${num(spendable)} Galleons`:"Xem trước"}),
   ])
  );

  cards.replaceChildren();
  tabs.replaceChildren();
  for(const[id,name]of categories){
   const count=id==="all"?allItems.length:allItems.filter(i=>i.kind===id).length;
   if(id!=="all"&&count===0)continue;
   tabs.append(button(`${name} (${count})`,()=>{filter=id;render();tabs.querySelector("[aria-pressed=\"true\"]")?.focus();},{"data-kind":id,"aria-pressed":String(id===filter),class:"store-tab-btn"}));
  }

  for(const item of allItems.filter(i=>filter==="all"||i.kind===filter)){
   const isDecor=item.kind==="decoration";
   const decorState=snap?.garden?.decorations;
   const owned=isDecor&&Boolean(decorState?.owned?.includes(item.id));
   const slot=owned?(decorState.placements?.indexOf(item.id)??-1):-1;
   const facing=owned?decorFacingFor(decorState,item.id):"default";
   const location=slot>=0?DECOR_SLOTS.find(s=>s.id===slot)?.label:null;

   const card=el("article",{class:`card store-card kind-${item.kind}${isDecor?" decor-card":""}`,"data-store-item":item.id});
   const packBadge=isDecor?"2 góc":`×${item.quantity}`;
   const artVisual=visualItemIcon(items,item.icon||item.id,{size:56,kind:item.kind,decorAssets,badge:packBadge});

   const head=el("div",{class:"card-head store-card-head"},[
    artVisual,
    el("div",{class:"store-card-title-wrap"},[
     el("div",{class:"store-card-badges"},[
      el("span",{class:`store-kind-pill kind-${item.kind}`,text:KIND_LABELS[item.kind]||item.kind}),
      el("span",{class:"store-level-pill",text:`Cấp ${item.level}`}),
     ]),
     el("strong",{text:item.label}),
     el("small",{class:"store-stock-note",text:ownedStockText(item,snap)}),
    ]),
   ]);

   const remaining=item.dailyRemaining??item.dailyLimit;
   const qty=el("select",{"aria-label":"Số gói "+item.label,disabled:purchasing||!snap||remaining===0,class:"store-qty-select"});
   const max=Math.max(1,Math.min(remaining||1,24));
   for(let n=1;n<=max;n++)qty.append(el("option",{value:n,text:n+" gói ("+(n*item.quantity)+" phần)"}));
   qty.value=String(Math.min(max,quantities.get(item.id)||1));

   const totalCost=()=>item.price*Number(qty.value||1);

   const buy=button(
    owned?"Đặt / Xoay góc":snap?(remaining===0?"Hết hạn mức ngày":`Mua · ${num(totalCost())} G`):"Cần kết nối ví",
    async()=>{
     if(purchasing)return;
     if(owned){close();onDecorate?.(item);return;}
     purchasing=true;notice.textContent="Đang xác nhận giao dịch…";
     const count=Number(qty.value);render();
     try{
      await onPurchase(item.id,count);
      notice.textContent=isDecor?"Đã sở hữu "+item.label+". Nhấn Đặt / Xoay góc để trang trí vườn.":"Đã mua "+count+" gói "+item.label+". Vật tư đã vào kho.";
     }catch(e){
      notice.textContent=e.message;
     }finally{
      purchasing=false;render();
     }
    },
    {
     disabled:!snap||purchasing||(!owned&&(remaining===0||spendable<totalCost())),
     class:owned?"primary store-owned-action":"primary store-buy-btn",
    }
   );

   qty.onchange=()=>{
    quantities.set(item.id,Number(qty.value));
    buy.textContent=`Mua · ${num(totalCost())} G`;
    buy.disabled=purchasing||!snap||remaining===0||spendable<totalCost();
   };

   const descText=isDecor?(DECOR_COPY[item.id]||item.description):item.description;
   const angleTag=facing==="right"?"Góc nhìn qua phải ↗":"Góc hiện tại ↖";
   const quotaText=isDecor
    ?(owned?(location?`✓ Đã đặt · ${location} (${angleTag})`:"✓ Đã sở hữu · đang cất"):"Mua 1 lần · xoay 2 góc & đặt tự do")
    :(snap?`Hạn mức hôm nay: còn ${remaining}/${item.dailyLimit} gói`:`Giới hạn: ${item.dailyLimit} gói / ngày`);
   const priceText=isDecor
    ?(owned?"Xoay & di chuyển miễn phí":`${num(item.price)} Galleons`)
    :`${num(item.price)} Galleons / gói (${item.quantity} phần)`;

   const metaRow=el("div",{class:"store-meta-row"},[
    el("span",{class:owned?"meta decor-owned":"meta",text:quotaText}),
    el("span",{class:"store-price",text:priceText}),
   ]);

   const actionRow=el("div",{class:"store-action-row"},isDecor?[buy]:[qty,buy]);
   card.append(head,el("p",{class:"store-desc",text:descText}),metaRow,actionRow);
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
 heading.querySelector("button").focus();
 overlay.addEventListener("keydown",e=>{
  if(e.key==="Escape"){e.preventDefault();e.stopPropagation();close();}
  if(e.key==="Tab"){
   const f=[...box.querySelectorAll("button:not(:disabled),select:not(:disabled)")],first=f[0],last=f.at(-1);
   if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
   else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  }
 });
}
