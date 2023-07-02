import { histIndex, imageIndex } from "./0-utility";
import { flameFinal } from "./2c-final";
import { Accumulator, render } from "./3a-binary";

export class AccumulateLinear extends Accumulator {
  render(image: ImageData): void {
    const maxValue = Math.max(...this.histogram);

    for (var x = 0; x < image.width; x++) {
      for (var y = 0; y < image.height; y++) {
        const index = histIndex(x, y, image.width);

        // Color full black if this pixel is maxValue, white if not part
        // of the solution set
        const value = (1 - this.histogram[index] / maxValue) * 0xff;

        const iIdx = imageIndex(x, y, image.width);
        image.data[iIdx + 0] = value;
        image.data[iIdx + 1] = value;
        image.data[iIdx + 2] = value;
        image.data[iIdx + 3] = 0xff;
      }
    }
  }
}

export function renderLinear(image: ImageData) {
  const accumulator = new AccumulateLinear(image.width, image.height);
  render(flameFinal, 10, accumulator, image);
}
