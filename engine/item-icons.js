/**
 * Generate small pixel-art textures for items.
 * Each icon is a 16×16 off-screen canvas.
 * @type {Record<string, HTMLCanvasElement>}
 */
const cache = {};

/**
 * @param {keyof typeof import('./items.js').ITEMS} type
 * @returns {HTMLCanvasElement}
 */
export function getItemIcon(type) {
  if (cache[type]) return cache[type];
  const c = document.createElement('canvas');
  c.width = 16;
  c.height = 16;
  const ctx = c.getContext('2d');
  const imageData = ctx.createImageData(16, 16);
  const d = imageData.data;

  switch (type) {
    case 'WOOD':
      drawWood(d);
      break;
    case 'STONE':
      drawStone(d);
      break;
    case 'BERRY':
      drawBerry(d);
      break;
    case 'MUSHROOM':
      drawMushroom(d);
      break;
    case 'FLOWER':
      drawFlower(d);
      break;
    case 'FIBER':
      drawFiber(d);
      break;
    case 'STICK':
      drawStick(d);
      break;
    case 'PLANK':
      drawPlank(d);
      break;
    case 'STONE_SWORD':
      drawStoneSword(d);
      break;
    case 'STONE_AXE':
      drawStoneAxe(d);
      break;
    case 'STONE_PICKAXE':
      drawStonePickaxe(d);
      break;
    case 'FIBER_ARMOR':
      drawFiberArmor(d);
      break;
    case 'WOOD_WALL':
      drawWoodWall(d);
      break;
    case 'BANDAGE':
      drawBandage(d);
      break;
    case 'WORKBENCH':
      drawWorkbench(d);
      break;
    case 'CAMPFIRE':
      drawCampfire(d);
      break;
    case 'RAW_MEAT':
      drawRawMeat(d);
      break;
    case 'COOKED_MEAT':
      drawCookedMeat(d);
      break;
    case 'ROTTEN_FLESH':
      drawRottenFlesh(d);
      break;
    case 'SLIME_BALL':
      drawSlimeBall(d);
      break;
    default:
      // Fallback: solid color square
      const col = hexToRgba('#888');
      for (let i = 0; i < 256; i++) {
        d[i * 4] = col[0];
        d[i * 4 + 1] = col[1];
        d[i * 4 + 2] = col[2];
        d[i * 4 + 3] = 255;
      }
  }

  ctx.putImageData(imageData, 0, 0);
  cache[type] = c;
  return c;
}

// ---- Wood (log) ----

const W_BARK1 = [107, 66, 38];   // #6B4226
const W_BARK2 = [160, 114, 75];  // #A0724B
const W_END = [186, 134, 79];    // #BA864F lighter wood
const W_RING = [140, 90, 50];    // #8C5A32
const W_OUT = [80, 48, 26];      // #50301A darker outline

function drawWood(d) {
  // Log viewed from the side — brown rectangle with bark lines
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      let color;
      const edge = x < 1 || x > 14 || y < 1 || y > 14;
      const grain = (y === 3 || y === 7 || y === 11);

      if (edge) {
        color = W_OUT;
      } else if (grain) {
        color = W_END;
      } else if (y === 5 || y === 9 || y === 13) {
        color = W_RING;
      } else if (y < 5) {
        color = W_BARK1;
      } else if (y < 10) {
        color = W_BARK2;
      } else {
        color = W_BARK1;
      }

      const idx = (y * 16 + x) * 4;
      d[idx] = color[0];
      d[idx + 1] = color[1];
      d[idx + 2] = color[2];
      d[idx + 3] = 255;
    }
  }
}

// ---- Stone ----

const S_OUT = [50, 50, 50];       // #323232 outline
const S_BASE = [110, 110, 110];   // #6E6E6E mid gray
const S_HI = [160, 160, 170];     // light highlight
const S_DARK = [75, 75, 80];      // shadow
const S_CRACK = [55, 55, 55];     // crack lines

function drawStone(d) {
  // Irregular rock shape with highlights and a crack
  const shape = [
    '...#####....',
    '..#######...',
    '.#####x###..',
    '.##########.',
    '####.######.',
    '#####.#####.',
    '##########..',
    '.##########.',
    '..#########.',
    '...######...',
  ];

  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      let color;
      const sy = y - 3; // offset to center shape
      const sx = x - 2;

      if (sy < 0 || sy >= shape.length || sx < 0 || sx >= shape[0].length || shape[sy][sx] !== '#') {
        color = [0, 0, 0, 0]; // transparent
      } else if (shape[sy][sx] === 'x') {
        color = [...S_CRACK, 255];
      } else {
        // Distance from center for shading
        const cx = 8, cy = 8;
        const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
        if (dist < 3) {
          color = [...S_HI, 255];
        } else if (dist > 6) {
          color = [...S_DARK, 255];
        } else {
          color = [...S_BASE, 255];
        }
      }

      const idx = (y * 16 + x) * 4;
      d[idx] = color[0];
      d[idx + 1] = color[1];
      d[idx + 2] = color[2];
      d[idx + 3] = color[3] ?? 255;
    }
  }
}

// ---- Bird ----

const BIRD_W = 16;
const BIRD_H = 12;

/**
 * Generate a 2-frame bird texture (wings up / wings down).
 * @returns {[HTMLCanvasElement, HTMLCanvasElement]}
 */
export function getBirdTextures() {
  if (getBirdTextures._cache) return getBirdTextures._cache;

  const f1 = createBirdFrame(false);
  const f2 = createBirdFrame(true);
  getBirdTextures._cache = [f1, f2];
  return [f1, f2];
}

/**
 * Draw a simple side-view bird on a canvas using canvas paths.
 * @param {boolean} wingsDown
 */
