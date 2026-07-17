export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  burst(x, y, color, count = 8, opts = {}) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (opts.speed || 60) + Math.random() * (opts.speedVar || 60);
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: opts.life || 0.4,
        maxLife: opts.life || 0.4,
        color,
        size: opts.size || 3,
      });
    }
  }

  update(dt) {
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.92;
      p.vy *= 0.92;
      p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
  }

  render(renderer) {
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      renderer.circle(p.x, p.y, p.size * alpha + 0.5, p.color, alpha);
    }
  }
}
