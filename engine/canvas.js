export const canvas = document.getElementById('canvas');
export const ctx = canvas.getContext('2d');

export function setupCanvas() {
  function resize() {
    canvas.width = document.documentElement.clientWidth;
    canvas.height = document.documentElement.clientHeight;
    ctx.imageSmoothingEnabled = false;
  }

  window.addEventListener('resize', resize);
  resize();
}

export function getResponsiveRenderDist() {
  return Math.max(canvas.width / 1.75, canvas.height / 1.75);
}
