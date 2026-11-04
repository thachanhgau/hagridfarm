// 25.0 S5 «Bậc trách nhiệm»: the panel's clock rows and alerts come from the server's snapshot.duty only.
import test from 'node:test';
import assert from 'node:assert/strict';
import {DUTY_LETTER,dutyAlerts,dutyClocks,left} from './garden-duty-ui.mjs';

const H=3600000;
test('clock rows: every consequence still ahead, soonest first; alerts name what needs doing now', () => {
 const now=Date.now();
 const duty={on:true,clocks:{wilt:now+5*H,dies:null,gnome:now+2*H,sick:{species:'puffskein',at:now+9*H},forest:null,fire:now-H}};
 assert.deepEqual(dutyClocks(duty,s=>s==='puffskein'?'Puffskein':s).map(r=>r[1]),['Ma lùm vào vườn','Cây chín héo','Puffskein ốm']);
 assert.deepEqual(dutyAlerts({on:true,dead:[{plot:1,slot:0},{plot:1,slot:1}],gnomes:[{plot:2}],sick:[],fled:[{species:'dragon'}],wilted:[]},s=>s).map(a=>a[1]),
  ['2 cây chết khô','Ma lùm ở thửa 3','dragon ở Rừng Cấm']);
 assert.deepEqual(dutyAlerts({on:true,leave:{until:now+H},dead:[{plot:0}]}),[]);
 assert.equal(left(now+26*H+5*60000,now),'26 giờ 5 phút');
 assert.equal(DUTY_LETTER.signature,'bác Hagrid');
});
