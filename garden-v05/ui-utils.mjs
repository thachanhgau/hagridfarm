import { ITEM_ART } from "./item-art.mjs?v=24.9.77";
import {saleTotal} from "./premium-products.mjs?v=24.9.77";
import {runtimeImageUrl} from './runtime-image-url.mjs?v=24.9.77';
const SUPPLY_ART_KEYS = Object.freeze({
 water: "supply_water",
 boost: "supply_boost",
 spring_water: "supply_spring_water",
});
const PREMIUM_ART_KEYS = Object.freeze({
 spring_rain: "premium_spring_rain",
 felix_felicis: "premium_felix_felicis",
 prime_meal: "premium_prime_meal",
 pen_feast: "premium_pen_feast",
 skele_gro: "premium_skele_gro",
 warm_nest: "premium_warm_nest",
});
const CANONICAL_ART_KEYS = Object.freeze({
 ...Object.fromEntries(Object.values(SUPPLY_ART_KEYS).map(key => [key, key])),
 ...Object.fromEntries(Object.values(PREMIUM_ART_KEYS).map(key => [key, key])),
 expansion_plot: "expansion_plot",
 reward_medal: "reward_medal",
 reward_trophy: "reward_trophy",
});

export const $=id=>document.getElementById(id);
export function el(tag,attrs={},children=[]){const e=document.createElement(tag);for(const[k,v]of Object.entries(attrs)){if(k==="text")e.textContent=v;else if(k==="class")e.className=v;else if(k==="html")e.innerHTML=v;else if(k.startsWith("on"))e.addEventListener(k.slice(2),v);else if(k==="disabled"||k==="hidden")e[k]=!!v;else e.setAttribute(k,String(tag==='img'&&k==='src'?runtimeImageUrl(v):v));}for(const c of Array.isArray(children)?children:[children])if(c!==null&&c!==undefined)e.append(typeof c==="string"?document.createTextNode(c):c);return e;}
export const num=n=>{const v=Number(n);return Number.isFinite(v)?v.toLocaleString("vi-VN"):"0";};
export function duration(ms){const seconds=Math.max(0,Math.ceil(ms/1000));if(!seconds)return"Sẵn sàng";const h=Math.floor(seconds/3600),m=Math.floor(seconds%3600/60);return h>=24?`${Math.floor(h/24)}n ${h%24}g`:h?`${h}g ${String(m).padStart(2,"0")}p`:`${m}p ${String(seconds%60).padStart(2,"0")}s`;}
// Server rule (functions/games/garden-action-core growthScale): faster below level 15, then half time for good
// (owner 21/10/2026; it used to end at level 20).
export function growthScale(level){return level<5?.1:level<10?.2:level<15?.3:.5;}
// Real time of a crop, meal, recipe or build when the server owns the garden (scaled by the level at start;
// something not open yet starts at its own level at the earliest). The local prototype engine does not scale.
let serverGrowth=false;
export function setServerGrowth(on){serverGrowth=Boolean(on);}
export function realHours(entry,level){return (entry?.hours||0)*(serverGrowth?growthScale(Math.max(Number(level)||1,entry?.level||1)):1);}
// Galleons for `count` packs: packs left at the base price today (dailyRemaining) cost `price`,
// the rest price × overflowMultiplier (water and seeds past 1000 a day; server: garden-wallet-core purchaseTotal).
export function packTotal(item,count){if(item.bundles||item.sale)return saleTotal(item,count);const base=Math.max(0,Math.min(count,item.dailyRemaining??item.dailyLimit??Infinity));return base*item.price+(count-base)*item.price*(item.overflowMultiplier||1);}
export function hours(h){const m=Math.round(h*60),H=Math.floor(m/60),r=m%60;return !m?"Tức thì":m<60?`${m} phút`:!r&&H>=24&&H%24===0?`${H/24} ngày`:`${H} giờ${r?` ${r} phút`:""}`;}
export function icon(items,id,stage=3,size=52){
 const item=items?.get?.(id);
 const frames=item?.frames;
 const f=frames?.[Math.min(stage,Math.max(0,(frames?.length||1)-1))];
 const wrap=el("span",{class:"sprite-icon",style:`width:${size}px;height:${size}px`});
 if(!f){wrap.textContent="◇";return wrap;}
 const b=f.bounds,k=Math.min(size/b.w,size/b.h),img=el("img",{src:f.file,alt:""});
 img.style.cssText=`width:${f.width*k}px;height:${f.height*k}px;left:${(size-b.w*k)/2-b.x*k}px;top:${(size-b.h*k)/2-b.y*k}px`;
 wrap.append(img);
 return wrap;
}
export function button(text,fn,attrs={}){return el("button",{type:"button",text,onclick:fn,...attrs});}
export function timer(readyAt,label="Còn "){return el("span",{"data-until":readyAt,"data-prefix":label,class:"meta"});}

