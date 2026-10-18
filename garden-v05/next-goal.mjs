// "Mục tiêu gần" (docs/core-design.md, Phase 3): the one next thing the garden is
// working towards, read from the engine state. Order: next expansion the level
// allows, then the next creature with a free bed, then the next level's unlock.
// nextExpansion/nextAdoption follow the same rules as the bot in sim-progression.mjs.

export function nextExpansion(DB, state) {
 return DB.expansions.find((e) => !state.built.includes(e.id) && !state.construction.some((c) => c.id === e.id) && e.level <= state.level) || null;
}

export function nextAdoption(DB, state, capacity) {
 if (state.creatures.length >= capacity) return null;
 return DB.animals.find((a) => a.level <= state.level && !state.creatures.some((c) => c.species === a.id)) || null;
}

// What to gather first for `qty` of an item: a crop it is crafted from, or the item itself.
function firstMissing(DB, state, item, qty) {
 const have = state.inventory[item] || 0;
 if (have >= qty) return null;
 const recipe = DB.recipes.find((r) => r.output === item && r.level <= state.level && r.hours === 0) || DB.recipes.find((r) => r.output === item && r.level <= state.level);
 if (recipe) {
  const batches = Math.ceil((qty - have) / recipe.count);
  for (const [input, n] of Object.entries(recipe.inputs)) {
   const short = n * batches - (state.inventory[input] || 0);
   if (short > 0 && DB.crops.some((c) => c.id === input)) return {id: input, n: short, route: 'plant'};
  }
 }
 return {id: item, n: qty - have, route: recipe ? 'craft' : 'plant'};
}

/**
 * {need: {id, n, route} | null, target: {kind, id}, label, route}
 * `need` is what is still missing (shown as icon + count); `route` says where a tap goes.
 */
export function nextGoal(E, state) {
 const {DB} = E;
 const exp = nextExpansion(DB, state);
 if (exp) {
  const label = exp.kind === 'pen' ? 'Mở chuồng' : 'Mở thửa';
  // The first crop of its cost still short (Galleons are the wallet's, not the garden's).
  const short = Object.entries(exp.cropCost).find(([id, n]) => (state.inventory[id] || 0) < n);
  const need = short ? {id: short[0], n: short[1] - (state.inventory[short[0]] || 0), route: 'plant'} : null;
  return {need, target: {kind: exp.kind, id: exp.id}, label, route: need ? need.route : 'build'};
 }
 const animal = nextAdoption(DB, state, E.housingCapacity(state));
 if (animal) {
  const portions = animal.id === 'puffskein' ? 0 : animal.mealPortions * 3;
  const need = portions ? firstMissing(DB, state, animal.feed, portions) : null;
  return {need, target: {kind: 'creature', id: animal.id}, label: 'Đón ' + animal.label, route: need ? need.route : 'creature'};
 }
 if (state.level >= 100) return null;
 const info = E.levelInfo(state), next = state.level + 1;
 const unlock = DB.crops.find((c) => c.level === next) || DB.animals.find((a) => a.level === next);
 const text = String(DB.levels[state.level]?.unlock || '').split(';')[0].trim();
 return {
  need: {id: 'xp', n: Math.max(0, info.xpToNext - info.xpInLevel), route: 'plant'},
  target: {kind: unlock ? (DB.crops.includes(unlock) ? 'crop' : 'creature') : 'level', id: unlock?.id || 'level', level: next},
  label: 'Cấp ' + next + (text ? ' · ' + text : ''),
  route: 'plant',
 };
}
