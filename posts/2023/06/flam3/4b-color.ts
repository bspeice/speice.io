import { colorFromIndex, colorIndex, paletteNumber } from "./0-palette";
import {
  histIndex,
  imageIndex,
  randomBiUnit,
  weightedChoice,
} from "./0-utility";
import {
  Coefs,
  Variation,
  camera,
  transform1Weight,
  transform2Weight,
  transform3Weight,
} from "./2a-variations";
import {
  TransformPost,
  transform1Post,
  transform2Post,
  transform3Post,
} from "./2b-post";
import { FlameFinal, transformFinal } from "./2c-final";

export class AccumulatorColor {
  red: number[] = [];
  green: number[] = [];
  blue: number[] = [];
  alpha: number[] = [];

  constructor(public readonly width: number, public readonly height: number) {
    for (var i = 0; i < width * height; i++) {
      this.red.push(0);
      this.green.push(0);
      this.blue.push(0);
      this.alpha.push(0);
    }
  }

  accumulate(x: number, y: number, c: number) {
    const [pixelX, pixelY] = camera(x, y, this.width);

    if (
      pixelX < 0 ||
      pixelX >= this.width ||
      pixelY < 0 ||
      pixelY >= this.height
    ) {
      return;
    }

    const hIndex = histIndex(pixelX, pixelY, this.width);
    const [r, g, b] = colorFromIndex(c);

    this.red[hIndex] += r;
    this.green[hIndex] += g;
    this.blue[hIndex] += b;
    this.alpha[hIndex] += 1;
  }

  render(image: ImageData) {
    for (var x = 0; x < image.width; x++) {
      for (var y = 0; y < image.height; y++) {
        const hIndex = histIndex(x, y, image.width);

        const aNorm = this.alpha[hIndex] ? this.alpha[hIndex] : 1;
        const aScale = Math.log10(aNorm) / (aNorm * 1.5);

        const iIdx = imageIndex(x, y, this.width);
        image.data[iIdx + 0] = this.red[hIndex] * aScale * 0xff;
        image.data[iIdx + 1] = this.green[hIndex] * aScale * 0xff;
        image.data[iIdx + 2] = this.blue[hIndex] * aScale * 0xff;
        image.data[iIdx + 3] = this.alpha[hIndex] * aScale * 0xff;
      }
    }
  }
}

export class TransformColor extends TransformPost {
  constructor(
    coefs: Coefs,
    variations: [number, Variation][],
    post: Coefs,
    public readonly color: number
  ) {
    super(coefs, variations, post);
  }
}

export class FlameColor extends FlameFinal {
  protected color: number = Math.random();

  constructor(transforms: [number, TransformColor][], final: TransformColor) {
    super(transforms, final);
  }

  step() {
    const [_index, transform] = weightedChoice(this.transforms);
    [this.x, this.y] = transform.apply(this.x, this.y);
    const transformColor = (transform as TransformColor).color;
    this.color = (this.color + transformColor) / 2;
  }

  currentWithColor(): [number, number, number] {
    const [finalX, finalY] = this.final.apply(this.x, this.y);
    // TODO(bspeice): Why does everyone ignore final coloring?
    // In `flam3`, the `color_speed` is set to 0 for the final xform,
    // so it doesn't actually get used.
    return [finalX, finalY, this.color];
  }
}

function render(
  flame: FlameColor,
  quality: number,
  accumulator: AccumulatorColor,
  image: ImageData
) {
  const iterations = quality * image.width * image.height;

  for (var i = 0; i < iterations; i++) {
    flame.step();

    if (i > 20) {
      const [flameX, flameY, color] = flame.currentWithColor();
      accumulator.accumulate(flameX, flameY, color);
    }
  }

  accumulator.render(image);
}

export const transform1ColorValue = 0;
export const transform1Color = new TransformColor(
  transform1Post.coefs,
  transform1Post.variations,
  transform1Post.post,
  transform1ColorValue
);
export const transform2ColorValue = 0.844;
export const transform2Color = new TransformColor(
  transform2Post.coefs,
  transform2Post.variations,
  transform2Post.post,
  transform2ColorValue
);

export const transform3ColorValue = 0.349;
export const transform3Color = new TransformColor(
  transform3Post.coefs,
  transform3Post.variations,
  transform3Post.post,
  transform3ColorValue
);

export const transformFinalColorValue = 0;
export const transformFinalColor = new TransformColor(
  transformFinal.coefs,
  transformFinal.variations,
  transformFinal.post,
  transformFinalColorValue
);

export const flameColor = new FlameColor(
  [
    [transform1Weight, transform1Color],
    [transform2Weight, transform2Color],
    [transform3Weight, transform3Color],
  ],
  transformFinalColor
);

export function renderColor(image: ImageData) {
  const accumulator = new AccumulatorColor(image.width, image.height);
  render(flameColor, 40, accumulator, image);
}
