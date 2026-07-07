import { PLAYER_SPEED, TEXTURES } from './constants.js';
import { Animation } from './game-object.js';

export class Player {
  x = 0;
  y = 0;
  hp = 100;
  food = 100;
  water = 100;

  #animation;
  #headTexture = TEXTURES.HEAD_1;
  #bodyFrames = [
    TEXTURES.BODY_1,
    TEXTURES.BODY_1B,
    TEXTURES.BODY_1,
    TEXTURES.BODY_1C,
  ];

  constructor() {
    this.#animation = new Animation('walking', this.#bodyFrames, 0.1);
  }

  get textureHead() {
    return this.#headTexture;
  }

  get textureBody() {
    return this.#animation.texture;
  }

  update(input, delta) {
    let dx = 0;
    let dy = 0;

    if (input.isDown('w')) dy -= 1;
    if (input.isDown('s')) dy += 1;
    if (input.isDown('a')) dx -= 1;
    if (input.isDown('d')) dx += 1;

    // Normalize diagonal movement so it's not faster
    if (dx !== 0 && dy !== 0) {
      const inv = 1 / Math.SQRT2;
      dx *= inv;
      dy *= inv;
    }

    const speed = PLAYER_SPEED * delta;
    this.x += dx * speed;
    this.y += dy * speed;

    const moving = dx !== 0 || dy !== 0;
    if (moving) {
      this.#animation.play();
    } else {
      this.#animation.stop();
      this.#animation.reset();
    }
  }
}