export const FEED_CREATURE_MAP = Object.freeze({
 puff_feed: "puffskein",
 bow_feed: "bowtruckle",
 niffler_feed: "niffler",
 moon_feed: "mooncalf",
 kneazle_feed: "kneazle",
 diri_feed: "diricawl",
 fwoo_feed: "fwooper",
 hippo_feed: "hippogriff",
 thestral_feed: "thestral",
 unicorn_feed: "unicorn",
 dog_feed: "three-headed-dog",
 dragon_feed: "dragon",
});

function artBounds(spec) {
 const bounds = spec?.bounds || {};
 const width = Math.max(1, Number(spec?.width) || 48);
 const height = Math.max(1, Number(spec?.height) || 48);
 return {
  width,
  height,
  x: Number.isFinite(Number(bounds.x)) ? Number(bounds.x) : 0,
  y: Number.isFinite(Number(bounds.y)) ? Number(bounds.y) : 0,
  w: Math.max(1, Number(bounds.w) || width),
  h: Math.max(1, Number(bounds.h) || height),
 };
}

function supplyArtKey(rawId, kind = "") {
 const id = String(rawId || "");
 if (id === "spring_water" || id === SUPPLY_ART_KEYS.spring_water) return SUPPLY_ART_KEYS.spring_water;
 if (id === "water" || id === SUPPLY_ART_KEYS.water) return SUPPLY_ART_KEYS.water;
 if (id === "boost" || id === "gentle_growth" || id === SUPPLY_ART_KEYS.boost) return SUPPLY_ART_KEYS.boost;
 if (kind === "spring") return SUPPLY_ART_KEYS.spring_water;
 if (kind === "water") return SUPPLY_ART_KEYS.water;
 if (kind === "boost") return SUPPLY_ART_KEYS.boost;
 return null;
}

function premiumArtKey(rawId) {
 const id = String(rawId || "");
 if (CANONICAL_ART_KEYS[id] && id.startsWith("premium_")) return id;
 if (PREMIUM_ART_KEYS[id]) return PREMIUM_ART_KEYS[id];
 if (id === "warm_nest" || /^warm_nest_\d+$/.test(id)) return PREMIUM_ART_KEYS.warm_nest;
 return null;
}

/** Resolve the one canonical UI-art key for an item identity. */
export function itemArtKey(id, { kind = "" } = {}) {
 const rawId = String(id || "");
 const directKey = CANONICAL_ART_KEYS[rawId];
 if (directKey) return directKey;
 const supplyKey = supplyArtKey(rawId, kind);
 if (supplyKey) return supplyKey;
 const premiumKey = premiumArtKey(rawId);
 if (premiumKey) return premiumKey;
 if (/^plot_\d+$/.test(rawId)) return CANONICAL_ART_KEYS.expansion_plot;
 if (rawId.startsWith("recipe_") && ITEM_ART[rawId]) return rawId;
 if (rawId.startsWith("produce_") && ITEM_ART[rawId]) return rawId;
 if (rawId.startsWith("keepsake_")) {
  const produceKey = `produce_${rawId.slice("keepsake_".length)}`;
  if (ITEM_ART[produceKey]) return produceKey;
 }
 if (rawId.startsWith("decoration-") && ITEM_ART[rawId]) return rawId;
 const recipeKey = `recipe_${rawId}`;
 if (ITEM_ART[recipeKey]) return recipeKey;
 if (kind === "produce" || kind === "keepsake") {
  const produceKey = `produce_${rawId.replace(/^(produce_|keepsake_)/, "")}`;
  if (ITEM_ART[produceKey]) return produceKey;
 }
 return null;
}

