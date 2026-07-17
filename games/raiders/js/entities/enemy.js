import { Entity } from './entity.js';

const TYPES = {
  grunt: { hp: 2, attack: 1, spriteKey: 'enemy_grunt', speedMul: 1.0, moveInterval: 0.5, detectRadius: 6 },
  brute: { hp: 4, attack: 2, spriteKey: 'enemy_brute', speedMul: 0.7, moveInterval: 0.7, detectRadius: 5 },
};

export class Enemy extends Entity {
  constructor(gridX, gridY, type = 'grunt') {
    const def = TYPES[type] || TYPES.grunt;
    super(gridX, gridY, def.spriteKey);
    this.type = type;
    this.def = def;
    this.maxHp = def.hp;
    this.hp = def.hp;
    this.attack = def.attack;
    this.moveSpeed *= def.speedMul;
    this.moveTimer = Math.random() * def.moveInterval;
    this.attackTimer = 0;
    this.attackInterval = 0.9;
  }

  takeDamage(amount) {
    this.hp -= amount;
    this.hurtFlash = 0.15;
    if (this.hp <= 0) this.alive = false;
  }

  hasLineOfSight(tileMap, tx, ty) {
    let x0 = this.gridX, y0 = this.gridY;
    const x1 = tx, y1 = ty;
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

  aiTick(dt, tileMap, player, occupied) {
    if (!this.alive) return null;
    this.moveTimer -= dt;
    if (this.attackTimer > 0) this.attackTimer -= dt;

    const dist = Math.hypot(player.gridX - this.gridX, player.gridY - this.gridY);
    if (dist <= 1.01) {
      if (this.attackTimer <= 0) {
        this.attackTimer = this.attackInterval;
        return 'attack';
      }
      return null;
    }

    if (this.moving || this.moveTimer > 0) return null;
    this.moveTimer = this.def.moveInterval;

    let dx = 0, dy = 0;
    if (dist <= this.def.detectRadius && this.hasLineOfSight(tileMap, player.gridX, player.gridY)) {
      dx = Math.sign(player.gridX - this.gridX);
      dy = Math.sign(player.gridY - this.gridY);
    } else if (Math.random() < 0.5) {
      const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      [dx, dy] = dirs[Math.floor(Math.random() * dirs.length)];
    } else {
      return null;
    }

    const tryMoves = Math.abs(dx) > Math.abs(dy)
      ? [[dx, 0], [0, dy]]
      : [[0, dy], [dx, 0]];

    for (const [mx, my] of tryMoves) {
      if (mx === 0 && my === 0) continue;
      const nx = this.gridX + mx, ny = this.gridY + my;
      if (tileMap.isSolid(nx, ny)) continue;
      if (occupied.has(`${nx},${ny}`)) continue;
      if (nx === player.gridX && ny === player.gridY) continue;
      this.startMoveTo(nx, ny);
      return null;
    }
    return null;
  }
}
