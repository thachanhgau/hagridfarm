import test from 'node:test';
import assert from 'node:assert/strict';
import {contestQuery,createContestClient,contestReadOnly,contestVisit,withDecorCopies,baseDecorId} from './garden-contest.mjs';
import {ownedDecorChoices} from './build-decor-dock.mjs';
import {decorObjects} from './decor-runtime.mjs';
import {decorFootprint} from './garden-object-metrics.mjs';
import {nightDecorFrame} from './decor-lights.mjs';

test('only ?contest=xmas2026 opens a contest garden; entry must look like a uid',()=>{
 assert.equal(contestQuery('?wallet=emulator'),null);
 assert.equal(contestQuery('?contest=other'),null);
 assert.deepEqual(contestQuery('?contest=xmas2026'),{id:'xmas2026',entry:null});
 assert.deepEqual(contestQuery('?contest=xmas2026&entry=abc_D-9'),{id:'xmas2026',entry:'abc_D-9'});
 assert.deepEqual(contestQuery('?contest=xmas2026&entry=../x'),{id:'xmas2026',entry:null});
});

test('copies resolve to the base piece: art, label «bản n», footprint, lights',()=>{
 const lantern={id:'decor_pumpkin_lantern',label:'Đèn bí ngô',file:'a.png',pivotX:10,pivotY:20,frames:['a.png']};
 const assets=withDecorCopies(new Map([[lantern.id,lantern]]));
 assert.equal(baseDecorId('decor_pumpkin_lantern~3'),'decor_pumpkin_lantern');
 assert.equal(baseDecorId('decor_pumpkin_lantern'),'decor_pumpkin_lantern');
 assert.equal(assets.get(lantern.id),lantern);
 assert.ok(assets.has('decor_pumpkin_lantern~3'));
 assert.equal(assets.has('nope~2'),false);
 const copy=assets.get('decor_pumpkin_lantern~3');
 assert.equal(copy.label,'Đèn bí ngô · bản 3');assert.equal(copy.file,'a.png');
 assert.equal(assets.get('decor_pumpkin_lantern~3'),copy,'one object per copy, so caches keyed by it hold');
 assert.deepEqual(decorFootprint('decor_broom_rack~2'),[2,1]);
 const light=id=>nightDecorFrame({kind:'store-decor',id,slot:0,xy:[0,0],facing:'default',asset:assets.get(id)});
 assert.ok(light('decor_pumpkin_lantern'),'the base lantern lights');
 assert.deepEqual(light('decor_pumpkin_lantern~3')?.points,light('decor_pumpkin_lantern').points);
});

test('the decor tray and the scene show each copy as its own piece',()=>{
 const assets=withDecorCopies(new Map([['one',{id:'one',label:'Đèn'}]]));
 const decor={owned:['one','one~2','one~3'],placements:['one','one~2'],positions:{one:[2,2],'one~2':[5,5]},rotations:{}};
 assert.deepEqual(ownedDecorChoices(decor,assets).map(r=>[r.id,r.label,r.placed]),[['one','Đèn',true],['one~2','Đèn · bản 2',true],['one~3','Đèn · bản 3',false]]);
 assert.deepEqual(decorObjects(decor,assets,(c,r)=>[c,r]).map(o=>[o.id,o.col]),[['one',2],['one~2',5]]);
});

const garden={schema:3,progression:{revision:4,level:500},decorations:{owned:['one'],placements:[]}};
function fakeServer(replies){
 const calls=[];
 return {calls,transport:async(name,data)=>{calls.push([name,data]);const r=replies[data.mode];if(r instanceof Error)throw r;return typeof r==='function'?r(data):r;}};
}

test('read asks the status and joins once while decorating; the snapshot has no wallet or supplies',async()=>{
 const contest={id:'xmas2026',phase:'decorate',eligible:true,status:null};
 const server=fakeServer({status:{contest},join:{contest:{...contest,status:'draft'},garden}});
 const client=createContestClient(server.transport);
 const snap=await client.read();
 assert.deepEqual(server.calls.map(([n,d])=>[n,d.mode]),[['hagridContest','status'],['hagridContest','join']]);
 assert.equal(snap.garden.progression.level,500);assert.equal(snap.wallet.spendable,0);
 assert.deepEqual(snap.garden.supplies.seeds,{});assert.equal(contestReadOnly(snap),false);
});

