import { TILE_SIZE } from './constants.js';
import { canvas, ctx } from './canvas.js';

export class Renderer {
  /** @type {import('./asset-loader.js').AssetLoader} */
  #assets;

  constructor(assets) {
    this.#assets = assets;
  }

  /**
   * Render the game world.
   * @param {import('./game-object.js').GameObject[]} objects - Visible objects sorted by z
   * @param {import('./player.js').Player} player
   */
  render(objects, player) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;

    // Draw world objects
    for (let i = 0; i < objects.length; i++) {
      const obj = objects[i];
      if (!obj.visible) continue;

      if (obj.onRender) {
        obj.onRender();
      }

      const screenX = (obj.x - obj.sizeX * TILE_SIZE) + (canvas.width / 2) - player.x;
      const screenY = (obj.y - obj.sizeY * TILE_SIZE) + (canvas.height / 2) - player.y;
      const width = TILE_SIZE * obj.sizeX;
      const height = TILE_SIZE * obj.sizeY;

      const img = this.#assets.getByIndex(obj.texture);
      if (img) {
        ctx.drawImage(img, screenX, screenY, width, height);
      }
    }

    // Draw player centered on screen
    const px = (canvas.width / 2) - (TILE_SIZE / 2);
    const py = (canvas.height / 2) - (TILE_SIZE / 2);

    const headImg = this.#assets.getByIndex(player.textureHead);
    const bodyImg = this.#assets.getByIndex(player.textureBody);

    if (headImg) ctx.drawImage(headImg, px, py, TILE_SIZE, TILE_SIZE);
    if (bodyImg) ctx.drawImage(bodyImg, px, py, TILE_SIZE, TILE_SIZE);

    // HUD
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.font = '16px monospace';
    ctx.fillText(`Objects: ${objects.length}`, 50, 50);
  }
}
