/**
 * Image render manager
 *
 * This class tracks the chaos game state so we can periodically
 * get an image.
 */
export abstract class Renderer {
  /**
   * Build a render manager. For simplicity, this class assumes
   * we're working with a square image.
   *
   * @param size Image width and height
   */
  constructor(public readonly size: number) {}

  /**
   * Run the chaos game
   *
   * @param quality iteration count
   */
  abstract run(quality: number): void;

  /**
   * Output the current chaos game state to image
   *
   * @param image output pixel buffer
   */
  abstract render(image: ImageData): void;
}

export type renderFn = (image: ImageData) => void;

/**
 * @returns random number in the bi-unit square (-1, 1)
 */
export function randomBiUnit() {
  // Math.random() produces a number in the range [0, 1),
  // scale to (-1, 1)
  return Math.random() * 2 - 1;
}

/**
 * @returns random integer (with equal weight) in the range [min, max)
 */
export function randomInteger(min: number, max: number) {
  return Math.floor(Math.random() * (max - min)) + min;
}

/**
 * @param choices array of [weight, value] pairs
 * @returns pair of [index, value]
 */
export function weightedChoice<T>(choices: [number, T][]): [number, T] {
  const weightSum = choices.reduce(
    (current, [weight, _t]) => current + weight,
    0
  );
  var choice = Math.random() * weightSum;

  for (var i = 0; i < choices.length; i++) {
    const [weight, t] = choices[i];
    if (choice < weight) {
      return [i, t];
    }

    choice -= weight;
  }

  throw "unreachable";
}

/**
 * @param x pixel coordinate
 * @param y pixel coordinate
 * @param width image width
 * @returns index into ImageData buffer for a specific pixel
 */
export function imageIndex(x: number, y: number, width: number) {
  // Taken from: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Pixel_manipulation_with_canvas
  return y * (width * 4) + x * 4;
}

/**
 * @param x pixel coordinate
 * @param y pixel coordinate
 * @param width image width
 * @returns index into a histogram for a specific pixel
 */
export function histIndex(x: number, y: number, width: number) {
  return y * width + x;
}
