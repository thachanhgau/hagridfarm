import {el, button, num, hours, realHours, cropVisualKind, visualItemIcon} from './ui-utils.mjs?v=26.27';
import {levelLabel} from './progression-engine.mjs?v=26.27';
import {pixelIcon, iconButton, lockBadge} from './pixel-icons.mjs?v=26.27';

/**
 * V21.0 Direction 2:
 * 1. "Bưu thiếp Rừng Cấm" (Ornate PNG Postcard Snapshot generator & modal)
 * 2. "Sổ tay Người Giữ Vườn" (Interactive Ecological Almanac: Seed -> Crop -> Recipe -> Creature -> Produce -> Keepsake)
 */

export function extractPostcardMeta({
  state = {},
  stage = null,
  atmosphere = null,
  weather = null,
  event = null,
  totalAffinity = 0,
  playerName = 'Người giữ vườn',
  keeperTitle = '',
} = {}) {
  const level = Math.max(1, Number(state?.level) || 1);
  const xp = Math.max(0, Number(state?.xp) || 0);
  const plots = Array.isArray(state?.plots) ? state.plots.length : 1;
  const creatures = Array.isArray(state?.creatures) ? state.creatures.length : 0;
  const keepsakesObj = state?.keepsakes && typeof state.keepsakes === 'object' ? state.keepsakes : {};
  let keepsakeTotal = 0;
  for (const k of Object.keys(keepsakesObj)) {
    keepsakeTotal += Math.max(0, Number(keepsakesObj[k]) || 0);
  }
  const earnedCount = Array.isArray(state?.decorations) ? state.decorations.length : 0;
  const storeCount = Array.isArray(state?.decorations?.owned) ? state.decorations.owned.length : 0;
  const decorTotal = earnedCount + storeCount;

  return {
    playerName: String(playerName || 'Người giữ vườn'),
    keeperTitle: String(keeperTitle || ''),
    level,
    xp,
    stageId: stage?.id || 1,
    stageName: stage?.name || 'Sân nhỏ bên lều',
    atmosphereIcon: atmosphere?.icon || '☀',
    atmosphereLabel: atmosphere?.label || 'Nắng sớm bìa rừng',
    weatherIcon: '',
    weatherLabel: weather?.id && weather.id !== 'clear' ? weather.shortLabel || weather.label : '',
    eventIcon: event?.icon || '',
    eventLabel: event?.id && event.id !== 'none' ? event.shortLabel || event.label : '',
    totalAffinity: Math.max(0, Number(totalAffinity) || 0),
    plots,
    creatures,
    keepsakeTotal,
    decorTotal,
  };
}

