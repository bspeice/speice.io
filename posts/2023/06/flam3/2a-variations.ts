export type Variation = (
  x: number,
  y: number,
  transformCoefs: Coefs
) => [number, number];
export type Coefs = {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
};

function r(x: number, y: number) {
  return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
}

function theta(x: number, y: number) {
  return Math.atan2(y, x);
}

function omega(): number {
  return Math.random() > 0.5 ? Math.PI : 0;
}

export const linear: Variation = (x, y) => [x, y];

export const julia: Variation = (x, y) => {
  const sqrtR = Math.sqrt(r(x, y));
  return [
    sqrtR * Math.cos(theta(x, y) / 2 + omega()),
    sqrtR * Math.sin(theta(x, y) / 2 + omega()),
  ];
};

export const popcorn: Variation = (x, y, transformCoefs) => {
  return [
    x + transformCoefs.c * Math.sin(Math.tan(3 * y)),
    y + transformCoefs.f * Math.sin(Math.tan(3 * x)),
  ];
};

export const pdj: (
  pdjA: number,
  pdjB: number,
  pdjC: number,
  pdjD: number
) => Variation = (pdjA, pdjB, pdjC, pdjD) => {
  return (x, y) => [
    Math.sin(pdjA * y) - Math.cos(pdjB * x),
    Math.sin(pdjC * x) - Math.cos(pdjD * y),
  ];
};

export class Transform {
  constructor(
    public readonly coefs: Coefs,
    public readonly variations: [number, Variation][]
  ) {}

  apply(x: number, y: number) {
    const xformX = this.coefs.a * x + this.coefs.b * y + this.coefs.c;
    const xformY = this.coefs.d * x + this.coefs.e * y + this.coefs.f;

    var [curX, curY] = [0, 0];
    this.variations.forEach(([blend, variation]) => {
      const [varX, varY] = variation(xformX, xformY, this.coefs);
      curX += blend * varX;
      curY += blend * varY;
    });

    return [curX, curY];
  }
}

export function weightedChoice<T>(choices: [number, T][]) {
  const weightSum = choices.reduce(
    (current, [weight, _t]) => current + weight,
    0
  );
  var choice = Math.random() * weightSum;

  for (var i = 0; i < choices.length; i++) {
    const [weight, t] = choices[i];
    if (choice < weight) {
      return t;
    }

    choice -= weight;
  }

  throw "unreachable";
}

export class Flame {
  x: number = Math.random() * 2 - 1;
  y: number = Math.random() * 2 - 1;

  constructor(public readonly transforms: [number, Transform][]) {}

  step() {
    const transform = weightedChoice(this.transforms);
    [this.x, this.y] = transform.apply(this.x, this.y);
  }
}

export function plot(x: number, y: number, image: ImageData) {
  const pixelX = Math.floor(((x + 2) * image.width) / 4);
  const pixelY = Math.floor(((y + 2) * image.height) / 4);

  if (
    pixelX < 0 ||
    pixelX > image.width ||
    pixelY < 0 ||
    pixelY > image.height
  ) {
    return;
  }

  const index = pixelY * (image.width * 4) + pixelX * 4;

  image.data[index + 0] = 0;
  image.data[index + 1] = 0;
  image.data[index + 2] = 0;
  image.data[index + 3] = 0xff;
}

export function render(flame: Flame, quality: number, image: ImageData) {
  const iterations = quality * image.width * image.height;

  for (var i = 0; i < iterations; i++) {
    flame.step();
    if (i > 20) {
      plot(flame.x, flame.y, image);
    }
  }
}

export const transform1Coefs: Coefs = {
  a: -1.381068,
  b: -1.381068,
  c: 0,
  d: 1.381068,
  e: -1.381068,
  f: 0,
};
export const transform1Weight = 0.56453495;

export const transform2Coefs: Coefs = {
  a: 0.031393,
  b: 0.031367,
  c: 0,
  d: -0.031367,
  e: 0.031393,
  f: 0,
};
export const transform2Weight = 0.013135;

export const transform3Coefs: Coefs = {
  a: 1.51523,
  b: -3.048677,
  c: 0.724135,
  d: 0.740356,
  e: -1.455964,
  f: -0.362059,
};
export const transform3Pdj = [1.09358, 2.13048, 2.54127, 2.37267];
export const transform3Weight = 0.42233;

export function renderBaseline(image: ImageData) {
  const transform1 = new Transform(transform1Coefs, [[1, julia]]);

  const transform2 = new Transform(transform2Coefs, [
    [1, linear],
    [1, popcorn],
  ]);

  const [pdjA, pdjB, pdjC, pdjD] = transform3Pdj;
  const transform3 = new Transform(transform3Coefs, [
    [1, pdj(pdjA, pdjB, pdjC, pdjD)],
  ]);

  const flame = new Flame([
    [transform1Weight, transform1],
    [transform2Weight, transform2],
    [transform3Weight, transform3],
  ]);

  render(flame, 1, image);
}
