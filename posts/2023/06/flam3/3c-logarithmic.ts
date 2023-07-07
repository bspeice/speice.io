import { histIndex, imageIndex } from "./0-utility";
import { flameFinal } from "./2c-final";
import { Accumulator, render } from "./3a-binary";

export class AccumulateLogarithmic extends Accumulator {
  render(image: ImageData): void {
    // Re-scale vibrancy to be log scale...
    for (var i = 0; i < this.histogram.length; i++) {
      this.histogram[i] = Math.log(this.histogram[i]);
    }

    // ...but otherwise render the same way as linear
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
        image.data[iIdx + 3] = 0xff - value;
      }
    }
  }
}

export function renderLogarithmic(image: ImageData) {
  const accumulator = new AccumulateLogarithmic(image.width, image.height);
  render(flameFinal, 10, accumulator, image);
}
