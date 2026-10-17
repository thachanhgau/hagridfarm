// Progression simulation (docs/economy-audit.md section 4.1). A bot plays the real
// engine a few sessions a day and we record level, expansions and what the day
// costs in Galleons under the wallet rules (one seed and one water per planted cell).
// CLI: node sim-progression.mjs [days] → markdown report on stdout;
// node sim-progression.mjs festival → festival pacing tables (docs/festival-pacing.md).
import * as E from './progression-engine.mjs';
import {STORE_CATALOG} from './garden-store-catalog.mjs';
import {FESTIVAL_ACTION_POINTS, FREE_FESTIVAL_ACTIONS_PER_DAY, HOGWARTS_EVENTS} from './garden-events.mjs';
import {pickDailyQuests, dayKeyFor, DAILY_GRAND_CHEST_REWARD} from './garden-quests.mjs';
import {HONOR_GARDENS} from './garden-tour.mjs';

const {DB, CROP, CREATURE} = E;
const HOUR = 3_600_000;
const START = Date.UTC(2026, 0, 5, 0, 0); // a Monday; local time does not matter here

// Wallet prices: Galleons per seed and per water.
const seedPrice = Object.fromEntries(STORE_CATALOG.filter((e) => e.kind === 'seed').map((e) => [e.id.replace(/^seed_/, ''), e.price / e.quantity]));
const waterEntry = STORE_CATALOG.find((e) => e.kind === 'water');
export const WATER_PRICE = waterEntry.price / waterEntry.quantity;

const tryAct = (state, fn) => { try { const next = fn(state); return next ?? state; } catch { return state; } };

/** One UI command's festival and quest counts, mirroring mobile-game.mjs playCommandSound/questAmounts. */
function commandLog(action, before, after, batches = 0) {
  let planted = 0, harvested = 0;
  for (let p = 0; p < after.plots.length; p += 1) {
    const a = before.plots[p]?.slots || [], b = after.plots[p].slots;
    for (let i = 0; i < 9; i += 1) {
      if (b[i] && (!a[i] || a[i].id !== b[i].id)) planted += 1;
      if (a[i] && (!b[i] || b[i].id !== a[i].id)) harvested += 1;
    }
  }
  // The UI feeds and claims one species per tap; the bot's null call covers all of them.
  const was = Object.fromEntries(before.creatures.map((c) => [c.species, c]));
  const taps = action === 'feed' ? after.creatures.filter((c) => c.meal && !was[c.species]?.meal).length
    : action === 'claimAnimals' ? after.creatures.filter((c) => c.cyclesClaimed > (was[c.species]?.cyclesClaimed ?? 0)).length
      : 1;
  return {action, taps, planted, harvested, batches};
}

/** tryAct that also logs the command when it changed the state. */
function logged(log, action, state, fn, batches) {
  const next = tryAct(state, fn);
  if (next !== state) log.push(commandLog(action, state, next, batches));
  return next;
}
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

function craftEverything(state, now, log = []) {
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
          if (sub) s = logged(log, 'craft', s, (x) => E.craft(x, sub.id, 1, now), 1);
        }
      }
      const fit = Math.min(...Object.entries(recipe.inputs).map(([id, n]) => Math.floor(s.inventory[id] / n)));
      const batches = Math.min(fit, Math.ceil(missing / recipe.count), recipe.hours > 0 ? 1 : 100);
      if (batches > 0) { s = logged(log, 'craft', s, (x) => E.craft(x, recipe.id, batches, now), batches); break; }
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

/** Play one session at wall time `now`; returns the new state, what it cost and the UI commands it took. */
export function playSession(state, now, gapMs, {seedPriceCap = Infinity} = {}) {
  let s = state;
  const cost = {cells: 0, seeds: 0, water: 0};
  const log = [];
  s = logged(log, 'claimBuildings', s, (x) => E.claimBuildings(x, now));
  s = logged(log, 'claimCraft', s, (x) => E.claimCraft(x, now));
  s = logged(log, 'claimAnimals', s, (x) => E.claimAnimals(x, null, now));
  s = logged(log, 'harvest', s, (x) => E.harvest(x, null, null, now));
  for (let n = 0; n < 2; n += 1) {
    const next = nextExpansion(s);
    if (next) s = logged(log, 'build', s, (x) => E.build(x, next.id, now));
  }
  const adoptable = nextAdoption(s);
  if (adoptable) s = logged(log, 'adopt', s, (x) => E.adopt(x, adoptable, now));
  s = craftEverything(s, now, log);
  s = logged(log, 'feed', s, (x) => E.feed(x, null, now));
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
      s = logged(log, 'plant', s, (x) => E.plant(x, p, cells, species, now));
      if (s !== before) {
        cost.cells += 3;
        cost.seeds += 3 * Math.min(seedPriceCap, seedPrice[species] ?? 0);
        cost.water += 3 * WATER_PRICE;
      }
    }
  }
  return {state: s, cost, log};
}

