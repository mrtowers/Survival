import { ITEMS } from './items.js';
import { canvas } from './canvas.js';

const MAX_STACK = 999;
const HOTBAR_SIZE = 9;
const INV_SIZE = 24; // 6 × 4
const HOTBAR_SLOT = 40;
const HOTBAR_GAP = 4;
const INV_SLOT = 50;
const INV_GAP = 5;
const PANEL_PAD = 12;

export class Inventory {
  /** @type {({ type: string, count: number } | null)[]} */
  #hotbar = new Array(HOTBAR_SIZE).fill(null);
  /** @type {({ type: string, count: number } | null)[]} */
  #inventory = new Array(INV_SIZE).fill(null);
  /** @type {boolean} */
  #open = false;

  /** @type {{ array: 'hotbar'|'inventory', index: number, type: string, count: number } | null} */
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

  /** Toggle the full inventory screen. */
  toggle() {
    // Cancel any in-progress drag when closing
    if (this.#open) this.#returnDrag();
    this.#open = !this.#open;
  }

  get isOpen() {
    return this.#open;
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
          this.#dragSrc = { ...hit, type: slot.type, count: slot.count };
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
        arr[i] = { type: itemType, count: add };
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
        this.#setSlot(srcRef, { type: this.#dragSrc.type, count: this.#dragSrc.count });
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
      this.#setSlot(target, { type: this.#dragSrc.type, count: this.#dragSrc.count });
    } else if (tgtSlot.type === this.#dragSrc.type) {
      // Same type — merge
      const canAdd = MAX_STACK - tgtSlot.count;
      if (canAdd >= this.#dragSrc.count) {
        tgtSlot.count += this.#dragSrc.count;
      } else {
        tgtSlot.count = MAX_STACK;
        const leftover = this.#dragSrc.count - canAdd;
        const existing = this.#getSlot(srcRef);
        if (existing === null) {
          this.#setSlot(srcRef, { type: this.#dragSrc.type, count: leftover });
        } else if (existing.type === this.#dragSrc.type) {
          existing.count += leftover;
        } else {
          this.add(this.#dragSrc.type, leftover);
        }
      }
    } else {
      // Different type — swap
      this.#setSlot(target, { type: this.#dragSrc.type, count: this.#dragSrc.count });
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
      this.#setSlot(ref, { type: this.#dragSrc.type, count: this.#dragSrc.count });
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

    for (let i = 0; i < HOTBAR_SIZE; i++) {
      const sx = startX + i * (HOTBAR_SLOT + HOTBAR_GAP);
      this.#drawSlotBox(ctx, sx, y, HOTBAR_SLOT, 4);

      const slot = this.#hotbar[i];
      if (slot) {
        const isDragging = this.#dragSrc?.array === 'hotbar' && this.#dragSrc.index === i;
        if (!isDragging) {
          this.#drawSlotContent(ctx, sx, y, HOTBAR_SLOT, slot);
        }
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
    const item = ITEMS[d.type];
    const size = 36;

    ctx.save();
    ctx.translate(this.#dragMouseX, this.#dragMouseY);

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    roundRect(ctx, -size / 2 + 2, -size / 2 + 2, size, size, 4);
    ctx.fill();

    // Color square
    ctx.fillStyle = item.color;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 2;
    roundRect(ctx, -size / 2, -size / 2, size, size, 4);
    ctx.fill();
    ctx.stroke();

    // Count
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
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
    const r = Math.max(2, Math.round(sz / 12));
    const fontSize = Math.round(sz / 3);

    ctx.fillStyle = item.color;
    roundRect(ctx, x + pad / 2, y + pad / 2, sz - pad, sz - pad, r);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = `bold ${fontSize}px monospace`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(String(slot.count), x + sz - pad, y + sz - pad);
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

