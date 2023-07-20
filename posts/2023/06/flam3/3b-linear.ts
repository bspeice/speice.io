import { histIndex, imageIndex } from "./0-utility";
import { transformAllPost } from "./2b-post";
import { transformFinal } from "./2c-final";
import { RendererHistogram } from "./3a-binary";

class RendererLinear extends RendererHistogram {
  render(image: ImageData): void {
    const maxHistogram = Math.max(...this.histogram);

    for (var x = 0; x < this.size; x++) {
      for (var y = 0; y < this.size; y++) {
        const hIndex = histIndex(x, y, this.size);
        const iIndex = imageIndex(x, y, this.size);
        image.data[iIndex + 0] = 0;
        image.data[iIndex + 1] = 0;
        image.data[iIndex + 2] = 0;
        image.data[iIndex + 3] = (this.histogram[hIndex] / maxHistogram) * 0xff;
      }
    }
  }
}

export function buildLinear(size: number) {
  return new RendererLinear(size, transformAllPost, transformFinal);
}
