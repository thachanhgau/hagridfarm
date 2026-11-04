#!/usr/bin/env node
// Read-only garden baseline (25.0 S0): level spread, active days, D1/D7 return. Aggregates only, no uid printed.
// Cost: 2 count() reads, then one read per garden_states doc and per garden_daily doc of the last DAYS days,
// both field-masked. Refuses when either is larger than the caps (read-budget skill: no broad scans).
// Usage: GARDEN_HPVNN_ROOT=<HPVNN checkout with functions/node_modules> node docs/garden-baseline.mjs --project hpvnn-archive [days=30]
import {createRequire} from 'node:module';
const root = process.env.GARDEN_HPVNN_ROOT || '/Users/thachanh/Downloads/HPVNN.nosync';
const need = createRequire(root + '/functions/package.json');
const {initializeApp, applicationDefault} = need('firebase-admin/app');
const {getFirestore, Timestamp} = need('firebase-admin/firestore');
if (process.argv[process.argv.indexOf('--project') + 1] !== 'hpvnn-archive') { console.error('Refused: pass --project hpvnn-archive.'); process.exit(1); }
const DAYS = Number(process.argv.find(a => /^\d+$/.test(a)) || 30), MAX_STATES = 500, MAX_DAILY = 5000;
initializeApp({credential: applicationDefault(), projectId: 'hpvnn-archive'});
const db = getFirestore();
const vnDay = ms => new Date(ms + 7 * 3600e3).toISOString().slice(0, 10);
const addDays = (key, n) => vnDay(Date.parse(key + 'T00:00:00Z') - 7 * 3600e3 + n * 86400e3);
const today = vnDay(Date.now()), from = addDays(today, -DAYS);

const states = (await db.collection('garden_states').count().get()).data().count;
const daily = (await db.collection('garden_daily').where('dateKey', '>=', from).count().get()).data().count;
console.log(JSON.stringify({gardens: states, dailyDocsSince: from, dailyDocs: daily}));
if (states > MAX_STATES || daily > MAX_DAILY) { console.error('Refused: larger than the read caps; use count() buckets instead.'); process.exit(2); }

const gardens = (await db.collection('garden_states').select('progression.level', 'createdAt').get()).docs
  .map(d => ({uid: d.id, level: Number(d.get('progression.level')) || 1, joined: vnDay(d.get('createdAt')?.toMillis?.() ?? 0)}));
const days = new Map(); // uid -> Set(dateKey)
for (const d of (await db.collection('garden_daily').where('dateKey', '>=', from).select('uid', 'dateKey').get()).docs) {
  const uid = d.get('uid'); if (!days.has(uid)) days.set(uid, new Set()); days.get(uid).add(d.get('dateKey'));
}

const bands = [[1, 9], [10, 24], [25, 49], [50, 99], [100, 129], [130, 199], [200, 299], [300, 500]];
const levels = bands.map(([a, b]) => ({band: `${a}–${b}`, gardens: gardens.filter(g => g.level >= a && g.level <= b).length}));
const sorted = gardens.map(g => g.level).sort((a, b) => a - b), q = p => sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
const perDay = {}; for (const set of days.values()) for (const k of set) perDay[k] = (perDay[k] || 0) + 1;
const dau = Object.values(perDay), median = a => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)] ?? 0;
// Return: of gardens created on day J inside the window (and old enough), share active on J+1 / on any of J+1..J+7 / on J+7.
const cohort = n => gardens.filter(g => g.joined >= from && addDays(g.joined, n) < today);
const ret = (n, any) => { const c = cohort(n), hit = c.filter(g => { const s = days.get(g.uid) || new Set(); return any ? [...Array(n)].some((_, i) => s.has(addDays(g.joined, i + 1))) : s.has(addDays(g.joined, n)); }); return {cohort: c.length, returned: hit.length, pct: c.length ? Math.round(100 * hit.length / c.length) : null}; };
const activeDays = [...days.values()].map(s => s.size);
console.log(JSON.stringify({
  window: {from, to: today, days: DAYS},
  levels, levelQuantiles: {p25: q(.25), p50: q(.5), p75: q(.75), p90: q(.9), max: sorted.at(-1)},
  newGardensInWindow: gardens.filter(g => g.joined >= from).length,
  activeGardens: days.size, dailyActive: {median: median(dau), max: Math.max(0, ...dau), last7: Object.entries(perDay).sort().slice(-7)},
  activeDaysPerGarden: {median: median(activeDays), p75: [...activeDays].sort((a, b) => a - b)[Math.floor(.75 * activeDays.length)] ?? 0},
  d1: ret(1, false), d7: ret(7, false), within7: ret(7, true),
}, null, 1));
