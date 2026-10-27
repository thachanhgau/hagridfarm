import test from 'node:test';
import assert from 'node:assert/strict';
import scene from './scene-data.json' with {type: 'json'};
import motion from './motion-data.json' with {type: 'json'};
import {CREATURE, DB} from './balance-data.mjs';
import {insideFarm} from './garden-landscape.mjs';
import {newGame} from './progression-engine.mjs';
const runtimeScene = structuredClone(scene);
globalThis.FARM_SCENE = runtimeScene;
globalThis.FARM_MOTION = motion;
const {
  clientToWorld,
  decorationPlacements,
  iso,
  keepsakePlacements,
  mapLayoutToScene,
  pickFromWorld,
  plotAliases,
  plotCorners,
  plotCellPosition,
  plotPhysicalBounds,
  worldToCell,
  createGarden,
} = await import('./scene-renderer.mjs');

const overlap = (left, right) => (
  left.col < right.col + right.width
  && left.col + left.width > right.col
  && left.row < right.row + right.height
  && left.row + left.height > right.row
);

const penCells = scene.pens.map((pen) => ({col: pen.col, row: pen.row, width: pen.width, height: pen.height}));

test('all eighteen plots are fixed 3x3 cells without overlap', () => {
  assert.equal(scene.plots.length, 18); // thửa 13–18: level-500 roadmap P3
  for (const plot of scene.plots) {
    assert.equal(plot.width, 3);
    assert.equal(plot.height, 3);
    assert.equal(plot.positions.center.length, 2);
  }
  for (let left = 0; left < scene.plots.length; left += 1) {
    for (let right = left + 1; right < scene.plots.length; right += 1) {
      assert.equal(overlap(scene.plots[left], scene.plots[right]), false);
    }
  }
  const cells = scene.plots.flatMap((plot) => Array.from({length: 9}, (_, index) => (
    `${plot.col + index % 3},${plot.row + Math.floor(index / 3)}`
  )));
  assert.equal(new Set(cells).size, 162);
});

test('twelve creature spots stay inside the map and outside every plot', () => {
  assert.equal(scene.pens.length, 6);
  assert.equal(scene.creatureSpots.length, 12);
  for (const [col, row] of scene.creatureSpots) {
    assert.ok(col >= 0 && col < scene.columns);
    assert.ok(row >= 0 && row < scene.rows);
    assert.equal(scene.plots.some((plot) => (
      col >= plot.col && col < plot.col + plot.width && row >= plot.row && row < plot.row + plot.height
    )), false);
  }
});

test('isometric transform and picker only select built plots', () => {
  const plot = scene.plots[1];
  const [x,y] = iso(...plotCellPosition(plot,5,scene),scene);
  assert.deepEqual(worldToCell(x,y,scene), {col:Math.round(plotCellPosition(plot,5,scene)[0]),row:Math.round(plotCellPosition(plot,5,scene)[1])});
  assert.deepEqual(pickFromWorld(x, y, 2, scene), {plot: plot.id, index: 5});
  assert.equal(pickFromWorld(x, y, 1, scene), null);
  const rect = {left: 100, top: 50, width: scene.width * 2, height: scene.height * 2};
  assert.deepEqual(clientToWorld(100 + x * 2, 50 + y * 2, rect, scene.width, scene.height), {x, y});
});

test('canonical plot aliases cannot cross-match adjacent construction ids', () => {
  assert.equal(plotAliases(scene.plots[0], 0).includes('plot_1'), true);
  assert.equal(plotAliases(scene.plots[0], 0).includes('plot_0'), false);
  assert.equal(plotAliases(scene.plots[3], 3).includes('plot_4'), true);
  assert.equal(plotAliases(scene.plots[3], 3).includes('plot_3'), false);
});

