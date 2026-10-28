// ACP of Khu Vườn Hagrid, inside the game, for KTV Gia Tinh only (owner 23/10/2026, widened 28/10/2026; the server
// checks the account on every call: manageHagridGardenSales). Tabs: Sale (the four scheduled programs on/off, hand
// sales up to 40%), Bảng giá (price, on sale, limits of every store item), Quầy chợ (unlock level, caps, buying
// prices) and Tặng đồ (store goods into one member's garden). An empty box means the code value, shown as its hint.
import {$,el,num,button} from './ui-utils.mjs?v=24.9.88';
import {iconButton} from './pixel-icons.mjs?v=24.9.88';

const SCOPE_LABELS = Object.freeze({all:'Mọi món có sale',crop:'Vật phẩm cây',creature:'Vật phẩm sinh vật, Ổ ấm',festival:'Đồ lễ hội',items:'Chọn món'});
const WEEKDAYS = ['CN','T2','T3','T4','T5','T6','T7'];
const TABS = [['sale','Sale'],['store','Bảng giá'],['market','Quầy chợ'],['gift','Tặng đồ']];
const GROUPS = [['seed','Hạt giống',i=>i.kind==='seed'],['supply','Vật tư',i=>['water','food','boost','spring'].includes(i.kind)],['premium','Cao cấp',i=>['premium','nest'].includes(i.kind)],
 ['decor','Trang trí',i=>i.kind==='decoration'&&!i.collection],['special','Đặc biệt',i=>i.collection==='special'],['festival','Lễ hội',i=>i.collection==='festival']];
