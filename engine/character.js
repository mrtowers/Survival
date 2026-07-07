/**
 * Programmatic 16×16 pixel-art character sprites.
 * A cute top-down pixel character with hair, face, shirt, pants & shoes.
 * Frames: idle, walk1/2/3 (walk cycle), attack (with pickaxe).
 */

const COLORS = {
  h: '#5C3A1E',  // hair dark outline
  H: '#7A5030',  // hair mid
  I: '#8B6040',  // hair highlight
  s: '#D4A878',  // skin shadow
  S: '#F0CCA0',  // skin mid
  C: '#F8D8B8',  // skin highlight (cheeks)
  E: '#333',     // eyes
  M: '#D06060',  // mouth / blush
  b: '#3A6E9E',  // shirt shadow
  B: '#4A7FC7',  // shirt mid
  r: '#5A90D8',  // shirt highlight
  p: '#555',     // pants shadow
  P: '#6A6A6A',  // pants mid
  F: '#3A3A3A',  // shoes
  D: '#888',     // tool metal dark
  d: '#C8C8C8',  // tool metal light
  T: '#8B5E3C',  // tool handle dark
  t: '#A07050',  // tool handle light
};

/** @type {Record<string, string[]>} */
const FRAMES = {};

function defineFrame(name, grid) {
  FRAMES[name] = grid;
}

// ─── IDLE (standing still) ───────────────────────────────────────────
defineFrame('idle', [
  '................',
  '.....hhh........',
  '....hHHHIHh.....',
  '....hHHHIHh.....',
  '....HH.H.HH.....',
  '....HS.SSHh.....',
  '....S.ES.S......',
  '...CSs.sSC......',
  '...BBbbbBB......',
  '...BBbbbBB......',
  '...BBbbbBB......',
  '..PP.....PP.....',
  '..PP.....PP.....',
  '..FF.....FF.....',
  '..FF.....FF.....',
  '................',
]);

// ─── WALK 1 (right leg forward, left back) ──────────────────────────
defineFrame('walk1', [
  '................',
  '.....hhh........',
  '....hHHHIHh.....',
  '....hHHHIHh.....',
  '....HH.H.HH.....',
  '....HS.SSHh.....',
  '....S.ES.S......',
  '...CSs.sSC......',
  '...BBbbbBB......',
  '...BBbbbBB......',
  '...BBbbbBB......',
  '.PP......PP.....',
  '.PP......PP.....',
  '.FF......FF.....',
  '.FF......FF.....',
  '................',
]);

// ─── WALK 2 (legs together, mid-step) ───────────────────────────────
defineFrame('walk2', [
  '................',
  '.....hhh........',
  '....hHHHIHh.....',
  '....hHHHIHh.....',
  '....HH.H.HH.....',
  '....HS.SSHh.....',
  '....S.ES.S......',
  '...CSs.sSC......',
  '...BBbbbBB......',
  '...BBbbbBB......',
  '...BBbbbBB......',
  '..PP.....PP.....',
  '..PP.....PP.....',
  '..FF.....FF.....',
  '..FF.....FF.....',
  '................',
]);

// ─── WALK 3 (left leg forward, right back) ──────────────────────────
defineFrame('walk3', [
  '................',
  '.....hhh........',
  '....hHHHIHh.....',
  '....hHHHIHh.....',
  '....HH.H.HH.....',
  '....HS.SSHh.....',
  '....S.ES.S......',
  '...CSs.sSC......',
  '...BBbbbBB......',
  '...BBbbbBB......',
  '...BBbbbBB......',
  '......PP..PP....',
  '......PP..PP....',
  '......FF..FF....',
  '......FF..FF....',
  '................',
]);

// ─── ATTACK (arm extends with pickaxe to the right) ─────────────────
defineFrame('attack', [
  '................',
  '.....hhh........',
  '....hHHHIHh.....',
  '....hHHHIHh.....',
  '....HH.H.HH.....',
  '....HS.SSHh.....',
  '....S.ES.S......',
  '...CSs.sSC......',
  '...BBbbbBB..T...',
  '...BBbbbBB.D....',
  '...BBbbbBB..d...',
  '..PP.....PP.....',
  '..PP.....PP.....',
  '..FF.....FF.....',
  '..FF.....FF.....',
  '................',
]);

function renderGrid(grid) {
  const c = document.createElement('canvas');
  c.width = 16;
  c.height = 16;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  for (let y = 0; y < 16 && y < grid.length; y++) {
    for (let x = 0; x < 16 && x < grid[y].length; x++) {
      const ch = grid[y][x];
      if (ch === '.' || !COLORS[ch]) continue;
      ctx.fillStyle = COLORS[ch];
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return c;
}

/** @type {Record<string, HTMLCanvasElement>} */
const cache = {};

/**
 * Get a character frame canvas.
 * @param {'idle'|'walk1'|'walk2'|'walk3'|'attack'} name
 * @returns {HTMLCanvasElement}
 */
export function getCharacterFrame(name) {
  if (cache[name]) return cache[name];
  const grid = FRAMES[name];
  if (!grid) throw new Error(`Unknown character frame: ${name}`);
  cache[name] = renderGrid(grid);
  return cache[name];
}
