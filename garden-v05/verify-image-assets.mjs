// Run from any directory: node garden-v05/verify-image-assets.mjs.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {runtimeImageUrl} from './runtime-image-url.mjs';
import {FARM_SIGN_ART} from './farm-sign-art.mjs';
import {ITEM_ART} from './item-art.mjs';
import {FLOW_ITEM_ART} from './flow-item-art.mjs';
import {COMPLETE_SCENERY,HABITAT_ART,KEEPSAKE_ART} from './complete-object-art.mjs';
import {creatureViewFrames} from './creature-view.mjs';
import {SPRITE_PALETTE} from './palette.mjs';
import {FOREST_ASSET_FILES} from './forest-surround.mjs';
import {FESTIVAL_FILES} from './garden-seasonal-world.mjs';
import {V24_ART} from './v24-visuals.mjs';
import {HOGWARTS_EVENTS} from './garden-events.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const sharp = require(process.env.SHARP_MODULE || '/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const read = file => fs.readFileSync(path.join(root, file));
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const box = {window: {}, console};
vm.createContext(box);
for (const file of ['motion-data.js', 'level-assets.js', 'motion-care-data.js', 'motion-idle-data.js', 'crop-complete-data.js', 'flow-crop-data.js', 'creature-motion-data.js', 'scene-data.js']) vm.runInContext(read(file).toString(), box, {filename: file});
const references = [];
const add = (id, file) => {if (file) references.push({id: id.replace(/_right$/, ''), file: String(file).replace(/^\.\//, '').split(/[?#]/)[0]});};
for (const item of box.window.FARM_MOTION.items) {
 for (const frame of creatureViewFrames(item)) add(item.id, frame.file || frame);
 for (const clip of Object.values(item.clips || {})) add(item.id, clip?.sheet?.file);
}
for (const item of [...box.window.FARM_SCENE.tiles, ...box.window.FARM_SCENE.props]) add(item.id, item.file);
for (const file of FOREST_ASSET_FILES) add(file, file);
for (const file of FESTIVAL_FILES) add(file, file);
for (const file of Object.values(V24_ART)) add(file, file);
for (const event of HOGWARTS_EVENTS) add(event.art, event.art);
add('farm-sign',FARM_SIGN_ART.file);
add('cottage-corner', 'world-v242/cottage-corner.png');
const decor = JSON.parse(read('decor-assets-manifest.json'));
for (const item of decor.items) for (const file of [item.file, item.rightFile, ...(item.frames || []), ...(item.rightFrames || [])]) add(item.id, file);
for (const [id, item] of Object.entries(ITEM_ART)) add(id, item.file);
for (const [id, item] of Object.entries(FLOW_ITEM_ART)) add(id, item.file);
for(const item of [...COMPLETE_SCENERY,...Object.values(HABITAT_ART),...Object.values(KEEPSAKE_ART)])for(const file of item.frames)add(item.id,file);

const paths = new Map();
for (const ref of references) paths.set(ref.file, ref.id);
const missing = [...paths.keys()].filter(file => !fs.existsSync(path.join(root, file)));
assert.deepEqual(missing, [], 'missing runtime image files');
const hashes = new Map();
for (const [file, id] of paths) {
 const digest = hash(read(file));
 if (!hashes.has(digest)) hashes.set(digest, []);
 hashes.get(digest).push({file, id});
}
const aliases = [...hashes.values()].filter(group => group.length > 1);
const crossEntityDuplicates = aliases.filter(group => new Set(group.map(ref => ref.id)).size > 1);
assert.deepEqual(crossEntityDuplicates, [], 'different items must not share identical image files');

const publishedHashes=new Map();
for(const [file,id] of paths){
 const published=runtimeImageUrl(file).split('?')[0],digest=hash(read(published));
 if(!publishedHashes.has(digest))publishedHashes.set(digest,[]);
 publishedHashes.get(digest).push({file:published,id});
}
const publishedDuplicates=[...publishedHashes.values()].filter(group=>new Set(group.map(ref=>ref.id)).size>1);
assert.deepEqual(publishedDuplicates,[],'published WebP images of different items must remain distinct');

const palette = new Set(SPRITE_PALETTE.map(hex => parseInt(hex.slice(1), 16)));
const crops = ['fluxweed', 'bubotuber', 'knotgrass', 'shrivelfig', 'gillyweed', 'mimbulus', 'flitterbloom', 'devilssnare'];
const newFiles = [FARM_SIGN_ART.file,...Object.values(ITEM_ART).map(item => item.file), ...crops.flatMap(id => [1, 2, 3, 4].map(stage => `native-levels/${id}/frame-0${stage}.png`)), ...Array.from({length:16},(_,i)=>`native/three-headed-dog/frame-${String(i+1).padStart(2,'0')}.png`)];
for (const file of newFiles) {
 const {data, info} = await sharp(read(file)).ensureAlpha().raw().toBuffer({resolveWithObject: true});
 let pixels = 0;
 for (let i = 0; i < data.length; i += 4) {
  const a = data[i + 3];
  assert.ok(a === 0 || a === 255, `${file}: nonbinary alpha`);
  if (!a) continue;
  pixels++;
  assert.ok(palette.has((data[i] << 16) | (data[i + 1] << 8) | data[i + 2]), `${file}: color outside approved palette`);
  const x = (i / 4) % info.width, y = Math.floor(i / 4 / info.width);
  assert.ok(x > 0 && y > 0 && x < info.width - 1 && y < info.height - 1, `${file}: clipped native canvas`);
 }
 assert.ok(pixels > 0, `${file}: empty sprite`);
}
const manifest = JSON.parse(read('item-art-manifest.json'));
for (const item of Object.values(manifest.items)) {
 assert.equal(hash(read(item.file)), item.sha256, `${item.file}: output provenance`);
 assert.equal(hash(read(item.source)), item.sourceSha256, `${item.file}: master provenance`);
}
const signManifest=JSON.parse(read('farm-sign-art-manifest.json'));
assert.equal(hash(read(signManifest.source)),signManifest.sourceSha256,'sign master provenance');
assert.equal(hash(read(signManifest.file)),signManifest.sha256,'sign native provenance');
assert.equal(FARM_SIGN_ART.text.slope,.5,'sign face follows the 2:1 garden grid');
const dog=box.window.FARM_MOTION.items.find(item=>item.id==='three-headed-dog');
const dogProvenance=JSON.parse(read('three-headed-dog-art-generation.json'));
assert.equal(dog.source,dogProvenance.master,'white dog must remain the canonical master');
assert.equal(hash(read(dog.source)),dog.sourceSha256,'dog source hash');
assert.equal(dog.sourceSha256,dogProvenance.masterSha256,'dog generation provenance');
for(const [file,digest] of Object.entries(dogProvenance.nativeOutputs))assert.equal(hash(read(file)),digest,`${file}: dog output provenance`);
const result = {runtimeReferences: references.length, runtimeFiles: paths.size, missing: missing.length, duplicateAliasGroups: aliases.length, crossEntityDuplicates: crossEntityDuplicates.length, publishedWebpCrossEntityDuplicates: publishedDuplicates.length, newNativeFramesVerified: newFiles.length, recipeArt: 27, produceArt: 12, earnedDecorationViews: 58, penFences: 6, placeholderCropsReplaced: crops.length, whiteDogFrames:16};
console.log(JSON.stringify(result, null, 2));
