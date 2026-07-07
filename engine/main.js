import { setupCanvas, getResponsiveRenderDist, canvas, ctx } from './canvas.js';
import { InputManager } from './input.js';
import { AssetLoader } from './asset-loader.js';
import { Player } from './player.js';
import { GameMap } from './map.js';
import { Renderer } from './renderer.js';
import { ParticleSystem } from './particles.js';
import { Inventory } from './inventory.js';
import { TILE_SIZE } from './constants.js';

// --- Bootstrap ---

setupCanvas();

const input = new InputManager();
input.init();

const assets = new AssetLoader();

const map = new GameMap();
const player = new Player();
const renderer = new Renderer(assets);
const particles = new ParticleSystem();
const inventory = new Inventory();

const assetManifest = [
  'test',           // 0
  'postac/body1',   // 1
  'trawa',          // 2
  'drzewo',         // 3
  'postac/glowa1',  // 4
  'postac/body1b',  // 5
  'postac/body1c',  // 6
  'kamien',         // 7
  'kamien_h',       // 8
  'drzewob',        // 9
];

// --- Helpers ---

/** Convert screen coords to world coords. */
function screenToWorld(sx, sy) {
  return {
    x: sx - canvas.width / 2 + player.x,
    y: sy - canvas.height / 2 + player.y,
  };
}

/**
 * Handle a resource being destroyed.
 * @param {import('./game-object.js').GameObject} obj
 */
function onDestroyed(obj) {
  map.removeObject(obj);
  particles.emit(obj.x - TILE_SIZE / 2, obj.y, 15, {
    speed: 250,
    life: 0.9,
  });

  if (obj.name === 'tree') {
    map.dropItems(obj.x, obj.y + TILE_SIZE * 0.5, 'WOOD', 2, 4);
    particles.emit(obj.x - TILE_SIZE / 2, obj.y, 8, {
      color: '#3A7D2C',
      speed: 200,
      life: 0.7,
      size: 3,
    });
  } else if (obj.name === 'rock') {
    map.dropItems(obj.x, obj.y + TILE_SIZE * 0.5, 'STONE', 2, 4);
    particles.emit(obj.x - TILE_SIZE / 2, obj.y, 8, {
      color: '#B0B0B0',
      speed: 200,
      life: 0.7,
      size: 3,
    });
  }
}

/**
 * Handle a resource being hit (still alive).
 * @param {import('./game-object.js').GameObject} obj
 */
function onHit(obj) {
  if (obj.name === 'tree') {
    particles.emit(obj.x - TILE_SIZE / 2, obj.y, 8, { speed: 200, life: 0.7 });
    particles.emit(obj.x - TILE_SIZE / 2, obj.y, 4, {
      color: '#3A7D2C', speed: 150, life: 0.5, size: 3,
    });
  } else if (obj.name === 'rock') {
    particles.emit(obj.x - TILE_SIZE / 2, obj.y, 6, {
      color: '#B0B0B0', speed: 180, life: 0.5, size: 3,
    });
  }
}

// --- Game loop ---

let lastTime = 0;
let running = false;

function tick(now) {
  if (!running) return;

  const delta = Math.min((now - lastTime) / 1000, 0.05); // cap delta
  lastTime = now;

  // ---- Input handling ----

  player.update(input, delta);

  if (input.consumeClick()) {
    const world = screenToWorld(input.mouseX, input.mouseY);
    const obj = map.findTreeAt(world.x, world.y) || map.findRockAt(world.x, world.y);
    if (obj) {
      const alive = obj.hit(1, 5);
      onHit(obj);
      if (!alive) {
        onDestroyed(obj);
      }
    }
  }

  // ---- Update ground items ----

  const groundItems = map.getGroundItems();
  for (let i = groundItems.length - 1; i >= 0; i--) {
    const item = groundItems[i];
    const collected = item.update(delta, player.x, player.y);
    if (collected) {
      inventory.add(item.itemType, item.quantity);
      map.removeGroundItem(item);
    }
  }

  // ---- Update particles & objects ----

  particles.update(delta);

  // Update visible object shake
  const renderDist = getResponsiveRenderDist();
  const visibleObjects = map.getVisibleObjects(
    player.x, player.y, renderDist,
  );
  for (const obj of visibleObjects) {
    obj.updateShake(delta);
  }

  // ---- Render ----

  renderer.render(visibleObjects, player, particles, map.getGroundItems());

  // Inventory UI (directly on canvas after renderer)
  inventory.render(ctx);

  requestAnimationFrame(tick);
}

// --- Start ---

async function start() {
  await assets.loadAll(assetManifest);
  map.generate();
  running = true;
  lastTime = performance.now();
  requestAnimationFrame(tick);
}

start();
