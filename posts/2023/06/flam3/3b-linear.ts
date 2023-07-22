import { RenderParams, histIndex, imageIndex } from "./0-utility.js";
import { transformAllPost } from "./2b-post.js";
import { transformFinal } from "./2c-final.js";
import { RendererHistogram } from "./3a-binary.js";

class RendererLinear extends RendererHistogram {
  render(image: ImageData): void {
    const maxHistogram = this.histogram.reduce(
      (max, v) => Math.max(max, v),
      -Infinity
    );

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

export const paramsLinear: RenderParams = {
  quality: 10,
  renderer: (size) =>
    new RendererLinear(size, transformAllPost, transformFinal),
};
