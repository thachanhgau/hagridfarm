import {setupBuildDecorDock} from './build-decor-dock.mjs?v=26.27';
import { setAction, pixelIcon } from './pixel-icons.mjs?v=26.27';
import { $, button, el, duration, hours, levelName, num, realHours, itemDisplayName, visualItemIcon } from './ui-utils.mjs?v=26.27';
import { DB } from './balance-data.mjs?v=26.27';
import { WATER_CROPS } from './water-crop-art.mjs?v=26.27';
import { makeRecipeIcon } from './recipe-art-ui.mjs?v=26.27';

const MAX_CRAFT_BATCHES = DB.limits.maxCraftBatches;
const MODES = Object.freeze(['craft', 'build']);

const asEntries = value => value && typeof value === 'object' ? Object.entries(value) : [];
const safeInteger = value => Number.isSafeInteger(value);
const inventoryValue = (state, id) => Number(state?.inventory?.[id] ?? 0);

/** Return the per-batch recipe input quantities without changing the recipe. */
export function inputNeeds(recipe, batches = 1) {
  if (!recipe) return {};
  const multiplier = safeInteger(batches) && batches >= 1 ? batches : 1;
  return Object.fromEntries(asEntries(recipe.inputs).map(([id, quantity]) => [id, quantity * multiplier]));
}

/** Return input shortages as { id, need, have } records. */
export function inputShortages(recipe, state, batches = 1) {
  return Object.entries(inputNeeds(recipe, batches))
    .map(([id, need]) => ({ id, need, have: inventoryValue(state, id) }))
    .filter(item => item.have < item.need);
}

/**
 * Derive the craft button state. This follows progression-engine.craft's
 * unlocked, timed-batch, input, and station checks and has no side effects.
 */
export function craftChoice(recipe, state = {}, batches = 1) {
  const timed = Number(recipe?.hours ?? 0) > 0;
  const batchValid = safeInteger(batches) && batches >= 1 && batches <= MAX_CRAFT_BATCHES;
  const timedBatchValid = !timed || batches === 1;
  const effectiveBatches = timed ? 1 : batches;
  const needs = inputNeeds(recipe, effectiveBatches);
  const shortages = inputShortages(recipe, state, effectiveBatches);
  const jobs = Array.isArray(state.jobs) ? state.jobs : [];
  const busy = Boolean(recipe && timed && jobs.some(job => job.station === recipe.station));
  const unlocked = Boolean(recipe && Number(state.level ?? 0) >= Number(recipe.level ?? 0));
  const missing = shortages.length > 0;
  const canCraft = Boolean(recipe) && unlocked && batchValid && timedBatchValid && !busy && !missing;
  return {
    recipeId: recipe?.id ?? null,
    timed,
    batches: effectiveBatches,
    requestedBatches: batches,
    batchValid,
    timedBatchValid,
    needs,
    shortages,
    missing,
    busy,
    unlocked,
    canCraft,
  };
}

// The eight legal planting lines (progression-engine LEGAL_LINES): a plant takes 1–3 cells of one line.
const PLANT_LINES = Object.freeze([[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]]);

/**
 * «Trồng/Tạo» for a recipe short of inputs: the server actions that make the missing inputs now.
 * Crafted inputs (côn trùng, cá) are crafted when their own inputs are on hand, else their crops are planted;
 * missing crops are planted on free cells, line by line, within the seeds and water on hand
 * (`supplies` null = local play, no stock limit). Crops already growing and jobs already running count.
 * Returns { steps:[{action:'plant',plotIndex,cells,species}|{action:'craft',recipeId,batches}],
 * later:{crop:n} (no free cell), seeds:{crop:n} (seeds to buy), water:n, growing:[crop], other:{id:n} }.
 */
