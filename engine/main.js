import { setupCanvas, getResponsiveRenderDist, canvas, ctx } from './canvas.js';
import { InputManager } from './input.js';
import { AssetLoader } from './asset-loader.js';
import { Player } from './player.js';
import { GameMap } from './map.js';
import { Renderer } from './renderer.js';
import { ParticleSystem } from './particles.js';
import { Inventory } from './inventory.js';
import { BirdManager } from './bird.js';
import { MobManager } from './mob.js';
import { CraftingSystem } from './crafting.js';
import { CraftingUI } from './crafting-ui.js';
import { getBushTexture, getMushroomTexture, getFlowerTexture, getTallGrassTexture, getStumpTexture, getSmallBushTexture, getCactusTexture, getDeadTreeTexture, getWorkbenchTexture, getCampfireTexture, getCampfireAltTexture, getWallTexture, getGrassBladeTexture } from './item-icons.js';
import { BuildingSystem } from './building.js';
import { TILE_SIZE, TEXTURES, INTERACTION_RANGE, DAY_LENGTH } from './constants.js';
import { DayCycle } from './day-cycle.js';
import { BiomeGenerator } from './biomes.js';
import { HUD } from './hud.js';
import { DeathScreen } from './death-screen.js';

// --- Bootstrap ---

setupCanvas();

const input = new InputManager();
input.init();

const assets = new AssetLoader();

