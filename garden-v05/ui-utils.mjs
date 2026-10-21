export const $=id=>document.getElementById(id);
export function el(tag,attrs={},children=[]){const e=document.createElement(tag);for(const[k,v]of Object.entries(attrs)){if(k==="text")e.textContent=v;else if(k==="class")e.className=v;else if(k==="html")e.innerHTML=v;else if(k.startsWith("on"))e.addEventListener(k.slice(2),v);else if(k==="disabled"||k==="hidden")e[k]=!!v;else e.setAttribute(k,String(v));}for(const c of Array.isArray(children)?children:[children])if(c!==null&&c!==undefined)e.append(typeof c==="string"?document.createTextNode(c):c);return e;}
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
export function packTotal(item,count){const base=Math.max(0,Math.min(count,item.dailyRemaining??item.dailyLimit??Infinity));return base*item.price+(count-base)*item.price*(item.overflowMultiplier||1);}
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

const SVG_ART = Object.freeze({
 water: `<svg viewBox="0 0 48 48" width="100%" height="100%" aria-hidden="true">
  <defs>
   <linearGradient id="wg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#b7dee0"/><stop offset="100%" stop-color="#687486"/></linearGradient>
   <linearGradient id="br" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#f5d69a"/><stop offset="100%" stop-color="#a57554"/></linearGradient>
  </defs>
  <circle cx="24" cy="24" r="20" fill="#142620" stroke="#70a8b6" stroke-width="1.5"/>
  <path d="M15 22h14l2 13H13z" fill="url(#br)" stroke="#e8f0ed" stroke-width="1.2"/>
  <path d="M17 22v-5c0-3 10-3 10 0v5" fill="none" stroke="#f5d69a" stroke-width="2.2"/>
  <path d="M29 25l8-6 2 2-9 8" fill="url(#br)" stroke="#e8f0ed" stroke-width="1"/>
  <path d="M39 16c2 3 3 5 0 7-3-2-2-4 0-7z" fill="url(#wg)"/>
  <circle cx="21" cy="29" r="3.2" fill="url(#wg)"/>
 </svg>`,
 boost: `<svg viewBox="0 0 48 48" width="100%" height="100%" aria-hidden="true">
  <defs>
   <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#b7dee0"/><stop offset="100%" stop-color="#6961a6"/></linearGradient>
  </defs>
  <circle cx="24" cy="24" r="20" fill="#142620" stroke="#b378ff" stroke-width="1.5"/>
  <rect x="20" y="9" width="8" height="4" rx="1" fill="#e7ae73" stroke="#f5d69a" stroke-width="1"/>
  <path d="M19 13h10v4l6 9v9a4 4 0 0 1-4 4H17a4 4 0 0 1-4-4v-9l6-9z" fill="#24483f" stroke="#f5d69a" stroke-width="1.5"/>
  <path d="M15 26h18v8a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 15 34z" fill="url(#bg)"/>
  <path d="M24 19l2 4 4 .6-3 3 .7 4.2-3.7-2-3.7 2 .7-4.2-3-3 4-.6z" fill="#f5d69a"/>
 </svg>`,
 insects: `<svg viewBox="0 0 48 48" width="100%" height="100%" aria-hidden="true">
  <circle cx="24" cy="24" r="20" fill="#142620" stroke="#b0bd67" stroke-width="1.5"/>
  <rect x="17" y="10" width="14" height="4" rx="1.5" fill="#b49a66" stroke="#f5d69a" stroke-width="1"/>
  <rect x="14" y="14" width="20" height="23" rx="4" fill="#24483f" stroke="#b7dee0" stroke-width="1.4"/>
  <circle cx="21" cy="23" r="3" fill="#ffc36b"/>
  <ellipse cx="19" cy="21" rx="2.5" ry="1.2" fill="#e8f0ed"/>
  <circle cx="28" cy="29" r="2.5" fill="#ffc36b"/>
  <path d="M16 34c4-4 12-4 16 0" stroke="#b0bd67" stroke-width="2" fill="none"/>
 </svg>`,
 fish: `<svg viewBox="0 0 48 48" width="100%" height="100%" aria-hidden="true">
  <circle cx="24" cy="24" r="20" fill="#231f2e" stroke="#70a8b6" stroke-width="1.5"/>
  <path d="M13 20h22l-2.5 16h-17z" fill="#41465c" stroke="#b7dee0" stroke-width="1.4"/>
  <ellipse cx="24" cy="20" rx="11" ry="3.5" fill="#70a8b6" stroke="#b7dee0" stroke-width="1.2"/>
  <path d="M18 28c4-4 9-4 13 0-4 4-9 4-13 0z" fill="#e8f0ed"/>
  <polygon points="31,28 35,25 35,31" fill="#70a8b6"/>
  <circle cx="21" cy="27.5" r="1" fill="#231f2e"/>
 </svg>`,
 medal: `<svg viewBox="0 0 48 48" width="100%" height="100%" aria-hidden="true">
  <circle cx="24" cy="24" r="20" fill="#142620" stroke="#ffc36b" stroke-width="1.6"/>
  <polygon points="24,10 28,19 38,20 30.5,26.8 32.5,36.5 24,31.5 15.5,36.5 17.5,26.8 10,20 20,19" fill="#f5d69a" stroke="#a57554" stroke-width="1.2"/>
 </svg>`,
});