function createBirdFrame(wingsDown) {
  const c = document.createElement('canvas');
  c.width = BIRD_W;
  c.height = BIRD_H;
  const ctx = c.getContext('2d');

  // Body (ellipse)
  ctx.fillStyle = '#3C3732';
  ctx.beginPath();
  ctx.ellipse(8, 6, 5, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tail
  ctx.fillStyle = '#2A2622';
  ctx.beginPath();
  ctx.moveTo(3, 3);
  ctx.lineTo(0, 2);
  ctx.lineTo(1, 6);
  ctx.lineTo(3, 7);
  ctx.closePath();
  ctx.fill();

  // Wing
  ctx.fillStyle = '#2A2622';
  if (wingsDown) {
    ctx.beginPath();
    ctx.ellipse(8, 7.5, 3.5, 2.5, 0.1, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.ellipse(8, 4, 3.5, 2, -0.15, 0, Math.PI * 2);
    ctx.fill();
  }

  // Belly highlight
  ctx.fillStyle = '#5A5248';
  ctx.beginPath();
  ctx.ellipse(9, 8, 2.5, 1.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Beak
  ctx.fillStyle = '#C8A032';
  ctx.beginPath();
  ctx.moveTo(12, 4);
  ctx.lineTo(15, 4);
  ctx.lineTo(12, 5.5);
  ctx.closePath();
  ctx.fill();

  // Eye
  ctx.fillStyle = '#fff';
  ctx.fillRect(11, 3, 2, 2);

  return c;
}

/** Parse a hex color to [r, g, b]. */
function hexToRgba(hex) {
  const h = parseInt(hex.slice(1), 16);
  return [(h >> 16) & 255, (h >> 8) & 255, h & 255];
}

// ---- Berry ----

function drawBerry(d) {
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const cx = x - 8, cy = y - 8;
      const dist = Math.sqrt(cx * cx + cy * cy);
      let color;
      if (dist > 5) {
        color = [0, 0, 0, 0]; // transparent
      } else if (dist > 4) {
        color = [140, 30, 30, 255]; // dark edge
      } else if (cx < -2 && cy < -2) {
        color = [255, 160, 160, 255]; // highlight
      } else {
        color = [200, 50, 50, 255]; // red berry
      }
      const idx = (y * 16 + x) * 4;
      d[idx] = color[0]; d[idx + 1] = color[1]; d[idx + 2] = color[2]; d[idx + 3] = color[3];
    }
  }
  // Tiny green stem
  setPixel(d, 8, 2, [70, 140, 50, 255]);
  setPixel(d, 8, 1, [70, 140, 50, 255]);
}

// ---- Mushroom (item) ----

function drawMushroom(d) {
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      let color = [0, 0, 0, 0];
      // Cap: dome shape, upper part
      const capDist = Math.sqrt((x - 8) ** 2 + (y - 5) ** 2);
      if (y >= 2 && y <= 7 && capDist <= 6) {
        color = [180, 120, 60, 255]; // tan cap
        if (capDist > 5) color = [140, 90, 40, 255]; // edge
        if (capDist <= 1.5) color = [220, 180, 120, 255]; // top highlight
      }
      // Stem
      if (x >= 6 && x <= 10 && y >= 7 && y <= 12) {
        color = [220, 200, 170, 255];
        if (x === 6 || x === 10 || y === 12) color = [180, 160, 130, 255];
      }
      // Gill line
      if (x >= 6 && x <= 10 && y === 7) color = [160, 100, 50, 255];
      const idx = (y * 16 + x) * 4;
      d[idx] = color[0]; d[idx + 1] = color[1]; d[idx + 2] = color[2]; d[idx + 3] = color[3];
    }
  }
}

// ---- Flower (item) ----

function drawFlower(d) {
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      let color = [0, 0, 0, 0];
      // Petals - 5 around center
      const cx = x - 8, cy = y - 8;
      const angle = Math.atan2(cy, cx);
      const dist = Math.sqrt(cx * cx + cy * cy);
      const petalIdx = Math.floor((angle + Math.PI * 2 + 0.3) / (Math.PI * 2 / 5)) % 5;
      if (dist > 1.5 && dist <= 4.5 && (Math.abs(cx) > 1.5 || Math.abs(cy) > 1.5)) {
        color = petalIdx % 2 === 0 ? [220, 100, 180, 255] : [240, 140, 200, 255]; // pink petals
      } else if (dist <= 2) {
        color = [255, 220, 50, 255]; // yellow center
      }
      // Stem
      if (x >= 7 && x <= 9 && y >= 11 && y <= 15) {
        color = [70, 160, 50, 255];
      }
      const idx = (y * 16 + x) * 4;
      d[idx] = color[0]; d[idx + 1] = color[1]; d[idx + 2] = color[2]; d[idx + 3] = color[3];
    }
  }
}

// ---- Fiber ----

function drawFiber(d) {
  // Fill transparent
  for (let i = 0; i < 256; i++) {
    d[i * 4 + 3] = 0;
  }
  // Three wavy green lines
  const pts = [
    [[2, 4], [4, 5], [7, 3], [10, 5], [13, 3]],
    [[3, 8], [5, 9], [8, 7], [11, 9], [14, 8]],
    [[3, 12], [6, 13], [9, 11], [12, 13], [14, 12]],
  ];
  for (const line of pts) {
    for (let i = 0; i < line.length - 1; i++) {
      const [x1, y1] = line[i];
      const [x2, y2] = line[i + 1];
      const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
      for (let s = 0; s <= steps; s++) {
        const x = x1 + (x2 - x1) * s / steps;
        const y = y1 + (y2 - y1) * s / steps;
        setPixel(d, Math.round(x), Math.round(y), [100, 180, 60, 255]);
      }
    }
  }
}

// ---- Rotten Flesh ----

const RF_DARK = [70, 65, 50];
const RF_MID = [90, 85, 60];
const RF_LIGHT = [110, 105, 75];
const RF_GREEN = [80, 90, 55];
const RF_OUT = [45, 40, 30];