export function renderPostcardCanvas(sourceCanvas, metaInput = {}, doc = globalThis.document) {
  const meta = extractPostcardMeta(metaInput);
  const width = 960;
  const height = 620;
  const out = doc && typeof doc.createElement === 'function'
    ? doc.createElement('canvas')
    : {width: 0, height: 0, getContext: () => null};
  out.width = width;
  out.height = height;
  const ctx = out.getContext('2d');
  if (!ctx) return out;

  ctx.imageSmoothingEnabled = false;

  // Deep forest parchment frame background
  ctx.fillStyle = '#142620';
  ctx.fillRect(0, 0, width, height);

  // Outer brass border
  ctx.strokeStyle = '#a57554';
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 10, width - 20, height - 20);

  ctx.strokeStyle = '#f5d69a';
  ctx.lineWidth = 2;
  ctx.strokeRect(16, 16, width - 32, height - 32);

  // Viewport frame for the garden snapshot
  const viewX = 28;
  const viewY = 28;
  const viewW = width - 56;
  const viewH = 476;

  ctx.fillStyle = '#142620';
  ctx.fillRect(viewX, viewY, viewW, viewH);

  if (sourceCanvas && typeof ctx.drawImage === 'function') {
    const sw = Number(sourceCanvas.width) || viewW;
    const sh = Number(sourceCanvas.height) || viewH;
    const scale = Math.max(viewW / Math.max(1, sw), viewH / Math.max(1, sh));
    const dw = Math.round(sw * scale);
    const dh = Math.round(sh * scale);
    const dx = viewX + Math.round((viewW - dw) / 2);
    const dy = viewY + Math.round((viewH - dh) / 2);
    if (ctx.save && ctx.beginPath && ctx.rect && ctx.clip) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(viewX, viewY, viewW, viewH);
      ctx.clip();
      ctx.drawImage(sourceCanvas, dx, dy, dw, dh);
      ctx.restore();
    } else {
      ctx.drawImage(sourceCanvas, viewX, viewY, viewW, viewH);
    }
  }

  ctx.strokeStyle = '#f5d69a';
  ctx.lineWidth = 2;
  ctx.strokeRect(viewX, viewY, viewW, viewH);

  // Bottom plaque (owner 19/11/2026 «bỏ bớt info đi cho đẹp»): no box of its own, the seal, the keeper's name, level and land;
  // the game's name on the right. XP, counts, weather, festival and the keeper title stay in the game, not on the card.
  const plaqueY = 504;
  const midY = plaqueY + (height - 26 - plaqueY) / 2;
  const sealX = 64;
  ctx.fillStyle = '#8b4a3f';
  if (ctx.beginPath && ctx.arc) {
    ctx.beginPath();
    ctx.arc(sealX, midY, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#f5d69a';
    ctx.stroke();
  } else {
    ctx.fillRect(sealX - 22, midY - 22, 44, 44);
  }
  ctx.fillStyle = '#f5d69a';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('H', sealX, midY + 1);

  const spaced = (px) => { if ('letterSpacing' in ctx) ctx.letterSpacing = px; };
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'right';
  ctx.font = 'bold 13px Georgia, serif';
  spaced('3px');
  const brand = 'KHU VƯỜN HAGRID';
  const brandWidth = ctx.measureText(brand).width;
  ctx.fillStyle = '#ffc36b';
  ctx.fillText(brand, width - 44, midY - 2);
  ctx.fillStyle = '#a6b1ae';
  ctx.font = '11px sans-serif';
  spaced('2px');
  ctx.fillText('HPVN', width - 44, midY + 16);

  // Left lines stop before the brand; fillText's maxWidth narrows long names instead of overlapping.
  const lineWidth = Math.max(120, width - 44 - brandWidth - 32 - 100);
  const plain = (text) => String(text).replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, '').trim();
  ctx.textAlign = 'left';
  ctx.fillStyle = '#f5d69a';
  ctx.font = 'bold 22px Georgia, serif';
  spaced('1px');
  ctx.fillText(plain(meta.playerName).toUpperCase(), 100, midY - 2, lineWidth);
  spaced('0px');
  ctx.fillStyle = '#d6d8bf';
  ctx.font = '14px Georgia, serif';
  ctx.fillText(`${levelLabel(meta.level)} · ${meta.stageName}`, 100, midY + 18, lineWidth);

  return out;
}

// The Bưu thiếp tab of the Hồ sơ panel: a snapshot of the garden to save or show off.
export function renderPostcardSection({
  canvas,
  state,
  stage,
  atmosphere,
  weather,
  event,
  totalAffinity,
  playerName,
  keeperTitle,
  onShareFloo,
  onSaved,
  notify,
}) {
  const meta = extractPostcardMeta({state, stage, atmosphere, weather, event, totalAffinity, playerName, keeperTitle});
  const postcardCanvas = renderPostcardCanvas(canvas, {state, stage, atmosphere, weather, event, totalAffinity, playerName, keeperTitle}, document);
  postcardCanvas.className = 'postcard-preview-canvas';
  postcardCanvas.setAttribute('role', 'img');
  postcardCanvas.setAttribute('aria-label', `Bưu thiếp khu vườn, cấp ${meta.level}`);

  const downloadPng = () => {
    try {
      const dataUrl = postcardCanvas.toDataURL('image/png');
      const link = el('a', {
        href: dataUrl,
        download: `buu-thiep-vuon-hagrid-cap-${meta.level}.png`,
      });
      link.click();
      onSaved?.();
      notify?.('📸 Đã tải ảnh Bưu thiếp Rừng Cấm (.png) về máy!');
    } catch {
      notify?.('Trình duyệt hiện tại hạn chế xuất ảnh trực tiếp.');
    }
  };

  return el('section', {class: 'postcard-section', 'aria-label': `Bưu thiếp · Cấp ${meta.level}`}, [
    el('div', {class: 'postcard-canvas-wrap'}, [postcardCanvas]),
    el('div', {class: 'actions postcard-actions'}, [
      button('Lưu ảnh', downloadPng, {
        class: 'primary',
        'data-download-postcard': 'true',
      }),
      ...(onShareFloo
        ? [button('Khoe vườn', () => onShareFloo(postcardCanvas), {'data-postcard-floo': 'true'})]
        : []),
    ]),
  ]);
}