test('layout projection keeps logical ids while moving coordinates to authored slots', () => {
  const moved = {
    plots: [11, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 0, 12, 13, 14, 15, 16, 17],
    pens: [5, 1, 2, 3, 4, 0],
  };
  const projected = mapLayoutToScene(scene, moved);
  assert.equal(projected.plots[0].id, scene.plots[0].id);
  assert.equal(projected.plots[0].requiredLevel, scene.plots[0].requiredLevel);
  assert.deepEqual(
    [projected.plots[0].col, projected.plots[0].row],
    [scene.plots[11].col, scene.plots[11].row],
  );
  assert.deepEqual(
    [projected.plots[11].col, projected.plots[11].row],
    [scene.plots[0].col, scene.plots[0].row],
  );
  assert.equal(projected.pens[0].id, scene.pens[0].id);
  assert.equal(projected.pens[0].requiredLevel, scene.pens[0].requiredLevel);
  assert.deepEqual(projected.pens[0].spots, scene.pens[5].spots);
  assert.deepEqual(projected.creatureSpots[0], scene.pens[5].spots[0]);
  assert.deepEqual(projected.creatureSpots[1], scene.pens[5].spots[1]);
  assert.deepEqual(scene.plots[0].positions.center, [3,4]);
  assert.deepEqual(scene.pens[0].spots, [[28.4, 2.4], [31.85, 1.85]]);
});

function fakeContext() {
  const target = {};
  return new Proxy(target, {
    get(object, key) {
      if (key === 'measureText') return () => ({width: 64});
      if (!(key in object)) object[key] = () => {};
      return object[key];
    },
  });
}

function fakeCanvas() {
  const context = fakeContext();
  const canvas = {
    width: 0,
    height: 0,
    dataset: {},
    getContext: () => context,
    getBoundingClientRect() {
      return {left: 0, top: 0, width: this.width || 1, height: this.height || 1};
    },
  };
  class MissingImage {
    set src(value) {
      this.file = value;
      queueMicrotask(() => this.onerror?.(new Error(`missing ${value}`)));
    }
  }
  canvas.ownerDocument = {
    createElement: () => fakeCanvas(),
    defaultView: {Image: MissingImage},
  };
  return canvas;
}

test('renderer remaps built and unbuilt slots, then restores identity without drift', async () => {
  const canvas = fakeCanvas();
  const garden = await createGarden(canvas, {allowMissingAssets: true});
  const now = 1_700_000_000_000;
  const crop = {
    id: 'layout-render-crop',
    type: 'crop',
    species: 'pumpkin',
    plantedAt: now,
    readyAt: now + 600_000,
    growMs: 600_000,
  };
  const state = {
    offsetMs: 0,
    plots: [
      {slots: [crop, ...Array(8).fill(null)]},
      {slots: Array(9).fill(null)},
      {slots: Array(9).fill(null)},
    ],
    creatures: [],
    built: ['plot_1', 'plot_2', 'plot_3', 'pen_1'],
    construction: [],
    decorations: [],
    keepsakes: {},
    layout: {
      plots: [11, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 0, 12, 13, 14, 15, 16, 17],
      pens: [5, 1, 2, 3, 4, 0],
    },
  };
  const authored = structuredClone(scene);
  garden.render(state, {now, clock: now, propsVisible: false});
  const fenceIds = garden.order().filter(object => object.id.startsWith('boundary:')).map(object => object.id);
  assert.equal(garden.growthStage().id,6,'legacy moved buildings expand the visible frontier');
  assert.equal(fenceIds.length,83,'the complete perimeter includes the greenhouse rear recess');
  assert.equal(new Set(fenceIds).size, fenceIds.length, 'keepsakes must not duplicate the perimeter fence');
  assert.deepEqual([garden.map.plots[0].col, garden.map.plots[0].row], [authored.plots[11].col, authored.plots[11].row]);
  assert.deepEqual([garden.map.plots[11].col, garden.map.plots[11].row], [authored.plots[0].col, authored.plots[0].row]);
  assert.deepEqual([garden.map.pens[0].col, garden.map.pens[0].row], [authored.pens[5].col, authored.pens[5].row]);
  assert.deepEqual(garden.map.creatureSpots[0], authored.pens[5].spots[0]);
  const movedCrop = garden.order().find((object) => object.id === crop.species);
  assert.ok(movedCrop);
  assert.equal(movedCrop.y, iso(...plotCellPosition(authored.plots[11],0,garden.map),garden.map)[1]);

  const [builtX, builtY] = iso(garden.map.plots[0].col + 1, garden.map.plots[0].row + 1, garden.map);
  assert.deepEqual(garden.pick(builtX, builtY), {plot: 0, index: 4});
  const [futureX, futureY] = iso(garden.map.plots[11].col + 1, garden.map.plots[11].row + 1, garden.map);
  assert.equal(garden.pick(futureX, futureY), null);

  state.layout = {
    plots: authored.plots.map((_, index) => index),
    pens: authored.pens.map((_, index) => index),
  };
  garden.render(state, {now, clock: now, propsVisible: false});
  assert.deepEqual(
    garden.map.plots.map((plot) => [plot.col, plot.row, plot.id, plot.requiredLevel]),
    authored.plots.map((plot) => [plot.col, plot.row, plot.id, plot.requiredLevel]),
  );
  assert.deepEqual(
    garden.map.pens.map((pen) => [pen.col, pen.row, pen.id, pen.requiredLevel]),
    authored.pens.map((pen) => [pen.col, pen.row, pen.id, pen.requiredLevel]),
  );
  assert.deepEqual(garden.map.creatureSpots, authored.creatureSpots);
});

