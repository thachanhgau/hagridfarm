const EPSILON = 1e-7;

const finite = value => Number.isFinite(Number(value));
const pointOnSegment = (a, b, p) => Math.abs((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])) < EPSILON
  && p[0] >= Math.min(a[0], b[0]) - EPSILON && p[0] <= Math.max(a[0], b[0]) + EPSILON
  && p[1] >= Math.min(a[1], b[1]) - EPSILON && p[1] <= Math.max(a[1], b[1]) + EPSILON;
const orientation = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
function segmentsTouch(a, b, c, d) {
  const abC = orientation(a, b, c), abD = orientation(a, b, d);
  const cdA = orientation(c, d, a), cdB = orientation(c, d, b);
  if (pointOnSegment(a, b, c) || pointOnSegment(a, b, d) || pointOnSegment(c, d, a) || pointOnSegment(c, d, b)) return true;
  return ((abC > EPSILON) !== (abD > EPSILON)) && ((cdA > EPSILON) !== (cdB > EPSILON));
}
function pointInPolygon(point, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[j], b = polygon[i];
    if (pointOnSegment(a, b, point)) return true;
    if ((a[1] > point[1]) !== (b[1] > point[1]) && point[0] < (b[0] - a[0]) * (point[1] - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
  }
  return inside;
}
function touchesPolygon(rect, polygon) {
  const corners = [[rect.left, rect.top], [rect.right, rect.top], [rect.right, rect.bottom], [rect.left, rect.bottom]];
  if (corners.some(point => pointInPolygon(point, polygon))) return true;
  if (polygon.some(([x, y]) => x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom)) return true;
  return corners.some((a, i) => {
    const b = corners[(i + 1) % corners.length];
    return polygon.some((c, j) => segmentsTouch(a, b, c, polygon[(j + 1) % polygon.length]));
  });
}

/** Return true only when the complete sprite and its lower fence-clearance box miss the stage. */
export function forestRectOutsideBoundary(rect, scene = {}, boundary, clearance = 10) {
  if (!rect || !['left', 'top', 'right', 'bottom'].every(key => finite(rect[key])) || rect.right < rect.left || rect.bottom < rect.top) return false;
  if (!Array.isArray(boundary) || boundary.length < 3 || boundary.some(point => !Array.isArray(point) || point.length < 2 || !finite(point[0]) || !finite(point[1]))) return false;
  const origin = scene.origin ?? {x: 0, y: 0}, width = Number(scene.tileWidth) || 64, height = Number(scene.tileHeight) || 32;
  const polygon = boundary.map(([col, row]) => [Number(origin.x) + (col - row) * width / 2, Number(origin.y) + (col + row) * height / 2]);
  if (polygon.some(point => point.some(value => !finite(value)))) return false;
  const margin = Math.max(0, Number.isFinite(Number(clearance)) ? Number(clearance) : 10);
  return !touchesPolygon({left: rect.left - margin, top: rect.top - margin, right: rect.right + margin, bottom: rect.bottom + margin + 52}, polygon);
}