/** Owl quest water the bot earns each day (V24.9.8 rules, assuming all three are done). */
export function questWater(level) {
  const n = level < 6 ? 6 : level < 20 ? 9 : 12;
  return n + (level < 6 ? 6 : 0) + 5 + 12;
}

const QUEST_CLAIM_POINTS = 15; // mobile-game.mjs handleClaimDailyQuest
export const FESTIVAL_MILESTONES = HOGWARTS_EVENTS.find((e) => e.milestones.length).milestones.map((m) => m.points);

/** Most festival points the capped free taps and the once-a-day honour-garden visits can add in one day. */
export function freeFestivalPoints(hasCreature) {
  const capped = Object.entries(FREE_FESTIVAL_ACTIONS_PER_DAY)
    .filter(([id]) => id !== 'pet' || hasCreature)
    .reduce((sum, [id, n]) => sum + n * FESTIVAL_ACTION_POINTS[id], 0);
  return capped + HONOR_GARDENS.length * FESTIVAL_ACTION_POINTS.helpTour;
}

const farmPoints = (log) => log.reduce((sum, c) => sum + c.taps * (FESTIVAL_ACTION_POINTS[c.action] ?? 5), 0);

/**
 * One day's festival points from its logged commands, today's owl quests and the chest.
 * `free`: false, true (every capped free tap and honour-garden visit) or a points ceiling for them.
 */
export function festivalDay(log, {dayKey, level, hasCreature, free = false}) {
  const farm = farmPoints(log);
  const amount = {
    plant: log.reduce((n, c) => n + c.planted, 0),
    harvest: log.reduce((n, c) => n + c.harvested, 0),
    harvestRun: log.filter((c) => c.action === 'harvest' && c.harvested).length,
    craft: log.reduce((n, c) => n + c.batches, 0),
    feed: log.filter((c) => c.action === 'feed').reduce((n, c) => n + c.taps, 0),
    claimAnimals: log.filter((c) => c.action === 'claimAnimals').reduce((n, c) => n + c.taps, 0),
  };
  const quests = pickDailyQuests(dayKey, {level, hasCreature, feedItem: null});
  const done = quests.filter((q) => q.triggers.reduce((n, t) => n + (amount[t] || 0), 0) >= q.target).length;
  const chest = done >= quests.length ? DAILY_GRAND_CHEST_REWARD.eventPoints : 0;
  const extra = free === true ? freeFestivalPoints(hasCreature) : Math.min(Number(free) || 0, freeFestivalPoints(hasCreature));
  return {farm, quests: done * QUEST_CLAIM_POINTS, questsDone: done, chest, free: extra, total: farm + done * QUEST_CLAIM_POINTS + chest + extra};
}

export function simulate({days = 180, hours = [8, 13, 21], seedPriceCap = Infinity, free = false} = {}) {
  let state = E.newGame(START);
  const daily = [];
  const reached = {};
  const opened = {};
  for (let day = 0; day < days; day += 1) {
    const spend = {cells: 0, seeds: 0, water: 0};
    const dayStart = {dayKey: dayKeyFor(START + day * 24 * HOUR + 12 * HOUR), level: state.level, hasCreature: state.creatures.length > 0, free};
    const log = [];
    const sessions = [];
    for (let i = 0; i < hours.length; i += 1) {
      const now = START + day * 24 * HOUR + hours[i] * HOUR;
      const nextHour = i + 1 < hours.length ? hours[i + 1] : hours[0] + 24;
      const {state: next, cost, log: commands} = playSession(state, now, (nextHour - hours[i]) * HOUR, {seedPriceCap});
      state = next;
      log.push(...commands);
      sessions.push(farmPoints(commands));
      for (const k of Object.keys(spend)) spend[k] += cost[k];
    }
    for (let l = 1; l <= state.level; l += 1) if (reached[l] === undefined) reached[l] = day + 1;
    for (const id of state.built) if (opened[id] === undefined) opened[id] = {day: day + 1, level: state.level};
    const galleons = spend.seeds + spend.water;
    daily.push({day: day + 1, level: state.level, xp: state.xp, creatures: state.creatures.length, plots: state.plots.length, ...spend, galleons, net: Math.max(0, galleons - questWater(state.level) * WATER_PRICE), festival: {...festivalDay(log, dayStart), sessions}});
  }
  return {daily, reached, opened, final: state};
}

/**
 * When a player who joins a festival on day index `start` reaches each milestone.
 * Free taps count in the first session, quest and chest points in the last one.
 * `farmCap` is a proposed daily ceiling on farm-command points; the game has none.
 * Returns {day, session} per threshold (day 1 = the first festival day) or null.
 */