export function restockPlan({ recipe, state, batches = 1, db = DB, supplies = null, now = 0 }) {
  const plan = { steps: [], later: {}, seeds: {}, water: 0, growing: [], other: {} };
  if (!recipe) return plan;
  const crops = new Map(db.crops.map(crop => [crop.id, crop]));
  const level = Number(state.level ?? 0), jobs = state.jobs ?? [];
  const reserved = { ...inputNeeds(recipe, recipe.hours > 0 ? 1 : batches) };
  const free = id => inventoryValue(state, id) - (reserved[id] ?? 0);
  const demand = {};
  const want = (id, n) => {
    if (n <= 0) return;
    if (crops.has(id) && crops.get(id).level <= level) demand[id] = (demand[id] ?? 0) + n;
    else plan.other[id] = (plan.other[id] ?? 0) + n;
  };
  for (const { id, need, have } of inputShortages(recipe, state, recipe.hours > 0 ? 1 : batches)) {
    const short = need - have;
    const makers = db.recipes.filter(r => r.output === id && r.level <= level);
    if (crops.has(id) || !makers.length) { want(id, short); continue; }
    const pending = jobs.filter(job => job.output === id).reduce((n, job) => n + Number(job.count) * Number(job.batches ?? 1), 0);
    if (pending >= short) { plan.growing.push(id); continue; }
    const rest = short - pending;
    const fit = r => Math.min(...Object.entries(r.inputs).map(([i, n]) => Math.floor(free(i) / n)));
    const idle = r => !(r.hours > 0 && jobs.some(job => job.station === r.station));
    const ready = makers.find(r => idle(r) && fit(r) >= 1);
    if (ready) {
      const n = ready.hours > 0 ? 1 : Math.min(MAX_CRAFT_BATCHES, fit(ready), Math.ceil(rest / ready.count));
      plan.steps.push({ action: 'craft', recipeId: ready.id, batches: n });
      for (const [i, q] of Object.entries(ready.inputs)) reserved[i] = (reserved[i] ?? 0) + q * n;
      continue;
    }
    // Nothing to craft it with yet: plant what the maker made only of crops is missing (one batch; a later tap crafts it).
    const maker = makers.find(r => Object.keys(r.inputs).every(i => crops.has(i))) ?? makers[0];
    if (!idle(maker)) { plan.growing.push(id); continue; }
    for (const [i, q] of Object.entries(maker.inputs)) { want(i, q - Math.max(0, free(i))); reserved[i] = (reserved[i] ?? 0) + q; }
  }
  // Crops already in the ground (ripe or growing) cover their share first.
  const plots = (state.plots ?? []).map(plot => ({ slots: [...plot.slots], cooldowns: plot.cooldowns ?? [] }));
  let water = supplies ? Number(supplies.water ?? 0) : Infinity;
  for (const [id, units] of Object.entries(demand)) {
    const crop = crops.get(id), perCell = Number(crop.yieldPerCell ?? 1);
    const inGround = plots.reduce((n, plot) => n + plot.slots.filter(slot => slot?.species === id).length, 0) * perCell;
    let cells = Math.ceil((units - inGround) / perCell);
    if (cells <= 0) { plan.growing.push(id); continue; }
    const seeds = supplies ? Number(supplies.seeds?.[id] ?? 0) : Infinity;
    if (seeds < cells) plan.seeds[id] = cells - seeds;
    let left = Math.min(cells, seeds);
    const wet = !WATER_CROPS.includes(id); // water crops sow without «Nước tưới» (owner 16/11/2026)
    if (wet && water < left) { plan.water += left - water; left = water; }
    cells = left;
    const sown = plantLines(plots, id, left, now, db.limits.maxCropSpeciesPerPlot);
    plan.steps.push(...sown.steps);
    left = sown.left;
    if (wet) water -= cells - left;
    if (left > 0) plan.later[id] = left * perCell;
  }
  return plan;
}

// Plant `count` cells of `species` on copied `plots` (marked as it goes): each step 1–3 free cells of one legal line,
// the fullest line first, never a fourth crop kind on a plot. `only` keeps it to one plot.
function plantLines(plots, species, count, now, maxKinds, only = null) {
  const steps = [];
  let left = count;
  while (left > 0) {
    let best = null;
    plots.forEach((plot, plotIndex) => {
      if (only !== null && plotIndex !== only) return;
      const kinds = new Set(plot.slots.filter(Boolean).map(slot => slot.species));
      if (!kinds.has(species) && kinds.size >= maxKinds) return;
      for (const line of PLANT_LINES) {
        const open = line.filter(i => !plot.slots[i] && !(plot.cooldowns[i] > now)).slice(0, left);
        if (open.length > (best?.cells.length ?? 0)) best = { plotIndex, cells: open };
      }
    });
    if (!best) break;
    for (const i of best.cells) plots[best.plotIndex].slots[i] = { species };
    steps.push({ action: 'plant', plotIndex: best.plotIndex, cells: best.cells, species });
    left -= best.cells.length;
  }
  return { steps, left };
}

/** «Gieo cả thửa» (level 130+): every free cell of one plot with one crop, within the seeds and water on hand. */
export function fillPlotPlan({ state, plotIndex, species, db = DB, supplies = null, now = 0 }) {
  const plan = { steps: [], later: {}, seeds: {}, water: 0, growing: [], other: {}, free: 0 };
  const plot = state.plots?.[plotIndex];
  if (!plot) return plan;
  const cooldowns = plot.cooldowns ?? [];
  plan.free = plot.slots.filter((slot, i) => !slot && !(cooldowns[i] > now)).length;
  const seeds = supplies ? Number(supplies.seeds?.[species] ?? 0) : Infinity, water = supplies ? Number(supplies.water ?? 0) : Infinity;
  let cells = plan.free;
  if (seeds < cells) { plan.seeds[species] = cells - seeds; cells = seeds; }
  if (!WATER_CROPS.includes(species) && water < cells) { plan.water = cells - water; cells = water; }
  const plots = state.plots.map(p => ({ slots: [...p.slots], cooldowns: p.cooldowns ?? [] }));
  plan.steps = plantLines(plots, species, cells, now, db.limits.maxCropSpeciesPerPlot, plotIndex).steps;
  return plan;
}

/**
 * «Trồng nhanh» for a ration `portions` short: craft it now with an open recipe whose inputs are on hand, else the
 * restock plan of its base (or first open) recipe. null when no recipe for it is open yet.
 */
