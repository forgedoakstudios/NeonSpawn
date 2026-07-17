import { COLORS, TILE_SIZE } from '../config.js';

// ─────────────────────────────────────────────────────────────
// Placeholder art generators. Every entry here draws a stylised
// neon-glow icon onto an offscreen canvas. Real art dropped into
// assets/sprites, assets/tiles, assets/ui will silently replace
// these the moment a matching file exists (see manifest below).
// ─────────────────────────────────────────────────────────────

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function glow(ctx, color, blur, draw) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  draw();
  ctx.restore();
}

const PLACEHOLDERS = {
  player(size) {
    const c = canvas(size, size);
    const ctx = c.getContext('2d');
    const cx = size / 2, cy = size / 2;
    glow(ctx, COLORS.cyan, 8, () => {
      ctx.fillStyle = COLORS.cyan;
      ctx.beginPath();
      ctx.arc(cx, cy - size * 0.12, size * 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx, cy - size * 0.02);
      ctx.lineTo(cx - size * 0.22, cy + size * 0.34);
      ctx.lineTo(cx + size * 0.22, cy + size * 0.34);
      ctx.closePath();
      ctx.fill();
    });
    return c;
  },
  enemy_grunt(size) {
    const c = canvas(size, size);
    const ctx = c.getContext('2d');
    const cx = size / 2, cy = size / 2;
    glow(ctx, COLORS.pink, 8, () => {
      ctx.fillStyle = COLORS.pink;
      ctx.beginPath();
      ctx.moveTo(cx, cy - size * 0.32);
      ctx.lineTo(cx + size * 0.3, cy);
      ctx.lineTo(cx, cy + size * 0.32);
      ctx.lineTo(cx - size * 0.3, cy);
      ctx.closePath();
      ctx.fill();
    });
    ctx.fillStyle = '#000';
    ctx.fillRect(cx - size * 0.12, cy - size * 0.06, size * 0.08, size * 0.08);
    ctx.fillRect(cx + size * 0.04, cy - size * 0.06, size * 0.08, size * 0.08);
    return c;
  },
  enemy_brute(size) {
    const c = canvas(size, size);
    const ctx = c.getContext('2d');
    const cx = size / 2, cy = size / 2;
    glow(ctx, COLORS.purple, 10, () => {
      ctx.fillStyle = COLORS.purple;
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.34, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.strokeStyle = COLORS.yellow;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.34, 0, Math.PI * 2);
    ctx.stroke();
    return c;
  },
  tile_floor(size) {
    const c = canvas(size, size);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#0B0B1A';
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = 'rgba(0,255,209,0.06)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, size - 1, size - 1);
    return c;
  },
  tile_wall(size) {
    const c = canvas(size, size);
    const ctx = c.getContext('2d');
    ctx.fillStyle = COLORS.edge;
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = 'rgba(255,45,120,0.18)';
    ctx.lineWidth = 1;
    ctx.strokeRect(1, 1, size - 2, size - 2);
    ctx.fillStyle = 'rgba(155,48,255,0.10)';
    ctx.fillRect(2, 2, size - 4, (size - 4) / 2 - 1);
    return c;
  },
  chest_closed(size) {
    const c = canvas(size, size);
    const ctx = c.getContext('2d');
    glow(ctx, COLORS.yellow, 10, () => {
      ctx.fillStyle = '#5C4600';
      ctx.fillRect(size * 0.18, size * 0.4, size * 0.64, size * 0.42);
      ctx.fillStyle = COLORS.yellow;
      ctx.fillRect(size * 0.18, size * 0.36, size * 0.64, size * 0.1);
      ctx.fillRect(size * 0.46, size * 0.4, size * 0.08, size * 0.42);
    });
    return c;
  },
  chest_open(size) {
    const c = canvas(size, size);
    const ctx = c.getContext('2d');
    glow(ctx, COLORS.green, 12, () => {
      ctx.fillStyle = '#5C4600';
      ctx.fillRect(size * 0.18, size * 0.46, size * 0.64, size * 0.36);
      ctx.fillStyle = COLORS.green;
      ctx.fillRect(size * 0.16, size * 0.24, size * 0.68, size * 0.1);
      ctx.beginPath();
      ctx.arc(size * 0.5, size * 0.3, size * 0.14, Math.PI, 0);
      ctx.fill();
    });
    return c;
  },
  loot_gem(size) {
    const c = canvas(size, size);
    const ctx = c.getContext('2d');
    const cx = size / 2, cy = size / 2;
    glow(ctx, COLORS.yellow, 10, () => {
      ctx.fillStyle = COLORS.yellow;
      ctx.beginPath();
      ctx.moveTo(cx, cy - size * 0.24);
      ctx.lineTo(cx + size * 0.18, cy - size * 0.04);
      ctx.lineTo(cx, cy + size * 0.24);
      ctx.lineTo(cx - size * 0.18, cy - size * 0.04);
      ctx.closePath();
      ctx.fill();
    });
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, cy - size * 0.24);
    ctx.lineTo(cx, cy + size * 0.24);
    ctx.stroke();
    return c;
  },
  exit_portal(size) {
    const c = canvas(size, size);
    const ctx = c.getContext('2d');
    const cx = size / 2, cy = size / 2;
    glow(ctx, COLORS.purple, 16, () => {
      ctx.strokeStyle = COLORS.purple;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(cx, cy, size * 0.32, size * 0.4, 0, 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.strokeStyle = COLORS.cyan;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, size * 0.2, size * 0.26, 0, 0, Math.PI * 2);
    ctx.stroke();
    return c;
  },
  shopkeeper(size) {
    const c = canvas(size, size);
    const ctx = c.getContext('2d');
    const cx = size / 2, cy = size / 2;
    glow(ctx, COLORS.yellow, 8, () => {
      ctx.fillStyle = COLORS.yellow;
      ctx.beginPath();
      ctx.arc(cx, cy - size * 0.14, size * 0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx - size * 0.26, cy + size * 0.36);
      ctx.lineTo(cx + size * 0.26, cy + size * 0.36);
      ctx.closePath();
      ctx.fill();
    });
    ctx.strokeStyle = COLORS.purple;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.2, cy + size * 0.1);
    ctx.lineTo(cx + size * 0.2, cy + size * 0.1);
    ctx.stroke();
    return c;
  },
  spell_bolt(size) {
    const c = canvas(size, size);
    const ctx = c.getContext('2d');
    const cx = size / 2, cy = size / 2;
    glow(ctx, COLORS.purple, 14, () => {
      ctx.fillStyle = COLORS.purple;
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.16, 0, Math.PI * 2);
      ctx.fill();
    });
    glow(ctx, COLORS.cyan, 10, () => {
      ctx.fillStyle = COLORS.cyan;
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.08, 0, Math.PI * 2);
      ctx.fill();
    });
    return c;
  },
};

