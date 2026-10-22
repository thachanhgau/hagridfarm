import {ITEM_ART} from './item-art.mjs?v=24.9.66';

const BASE_IDS = Object.freeze(Object.keys(ITEM_ART).filter((key) => /^decoration-\d+$/.test(key)));
const PRODUCE_KEYS = Object.freeze(Object.keys(ITEM_ART).filter((key) => /^produce_.+/.test(key)));

function rightRecord(id, base) {
  const canonical = ITEM_ART[`${id}_right`];
  if (canonical) return canonical;
  if (!base?.rightFile) return null;
  return {...base, file: base.rightFile, bounds: base.rightBounds ?? base.bounds};
}

/** Resolve the authored view without mirroring a right-facing sprite. */
export function earnedDecorArt(id, facing = 'default') {
  const base = ITEM_ART[id];
  if (!base) return null;
  if (facing !== 'right') return base;
  return rightRecord(id, base);
}

/** Both views are part of the initial scene load, so rotation has no flash. */
export function earnedDecorFiles() {
  const files = [];
  for (const id of BASE_IDS) {
    const base = ITEM_ART[id];
    const right = rightRecord(id, base);
    for (const file of [base?.file, right?.file]) {
      if (file && !files.includes(file)) files.push(file);
    }
  }
  return files;
}

export function produceArt(species) {
  return ITEM_ART[`produce_${String(species || '')}`] ?? null;
}

export function produceFiles() {
  return PRODUCE_KEYS.map((key) => ITEM_ART[key]?.file).filter(Boolean);
}

export function drawEarnedDecorSprite(context, image, asset, x, y) {
  if (!context || !image || !asset) return false;
  const width = Number(asset.width) || Number(image.naturalWidth || image.width) || 96;
  const height = Number(asset.height) || Number(image.naturalHeight || image.height) || 112;
  const pivotX = Number.isFinite(Number(asset.pivotX)) ? Number(asset.pivotX) : width / 2;
  const pivotY = Number.isFinite(Number(asset.pivotY)) ? Number(asset.pivotY) : height;
  context.drawImage(image, Math.round(x - pivotX), Math.round(y - pivotY), width, height);
  return true;
}