function drawRottenFlesh(d) {
  const shape = [
    '..######......',
    '.########.....',
    '.#####x###....',
    '.##########...',
    '.#####.#####..',
    '######.#####..',
    '######x#####..',
    '.##########...',
    '..########....',
    '...######.....',
  ];
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      let color;
      const sy = y - 2;
      const sx = x - 2;
      if (sy < 0 || sy >= shape.length || sx < 0 || sx >= shape[0].length || shape[sy][sx] === '.') {
        color = [0, 0, 0, 0];
      } else if (shape[sy][sx] === 'x') {
        color = [...RF_GREEN, 255];
      } else {
        const cx = 8, cy = 8;
        const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
        if (dist < 3) color = [...RF_LIGHT, 255];
        else if (dist > 5) color = [...RF_DARK, 255];
        else color = [...RF_MID, 255];
      }
      const idx = (y * 16 + x) * 4;
      d[idx] = color[0]; d[idx + 1] = color[1]; d[idx + 2] = color[2]; d[idx + 3] = color[3];
    }
  }
  setPixel(d, 4, 3, [...RF_OUT, 255]);
  setPixel(d, 10, 3, [...RF_OUT, 255]);
  setPixel(d, 3, 6, [...RF_OUT, 255]);
  setPixel(d, 11, 6, [...RF_OUT, 255]);
}

// ---- Slime Ball ----

const SB_OUT = [40, 120, 40];
const SB_MID = [70, 180, 70];
const SB_HI = [130, 220, 130];

function drawSlimeBall(d) {
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const cx = x - 8, cy = y - 8;
      const dist = Math.sqrt(cx * cx + cy * cy);
      let color;
      if (dist > 6) {
        color = [0, 0, 0, 0];
      } else if (dist > 5) {
        color = [...SB_OUT, 200];
      } else if (cx < -2 && cy < -2) {
        color = [...SB_HI, 200];
      } else {
        color = [...SB_MID, 200];
      }
      const idx = (y * 16 + x) * 4;
      d[idx] = color[0]; d[idx + 1] = color[1]; d[idx + 2] = color[2]; d[idx + 3] = color[3];
    }
  }
}

// ---- Raw Meat ----

const RM_OUT = [120, 40, 50];     // dark red edge
const RM_BASE = [200, 60, 80];    // raw pink-red
const RM_HI = [240, 140, 150];    // highlight
const RM_FAT = [240, 200, 180];   // fat streaks

function drawRawMeat(d) {
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      let color;
      // Irregular meat shape — oval/amoeba
      const cx = x - 8, cy = y - 8;
      const dist2 = cx * cx + cy * cy;
      const inShape = dist2 < 36 && !(cx < -5 && cy > 2) && !(cx > 5 && cy < -3);
      if (!inShape) {
        color = [0, 0, 0, 0];
      } else if (dist2 > 30) {
        color = [...RM_OUT, 255];
      } else if (Math.abs(cx) <= 1 && Math.abs(cy - 1) <= 1) {
        color = [...RM_FAT, 255]; // fat line
      } else if (cx < -2 && cy < -2) {
        color = [...RM_HI, 255]; // highlight
      } else {
        color = [...RM_BASE, 255];
      }
      const idx = (y * 16 + x) * 4;
      d[idx] = color[0]; d[idx + 1] = color[1]; d[idx + 2] = color[2]; d[idx + 3] = color[3];
    }
  }
}

// ---- Cooked Meat ----

const CM_OUT = [70, 40, 25];      // dark brown edge
const CM_BASE = [140, 85, 50];    // cooked brown
const CM_HI = [190, 130, 80];     // lighter cooked spot
const CM_CHAR = [50, 30, 15];     // char marks

function drawCookedMeat(d) {
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      let color;
      const cx = x - 8, cy = y - 8;
      const dist2 = cx * cx + cy * cy;
      const inShape = dist2 < 36 && !(cx < -4 && cy > 3) && !(cx > 4 && cy < -3);
      if (!inShape) {
        color = [0, 0, 0, 0];
      } else if (dist2 > 30) {
        color = [...CM_OUT, 255];
      } else if ((x === 6 && y === 5) || (x === 9 && y === 7) || (x === 7 && y === 9)) {
        color = [...CM_CHAR, 255]; // char marks
      } else if (x > 4 && x < 10 && y > 3 && y < 7) {
        color = [...CM_HI, 255]; // lighter area
      } else {
        color = [...CM_BASE, 255];
      }
      const idx = (y * 16 + x) * 4;
      d[idx] = color[0]; d[idx + 1] = color[1]; d[idx + 2] = color[2]; d[idx + 3] = color[3];
    }
  }
}

// ---- Stick ----

const ST_OUT = [60, 35, 20];
const ST_BASE = [130, 85, 50];
const ST_HI = [170, 120, 70];

function drawStick(d) {
  for (let i = 0; i < 256; i++) {
    d[i * 4 + 3] = 0; // transparent fill
  }
  // Diagonal stick from bottom-left to top-right
  const points = [[3, 12], [4, 11], [5, 9], [6, 8], [7, 7], [8, 6], [9, 5], [10, 4], [11, 3], [12, 2]];
  for (const [px, py] of points) {
    setPixel(d, px, py, ST_BASE);
  }
  // Outline
  for (const [px, py] of points) {
    setPixel(d, px - 1, py, ST_OUT);
    setPixel(d, px + 1, py, ST_OUT);
  }
  // Highlight
  setPixel(d, 7, 7, ST_HI);
  setPixel(d, 8, 6, ST_HI);
}

// ---- Plank ----

const P_OUT = [110, 75, 40];
const P_BASE = [170, 135, 90];
const P_HI = [200, 170, 120];
const P_NAIL = [140, 140, 140];

