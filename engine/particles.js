import { TILE_SIZE } from './constants.js';
import { canvas, ctx } from './canvas.js';

class Particle {
  x;
  y;
  vx;
  vy;
  life;
  maxLife;
  size;
  color;

  constructor(x, y, vx, vy, life, size, color) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.life = life;
    this.maxLife = life;
    this.size = size;
    this.color = color;
  }

  update(dt) {
    this.life -= dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += 300 * dt; // gravity
  }

  get alive() {
    return this.life > 0;
  }

  get alpha() {
    return Math.max(0, this.life / this.maxLife);
  }
}

export class ParticleSystem {
  /** @type {Particle[]} */
  #particles = [];

  /**
   * Emit a burst of particles.
   * @param {number} x - World X
   * @param {number} y - World Y
   * @param {number} count
   * @param {object} options
   * @param {string} [options.color] - CSS color
   * @param {number} [options.speed] - Base speed
   * @param {number} [options.life] - Lifetime in seconds
   * @param {number} [options.size] - Pixel size
   */
  emit(x, y, count, options = {}) {
    const {
      color = '#8B5E3C',
      speed = 150,
      life = 0.6,
      size = 4,
    } = options;

    const colors = ['#8B5E3C', '#A0724B', '#6B4226', '#5C3317', '#3A7D2C'];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = speed * (0.3 + Math.random() * 0.7);
      const c = options.color || colors[Math.floor(Math.random() * colors.length)];
      this.#particles.push(new Particle(
        x + (Math.random() - 0.5) * 8,
        y + (Math.random() - 0.5) * 8,
        Math.cos(angle) * spd,
        Math.sin(angle) * spd - 100,
        life * (0.5 + Math.random() * 0.5),
        size * (0.5 + Math.random() * 0.5),
        c,
      ));
    }
  }

  update(dt) {
    for (let i = this.#particles.length - 1; i >= 0; i--) {
      this.#particles[i].update(dt);
      if (!this.#particles[i].alive) {
        this.#particles.splice(i, 1);
      }
    }
  }

  /**
   * Draw all particles (screen coords).
   * @param {number} ox - Camera offset X in world coords
   * @param {number} oy - Camera offset Y in world coords
   */
  render(ox, oy) {
    for (const p of this.#particles) {
      const sx = Math.round(p.x - ox + canvas.width / 2);
      const sy = Math.round(p.y - oy + canvas.height / 2);
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(sx - p.size / 2, sy - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }
}
