import { TILE_SIZE } from '../config.js';

export class Entity {
  constructor(gridX, gridY, spriteKey) {
    this.gridX = gridX;
    this.gridY = gridY;
    this.pixelX = gridX * TILE_SIZE;
    this.pixelY = gridY * TILE_SIZE;
    this.spriteKey = spriteKey;
    this.moving = false;
    this.moveSpeed = TILE_SIZE * 6; // px/sec
    this.facingLeft = false;
    this.alive = true;
    this.hurtFlash = 0;
    this.bobPhase = Math.random() * Math.PI * 2;
  }

  get centerPx() {
    return { x: this.pixelX + TILE_SIZE / 2, y: this.pixelY + TILE_SIZE / 2 };
  }

  startMoveTo(gx, gy) {
    if (this.moving) return false;
    if (gx < this.gridX) this.facingLeft = true;
    if (gx > this.gridX) this.facingLeft = false;
    this.gridX = gx;
    this.gridY = gy;
    this.moving = true;
    return true;
  }

  updateMovement(dt) {
    if (!this.moving) return;
    const targetX = this.gridX * TILE_SIZE;
    const targetY = this.gridY * TILE_SIZE;
    const dx = targetX - this.pixelX;
    const dy = targetY - this.pixelY;
    const dist = Math.hypot(dx, dy);
    const step = this.moveSpeed * dt;
    if (dist <= step || dist === 0) {
      this.pixelX = targetX;
      this.pixelY = targetY;
      this.moving = false;
    } else {
      this.pixelX += (dx / dist) * step;
      this.pixelY += (dy / dist) * step;
    }
  }

  update(dt) {
    this.updateMovement(dt);
    if (this.hurtFlash > 0) this.hurtFlash -= dt;
    this.bobPhase += dt * 6;
  }

  render(renderer, assets) {
    const img = assets.get(this.spriteKey);
    if (!img) return;
    const bob = this.moving ? 0 : Math.sin(this.bobPhase) * 1.5;
    renderer.drawSprite(img, this.pixelX, this.pixelY + bob, {
      flip: this.facingLeft,
      alpha: this.hurtFlash > 0 ? 0.4 : 1,
    });
  }
}