function drawPlank(d) {
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      let color;
      const edge = x < 1 || x > 14 || y < 1 || y > 14;
      if (edge) {
        color = [...P_OUT, 255];
      } else if (y >= 4 && y <= 5) {
        color = [...P_HI, 255]; // wood grain stripe
      } else if (y >= 9 && y <= 10) {
        color = [...P_HI, 255]; // wood grain stripe
      } else if ((x === 4 || x === 11) && y >= 4 && y <= 7) {
        color = [...P_NAIL, 255]; // nail
      } else if ((x === 4 || x === 11) && y >= 9 && y <= 12) {
        color = [...P_NAIL, 255]; // nail
      } else {
        color = [...P_BASE, 255];
      }
      const idx = (y * 16 + x) * 4;
      d[idx] = color[0]; d[idx + 1] = color[1]; d[idx + 2] = color[2]; d[idx + 3] = color[3];
    }
  }
}

// ---- Stone Sword ----

const SWD_HILT = [120, 80, 40];
const SWD_BLADE = [160, 160, 170];
const SWD_EDGE = [200, 200, 210];
const SWD_DARK = [90, 90, 100];

function drawStoneSword(d) {
  for (let i = 0; i < 256; i++) d[i * 4 + 3] = 0;
  // Blade (vertical center, pointing up)
  for (let y = 0; y <= 9; y++) {
    const w = (y < 3) ? 1 : 2;
    for (let x = 7 - w; x <= 7 + w; x++) {
      const col = (y <= 1) ? SWD_EDGE : (y === 2 || y === 5 || y === 8) ? SWD_DARK : SWD_BLADE;
      setPixel(d, x, y + 1, col);
    }
  }
  // Tip
  setPixel(d, 7, 0, SWD_EDGE);
  // Guard (cross)
  for (let x = 4; x <= 10; x++) setPixel(d, x, 11, SWD_HILT);
  for (let x = 5; x <= 9; x++) setPixel(d, x, 12, SWD_HILT);
  // Handle
  setPixel(d, 7, 13, SWD_HILT);
  setPixel(d, 7, 14, SWD_HILT);
  setPixel(d, 7, 15, SWD_HILT);
}

// ---- Stone Axe ----

function drawStoneAxe(d) {
  for (let i = 0; i < 256; i++) d[i * 4 + 3] = 0;
  // Handle (diagonal)
  const handle = [[2, 12], [3, 10], [4, 8], [5, 6], [6, 4], [7, 2]];
  for (const [x, y] of handle) {
    setPixel(d, x, y, ST_WOOD);
    setPixel(d, x + 1, y, ST_WOOD);
  }
  setPixel(d, 2, 13, ST_WOOD);
  setPixel(d, 2, 14, ST_WOOD);
  setPixel(d, 8, 1, ST_WOOD);
  // Axe head (stone block)
  const headPixels = [[4, 7], [5, 7], [6, 7], [7, 7], [8, 7],
    [3, 6], [4, 6], [7, 6], [8, 6],
    [3, 5], [4, 5], [7, 5], [8, 5],
    [4, 4], [7, 4]];
  for (const [x, y] of headPixels) {
    setPixel(d, x, y, (x < 5 || x > 7) ? SWD_EDGE : SWD_BLADE);
  }
}

// ---- Stone Pickaxe ----

function drawStonePickaxe(d) {
  for (let i = 0; i < 256; i++) d[i * 4 + 3] = 0;
  // Handle (vertical-ish)
  for (let y = 5; y <= 14; y++) {
    setPixel(d, 7, y, ST_WOOD);
    setPixel(d, 8, y, ST_WOOD);
  }
  setPixel(d, 7, 15, ST_WOOD);
  setPixel(d, 8, 15, ST_WOOD);
  // Pick head (curved pointed ends)
  for (let x = 2; x <= 13; x++) {
    setPixel(d, x, 4, (x < 4 || x > 11) ? SWD_EDGE : SWD_BLADE);
  }
  setPixel(d, 3, 3, SWD_EDGE);
  setPixel(d, 12, 3, SWD_EDGE);
  setPixel(d, 2, 4, SWD_EDGE);
  setPixel(d, 13, 4, SWD_EDGE);
  setPixel(d, 3, 5, SWD_DARK);
  setPixel(d, 12, 5, SWD_DARK);
}

// ---- Fiber Armor ----

function drawFiberArmor(d) {
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      let color = [0, 0, 0, 0];
      // Vest / chest piece shape
      const inShape = (y >= 2 && y <= 12 && x >= 3 && x <= 12 &&
        !(y >= 3 && y <= 11 && x >= 5 && x <= 10)); // hollow center neck/chest
      if (inShape) {
        const edge = y <= 3 || y >= 11 || x <= 4 || x >= 11;
        color = edge ? [80, 130, 50, 255] : [120, 180, 80, 255];
      }
      // Neck opening at top
      if (y >= 2 && y <= 4 && x >= 6 && x <= 9) {
        // Actually keep filled — only hollow at chest
      }
      const idx = (y * 16 + x) * 4;
      d[idx] = color[0]; d[idx + 1] = color[1]; d[idx + 2] = color[2]; d[idx + 3] = color[3];
    }
  }
  // Add weave pattern
  setPixel(d, 5, 5, [160, 210, 100, 255]);
  setPixel(d, 8, 5, [160, 210, 100, 255]);
  setPixel(d, 5, 8, [160, 210, 100, 255]);
  setPixel(d, 8, 8, [160, 210, 100, 255]);
  setPixel(d, 10, 6, [160, 210, 100, 255]);
  setPixel(d, 10, 9, [160, 210, 100, 255]);
}

// ---- Wood Wall ----

const WW_BASE = [139, 90, 43];
const WW_DARK = [100, 60, 30];
const WW_LIGHT = [180, 130, 70];

function drawWoodWall(d) {
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      let color = [0, 0, 0, 0];
      if (x >= 1 && x <= 14 && y >= 1 && y <= 14) {
        // Planks with vertical grain
        const plank = Math.floor((x - 1) / 4);
        const px = (x - 1) % 4;
        if (px === 0 || px === 3) {
          color = WW_DARK;
        } else if (y === 3 || y === 7 || y === 11) {
          color = WW_LIGHT;
        } else {
          color = WW_BASE;
        }
        // Add outline at plank boundaries
        if (px === 0) color = [70, 45, 25, 255];
      }
      const idx = (y * 16 + x) * 4;
      d[idx] = color[0]; d[idx + 1] = color[1]; d[idx + 2] = color[2]; d[idx + 3] = color[3];
    }
  }
}

