export class GameObject {
  x = 0;
  y = 0;
  z = 0;
  texture = 0;
  textureHover = 0;
  collision = false;
  visible = true;
  shading = false;
  sizeX = 1;
  sizeY = 1;
  /** @type {Animation|null} */
  animation = null;
  /** @type {function|null} */
  onRender = null;
  name = '';
  /** Tree/resource health */
  hp = 1;
  hpMax = 1;
  /** @type {{ time: number, offsetX: number, offsetY: number, intensity: number }|null} */
  shake = null;

  constructor(options = {}) {
    Object.assign(this, options);
    if (this.hpMax > 1 && this.hp === 1) {
      this.hp = this.hpMax;
    }
    if (this.textureHover === 0 && this.texture !== 0) {
      this.textureHover = this.texture;
    }
  }

  /**
   * Apply damage and return true if still alive.
   * @param {number} damage
   * @param {number} [shakeIntensity]
   */
  hit(damage = 1, shakeIntensity = 4) {
    this.hp -= damage;
    this.shake = { time: 0.15, offsetX: 0, offsetY: 0, intensity: shakeIntensity };
    return this.hp > 0;
  }

  updateShake(dt) {
    if (!this.shake) return;
    this.shake.time -= dt;
    if (this.shake.time <= 0) {
      this.shake = null;
    } else {
      this.shake.offsetX = (Math.random() - 0.5) * 2 * this.shake.intensity;
      this.shake.offsetY = (Math.random() - 0.5) * 2 * this.shake.intensity;
    }
  }
}

export class Animation {
  name;
  #frames;
  speed;
  playing = false;
  frame = 0;
  #texture;

  constructor(name, frames, speed) {
    this.name = name;
    this.#frames = frames;
    this.speed = speed;
    this.#texture = frames[0];
  }

  get texture() {
    return this.#texture;
  }

  play() {
    this.playing = true;
  }

  stop() {
    this.playing = false;
  }

  reset() {
    this.frame = 0;
  }

  tick() {
    if (!this.playing) return;
    this.frame += this.speed;
    if (this.frame >= this.#frames.length - 0.5) {
      this.frame = 0;
    }
    this.#texture = this.#frames[Math.floor(this.frame)];
  }
}
