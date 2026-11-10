import test from 'node:test';
import assert from 'node:assert/strict';
import {toLocal,fromLocal,foldText,createSaleAcp} from './garden-sale-acp-ui.mjs?v=25.1.4';

// ACP sale times are typed in Vietnam time as DD/MM/YYYY HH:mm (24 h), whatever the device locale.
test('ACP sale time reads and writes DD/MM/YYYY HH:mm in Vietnam time', () => {
  const ms = Date.parse('2026-10-24T19:30:00+07:00');
  assert.equal(toLocal(ms), '24/10/2026 19:30');
  assert.equal(fromLocal('24/10/2026 19:30'), ms);
  assert.equal(fromLocal(' 4/1/2027 7:05 '), Date.parse('2027-01-04T07:05:00+07:00'));
  for (const bad of ['31/02/2026 10:00', '24/10/2026 25:00', '2026-10-24T19:30', '']) assert.ok(Number.isNaN(fromLocal(bad)), bad);
  assert.equal(toLocal(NaN), '');
});

// ACP search ignores case and Vietnamese marks; «Đ» capital folded after lowering (mock run 28/10/2026 found 0 hits).
test('ACP item search matches «đèn bí» to «Đèn bí ngô» and «suoi» to «Nước suối thần»', async () => {
  assert.ok(foldText('Đèn bí ngô').includes(foldText('đèn bí')));
  assert.ok(foldText('Nước suối thần').includes(foldText('suoi')));
  assert.equal(foldText('ĐẶC BIỆT'), 'dac biet');
  // Older snapshots lack store/market data: every ACP tab must still render.
  const previousDocument=globalThis.document;
  class Node {
    constructor(){this.children=[];this.listeners={};}
    set textContent(value){this.text=String(value);this.children=[];}
    get textContent(){return this.text||this.children.map(n=>n.textContent).join('');}
    setAttribute(key,value){this[key]=value;}
    addEventListener(key,fn){this.listeners[key]=fn;}
    append(...nodes){this.children.push(...nodes);}
    replaceChildren(...nodes){this.text='';this.children=nodes;}
    showModal(){}
  }
  const host=new Node();
  globalThis.document={getElementById:()=>host,createElement:()=>new Node(),createTextNode:text=>({textContent:text}),body:host};
  try {
    const config={revision:0,programs:{},sales:[]};
    const acp=createSaleAcp({call:async()=>({config,serverNow:0,programs:[],flash:[]}),notify:()=>{}});
    acp.open();await Promise.resolve();
    const body=host.children[0].children[2];
    for(const label of ['Bảng giá','Quầy chợ','Tặng đồ']){
      const tab=body.children[0].children.find(n=>n.textContent===label);
      assert.ok(tab,label);assert.doesNotThrow(()=>tab.listeners.click());
      if(label==='Quầy chợ')assert.match(body.textContent,/Chưa có dữ liệu/);
    }
  } finally {globalThis.document=previousDocument;}

});
