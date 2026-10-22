import {ITEM_ART} from './item-art.mjs?v=24.9.66';

const PEN_KEYS = Object.freeze(Object.keys(ITEM_ART).filter((key) => /^pen_[1-6]$/.test(key)));

export function penArt(id) {
  return ITEM_ART[String(id)] ?? null;
}

export function penFiles() {
  return PEN_KEYS.map((key) => ITEM_ART[key]?.file).filter(Boolean);
}

export function penShelterFrame(pen, iso, art = penArt(pen?.id)) {
  if (!pen || typeof iso !== 'function' || !art) return null;
  const [anchorX, anchorY] = iso(pen.col + pen.width * 0.5, pen.row + pen.height * 0.13);
  const width = Number(art.width) || 96;
  const height = Number(art.height) || 96;
  const pivotX = Number.isFinite(Number(art.pivotX)) ? Number(art.pivotX) : width / 2;
  const pivotY = Number.isFinite(Number(art.pivotY)) ? Number(art.pivotY) : height;
  const x = Math.round(anchorX);
  const y = Math.round(anchorY);
  const bounds = art.bounds ?? {x: 0, y: 0, w: width, h: height};
  return {
    x,
    y,
    width,
    height,
    pivotX,
    pivotY,
    alphaBounds: {
      left: x - pivotX + Number(bounds.x || 0),
      top: y - pivotY + Number(bounds.y || 0),
      right: x - pivotX + Number(bounds.x || 0) + Number(bounds.w || width),
      bottom: y - pivotY + Number(bounds.y || 0) + Number(bounds.h || height),
    },
  };
}

export function drawPenShelter(context, image, frame) {
  if (!context || !image || !frame) return false;
  context.drawImage(
    image,
    Math.round(frame.x - frame.pivotX),
    Math.round(frame.y - frame.pivotY),
    frame.width,
    frame.height,
  );
  return true;
}
