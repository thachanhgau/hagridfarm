// «Dời chuồng» (level 130): where each land creature stands. Spots 0–17 are the pen spots (two per pen: pen_1..pen_6,
// pen_ext_1..3, map.creatureSpots order), 18–22 the pasture spots (edge_2). The server stores the chosen map in
// garden.decorations.creatureHomes (action setCreatureHomes); with none saved this is the old placement.
import {PASTURE_ROAMERS,pastureSpot} from './garden-growth.mjs?v=26.3';

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

/** «Dời chuồng» dialog: pens as a grid of groups, each spot a tile with the occupant's portrait; picking one calls
 * move(target). DOM only, opened from mobile-game (`portrait(species)` is the pet dock's icon). */
export function openCreatureHomes({el,iconButton,portrait,label,labelOf,groups,current,move}){
 const close=()=>dialog.close();
 const tile=(g,c)=>{
  const here=c.spot===current,name=c.species?labelOf(c.species):'Trống';
  const b=el('button',{type:'button',class:'home-cell'+(here?' is-here':'')+(c.species?'':' is-empty'),disabled:here,'aria-label':`${g.name} · ${name}`,title:name},
   [c.species?portrait(c.species):el('span',{class:'home-cell-art'}),el('small',{text:name})]);
  b.onclick=async()=>{b.disabled=true;if(await move(c.spot,g.name))close();else b.disabled=false;};
  return b;
 };
 const dialog=el('dialog',{id:'creatureHomes',class:'owl-letter creature-homes','aria-labelledby':'creatureHomesTitle'},[
  el('div',{class:'popover-heading'},[el('h2',{id:'creatureHomesTitle',text:`Dời chuồng · ${label}`}),iconButton('close','Đóng',close,{class:'gp-close'})]),
  el('div',{class:'home-groups'},groups.map(g=>el('section',{class:'home-group'+(g.name==='Bãi chăn'?' is-pasture':''),'aria-label':g.name},
   [el('h3',{text:g.name}),el('div',{class:'home-cells'},g.cells.map(c=>tile(g,c)))]))),
 ]);
 dialog.addEventListener('close',()=>dialog.remove());
 dialog.addEventListener('click',e=>{if(e.target===dialog)close();});
 (document.getElementById('gameShell')||document.body).append(dialog);
 dialog.showModal();
 return dialog;
}
