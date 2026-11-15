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

// A pixel line at device pixels: the same width × width brush, stepped every device pixel, so a 2:1 rail or edge
// gets 1 px stairs instead of 1× blocks. `offset` is where the brush sits on the line (its module's 1× convention).
export function deviceLine(ctx, a, b, color, width = 1, d = 1, offset = width / 2) {
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])) * d));
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    fillAt(ctx, a[0] + (b[0] - a[0]) * t - offset, a[1] + (b[1] - a[1]) * t - offset, width, width, color, d);
  }
}

// For drawers written with integer fillRects: the same calls, each rectangle snapped to device pixels (at 1.5 an
// integer edge falls mid-pixel and would blur).
export function snapRects(ctx, d) {
  return new Proxy(ctx, {
    get(target, key) {
      if (key === 'fillRect') return (x, y, w, h) => fillAt(target, x, y, w, h, target.fillStyle, d);
      const value = target[key];
      return typeof value === 'function' ? value.bind(target) : value;
    },
    set(target, key, value) { target[key] = value; return true; },
  });
}
