// Progression simulation (docs/economy-audit.md section 4.1). A bot plays the real
// engine a few sessions a day and we record level, expansions and what the day
// costs in Galleons under the wallet rules (one seed and one water per planted cell).
// CLI: node sim-progression.mjs [days] → markdown report on stdout.
import * as E from './progression-engine.mjs';
import {STORE_CATALOG} from './garden-store-catalog.mjs';

const {DB, CROP, CREATURE} = E;
const HOUR = 3_600_000;
const START = Date.UTC(2026, 0, 5, 0, 0); // a Monday; local time does not matter here

// Wallet prices: Galleons per seed and per water.
const seedPrice = Object.fromEntries(STORE_CATALOG.filter((e) => e.kind === 'seed').map((e) => [e.id.replace(/^seed_/, ''), e.price / e.quantity]));
const waterEntry = STORE_CATALOG.find((e) => e.kind === 'water');
export const WATER_PRICE = waterEntry.price / waterEntry.quantity;

const tryAct = (state, fn) => { try { const next = fn(state); return next ?? state; } catch { return state; } };
const rows = [0, 1, 2].map((i) => E.lineCells('horizontal', i));

function unlocked(list, level) { return list.filter((x) => x.level <= level); }

/** Crops needed so the next expansion and every creature's next meals can be crafted. */
function cropDemand(state) {
  const need = {};
  const add = (id, n) => { if (n > 0) need[id] = (need[id] || 0) + n; };
  const recipesFor = (output) => unlocked(DB.recipes, state.level).filter((r) => r.output === output && r.hours === 0);
  const want = {};
  const next = nextExpansion(state);
  if (next) want.kit = Math.max(0, next.kitCost - state.inventory.kit);
  for (const c of state.creatures) {
    const cfg = CREATURE[c.species];
    want[cfg.feed] = (want[cfg.feed] || 0) + Math.max(0, cfg.mealPortions * 3 - state.inventory[cfg.feed]);
  }
  const adoptable = nextAdoption(state);
  if (adoptable) {
    const cfg = CREATURE[adoptable];
    if (adoptable !== 'puffskein') want[cfg.feed] = (want[cfg.feed] || 0) + cfg.mealPortions * 3;
  }
  for (const [item, qty] of Object.entries(want)) {
    if (qty <= 0) continue;
    const recipe = recipesFor(item)[0] || unlocked(DB.recipes, state.level).find((r) => r.output === item);
    if (!recipe) continue;
    const batches = Math.ceil(qty / recipe.count);
    for (const [input, n] of Object.entries(recipe.inputs)) {
      if (CROP[input]) add(input, n * batches - state.inventory[input]);
      else {
        // One level of intermediates (insects, fish): grown from their own recipe.
        const sub = unlocked(DB.recipes, state.level).find((r) => r.output === input);
        if (sub) for (const [crop, m] of Object.entries(sub.inputs)) if (CROP[crop]) add(crop, m * Math.ceil((n * batches - state.inventory[input]) / sub.count));
      }
    }
  }
  return need;
}

function nextExpansion(state) {
  return DB.expansions.find((e) => !state.built.includes(e.id) && !state.construction.some((c) => c.id === e.id) && e.level <= state.level);
}

function nextAdoption(state) {
  const capacity = DB.expansions.filter((e) => e.kind === 'pen' && state.built.includes(e.id)).reduce((m, e) => Math.max(m, e.capacityAfter), 0);
  if (state.creatures.length >= capacity) return null;
  return DB.animals.find((a) => a.level <= state.level && !state.creatures.some((c) => c.species === a.id))?.id ?? null;
}

function craftEverything(state, now) {
  // Kits for the next expansion, then feed for meals and the next adoption; one pass each.
  const targets = [];
  const next = nextExpansion(state);
  if (next && state.inventory.kit < next.kitCost) targets.push(['kit', next.kitCost - state.inventory.kit]);
  for (const c of state.creatures) {
    const cfg = CREATURE[c.species];
    targets.push([cfg.feed, cfg.mealPortions * 3 - state.inventory[cfg.feed]]);
  }
  const adoptable = nextAdoption(state);
  if (adoptable && adoptable !== 'puffskein') targets.push([CREATURE[adoptable].feed, CREATURE[adoptable].mealPortions * 3]);
  let s = state;
  for (const [item, missing] of targets) {
    if (missing <= 0) continue;
    for (const recipe of unlocked(DB.recipes, s.level).filter((r) => r.output === item)) {
      for (const [input] of Object.entries(recipe.inputs)) {
        if (!CROP[input]) {
          const sub = unlocked(DB.recipes, s.level).find((r) => r.output === input);
          if (sub) s = tryAct(s, (x) => E.craft(x, sub.id, 1, now));
        }
      }
      const fit = Math.min(...Object.entries(recipe.inputs).map(([id, n]) => Math.floor(s.inventory[id] / n)));
      const batches = Math.min(fit, Math.ceil(missing / recipe.count), recipe.hours > 0 ? 1 : 100);
      if (batches > 0) { s = tryAct(s, (x) => E.craft(x, recipe.id, batches, now)); break; }
    }
  }
  return s;
}

function bestCrop(level, gapMs) {
  const crops = unlocked(DB.crops, level);
  const ready = crops.filter((c) => c.growMs <= gapMs);
  const pool = ready.length ? ready : [crops.reduce((a, b) => (a.growMs < b.growMs ? a : b))];
  return pool.reduce((a, b) => (b.totalXP > a.totalXP ? b : a)).id;
}