// ---- Bandage ----

function drawBandage(d) {
  for (let i = 0; i < 256; i++) d[i * 4 + 3] = 0;
  // White bandage roll
  for (let y = 3; y <= 12; y++) {
    for (let x = 2; x <= 13; x++) {
      const edge = y <= 4 || y >= 11 || x <= 3 || x >= 12;
      const col = edge ? [180, 180, 180, 255] : [245, 245, 235, 255];
      setPixel(d, x, y, col);
    }
  }
  // Red cross / bandage stripe
  for (let y = 6; y <= 9; y++) {
    for (let x = 7; x <= 8; x++) {
      setPixel(d, x, y, [200, 80, 80, 255]);
    }
  }
  for (let x = 5; x <= 10; x++) {
    setPixel(d, x, 7, [200, 80, 80, 255]);
    setPixel(d, x, 8, [200, 80, 80, 255]);
  }
}

// ---- Workbench ----

function drawWorkbench(d) {
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      let color = [0, 0, 0, 0];
      // Table top (wide horizontal)
      if (y >= 2 && y <= 4 && x >= 1 && x <= 14) {
        color = [160, 120, 60, 255];
        if (y === 2) color = [180, 140, 70, 255];
      }
      // Legs
      if ((x >= 2 && x <= 3 || x >= 12 && x <= 13) && y >= 5 && y <= 13) {
        color = [100, 70, 40, 255];
      }
      // Tool on top (small hammer shape)
      if (y === 1 && x >= 5 && x <= 11) color = [120, 80, 40, 255]; // handle
      if (y === 0 && x >= 7 && x <= 9) color = [160, 160, 170, 255]; // head
      const idx = (y * 16 + x) * 4;
      d[idx] = color[0]; d[idx + 1] = color[1]; d[idx + 2] = color[2]; d[idx + 3] = color[3];
    }
  }
}

// ---- Campfire ----

function drawCampfire(d) {
  for (let i = 0; i < 256; i++) d[i * 4 + 3] = 0;
  // Logs (crossed)
  for (let x = 3; x <= 12; x++) {
    setPixel(d, x, 11, ST_WOOD);
    setPixel(d, x, 12, ST_WOOD);
    setPixel(d, x, 13, ST_WOOD);
  }
  setPixel(d, 4, 10, ST_WOOD);
  setPixel(d, 11, 10, ST_WOOD);
  // Fire (bottom to top gradient)
  const fireColors = [
    [[6, 6], [7, 6], [8, 6], [9, 6]],              // yellow top
    [[5, 7], [6, 7], [7, 7], [8, 7], [9, 7], [10, 7]], // orange mid
    [[4, 8], [5, 8], [6, 8], [7, 8], [8, 8], [9, 8], [10, 8], [11, 8]], // orange low
    [[4, 9], [5, 9], [6, 9], [7, 9], [8, 9], [9, 9], [10, 9], [11, 9]], // red
    [[5, 10], [6, 10], [7, 10], [8, 10], [9, 10], [10, 10]], // dark red
  ];
  for (let yIdx = 0; yIdx < fireColors.length; yIdx++) {
    const colors = [null, [200, 80, 20, 255], [220, 130, 40, 255], [255, 200, 50, 255], null];
    // Actually assign by row
    let col;
    if (yIdx === 0) col = [255, 220, 80, 255];
    else if (yIdx === 1) col = [255, 180, 50, 255];
    else if (yIdx === 2) col = [240, 120, 30, 255];
    else if (yIdx === 3) col = [200, 70, 20, 255];
    else col = [160, 40, 10, 255];
    for (const [x, y] of fireColors[yIdx]) {
      setPixel(d, x, y, col);
    }
  }
  // Ember dots
  setPixel(d, 6, 5, [255, 200, 50, 255]);
  setPixel(d, 10, 4, [255, 180, 50, 255]);
}

/** Set a single pixel in the image data. */
function setPixel(d, x, y, color) {
  if (x < 0 || x >= 16 || y < 0 || y >= 16) return;
  const idx = (y * 16 + x) * 4;
  d[idx] = color[0];
  d[idx + 1] = color[1];
  d[idx + 2] = color[2];
  d[idx + 3] = color[3] ?? 255;
}

// ---- Plant map textures (16×16 pixel art, same as game textures) ----

const PT = 16;

/** Draw a 16×16 pixel-art texture from a character grid. */
function drawPlantPixelArt(ctx, grid, colors) {
  for (let y = 0; y < 16 && y < grid.length; y++) {
    for (let x = 0; x < 16 && x < grid[y].length; x++) {
      const ch = grid[y][x];
      if (ch === '.' || !colors[ch]) continue;
      ctx.fillStyle = colors[ch];
      ctx.fillRect(x, y, 1, 1);
    }
  }
}

/**
 * Generate a 16×16 pixel-art bush texture.
 * @returns {HTMLCanvasElement}
 */
export function getBushTexture() {
  const c = document.createElement('canvas');
  c.width = PT;
  c.height = PT;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const grid = [
    '................',
    '....#####.......',
    '...#######......',
    '..#########.#...',
    '..##########....',
    '.###########....',
    '.############...',
    '.#######o####...',
    '..######o###....',
    '..############..',
    '...##o#######...',
    '....#####.o##...',
    '....######.##...',
    '.....#######....',
    '......#####.....',
    '.......###......',
  ];

  drawPlantPixelArt(ctx, grid, {
    '#': '#3D7A33',
    '@': '#5A9E4E',
  });

  // Berries (overdraw)
  const berries = [[7, 7], [9, 9], [7, 11]];
  for (const [bx, by] of berries) {
    ctx.fillStyle = '#CC3333';
    ctx.fillRect(bx, by, 2, 2);
    ctx.fillStyle = '#FF8888';
    ctx.fillRect(bx, by, 1, 1);
  }

  return c;
}

