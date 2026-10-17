import { $, button, el, hours, icon, num, visualItemIcon } from './ui-utils.mjs?v=24.9.6';
import { DB } from './balance-data.mjs';

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

/**
 * Derive the construction button state without normalizing or mutating save
 * data. A ready queued job remains a claim operation; it is never auto-claimed.
 */
export function buildChoice(expansion, state = {}, now = Date.now(), expansions = []) {
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
      kitHave: 0,
      kitNeed: 0,
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
  const kitNeed = Number(expansion.kitCost ?? 0);
  const kitHave = inventoryValue(state, 'kit');
  const unlocked = Number(state.level ?? 0) >= Number(expansion.level ?? 0);
  const built = builtIds.includes(expansion.id);
  const queued = Boolean(queuedJob);
  const ready = queued && Number(queuedJob.readyAt) <= Number(now);
  const missing = kitHave < kitNeed;
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
    kitHave,
    kitNeed,
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
function buildAction(expansion, state, now, expansions) {
  const choice = buildChoice(expansion, state, now, expansions);
  return choice.canBuild ? { choice, command: buildCommand(expansion.id) } : null;
}

function readLabel(labels, id) {
  return labels[id] ?? id;
}

function chipLabel(label) {
  return label.replace(/^(Khẩu phần |Bộ vật liệu |Nuôi )/, '');
}

function recipeIconId(recipe, E, items) {
  for (const [id] of Object.entries(recipe.inputs)) if (items.has(id)) return id;
  const creature = Object.values(E.CREATURE).find(item => item.feed === recipe.output && items.has(item.id));
  if (creature) return creature.id;
  return items.has(recipe.output) ? recipe.output : null;
}

function makeRecipeIcon(recipe, E, items) {
  const id = recipeIconId(recipe, E, items);
  return id ? icon(items, id, 3, 40) : el('span', { class: 'tray-glyph', 'aria-hidden': true, text: '⚗' });
}

function makeExpansionIcon(expansion, items) {
  return visualItemIcon(items, expansion.id, {size:40});
}

function expansionTitle(expansion) {
  const number = String(expansion.id).split('_')[1] ?? '';
  return `${expansion.kind === 'plot' ? 'Thửa' : 'Chuồng'} ${number}`;
}

function expansionEffect(expansion) {
  return expansion.kind === 'plot' ? 'Thêm 9 ô trồng' : `Tổng ${expansion.capacityAfter} chỗ nuôi`;
}

function expansionShortEffect(expansion) {
  return expansion.kind === 'plot' ? '+9 ô' : `${expansion.capacityAfter} chỗ nuôi`;
}

function stateNow(E, state) {
  return E.nowFor(state, Date.now());
}

function readyJobs(jobs, now) {
  return jobs.filter(job => Number(job.readyAt) <= Number(now));
}

function syncClaim(dom, mode, visible, getReady) {
  if (visible) {
    if (!dom.claim.parentNode) dom.detail.append(dom.claim);
    dom.claim.disabled = !getReady();
    dom.claim.title = mode === 'craft'
      ? 'Nhận tất cả mẻ đã sẵn sàng; không tự nhận.'
      : 'Nhận tất cả công trình đã sẵn sàng; không tự nhận.';
    dom.claim.setAttribute('aria-label', dom.claim.title);
  } else if (dom.claim.parentNode) {
    dom.claim.remove();
  }
}

/**
 * Mount the two horizontal work trays into the empty craftDock/buildDock
 * sections. Tray buttons are reconciled in place, so a refresh timer never
 * replaces the focused button or scroll container.
 */
export function setupWorkTrays({ E, items, labels, getState, getReady, run, showPanel }) {
  const local = {
    craft: { selectedId: null, batches: 1, dom: null, buttons: new Map() },
    build: { selectedId: null, dom: null, buttons: new Map() },
  };

  const db = E.DB;
  const currentState = () => getState();

  function ensure(mode) {
    const model = local[mode];
    if (model.dom) return model.dom;
    const dock = $(`${mode}Dock`);
    if (!dock) return null;

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
    let batches = null;
    if (mode === 'craft') {
      batches = el('select', { id: 'craftBatches', 'aria-label': 'Số mẻ tức thì' });
      for (const value of [1, 3, 10]) batches.append(el('option', { value, text: String(value) }));
      batches.addEventListener('change', event => {
        const value = Number(event.target.value);
        local.craft.batches = safeInteger(value) && value >= 1 ? value : 1;
        refresh('craft');
      });
    }
    const details = button('⋯', () => showPanel(mode), {
      id: `${mode}Details`,
      title: mode === 'craft' ? 'Mở danh sách chế biến đầy đủ' : 'Mở danh sách xây dựng đầy đủ',
      'aria-label': mode === 'craft' ? 'Mở chi tiết chế biến' : 'Mở chi tiết xây dựng',
    });
    const action = button(mode === 'craft' ? 'Làm' : 'Xây', () => {
      if (mode === 'craft') dispatchCraft();
      else dispatchBuild();
    }, {
      id: `${mode}Action`,
      class: 'primary',
    });
    if (batches) controls.append(batches);
    controls.append(details, action);

    const detail = el('div', { class: 'work-detail' });
    const detailText = el('span', { class: 'work-detail-text' });
    detail.append(detailText);
    const claim = button(mode === 'craft' ? 'Nhận mẻ xong' : 'Nhận CT xong', () => {
      dispatchClaim(mode);
    }, {
      id: `${mode}Claim`,
      class: 'work-claim ready-only',
    });

    dock.replaceChildren(caption, seedSide, controls, detail);
    model.dom = { dock, caption, captionTitle, captionMeta, seedSide, tray, controls, batches, details, action, detail, detailText, claim };
    return model.dom;
  }

  function recipesFor(state) {
    return db.recipes.filter(recipe => recipe.level <= state.level);
  }

  function expansionsFor(state) {
    return db.expansions.filter(expansion => expansion.level <= state.level);
  }

  function reconcileTray(mode, state, entries) {
    const model = local[mode];
    const dom = model.dom;
    const ids = new Set(entries.map(entry => entry.id));
    for (const [id, trayButton] of model.buttons) {
      if (!ids.has(id)) {
        trayButton.remove();
        model.buttons.delete(id);
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
      trayButton.append(mode === 'craft' ? makeRecipeIcon(entry, E, items) : makeExpansionIcon(entry, items));
      if (mode === 'build') trayButton.append(el('span', { class: 'tray-label', text: title.match(/\d+/)?.[0] || title }));
      else trayButton.append(el('span', { class: 'tray-label', text: chipLabel(entry.label) }));
      model.buttons.set(entry.id, trayButton);
      dom.tray.append(trayButton);
    }
    if (!ids.has(model.selectedId)) {
      const first = mode === 'build'
        ? entries.find(entry => !state.built.includes(entry.id))
        : entries[0];
      model.selectedId = (first ?? entries[0])?.id ?? null;
    }
    for (const entry of entries) {
      const trayButton = model.buttons.get(entry.id);
      const selected = entry.id === model.selectedId;
      trayButton.classList.toggle('selected', selected);
      trayButton.setAttribute('aria-pressed', String(selected));
      trayButton.title = mode === 'craft' ? String(entry.label ?? entry.id) : expansionTitle(entry);
    }
  }

  function showCosts(dom, costs, output, reason, summary) {
    // Only presentation changes; quantities and blockers come from the same derived choice.
    dom.detailText.title = summary;
    dom.detailText.setAttribute('role', 'group');
    dom.detailText.setAttribute('aria-label', summary);
    const chips = costs.map(({id,have,need}) => {
      const chip = el('span', {class: 'dock-cost' + (have < need ? ' is-short' : ''), 'aria-hidden':'true', title: `${readLabel(labels,id)} ${num(have)}/${num(need)}`});
      chip.append(visualItemIcon(items,id,{size:22}),el('span',{text:`${num(have)}/${num(need)}`}));
      return chip;
    });
    if(output){
      const chip=el('span',{class:'dock-cost is-output','aria-hidden':'true',title:`+${num(output.count)} ${readLabel(labels,output.id)}`});
      chip.append(el('span',{text:'→'}),visualItemIcon(items,output.id,{size:22}),el('span',{text:`+${num(output.count)}`}));
      chips.push(chip);
    }
    if(reason)chips.push(el('span',{class:'dock-cost-reason',text:reason,'aria-hidden':'true'}));
    dom.detailText.replaceChildren(...chips);
  }

  function renderCraft(state) {
    const model = local.craft;
    const dom = ensure('craft');
    if (!dom) return;
    const recipes = recipesFor(state);
    reconcileTray('craft', state, recipes);
    const recipe = recipes.find(item => item.id === model.selectedId) ?? null;
    const now = stateNow(E, state);
    syncClaim(dom, 'craft', readyJobs(state.jobs, now).length > 0, getReady);
    if (!recipe) {
      dom.captionTitle.textContent = 'Chọn công thức';
      dom.captionMeta.textContent = 'Chưa có công thức';
      dom.detailText.textContent = 'Chưa có công thức đã mở.';
      dom.action.disabled = true;
      dom.action.textContent = 'Chưa mở';
      return;
    }

    if (recipe.hours > 0) model.batches = 1;
    const choice = craftChoice(recipe, state, model.batches);
    const outputCount = Number(recipe.count) * choice.batches;
    dom.captionTitle.textContent = recipe.label;
    dom.captionMeta.textContent = hours(recipe.hours);
    dom.batches.value = String(model.batches);
    dom.batches.disabled = recipe.hours > 0;

    const inputText = Object.entries(choice.needs)
      .map(([id, need]) => `${readLabel(labels, id)} ${num(inventoryValue(state, id))}/${num(need)}`)
      .join(' · ');
    const detailReason = choice.busy ? 'Đang làm' : choice.missing ? 'Thiếu nguyên liệu' : !choice.canCraft ? 'Chưa đủ điều kiện' : 'Sẵn sàng';
    const summary = `${inputText} · +${num(outputCount)} ${readLabel(labels, recipe.output)} · ${detailReason}`;
    showCosts(dom,Object.entries(choice.needs).map(([id,need])=>({id,need,have:inventoryValue(state,id)})),
      {id:recipe.output,count:outputCount},detailReason==='Sẵn sàng'?'':detailReason,summary);

    const ready = getReady();
    let actionText = `Làm ×${choice.batches}`;
    if (!ready) actionText = 'Đợi chút';
    else if (choice.busy) actionText = 'Đang làm';
    else if (choice.missing) actionText = 'Thiếu đồ';
    else if (!choice.canCraft) actionText = 'Chưa mở';
    dom.action.disabled = !ready || !choice.canCraft;
    dom.action.textContent = actionText;
    dom.action.title = summary;
  }

  function renderBuild(state) {
    const model = local.build;
    const dom = ensure('build');
    if (!dom) return;
    const expansions = expansionsFor(state);
    reconcileTray('build', state, expansions);
    const expansion = expansions.find(item => item.id === model.selectedId) ?? null;
    const now = stateNow(E, state);
    syncClaim(dom, 'build', readyJobs(state.construction, now).length > 0, getReady);
    if (!expansion) {
      dom.captionTitle.textContent = 'Chọn công trình';
      dom.captionMeta.textContent = 'Chưa có công trình';
      dom.detailText.textContent = 'Chưa có công trình đã mở.';
      dom.action.disabled = true;
      dom.action.textContent = 'Chưa mở';
      return;
    }

    const choice = buildChoice(expansion, state, now, db.expansions);
    const title = expansionTitle(expansion);
    dom.captionTitle.textContent = title;
    dom.captionMeta.textContent = `${hours(expansion.hours)} · ${expansionShortEffect(expansion)}`;

    const previous = choice.previous ? ` · cần ${expansionTitle(choice.previous)}` : '';
    let detailReason = expansionEffect(expansion);
    if (choice.built) detailReason = 'Đã xây';
    else if (choice.queued && choice.ready) detailReason = 'Đã xong · chờ nhận';
    else if (choice.queued || choice.sameKindBusy) detailReason = 'Đang làm';
    else if (!choice.previousBuilt) detailReason = `Chưa xong công trình trước${previous}`;
    else if (choice.missing) detailReason = 'Thiếu vật liệu';
    const summary = `${title} · Bộ vật liệu ${num(choice.kitHave)}/${num(choice.kitNeed)} · ${detailReason}`;
    showCosts(dom,[{id:'kit',have:choice.kitHave,need:choice.kitNeed}],null,choice.canBuild?'':detailReason,summary);

    const ready = getReady();
    let actionText = 'Xây';
    if (!ready) actionText = 'Đợi chút';
    else if (choice.built) actionText = 'Đã xây';
    else if (choice.queued || choice.sameKindBusy) actionText = 'Đang làm';
    else if (choice.missing) actionText = 'Thiếu đồ';
    else if (!choice.previousBuilt) actionText = 'Chưa đủ';
    else if (!choice.canBuild) actionText = 'Chưa mở';
    dom.action.disabled = !ready || !choice.canBuild;
    dom.action.textContent = actionText;
    dom.action.title = summary;
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
    run(next => E.craft(next, selectedId, choice.batches, Date.now()), recipe.hours > 0 ? 'Đã bắt đầu mẻ.' : 'Đã chế biến thành phẩm.', command);
  }

  function dispatchBuild() {
    if (!getReady()) return;
    const selectedId = local.build.selectedId;
    const state = currentState();
    const expansion = db.expansions.find(item => item.id === selectedId);
    const derived = buildAction(expansion, state, stateNow(E, state), db.expansions);
    if (!derived) {
      refresh('build');
      return;
    }
    run(next => E.build(next, selectedId, Date.now()), `Đã khởi công ${expansionTitle(expansion)}.`, derived.command);
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
