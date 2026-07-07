import { PLAYER_SPEED, TEXTURES } from './constants.js';
import { Animation } from './game-object.js';

export class Player {
  x = 0;
  y = 0;
  hp = 100;
  food = 100;
  water = 100;
  /** Max values */
  maxHp = 100;
  maxFood = 100;
  maxWater = 100;

  /** Which direction the player faces: 1 = right, -1 = left */
  facing = 1;
  /** Death state */
  dead = false;
  /** Invincibility frames after taking damage */
  invincibleTimer = 0;
  invincibleDuration = 0.5;

  /** Currently equipped item (set by main.js from inventory selection) */
  _equippedItem = null;
  /** Armor reduction multiplier (0 = no reduction, 0.2 = 80% reduction for FIBER_ARMOR) */
  armor = 0;

  #animation;
  #headTexture = TEXTURES.HEAD_1;
  #bodyFrames = [
    TEXTURES.BODY_1,
    TEXTURES.BODY_1B,
    TEXTURES.BODY_1,
    TEXTURES.BODY_1C,
  ];
  /** Timers for damage over time */
  #starvationTimer = 0;
  #dehydrationTimer = 0;
  #regenTimer = 0;
  #hungerDrainTimer = 0;
  #thirstDrainTimer = 0;
  /** @type {boolean} */
  #nearCampfire = false;

  /**
   * Set whether the player is near a campfire (warmth comfort).
   * @param {boolean} val
   */
  setNearCampfire(val) {
    this.#nearCampfire = val;
  }

  constructor() {
    this.#animation = new Animation('walking', this.#bodyFrames, 0.1);
  }

  /** Equipped item from hotbar selection. */
  get equippedItem() {
    return this._equippedItem;
  }

  set equippedItem(val) {
    this._equippedItem = val;
  }

  /**
   * Tool power bonus based on equipped item.
   * Used for resource gathering speed/effectiveness.
   */
  get toolLevel() {
    if (!this._equippedItem) return 1;
    const type = this._equippedItem.type;
    if (type === 'STONE_AXE') return 3;
    if (type === 'STONE_PICKAXE') return 3;
    if (type === 'STONE_SWORD') return 5;
    return 1;
  }

  /**
   * Attack a target with the equipped weapon.
   * @param {import('./game-object.js').GameObject|import('./mob.js').Mob} target
   * @returns {number} damage dealt
   */
  attack(target) {
    const isMob = target.constructor.name === 'Mob' || target.name === 'mob';
    if (isMob) {
      // Mob combat damage
      if (this._equippedItem && this._equippedItem.type === 'STONE_SWORD') {
        return 8;
      }
      return 3; // base hand damage
    }
    // Resource damage — toolLevel adds bonus damage per hit
    return this.toolLevel;
  }

  get textureHead() {
    return this.#headTexture;
  }

  get textureBody() {
    return this.#animation.texture;
  }

  /** True when HP is dangerously low (< 30). */
  get isLowHealth() {
    return this.hp < 30;
  }

  /** True when player is dead (HP <= 0). */
  get isDead() {
    return this.dead || this.hp <= 0;
  }

  /** Consume an item from inventory, restoring stats. */
  consume(itemType) {
    switch (itemType) {
      case 'BERRY':
        this.food = Math.min(this.maxFood, this.food + 8);
        this.water = Math.min(this.maxWater, this.water + 2);
        return true;
      case 'MUSHROOM':
        this.food = Math.min(this.maxFood, this.food + 5);
        this.water = Math.max(0, this.water - 2);
        return true;
      case 'RAW_MEAT':
        this.food = Math.min(this.maxFood, this.food + 12);
        this.water = Math.max(0, this.water - 3);
        return true;
      case 'COOKED_MEAT':
        this.food = Math.min(this.maxFood, this.food + 25);
        this.water = Math.min(this.maxWater, this.water + 5);
        return true;
      default:
        return false;
    }
  }

  /** Is the player blinking (invincibility visual)? */
  get blinking() {
    return this.invincibleTimer > 0;
  }

  /**
   * Apply damage to the player. Respects invincibility frames and armor.
   * @param {number} amount
   */
  takeDamage(amount) {
    if (this.invincibleTimer > 0) return;
    // Armor reduces damage (armor = 0.2 means 20% damage taken, 80% reduced)
    const reduced = this.armor > 0 ? Math.round(amount * this.armor) : amount;
    this.hp = Math.max(0, this.hp - reduced);
    this.invincibleTimer = this.invincibleDuration;
  }

  /** Handle death — flag as dead. */
  die() {
    this.dead = true;
  }

  /**
   * Respawn the player at origin with half stats.
   */
  respawn() {
    this.x = 0;
    this.y = 0;
    this.hp = 50;
    this.food = 50;
    this.water = 50;
    this.dead = false;
    this.armor = 0;
    this._equippedItem = null;
    this.#starvationTimer = 0;
    this.#dehydrationTimer = 0;
    this.#regenTimer = 0;
    this.#hungerDrainTimer = 0;
    this.#thirstDrainTimer = 0;
  }

  /**
   * Full update: movement + life support systems.
   * @param {import('./input.js').InputManager} input
   * @param {number} delta Time in seconds
   * @param {string} [biomeType] Optional biome type for modifiers
   */
  update(input, delta, biomeType) {
    // Decrease invincibility timer
    if (this.invincibleTimer > 0) {
      this.invincibleTimer -= delta;
    }

    // ---- Movement ----

    let dx = 0;
    let dy = 0;

    if (input.isDown('w')) dy -= 1;
    if (input.isDown('s')) dy += 1;
    if (input.isDown('a')) dx -= 1;
    if (input.isDown('d')) dx += 1;

    // Normalize diagonal movement so it's not faster
    if (dx !== 0 && dy !== 0) {
      const inv = 1 / Math.SQRT2;
      dx *= inv;
      dy *= inv;
    }

    const speed = PLAYER_SPEED * delta;
    this.x += dx * speed;
    this.y += dy * speed;

    // Update facing direction (based on horizontal input)
    if (dx < 0) this.facing = -1;
    else if (dx > 0) this.facing = 1;

    const moving = dx !== 0 || dy !== 0;
    if (moving) {
      this.#animation.play();
    } else {
      this.#animation.stop();
      this.#animation.reset();
    }

    // ---- Life support ----

    if (this.dead || this.hp <= 0) {
      if (this.hp <= 0 && !this.dead) {
        this.die();
      }
      return;
    }

    // Hunger drain: 0.3/s idle, 0.6/s moving
    // Campfire warmth reduces hunger drain by 50%
    let hungerRate = moving ? 0.6 : 0.3;
    if (this.#nearCampfire) {
      hungerRate *= 0.5;
    }
    this.#hungerDrainTimer += delta;
    while (this.#hungerDrainTimer >= 1.0) {
      this.#hungerDrainTimer -= 1.0;
      this.food = Math.max(0, this.food - hungerRate);
    }

    // Thirst drain: 0.4/s idle, 0.7/s moving
    let thirstRate = moving ? 0.7 : 0.4;
    // Desert biome accelerates thirst
    if (biomeType === 'desert') {
      thirstRate *= 1.5;
    }
    this.#thirstDrainTimer += delta;
    while (this.#thirstDrainTimer >= 1.0) {
      this.#thirstDrainTimer -= 1.0;
      this.water = Math.max(0, this.water - thirstRate);
    }

    // Starvation damage: 1 damage/second when food <= 0
    if (this.food <= 0) {
      this.#starvationTimer += delta;
      while (this.#starvationTimer >= 1.0) {
        this.#starvationTimer -= 1.0;
        this.hp = Math.max(0, this.hp - 1);
      }
    } else {
      this.#starvationTimer = 0;
    }

    // Dehydration damage: 1 damage/second when water <= 0
    if (this.water <= 0) {
      this.#dehydrationTimer += delta;
      while (this.#dehydrationTimer >= 1.0) {
        this.#dehydrationTimer -= 1.0;
        this.hp = Math.max(0, this.hp - 1);
      }
    } else {
      this.#dehydrationTimer = 0;
    }

    // Health regeneration: when food > 50 AND water > 50, regen 2 HP/s up to 80
    if (this.food > 50 && this.water > 50 && this.hp > 0 && this.hp < 80) {
      this.#regenTimer += delta;
      while (this.#regenTimer >= 1.0) {
        this.#regenTimer -= 1.0;
        this.hp = Math.min(80, this.hp + 2);
      }
    } else {
      this.#regenTimer = 0;
    }

    // Check death
    if (this.hp <= 0) {
      this.die();
    }
  }
}