function itemArtVisual(key, size, { facing = "default", keepsake = false } = {}) {
 const base = ITEM_ART[key];
 const spec = facing === "right" && base?.rightFile ? {...base, file: base.rightFile, bounds: base.rightBounds} : base;
 if (!spec?.file) return null;
 const box = artBounds(spec);
 const fitScale = Math.min(size / box.w, size / box.h);
 const isPixelNativeSurface = /^(?:supply|premium)_/.test(key);
 const scale = isPixelNativeSurface && fitScale >= 1 ? Math.floor(fitScale) : fitScale;
 const centeredLeft = (size - box.w * scale) / 2 - box.x * scale;
 const centeredTop = (size - box.h * scale) / 2 - box.y * scale;
 const left = isPixelNativeSurface ? Math.round(centeredLeft) : centeredLeft;
 const top = isPixelNativeSurface ? Math.round(centeredTop) : centeredTop;
 const isRight = facing === "right";
 const mirror = isRight && !base.rightFile;
 const visual = el("span", {
  class: `item-art-visual${keepsake ? " is-keepsake-art" : ""}${isRight ? " is-facing-right" : ""}`,
  "data-art-key": key,
  "data-pivot-x": String(Number(spec.pivotX) || 0),
  "data-pivot-y": String(Number(spec.pivotY) || 0),
  style: `width:${size}px;height:${size}px;display:inline-flex;position:relative;align-items:center;justify-content:center;overflow:hidden;image-rendering:pixelated`,
 });
 const image = el("img", { src: spec.file, alt: "", class: `item-art-img${isRight ? " is-flipped" : ""}` });
 image.style.cssText = `position:absolute;width:${box.width * scale}px;height:${box.height * scale}px;left:${left}px;top:${top}px;max-width:none;image-rendering:pixelated;pointer-events:none;transform:${mirror ? "scaleX(-1)" : "none"};transform-origin:center`;
 visual.append(image);
 if (keepsake) {
  visual.setAttribute("data-presentation", "trophy-pedestal");
  const badge = el("span", {
   class: "keepsake-pedestal-badge",
   "data-art-key": CANONICAL_ART_KEYS.reward_trophy,
   "aria-label": "Kỷ vật",
   style: `position:absolute;right:0;bottom:0;width:${Math.max(14, Math.round(size * .32))}px;height:${Math.max(14, Math.round(size * .32))}px;display:block;pointer-events:none`,
  });
  const badgeArt = itemArtVisual(CANONICAL_ART_KEYS.reward_trophy, Math.max(14, Math.round(size * .32)));
  badge.append(badgeArt || artPlaceholder(Math.max(14, Math.round(size * .32)), "Ảnh cúp kỷ vật đang cập nhật"));
  visual.append(badge);
 }
 return visual;
}

function artPlaceholder(size, label = "Ảnh đang cập nhật", className = "") {
 const placeholder = el("span", {
  class: `item-art-placeholder${className ? ` ${className}` : ""}`,
  role: "img",
  "aria-label": label,
  style: `width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center`,
 });
 placeholder.append(el("span", { class: "sr-only", text: label }), document.createTextNode("◇"));
 return placeholder;
}

function appendNativeArt(slot, key, size, label = "Ảnh đang cập nhật") {
 if (key) slot.setAttribute("data-art-key", key);
 const visual = key ? itemArtVisual(key, size) : null;
 if (visual) slot.append(visual);
 else {
  slot.classList.add("is-art-missing");
  slot.append(artPlaceholder(size, label));
 }
 return visual;
}

export function earnedDecorIcon(decorId, { size = 48, facing = "default" } = {}) {
 const visual = itemArtVisual(decorId, size, { facing });
 if (!visual) throw new Error(`Missing earned decoration artwork: ${decorId}`);
 visual.classList.add("is-earned-decor-art");
 visual.setAttribute("data-decor-id", decorId);
 visual.setAttribute("data-facing", facing === "right" ? "right" : "default");
 return visual;
}

