import { canvas } from './canvas.js';
import { ITEMS } from './items.js';
import { getItemIcon } from './item-icons.js';

const PANEL_W = 340;
const RECIPE_H = 40;
const PANEL_PAD = 12;
const VISIBLE_RECIPES = 10;

export class CraftingUI {
  /** @type {boolean} */
  #open = false;
  /** @type {import('./crafting.js').CraftingSystem} */
  #system;
  /** @type {{ recipe: import('./crafting.js').RECIPES[0], craftable: boolean, maxCraftable: number }[]} */
  #available = [];
  /** @type {number} */
  #scrollY = 0;

  /**
   * @param {import('./crafting.js').CraftingSystem} system
   */
  constructor(system) {
    this.#system = system;
  }

  get isOpen() {
    return this.#open;
  }

  toggle() {
    this.#open = !this.#open;
  }

  /**
   * Refresh available recipes based on inventory state.
   * @param {import('./inventory.js').Inventory} inventory
   */
  refresh(inventory) {
    this.#available = this.#system.getAvailableRecipes(inventory);
  }

  /**
   * Handle a click on the crafting panel.
   * @param {number} mx
   * @param {number} my
   * @param {import('./inventory.js').Inventory} inventory
   * @returns {boolean} true if a recipe was crafted
   */
  handleClick(mx, my, inventory) {
    if (!this.#open) return false;

    const { panelX, panelY } = this.#getPanelRect();
    const listX = panelX + PANEL_PAD;
    const listY = panelY + 36;

    for (let i = 0; i < this.#available.length && i < VISIBLE_RECIPES; i++) {
      const ry = listY + i * RECIPE_H;
      if (mx >= listX && mx <= listX + PANEL_W - PANEL_PAD * 2 &&
          my >= ry && my <= ry + RECIPE_H - 2) {
        const entry = this.#available[i];
        if (entry.craftable) {
          this.#system.craft(inventory, entry.recipe);
          this.refresh(inventory);
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Render the crafting panel.
   * @param {CanvasRenderingContext2D} ctx
   * @param {import('./inventory.js').Inventory} inventory
   */
  render(ctx, inventory) {
    if (!this.#open) return;
    this.refresh(inventory);

    const { width, height } = canvas;
    const { panelX, panelY, panelW, panelH } = this.#getPanelRect();

    ctx.save();

    // Panel background
    ctx.fillStyle = 'rgba(10, 10, 10, 0.75)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 2;
    this.#roundRect(ctx, panelX, panelY, panelW, panelH, 8);
    ctx.fill();
    ctx.stroke();

    // Title
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Crafting', width / 2, panelY + 18);

    const listX = panelX + PANEL_PAD;
    const listY = panelY + 36;

    // Recipe list
    for (let i = 0; i < this.#available.length && i < VISIBLE_RECIPES; i++) {
      const entry = this.#available[i];
      const ry = listY + i * RECIPE_H;

      if (entry.craftable) {
        ctx.fillStyle = 'rgba(40, 80, 40, 0.5)';
      } else {
        ctx.fillStyle = 'rgba(40, 40, 40, 0.3)';
      }
      this.#roundRect(ctx, listX, ry, PANEL_W - PANEL_PAD * 2, RECIPE_H - 2, 4);
      ctx.fill();
      ctx.strokeStyle = entry.craftable ? 'rgba(100, 200, 100, 0.3)' : 'rgba(80, 80, 80, 0.2)';
      ctx.lineWidth = 1;
      this.#roundRect(ctx, listX, ry, PANEL_W - PANEL_PAD * 2, RECIPE_H - 2, 4);
      ctx.stroke();

      // Result icon
      const icon = getItemIcon(entry.recipe.result.type);
      ctx.drawImage(icon, listX + 4, ry + 4, 32, 32);

      // Recipe name
      ctx.fillStyle = entry.craftable ? '#fff' : 'rgba(180, 180, 180, 0.5)';
      ctx.font = '13px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(entry.recipe.name, listX + 42, ry + 14);

      // Ingredients (single line)
      const parts = entry.recipe.ingredients.map((ing) => {
        const have = inventory.getCount(ing.type);
        return `${have}/${ing.count} ${ITEMS[ing.type].name}`;
      });
      ctx.fillStyle = entry.craftable ? 'rgba(200, 200, 200, 0.7)' : 'rgba(140, 140, 140, 0.4)';
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(parts.join(', '), listX + 42, ry + 20);

      // Max craftable indicator
      if (entry.craftable) {
        ctx.fillStyle = 'rgba(100, 200, 100, 0.6)';
        ctx.font = '10px monospace';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText(`x${entry.maxCraftable}`, listX + PANEL_W - PANEL_PAD * 2 - 4, ry + RECIPE_H - 4);
      }
    }

    // Close hint
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '13px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('C — zamknij', width / 2, height - 10);

    ctx.restore();
  }

  /** @returns {{ panelX: number, panelY: number, panelW: number, panelH: number }} */
  #getPanelRect() {
    const { width, height } = canvas;
    const listH = Math.min(this.#available.length, VISIBLE_RECIPES) * RECIPE_H;
    const panelH = listH + 36 + PANEL_PAD;
    const panelW = PANEL_W;
    const panelX = Math.round((width - panelW) / 2);
    const panelY = Math.round((height - panelH) / 2) - 30;
    return { panelX, panelY, panelW, panelH };
  }

  /** Draw a rounded rectangle path. */
  #roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}
