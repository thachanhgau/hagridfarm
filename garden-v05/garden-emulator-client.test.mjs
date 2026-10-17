import test from 'node:test';
import assert from 'node:assert/strict';
import {createEmulatorClient} from './garden-emulator-client.mjs';

test('a lost purchase response retains its id for retry and blocks a different purchase',async()=>{
 const oldFetch=globalThis.fetch,oldLocation=globalThis.location;
 globalThis.location={hostname:'127.0.0.1'};
 const snapshot={garden:{progression:{revision:0}},catalogVersion:'fixture',catalog:[{id:'seed_pumpkin',price:2},{id:'water',price:5}]};
 const requests=[];let loseResponse=true;
 globalThis.fetch=async(url,options)=>{
  const body=JSON.parse(options.body);requests.push({url,body});
  if(url.endsWith('buyHagridGardenSupplies')&&loseResponse){loseResponse=false;throw Error('response lost after server commit');}
  return {json:async()=>({result:snapshot})};
 };
 try{
  const wallet=createEmulatorClient();await wallet.read();
  await assert.rejects(wallet.buy('seed_pumpkin',2),/mã mua được giữ nguyên/);
  await assert.rejects(wallet.buy('water',1),/Giao dịch trước/);
  await wallet.buy('seed_pumpkin',2);
  const buys=requests.filter(r=>r.url.endsWith('buyHagridGardenSupplies'));
  assert.equal(buys.length,2);assert.deepEqual(buys[1].body,buys[0].body);
  assert.equal(buys[0].body.data.quantity,2);assert.equal(buys[0].body.data.expectedTotal,4);
  await wallet.buy('water',1);assert.notEqual(requests.at(-1).body.data.requestId,buys[0].body.data.requestId);
 }finally{globalThis.fetch=oldFetch;globalThis.location=oldLocation;}
});

test('demo wallet refuses a non-local origin',()=>{
 const oldLocation=globalThis.location;globalThis.location={hostname:'hpvn-archive.net'};
 try{assert.throws(()=>createEmulatorClient(),/chỉ mở trên máy local/);}finally{globalThis.location=oldLocation;}
});
