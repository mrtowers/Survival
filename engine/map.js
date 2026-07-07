import { TILE_SIZE, MAP_RADIUS, TEXTURES } from './constants.js';
import { GameObject, Animation } from './game-object.js';

export class GameMap {
  /** @type {Map<string, GameObject[]>} */
  #grid = new Map();
  #allCount = 0;

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

    visible.sort((a, b) => a.z - b.z);
    return visible;
  }
}
