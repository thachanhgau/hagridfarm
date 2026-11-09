// Level-160 challenges E+F (docs/level-160-challenges.md §2E, §2F): HUD weather chip, owl note, tired plots and seeds,
// from the server's snapshot.weather / snapshot.soil (HPVNN garden-soil-core).
import test from 'node:test';
import assert from 'node:assert/strict';
import {WEATHER,weatherChip,weatherOwlText,tiredPlots,seedTiredTag,tiredLabel} from './garden-weather-ui.mjs?v=25.1.0';
import {ICONS} from './pixel-icons.mjs?v=25.1.0';
import {plotSign} from './scene-renderer.mjs?v=25.1.0';

const H=3600000,D=24*H;
const start=Date.parse('2026-11-22T00:00:00+07:00'),week={type:'rain',start,end:start+7*D,announced:start-2*D};

test('weather chip: hidden before the owl and after the week; counts to the start, then to the end', () => {
 assert.equal(weatherChip(null,start),null);
 assert.equal(weatherChip(week,week.announced-1),null);
 assert.equal(weatherChip(week,week.end),null);
 const soon=weatherChip(week,start-26*H);
 assert.deepEqual([soon.icon,soon.soon,soon.text],['rain',true,'1n 2g']);
 assert.equal(soon.aria,'Mưa dầm · bắt đầu sau 1n 2g');
 const on=weatherChip(week,start+D);
 assert.deepEqual([on.soon,on.text,on.aria],[false,'6n 0g','Mưa dầm · còn 6n 0g']);
 assert.equal(on.title,'Mưa dầm · 22/11–28/11 · Gieo không tốn nước · Ma lùm ×2');
 for (const [type,info] of Object.entries(WEATHER)) {
  assert.ok(ICONS[info.icon]?.length===16&&ICONS[info.icon].every(row=>row.length===16),type);
  assert.doesNotMatch(weatherOwlText({...week,type}),/\p{Extended_Pictographic}/u);
 }
 assert.equal(weatherOwlText({...week,type:'frost'}),'Thư cú: Sương giá Rừng Cấm · 22/11–28/11 · Cây 8 giờ chậm ×1,5 · Củ u, Cỏ chút chít, Rong nước xiết ×2');
});

test('tired plots and seed tags come from snapshot.soil; data-only labels', () => {
 const soil=[{tired:0.75,seeds:{knotgrass:0.75,mint:0.75}},{tired:1,seeds:{}},{tired:0.5,seeds:{}}];
 assert.deepEqual([...tiredPlots(soil)],[0,2]);
 assert.deepEqual([...tiredPlots(null)],[]);
 assert.equal(seedTiredTag(soil,0,'knotgrass'),'−25%');
 assert.equal(seedTiredTag(soil,0,'lettuce'),'');
 assert.equal(seedTiredTag(soil,1,'knotgrass'),'');
 assert.equal(seedTiredTag(null,0,'knotgrass'),'');
 assert.equal(seedTiredTag([{tired:0.5,seeds:{mint:0.5}}],0,'mint'),'−50%');
 assert.equal(tiredLabel(0.75),'Đất mệt · 75%');
});

test('a tired plot sign draws the pixel mark after its text: no extra words, a wider plaque', () => {
 const draw=mark=>{const calls={rect:[],text:[]};const ctx={save(){},restore(){},measureText:t=>({width:t.length*6}),fillRect(...a){calls.rect.push([this.fillStyle,...a]);},fillText(t){calls.text.push(t);},strokeRect(){},set font(v){},set textAlign(v){},set textBaseline(v){}};
  plotSign(ctx,[['Thửa 1','#F5D69A'],[' · 2g','#A6B1AE']],100,200,11,null,mark);return calls;};
 const plain=draw(null),tired=draw('tired');
 assert.deepEqual(tired.text,plain.text);
 const plaque=calls=>calls.rect.find(([colour])=>colour==='#4A3042');
 assert.ok(plaque(tired)[3]>plaque(plain)[3]);
 const inks=new Set(tired.rect.slice(plain.rect.length).map(([colour])=>colour));
 assert.ok(inks.has('#735044')&&inks.has('#C97952'),[...inks].join());
 assert.ok(tired.rect.length-plain.rect.length>40);
});
