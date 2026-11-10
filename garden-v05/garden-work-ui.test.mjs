import test from 'node:test';
import assert from 'node:assert/strict';
import {createHagridWork} from './garden-work-ui.mjs?v=25.1.5';
import {petFavourite} from './pet-controls.mjs?v=25.1.5';
import {CROP} from './balance-data.mjs?v=25.1.5';

// Level-160 challenges (docs/level-160-challenges.md §2A–B): the Đơn khó tile and the milestone row
// in «Việc của bác Hagrid», from snapshot.orders as the server sends it (garden-challenge-core challengeView).
class Node {
 constructor(tag){this.tag=tag;this.children=[];this.listeners={};this.attrs={};this.style={setProperty(){}};this.classList={add(){},remove(){},toggle(){}};}
 set textContent(value){this.text=String(value);this.children=[];}
 get textContent(){return this.text||this.children.map(n=>n.textContent||'').join(' ');}
 setAttribute(key,value){this.attrs[key]=value;}
 getAttribute(key){return this.attrs[key]??null;}
 addEventListener(key,fn){this.listeners[key]=fn;}
 append(...nodes){this.children.push(...nodes);}
 replaceChildren(...nodes){this.text='';this.children=nodes;}
 showModal(){}
 close(){}
}
const all=(node,pick,out=[])=>{if(node&&typeof node==='object'){if(pick(node))out.push(node);for(const c of node.children||[])all(c,pick,out);}return out;};
const tiers=[1,2,3].map(stars=>({stars,items:{knotgrass:12*stars,puff_feed:6*stars},xp:2800*stars,cup:[20,30,40][stars-1],marks:stars}));
const snapshot=(level,orders)=>({serverNow:0,garden:{progression:{level,inventory:{knotgrass:24,puff_feed:12}}},orders:{unlockLevel:15,orders:[],...orders},flooFrames:{frames:[],worn:null}});

function mount(snap){
 const host=new Node('div'),calls=[];
 const previous=globalThis.document;
 globalThis.document={getElementById:()=>host,createElement:tag=>new Node(tag),createTextNode:text=>({textContent:text}),body:host};
 const work=createHagridWork({getSnapshot:()=>snap,deliver:async()=>({ok:true}),challenge:async fields=>{calls.push(fields);return {ok:true};},setFrame:async()=>({ok:true}),items:null,notify:()=>{}});
 work.open();
 return {dialog:host.children[0],body:host.children[0].children[2],calls,restore:()=>{globalThis.document=previous;}};
}

test('level 170: the hard order offer shows three star buttons; accepting sends the picked stars', async () => {
 const view=mount(snapshot(170,{hard:{unlockLevel:160,marks:12,frameMarks:30,hours:48,open:null,offer:{id:'hard-2026-11-08',tiers}}}));
 try {
  const stars=all(view.body,n=>n.attrs?.['data-hard-stars']);
  assert.equal(stars.length,3);
  assert.match(view.body.textContent,/Đơn khó · 12\/30 dấu/);
  assert.match(view.body.textContent,/\+2\.800 XP · \+20 điểm Cúp Nhà · \+1 dấu/);
  stars[2].listeners.click();
  assert.match(view.body.textContent,/\+8\.400 XP · \+40 điểm Cúp Nhà · \+3 dấu/);
  assert.equal(all(view.body,n=>n.attrs?.['data-hard-stars']==='3')[0].attrs['aria-pressed'],'true');
  await all(view.body,n=>'data-hard-accept' in (n.attrs||{}))[0].listeners.click();
  assert.deepEqual(view.calls,[{kind:'accept',stars:3}]);
  assert.equal(all(view.body,n=>n.attrs?.['data-milestone']).length,0); // no milestone row below 200
 } finally {view.restore();}
});

test('an open hard order shows its clock and delivers when the barn has the goods', async () => {
 const open={id:'hard-2026-11-08',stars:2,items:{knotgrass:24,puff_feed:12},xp:5600,cup:30,marks:2,acceptedAt:0,deadline:Date.now()+47*3600000+30000};
 const view=mount(snapshot(170,{hard:{unlockLevel:160,marks:12,frameMarks:30,hours:48,open,offer:null}}));
 try {
  assert.match(view.body.textContent,/47:01/);
  assert.match(view.body.textContent,/Khẩu phần Quái lùng nhùng/);
  assert.equal(all(view.body,n=>n.attrs?.['data-hard-stars']).length,0);
  await all(view.body,n=>'data-hard-deliver' in (n.attrs||{}))[0].listeners.click();
  assert.deepEqual(view.calls,[{kind:'deliver'}]);
 } finally {view.restore();}
});

