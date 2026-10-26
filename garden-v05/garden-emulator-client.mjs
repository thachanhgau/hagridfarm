import {packTotal} from './ui-utils.mjs?v=24.9.88';
const PROJECT='demo-hpvnn-garden', UID='garden-demo-member';
const BASE='http://127.0.0.1:5001/'+PROJECT+'/asia-southeast1/';
// This token is an emulator fixture. It is neither an HPVN login nor a production credential.
function fixtureToken(uid){const encode=v=>btoa(JSON.stringify(v)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');const now=Math.floor(Date.now()/1000);return encode({alg:'none',typ:'JWT'})+'.'+encode({iss:'https://securetoken.google.com/'+PROJECT,aud:PROJECT,sub:uid,user_id:uid,iat:now,exp:now+3600,auth_time:now,email:'garden-demo@example.test',email_verified:true,firebase:{sign_in_provider:'password',identities:{email:['garden-demo@example.test']}}})+'.';}
// randomUUID exists only on HTTPS and localhost; a phone on the LAN (plain http) gets the
// same v4 UUID from getRandomValues, which works everywhere.
const requestId=()=>crypto.randomUUID?crypto.randomUUID():'10000000-1000-4000-8000-100000000000'.replace(/[018]/g,c=>(c^crypto.getRandomValues(new Uint8Array(1))[0]&15>>c/4).toString(16));
// Client side of the garden callables, shared by the emulator and the in-memory fixture.
// Calls run one at a time, so an older response never replaces a newer snapshot. Every
// write carries a requestId; a lost response keeps it, so the retry cannot pay or claim twice.
export function createGardenClient(transport){
 let snapshot=null,pending=null,chain=Promise.resolve();
 const queue=fn=>{const run=chain.then(fn,fn);chain=run.catch(()=>{});return run;};
 async function call(name,data){const result=await transport(name,data);if(!result?.garden)throw Error('Phản hồi khu vườn không hợp lệ.');snapshot=result;return snapshot;}
 async function mutate(name,payload){const signature=JSON.stringify({name,payload});if(pending&&pending.signature!==signature)throw Error('Giao dịch trước chưa có kết quả. Hãy thử lại đúng thao tác đó trước.');if(!pending)pending={signature,data:{...payload,requestId:requestId()}};try{const result=await call(name,pending.data);pending=null;return result;}catch(e){if(e.definitive)pending=null;throw e;}}
 const revision=()=>snapshot.garden.progression.revision;
 return {
  get snapshot(){return snapshot;},
  read:()=>queue(()=>call('getHagridGarden',{})),
  act:command=>queue(()=>mutate('performHagridGardenAction',{...command,expectedRevision:revision()})),
  // Free taps (care, pet, rotate, postcard, shareFloo, startTour): one requestId per tap; they never wait on a lost write.
  // `extra` is {species} for a pet, so the server also counts bonding.
  free:(kind,extra={})=>queue(()=>call('performHagridGardenAction',{...extra,action:'freeAction',kind,expectedRevision:revision(),requestId:requestId()})),
  // «Sổ tay» lesson finished (server guideDone): no revision, so like a free tap it never waits on a lost write.
  guide:lessonId=>queue(()=>call('performHagridGardenAction',{action:'guideDone',lessonId,expectedRevision:revision(),requestId:requestId()})),
  // «Thăm vườn» (visitHagridGarden): its own answer, never the player's snapshot.
  visit:data=>queue(()=>transport('visitHagridGarden',data)),
  // Garden Floo frame (setHagridFlooFrame): the reply carries the frames; the snapshot keeps them in step.
  frame:frameKey=>queue(async()=>{const r=await transport('setHagridFlooFrame',{frameKey});if(snapshot&&r?.frames)snapshot={...snapshot,flooFrames:{frames:r.frames,worn:r.worn}};return r;}),
  // KTV Gia Tinh's in-game sale ACP (manageHagridGardenSales): its own answer.
  sales:data=>queue(()=>transport('manageHagridGardenSales',data)),
  // Quầy chợ bác Hagrid (sellHagridGardenCrops): {cropId: n} and the total the player saw.
  sell:(items,expectedTotal)=>queue(()=>mutate('sellHagridGardenCrops',{items,expectedTotal})),
  buy:(itemId,packages)=>queue(()=>{const item=snapshot.catalog.find(i=>i.id===itemId);if(!item)throw Error('Vật tư chưa mở.');return mutate('buyHagridGardenSupplies',{itemId,quantity:packages,catalogVersion:snapshot.catalogVersion,expectedTotal:packTotal(item,packages)});}),
 };
}
export function createEmulatorClient({decorQA=false}={}){
 const uid=decorQA?'garden-decor-browser-qa':UID;
 if(!['127.0.0.1','localhost'].includes(location.hostname))throw Error('Ví thử nghiệm chỉ mở trên máy local.');
 return createGardenClient(async(name,data)=>{let response;const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),18000);try{response=await fetch(BASE+name,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+fixtureToken(uid)},body:JSON.stringify({data}),signal:abort.signal});}catch{throw Error('Chưa nhận được phản hồi. Thử lại đúng thao tác để kiểm tra giao dịch; mã mua được giữ nguyên.');}finally{clearTimeout(timer);}const body=await response.json();if(body.error){const e=Error(body.error.message||'Máy chủ từ chối thao tác.');e.definitive=true;e.reason=body.error.details?.reason;e.details=body.error.details||{};throw e;}return body.result;});
}
// Inside HPVN (/phongsinhoatchung/khu-vuon-hagrid) the game runs in an opaque sandbox; the shell
// puts a per-session ticket in the hash and makes each call with the member's own sign-in.
export function hpvnTicket(){return new URLSearchParams(location.hash.slice(1)).get('hpvn-ticket');}
export function createHpvnClient(nonce){
 let seq=0;const waiting=new Map();
 addEventListener('message',event=>{const m=event.data;if(event.source!==parent||m?.channel!=='hpvn-game'||m.nonce!==nonce||!waiting.has(m.id))return;const done=waiting.get(m.id);waiting.delete(m.id);done(m);});
 const client=createGardenClient((name,data)=>new Promise((resolve,reject)=>{
  const id='garden-'+(++seq);
  // A lost answer keeps the requestId (definitive stays false), so the retry cannot pay twice.
  const timer=setTimeout(()=>{waiting.delete(id);reject(Error('Chưa nhận được phản hồi. Thử lại đúng thao tác để kiểm tra giao dịch; mã mua được giữ nguyên.'));},20000);
  waiting.set(id,m=>{clearTimeout(timer);if('result' in m)return resolve(m.result);const e=Error(m.error||'Máy chủ từ chối thao tác.');e.definitive=m.definitive===true;e.reason=m.reason;e.details=m.details||{};reject(e);});
  parent.postMessage({channel:'hpvn-game',nonce,id,action:'garden',name,data},'*');
 }));
 // Shell requests that are not garden calls (Floo dock): the answer's result, or null if none comes.
 client.host=(action,extra={})=>new Promise(resolve=>{
  const id='host-'+(++seq),timer=setTimeout(()=>{waiting.delete(id);resolve(null);},5000);
  waiting.set(id,m=>{clearTimeout(timer);resolve(m.result??null);});
  parent.postMessage({...extra,channel:'hpvn-game',nonce,id,action},'*');
 });
 return client;
}
