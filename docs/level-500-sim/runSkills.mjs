// node runSkills.mjs '<json params>' hours — Season 2 creature skills that move crop time (Que Xạo, Mooncalf).
// Skill on from adoption + ceil(mealsToAdult/2) days (adult, bond 3); rank 2 nine days later (bond 5 + 3 tricks, one lesson a day).
// Best realistic use: a skip goes to the growing cell it makes ripe right now (smallest remaining ≤ skip), then that cell is harvested.
// P.skills=false runs the plain game. P.qx / P.mc override the skip minutes. P.r3 (Phần 2b): the bậc 3 «Tinh thông»
// charge (+1 a day) from rank 2 on, at any level (worst case: the game opens it at level 1,000, past this sim).
const P = JSON.parse(process.argv[2] || '{}');
const HOUR = 3_600_000, DAY = 24 * HOUR, MIN = 60_000;
const seen = {}; const used = { qx: 0, mc: 0, ripe: 0 };
const rank = (sp, now) => { const t = seen[sp]; if (t == null) return 0; const on = t + Math.ceil(({bowtruckle:5,mooncalf:6})[sp] / 2) * DAY; return now < on ? 0 : now < on + 9 * DAY ? 1 : 2; };
const day = {}; // skill uses today
if (P.skills !== false) {
  let prior = null;
  // runEdge assigns its own __ORCHARD later: keep ours in front of whatever it sets.
  const mine = (s, now) => {
    if (prior) s = prior(s, now);
    for (const c of s.creatures) seen[c.species] ??= now;
    const dk = Math.floor((now + 7 * HOUR) / DAY), hr = new Date(now + 7 * HOUR).getUTCHours();
    const skips = [];
    const take = (key, sp, min, night) => { if (night && !(hr >= 18 || hr < 6)) return; const r = rank(sp, now) + (P.r3 && rank(sp, now) === 2 ? 1 : 0); const k = `${dk}:${key}`; while ((day[k] ?? 0) < r) { day[k] = (day[k] ?? 0) + 1; skips.push([key, min]); } };
    take('qx', 'bowtruckle', P.qx ?? 15, false); take('mc', 'mooncalf', P.mc ?? 30, true);
    if (!skips.length) return s;
    let next = structuredClone(s), hit = false;
    for (const [key, min] of skips) {
      let best = null;
      next.plots.forEach((p, pi) => p.slots.forEach((e, si) => { if (!e) return; const left = e.plantedAt + e.growMs - now; if (left > 0 && left <= min * MIN && (!best || left < best.left)) best = { pi, si, left }; }));
      if (!best) continue;
      next.plots[best.pi].slots[best.si].plantedAt -= best.left; used[key] += 1; used.ripe += 1; hit = true;
    }
    if (hit) { try { next = globalThis.__E.harvest(next, null, null, now); } catch {} }
    return next;
  };
  Object.defineProperty(globalThis, '__ORCHARD', { configurable: true, get: () => mine, set: (fn) => { prior = fn; } });
  process.on('exit', () => console.log('  skill skips used', JSON.stringify(used)));
}
process.argv[2] = JSON.stringify(P);
await import('./runEdge.mjs');
