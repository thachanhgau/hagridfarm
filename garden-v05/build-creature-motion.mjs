// Build authored right-facing creature motion without touching the existing
// growth/native atlases. The generated runtime extension is loaded by the
// parent after motion-data.js, level-assets.js and motion-care-data.js.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {authoredCells} from './authored-atlas.mjs';

const require = createRequire(import.meta.url);
const sharp = require(process.env.SHARP_MODULE || '/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root = path.dirname(fileURLToPath(import.meta.url));
const assetRoot = path.join(root, 'creature-motion-assets');
const masterRoot = path.join(assetRoot, 'masters');
const nativeRoot = path.join(assetRoot, 'native');
const qaRoot = path.join(assetRoot, 'qa');
const alphaThreshold = 192;
const columns = 4;
const rows = 4;

const paletteHex = [
  '231F2E', '4A3042', '735044', 'A57554', '41465C', '687486',
  'A6B1AE', 'D6D8BF', '24483F', '3F6A45', '71934B', 'B0BD67',
  '8B4A3F', 'C97952', 'E7AE73', 'F5D69A', '874056', 'C75B4B',
  'ED8A45', 'FFC36B', '3E3B70', '6961A6', '70A8B6', 'B7DEE0'
];
const palette = paletteHex.map((hex) => [0, 2, 4].map((offset) => parseInt(hex.slice(offset, offset + 2), 16)));

const CLIPS = {
  idle: {row: 0, phases: ['rest', 'breathe', 'blink', 'settle'], durations: [600, 240, 180, 240], loop: true},
  action: {row: 1, phases: ['prep', 'peak', 'release', 'recovery'], durations: [320, 180, 240, 220], loop: false},
  eat: {row: 2, phases: ['approach', 'lower', 'bite', 'lift'], durations: [300, 420, 340, 820], loop: false},
  care: {row: 3, phases: ['approach', 'receive', 'blink', 'recovery'], durations: [260, 620, 260, 820], loop: false}
};

const PROMPTS = {
  puffskein: `Create one transparent 4 by 4 sprite-sheet for a clean hand-authored pixel-art game creature. 16 equal square cells, four columns and four rows, no gutters, no grid lines, no text, no labels, no scenery, no shadows outside the sprite, and each cell contains one fully separated centered sprite. Use a restrained 24-color palette close to the reference, crisp hard pixel clusters, no antialiasing, no smooth gradients, no speckled microtexture. The species is Puffskein: a tiny round fluffy orange-gold puffball with a warm peach face and tiny ears, preserving the reference identity. All 16 sprites must face RIGHT in a clear three-quarter side view with visible asymmetry; never mirror a left view. Keep the mature creature's proportions and feet on a consistent ground line. Row 1: four distinct right-facing idle poses with tiny breathing and ear shifts. Row 2: four distinct right-facing generic action poses, prep, peak, settle, recovery. Row 3: four distinct right-facing eating poses, approach food, lower head, bite, lift. Row 4: four distinct right-facing care poses, lean toward a small brush/hand cue, receive care, blink, relaxed recovery. The output is an asset sheet for later technical slicing; prioritize readable silhouettes and distinct poses over decorative detail.`,
  bowtruckle: `Create one transparent 4 by 4 sprite-sheet for a clean hand-authored pixel-art game creature. 16 equal square cells, four columns and four rows, no gutters, grid lines, text, labels, scenery, or cast shadow; one centered fully separated sprite per cell. Restrained 24-color palette close to the reference, hard-edged pixel clusters, no antialiasing, no smooth gradients, no speckled microtexture. Species: Bowtruckle, a very slender twig-like tree guardian with a bark body, long branch arms, tiny feet and fresh green leaf tufts, preserving the reference identity and proportions. Every sprite faces RIGHT in a clear three-quarter side view: face and eye point to the image right, branch tail/leaf asymmetry remains visible, never mirror a left view. Keep feet on one consistent ground line. Row 1: four distinct right-facing idle poses with leaf flutter and tiny breathing. Row 2: four distinct right-facing generic action phases: reach, stretch, leaf lift, recovery. Row 3: four distinct right-facing eating phases: approach a small leaf morsel, nibble, chew, lift. Row 4: four distinct right-facing care phases: lean toward a small brush/hand cue, receive care, blink, relaxed recovery. Props may be tiny and subordinate. This is an asset sheet for later technical slicing; prioritize a readable silhouette and clearly different poses over decorative detail.`,
  niffler: `Create one transparent 4 by 4 sprite-sheet for a clean hand-authored pixel-art game creature. 16 equal square cells, four columns and four rows, no gutters, grid lines, text, labels, scenery, or cast shadow; one centered fully separated sprite per cell. Restrained 24-color palette close to the reference, hard-edged readable pixel clusters, no antialiasing, no smooth gradients, no speckled microtexture. Species: Niffler, a compact charcoal-black and deep violet fluffy platypus-like creature with a long peach-brown snout, small paws, round body and a little treasure pouch, preserving the reference identity and proportions. Every sprite faces RIGHT in a clear three-quarter side view: snout and eye point to image right, tail and pouch trail left, asymmetric markings visible, never mirror a left view. Keep feet on one consistent ground line. Row 1: four distinct right-facing idle poses with breathing, ear and tail shifts. Row 2: four distinct right-facing generic action phases: sniff, crouch, paw reach, recovery. Row 3: four distinct right-facing eating phases: approach a small food dish, lower snout, bite, lift and chew. Row 4: four distinct right-facing care phases: lean toward a small brush/hand cue, receive care, blink, relaxed recovery. Props are tiny and subordinate. This is an asset sheet for later technical slicing; prioritize readable silhouettes and clearly different poses over decorative detail.`,
  hippogriff: `Create one transparent 4 by 4 sprite-sheet for a clean hand-authored pixel-art game creature. 16 equal square cells, four columns and four rows, no gutters, grid lines, text, labels, scenery, or cast shadow; one centered fully separated sprite per cell. Restrained 24-color palette close to the reference, hard-edged readable pixel clusters, no antialiasing, no smooth gradients, no speckled microtexture. Species: Hippogriff, an eagle-headed front half joined to a powerful horse body, cream breast and face, slate-blue and brown wings, feathered legs and long brown tail, preserving the reference identity. Every sprite faces RIGHT in a clear three-quarter side view: hooked beak and eye point to image right, tail trails left, wing layering is visibly asymmetric, never mirror a left view. Keep all hooves on a consistent ground line and preserve a noble grounded stance. Row 1: four distinct right-facing idle poses with breathing, feather and tail shifts. Row 2: four distinct right-facing generic action phases: wings lift, peak spread, settle, recovery. Row 3: four distinct right-facing eating phases at a tiny trough: approach, lower beak, bite, lift. Row 4: four distinct right-facing care phases with a small brush/hand cue: lean, receive grooming, blink, relaxed recovery. Props are tiny and subordinate. This is an asset sheet for later technical slicing; prioritize a readable silhouette and clearly different poses over decorative detail.`,
  dragon: `Create one transparent 4 by 4 sprite-sheet for a clean hand-authored pixel-art game creature. 16 equal square cells, four columns and four rows, no gutters, grid lines, text, labels, scenery, or cast shadow; one centered fully separated sprite per cell. Restrained 24-color palette close to the reference, hard-edged readable pixel clusters, no antialiasing, no smooth gradients, no speckled microtexture. Species: a small young dragon, dark burgundy-brown scales, orange segmented belly, short horns and spines, leathery copper wings and curled tail, preserving the reference identity and proportions. Every sprite faces RIGHT in a clear three-quarter side view: snout and eye point to image right, tail curls left, one nearer wing overlaps the farther wing so asymmetry is visible, never mirror a left view. Keep all four feet on a consistent ground line and keep the dragon compact and grounded. Row 1: four distinct right-facing idle poses with breathing, blinking, wing and tail shifts. Row 2: four distinct right-facing action phases: wings begin to open, peak spread, settle, recovery. Row 3: four distinct right-facing eating phases at a tiny trough: approach, lower head, bite, lift. Row 4: four distinct right-facing care phases with a small brush/hand cue: lean, receive grooming, blink, relaxed recovery. Props are tiny and subordinate. This is an asset sheet for later technical slicing; prioritize readable silhouette and clearly different poses over decorative detail.`,
  'three-headed-dog': `Create one transparent 4 by 4 sprite-sheet for a clean hand-authored pixel-art game creature. 16 equal square cells, four columns and four rows, no gutters, grid lines, text, labels, scenery, or cast shadow; one centered fully separated sprite per cell. Restrained 24-color palette close to the reference, hard-edged readable pixel clusters, no antialiasing, no smooth gradients, no speckled microtexture. Species: a fluffy white and cream three-headed puppy, three clearly separate small heads with varied ear poses, short legs, big curled tail, preserving the reference identity. Every sprite faces RIGHT in a clear three-quarter side view: all three muzzles point to image right, the nearer head overlaps the others, tails and ears remain asymmetric, never mirror a left view. Keep all paws on one consistent ground line. Row 1: four distinct right-facing idle poses with three heads blinking/breathing and tail shifts. Row 2: four distinct right-facing generic action phases: heads lift, bark gesture, settle, recovery. Row 3: four distinct right-facing eating phases at a tiny three-bowl feeder: approach, lower heads, bite, lift. Row 4: four distinct right-facing care phases with a small brush/hand cue: lean, receive grooming, blink, relaxed recovery. Props are tiny and subordinate. This is an asset sheet for later technical slicing; prioritize readable three-head silhouette and clearly different poses over decorative detail.`,
  mooncalf: `Create one transparent 4 by 4 sprite-sheet for a clean hand-authored pixel-art game creature. 16 equal square cells, four columns and four rows, no gutters, grid lines, text, labels, scenery, or cast shadow; one centered fully separated sprite per cell. Restrained 24-color palette close to the reference, hard-edged readable pixel clusters, no antialiasing, no smooth gradients, no speckled microtexture. Species: adult Mooncalf, a delicate pale blue-gray long-legged magical calf with huge blue eyes, very large floppy ears, small horns, a peach muzzle, spotted body and thin tail, preserving the reference identity. Every sprite faces RIGHT in a clear three-quarter side view: muzzle and visible eye point to image right, tail trails left, ears and spots are visibly asymmetric, never mirror a left view. Keep all four hooves on one consistent ground line. Row 1: four distinct right-facing idle poses with ear, blink and tail shifts. Row 2: four distinct right-facing generic action phases: ears lift, little hop, settle, recovery. Row 3: four distinct right-facing eating phases at a tiny grass patch: approach, lower muzzle, nibble, lift. Row 4: four distinct right-facing care phases with a small brush/hand cue: lean, receive grooming, blink, relaxed recovery. Props are tiny and subordinate. This is an asset sheet for later technical slicing; prioritize a graceful readable silhouette and clearly different poses over decorative detail.`,
  kneazle: `Create one transparent 4 by 4 sprite-sheet for a clean hand-authored pixel-art game creature. 16 equal square cells, four columns and four rows, no gutters, grid lines, text, labels, scenery, or cast shadow; one centered fully separated sprite per cell. Restrained 24-color palette close to the reference, hard-edged readable pixel clusters, no antialiasing, no smooth gradients, no speckled microtexture. Species: adult Kneazle, a lean orange-brown magical cat with dark spots, tall tufted ears, alert greenish eyes, whiskers and a large curled tail, preserving the reference identity and proportions. Every sprite faces RIGHT in a clear three-quarter side view: muzzle and visible eye point to image right, tail curls left, spots and ear tufts remain visibly asymmetric, never mirror a left view. Keep all paws on a consistent ground line. Row 1: four distinct right-facing idle poses with breathing, ear and tail shifts. Row 2: four distinct right-facing generic action phases: crouch, paw lift, tail swish, recovery. Row 3: four distinct right-facing eating phases at a tiny fish dish: approach, lower head, bite, lift. Row 4: four distinct right-facing care phases with a small brush/hand cue: lean, receive grooming, blink, relaxed recovery. Props are tiny and subordinate. This is an asset sheet for later technical slicing; prioritize a readable feline silhouette and clearly different poses over decorative detail.`,
  diricawl: `Create one transparent 4 by 4 sprite-sheet for a clean hand-authored pixel-art game creature. 16 equal square cells, four columns and four rows, no gutters, grid lines, text, labels, scenery, or cast shadow; one centered fully separated sprite per cell. Restrained 24-color palette close to the reference, hard-edged readable pixel clusters, no antialiasing, no smooth gradients, no speckled microtexture. Species: adult Diricawl, a round plump dodo-like magical bird with a blue-gray head, warm peach beak and feet, teal-green layered wings, leafy green back feathers and a short tail, preserving the reference identity. Every sprite faces RIGHT in a clear three-quarter side view: beak and visible eye point to image right, one nearer wing overlaps the far wing, tail feathers trail left, never mirror a left view. Keep both feet on a consistent ground line. Row 1: four distinct right-facing idle poses with breathing, head and wing feather shifts. Row 2: four distinct right-facing generic action phases: wing lift, flutter peak, settle, recovery. Row 3: four distinct right-facing eating phases at a tiny seed dish: approach, peck, lift, swallow. Row 4: four distinct right-facing care phases with a small brush/hand cue: lean, receive grooming, blink, relaxed recovery. Props are tiny and subordinate. This is an asset sheet for later technical slicing; prioritize a readable bird silhouette and clearly different poses over decorative detail.`,
  fwooper: `Create one transparent 4 by 4 sprite-sheet for a clean hand-authored pixel-art game creature. 16 equal square cells, four columns and four rows, no gutters, grid lines, text, labels, scenery, or cast shadow; one centered fully separated sprite per cell. Restrained 24-color palette close to the reference, hard-edged readable pixel clusters, no antialiasing, no smooth gradients, no speckled microtexture. Species: adult Fwooper, a vivid coral-orange magical songbird with a tall swept head crest, long layered orange and pink tail feathers, small dark beak and slim feet, preserving the reference identity. Every sprite faces RIGHT in a clear three-quarter side view: beak and visible eye point to image right, tail feathers flow left, wing and crest layers are visibly asymmetric, never mirror a left view. Keep both feet on a consistent ground line. Row 1: four distinct right-facing idle poses with head, crest and tail shifts. Row 2: four distinct right-facing generic action phases: wing lift, flutter peak, settle, recovery. Row 3: four distinct right-facing eating phases at a tiny seed dish: approach, peck, lift, swallow. Row 4: four distinct right-facing care phases with a small brush/hand cue: lean, receive grooming, blink, relaxed recovery. Props are tiny and subordinate. This is an asset sheet for later technical slicing; prioritize a readable bird silhouette and clearly different poses over decorative detail.`,
  thestral: `Create one transparent 4 by 4 sprite-sheet for a clean hand-authored pixel-art game creature. 16 equal square cells, four columns and four rows, no gutters, grid lines, text, labels, scenery, or cast shadow; one centered fully separated sprite per cell. Restrained 24-color palette close to the reference, hard-edged readable pixel clusters, no antialiasing, no smooth gradients, no speckled microtexture. Species: adult Thestral, a tall dark charcoal and muted violet winged horse with a narrow skeletal face, visible rib-like chest lines, pointed ears, leathery wings and long thin legs, preserving the reference identity. Every sprite faces RIGHT in a clear three-quarter side view: muzzle and visible eye point to image right, tail trails left, near wing overlaps the far wing and skeletal details remain asymmetrical, never mirror a left view. Keep all hooves on a consistent ground line. Row 1: four distinct right-facing idle poses with breathing, ear and tail shifts. Row 2: four distinct right-facing generic action phases: wings begin to fold or lift, peak, settle, recovery. Row 3: four distinct right-facing eating phases at a tiny hay dish: approach, lower head, bite, lift. Row 4: four distinct right-facing care phases with a small brush/hand cue: lean, receive grooming, blink, relaxed recovery. Props are tiny and subordinate. This is an asset sheet for later technical slicing; prioritize a readable elegant silhouette and clearly different poses over decorative detail.`,
  unicorn: `Create one transparent 4 by 4 sprite-sheet for a clean hand-authored pixel-art game creature. 16 equal square cells, four columns and four rows, no gutters, grid lines, text, labels, scenery, or cast shadow; one centered fully separated sprite per cell. Restrained 24-color palette close to the reference, hard-edged readable pixel clusters, no antialiasing, no smooth gradients, no speckled microtexture. Species: adult Unicorn, a graceful cream-white horse with a single horn, peach-gold mane and long curling tail, warm hooves and a subtle golden muzzle, preserving the reference identity. Every sprite faces RIGHT in a clear three-quarter side view: horn and visible eye point to image right, mane and tail flow left, leg and hair layers remain visibly asymmetric, never mirror a left view. Keep all hooves on a consistent ground line. Row 1: four distinct right-facing idle poses with breathing, ear and mane shifts. Row 2: four distinct right-facing generic action phases: head lift, horn glint gesture, settle, recovery. Row 3: four distinct right-facing eating phases at a tiny grass patch: approach, lower muzzle, nibble, lift. Row 4: four distinct right-facing care phases with a small brush/hand cue: lean, receive grooming, blink, relaxed recovery. Props are tiny and subordinate. This is an asset sheet for later technical slicing; prioritize a readable elegant silhouette and clearly different poses over decorative detail.`
};

const ITEMS = [
  {id: 'puffskein', kind: 'base', master: 'puffskein-right-motion-v01.png', reference: 'native/puffskein/frame-08.png'},
  {id: 'bowtruckle', kind: 'base', master: 'bowtruckle-right-motion-v01.png', reference: 'native/bowtruckle/frame-08.png'},
  {id: 'niffler', kind: 'base', master: 'niffler-right-motion-v01.png', reference: 'native/niffler/frame-08.png'},
  {id: 'hippogriff', kind: 'base', master: 'hippogriff-right-motion-v01.png', reference: 'native/hippogriff/frame-08.png'},
  {id: 'dragon', kind: 'base', master: 'dragon-right-motion-v01.png', reference: 'native/dragon/frame-08.png'},
  {id: 'three-headed-dog', kind: 'base', master: 'three-headed-dog-right-motion-v01.png', reference: 'native/three-headed-dog/frame-08.png'},
  {id: 'mooncalf', kind: 'level', master: 'mooncalf-right-motion-v01.png', reference: 'native-levels/mooncalf/frame-04.png'},
  {id: 'kneazle', kind: 'level', master: 'kneazle-right-motion-v01.png', reference: 'native-levels/kneazle/frame-04.png'},
  {id: 'diricawl', kind: 'level', master: 'diricawl-right-motion-v01.png', reference: 'native-levels/diricawl/frame-04.png'},
  {id: 'fwooper', kind: 'level', master: 'fwooper-right-motion-v01.png', reference: 'native-levels/fwooper/frame-04.png'},
  {id: 'thestral', kind: 'level', master: 'thestral-right-motion-v01.png', reference: 'native-levels/thestral/frame-04.png'},
  {id: 'unicorn', kind: 'level', master: 'unicorn-right-motion-v01.png', reference: 'native-levels/unicorn/frame-04.png'}
];

const hashBytes = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
const hashFile = async (file) => hashBytes(await fs.readFile(file));
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function alphaBounds(data, width, height, threshold = alphaThreshold) {
  let x0 = width, y0 = height, x1 = -1, y1 = -1, count = 0;
  for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) {
    if (data[(y * width + x) * 4 + 3] < threshold) continue;
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); count += 1;
  }
  return count ? {x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1, count, edge: x0 === 0 || y0 === 0 || x1 === width - 1 || y1 === height - 1} : {x: 0, y: 0, w: 0, h: 0, count: 0, edge: false};
}

