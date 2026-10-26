import {FARM_BOUNDARY} from './garden-landscape.mjs?v=24.9.80';

export const GREENHOUSE_FOOTPRINT = Object.freeze({
  col: 2, row: -1, left: -78, top: -119, right: 80, bottom: 33,
});

export const SCENIC_TERRAIN_PALETTE = Object.freeze({
  grass: '#71934b',
  patchDark: '#777044',
  patchMid: '#71934b',
  patchLight: '#71934b',
  forestFloor: '#24483f',
  hillNorth: '#3f6a45',
  hillWest: '#24483f',
  hillEast: '#3f6a45',
  hillSouth: '#24483f',
  hillLow: '#24483f',
  hillTop: '#777044',
  hillLip: '#71934b',
  rock: '#5d6046',
  rockLight: '#777044',
});

// Broad world-space ridges keep the surround wooded and continuous instead
// of reading as eight isolated round mounds.
export const SCENIC_HILLS = Object.freeze([
  Object.freeze({id:'north-ridge',side:'north',base:[1280,430],width:2200,rise:240,depth:125,phase:.4}),
  Object.freeze({id:'west-ridge',side:'west',base:[430,760],width:1080,rise:260,depth:120,phase:1.7}),
  Object.freeze({id:'east-ridge',side:'east',base:[2140,780],width:1080,rise:255,depth:120,phase:2.9}),
  Object.freeze({id:'south-ridge',side:'south',base:[1280,1130],width:2200,rise:215,depth:115,phase:4.6}),
].map(Object.freeze));

const DEFAULT_WIDTH = 2560;
const DEFAULT_HEIGHT = 1440;
const finite = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const positive = (value, fallback) => Math.max(1, finite(value, fallback));
const widthOf = map => positive(map?.width, DEFAULT_WIDTH);
const heightOf = map => positive(map?.height, DEFAULT_HEIGHT);
const tileWidth = map => positive(map?.tileWidth, 64);
const tileHeight = map => positive(map?.tileHeight, 32);
const origin = map => ({x: finite(map?.origin?.x, 0), y: finite(map?.origin?.y, 0)});

function iso(map, col, row) {
  const point = origin(map);
  return [point.x + (col - row) * tileWidth(map) / 2, point.y + (col + row) * tileHeight(map) / 2];
}

function randomSource(seed) {
  let value = seed >>> 0;
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 0x100000000;
  };
}

function seedFor(map) {
  const values = [widthOf(map), heightOf(map), tileWidth(map), tileHeight(map), origin(map).x, origin(map).y];
  let seed = 0x5343454e;
  for (const value of values) seed = Math.imul(seed ^ Math.round(value * 31), 0x45d9f3b) >>> 0;
  return seed || 1;
}

function pathPolygon(ctx, points) {
  if (!points.length) return;
  ctx.moveTo(Math.round(points[0][0]), Math.round(points[0][1]));
  for (const [x, y] of points.slice(1)) ctx.lineTo(Math.round(x), Math.round(y));
  ctx.closePath();
}

function fillPolygon(ctx, points, color, alpha = 1) {
  ctx.beginPath();
  pathPolygon(ctx, points);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fill();
}

function pixelLine(ctx, a, b, color, width = 2, alpha = 1) {
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]))));
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;
  for (let index = 0; index <= steps; index += 1) {
    const t = index / steps;
    const x = Math.round(a[0] + (b[0] - a[0]) * t);
    const y = Math.round(a[1] + (b[1] - a[1]) * t);
    ctx.fillRect(x - Math.floor(width / 2), y - Math.floor(width / 2), width, width);
  }
}

function makePatch(random, width, height, index) {
  const x = random() * width, y = random() * height;
  const rx = 42 + random() * 120, ry = 13 + random() * 36;
  const points = [];
  for (let point = 0; point < 8; point += 1) {
    const angle = Math.PI * 2 * point / 8;
    const wobble = 0.72 + random() * 0.46;
    points.push([x + Math.cos(angle) * rx * wobble, y + Math.sin(angle) * ry * (0.8 + random() * 0.35)]);
  }
  return {points, color: [SCENIC_TERRAIN_PALETTE.patchDark, SCENIC_TERRAIN_PALETTE.patchMid, SCENIC_TERRAIN_PALETTE.patchLight][index % 3]};
}

