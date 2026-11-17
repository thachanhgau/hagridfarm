// «Dời chuồng» (level 130): where each land creature stands. Spots 0–17 are the pen spots (two per pen: pen_1..pen_6,
// pen_ext_1..3, map.creatureSpots order), 18–22 the pasture spots (edge_2). The server stores the chosen map in
// garden.decorations.creatureHomes (action setCreatureHomes); with none saved this is the old placement.
import {PASTURE_ROAMERS,pastureSpot} from './garden-growth.mjs?v=26.14';

export const CREATURE_HOMES_LEVEL=130;
export const PASTURE_HOME=18, HOME_SPOTS=23;
export const homeExpansion=s=>s>=PASTURE_HOME?'edge_2':s>=12?`pen_ext_${(s>>1)-5}`:`pen_${(s>>1)+1}`;
export const homeName=s=>s>=PASTURE_HOME?'Bãi chăn':s>=12?`Chuồng mở rộng ${(s>>1)-5}`:`Chuồng ${(s>>1)+1}`;

/** Spot index per land creature: (a) a saved, unlocked, untaken home; (b) the rest keep the old rule. */
export function resolveCreatureHomes(land,homes,{built=new Set(),pastureOpen=built.has('edge_2')}={}){
 const open=s=>Number.isInteger(s)&&s>=0&&s<HOME_SPOTS&&(s>=PASTURE_HOME?pastureOpen:built.has(homeExpansion(s)));
 const out=land.map(()=>-1),taken=new Set(),take=(i,s)=>{out[i]=s;taken.add(s);};
 land.forEach((e,i)=>{const s=homes?.[e?.species];if(open(s)&&!taken.has(s))take(i,s);});
 land.forEach((e,i)=>{
  if(out[i]>=0)return;
  const k=PASTURE_ROAMERS.indexOf(e?.species),free=s=>open(s)&&!taken.has(s);
  if(pastureOpen&&k>=0&&free(PASTURE_HOME+k))return take(i,PASTURE_HOME+k);
  if(free(i))return take(i,i);
  const spare=Array.from({length:PASTURE_HOME},(_,s)=>s).find(free);
  take(i,spare??i); // ponytail: no free unlocked spot (housing check prevents it) keeps the land index, as before
 });
 return out;
}

/** [col,row] of a spot. */
export function spotPoint(map,s){
 if(s>=PASTURE_HOME){const {col,row}=pastureSpot(s-PASTURE_HOME);return [col,row];}
 return map.creatureSpots[s];
}

/** The full species → spot map after `species` moves to `target`, swapping with whoever stands there. */
export function swapHome(land,spots,species,target){
 const homes=Object.fromEntries(land.map((e,i)=>[e.species,spots[i]]));
 const from=homes[species],occupant=land.find((e,i)=>spots[i]===target)?.species;
 if(occupant)homes[occupant]=from;
 homes[species]=target;
 return homes;
}

/** Destinations for the dialog: built pens, then the pasture if open; each with its spots and occupants. */
export function homeChoices(land,spots,{built=new Set(),pastureOpen=built.has('edge_2')}={}){
 const groups=[];
 for(let s=0;s<HOME_SPOTS;s++){
  if(s>=PASTURE_HOME?!pastureOpen:!built.has(homeExpansion(s)))continue;
  const name=homeName(s);
  if(groups.at(-1)?.name!==name)groups.push({name,cells:[]});
  const i=spots.indexOf(s);
  groups.at(-1).cells.push({spot:s,species:i>=0?land[i].species:null});
 }
 return groups;
}

/** «Dời chuồng» dialog: pens as a grid of groups, each spot a tile with the occupant's portrait. A tap moves `species`
 * there; press-and-hold (touch) or drag (mouse) any creature onto another spot moves it, swapping with whoever stands
 * there (owner 17/11/2026: «cho phép drag and drop»). move(species,target,name) runs the server command; the dialog
 * stays open and redraws from view() = {groups,current} (owner: «cứ ấn vô là tắt»). DOM only, opened from mobile-game. */