/**
 * Generate a 16×16 pixel-art mushroom texture.
 * @returns {HTMLCanvasElement}
 */
export function getMushroomTexture() {
  const c = document.createElement('canvas');
  c.width = PT;
  c.height = PT;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const grid = [
    '................',
    '................',
    '....rrrr........',
    '...rrrrrr.......',
    '..rrwrrwrr......',
    '..rrrrrrrr......',
    '..rrrrrrrr......',
    '...ssssss.......',
    '...ssssss.......',
    '...ssssss.......',
    '....ssss........',
    '....ssss........',
    '.....ss.........',
    '.....ss.........',
    '................',
    '................',
  ];

  drawPlantPixelArt(ctx, grid, {
    'r': '#CC3333',
    'w': '#FFF8F0',
    's': '#E8DCC8',
  });

  // Cap outline
  ctx.fillStyle = '#992222';
  ctx.fillRect(4, 3, 1, 1);
  ctx.fillRect(4 + 5, 3, 1, 1);
  ctx.fillRect(3, 5, 1, 1);
  ctx.fillRect(3 + 8, 5, 1, 1);
  for (let x = 4; x <= 10; x++) {
    ctx.fillStyle = '#992222';
    ctx.fillRect(x, 6, 1, 1);
  }

  return c;
}

/**
 * Generate a 16×16 pixel-art flower texture.
 * @returns {HTMLCanvasElement}
 */
export function getFlowerTexture() {
  const c = document.createElement('canvas');
  c.width = PT;
  c.height = PT;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const P1 = '#DD66AA';
  const P2 = '#EE88BB';
  const Y = '#FFDD44';

  const grid = [
    '................',
    '..P.P.P.........',
    '.PPPPPPP........',
    '.PPPYPPP........',
    '.PPPPPPP........',
    '..P.P.P.........',
    '....GG...........',
    '....GG...........',
    '....GG...........',
    '....GG...........',
    '...BBG...........',
    '..BB..B..........',
    '................',
    '................',
    '................',
    '................',
  ];

  drawPlantPixelArt(ctx, grid, {
    'P': P1,
    'p': P2,
    'Y': Y,
    'G': '#5A9E4E',
    'B': '#3D7A33',
  });

  return c;
}

/**
 * Generate a 16×16 pixel-art tall grass texture (still used for flower/bush clusters).
 * @returns {HTMLCanvasElement}
 */
export function getTallGrassTexture() {
  const c = document.createElement('canvas');
  c.width = PT;
  c.height = PT;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const grid = [
    '................',
    '....g.g.g......',
    '...gg.gg.g....g.',
    '..gGgGgGgG....g.',
    '..gGgGgGgGg..g..',
    '.gGgGgGgGgG..g..',
    '.gGgGgGgGgG.g...',
    '.gGgGgGgGgG.g...',
    '..gGgGgGgGg.....',
    '..gggGgggGgg..g.',
    '...gg.gg.gg...g.',
    '....g...g.......',
    '................',
    '................',
    '................',
    '................',
  ];

  drawPlantPixelArt(ctx, grid, {
    'g': '#6BAA4E',
    'G': '#4B8A3E',
  });

  return c;
}

/**
 * Generate individual grass blade textures for multi-blade grass clusters.
 * Each blade is a thin, tall pixel-art strand with slight variation.
 * @param {number} index - Blade variant 0–3
 * @returns {HTMLCanvasElement}
 */
export function getGrassBladeTexture(index) {
  const c = document.createElement('canvas');
  c.width = PT;
  c.height = PT;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const BLADES = [
    // Blade 0: Tall, leans slightly left
    {
      grid: [
        '................',
        '................',
        '..g.............',
        '..gg............',
        '..gGg...........',
        '..gGg...........',
        '..gGg...........',
        '...gGg..........',
        '...gGg..........',
        '...gGg..........',
        '....gg..........',
        '....g...........',
        '................',
        '................',
        '................',
        '................',
      ],
      colors: { 'g': '#6BAA4E', 'G': '#4B8A3E' },
    },
    // Blade 1: Medium, straight
    {
      grid: [
        '................',
        '................',
        '.......g........',
        '......ggg.......',
        '......gGg.......',
        '......gGg.......',
        '......gGg.......',
        '......gGg.......',
        '......ggg.......',
        '.......g........',
        '................',
        '................',
        '................',
        '................',
        '................',
        '................',
      ],
      colors: { 'g': '#5A9E4E', 'G': '#3D7A33' },
    },
    // Blade 2: Tall, leans slightly right
    {
      grid: [
        '................',
        '................',
        '...........g....',
        '..........gg....',
        '..........gGg...',
        '..........gGg...',
        '..........gGg...',
        '..........gGg...',
        '..........gGg...',
        '..........gGg...',
        '...........gg...',
        '...........g....',
        '................',
        '................',
        '................',
        '................',
      ],
      colors: { 'g': '#7BBA5E', 'G': '#5A9E4E' },
    },
    // Blade 3: Short, slightly darker
    {
      grid: [
        '................',
        '................',
        '................',
        '.......g........',
        '......ggg.......',
        '......gGg.......',
        '......gGg.......',
        '......gGg.......',
        '......ggg.......',
        '.......g........',
        '................',
        '................',
        '................',
        '................',
        '................',
        '................',
      ],
      colors: { 'g': '#4B8A3E', 'G': '#2D6A2E' },
    },
  ];

  const blade = BLADES[index % BLADES.length];
  drawPlantPixelArt(ctx, blade.grid, blade.colors);
  return c;
}

/**
 * Generate a 16×16 pixel-art stump texture.
 * @returns {HTMLCanvasElement}
 */
