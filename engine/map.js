import { TILE_SIZE, MAP_RADIUS, TEXTURES } from './constants.js';
import { GameObject, Animation } from './game-object.js';
import { GroundItem } from './items.js';

export class GameMap {
  /** @type {Map<string, GameObject[]>} */
  #grid = new Map();
  #allCount = 0;
  /** @type {GroundItem[]} */
  #groundItems = [];

  generate() {
    this.#generateGround();
    this.#generateDecorations();
    console.log(`Generated ${this.#allCount} objects across ${this.#grid.size} tiles`);
  }

  #gridKey(tx, ty) {
    return `${tx},${ty}`;
  }

  #add(tileX, tileY, obj) {
    const key = this.#gridKey(tileX, tileY);
    if (!this.#grid.has(key)) {
      this.#grid.set(key, []);
    }
    this.#grid.get(key).push(obj);
    this.#allCount++;
  }

  #generateGround() {
    for (let i = -MAP_RADIUS; i < MAP_RADIUS; i++) {
      for (let j = -MAP_RADIUS; j < MAP_RADIUS; j++) {
        const grass = new GameObject({
          name: 'ground',
          x: i * TILE_SIZE,
          y: j * TILE_SIZE,
          texture: TEXTURES.GRASS,
          textureHover: TEXTURES.GRASS,
          rotation: (Math.PI / 2) * Math.floor(Math.random() * 4),
        });
        this.#add(i, j, grass);
      }
    }
  }

  #generateDecorations() {
    for (let i = -MAP_RADIUS; i < MAP_RADIUS; i++) {
      for (let j = -MAP_RADIUS; j < MAP_RADIUS; j++) {
        const roll = Math.random() * 100;

        if (roll < 10) {
          const tree = new GameObject({
            name: 'tree',
            x: i * TILE_SIZE,
            y: j * TILE_SIZE,
            z: 3,
            texture: TEXTURES.TREE,
            collision: true,
            shading: true,
            sizeY: 3,
            hpMax: 3,
          });

          const anim = new Animation('leaves', [
            TEXTURES.TREE,
            TEXTURES.TREE_ALT,
          ], 0.05);
          anim.play();
          tree.animation = anim;
          tree.onRender = () => {
            anim.tick();
            tree.texture = anim.texture;
          };

          this.#add(i, j, tree);
        } else if (roll < 12) {
          const rock = new GameObject({
            name: 'rock',
            x: i * TILE_SIZE,
            y: j * TILE_SIZE,
            z: 1,
            texture: TEXTURES.STONE,
            textureHover: TEXTURES.STONE_HOVER,
            collision: true,
            hpMax: 3,
          });
          this.#add(i, j, rock);
        }
      }
    }
  }

  /**
   * Get all objects within a visible range of a point.
   * Returns objects sorted by z-order for correct rendering.
   */
  getVisibleObjects(cx, cy, range) {
    const startTX = Math.floor((cx - range) / TILE_SIZE);
    const endTX = Math.ceil((cx + range) / TILE_SIZE);
    const startTY = Math.floor((cy - range) / TILE_SIZE);
    const endTY = Math.ceil((cy + range) / TILE_SIZE);

    /** @type {GameObject[]} */
    const visible = [];

    for (let tx = startTX; tx <= endTX; tx++) {
      for (let ty = startTY; ty <= endTY; ty++) {
        const cell = this.#grid.get(this.#gridKey(tx, ty));
        if (cell) {
          for (const obj of cell) {
            visible.push(obj);
          }
        }
      }
    }

    return visible;
  }

  /**
   * Find a tree near the given world position.
   * @returns {GameObject|null}
   */
  findTreeAt(worldX, worldY) {
    for (const [, cell] of this.#grid) {
      for (const obj of cell) {
        if (obj.name !== 'tree' || !obj.visible) continue;
        const dx = worldX - obj.x;
        const dy = worldY - (obj.y - TILE_SIZE * 0.5); // aim at trunk area
        if (dx * dx + dy * dy < TILE_SIZE * TILE_SIZE) {
          return obj;
        }
      }
    }
    return null;
  }

  /**
   * Find a rock near the given world position.
   * @returns {GameObject|null}
   */
  findRockAt(worldX, worldY) {
    for (const [, cell] of this.#grid) {
      for (const obj of cell) {
        if (obj.name !== 'rock' || !obj.visible) continue;
        const dx = worldX - obj.x;
        const dy = worldY - obj.y;
        if (dx * dx + dy * dy < TILE_SIZE * TILE_SIZE) {
          return obj;
        }
      }
    }
    return null;
  }

  /**
   * Remove an object from the grid.
   */
  removeObject(obj) {
    obj.visible = false;
    for (const [, cell] of this.#grid) {
      const idx = cell.indexOf(obj);
      if (idx !== -1) {
        cell.splice(idx, 1);
        this.#allCount--;
        break;
      }
    }
  }

  /**
   * Drop items on the ground.
   * @param {number} x - World X
   * @param {number} y - World Y
   * @param {string} itemType - key from ITEMS
   * @param {number} min
   * @param {number} max
   */
  dropItems(x, y, itemType, min, max) {
    const count = min + Math.floor(Math.random() * (max - min + 1));
    this.#groundItems.push(new GroundItem(x, y, itemType, count));
  }

  /** @returns {GroundItem[]} */
  getGroundItems() {
    return this.#groundItems;
  }

  /**
   * Remove a ground item after pickup.
   * @param {GroundItem} item
   */
  removeGroundItem(item) {
    const idx = this.#groundItems.indexOf(item);
    if (idx !== -1) this.#groundItems.splice(idx, 1);
  }
}