function largestComponent(data, width, height) {
  const visited = new Uint8Array(width * height);
  const components = [];
  const neighbours = [-1, 0, 1];
  for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) {
    const seed = y * width + x;
    if (visited[seed] || data[seed * 4 + 3] < alphaThreshold) continue;
    const stack = [seed]; visited[seed] = 1;
    let x0 = x, y0 = y, x1 = x, y1 = y, count = 0;
    while (stack.length) {
      const index = stack.pop(); const px = index % width; const py = Math.floor(index / width);
      x0 = Math.min(x0, px); y0 = Math.min(y0, py); x1 = Math.max(x1, px); y1 = Math.max(y1, py); count += 1;
      for (const dy of neighbours) for (const dx of neighbours) {
        if (!dx && !dy) continue;
        const nx = px + dx, ny = py + dy;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
        const ni = ny * width + nx;
        if (visited[ni] || data[ni * 4 + 3] < alphaThreshold) continue;
        visited[ni] = 1; stack.push(ni);
      }
    }
    components.push({x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1, count, edge: x0 === 0 || y0 === 0 || x1 === width - 1 || y1 === height - 1});
  }
  return components.sort((a, b) => b.count - a.count)[0] || {x: 0, y: 0, w: 0, h: 0, count: 0, edge: false};
}