const MANIFEST = {
  player:        { src: 'sprites/player.png',       size: TILE_SIZE },
  enemy_grunt:   { src: 'sprites/enemy_grunt.png',   size: TILE_SIZE },
  enemy_brute:   { src: 'sprites/enemy_brute.png',   size: TILE_SIZE },
  shopkeeper:    { src: 'sprites/shopkeeper.png',    size: TILE_SIZE },
  tile_floor:    { src: 'tiles/floor.png',           size: TILE_SIZE },
  tile_wall:     { src: 'tiles/wall.png',            size: TILE_SIZE },
  chest_closed:  { src: 'ui/chest_closed.png',       size: TILE_SIZE },
  chest_open:    { src: 'ui/chest_open.png',         size: TILE_SIZE },
  exit_portal:   { src: 'ui/exit_portal.png',        size: TILE_SIZE },
  loot_gem:      { src: 'ui/loot_gem.png',           size: TILE_SIZE },
  spell_bolt:    { src: 'ui/spell_bolt.png',         size: TILE_SIZE },
};

export class AssetLoader {
  constructor(basePath) {
    this.basePath = basePath;
    this.images = {};
  }

  async loadAll() {
    const jobs = Object.entries(MANIFEST).map(([key, def]) => this._loadOne(key, def));
    await Promise.all(jobs);
  }

  _loadOne(key, def) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => { this.images[key] = img; resolve(); };
      img.onerror = () => { this.images[key] = PLACEHOLDERS[key](def.size); resolve(); };
      img.src = `${this.basePath}${def.src}`;
    });
  }

  get(key) {
    return this.images[key];
  }
}
