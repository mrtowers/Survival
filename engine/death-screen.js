import { canvas } from './canvas.js';

/**
 * Death screen overlay — shown when player dies.
 */
export class DeathScreen {
  /**
   * Render the death overlay.
   * @param {CanvasRenderingContext2D} ctx
   */
  render(ctx) {
    // Red-tinted overlay
    ctx.save();
    ctx.fillStyle = 'rgba(120, 0, 0, 0.55)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // "Nie żyjesz" text
    ctx.fillStyle = '#FF3333';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeText('Nie żyjesz', canvas.width / 2, canvas.height / 2 - 30);
    ctx.fillText('Nie żyjesz', canvas.width / 2, canvas.height / 2 - 30);

    // "Naciśnij R aby odrodzić się" text
    ctx.fillStyle = '#FFAAAA';
    ctx.font = 'bold 18px monospace';
    ctx.strokeText('Naciśnij R aby odrodzić się', canvas.width / 2, canvas.height / 2 + 25);
    ctx.fillText('Naciśnij R aby odrodzić się', canvas.width / 2, canvas.height / 2 + 25);

    ctx.restore();
  }
}