export function getStumpTexture() {
  const c = document.createElement('canvas');
  c.width = PT;
  c.height = PT;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const grid = [
    '................',
    '....#####.......',
    '...######.......',
    '..##.x.##.......',
    '..##.x.##.......',
    '..########.......',
    '..########.......',
    '..########.......',
    '...######.........',
    '...######.........',
    '....####..........',
    '................',
    '................',
    '................',
    '................',
    '................',
  ];

  drawPlantPixelArt(ctx, grid, {
    '#': '#8B5E3C',
    'x': '#6B4226',
  });

  // Rings
  ctx.fillStyle = '#A0724B';
  ctx.fillRect(5, 3, 1, 1);
  ctx.fillRect(5 + 4, 3, 1, 1);
  ctx.fillRect(5, 5, 1, 1);
  ctx.fillRect(5 + 4, 5, 1, 1);

  return c;
}

/**
 * Generate a 16×16 pixel-art cactus texture.
 * @returns {HTMLCanvasElement}
 */
export function getCactusTexture() {
  const c = document.createElement('canvas');
  c.width = PT;
  c.height = PT;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const grid = [
    '................',
    '................',
    '....GG..........',
    '...GGG....GG....',
    '..GGGGG..GGG....',
    '..GGGGG.GGGG....',
    '..GGGGG.GGGG....',
    '..GGGGGGGGGG....',
    '...GGGGGGGG.....',
    '....GGGGGG......',
    '....GGGGGG......',
    '.....GGGG.......',
    '.....GGGG.......',
    '......GG........',
    '................',
    '................',
  ];

  drawPlantPixelArt(ctx, grid, {
    'G': '#2D7A2D',
  });

  // Highlights for depth
  ctx.fillStyle = '#4AAA4A';
  ctx.fillRect(4, 3, 1, 1);
  ctx.fillRect(4 + 2, 3, 1, 1);
  ctx.fillRect(3, 5, 1, 1);
  ctx.fillRect(4, 7, 1, 1);

  // Spines (small dots)
  ctx.fillStyle = '#C8D84A';
  const spines = [[6, 2], [9, 4], [10, 6], [9, 8], [5, 9]];
  for (const [sx, sy] of spines) {
    ctx.fillRect(sx, sy, 1, 1);
  }

  return c;
}

/**
 * Generate a 16×16 pixel-art dead tree texture.
 * @returns {HTMLCanvasElement}
 */
export function getDeadTreeTexture() {
  const c = document.createElement('canvas');
  c.width = PT;
  c.height = PT;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const grid = [
    '................',
    '.......D........',
    '......DDD.......',
    '.....D.DD.......',
    '....D..DD.D.....',
    '.......DDD......',
    '.......DD.......',
    '......DDD.......',
    '......DD........',
    '.....DDD........',
    '.....DD.........',
    '....DDD.........',
    '....DD..........',
    '...DDD..........',
    '....DD..........',
    '................',
  ];

  drawPlantPixelArt(ctx, grid, {
    'D': '#6B5A4E',
  });

  // Darker outline for depth
  ctx.fillStyle = '#4A3C32';
  ctx.fillRect(7, 2, 1, 1);
  ctx.fillRect(6, 3, 1, 1);
  ctx.fillRect(7, 4, 1, 1);
  ctx.fillRect(6, 6, 1, 1);
  ctx.fillRect(5, 8, 1, 1);

  // A few small dead branches
  ctx.fillStyle = '#5A4A3E';
  ctx.fillRect(4, 4, 1, 1);
  ctx.fillRect(9, 6, 1, 1);

  return c;
}

/**
 * Generate a 16×16 pixel-art small decorative bush texture.
 * @returns {HTMLCanvasElement}
 */
export function getSmallBushTexture() {
  const c = document.createElement('canvas');
  c.width = PT;
  c.height = PT;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const grid = [
    '................',
    '................',
    '....#####.......',
    '...#######......',
    '..#########.....',
    '..##########....',
    '..##########....',
    '..##########....',
    '...#########....',
    '....#######.....',
    '.....#####......',
    '......###.......',
    '................',
    '................',
    '................',
    '................',
  ];

  drawPlantPixelArt(ctx, grid, {
    '#': '#4A7A3E',
  });

  // Lighter top highlight
  ctx.fillStyle = '#6AAA5E';
  ctx.fillRect(4, 3, 1, 1);
  ctx.fillRect(4 + 5, 3, 1, 1);
  ctx.fillRect(4, 6, 1, 1);

  return c;
}

/**
 * Generate a 16×16 pixel-art workbench texture.
 * @returns {HTMLCanvasElement}
 */
export function getWorkbenchTexture() {
  const c = document.createElement('canvas');
  c.width = PT;
  c.height = PT;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const WB_WOOD = '#8B5E3C';
  const WB_LIGHT = '#C4A46C';
  const WB_DARK = '#6B4226';

  const grid = [
    '................',
    '................',
    '....####........',
    '...######.......',
    '..########......',
    '..##..w.##......',
    '..##..w.##......',
    '..########......',
    '...######.......',
    '....####........',
    '.....##.........',
    '.....#.#........',
    '.....#.#........',
    '................',
    '................',
    '................',
  ];

  drawPlantPixelArt(ctx, grid, {
    '#': WB_WOOD,
    'w': WB_LIGHT,
  });

  // Table top surface line
  ctx.fillStyle = WB_LIGHT;
  ctx.fillRect(3, 2, 1, 1);
  ctx.fillRect(3 + 7, 2, 1, 1);

  // Tool on top: small hammer
  ctx.fillStyle = WB_DARK;
  ctx.fillRect(6, 1, 3, 1);
  ctx.fillRect(6, 2, 1, 1);
  ctx.fillRect(8, 2, 1, 1);
  // Hammer head
  ctx.fillStyle = '#AAAAAA';
  ctx.fillRect(6, 0, 3, 1);

  return c;
}

