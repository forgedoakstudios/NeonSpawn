function hasLineOfSight(tileMap, x0, y0, x1, y1) {
  const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  let guard = 0;
  while (!(x0 === x1 && y0 === y1) && guard++ < 64) {
    if (tileMap.isSolid(x0, y0)) return false;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x0 += sx; }
    if (e2 < dx) { err += dx; y0 += sy; }
  }
  return true;
}

export class FogOfWar {
  constructor(radius = 7) {
    this.radius = radius;
    this.visible = new Set();
    this.discovered = new Set();
  }

  update(tileMap, px, py) {
    this.visible.clear();
    const r = this.radius;
    for (let y = py - r; y <= py + r; y++) {
      for (let x = px - r; x <= px + r; x++) {
        if (!tileMap.inBounds(x, y)) continue;
        if (Math.hypot(x - px, y - py) > r) continue;
        if (hasLineOfSight(tileMap, px, py, x, y)) {
          const key = `${x},${y}`;
          this.visible.add(key);
          this.discovered.add(key);
        }
      }
    }
  }

  stateAt(x, y) {
    const key = `${x},${y}`;
    if (this.visible.has(key)) return 'visible';
    if (this.discovered.has(key)) return 'discovered';
    return 'hidden';
  }
}
