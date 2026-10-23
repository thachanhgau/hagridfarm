import { ITEM_ART } from "./item-art.mjs?v=24.9.71";
import {saleTotal} from "./premium-products.mjs?v=24.9.71";
import {runtimeImageUrl} from './runtime-image-url.mjs?v=24.9.71';
const PREMIUM_ART = new Set(["spring_rain", "felix_felicis", "prime_meal", "pen_feast", "skele_gro", "warm_nest"]);

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
 spring_water: `<svg viewBox="0 0 48 48" width="100%" height="100%" aria-hidden="true">
  <circle cx="24" cy="24" r="20" fill="#142620" stroke="#70a8b6" stroke-width="1.5"/>
  <path d="M11 29h26v7H11z" fill="#735044" stroke="#4a3042" stroke-width="1.5"/>
  <path d="M14 29c2-7 6-11 10-11s8 4 10 11" fill="#70a8b6" stroke="#b7dee0" stroke-width="1.5"/>
  <path d="M24 8c-3 4-3 6 0 8 3-2 3-4 0-8zM13 15c-2 3-2 5 0 6 2-1 2-3 0-6zM35 13c-2 3-2 5 0 6 2-1 2-3 0-6z" fill="#b7dee0" stroke="#70a8b6" stroke-width="1"/>
  <path d="M17 33h14" stroke="#f5d69a" stroke-width="2"/>
 </svg>`,
 // Level-500 P4 premium items (roadmap §10.2), same 48-unit badge and palette as Nước phép / Nước suối thần.
 spring_rain: `<svg viewBox="0 0 48 48" width="100%" height="100%" aria-hidden="true">
  <circle cx="24" cy="24" r="20" fill="#142620" stroke="#70a8b6" stroke-width="1.5"/>
  <path d="M10 37h28v3H10z" fill="#735044"/>
  <path d="M12 37c1-3 3-4 4-4M20 37c1-3 3-4 4-4M28 37c1-3 3-4 4-4" stroke="#b0bd67" stroke-width="2" fill="none"/>
  <path d="M14 22a6 6 0 0 1 6-7 8 8 0 0 1 14 2 5 5 0 0 1 1 10H16a5 5 0 0 1-2-5z" fill="#b7dee0" stroke="#e8f0ed" stroke-width="1.2"/>
  <path d="M17 29l-2 4M24 29l-2 4M31 29l-2 4" stroke="#70a8b6" stroke-width="2.2" stroke-linecap="round"/>
  <path d="M33 12l1 2 2 .4-1.5 1.5.4 2-1.9-1-1.9 1 .4-2-1.5-1.5 2-.4z" fill="#f5d69a"/>
 </svg>`,
 felix_felicis: `<svg viewBox="0 0 48 48" width="100%" height="100%" aria-hidden="true">
  <circle cx="24" cy="24" r="20" fill="#142620" stroke="#ffc36b" stroke-width="1.6"/>
  <rect x="21" y="8" width="6" height="5" rx="1" fill="#a57554" stroke="#4a3042" stroke-width="1"/>
  <path d="M21 13h6v6c5 2 8 6 8 10a11 11 0 0 1-22 0c0-4 3-8 8-10z" fill="#24483f" stroke="#f5d69a" stroke-width="1.5"/>
  <path d="M15.5 28h17a8.5 8.5 0 0 1-17 0z" fill="#ffc36b"/>
  <path d="M19 31c2 1 6 1 8-1" stroke="#f5d69a" stroke-width="1.4" fill="none"/>
  <path d="M36 12l1.2 2.6 2.8.4-2 2 .5 2.8-2.5-1.3-2.5 1.3.5-2.8-2-2 2.8-.4zM11 15l.8 1.6 1.7.3-1.2 1.2.3 1.7-1.6-.8-1.6.8.3-1.7-1.2-1.2 1.7-.3z" fill="#f5d69a"/>
 </svg>`,
 prime_meal: `<svg viewBox="0 0 48 48" width="100%" height="100%" aria-hidden="true">
  <circle cx="24" cy="24" r="20" fill="#142620" stroke="#b0bd67" stroke-width="1.5"/>
  <path d="M10 26h28c0 7-6 12-14 12S10 33 10 26z" fill="#a57554" stroke="#4a3042" stroke-width="1.5"/>
  <path d="M12 26c1-5 6-8 12-8s11 3 12 8z" fill="#b0bd67" stroke="#e8f0ed" stroke-width="1"/>
  <circle cx="19" cy="22" r="2" fill="#e7ae73"/><circle cx="27" cy="21" r="2.2" fill="#ffc36b"/><circle cx="31" cy="24" r="1.6" fill="#e7ae73"/>
  <path d="M24 6l2 4.2 4.6.6-3.3 3.2.8 4.6-4.1-2.2-4.1 2.2.8-4.6-3.3-3.2 4.6-.6z" fill="#f5d69a" stroke="#a57554" stroke-width=".8"/>
 </svg>`,
 pen_feast: `<svg viewBox="0 0 48 48" width="100%" height="100%" aria-hidden="true">
  <circle cx="24" cy="24" r="20" fill="#142620" stroke="#ffc36b" stroke-width="1.6"/>
  <path d="M8 27h32v4H8z" fill="#735044" stroke="#4a3042" stroke-width="1.2"/>
  <path d="M11 31v6M37 31v6" stroke="#4a3042" stroke-width="2.5"/>
  <path d="M10 27c0-4 3-6 6-6s6 2 6 6zM18 27c0-5 3-7 6-7s6 2 6 7zM26 27c0-4 3-6 6-6s6 2 6 6z" fill="#b0bd67" stroke="#e8f0ed" stroke-width="1"/>
  <circle cx="16" cy="23" r="1.6" fill="#ffc36b"/><circle cx="24" cy="22" r="1.8" fill="#e7ae73"/><circle cx="32" cy="23" r="1.6" fill="#ffc36b"/>
  <path d="M16 9l1.5 3 3.3.5-2.4 2.3.6 3.3-3-1.6-3 1.6.6-3.3-2.4-2.3 3.3-.5zM32 9l1.5 3 3.3.5-2.4 2.3.6 3.3-3-1.6-3 1.6.6-3.3-2.4-2.3 3.3-.5z" fill="#f5d69a"/>
 </svg>`,
 skele_gro: `<svg viewBox="0 0 48 48" width="100%" height="100%" aria-hidden="true">
  <circle cx="24" cy="24" r="20" fill="#142620" stroke="#b7dee0" stroke-width="1.5"/>
  <rect x="20" y="8" width="8" height="4" rx="1" fill="#a57554" stroke="#4a3042" stroke-width="1"/>
  <path d="M19 12h10v5l4 4v14a4 4 0 0 1-4 4H19a4 4 0 0 1-4-4V21l4-4z" fill="#24483f" stroke="#e8f0ed" stroke-width="1.5"/>
  <path d="M17 26h14v9a2 2 0 0 1-2 2H19a2 2 0 0 1-2-2z" fill="#b0bd67"/>
  <path d="M19.5 29.5a1.8 1.8 0 1 1 2.5-2.5l4-0a1.8 1.8 0 1 1 2.5 2.5 1.8 1.8 0 1 1-2.5 2.5h-4a1.8 1.8 0 1 1-2.5-2.5z" fill="#e8f0ed" stroke="#4a3042" stroke-width=".8"/>
 </svg>`,
 warm_nest: `<svg viewBox="0 0 48 48" width="100%" height="100%" aria-hidden="true">
  <circle cx="24" cy="24" r="20" fill="#142620" stroke="#e7ae73" stroke-width="1.6"/>
  <ellipse cx="24" cy="26" rx="14" ry="6" fill="#ffc36b" opacity=".35"/>
  <path d="M9 27c2 8 9 11 15 11s13-3 15-11z" fill="#b49a66" stroke="#735044" stroke-width="1.5"/>
  <path d="M11 30c5 2 10 2 13 0M24 31c4 2 9 2 13-1M14 34c4 1 8 1 11-1" stroke="#735044" stroke-width="1.2" fill="none"/>
  <ellipse cx="20" cy="24" rx="4" ry="5" fill="#e8f0ed" stroke="#a6b1ae" stroke-width="1"/>
  <ellipse cx="28" cy="25" rx="3.5" ry="4.5" fill="#f5d69a" stroke="#a57554" stroke-width="1"/>
  <path d="M24 9c-2 3-2 5 0 6 2-1 2-3 0-6z" fill="#ffc36b"/>
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

const KEEPSAKE_BADGE_SVG = `<svg viewBox="0 0 32 32" width="100%" height="100%" aria-hidden="true">
 <path d="M9 5h14l-2 8c-.5 2-2 3-5 3s-4.5-1-5-3z" fill="#f5d69a" stroke="#4a3042" stroke-width="1.5"/>
 <path d="M16 16v6M11 22h10M8 26h16v3H8z" fill="#a57554" stroke="#4a3042" stroke-width="1.5"/>
 <path d="M9 7H5c0 5 2 7 6 7M23 7h4c0 5-2 7-6 7" fill="none" stroke="#f5d69a" stroke-width="1.5"/>