export function buildAlmanacChains(DB, state = {}) {
  const cropsById = new Map((DB.crops || []).map((c) => [c.id, c]));
  const recipesByOutput = new Map((DB.recipes || []).map((r) => [r.output, r]));
  const level = Math.max(1, Number(state?.level) || 1);
  const ownedCreatures = new Set((state?.creatures || []).map((c) => c.species));
  const keepsakes = state?.keepsakes || {};
  const inventory = state?.inventory || {};

  const creatureChains = (DB.animals || []).map((animal) => {
    const recipe = recipesByOutput.get(animal.feed) || null;
    const ingredients = [];
    if (recipe && recipe.inputs) {
      for (const [inputId, qty] of Object.entries(recipe.inputs)) {
        const crop = cropsById.get(inputId);
        const subRecipe = recipesByOutput.get(inputId);
        ingredients.push({
          id: inputId,
          label: crop ? crop.label : inputId === 'insects' ? 'Côn trùng' : inputId === 'fish' ? 'Cá nhỏ' : inputId,
          qty,
          kind: crop ? 'crop' : 'station',
          level: crop ? crop.level : subRecipe ? subRecipe.level : 1,
          hours: realHours(crop || subRecipe, level),
          inStock: Number(inventory[inputId] || 0),
        });
      }
    }
    return {
      creatureId: animal.id,
      creatureLabel: animal.label,
      level: animal.level,
      rarity: animal.rarityLabel || animal.rarity,
      unlocked: level >= animal.level,
      adopted: ownedCreatures.has(animal.id),
      feedId: animal.feed,
      feedLabel: recipe?.label || `Khẩu phần ${animal.label}`,
      feedInStock: Number(inventory[animal.feed] || 0),
      mealPortions: animal.mealPortions,
      mealsToAdult: animal.mealsToAdult,
      cycleXP: animal.cycleXP,
      produceId: `produce_${animal.id}`,
      produceLabel: animal.produce,
      produceInStock: Number(inventory[`produce_${animal.id}`] || 0),
      keepsakeCount: Number(keepsakes[animal.id] || 0),
      ingredients,
    };
  });

  const cropUsages = (DB.crops || []).map((crop) => {
    const usedInRecipes = (DB.recipes || []).filter((r) => r.inputs && r.inputs[crop.id] > 0);
    const feedsCreatures = [];
    for (const r of usedInRecipes) {
      const targetAnimal = (DB.animals || []).find((a) => a.feed === r.output);
      if (targetAnimal) {
        feedsCreatures.push({
          creatureId: targetAnimal.id,
          creatureLabel: targetAnimal.label,
          qtyPerBatch: r.inputs[crop.id],
        });
      }
    }
    return {
      id: crop.id,
      label: crop.label,
      level: crop.level,
      hours: realHours(crop, level),
      plantXP: crop.plantXP,
      harvestXP: crop.harvestXP,
      totalXP: crop.totalXP,
      unlocked: level >= crop.level,
      inStock: Number(inventory[crop.id] || 0),
      feedsCreatures,
    };
  });

  return {creatureChains, cropUsages};
}