const atlasCells=new WeakMap();
function extractCell(raw,row,column){if(!atlasCells.has(raw))atlasCells.set(raw,authoredCells(raw,[4,4,4,4]));return atlasCells.get(raw)[row*4+column];}

function nearestPaletteIndex(r, g, b, cache) {
  const key = (r << 16) | (g << 8) | b;
  if (cache.has(key)) return cache.get(key);
  let best = 0, distance = Infinity;
  palette.forEach((color, index) => {
    const score = (r - color[0]) ** 2 * 2 + (g - color[1]) ** 2 * 3 + (b - color[2]) ** 2;
    if (score < distance) { distance = score; best = index; }
  });
  cache.set(key, best);
  return best;
}

function shiftOpaque(buffer, width, height, dx, dy) {
  if (!dx && !dy) return;
  const copy = Buffer.alloc(buffer.length);
  for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) {
    const sx = x - dx, sy = y - dy;
    if (sx < 0 || sx >= width || sy < 0 || sy >= height) continue;
    const source = (sy * width + sx) * 4, target = (y * width + x) * 4;
    buffer.copy(copy, target, source, source + 4);
  }
  copy.copy(buffer);
}

export function rasterize(cell, canvas, targetBounds, sharedScale, paletteCache) {
  const all = cell.bounds, main = cell.mainBounds;
  if (!all.count || !main.count) throw new Error('Cell has no opaque creature pixels');
  let scale = Math.max(0.01, Math.min(sharedScale, (canvas.width - 2) / all.w, (canvas.height - 2) / all.h));
  let output = null;
  let clippedPixels = 0;
  // A prop or brush can sit far outside the main creature component. Reduce
  // only that frame a little until the whole authored cell fits the existing
  // canvas; this avoids a hard crop while keeping the main silhouette large.
  for (let attempt = 0; attempt < 24; attempt += 1) {
    const mainWidth = Math.max(1, Math.round(main.w * scale));
    const mainHeight = Math.max(1, Math.round(main.h * scale));
    const mainOffsetX = Math.round((main.x - all.x) * scale);
    const mainOffsetY = Math.round((main.y - all.y) * scale);
    const originX = Math.round(canvas.pivotX - mainWidth / 2) - mainOffsetX;
    const originY = canvas.pivotY - mainHeight - mainOffsetY;
    output = Buffer.alloc(canvas.width * canvas.height * 4);
    clippedPixels = 0;
    for (let y = all.y; y < all.y + all.h; y += 1) for (let x = all.x; x < all.x + all.w; x += 1) {
      const sourceIndex = (y * cell.width + x) * 4;
      if (cell.data[sourceIndex + 3] < alphaThreshold) continue;
      const dx = originX + Math.floor((x - all.x) * scale);
      const dy = originY + Math.floor((y - all.y) * scale);
      if (dx < 0 || dx >= canvas.width || dy < 0 || dy >= canvas.height) { clippedPixels += 1; continue; }
      const color = palette[nearestPaletteIndex(cell.data[sourceIndex], cell.data[sourceIndex + 1], cell.data[sourceIndex + 2], paletteCache)];
      const targetIndex = (dy * canvas.width + dx) * 4;
      output[targetIndex] = color[0]; output[targetIndex + 1] = color[1]; output[targetIndex + 2] = color[2]; output[targetIndex + 3] = 255;
    }
    if (!clippedPixels) break;
    scale *= 0.96;
  }
  let bounds = alphaBounds(output, canvas.width, canvas.height);
  const correctionX = bounds.count ? (bounds.x < 1 ? 1 - bounds.x : bounds.x + bounds.w > canvas.width - 1 ? canvas.width - 1 - (bounds.x + bounds.w) : 0) : 0;
  let correctionY = bounds.count ? (bounds.y < 1 ? 1 - bounds.y : bounds.y + bounds.h > canvas.height - 1 ? canvas.height - 1 - (bounds.y + bounds.h) : 0) : 0;
  shiftOpaque(output, canvas.width, canvas.height, correctionX, correctionY);
  bounds = alphaBounds(output, canvas.width, canvas.height);
  // Keep the final opaque row on the adult ground pivot even when the source
  // cell's last alpha row rounds one pixel past the scaled component bottom.
  if (bounds.count && bounds.y + bounds.h !== canvas.pivotY) {
    const baselineCorrection = canvas.pivotY - (bounds.y + bounds.h);
    shiftOpaque(output, canvas.width, canvas.height, 0, baselineCorrection);
    correctionY += baselineCorrection;
    bounds = alphaBounds(output, canvas.width, canvas.height);
  }
  if (bounds.edge && scale > 0.02) {
    // A rounded baseline correction can put a tall wing or ear on row zero;
    // retry that frame a fraction smaller so the runtime atlas keeps a safe
    // transparent border on every authored pose.
    return rasterize(cell, canvas, targetBounds, scale * 0.96, paletteCache);
  }
  return {
    output,
    bounds,
    scale,
    clippedPixels,
    anchorCorrection: {x: correctionX, y: correctionY},
    sourceBounds: all,
    mainBounds: main,
    binaryAlpha: true,
    palette24: true,
    targetBounds
  };
}

