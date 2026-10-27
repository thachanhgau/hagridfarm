import {FOREST_ASSETS} from './forest-surround.mjs?v=24.9.86';
import {FESTIVAL_HEROES} from './garden-seasonal-world.mjs?v=24.9.86';
import {spriteGridMetrics, footprintPixels} from './garden-grid.mjs?v=24.9.86';
import {STORE_CATALOG} from './garden-store-catalog.mjs?v=24.9.86';
import {COMPLETE_SCENERY, HABITAT_ART, KEEPSAKE_ART} from './complete-object-art.mjs?v=24.9.86';
import {ITEM_ART} from './item-art.mjs?v=24.9.86';

// Ground dimensions; the canopy, roof or head can overhang this base. Native
// raster bounds remain a separate screen-occlusion check during placement.
export const SCENERY_FOOTPRINTS = Object.freeze({
  hut: [3, 3], pond: [3, 2], oak: [2, 2], pine: [1, 1],
  gardener_friend: [1, 1], herbology_greenhouse: [3, 2], owl_post: [1, 1],
  fenceNE: [2, 1], fenceNW: [2, 1], gate: [2, 1],
});
export function sceneryGroundRect(id, col, row) {
  const [rows, cols] = SCENERY_FOOTPRINTS[id] ?? [1, 1];
  return {c0: col - cols / 2, c1: col + cols / 2, r0: row - rows / 2, r1: row + rows / 2};
}
const storeFootprints = new Map(STORE_CATALOG.filter(item => item.kind === 'decoration').map(item => [item.id, item.footprint ?? [1, 1]]));
export const decorFootprint = id => storeFootprints.get(id) ?? [1, 1];

function metric(id, kind, asset, footprint, facing = 'default') {
  return {id, kind, facing, ...spriteGridMetrics(asset, footprint, facing)};
}

/** Rebuildable size sheet: no copied dimensions that can drift from the art. */
export function gardenObjectMetrics(scene, motion, decorations = [], earned = {}) {
  const entries = [];
  for (const asset of FOREST_ASSETS) entries.push(metric(`forest:${asset.id}`, 'forest', asset, asset.id === 'pine' ? [1, 1] : [2, 2]));
  for (const asset of Object.values(FESTIVAL_HEROES)) entries.push(metric(asset.id, 'festival', asset, [2, 2]));
  for (const asset of scene.tiles ?? []) entries.push(metric(asset.id, 'tile', asset, [1, 1]));
  for (const item of motion.items ?? []) {
    for (const facing of ['default', ...(item.rightCreatureMotion ? ['right'] : [])]) {
      const frames = (facing === 'right' ? item.rightCreatureMotion : item).frames ?? [];
      const frame = frames.find(frame => typeof frame === 'object');
      if (!frame) continue;
      const width = Math.max(...frames.filter(f => typeof f === 'object').map(f => f.width));
      const side = item.kind === 'creature' ? Math.max(1, Math.ceil(width / 64)) : 1;
      const nativeFrames = frames.filter(f => typeof f === 'object');
      const largest = nativeFrames.reduce((a, b) => a.width * a.height >= b.width * b.height ? a : b);
      const spriteVariants = [...new Map(nativeFrames.map(f => {const sprite = spriteGridMetrics(f, [side, side], facing).sprite; return [JSON.stringify(sprite), sprite];})).values()];
      entries.push({...metric(item.id, item.kind, largest, [side, side], facing), spriteVariants});
    }
  }
  for (const asset of [...(scene.props ?? []), ...COMPLETE_SCENERY]) entries.push({...metric(asset.id, 'scenery', asset, SCENERY_FOOTPRINTS[asset.id] ?? [1, 1]), anchor: 'center'});
  for (const asset of decorations.filter(asset => storeFootprints.has(asset.id))) for (const facing of ['default', 'right']) entries.push(metric(asset.id, 'decoration', asset, decorFootprint(asset.id), facing));
  for (const [id, placement] of Object.entries(earned)) {
    for (const facing of ['default', 'right']) {
      const asset = ITEM_ART[facing === 'right' ? id + '_right' : id];
      if (asset) entries.push(metric(id, 'earned-decoration', asset, facing === 'right' ? [placement.width, placement.height] : [placement.height, placement.width], facing));
    }
  }
  for (const [kind, records] of [['habitat', HABITAT_ART], ['keepsake', KEEPSAKE_ART]]) {
    for (const [id, asset] of Object.entries(records)) entries.push(metric(`${kind}:${id}`, kind, asset, [1, 1]));
  }
  for (const [kind, slots] of [['plot', scene.plots], ['pen', scene.pens]]) {
    for (const slot of slots ?? []) {
      const footprint = [slot.width, slot.height], ground = footprintPixels(footprint, scene);
      entries.push({id: `${kind}:${slot.id}`, kind, footprint, ground, sprite: {...ground, pivotX: ground.width / 2, pivotY: ground.height}, pixelScale: 1});
    }
  }
  return entries;
}