test('every purchased decoration has a unique aisle footprint outside plots and pens', () => {
  const placements = decorationPlacements(scene);
  assert.deepEqual(placements.map((placement) => placement.id), DB.decorations.map((entry) => entry.id));
  for (const placement of placements) {
    assert.ok(placement.shape, `${placement.id} needs a procedural shape`);
    assert.ok(insideFarm(placement.col,placement.row));
    assert.ok(insideFarm(placement.col+placement.width,placement.row+placement.height));
    assert.ok(placement.col + placement.width <= scene.columns, `${placement.id} exceeds map columns`);
    assert.ok(placement.row + placement.height <= scene.rows, `${placement.id} exceeds map rows`);
    assert.equal(scene.plots.some(plot=>overlap(placement,plotPhysicalBounds(plot,scene))),false,`${placement.id} overlaps a plot`);
    assert.equal(penCells.some((pen) => overlap(placement, pen)), false, `${placement.id} overlaps a pen`);
  }
  for (let left = 0; left < placements.length; left += 1) {
    for (let right = left + 1; right < placements.length; right += 1) {
      assert.equal(overlap(placements[left], placements[right]), false, `${placements[left].id} overlaps ${placements[right].id}`);
    }
  }
});

test('keepsake display tokens occupy safe south-aisle cells', () => {
  const placements = keepsakePlacements(scene);
  assert.equal(placements.length, Object.keys(CREATURE).length);
  for (const placement of placements) {
    assert.equal(scene.plots.some((plot) => overlap(placement, plot)), false, `${placement.species} overlaps a plot`);
    assert.equal(penCells.some((pen) => overlap(placement, pen)), false, `${placement.species} overlaps a pen`);
  }
});


test('plot frames match all soil cell edges after layout swaps', () => {
  const swapped = mapLayoutToScene(scene, {plots: scene.plots.map((_,i)=>11-i)});
  for(const plot of [...scene.plots,...swapped.plots]) {
    const cells=Array.from({length:9},(_,i)=>iso(...plotCellPosition(plot,i,scene),scene));
    const corners=plotCorners(plot,scene);
    assert.equal(Math.min(...corners.map(p=>p[0])),Math.min(...cells.map(p=>p[0]))-scene.tileWidth*scene.plotCellScale/2);
    assert.equal(Math.max(...corners.map(p=>p[0])),Math.max(...cells.map(p=>p[0]))+scene.tileWidth*scene.plotCellScale/2);
    assert.equal(Math.min(...corners.map(p=>p[1])),Math.min(...cells.map(p=>p[1]))-scene.tileHeight*scene.plotCellScale/2);
    assert.equal(Math.max(...corners.map(p=>p[1])),Math.max(...cells.map(p=>p[1]))+scene.tileHeight*scene.plotCellScale/2);
  }
});