function baseDescriptor(item, motion, levels) {
  const source = item.kind === 'level' ? levels.items.find((entry) => entry.id === item.id) : motion.items.find((entry) => entry.id === item.id);
  if (!source) throw new Error(`Missing source item ${item.id}`);
  const frame = item.kind === 'level' ? source.frames[3] : source.frames[Math.min(7, source.frames.length - 1)];
  return {
    label: source.label,
    baseFrame: frame.file,
    baseFrameBytes: frame,
    canvas: {width: frame.width, height: frame.height, pivotX: frame.pivotX, pivotY: frame.pivotY},
    targetBounds: frame.bounds
  };
}

function clipFrameName(id, clip, frame) {
  return path.join('native', id, `right-${clip}-${String(frame + 1).padStart(2, '0')}.png`).replaceAll(path.sep, '/');
}

function buildRuntime(manifest) {
  const data = JSON.stringify(manifest, null, 2);
  return `// Generated by build-creature-motion.mjs. Load after motion-care-data.js.\n(() => {\n  const manifest = ${data};\n  const apply = () => {\n    const collections = [window.FARM_LEVEL_ASSETS?.items, window.FARM_MOTION?.items];\n    const byId = new Map((manifest.items || []).map((item) => [item.id, item]));\n    const present = new Set();\n    for (const collection of collections) {\n      if (!Array.isArray(collection)) continue;\n      for (const item of collection) {\n        const spec = byId.get(item?.id);\n        if (!spec) continue;\n        item.rightCreatureMotion = spec;\n        item.__gardenCreatureMotionV1Applied = true;\n        present.add(item.id);\n      }\n    }\n    const missing = (manifest.items || []).map((item) => item.id).filter((id) => !present.has(id));\n    window.FARM_CREATURE_MOTION_STATUS = { applied: [...present], missing, complete: missing.length === 0 };\n    return window.FARM_CREATURE_MOTION_STATUS;\n  };\n  window.FARM_CREATURE_MOTION = manifest;\n  window.FARM_CREATURE_MOTION_APPLY = apply;\n  apply();\n})();\n`;
}