</svg>`;

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

/** Resolve the one canonical UI-art key for an item identity. */
export function itemArtKey(id, { kind = "" } = {}) {
 const rawId = String(id || "");
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
 const scale = Math.min(size / box.w, size / box.h);
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
 image.style.cssText = `position:absolute;width:${box.width * scale}px;height:${box.height * scale}px;left:${(size - box.w * scale) / 2 - box.x * scale}px;top:${(size - box.h * scale) / 2 - box.y * scale}px;max-width:none;image-rendering:pixelated;pointer-events:none;transform:${mirror ? "scaleX(-1)" : "none"};transform-origin:center`;
 visual.append(image);
 if (keepsake) {
  visual.setAttribute("data-presentation", "trophy-pedestal");
  visual.append(el("span", {
   class: "keepsake-pedestal-badge",
   "aria-label": "Kỷ vật",
   style: `position:absolute;right:0;bottom:0;width:${Math.max(14, Math.round(size * .32))}px;height:${Math.max(14, Math.round(size * .32))}px;display:block;pointer-events:none`,
   html: KEEPSAKE_BADGE_SVG,
  }));
 }
 return visual;
}

const BLUEPRINT_COLORS = Object.freeze(["#b0bd67", "#70a8b6", "#ed8a45", "#d6d8bf", "#ffc36b", "#b7dee0"]);

/** Highlight the numbered expansion in the plot/pen progression, independent of moved buildings. */
export function expansionBlueprintSvg(id) {
 const match = /^(plot|pen)_(\d+)$/.exec(String(id || ""));
 if (!match) return "";
 const [, kind, rawNumber] = match;
 const number = Number(rawNumber);
 const accent = BLUEPRINT_COLORS[(number - 1) % BLUEPRINT_COLORS.length];
 const dark = "#142620";
 const outline = "#4a3042";
 if (kind === "plot") {
  const focus = number - 1;
  const cells = Array.from({ length: 18 }, (_, index) => {
   const x = 7 + (index % 6) * 6;
   const y = 11 + Math.floor(index / 6) * 8;
   const fill = index === focus ? accent : (index % 2 ? "#3f6a45" : "#735044");
   return `<rect x="${x}" y="${y}" width="5" height="6" fill="${fill}" stroke="${outline}" stroke-width="1"/>`;
  }).join("");
  return `<svg viewBox="0 0 48 48" width="100%" height="100%" aria-hidden="true"><circle cx="24" cy="24" r="20" fill="${dark}" stroke="${accent}" stroke-width="1.5"/><path d="M7 37h34" stroke="#a57554" stroke-width="3"/>${cells}<text x="24" y="43" text-anchor="middle" font-size="6" font-family="monospace" font-weight="700" fill="#f5d69a">THỬA ${number}</text></svg>`;
 }
 const fence = Array.from({ length: 6 }, (_, index) => {
  const x = 11 + (index % 3) * 9, y = 15 + Math.floor(index / 3) * 11;
  return `<rect x="${x}" y="${y}" width="8" height="9" fill="${index === number - 1 ? accent : "#735044"}" stroke="${outline}" stroke-width="1"/>`;
 }).join("");
 return `<svg viewBox="0 0 48 48" width="100%" height="100%" aria-hidden="true"><circle cx="24" cy="24" r="20" fill="${dark}" stroke="${accent}" stroke-width="1.5"/><path d="M8 15h32M11 12l13-6 13 6" fill="none" stroke="#d6d8bf" stroke-width="2"/>${fence}<path d="M8 36h32" stroke="#70a8b6" stroke-width="2"/><text x="24" y="43" text-anchor="middle" font-size="6" font-family="monospace" font-weight="700" fill="#f5d69a">CHUỒNG ${number}</text></svg>`;
}

