import { ITEMS } from './items.js';
import { canvas } from './canvas.js';
import { getItemIcon } from './item-icons.js';

const MAX_STACK = 999;
const HOTBAR_SIZE = 9;
const INV_SIZE = 24; // 6 × 4
const HOTBAR_SLOT = 40;
const HOTBAR_GAP = 4;
const INV_SLOT = 50;
const INV_GAP = 5;
const PANEL_PAD = 12;

/** Items that have durability (tools, weapons). */
const DURABLE_ITEMS = {
  STONE_AXE: 30,
  STONE_PICKAXE: 30,
  STONE_SWORD: 25,
};

export class Inventory {
  /** @type {({ type: string, count: number, durability?: number } | null)[]} */
  #hotbar = new Array(HOTBAR_SIZE).fill(null);
  /** @type {({ type: string, count: number, durability?: number } | null)[]} */
  #inventory = new Array(INV_SIZE).fill(null);
  /** @type {boolean} */
  #open = false;

  /** Currently selected hotbar slot (0-8). */
  selectedSlot = 0;

  /** @type {{ array: 'hotbar'|'inventory', index: number, type: string, count: number, durability?: number } | null} */
  #dragSrc = null;
  #dragMouseX = 0;
  #dragMouseY = 0;

  /**
   * Add items, filling existing stacks then empty slots.
   * @param {string} itemType
   * @param {number} count
   */
  add(itemType, count) {
    let remaining = count;
    // 1) fill partial stacks in hotbar first
    remaining = this.#fillStacks(this.#hotbar, itemType, remaining);
    // 2) fill partial stacks in inventory
    remaining = this.#fillStacks(this.#inventory, itemType, remaining);
    // 3) empty slots in hotbar
    remaining = this.#fillEmpty(this.#hotbar, itemType, remaining);
    // 4) empty slots in inventory
    this.#fillEmpty(this.#inventory, itemType, remaining);
  }

  /** @param {string} itemType */
  getCount(itemType) {
    let total = 0;
    for (const slot of this.#hotbar) {
      if (slot && slot.type === itemType) total += slot.count;
    }
    for (const slot of this.#inventory) {
      if (slot && slot.type === itemType) total += slot.count;
    }
    return total;
  }

  /**
   * Remove up to `count` items of the given type from the inventory.
   * Removes from hotbar first, then inventory.
   * @param {string} itemType
   * @param {number} count
   * @returns {number} actual number removed
   */
  remove(itemType, count) {
    let remaining = count;
    remaining = this.#removeFromArray(this.#hotbar, itemType, remaining);
    remaining = this.#removeFromArray(this.#inventory, itemType, remaining);
    return count - remaining;
  }

