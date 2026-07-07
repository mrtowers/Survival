const BAR_WIDTH = 150;
const BAR_HEIGHT = 18;
const BAR_GAP = 4;
const PADDING = 10;
const PULSE_SPEED = 4;

/**
 * HUD that renders HP, Food, and Water status bars.
 */
export class HUD {
  /** @param {CanvasRenderingContext2D} ctx */
  render(ctx, player) {
    const x = PADDING;
    let y = PADDING;

    this.#drawBar(ctx, x, y, 'HP', player.hp, player.maxHp, '#CC3333', '#FF5555', player.isLowHealth);
    y += BAR_HEIGHT + BAR_GAP;

    this.#drawBar(ctx, x, y, 'FOOD', player.food, player.maxFood, '#8B5E3C', '#CC8844', false);
    y += BAR_HEIGHT + BAR_GAP;

    this.#drawBar(ctx, x, y, 'WATER', player.water, player.maxWater, '#3366AA', '#4488DD', false);
  }

  /**
   * Draw a single status bar.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x
   * @param {number} y
   * @param {string} label
   * @param {number} value
   * @param {number} max
   * @param {string} darkColor
   * @param {string} lightColor
   * @param {boolean} pulse - Whether to pulse/flash
   */
  #drawBar(ctx, x, y, label, value, max, darkColor, lightColor, pulse) {
    const ratio = Math.max(0, Math.min(1, value / max));
    const fillW = Math.round(BAR_WIDTH * ratio);

    // Pulse effect for low health
    let fillColor = lightColor;
    if (pulse) {
      const flash = Math.sin(performance.now() / 1000 * PULSE_SPEED) * 0.3 + 0.7;
      fillColor = `rgba(255, 50, 50, ${flash})`;
    }

    // Background
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1.5;
    this.#roundRect(ctx, x, y, BAR_WIDTH, BAR_HEIGHT, 3);
    ctx.fill();
    ctx.stroke();

    // Fill
    if (fillW > 0) {
      ctx.fillStyle = fillColor;
      this.#roundRect(ctx, x + 1, y + 1, fillW - (fillW < BAR_WIDTH ? 0 : 2), BAR_HEIGHT - 2, 2);
      ctx.fill();
    }

    // Label
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.lineWidth = 2;
    const labelText = `${label}: ${Math.round(value)}/${max}`;
    ctx.strokeText(labelText, x + 5, y + BAR_HEIGHT / 2);
    ctx.fillText(labelText, x + 5, y + BAR_HEIGHT / 2);

    ctx.restore();
  }

  /** Draw a rounded rectangle path. */
  #roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}
