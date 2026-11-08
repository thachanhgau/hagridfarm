// node runEdge.mjs '<json params>' hours — garden expansion phase 3 (docs/garden-expansion-plan.md §11.1, §11.5).
// P.edge: false = strip Ma da, Ngựa lùn, their meals and edge_1..3 (the phase-2 game);
//         true (default) = the bot builds edge_1..3 when level and crops allow, keeps Ma da (pond) and Ngựa lùn when spots allow,
//         plants all 6 orchard trees once edge_3 is built and harvests every session (sim-edge.patch).
// Knobs (sim only): P.kappa=false / P.porlock=false drop that creature; P.edgecost=false zeroes the edge build crop costs;
//         P.orchard=false skips the orchard. Everything else goes on to runCreatures.mjs, runPond.mjs and run500.mjs.
const P = JSON.parse(process.argv[2] || '{}');
const HOUR = 3_600_000;
const drop = new Set([...(P.edge === false ? ['kappa', 'porlock'] : []), ...(P.kappa === false ? ['kappa'] : []), ...(P.porlock === false ? ['porlock'] : [])]);
const prior = globalThis.__TWEAK;
globalThis.__TWEAK = (raw) => {
  prior?.(raw);
  if (drop.size) {
    raw.animals = raw.animals.filter((a) => !drop.has(a.id));
    raw.recipes = raw.recipes.filter((r) => ![...drop].some((d) => r.id.startsWith(`${d}_`)));
  }
  if (P.edge === false) raw.expansions = raw.expansions.filter((e) => e.kind !== 'edge');
  if (P.edgecost === false) for (const e of raw.expansions) if (e.kind === 'edge') e.cropCost = {};
};
if (P.edge !== false && P.orchard !== false) {
  const O = { trees: null, fruit: 0 };
  globalThis.__ORCHARD = (s, now) => {
    if (!s.built.includes('edge_3')) return s;
    const next = structuredClone(s);
    O.trees ??= Array.from({ length: 6 }, () => now); // 6 apple saplings (120 G each, not charged here), first fruit 72 h later
    O.trees = O.trees.map((at) => {
      if (now - at < 72 * HOUR) return at;
      next.inventory.apple = (next.inventory.apple ?? 0) + 4; O.fruit += 4; return now;
    });
    return next;
  };
  process.on('exit', () => console.log('  orchard apples harvested', O.fruit));
}
process.on('exit', () => console.log('  built', JSON.stringify(globalThis.__BUILT ?? {})));
process.argv[2] = JSON.stringify(P);
await import('./runCreatures.mjs');