function makeHill(map, spec) {
  const sx=widthOf(map)/DEFAULT_WIDTH, sy=heightOf(map)/DEFAULT_HEIGHT;
  const vertical=spec.side==='north'||spec.side==='south';
  const tangent=vertical?[1,0]:[0,1], outward=spec.side==='north'?[0,-1]:spec.side==='south'?[0,1]:spec.side==='east'?[1,0]:[-1,0];
  const x=spec.base[0]*sx, y=spec.base[1]*sy, width=spec.width*(vertical?sx:sy), rise=spec.rise*(vertical?sy:sx), depth=spec.depth*(vertical?sy:sx);
  const foot=[], baseLine=[], shoulder=[], crest=[], outer=[];
  const band=(distance,wobble)=>Array.from({length:33},(_,i)=>{
    const u=i/32, t=u-.5, taper=Math.sin(u*Math.PI)**1.45*(.74+.26*Math.sin(u*Math.PI*3+spec.phase));
    const along=t*width*(.94+.04*Math.sin(i*1.1+spec.phase));
    const wave=(Math.sin(i*.68+spec.phase)*wobble+Math.cos(i*.27+spec.phase*1.3)*wobble*.75)*(0.25+0.75*taper);
    const offset=distance*taper+wave;
    return [Math.round((x+tangent[0]*along+outward[0]*offset)/2)*2,Math.round((y+tangent[1]*along+outward[1]*offset)/2)*2];
  });
  for(const point of band(-depth*.12,10)) foot.push(point);
  for(const point of band(0,14)) baseLine.push(point);
  for(const point of band(rise*.42,18)) shoulder.push(point);
  for(const point of band(rise*.78,15)) crest.push(point);
  for(const point of band(rise+depth*.2,10)) outer.push(point);
  const all=[...foot,...baseLine,...shoulder,...crest,...outer];
  const xs=all.map(([px])=>px),ys=all.map(([,py])=>py);
  return {...spec,x,y,width,rise,depth,crest,foot,baseLine,shoulder,outer,outline:[...baseLine,...outer.slice().reverse()],
    bounds:{left:Math.min(...xs),top:Math.min(...ys),right:Math.max(...xs),bottom:Math.max(...ys)}};
}

export function scenicHillGeometry(map) {
  return SCENIC_HILLS.map(spec => makeHill(map, spec));
}

function paintGrassTexture(ctx, width, height, grassImage, random) {
  ctx.globalAlpha = 1;
  ctx.fillStyle = SCENIC_TERRAIN_PALETTE.grass;
  ctx.fillRect(0, 0, width, height);
  if (!grassImage || typeof ctx.drawImage !== 'function') return;
  for (let y = 0; y < height; y += 8) {
    let x = 0;
    while (x < width) {
      const span = [8, 12, 16][Math.floor(random() * 3)];
      const sx = 16 + Math.floor(random() * Math.max(1, 34 - span));
      const sy = 10 + Math.floor(random() * 5);
      ctx.drawImage(grassImage, sx, sy, span, 8, x, y, span, 8);
      x += span;
    }
  }
}

function paintHill(ctx, hill, index, grassImage) {
  const palette=SCENIC_TERRAIN_PALETTE;
  const slope=hill.side==='north'?palette.hillNorth:hill.side==='south'?palette.hillSouth:hill.side==='east'?palette.hillEast:palette.hillWest;
  fillPolygon(ctx,[...hill.foot,...hill.baseLine.slice().reverse()],palette.hillLow,.34);
  fillPolygon(ctx,[...hill.baseLine,...hill.shoulder.slice().reverse()],slope,.32);
  fillPolygon(ctx,[...hill.shoulder,...hill.crest.slice().reverse()],palette.hillTop,.22);
  fillPolygon(ctx,[...hill.crest,...hill.outer.slice().reverse()],palette.hillLow,.26);
  ctx.save();ctx.beginPath();pathPolygon(ctx,hill.outline);ctx.clip();
  const random=randomSource(701+index*331), b=hill.bounds;
  if(grassImage) {
    ctx.globalAlpha=.22;
    for(let y=b.top;y<b.bottom;y+=8)for(let x=b.left;x<b.right;x+=16)
      ctx.drawImage(grassImage,16+Math.floor(random()*16),10+Math.floor(random()*5),16,8,Math.round(x),Math.round(y),16,8);
  }
  for(let n=0;n<260;n++){
    const x=Math.round(b.left+random()*(b.right-b.left)),y=Math.round(b.top+random()*(b.bottom-b.top));
    ctx.globalAlpha=.24;ctx.fillStyle=n%3?palette.hillNorth:palette.hillLow;
    ctx.fillRect(x,y,2+Math.floor(random()*4),2);
    if(n%5===0){ctx.fillRect(x+2,y-3,2,4);ctx.fillRect(x+5,y-5,2,6);}
  }
  for(let n=5;n<28;n+=6) {
    const a=hill.baseLine[n],bump=hill.crest[Math.min(32,n+1)];
    const b=[a[0]+(bump[0]-a[0])*.42,a[1]+(bump[1]-a[1])*.42];
    pixelLine(ctx,a,b,palette.rock,2,.32);
    if(n%12===5)pixelLine(ctx,[a[0]+2,a[1]-2],[b[0]-3,b[1]-2],palette.rockLight,1,.35);
  }
  ctx.restore();
}

