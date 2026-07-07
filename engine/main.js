import { setupCanvas, getResponsiveRenderDist } from './canvas.js';
import { InputManager } from './input.js';
import { AssetLoader } from './asset-loader.js';
import { Player } from './player.js';
import { GameMap } from './map.js';
import { Renderer } from './renderer.js';

// --- Bootstrap ---

setupCanvas();

const input = new InputManager();
input.init();

const assets = new AssetLoader();

const map = new GameMap();
const player = new Player();
const renderer = new Renderer(assets);

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

// --- Game loop ---

let lastTime = 0;
let running = false;

function tick(now) {
  if (!running) return;

  const delta = (now - lastTime) / 1000;
  lastTime = now;

  const renderDist = getResponsiveRenderDist();

  player.update(input, delta);

  const visibleObjects = map.getVisibleObjects(
    player.x, player.y, renderDist,
  );

  renderer.render(visibleObjects, player);

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
