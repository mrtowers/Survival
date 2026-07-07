export class InputManager {
  #keys = new Set();
  #mouse = { x: 0, y: 0 };
  #justClicked = false;
  #bound = {
    keydown: null,
    keyup: null,
    mousemove: null,
    click: null,
  };

  init() {
    this.#bound.keydown = (e) => this.#keys.add(e.key);
    this.#bound.keyup = (e) => this.#keys.delete(e.key);
    this.#bound.mousemove = (e) => {
      this.#mouse = { x: e.offsetX, y: e.offsetY };
    };
    this.#bound.click = () => {
      this.#justClicked = true;
    };

    document.addEventListener('keydown', this.#bound.keydown);
    document.addEventListener('keyup', this.#bound.keyup);
    document.addEventListener('mousemove', this.#bound.mousemove);
    document.addEventListener('click', this.#bound.click);
  }

  destroy() {
    document.removeEventListener('keydown', this.#bound.keydown);
    document.removeEventListener('keyup', this.#bound.keyup);
    document.removeEventListener('mousemove', this.#bound.mousemove);
    document.removeEventListener('click', this.#bound.click);
  }

  isDown(key) {
    return this.#keys.has(key);
  }

  /** Returns true once per click, then clears. */
  consumeClick() {
    const c = this.#justClicked;
    this.#justClicked = false;
    return c;
  }

  get mouseX() {
    return this.#mouse.x;
  }

  get mouseY() {
    return this.#mouse.y;
  }
}
