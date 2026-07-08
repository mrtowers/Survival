import { TILE_SIZE } from './constants.js';
import { canvas, ctx } from './canvas.js';
import { getItemIcon, getBirdTextures } from './item-icons.js';
import { getMobTexture } from './mob-icons.js';

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

    ctx.save();
    if (player.facing < 0) {
      ctx.translate(px + TILE_SIZE / 2, 0);
      ctx.scale(-1, 1);
      if (bodyImg) ctx.drawImage(bodyImg, -TILE_SIZE / 2, py, TILE_SIZE, TILE_SIZE);
      if (headImg) ctx.drawImage(headImg, -TILE_SIZE / 2, py, TILE_SIZE, TILE_SIZE);
    } else {
      if (bodyImg) ctx.drawImage(bodyImg, px, py, TILE_SIZE, TILE_SIZE);
      if (headImg) ctx.drawImage(headImg, px, py, TILE_SIZE, TILE_SIZE);
    }
    ctx.restore();
  }

  /**
   * @param {import('./bird.js').Bird} bird
   * @param {number} playerX
   * @param {number} playerY
   */
  #renderBirdShadow(bird, playerX, playerY) {
    const sx = Math.round(bird.x - playerX + canvas.width / 2);
    const sy = Math.round(bird.y - playerY + canvas.height / 2);

    // Only render if on screen
    if (sx < -20 || sx > canvas.width + 20 || sy < -20 || sy > canvas.height + 20) return;

    const shadowSize = Math.max(5, 12 - bird.height * 0.008);
    const alpha = Math.max(0.15, 0.45 - bird.height * 0.002);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(sx + 2, sy + 4, shadowSize, shadowSize * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
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
    // Visual Y = ground position minus height
    const visualY = bird.y - bird.height;
    const sx = Math.round(bird.x - playerX + canvas.width / 2);
    const sy = Math.round(visualY - playerY + canvas.height / 2);

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
   * @param {import('./mob.js').Mob} mob
   * @param {number} playerX
   * @param {number} playerY
   */
  #renderMob(mob, playerX, playerY) {
    const tex = getMobTexture(mob.type);
    if (!tex) return;

    const mobW = Math.round(TILE_SIZE * mob.sizeX);
    const mobH = Math.round(TILE_SIZE * mob.sizeY);

    let sx = Math.round(mob.x - playerX + canvas.width / 2);
    let sy = Math.round(mob.y - mob.sizeY * TILE_SIZE - playerY + canvas.height / 2);

    // Apply slime bounce offset
    if (mob.type === 'slime') {
      sy += mob.bounceOffset;
    }

    // Shadow
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(sx + mobW / 2, mob.y - playerY + canvas.height / 2 + 2, mobW / 3, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Death state: flash and fade
    if (mob.state === 'death') {
      ctx.save();
      ctx.globalAlpha = Math.max(0, mob.deathTimer / 2);
      // Red tint on death
      ctx.drawImage(tex, sx, sy, mobW, mobH);
      ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
      ctx.fillRect(sx, sy, mobW, mobH);
      ctx.restore();
      return;
    }

    // Draw mob with facing
    ctx.save();
    if (mob.facing < 0) {
      ctx.translate(sx + mobW / 2, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(tex, -mobW / 2, sy, mobW, mobH);
    } else {
      ctx.drawImage(tex, sx, sy, mobW, mobH);
    }
    ctx.restore();

    // Red flash overlay when hit
    if (mob.flashTimer > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, mob.flashTimer / 0.15);
      ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
      ctx.fillRect(sx, sy, mobW, mobH);
      ctx.restore();
    }

    // HP bar (only show if damaged)
    if (mob.hp < mob.hpMax) {
      const barW = mobW + 4;
      const barH = 4;
      const barX = sx - 2;
      const barY = sy - 8;

      ctx.fillStyle = '#333';
      ctx.fillRect(barX, barY, barW, barH);

      const hpRatio = Math.max(0, mob.hp / mob.hpMax);
      ctx.fillStyle = hpRatio > 0.5 ? '#4CAF50' : hpRatio > 0.25 ? '#FF9800' : '#F44336';
      ctx.fillRect(barX, barY, barW * hpRatio, barH);

      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY, barW, barH);
    }
  }

  /**
   * Render the game world with Y-sorting for correct depth.
   * Objects lower on screen (higher Y) render on top.
   * @param {import('./game-object.js').GameObject[]} objects
   * @param {import('./player.js').Player} player
   * @param {import('./particles.js').ParticleSystem} particles
   * @param {import('./items.js').GroundItem[]} [groundItems]
   * @param {import('./bird.js').Bird[]} [birds]
   * @param {import('./mob.js').Mob[]} [mobs]
   * @param {import('./day-cycle.js').DayCycle} [dayCycle]
   * @param {import('./building.js').BuildingSystem} [buildingSystem]
   * @param {import('./map.js').GameMap} [map]
   */
  render(objects, player, particles, groundItems, birds, mobs, dayCycle, buildingSystem, map) {
    // Sky background
    if (dayCycle) {
      ctx.fillStyle = dayCycle.getSkyColor();
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    ctx.imageSmoothingEnabled = false;

    // Build render list with depth = Y position for non-ground objects
    const renderList = [];
    /** @type {import('./bird.js').Bird[]} */
    const birdsList = [];

    for (const obj of objects) {
      if (!obj.visible) continue;
      // Ground tiles (z=0) always render behind everything
      const depth = obj.z <= 0 ? -Infinity : obj.y;
      renderList.push({ obj, depth });
    }

    // Add mobs to the render list, Y-sorted with other objects
    if (mobs) {
      for (const mob of mobs) {
        if (!mob.visible) continue;
        renderList.push({ mob, depth: mob.renderDepth });
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
          const hasRotation = obj.rotation !== 0;
          const hasSquash = obj.squash < 1;

          if (hasRotation || hasSquash) {
            ctx.save();
            const cx = screenX + width / 2;
            const cy = screenY + height / 2;

            ctx.translate(cx, cy);

            if (hasRotation) {
              ctx.rotate(obj.rotation);
            }

            if (hasSquash) {
              // Grass leans away from the entity using skew transform.
              // squashDir: 1 = entity on left → lean right, -1 = entity on right → lean left.
              // Negative skewX shifts top right, bottom left (lean right).
              const lean = (1 - obj.squash) * obj.squashDir * 0.5;
              ctx.transform(1, 0, -lean, 1, 0, 0);
              ctx.scale(obj.squash, 1);
            }

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
      } else if (entry.mob) {
        // Render mob
        this.#renderMob(entry.mob, player.x, player.y);
      } else {
        // Render player (with invincibility blink)
        if (!player.blinking || Math.floor(performance.now() / 80) % 2 === 0) {
          this.#renderPlayer(player);
        }
      }
    }

    // Birds always render above all game objects (Y-sorted among themselves)
    if (birds) {
      for (const bird of birds) {
        if (!bird.visible) continue;
        birdsList.push(bird);
      }
      birdsList.sort((a, b) => a.renderDepth - b.renderDepth);
      for (const bird of birdsList) {
        this.#renderBirdShadow(bird, player.x, player.y);
        this.#renderBird(bird, player.x, player.y);
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

    // Placement ghost preview
    if (buildingSystem && buildingSystem.isPlacing) {
      const previewTex = this.#assets.getByIndex(buildingSystem.getPreviewTexture());
      const ghostX = Math.round((buildingSystem.previewX - player.x) + canvas.width / 2);
      const ghostY = Math.round((buildingSystem.previewY - player.y) + canvas.height / 2);
      const ghostW = Math.round(TILE_SIZE);
      const ghostH = Math.round(TILE_SIZE);

      // Determine if valid position
      const valid = buildingSystem.isValidPosition(buildingSystem.previewX, buildingSystem.previewY, map);

      ctx.save();
      ctx.globalAlpha = 0.5;

      // Draw ghost texture
      if (previewTex) {
        ctx.drawImage(previewTex, ghostX, ghostY, ghostW, ghostH);
      }

      // Tint overlay (green if valid, red if blocked)
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = valid ? '#00FF00' : '#FF0000';
      ctx.fillRect(ghostX, ghostY, ghostW, ghostH);

      // Grid outline
      ctx.globalAlpha = 0.7;
      ctx.strokeStyle = valid ? '#00FF00' : '#FF0000';
      ctx.lineWidth = 2;
      ctx.strokeRect(ghostX, ghostY, ghostW, ghostH);

      ctx.restore();
    }

    // Night overlay (darkens the scene at night)
    if (dayCycle) {
      ctx.fillStyle = dayCycle.getNightOverlayColor();
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Low-health vignette (red tint at edges)
    if (player.isLowHealth) {
      const intensity = 0.35 + 0.15 * Math.sin(performance.now() / 300);
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, canvas.width * 0.2,
        canvas.width / 2, canvas.height / 2, canvas.width * 0.7,
      );
      gradient.addColorStop(0, 'rgba(255, 0, 0, 0)');
      gradient.addColorStop(1, `rgba(255, 0, 0, ${intensity})`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Clock display (top-right corner)
    if (dayCycle) {
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = 'bold 18px monospace';
      ctx.fillText(dayCycle.getTimeString(), canvas.width - 15, 15);
      // Day/night indicator
      ctx.fillStyle = dayCycle.isDay ? '#FFD700' : '#4466AA';
      ctx.beginPath();
      const indicatorX = canvas.width - 15;
      const indicatorY = 40;
      ctx.arc(indicatorX, indicatorY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '11px monospace';
      ctx.fillText(dayCycle.isDay ? 'DZIEŃ' : 'NOC', indicatorX, indicatorY + 10);
    }
  }
}
