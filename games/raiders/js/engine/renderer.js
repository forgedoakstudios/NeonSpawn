import { TILE_SIZE, VIEW_W, VIEW_H, COLORS } from '../config.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.camera = { x: 0, y: 0 };
  }

  followCamera(targetPx, mapWidthPx, mapHeightPx) {
    let cx = targetPx.x - VIEW_W / 2;
    let cy = targetPx.y - VIEW_H / 2;
    cx = Math.max(0, Math.min(cx, Math.max(0, mapWidthPx - VIEW_W)));
    cy = Math.max(0, Math.min(cy, Math.max(0, mapHeightPx - VIEW_H)));
    this.camera.x = cx;
    this.camera.y = cy;
  }

  clear() {
    const ctx = this.ctx;
    ctx.fillStyle = COLORS.dark;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }

  worldToScreen(x, y) {
    return { x: x - this.camera.x, y: y - this.camera.y };
  }

  drawSprite(img, worldX, worldY, opts = {}) {
    const { x, y } = this.worldToScreen(worldX, worldY);
    if (x < -TILE_SIZE || y < -TILE_SIZE || x > VIEW_W + TILE_SIZE || y > VIEW_H + TILE_SIZE) return;
    const ctx = this.ctx;
    ctx.save();
    if (opts.alpha !== undefined) ctx.globalAlpha = opts.alpha;
    if (opts.flip) {
      ctx.translate(x + TILE_SIZE, y);
      ctx.scale(-1, 1);
      ctx.drawImage(img, 0, 0, TILE_SIZE, TILE_SIZE);
    } else {
      ctx.drawImage(img, x, y, TILE_SIZE, TILE_SIZE);
    }
    ctx.restore();
  }

  fillTile(worldX, worldY, color, alpha = 1) {
    const { x, y } = this.worldToScreen(worldX, worldY);
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    ctx.restore();
  }

  circle(worldX, worldY, radius, color, alpha = 1) {
    const { x, y } = this.worldToScreen(worldX, worldY);
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  text(str, worldX, worldY, opts = {}) {
    const { x, y } = this.worldToScreen(worldX, worldY);
    const ctx = this.ctx;
    ctx.save();
    ctx.font = opts.font || '12px "Share Tech Mono", monospace';
    ctx.fillStyle = opts.color || COLORS.text;
    ctx.textAlign = opts.align || 'center';
    if (opts.glow) {
      ctx.shadowColor = opts.glow;
      ctx.shadowBlur = 6;
    }
    ctx.fillText(str, x, y);
    ctx.restore();
  }
}
