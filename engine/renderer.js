import { TILE_SIZE } from './constants.js';
import { canvas, ctx } from './canvas.js';
import { getItemIcon, getBirdTextures } from './item-icons.js';

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
   * @param {import('./bird.js').Bird} bird
   * @param {number} playerX
   * @param {number} playerY
   */
  #renderBird(bird, playerX, playerY) {
    const texs = getBirdTextures();
    const tex = texs[bird.wingFrame];
    if (!tex) return;

    const w = 22;
    const h = 18;
    const sx = Math.round(bird.x - playerX + canvas.width / 2);
    const sy = Math.round(bird.y - playerY + canvas.height / 2);

    ctx.save();
    if (bird.facingLeft) {
      // Flip horizontally
      ctx.translate(sx + w / 2, sy + h / 2);
      ctx.scale(-1, 1);
      ctx.drawImage(tex, -w / 2, -h / 2, w, h);
    } else {
      ctx.drawImage(tex, sx - w / 2, sy - h / 2, w, h);
    }
    ctx.restore();
  }

  /**
   * Render the game world with Y-sorting for correct depth.
   * Objects lower on screen (higher Y) render on top.
   * @param {import('./game-object.js').GameObject[]} objects
   * @param {import('./player.js').Player} player
   * @param {import('./particles.js').ParticleSystem} particles
   * @param {import('./items.js').GroundItem[]} [groundItems]
   * @param {import('./bird.js').Bird[]} [birds]
   */
  render(objects, player, particles, groundItems, birds) {
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

    // Birds with Y-depth sorting
    if (birds) {
      for (const bird of birds) {
        if (!bird.visible) continue;
        renderList.push({ bird, depth: bird.renderDepth });
      }
    }

    // Player depth = bottom of player sprite (feet position)
    const playerDepth = player.y + TILE_SIZE / 2;
    renderList.push({ depth: playerDepth });

    // Sort ascending: lower depth renders first (behind)
    renderList.sort((a, b) => a.depth - b.depth);

    for (const entry of renderList) {
      if (entry.obj) {
        // Render game object
        const obj = entry.obj;

        if (obj.onRender) {
          obj.onRender();
        }

        let screenX = Math.round((obj.x - obj.sizeX * TILE_SIZE) + (canvas.width / 2) - player.x);
        let screenY = Math.round((obj.y - obj.sizeY * TILE_SIZE) + (canvas.height / 2) - player.y);

        // Apply shake offset
        if (obj.shake) {
          screenX += Math.round(obj.shake.offsetX);
          screenY += Math.round(obj.shake.offsetY);
        }

        const width = Math.round(TILE_SIZE * obj.sizeX);
        const height = Math.round(TILE_SIZE * obj.sizeY);

        const img = this.#assets.getByIndex(obj.texture);
        if (img) {
          if (obj.rotation) {
            ctx.save();
            ctx.translate(screenX + width / 2, screenY + height / 2);
            ctx.rotate(obj.rotation);
            ctx.drawImage(img, -width / 2, -height / 2, width, height);
            ctx.restore();
          } else {
            ctx.drawImage(img, screenX, screenY, width, height);
          }

          // Hover highlight outline
          if (obj.hovered) {
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 2;
            ctx.strokeRect(screenX - 1, screenY - 1, width + 2, height + 2);
          }
        }
      } else if (entry.bird) {
        // Render bird
        this.#renderBird(entry.bird, player.x, player.y);
      } else {
        // Render player
        this.#renderPlayer(player);
      }
    }

    // Particles (on top of everything)
    particles.render(player.x, player.y);

    // Ground items (on top of everything)
    if (groundItems) {
      for (const item of groundItems) {
        if (!item.quantity) continue;
        const sx = Math.round(item.x - player.x + canvas.width / 2);
        const sy = Math.round(item.y - player.y + canvas.height / 2);

        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(item.rotation);

        // Texture
        const tex = getItemIcon(item.itemType);
        const drawS = Math.round(14 * item.scale);
        ctx.drawImage(tex, -drawS / 2, -drawS / 2, drawS, drawS);

        // Quantity label
        ctx.rotate(-item.rotation);
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 2;
        ctx.font = `bold ${Math.round(11 * item.scale)}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeText(item.quantity, 0, 1);
        ctx.fillText(item.quantity, 0, 1);

        ctx.restore();
      }
    }

    // HUD
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.font = '16px monospace';
    ctx.fillText(`Objects: ${objects.length}`, 50, 50);
  }
}
