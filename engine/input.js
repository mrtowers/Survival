export class InputManager {
  #keys = new Set();
  #mouse = { x: 0, y: 0 };
  #bound = {
    keydown: null,
    keyup: null,
    mousemove: null,
  };

  init() {
    this.#bound.keydown = (e) => this.#keys.add(e.key);
    this.#bound.keyup = (e) => this.#keys.delete(e.key);
    this.#bound.mousemove = (e) => {
      this.#mouse = { x: e.offsetX, y: e.offsetY };
    };

    document.addEventListener('keydown', this.#bound.keydown);
    document.addEventListener('keyup', this.#bound.keyup);
    document.addEventListener('mousemove', this.#bound.mousemove);
  }

  destroy() {
    document.removeEventListener('keydown', this.#bound.keydown);
    document.removeEventListener('keyup', this.#bound.keyup);
    document.removeEventListener('mousemove', this.#bound.mousemove);
  }

  isDown(key) {
    return this.#keys.has(key);
  }

  get mouseX() {
    return this.#mouse.x;
  }

  get mouseY() {
    return this.#mouse.y;
  }
}
