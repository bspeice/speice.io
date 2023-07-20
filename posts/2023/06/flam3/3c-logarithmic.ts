import { histIndex, imageIndex } from "./0-utility";
import { transformAllPost } from "./2b-post";
import { transformFinal } from "./2c-final";
import { RendererHistogram } from "./3a-binary";

export class RendererLogarithmic extends RendererHistogram {
  render(image: ImageData): void {
    // Because log(0) is -Infinity, all the math actually works out.
    const histogramLog = this.histogram.map(Math.log);
    const histogramLogMax = Math.max(...histogramLog);

    for (var x = 0; x < this.size; x++) {
      for (var y = 0; y < this.size; y++) {
        const hIndex = histIndex(x, y, this.size);
        const iIndex = imageIndex(x, y, this.size);
        image.data[iIndex + 0] = 0;
        image.data[iIndex + 1] = 0;
        image.data[iIndex + 2] = 0;
        image.data[iIndex + 3] =
          (histogramLog[hIndex] / histogramLogMax) * 0xff;
      }
    }
  }
}

export function buildLogarithmic(size: number) {
  return new RendererLogarithmic(size, transformAllPost, transformFinal);
}
