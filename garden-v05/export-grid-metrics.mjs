// Rebuild/check the actual bootstrap's size sheet; no image conversion or services.
import fs from 'node:fs';
import vm from 'node:vm';
import {gardenObjectMetrics} from './garden-object-metrics.mjs';
import {ISO_TILE, GRID_STEP} from './garden-grid.mjs';

const read = file => fs.readFileSync(new URL(file, import.meta.url), 'utf8');
const box = {window: {}};
vm.createContext(box);
for (const [, file] of read('./index.html').matchAll(/<script src="([^"?]+\.js)(?:\?[^" ]*)?"/g)) {
  vm.runInContext(read('./' + file), box, {filename: file});
}
const scene = box.window.FARM_SCENE, motion = box.window.FARM_MOTION;
globalThis.FARM_SCENE = scene;
globalThis.FARM_MOTION = motion;
const {DECORATION_LAYOUT} = await import('./scene-renderer.mjs');
const entries = gardenObjectMetrics(scene, motion, JSON.parse(read('./decor-assets-manifest.json')).items, DECORATION_LAYOUT);
const output = new URL('../docs/garden-grid-metrics.json', import.meta.url);
const header = {tile: ISO_TILE, placementStep: GRID_STEP, columns: scene.columns, rows: scene.rows, nativePixelScale: 1};
const text = '{\n  "grid": ' + JSON.stringify(header) + ',\n  "entries": [\n' + entries.map(entry => '    ' + JSON.stringify(entry)).join(',\n') + '\n  ]\n}\n';
if (process.argv.includes('--check')) {
  if (fs.readFileSync(output, 'utf8') !== text) throw new Error('Stale grid sheet: node garden-v05/export-grid-metrics.mjs');
} else fs.writeFileSync(output, text);
console.log(`${entries.length} grid specifications (${entries.filter(e => e.kind === 'crop').length} crops); ${process.argv.includes('--check') ? 'verified' : 'exported'}`);
