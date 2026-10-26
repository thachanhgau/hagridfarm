import { ITEM_ART } from "./item-art.mjs?v=24.9.82";
import { FLOW_ITEM_ART } from "./flow-item-art.mjs?v=24.9.82";
import { KEEPSAKE_ART } from "./complete-object-art.mjs?v=24.9.82";

// A recipe can have a different illustration while still producing one of
// these canonical inventory items. ITEM_ART supplies the shared recipe icon;
// FLOW_ITEM_ART supplies harvested and corrected flow-specific art.
export const CANONICAL_OUTPUT_IDS = Object.freeze([
 "puff_feed", "insects", "bow_feed", "niffler_feed", "moon_feed", "kneazle_feed",
 "diri_feed", "fwoo_feed", "fish", "hippo_feed", "thestral_feed", "unicorn_feed",
 "dog_feed", "dragon_feed",
]);

export function flowArtSpec(key) {
 const spec = FLOW_ITEM_ART?.[key];
 return spec?.file ? spec : null;
}

export function keepsakeArtKey(rawId) {
 const species = String(rawId || "").replace(/^keepsake_/, "");
 return KEEPSAKE_ART?.[species]?.file ? `keepsake_${species}` : null;
}

export function outputArtKey(rawId) {
 const id = String(rawId || "");
 if (!CANONICAL_OUTPUT_IDS.includes(id)) return null;
 const recipeKey = `recipe_${id}`;
 return ITEM_ART[recipeKey]?.file ? recipeKey : flowArtSpec(id) ? id : null;
}

export function itemArtSpec(key) {
 const flow = flowArtSpec(key);
 if (flow) return flow;
 if (String(key || "").startsWith("keepsake_")) {
  const species = String(key).slice("keepsake_".length);
  const statue = KEEPSAKE_ART?.[species];
  if (statue?.file) return statue;
 }
 return ITEM_ART[key] || null;
}
