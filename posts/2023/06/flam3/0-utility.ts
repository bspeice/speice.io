export type renderFn = (image: ImageData) => void;

export function randomBiUnit() {
  // Math.random() produces a number in the range [0, 1),
  // scale to (-1, 1)
  return Math.random() * 2 - 1;
}

export function randomInteger(min: number, max: number) {
  return Math.floor(Math.random() * (max - min)) + min;
}

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

export function imageIndex(x: number, y: number, width: number) {
  // Taken from: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Pixel_manipulation_with_canvas
  return y * (width * 4) + x * 4;
}

export function histIndex(x: number, y: number, width: number) {
  return y * width + x;
}