  /**
   * Iterate over all slots (hotbar then inventory) with a callback.
   * @param {(slot: ({ type: string, count: number } | null), index: number, array: 'hotbar'|'inventory') => void} fn
   */
  forEachSlot(fn) {
    for (let i = 0; i < this.#hotbar.length; i++) {
      fn(this.#hotbar[i], i, 'hotbar');
    }
    for (let i = 0; i < this.#inventory.length; i++) {
      fn(this.#inventory[i], i, 'inventory');
    }
  }

  /** Remove items from a single array, returning remaining. */
  #removeFromArray(arr, itemType, remaining) {
    for (let i = 0; i < arr.length && remaining > 0; i++) {
      const slot = arr[i];
      if (slot && slot.type === itemType) {
        const take = Math.min(slot.count, remaining);
        slot.count -= take;
        remaining -= take;
        if (slot.count <= 0) arr[i] = null;
      }
    }
    return remaining;
  }

  /** Toggle the full inventory screen. */
  toggle() {
    // Cancel any in-progress drag when closing
    if (this.#open) this.#returnDrag();
    this.#open = !this.#open;
  }

  get isOpen() {
    return this.#open;
  }

  /**
   * Get the item in a hotbar slot.
   * @param {number} index 0-8
   * @returns {{ type: string, count: number } | null}
   */
  getHotbarSlot(index) {
    if (index < 0 || index >= HOTBAR_SIZE) return null;
    return this.#hotbar[index];
  }

  /**
   * Set a hotbar slot.
   * @param {number} index 0-8
   * @param {{ type: string, count: number, durability?: number } | null} value
   */
  setHotbarSlot(index, value) {
    if (index < 0 || index >= HOTBAR_SIZE) return;
    this.#hotbar[index] = value;
  }

  /**
   * Select a hotbar slot by index (0-8). Clamps to valid range.
   * @param {number} index
   */
  selectSlot(index) {
    if (index < 0) index = HOTBAR_SIZE - 1;
    if (index >= HOTBAR_SIZE) index = 0;
    this.selectedSlot = index;
  }

  /**
   * Get the item in the currently selected hotbar slot.
   * @returns {{ type: string, count: number, durability?: number } | null}
   */
  getSelectedItem() {
    return this.#hotbar[this.selectedSlot] || null;
  }

  /**
   * Get the durability of a slot item, or null if not a durable item.
   * @param {{ type: string, count: number, durability?: number } | null} slot
   * @returns {number|null}
   */
  getDurability(slot) {
    if (!slot || slot.durability === undefined) return null;
    return slot.durability;
  }

  /**
   * Consume one durability use from the selected slot.
   * If durability reaches 0, the item is removed from the slot.
   * @returns {boolean} true if the item is still usable (not broken)
   */
  useSelectedDurability() {
    const slot = this.#hotbar[this.selectedSlot];
    if (!slot || slot.durability === undefined) return false;
    slot.durability--;
    if (slot.durability <= 0) {
      this.#hotbar[this.selectedSlot] = null;
      return false;
    }
    return true;
  }

  // ----- Drag & drop -----

  /**
   * Process drag start/end. Called once per frame from main loop.
   * @param {boolean} justDown - mouse pressed this frame
   * @param {boolean} justUp - mouse released this frame
   * @param {number} mx
   * @param {number} my
   */
  handleDrag(justDown, justUp, mx, my) {
    this.#dragMouseX = mx;
    this.#dragMouseY = my;

    if (justDown) {
      if (this.#dragSrc) {
        // Cancel any in-flight drag (mouse was released outside canvas)
        this.#returnDrag();
      }
      const hit = this.#slotAt(mx, my);
      if (hit) {
        const slot = this.#getSlot(hit);
        if (slot) {
          this.#dragSrc = { ...hit, type: slot.type, count: slot.count, durability: slot.durability };
          this.#setSlot(hit, null); // pick up
        }
      }
    }

    if (justUp && this.#dragSrc) {
      const target = this.#slotAt(mx, my);
      if (!target) {
        this.#returnDrag();
        return;
      }
      this.#moveDrag(target);
    }
  }

  // ----- Slot helpers -----

  /**
   * @param {{ array: string, index: number }} ref
   * @returns {({ type: string, count: number } | null)}
   */
  #getSlot(ref) {
    const arr = ref.array === 'hotbar' ? this.#hotbar : this.#inventory;
    return arr[ref.index];
  }

  /**
   * @param {{ array: string, index: number }} ref
   * @param {{ type: string, count: number } | null} val
   */
  #setSlot(ref, val) {
    const arr = ref.array === 'hotbar' ? this.#hotbar : this.#inventory;
    arr[ref.index] = val;
  }

  /** @param {string} itemType */
  #removeAll(itemType) {
    for (let i = 0; i < this.#hotbar.length; i++) {
      if (this.#hotbar[i]?.type === itemType) this.#hotbar[i] = null;
    }
    for (let i = 0; i < this.#inventory.length; i++) {
      if (this.#inventory[i]?.type === itemType) this.#inventory[i] = null;
    }
  }

  /**
   * Fill existing partial stacks of the same type.
   * @param {({ type: string, count: number } | null)[]} arr
   * @param {string} itemType
   * @param {number} remaining
   * @returns {number} still remaining
   */
  #fillStacks(arr, itemType, remaining) {
    for (let i = 0; i < arr.length && remaining > 0; i++) {
      const slot = arr[i];
      if (slot && slot.type === itemType && slot.count < MAX_STACK) {
        const canAdd = MAX_STACK - slot.count;
        const add = Math.min(canAdd, remaining);
        slot.count += add;
        remaining -= add;
      }
    }
    return remaining;
  }

