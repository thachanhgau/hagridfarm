// Placement acceptance matrix (audit 26/10/2026): every land chapter level × build state × keepsake count,
// each store decoration unlocked by then in both views, against an old-socket piece and a free-placed piece.
//   node garden-v05/decor-acceptance-matrix.mjs <HPVNN checkout> [out.json]
// Read-only; about two minutes. Not a unit test: it sweeps every half-tile of every case.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const [hpvnn, out] = process.argv.slice(2);
if (!hpvnn) throw new Error('usage: decor-acceptance-matrix.mjs <HPVNN checkout> [out.json]');
const read = file => JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
const scene = read('scene-data.json');
globalThis.FARM_SCENE = structuredClone(scene);
globalThis.FARM_MOTION = read('motion-data.json');
const {DB, CREATURE} = await import('./balance-data.mjs');
const {gardenStage, stageContains, keepsakeAnchorRow} = await import('./garden-growth.mjs');
const {decorSpotProblem, decorSpotGrid, groundRect} = await import('./decor-placement-ui.mjs');
const {keepsakeObstacles, placementSuggestions} = await import('./decor-placement-geometry.mjs');
const {iso, decorationPlacements} = await import('./scene-renderer.mjs');
const {wizardTargets} = await import('./wizard-scenery.mjs');
const {STORE_CATALOG} = await import('./garden-store-catalog.mjs');
const {decorFootprintRect, decorSpot, rectsOverlap} = await import('./decor-runtime.mjs');
const server = createRequire(import.meta.url)(path.resolve(hpvnn, 'functions/games/garden-decoration-space.js'));
const manifest = read('decor-assets-manifest.json');
const assetOf = id => manifest.items.find(item => item.id === id);
const items = STORE_CATALOG.filter(item => item.kind === 'decoration');
const HEROES = ['hw_violet_mist_pond', 'sp_whomping_anglia', 'hw_lantern_ancient_tree'];
const LEVELS = [1, 10, 24, 48, 72, 100, 110, 500];

function gardenAt(level, build, keepsakes) {
  const open = DB.expansions.filter(entry => entry.level <= level);
  const built = build === 'full' ? open.map(entry => entry.id) : build === 'building' ? open.slice(0, Math.floor(open.length / 2)).map(entry => entry.id) : [];
  const queued = build === 'building' && open[built.length] ? [{id: open[built.length].id}] : [];
  return {
    level,
    plots: Array.from({length: 3 + built.filter(id => id.startsWith('plot_')).length}, () => ({slots: Array(9).fill(null)})),
    built: built.filter(id => id.startsWith('pen_')),
    construction: queued,
    decorations: build === 'none' ? [] : DB.decorations.filter(entry => entry.level <= level).map(entry => entry.id),
    keepsakes: Object.fromEntries(Object.keys(CREATURE).map(species => [species, keepsakes === 12 || keepsakes === 1 && species === 'dragon' ? 1 : 0])),
  };
}

// Taps that must stay with their own target. Crop cells win over store pieces in renderer pick().
function tapTargets(state, stage) {
  const targets = [];
  for (const pen of scene.pens.filter(entry => state.built.includes(entry.id))) {
    const g = groundRect('pen', pen, scene);
    targets.push(['chuồng', iso((g.c0 + g.c1) / 2, (g.r0 + g.r1) / 2)]);
  }
  for (const placement of keepsakeObstacles(state, stage, iso, keepsakeAnchorRow).placements) {
    const [x, y] = iso(...placement.anchor);
    targets.push(['kỷ vật', [x, y - 16]]);
  }
  for (const target of wizardTargets(iso)) {
    const b = target.hitbox;
    targets.push(['công trình', [(b.left + b.right) / 2, (b.top + b.bottom) / 2]]);
  }
  for (const placement of decorationPlacements(scene)) if (state.decorations.includes(placement.id)) targets.push(['đồ thưởng', [placement.xy[0], placement.xy[1] - 20]]);
  return targets;
}

