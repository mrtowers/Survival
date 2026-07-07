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
 * Generate a 16×16 pixel-art tall grass texture.
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
