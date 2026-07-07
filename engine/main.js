import { setupCanvas, getResponsiveRenderDist, canvas } from './canvas.js';
import { InputManager } from './input.js';
import { AssetLoader } from './asset-loader.js';
import { Player } from './player.js';
import { GameMap } from './map.js';
import { Renderer } from './renderer.js';
import { ParticleSystem } from './particles.js';
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
    const tree = map.findTreeAt(world.x, world.y);
    if (tree) {
      const alive = tree.hit(1, 5);
      particles.emit(tree.x - TILE_SIZE / 2, tree.y, 8, {
        speed: 200,
        life: 0.7,
      });
      particles.emit(tree.x - TILE_SIZE / 2, tree.y, 4, {
        color: '#3A7D2C',
        speed: 150,
        life: 0.5,
        size: 3,
      });
      if (!alive) {
        map.removeObject(tree);
        particles.emit(tree.x - TILE_SIZE / 2, tree.y, 15, {
          speed: 250,
          life: 0.9,
        });
        particles.emit(tree.x - TILE_SIZE / 2, tree.y, 8, {
          color: '#3A7D2C',
          speed: 200,
          life: 0.7,
          size: 3,
        });
      }
    }
  }

  // ---- Update ----

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

  renderer.render(visibleObjects, player, particles);

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