export const EARNED_DECOR_SHAPES = Object.freeze({
 "decoration-3": { glyph: "🪨", bg: "#142620", accent: "#a6b1ae", sub: "#687486", motif: "stones" },
 "decoration-7": { glyph: "🎃", bg: "#142620", accent: "#ed8a45", sub: "#ffc36b", motif: "lantern" },
 "decoration-11": { glyph: "🪹", bg: "#142620", accent: "#f5d69a", sub: "#a57554", motif: "nest" },
 "decoration-15": { glyph: "🪵", bg: "#142620", accent: "#c97952", sub: "#735044", motif: "fence" },
 "decoration-19": { glyph: "🌿", bg: "#142620", accent: "#b0bd67", sub: "#71934b", motif: "arch" },
 "decoration-23": { glyph: "🌉", bg: "#142620", accent: "#e7ae73", sub: "#a57554", motif: "bridge" },
 "decoration-27": { glyph: "🪙", bg: "#231f2e", accent: "#ffc36b", sub: "#735044", motif: "pedestal" },
 "decoration-30": { glyph: "🌼", bg: "#142620", accent: "#f5d69a", sub: "#71934b", motif: "stones" },
 "decoration-31": { glyph: "🌙", bg: "#231f2e", accent: "#f5d69a", sub: "#687486", motif: "moon" },
 "decoration-35": { glyph: "🏮", bg: "#231f2e", accent: "#f5d69a", sub: "#a57554", motif: "lantern" },
 "decoration-39": { glyph: "🛖", bg: "#142620", accent: "#e7ae73", sub: "#a57554", motif: "gazebo" },
 "decoration-43": { glyph: "🐾", bg: "#142620", accent: "#ed8a45", sub: "#c97952", motif: "perch" },
 "decoration-46": { glyph: "🛋", bg: "#142620", accent: "#b7dee0", sub: "#70a8b6", motif: "nest" },
 "decoration-47": { glyph: "🪷", bg: "#142620", accent: "#70a8b6", sub: "#71934b", motif: "pond" },
 "decoration-51": { glyph: "⛲", bg: "#142620", accent: "#b7dee0", sub: "#a6b1ae", motif: "pond" },
 "decoration-55": { glyph: "🎏", bg: "#231f2e", accent: "#c75b4b", sub: "#ffc36b", motif: "fence" },
 "decoration-59": { glyph: "🪶", bg: "#231f2e", accent: "#ffc36b", sub: "#c75b4b", motif: "perch" },
 "decoration-63": { glyph: "🦅", bg: "#231f2e", accent: "#b7dee0", sub: "#687486", motif: "bridge" },
 "decoration-67": { glyph: "🪾", bg: "#142620", accent: "#ed8a45", sub: "#c97952", motif: "perch" },
 "decoration-71": { glyph: "🕯", bg: "#142620", accent: "#b7dee0", sub: "#687486", motif: "lantern" },
 "decoration-75": { glyph: "🌈", bg: "#231f2e", accent: "#f5d69a", sub: "#687486", motif: "arch" },
 "decoration-80": { glyph: "✨", bg: "#231f2e", accent: "#d6d8bf", sub: "#687486", motif: "stones" },
 "decoration-81": { glyph: "🦄", bg: "#142620", accent: "#f5d69a", sub: "#71934b", motif: "arch" },
 "decoration-83": { glyph: "🏛", bg: "#231f2e", accent: "#d6d8bf", sub: "#a6b1ae", motif: "gazebo" },
 "decoration-87": { glyph: "🚧", bg: "#142620", accent: "#a57554", sub: "#735044", motif: "fence" },
 "decoration-91": { glyph: "⛩", bg: "#231f2e", accent: "#c97952", sub: "#735044", motif: "arch" },
 "decoration-95": { glyph: "🐉", bg: "#142620", accent: "#b0bd67", sub: "#f5d69a", motif: "pedestal" },
 "decoration-98": { glyph: "🔭", bg: "#231f2e", accent: "#ffc36b", sub: "#c75b4b", motif: "gazebo" },
 "decoration-99": { glyph: "🗺", bg: "#142620", accent: "#b0bd67", sub: "#d6d8bf", motif: "pedestal" },
});

