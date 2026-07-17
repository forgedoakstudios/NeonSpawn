import { Entity } from './entity.js';

export class Player extends Entity {
  constructor(gridX, gridY) {
    super(gridX, gridY, 'player');
    this.maxHp = 6;
    this.hp = this.maxHp;
    this.attack = 1;
    this.attackCooldown = 0;
    this.moveCooldown = 0;
    this.spellCooldown = 0;
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    this.hurtFlash = 0.25;
    if (this.hp <= 0) this.alive = false;
  }

  update(dt) {
    super.update(dt);
    if (this.attackCooldown > 0) this.attackCooldown -= dt;
    if (this.moveCooldown > 0) this.moveCooldown -= dt;
  }
}
