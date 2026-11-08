// node runCreatures.mjs '<json params>' hours — garden expansion phase 2 (docs/garden-expansion-plan.md §2.2, §10).
// P.creatures2: false = strip Chó đuôi nĩa, Nhím quậy, Kỳ nhông lửa, their meals and «Chuồng mở rộng» (the phase-1 game);
//               true (default) = the bot adopts them as pens allow and hand-feeds Nhím quậy each session (sim-creatures.patch).
// Every other parameter goes on to runPond.mjs (P.pond) and run500.mjs.
const P = JSON.parse(process.argv[2] || '{}');
if (P.creatures2 === false) {
  const PHASE2 = new Set(['crup', 'knarl', 'salamander']);
  globalThis.__TWEAK = (raw) => {
    raw.animals = raw.animals.filter((a) => !PHASE2.has(a.id));
    raw.recipes = raw.recipes.filter((r) => !PHASE2.has(r.output.replace(/_feed$/, '')));
    raw.expansions = raw.expansions.filter((e) => !e.id.startsWith('pen_ext_'));
  };
}
// Tuning knobs (sim only): P.c2xp scales the three species' XP; P.c2meals sets their meals to adult.
if (P.c2xp || P.c2meals || P.c2feed) {
  const prior = globalThis.__TWEAK;
  globalThis.__TWEAK = (raw) => {
    prior?.(raw);
    for (const a of raw.animals) if (['crup', 'knarl', 'salamander'].includes(a.id)) {
      const k = P.c2xp ?? 1, m = P.c2meals?.[a.id];
      a.feedXP = P.c2feed?.[a.id] ?? Math.round(a.feedXP * k); a.adultClaimXP = a.feedXP * 9; a.cycleXP = a.feedXP * 10;
      a.stageXP = [64.8, 97.2, 162].map((f) => Math.round(a.feedXP * f));
      if (m) { a.mealsToAdult = m; a.stageMeals = [Math.round(m * 0.3), Math.round(m * 0.65), m]; }
    }
  };
}
process.on('exit', () => console.log('  phase-2 hand meals', globalThis.__HAND_MEALS ?? 0));
await import('./runPond.mjs');
