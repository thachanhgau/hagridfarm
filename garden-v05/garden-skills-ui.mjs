// Season 2 «Tài năng sinh vật» (26.0, HPVNN garden-skill-core skillsView), the startup part: pen and plot marks (a
// ready skill, Kneazle «Mắt tinh»), what a skill can be used on, and the passive skills that ran between snapshots.
// The server keeps every number; this module only reads snapshot.skills, .duty, .soil. mobile-game loads it after the
// first wallet accept; the «Chăm bé» row is garden-skills-card.
import * as E from './progression-engine.mjs?v=26.2';
import {tiredPlots} from './garden-weather-ui.mjs?v=26.2';

const HOUR=3600000,DAY=24*HOUR,SOON=3*HOUR;
const label=sp=>E.CREATURE[sp]?.label||sp;
// The stored growMs (server growthScale), as garden-skill-core growFaster reads it.
const mature=(e,t)=>t>=e.plantedAt+(e.growMs??E.CROP[e.species]?.growMs??0);

/** The skill entry of `species` in snapshot.skills, or a fled creature's (not listed by the server). */
export function skillOf(snap,species){
 const entry=snap?.skills?.creatures?.find(c=>c.species===species);
 if(entry)return entry;
 return snap?.duty?.fled?.some(f=>f.species===species)?{species,name:'',passive:false,rank:0,cap:0,left:0,blocked:'fled'}:null;
}
/** Ready = an active skill that helps now with a charge left. */
export const isReady=s=>Boolean(s&&!s.passive&&!s.blocked&&s.left>0);

/** What an active skill can be used on now: plot indexes, creature species, [] when nothing fits, null = no target. */
export function skillTargets(species,snap,now=Date.now()){
 const p=snap?.garden?.progression;if(!p)return [];
 const t=now+(p.offsetMs||0),plots=(p.plots||[]).map((plot,i)=>[i,(plot?.slots||[]).filter(e=>e?.type==='crop')]).filter(([i])=>p.plots[i]);
 const ripe=crops=>crops.some(e=>mature(e,t)),growing=crops=>crops.some(e=>!mature(e,t));
 const duty=snap.duty||{};
 if(species==='puffskein')return plots.filter(([,c])=>ripe(c)).map(([i])=>i);
 if(species==='bowtruckle'||species==='mooncalf')return plots.filter(([,c])=>growing(c)).map(([i])=>i);
 if(species==='niffler')return plots.filter(([i])=>!(p.plots[i].slots||[]).some(Boolean)).map(([i])=>i);
 if(species==='dragon')return [...new Set([...(duty.dead||[]).map(d=>d.plot),...(duty.gnomes||[]).map(g=>g.plot)])].sort((a,b)=>a-b);
 if(species==='knarl')return [...tiredPlots(snap.soil)];
 if(species==='unicorn')return duty.on?(duty.sick||[]).map(s=>s.species):(p.creatures||[]).filter(c=>E.CREATURE[c.species]?.habitat!=='pond').map(c=>c.species);
 return null; // fwooper, hippogriff: no target
}

/** Kneazle «Mắt tinh» (when it helps): plots wilting within 3 h, pens' creatures with a meal done or falling sick within 3 h. */
export function kneazleMarks(snap,now=Date.now()){
 const k=skillOf(snap,'kneazle'),p=snap?.garden?.progression,duty=snap?.duty;
 const out={plots:new Set(),meals:new Set(),sick:new Set(),rank:k?.rank||0};
 if(!k||k.blocked||!p)return out;
 const t=now+(p.offsetMs||0);
 if(duty?.on&&Number.isFinite(duty.since))(p.plots||[]).forEach((plot,i)=>{for(const e of plot?.slots||[])if(e?.type==='crop'){const wilt=Math.max(e.plantedAt+(e.growMs??0)-(p.offsetMs||0),duty.since)+DAY;if(wilt>now&&wilt-now<=SOON)out.plots.add(i);}});
 for(const c of p.creatures||[])if(c.meal&&c.meal.readyAt<=t)out.meals.add(c.species);
 const s=duty?.clocks?.sick;if(s&&s.at-now<=SOON)out.sick.add(s.species);
 return out;
}
/** Renderer marks: species → pixel icons on its pen plaque; plot index → icon on its sign. */
export function sceneMarks(snap,now=Date.now()){
 const k=kneazleMarks(snap,now),pens=new Map(),add=(sp,icon)=>pens.set(sp,[...(pens.get(sp)||[]),icon]);
 for(const s of snap?.skills?.creatures||[])if(isReady(s)&&(skillTargets(s.species,snap,now)??[0]).length)add(s.species,'star');
 for(const sp of k.meals)add(sp,'feed');
 for(const sp of k.sick)add(sp,'heart_empty');
 return {pens,plots:new Map([...k.plots].map(i=>[i,'clock']))};
}
/** Passive skills that ran between two snapshots of the same day: [species, line]. */
const PASSIVE_LINE=Object.freeze({diricawl:'tự gặt giúp một thửa chín',thestral:'dẫn một bé từ Rừng Cấm về',salamander:'giữ thửa khỏi lửa và sương giá','three-headed-dog':'đuổi một ma lùm',crup:'ăn một ma lùm',grindylow:'thả thêm một cá con'});
export function passiveRuns(before,after){
 if(!before?.skills||!after?.skills||before.skills.dayKey!==after.skills.dayKey)return [];
 return after.skills.creatures.filter(c=>c.passive&&PASSIVE_LINE[c.species]).flatMap(c=>{
  const was=before.skills.creatures.find(x=>x.species===c.species);
  return was&&c.left<was.left?[[c.species,`${label(c.species)} ${PASSIVE_LINE[c.species]}.`]]:[];
 });
}
