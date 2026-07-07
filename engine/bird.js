import { TILE_SIZE } from './constants.js';

const FLY_SPEED = 60;
const FLEE_SPEED = 140;
const PERCH_RADIUS = TILE_SIZE * 2;
const FLEE_DISTANCE = TILE_SIZE * 3.5;
const SPAWN_DISTANCE = TILE_SIZE * 12;
const MAX_BIRDS = 6;

class Bird {
  x;
  y;
  vx = 0;
  vy = 0;
  state = 'flying'; // 'flying' | 'perching' | 'fleeing'
  stateTimer = 0;
  wingFrame = 0;
  wingTimer = 0;
  facingLeft = false;
  visible = true;
  name = 'bird';

  /** Depth for Y-sorted rendering */
  get renderDepth() {
    return this.y;
  }

  constructor(x, y) {
    this.x = x;
    this.y = y;
    const angle = Math.random() * Math.PI * 2;
    this.vx = Math.cos(angle) * FLY_SPEED;
    this.vy = Math.sin(angle) * FLY_SPEED;
    this.stateTimer = 2 + Math.random() * 4;
  }
}

export class BirdManager {
  /** @type {Bird[]} */
  #birds = [];
  /** @type {import('./game-object.js').GameObject[]} */
  #trees = [];

  /**
   * @param {import('./game-object.js').GameObject[]} trees
   */
  setTrees(trees) {
    this.#trees = trees;
  }

  /** @returns {Bird[]} */
  getBirds() {
    return this.#birds;
  }

  /**
   * @param {number} dt
   * @param {number} playerX
   * @param {number} playerY
   */
  update(dt, playerX, playerY) {
    // Spawn birds if we have fewer than max
    if (this.#birds.length < MAX_BIRDS && Math.random() < dt * 0.6) {
      this.#spawnBird(playerX, playerY);
    }

    for (let i = this.#birds.length - 1; i >= 0; i--) {
      const bird = this.#birds[i];
      const dx = playerX - bird.x;
      const dy = playerY - bird.y;
      const distToPlayer = Math.sqrt(dx * dx + dy * dy);

      // State-specific update
      switch (bird.state) {
        case 'flying':
          this.#updateFlying(bird, dt, distToPlayer);
          break;
        case 'perching':
          this.#updatePerching(bird, dt, distToPlayer);
          break;
        case 'fleeing':
          this.#updateFleeing(bird, dt, dx, dy, distToPlayer);
          break;
      }

      // Wing animation
      if (bird.state === 'perching') {
        bird.wingFrame = 1; // wings folded
      } else {
        bird.wingTimer += dt;
        if (bird.wingTimer > 0.12) {
          bird.wingTimer -= 0.12;
          bird.wingFrame = bird.wingFrame === 0 ? 1 : 0;
        }
      }

      // Despawn if too far
      if (distToPlayer > TILE_SIZE * 20) {
        bird.visible = false;
      }
    }

    // Remove invisible birds
    this.#birds = this.#birds.filter(b => b.visible);
  }

  /**
   * Spawn a bird at a random distant position.
   * @param {number} playerX
   * @param {number} playerY
   */
  #spawnBird(playerX, playerY) {
    const angle = Math.random() * Math.PI * 2;
    const dist = SPAWN_DISTANCE * (0.3 + Math.random() * 0.7);
    const x = playerX + Math.cos(angle) * dist;
    const y = playerY + Math.sin(angle) * dist;
    this.#birds.push(new Bird(x, y));
  }

  /**
   * Find the closest visible tree within perch radius.
   * @param {number} x
   * @param {number} y
   * @returns {import('./game-object.js').GameObject|null}
   */
  #findNearbyTree(x, y) {
    let closest = null;
    let closestDist = PERCH_RADIUS;
    for (const tree of this.#trees) {
      if (!tree.visible) continue;
      const dx = x - tree.x;
      const dy = y - tree.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < closestDist) {
        closestDist = dist;
        closest = tree;
      }
    }
    return closest;
  }

  /**
   * @param {Bird} bird
   * @param {number} dt
   * @param {number} distToPlayer
   */
  #updateFlying(bird, dt, distToPlayer) {
    // Flee if player is close
    if (distToPlayer < FLEE_DISTANCE) {
      bird.state = 'fleeing';
      bird.stateTimer = 0.5 + Math.random() * 1.5;
      return;
    }

    bird.stateTimer -= dt;
    if (bird.stateTimer <= 0) {
      bird.stateTimer = 2 + Math.random() * 5;

      // Try to perch on a tree (30% chance)
      if (Math.random() < 0.3) {
        const tree = this.#findNearbyTree(bird.x, bird.y);
        if (tree) {
          bird.state = 'perching';
          bird.stateTimer = 3 + Math.random() * 6;
          // Place bird in the tree crown
          bird.x = tree.x + (Math.random() - 0.5) * TILE_SIZE * 0.4;
          bird.y = tree.y - TILE_SIZE * 0.8 + (Math.random() - 0.5) * TILE_SIZE * 0.3;
          bird.vx = 0;
          bird.vy = 0;
          return;
        }
      }

      // Otherwise pick a new random direction
      const angle = Math.random() * Math.PI * 2;
      bird.vx = Math.cos(angle) * FLY_SPEED * (0.6 + Math.random() * 0.4);
      bird.vy = Math.sin(angle) * FLY_SPEED * (0.6 + Math.random() * 0.4);
    }

    bird.x += bird.vx * dt;
    bird.y += bird.vy * dt;
    bird.facingLeft = bird.vx < 0;
  }

  /**
   * @param {Bird} bird
   * @param {number} dt
   * @param {number} distToPlayer
   */
  #updatePerching(bird, dt, distToPlayer) {
    // Flee if player is close
    if (distToPlayer < FLEE_DISTANCE) {
      bird.state = 'fleeing';
      bird.stateTimer = 0.5 + Math.random();
      return;
    }

    bird.stateTimer -= dt;
    if (bird.stateTimer <= 0) {
      // Take off again — launch upward
      bird.state = 'flying';
      bird.stateTimer = 2 + Math.random() * 4;
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.5; // mostly upward
      bird.vx = Math.cos(angle) * FLY_SPEED;
      bird.vy = Math.sin(angle) * FLY_SPEED;
    }
  }

  /**
   * @param {Bird} bird
   * @param {number} dt
   * @param {number} dx - vector from bird to player
   * @param {number} dy
   * @param {number} distToPlayer
   */
  #updateFleeing(bird, dt, dx, dy, distToPlayer) {
    bird.stateTimer -= dt;

    // Fly directly away from player
    if (distToPlayer > 1) {
      const fleeAngle = Math.atan2(dy, dx);
      const jitter = (Math.random() - 0.5) * 0.8;
      bird.vx = -Math.cos(fleeAngle + jitter) * FLEE_SPEED;
      bird.vy = -Math.sin(fleeAngle + jitter) * FLEE_SPEED;
    }

    bird.x += bird.vx * dt;
    bird.y += bird.vy * dt;
    bird.facingLeft = bird.vx < 0;

    // Calm down when far enough and timer expired
    if (bird.stateTimer <= 0 && distToPlayer > FLEE_DISTANCE * 1.5) {
      bird.state = 'flying';
      bird.stateTimer = 2 + Math.random() * 4;
    }
  }
}
