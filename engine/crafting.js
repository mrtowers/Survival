/**
 * Crafting system — defines recipes and handles crafting logic.
 */

export const RECIPES = [
  {
    id: 'stick',
    name: 'Stick',
    result: { type: 'STICK', count: 2 },
    ingredients: [{ type: 'WOOD', count: 1 }],
    requiresWorkbench: false,
  },
  {
    id: 'plank',
    name: 'Plank',
    result: { type: 'PLANK', count: 4 },
    ingredients: [{ type: 'WOOD', count: 2 }],
    requiresWorkbench: false,
  },
  {
    id: 'workbench',
    name: 'Workbench',
    result: { type: 'WORKBENCH', count: 1 },
    ingredients: [{ type: 'WOOD', count: 4 }, { type: 'STICK', count: 2 }],
    requiresWorkbench: false,
  },
  {
    id: 'campfire',
    name: 'Campfire',
    result: { type: 'CAMPFIRE', count: 1 },
    ingredients: [{ type: 'WOOD', count: 3 }, { type: 'STICK', count: 2 }],
    requiresWorkbench: false,
  },
  {
    id: 'stone_sword',
    name: 'Stone Sword',
    result: { type: 'STONE_SWORD', count: 1 },
    ingredients: [{ type: 'STICK', count: 2 }, { type: 'STONE', count: 3 }],
    requiresWorkbench: false,
  },
  {
    id: 'stone_axe',
    name: 'Stone Axe',
    result: { type: 'STONE_AXE', count: 1 },
    ingredients: [{ type: 'STICK', count: 3 }, { type: 'STONE', count: 3 }],
    requiresWorkbench: false,
  },
  {
    id: 'stone_pickaxe',
    name: 'Stone Pickaxe',
    result: { type: 'STONE_PICKAXE', count: 1 },
    ingredients: [{ type: 'STICK', count: 3 }, { type: 'STONE', count: 3 }],
    requiresWorkbench: false,
  },
  {
    id: 'fiber_armor',
    name: 'Fiber Armor',
    result: { type: 'FIBER_ARMOR', count: 1 },
    ingredients: [{ type: 'FIBER', count: 10 }],
    requiresWorkbench: false,
  },
  {
    id: 'wood_wall',
    name: 'Wood Wall',
    result: { type: 'WOOD_WALL', count: 1 },
    ingredients: [{ type: 'WOOD', count: 2 }, { type: 'STICK', count: 2 }],
    requiresWorkbench: false,
  },
  {
    id: 'bandage',
    name: 'Bandage',
    result: { type: 'BANDAGE', count: 1 },
    ingredients: [{ type: 'FIBER', count: 3 }],
    requiresWorkbench: false,
  },
];

export class CraftingSystem {
  /**
   * @param {import('./inventory.js').Inventory} inventory
   * @returns {{ recipe: typeof RECIPES[0], craftable: boolean, maxCraftable: number }[]}
   */
  getAvailableRecipes(inventory) {
    return RECIPES.map((recipe) => {
      const maxCraftable = this.#maxCraftable(inventory, recipe);
      return {
        recipe,
        craftable: maxCraftable > 0,
        maxCraftable,
      };
    });
  }

  /**
   * Attempt to craft a recipe once.
   * @param {import('./inventory.js').Inventory} inventory
   * @param {typeof RECIPES[0]} recipe
   * @returns {boolean} true if crafted successfully
   */
  craft(inventory, recipe) {
    if (this.#maxCraftable(inventory, recipe) < 1) return false;

    // Remove ingredients
    for (const ing of recipe.ingredients) {
      inventory.remove(ing.type, ing.count);
    }

    // Add result
    inventory.add(recipe.result.type, recipe.result.count);
    return true;
  }

  /**
   * Compute how many times a recipe can be crafted given current inventory.
   * @param {import('./inventory.js').Inventory} inventory
   * @param {typeof RECIPES[0]} recipe
   * @returns {number}
   */
  #maxCraftable(inventory, recipe) {
    let max = Infinity;
    for (const ing of recipe.ingredients) {
      const have = inventory.getCount(ing.type);
      const times = Math.floor(have / ing.count);
      if (times < max) max = times;
    }
    return max;
  }
}