const biomeGen = new BiomeGenerator();
const map = new GameMap(biomeGen);
const player = new Player();
const renderer = new Renderer(assets);
const particles = new ParticleSystem();
const inventory = new Inventory();
const craftingSystem = new CraftingSystem();
const craftingUI = new CraftingUI(craftingSystem);
const birds = new BirdManager();
const mobs = new MobManager();
const dayCycle = new DayCycle(DAY_LENGTH);
const buildingSystem = new BuildingSystem();
const hud = new HUD();
const deathScreen = new DeathScreen();

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
  } else if (obj.name === 'bush') {
    map.dropItems(obj.x, obj.y + TILE_SIZE * 0.5, 'BERRY', 1, 4);
    map.dropItems(obj.x, obj.y + TILE_SIZE * 0.5, 'FIBER', 1, 2);
    particles.emit(obj.x - TILE_SIZE / 2, obj.y, 10, {
      color: '#3D7A33',
      speed: 180,
      life: 0.6,
      size: 3,
    });
  } else if (obj.name === 'mushroom') {
    map.dropItems(obj.x, obj.y + TILE_SIZE * 0.5, 'MUSHROOM', 1, 2);
    particles.emit(obj.x - TILE_SIZE / 2, obj.y, 6, {
      color: '#A0522D',
      speed: 150,
      life: 0.5,
      size: 2,
    });
  } else if (obj.name === 'flower') {
    map.dropItems(obj.x, obj.y + TILE_SIZE * 0.5, 'FLOWER', 1, 2);
    particles.emit(obj.x - TILE_SIZE / 2, obj.y, 8, {
      color: '#DD88CC',
      speed: 150,
      life: 0.5,
      size: 2,
    });
  } else if (obj.name === 'tall_grass') {
    // Destroy all blades in the cluster, drop loot once
    if (obj.clusterKey) {
      map.destroyCluster(obj.clusterKey);
    }
    map.dropItems(obj.x, obj.y + TILE_SIZE * 0.5, 'FIBER', 1, 2);
    particles.emit(obj.x - TILE_SIZE / 2, obj.y, 8, {
      color: '#6BAA4E',
      speed: 180,
      life: 0.6,
      size: 3,
    });
  } else if (obj.name === 'stump') {
    map.dropItems(obj.x, obj.y + TILE_SIZE * 0.5, 'WOOD', 1, 2);
    particles.emit(obj.x - TILE_SIZE / 2, obj.y, 8, {
      color: '#8B5E3C',
      speed: 200,
      life: 0.7,
      size: 3,
    });
  } else if (obj.name === 'bush_small') {
    map.dropItems(obj.x, obj.y + TILE_SIZE * 0.5, 'FIBER', 1, 2);
    particles.emit(obj.x - TILE_SIZE / 2, obj.y, 8, {
      color: '#4A7A3E',
      speed: 160,
      life: 0.5,
      size: 3,
    });
  } else if (obj.name === 'cactus') {
    map.dropItems(obj.x, obj.y + TILE_SIZE * 0.5, 'FIBER', 1, 3);
    particles.emit(obj.x - TILE_SIZE / 2, obj.y, 8, {
      color: '#2D7A2D',
      speed: 200,
      life: 0.7,
      size: 3,
    });
  } else if (obj.name === 'dead_tree') {
    map.dropItems(obj.x, obj.y + TILE_SIZE * 0.5, 'WOOD', 1, 2);
    particles.emit(obj.x - TILE_SIZE / 2, obj.y, 8, {
      color: '#6B5A4E',
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
  } else if (obj.name === 'bush') {
    particles.emit(obj.x - TILE_SIZE / 2, obj.y, 6, {
      color: '#3D7A33', speed: 160, life: 0.5, size: 3,
    });
  } else if (obj.name === 'mushroom') {
    particles.emit(obj.x - TILE_SIZE / 2, obj.y, 3, {
      color: '#A0522D', speed: 120, life: 0.4, size: 2,
    });
  } else if (obj.name === 'flower') {
    particles.emit(obj.x - TILE_SIZE / 2, obj.y, 5, {
      color: '#DD88CC', speed: 140, life: 0.5, size: 2,
    });
  } else if (obj.name === 'tall_grass') {
    particles.emit(obj.x - TILE_SIZE / 2, obj.y, 5, {
      color: '#6BAA4E', speed: 160, life: 0.5, size: 3,
    });
    // Also shake nearby blades in the same cluster
    if (obj.clusterKey) {
      const nearby = map.getObjectsInRadius(obj.x, obj.y, 1);
      for (const n of nearby) {
        if (n.clusterKey === obj.clusterKey && n !== obj) {
          n.shake = { time: 0.1, offsetX: 0, offsetY: 0, intensity: 2 };
        }
      }
    }
  } else if (obj.name === 'stump') {
    particles.emit(obj.x - TILE_SIZE / 2, obj.y, 5, {
      color: '#8B5E3C', speed: 180, life: 0.5, size: 3,
    });
  } else if (obj.name === 'bush_small') {
    particles.emit(obj.x - TILE_SIZE / 2, obj.y, 5, {
      color: '#4A7A3E', speed: 140, life: 0.5, size: 3,
    });
  } else if (obj.name === 'cactus') {
    particles.emit(obj.x - TILE_SIZE / 2, obj.y, 5, {
      color: '#2D7A2D', speed: 180, life: 0.5, size: 3,
    });
  } else if (obj.name === 'dead_tree') {
    particles.emit(obj.x - TILE_SIZE / 2, obj.y, 5, {
      color: '#6B5A4E', speed: 180, life: 0.5, size: 3,
    });
  }
}

// --- Game loop ---

let lastTime = 0;
let running = false;
/** @type {import('./game-object.js').GameObject[]} */
let lastVisibleObjects = [];

function tick(now) {
  if (!running) return;

  const delta = Math.min((now - lastTime) / 1000, 0.05); // cap delta
  lastTime = now;

  // ---- Toggle inventory & crafting ----

  if (input.consumeKey('e')) {
    inventory.toggle();
  }

  if (input.consumeKey('c')) {
    craftingUI.toggle();
  }

  // ---- Number key selection & consumption (1-9) ----

  for (let i = 0; i < 9; i++) {
    const key = String(i + 1);
    if (input.consumeKey(key)) {
      inventory.selectSlot(i);
      const slot = inventory.getHotbarSlot(i);
      if (slot && slot.count > 0) {
        const consumable = ['BERRY', 'MUSHROOM', 'RAW_MEAT', 'COOKED_MEAT'];
        if (consumable.includes(slot.type)) {
          const consumed = player.consume(slot.type);
          if (consumed) {
            slot.count--;
            if (slot.count <= 0) {
              inventory.setHotbarSlot(i, null);
            }
          }
        }
      }
    }
  }

  // ---- Scroll wheel for hotbar selection ----

  const wheelDelta = input.consumeWheel();
  if (wheelDelta !== 0) {
    inventory.selectSlot(inventory.selectedSlot + wheelDelta);
  }

  // ---- Building: enter placement mode (b key) ----

  if (input.consumeKey('b') && !player.isDead) {
    if (buildingSystem.isPlacing) {
      buildingSystem.exitPlacementMode();
    } else {
      // Check if the selected hotbar slot has a placeable item
      for (let i = 0; i < 9; i++) {
        const slot = inventory.getHotbarSlot(i);
        if (slot && slot.count > 0 && buildingSystem.placeableItems.includes(slot.type)) {
          buildingSystem.enterPlacementMode(slot.type);
          break;
        }
      }
    }
  }

  // ---- Respawn ----

  if (input.consumeKey('r') && player.isDead) {
    player.respawn();
  }

  // ---- Drag & drop (works even when inventory is open) ----

  inventory.handleDrag(input.justMouseDown, input.justMouseUp, input.mouseX, input.mouseY);

  // ---- Pause game while inventory or crafting is open (and player alive) ----

  if (!inventory.isOpen && !craftingUI.isOpen && !player.isDead) {
    // ---- Hover detection (per-frame) ----

    // Clear previous hover flags
    for (const obj of lastVisibleObjects) {
      obj.hovered = false;
    }

    const mouseWorld = screenToWorld(input.mouseX, input.mouseY);

    // ---- Building placement mode ----

    if (buildingSystem.isPlacing) {
      buildingSystem.updatePreview(mouseWorld.x, mouseWorld.y);

      // Right-click to cancel placement
      if (input.consumeRightClick()) {
        buildingSystem.exitPlacementMode();
      }

      // Left-click to confirm placement (if valid)
      if (input.consumeClick()) {
        buildingSystem.confirmPlacement(inventory, map);
      }
    } else {
      // Normal mode: hover detection
      const hoveredObj = map.findAt(mouseWorld.x, mouseWorld.y);
      if (hoveredObj) {
        // Distance check: use bottom-center of the object (where player stands)
        const dx = hoveredObj.x - player.x;
        const dy = hoveredObj.y - player.y;
        if (dx * dx + dy * dy <= INTERACTION_RANGE * INTERACTION_RANGE) {
          hoveredObj.hovered = true;
        }
      }
    }

    // ---- Campfire warmth check ----

    const campfires = map.getObjectsInRadius(player.x, player.y, 3);
    let nearCampfire = false;
    for (const cf of campfires) {
      if (cf.name === 'campfire') {
        const dx = cf.x - player.x;
        const dy = cf.y - player.y;
        if (Math.sqrt(dx * dx + dy * dy) <= TILE_SIZE * 2) {
          nearCampfire = true;
          break;
        }
      }
    }
    player.setNearCampfire(nearCampfire);

    // ---- Sync equipped item ----

    const selectedItem = inventory.getSelectedItem();
    player.equippedItem = selectedItem;

    // Handle armor from hotbar selection
    if (selectedItem && selectedItem.type === 'FIBER_ARMOR') {
      player.armor = 0.2;
    } else {
      player.armor = 0;
    }

    // ---- Input handling ----

    // Determine current biome for thirst modifiers
    const biome = map.getBiome ? map.getBiome(
      Math.floor(player.x / TILE_SIZE),
      Math.floor(player.y / TILE_SIZE),
    ) : undefined;
    player.update(input, delta, biome);

    if (!buildingSystem.isPlacing && input.consumeClick()) {
      const world = screenToWorld(input.mouseX, input.mouseY);
      // Check mobs first
      const clickedMob = mobs.findAt(world.x, world.y);
      if (clickedMob) {
        const dx = clickedMob.x - player.x;
        const dy = clickedMob.y - player.y;
        if (dx * dx + dy * dy <= INTERACTION_RANGE * INTERACTION_RANGE) {
          // Calculate damage based on equipped weapon
          const damage = player.attack(clickedMob);
          // Knockback direction (from player toward mob)
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const knockbackDir = { x: dx / dist, y: dy / dist };
          const alive = mobs.damageMob(clickedMob, damage, map, knockbackDir);
          particles.emit(clickedMob.x, clickedMob.y, 5, {
            color: clickedMob.color,
            speed: 150,
            life: 0.4,
            size: 3,
          });
          // Consume weapon durability
          if (selectedItem && selectedItem.durability !== undefined) {
            inventory.useSelectedDurability();
          }
          if (!alive) {
            particles.emit(clickedMob.x, clickedMob.y, 10, {
              color: clickedMob.color,
              speed: 200,
              life: 0.6,
              size: 4,
            });
          }
        }
      } else {
        const obj = map.findAt(world.x, world.y);
        if (obj) {
          const dx = obj.x - player.x;
          const dy = obj.y - player.y;
          if (dx * dx + dy * dy <= INTERACTION_RANGE * INTERACTION_RANGE) {
            // Use toolLevel for bonus damage on resource gathering
            const toolDamage = player.toolLevel;
            const alive = obj.hit(toolDamage, 5);
            onHit(obj);
            // Consume tool durability on resource hits (only if tool provides bonus)
            if (selectedItem && selectedItem.durability !== undefined && toolDamage > 1) {
              inventory.useSelectedDurability();
            }
            if (!alive) {
              onDestroyed(obj);
            }
          }
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

    // ---- Update day/night cycle ----

    dayCycle.update(delta);

    // ---- Update birds ----

    birds.update(delta, player.x, player.y);

    // ---- Update mobs ----

    mobs.update(delta, player, map, !dayCycle.isDay, (amount) => player.takeDamage(amount));

    const renderDist = getResponsiveRenderDist();
    const visibleObjects = map.getVisibleObjects(
      player.x, player.y, renderDist,
    );
    for (const obj of visibleObjects) {
      obj.updateShake(delta);

      // ---- Grass/vegetation bending ----

      const squashable = ['tall_grass', 'bush', 'bush_small', 'flower'];
      if (squashable.includes(obj.name)) {
        // Check player proximity
        const pDx = player.x - obj.x;
        const pDy = player.y - obj.y;
        const pDist = Math.sqrt(pDx * pDx + pDy * pDy);
        const squashThreshold = TILE_SIZE * 0.55;

        let touching = false;

        if (pDist < squashThreshold) {
          touching = true;
          obj.squashDir = pDx > 0 ? -1 : 1;
        } else {
          // Check mob proximity
          const mobList = mobs.getMobs();
          for (const mob of mobList) {
            if (mob.state === 'death') continue;
            const mDx = mob.x - obj.x;
            const mDy = mob.y - obj.y;
            const mDist = Math.sqrt(mDx * mDx + mDy * mDy);
            if (mDist < squashThreshold) {
              touching = true;
              obj.squashDir = mDx > 0 ? -1 : 1;
              break;
            }
          }
        }

        if (touching) {
          obj.squash = Math.max(0.3, obj.squash - delta * 8);
          obj.squashTimer = 0.25;
        } else if (obj.squashTimer > 0) {
          obj.squashTimer -= delta;
          // Smooth spring-back
          obj.squash = 1 - (1 - obj.squash) * 0.85;
        } else {
          obj.squash = 1;
        }
      }
    }

    // ---- Render ----

    lastVisibleObjects = visibleObjects;
    renderer.render(visibleObjects, player, particles, map.getGroundItems(), birds.getBirds(), mobs.getMobs(), dayCycle, buildingSystem, map);
  } else {
    // Inventory or crafting is open — just re-render last frame with overlay
    renderer.render(lastVisibleObjects, player, particles, map.getGroundItems(), birds.getBirds(), mobs.getMobs(), dayCycle, buildingSystem, map);

    // Crafting UI click handling
    if (input.consumeClick()) {
      craftingUI.handleClick(input.mouseX, input.mouseY, inventory);
    }
  }

  // Inventory UI (hotbar always, full inventory if open)
  inventory.render(ctx);

  // Crafting UI (if open)
  craftingUI.render(ctx, inventory);

  // HUD (always visible)
  hud.render(ctx, player);

  // Death screen overlay
  if (player.isDead) {
    deathScreen.render(ctx);
  }

  input.endFrame();

  requestAnimationFrame(tick);
}

// --- Start ---

async function start() {
  await assets.loadAll(assetManifest);

  // Register programmatic plant textures
  assets.registerTexture(TEXTURES.BUSH, getBushTexture());
  assets.registerTexture(TEXTURES.MUSHROOM, getMushroomTexture());
  assets.registerTexture(TEXTURES.FLOWER, getFlowerTexture());
  assets.registerTexture(TEXTURES.TALL_GRASS, getTallGrassTexture());
  assets.registerTexture(TEXTURES.STUMP, getStumpTexture());
  assets.registerTexture(TEXTURES.BUSH_SMALL, getSmallBushTexture());
  assets.registerTexture(TEXTURES.CACTUS, getCactusTexture());
  assets.registerTexture(TEXTURES.DEAD_TREE, getDeadTreeTexture());
  assets.registerTexture(TEXTURES.WORKBENCH, getWorkbenchTexture());
  assets.registerTexture(TEXTURES.CAMPFIRE_TEX, getCampfireTexture());
  assets.registerTexture(TEXTURES.CAMPFIRE_ALT, getCampfireAltTexture());
  assets.registerTexture(TEXTURES.WALL, getWallTexture());

  // Grass blade textures (multi-blade clusters)
  assets.registerTexture(TEXTURES.GRASS_BLADE_1, getGrassBladeTexture(0));
  assets.registerTexture(TEXTURES.GRASS_BLADE_2, getGrassBladeTexture(1));
  assets.registerTexture(TEXTURES.GRASS_BLADE_3, getGrassBladeTexture(2));
  assets.registerTexture(TEXTURES.GRASS_BLADE_4, getGrassBladeTexture(3));

  map.generate();
  birds.setTrees(map.getTrees());
  birds.onLand = (tree) => {
    // Micro-shake the tree
    tree.shake = { time: 0.3, offsetX: 0, offsetY: 0, intensity: 3 };
    // Falling leaves
    particles.emit(tree.x - TILE_SIZE / 2, tree.y - TILE_SIZE, 6, {
      color: '#3A7D2C',
      speed: 100,
      life: 0.8,
      size: 3,
    });
  };
  running = true;
  lastTime = performance.now();
  requestAnimationFrame(tick);
}

start();
