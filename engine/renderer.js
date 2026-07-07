import { TILE_SIZE } from './constants.js';
import { canvas, ctx } from './canvas.js';

export class Renderer {
  /** @type {import('./asset-loader.js').AssetLoader} */
  #assets;

  constructor(assets) {
    this.#assets = assets;
  }

  /** @param {import('./player.js').Player} player */
  #renderPlayer(player) {
    const px = Math.round((canvas.width / 2) - (TILE_SIZE / 2));
    const py = Math.round((canvas.height / 2) - (TILE_SIZE / 2));

    const headImg = this.#assets.getByIndex(player.textureHead);
    const bodyImg = this.#assets.getByIndex(player.textureBody);

    if (bodyImg) ctx.drawImage(bodyImg, px, py, TILE_SIZE, TILE_SIZE);
    if (headImg) ctx.drawImage(headImg, px, py, TILE_SIZE, TILE_SIZE);
  }

  /**
   * Render the game world with Y-sorting for correct depth.
   * Objects lower on screen (higher Y) render on top.
   * @param {import('./game-object.js').GameObject[]} objects
   * @param {import('./player.js').Player} player
   */
  render(objects, player) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;

    // Build render list with depth = Y position for non-ground objects
    const renderList = [];

    for (const obj of objects) {
      if (!obj.visible) continue;
      // Ground tiles (z=0) always render behind everything
      const depth = obj.z <= 0 ? -Infinity : obj.y;
      renderList.push({ obj, depth });
    }

    // Player depth = bottom of player sprite (feet position)
    const playerDepth = player.y + TILE_SIZE / 2;
    renderList.push({ depth: playerDepth });

    // Sort ascending: lower depth renders first (behind)
    renderList.sort((a, b) => a.depth - b.depth);

    for (const entry of renderList) {
      if (entry.obj === undefined) {
        // Render player
        this.#renderPlayer(player);
        continue;
      }

      const obj = entry.obj;

      if (obj.onRender) {
        obj.onRender();
      }

      const screenX = Math.round((obj.x - obj.sizeX * TILE_SIZE) + (canvas.width / 2) - player.x);
      const screenY = Math.round((obj.y - obj.sizeY * TILE_SIZE) + (canvas.height / 2) - player.y);
      const width = Math.round(TILE_SIZE * obj.sizeX);
      const height = Math.round(TILE_SIZE * obj.sizeY);

      const img = this.#assets.getByIndex(obj.texture);
      if (img) {
        ctx.drawImage(img, screenX, screenY, width, height);
      }
    }

    // HUD
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.font = '16px monospace';
    ctx.fillText(`Objects: ${objects.length}`, 50, 50);
  }
}
