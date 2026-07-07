import { TILE_SIZE } from './constants.js';
import { getMobTexture } from './mob-icons.js';

// ─── Mob Types ──────────────────────────────────────────────────────

const MOB_TYPES = {
  zombie: {
    hp: 20,
    speed: 60,
    damage: 8,
    attackRange: 30,
    attackCooldown: 1.0,
    detectionRange: 200,
    loseRange: 300,
    sizeX: 1,
    sizeY: 1.5,
    loot: [{ type: 'ROTTEN_FLESH', min: 1, max: 2 }],
    color: '#3A7A3A',
  },
  wolf: {
    hp: 15,
    speed: 120,
    damage: 5,
    attackRange: 25,
    attackCooldown: 0.8,
    detectionRange: 250,
    loseRange: 350,
    sizeX: 1,
    sizeY: 1,
    loot: [{ type: 'RAW_MEAT', min: 1, max: 2 }],
    color: '#6A6A6A',
  },
  slime: {
    hp: 10,
    speed: 40,
    damage: 3,
    attackRange: 20,
    attackCooldown: 0.6,
    detectionRange: 150,
    loseRange: 280,
    sizeX: 0.8,
    sizeY: 0.8,
    loot: [{ type: 'SLIME_BALL', min: 1, max: 1 }],
    color: '#4AAA4A',
  },
};

// ─── Mob Class ──────────────────────────────────────────────────────

class Mob {
  x;
  y;
  type;
  hp;
  hpMax;
  speed;
  damage;
  attackRange;
  attackCooldown;
  detectionRange;
  loseRange;
  state = 'idle';
  stateTimer = 0;
  facing = 1; // 1 = right, -1 = left
  sizeX;
  sizeY;
  loot;
  color;
  /** Time until next attack */
  attackTimer = 0;
  /** Death timer before despawn */
  deathTimer = 2;
  visible = true;
  name = 'mob';

  /** Wander target direction */
  wanderDx = 0;
  wanderDy = 0;

  /** For bouncy slime animation */
  bounceTimer = 0;
  bounceOffset = 0;

  /** Invincibility frames after being hit (0.2s) */
  hitTimer = 0;
  hitCooldown = 0.2;
  /** Knockback velocity */
  knockbackVx = 0;
  knockbackVy = 0;
  /** Red flash timer for hit visual */
  flashTimer = 0;

  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;

    const def = MOB_TYPES[type];
    this.hp = def.hp;
    this.hpMax = def.hp;
    this.speed = def.speed;
    this.damage = def.damage;
    this.attackRange = def.attackRange;
    this.attackCooldown = def.attackCooldown;
    this.detectionRange = def.detectionRange;
    this.loseRange = def.loseRange;
    this.sizeX = def.sizeX;
    this.sizeY = def.sizeY;
    this.loot = def.loot;
    this.color = def.color;

    // Start with a random idle time
    this.stateTimer = 2 + Math.random() * 3;
  }

  get texture() {
    return getMobTexture(this.type);
  }

  /** Depth for Y-sorted rendering */
  get renderDepth() {
    return this.y;
  }

  /**
   * Take damage. Returns true if still alive.
   * Respects invincibility frames.
   * @param {number} amount
   */
  hit(amount) {
    if (this.hitTimer > 0) return this.hp > 0;
    this.hp -= amount;
    this.hitTimer = this.hitCooldown;
    this.flashTimer = 0.15;
    return this.hp > 0;
  }

  /**
   * Take damage with knockback.
   * @param {number} amount
   * @param {{ x: number, y: number }} knockbackDir - normalized direction from attacker to mob
   * @returns {boolean} true if still alive
   */
  takeDamage(amount, knockbackDir) {
    const alive = this.hit(amount);
    if (knockbackDir) {
      this.knockbackVx = knockbackDir.x * 200;
      this.knockbackVy = knockbackDir.y * 200;
    }
    return alive;
  }

  /**
   * Check if this mob is within a given range of a point.
   * @param {number} px
   * @param {number} py
   * @param {number} range
   * @returns {boolean}
   */
  isInRange(px, py, range) {
    const dx = this.x - px;
    const dy = this.y - py;
    return dx * dx + dy * dy <= range * range;
  }
}

// ─── MobManager ─────────────────────────────────────────────────────

const MAX_MOBS = 10;
const SPAWN_MIN_DIST = 200;
const SPAWN_MAX_DIST = 400;

export class MobManager {
  /** @type {Mob[]} */
  #mobs = [];
  /** Reference to the player for damage */
  #onPlayerDamage = null;

  /**
   * Set callback for dealing damage to player.
   * @param {function(number, Mob): void} fn
   */
  set onPlayerDamage(fn) {
    this.#onPlayerDamage = fn;
  }

  /** @returns {Mob[]} */
  getMobs() {
    return this.#mobs;
  }

