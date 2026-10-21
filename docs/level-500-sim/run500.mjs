// node run500.mjs '<json params>' [hours]
const P = JSON.parse(process.argv[2] || '{}');
if (P.xpcap) globalThis.__XPCAP = P.xpcap;
if (P.felix) globalThis.__FELIX = P.felix;
if (P.rain) { globalThis.__RAIN = P.rain; globalThis.__RAINCOST = P.raincost ?? 0; }
const H = process.argv[3]?.startsWith("n") ? (() => { const [n, from, to] = process.argv[3].slice(1).split(":").map(Number); globalThis.__GRIND = true; return Array.from({length: n}, (_, i) => +(from + i * (to - from) / n).toFixed(3)); })() : (process.argv[3] || "8,21").split(",").map(Number);
const cropMap = {2: 1, 4: 2, 6: 3, 14: 6, 20: 8};
const f = P.f ?? [[20, 1], [50, 0.6], [100, 0.4]];           // XP factor by level tier, 1–100
const A = P.a ?? 40000, B = P.b ?? 150;                      // 101–500: xpToNext = A + B·(L−101)
export const NEW_CROPS = [105, 130, 160, 200, 250, 310, 380, 450].map((level, i) => ({level, hours: i % 2 ? 8 : 3, i}));
export const NEW_PLOTS = P.plots ?? [110, 130, 160, 200, 260, 330];
globalThis.__TWEAK = (raw) => {
  // P1 (balance-2026-10-21) already ships the crop, creature and craft changes; apply them only to the old data.
  if (raw.balanceVersion === 'balance-2026-10-18') {
  for (const c of raw.crops) { c.hours = cropMap[c.hours] ?? c.hours; c.growMs = c.hours * 3600000; if (P.xpm && c.level <= 100) { const k = P.xpm[c.hours] ?? 1; c.totalXP = Math.round(c.totalXP * k); c.plantXP = Math.round(c.totalXP * 0.1); c.harvestXP = c.totalXP - c.plantXP; } }
  if (P.meal) for (const a of raw.animals) { a.hours = P.meal; a.growMs = P.meal * 3600000; if (P.halve) { a.mealsToAdult = Math.ceil(a.mealsToAdult / 2); a.stageMeals = a.stageMeals.map((m) => Math.ceil(m / 2)); a.minAdultDays /= 2; } }
  if (P.job) for (const r of raw.recipes) if (r.hours > 0) r.hours = P.job;
  }
  // P3 (21/10/2026): the game ships the 500-level curve, the eight bậc Tận Sức crops and thửa 13–18; simulate them as they are.
  if (raw.crops.some((c) => c.id === 'fluxweed')) return;
  const fac = P.k ? (l) => l <= 20 ? 1 : 1 - (1 - P.k) * ((l - 20) / 80) ** (P.p ?? 0.6) : (l) => f.find(([max]) => l <= max)?.[1] ?? 1;
  if (P.t99) {
    // ponytail: one clean curve — old 1–20, geometric 21–99 up to t99, then linear +b per level to 500
    const v20 = raw.levels[19].xpToNext;
    const v = (L) => L <= 20 ? raw.levels[L - 1].xpToNext : L <= 99 ? Math.round(v20 * (P.t99 / v20) ** ((L - 20) / 79)) : L === 500 ? 0 : P.t99 + P.b * (L - 99);
    const next = Array.from({length: 500}, (_, i) => v(i + 1));
    for (let L = 101; L <= 500; L += 1) raw.levels.push({level: L, xpToNext: 0, plots: 0, beds: 0, unlock: ''});
    raw.levels.forEach((l, i) => { l.xpToNext = next[i]; });
  } else {
  for (const l of raw.levels) if (l.xpToNext) l.xpToNext = Math.round(l.xpToNext * fac(l.level));
  raw.levels[99].xpToNext = A;
  for (let L = 101; L <= 500; L += 1) raw.levels.push({level: L, xpToNext: L === 500 ? 0 : A + B * (L - 101), plots: 0, beds: 0, unlock: ''});
  }
  let total = 0; for (const l of raw.levels) { l.totalXP = total; total += l.xpToNext; }
  const base3 = 96, base8 = 327; // Đậu sao (3h) and Hoa nhật quang (8h) XP
  for (const n of NEW_CROPS) {
    const t = 1 + 0.12 * (Math.floor(n.i / 2) + 1);
    const xp = Math.round((n.hours === 3 ? base3 : base8) * t ** 2);
    raw.crops.push({id: `tier${n.i + 1}`, label: `Cây tầng ${n.i + 1}`, level: n.level, hours: n.hours, rarity: 'Huyền thoại', yieldPerCell: 1,
      plantXP: Math.round(xp * 0.1), harvestXP: xp - Math.round(xp * 0.1), totalXP: xp, growMs: n.hours * 3600000, type: 'crop'});
  }
  NEW_PLOTS.forEach((level, i) => raw.expansions.push({id: `plot_${13 + i}`, level, hours: 24, capacityAfter: 13 + i, kind: 'plot',
    cropCost: {sunpetal: 30 + 6 * i, starbean: 48 + 6 * i}, galleons: 800 + 200 * i}));
};
const {simulate} = await import('./sim-progression.mjs');
const days = P.days ?? 300;
const r = simulate({days, hours: H, seedPriceCap: P.cap ?? 3});
const at = (L) => r.reached[L] ?? `>${days}`;
const cost = (a, b) => Math.round(r.daily.slice(a, Math.min(b, days)).reduce((s, x) => s + x.galleons, 0) / (Math.min(b, days) - a));
const xpd = (a, b) => Math.round((r.daily[b - 1].xp - r.daily[a - 1].xp) / (b - a));
console.log(JSON.stringify({H: H.join(','), P}), '\n  L20', at(20), 'L50', at(50), 'L100', at(100), 'L150', at(150), 'L200', at(200), 'L300', at(300), 'L400', at(400), 'L500', at(500),
  '\n  G/day m1', cost(0, 30), 'm2', cost(30, 60), 'm4', cost(90, 120), 'm7', cost(180, 210), 'xp/day d50-60', xpd(50, 60), 'd200-210', xpd(200, 210),
  '\n  G to L500', r.daily.slice(0, typeof at(500)==='number'?at(500):days).reduce((s,x)=>s+x.galleons,0)|0,   '\n  plots', JSON.stringify(Object.fromEntries(Object.entries(r.opened).filter(([k]) => k.startsWith('plot')).map(([k, v]) => [k, v.day]))));
