import { TILE_SIZE, MAP_RADIUS, TEXTURES } from './constants.js';
import { GameObject, Animation } from './game-object.js';
import { GroundItem } from './items.js';
import { BIOMES } from './biomes.js';

export class GameMap {
  /** @type {Map<string, GameObject[]>} */
  #grid = new Map();
  #allCount = 0;
  /** @type {GroundItem[]} */
  #groundItems = [];
  /** @type {import('./biomes.js').BiomeGenerator} */
  #biomeGen;

  /**
   * @param {import('./biomes.js').BiomeGenerator} biomeGen
   */
  constructor(biomeGen) {
    this.#biomeGen = biomeGen;
  }

  /**
   * Get the biome at a tile coordinate.
   * @param {number} tx - Tile X
   * @param {number} ty - Tile Y
   * @returns {string}
   */
  getBiome(tx, ty) {
    return this.#biomeGen.getBiomeAt(tx, ty);
  }

  /**
   * Get the biome at a world coordinate (used by player movement).
   * @param {number} worldX
   * @param {number} worldY
   * @returns {string}
   */
  getBiomeAt(worldX, worldY) {
    const tx = Math.floor(worldX / TILE_SIZE);
    const ty = Math.floor(worldY / TILE_SIZE);
    return this.#biomeGen.getBiomeAt(tx, ty);
  }