export function earnedDecorMotifSvg(spec, isRight = false) {
 const { bg, accent, sub, motif } = spec;
 const flipAttr = isRight ? `transform="translate(48,0) scale(-1,1)"` : "";
 let inner = "";
 if (motif === "lantern" || motif === "moon") {
  inner = `<rect x="22" y="12" width="4" height="24" fill="${sub}"/><circle cx="24" cy="18" r="7" fill="${accent}" stroke="#231f2e" stroke-width="1.5"/><circle cx="26" cy="16" r="2.5" fill="#e8f0ed"/>`;
 } else if (motif === "arch") {
  inner = `<path d="M13 35V20a11 11 0 0 1 22 0v15" fill="none" stroke="${sub}" stroke-width="4"/><circle cx="24" cy="12" r="3.5" fill="${accent}"/><circle cx="15" cy="22" r="2.5" fill="${accent}"/>`;
 } else if (motif === "bridge") {
  inner = `<path d="M10 30 Q24 18 38 30" fill="none" stroke="${accent}" stroke-width="4"/><rect x="12" y="28" width="24" height="4" fill="${sub}"/>`;
 } else if (motif === "fence") {
  inner = `<rect x="11" y="21" width="26" height="3" fill="${sub}"/><rect x="13" y="15" width="4" height="19" fill="${accent}"/><rect x="22" y="15" width="4" height="19" fill="${accent}"/><rect x="31" y="15" width="4" height="19" fill="${accent}"/>`;
 } else if (motif === "gazebo") {
  inner = `<polygon points="10,22 24,11 38,22" fill="${accent}" stroke="${sub}" stroke-width="1.5"/><rect x="15" y="22" width="18" height="13" fill="${sub}"/><rect x="21" y="25" width="6" height="10" fill="#231f2e"/>`;
 } else if (motif === "pond") {
  inner = `<ellipse cx="24" cy="28" rx="13" ry="6" fill="${accent}" stroke="${sub}" stroke-width="1.5"/><circle cx="20" cy="26" r="2.5" fill="#f5d69a"/>`;
 } else if (motif === "perch") {
  inner = `<rect x="12" y="17" width="24" height="4" fill="${sub}"/><rect x="16" y="17" width="3" height="17" fill="${sub}"/><rect x="29" y="17" width="3" height="17" fill="${sub}"/><circle cx="24" cy="14" r="4" fill="${accent}"/>`;
 } else if (motif === "nest") {
  inner = `<ellipse cx="24" cy="29" rx="13" ry="6" fill="${sub}"/><circle cx="20" cy="25" r="4.5" fill="${accent}"/><circle cx="28" cy="26" r="4" fill="#d6d8bf"/>`;
 } else if (motif === "pedestal") {
  inner = `<rect x="16" y="24" width="16" height="11" fill="${sub}"/><polygon points="24,11 31,19 24,25 17,19" fill="${accent}"/>`;
 } else {
  inner = `<ellipse cx="16" cy="28" rx="5" ry="4" fill="${sub}"/><ellipse cx="24" cy="26" rx="6" ry="5" fill="${accent}"/><ellipse cx="32" cy="29" rx="5" ry="4" fill="${sub}"/>`;
 }
 return `<svg viewBox="0 0 48 48" width="100%" height="100%" aria-hidden="true"><circle cx="24" cy="24" r="20" fill="${bg}" stroke="${accent}" stroke-width="1.5"/><g ${flipAttr}>${inner}</g></svg>`;
}

export function earnedDecorIcon(decorId, { size = 48, facing = "default" } = {}) {
 const spec = EARNED_DECOR_SHAPES[decorId] || { glyph: "✦", bg: "#142620", accent: "#f5d69a", sub: "#a57554", motif: "pedestal" };
 const isRight = facing === "right";
 return el("span", {
  class: `visual-svg-art is-earned-decor${isRight ? " is-facing-right" : ""}`,
  "data-decor-id": decorId,
  "data-facing": isRight ? "right" : "default",
  style: `width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center`,
  html: earnedDecorMotifSvg(spec, isRight),
 });
}

