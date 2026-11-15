// Local-only fixture demo; imports the exact shipped renderer, with no wallet/transport.
import * as E from '/game/khu-vuon-hagrid/progression-engine.mjs';
import {createGarden,iso} from '/game/khu-vuon-hagrid/scene-renderer.mjs';
import {decorSpotProblem} from '/game/khu-vuon-hagrid/decor-placement-ui.mjs';
import {GARDEN_STAGES} from '/game/khu-vuon-hagrid/garden-growth.mjs';
import * as winterKit from '/game/khu-vuon-hagrid/garden-winter.mjs';
import {runtimeImageUrl} from '/game/khu-vuon-hagrid/runtime-image-url.mjs';
const manifest=await fetch('/game/khu-vuon-hagrid/decor-assets-manifest.json').then(r=>r.json());
const items=manifest.items.filter(item=>item.id.startsWith('nx_')),assetOf=id=>manifest.items.find(item=>item.id===id);
document.getElementById('subtitle').textContent=`50 món · Đã thay ${items.filter(item=>item.artRevision).length} mẫu căn trục · Bấm tên món để tới gần`;
const canvas=document.querySelector('canvas'),viewport=document.getElementById('viewport'),status=document.getElementById('status');
const garden=await createGarden(canvas,{decorAssets:manifest.items});
const now=Date.parse('2026-12-24T12:00:00+07:00'),state=E.testProfile(500,now);
state.built=[...new Set([...state.built,...E.DB.expansions.map(e=>e.id)])];
for(const species of ['puffskein','bowtruckle','hippogriff']){const a=E.CREATURE[species];state.creatures.push({id:'demo-'+species,type:'creature',species,level:a.level,adoptedAt:now-48*3600000,mealsCompleted:a.mealsToAdult,meal:null,cyclesClaimed:0,preview:false});}
let decorations={owned:[],placements:[],positions:{},rotations:{}},group=0,scale=.8,night=false,facing='default',ready=false;
function centerAt([col,row]){const [x,y]=iso(col,row);viewport.scrollTo({left:x*scale-viewport.clientWidth/2,top:y*scale-viewport.clientHeight/2-32,behavior:'instant'});}
function zoom(delta){scale=Math.max(.35,Math.min(2,scale+delta));canvas.style.width=Math.round(canvas.width*scale)+'px';centerAt([14,23]);}
async function showGroup(index){
 ready=false;group=index;status.textContent='Đang đặt đồ vào vườn…';
 const selected=index===-1?['nx_elf_yule_tent','nx_hagrid_gift_crate','nx_wizard_chess_christmas','nx_holly_broom_fence','nx_yule_dance_gazebo'].map(assetOf):items.slice(index*10,index*10+10);
 decorations={owned:selected.map(item=>item.id),placements:[],positions:{},rotations:{}};
 for(const item of selected){
  let spot;
  for(let row=21;row<=27&&!spot;row+=.5)for(let col=2;col<=29&&!spot;col+=.5){
   const reason=decorSpotProblem(col,row,{map:window.FARM_SCENE,stage:GARDEN_STAGES.at(-1),state,decorations,itemId:item.id,facing,asset:item,iso,assetOf});
   if(!reason)spot=[col,row];
  }
  if(!spot)throw Error('Không tìm được ô trống cho '+item.label);
  decorations.placements.push(item.id);decorations.positions[item.id]=spot;decorations.rotations[item.id]=facing;
 }
 const names=document.getElementById('names');names.replaceChildren();
 for(const item of selected){const button=document.createElement('button'),image=document.createElement('img');image.src=runtimeImageUrl(item.file);image.alt='';button.append(image,document.createTextNode(item.label));button.onclick=()=>centerAt(decorations.positions[item.id]);names.append(button);}
 document.querySelectorAll('[data-group]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.group)===index)));
 ready=true;render(0);centerAt(decorations.positions[selected[1].id]);status.textContent=index===-1?'5 mẫu mới thay · đang kiểm tra cạnh trong vườn':`Món ${index*10+1}–${index*10+10} / 50 · 24/12 · chỉ là demo`;
 window.__NOEL_DEMO__={items:items.length,group,decorations,winter:true,garden};
}
function render(clock){garden.render(state,{now,clock,animationClock:clock,decorations,weatherMode:'snow',winterKit,winter:{...winterKit.winterSeason(now),active:true,depth:.9},atmosphereMode:night?'night':'day',propsVisible:true});}
document.querySelectorAll('[data-group]').forEach(button=>button.onclick=()=>showGroup(Number(button.dataset.group)));
document.getElementById('calibration').onclick=()=>showGroup(-1);
document.getElementById('plus').onclick=()=>zoom(.15);document.getElementById('minus').onclick=()=>zoom(-.15);
document.getElementById('night').onclick=event=>{night=!night;event.target.textContent=night?'Ban ngày':'Ban đêm';};
document.getElementById('turn').onclick=async()=>{facing=facing==='default'?'right':'default';await showGroup(group);};
let drag;viewport.addEventListener('pointerdown',event=>{drag={x:event.clientX,y:event.clientY,left:viewport.scrollLeft,top:viewport.scrollTop};viewport.setPointerCapture(event.pointerId);});
viewport.addEventListener('pointermove',event=>{if(drag){viewport.scrollLeft=drag.left+drag.x-event.clientX;viewport.scrollTop=drag.top+drag.y-event.clientY;}});
viewport.addEventListener('pointerup',()=>{drag=null;});viewport.addEventListener('pointercancel',()=>{drag=null;});
zoom(0);await showGroup(-1);
const reduced=matchMedia('(prefers-reduced-motion: reduce)');let last=0;
function loop(time){if(ready&&!document.hidden&&time-last>=125){last=time;render(reduced.matches?0:time);}requestAnimationFrame(loop);}requestAnimationFrame(loop);
