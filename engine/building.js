import { TILE_SIZE, TEXTURES } from './constants.js';
import { GameObject, Animation } from './game-object.js';

const PLACEABLE_ITEMS = ['WORKBENCH', 'CAMPFIRE', 'WOOD_WALL'];

export class BuildingSystem {
  /** @type {boolean} */
  isPlacing = false;
  /** @type {string|null} */
  currentBlueprint = null;
  /** @type {number} */
  previewX = 0;
  /** @type {number} */
  previewY = 0;
  /** @type {string[]} */
  placeableItems = PLACEABLE_ITEMS;

  /**
   * Enter placement mode for a given item type.
   * @param {string} itemType
   * @returns {boolean} true if entered placement mode
   */
  enterPlacementMode(itemType) {
    if (!PLACEABLE_ITEMS.includes(itemType)) return false;
    this.isPlacing = true;
    this.currentBlueprint = itemType;
    return true;
  }

  /** Cancel placement mode. */
  exitPlacementMode() {
    this.isPlacing = false;
    this.currentBlueprint = null;
  }

  /**
   * Update ghost preview position, snapping to grid.
   * @param {number} mouseWorldX
   * @param {number} mouseWorldY
   * @param {number} [gridSize]
   */
  updatePreview(mouseWorldX, mouseWorldY, gridSize = TILE_SIZE) {
    this.previewX = Math.floor(mouseWorldX / gridSize) * gridSize;
    this.previewY = Math.floor(mouseWorldY / gridSize) * gridSize;
  }

  /**
   * Check if a position is valid for placement.
   * @param {number} x - World X (grid-aligned)
   * @param {number} y - World Y (grid-aligned)
   * @param {import('./map.js').GameMap} map
   * @returns {boolean}
   */
  isValidPosition(x, y, map) {
    const centerX = x + TILE_SIZE / 2;
    const centerY = y + TILE_SIZE / 2;
    if (map.isBlocked(centerX, centerY)) return false;
    // Also check the 4 corners of the tile to ensure nothing is blocking
    const corners = [
      [x + 1, y + 1],
      [x + TILE_SIZE - 1, y + 1],
      [x + 1, y + TILE_SIZE - 1],
      [x + TILE_SIZE - 1, y + TILE_SIZE - 1],
    ];
    for (const [cx, cy] of corners) {
      if (map.isBlocked(cx, cy)) return false;
    }
    return true;
  }

  /**
   * Confirm placement: consume item from inventory and add object to map.
   * @param {import('./inventory.js').Inventory} inventory
   * @param {import('./map.js').GameMap} map
   * @returns {boolean} true if placed successfully
   */
  confirmPlacement(inventory, map) {
    if (!this.isPlacing || !this.currentBlueprint) return false;

    if (inventory.getCount(this.currentBlueprint) < 1) {
      this.exitPlacementMode();
      return false;
    }

    if (!this.isValidPosition(this.previewX, this.previewY, map)) return false;

    const itemType = this.currentBlueprint;

    // Remove one item from inventory
    inventory.remove(itemType, 1);

    let name, texture, collision, hpMax, z, shading;

    switch (itemType) {
      case 'WORKBENCH':
        name = 'workbench';
        texture = TEXTURES.WORKBENCH;
        collision = true;
        hpMax = 5;
        z = 1;
        shading = false;
        break;
      case 'CAMPFIRE':
        name = 'campfire';
        texture = TEXTURES.CAMPFIRE_TEX;
        collision = false;
        hpMax = 3;
        z = 1;
        shading = false;
        break;
      case 'WOOD_WALL':
        name = 'wood_wall';
        texture = TEXTURES.WALL;
        collision = true;
        hpMax = 8;
        z = 2;
        shading = false;
        break;
      default:
        this.exitPlacementMode();
        return false;
    }

    const obj = map.addPlacedObject(name, this.previewX, this.previewY, texture, collision, hpMax, z, shading);

    // Campfire gets a flickering flame animation
    if (itemType === 'CAMPFIRE') {
      const anim = new Animation('flame', [
        TEXTURES.CAMPFIRE_TEX,
        TEXTURES.CAMPFIRE_ALT,
      ], 0.08);
      anim.play();
      obj.animation = anim;
      obj.onRender = () => {
        anim.tick();
        obj.texture = anim.texture;
      };
    }

    this.exitPlacementMode();
    return true;
  }

  /**
   * Get the texture index for the current blueprint (for preview rendering).
   * @returns {number}
   */
  getPreviewTexture() {
    switch (this.currentBlueprint) {
      case 'WORKBENCH': return TEXTURES.WORKBENCH;
      case 'CAMPFIRE': return TEXTURES.CAMPFIRE_TEX;
      case 'WOOD_WALL': return TEXTURES.WALL;
      default: return TEXTURES.PLACED_GHOST;
    }
  }
}
