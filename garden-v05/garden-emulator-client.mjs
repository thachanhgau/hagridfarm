const PROJECT='demo-hpvnn-garden', UID='garden-demo-member';
const BASE='http://127.0.0.1:5001/'+PROJECT+'/asia-southeast1/';
// This token is an emulator fixture. It is neither an HPVN login nor a production credential.
function fixtureToken(uid){const encode=v=>btoa(JSON.stringify(v)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');const now=Math.floor(Date.now()/1000);return encode({alg:'none',typ:'JWT'})+'.'+encode({iss:'https://securetoken.google.com/'+PROJECT,aud:PROJECT,sub:uid,user_id:uid,iat:now,exp:now+3600,auth_time:now,email:'garden-demo@example.test',email_verified:true,firebase:{sign_in_provider:'password',identities:{email:['garden-demo@example.test']}}})+'.';}
// Client side of the garden callables, shared by the emulator and the in-memory fixture.
// Calls run one at a time, so an older response never replaces a newer snapshot. Every
// write carries a requestId; a lost response keeps it, so the retry cannot pay or claim twice.
export function createGardenClient(transport){
 let snapshot=null,pending=null,chain=Promise.resolve();
 const queue=fn=>{const run=chain.then(fn,fn);chain=run.catch(()=>{});return run;};
 async function call(name,data){const result=await transport(name,data);if(!result?.garden)throw Error('Phản hồi khu vườn không hợp lệ.');snapshot=result;return snapshot;}
 async function mutate(name,payload){const signature=JSON.stringify({name,payload});if(pending&&pending.signature!==signature)throw Error('Giao dịch trước chưa có kết quả. Hãy thử lại đúng thao tác đó trước.');if(!pending)pending={signature,data:{...payload,requestId:crypto.randomUUID()}};try{const result=await call(name,pending.data);pending=null;return result;}catch(e){if(e.definitive)pending=null;throw e;}}
 const revision=()=>snapshot.garden.progression.revision;
 return {
  get snapshot(){return snapshot;},
  read:()=>queue(()=>call('getHagridGarden',{})),
  act:command=>queue(()=>mutate('performHagridGardenAction',{...command,expectedRevision:revision()})),
  // Free taps (care, pet, rotate, postcard, shareFloo, startTour): one requestId per tap; they never wait on a lost write.
  free:kind=>queue(()=>call('performHagridGardenAction',{action:'freeAction',kind,expectedRevision:revision(),requestId:crypto.randomUUID()})),
  buy:(itemId,packages)=>queue(()=>{const item=snapshot.catalog.find(i=>i.id===itemId);if(!item)throw Error('Vật tư chưa mở.');return mutate('buyHagridGardenSupplies',{itemId,quantity:packages,catalogVersion:snapshot.catalogVersion,expectedTotal:item.price*packages});}),
 };
}
export function createEmulatorClient({decorQA=false}={}){
 const uid=decorQA?'garden-decor-browser-qa':UID;
 if(!['127.0.0.1','localhost'].includes(location.hostname))throw Error('Ví thử nghiệm chỉ mở trên máy local.');
 return createGardenClient(async(name,data)=>{let response;const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),18000);try{response=await fetch(BASE+name,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+fixtureToken(uid)},body:JSON.stringify({data}),signal:abort.signal});}catch{throw Error('Chưa nhận được phản hồi. Thử lại đúng thao tác để kiểm tra giao dịch; mã mua được giữ nguyên.');}finally{clearTimeout(timer);}const body=await response.json();if(body.error){const e=Error(body.error.message||'Máy chủ từ chối thao tác.');e.definitive=true;e.reason=body.error.details?.reason;e.details=body.error.details||{};throw e;}return body.result;});
}
