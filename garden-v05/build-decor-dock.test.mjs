import test from 'node:test';
import assert from 'node:assert/strict';
import {ownedDecorChoices} from './build-decor-dock.mjs';

test('the decor tray contains owned items only and does not alter a save',()=>{
 const assets=new Map([['one',{id:'one',label:'Đèn'}],['two',{id:'two',label:'Cây'}],['shop',{id:'shop',label:'Chưa mua'}]]);
 const decor={owned:['one','two'],placements:['one',null],positions:{},rotations:{one:'right'}};
 const before=JSON.stringify(decor),rows=ownedDecorChoices(decor,assets);
 assert.deepEqual(rows.map(x=>x.id),['one','two']);
 assert.equal(rows[0].placed,true);assert.equal(rows[0].facing,'right');
 assert.equal(rows[1].placed,false);assert.equal(rows[0].label,'Đèn');
 assert.equal(JSON.stringify(decor),before);
});
test('free placement at zero is placed; unknown art is omitted without deleting ownership',()=>{
 const assets=new Map([['one',{id:'one',label:'Đèn'}]]);
 const rows=ownedDecorChoices({owned:['one','missing'],positions:{one:[0,0]},placements:[]},assets);
 assert.equal(rows[0].placed,true);assert.equal(rows.length,1);
 assert.deepEqual(ownedDecorChoices(undefined,assets),[]);
});
