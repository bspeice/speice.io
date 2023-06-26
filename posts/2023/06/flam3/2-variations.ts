import { randomInteger } from "./0-utility";

type Variation = (x: number, y: number) => [number, number];

const r = (x: number, y: number) => {
  return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
};
const theta = (x: number, y: number) => {
  return Math.atan2(x, y);
};

const linear: Variation = (x, y) => {
  return [x, y];
};

const swirl: Variation = (x, y) => {
  const r2 = Math.pow(r(x, y), 2);
  const sinR2 = Math.sin(r2);
  const cosR2 = Math.cos(r2);

  return [x * sinR2 - y * cosR2, x * cosR2 + y * sinR2];
};

const polar: Variation = (x, y) => {
  return [theta(x, y) / Math.PI, r(x, y) - 1];
};

const disc: Variation = (x, y) => {
  const thetaOverPi = theta(x, y) / Math.PI;
  const piR = Math.PI * r(x, y);
  return [thetaOverPi * Math.sin(piR), thetaOverPi * Math.cos(piR)];
};

const variations = [linear, swirl, polar, disc];

class Coefs {
  constructor(
    public readonly a: number,
    public readonly b: number,
    public readonly c: number,
    public readonly d: number,
    public readonly e: number,
    public readonly f: number
  ) {}
}

class Transform {
  constructor(
    public readonly weight: number,
    public readonly coefs: Coefs,
    // Assumes that we have a blend for each variation
    public readonly blend: number[]
  ) {}

  apply(x: number, y: number) {
    const variationX = this.coefs.a * x + this.coefs.b * y + this.coefs.c;
    const variationY = this.coefs.d * x + this.coefs.e * y + this.coefs.f;

    var transformX = 0;
    var transformY = 0;
    this.blend.forEach((blend, i) => {
      const [perVarX, perVarY] = variations[i](variationX, variationY);
      transformX += blend * perVarX;
      transformY += blend * perVarY;
    });

    return [transformX, transformY];
  }
}

function plot(x: number, y: number, image: ImageData) {
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

function render(transforms: Transform[], image: ImageData) {
  const weightSum = transforms.reduce((val, xform) => val + xform.weight, 0);

  var x = Math.random() * 2 - 1;
  var y = Math.random() * 2 - 1;

  const iter = 100_000;
  for (var i = 0; i < iter; i++) {
    // Find the tranform we're operating on

    /*
        var f = Math.random() * weightSum;

        var transform = transforms[0];
        transforms.forEach((xform, j) => {
            if (f > 0 && f < xform.weight) {
                console.log(`xform=${j}`);
                transform = xform;
                f -= xform.weight;
            }
        });
        */
    // HACK: Currently assuming weights are equal
    const transform = transforms[randomInteger(0, transforms.length)];

    // Play the chaos game
    [x, y] = transform.apply(x, y);

    if (i > 20) {
      plot(x, y, image);
    }
  }
}

export function renderBaseline(image: ImageData) {
  return render(
    [
      new Transform(
        0.5,
        new Coefs(0.982996, 0, -0.219512, 0, 0.982996, -0.1875),
        [1, 0, 0, -0.934]
      ),
      new Transform(
        0.5,
        new Coefs(0.966511, -0.256624, 0.050305, 0.256624, 0.966511, -0.235518),
        [0, 0.156, 0.778, 0]
      ),
    ],
    image
  );
}
