/**
 * Small, local-only pixel scenery for the garden preview.
 *
 * The three anchors deliberately live outside the authored plot, pen, and hut
 * footprints.  This module knows only the renderer's iso(col, row) callback;
 * it does not read or mutate FARM_SCENE and it does not load an asset.
 */

const COLORS = Object.freeze({
  outline: '#352c33',
  deepest: '#243b36',
  shadow: '#1e302b',
  hair: '#4a302b',
  hairLight: '#735044',
  hairGold: '#a57554',
  coat: '#8b5c49',
  coatLight: '#b27655',
  coatDark: '#65453d',
  skin: '#e2a078',
  skinLight: '#f0bd91',
  boot: '#49362f',
  bootLight: '#795044',
  pink: '#c75b7a',
  pinkLight: '#ee8aa2',
  pinkPale: '#f5c0c2',
  glass: '#70a8b6',
  glassLight: '#b7dee0',
  glassDark: '#3f6e72',
  wood: '#735044',
  woodLight: '#b18b5c',
  leaf: '#71934b',
  leafLight: '#b0bd67',
  paper: '#f5d69a',
  paperShadow: '#c49a62',
  seal: '#c75b4b',
  owl: '#d6d8bf',
  owlShadow: '#a6b1ae',
  owlDark: '#687486',
  beak: '#ed8a45',
});

const LAYOUT = Object.freeze({
  gardener: Object.freeze({
    id: 'gardener',
    col: -2,
    row: 8,
    // Screen-space artwork bounds relative to the ground anchor.
    bounds: Object.freeze({left: -54, top: -115, right: 44, bottom: 5}),
    hitbox: Object.freeze({left: -61, top: -123, right: 52, bottom: 11}),
  }),
  greenhouse: Object.freeze({
    id: 'greenhouse',
    col: 2,
    row: -1,
    bounds: Object.freeze({left: -70, top: -111, right: 72, bottom: 27}),
    hitbox: Object.freeze({left: -78, top: -119, right: 80, bottom: 33}),
  }),
  owl: Object.freeze({
    id: 'owl',
    col: 1,
    row: 8,
    bounds: Object.freeze({left: -27, top: -80, right: 47, bottom: 7}),
    hitbox: Object.freeze({left: -35, top: -88, right: 55, bottom: 15}),
  }),
});

/**
 * Authored logical cells and screen-relative bounds for integrators and QA.
 * `bounds` covers ink; `hitbox` is the slightly forgiving pointer rectangle.
 */
export const WIZARD_LAYOUT = Object.freeze(LAYOUT);

