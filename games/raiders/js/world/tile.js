import { TILE, DUNGEON_W, DUNGEON_H } from '../config.js';

export class TileMap {
  constructor(w = DUNGEON_W, h = DUNGEON_H) {
    this.w = w;
    this.h = h;
    this.grid = new Uint8Array(w * h).fill(TILE.VOID);
  }

  idx(x, y) {
    return y * this.w + x;
  }

  inBounds(x, y) {
    return x >= 0 && y >= 0 && x < this.w && y < this.h;
  }

  get(x, y) {
    if (!this.inBounds(x, y)) return TILE.VOID;
    return this.grid[this.idx(x, y)];
  }

  set(x, y, val) {
    if (!this.inBounds(x, y)) return;
    this.grid[this.idx(x, y)] = val;
  }

  isWalkable(x, y) {
    const t = this.get(x, y);
    return t === TILE.FLOOR || t === TILE.DOOR || t === TILE.CHEST || t === TILE.EXIT;
  }

  isSolid(x, y) {
    return !this.isWalkable(x, y);
  }
}
