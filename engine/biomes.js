/**
 * Biome system for map generation.
 * Uses value noise to create temperature, moisture, and elevation maps,
 * then maps those to biomes.
 */

// ---- Noise helpers ----

function hash(x, y) {
  let h = x * 374761393 + y * 668265263;
  h = (h ^ (h >> 13)) * 1274126177;
  return (h ^ (h >> 16)) & 0x7fffffff;
}

function smoothNoise(x, y, scale) {
  const sx = x / scale;
  const sy = y / scale;
  const ix = Math.floor(sx);
  const iy = Math.floor(sy);
  const fx = sx - ix;
  const fy = sy - iy;

  const v00 = hash(ix, iy) / 0x7fffffff;
  const v10 = hash(ix + 1, iy) / 0x7fffffff;
  const v01 = hash(ix, iy + 1) / 0x7fffffff;
  const v11 = hash(ix + 1, iy + 1) / 0x7fffffff;

  // Smooth Hermite interpolation
  const sx2 = fx * fx * (3 - 2 * fx);
  const sy2 = fy * fy * (3 - 2 * fy);

  const a = v00 + (v10 - v00) * sx2;
  const b = v01 + (v11 - v01) * sx2;
  return a + (b - a) * sy2;
}

function fbm(x, y, octaves, scale) {
  let value = 0;
  let amplitude = 1;
  let maxValue = 0;
  for (let i = 0; i < octaves; i++) {
    value += smoothNoise(x, y, scale) * amplitude;
    maxValue += amplitude;
    amplitude *= 0.5;
    scale *= 0.5;
  }
  return value / maxValue;
}

// ---- Biome names ----

export const BIOMES = {
  FOREST: 'forest',
  DESERT: 'desert',
  WATER: 'water',
  PLAINS: 'plains',
  SNOW: 'snow',
};

/**
 * Generate biome values at tile coordinates using multi-octave noise.
 * For efficiency, results are cached so each tile is computed at most once.
 */
export class BiomeGenerator {
  /** @type {Map<string, string>} */
  #cache = new Map();

  /** Elevation threshold below which tiles become water. */
  #waterLevel;

  /** Seed offsets to vary noise per world. */
  #seedX;
  #seedY;

  constructor(options = {}) {
    this.#waterLevel = options.waterLevel ?? 0.35;
    this.#seedX = options.seedX ?? 12345;
    this.#seedY = options.seedY ?? 67890;
  }

  /**
   * Get the biome at a given tile coordinate.
   * @param {number} tx - Tile X
   * @param {number} ty - Tile Y
   * @returns {string} Biome name from BIOMES
   */
  getBiomeAt(tx, ty) {
    const key = `${tx},${ty}`;
    let biome = this.#cache.get(key);
    if (biome) return biome;

    biome = this.#computeBiome(tx, ty);
    this.#cache.set(key, biome);
    return biome;
  }

  /** Clear the cache (e.g., on regeneration). */
  clearCache() {
    this.#cache.clear();
  }

  #computeBiome(tx, ty) {
    // Elevation: 1-octave noise
    const elevation = fbm(tx + this.#seedX, ty + this.#seedY, 1, 40);

    if (elevation < this.#waterLevel) {
      return BIOMES.WATER;
    }

    // Temperature: 2-octave noise (higher octaves = more detail)
    const temperature = fbm(tx + this.#seedX + 1000, ty + this.#seedY + 1000, 2, 30);

    // Moisture: 1-octave noise
    const moisture = fbm(tx + this.#seedX + 2000, ty + this.#seedY + 2000, 1, 30);

    // Map to biomes:
    //   Hot + Dry  → Desert
    //   Hot + Wet  → Forest
    //   Cold + Dry → Snow
    //   Cold + Wet → Plains
    if (temperature > 0.5) {
      return moisture > 0.5 ? BIOMES.FOREST : BIOMES.DESERT;
    } else {
      return moisture > 0.5 ? BIOMES.PLAINS : BIOMES.SNOW;
    }
  }
}