async function writeContactSheet(records) {
  const gap = 2;
  const blockGap = 8;
  const blockWidth = Math.max(...records.map((record) => record.canvas.width * columns + gap * (columns - 1)));
  const blockHeights = records.map((record) => record.canvas.height * rows + gap * (rows - 1));
  const height = blockHeights.reduce((sum, value) => sum + value, 0) + blockGap * (records.length - 1);
  const composites = [];
  const blocks = [];
  let top = 0;
  for (let itemIndex = 0; itemIndex < records.length; itemIndex += 1) {
    const record = records[itemIndex];
    const blockHeight = blockHeights[itemIndex];
    blocks.push({id: record.id, x: 0, y: top, width: record.canvas.width * columns + gap * (columns - 1), height: blockHeight, nativeScale: 1});
    for (let frameIndex = 0; frameIndex < record.frameFiles.length; frameIndex += 1) {
      const file = path.join(assetRoot, record.frameFiles[frameIndex]);
      composites.push({input: await fs.readFile(file), left: (frameIndex % columns) * (record.canvas.width + gap), top: top + Math.floor(frameIndex / columns) * (record.canvas.height + gap)});
    }
    top += blockHeight + blockGap;
  }
  await fs.mkdir(qaRoot, {recursive: true});
  const out = path.join(qaRoot, 'contact-sheet-native.png');
  await sharp({create: {width: blockWidth, height, channels: 4, background: {r: 0, g: 0, b: 0, alpha: 0}}}).composite(composites).png().toFile(out);
  return {file: 'qa/contact-sheet-native.png', nativeScale: 1, blocks};
}

