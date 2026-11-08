// node runEF.mjs '<json params>' hours  — P.ef: 'b' (rotates, adapts) | 'c' (careless) | absent (current rules)
import { createRequire } from 'node:module';
const P = JSON.parse(process.argv[2] || '{}');
if (P.ef || P.half) {
  const req = createRequire(import.meta.url);
  const S0 = req(process.env.SOIL_CORE);
  const S = { ...S0,
    growFactor: !P.ef || P.only === 'E' ? () => 1 : P.frost ? (...a) => (S0.growFactor(...a) > 1 ? P.frost : 1) : S0.growFactor,
    cellMult: P.only === 'F' ? () => 1 : S0.cellMult,
    settleHarvest: P.only === 'F' ? (b, x, t) => S0.settleHarvest(b, { ...x, soil: [] }, t) : S0.settleHarvest };
  const SOIL = { v: [] };
  const g = (progression) => ({ progression, soil: SOIL.v, duty: null });
  globalThis.__EF = {
    smart: P.ef === 'b',
    harvest(before, after, now) { if (!P.ef) return; const x = g(after); const sum = () => Object.values(after.inventory).reduce((a, b) => a + b, 0); const s0 = sum(); const cells = before.plots.flat().length;
      const n = before.plots.reduce((k, pl, i) => k + pl.slots.filter((e, c) => e && !after.plots[i].slots[c]).length, 0);
      S.settleHarvest(before, x, now); SOIL.v = x.soil; const d = sum() - s0; if (before.level >= 160) globalThis.__CR.h += n; if (d < 0) globalThis.__CR.lost -= d; else globalThis.__CR.bonus += d; },
    plant(s, p, cells, now) {
      for (const c of cells) { const e = s.plots[p].slots[c]; if (e && e.plantedAt === now) e.plantedAt = now + Math.round(e.growMs * ((P.half && s.level >= 15 ? 0.5 : 1) * S.growFactor(g(s), e.species, now) - 1)); }
    },
    // Would a crop of `id` planted now on plot p harvest at 100%?
    fresh(s, p, id) {
      const run = SOIL.v[p]; const fam = S.CROP_FAMILY[id];
      if (!run || run.family !== fam) return true;
      const crops = s.plots[p].slots.filter(Boolean);
      if (crops.some((e) => S.CROP_FAMILY[e.species] !== fam)) return true; // another family rotates the plot first
      return S.cellMult(run.cells + crops.length) >= 1;
    },
    // Rotates and adapts: most XP among crops that ripen by the next visit at this week's speed and harvest fresh.
    best(s, p, gapMs, now, kinds) {
      const crops = globalThis.__DB.crops.filter((c) => c.level <= s.level && (kinds.size < 3 || kinds.has(c.id)));
      const ms = (c) => c.growMs * (P.half && s.level >= 15 ? 0.5 : 1) * S.growFactor(g(s), c.id, now);
      const fresh = crops.filter((c) => this.fresh(s, p, c.id));
      const pool0 = fresh.length ? fresh : crops;
      const ready = pool0.filter((c) => ms(c) <= gapMs);
      const pool = ready.length ? ready : [pool0.reduce((a, b) => (ms(a) < ms(b) ? a : b))];
      return pool.reduce((a, b) => (b.totalXP > a.totalXP ? b : a)).id;
    },
  };
}
globalThis.__CR = { h: 0, lost: 0, bonus: 0 };
process.on('exit', () => { if (P.ef) console.log('  crops harvested', globalThis.__CR.h, 'lost', globalThis.__CR.lost, 'bonus', globalThis.__CR.bonus); });
const E = await import('./progression-engine.mjs?v=25.0.2');
globalThis.__DB = E.DB;
process.argv[2] = JSON.stringify(P);
await import('./run500.mjs');