test('a closed or not-yet-open contest refuses with its own reason',async()=>{
 for(const [contest,text] of [[{phase:'before',eligible:true},/01\/12/],[{phase:'decorate',eligible:false},/7 ngày/],[{phase:'vote',eligible:true},/đã đóng/]]){
  const server=fakeServer({status:{contest}});
  await assert.rejects(createContestClient(server.transport).read(),e=>e.definitive&&text.test(e.message));
  assert.equal(server.calls.length,1,'never joins outside decorating');
 }
});

test('act, copy and submit go to hagridContest modes; free taps stay on the device',async()=>{
 const contest={id:'xmas2026',phase:'decorate',eligible:true,status:'draft'};
 const server=fakeServer({status:{contest,garden},act:d=>({contest,garden:{...garden,progression:{...garden.progression,revision:5}}}),
  addCopy:{contest,garden,copyId:'one~2'},submit:{contest:{...contest,status:'locked',no:7},garden}});
 const client=createContestClient(server.transport);
 await client.read();
 await client.act({action:'placeDecoration',itemId:'one',at:[1,1],facing:'default'});
 const [,act]=server.calls.at(-1);
 assert.equal(act.mode,'act');assert.equal(act.action,'placeDecoration');assert.equal(act.expectedRevision,4);assert.ok(act.requestId);
 const count=server.calls.length;
 await client.free('pet',{species:'puffskein'});await client.guide('l1');
 assert.equal(server.calls.length,count,'pet and guide are not sent');
 await client.act({action:'addCopy',itemId:'one~2'});
 assert.deepEqual(server.calls.at(-1)[1],{mode:'addCopy',itemId:'one'});
 assert.equal(client.snapshot.copyId,'one~2');
 const image={type:'image/webp'};
 await client.act({action:'submit',title:'Vườn tuyết',story:'',image});
 assert.deepEqual(server.calls.at(-1)[1],{mode:'submit',title:'Vườn tuyết',story:'',image});
 assert.equal(contestReadOnly(client.snapshot),true);assert.equal(client.snapshot.contest.no,7);
});

test('a local emulator sends a demo cover path instead of the picture',async()=>{
 const contest={phase:'decorate',eligible:true,status:'draft'};
 const server=fakeServer({status:{contest,garden},submit:{contest:{...contest,status:'locked',no:1},garden}});
 const client=createContestClient(server.transport,{demoCover:'garden_contest/xmas2026/u/x.webp'});
 await client.read();await client.act({action:'submit',title:'A',story:'B',image:{}});
 assert.deepEqual(server.calls.at(-1)[1],{mode:'submit',title:'A',story:'B',cover:'garden_contest/xmas2026/u/x.webp'});
});

test('an entry opens read only in the visit view and refuses every write',async()=>{
 const entry={uid:'u1',no:3,title:'Đêm tuyết',story:'Chuyện vườn',username:'Ron',progression:garden.progression,decorations:{...garden.decorations,scene:{atmosphere:'night',weather:'snow'}}};
 const server=fakeServer({entry:{entry}});
 const client=createContestClient(server.transport,{entry:'u1'});
 const snap=await client.read();
 assert.deepEqual(server.calls[0][1],{mode:'entry',entryUid:'u1'});
 assert.equal(contestReadOnly(snap),true);
 const view=contestVisit(snap);
 assert.equal(view.tour.contest,true);assert.equal(view.tour.no,3);assert.equal(view.tour.title,'Đêm tuyết');
 assert.equal(view.atmosphereMode,'night');assert.equal(view.weatherMode,'snow');assert.equal(view.state,garden.progression);
 await assert.rejects(client.act({action:'placeDecoration',itemId:'one',at:null}),e=>e.definitive);
});