async function main() {
  const motion = JSON.parse(await fs.readFile(path.join(root, 'motion-data.json'), 'utf8'));
  const levels = JSON.parse(await fs.readFile(path.join(root, 'level-assets.json'), 'utf8'));
  await fs.mkdir(nativeRoot, {recursive: true});
  const records = [];
  const paletteCache = new Map();
  for (const item of ITEMS) {
    const descriptor = baseDescriptor(item, motion, levels);
    const masterPath = path.join(masterRoot, item.master);
    const masterBytes = await fs.readFile(masterPath);
    const raw = await sharp(masterBytes).ensureAlpha().raw().toBuffer({resolveWithObject: true});
    const cells = Array.from({length: rows}, (_, row) => Array.from({length: columns}, (_, column) => extractCell(raw, row, column)));
    const frameFiles = [];
    const frameRecords = [];
    for (const [clip, spec] of Object.entries(CLIPS)) for (let frameIndex = 0; frameIndex < columns; frameIndex += 1) {
      const cell = cells[spec.row][frameIndex];
      // Normalize each authored pose to the existing adult silhouette. The
      // generator sometimes leaves more transparent breathing room around an
      // idle pose than an action pose, so one sheet-wide scale would make idle
      // creatures visibly shrink at runtime.
      const frameScale = Math.min(
        (descriptor.targetBounds.w - 2) / cell.mainBounds.w,
        (descriptor.targetBounds.h - 2) / cell.mainBounds.h
      );
      if (!Number.isFinite(frameScale) || frameScale <= 0) throw new Error(`Invalid scale for ${item.id} ${clip} ${frameIndex}`);
      const rendered = rasterize(cell, descriptor.canvas, descriptor.targetBounds, frameScale, paletteCache);
      const file = clipFrameName(item.id, clip, frameIndex);
      const absolute = path.join(assetRoot, file);
      await fs.mkdir(path.dirname(absolute), {recursive: true});
      const encoded = await sharp(rendered.output, {raw: {width: descriptor.canvas.width, height: descriptor.canvas.height, channels: 4}}).png().toBuffer();
      await fs.writeFile(absolute, encoded);
      const frameRecord = {
        file,
        width: descriptor.canvas.width,
        height: descriptor.canvas.height,
        pivotX: descriptor.canvas.pivotX,
        pivotY: descriptor.canvas.pivotY,
        clip,
        phase: spec.phases[frameIndex],
        sourceFrame: spec.row * columns + frameIndex,
        sourceRect: cell.rect,
        sourceBounds: rendered.sourceBounds,
        mainBounds: rendered.mainBounds,
        bounds: rendered.bounds,
        scale: rendered.scale,
        anchorCorrection: rendered.anchorCorrection,
        clippedPixels: rendered.clippedPixels,
        sha256: hashBytes(encoded),
        binaryAlpha: rendered.binaryAlpha,
        palette24: rendered.palette24,
        direction: 'right-authored'
      };
      frameRecords.push(frameRecord);
      frameFiles.push(file);
    }
    const clips = {};
    for (const [clip, spec] of Object.entries(CLIPS)) {
      const frames = frameRecords.filter((frame) => frame.clip === clip);
      clips[clip] = {
        frames: frames.map((frame) => frame.file),
        frameIndices: frames.map((frame) => frameRecords.indexOf(frame)),
        phases: spec.phases,
        durations: spec.durations,
        loop: spec.loop,
        direction: 'right-authored'
      };
    }
    const referencePath = path.join(root, descriptor.baseFrame);
    const referenceBytes = await fs.readFile(referencePath);
    records.push({
      id: item.id,
      label: descriptor.label,
      kind: 'creature',
      sourceCollection: item.kind === 'level' ? 'FARM_LEVEL_ASSETS' : 'FARM_MOTION',
      direction: 'right-authored',
      generation: {
        tool: 'built-in image_gen',
        prompt: PROMPTS[item.id],
        masterFile: `masters/${item.master}`,
        masterSha256: hashBytes(masterBytes),
        masterDimensions: {width: raw.info.width, height: raw.info.height},
        referenceFile: descriptor.baseFrame,
        referenceSha256: hashBytes(referenceBytes)
      },
      baseFrame: descriptor.baseFrame,
      baseFrameSha256: hashBytes(referenceBytes),
      canvas: descriptor.canvas,
      targetBounds: descriptor.targetBounds,
      scaleStrategy: 'per-frame fit to adult alpha bounds; props remain subordinate within the same canvas',
      clips,
      frames: frameRecords,
      frameFiles
    });
  }
  const manifest = {
    version: 1,
    status: 'complete: 12/12 right-facing creature motion sheets',
    generatedBy: 'build-creature-motion.mjs',
    generatedDate: '2026-10-23',
    assetRoot: 'creature-motion-assets/',
    loadAfter: ['motion-data.js', 'level-assets.js', 'motion-care-data.js'],
    palette: paletteHex.map((hex) => `#${hex}`),
    alphaThreshold,
    nearestResize: true,
    binaryAlpha: true,
    direction: 'right-authored; no runtime horizontal flip',
    requestedMissingEatCare: ['puffskein', 'bowtruckle', 'niffler', 'hippogriff', 'dragon'],
    animationContract: {rows, columns, clips: CLIPS, baseline: 'adult reference pivot and alpha-bounds ground line', distinctFramesPerClip: 4},
    items: records
  };
  manifest.contactSheet = await writeContactSheet(records);
  await fs.writeFile(path.join(assetRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  await fs.writeFile(path.join(root, 'creature-motion-data.js'), buildRuntime(manifest));
  console.log(JSON.stringify({items: records.length, frames: records.reduce((sum, item) => sum + item.frames.length, 0), contactSheet: manifest.contactSheet.file, masters: records.map((item) => `${item.id}:${item.generation.masterSha256.slice(0, 12)}`)}, null, 2));
}

if(process.argv[1]===fileURLToPath(import.meta.url))await main();
