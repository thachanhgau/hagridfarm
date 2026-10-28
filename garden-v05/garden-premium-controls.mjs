import {$} from './ui-utils.mjs?v=24.9.90';
import {CREATURE} from './progression-engine.mjs?v=24.9.90';
import {renderPetCareButtons} from './pet-controls.mjs?v=24.9.90';

// Presentation only: the existing engine/server still owns targets, stock and use limits.
export function refreshPremiumControls({snapshot,state,species,now,ready,items}) {
 const garden=snapshot?.garden,uses=snapshot?.daily?.premiumUses||{};
 const animal=state.creatures.find(a=>a.species===species);
 const eating=creature=>creature?.meal&&creature.meal.readyAt>now;
 const felixUntil=garden?.premium?.felix?.until||0;
 const targets={
  spring_rain:['rain',state.plots.some(p=>p.slots.some(x=>x?.type==='crop'))],
  felix_felicis:['felix',felixUntil<=Date.now()],
  prime_meal:['primeMeal',eating(animal)],
  skele_gro:['skeleGro',animal&&animal.mealsCompleted<CREATURE[species].mealsToAdult],
  pen_feast:['feast',state.creatures.some(eating)],
 };
 for(const [id,[supply,validTarget]] of Object.entries(targets)) {
  const control=$('premium-'+id);if(!control)continue;
  const count=garden?.supplies?.[supply]||0,usage=uses[supply];
  const used=usage&&(typeof usage.used==='object'?usage.used[species]||0:usage.used);
  control.hidden=count<1;
  control.disabled=!ready||count<1||!validTarget||(usage&&used>=usage.cap);
  // Pet controls keep their icon/label nodes; crop controls keep the original text format.
  if(!control.closest('#petCareTools'))control.textContent=control.dataset.label+' ×'+count;
  control.title=control.dataset.label+(usage?' · hôm nay '+used+'/'+usage.cap:'')
   +(id==='felix_felicis'&&felixUntil>Date.now()?' · đang có hiệu lực đến '+new Date(felixUntil).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'}):'');
 }
 renderPetCareButtons(items,garden?.supplies);
}