export function feedPlan({ feed, portions, state, db = DB, supplies = null, now = 0 }) {
  const makers = db.recipes.filter(r => r.output === feed && r.level <= Number(state.level ?? 0));
  if (!makers.length || portions <= 0) return null;
  const batchesOf = r => r.hours > 0 ? 1 : Math.min(MAX_CRAFT_BATCHES, Math.ceil(portions / r.count));
  const ready = makers.find(r => craftChoice(r, state, batchesOf(r)).canCraft);
  if (ready) return { steps: [{ action: 'craft', recipeId: ready.id, batches: batchesOf(ready) }], later: {}, seeds: {}, water: 0, growing: [], other: {} };
  const recipe = makers.find(r => r.base) ?? makers[0];
  return restockPlan({ recipe, state, batches: batchesOf(recipe), db, supplies, now });
}

/** Find the preceding expansion of the same kind in the engine catalog. */
export function previousExpansion(expansions = [], expansion) {
  if (!expansion) return null;
  const sameKind = expansions.filter(item => item?.kind === expansion.kind);
  const index = sameKind.findIndex(item => item.id === expansion.id);
  return index > 0 ? sameKind[index - 1] : null;
}

/** Crops of a build or decoration cost as { id, need, have } records. */
export function cropCosts(cropCost, state) {
  return asEntries(cropCost).map(([id, need]) => ({ id, need, have: inventoryValue(state, id) }));
}

/**
 * Derive the construction button state without normalizing or mutating save
 * data. A ready queued job remains a claim operation; it is never auto-claimed.
 * `galleons` is the wallet's spendable balance; local play passes Infinity.
 */
export function buildChoice(expansion, state = {}, now = Date.now(), expansions = [], galleons = Infinity) {
  if (!expansion) {
    return {
      expansionId: null,
      built: false,
      queued: false,
      ready: false,
      unlocked: false,
      previous: null,
      previousBuilt: false,
      sameKindBusy: false,
      costs: [],
      galleonNeed: 0,
      galleonShort: false,
      missing: false,
      canBuild: false,
    };
  }
  const builtIds = Array.isArray(state.built) ? state.built : [];
  const jobs = Array.isArray(state.construction) ? state.construction : [];
  const queuedJob = jobs.find(job => job.id === expansion.id) ?? null;
  const previous = previousExpansion(expansions, expansion);
  const previousBuilt = !previous || builtIds.includes(previous.id);
  const sameKindBusy = jobs.some(job => job.kind === expansion.kind);
  const costs = cropCosts(expansion.cropCost, state);
  const galleonNeed = Number(expansion.galleons ?? 0);
  const galleonShort = galleons < galleonNeed;
  const unlocked = Number(state.level ?? 0) >= Number(expansion.level ?? 0);
  const built = builtIds.includes(expansion.id);
  const queued = Boolean(queuedJob);
  const ready = queued && Number(queuedJob.readyAt) <= Number(now);
  const missing = galleonShort || costs.some(item => item.have < item.need);
  const canBuild = unlocked && !built && !queued && !sameKindBusy && previousBuilt && !missing;
  return {
    expansionId: expansion.id,
    built,
    queued,
    ready,
    unlocked,
    previous,
    previousBuilt,
    sameKindBusy,
    costs,
    galleonNeed,
    galleonShort,
    missing,
    canBuild,
  };
}

/** Produce the same command payloads used by the existing progression panel. */
export function craftCommand(recipeId, batches) {
  return { action: 'craft', recipeId, batches };
}

export function buildCommand(expansionId) {
  return { action: 'build', expansionId };
}

/** Derive a command for the exact selected recipe; return null when stale. */
function craftAction(recipe, state, batches) {
  const choice = craftChoice(recipe, state, batches);
  return choice.canCraft ? { choice, command: craftCommand(recipe.id, choice.batches) } : null;
}

/** Derive a command for the exact selected expansion; return null when stale. */
function buildAction(expansion, state, now, expansions, galleons) {
  const choice = buildChoice(expansion, state, now, expansions, galleons);
  return choice.ready ? { choice, command: { action: 'claimBuildings' } } : choice.canBuild ? { choice, command: buildCommand(expansion.id) } : null;
}

function readLabel(labels, id) {
  return labels[id] ?? id;
}

function chipLabel(label) {
  return String(label).replace(/^(Khẩu phần |Nuôi )/, '');
}

function expansionTitle(expansion) {
  const number = String(expansion.id).split('_')[1] ?? '';
  if (expansion.label) return expansion.label; // pond tiers, «Chuồng mở rộng» (garden expansion)
  return `${expansion.kind === 'plot' ? 'Thửa' : 'Chuồng'} ${number}`;
}

function expansionEffect(expansion) {
  return expansion.kind === 'edge' ? `Mở Vườn cây · bước ${expansion.capacityAfter}/3` : expansion.kind === 'plot' ? 'Thêm 9 ô trồng' : expansion.kind === 'pond' ? `${expansion.capacityAfter} ô ao` : `Tổng ${expansion.capacityAfter} chỗ nuôi`;
}

