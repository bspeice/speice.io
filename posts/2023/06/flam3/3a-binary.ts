import { histIndex, imageIndex } from "./0-utility";
import { camera } from "./2a-variations";
import { flameFinal, FlameFinal } from "./2c-final";

export abstract class Accumulator {
  histogram: number[] = [];

  constructor(
    protected readonly width: number,
    protected readonly height: number
  ) {
    for (var i = 0; i < width * height; i++) {
      this.histogram.push(0);
    }
  }

  accumulate(x: number, y: number) {
    const [pixelX, pixelY] = camera(x, y, this.width);

    if (
      pixelX < 0 ||
      pixelX >= this.width ||
      pixelY < 0 ||
      pixelY >= this.height
    ) {
      return;
    }

    const index = histIndex(pixelX, pixelY, this.width);
    this.histogram[index] += 1;
  }

  abstract render(image: ImageData): void;
}

class AccumulateBinary extends Accumulator {
  render(image: ImageData) {
    for (var x = 0; x < image.width; x++) {
      for (var y = 0; y < image.height; y++) {
        const index = histIndex(x, y, image.width);

        // Color black if this pixel is part of the solution set, white otherwise
        const value = this.histogram[index] > 0 ? 0 : 0xff;

        const iIdx = imageIndex(x, y, image.width);
        image.data[iIdx + 0] = value;
        image.data[iIdx + 1] = value;
        image.data[iIdx + 2] = value;
        image.data[iIdx + 3] = 0xff;
      }
    }
  }
}

export function render(
  flame: FlameFinal,
  quality: number,
  accumulator: Accumulator,
  image: ImageData
) {
  const iterations = quality * image.width * image.height;

  for (var i = 0; i < iterations; i++) {
    flame.step();

    if (i > 20) {
      const [flameX, flameY] = flame.current();
      accumulator.accumulate(flameX, flameY);
    }
  }

  accumulator.render(image);
}

export function renderBinary(image: ImageData) {
  const accumulator = new AccumulateBinary(image.width, image.height);
  render(flameFinal, 10, accumulator, image);
}
