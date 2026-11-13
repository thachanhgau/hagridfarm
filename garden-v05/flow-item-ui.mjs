import {CATALOG_ART} from './catalog-art.mjs?v=25.1.7';
import { ITEM_ART } from "./item-art.mjs?v=25.1.7";
import { FLOW_ITEM_ART } from "./flow-item-art.mjs?v=25.1.7";
import { KEEPSAKE_ART } from "./complete-object-art.mjs?v=25.1.7";
import { UI_AUDIT_ART } from "./ui-audit-art.mjs?v=25.1.7";
import { POND_ART, POND_SCENERY } from "./pond-art.mjs?v=25.1.7";
import { EDGE_ART } from "./edge-art.mjs?v=25.1.7";

// A recipe can have a different illustration while still producing one of
// these canonical inventory items. ITEM_ART supplies the shared recipe icon;
// FLOW_ITEM_ART supplies harvested and corrected flow-specific art.
export const CANONICAL_OUTPUT_IDS = Object.freeze([
 "puff_feed", "insects", "bow_feed", "niffler_feed", "moon_feed", "kneazle_feed",
 "diri_feed", "fwoo_feed", "fish", "hippo_feed", "thestral_feed", "unicorn_feed",
 "dog_feed", "dragon_feed",
]);

export function flowArtSpec(key) {
 const baseRecipe=/^recipe_(crup_feed|knarl_feed|salamander_feed|kappa_feed|porlock_feed)$/.exec(key);
 const pond=/^pond_([123])$/.exec(key);
 const spec = CATALOG_ART[key] ?? (baseRecipe?(POND_ART[baseRecipe[1]]??EDGE_ART[baseRecipe[1]]):null) ?? (pond?POND_SCENERY['pond-'+pond[1]]:null) ?? FLOW_ITEM_ART?.[key] ?? POND_ART[key] ?? EDGE_ART[key]; // pond items (fry, goldfish, produce_grindylow) and phase-2 produce/feed (crup, knarl, salamander) resolve like flow art
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
 return ITEM_ART[key] || UI_AUDIT_ART[key] || null;
}
