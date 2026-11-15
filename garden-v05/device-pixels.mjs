// Code-drawn garden layers (paths, weather accents, soil, fences) render under the surface density as a ctx transform.
// At density d > 1 they snap to device pixels (1/d logical) for HD detail; at density 1 every rectangle is the 1× one.
export function densityOf(ctx) {
  const a = Math.abs(Number(ctx?.getTransform?.()?.a));
  return Number.isFinite(a) && a > 0 ? a : 1;
}

export function fillAt(ctx, x, y, width, height, color, d = 1) {
  const snap = (v) => Math.round(v * d) / d;
  ctx.fillStyle = color;
  ctx.fillRect(snap(x), snap(y), Math.max(1 / d, snap(width)), Math.max(1 / d, snap(height)));
}