export function visualItemIcon(items, id, { size = 52, kind = "", decorAssets = null, badge = "", facing = "default" } = {}) {
 const rawId = String(id || "");
 const isSeed = kind === "seed" || rawId.startsWith("seed_");
 const cropId = rawId.replace(/^seed_/, "");
 const feedCreature = FEED_CREATURE_MAP[rawId];
 const isKeepsake = rawId.startsWith("keepsake_") || kind === "keepsake";
 const isProduce = rawId.startsWith("produce_") || isKeepsake || kind === "produce";
 const hasFoodIdentity = Boolean(feedCreature) || kind === "food";
 const artKey = itemArtKey(rawId, { kind });
 const supplyKey = supplyArtKey(rawId, kind);
 const premiumKey = premiumArtKey(rawId);
 const isPremiumSurface = kind === "premium" || kind === "nest" || Boolean(premiumKey) || rawId.startsWith("premium_") || rawId.startsWith("warm_nest_");
 const isCrafted = rawId === "insects" || rawId.startsWith("insects_") || rawId === "fish" || rawId.startsWith("fish_");
 const craftedKey = isCrafted ? (artKey || (rawId.startsWith("fish") ? "recipe_fish" : "recipe_insects")) : null;
 const isPlot = rawId === "expansion_plot" || /^plot_\d+$/.test(rawId);
 const isPen = /^pen_\d+$/.test(rawId);
 const isReward = rawId === "reward_medal" || rawId === "reward_trophy";
 const isRight = facing === "right";

 const slot = el("div", {
  class: `visual-slot${isRight ? " is-facing-right" : ""}`,
  "data-facing": isRight ? "right" : "default",
  style: `width:${size}px;height:${size}px`,
 });

 if (isSeed && items?.has?.(cropId)) {
  slot.classList.add("is-seed-packet");
  const packet = el("div", { class: "seed-packet-frame" }, [
   el("span", { class: "seed-packet-band", text: "HẠT" }),
   icon(items, cropId, 3, Math.round(size * 0.68)),
  ]);
  slot.append(packet);
 } else if (supplyKey) {
  slot.classList.add("is-supply");
  if (supplyKey === SUPPLY_ART_KEYS.spring_water) slot.classList.add("is-spring");
  appendNativeArt(slot, supplyKey, Math.round(size * 0.92), "Ảnh vật tư đang cập nhật");
 } else if (isPremiumSurface) {
  slot.classList.add("is-supply", "is-premium");
  appendNativeArt(slot, premiumKey, Math.round(size * 0.92), "Ảnh sản phẩm cao cấp đang cập nhật");
 } else if (isCrafted) {
  slot.classList.add("is-crafted", "is-item-art", "is-recipe-art");
  appendNativeArt(slot, craftedKey, Math.round(size * 0.92), "Ảnh công thức đang cập nhật");
 } else if (isPlot) {
  slot.classList.add("is-expansion", "is-plot-art");
  const match = /^plot_(\d+)$/.exec(rawId);
  if (match) {
   const label = `Thửa ${Number(match[1])}`;
   slot.setAttribute("data-expansion-id", rawId);
   slot.setAttribute("aria-label", label);
   slot.append(el("span", { class: "sr-only", text: label }));
  }
  appendNativeArt(slot, CANONICAL_ART_KEYS.expansion_plot, Math.round(size * 0.9), "Ảnh thửa đang cập nhật");
 } else if (isPen) {
  slot.classList.add("is-expansion", "is-pen-art");
  slot.setAttribute("data-expansion-id", rawId);
  const penLabel = `Chuồng ${rawId.slice("pen_".length)}`;
  slot.setAttribute("aria-label", penLabel);
  slot.append(el("span", { class: "sr-only", text: penLabel }));
  appendNativeArt(slot, ITEM_ART[rawId]?.file ? rawId : null, Math.round(size * 0.9), "Ảnh chuồng đang cập nhật");
 } else if (isReward) {
  slot.classList.add("is-reward-art", rawId === "reward_medal" ? "is-medal" : "is-trophy");
  appendNativeArt(slot, rawId, Math.round(size * 0.9), "Ảnh huy hiệu đang cập nhật");
 } else if (artKey) {
  slot.classList.add("is-item-art");
  if (hasFoodIdentity) slot.classList.add("is-feed");
  if (isProduce) slot.classList.add("is-produce");
  slot.classList.add(isKeepsake ? "is-keepsake" : artKey.startsWith("decoration-") ? "is-earned-decor-slot" : "is-recipe-art");
  const art = artKey.startsWith("decoration-")
   ? earnedDecorIcon(artKey, { size: Math.round(size * 0.92), facing })
   : itemArtVisual(artKey, Math.round(size * 0.88), { facing, keepsake: isKeepsake });
  if (art) slot.append(art);
 } else if (rawId.startsWith("decor_") || kind === "decoration") {
  slot.classList.add("is-decor");
  const asset = decorAssets?.get?.(rawId);
  const src = isRight
   ? (asset?.rightFile || asset?.file || `decor-assets/native/${rawId}_right.png`)
   : (asset?.file || `decor-assets/native/${rawId}.png`);
  slot.append(el("img", { src, alt: "", class: `visual-decor-img${isRight && !asset?.rightFile ? " is-flipped" : ""}` }));
 } else if (rawId.startsWith("decoration-")) {
  slot.classList.add("is-decor", "is-earned-decor-slot");
  slot.append(earnedDecorIcon(rawId, { size: Math.round(size * 0.92), facing }));
 } else if (hasFoodIdentity || isProduce) {
  // Food and produce must never silently fall back to the owning creature sprite.
  slot.classList.add(isProduce ? "is-produce" : "is-feed", "is-art-missing");
  appendNativeArt(slot, CANONICAL_ART_KEYS.reward_medal, Math.round(size * 0.9), "Ảnh huy hiệu đang cập nhật");
 } else if (items?.has?.(rawId)) {
  slot.classList.add("is-sprite");
  const sp = icon(items, rawId, 3, Math.round(size * 0.84));
  if (isRight) sp.style.transform = "scaleX(-1)";
  slot.append(sp);
 } else {
  slot.classList.add("is-medal");
  appendNativeArt(slot, CANONICAL_ART_KEYS.reward_medal, Math.round(size * 0.9), "Ảnh huy hiệu đang cập nhật");
 }

 if (badge) {
  slot.append(el("span", { class: "visual-pill-badge", text: badge }));
 }
 return slot;
}

