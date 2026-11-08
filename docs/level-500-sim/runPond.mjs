// node runPond.mjs '<json params>' hours — garden expansion phase 1 (docs/garden-expansion-plan.md §2.1).
// P.pond: false = no pond at all (the rows are stripped from the balance: the pre-pond game);
//         true (default) = the bot builds the pond tiers, keeps every lot stocked with carp, plants the pond beds with
//         the best water crop each session, casts once a day (3 fish) and keeps Thủy quái fed (sim-pond.patch).
// Rules mirrored from HPVN garden-pond-core: lots 2/4/6, beds 2/4 × 3 cells at half the plot XP (P.bedXp), carp 4 h → 3 fish, × 0.5 time.
const P = JSON.parse(process.argv[2] || '{}');
const HOUR = 3_600_000;
if (P.pond === false) {
  const prior = globalThis.__TWEAK;
  globalThis.__TWEAK = (raw) => {
    raw.expansions = raw.expansions.filter((e) => e.kind !== 'pond');
    raw.animals = raw.animals.filter((a) => a.habitat !== 'pond');
    raw.recipes = raw.recipes.filter((r) => !r.output.startsWith('grindylow'));
    prior?.(raw);
  };
} else {
  const W = { lots: [], beds: [], castDay: null };
  globalThis.__POND_STATS = { fish: 0, bedXp: 0, bedCells: 0, fry: 0 };
  globalThis.__POND = (s, now, gapMs) => {
    const tier = ['pond_1', 'pond_2', 'pond_3'].filter((id) => s.built.includes(id)).length;
    if (!tier) return s;
    const DB = globalThis.__DB;
    const next = structuredClone(s);
    let xp = 0;
    const lots = [0, 2, 4, 6][tier], cells = (tier >= 2 ? 4 : 2) * 3;
    while (W.lots.length < lots) W.lots.push(null);
    while (W.beds.length < cells) W.beds.push(null);
    W.lots = W.lots.map((readyAt) => {
      if (readyAt !== null && readyAt <= now) { next.inventory.fish += 3; globalThis.__POND_STATS.fish += 3; readyAt = null; }
      if (readyAt === null) { globalThis.__POND_STATS.fry += 1; return now + 4 * HOUR * 0.5; }
      return readyAt;
    });
    const day = Math.floor((now + 7 * HOUR) / (24 * HOUR));
    if (W.castDay !== day) { W.castDay = day; next.inventory.fish += 3; globalThis.__POND_STATS.fish += 3; }
    const water = DB.crops.filter((c) => ['silverkelp', 'gillyweed', 'fluxweed'].includes(c.id) && c.level <= s.level);
    const ready = water.filter((c) => c.growMs * 0.5 <= gapMs);
    const pick = (ready.length ? ready : water).reduce((a, b) => (b.totalXP > a.totalXP ? b : a));
    W.beds = W.beds.map((cell) => {
      if (cell && cell.readyAt <= now) { next.inventory[cell.id] += 1; xp += cell.harvestXP; globalThis.__POND_STATS.bedCells += 1; cell = null; }
      if (!cell) { xp += pick.plantXP; return { id: pick.id, harvestXP: pick.harvestXP, readyAt: now + pick.growMs * 0.5 }; }
      return cell;
    });
    xp = Math.round(xp * (P.bedXp ?? 0.5));
    globalThis.__POND_STATS.bedXp += xp;
    next.xp += xp;
    let level = 1;
    for (const row of DB.levels) { if (next.xp >= row.totalXP) level = row.level; else break; }
    next.level = Math.min(level, 500);
    return next;
  };
  process.on('exit', () => console.log('  pond', JSON.stringify(globalThis.__POND_STATS)));
}
const E = await import('./progression-engine.mjs?v=25.0.2');
globalThis.__DB = E.DB;
process.argv[2] = JSON.stringify(P);
await import('./run500.mjs');