export function renderAlmanacSection({DB, items, state, onSelectCrop, onSelectCreature, onOpenCraft}) {
  const {creatureChains, cropUsages} = buildAlmanacChains(DB, state);
  const wrap = el('div', {class: 'almanac-view'});
  const arrow = () => el('span', {class: 'gp-chain-arrow', 'aria-hidden': 'true'}, [pixelIcon('arrow', 1)]);
  const stock = (id, n, have, label) => el('span', {class: `gp-chain-item${have >= n ? ' has-stock' : ''}`, title: `${label}: kho ${num(have)}/${num(n)}`}, [visualItemIcon(items, id, {size: 28, kind: cropVisualKind(id)}), el('b', {text: `${num(have)}/${num(n)}`})]);

  wrap.append(el('section', {class: 'gp-hero almanac-hero'}, [
    el('div', {class: 'gp-medal'}, [pixelIcon('book', 2), el('b', {text: String(creatureChains.length)})]),
    el('div', {class: 'gp-hero-chain', role: 'img', 'aria-label': 'Cây, thành thức ăn, nuôi sinh vật'}, [pixelIcon('sow', 2), arrow(), pixelIcon('craft', 2), arrow(), pixelIcon('pen', 2)]),
  ]));

  wrap.append(el('h3', {class: 'gp-section-title', text: 'Sinh vật'}));
  const chainGrid = el('div', {class: 'almanac-chain-grid gp-tiles is-wide'});
  for (const chain of creatureChains) {
    const actions = el('div', {class: 'gp-tile-actions'});
    if (chain.unlocked) {
      if (chain.ingredients[0]?.kind === 'crop' && onSelectCrop) actions.append(iconButton('sow', `Gieo ${chain.ingredients[0].label}`, () => onSelectCrop(chain.ingredients[0].id)));
      if (onOpenCraft) actions.append(iconButton('craft', `Chế biến ${chain.feedLabel}`, () => onOpenCraft(chain.feedId)));
      if (onSelectCreature) actions.append(iconButton('pen', `Thăm ${chain.creatureLabel}`, () => onSelectCreature(chain.creatureId), {text: 'Thăm', class: 'primary'}));
    }
    chainGrid.append(el('article', {
      class: `almanac-chain-card gp-tile${chain.unlocked ? '' : ' is-locked'}`,
      'data-almanac-creature': chain.creatureId,
      title: `${chain.mealPortions} khẩu phần/bữa · ${chain.mealsToAdult} bữa trưởng thành · +${num(chain.cycleXP)} XP`,
    }, [
      el('div', {class: 'gp-tile-art'}, [
        visualItemIcon(items, chain.creatureId, {size: 56}),
        chain.unlocked ? (chain.adopted ? el('span', {class: 'gp-corner is-done', title: 'Đang nuôi'}, [pixelIcon('heart', 1)]) : null) : lockBadge(chain.level),
      ]),
      el('div', {class: 'gp-tile-body'}, [
        el('strong', {class: 'gp-tile-name', text: chain.creatureLabel}),
        el('small', {class: 'gp-tile-sub', text: `${chain.rarity} · +${num(chain.cycleXP)} XP`}),
        el('div', {class: 'gp-chain', role: 'group', 'aria-label': 'Chuỗi nuôi'}, [
          ...chain.ingredients.map((ing) => stock(ing.id, ing.qty, ing.inStock, ing.label)),
          arrow(),
          stock(chain.feedId, chain.mealPortions, chain.feedInStock, chain.feedLabel),
          arrow(),
          el('span', {class: 'gp-chain-item', title: `${chain.produceLabel}: ${num(chain.produceInStock)}/5 · ${chain.keepsakeCount} kỷ vật`}, [visualItemIcon(items, chain.produceId, {size: 28, kind: 'produce'}), el('b', {text: `${num(chain.produceInStock)}/5`})]),
        ]),
        actions,
      ]),
    ]));
  }
  wrap.append(chainGrid);

  wrap.append(el('h3', {class: 'gp-section-title', text: 'Cây trồng'}));
  const cropGrid = el('div', {class: 'cards gp-tiles'});
  for (const crop of cropUsages) {
    const uses = crop.feedsCreatures.map((u) => `${u.creatureLabel} ×${u.qtyPerBatch}`).join(' · ');
    cropGrid.append(el('article', {class: `card gp-tile${crop.unlocked ? '' : ' locked is-locked'}`, title: uses ? `Dùng cho: ${uses}` : 'Dùng cho công thức nâng cao'}, [
      el('div', {class: 'gp-tile-art'}, [visualItemIcon(items, crop.id, {size: 56}), crop.unlocked ? null : lockBadge(crop.level)]),
      el('strong', {class: 'gp-tile-name', text: crop.label}),
      el('small', {class: 'gp-tile-sub', text: `${hours(crop.hours)} · +${crop.totalXP} XP · kho ${num(crop.inStock)}`}),
      crop.feedsCreatures.length ? el('div', {class: 'gp-chain is-mini', 'aria-hidden': 'true'}, crop.feedsCreatures.slice(0, 4).map((u) => visualItemIcon(items, u.creatureId, {size: 24}))) : null,
      crop.unlocked && onSelectCrop ? el('div', {class: 'gp-tile-actions'}, [iconButton('sow', `Chọn gieo ${crop.label}`, () => onSelectCrop(crop.id), {text: 'Gieo', class: 'primary'})]) : null,
    ]));
  }
  wrap.append(cropGrid);

  return wrap;
}
