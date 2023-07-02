import { randomBiUnit, randomInteger, renderFn, imageIndex } from "./0-utility";

function plot(x: number, y: number, image: ImageData) {
  // A trivial `plot` implementation would take the range [-1, 1],
  // shift it to [0, 2], then scale by the width or height
  // as appropriate:
  //  pixelX = Math.floor((x + 1) * image.width / 2)
  //  pixelY = Math.floor((y + 1) * image.height / 2)
  //
  // However, that produces a mirror image (across both X and Y)
  // from the paper. We'll negate X and Y to compensate.
  // Second, because the gasket solution only contains points in
  // the range [0, 1), the naive plot above would waste 75% of
  // the pixels available. We'll keep the shift by 1 (to compensate
  // for mirroring X and Y), but scale by the full image width or
  // height so we'll plot the specific quadrant we care about.
  var pixelX = Math.floor((-x + 1) * image.width);
  var pixelY = Math.floor((-y + 1) * image.height);

  // Set the pixel black:
  const index = imageIndex(pixelX, pixelY, image.width);
  image.data[index + 0] = 0;
  image.data[index + 1] = 0;
  image.data[index + 2] = 0;
  image.data[index + 3] = 0xff;
}

type Xform = (x: number, y: number) => [number, number];

export const gasket: renderFn = (image) => {
  const F: Xform[] = [
    (x, y) => {
      return [x / 2, y / 2];
    },
    (x, y) => {
      return [(x + 1) / 2, y / 2];
    },
    (x, y) => {
      return [x / 2, (y + 1) / 2];
    },
  ];

  let x = randomBiUnit();
  let y = randomBiUnit();

  // Plot with quality 1
  const iterations = image.height * image.width;

  for (var i = 0; i < iterations; i++) {
    const Fi = randomInteger(0, F.length);
    [x, y] = F[Fi](x, y);

    if (i >= 20) {
      plot(x, y, image);
    }
  }
};