function finiteClock(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function rounded(value) {
  return Math.round(Number(value) || 0);
}

function screenAnchor(iso, col, row) {
  if (typeof iso !== 'function') throw new TypeError('wizard-scenery cần hàm iso(col, row).');
  const point = iso(col, row);
  if (!Array.isArray(point) || point.length < 2 || !Number.isFinite(Number(point[0])) || !Number.isFinite(Number(point[1]))) {
    throw new TypeError('iso(col, row) phải trả về [x, y] hữu hạn.');
  }
  return [rounded(point[0]), rounded(point[1])];
}

/**
 * Scale a sprite into integer screen pixels without relying on a transformed
 * Canvas context. This keeps the authored blocks crisp when a giant or owl is
 * deliberately smaller than the reference drawing.
 */
function scaledCanvas(ctx, originX, originY, scale) {
  const mapX = (value) => rounded(originX + Number(value) * scale);
  const mapY = (value) => rounded(originY + Number(value) * scale);
  const mapSize = (value) => Math.max(1, rounded(Number(value) * scale));
  return {
    get fillStyle() { return ctx.fillStyle; },
    set fillStyle(value) { ctx.fillStyle = value; },
    fillRect(x, y, width, height) { ctx.fillRect(mapX(x), mapY(y), mapSize(width), mapSize(height)); },
    beginPath() { ctx.beginPath(); },
    moveTo(x, y) { ctx.moveTo(mapX(x), mapY(y)); },
    lineTo(x, y) { ctx.lineTo(mapX(x), mapY(y)); },
    closePath() { ctx.closePath(); },
    fill() { ctx.fill(); },
  };
}

function rect(ctx, x, y, width, height, color) {
  ctx.fillStyle = color;
  ctx.fillRect(rounded(x), rounded(y), rounded(width), rounded(height));
}

function polygon(ctx, points, color) {
  ctx.beginPath();
  ctx.moveTo(rounded(points[0][0]), rounded(points[0][1]));
  for (let index = 1; index < points.length; index += 1) {
    ctx.lineTo(rounded(points[index][0]), rounded(points[index][1]));
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function pixelLine(ctx, x1, y1, x2, y2, color, width = 2) {
  // A stepped line keeps the hard, one-pixel authored edge used by the other
  // garden primitives without depending on Canvas' anti-aliased stroke.
  const startX = rounded(x1);
  const startY = rounded(y1);
  const endX = rounded(x2);
  const endY = rounded(y2);
  const steps = Math.max(Math.abs(endX - startX), Math.abs(endY - startY));
  if (!steps) {
    rect(ctx, startX, startY, width, width, color);
    return;
  }
  for (let step = 0; step <= steps; step += 1) {
    const ratio = step / steps;
    rect(ctx, startX + (endX - startX) * ratio - width / 2, startY + (endY - startY) * ratio - width / 2, width, width, color);
  }
}

/* `pixelBlob` is intentionally row based: every contour is a hard rectangle. */
function pixelBlob(ctx, x, top, rows, color) {
  for (let index = 0; index < rows.length; index += 1) {
    const [offset, width, height = 3] = rows[index];
    rect(ctx, x + offset, top + index * height, width, height, color);
  }
}

function shadow(ctx, x, y, width) {
  const half = Math.round(width / 2);
  rect(ctx, x - half + 8, y - 4, width - 16, 4, COLORS.shadow);
  rect(ctx, x - half + 17, y, width - 34, 3, COLORS.deepest);
}

function animate(clock, reactionUntil) {
  const time = finiteClock(clock);
  if (time === 0) {
    return Object.freeze({head: 0, breath: 0, blink: false, wave: false, waveStep: 0});
  }
  const blinkPhase = time % 5100;
  return Object.freeze({
    head: Math.round(Math.sin(time / 1700) * 1),
    breath: Math.round(Math.sin(time / 900) * 1),
    blink: blinkPhase >= 4540 && blinkPhase < 4620,
    wave: Number.isFinite(Number(reactionUntil)) && Number(reactionUntil) > time,
    waveStep: Math.floor(time / 150) % 2,
  });
}

function drawUmbrella(ctx, x, y) {
  // The umbrella sits behind the shoulders and gives the gardener a tiny pink
  // accent without turning the character into a literal source likeness.
  polygon(ctx, [
    [x - 76, y - 143], [x - 66, y - 155], [x - 51, y - 162],
    [x - 32, y - 163], [x - 14, y - 155], [x - 5, y - 143],
    [x - 21, y - 148], [x - 38, y - 143], [x - 53, y - 149],
  ], COLORS.outline);
  polygon(ctx, [
    [x - 70, y - 143], [x - 62, y - 153], [x - 49, y - 158],
    [x - 34, y - 159], [x - 18, y - 152], [x - 10, y - 144],
    [x - 24, y - 151], [x - 38, y - 146], [x - 52, y - 153],
  ], COLORS.pink);
  rect(ctx, x - 57, y - 155, 14, 4, COLORS.pinkLight);
  rect(ctx, x - 25, y - 151, 7, 3, COLORS.pinkPale);
  pixelLine(ctx, x - 38, y - 143, x - 40, y - 61, COLORS.wood, 3);
  rect(ctx, x - 43, y - 63, 7, 4, COLORS.woodLight);
  rect(ctx, x - 45, y - 59, 3, 8, COLORS.wood);
}

function drawGardenerCore(ctx, x, y, state) {
  const headX = x + state.head;
  const breathY = state.breath;
  shadow(ctx, x, y, 70);
  drawUmbrella(ctx, x, y);

  // Back arm reaches for the umbrella shaft.
  polygon(ctx, [
    [x - 30, y - 87], [x - 45, y - 78], [x - 58, y - 63],
    [x - 52, y - 56], [x - 36, y - 69], [x - 19, y - 77],
  ], COLORS.outline);
  polygon(ctx, [
    [x - 29, y - 84], [x - 42, y - 75], [x - 53, y - 63],
    [x - 48, y - 60], [x - 34, y - 70], [x - 19, y - 76],
  ], COLORS.coatDark);
  rect(ctx, x - 54, y - 66, 9, 8, COLORS.skinLight);

  // Boots and short trouser cuffs establish the heavy, friendly silhouette.
  rect(ctx, x - 31, y - 30, 23, 25, COLORS.outline);
  rect(ctx, x + 8, y - 30, 24, 25, COLORS.outline);
  rect(ctx, x - 27, y - 28, 16, 21, COLORS.boot);
  rect(ctx, x + 12, y - 28, 17, 21, COLORS.boot);
  rect(ctx, x - 34, y - 8, 30, 10, COLORS.outline);
  rect(ctx, x + 5, y - 8, 35, 10, COLORS.outline);
  rect(ctx, x - 28, y - 7, 24, 6, COLORS.bootLight);
  rect(ctx, x + 11, y - 7, 28, 6, COLORS.bootLight);
  rect(ctx, x - 26, y - 28, 13, 4, COLORS.hairLight);
  rect(ctx, x + 14, y - 28, 13, 4, COLORS.hairLight);

  // Warm coat, outlined in dark plum like the garden's existing props.
  polygon(ctx, [
    [x - 37, y - 90 + breathY], [x - 26, y - 105 + breathY],
    [x + 23, y - 105 + breathY], [x + 39, y - 88 + breathY],
    [x + 35, y - 22 + breathY], [x + 23, y - 14 + breathY],
    [x - 23, y - 14 + breathY], [x - 40, y - 27 + breathY],
  ], COLORS.outline);
  polygon(ctx, [
    [x - 31, y - 87 + breathY], [x - 22, y - 99 + breathY],
    [x + 20, y - 99 + breathY], [x + 32, y - 85 + breathY],
    [x + 29, y - 27 + breathY], [x + 19, y - 20 + breathY],
    [x - 19, y - 20 + breathY], [x - 32, y - 31 + breathY],
  ], COLORS.coat);
  rect(ctx, x - 22, y - 91 + breathY, 11, 62, COLORS.coatLight);
  rect(ctx, x - 12, y - 92 + breathY, 5, 60, COLORS.coatDark);
  rect(ctx, x + 20, y - 82 + breathY, 6, 50, COLORS.coatDark);
  rect(ctx, x - 25, y - 25 + breathY, 50, 6, COLORS.wood);
  rect(ctx, x - 5, y - 25 + breathY, 10, 6, COLORS.paperShadow);
  rect(ctx, x - 2, y - 23 + breathY, 5, 3, COLORS.outline);
  rect(ctx, x - 31, y - 54 + breathY, 8, 15, COLORS.coatLight);
  rect(ctx, x + 25, y - 54 + breathY, 7, 14, COLORS.coatDark);

  // Front hand and a raised wave when the integration reports a reaction.
  const waveY = state.wave ? y - 121 - state.waveStep * 4 : y - 68;
  const waveX = state.wave ? x + 51 : x + 42;
  polygon(ctx, [
    [x + 25, y - 83 + breathY], [x + 38, y - 77 + breathY],
    [waveX, waveY + 8], [waveX - 5, waveY + 16],
    [x + 22, y - 66 + breathY],
  ], COLORS.outline);
  polygon(ctx, [
    [x + 27, y - 80 + breathY], [x + 36, y - 75 + breathY],
    [waveX - 4, waveY + 9], [waveX - 8, waveY + 14],
    [x + 24, y - 66 + breathY],
  ], COLORS.coatLight);
  rect(ctx, waveX - 7, waveY + 7, 12, 10, COLORS.skinLight);
  rect(ctx, waveX - 3, waveY + 4, 4, 6, COLORS.skin);
  if (state.wave) {
    rect(ctx, waveX - 8, waveY, 3, 10, COLORS.skinLight);
    rect(ctx, waveX - 2, waveY - 5, 3, 12, COLORS.skinLight);
    rect(ctx, waveX + 4, waveY - 2, 3, 9, COLORS.skinLight);
  }

  // Neck, face, and the shaggy brown halo.
  rect(ctx, headX - 10, y - 111, 20, 17, COLORS.outline);
  rect(ctx, headX - 7, y - 111, 14, 16, COLORS.skin);
  polygon(ctx, [
    [headX - 28, y - 156], [headX - 20, y - 166], [headX + 12, y - 166],
    [headX + 27, y - 153], [headX + 31, y - 129], [headX + 25, y - 107],
    [headX + 14, y - 100], [headX - 17, y - 102], [headX - 31, y - 117],
  ], COLORS.outline);
  pixelBlob(ctx, headX, y - 151, [
    [-15, 30, 4], [-21, 42, 4], [-23, 46, 4], [-20, 42, 4],
    [-16, 34, 4], [-10, 23, 4],
  ], COLORS.skin);
  rect(ctx, headX - 21, y - 147, 5, 13, COLORS.skinLight);
  rect(ctx, headX + 15, y - 146, 6, 12, COLORS.skinLight);
  // Hair fringe, side locks, and warm pixels on the beard.
  rect(ctx, headX - 23, y - 158, 43, 12, COLORS.hair);
  rect(ctx, headX - 28, y - 151, 8, 23, COLORS.hair);
  rect(ctx, headX + 20, y - 153, 9, 25, COLORS.hair);
  rect(ctx, headX - 17, y - 162, 11, 8, COLORS.hairLight);
  rect(ctx, headX - 3, y - 164, 12, 7, COLORS.hairLight);
  rect(ctx, headX + 12, y - 158, 8, 8, COLORS.hairGold);
  rect(ctx, headX - 23, y - 130, 8, 15, COLORS.hairLight);
  rect(ctx, headX + 17, y - 131, 9, 16, COLORS.hairLight);
  pixelBlob(ctx, headX, y - 121, [
    [-13, 27, 4], [-18, 36, 4], [-19, 40, 4], [-15, 32, 4],
    [-11, 24, 4], [-7, 15, 4],
  ], COLORS.hair);
  rect(ctx, headX - 13, y - 117, 7, 4, COLORS.hairLight);
  rect(ctx, headX + 6, y - 121, 8, 4, COLORS.hairLight);
  rect(ctx, headX - 5, y - 111, 10, 4, COLORS.hairGold);
  // Eyes blink as a two-pixel line; no emoji or text bubble is needed.
  if (state.blink) {
    rect(ctx, headX - 14, y - 137, 8, 2, COLORS.outline);
    rect(ctx, headX + 7, y - 137, 8, 2, COLORS.outline);
  } else {
    rect(ctx, headX - 13, y - 139, 6, 4, COLORS.outline);
    rect(ctx, headX + 8, y - 139, 6, 4, COLORS.outline);
    rect(ctx, headX - 11, y - 138, 2, 2, COLORS.paper);
    rect(ctx, headX + 10, y - 138, 2, 2, COLORS.paper);
  }
  rect(ctx, headX - 2, y - 132, 5, 4, COLORS.skinLight);
  rect(ctx, headX - 5, y - 127, 10, 3, COLORS.hairLight);
}

function drawGardener(ctx, x, y, state) {
  const scaled = scaledCanvas(ctx, x, y, 0.68);
  drawGardenerCore(scaled, 0, 0, state);
}

function drawGreenhouse(ctx, x, y) {
  // Ground axes are (2, 1) and (2, -1), exactly like the garden tiles.
  // The ridge follows the second axis; every wall post remains vertical.
  const at = ([u,v]) => [x+u,y+v];
  const face = (points,color) => polygon(ctx,points.map(at),color);
  const line = (a,b,color=COLORS.woodLight,width=2) => pixelLine(ctx,...at(a),...at(b),color,width);
  const A=[-56,-8], B=[8,24], C=[64,-4], D=[0,-36];
  const a=[-56,-56], b=[8,-24], c=[64,-52], d=[0,-84];
  const frontRidge=[-24,-78], backRidge=[32,-106];
  shadow(ctx,x,y+7,122);
  face([A,B,C,D],COLORS.wood);
  face([A,B,b,a],'#87bac0');
  face([B,C,c,b],'#58909c');
  // Visible pot benches and foliage behind the glazing.
  line([-49,-15],[0,10],COLORS.wood,4);
  line([16,11],[56,-9],COLORS.wood,4);
  for(const [u,v] of [[-43,-20],[-30,-13],[-16,-6],[25,2],[44,-7]]) {
    rect(ctx,x+u-3,y+v,7,7,'#aa7557');
    rect(ctx,x+u-1,y+v-11,2,12,COLORS.leaf);
    rect(ctx,x+u-6,y+v-10,6,4,COLORS.leafLight);
    rect(ctx,x+u+1,y+v-14,5,5,COLORS.leaf);
  }
  face([a,frontRidge,b],'#b7dee0');
  // Broad glass roof: pale panes, thin framing and reflected sky streaks.
  face([a,d,backRidge,frontRidge],'#c2e4df');
  face([frontRidge,backRidge,c,b],'#86c5cf');
  line([-14,-77],[34,-101],'#e0f4e9',3);
  line([-3,-67],[45,-91],'#c5e8e7',2);
  for(const t of [0,.33,.66,1]) {
    const shift=([u,v])=>[u+56*t,v-28*t];
    line(shift(a),shift(frontRidge));
    line(shift(frontRidge),shift(b));
  }
  line(a,d);line(frontRidge,backRidge,COLORS.woodLight,3);line(b,c);
  line([-8,-51],[48,-79],'#d9e9d7',2);
  for(const [lo,hi] of [[A,a],[B,b],[C,c]]) line(lo,hi,COLORS.woodLight,3);
  line(A,B,COLORS.woodLight,3);line(B,C,COLORS.woodLight,3);
  line(a,b);line(b,c);
  for(const t of [.25,.5,.75]) {
    line([-56+64*t,-8+32*t],[-56+64*t,-56+32*t]);
    line([8+56*t,24-28*t],[8+56*t,-24-28*t]);
  }
  line([-56,-33],[8,-1]);line([8,-1],[64,-29]);
  // Glass door lies on the front wall, so its sill shares the same 2:1 slope.
  face([[-23,8],[-6,17],[-6,-22],[-23,-31]],COLORS.wood);
  face([[-20,7],[-9,13],[-9,-20],[-20,-26]],'#add8d9');
  line([-18,-22],[-18,3],'#e0f4e9',2);
  rect(ctx,x-12,y-4,3,3,COLORS.paper);
  face([[-25,9],[-5,19],[2,15],[-18,5]],COLORS.paperShadow);
}

function drawPost(ctx, x, y) {
  shadow(ctx, x, y, 42);
  rect(ctx, x - 5, y - 64, 10, 64, COLORS.outline);
  rect(ctx, x - 2, y - 61, 5, 59, COLORS.woodLight);
  rect(ctx, x - 1, y - 58, 2, 55, COLORS.wood);
  rect(ctx, x - 31, y - 68, 62, 7, COLORS.outline);
  rect(ctx, x - 27, y - 66, 54, 3, COLORS.woodLight);
  rect(ctx, x - 26, y - 74, 8, 9, COLORS.wood);
  rect(ctx, x + 19, y - 74, 8, 9, COLORS.wood);
}

function drawOwlCore(ctx, x, y, state) {
  const headX = x + state.head;
  drawPost(ctx, x, y);
  // Parchment letter with a square red wax seal hangs from the post.
  rect(ctx, x + 19, y - 57, 19, 27, COLORS.outline);
  rect(ctx, x + 22, y - 54, 13, 21, COLORS.paper);
  rect(ctx, x + 25, y - 49, 7, 2, COLORS.paperShadow);
  rect(ctx, x + 25, y - 43, 7, 2, COLORS.paperShadow);
  rect(ctx, x + 26, y - 36, 6, 6, COLORS.seal);
  rect(ctx, x + 28, y - 38, 3, 10, COLORS.seal);

  // Perched body, then the wing so its lifted reaction pose reads clearly.
  rect(ctx, headX - 15, y - 83, 31, 23, COLORS.outline);
  rect(ctx, headX - 12, y - 80, 25, 18, COLORS.owl);
  rect(ctx, headX - 16, y - 66, 33, 7, COLORS.owlShadow);
  rect(ctx, headX - 9, y - 59, 7, 4, COLORS.beak);
  rect(ctx, headX + 3, y - 59, 7, 4, COLORS.beak);
  const wingLift = state.wave ? -state.waveStep * 5 : 0;
  polygon(ctx, [
    [headX + 8, y - 79], [headX + 24, y - 84 + wingLift],
    [headX + 29, y - 67 + wingLift], [headX + 17, y - 62],
  ], COLORS.outline);
  polygon(ctx, [
    [headX + 11, y - 77], [headX + 21, y - 81 + wingLift],
    [headX + 25, y - 68 + wingLift], [headX + 17, y - 65],
  ], COLORS.owlShadow);

  // Head and feather tufts.
  polygon(ctx, [
    [headX - 20, y - 91], [headX - 16, y - 110], [headX - 8, y - 118],
    [headX + 5, y - 117], [headX + 16, y - 109], [headX + 20, y - 91],
  ], COLORS.outline);
  rect(ctx, headX - 15, y - 106, 31, 18, COLORS.owl);
  rect(ctx, headX - 9, y - 114, 17, 7, COLORS.owlShadow);
  rect(ctx, headX - 17, y - 107, 7, 14, COLORS.owlDark);
  rect(ctx, headX + 11, y - 107, 7, 14, COLORS.owlDark);
  rect(ctx, headX - 10, y - 117, 5, 7, COLORS.owl);
  rect(ctx, headX + 6, y - 117, 5, 7, COLORS.owl);
  if (state.blink) {
    rect(ctx, headX - 11, y - 101, 8, 2, COLORS.outline);
    rect(ctx, headX + 5, y - 101, 8, 2, COLORS.outline);
  } else {
    rect(ctx, headX - 10, y - 104, 7, 7, COLORS.outline);
    rect(ctx, headX + 5, y - 104, 7, 7, COLORS.outline);
    rect(ctx, headX - 8, y - 102, 3, 3, COLORS.paper);
    rect(ctx, headX + 7, y - 102, 3, 3, COLORS.paper);
  }
  rect(ctx, headX - 3, y - 98, 8, 6, COLORS.beak);
  rect(ctx, headX - 1, y - 97, 4, 3, COLORS.paperShadow);
  // Feet gripping the post.
  rect(ctx, headX - 10, y - 61, 5, 7, COLORS.beak);
  rect(ctx, headX + 6, y - 61, 5, 7, COLORS.beak);
}

function drawOwl(ctx, x, y, state) {
  const scaled = scaledCanvas(ctx, x, y, 0.65);
  drawOwlCore(scaled, 0, 0, state);
}

function objectFor(spec, iso, state) {
  const xy = screenAnchor(iso, spec.col, spec.row);
  const draw = spec.id === 'gardener'
    ? (ctx) => drawGardener(ctx, xy[0], xy[1], state)
    : spec.id === 'greenhouse'
      ? (ctx) => drawGreenhouse(ctx, xy[0], xy[1])
      : (ctx) => drawOwl(ctx, xy[0], xy[1], state);
  return {kind: 'wizard-scenery', id: spec.id, type: 'wizard-scenery', xy, draw};
}

/**
 * Return y-sortable, draw-on-demand scenery objects for the garden renderer.
 * A clock of zero intentionally freezes all animation for reduced motion.
 */
export function wizardObjects(iso, clock, {reactionUntil = 0} = {}) {
  const state = animate(clock, reactionUntil);
  return [
    objectFor(LAYOUT.gardener, iso, state),
    objectFor(LAYOUT.greenhouse, iso, state),
    objectFor(LAYOUT.owl, iso, state),
  ].sort((left, right) => left.xy[1] - right.xy[1] || left.xy[0] - right.xy[0]);
}

/**
 * Return pointer anchors. Bounds are screen-space rectangles derived from the
 * same logical cells as wizardObjects, so a camera can transform both in one
 * place without touching scene-data.json.
 */
export function wizardTargets(iso) {
  return [LAYOUT.gardener, LAYOUT.greenhouse, LAYOUT.owl].map((spec) => {
    const xy = screenAnchor(iso, spec.col, spec.row);
    const bounds = spec.bounds;
    const hitbox = spec.hitbox;
    return {
      id: spec.id,
      xy,
      anchor: [spec.col, spec.row],
      bounds: {
        left: xy[0] + bounds.left,
        top: xy[1] + bounds.top,
        right: xy[0] + bounds.right,
        bottom: xy[1] + bounds.bottom,
        width: bounds.right - bounds.left,
        height: bounds.bottom - bounds.top,
      },
      hitbox: {
        left: xy[0] + hitbox.left,
        top: xy[1] + hitbox.top,
        right: xy[0] + hitbox.right,
        bottom: xy[1] + hitbox.bottom,
        width: hitbox.right - hitbox.left,
        height: hitbox.bottom - hitbox.top,
      },
    };
  });
}