  /**
   * Fill empty slots.
   * @param {({ type: string, count: number } | null)[]} arr
   * @param {string} itemType
   * @param {number} remaining
   * @returns {number} still remaining
   */
  #fillEmpty(arr, itemType, remaining) {
    for (let i = 0; i < arr.length && remaining > 0; i++) {
      if (arr[i] === null) {
        const add = Math.min(MAX_STACK, remaining);
        const slot = { type: itemType, count: add };
        // Initialize durability for tools
        if (DURABLE_ITEMS[itemType] !== undefined) {
          slot.durability = DURABLE_ITEMS[itemType];
        }
        arr[i] = slot;
        remaining -= add;
      }
    }
    return remaining;
  }

  /**
   * Move/merge the dragged item into a target slot.
   * @param {{ array: 'hotbar'|'inventory', index: number }} target
   */
  #moveDrag(target) {
    if (!this.#dragSrc) return;
    const srcRef = { array: this.#dragSrc.array, index: this.#dragSrc.index };
    const tgtSlot = this.#getSlot(target);

    // Same slot — put back
    if (this.#dragSrc.array === target.array && this.#dragSrc.index === target.index) {
      const existing = this.#getSlot(srcRef);
      if (existing === null) {
        this.#setSlot(srcRef, { type: this.#dragSrc.type, count: this.#dragSrc.count, durability: this.#dragSrc.durability });
      } else if (existing.type === this.#dragSrc.type) {
        existing.count += this.#dragSrc.count;
      } else {
        this.add(this.#dragSrc.type, this.#dragSrc.count);
      }
      this.#dragSrc = null;
      return;
    }

    if (tgtSlot === null) {
      // Empty target — move
      this.#setSlot(target, { type: this.#dragSrc.type, count: this.#dragSrc.count, durability: this.#dragSrc.durability });
    } else if (tgtSlot.type === this.#dragSrc.type) {
      // Same type — merge (tools shouldn't merge since count=1, but handle anyway)
      const canAdd = MAX_STACK - tgtSlot.count;
      if (canAdd >= this.#dragSrc.count) {
        tgtSlot.count += this.#dragSrc.count;
        // Preserve target durability on merge (newer tool's durability)
        if (this.#dragSrc.durability !== undefined) {
          tgtSlot.durability = this.#dragSrc.durability;
        }
      } else {
        tgtSlot.count = MAX_STACK;
        const leftover = this.#dragSrc.count - canAdd;
        const existing = this.#getSlot(srcRef);
        if (existing === null) {
          this.#setSlot(srcRef, { type: this.#dragSrc.type, count: leftover, durability: this.#dragSrc.durability });
        } else if (existing.type === this.#dragSrc.type) {
          existing.count += leftover;
        } else {
          this.add(this.#dragSrc.type, leftover);
        }
      }
    } else {
      // Different type — swap
      this.#setSlot(target, { type: this.#dragSrc.type, count: this.#dragSrc.count, durability: this.#dragSrc.durability });
      this.#setSlot(srcRef, tgtSlot);
    }
    this.#dragSrc = null;
  }

  /**
   * Return dragged item to its original slot.
   */
  #returnDrag() {
    if (!this.#dragSrc) return;
    const ref = { array: this.#dragSrc.array, index: this.#dragSrc.index };
    const existing = this.#getSlot(ref);
    if (existing === null) {
      this.#setSlot(ref, { type: this.#dragSrc.type, count: this.#dragSrc.count, durability: this.#dragSrc.durability });
    } else if (existing.type === this.#dragSrc.type) {
      existing.count += this.#dragSrc.count;
    } else {
      // Slot got taken — find any empty slot
      this.add(this.#dragSrc.type, this.#dragSrc.count);
    }
    this.#dragSrc = null;
  }

  // ----- Hit-test -----

  /**
   * Find a slot at the given screen position.
   * @returns {{ array: 'hotbar'|'inventory', index: number } | null}
   */
  #slotAt(mx, my) {
    // Check inventory first (rendered above hotbar)
    if (this.#open) {
      const result = this.#slotInPanel(mx, my);
      if (result) return result;
    }
    // Check hotbar
    const result = this.#slotInHotbar(mx, my);
    if (result) return result;
    return null;
  }

  /** @returns {{ array: 'hotbar', index: number } | null} */
  #slotInHotbar(mx, my) {
    const { width, height } = canvas;
    const totalW = HOTBAR_SIZE * (HOTBAR_SLOT + HOTBAR_GAP) - HOTBAR_GAP;
    const startX = Math.round((width - totalW) / 2);
    const y = height - 50;
    const col = Math.floor((mx - startX) / (HOTBAR_SLOT + HOTBAR_GAP));
    if (col < 0 || col >= HOTBAR_SIZE) return null;
    const sx = startX + col * (HOTBAR_SLOT + HOTBAR_GAP);
    if (mx < sx || mx > sx + HOTBAR_SLOT) return null;
    if (my < y || my > y + HOTBAR_SLOT) return null;
    return { array: 'hotbar', index: col };
  }

  /** @returns {{ array: 'inventory', index: number } | null} */
  #slotInPanel(mx, my) {
    const { width, height } = canvas;
    const cols = 6;
    const gridW = cols * (INV_SLOT + INV_GAP) - INV_GAP;
    const gridX = Math.round((width - gridW) / 2);
    const rows = 4;
    const panelH = rows * (INV_SLOT + INV_GAP) - INV_GAP + PANEL_PAD * 2;
    const panelY = Math.round((height - panelH) / 2) - 30;
    const gridY = panelY + PANEL_PAD;

    const col = Math.floor((mx - gridX) / (INV_SLOT + INV_GAP));
    const row = Math.floor((my - gridY) / (INV_SLOT + INV_GAP));
    if (col < 0 || col >= cols || row < 0 || row >= rows) return null;
    const sx = gridX + col * (INV_SLOT + INV_GAP);
    const sy = gridY + row * (INV_SLOT + INV_GAP);
    if (mx < sx || mx > sx + INV_SLOT) return null;
    if (my < sy || my > sy + INV_SLOT) return null;
    return { array: 'inventory', index: row * cols + col };
  }

  // ----- Rendering -----

  /**
   * Render hotbar + optionally full inventory.
   * @param {CanvasRenderingContext2D} ctx
   */
  render(ctx) {
    this.#drawHotbar(ctx);
    if (this.#open) {
      this.#drawInventoryPanel(ctx);
    }
    // Draw dragged item on top of everything
    if (this.#dragSrc) {
      this.#drawDraggedItem(ctx);
    }
  }

  // ---- Hotbar ----

  #drawHotbar(ctx) {
    const { width, height } = canvas;
    const totalW = HOTBAR_SIZE * (HOTBAR_SLOT + HOTBAR_GAP) - HOTBAR_GAP;
    const startX = Math.round((width - totalW) / 2);
    const y = height - 50;

    ctx.save();

    // Panel background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    const bp = 6;
    roundRect(ctx, startX - bp, y - bp, totalW + bp * 2, HOTBAR_SLOT + bp * 2, 6);
    ctx.fill();
    ctx.stroke();

    // Equipped item name above hotbar
    const selectedSlot = this.#hotbar[this.selectedSlot];
    if (selectedSlot) {
      const itemDef = ITEMS[selectedSlot.type];
      if (itemDef) {
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.lineWidth = 3;
        ctx.font = 'bold 13px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        const labelY = y - bp - 4;
        ctx.strokeText(itemDef.name, width / 2, labelY);
        ctx.fillText(itemDef.name, width / 2, labelY);
      }
    }

    for (let i = 0; i < HOTBAR_SIZE; i++) {
      const sx = startX + i * (HOTBAR_SLOT + HOTBAR_GAP);
      this.#drawSlotBox(ctx, sx, y, HOTBAR_SLOT, 4);

      const slot = this.#hotbar[i];
      if (slot) {
        const isDragging = this.#dragSrc?.array === 'hotbar' && this.#dragSrc.index === i;
        if (!isDragging) {
          this.#drawSlotContent(ctx, sx, y, HOTBAR_SLOT, slot);
          // Draw durability bar for tools
          if (slot.durability !== undefined && DURABLE_ITEMS[slot.type] !== undefined) {
            this.#drawDurabilityBar(ctx, sx, y, HOTBAR_SLOT, slot.durability, DURABLE_ITEMS[slot.type]);
          }
        }
      }

      // Selected slot highlight (golden border)
      if (i === this.selectedSlot) {
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2.5;
        roundRect(ctx, sx - 2, y - 2, HOTBAR_SLOT + 4, HOTBAR_SLOT + 4, 5);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  // ---- Inventory panel ----

  #drawInventoryPanel(ctx) {
    const { width, height } = canvas;
    const cols = 6;
    const rows = 4;
    const gridW = cols * (INV_SLOT + INV_GAP) - INV_GAP;
    const gridH = rows * (INV_SLOT + INV_GAP) - INV_GAP;
    const gridX = Math.round((width - gridW) / 2);
    const panelY = Math.round((height - (gridH + PANEL_PAD * 2)) / 2) - 30;
    const gridY = panelY + PANEL_PAD;

    ctx.save();

    // Panel background (semi-transparent, no full overlay)
    ctx.fillStyle = 'rgba(10, 10, 10, 0.75)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 2;
    roundRect(ctx, gridX - PANEL_PAD, panelY - PANEL_PAD - 30,
      gridW + PANEL_PAD * 2, gridH + PANEL_PAD * 2 + 36, 8);
    ctx.fill();
    ctx.stroke();

    // Title
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Ekwipunek', width / 2, panelY - PANEL_PAD - 12);

    // Slots
    for (let i = 0; i < INV_SIZE; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const sx = gridX + col * (INV_SLOT + INV_GAP);
      const sy = gridY + row * (INV_SLOT + INV_GAP);

      this.#drawSlotBox(ctx, sx, sy, INV_SLOT, 5);

      const slot = this.#inventory[i];
      if (slot) {
        const isDragging = this.#dragSrc?.array === 'inventory' && this.#dragSrc.index === i;
        if (!isDragging) {
          this.#drawSlotContent(ctx, sx, sy, INV_SLOT, slot);
        }
      }
    }

    // Close hint
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '13px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('E — zamknij', width / 2, height - 10);

    ctx.restore();
  }

  // ---- Dragged item ----

  #drawDraggedItem(ctx) {
    if (!this.#dragSrc) return;
    const d = this.#dragSrc;
    const size = 36;

    ctx.save();
    ctx.translate(this.#dragMouseX, this.#dragMouseY);

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    roundRect(ctx, -size / 2 + 2, -size / 2 + 2, size, size, 4);
    ctx.fill();

    // Texture
    const tex = getItemIcon(d.type);
    ctx.drawImage(tex, -size / 2, -size / 2, size, size);

    // Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 2;
    roundRect(ctx, -size / 2, -size / 2, size, size, 4);
    ctx.stroke();

    // Count
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.lineWidth = 2;
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.strokeText(String(d.count), size / 2 - 2, size / 2 - 2);
    ctx.fillText(String(d.count), size / 2 - 2, size / 2 - 2);

    ctx.restore();
  }

  // ---- Slot helpers ----

  #drawSlotBox(ctx, x, y, sz, r) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    roundRect(ctx, x, y, sz, sz, r);
    ctx.fill();
    ctx.stroke();
  }

  #drawSlotContent(ctx, x, y, sz, slot) {
    const item = ITEMS[slot.type];
    const pad = Math.round(sz / 10);
    const iconSize = sz - pad;

    // Draw item texture scaled to slot
    const tex = getItemIcon(slot.type);
    ctx.drawImage(tex, x + pad / 2, y + pad / 2, iconSize, iconSize);

    // Count with outline
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.lineWidth = 2;
    const fontSize = Math.round(sz / 3.2);
    ctx.font = `bold ${fontSize}px monospace`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.strokeText(String(slot.count), x + sz - pad / 2, y + sz - pad / 2);
    ctx.fillText(String(slot.count), x + sz - pad / 2, y + sz - pad / 2);
  }

  /**
   * Draw a durability bar below the item icon in a slot.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x
   * @param {number} y
   * @param {number} sz - slot size
   * @param {number} durability
   * @param {number} maxDurability
   */
  #drawDurabilityBar(ctx, x, y, sz, durability, maxDurability) {
    const barW = sz - 6;
    const barH = 3;
    const barX = x + 3;
    const barY = y + sz - 6;
    const ratio = Math.max(0, durability / maxDurability);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(barX, barY, barW, barH);

    const color = ratio > 0.5 ? '#4CAF50' : ratio > 0.25 ? '#FF9800' : '#F44336';
    ctx.fillStyle = color;
    ctx.fillRect(barX, barY, barW * ratio, barH);
  }
}

/** Draw a rounded rectangle path. */
function roundRect(ctx, x, y, w, h, r) {
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

