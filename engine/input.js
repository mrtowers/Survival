export class InputManager {
  #keys = new Set();
  #justPressed = new Set();
  #mouse = { x: 0, y: 0 };
  #justClicked = false;
  #mouseDown = false;
  #justMouseDown = false;
  #justMouseUp = false;
  #bound = {
    keydown: null,
    keyup: null,
    mousemove: null,
    mousedown: null,
    mouseup: null,
    click: null,
  };

  init() {
    this.#bound.keydown = (e) => {
      if (!this.#keys.has(e.key)) {
        this.#justPressed.add(e.key);
      }
      this.#keys.add(e.key);
    };
    this.#bound.keyup = (e) => this.#keys.delete(e.key);
    this.#bound.mousemove = (e) => {
      this.#mouse = { x: e.offsetX, y: e.offsetY };
    };
    this.#bound.mousedown = (e) => {
      this.#mouse = { x: e.offsetX, y: e.offsetY };
      this.#mouseDown = true;
      this.#justMouseDown = true;
    };
    this.#bound.mouseup = (e) => {
      this.#mouse = { x: e.offsetX, y: e.offsetY };
      this.#mouseDown = false;
      this.#justMouseUp = true;
    };
    this.#bound.click = () => {
      this.#justClicked = true;
    };

    document.addEventListener('keydown', this.#bound.keydown);
    document.addEventListener('keyup', this.#bound.keyup);
    document.addEventListener('mousemove', this.#bound.mousemove);
    document.addEventListener('mousedown', this.#bound.mousedown);
    document.addEventListener('mouseup', this.#bound.mouseup);
    document.addEventListener('click', this.#bound.click);
  }

  destroy() {
    document.removeEventListener('keydown', this.#bound.keydown);
    document.removeEventListener('keyup', this.#bound.keyup);
    document.removeEventListener('mousemove', this.#bound.mousemove);
    document.removeEventListener('mousedown', this.#bound.mousedown);
    document.removeEventListener('mouseup', this.#bound.mouseup);
    document.removeEventListener('click', this.#bound.click);
  }

  /** Call at end of each frame to clear single-press events. */
  endFrame() {
    this.#justPressed.clear();
    this.#justClicked = false;
    this.#justMouseDown = false;
    this.#justMouseUp = false;
  }

  isDown(key) {
    return this.#keys.has(key);
  }

  /** Returns true once per key press, then clears. */
  consumeKey(key) {
    if (this.#justPressed.has(key)) {
      this.#justPressed.delete(key);
      return true;
    }
    return false;
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

  get isMouseDown() {
    return this.#mouseDown;
  }

  get justMouseDown() {
    return this.#justMouseDown;
  }

  get justMouseUp() {
    return this.#justMouseUp;
  }
}
