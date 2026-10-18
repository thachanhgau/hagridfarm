import {el, button, num, hours, visualItemIcon} from './ui-utils.mjs?v=24.9.33';

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
    weatherIcon: weather?.icon || '',
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

  // Bottom plaque
  const plaqueY = 514;
  const plaqueH = 78;
  ctx.fillStyle = '#142620';
  ctx.fillRect(28, plaqueY, width - 56, plaqueH);
  ctx.strokeStyle = '#a57554';
  ctx.lineWidth = 2;
  ctx.strokeRect(28, plaqueY, width - 56, plaqueH);

  // Crimson & gold Hogwarts/Hagrid Wax Seal
  const sealX = 68;
  const sealY = plaqueY + 39;
  ctx.fillStyle = '#8b4a3f';
  if (ctx.beginPath && ctx.arc) {
    ctx.beginPath();
    ctx.arc(sealX, sealY, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#f5d69a';
    ctx.stroke();
  } else {
    ctx.fillRect(sealX - 22, sealY - 22, 44, 44);
  }
  ctx.fillStyle = '#f5d69a';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('H', sealX, sealY + 1);

  // Text details
  // Left lines stop before the right stamp; fillText's maxWidth narrows long names instead of overlapping.
  const stamp = ['HPVN · DIỄN ĐÀN HARRY POTTER VIỆT NAM', `Tổng tích lũy: ${num(meta.xp)} XP`, 'Bưu thiếp kỷ niệm Rừng Cấm'];
  ctx.font = 'bold 12px monospace';
  const stampWidth = Math.max(...stamp.map((text) => ctx.measureText(text).width));
  const lineWidth = Math.max(120, width - 44 - stampWidth - 16 - 108);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#f5d69a';
  ctx.font = 'bold 17px Georgia, serif';
  const titleSuffix = meta.keeperTitle ? ` · [${meta.keeperTitle}]` : '';
  ctx.fillText(`KHU VƯỜN HAGRID · ${meta.playerName.toUpperCase()}${titleSuffix}`, 108, plaqueY + 28, lineWidth);

  ctx.fillStyle = '#d6d8bf';
  ctx.font = 'bold 13px sans-serif';
  const weatherSuffix = meta.weatherLabel ? ` · ${meta.weatherIcon} ${meta.weatherLabel}` : '';
  const eventSuffix = meta.eventLabel ? ` · ${meta.eventLabel}` : '';
  ctx.fillText(
    `Cấp ${meta.level}/100 · Chương ${meta.stageId}/6: ${meta.stageName} · ${meta.atmosphereIcon} ${meta.atmosphereLabel}${weatherSuffix}${eventSuffix}`,
    108,
    plaqueY + 50,
    lineWidth,
  );

  ctx.fillStyle = '#b7dee0';
  ctx.font = '12px sans-serif';
  const affSuffix = meta.totalAffinity > 0 ? `   ♥ Gắn kết ${meta.totalAffinity}` : '';
  ctx.fillText(
    `🌱 ${meta.plots}/12 Thửa đất   🐾 ${meta.creatures}/12 Sinh vật   🏆 ${meta.keepsakeTotal} Kỷ vật   ✨ ${meta.decorTotal} Trang trí${affSuffix}`,
    108,
    plaqueY + 69,
    lineWidth,
  );

  // Right stamp badge
  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffc36b';
  ctx.font = 'bold 12px monospace';
  ctx.fillText(stamp[0], width - 44, plaqueY + 30);
  ctx.fillStyle = '#a6b1ae';
  ctx.font = '11px monospace';
  ctx.fillText(stamp[1], width - 44, plaqueY + 50);
  ctx.fillText(stamp[2], width - 44, plaqueY + 68);

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
        ? [button('Khoe vườn', () => onShareFloo(), {'data-postcard-floo': 'true'})]
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
          hours: crop ? crop.hours : subRecipe ? subRecipe.hours : 0,
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
      hours: crop.hours,
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

  const hero = el('section', {class: 'journey-hero-card almanac-hero'}, [
    el('div', {class: 'journey-hero-main'}, [
      el('div', {class: 'journey-medal-seal'}, [
        el('small', {text: 'SỔ TAY'}),
        el('b', {text: '12'}),
      ]),
      el('div', {class: 'journey-hero-copy'}, [
        el('small', {class: 'journey-kicker', text: 'CÂY → THỨC ĂN → SINH VẬT'}),
        el('h3', {text: 'Sổ tay'}),
        el('p', {
          text: 'Chọn một loài để xem cách nuôi.',
        }),
      ]),
    ]),
  ]);
  wrap.append(hero);

  wrap.append(
    el('h3', {text: 'Sinh vật'}),
  );

  const chainGrid = el('div', {class: 'almanac-chain-grid'});
  for (const chain of creatureChains) {
    const statusBadge = chain.adopted
      ? '✓ Đang nuôi'
      : chain.unlocked
        ? '✦ Đã mở khóa'
        : `🔒 Mở cấp ${chain.level}`;
    const card = el('article', {
      class: `almanac-chain-card${chain.unlocked ? '' : ' is-locked'}`,
      'data-almanac-creature': chain.creatureId,
    }, [
      el('div', {class: 'almanac-chain-head'}, [
        visualItemIcon(items, chain.creatureId, {size: 48}),
        el('div', {class: 'almanac-chain-title'}, [
          el('div', {class: 'almanac-tags'}, [
            el('span', {class: 'badge', text: `Cấp ${chain.level} · ${chain.rarity}`}),
            el('small', {text: statusBadge}),
          ]),
          el('strong', {text: chain.creatureLabel}),
          el('small', {
            text: `${chain.mealPortions} khẩu phần/bữa · ${chain.mealsToAdult} bữa trưởng thành · +${num(chain.cycleXP)} XP`,
          }),
        ]),
      ]),
      el('div', {class: 'almanac-flow-steps'}, [
        el('div', {class: 'almanac-step'}, [
          el('small', {text: 'Nguyên liệu'}),
          el('div', {class: 'almanac-ing-list'}, chain.ingredients.map((ing) => (
            el('span', {
              class: `almanac-ing-pill${ing.inStock >= ing.qty ? ' has-stock' : ''}`,
              text: `${ing.label} ×${ing.qty} (Kho: ${num(ing.inStock)})`,
            })
          ))),
        ]),
        el('div', {class: 'almanac-step'}, [
          el('small', {text: 'Thức ăn'}),
          el('strong', {text: `${chain.feedLabel} (Kho: ${num(chain.feedInStock)})`}),
        ]),
        el('div', {class: 'almanac-step'}, [
          el('small', {text: 'Sản vật'}),
          el('strong', {
            text: `${chain.produceLabel} (Kho: ${num(chain.produceInStock)}/5) → 🏆 Đài kỷ vật ×${chain.keepsakeCount}`,
          }),
        ]),
      ]),
      el('div', {class: 'actions'}, [
        ...(chain.ingredients[0]?.kind === 'crop' && onSelectCrop
          ? [button(`🌱 Gieo ${chain.ingredients[0].label}`, () => onSelectCrop(chain.ingredients[0].id))]
          : []),
        ...(onOpenCraft
          ? [button('⚗ Chế biến', () => onOpenCraft(chain.feedId))]
          : []),
        ...(onSelectCreature
          ? [button(`🐾 Thăm ${chain.creatureLabel}`, () => onSelectCreature(chain.creatureId), {class: 'primary'})]
          : []),
      ]),
    ]);
    chainGrid.append(card);
  }
  wrap.append(chainGrid);

  wrap.append(
    el('h3', {text: 'Cây trồng'}),
  );
  const cropGrid = el('div', {class: 'cards'});
  for (const crop of cropUsages) {
    const usesText = crop.feedsCreatures.length
      ? crop.feedsCreatures.map((u) => `${u.creatureLabel} (×${u.qtyPerBatch})`).join(' · ')
      : 'Dùng cho công thức nâng cao';
    const cCard = el('article', {class: `card${crop.unlocked ? '' : ' locked'}`}, [
      el('div', {class: 'card-head'}, [
        visualItemIcon(items, crop.id, {size: 46}),
        el('div', {class: 'card-head-copy'}, [
          el('strong', {text: `${crop.label} (Cấp ${crop.level})`}),
          el('small', {text: `${hours(crop.hours)} · +${crop.totalXP} XP/ô · Kho: ${num(crop.inStock)}`}),
        ]),
      ]),
      el('p', {text: `Dùng cho: ${usesText}`}),
      ...(crop.unlocked && onSelectCrop
        ? [button(`Chọn gieo ${crop.label}`, () => onSelectCrop(crop.id), {class: 'primary'})]
        : []),
    ]);
    cropGrid.append(cCard);
  }
  wrap.append(cropGrid);

  return wrap;
}
