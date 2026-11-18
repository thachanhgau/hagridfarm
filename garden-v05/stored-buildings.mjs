// Owner 18/11/2026 «cất bớt đất/chuồng để trang trí»: from level 200 a built plot or pen can be put away (server action
// storeBuilding, garden.decorations.storedBuildings). The renderer then draws nothing there and its ground takes
// decorations (decorSpotProblem); «Bày lại» is free once no decoration stands on that ground (mobile-game run()).
// The Herbology greenhouse (wizard-scenery `greenhouse`) goes the same way: it only opens a «Hạt giống» note.
import {WIZARD_LAYOUT} from './wizard-scenery.mjs?v=26.24';
import {sceneryGroundRect} from './garden-object-metrics.mjs?v=26.24';
import {GREENHOUSE_BAY} from './garden-growth.mjs?v=26.24';
export const STORE_BUILDING_LEVEL=200;
/** Ground the greenhouse takes back: its own ground and the whole fence bay it stands in, which is open for decorations
 *  while it is put away (decorSpotProblem). «Bày lại» waits until no decoration stands there. */
const house=sceneryGroundRect('herbology_greenhouse',WIZARD_LAYOUT.greenhouse.col,WIZARD_LAYOUT.greenhouse.row);
export const GREENHOUSE_GROUND=Object.freeze({c0:Math.min(house.c0,GREENHOUSE_BAY[0][0]),c1:Math.max(house.c1,GREENHOUSE_BAY[2][0]),r0:Math.min(house.r0,GREENHOUSE_BAY[1][1]),r1:Math.max(house.r1,GREENHOUSE_BAY[0][1])});
const isPen=id=>id.startsWith('pen_');

export const storedSet=decorations=>new Set(decorations?.storedBuildings??[]);

/** First plot index from `from` that is not put away (plot 0 when every plot is). */
export function openPlot(s,decorations,from=0){
 const stored=storedSet(decorations),n=s?.plots?.length||1;
 for(let k=0;k<n;k++){const i=(from+k)%n;if(!stored.has('plot_'+(i+1)))return i;}
 return 0;
}

/** Built plots, built pens, then the greenhouse: {id,name,stored,why}; why says why it cannot be put away now ('' when it can). */
export function storableBuildings(s,decorations,pondSpecies){
 const stored=storedSet(decorations),pens=(s.built??[]).filter(isPen);
 // The server's rule (garden-decoration-actions): the open pens keep two spots per land creature.
 const land=s.creatures.filter(e=>!pondSpecies.has(e.species)).length,open=2*pens.filter(id=>!stored.has(id)).length;
 return [
  ...s.plots.map((p,i)=>({id:'plot_'+(i+1),name:'Thửa '+(i+1),why:p.slots.some(Boolean)?'Còn cây':''})),
  ...pens.map(id=>({id,name:id.startsWith('pen_ext_')?'Chuồng mở rộng '+id.slice(8):'Chuồng '+id.slice(4),why:land>open-2?'Cần chỗ cho sinh vật':''})),
  {id:'greenhouse',name:'Nhà kính Thảo dược',why:''},
 ].map(b=>({...b,stored:stored.has(b.id)}));
}

function demo(){
 const s={plots:[{slots:[null]},{slots:[{species:'pumpkin'}]},{slots:[null]}],built:['pen_1','pen_2','pen_ext_1'],creatures:[{species:'puffskein'},{species:'dragon'},{species:'niffler'},{species:'grindylow'}]};
 const list=storableBuildings(s,{storedBuildings:['plot_1','pen_2']},new Set(['grindylow']));
 const ok=(c,m)=>{if(!c)throw new Error(m);};
 ok(list.map(b=>b.id+':'+b.stored+':'+b.why).join()===['plot_1:true:','plot_2:false:Còn cây','plot_3:false:','pen_1:false:Cần chỗ cho sinh vật','pen_2:true:Cần chỗ cho sinh vật','pen_ext_1:false:Cần chỗ cho sinh vật','greenhouse:false:'].join(),JSON.stringify(list));
 ok(openPlot(s,{storedBuildings:['plot_1']})===1&&openPlot(s,{storedBuildings:['plot_3']},2)===0,'openPlot');
 console.log('stored-buildings ok');
}
if(typeof process!=='undefined'&&process.argv?.[1]?.endsWith('stored-buildings.mjs'))demo();
