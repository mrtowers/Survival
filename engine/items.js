export const ITEMS = {
  WOOD: { name: 'Wood', color: '#8B5E3C' },
  STONE: { name: 'Stone', color: '#808080' },
};

const GRAVITY = 500;
const BOUNCE = 0.4;
const FRICTION = 0.85;
const SETTLE_VEL = 8;
const MAGNET_RANGE = 120;
const MAGNET_ACCEL = 600;
const COLLECT_DIST = 12;

export class GroundItem {
  x;
  y;
  vx = 0;
  vy = 0;
  rotation = 0;
  rotationSpeed = 0;
  scaleTarget = 1;
  /** @type {'falling'|'resting'|'magnet'} */
  state = 'falling';
  groundY;
  /** @type {keyof ITEMS} */
  itemType;
  quantity;

  constructor(x, y, itemType, quantity) {
    this.x = x;
    this.y = y;
    this.groundY = y;
    this.itemType = itemType;
    this.quantity = quantity;

    // Random ejection velocity
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.8;
    const speed = 120 + Math.random() * 100;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotationSpeed = (Math.random() - 0.5) * 8;
  }

  get color() {
    return ITEMS[this.itemType].color;
  }

  get label() {
    return ITEMS[this.itemType].name;
  }

  /** @returns {number} Current visual scale (bounce + magnet pulse) */
  get scale() {
    return this.scaleTarget;
  }

  /**
   * @param {number} dt
   * @param {number} playerX
   * @param {number} playerY
   * @returns {boolean} true if collected (should be removed)
   */
  update(dt, playerX, playerY) {
    if (this.state === 'falling') {
      this.vy += GRAVITY * dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.rotation += this.rotationSpeed * dt;

      // Bounce off ground
      if (this.y >= this.groundY) {
        this.y = this.groundY;
        this.vy = -this.vy * BOUNCE;
        this.vx *= FRICTION;
        this.rotationSpeed *= 0.8;

        if (Math.abs(this.vy) < SETTLE_VEL && Math.abs(this.vx) < SETTLE_VEL / 2) {
          this.vy = 0;
          this.vx = 0;
          this.rotationSpeed = 0;
          this.rotation = 0;
          this.state = 'resting';
        }
      }
    }

    if (this.state === 'resting') {
      const dx = playerX - this.x;
      const dy = playerY - this.y;
      if (dx * dx + dy * dy < MAGNET_RANGE * MAGNET_RANGE) {
        this.state = 'magnet';
      }
    }

    if (this.state === 'magnet') {
      const dx = playerX - this.x;
      const dy = playerY - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < COLLECT_DIST) {
        return true; // collected
      }

      // Magnetic pull
      const pull = MAGNET_ACCEL * (1 + 3 * (1 - dist / MAGNET_RANGE));
      this.vx += (dx / dist) * pull * dt;
      this.vy += (dy / dist) * pull * dt;
      this.vx *= 0.92;
      this.vy *= 0.92;
      this.x += this.vx * dt;
      this.y += this.vy * dt;

      // Spin and pulse while being pulled
      this.rotation += dt * 12;
      this.scaleTarget = 1 + 0.25 * Math.sin(performance.now() / 80);
    }

    return false;
  }
}
