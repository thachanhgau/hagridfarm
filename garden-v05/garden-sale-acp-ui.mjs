// ACP sale of Khu Vườn Hagrid, inside the game, for KTV Gia Tinh only (owner 23/10/2026; the server checks the
// account on every call: manageHagridGardenSales). The four scheduled programs run from code; here each can be
// switched off, and hand sales (at most 40%) added with a start and an end in Vietnam time.
import {$,el,num} from './ui-utils.mjs?v=24.9.71';
import {iconButton} from './pixel-icons.mjs?v=24.9.71';

const SCOPE_LABELS = Object.freeze({all:'Mọi món có sale',crop:'Vật phẩm cây',creature:'Vật phẩm sinh vật, Ổ ấm',festival:'Đồ lễ hội',items:'Chọn món'});
const WEEKDAYS = ['CN','T2','T3','T4','T5','T6','T7'];
const toLocal = ms => new Date(ms+7*3600000).toISOString().slice(0,16);
const fromLocal = value => Date.parse(`${value}:00+07:00`);
const when = ms => {const d=new Date(ms+7*3600000);return `${WEEKDAYS[d.getUTCDay()]} ${d.getUTCDate()}/${d.getUTCMonth()+1} ${String(d.getUTCHours()).padStart(2,'0')}:${String(d.getUTCMinutes()).padStart(2,'0')}`;};

export function createSaleAcp({call,notify}){
 let view=null,draft=null,saving=false;
 const body=el('div',{class:'acp-body'}),status=el('p',{class:'meta',role:'status','aria-live':'polite'});
 const dialog=el('dialog',{id:'saleAcp',class:'owl-letter acp-letter','aria-labelledby':'saleAcpTitle'},[
  el('div',{class:'popover-heading'},[el('h2',{id:'saleAcpTitle',text:'ACP sale · KTV Gia Tinh'}),iconButton('close','Đóng',()=>dialog.close(),{class:'gp-close'})]),
  status,body,
 ]);
 ($('gameShell')||document.body).append(dialog);

 const fresh=()=>{const now=view.serverNow;return {id:`sale-${Date.now().toString(36)}`,title:'Sale bác Hagrid',scope:'all',percent:20,itemIds:[],startsAt:now,endsAt:now+2*3600000};};
 function saleRow(sale,index){
  const field=(label,input)=>el('label',{class:'acp-field'},[el('small',{text:label}),input]);
  const set=(key,value)=>{draft.sales[index]={...draft.sales[index],[key]:value};};
  const title=el('input',{type:'text',maxlength:'40',value:sale.title,oninput:e=>set('title',e.target.value)});
  const scope=el('select',{onchange:e=>{set('scope',e.target.value);render();}},view.scopes.map(id=>{const o=el('option',{value:id,text:SCOPE_LABELS[id]||id});if(id===sale.scope)o.selected=true;return o;}));
  const percent=el('input',{type:'number',min:'1',max:String(view.percentMax),step:'1',value:String(sale.percent),oninput:e=>set('percent',Math.round(Number(e.target.value)))});
  const starts=el('input',{type:'datetime-local',value:toLocal(sale.startsAt),onchange:e=>set('startsAt',fromLocal(e.target.value))});
  const ends=el('input',{type:'datetime-local',value:toLocal(sale.endsAt),onchange:e=>set('endsAt',fromLocal(e.target.value))});
  const picks=sale.scope==='items'?el('select',{multiple:'',size:'6',onchange:e=>set('itemIds',[...e.target.selectedOptions].map(o=>o.value))},view.items.map(item=>{const o=el('option',{value:item.id,text:`${item.label} · ${num(item.price)} G`});if(sale.itemIds.includes(item.id))o.selected=true;return o;})):null;
  return el('fieldset',{class:'acp-sale'},[
   field('Tên đợt',title),field('Phạm vi',scope),...(picks?[field('Món (giữ Ctrl/⌘ để chọn nhiều)',picks)]:[]),
   field(`Giảm % (1–${view.percentMax})`,percent),field('Bắt đầu (giờ VN)',starts),field('Kết thúc (giờ VN)',ends),
   iconButton('close',`Xóa đợt ${sale.title}`,()=>{draft.sales.splice(index,1);render();},{text:'Xóa'}),
  ]);
 }
 function render(){
  if(!view){body.replaceChildren(el('p',{class:'meta',text:'Đang tải cấu hình…'}));return;}
  const now=view.serverNow;
  body.replaceChildren(
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
 async function load(){
  status.textContent='';view=null;render();
  try{view=await call({mode:'get'});draft=structuredClone({programs:view.config.programs,sales:view.config.sales});render();}
  catch(e){status.textContent=e.message;}
 }
 async function save(){
  if(saving)return;saving=true;render();
  try{view=await call({mode:'save',expectedRevision:view.config.revision,programs:draft.programs,sales:draft.sales});draft=structuredClone({programs:view.config.programs,sales:view.config.sales});status.textContent=`Đã lưu (phiên bản ${view.config.revision}).`;notify?.('Đã lưu cấu hình sale khu vườn.');}
  catch(e){status.textContent=e.message;}
  finally{saving=false;render();}
 }
 return {open(){dialog.showModal();load();}};
}
