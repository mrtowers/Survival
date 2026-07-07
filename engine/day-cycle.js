/**
 * Day/Night cycle system.
 *
 * timeOfDay ranges 0→1 over the full day length:
 *   0.00 = dawn
 *   0.25 = noon
 *   0.50 = dusk
 *   0.75 = midnight
 */
export class DayCycle {
  /** @param {number} dayLengthSeconds - Real-time seconds for one full cycle */
  constructor(dayLengthSeconds = 600) {
    this.dayLengthSeconds = dayLengthSeconds;
    /** Elapsed in-game seconds (0 … dayLengthSeconds, wraps) */
    this.elapsed = 0;
  }

  /** Normalised time-of-day, 0 … 1 */
  get timeOfDay() {
    return this.elapsed / this.dayLengthSeconds;
  }

  /** True between dawn and dusk (roughly 6:00 – 18:00) */
  get isDay() {
    const t = this.timeOfDay;
    return t >= 0.25 && t < 0.75;
  }

  /** True between dusk and dawn */
  get isNight() {
    return !this.isDay;
  }

  /** Advance time by `delta` real-time seconds */
  update(delta) {
    this.elapsed += delta;
    if (this.elapsed >= this.dayLengthSeconds) {
      this.elapsed -= this.dayLengthSeconds;
    }
  }

  /**
   * Sky colour that transitions smoothly across the day.
   * @returns {string} CSS rgba colour string
   */
  getSkyColor() {
    const t = this.timeOfDay;

    // Dawn (≈6:00) — orange/pink
    const dawnR = 255, dawnG = 180, dawnB = 120;
    // Day (≈12:00) — bright blue
    const dayR = 135,  dayG = 206, dayB = 235;
    // Dusk (≈18:00) — orange
    const duskR = 255, duskG = 160, duskB = 80;
    // Night (≈0:00) — dark navy
    const nightR = 10,  nightG = 10,  nightB = 40;

    let r, g, b;

    if (t < 0.125) {
      // Night → dawn
      const p = t / 0.125;
      r = lerp(nightR, dawnR, p);
      g = lerp(nightG, dawnG, p);
      b = lerp(nightB, dawnB, p);
    } else if (t < 0.25) {
      // Dawn → day
      const p = (t - 0.125) / 0.125;
      r = lerp(dawnR, dayR, p);
      g = lerp(dawnG, dayG, p);
      b = lerp(dawnB, dayB, p);
    } else if (t < 0.625) {
      // Day → dusk
      const p = (t - 0.25) / 0.375;
      r = lerp(dayR, duskR, p);
      g = lerp(dayG, duskG, p);
      b = lerp(dayB, duskB, p);
    } else if (t < 0.75) {
      // Dusk → night
      const p = (t - 0.625) / 0.125;
      r = lerp(duskR, nightR, p);
      g = lerp(duskG, nightG, p);
      b = lerp(duskB, nightB, p);
    } else {
      // Night (stable)
      r = nightR; g = nightG; b = nightB;
    }

    return `rgb(${r},${g},${b})`;
  }

  /**
   * Ambient light level.  1 = full daylight, 0 = pitch night.
   * @returns {number}
   */
  getAmbientLight() {
    const t = this.timeOfDay;

    if (t < 0.125) {
      // Night → dawn
      return t / 0.125;
    }
    if (t < 0.25) {
      // Dawn → day
      return 1;
    }
    if (t < 0.625) {
      // Day → dusk
      return 1 - (t - 0.25) / 0.375;
    }
    if (t < 0.75) {
      // Dusk → night
      return 1 - (t - 0.625) / 0.125;
    }
    // Night
    return 0;
  }

  /**
   * A semi-transparent dark overlay colour used to darken the scene at night.
   * Fully transparent during the day, strongest at midnight.
   * @returns {string} CSS rgba string
   */
  getNightOverlayColor() {
    const light = this.getAmbientLight();
    // Dark blue/black overlay.  At full night (light=0) it's almost opaque (0.65).
    const alpha = Math.max(0, 0.65 * (1 - light));
    return `rgba(5, 5, 25, ${alpha.toFixed(3)})`;
  }

  /**
   * Return a formatted time string (24 h).
   * 24-hour day is mapped onto our 0…1 cycle.
   * @returns {string}
   */
  getTimeString() {
    const totalMinutes = this.timeOfDay * 24 * 60;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}
