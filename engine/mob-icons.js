/**
 * Generate pixel-art canvas textures for hostile mobs.
 * Each texture is a 24×24 off-screen canvas.
 * @type {Record<string, HTMLCanvasElement>}
 */
const cache = {};

/**
 * @param {'zombie'|'wolf'|'slime'} type
 * @returns {HTMLCanvasElement}
 */
export function getMobTexture(type) {
  if (cache[type]) return cache[type];
  let c;
  switch (type) {
    case 'zombie': c = createZombieTexture(); break;
    case 'wolf':   c = createWolfTexture(); break;
    case 'slime':  c = createSlimeTexture(); break;
  }
  cache[type] = c;
  return c;
}

export function getZombieTexture() { return getMobTexture('zombie'); }
export function getWolfTexture()   { return getMobTexture('wolf'); }
export function getSlimeTexture()  { return getMobTexture('slime'); }

/** Render a pixel grid onto a 24×24 canvas. */
function renderGrid(grid, colorMap) {
  const c = document.createElement('canvas');
  c.width = 24;
  c.height = 24;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  for (let y = 0; y < 24 && y < grid.length; y++) {
    for (let x = 0; x < 24 && x < grid[y].length; x++) {
      const ch = grid[y][x];
      if (ch === '.' || !colorMap[ch]) continue;
      ctx.fillStyle = colorMap[ch];
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return c;
}

// ─── Zombie (green humanoid) ──────────────────────────────────────────

const Z = {
  '.': null,
  O: '#2A5A2A',  // outline
  G: '#3A7A3A',  // dark green skin
  L: '#5A9A5A',  // mid green skin
  H: '#7ABA7A',  // light green skin (highlight)
  E: '#AA3333',  // red eyes
  M: '#4A2A2A',  // mouth
  B: '#4A3A2A',  // brown pants
  D: '#3A2A1A',  // dark shoes
  R: '#5A4A3A',  // ripped cloth
};

const zombieGrid = [
  '....................',  // 0
  '...........OO........',  // 1
  '..........OGGO.......',  // 2
  '.........OGLLGO......',  // 3
  '........OG...GO......',  // 4
  '.......OLLL.LLLO.....',  // 5
  '......OLL.LL.LLO.....',  // 6
  '.....O.L.LLL.L.O.....',  // 7
  '....OL.E.LLL.E.LO....',  // 8
  '.....OL.M.L.M.LO.....',  // 9
  '.....OLLLM.MLLLO.....',  // 10
  '......OLLL.LLLO......',  // 11
  '.......OLG.GLO.......',  // 12
  '.......OBB.BBO.......',  // 13
  '......OBB...BBO......',  // 14
  '......OBBBBBBBO......',  // 15
  '......ODD...DDO......',  // 16
  '......ODD...DDO......',  // 17
  '.......OO....OO......',  // 18
  '....................',  // 19
  '....................',  // 20
  '....................',  // 21
  '....................',  // 22
  '....................',  // 23
];

function createZombieTexture() {
  return renderGrid(zombieGrid, Z);
}

// ─── Wolf (grey quadruped) ────────────────────────────────────────────

const W = {
  '.': null,
  O: '#3A3A3A',  // dark outline
  G: '#6A6A6A',  // grey fur
  L: '#8A8A8A',  // light grey fur
  D: '#4A4A4A',  // dark grey fur
  E: '#FFCC44',  // yellow eyes
  N: '#2A2A2A',  // nose
  T: '#5A5A5A',  // tail
  B: '#7A7A7A',  // belly
};

const wolfGrid = [
  '....................',
  '....................',
  '....................',
  '........OOG........',
  '.......OGLG........',
  '.......OL.GGO......',
  '......OE.LGLO......',
  '......ONOLGLO......',
  '.....OOO.LLLO......',
  '.....OL.BBLLOO.....',
  '....O.L.BB.LLLO....',
  '....OLL.BB.LLLO....',
  '....O.LLL.LLLO.....',
  '....OOLLL.LLOO.....',
  '....O..OL.LL.......',
  '...OO..OO.OO.......',
  '...O.....O..O......',
  '..OO....OO..OO.....',
  '....................',
  '....................',
  '....................',
  '....................',
  '....................',
  '....................',
];

function createWolfTexture() {
  return renderGrid(wolfGrid, W);
}

// ─── Slime (green blob) ───────────────────────────────────────────────

const S = {
  '.': null,
  O: '#2A6A2A',  // dark green outline
  G: '#4AAA4A',  // green
  L: '#7ADA7A',  // light green
  D: '#3A8A3A',  // darker green
  E: '#FFFFFF',  // eye white
  P: '#1A1A1A',  // pupil
  H: '#AAEEAA',  // highlight
};

const slimeGrid = [
  '....................',
  '....................',
  '....................',
  '.......OOOOO.......',
  '.....OOGGGGOO.....',
  '....OOGGGGGGGO....',
  '...OOGGGGGGGGGO...',
  '...OGGGGGGGGGGO...',
  '..OOGGGGGGGGGGGO..',
  '..OGGE.GGG.EGGGO..',
  '..OGGEP.GG.PEGGO..',
  '..OGGG.GGG.GGGGO..',
  '...OGGGGGGGGGGO...',
  '...OOGGGGGGGGO....',
  '....OOOGGGGOO.....',
  '......OOOOO.......',
  '....................',
  '....................',
  '....................',
  '....................',
  '....................',
  '....................',
  '....................',
  '....................',
];

function createSlimeTexture() {
  return renderGrid(slimeGrid, S);
}