test('level 210: the milestone row (goal, meter, days left or start) and won badges', async () => {
 const hard={unlockLevel:160,marks:12,frameMarks:30,hours:48,open:null,offer:null};
 const ready=mount(snapshot(210,{hard,milestone:{state:'ready',level:200,goal:'duty',target:7,days:7,retryAt:null,won:[]}}));
 try {
  assert.match(ready.body.textContent,/Mốc 200/);
  assert.match(ready.body.textContent,/7 ngày không cây héo/);
  await all(ready.body,n=>'data-milestone-start' in (n.attrs||{}))[0].listeners.click();
  assert.deepEqual(ready.calls,[{kind:'start'}]);
 } finally {ready.restore();}
 const running=mount(snapshot(260,{hard,milestone:{state:'running',level:250,goal:'mood',progress:2,target:3,daysLeft:4,onLeave:false,won:[200]}}));
 try {
  assert.match(running.body.textContent,/2\/3/);
  assert.match(running.body.textContent,/4 ngày/);
  assert.equal(all(running.body,n=>n.attrs?.role==='progressbar').length,1);
  assert.equal(all(running.body,n=>n.className==='work-badge').length,1);
 } finally {running.restore();}
});

test('below level 160 the orders tab has no hard order or milestone', () => {
 const view=mount(snapshot(150,{}));
 try {
  assert.doesNotMatch(view.body.textContent,/Đơn khó|Thử thách mốc/);
 } finally {view.restore();}
});

// Level-160 challenges phase 2 (§2C, §2D): «Hạng Tận Sức» under the Cúp Nhà board; the món thích on the pet detail.
const cupSnap=(level,tanSuc)=>({serverNow:0,garden:{progression:{level,inventory:{}}},orders:{unlockLevel:15,orders:[]},flooFrames:{frames:[],worn:null},
 houseCup:{unlockLevel:20,weekKey:'2026-11-02',house:'hufflepuff',houseLabel:'Hufflepuff',points:40,today:12,dailyCap:60,rewardMin:20,endsAt:Date.parse('2026-11-09T00:00:00+07:00'),
  board:[{house:'gryffindor',label:'Gryffindor',points:412},{house:'hufflepuff',label:'Hufflepuff',points:388},{house:'ravenclaw',label:'Ravenclaw',points:301},{house:'slytherin',label:'Slytherin',points:276}],
  ...(tanSuc?{tanSuc}:{})}});

test('level 170: the Cúp Nhà tab adds a «Hạng Tận Sức» board with the same rows; level 90 has only the house board', () => {
 const tanSuc={unlockLevel:160,points:24,wins:0,board:[{house:'hufflepuff',label:'Hufflepuff',points:120},{house:'slytherin',label:'Slytherin',points:74},{house:'gryffindor',label:'Gryffindor',points:40},{house:'ravenclaw',label:'Ravenclaw',points:0}]};
 for(const [level,expect] of [[170,2],[90,1]]){
  const view=mount(cupSnap(level,level>=160?tanSuc:null)),dialog=view.dialog;
  try {
   all(dialog,n=>n.tag==='button'&&/Cúp Nhà/.test(n.textContent))[0].listeners.click();
   const boards=all(dialog,n=>n.tag==='ol');
   assert.equal(boards.length,expect);
   assert.deepEqual(boards.map(b=>b.children.length),Array(expect).fill(4));
   if(level>=160){
    assert.equal(boards[1].attrs['data-cup-board'],'tan-suc');
    assert.match(dialog.textContent,/Hạng Tận Sức · con 24 điểm/);
    assert.match(boards[1].children[0].textContent,/Hufflepuff\s+120/);
   } else assert.doesNotMatch(dialog.textContent,/Tận Sức/);
  } finally {view.restore();}
 }
});

test('the món thích badge: crop icon with «Món thích: <tên>», lit once eaten today; nothing below 160', () => {
 const previous=globalThis.document;
 globalThis.document={createElement:tag=>new Node(tag),createTextNode:text=>({textContent:text})};
 try {
  const E={CROP};
  const badge=petFavourite(E,null,{mood:79,favourite:'pumpkin',favMeal:false});
  assert.equal(badge.attrs['aria-label'],`Món thích: ${CROP.pumpkin.label}`);
  assert.equal(badge.attrs.role,'img');
  assert.equal(badge.className,'pet-favourite');
  const fed=petFavourite(E,null,{mood:95,favourite:'pumpkin',favMeal:true});
  assert.equal(fed.className,'pet-favourite is-fed');
  assert.match(fed.attrs['aria-label'],/đã ăn hôm nay/);
  assert.equal(petFavourite(E,null,{mood:85}),null);
  assert.equal(petFavourite(E,null,null),null);
 } finally {globalThis.document=previous;}
});