test('standard cells still select the correct slot at their centers and near every edge',()=>{
  for(const plot of scene.plots)for(let slot=0;slot<9;slot++){
    const [col,row]=plotCellPosition(plot,slot,scene),scale=scene.plotCellScale;
    for(const [dc,dr] of [[0,0],[.4,.4],[-.4,.4],[.4,-.4],[-.4,-.4]]){
      const point=iso(col+dc*scale,row+dr*scale,scene);
      assert.deepEqual(pickFromWorld(...point,scene.plots.length,scene),{plot:plot.id,index:slot});
    }
  }
  const width=plotPhysicalBounds(scene.plots[0],scene).width;
  assert.equal(width,3);
  assert.equal(scene.plots[1].col-scene.plots[0].col-width,4);
  const plots=scene.plots.map(p=>plotPhysicalBounds(p,scene));
  for(let i=0;i<plots.length;i++)for(let j=i+1;j<plots.length;j++)assert.equal(overlap(plots[i],plots[j]),false);
});

test('store decoration sockets keep maximum 2x1 footprints outside every crop and pen',async()=>{
 const {DECOR_SLOTS}=await import('./decor-runtime.mjs');
 for(const slot of DECOR_SLOTS){const bounds={col:slot.col-1,row:slot.row-.5,width:2,height:1};
  for(const plot of scene.plots)assert.equal(overlap(bounds,plotPhysicalBounds(plot,scene)),false,`${slot.id} overlaps plot ${plot.id}`);
  for(const pen of penCells)assert.equal(overlap(bounds,pen),false,`${slot.id} overlaps pen`);
  for(const c of [bounds.col,bounds.col+2])for(const r of [bounds.row,bounds.row+1])assert.ok(insideFarm(c,r));
 }
});


test('renderer hides future plot and pen labels and expands without losing initial plots',async()=>{
 const canvas=fakeCanvas(),labels=[];canvas.getContext().fillText=text=>labels.push(text);
 const garden=await createGarden(canvas,{allowMissingAssets:true}),state=newGame(1700000000000);
 garden.render(state,{now:1700000000000,clock:0,propsVisible:false});
 assert.equal(garden.growthStage().id,1);
 assert.equal(canvas.dataset.gardenStage,'1');
 assert.equal(labels.filter(t=>/^THỬA /.test(t)).length,3);
 assert.equal(labels.some(t=>/Lv/.test(t)),false,'no future construction labels in starter scene');
 const initial=garden.growthBounds();labels.length=0;state.level=100;
 garden.render(state,{now:1700000000000,clock:0,propsVisible:false});
 assert.equal(garden.growthStage().id,6);
 assert.ok(garden.growthBounds().bottom>initial.bottom);
 assert.ok(labels.some(t=>/T12/.test(t)),'final plot is offered but not automatically built');
 assert.equal(labels.filter(t=>/^THỬA /.test(t)).length,3);
 const [x,y]=iso(garden.map.plots[0].col+1,garden.map.plots[0].row+1,garden.map);
 assert.deepEqual(garden.pick(x,y),{plot:0,index:4});
});

test('a decoration being placed outside the fence never opens later garden stages',async()=>{
 const cauldron={id:'decor_cauldron',file:'decor-assets/x.png',width:40,height:40,pivotX:20,pivotY:36};
 const garden=await createGarden(fakeCanvas(),{allowMissingAssets:true,decorAssets:[cauldron]}),state=newGame(1700000000000);
 garden.render(state,{now:1700000000000,clock:0,propsVisible:false,previewDecoration:{itemId:'decor_cauldron',at:[12,26],facing:'default'}});
 assert.equal(garden.growthStage().id,1);
 // A saved free spot past the fence does not open it either.
 garden.render(state,{now:1700000000000,clock:0,propsVisible:false,decorations:{owned:['decor_cauldron'],placements:['decor_cauldron'],positions:{decor_cauldron:[12,26]}}});
 assert.equal(garden.growthStage().id,1);
});