function footprint(map) {
  const spec = map?.greenhouseFootprint ?? GREENHOUSE_FOOTPRINT;
  const [x, y] = iso(map, finite(spec.col, 2), finite(spec.row, -1));
  return [[x + finite(spec.left, -78), y + finite(spec.top, -119)], [x + finite(spec.right, 80), y + finite(spec.top, -119)], [x + finite(spec.right, 80), y + finite(spec.bottom, 33)], [x + finite(spec.left, -78), y + finite(spec.bottom, 33)]];
}

function clipOutside(ctx, path, width, height) {
  ctx.beginPath();
  ctx.rect(0, 0, width, height);
  pathPolygon(ctx, path);
  ctx.clip('evenodd');
}

function clipOutsideFarmAndGreenhouse(ctx, map, width, height) {
  const boundary = Array.isArray(map?.farmBoundary) && map.farmBoundary.length >= 3 ? map.farmBoundary : FARM_BOUNDARY;
  clipOutside(ctx, boundary.map(([col, row]) => iso(map, col, row)), width, height);
  clipOutside(ctx, footprint(map), width, height);
}

export function drawScenicTerrain(ctx, map, {grassImage = null, backdrop = null} = {}) {
  if (!ctx || !map || typeof ctx.fillRect !== 'function' || typeof ctx.beginPath !== 'function') return Object.freeze({patches: 0, hills: 0});
  const width = widthOf(map), height = heightOf(map), random = randomSource(seedFor(map));
  const patches = Array.from({length: 34}, (_, index) => makePatch(random, width, height, index));
  const hills = scenicHillGeometry(map);
  ctx.save?.();
  ctx.imageSmoothingEnabled = false;
  paintGrassTexture(ctx, width, height, grassImage, random);
  for (const patch of patches) fillPolygon(ctx, patch.points, patch.color, grassImage ? 0.1 : 0.2);
  ctx.save?.();
  clipOutsideFarmAndGreenhouse(ctx, map, width, height);
  if(backdrop){ctx.globalAlpha=1;ctx.fillStyle=ctx.createPattern(backdrop,'repeat');ctx.fillRect(0,0,width,height);}
  else hills.forEach((hill, index) => paintHill(ctx, hill, index, grassImage));
  ctx.restore?.();
  ctx.restore?.();
  return Object.freeze({patches: patches.length, hills: hills.length});
}

export function drawScenicGround(ctx,width,height,{grassImage=null}={}) {
  ctx.save();ctx.imageSmoothingEnabled=false;
  paintGrassTexture(ctx,width,height,grassImage,randomSource(0x47524153));
  ctx.globalAlpha=.62;ctx.fillStyle=SCENIC_TERRAIN_PALETTE.forestFloor;ctx.fillRect(0,0,width,height);
  const random=randomSource(0x464f5253);
  for(let i=0;i<48;i++){
    const patch=makePatch(random,width,height,i),color=i%2?'#142620':'#24483f';
    for(const dx of [-width,0,width])for(const dy of [-height,0,height])
      fillPolygon(ctx,patch.points.map(([px,py])=>[px+dx,py+dy]),color,.22);
  }
  ctx.restore();
}

export function drawScenicBackdrop(ctx,width,height,{grassImage=null}={}) {
  drawScenicGround(ctx,width,height,{grassImage});
  ctx.save();
  scenicHillGeometry({width,height}).forEach((hill,index)=>paintHill(ctx,hill,index,grassImage));
  ctx.globalAlpha=.31;ctx.fillStyle='#142620';ctx.fillRect(0,0,width,height);
  ctx.restore();
}

export default drawScenicTerrain;