export function timeToMilestones(daily, start, thresholds = FESTIVAL_MILESTONES, {farmCap = Infinity, maxDays = Infinity} = {}) {
  const out = thresholds.map(() => null);
  let points = 0;
  for (let d = start; d < daily.length && d - start < maxDays; d += 1) {
    const f = daily[d].festival;
    let farmLeft = farmCap;
    f.sessions.forEach((raw, i) => {
      const farm = Math.min(raw, farmLeft);
      farmLeft -= farm;
      points += farm + (i === 0 ? f.free : 0) + (i === f.sessions.length - 1 ? f.quests + f.chest : 0);
      thresholds.forEach((t, k) => { if (!out[k] && points >= t) out[k] = {day: d - start + 1, session: i + 1}; });
    });
    if (out.every(Boolean)) break;
  }
  return out;
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

// docs/festival-pacing.md: starting values to test, not settled ones.
export const FESTIVAL_PROPOSAL = Object.freeze({milestones: [100, 450, 1000], farmCap: 60, free: 20, days: 14});

/** Festival pacing tables for docs/festival-pacing.md. */
function festivalReport() {
  const P = FESTIVAL_PROPOSAL;
  const cadences = [['3 lượt/ngày', [8, 13, 21]], ['2 lượt/ngày', [8, 20]], ['1 lượt/ngày', [20]]];
  const levels = [1, 10, 30, 60];
  const when = (x) => (x ? `ngày ${x.day} · lượt ${x.session}` : '—');
  const runs = cadences.map(([name, hours]) => [name, simulate({days: 140, hours}), simulate({days: 140, hours, free: P.free})]);
  const startOf = (run, L) => (L === 1 ? 0 : run.reached[L]);
  const out = ['# Nhịp lễ hội — engine thật, bot gieo mọi hàng trống mỗi lượt\n'];
  out.push('## Điểm mỗi ngày (trung bình 14 ngày kể từ khi đạt cấp)\n');
  out.push('| Nhịp | Cấp | Việc vườn | Nhiệm vụ cú | Rương | Tổng (không thao tác miễn phí) | Thao tác miễn phí tối đa |');
  out.push('|---|---|---|---|---|---|---|');
  for (const [name, run] of runs) {
    for (const L of levels) {
      const slice = run.daily.slice(startOf(run, L), startOf(run, L) + 14);
      const avg = (k) => Math.round(slice.reduce((a, d) => a + d.festival[k], 0) / slice.length);
      out.push(`| ${name} | ${L} | ${avg('farm')} | ${avg('quests')} | ${avg('chest')} | ${avg('total')} | ${freeFestivalPoints(slice[0].creatures > 0)} |`);
    }
  }
  const table = (title, thresholds, opts, pick) => {
    out.push(`\n## ${title}\n`);
    out.push('| Nhịp | Cấp | ' + thresholds.map((t) => `Mốc ${t}`).join(' | ') + ' |');
    out.push('|---|---|' + thresholds.map(() => '---').join('|') + '|');
    for (const r of runs) for (const L of levels) {
      const run = pick(r);
      out.push(`| ${r[0]} | ${L} | ` + timeToMilestones(run.daily, startOf(run, L), thresholds, opts).map(when).join(' | ') + ' |');
    }
  };
  table('Hiện tại: mốc 30 / 75 / 150, không tính thao tác miễn phí, không tính 35 điểm tặng sẵn', FESTIVAL_MILESTONES, {}, (r) => r[1]);
  table(`Đề xuất: mốc ${P.milestones.join(' / ')}, việc vườn tối đa ${P.farmCap}/ngày, không thao tác miễn phí`, P.milestones, {farmCap: P.farmCap, maxDays: P.days}, (r) => r[1]);
  table(`Đề xuất, có thao tác miễn phí (trần chung ${P.free}/ngày)`, P.milestones, {farmCap: P.farmCap, maxDays: P.days}, (r) => r[2]);
  out.push(`\n## Đề xuất: người vào muộn (cấp 1, không thao tác miễn phí) — mốc cao nhất đạt được khi còn N ngày\n`);
  const left = [14, 10, 7, 5, 3];
  out.push('| Nhịp | ' + left.map((n) => `còn ${n} ngày`).join(' | ') + ' |');
  out.push('|---|' + left.map(() => '---').join('|') + '|');
  for (const [name, run] of runs) {
    out.push(`| ${name} | ` + left.map((n) => {
      const hit = timeToMilestones(run.daily, 0, P.milestones, {farmCap: P.farmCap, maxDays: n}).filter(Boolean).length;
      return hit ? `mốc ${P.milestones[hit - 1]}` : 'chưa mốc nào';
    }).join(' | ') + ' |');
  }
  return out.join('\n');
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  console.log(process.argv[2] === 'festival' ? festivalReport() : report(Number(process.argv[2]) || 180));
}