/**
 * Generate a 16×16 pixel-art campfire texture.
 * @returns {HTMLCanvasElement}
 */
export function getCampfireTexture() {
  const c = document.createElement('canvas');
  c.width = PT;
  c.height = PT;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const LOG = '#8B5E3C';
  const LOG_DARK = '#6B4226';
  const FLAME_Y = '#FFDD44';
  const FLAME_O = '#FF8833';
  const FLAME_R = '#CC4422';
  const FLAME_DR = '#882211';
  const EMBER = '#FF6633';

  const grid = [
    '................',
    '................',
    '....o...o.......',
    '....YYYYY.......',
    '...YYYYYYY......',
    '...YOOOYYY......',
    '..YOOOOOYYY.....',
    '..YOOOOOYYY.....',
    '..YOOOOOOY......',
    '...rrrrrrr......',
    '...rrrrrrr......',
    '...####.##......',
    '..#####.###.....',
    '..#####.###.....',
    '...####.##......',
    '................',
  ];

  drawPlantPixelArt(ctx, grid, {
    '#': LOG,
    'r': FLAME_R,
    'o': FLAME_O,
    'Y': FLAME_Y,
  });

  // Logs (crossed) — overdraw for detail
  ctx.fillStyle = LOG;
  ctx.fillRect(3, 11, 9, 1);
  ctx.fillRect(4, 12, 8, 1);
  ctx.fillRect(3, 10, 2, 1);
  ctx.fillRect(11, 10, 2, 1);
  // Dark log outlines
  ctx.fillStyle = LOG_DARK;
  ctx.fillRect(3, 13, 9, 1);
  ctx.fillRect(4, 12, 1, 1);
  ctx.fillRect(10, 12, 1, 1);
  // Fire glow embers
  ctx.fillStyle = EMBER;
  ctx.fillRect(7, 6, 1, 1);
  ctx.fillRect(11, 5, 1, 1);
  // Dark red base
  ctx.fillStyle = FLAME_DR;
  ctx.fillRect(5, 10, 5, 1);
  ctx.fillRect(4, 9, 6, 1);

  return c;
}

/**
 * Generate a 16×16 pixel-art campfire texture (alt frame with different flame).
 * @returns {HTMLCanvasElement}
 */
export function getCampfireAltTexture() {
  const c = document.createElement('canvas');
  c.width = PT;
  c.height = PT;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const LOG = '#8B5E3C';
  const LOG_DARK = '#6B4226';
  const FLAME_Y = '#FFDD44';
  const FLAME_O = '#FF8833';
  const FLAME_R = '#CC4422';
  const FLAME_DR = '#882211';
  const EMBER = '#FF6633';

  const grid = [
    '................',
    '................',
    '.......o........',
    '......YYY.......',
    '.....YYYYY......',
    '....YOOOOYY.....',
    '...YOOOOOYY.....',
    '...YOOOOOYY.....',
    '....YOOOOY......',
    '.....rrrr.......',
    '.....rrrr.......',
    '...####.##......',
    '..#####.###.....',
    '..#####.###.....',
    '...####.##......',
    '................',
  ];

  drawPlantPixelArt(ctx, grid, {
    '#': LOG,
    'r': FLAME_R,
    'o': FLAME_O,
    'Y': FLAME_Y,
  });

  // Logs — same base
  ctx.fillStyle = LOG;
  ctx.fillRect(3, 11, 9, 1);
  ctx.fillRect(4, 12, 8, 1);
  ctx.fillRect(3, 10, 2, 1);
  ctx.fillRect(11, 10, 2, 1);
  ctx.fillStyle = LOG_DARK;
  ctx.fillRect(3, 13, 9, 1);
  ctx.fillRect(4, 12, 1, 1);
  ctx.fillRect(10, 12, 1, 1);
  // Different ember positions for flicker
  ctx.fillStyle = EMBER;
  ctx.fillRect(9, 6, 1, 1);
  ctx.fillRect(5, 5, 1, 1);
  // Dark red base
  ctx.fillStyle = FLAME_DR;
  ctx.fillRect(4, 9, 7, 1);
  ctx.fillRect(5, 10, 4, 1);

  return c;
}

/**
 * Generate a 16×16 pixel-art wooden wall texture.
 * @returns {HTMLCanvasElement}
 */
export function getWallTexture() {
  const c = document.createElement('canvas');
  c.width = PT;
  c.height = PT;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const W_BASE = '#8B5E3C';
  const W_DARK = '#6B4226';
  const W_LIGHT = '#C4A46C';
  const W_OUT = '#50301A';

  const grid = [
    '................',
    '........########',
    '........########',
    '........########',
    '........########',
    '........########',
    '........########',
    '........########',
    '........########',
    '........########',
    '........########',
    '........########',
    '........########',
    '........########',
    '........########',
    '................',
  ];

  drawPlantPixelArt(ctx, grid, {
    '#': W_BASE,
  });

  // Vertical plank lines
  ctx.fillStyle = W_DARK;
  ctx.fillRect(1, 1, 1, 14);
  ctx.fillRect(5, 1, 1, 14);
  ctx.fillRect(9, 1, 1, 14);
  ctx.fillRect(13, 1, 1, 14);

  // Horizontal cross-brace
  ctx.fillStyle = W_LIGHT;
  ctx.fillRect(1, 4, 14, 1);
  ctx.fillRect(1, 10, 14, 1);

  // Diagonal cross-brace
  ctx.fillStyle = W_DARK;
  for (let i = 0; i < 6; i++) {
    ctx.fillRect(3 + i, 5 + i, 1, 1);
    ctx.fillRect(10 - i, 5 + i, 1, 1);
  }

  // Outline
  ctx.fillStyle = W_OUT;
  ctx.fillRect(0, 0, 1, 15);
  ctx.fillRect(0, 0, 15, 1);
  ctx.fillRect(15, 0, 1, 15);
  ctx.fillRect(0, 15, 16, 1);

  return c;
}