  /**
   * Check if any mobs are in attack range of the player.
   * Used to trigger damage on the player.
   * @param {number} playerX
   * @param {number} playerY
   * @param {function} takeDamageFn
   */
  #applyMobDamage(playerX, playerY, takeDamageFn) {
    for (const mob of this.#mobs) {
      if (mob.state !== 'attack') continue;
      const dx = playerX - mob.x;
      const dy = playerY - mob.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < mob.attackRange + 10 && mob.attackTimer <= 0) {
        takeDamageFn(mob.damage);
        mob.attackTimer = mob.attackCooldown;
      }
    }
  }

  /**
   * Spawn a mob pack at a random position around the player.
   * @param {'zombie'|'wolf'|'slime'} type
   * @param {number} playerX
   * @param {number} playerY
   * @param {GameMap} map
   */
  #spawnPack(type, playerX, playerY, map) {
    const angle = Math.random() * Math.PI * 2;
    const dist = SPAWN_MIN_DIST + Math.random() * (SPAWN_MAX_DIST - SPAWN_MIN_DIST);
    const baseX = playerX + Math.cos(angle) * dist;
    const baseY = playerY + Math.sin(angle) * dist;

    // Don't spawn on blocked tiles
    if (map.isBlocked(baseX, baseY)) return;

    const count = type === 'wolf' ? 2 + Math.floor(Math.random() * 2) : 1;

    for (let i = 0; i < count && this.#mobs.length < MAX_MOBS; i++) {
      const offsetAngle = (i / count) * Math.PI * 2;
      const offsetDist = 20 + Math.random() * 30;
      const mx = baseX + Math.cos(offsetAngle) * offsetDist;
      const my = baseY + Math.sin(offsetAngle) * offsetDist;
      if (!map.isBlocked(mx, my)) {
        this.#mobs.push(new Mob(mx, my, type));
      }
    }
  }

  /**
   * Main update loop.
   * @param {number} dt
   * @param {import('./player.js').Player} player
   * @param {import('./map.js').GameMap} map
   * @param {boolean} isNight
   * @param {function(number): void} takeDamageFn
   */
  update(dt, player, map, isNight, takeDamageFn) {
    // ── Spawn logic ──
    if (this.#mobs.length < MAX_MOBS && Math.random() < dt * 0.4) {
      // Only spawn at night
      if (isNight) {
        const types = ['zombie', 'wolf', 'slime'];
        const type = types[Math.floor(Math.random() * types.length)];
        this.#spawnPack(type, player.x, player.y, map);
      }
    }

    // ── Apply mob damage to player ──
    if (takeDamageFn) {
      this.#applyMobDamage(player.x, player.y, takeDamageFn);
    }

    // ── Update each mob ──
    for (let i = this.#mobs.length - 1; i >= 0; i--) {
      const mob = this.#mobs[i];
      const dx = player.x - mob.x;
      const dy = player.y - mob.y;
      const distToPlayer = Math.sqrt(dx * dx + dy * dy);

      // Decrease timers
      if (mob.attackTimer > 0) mob.attackTimer -= dt;
      if (mob.hitTimer > 0) mob.hitTimer -= dt;
      if (mob.flashTimer > 0) mob.flashTimer -= dt;

      // Apply knockback (decays over time) — moves mob directly
      if (mob.knockbackVx !== 0 || mob.knockbackVy !== 0) {
        mob.x += mob.knockbackVx * dt;
        mob.y += mob.knockbackVy * dt;
        mob.knockbackVx *= 0.85;
        mob.knockbackVy *= 0.85;
        if (Math.abs(mob.knockbackVx) < 5 && Math.abs(mob.knockbackVy) < 5) {
          mob.knockbackVx = 0;
          mob.knockbackVy = 0;
        }
      }

      // State machine
      switch (mob.state) {
        case 'idle':
          this.#updateIdle(mob, dt, distToPlayer);
          break;
        case 'wander':
          this.#updateWander(mob, dt, map, distToPlayer);
          break;
        case 'chase':
          this.#updateChase(mob, dt, map, dx, dy, distToPlayer);
          break;
        case 'attack':
          this.#updateAttack(mob, dt, dx, dy, distToPlayer);
          break;
        case 'death':
          this.#updateDeath(mob, dt);
          break;
      }

      // Slime bouncy animation
      if (mob.type === 'slime' && mob.state !== 'death') {
        mob.bounceTimer += dt;
        mob.bounceOffset = Math.abs(Math.sin(mob.bounceTimer * 6)) * 3;
      }

      // Set facing direction based on horizontal movement
      if (mob.state === 'chase' || mob.state === 'wander') {
        if (dx < -2) mob.facing = -1;
        else if (dx > 2) mob.facing = 1;
      }

      // Despawn if too far
      if (distToPlayer > TILE_SIZE * 25) {
        mob.visible = false;
      }
    }

    // ── Remove dead/invisible mobs ──
    this.#mobs = this.#mobs.filter(m => {
      // Keep visible mobs, or mobs that just died (still visible until death anim finishes)
      if (m.visible) return true;
      // Remove invisible non-dead mobs (despawned by distance)
      // Remove death-state mobs after their timer expired and were set invisible
      return false;
    });
  }

  /**
   * Idle state: stand still for 2-5 seconds, then wander.
   * If player is detected, chase.
   */
  #updateIdle(mob, dt, distToPlayer) {
    // Check detection
    if (distToPlayer < mob.detectionRange) {
      mob.state = 'chase';
      return;
    }

    mob.stateTimer -= dt;
    if (mob.stateTimer <= 0) {
      mob.state = 'wander';
      // Pick random direction
      const angle = Math.random() * Math.PI * 2;
      mob.wanderDx = Math.cos(angle);
      mob.wanderDy = Math.sin(angle);
      mob.stateTimer = 2 + Math.random() * 2;
    }
  }

  /**
   * Wander: move in random direction.
   * If player detected, chase.
   */
  #updateWander(mob, dt, map, distToPlayer) {
    // Check detection
    if (distToPlayer < mob.detectionRange) {
      mob.state = 'chase';
      return;
    }

    mob.stateTimer -= dt;
    if (mob.stateTimer <= 0) {
      mob.state = 'idle';
      mob.stateTimer = 2 + Math.random() * 3;
      return;
    }

    // Move in wander direction with collision
    this.#tryMove(mob, mob.wanderDx * mob.speed * dt, mob.wanderDy * mob.speed * dt, map);
  }

  /**
   * Chase: move toward player. Attack if close enough.
   * Lose interest if player moves too far.
   */
  #updateChase(mob, dt, map, dx, dy, distToPlayer) {
    // Lost the player?
    if (distToPlayer > mob.loseRange) {
      mob.state = 'wander';
      mob.stateTimer = 2 + Math.random() * 2;
      const angle = Math.random() * Math.PI * 2;
      mob.wanderDx = Math.cos(angle);
      mob.wanderDy = Math.sin(angle);
      return;
    }

    // Close enough to attack?
    if (distToPlayer < mob.attackRange) {
      mob.state = 'attack';
      return;
    }

    // Move toward player
    if (distToPlayer > 1) {
      const speed = mob.speed * dt;
      const nx = (dx / distToPlayer) * speed;
      const ny = (dy / distToPlayer) * speed;
      this.#tryMove(mob, nx, ny, map);
    }
  }

  /**
   * Attack: deal damage, then return to chase.
   */
  #updateAttack(mob, dt, dx, dy, distToPlayer) {
    // If player moved out of range, go back to chase
    if (distToPlayer > mob.attackRange + 10) {
      mob.state = 'chase';
      return;
    }

    // Attack cooldown handled by #applyMobDamage
    // Stay in attack state - will switch to chase when player moves away
  }

  /**
   * Death: timer counting down to despawn.
   */
  #updateDeath(mob, dt) {
    mob.deathTimer -= dt;
    if (mob.deathTimer <= 0) {
      mob.visible = false;
    }
  }

  /**
   * Attempt to move a mob with collision sliding.
   * @param {Mob} mob
   * @param {number} nx - delta X
   * @param {number} ny - delta Y
   * @param {import('./map.js').GameMap} map
   */
  #tryMove(mob, nx, ny, map) {
    const newX = mob.x + nx;
    const newY = mob.y + ny;

    const halfW = (mob.sizeX * TILE_SIZE) / 4;
    const halfH = (mob.sizeY * TILE_SIZE) / 4;

    // Try X movement
    if (!map.isBlocked(newX, mob.y)) {
      mob.x = newX;
    } else {
      // Slide along obstacle - try smaller steps
      if (!map.isBlocked(mob.x + nx * 0.5, mob.y)) {
        mob.x += nx * 0.5;
      }
    }

    // Try Y movement
    if (!map.isBlocked(mob.x, newY)) {
      mob.y = newY;
    } else {
      if (!map.isBlocked(mob.x, mob.y + ny * 0.5)) {
        mob.y += ny * 0.5;
      }
    }
  }

  /**
   * Damage a mob. Returns true if it died.
   * @param {Mob} mob
   * @param {number} amount
   * @param {import('./map.js').GameMap} map
   * @param {{ x: number, y: number }} [knockbackDir]
   */
  damageMob(mob, amount, map, knockbackDir) {
    const alive = mob.takeDamage(amount, knockbackDir);
    if (!alive && mob.state !== 'death') {
      mob.state = 'death';
      mob.deathTimer = 2;
      // Drop loot
      for (const loot of mob.loot) {
        const count = loot.min + Math.floor(Math.random() * (loot.max - loot.min + 1));
        if (count > 0) {
          map.dropItems(mob.x, mob.y, loot.type, count, count);
        }
      }
    }
    return alive;
  }

  /**
   * Find a mob near a world position (for click targeting).
   * @param {number} worldX
   * @param {number} worldY
   * @returns {Mob|null}
   */
  findAt(worldX, worldY) {
    for (const mob of this.#mobs) {
      if (!mob.visible || mob.state === 'death') continue;
      const halfW = mob.sizeX * TILE_SIZE / 2;
      const halfH = mob.sizeY * TILE_SIZE / 2;
      const left = mob.x - halfW;
      const right = mob.x + halfW;
      const top = mob.y - mob.sizeY * TILE_SIZE;
      const bottom = mob.y;
      if (worldX >= left && worldX <= right && worldY >= top && worldY <= bottom) {
        return mob;
      }
    }
    return null;
  }
}