const STAGE_ART_MAP = Object.freeze({
 1: { type: "img", src: "environment/layers/hut.png" },
 2: { type: "item", id: "puffskein" },
 3: { type: "img", src: "decor-assets/native/herbology_greenhouse.png" },
 4: { type: "img", src: "environment/layers/oak.png" },
 5: { type: "item", id: "hippogriff" },
 6: { type: "img", src: "environment/layers/pond.png" },
});

export function stageVisualIcon(stageId, items, size = 48) {
 const spec = STAGE_ART_MAP[stageId] || STAGE_ART_MAP[1];
 const slot = el("div", { class: "visual-slot is-stage", style: `width:${size}px;height:${size}px` });
 if (spec.type === "item" && items?.has?.(spec.id)) {
  slot.append(icon(items, spec.id, 3, Math.round(size * 0.84)));
 } else {
  slot.append(el("img", { src: spec.src, alt: "", class: "visual-prop-img" }));
 }
 return slot;
}

export function levelUnlockVisual(levelRow, DB, items, size = 48) {
 const lv = Number(levelRow?.level || 1);
 const crop = DB.crops.find(c => c.level === lv);
 const animal = DB.animals.find(a => a.level === lv);
 const expansion = DB.expansions.find(e => e.level === lv);
 const recipe = DB.recipes.find(r => r.level === lv);
 const earnedDecor = DB.decorations?.find(d => d.level === lv);
 if (/^Bậc Tận Sức/.test(levelRow?.unlock || "")) {
  return {
   visual: el("div", { class: "visual-slot is-tan-suc", style: `width:${size}px;height:${size}px` }, [el("b", { text: "★" })]),
   category: "Bậc Tận Sức",
   categoryClass: "cat-tan-suc",
   meta: levelRow.xpToNext ? `${num(levelRow.xpToNext)} XP tới bậc sau` : "Bậc cao nhất",
  };
 }

 if (animal) {
  const badge = expansion ? (expansion.kind === "pen" ? "+Chuồng" : "+Thửa") : "";
  return {
   visual: visualItemIcon(items, animal.id, { size, badge }),
   category: "Sinh vật kỳ thú",
   categoryClass: "cat-creature",
   meta: `${animal.rarity} · ${animal.mealPortions} phần/bữa · +${num(animal.cycleXP)} XP/chu kỳ`,
  };
 }
 if (crop) {
  const badge = expansion ? "+Thửa" : recipe ? "+Công thức" : "";
  return {
   visual: visualItemIcon(items, crop.id, { size, badge }),
   category: expansion ? "Mở thửa & Giống cây" : "Giống cây mới",
   categoryClass: "cat-crop",
   meta: `Lớn ${hours(realHours(crop, lv))} · Gieo +${crop.plantXP} / Gặt +${crop.harvestXP} XP`,
  };
 }
 if (expansion) {
  return {
   visual: visualItemIcon(items, expansion.id, { size }),
   category: expansion.kind === "plot" ? "Mở rộng thửa trồng" : "Mở rộng chuồng nuôi",
   categoryClass: "cat-build",
   meta: expansion.kind === "plot" ? "Thêm 9 ô đất trồng" : `Nâng sức chứa lên ${expansion.capacityAfter} chỗ`,
  };
 }
 if (recipe) {
  return {
   visual: visualItemIcon(items, `recipe_${recipe.id}`, { size }),
   category: "Chế biến & Trạm nghề",
   categoryClass: "cat-craft",
   meta: `${recipe.station} · Nhận ${recipe.count} thành phẩm (${hours(realHours(recipe, lv))})`,
  };
 }
 if (earnedDecor) {
  return {
   visual: visualItemIcon(items, earnedDecor.id, { size, kind: "decoration", badge: "2 góc" }),
   category: "Cảnh quan & Trang trí",
   categoryClass: "cat-decor",
   meta: `${earnedDecor.free ? "Nhận miễn phí" : "Đổi bằng nông sản"} · Hỗ trợ xoay 2 góc`,
  };
 }

 const text = String(levelRow?.unlock || "").toLowerCase();
 if (lv === 5 && text.includes("xem trước công trình")) {
  return {
   visual: visualItemIcon(items, "pen_1", { size }),
   category: "Mở rộng thửa & Chuồng",
   categoryClass: "cat-build",
   meta: "Xem trước Chuồng 1 và Thửa 4 bằng sơ đồ footprint",
  };
 }
 if (lv === 45 && text.includes("lanh")) {
  return {
   visual: visualItemIcon(items, "flax", { size }),
   category: "Giống cây mới",
   categoryClass: "cat-crop",
   meta: "Lanh dùng cho thửa và trang trí",
  };
 }
 let decorSrc = "decor-assets/native/decor_pumpkin_lantern.png";
 if (text.includes("cầu") || text.includes("ao") || text.includes("bồn")) decorSrc = "environment/layers/pond.png";
 else if (text.includes("cổng") || text.includes("vòm") || text.includes("dây leo") || text.includes("hoa")) decorSrc = "decor-assets/native/decor_vine_arch.png";
 else if (text.includes("rào") || text.includes("viền")) decorSrc = "environment/layers/fenceNE.png";
 else if (text.includes("đèn") || text.includes("trăng") || text.includes("nến") || text.includes("sương")) decorSrc = "decor-assets/native/decor_floating_candles.png";
 else if (text.includes("quầy") || text.includes("bàn") || text.includes("tủ") || text.includes("bệ")) decorSrc = "decor-assets/native/decor_cauldron.png";
 else if (text.includes("nhà") || text.includes("chòi") || text.includes("đài") || text.includes("lều")) decorSrc = "environment/layers/hut.png";
 else if (text.includes("ổ") || text.includes("gối") || text.includes("trụ") || text.includes("giàn")) decorSrc = "decor-assets/native/decor_mandrake_planter.png";

 const slot = el("div", { class: "visual-slot is-decor", style: `width:${size}px;height:${size}px` }, [
  el("img", { src: decorSrc, alt: "", class: "visual-decor-img" }),
 ]);
 return {
  visual: slot,
  category: "Cảnh quan & Trang trí",
  categoryClass: "cat-decor",
  meta: "Kỷ vật & kiến trúc trang viên Hagrid",
 };
}

