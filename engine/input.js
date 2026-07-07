export class InputManager {
  #keys = new Set();
  #justPressed = new Set();
  #mouse = { x: 0, y: 0 };
  #justClicked = false;
  #justRightClicked = false;
  #mouseDown = false;
  #justMouseDown = false;
  #justMouseUp = false;
  #wheelDelta = 0;
  #bound = {
    keydown: null,
    keyup: null,
    mousemove: null,
    mousedown: null,
    mouseup: null,
    click: null,
    contextmenu: null,
    wheel: null,
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
    this.#bound.contextmenu = (e) => {
      e.preventDefault();
      this.#mouse = { x: e.offsetX, y: e.offsetY };
      this.#justRightClicked = true;
    };
    this.#bound.wheel = (e) => {
      e.preventDefault();
      this.#wheelDelta += Math.sign(e.deltaY);
    };

    document.addEventListener('keydown', this.#bound.keydown);
    document.addEventListener('keyup', this.#bound.keyup);
    document.addEventListener('mousemove', this.#bound.mousemove);
    document.addEventListener('mousedown', this.#bound.mousedown);
    document.addEventListener('mouseup', this.#bound.mouseup);
    document.addEventListener('click', this.#bound.click);
    document.addEventListener('contextmenu', this.#bound.contextmenu);
    document.addEventListener('wheel', this.#bound.wheel, { passive: false });
  }

  destroy() {
    document.removeEventListener('keydown', this.#bound.keydown);
    document.removeEventListener('keyup', this.#bound.keyup);
    document.removeEventListener('mousemove', this.#bound.mousemove);
    document.removeEventListener('mousedown', this.#bound.mousedown);
    document.removeEventListener('mouseup', this.#bound.mouseup);
    document.removeEventListener('click', this.#bound.click);
    document.removeEventListener('wheel', this.#bound.wheel);
  }

  /** Call at end of each frame to clear single-press events. */
  endFrame() {
    this.#justPressed.clear();
    this.#justClicked = false;
    this.#justRightClicked = false;
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

  /** Returns true once per right click, then clears. */
  consumeRightClick() {
    const c = this.#justRightClicked;
    this.#justRightClicked = false;
    return c;
  }

  get justRightClicked() {
    return this.#justRightClicked;
  }

  /**
   * Consume scroll wheel delta (negative = scroll up, positive = scroll down).
   * @returns {number} accumulated wheel delta, reset to 0 each frame
   */
  consumeWheel() {
    const delta = this.#wheelDelta;
    this.#wheelDelta = 0;
    return delta;
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
