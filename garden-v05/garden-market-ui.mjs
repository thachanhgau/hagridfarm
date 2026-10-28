import {el,button,num,visualItemIcon} from "./ui-utils.mjs?v=24.9.89";
import {pixelIcon,iconButton} from "./pixel-icons.mjs?v=24.9.89";
import {CROP} from "./balance-data.mjs?v=24.9.89";

// Quầy chợ bác Hagrid (owner 26/10/2026; rules on the HPVN server, functions/games/garden-market-core.js):
// from level 25 Gringotts buys harvested crops, at most `perCropDaily` of a crop and `dailyCap` Galleons a
// VN day. The server sends prices and today's counts in `snapshot.market`; this only draws the cards.
// Xả kho (owner 28/10/2026): while `market.clearance` holds, one button sells the whole crop barn once, past
// both limits; it asks for a second tap because it cannot be undone.
export function marketCards({market,inventory,items,quantities,busy,onSell}){
 if(!market.open)return [el("p",{class:"empty",text:`Quầy chợ bác Hagrid mở từ cấp ${market.unlockLevel}. Lên cấp rồi mang nông sản tới bán lấy Galleons.`})];
 const capLeft=Math.max(0,market.dailyCap-market.earned);
 const day=el("p",{class:"meta market-day",role:"status",text:`Hôm nay quầy đã trả ${num(market.earned)}/${num(market.dailyCap)} Galleons · mỗi loại tối đa ${market.perCropDaily}.`});
 const crops=Object.keys(market.prices).filter(id=>(inventory?.[id]??0)>0);
 if(!crops.length)return [day,el("p",{class:"empty",text:"Kho chưa có nông sản để bán. Gặt xong rồi quay lại nhé."})];
 return [day,...clearanceRow({market,inventory,crops,busy,onSell}),...crops.map(id=>{
  const price=market.prices[id],label=CROP[id]?.label||id,have=inventory[id],left=Math.max(0,market.perCropDaily-(market.sold?.[id]||0));
  const max=Math.min(have,left,Math.floor(capLeft/price));
  let count=Math.max(Math.min(max,1),Math.min(max,quantities.get(id)||1));
  const qty=el("output",{class:"gp-qty-value","aria-live":"polite"});
  const sell=button("",()=>{if(!busy&&count>0)onSell({[id]:count},count*price,`${count} ${label}`);},{class:"primary store-buy-btn","data-market-sell":id});
  const minus=iconButton("minus","Bớt 1 "+label,()=>set(count-1),{class:"gp-step"});
  const plus=iconButton("plus","Thêm 1 "+label,()=>set(count+1),{class:"gp-step"});
  const all=button("Tối đa",()=>set(max),{class:"store-bundle-chip gp-chip","aria-label":`Bán tối đa ${max} ${label}`});
  function paint(){
   const text=`Bán ${count} ${label} · ${num(count*price)} Galleons`;
   qty.replaceChildren(el("b",{text:String(count)}));
   sell.replaceChildren(pixelIcon("coin",1),el("span",{text:"+"+num(count*price)}));
   sell.setAttribute("aria-label",text);sell.title=text;
   sell.disabled=busy||count<1;minus.disabled=busy||count<=1;plus.disabled=busy||count>=max;all.disabled=busy||count>=max;
  }
  function set(n){count=Math.min(max,Math.max(Math.min(max,1),n));quantities.set(id,count);paint();}
  paint();
  const note=left===0?"Hết lượt hôm nay":capLeft<price?"Quầy hết tiền hôm nay":`Còn ${left}/${market.perCropDaily} hôm nay`;
  return el("article",{class:`card store-card gp-tile kind-harvest${max<1?" is-locked":""}`,"data-market-crop":id},[
   el("div",{class:"gp-tile-art"},[visualItemIcon(items,id,{size:56,kind:"harvest",badge:`×${num(have)}`})]),
   el("strong",{class:"gp-tile-name",text:label}),
   el("small",{class:"gp-tile-sub store-stock-note",text:`Kho ${num(have)}`}),
   el("div",{class:"store-meta-row"},[el("span",{class:"gp-price"},[pixelIcon("coin",1),el("b",{text:num(price)}),el("small",{text:"/cái"})]),el("small",{class:"meta",text:note})]),
   el("div",{class:"store-action-row gp-tile-actions"},max<1?[el("span",{class:"gp-state",text:note})]:[el("div",{class:"gp-stepper",role:"group","aria-label":"Số "+label+" muốn bán"},[minus,qty,plus]),all,sell]),
  ]);
 })];
}

function clearanceRow({market,inventory,crops,busy,onSell}){
 if(!market.clearance)return [];
 const pieces=crops.reduce((n,id)=>n+inventory[id],0),total=crops.reduce((n,id)=>n+inventory[id]*market.prices[id],0);
 let armed=false;
 const go=button("",()=>{if(busy)return;if(!armed){armed=true;paint();return;}onSell(null,total,`cả kho (${num(pieces)} nông sản)`);},{class:"primary store-buy-btn","data-market-clear":""});
 function paint(){go.replaceChildren(pixelIcon("coin",1),el("span",{text:armed?`Bấm lần nữa · +${num(total)}`:`Bán hết · +${num(total)}`}));go.disabled=busy;go.setAttribute("aria-label",`Xả kho: bán hết ${num(pieces)} nông sản lấy ${num(total)} Galleons, một lần duy nhất`);}
 paint();
 return [el("div",{class:"market-clear"},[el("span",{class:"meta",text:`Xả kho 1 lần · ${num(pieces)} nông sản · không tính hạn mức`}),go])];
}