function expansionShortEffect(expansion) {
  return expansion.kind === 'edge' ? `Vườn cây · bước ${expansion.capacityAfter}/3` : expansion.kind === 'plot' ? '+9 ô trồng' : expansion.kind === 'pond' ? `${expansion.capacityAfter} ô ao` : `${expansion.capacityAfter} chỗ nuôi`;
}

function stateNow(E, state) {
  return E.nowFor(state, Date.now());
}

function readyJobs(jobs, now) {
  return (jobs ?? []).filter(job => Number(job.readyAt) <= Number(now));
}

// Steps of the instant-batch stepper (server cap: DB.limits.maxCraftBatches).
const BATCH_STEPS = Object.freeze([1, 3, 5, 10, 25, 50, 100].filter(n => n <= MAX_CRAFT_BATCHES));

/**
 * Mount the two work docks (Chế biến, Xây) into the empty craftDock/buildDock sections:
 * a running-job strip with countdown and «Nhận», the selected item with its cost, and a
 * tray of named tiles. Tray buttons are reconciled in place, so the refresh timer never
 * replaces the focused button or scroll container.
 */
export function setupWorkTrays({ E, items, labels, getState, getReady, run, showPanel, getGalleons = () => Infinity, decor = null, getSupplies = () => null, notify = () => {}, openSeedStore = null, openStore = null, onBusy = () => {} }) {
  const local = {
    craft: { selectedId: null, batches: 1, dom: null, buttons: new Map(), badges: new Map() },
    build: { selectedId: null, dom: null, buttons: new Map(), badges: new Map() },
  };
  const buildDecor = decor ? setupBuildDecorDock({...decor,items,getReady,run,showPanel}) : null;
  const cropIds = new Set((E.DB.crops ?? []).map(crop => crop.id));

  const db = E.DB;
  const currentState = () => getState();

  function ensure(mode) {
    const model = local[mode];
    if (model.dom) return model.dom;
    const dock = mode === 'build' && buildDecor ? buildDecor.buildPane : $(`${mode}Dock`);
    if (!dock) return null;

    const jobs = el('div', { class: 'work-jobs', role: 'status' });
    jobs.hidden = true;
    const jobList = el('div', { class: 'work-job-list' });
    const claim = button('Nhận', () => dispatchClaim(mode), { id: `${mode}Claim`, class: 'work-claim' });
    jobs.append(jobList, claim);

    const caption = el('div', { class: 'seed-caption' });
    const captionTitle = el('strong', { class: 'seed-title' });
    const captionMeta = el('span', { class: 'seed-meta' });
    caption.append(captionTitle, captionMeta);

    const tray = el('div', {
      id: `${mode}Tray`,
      class: 'seed-tray item-tray',
      role: 'group',
      'aria-label': mode === 'craft' ? 'Chọn công thức' : 'Chọn công trình',
    });
    const seedSide = el('div', { class: 'seed-side' }, tray);

    const controls = el('div', { class: 'work-controls' });
    let stepper = null, batchValue = null;
    if (mode === 'craft') {
      const step = delta => {
        const at = Math.max(0, BATCH_STEPS.indexOf(local.craft.batches));
        local.craft.batches = BATCH_STEPS[Math.min(BATCH_STEPS.length - 1, Math.max(0, at + delta))];
        refresh('craft');
      };
      const less = button('−', () => step(-1), { id: 'craftLess', 'aria-label': 'Bớt số mẻ' });
      const more = button('+', () => step(1), { id: 'craftMore', 'aria-label': 'Thêm số mẻ' });
      batchValue = el('output', { id: 'craftBatches', class: 'work-batch', 'aria-live': 'polite' });
      stepper = el('div', { class: 'work-stepper', role: 'group', 'aria-label': 'Số mẻ' }, [less, batchValue, more]);
      stepper.less = less;
      stepper.more = more;
      controls.append(stepper);
    }
    const action = button(mode === 'craft' ? 'Làm' : 'Xây', () => {
      if (mode === 'craft') dispatchCraft();
      else dispatchBuild();
    }, { id: `${mode}Action`, class: 'primary' });
    const details = button('⋯', () => showPanel(mode), {
      id: `${mode}Details`,
      title: mode === 'craft' ? 'Danh sách chế biến đầy đủ' : 'Danh sách xây dựng đầy đủ',
      'aria-label': mode === 'craft' ? 'Mở danh sách chế biến' : 'Mở danh sách xây dựng',
    });
    controls.append(action, details);

    const detail = el('div', { class: 'work-detail' });
    const detailText = el('span', { class: 'work-detail-text' });
    detail.append(detailText);

    dock.replaceChildren(jobs, caption, controls, detail, seedSide);
    model.dom = { dock, jobs, jobList, claim, caption, captionTitle, captionMeta, seedSide, tray, controls, stepper, batchValue, details, action, detail, detailText };
    return model.dom;
  }

  function recipesFor(state) {
    return db.recipes.filter(recipe => recipe.level <= state.level);
  }

  // Not built yet: everything open now, then the next two that open at a later level.
  function expansionsFor(state) {
    const built = Array.isArray(state.built) ? state.built : [];
    const open = db.expansions.filter(item => !built.includes(item.id));
    const now = open.filter(item => item.level <= state.level);
    return [...now, ...open.filter(item => item.level > state.level).slice(0, 2)];
  }

  function tileBadge(mode, entry, state, now) {
    if (mode === 'craft') return entry.hours > 0 ? { text: hours(realHours(entry, state.level)).replace(' giờ', 'g').replace(' phút', 'p'), kind: 'time' } : null;
    if (entry.level > state.level) return { text: levelName(entry.level), kind: 'lock' };
    const job = (state.construction ?? []).find(item => item.id === entry.id);
    if (job) return Number(job.readyAt) <= Number(now) ? { text: 'Xong', kind: 'ready' } : { text: 'Đang xây', kind: 'busy' };
    return null;
  }

  function reconcileTray(mode, state, entries, now) {
    const model = local[mode];
    const dom = model.dom;
    const ids = new Set(entries.map(entry => entry.id));
    for (const [id, trayButton] of model.buttons) {
      if (!ids.has(id)) {
        trayButton.remove();
        model.buttons.delete(id);
        model.badges.delete(id);
      }
    }
    for (const entry of entries) {
      if (model.buttons.has(entry.id)) continue;
      const title = mode === 'craft' ? entry.label : expansionTitle(entry);
      const trayButton = button('', () => {
        model.selectedId = entry.id;
        refresh(mode);
      }, {
        class: 'tray-choice',
        'data-id': entry.id,
        'aria-label': title,
        'aria-pressed': false,
        title,
      });
      const badge = el('span', { class: 'tray-badge' });
      badge.hidden = true;
      trayButton.append(
        mode === 'craft' ? makeRecipeIcon(entry, items, 40, labels) : visualItemIcon(items, entry.id, { size: 40 }),
        el('span', { class: 'tray-label', text: mode === 'craft' ? chipLabel(entry.label) : title }),
        badge,
      );
      model.buttons.set(entry.id, trayButton);
      model.badges.set(entry.id, badge);
      dom.tray.append(trayButton);
    }
    if (!ids.has(model.selectedId)) {
      const first = mode === 'build'
        ? entries.find(entry => entry.level <= state.level && !(state.construction ?? []).some(job => job.id === entry.id))
        : entries[0];
      model.selectedId = (first ?? entries[0])?.id ?? null;
    }
    for (const entry of entries) {
      const trayButton = model.buttons.get(entry.id);
      const selected = entry.id === model.selectedId;
      trayButton.classList.toggle('selected', selected);
      trayButton.setAttribute('aria-pressed', String(selected));
      const info = tileBadge(mode, entry, state, now);
      const badge = model.badges.get(entry.id);
      badge.hidden = !info;
      badge.textContent = info?.text ?? '';
      badge.className = `tray-badge${info ? ` is-${info.kind}` : ''}`;
      trayButton.classList.toggle('is-locked', mode === 'build' && entry.level > state.level);
    }
  }

  // Cost chips: what one action takes (big) and what the barn holds (small), red when short.
  function showCosts(dom, costs, output, reason, summary, galleons = 0, galleonShort = false) {
    dom.detailText.title = summary;
    dom.detailText.setAttribute('role', 'group');
    dom.detailText.setAttribute('aria-label', summary);
    const chips = costs.map(({ id, have, need }) => el('span', {
      class: 'dock-cost' + (have < need ? ' is-short' : ''),
      'aria-hidden': 'true',
      title: `${readLabel(labels, id)}: cần ${num(need)}, có ${num(have)}`,
    }, [visualItemIcon(items, id, { size: 22, kind: cropIds.has(id) ? 'harvest' : 'output' }), el('b', { text: `×${num(need)}` }), el('small', { text: have < need ? `thiếu ${num(need - have)}` : `có ${num(have)}` })]));
    if (galleons) chips.push(el('span', { class: 'dock-cost is-galleons' + (galleonShort ? ' is-short' : ''), 'aria-hidden': 'true' }, [pixelIcon('coin', 1), el('b', { text: num(galleons) })]));
    if (output) {
      const chip = el('span', { class: 'dock-cost is-output', 'aria-hidden': 'true', title: `+${num(output.count)} ${readLabel(labels, output.id)}` });
      chip.append(el('span', { class: 'dock-cost-arrow', text: '→' }), visualItemIcon(items, output.id, { size: 22, kind: 'output' }), el('b', { text: `+${num(output.count)}` }));
      chips.push(chip);
    }
    if (reason) chips.push(el('span', { class: 'dock-cost-reason', text: reason, 'aria-hidden': 'true' }));
    dom.detailText.replaceChildren(...chips);
  }

  // Running jobs: icon, name, progress bar and a ticking countdown; «Nhận» once one is done.
  function renderJobs(mode, state, now) {
    const dom = local[mode].dom;
    const jobs = (mode === 'craft' ? state.jobs : state.construction) ?? [];
    dom.jobs.hidden = jobs.length === 0;
    const rows = jobs.map(job => {
      const recipe = mode === 'craft' ? db.recipes.find(item => item.id === job.recipeId) : null;
      const expansion = mode === 'build' ? db.expansions.find(item => item.id === job.id) : null;
      const name = recipe ? recipe.label : expansion ? expansionTitle(expansion) : String(job.id ?? '');
      const start = Number(job.startedAt), end = Number(job.readyAt);
      const done = end <= now;
      const share = done ? 100 : end > start ? Math.max(2, Math.min(99, Math.round((now - start) / (end - start) * 100))) : 0;
      const bar = el('span', { class: 'work-job-bar', 'aria-hidden': 'true' }, el('i', { style: `width:${share}%` }));
      const time = el('span', { class: 'work-job-time' + (done ? ' ready-text' : ''), 'data-until': end, 'data-prefix': 'Còn ', text: done ? 'Xong' : `Còn ${duration(end - now)}` });
      return el('div', { class: 'work-job' + (done ? ' is-ready' : '') }, [
        recipe ? makeRecipeIcon(recipe, items, 26, labels) : visualItemIcon(items, job.id, { size: 26 }),
        el('span', { class: 'work-job-name', text: name }),
        bar,
        time,
      ]);
    });
    dom.jobList.replaceChildren(...rows);
    const readyCount = readyJobs(jobs, now).length;
    dom.claim.hidden = readyCount === 0;
    dom.claim.disabled = !getReady() || readyCount === 0;
    dom.claim.textContent = readyCount > 1 ? `Nhận ×${readyCount}` : 'Nhận';
    dom.claim.title = mode === 'craft' ? 'Nhận các mẻ đã xong' : 'Mở các công trình đã xong';
  }

  function renderCraft(state) {
    const model = local.craft;
    const dom = ensure('craft');
    if (!dom) return;
    const now = stateNow(E, state);
    const recipes = recipesFor(state);
    reconcileTray('craft', state, recipes, now);
    renderJobs('craft', state, now);
    const recipe = recipes.find(item => item.id === model.selectedId) ?? null;
    if (!recipe) {
      dom.captionTitle.textContent = 'Chưa có công thức';
      dom.captionMeta.textContent = 'Mở ở cấp ' + (db.recipes[0]?.level ?? '');
      dom.detailText.replaceChildren();
      dom.action.disabled = true;
      setAction(dom.action, { icon: 'craft', label: 'Chưa mở' });
      if (dom.stepper) dom.stepper.hidden = true;
      return;
    }

    if (recipe.hours > 0) model.batches = 1;
    const choice = craftChoice(recipe, state, model.batches);
    const outputCount = Number(recipe.count) * choice.batches;
    dom.captionTitle.textContent = recipe.label + ' → ' + itemDisplayName(recipe.output, readLabel(labels, recipe.output));
    dom.captionMeta.textContent = `${recipe.hours > 0 ? '⏱ ' + hours(realHours(recipe, state.level)) : 'Tức thì'} · ${recipe.station}`;
    dom.stepper.hidden = recipe.hours > 0;
    dom.batchValue.textContent = `×${model.batches}`;
    dom.stepper.less.disabled = model.batches <= BATCH_STEPS[0];
    dom.stepper.more.disabled = model.batches >= BATCH_STEPS[BATCH_STEPS.length - 1];

    const inputText = Object.entries(choice.needs)
      .map(([id, need]) => `${readLabel(labels, id)} ${num(inventoryValue(state, id))}/${num(need)}`)
      .join(' · ');
    const detailReason = choice.busy ? `${recipe.station} đang bận` : choice.missing ? 'Thiếu nguyên liệu' : !choice.canCraft ? 'Chưa đủ điều kiện' : '';
    const summary = `${inputText} · +${num(outputCount)} ${readLabel(labels, recipe.output)}${detailReason ? ' · ' + detailReason : ''}`;
    showCosts(dom, Object.entries(choice.needs).map(([id, need]) => ({ id, need, have: inventoryValue(state, id) })),
      { id: recipe.output, count: outputCount }, detailReason, summary);

    const ready = getReady();
    // Short of inputs: «Trồng/Tạo» plants and crafts what is missing; with nothing to do now, buy seeds or water.
    const plan = choice.missing && choice.unlocked && !choice.busy ? restockPlan({ recipe, state, batches: choice.batches, db, supplies: getSupplies(), now }) : null;
    const fix = plan && restockLabel(plan);
    let label = 'Làm';
    if (!ready) label = 'Đợi chút';
    else if (choice.busy) label = 'Đang làm';
    else if (fix) label = fix;
    else if (plan?.growing.length) label = 'Đang trồng';
    else if (choice.missing) label = 'Thiếu đồ';
    else if (!choice.canCraft) label = 'Chưa mở';
    const go = label === 'Làm';
    dom.action.disabled = !ready || !(choice.canCraft || fix);
    setAction(dom.action, { icon: fix && fix !== 'Tạo' ? 'seed' : 'craft', label, count: go ? `×${choice.batches}` : '', text: `${label} · ${summary}` });
  }

  function renderBuild(state) {
    const model = local.build;
    const dom = ensure('build');
    if (!dom) return;
    const now = stateNow(E, state);
    const expansions = expansionsFor(state);
    reconcileTray('build', state, expansions, now);
    renderJobs('build', state, now);
    dom.seedSide.hidden = expansions.length === 0;
    const expansion = expansions.find(item => item.id === model.selectedId) ?? null;
    if (!expansion) {
      dom.captionTitle.textContent = 'Đã xây hết';
      dom.captionMeta.textContent = 'Vườn đã đủ mọi thửa và chuồng';
      dom.detailText.replaceChildren();
      // Owner 18/11/2026: nothing left to build → the button opens «Bố trí» (move, Cất / Bày lại, Đặt đồ) instead of a dead «Xong hết».
      dom.action.disabled = false;
      setAction(dom.action, { icon: 'build', label: 'Bố trí', text: 'Bố trí thửa và chuồng' });
      return;
    }

    const choice = buildChoice(expansion, state, now, db.expansions, getGalleons());
    const title = expansionTitle(expansion);
    dom.captionTitle.textContent = title;
    dom.captionMeta.textContent = `${expansion.hours > 0 ? '⏱ ' + hours(realHours(expansion, state.level)) : 'Tức thì'} · ${expansionShortEffect(expansion)}`;

    let reason = '';
    if (!choice.unlocked) reason = `Mở ở ${levelName(expansion.level)}`;
    else if (choice.queued && choice.ready) reason = 'Đã xong · bấm Nhận';
    else if (choice.queued) reason = 'Đang xây';
    else if (choice.sameKindBusy) reason = expansion.kind === 'edge' ? 'Bác Hagrid đang nhờ việc khác' : `Đang xây ${expansion.kind === 'plot' ? 'thửa' : expansion.kind === 'pond' ? 'ao' : 'chuồng'} khác`;
    else if (!choice.previousBuilt) reason = `Cần xây ${expansionTitle(choice.previous)} trước`;
    // Same order as the server: crops are checked before Galleons.
    else if (choice.missing) reason = choice.costs.some(c => c.have < c.need) ? 'Thiếu nông sản' : 'Thiếu Galleons';
    const price = [...choice.costs.map(c => `${readLabel(labels, c.id)} ${num(c.have)}/${num(c.need)}`), ...(choice.galleonNeed ? [`${num(choice.galleonNeed)} Galleons`] : [])].join(', ');
    const summary = `${title} · ${expansionEffect(expansion)} · ${price}${reason ? ' · ' + reason : ''}`;
    showCosts(dom, choice.costs, null, reason, summary, choice.galleonNeed, choice.galleonShort);

    const ready = getReady();
    let label = 'Xây';
    if (!ready) label = 'Đợi chút';
    else if (!choice.unlocked) label = levelName(expansion.level);
    else if (choice.ready) label = 'Xong · Nhận';
    else if (choice.queued || choice.sameKindBusy) label = 'Đang xây';
    else if (choice.missing) label = 'Thiếu đồ';
    else if (!choice.previousBuilt) label = 'Chưa đủ';
    else if (!choice.canBuild) label = 'Chưa mở';
    dom.action.disabled = !ready || !(choice.canBuild || choice.ready);
    setAction(dom.action, { icon: 'build', label, text: `${label} · ${summary}` });
  }

  function refresh(mode) {
    buildDecor?.refresh();
    const state = currentState();
    const targets = mode && MODES.includes(mode) ? [mode] : MODES;
    for (const target of targets) {
      if (target === 'craft') renderCraft(state);
      else renderBuild(state);
    }
  }

  function restockLabel(plan) {
    const plants = plan.steps.some(step => step.action === 'plant'), crafts = plan.steps.some(step => step.action === 'craft');
    if (plants || crafts) return plants ? 'Trồng nhanh' : 'Tạo';
    if (Object.keys(plan.seeds).length && openSeedStore) return 'Mua hạt';
    if (plan.water && openStore) return 'Mua nước';
    return null;
  }

  // One server action per step (run → wallet.act with the real expectedRevision); stop at the first refusal.
  let restocking = false;
  async function dispatchRestock(makePlan) {
    if (restocking) return;
    restocking = true;
    onBusy();
    try { await restockSteps(makePlan()); } finally { restocking = false; refresh('craft'); onBusy(); }
  }
  const planFor = (recipe, batches) => restockPlan({ recipe, state: currentState(), batches, db, supplies: getSupplies(), now: stateNow(E, currentState()) });
  const feedFor = (feed, portions) => feedPlan({ feed, portions, state: currentState(), db, supplies: getSupplies(), now: stateNow(E, currentState()) });

  // Creature card «Trồng nhanh»: the same plan for the recipe that makes the ration. `store` = nothing can be planted
  // or made for it (no recipe open, or only non-crop inputs missing): the one-item ration store stays the way out.
  function feedAction(feed, portions) {
    const plan = feedFor(feed, portions);
    const label = plan && restockLabel(plan);
    if (label) return { label };
    if (plan?.growing.length) return { label: 'Đang trồng', disabled: true };
    return { label: 'Mua thức ăn', store: true };
  }
  async function quickFeed(feed, portions) {
    if (!getReady() || feedAction(feed, portions).disabled) return;
    await dispatchRestock(() => feedFor(feed, portions));
  }
  async function restockSteps(plan) {
    const seedIds = Object.keys(plan.seeds);
    if (!plan.steps.length) {
      if (seedIds.length && openSeedStore) openSeedStore(seedIds);
      else if (plan.water && openStore) openStore('water');
      return;
    }
    const planted = {}, made = [];
    let stopped = false;
    for (const step of plan.steps) {
      const revision = currentState().revision;
      if (step.action === 'plant') await run(next => E.plant(next, step.plotIndex, step.cells, step.species, Date.now()), '', step);
      else await run(next => E.craft(next, step.recipeId, step.batches, Date.now()), '', craftCommand(step.recipeId, step.batches));
      if (currentState().revision === revision) { stopped = true; break; }
      if (step.action === 'plant') planted[step.species] = (planted[step.species] ?? 0) + step.cells.length;
      else made.push(db.recipes.find(item => item.id === step.recipeId)?.label ?? step.recipeId);
    }
    if (stopped && !made.length && !Object.keys(planted).length) return; // run already showed the refusal
    const count = map => Object.entries(map).map(([id, n]) => `${num(n)} ${readLabel(labels, id)}`).join(', ');
    const parts = [
      Object.keys(planted).length ? `Đã gieo ${Object.entries(planted).map(([id, n]) => `${num(n)} ô ${readLabel(labels, id)}`).join(', ')}` : '',
      made.length ? `Đã làm ${made.join(', ')}` : '',
      !stopped && Object.keys(plan.later).length ? `trồng thêm sau ${count(plan.later)} (hết ô trống)` : '',
      !stopped && seedIds.length ? `thiếu hạt ${seedIds.map(id => readLabel(labels, id)).join(', ')}` : '',
      !stopped && plan.water ? `thiếu ${num(plan.water)} nước` : '',
      !stopped && Object.keys(plan.other).length ? `còn thiếu ${count(plan.other)}` : '',
    ].filter(Boolean);
    const buy = !stopped && seedIds.length && openSeedStore ? { label: seedIds.length > 1 ? `Mua ${seedIds.length} loại hạt` : `Mua hạt ${readLabel(labels, seedIds[0])}`, run: () => openSeedStore(seedIds) }
      : !stopped && plan.water && openStore ? { label: 'Mua nước', run: () => openStore('water') } : null;
    notify(parts.join(' · ') + '.', buy);
  }

  function dispatchCraft() {
    if (!getReady()) return;
    const selectedId = local.craft.selectedId;
    const requestedBatches = local.craft.batches;
    const state = currentState();
    const recipe = db.recipes.find(item => item.id === selectedId);
    const shortOf = craftChoice(recipe, state, requestedBatches);
    if (shortOf.missing && shortOf.unlocked && !shortOf.busy) return dispatchRestock(() => planFor(recipe, shortOf.batches));
    const derived = craftAction(recipe, state, requestedBatches);
    if (!derived) {
      if (!(recipe?.hours > 0 && requestedBatches !== 1)) refresh('craft');
      return;
    }
    const { choice, command } = derived;
    run(next => E.craft(next, selectedId, choice.batches, Date.now()), recipe.hours > 0 ? `Đã bắt đầu ${recipe.label} · xong sau ${hours(realHours(recipe, state.level))}.` : `Đã làm +${num(recipe.count * choice.batches)} ${readLabel(labels, recipe.output)}.`, command);
  }

  function dispatchBuild() {
    if (!getReady()) return;
    const selectedId = local.build.selectedId;
    const state = currentState();
    if (!expansionsFor(state).some(item => item.id === selectedId)) { showPanel('layout'); return; }
    const expansion = db.expansions.find(item => item.id === selectedId);
    const derived = buildAction(expansion, state, stateNow(E, state), db.expansions, getGalleons());
    if (!derived) {
      refresh('build');
      return;
    }
    if (derived.choice.ready) { dispatchClaim('build'); return; }
    run(next => E.build(next, selectedId, Date.now()), expansion.hours > 0 ? `Đã khởi công ${expansionTitle(expansion)} · xong sau ${hours(realHours(expansion, state.level))}.` : `Đã xây ${expansionTitle(expansion)}.`, derived.command);
  }

  function dispatchClaim(mode) {
    if (!getReady()) return;
    const state = currentState();
    const now = stateNow(E, state);
    const jobs = mode === 'craft' ? state.jobs : state.construction;
    if (!readyJobs(jobs, now).length) return;
    if (mode === 'craft') run(next => E.claimCraft(next, Date.now()), 'Đã nhận thành phẩm.', { action: 'claimCraft' });
    else {const names=readyJobs(jobs,now).map(job=>expansionTitle(db.expansions.find(e=>e.id===job.id))).join(', ');run(next => E.claimBuildings(next, Date.now()), `Đã xây xong ${names}.`, { action: 'claimBuildings' });}
  }

  refresh();
  return { refresh, feedAction, quickFeed, runPlan: makePlan => getReady() && dispatchRestock(makePlan), isRunning: () => restocking, selectDecor: id => buildDecor?.select(id), selectBuild: id => { local.build.selectedId = id; buildDecor?.showBuild(); } };
}

export default setupWorkTrays;