export function openCreatureHomes({el,closeOnBackdrop,iconButton,portrait,label,labelOf,species,view,move}){
 const close=()=>dialog.close(),body=el('div',{class:'home-groups'});
 let pending=false,drag=null,justDragged=false;
 const go=async(who,spot,name)=>{if(pending)return;pending=true;body.setAttribute('aria-busy','true');
  try{await move(who,spot,name);}finally{pending=false;body.removeAttribute('aria-busy');render();}};
 const tile=(g,c,current)=>{
  const here=c.spot===current,name=c.species?labelOf(c.species):'Trống';
  const b=el('button',{type:'button',class:'home-cell'+(here?' is-here':'')+(c.species?'':' is-empty'),'aria-disabled':String(here),'aria-label':`${g.name} · ${name}`,title:name,
   'data-spot':c.spot,'data-group':g.name,...(c.species?{'data-species':c.species}:{})},
   [c.species?portrait(c.species):el('span',{class:'home-cell-art'}),el('small',{text:name})]);
  b.onclick=()=>{if(justDragged||here)return;go(species,c.spot,g.name);};
  return b;
 };
 function render(){const {groups,current}=view();body.replaceChildren(...groups.map(g=>el('section',{class:'home-group'+(g.name==='Bãi chăn'?' is-pasture':''),'aria-label':g.name},
  [el('h3',{text:g.name}),el('div',{class:'home-cells'},g.cells.map(c=>tile(g,c,current)))])));}
 const dialog=el('dialog',{id:'creatureHomes',class:'owl-letter creature-homes','aria-labelledby':'creatureHomesTitle'},[
  el('div',{class:'popover-heading'},[el('h2',{id:'creatureHomesTitle',text:`Dời chuồng · ${label}`}),iconButton('close','Đóng',close,{class:'gp-close'})]),body]);
 // Drag: touch lifts after a 250 ms hold (a quick swipe still scrolls the list), a mouse after 6 px.
 const cellAt=(x,y)=>document.elementFromPoint(x,y)?.closest?.('#creatureHomes .home-cell');
 const place=(x,y)=>{drag.ghost.style.left=`${x-drag.ox}px`;drag.ghost.style.top=`${y-drag.oy}px`;};
 function lift(){
  drag.on=true;drag.cell.classList.add('is-lifted');
  drag.ghost=el('div',{class:'home-ghost','aria-hidden':'true'},[portrait(drag.species)]);dialog.append(drag.ghost);
  const r=drag.ghost.getBoundingClientRect();drag.ox=r.left;drag.oy=r.top;place(drag.x,drag.y);
 }
 function end(drop){
  if(!drag)return;const d=drag;drag=null;clearTimeout(d.timer);
  d.ghost?.remove();d.cell.classList.remove('is-lifted');dialog.querySelector('.home-cell.is-drop')?.classList.remove('is-drop');
  if(!d.on)return;justDragged=true;setTimeout(()=>{justDragged=false;},80);
  const to=drop&&cellAt(d.x,d.y);
  if(to&&to!==d.cell)go(d.species,Number(to.dataset.spot),to.dataset.group);
 }
 body.addEventListener('pointerdown',e=>{
  const cell=e.target.closest('.home-cell[data-species]');if(!cell||pending||drag||e.button>0)return;
  drag={cell,species:cell.dataset.species,x:e.clientX,y:e.clientY,x0:e.clientX,y0:e.clientY,on:false,mouse:e.pointerType==='mouse'};
  if(!drag.mouse)drag.timer=setTimeout(()=>drag&&!drag.on&&lift(),250);
 });
 dialog.addEventListener('pointermove',e=>{
  if(!drag)return;drag.x=e.clientX;drag.y=e.clientY;
  if(!drag.on){if(Math.hypot(drag.x-drag.x0,drag.y-drag.y0)>(drag.mouse?6:8)){if(drag.mouse)lift();else end(false);}return;}
  place(drag.x,drag.y);
  const to=cellAt(drag.x,drag.y),old=dialog.querySelector('.home-cell.is-drop');
  if(old!==to){old?.classList.remove('is-drop');if(to&&to!==drag.cell)to.classList.add('is-drop');}
  // Near the dialog's top or bottom edge the list scrolls under the finger.
  const r=dialog.getBoundingClientRect();if(drag.y<r.top+64)dialog.scrollTop-=12;else if(drag.y>r.bottom-64)dialog.scrollTop+=12;
 });
 dialog.addEventListener('touchmove',e=>{if(drag?.on)e.preventDefault();},{passive:false});
 dialog.addEventListener('pointerup',()=>end(true));
 dialog.addEventListener('pointercancel',()=>end(false));
 dialog.addEventListener('contextmenu',e=>{if(e.target.closest('.home-cell'))e.preventDefault();});
 render();
 dialog.addEventListener('close',()=>{end(false);dialog.remove();});
 closeOnBackdrop(dialog,close);
 (document.getElementById('gameShell')||document.body).append(dialog);
 dialog.showModal();
 return dialog;
}
