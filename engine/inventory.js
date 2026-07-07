export class Inventory {
  /** @type {Map<string, number>} */
  #items = new Map();

  /**
   * @param {string} itemType - key from ITEMS
   * @param {number} count
   */
  add(itemType, count) {
    const current = this.#items.get(itemType) || 0;
    this.#items.set(itemType, current + count);
  }

  /**
   * @param {string} itemType
   * @returns {number}
   */
  getCount(itemType) {
    return this.#items.get(itemType) || 0;
  }

  /**
   * @returns {[string, number][]}
   */
  getAll() {
    return [...this.#items.entries()];
  }

  /**
   * Render inventory UI at bottom-right of screen.
   * @param {CanvasRenderingContext2D} ctx
   */
  render(ctx) {
    const items = this.getAll();
    if (items.length === 0) return;

    ctx.save();
    ctx.font = '14px monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';

    let y = ctx.canvas.height - 20;

    for (const [type, count] of items) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(ctx.canvas.width - 160, y - 4, 145, 22);

      ctx.fillStyle = '#fff';
      ctx.fillText(`${type.toLowerCase()}: ${count}`, ctx.canvas.width - 20, y + 14);
      y -= 28;
    }

    ctx.restore();
  }
}
