import { setAction, pixelIcon } from './pixel-icons.mjs?v=24.9.83';
import { $, button, el, duration, hours, num, realHours, visualItemIcon } from './ui-utils.mjs?v=24.9.83';
import { DB } from './balance-data.mjs?v=24.9.83';
import { makeRecipeIcon } from './recipe-art-ui.mjs?v=24.9.83';

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
  return choice.canBuild ? { choice, command: buildCommand(expansion.id) } : null;
}

function readLabel(labels, id) {
  return labels[id] ?? id;
}

function chipLabel(label) {
  return String(label).replace(/^(Khẩu phần |Nuôi )/, '');
}

function makeExpansionIcon(expansion, items) {
  return visualItemIcon(items, expansion.id, { size: 40 });
}

function expansionTitle(expansion) {
  const number = String(expansion.id).split('_')[1] ?? '';
  return `${expansion.kind === 'plot' ? 'Thửa' : 'Chuồng'} ${number}`;
}

function expansionEffect(expansion) {
  return expansion.kind === 'plot' ? 'Thêm 9 ô trồng' : `Tổng ${expansion.capacityAfter} chỗ nuôi`;
}

function expansionShortEffect(expansion) {
  return expansion.kind === 'plot' ? '+9 ô trồng' : `${expansion.capacityAfter} chỗ nuôi`;
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
export function setupWorkTrays({ E, items, labels, getState, getReady, run, showPanel, getGalleons = () => Infinity }) {
  const local = {
    craft: { selectedId: null, batches: 1, dom: null, buttons: new Map(), badges: new Map() },
    build: { selectedId: null, dom: null, buttons: new Map(), badges: new Map() },
  };
  const cropIds = new Set((E.DB.crops ?? []).map(crop => crop.id));

  const db = E.DB;
  const currentState = () => getState();

  function ensure(mode) {
    const model = local[mode];
    if (model.dom) return model.dom;
    const dock = $(`${mode}Dock`);
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
    if (entry.level > state.level) return { text: `Cấp ${entry.level}`, kind: 'lock' };
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
        mode === 'craft' ? makeRecipeIcon(entry, items, 40, labels) : makeExpansionIcon(entry, items),
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
      const time = el('span', { class: 'work-job-time' + (done ? ' ready-text' : ''), 'data-until': end, 'data-prefix': 'còn ', text: done ? 'Xong' : `còn ${duration(end - now)}` });
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
    dom.captionTitle.textContent = recipe.label;
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
    let label = 'Làm';
    if (!ready) label = 'Đợi chút';
    else if (choice.busy) label = 'Đang làm';
    else if (choice.missing) label = 'Thiếu đồ';
    else if (!choice.canCraft) label = 'Chưa mở';
    const go = label === 'Làm';
    dom.action.disabled = !ready || !choice.canCraft;
    setAction(dom.action, { icon: 'craft', label, count: go ? `×${choice.batches}` : '', text: `${label} · ${summary}` });
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
      dom.action.disabled = true;
      setAction(dom.action, { icon: 'build', label: 'Xong hết' });
      return;
    }

    const choice = buildChoice(expansion, state, now, db.expansions, getGalleons());
    const title = expansionTitle(expansion);
    dom.captionTitle.textContent = title;
    dom.captionMeta.textContent = `${expansion.hours > 0 ? '⏱ ' + hours(realHours(expansion, state.level)) : 'Tức thì'} · ${expansionShortEffect(expansion)}`;

    let reason = '';
    if (!choice.unlocked) reason = `Mở ở cấp ${expansion.level}`;
    else if (choice.queued && choice.ready) reason = 'Đã xong · bấm Nhận';
    else if (choice.queued) reason = 'Đang xây';
    else if (choice.sameKindBusy) reason = `Đang xây ${expansion.kind === 'plot' ? 'thửa' : 'chuồng'} khác`;
    else if (!choice.previousBuilt) reason = `Cần xây ${expansionTitle(choice.previous)} trước`;
    // Same order as the server: crops are checked before Galleons.
    else if (choice.missing) reason = choice.costs.some(c => c.have < c.need) ? 'Thiếu nông sản' : 'Thiếu Galleons';
    const price = [...choice.costs.map(c => `${readLabel(labels, c.id)} ${num(c.have)}/${num(c.need)}`), ...(choice.galleonNeed ? [`${num(choice.galleonNeed)} Galleons`] : [])].join(', ');
    const summary = `${title} · ${expansionEffect(expansion)} · ${price}${reason ? ' · ' + reason : ''}`;
    showCosts(dom, choice.costs, null, reason, summary, choice.galleonNeed, choice.galleonShort);

    const ready = getReady();
    let label = 'Xây';
    if (!ready) label = 'Đợi chút';
    else if (!choice.unlocked) label = `Cấp ${expansion.level}`;
    else if (choice.queued || choice.sameKindBusy) label = 'Đang xây';
    else if (choice.missing) label = 'Thiếu đồ';
    else if (!choice.previousBuilt) label = 'Chưa đủ';
    else if (!choice.canBuild) label = 'Chưa mở';
    dom.action.disabled = !ready || !choice.canBuild;
    setAction(dom.action, { icon: 'build', label, text: `${label} · ${summary}` });
  }

  function refresh(mode) {
    const state = currentState();
    const targets = mode && MODES.includes(mode) ? [mode] : MODES;
    for (const target of targets) {
      if (target === 'craft') renderCraft(state);
      else renderBuild(state);
    }
  }

  function dispatchCraft() {
    if (!getReady()) return;
    const selectedId = local.craft.selectedId;
    const requestedBatches = local.craft.batches;
    const state = currentState();
    const recipe = db.recipes.find(item => item.id === selectedId);
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
    const expansion = db.expansions.find(item => item.id === selectedId);
    const derived = buildAction(expansion, state, stateNow(E, state), db.expansions, getGalleons());
    if (!derived) {
      refresh('build');
      return;
    }
    run(next => E.build(next, selectedId, Date.now()), expansion.hours > 0 ? `Đã khởi công ${expansionTitle(expansion)} · xong sau ${hours(realHours(expansion, state.level))}.` : `Đã xây ${expansionTitle(expansion)}.`, derived.command);
  }

  function dispatchClaim(mode) {
    if (!getReady()) return;
    const state = currentState();
    const now = stateNow(E, state);
    const jobs = mode === 'craft' ? state.jobs : state.construction;
    if (!readyJobs(jobs, now).length) return;
    if (mode === 'craft') run(next => E.claimCraft(next, Date.now()), 'Đã nhận thành phẩm.', { action: 'claimCraft' });
    else run(next => E.claimBuildings(next, Date.now()), 'Công trình đã mở sử dụng.', { action: 'claimBuildings' });
  }

  refresh();
  return { refresh };
}

export default setupWorkTrays;