  generate() {
    this.#biomeGen.clearCache();
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
        const biome = this.#biomeGen.getBiomeAt(i, j);
        let texture;
        switch (biome) {
          case BIOMES.DESERT:
            texture = TEXTURES.SAND;
            break;
          case BIOMES.WATER:
            texture = TEXTURES.WATER;
            break;
          case BIOMES.SNOW:
            texture = TEXTURES.SNOW;
            break;
          case BIOMES.PLAINS:
          case BIOMES.FOREST:
          default:
            texture = TEXTURES.GRASS;
            break;
        }
        const ground = new GameObject({
          name: 'ground',
          x: i * TILE_SIZE,
          y: j * TILE_SIZE,
          texture: texture,
          textureHover: texture,
          rotation: (Math.PI / 2) * Math.floor(Math.random() * 4),
        });
        this.#add(i, j, ground);
      }
    }
  }

  #generateDecorations() {
    for (let i = -MAP_RADIUS; i < MAP_RADIUS; i++) {
      for (let j = -MAP_RADIUS; j < MAP_RADIUS; j++) {
        const biome = this.#biomeGen.getBiomeAt(i, j);
        const roll = Math.random() * 100;

        switch (biome) {
          case BIOMES.FOREST:
            this.#decorateForest(i, j, roll);
            break;
          case BIOMES.DESERT:
            this.#decorateDesert(i, j, roll);
            break;
          case BIOMES.PLAINS:
            this.#decoratePlains(i, j, roll);
            break;
          case BIOMES.SNOW:
            this.#decorateSnow(i, j, roll);
            break;
          // WATER: no decorations
        }
      }
    }
  }

  /** Forest: dense vegetation, trees, mushrooms, flowers */
  /**
   * Place a cluster of individual grass blade objects at a tile position.
   * Blades share a clusterKey so they can be harvested as a group.
   * @param {number} tx - Tile X
   * @param {number} ty - Tile Y
   */
  #placeGrassCluster(tx, ty) {
    const BLADE_TEXS = [
      TEXTURES.GRASS_BLADE_1,
      TEXTURES.GRASS_BLADE_2,
      TEXTURES.GRASS_BLADE_3,
      TEXTURES.GRASS_BLADE_4,
    ];
    const clusterKey = `${tx},${ty}`;

    // Positions within the tile for each blade (relative to tile center)
    const offsets = [
      { ox: -0.3, oy: -0.1, tex: BLADE_TEXS[0], sz: 0.18 },
      { ox: -0.15, oy: -0.25, tex: BLADE_TEXS[1], sz: 0.2 },
      { ox: 0.0, oy: -0.3, tex: BLADE_TEXS[2], sz: 0.22 },
      { ox: 0.2, oy: -0.2, tex: BLADE_TEXS[3], sz: 0.17 },
      { ox: -0.2, oy: 0.1, tex: BLADE_TEXS[0], sz: 0.19 },
      { ox: 0.05, oy: 0.0, tex: BLADE_TEXS[1], sz: 0.24 },
      { ox: 0.25, oy: 0.05, tex: BLADE_TEXS[2], sz: 0.18 },
      { ox: 0.1, oy: 0.2, tex: BLADE_TEXS[3], sz: 0.16 },
    ];

    for (const off of offsets) {
      const blade = new GameObject({
        name: 'tall_grass',
        x: tx * TILE_SIZE + off.ox * TILE_SIZE,
        y: ty * TILE_SIZE + off.oy * TILE_SIZE,
        z: 1,
        texture: off.tex,
        collision: false,
        hpMax: 1,
        sizeX: off.sz,
        sizeY: 1,
      });
      blade.clusterKey = clusterKey;
      this.#add(tx, ty, blade);
    }
  }

  #decorateForest(tx, ty, roll) {
    if (roll < 14) {
      const tree = new GameObject({
        name: 'tree',
        x: tx * TILE_SIZE,
        y: ty * TILE_SIZE,
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

      this.#add(tx, ty, tree);
    } else if (roll < 16) {
      const rock = new GameObject({
        name: 'rock',
        x: tx * TILE_SIZE,
        y: ty * TILE_SIZE,
        z: 1,
        texture: TEXTURES.STONE,
        textureHover: TEXTURES.STONE_HOVER,
        collision: true,
        hpMax: 3,
      });
      this.#add(tx, ty, rock);
    } else if (roll < 22) {
      const bush = new GameObject({
        name: 'bush',
        x: tx * TILE_SIZE,
        y: ty * TILE_SIZE,
        z: 1,
        texture: TEXTURES.BUSH,
        collision: false,
        hpMax: 2,
      });
      this.#add(tx, ty, bush);
    } else if (roll < 26) {
      const mushroom = new GameObject({
        name: 'mushroom',
        x: tx * TILE_SIZE,
        y: ty * TILE_SIZE,
        z: 1,
        texture: TEXTURES.MUSHROOM,
        collision: false,
        hpMax: 1,
      });
      this.#add(tx, ty, mushroom);
    } else if (roll < 30) {
      const flower = new GameObject({
        name: 'flower',
        x: tx * TILE_SIZE,
        y: ty * TILE_SIZE,
        z: 1,
        texture: TEXTURES.FLOWER,
        collision: false,
        hpMax: 1,
      });
      this.#add(tx, ty, flower);
    } else if (roll < 38) {
      this.#placeGrassCluster(tx, ty);
    } else if (roll < 40) {
      const stump = new GameObject({
        name: 'stump',
        x: tx * TILE_SIZE,
        y: ty * TILE_SIZE,
        z: 1,
        texture: TEXTURES.STUMP,
        collision: true,
        hpMax: 2,
      });
      this.#add(tx, ty, stump);
    } else if (roll < 43) {
      const smallBush = new GameObject({
        name: 'bush_small',
        x: tx * TILE_SIZE,
        y: ty * TILE_SIZE,
        z: 1,
        texture: TEXTURES.BUSH_SMALL,
        collision: false,
        hpMax: 1,
      });
      this.#add(tx, ty, smallBush);
    }
  }

  /** Desert: cacti instead of trees, rocks, sparse bushes, no mushrooms/flowers */
  #decorateDesert(tx, ty, roll) {
    if (roll < 8) {
      const cactus = new GameObject({
        name: 'cactus',
        x: tx * TILE_SIZE,
        y: ty * TILE_SIZE,
        z: 3,
        texture: TEXTURES.CACTUS,
        collision: true,
        shading: true,
        sizeY: 2,
        hpMax: 3,
      });
      this.#add(tx, ty, cactus);
    } else if (roll < 12) {
      const rock = new GameObject({
        name: 'rock',
        x: tx * TILE_SIZE,
        y: ty * TILE_SIZE,
        z: 1,
        texture: TEXTURES.STONE,
        textureHover: TEXTURES.STONE_HOVER,
        collision: true,
        hpMax: 3,
      });
      this.#add(tx, ty, rock);
    } else if (roll < 17) {
      const smallBush = new GameObject({
        name: 'bush_small',
        x: tx * TILE_SIZE,
        y: ty * TILE_SIZE,
        z: 1,
        texture: TEXTURES.BUSH_SMALL,
        collision: false,
        hpMax: 1,
      });
      this.#add(tx, ty, smallBush);
    } else if (roll < 22) {
      this.#placeGrassCluster(tx, ty);
    }
  }

  /** Plains: fewer trees, more tall grass and flowers */
  #decoratePlains(tx, ty, roll) {
    if (roll < 5) {
      const tree = new GameObject({
        name: 'tree',
        x: tx * TILE_SIZE,
        y: ty * TILE_SIZE,
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

      this.#add(tx, ty, tree);
    } else if (roll < 7) {
      const rock = new GameObject({
        name: 'rock',
        x: tx * TILE_SIZE,
        y: ty * TILE_SIZE,
        z: 1,
        texture: TEXTURES.STONE,
        textureHover: TEXTURES.STONE_HOVER,
        collision: true,
        hpMax: 3,
      });
      this.#add(tx, ty, rock);
    } else if (roll < 10) {
      const bush = new GameObject({
        name: 'bush',
        x: tx * TILE_SIZE,
        y: ty * TILE_SIZE,
        z: 1,
        texture: TEXTURES.BUSH,
        collision: false,
        hpMax: 2,
      });
      this.#add(tx, ty, bush);
    } else if (roll < 14) {
      const flower = new GameObject({
        name: 'flower',
        x: tx * TILE_SIZE,
        y: ty * TILE_SIZE,
        z: 1,
        texture: TEXTURES.FLOWER,
        collision: false,
        hpMax: 1,
      });
      this.#add(tx, ty, flower);
    } else if (roll < 26) {
      this.#placeGrassCluster(tx, ty);
    } else if (roll < 29) {
      const smallBush = new GameObject({
        name: 'bush_small',
        x: tx * TILE_SIZE,
        y: ty * TILE_SIZE,
        z: 1,
        texture: TEXTURES.BUSH_SMALL,
        collision: false,
        hpMax: 1,
      });
      this.#add(tx, ty, smallBush);
    } else if (roll < 31) {
      const mushroom = new GameObject({
        name: 'mushroom',
        x: tx * TILE_SIZE,
        y: ty * TILE_SIZE,
        z: 1,
        texture: TEXTURES.MUSHROOM,
        collision: false,
        hpMax: 1,
      });
      this.#add(tx, ty, mushroom);
    }
  }

  /** Snow: dead trees, sparse rocks, no vegetation */
  #decorateSnow(tx, ty, roll) {
    if (roll < 6) {
      const deadTree = new GameObject({
        name: 'dead_tree',
        x: tx * TILE_SIZE,
        y: ty * TILE_SIZE,
        z: 3,
        texture: TEXTURES.DEAD_TREE,
        collision: true,
        shading: true,
        sizeY: 3,
        hpMax: 3,
      });
      this.#add(tx, ty, deadTree);
    } else if (roll < 10) {
      const rock = new GameObject({
        name: 'rock',
        x: tx * TILE_SIZE,
        y: ty * TILE_SIZE,
        z: 1,
        texture: TEXTURES.STONE,
        textureHover: TEXTURES.STONE_HOVER,
        collision: true,
        hpMax: 3,
      });
      this.#add(tx, ty, rock);
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
   * Find any interactable object near the given world position.
   * Uses precise AABB hit-testing and picks the top-most object.
   * @param {number} worldX
   * @param {number} worldY
   * @returns {GameObject|null}
   */
  findAt(worldX, worldY) {
    const interactable = ['tree', 'rock', 'bush', 'mushroom', 'flower', 'tall_grass', 'stump', 'bush_small', 'cactus', 'dead_tree'];
    /** @type {GameObject|null} */
    let best = null;
    let bestZ = -Infinity;

    for (const [, cell] of this.#grid) {
      for (const obj of cell) {
        if (!obj.visible) continue;
        if (!interactable.includes(obj.name)) continue;

        // AABB: rendered top-left to bottom-right
        const left = obj.x - obj.sizeX * TILE_SIZE;
        const right = obj.x;
        const top = obj.y - obj.sizeY * TILE_SIZE;
        const bottom = obj.y;

        if (worldX >= left && worldX <= right && worldY >= top && worldY <= bottom) {
          // Prefer higher z (closer to camera), then smaller area
          if (obj.z > bestZ || (obj.z === bestZ && (!best || (obj.sizeX * obj.sizeY) < (best.sizeX * best.sizeY)))) {
            best = obj;
            bestZ = obj.z;
          }
        }
      }
    }
    return best;
  }

  /** Keep for backward compatibility. */
  findTreeAt(worldX, worldY) {
    for (const [, cell] of this.#grid) {
      for (const obj of cell) {
        if (obj.name !== 'tree' || !obj.visible) continue;
        const dx = worldX - obj.x;
        const dy = worldY - (obj.y - TILE_SIZE * 0.5);
        if (dx * dx + dy * dy < TILE_SIZE * TILE_SIZE) {
          return obj;
        }
      }
    }
    return null;
  }

  /** Keep for backward compatibility. */
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
   * Check if a world position is blocked by a collision object.
   * @param {number} worldX
   * @param {number} worldY
   * @returns {boolean}
   */
  isBlocked(worldX, worldY) {
    const tx = Math.round(worldX / TILE_SIZE);
    const ty = Math.round(worldY / TILE_SIZE);
    // Check a 3x3 area around the tile for collision objects
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const cell = this.#grid.get(this.#gridKey(tx + dx, ty + dy));
        if (!cell) continue;
        for (const obj of cell) {
          if (!obj.visible || !obj.collision) continue;
          // AABB check against the object's bounds
          const left = obj.x - obj.sizeX * TILE_SIZE;
          const right = obj.x;
          const top = obj.y - obj.sizeY * TILE_SIZE;
          const bottom = obj.y;
          if (worldX >= left && worldX <= right && worldY >= top && worldY <= bottom) {
            return true;
          }
        }
      }
    }
    return false;
  }

  /**
   * Add a player-placed object to the grid.
   * @param {string} name
   * @param {number} x - World X
   * @param {number} y - World Y
   * @param {number} texture - Texture index
   * @param {boolean} collision
   * @param {number} hpMax
   * @param {number} [z] - Z-order
   * @param {boolean} [shading]
   * @returns {GameObject}
   */
  addPlacedObject(name, x, y, texture, collision, hpMax, z = 1, shading = false) {
    const obj = new GameObject({
      name,
      x,
      y,
      z,
      texture,
      textureHover: texture,
      collision,
      hpMax,
      shading,
    });
    const tx = Math.floor(x / TILE_SIZE);
    const ty = Math.floor(y / TILE_SIZE);
    this.#add(tx, ty, obj);
    return obj;
  }

  /**
   * Get all game objects within a radius (in tiles) of a position.
   * @param {number} x - World X
   * @param {number} y - World Y
   * @param {number} radius - Radius in tiles
   * @returns {GameObject[]}
   */
  getObjectsInRadius(x, y, radius) {
    const tx = Math.floor(x / TILE_SIZE);
    const ty = Math.floor(y / TILE_SIZE);
    const result = [];
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        const cell = this.#grid.get(this.#gridKey(tx + dx, ty + dy));
        if (cell) {
          for (const obj of cell) {
            if (obj.visible) result.push(obj);
          }
        }
      }
    }
    return result;
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
   * Destroy all objects in a blade cluster (by clusterKey).
   * Returns the number of objects destroyed.
   * @param {string} clusterKey
   * @returns {number}
   */
  destroyCluster(clusterKey) {
    let count = 0;
    for (const [, cell] of this.#grid) {
      for (let i = cell.length - 1; i >= 0; i--) {
        if (cell[i].clusterKey === clusterKey) {
          cell[i].visible = false;
          cell.splice(i, 1);
          this.#allCount--;
          count++;
        }
      }
    }
    return count;
  }

  /**
   * Get all tree objects.
   * @returns {GameObject[]}
   */
  getTrees() {
    const trees = [];
    for (const [, cell] of this.#grid) {
      for (const obj of cell) {
        if (obj.name === 'tree') trees.push(obj);
      }
    }
    return trees;
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