/** Play one session at wall time `now`; returns the new state and what it cost. */
export function playSession(state, now, gapMs) {
  let s = state;
  const cost = {cells: 0, seeds: 0, water: 0};
  s = tryAct(s, (x) => E.claimBuildings(x, now));
  s = tryAct(s, (x) => E.claimCraft(x, now));
  s = tryAct(s, (x) => E.claimAnimals(x, null, now));
  s = tryAct(s, (x) => E.harvest(x, null, null, now));
  for (let n = 0; n < 2; n += 1) {
    const next = nextExpansion(s);
    if (next) s = tryAct(s, (x) => E.build(x, next.id, now));
  }
  const adoptable = nextAdoption(s);
  if (adoptable) s = tryAct(s, (x) => E.adopt(x, adoptable, now));
  s = craftEverything(s, now);
  s = tryAct(s, (x) => E.feed(x, null, now));
  const demand = cropDemand(s);
  const queue = Object.entries(demand).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).map(([id, n]) => [id, Math.ceil(n / 3)]);
  for (let p = 0; p < s.plots.length; p += 1) {
    for (const cells of rows) {
      if (cells.some((i) => s.plots[p].slots[i])) continue;
      const kinds = new Set(s.plots[p].slots.filter(Boolean).map((e) => e.species));
      let species = null;
      const job = queue.find(([id, n]) => n > 0 && (kinds.size < 3 || kinds.has(id)));
      if (job) { species = job[0]; job[1] -= 1; } else species = bestCrop(s.level, gapMs);
      if (kinds.size >= 3 && !kinds.has(species)) species = [...kinds][0];
      const before = s;
      s = tryAct(s, (x) => E.plant(x, p, cells, species, now));
      if (s !== before) {
        cost.cells += 3;
        cost.seeds += 3 * (seedPrice[species] ?? 0);
        cost.water += 3 * WATER_PRICE;
      }
    }
  }
  return {state: s, cost};
}

/** Owl quest water the bot earns each day (V24.9.8 rules, assuming all three are done). */
export function questWater(level) {
  const n = level < 6 ? 6 : level < 20 ? 9 : 12;
  return n + (level < 6 ? 6 : 0) + 5 + 12;
}

export function simulate({days = 180, hours = [8, 13, 21]} = {}) {
  let state = E.newGame(START);
  const daily = [];
  const reached = {};
  const opened = {};
  for (let day = 0; day < days; day += 1) {
    const spend = {cells: 0, seeds: 0, water: 0};
    for (let i = 0; i < hours.length; i += 1) {
      const now = START + day * 24 * HOUR + hours[i] * HOUR;
      const nextHour = i + 1 < hours.length ? hours[i + 1] : hours[0] + 24;
      const {state: next, cost} = playSession(state, now, (nextHour - hours[i]) * HOUR);
      state = next;
      for (const k of Object.keys(spend)) spend[k] += cost[k];
    }
    for (let l = 1; l <= state.level; l += 1) if (reached[l] === undefined) reached[l] = day + 1;
    for (const id of state.built) if (opened[id] === undefined) opened[id] = {day: day + 1, level: state.level};
    const galleons = spend.seeds + spend.water;
    daily.push({day: day + 1, level: state.level, xp: state.xp, creatures: state.creatures.length, plots: state.plots.length, ...spend, galleons, net: Math.max(0, galleons - questWater(state.level) * WATER_PRICE)});
  }
  return {daily, reached, opened, final: state};
}

function report(days) {
  const out = [];
  const variants = [['2 lượt/ngày', [8, 20]], ['3 lượt/ngày', [8, 13, 21]], ['4 lượt/ngày', [8, 12, 17, 22]]];
  const runs = variants.map(([name, hours]) => [name, simulate({days, hours})]);
  out.push(`# Mô phỏng nhịp cấp — ${days} ngày, engine thật, giá cửa hàng hiện tại\n`);
  out.push('| Mốc | ' + runs.map(([n]) => n).join(' | ') + ' |');
  out.push('|---|' + runs.map(() => '---').join('|') + '|');
  for (const lv of [5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]) {
    out.push(`| Cấp ${lv} | ` + runs.map(([, r]) => (r.reached[lv] ? `ngày ${r.reached[lv]}` : '—')).join(' | ') + ' |');
  }
  out.push(`| Cấp sau ${days} ngày | ` + runs.map(([, r]) => r.final.level).join(' | ') + ' |');
  const [, main] = runs[1];
  out.push('\n## Mở thửa và chuồng (3 lượt/ngày)\n');
  out.push('| Công trình | Cấp yêu cầu | Mở vào ngày | Cấp lúc mở |');
  out.push('|---|---|---|---|');
  for (const e of DB.expansions) out.push(`| ${e.id} | ${e.level} | ${main.opened[e.id]?.day ?? '—'} | ${main.opened[e.id]?.level ?? '—'} |`);
  out.push('\n## Chi phí mỗi ngày (3 lượt/ngày, trung bình theo tháng)\n');
  out.push('| Tháng | Cấp cuối tháng | Ô gieo/ngày | Galleons/ngày | Sau nước từ nhiệm vụ cú |');
  out.push('|---|---|---|---|---|');
  for (let m = 0; m * 30 < main.daily.length; m += 1) {
    const slice = main.daily.slice(m * 30, m * 30 + 30);
    const avg = (k) => slice.reduce((a, d) => a + d[k], 0) / slice.length;
    out.push(`| ${m + 1} | ${slice.at(-1).level} | ${Math.round(avg('cells'))} | ${avg('galleons').toFixed(1)} | ${avg('net').toFixed(1)} |`);
  }
  return out.join('\n');
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  console.log(report(Number(process.argv[2]) || 180));
}