const ITEM_FIELDS = [['price','Giá (G)'],['dailyLimit','Mua/ngày'],['stockCap','Trữ tối đa'],['usesPerDay','Dùng/ngày']];
const MARKET_FIELDS = [['level','Mở từ cấp'],['dailyCap','Trần G/ngày'],['perCropDaily','Mỗi loại/ngày']];
const fold = text => String(text||'').toLowerCase().normalize('NFD').replace(/\p{M}/gu,'').replace(/đ/g,'d');
// Vietnam time typed as DD/MM/YYYY HH:mm (24 h): datetime-local followed the device locale and showed AM/PM.
export const toLocal = ms => {if(!Number.isFinite(ms))return "";const d=new Date(ms+7*3600000),p=n=>String(n).padStart(2,'0');return `${p(d.getUTCDate())}/${p(d.getUTCMonth()+1)}/${d.getUTCFullYear()} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;};
export const foldText = fold;
export const fromLocal = value => {const m=/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})$/.exec(value.trim());if(!m)return NaN;const [,d,mo,y,h,mi]=m,ms=Date.parse(`${y}-${mo.padStart(2,'0')}-${d.padStart(2,'0')}T${h.padStart(2,'0')}:${mi}:00+07:00`);return toLocal(ms)===`${d.padStart(2,'0')}/${mo.padStart(2,'0')}/${y} ${h.padStart(2,'0')}:${mi}`?ms:NaN;};
const when = ms => {const d=new Date(ms+7*3600000);return `${WEEKDAYS[d.getUTCDay()]} ${d.getUTCDate()}/${d.getUTCMonth()+1} ${String(d.getUTCHours()).padStart(2,'0')}:${String(d.getUTCMinutes()).padStart(2,'0')}`;};

export function createSaleAcp({call,notify}){
 let view=null,draft=null,saving=false,tab='sale',group='seed',search='',gift={username:'',itemId:'',quantity:1,query:''};
 const body=el('div',{class:'acp-body'}),status=el('p',{class:'meta',role:'status','aria-live':'polite'});
 const dialog=el('dialog',{id:'saleAcp',class:'owl-letter acp-letter','aria-labelledby':'saleAcpTitle'},[
  el('div',{class:'popover-heading'},[el('h2',{id:'saleAcpTitle',text:'ACP bác Hagrid'}),iconButton('close','Đóng',()=>dialog.close(),{class:'gp-close'})]),
  status,body,
 ]);
 ($('gameShell')||document.body).append(dialog);

 const fresh=()=>{const now=view.serverNow;return {id:`sale-${Date.now().toString(36)}`,title:'Sale bác Hagrid',scope:'all',percent:20,itemIds:[],startsAt:now,endsAt:now+2*3600000};};
 const field=(label,input)=>el('label',{class:'acp-field'},[el('small',{text:label}),input]);
 // A chip row is not wrapped in <label>: a label activates its first button (tapping the caption picked an item).
 const chipField=(label,group)=>el('div',{class:'acp-field'},[el('small',{text:label}),group]);
 // Empty = the code value (its hint); a typed value equal to it is not stored either.
 const numField=(label,base,value,set)=>field(label,el('input',{type:'number',min:'1',step:'1',inputmode:'numeric',placeholder:String(base),value:value??'',oninput:e=>set(e.target.value===''?undefined:Math.round(Number(e.target.value)))}));
 const chips=(label,list,current,pick)=>el('div',{class:'gp-chips acp-chips',role:'group','aria-label':label},list.map(([id,name])=>button(name,()=>pick(id),{class:'gp-chip','aria-pressed':String(id===current)})));
 function itemRow(item){
  const row=draft.items[item.id]||{};
  const set=(key,value)=>{const next={...draft.items[item.id]};if(value===undefined||value===item[key])delete next[key];else next[key]=value;if(Object.keys(next).length)draft.items[item.id]=next;else delete draft.items[item.id];};
  return el('fieldset',{class:'acp-sale acp-compact'},[
   el('p',{class:'sheet-label acp-item',text:`${item.label} · cấp ${item.level}`}),
   ...ITEM_FIELDS.filter(([key])=>item[key]!==undefined).map(([key,label])=>numField(label,item[key],row[key],value=>set(key,value))),
   el('label',{class:'acp-toggle'},[el('input',{type:'checkbox',...((row.forSale??item.forSale)?{checked:''}:{}),onchange:e=>set('forSale',e.target.checked)}),el('span',{text:'Đang bán'})]),
   ...(draft.items[item.id]?[iconButton('close',`Về mặc định ${item.label}`,()=>{delete draft.items[item.id];render();},{text:'Mặc định'})]:[]),
  ]);
 }
 function storeTab(){
  const pick=GROUPS.find(([id])=>id===group)[2],q=fold(search);
  const list=view.store.filter(item=>q?fold(item.label).includes(q):pick(item));
  const box=el('input',{type:'search',placeholder:'Tìm món…',value:search,oninput:e=>{search=e.target.value;const at=e.target.selectionStart;render();const again=body.querySelector('input[type=search]');again?.focus();again?.setSelectionRange(at,at);}});
  return [field('Tìm trong mọi nhóm',box),...(q?[]:[chips('Nhóm',GROUPS,group,id=>{group=id;render();})]),
   el('p',{class:'sheet-label',text:`${list.length} món · đã chỉnh ${Object.keys(draft.items).length} món`}),...list.map(itemRow)];
 }
 function marketTab(){
  const m=view.market,set=(key,value)=>{if(value===undefined||value===m.defaults[key])delete draft.market[key];else draft.market[key]=value;};
  const price=(id,value)=>{if(value===undefined||value===m.prices[id])delete draft.market.prices[id];else draft.market.prices[id]=value;};
  return [el('fieldset',{class:'acp-sale acp-compact'},MARKET_FIELDS.map(([key,label])=>numField(label,m.defaults[key],draft.market[key],value=>set(key,value)))),
   el('p',{class:'sheet-label',text:'Giá thu mua mỗi nông sản (G)'}),
   el('fieldset',{class:'acp-sale acp-compact'},m.crops.map(crop=>numField(crop.label,m.prices[crop.id],draft.market.prices[crop.id],value=>price(crop.id,value))))];
 }
 function giftTab(){
  const q=fold(gift.query),item=view.store.find(entry=>entry.id===gift.itemId);
  const matches=q?view.store.filter(entry=>fold(entry.label).includes(q)).slice(0,12):[];
  const send=async()=>{
   if(!gift.username.trim()||!item||!(gift.quantity>=1)){status.textContent='Nhập tên thành viên, chọn món và số lượng.';return;}
   saving=true;render();
   try{const reply=await call({mode:'gift',username:gift.username.trim(),itemId:item.id,quantity:gift.quantity});status.textContent=`Đã tặng ${num(reply.gift.quantity)} × ${reply.gift.label} cho ${reply.gift.toUsername}.`;notify?.(status.textContent);}
   catch(e){status.textContent=e.message;}
   finally{saving=false;render();}
  };
  return [el('fieldset',{class:'acp-sale'},[
    field('Tên thành viên',el('input',{type:'text',maxlength:'40',autocomplete:'off',value:gift.username,oninput:e=>{gift.username=e.target.value;}})),
    field('Số lượng (gói)',el('input',{type:'number',min:'1',step:'1',inputmode:'numeric',value:String(gift.quantity),oninput:e=>{gift.quantity=Math.round(Number(e.target.value));}})),
    field('Tìm món',el('input',{type:'search',placeholder:'Gõ tên món…',value:gift.query,onchange:e=>{gift.query=e.target.value;render();}})),
    ...(matches.length?[chipField('Chạm để chọn',chips('Món',matches.map(entry=>[entry.id,entry.label]),gift.itemId,id=>{gift.itemId=id;render();}))]:[]),
   ]),
   el('p',{class:'meta',text:item?`Tặng: ${item.label} · gói ${num(item.quantity||1)}. Bỏ qua cấp, mùa lễ hội, trạng thái bán và trần kho; đồ trang trí đã có thì không tặng thêm.`:'Chưa chọn món.'}),
   el('div',{class:'acp-actions'},[iconButton('check','Gửi quà cho thành viên',send,{text:saving?'Đang tặng…':'Tặng',class:'primary',disabled:saving||!item})])];
 }
 function saleRow(sale,index){
  const set=(key,value)=>{draft.sales[index]={...draft.sales[index],[key]:value};};
  const title=el('input',{type:'text',maxlength:'40',value:sale.title,oninput:e=>set('title',e.target.value)});
  // Chips, not native <select>: no browser list box or white scrollbar inside the game.
  const scope=el('div',{class:'gp-chips acp-chips',role:'group','aria-label':'Phạm vi'},view.scopes.map(id=>button(SCOPE_LABELS[id]||id,()=>{set('scope',id);render();},{class:'gp-chip','aria-pressed':String(id===sale.scope)})));
  const percent=el('input',{type:'number',min:'1',max:String(view.percentMax),step:'1',value:String(sale.percent),oninput:e=>set('percent',Math.round(Number(e.target.value)))});
  const time=key=>el('input',{type:'text',inputmode:'numeric',placeholder:'DD/MM/YYYY HH:mm',value:toLocal(sale[key]),onchange:e=>{const ms=fromLocal(e.target.value);e.target.setCustomValidity(Number.isFinite(ms)?'':'Nhập theo DD/MM/YYYY HH:mm');set(key,ms);}});
  const starts=time('startsAt'),ends=time('endsAt');
  const picks=sale.scope==='items'?el('div',{class:'gp-chips acp-chips',role:'group','aria-label':'Món giảm giá'},view.items.map(item=>button(`${item.label} · ${num(item.price)} G`,e=>{const ids=draft.sales[index].itemIds,on=!ids.includes(item.id);set('itemIds',on?[...ids,item.id]:ids.filter(id=>id!==item.id));e.currentTarget.setAttribute('aria-pressed',String(on));},{class:'gp-chip','aria-pressed':String(sale.itemIds.includes(item.id))}))):null;
  return el('fieldset',{class:'acp-sale'},[
   field('Tên đợt',title),chipField('Phạm vi',scope),...(picks?[chipField('Món (chạm để chọn, chạm lại để bỏ)',picks)]:[]),
   field(`Giảm % (1–${view.percentMax})`,percent),field('Bắt đầu (giờ VN)',starts),field('Kết thúc (giờ VN)',ends),
   iconButton('close',`Xóa đợt ${sale.title}`,()=>{draft.sales.splice(index,1);render();},{text:'Xóa'}),
  ]);
 }
 function render(){
  if(!view){body.replaceChildren(el('p',{class:'meta',text:'Đang tải cấu hình…'}));return;}
  const now=view.serverNow;
  const tabs=chips('Mục ACP',TABS,tab,id=>{tab=id;status.textContent='';render();});
  const saveRow=el('div',{class:'acp-actions'},[iconButton('check','Lưu cấu hình',save,{text:saving?'Đang lưu…':'Lưu',class:'primary',disabled:saving})]);
  const version=el('p',{class:'meta',text:`Phiên bản ${view.config.revision}. Giá và hạn mức tính trên máy chủ lúc mua; Lưu ghi cả bốn mục Sale, Bảng giá, Quầy chợ.`});
  if(tab==='store'){body.replaceChildren(tabs,...storeTab(),saveRow,version);return;}
  if(tab==='market'){body.replaceChildren(tabs,...marketTab(),saveRow,version);return;}
  if(tab==='gift'){body.replaceChildren(tabs,...giftTab());return;}
  body.replaceChildren(tabs,
   el('p',{class:'sheet-label',text:'Chương trình tự động (chạy theo code)'}),
   ...view.programs.map(p=>el('label',{class:'acp-toggle'},[el('input',{type:'checkbox',...(draft.programs[p.id]?{checked:''}:{}),onchange:e=>{draft.programs[p.id]=e.target.checked;}}),el('span',{text:p.label})])),
   el('p',{class:'meta',text:'Flash 30 phút sắp tới: '+(view.flash.length?view.flash.map(w=>`${when(w.startsAt)}–${when(w.endsAt).slice(-5)}`).join(' · '):'không còn trong 2 tuần này')}),
   el('p',{class:'sheet-label',text:`Đợt sale tay (${draft.sales.length}/20)`}),
   ...draft.sales.map(saleRow),
   el('div',{class:'acp-actions'},[
    iconButton('plus','Thêm đợt sale',()=>{draft.sales.push(fresh());render();},{text:'Thêm đợt',disabled:draft.sales.length>=20}),
    iconButton('check','Lưu cấu hình sale',save,{text:saving?'Đang lưu…':'Lưu',class:'primary',disabled:saving}),
   ]),
   el('p',{class:'meta',text:`Phiên bản ${view.config.revision}. Giá luôn tính trên máy chủ lúc mua; sale và gói cộng lại tối đa 50%. Đợt đang chạy: ${draft.sales.filter(s=>s.startsAt<=now&&now<s.endsAt).length}.`}),
  );
 }
 const fromConfig=config=>structuredClone({programs:config.programs,sales:config.sales,items:config.items||{},market:{prices:{},...config.market}});
 async function load(){
  status.textContent='';view=null;render();
  try{view=await call({mode:'get'});draft=fromConfig(view.config);render();}
  catch(e){status.textContent=e.message;}
 }
 async function save(){
  if(saving)return;
  if(draft.sales.some(s=>!Number.isFinite(s.startsAt)||!Number.isFinite(s.endsAt))){status.textContent='Giờ bắt đầu/kết thúc phải theo DD/MM/YYYY HH:mm.';return;}
  saving=true;render();
  try{view=await call({mode:'save',expectedRevision:view.config.revision,programs:draft.programs,sales:draft.sales,items:draft.items,market:draft.market});draft=fromConfig(view.config);status.textContent=`Đã lưu (phiên bản ${view.config.revision}).`;notify?.('Đã lưu cấu hình ACP khu vườn.');}
  catch(e){status.textContent=e.message;}
  finally{saving=false;render();}
 }
 return {open(){dialog.showModal();load();}};
}