// The primary action explains blockers or opens supplies; it never buys automatically.
export function plantingAction({loaded,connected,walletReady,unlocked,occupied,cooling,typeCap,seedsLeft,waterLeft}) {
 const reason=!loaded?"Đang nạp…":connected&&!walletReady?"Đang nối ví…":!unlocked?"Chưa mở hạt":occupied?"Hàng có cây":cooling?"Đất đang chờ":typeCap?"Đủ 3 loại":"";
 const restock=connected&&!reason?(seedsLeft<3?"seed":waterLeft<3?"water":""):"";
 return {disabled:Boolean(reason),restock,text:reason||(restock==="water"?"Mua nước":restock==="seed"?"Mua hạt":"Gieo ×3"),title:restock==="water"?"Cần 3 phần nước để gieo hàng này":restock==="seed"?"Cần 3 hạt để gieo hàng này":reason||"Gieo một hàng 3 ô"};
}

/**
 * A server refusal as one icon and a few words (connected play). `item` is a crop or ration id
 * shown with its sprite, `px` a pixel icon. missing-crops lists every short crop in
 * `details.missing[{resource,required,have}]`; insufficient-galleons carries `shortBy`.
 */
export function serverRefusal(error,{labels={},modelText=null}={}){
 const d=error?.details||{},reason=error?.reason||d.reason||'',label=id=>labels[id]||id;
 const missing=Array.isArray(d.missing)?d.missing.filter(m=>m?.resource):[];
 const short=Math.max(0,Number(d.shortBy)||0);
 const seed=/^seeds\.(.+)$/.exec(String(d.resource||''))?.[1];
 const view={
  'missing-crops':missing.length?{item:missing[0].resource,text:'Thiếu '+missing.map(m=>num(m.required-m.have)+' '+label(m.resource)).join(' · ')}:{px:'harvest',text:'Thiếu nông sản'},
  'insufficient-galleons':{px:'coin',text:short?'Thiếu '+num(short)+' G':'Thiếu Galleons'},
  'insufficient-balance':{px:'coin',text:short?'Thiếu '+num(short)+' G':'Thiếu Galleons'},
  'wallet-frozen':{px:'coin',text:'Ví Gringotts đang khóa'},
  'missing-supply':seed?{item:seed,text:'Thiếu hạt '+label(seed)}:d.resource==='boost'?{px:'boost',text:'Hết nước phép'}:{px:'water',text:'Thiếu nước'},
  'already-claimed':{px:'chest',text:'Đã nhận rồi'},
  'quest-incomplete':{px:'owl',text:'Nhiệm vụ chưa xong'},
  'quest-not-found':{px:'owl',text:'Nhiệm vụ đã đổi ngày'},
  'festival-incomplete':{px:'festival',text:'Chưa đủ điểm lễ hội'},
  'festival-not-found':{px:'festival',text:'Không có mốc này'},
  'revision-conflict':{px:'home',text:'Vườn vừa đổi · đã tải lại'},
  'decoration-not-owned':{px:'shop',text:'Chưa có món này'},
  'slot-occupied':{px:'plot',text:'Chỗ này đã có đồ'},
  'no-creature':{px:'heart',text:'Chưa có sinh vật'},
  'daily-cap':{px:'shop',text:'Hết lượt mua hôm nay'},
  'bond-incomplete':{px:'heart',text:'Chưa đủ điểm gắn kết'},
  'bond-not-found':{px:'heart',text:'Không có quà này'},
  'achievement-locked':{px:'profile',text:'Thành tựu chưa mở'},
  'achievement-not-found':{px:'profile',text:'Không có thành tựu này'},
  'model-rejected':{px:'build',text:modelText?.(d.modelCode)||error?.message||'Chưa làm được'},
 }[reason];
 return {reason,...(view||{px:'more',text:error?.message||'Máy chủ từ chối thao tác.'})};
}
