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

/** Parse a hex color to [r, g, b]. */
function hexToRgba(hex) {
  const h = parseInt(hex.slice(1), 16);
  return [(h >> 16) & 255, (h >> 8) & 255, h & 255];
}
