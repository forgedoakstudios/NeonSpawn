import { COLORS, TILE_SIZE } from '../config.js';

export function resolvePlayerAttack(player, enemy, particles) {
  enemy.takeDamage(player.attack);
  const c = enemy.centerPx;
  particles.burst(c.x, c.y, COLORS.pink, 10, { life: 0.35, speed: 80 });
  return !enemy.alive;
}

export function resolveEnemyAttack(enemy, player, particles) {
  player.takeDamage(enemy.attack);
  const c = player.centerPx;
  particles.burst(c.x, c.y, COLORS.red, 10, { life: 0.35, speed: 80 });
}

export function enemyAt(enemies, gx, gy) {
  return enemies.find((e) => e.alive && e.gridX === gx && e.gridY === gy);
}

export function drawHealthBar(renderer, entity) {
  if (entity.hp >= entity.maxHp) return;
  const pct = Math.max(0, entity.hp / entity.maxHp);
  const w = TILE_SIZE - 6;
  const x = entity.pixelX + 3;
  const y = entity.pixelY - 6;
  const ctx = renderer.ctx;
  const screen = renderer.worldToScreen(x, y);
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(screen.x, screen.y, w, 4);
  ctx.fillStyle = pct > 0.4 ? COLORS.green : COLORS.red;
  ctx.fillRect(screen.x, screen.y, w * pct, 4);
  ctx.restore();
}