export function svgArt(kind, size = 48) {
 const wrap = el("span", {
  class: `visual-svg-art is-${kind}`,
  style: `width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center`,
  html: SVG_ART[kind] || SVG_ART.medal,
 });
 return wrap;
}

export function visualItemIcon(items, id, { size = 52, kind = "", decorAssets = null, badge = "", facing = "default" } = {}) {
 const rawId = String(id || "");
 const isSeed = kind === "seed" || rawId.startsWith("seed_");
 const cropId = rawId.replace(/^seed_/, "");
 const feedCreature = FEED_CREATURE_MAP[rawId];
 const isProduce = rawId.startsWith("produce_") || kind === "produce" || kind === "keepsake";
 const produceCreature = rawId.replace(/^(produce_|keepsake_)/, "");
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
 } else if (rawId === "water" || kind === "water") {
  slot.classList.add("is-supply");
  slot.append(svgArt("water", Math.round(size * 0.92)));
 } else if (rawId === "spring_water" || kind === "spring") {
  slot.classList.add("is-supply", "is-spring");
  slot.append(svgArt("boost", Math.round(size * 0.92)));
 } else if (rawId === "boost" || rawId === "gentle_growth" || kind === "boost") {
  slot.classList.add("is-supply");
  slot.append(svgArt("boost", Math.round(size * 0.92)));
 } else if (rawId === "insects" || rawId.startsWith("insects_")) {
  slot.classList.add("is-crafted");
  slot.append(svgArt("insects", Math.round(size * 0.92)));
 } else if (rawId === "fish" || rawId.startsWith("fish_")) {
  slot.classList.add("is-crafted");
  slot.append(svgArt("fish", Math.round(size * 0.92)));
 } else if (rawId.startsWith("decoration-")) {
  slot.classList.add("is-decor", "is-earned-decor-slot");
  slot.append(earnedDecorIcon(rawId, { size: Math.round(size * 0.92), facing }));
 } else if (rawId.startsWith("decor_") || kind === "decoration") {
  slot.classList.add("is-decor");
  const asset = decorAssets?.get?.(rawId);
  const src = isRight
   ? (asset?.rightFile || asset?.file || `decor-assets/native/${rawId}_right.png`)
   : (asset?.file || `decor-assets/native/${rawId}.png`);
  slot.append(el("img", { src, alt: "", class: `visual-decor-img${isRight && !asset?.rightFile ? " is-flipped" : ""}` }));
 } else if (feedCreature && items?.has?.(feedCreature)) {
  slot.classList.add("is-feed");
  slot.append(
   icon(items, feedCreature, 3, Math.round(size * 0.78)),
   el("span", { class: "visual-corner-tag is-ration", text: "♨", title: "Khẩu phần sinh vật" })
  );
 } else if (isProduce && items?.has?.(produceCreature)) {
  slot.classList.add("is-produce");
  slot.append(
   icon(items, produceCreature, 3, Math.round(size * 0.78)),
   el("span", { class: "visual-corner-tag is-keepsake", text: "✦", title: "Sản vật / Kỷ vật" })
  );
 } else if (rawId.startsWith("plot_")) {
  slot.classList.add("is-expansion");
  slot.append(
   el("img", { src: "environment/layers/tile-soil.png", alt: "", class: "visual-prop-img" }),
   el("span", { class: "visual-corner-tag is-build", text: "▦" })
  );
 } else if (rawId.startsWith("pen_")) {
  slot.classList.add("is-expansion");
  slot.append(
   el("img", { src: "environment/layers/fenceNE.png", alt: "", class: "visual-prop-img" }),
   el("span", { class: "visual-corner-tag is-build", text: "⌂" })
  );
 } else if (items?.has?.(rawId)) {
  slot.classList.add("is-sprite");
  const sp = icon(items, rawId, 3, Math.round(size * 0.84));
  if (isRight) sp.style.transform = "scaleX(-1)";
  slot.append(sp);
 } else {
  slot.classList.add("is-medal");
  slot.append(svgArt("medal", Math.round(size * 0.9)));
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
  const outId = recipe.output;
  return {
   visual: visualItemIcon(items, outId, { size, kind: outId.endsWith("_feed") ? "food" : "" }),
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
