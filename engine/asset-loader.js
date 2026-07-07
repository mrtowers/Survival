export class AssetLoader {
  #images = [];

  /**
   * Load all images in parallel.
   * @param {string[]} manifest - Array of image paths (without extension)
   */
  async loadAll(manifest) {
    const promises = manifest.map((path, index) => this.#loadImage(path, index));
    await Promise.all(promises);
    console.log(`Loaded ${this.#images.length} assets`);
  }

  #loadImage(path, index) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.#images[index] = img;
        resolve(img);
      };
      img.onerror = () => {
        console.warn(`Failed to load: ${path}`);
        reject(new Error(`Failed to load image: ${path}`));
      };
      img.src = `./img/${path}.png`;
    });
  }

  getByIndex(index) {
    return this.#images[index];
  }

  /**
   * Register a programmatically-generated texture (canvas/image).
   * @param {number} index
   * @param {HTMLCanvasElement|HTMLImageElement} texture
   */
  registerTexture(index, texture) {
    this.#images[index] = texture;
  }
}
