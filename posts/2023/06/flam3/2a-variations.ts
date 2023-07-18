import {
  Renderer,
  histIndex,
  imageIndex,
  randomBiUnit,
  weightedChoice,
} from "./0-utility";

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

export const identityCoefs = {
  a: 1,
  b: 0,
  c: 0,
  d: 0,
  e: 1,
  f: 0,
};

function r(x: number, y: number) {
  return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
}

function theta(x: number, y: number) {
  return Math.atan2(x, y);
}

function omega(): number {
  return Math.random() > 0.5 ? Math.PI : 0;
}

export const linear: Variation = (x, y) => [x, y];

export const julia: Variation = (x, y) => {
  const sqrtR = Math.sqrt(r(x, y));
  const thetaVal = theta(x, y) / 2 + omega();
  return [sqrtR * Math.cos(thetaVal), sqrtR * Math.sin(thetaVal)];
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

  apply(x: number, y: number): [number, number] {
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

export class RendererFlame extends Renderer {
  private values = new Uint8Array(this.size * this.size);

  constructor(size: number, public readonly transforms: [number, Transform][]) {
    super(size);
  }

  plot(x: number, y: number) {
    // By default, Apophysis uses a camera that covers the range [-2, 2]
    // (specifically, the `scale` parameter becomes `pixels_per_unit` in flam3)
    // Shift the coordinate system to [0, 4], then scale to pixel coordinates
    const pixelX = Math.floor(((x + 2) * this.size) / 4);
    const pixelY = Math.floor(((y + 2) * this.size) / 4);

    if (
      pixelX < 0 ||
      pixelX >= this.size ||
      pixelY < 0 ||
      pixelY >= this.size
    ) {
      return;
    }

    const hIndex = histIndex(pixelX, pixelY, this.size);
    this.values[hIndex] = 1;
  }

  run(quality: number): void {
    var x = randomBiUnit();
    var y = randomBiUnit();

    const iterations = quality * this.size * this.size;
    for (var i = 0; i < iterations; i++) {
      const [_, transform] = weightedChoice(this.transforms);
      [x, y] = transform.apply(x, y);

      if (i > 20) {
        this.plot(x, y);
      }
    }
  }

  render(image: ImageData): void {
    for (var x = 0; x < this.size; x++) {
      for (var y = 0; y < this.size; y++) {
        const hIndex = histIndex(x, y, this.size);
        if (!this.values[hIndex]) {
          continue;
        }

        const iIndex = imageIndex(x, y, this.size);
        image.data[iIndex + 0] = 0;
        image.data[iIndex + 1] = 0;
        image.data[iIndex + 2] = 0;
        image.data[iIndex + 3] = 0xff;
      }
    }
  }
}

export class Flame {
  protected x: number = randomBiUnit();
  protected y: number = randomBiUnit();

  constructor(public readonly transforms: [number, Transform][]) {}

  step(): void {
    const [_index, transform] = weightedChoice(this.transforms);
    [this.x, this.y] = transform.apply(this.x, this.y);
  }

  current(): [number, number] {
    return [this.x, this.y];
  }
}

export function camera(x: number, y: number, size: number): [number, number] {
  // Assuming both:
  //  - The origin is the intended center of the output image
  //  - The output image is square
  // ...then map points in the range (-scale, scale) to pixel coordinates.
  //
  // The way `flam3` actually calculates the "camera" for taking a point
  // and determining which pixel to update is fairly involved. The example
  // fractal was designed in Apophysis (which shows points in the range
  // [-2, 2] by default) so we use that assumption to simplify the math here.
  return [Math.floor(((x + 2) * size) / 4), Math.floor(((y + 2) * size) / 4)];
}

export function plot(x: number, y: number, image: ImageData) {
  const [pixelX, pixelY] = camera(x, y, image.width);

  if (
    pixelX < 0 ||
    pixelX >= image.width ||
    pixelY < 0 ||
    pixelY >= image.height
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
      const [flameX, flameY] = flame.current();
      plot(flameX, flameY, image);
    }
  }
}

export const transform1Weight = 0.56453495;
export const transform1 = new Transform(
  {
    a: -1.381068,
    b: -1.381068,
    c: 0,
    d: 1.381068,
    e: -1.381068,
    f: 0,
  },
  [[1, julia]]
);

export const transform2Weight = 0.013135;
export const transform2 = new Transform(
  {
    a: 0.031393,
    b: 0.031367,
    c: 0,
    d: -0.031367,
    e: 0.031393,
    f: 0,
  },
  [
    [1, linear],
    [1, popcorn],
  ]
);

export const transform3Weight = 0.42233;
export const transform3 = new Transform(
  {
    a: 1.51523,
    b: -3.048677,
    c: 0.724135,
    d: 0.740356,
    e: -1.455964,
    f: -0.362059,
  },
  [[1, pdj(1.09358, 2.13048, 2.54127, 2.37267)]]
);

export function rendererBaseline(size: number) {
  return new RendererFlame(size, [
    [transform1Weight, transform1],
    [transform2Weight, transform2],
    [transform3Weight, transform3],
  ]);
}