function expansionBlueprintIcon(id, size) {
 const svg = expansionBlueprintSvg(id);
 if (!svg) return null;
 return el("span", {
  class: "expansion-blueprint-art",
  "data-expansion-id": id,
  style: `width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;image-rendering:pixelated`,
  html: svg,
 });
}

export function earnedDecorIcon(decorId, { size = 48, facing = "default" } = {}) {
 const visual = itemArtVisual(decorId, size, { facing });
 if (!visual) throw new Error(`Missing earned decoration artwork: ${decorId}`);
 visual.classList.add("is-earned-decor-art");
 visual.setAttribute("data-decor-id", decorId);
 visual.setAttribute("data-facing", facing === "right" ? "right" : "default");
 return visual;
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
 const isKeepsake = rawId.startsWith("keepsake_") || kind === "keepsake";
 const isProduce = rawId.startsWith("produce_") || isKeepsake || kind === "produce";
 const hasFoodIdentity = Boolean(feedCreature) || kind === "food";
 const artKey = itemArtKey(rawId, { kind });
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
 } else if (artKey) {
  slot.classList.add("is-item-art");
  if (hasFoodIdentity) slot.classList.add("is-feed");
  if (isProduce) slot.classList.add("is-produce");
  slot.classList.add(isKeepsake ? "is-keepsake" : artKey.startsWith("decoration-") ? "is-earned-decor-slot" : "is-recipe-art");
  const art = artKey.startsWith("decoration-")
   ? earnedDecorIcon(artKey, { size: Math.round(size * 0.92), facing })
   : itemArtVisual(artKey, Math.round(size * 0.88), { facing, keepsake: isKeepsake });
  if (art) slot.append(art);
 } else if (rawId === "water" || kind === "water") {
  slot.classList.add("is-supply");
  slot.append(svgArt("water", Math.round(size * 0.92)));
 } else if (rawId === "spring_water" || kind === "spring") {
  slot.classList.add("is-supply", "is-spring");
  slot.append(svgArt("spring_water", Math.round(size * 0.92)));
 } else if (kind === "premium" || kind === "nest" || PREMIUM_ART.has(rawId)) {
  slot.classList.add("is-supply", "is-premium");
  slot.append(svgArt(rawId.startsWith("warm_nest") ? "warm_nest" : rawId, Math.round(size * 0.92)));
 } else if (rawId === "boost" || rawId === "gentle_growth" || kind === "boost") {
  slot.classList.add("is-supply");
  slot.append(svgArt("boost", Math.round(size * 0.92)));
 } else if (rawId === "insects" || rawId.startsWith("insects_")) {
  slot.classList.add("is-crafted");
  slot.append(svgArt("insects", Math.round(size * 0.92)));
 } else if (rawId === "fish" || rawId.startsWith("fish_")) {
  slot.classList.add("is-crafted");
  slot.append(svgArt("fish", Math.round(size * 0.92)));
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
  slot.append(svgArt("medal", Math.round(size * 0.9)));
 } else if (rawId.startsWith("pen_") && ITEM_ART[rawId]) {
  slot.classList.add("is-expansion", "is-pen-art");
  slot.setAttribute("data-expansion-id", rawId);
  slot.append(itemArtVisual(rawId, Math.round(size * 0.9)));
 } else if (rawId.startsWith("plot_")) {
  slot.classList.add("is-expansion");
  slot.append(expansionBlueprintIcon(rawId, Math.round(size * 0.9)));
 } else if (rawId.startsWith("pen_")) {
  slot.classList.add("is-expansion");
  slot.append(expansionBlueprintIcon(rawId, Math.round(size * 0.9)));
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