const started = Date.now();
const cases = [];
const simultaneous = [];
for (const level of LEVELS) for (const build of ['none', 'building', 'full']) for (const keepsakes of [0, 1, 12]) {
  const state = gardenAt(level, build, keepsakes);
  const stage = gardenStage(state, scene);
  // An old save keeps the cauldron in legacy socket 0 (row 7.15); a new save has the lantern on free ground.
  const decorations = {owned: ['decor_cauldron'], placements: ['decor_cauldron', null, null, null, null, null], positions: {}, rotations: {decor_cauldron: 'right'}};
  const lantern = decorSpotGrid(stage, at => decorSpotProblem(at[0], at[1], {map: scene, stage, state, decorations, itemId: 'decor_pumpkin_lantern', asset: assetOf('decor_pumpkin_lantern'), iso, assetOf})).find(spot => spot.ok);
  if (lantern) Object.assign(decorations, {owned: [...decorations.owned, 'decor_pumpkin_lantern'], placements: ['decor_cauldron', 'decor_pumpkin_lantern', null, null, null, null], positions: {decor_pumpkin_lantern: lantern.at}});
  const saved = ['decor_cauldron', 'decor_pumpkin_lantern'].filter(id => decorSpot(decorations, id)).map(id => decorFootprintRect(...decorSpot(decorations, id), STORE_CATALOG.find(item => item.id === id).footprint ?? [1, 1], id === 'decor_cauldron' ? 'right' : 'default'));
  const targets = tapTargets(state, stage);
  const keep = keepsakeObstacles(state, stage, iso, keepsakeAnchorRow);
  const plotGround = scene.plots.filter((_, index) => index < state.plots.length || state.construction.some(job => job.id === 'plot_' + (index + 1))).map(plot => groundRect('plot', plot, scene));
  const penGround = scene.pens.filter(pen => state.built.includes(pen.id) || state.construction.some(job => job.id === pen.id)).map(pen => groundRect('pen', pen, scene));
  for (const item of items.filter(entry => (entry.level ?? 1) <= level)) for (const facing of ['default', 'right']) {
    if (['decor_cauldron', 'decor_pumpkin_lantern'].includes(item.id)) continue; // already standing in this save
    const asset = assetOf(item.id);
    const grid = decorSpotGrid(stage, at => decorSpotProblem(at[0], at[1], {map: scene, stage, state, decorations, itemId: item.id, facing, asset, iso, assetOf}));
    const free = grid.filter(spot => spot.ok);
    const fault = {serverReject: 0, offGrid: 0, outsideLand: 0, onPlotOrPen: 0, onKeepsakeOrAisle: 0, onSavedPiece: 0};
    const taps = {};
    for (const {at} of free) {
      if (!server.isDecorationSpot(at)) fault.serverReject++;
      if (!at.every(n => Number.isInteger(n * 2))) fault.offGrid++;
      const rect = decorFootprintRect(at[0], at[1], item.footprint ?? [1, 1], facing);
      if (![[rect.c0, rect.r0], [rect.c1, rect.r0], [rect.c0, rect.r1], [rect.c1, rect.r1]].every(([c, r]) => stageContains(stage, c, r))) fault.outsideLand++;
      if ([...plotGround, ...penGround].some(g => rectsOverlap(rect, g))) fault.onPlotOrPen++;
      if ([...keep.ground, ...keep.access].some(g => rectsOverlap(rect, g))) fault.onKeepsakeOrAisle++;
      if (saved.some(g => rectsOverlap(rect, g))) fault.onSavedPiece++;
      const [x, y] = iso(...at), b = facing === 'right' && asset.rightBounds ? asset.rightBounds : asset.bounds;
      const left = x - asset.pivotX + b.x - 5, top = y - asset.pivotY + b.y - 5, right = left + b.w + 10, bottom = top + b.h + 10;
      for (const kind of new Set(targets.filter(([, [tx, ty]]) => tx >= left && tx <= right && ty >= top && ty <= bottom).map(([kind]) => kind))) taps[kind] = (taps[kind] ?? 0) + 1;
    }
    cases.push({level, stage: stage.id, build, keepsakes, id: item.id, footprint: (item.footprint ?? [1, 1]).join('×'), facing, candidates: grid.length, free: free.length, ...fault, tapOverlap: taps});
  }
  // The large pieces together: a bounded search over spread-out free spots of each, both views.
  const heroes = HEROES.filter(id => (items.find(item => item.id === id).level ?? 1) <= level);
  if (build === 'full' && keepsakes === 12 && heroes.length) {
    const fit = (index, layout) => {
      if (index === heroes.length) return layout;
      const id = heroes[index], options = [];
      for (const facing of ['default', 'right']) {
        const free = decorSpotGrid(stage, at => decorSpotProblem(at[0], at[1], {map: scene, stage, state, decorations: layout, itemId: id, facing, asset: assetOf(id), iso, assetOf})).filter(spot => spot.ok);
        // ponytail: 12 evenly spread spots per view, not every spot; raise it if a real layout is missed.
        for (let i = 0; i < free.length; i += Math.max(1, Math.floor(free.length / 12))) options.push({at: free[i].at, facing});
      }
      for (const option of options) {
        const next = structuredClone(layout);
        next.owned.push(id); next.placements.push(id); next.positions[id] = option.at; next.rotations[id] = option.facing;
        const done = fit(index + 1, next);
        if (done) return done;
      }
      return null;
    };
    const layout = fit(0, decorations);
    const placed = Object.fromEntries(heroes.filter(id => layout?.positions[id]).map(id => [id, {at: layout.positions[id], facing: layout.rotations[id]}]));
    simultaneous.push({level, stage: stage.id, items: heroes, placed, allPlaced: Object.keys(placed).length === heroes.length});
  }
}

const zero = cases.filter(entry => entry.free === 0);
const pieceZero = [...new Set(zero.map(entry => `${entry.id}@${entry.level}/${entry.build}/k${entry.keepsakes}`))]
  .filter(key => cases.filter(entry => `${entry.id}@${entry.level}/${entry.build}/k${entry.keepsakes}` === key).every(entry => entry.free === 0));
const total = key => cases.reduce((sum, entry) => sum + entry[key], 0);
const tapTotals = {};
for (const entry of cases) for (const [kind, n] of Object.entries(entry.tapOverlap)) tapTotals[kind] = (tapTotals[kind] ?? 0) + n;
const summary = {
  scope: 'source geometry, no browser; levels ' + LEVELS.join('/') + ' × none/building/full × keepsakes 0/1/12; old socket + free-coordinate save; both views',
  seconds: Math.round((Date.now() - started) / 1000),
  gardens: LEVELS.length * 9,
  evaluations: cases.length,
  freeSpotsChecked: total('free'),
  invariantFaults: Object.fromEntries(['serverReject', 'offGrid', 'outsideLand', 'onPlotOrPen', 'onKeepsakeOrAisle', 'onSavedPiece'].map(key => [key, total(key)])),
  viewsWithoutRoom: zero.length,
  piecesWithoutRoomInEitherView: pieceZero,
  tapBoxOverTargetSpots: tapTotals,
  simultaneous,
};
if (out) fs.writeFileSync(out, JSON.stringify({summary, cases}, null, 1) + '\n');
console.log(JSON.stringify(summary, null, 1));
