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

  constructor(options = {}) {
    Object.assign(this, options);
    if (this.textureHover === 0 && this.texture !== 0) {
      this.textureHover = this.texture;
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
